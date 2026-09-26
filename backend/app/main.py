"""
Main FastAPI Application Entry Point.
AI-Powered Multilingual Voice University Assistant.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.routers import chat, voice, tools, documents, admin, auth
from app.config import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("univai_backend")

app = FastAPI(
    title="AI-Powered Multilingual University Voice Assistant",
    description="Multilingual Agentic Voice Assistant powered by Sarvam AI & Azure AI for University Academics",
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows frontend on localhost:5173, etc.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Structured Exception Handler for Frontend Diagnostic Card
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error_type": type(exc).__name__,
            "message": str(exc),
            "subsystem": "FastAPI Agent Gateway",
            "suggestion": "Check backend logs or verify API credentials in .env.",
            "path": str(request.url.path)
        }
    )

@app.on_event("startup")
async def on_startup():
    """Auto-index bootstrap PDFs into Azure AI Search on server start."""
    logger.info("Server starting — running PDF bootstrap indexing...")
    try:
        from app.services.pdf_indexer import bootstrap_index_pdfs
        await bootstrap_index_pdfs()
    except Exception as e:
        logger.warning(f"Bootstrap PDF indexing error (non-fatal): {e}")

# Include API Routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(tools.router)
app.include_router(documents.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "message": "AI-Powered University Voice Assistant Backend is Active!",
        "docs_url": "/docs",
        "stt_model": settings.SARVAM_STT_MODEL,
        "tts_model": settings.SARVAM_TTS_MODEL,
        "supported_languages_count": len(settings.LANGUAGE_MAPPINGS)
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "UP",
        "version": "1.0.0",
        "sarvam_configured": bool(settings.SARVAM_API_KEY),
        "azure_configured": bool(settings.AZURE_OPENAI_API_KEY)
    }
