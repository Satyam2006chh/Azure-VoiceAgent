"""
Direct Voice Endpoints for standalone STT and TTS testing.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from app.config import settings
from app.services.sarvam_service import transcribe_audio_sarvam
from app.services.azure_speech_service import transcribe_audio_azure
from app.services.agent_service import synthesize_speech_dual
from app import telemetry

router = APIRouter(prefix="/api/voice", tags=["Direct Voice Testing"])

class TTSRequest(BaseModel):
    text: str
    language_code: Optional[str] = "hi-IN"
    speaker: Optional[str] = None

@router.post("/stt")
async def standalone_stt(
    audio: UploadFile = File(..., alias="audio"),
    language_code: str = Form("hi-IN"),
    provider: str = Form("sarvam")
):
    """Direct STT transcription endpoint"""
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file empty")
    
    # Ensure recognized audio file extension
    safe_filename = audio.filename or "recording.webm"
    if not any(safe_filename.endswith(ext) for ext in [".wav", ".mp3", ".webm", ".ogg", ".m4a"]):
        safe_filename = "recording.webm"
        
    canonical_lang = settings.normalize_language_code(language_code)
    if provider == "azure":
        transcript, tel = await transcribe_audio_azure(
            audio_bytes=audio_bytes,
            language_code=canonical_lang
        )
        telemetry.record_service_call("azure_stt")
    else:
        transcript, tel = await transcribe_audio_sarvam(
            audio_bytes=audio_bytes,
            filename=safe_filename,
            language_code=canonical_lang
        )
        telemetry.record_service_call("sarvam_stt")
    return {
        "transcript": transcript,
        "language_code": canonical_lang,
        "telemetry": tel
    }

@router.post("/tts")
async def standalone_tts(req: TTSRequest):
    """Direct TTS synthesis endpoint with dual engine (Sarvam + Azure Speech)"""
    if not req.text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    canonical_lang = settings.normalize_language_code(req.language_code or "hi-IN")
    audio_base64, telemetry = await synthesize_speech_dual(
        text=req.text,
        canonical_lang=canonical_lang
    )
    return {
        "audio_base64": audio_base64,
        "text": req.text,
        "language_code": canonical_lang,
        "telemetry": telemetry
    }
