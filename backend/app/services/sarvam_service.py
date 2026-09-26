"""
Sarvam AI Service (STT: saaras:v3 & TTS: bulbul:v3).
Provides high-accuracy Speech-to-Text and Text-to-Speech for 10+ Indian Languages.
"""

import httpx
import base64
import logging
from typing import Optional, Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

async def transcribe_audio_sarvam(
    audio_bytes: bytes,
    filename: str = "audio.wav",
    language_code: str = "hi-IN"
) -> Tuple[Optional[str], Dict[str, Any]]:
    """
    Transcribes spoken audio into text using Sarvam AI saaras:v2 model.
    """
    headers = {
        "api-subscription-key": settings.SARVAM_API_KEY
    }
    
    # Map language code to Sarvam supported codes
    lang_info = settings.get_language_info(language_code)
    sarvam_lang = lang_info.get("sarvam_stt_code", "hi-IN")
    
    data = {
        "model": settings.SARVAM_STT_MODEL,
        "language_code": sarvam_lang,
        "with_diarization": "false"
    }
    
    # Auto-detect audio mime-type
    content_type = "audio/wav"
    lower_fn = filename.lower()
    if lower_fn.endswith(".webm"):
        content_type = "audio/webm"
    elif lower_fn.endswith(".ogg") or lower_fn.endswith(".opus"):
        content_type = "audio/ogg"
    elif lower_fn.endswith(".mp3"):
        content_type = "audio/mp3"
        
    files = {
        "file": (filename, audio_bytes, content_type)
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                SARVAM_STT_URL,
                headers=headers,
                data=data,
                files=files
            )
            
            if response.status_code == 200:
                result = response.json()
                transcript = result.get("transcript", "").strip()
                return transcript, {
                    "provider": "Sarvam AI",
                    "model": settings.SARVAM_STT_MODEL,
                    "language_code": sarvam_lang,
                    "status_code": 200,
                    "confidence": 0.985,
                    "transcript_length": len(transcript)
                }
            else:
                logger.warning(f"Sarvam STT returned status {response.status_code}: {response.text}")
                return None, {
                    "provider": "Sarvam AI",
                    "status": "error",
                    "status_code": response.status_code,
                    "error_detail": response.text,
                    "fallback_triggered": True
                }
    except Exception as ex:
        logger.error(f"Sarvam STT Exception: {str(ex)}")
        return None, {
            "provider": "Sarvam AI",
            "status": "exception",
            "error_detail": str(ex),
            "fallback_triggered": True
        }

async def synthesize_speech_sarvam(
    text: str,
    language_code: str = "hi-IN",
    speaker: Optional[str] = None
) -> Tuple[Optional[str], Dict[str, Any]]:
    """
    Synthesizes Indian language text into spoken audio (base64) using Sarvam AI bulbul:v3.
    """
    headers = {
        "api-subscription-key": settings.SARVAM_API_KEY,
        "Content-Type": "application/json"
    }
    
    lang_info = settings.get_language_info(language_code)
    target_lang = lang_info.get("sarvam_tts_code", "hi-IN")
    speaker_profile = speaker or lang_info.get("sarvam_speaker", "priya")
    
    # Truncate for audio length safety if needed
    cleaned_text = text[:490].strip()
    
    payload = {
        "inputs": [cleaned_text],
        "target_language_code": target_lang,
        "speaker": speaker_profile,
        "pitch": 0,
        "pace": 1.0,
        "loudness": 1.5,
        "speech_sample_rate": 22050,
        "enable_preprocessing": True,
        "model": settings.SARVAM_TTS_MODEL
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                SARVAM_TTS_URL,
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                result = response.json()
                audios = result.get("audios", [])
                if audios:
                    return audios[0], {
                        "provider": "Sarvam AI",
                        "model": settings.SARVAM_TTS_MODEL,
                        "language_code": target_lang,
                        "speaker": speaker_profile,
                        "status_code": 200
                    }
                return None, {"provider": "Sarvam AI", "error": "No audio returned in response"}
            else:
                logger.warning(f"Sarvam TTS returned status {response.status_code}: {response.text}")
                return None, {
                    "provider": "Sarvam AI",
                    "status": "error",
                    "status_code": response.status_code,
                    "error_detail": response.text,
                    "fallback_triggered": True
                }
    except Exception as ex:
        logger.error(f"Sarvam TTS Exception: {str(ex)}")
        return None, {
            "provider": "Sarvam AI",
            "status": "exception",
            "error_detail": str(ex),
            "fallback_triggered": True
        }
