"""
Authentication & Identity Router.
Provides real-email OTP dispatch, OTP verification, login, and JWT dependency.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel

from app.services.email_service import send_otp_email
from app.services.user_service import (
    create_and_store_otp,
    verify_and_register_otp,
    authenticate_user,
    create_jwt_token,
    decode_jwt_token,
    get_user_quota_info,
    determine_user_role
)

logger = logging.getLogger("auth_router")

router = APIRouter(prefix="/api/auth", tags=["Authentication & Identity"])


# ─────────────────────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    email: str
    name: str
    password: str


class VerifyOtpRequest(BaseModel):
    email: str
    otp: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ─────────────────────────────────────────────────────────────
# FastAPI Dependency for Protecting Endpoints
# ─────────────────────────────────────────────────────────────

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency that extracts and validates the JWT Bearer token.
    Raises 401 Unauthorized if missing, malformed, or expired.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail={
                "error": "UNAUTHORIZED",
                "message": "Authentication required. Please sign in with your email or register to access the university voice assistant.",
                "subsystem": "Identity Gateway"
            }
        )
    
    token = authorization.split("Bearer ", 1)[1].strip()
    payload = decode_jwt_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail={
                "error": "INVALID_OR_EXPIRED_TOKEN",
                "message": "Session expired or invalid token. Please sign in again.",
                "subsystem": "Identity Gateway"
            }
        )
        
    quota_info = get_user_quota_info(payload["sub"])
    payload["quota"] = quota_info
    return payload


# ─────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────

@router.post("/send-otp")
async def send_otp_endpoint(req: SendOtpRequest):
    """
    Step 1 of Registration:
    Generates a 6-digit OTP and dispatches it to the user's real email inbox.
    """
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    role, meta = determine_user_role(req.email)
    is_student = meta.get("is_college_verified", False)

    otp, expires_in = create_and_store_otp(req.email, req.name, req.password)
    
    # Send email asynchronously
    success, msg = await send_otp_email(
        recipient_email=req.email,
        recipient_name=req.name,
        otp=otp,
        is_student=is_student
    )
    
    return {
        "status": "success",
        "message": f"Verification OTP sent to {req.email}. Please check your inbox.",
        "email": req.email,
        "role": role,
        "is_student": is_student,
        "expires_in_seconds": expires_in,
        "dispatch_status": msg
    }


@router.post("/verify-otp")
async def verify_otp_endpoint(req: VerifyOtpRequest):
    """
    Step 2 of Registration:
    Validates OTP, registers the account permanently, and returns a signed JWT token.
    """
    valid, message, user = verify_and_register_otp(req.email, req.otp)
    
    if not valid or not user:
        raise HTTPException(status_code=400, detail=message)
        
    token = create_jwt_token(user)
    quota_info = get_user_quota_info(user["email"])
    
    return {
        "status": "success",
        "message": "Identity verified successfully! Welcome to UniVoice.",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "is_college_verified": user.get("meta", {}).get("is_college_verified", False),
            "quota": quota_info
        }
    }


@router.post("/login")
async def login_endpoint(req: LoginRequest):
    """
    Fast Login with Email & Password (no need to wait for email OTP on every login).
    """
    valid, message, user = authenticate_user(req.email, req.password)
    
    if not valid or not user:
        raise HTTPException(status_code=401, detail=message)
        
    token = create_jwt_token(user)
    quota_info = get_user_quota_info(user["email"])
    
    return {
        "status": "success",
        "message": f"Welcome back, {user['name']}!",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "is_college_verified": user.get("meta", {}).get("is_college_verified", False),
            "quota": quota_info
        }
    }


@router.get("/me")
async def get_me_endpoint(user: dict = Depends(get_current_user)):
    """
    Returns the currently logged-in user profile, role, and live daily quota balance.
    """
    quota_info = get_user_quota_info(user["sub"])
    return {
        "status": "success",
        "user": {
            "email": user["sub"],
            "name": user["name"],
            "role": user["role"],
            "is_college_verified": user.get("is_college_verified", False),
            "quota": quota_info
        }
    }
