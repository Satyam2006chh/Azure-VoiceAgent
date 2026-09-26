"""
User Management, Security, Quota Manager & Audit Trail Engine.
Handles password hashing, JWT generation, OTP lifecycle, daily query quotas, and audit trails.
"""

import os
import json
import time
import random
import secrets
import hashlib
import hmac
import logging
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional, Tuple, List
from pathlib import Path

import jwt

from app.config import settings

logger = logging.getLogger("user_service")

# Data Storage Paths
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

USERS_FILE = DATA_DIR / "users.json"
AUDIT_LOGS_FILE = DATA_DIR / "audit_logs.json"

# In-Memory stores with periodic disk sync
_USERS_DB: Dict[str, Dict[str, Any]] = {}       # keyed by email
_ACTIVE_OTPS: Dict[str, Dict[str, Any]] = {}     # keyed by email -> {otp, expires_at, name, password_hash, role}
_AUDIT_LOGS: List[Dict[str, Any]] = []


def _load_data():
    """Loads users and audit logs from disk."""
    global _USERS_DB, _AUDIT_LOGS
    if USERS_FILE.exists():
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                _USERS_DB = json.load(f)
            logger.info(f"Loaded {len(_USERS_DB)} users from storage.")
        except Exception as e:
            logger.warning(f"Failed to load users.json: {e}")
            _USERS_DB = {}

    if AUDIT_LOGS_FILE.exists():
        try:
            with open(AUDIT_LOGS_FILE, "r", encoding="utf-8") as f:
                _AUDIT_LOGS = json.load(f)
            logger.info(f"Loaded {len(_AUDIT_LOGS)} audit log records.")
        except Exception as e:
            logger.warning(f"Failed to load audit_logs.json: {e}")
            _AUDIT_LOGS = []


