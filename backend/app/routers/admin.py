"""
Admin Router — Provides admin-only endpoints for the UniVoice Admin Dashboard.
Handles authentication, stats, service health checks, and PDF uploads.
"""

import os
import shutil
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app import telemetry
from app.config import settings
from app.services.pdf_indexer import index_pdf, UPLOADS_DIR
from app.services.user_service import (
    get_audit_logs_summary,
    get_all_users_for_admin,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

# ─── Simple token-based auth (no DB needed) ───
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin123"
ADMIN_TOKEN = "univoice-admin-secret-token-2025"


class LoginRequest(BaseModel):
    email: str
    password: str


def verify_admin(x_admin_token: Optional[str] = Header(None)):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized. Invalid admin token.")
    return True


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────
@router.post("/login")
async def admin_login(req: LoginRequest):
    """Validate admin credentials and return session token."""
    if req.email.strip().lower() == ADMIN_EMAIL and req.password == ADMIN_PASSWORD:
        return {
            "status": "success",
            "token": ADMIN_TOKEN,
            "message": "Welcome, Admin!"
        }
    raise HTTPException(status_code=401, detail="Invalid email or password.")


# ─────────────────────────────────────────────
# Stats
# ─────────────────────────────────────────────
@router.get("/stats")
async def get_admin_stats(authorized: bool = Depends(verify_admin)):
    """Returns full usage statistics for the admin dashboard."""
    return telemetry.get_stats()


# ─────────────────────────────────────────────
# Service Health Check
# ─────────────────────────────────────────────
@router.get("/service-health")
async def get_service_health(authorized: bool = Depends(verify_admin)):
    """Pings all integrated AI services and returns their live status."""
    import httpx
    results = {}

    # 1. Sarvam AI
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={"api-subscription-key": settings.SARVAM_API_KEY, "Content-Type": "application/json"},
                json={"inputs": ["test"], "target_language_code": "hi-IN", "speaker": "priya", "model": "bulbul:v3"}
            )
            results["sarvam_ai"] = {
                "name": "Sarvam AI (STT + TTS)",
                "status": "operational" if resp.status_code == 200 else "degraded",
                "status_code": resp.status_code,
                "model": "saaras:v3 + bulbul:v3"
            }
    except Exception as e:
        results["sarvam_ai"] = {"name": "Sarvam AI (STT + TTS)", "status": "down", "error": str(e)[:80]}

    # 2. Azure OpenAI
    try:
        url = (
            f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}"
            f"/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}"
            f"/chat/completions?api-version=2024-08-01-preview"
        )
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                url,
                headers={"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"},
                json={"messages": [{"role": "user", "content": "ping"}], "max_tokens": 5}
            )
            results["azure_openai"] = {
                "name": "Azure OpenAI (GPT-4.1-mini)",
                "status": "operational" if resp.status_code == 200 else "degraded",
                "status_code": resp.status_code,
                "model": settings.AZURE_OPENAI_DEPLOYMENT
            }
    except Exception as e:
        results["azure_openai"] = {"name": "Azure OpenAI (GPT-4.1-mini)", "status": "down", "error": str(e)[:80]}

    # 3. Azure AI Search
    try:
        url = (
            f"{settings.AZURE_SEARCH_ENDPOINT.rstrip('/')}"
            f"/indexes/{settings.AZURE_SEARCH_INDEX_NAME}/docs/search"
            f"?api-version=2024-07-01"
        )
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                url,
                headers={"api-key": settings.AZURE_SEARCH_API_KEY, "Content-Type": "application/json"},
                json={"search": "test", "top": 1}
            )
            results["azure_search"] = {
                "name": "Azure AI Search (RAG)",
                "status": "operational" if resp.status_code == 200 else "degraded",
                "status_code": resp.status_code,
                "index": settings.AZURE_SEARCH_INDEX_NAME
            }
    except Exception as e:
        results["azure_search"] = {"name": "Azure AI Search (RAG)", "status": "down", "error": str(e)[:80]}

    # 4. Azure Speech
    try:
        token_url = f"https://{settings.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                token_url,
                headers={"Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY}
            )
            results["azure_speech"] = {
                "name": "Azure AI Speech (Neural TTS)",
                "status": "operational" if resp.status_code == 200 else "degraded",
                "status_code": resp.status_code,
                "region": settings.AZURE_SPEECH_REGION
            }
    except Exception as e:
        results["azure_speech"] = {"name": "Azure AI Speech (Neural TTS)", "status": "down", "error": str(e)[:80]}

    return {"services": results}


# ─────────────────────────────────────────────
# PDF Upload
# ─────────────────────────────────────────────
@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    authorized: bool = Depends(verify_admin)
):
    """Upload a PDF and index its contents into Azure AI Search."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    save_path = UPLOADS_DIR / file.filename
    try:
        with open(save_path, "wb") as f:
            content = await file.read()
            f.write(content)
        logger.info(f"PDF saved: {save_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save PDF: {e}")

    # Index asynchronously
    success = await index_pdf(str(save_path))

    return {
        "status": "success" if success else "partial",
        "filename": file.filename,
        "indexed": success,
        "message": (
            f"'{file.filename}' uploaded and indexed into Azure AI Search successfully!"
            if success else
            f"'{file.filename}' saved locally but Azure Search indexing failed. Check logs."
        )
    }


# ─────────────────────────────────────────────
# Date-wise Daily Breakdown
# ─────────────────────────────────────────────
@router.get("/daily-breakdown")
async def get_daily_breakdown(authorized: bool = Depends(verify_admin)):
    """
    Returns a per-day table of queries + every service's call count.
    Sorted newest-first. Includes every date ever recorded — not just last 7 days.
    Shape:
      {
        "rows": [
          {
            "date": "2026-09-22",
            "queries": 5,
            "sarvam_stt": 3,
            "sarvam_tts": 2,
            "azure_speech_tts": 1,
            "azure_openai": 5,
            "azure_search": 4
          },
          ...
        ],
        "total_days": 1
      }
    """
    return telemetry.get_daily_breakdown()


# ─────────────────────────────────────────────
# List Indexed PDFs
# ─────────────────────────────────────────────
@router.get("/pdfs")
async def list_pdfs(authorized: bool = Depends(verify_admin)):
    """Returns list of all indexed PDFs."""
    return {"pdfs": telemetry._store.get("indexed_pdfs", [])}


# ─────────────────────────────────────────────
# Registered Users (Admin User Panel)
# ─────────────────────────────────────────────
@router.get("/users")
async def list_users(authorized: bool = Depends(verify_admin)):
    """
    Returns all registered users: email, name, role, roll number,
    branch, quota, malicious query count.
    """
    users = get_all_users_for_admin()
    return {
        "status": "success",
        "total_users": len(users),
        "students": sum(1 for u in users if u["role"] == "student"),
        "visitors": sum(1 for u in users if u["role"] != "student"),
        "users": users
    }
