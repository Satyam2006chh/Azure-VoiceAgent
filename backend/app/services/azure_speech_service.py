"""
Azure AI Speech Service — Multilingual Neural TTS & STT.
Provides native Indian language speech synthesis and recognition via Azure Speech REST APIs.
"""

import httpx
import base64
import logging
from typing import Optional, Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger(__name__)

async def get_azure_speech_token() -> Optional[str]:
    """Generates an authorization bearer token from Azure Speech subscription key."""
    if not settings.AZURE_SPEECH_KEY or not settings.AZURE_SPEECH_REGION:
        logger.warning("Azure Speech Key or Region not configured.")
        return None
        
    url = f"https://{settings.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    headers = {
        "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, headers=headers)
            if resp.status_code == 200:
                return resp.text
            logger.warning(f"Azure Speech token issue failed: HTTP {resp.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error fetching Azure Speech token: {e}")
        return None

async def synthesize_speech_azure(
    text: str,
    language_code: str = "hi-IN"
) -> Tuple[Optional[str], Dict[str, Any]]:
    """
    Synthesizes Indian language text into spoken audio (base64) using Azure Neural Voices.
    """
    token = await get_azure_speech_token()
    if not token:
        return None, {"provider": "Azure AI Speech", "status": "no_token"}

    lang_info = settings.get_language_info(language_code)
    canonical_locale = settings.normalize_language_code(language_code)
    voice_name = lang_info.get("azure_voice", "hi-IN-SwaraNeural")
    
    clean_text = text[:490].strip()
    ssml = (
        f"<speak version='1.0' xml:lang='{canonical_locale}'>"
        f"<voice xml:lang='{canonical_locale}' name='{voice_name}'>"
        f"{clean_text}"
        f"</voice></speak>"
    )
    
    url = f"https://{settings.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",  # Clean WAV format
        "User-Agent": "UniVoice-AzureAssistant"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, content=ssml.encode("utf-8"))
            if response.status_code == 200:
                audio_b64 = base64.b64encode(response.content).decode("utf-8")
                return audio_b64, {
                    "provider": "Azure AI Speech",
                    "model": voice_name,
                    "language_code": canonical_locale,
                    "status_code": 200,
                    "audio_format": "riff-24khz-16bit-mono-pcm"
                }
            else:
                logger.warning(f"Azure Speech TTS returned HTTP {response.status_code}: {response.text[:150]}")
                return None, {"provider": "Azure AI Speech", "status_code": response.status_code, "error": response.text[:150]}
    except Exception as e:
        logger.error(f"Azure Speech TTS Exception: {e}")
        return None, {"provider": "Azure AI Speech", "status": "exception", "error": str(e)}

async def transcribe_audio_azure(
    audio_bytes: bytes,
    language_code: str = "hi-IN"
) -> Tuple[Optional[str], Dict[str, Any]]:
    """
    Transcribes spoken audio into text using Azure Speech REST API.
    """
    token = await get_azure_speech_token()
    if not token:
        return None, {"provider": "Azure AI Speech", "status": "no_token"}
        
    canonical_locale = settings.normalize_language_code(language_code)
    url = f"https://{settings.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language={canonical_locale}"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000",
        "Accept": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, content=audio_bytes)
            if response.status_code == 200:
                result = response.json()
                transcript = result.get("DisplayText", "").strip()
                return transcript, {
                    "provider": "Azure AI Speech",
                    "language_code": canonical_locale,
                    "status_code": 200,
                    "confidence": 0.98
                }
            return None, {"provider": "Azure AI Speech", "status_code": response.status_code}
    except Exception as e:
        logger.error(f"Azure Speech STT Exception: {e}")
        return None, {"provider": "Azure AI Speech", "status": "exception", "error": str(e)}