def _save_users():
    """Saves users to disk."""
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(_USERS_DB, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to persist users to disk: {e}")


def _save_audit_logs():
    """Saves audit logs to disk (keeps latest 1000 records)."""
    try:
        trimmed = _AUDIT_LOGS[-1000:]
        with open(AUDIT_LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(trimmed, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to persist audit logs: {e}")


# Initialize data on module load
_load_data()


# ─────────────────────────────────────────────────────────────
# Password Security (PBKDF2-HMAC-SHA256)
# ─────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hashes a password with a secure random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    )
    return f"{salt}${key.hex()}"


def verify_password(stored_hash: str, candidate_password: str) -> bool:
    """Verifies a password against the stored salt$hash."""
    try:
        salt, key_hex = stored_hash.split("$", 1)
        expected_key = hashlib.pbkdf2_hmac(
            "sha256",
            candidate_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000
        )
        return hmac.compare_digest(expected_key.hex(), key_hex)
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────
# Role & Student Parsing
# ─────────────────────────────────────────────────────────────

def determine_user_role(email: str) -> Tuple[str, Dict[str, Any]]:
    """
    Checks if email belongs to Chitkara University or is an outside visitor.
    Extracts student metadata if available.
    """
    clean_email = email.strip().lower()
    is_student = clean_email.endswith(f"@{settings.COLLEGE_EMAIL_DOMAIN.lower()}")
    
    meta = {
        "is_college_verified": is_student,
        "college_domain": settings.COLLEGE_EMAIL_DOMAIN if is_student else None,
        "student_id": None,
        "branch": None,
        "batch": None
    }
    
    if is_student:
        # Example format: satyam3396.beai24@chitkara.edu.in
        prefix = clean_email.split("@")[0]
        parts = prefix.split(".")
        if len(parts) >= 2:
            meta["student_id"] = parts[0]
            meta["branch"] = parts[1].upper()
        else:
            meta["student_id"] = prefix
        return "student", meta
        
    return "visitor", meta


# ─────────────────────────────────────────────────────────────
# OTP Lifecycle Management
# ─────────────────────────────────────────────────────────────

def generate_otp() -> str:
    """Generates a secure 6-digit numeric OTP code."""
    return f"{random.randint(100000, 999999)}"


def create_and_store_otp(email: str, name: str, password: str) -> Tuple[str, int]:
    """
    Generates OTP, stores pending registration with 5 min (300s) expiry.
    Returns (otp_code, expires_in_seconds).
    """
    clean_email = email.strip().lower()
    otp = generate_otp()
    expires_at = time.time() + 300  # 5 minutes
    role, meta = determine_user_role(clean_email)
    pwd_hash = hash_password(password)

    _ACTIVE_OTPS[clean_email] = {
        "otp": otp,
        "expires_at": expires_at,
        "name": name.strip(),
        "password_hash": pwd_hash,
        "role": role,
        "meta": meta,
        "attempts": 0
    }
    return otp, 300


def verify_and_register_otp(email: str, candidate_otp: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Validates the submitted OTP. If valid, converts to registered user in DB.
    """
    clean_email = email.strip().lower()
    pending = _ACTIVE_OTPS.get(clean_email)
    
    if not pending:
        return False, "No OTP request found for this email. Please request a new OTP.", None
        
    if time.time() > pending["expires_at"]:
        _ACTIVE_OTPS.pop(clean_email, None)
        return False, "OTP has expired. Please request a new one.", None
        
    pending["attempts"] += 1
    if pending["attempts"] > 5:
        _ACTIVE_OTPS.pop(clean_email, None)
        return False, "Too many failed attempts. Please request a new OTP.", None

    if pending["otp"] != candidate_otp.strip():
        return False, "Invalid OTP code. Please enter the 6-digit code sent to your email.", None

    # OTP is valid — Register user permanently
    role = pending["role"]
    daily_quota = settings.STUDENT_DAILY_QUOTA if role == "student" else settings.VISITOR_DAILY_QUOTA
    
    user_record = {
        "id": f"usr_{secrets.token_hex(6)}",
        "email": clean_email,
        "name": pending["name"],
        "password_hash": pending["password_hash"],
        "role": role,
        "meta": pending["meta"],
        "daily_limit": daily_quota,
        "queries_used_today": 0,
        "last_reset_date": date.today().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "is_active": True
    }
    
    _USERS_DB[clean_email] = user_record
    _save_users()
    _ACTIVE_OTPS.pop(clean_email, None)
    
    logger.info(f"Registered new {role} user: {clean_email}")
    return True, "Success", user_record


# ─────────────────────────────────────────────────────────────
# User Authentication & JWT Generation
# ─────────────────────────────────────────────────────────────

def authenticate_user(email: str, password: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """Validates email + password login."""
    clean_email = email.strip().lower()
    user = _USERS_DB.get(clean_email)
    
    if not user:
        return False, "Account not found. Please register with your email first.", None
        
    if not user.get("is_active", True):
        return False, "This account has been suspended. Please contact university support.", None
        
    if not verify_password(user["password_hash"], password):
        return False, "Incorrect password. Please try again.", None
        
    return True, "Login successful", user


def create_jwt_token(user: Dict[str, Any]) -> str:
    """Generates signed JWT token for the user."""
    payload = {
        "sub": user["email"],
        "user_id": user["id"],
        "name": user["name"],
        "role": user["role"],
        "is_college_verified": user.get("meta", {}).get("is_college_verified", False),
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token received.")
        return None
    except Exception as e:
        logger.warning(f"Invalid JWT token: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# Daily Quota Engine (Token Bucket)
# ─────────────────────────────────────────────────────────────

def get_user_quota_info(email: str) -> Dict[str, Any]:
    """Retrieves and refreshes user daily quota."""
    clean_email = email.strip().lower()
    user = _USERS_DB.get(clean_email)
    if not user:
        return {"role": "visitor", "daily_limit": settings.VISITOR_DAILY_QUOTA, "used_today": 0, "remaining_today": settings.VISITOR_DAILY_QUOTA}
        
    today_str = date.today().isoformat()
    if user.get("last_reset_date") != today_str:
        user["queries_used_today"] = 0
        user["last_reset_date"] = today_str
        _save_users()
        
    limit = user.get("daily_limit", settings.STUDENT_DAILY_QUOTA if user.get("role") == "student" else settings.VISITOR_DAILY_QUOTA)
    used = user.get("queries_used_today", 0)
    remaining = max(0, limit - used)
    
    return {
        "role": user.get("role", "visitor"),
        "daily_limit": limit,
        "used_today": used,
        "remaining_today": remaining,
        "is_college_verified": user.get("meta", {}).get("is_college_verified", False),
        "name": user.get("name", "User")
    }


def consume_query_quota(email: str) -> Tuple[bool, int]:
    """
    Checks if user has quota remaining and consumes 1 query.
    Returns (has_quota: bool, remaining_queries: int).
    """
    clean_email = email.strip().lower()
    user = _USERS_DB.get(clean_email)
    if not user:
        return False, 0
        
    today_str = date.today().isoformat()
    if user.get("last_reset_date") != today_str:
        user["queries_used_today"] = 0
        user["last_reset_date"] = today_str
        
    limit = user.get("daily_limit", settings.STUDENT_DAILY_QUOTA if user.get("role") == "student" else settings.VISITOR_DAILY_QUOTA)
    used = user.get("queries_used_today", 0)
    
    if used >= limit:
        return False, 0
        
    user["queries_used_today"] = used + 1
    _save_users()
    remaining = max(0, limit - user["queries_used_today"])
    return True, remaining


# ─────────────────────────────────────────────────────────────
# Audit Trail Engine
# ─────────────────────────────────────────────────────────────

def log_audit_trail(
    user_email: str,
    query_text: str,
    query_type: str = "text",
    intent: Optional[str] = None,
    tool_used: Optional[str] = None,
    is_out_of_scope: bool = False,
    ip_address: Optional[str] = None
):
    """Appends an immutable record to the audit trail."""
    clean_email = user_email.strip().lower()
    user = _USERS_DB.get(clean_email, {})
    
    entry = {
        "log_id": f"aud_{secrets.token_hex(6)}",
        "timestamp": datetime.utcnow().isoformat(),
        "user_email": clean_email,
        "user_name": user.get("name", "Unknown"),
        "user_role": user.get("role", "visitor"),
        "ip_address": ip_address or "127.0.0.1",
        "query_type": query_type,
        "query_text": query_text[:200] if query_text else "",
        "intent": intent or "GENERAL",
        "tool_used": tool_used,
        "is_out_of_scope": is_out_of_scope,
        "remaining_queries": max(0, user.get("daily_limit", 5) - user.get("queries_used_today", 0))
    }
    
    _AUDIT_LOGS.append(entry)
    _save_audit_logs()


def get_audit_logs_summary(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns the latest audit log entries for the Admin Dashboard."""
    return _AUDIT_LOGS[-limit:][::-1]


def get_all_users_for_admin():
    """
    Returns a clean list of all registered users for the Admin Users panel.
    Includes: email, name, role, roll_number (if student), branch, batch,
              is_college_verified, quota info, malicious_query_count,
              total_queries_all_time, joined_at.
    """
    import re
    from datetime import date as _date
    today_str = _date.today().isoformat()

    malicious_counts = {}
    total_query_counts = {}
    for log in _AUDIT_LOGS:
        em = log.get("user_email", "")
        if em:
            total_query_counts[em] = total_query_counts.get(em, 0) + 1
            if log.get("is_out_of_scope", False):
                malicious_counts[em] = malicious_counts.get(em, 0) + 1

    result = []
    for email, user in _USERS_DB.items():
        meta = user.get("meta", {})
        roll_number = None
        branch = meta.get("branch")
        batch = None
        student_id = meta.get("student_id", "")
        if student_id:
            numeric_part = "".join(filter(str.isdigit, student_id))
            roll_number = numeric_part if numeric_part else student_id
        if branch:
            yr_match = re.search(r"(\d{2})$", branch)
            if yr_match:
                batch = "20" + yr_match.group(1)
        if user.get("last_reset_date") != today_str:
            user["queries_used_today"] = 0
            user["last_reset_date"] = today_str
        limit_val = user.get(
            "daily_limit",
            settings.STUDENT_DAILY_QUOTA if user.get("role") == "student" else settings.VISITOR_DAILY_QUOTA
        )
        used = user.get("queries_used_today", 0)
        result.append({
            "id": user.get("id", ""),
            "email": email,
            "name": user.get("name", "Unknown"),
            "role": user.get("role", "visitor"),
            "is_college_verified": meta.get("is_college_verified", False),
            "roll_number": roll_number,
            "branch": branch,
            "batch": batch,
            "daily_limit": limit_val,
            "queries_used_today": used,
            "queries_remaining": max(0, limit_val - used),
            "total_queries_all_time": total_query_counts.get(email, 0),
            "malicious_query_count": malicious_counts.get(email, 0),
            "is_active": user.get("is_active", True),
            "joined_at": user.get("created_at", ""),
        })
    result.sort(key=lambda u: (-u["malicious_query_count"], u["role"] != "student", u["email"]))
    return result
