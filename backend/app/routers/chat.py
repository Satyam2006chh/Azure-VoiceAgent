"""
Chat & Voice Assistant Endpoints.
Handles unified incoming messages, voice audio uploads, STT transcription, and agent responses.
Enforces Identity Verification, Daily Quota, and Security Audit Logging.
"""

import base64
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from pydantic import BaseModel
from app.routers.auth import get_current_user
from app.services.agent_service import process_user_query
from app.services.sarvam_service import transcribe_audio_sarvam
from app.services.azure_speech_service import transcribe_audio_azure
from app.services.user_service import consume_query_quota, log_audit_trail, get_user_quota_info

router = APIRouter(prefix="/api/chat", tags=["Chat & Voice Assistant"])

class TextQueryRequest(BaseModel):
    query: str
    language_code: Optional[str] = "hi-IN"
    user_role: Optional[str] = "student"
    generate_audio: Optional[bool] = True
    provider: str = "sarvam"  # 'sarvam' or 'azure'


@router.post("/message")
async def chat_message_endpoint(
    req: TextQueryRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Main text query endpoint.
    1. Checks user authentication & quota.
    2. Deducts 1 query from quota.
    3. Runs Guardrail -> Tools/RAG -> Multilingual TTS.
    4. Logs to Audit Trail.
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query text cannot be empty.")
        
    user_email = current_user["sub"]
    has_quota, remaining = consume_query_quota(user_email)
    
    if not has_quota:
        role_label = "Student" if current_user.get("role") == "student" else "Visitor"
        raise HTTPException(
            status_code=429,
            detail={
                "error": "QUOTA_EXHAUSTED",
                "message": f"You have reached your daily query limit ({current_user.get('quota', {}).get('daily_limit', 5)} queries/day) for your {role_label} account. Quota resets in 24 hours.",
                "remaining": 0,
                "subsystem": "Quota Limiter"
            }
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    effective_role = current_user.get("role", req.user_role or "student")

    result = await process_user_query(
        query_text=req.query,
        language_code=req.language_code or "hi-IN",
        user_role=effective_role,
        generate_audio=req.generate_audio if req.generate_audio is not None else True,
        provider=req.provider or "sarvam"
    )

    # Attach live remaining quota info
    result["user_quota"] = get_user_quota_info(user_email)

    # Log to audit trail
    log_audit_trail(
        user_email=user_email,
        query_text=req.query,
        query_type="text",
        intent=result.get("intent_route"),
        tool_used=result.get("tool_used"),
        is_out_of_scope=result.get("is_out_of_scope", False),
        ip_address=client_ip
    )

    return result


SILENT_SPEECH_MESSAGES = {
    "hi-IN": "माफ़ कीजिए, आपकी आवाज़ स्पष्ट रूप से सुनाई नहीं दी। कृपया माइक बटन दबाकर दोबारा बोलें।",
    "en-IN": "Sorry, I couldn't hear your voice clearly. Please tap the microphone and speak again.",
    "ta-IN": "மன்னிக்கவும், உங்கள் குரல் தெளிவாகக் கேட்கவில்லை. தயவுசெய்து மைக்கை அழுத்தி மீண்டும் பேசவும்.",
    "te-IN": "క్షమించండి, మీ వాయిస్ స్పష్టంగా వినబడలేదు. దయచేసి మైక్ నొక్కి మళ్లీ మాట్లాడండి.",
    "mr-IN": "माफ करा, तुमचा आवाज स्पष्टपणे ऐकू आला नाही. कृपया माइक दाबून पुन्हा बोला.",
    "bn-IN": "দুঃখিত, আপনার কণ্ঠস্বর স্পষ্টভাবে শোনা যায়নি। দয়া করে মাইক টিপে আবার বলুন।",
    "gu-IN": "માફ કરશો, તમારો અવાજ સ્પષ્ટ સંભળાયો નથી. કૃપા કરીને માઇક દબાવીને ફરીથી બોલો.",
    "kn-IN": "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಧ್ವನಿ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೈಕ್ ಒತ್ತಿ ಮತ್ತೆ ಮಾತನಾಡಿ.",
    "ml-IN": "ക്ഷമിക്കണം, നിങ്ങളുടെ ശബ്ദം വ്യക്തമായി കേൾക്കാനായില്ല. ദയവായി മൈക്ക് അമർത്തി വീണ്ടും സംസാരിക്കുക.",
    "pa-IN": "ਮਾਫ਼ ਕਰਨਾ, ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸਾਫ਼ ਸੁਣਾਈ ਨਹੀਂ ਦਿੱਤੀ। ਕਿਰਪਾ ਕਰਕੇ ਮਾਈਕ ਦਬਾ ਕੇ ਦੁਬਾਰਾ ਬੋਲੋ।"
}


@router.post("/voice")
async def voice_chat_endpoint(
    request: Request,
    audio: UploadFile = File(...),
    language_code: str = Form("hi-IN"),
    user_role: str = Form("student"),
    generate_audio: bool = Form(True),
    provider: str = Form("sarvam"),  # 'sarvam' or 'azure'
    current_user: dict = Depends(get_current_user)
):
    """
    Direct voice upload endpoint.
    1. Validates user token & quota.
    2. Receives raw user audio -> Sarvam saaras:v3 STT -> Agent Pipeline -> Sarvam / Azure TTS.
    3. Deducts 1 query & logs audit trail.
    """
    user_email = current_user["sub"]
    has_quota, remaining = consume_query_quota(user_email)
    
    if not has_quota:
        role_label = "Student" if current_user.get("role") == "student" else "Visitor"
        raise HTTPException(
            status_code=429,
            detail={
                "error": "QUOTA_EXHAUSTED",
                "message": f"You have reached your daily query limit ({current_user.get('quota', {}).get('daily_limit', 5)} queries/day) for your {role_label} account. Quota resets in 24 hours.",
                "remaining": 0,
                "subsystem": "Quota Limiter"
            }
        )

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")
        
    safe_filename = audio.filename or "recording.webm"
    if not any(safe_filename.endswith(ext) for ext in [".wav", ".mp3", ".webm", ".ogg", ".m4a"]):
        safe_filename = "recording.webm"

    client_ip = request.client.host if request.client else "127.0.0.1"
    effective_role = current_user.get("role", user_role or "student")

    # Transcribe audio
    if provider == "azure":
        transcript, stt_telemetry = await transcribe_audio_azure(
            audio_bytes=audio_bytes,
            language_code=language_code
        )
    else:
        transcript, stt_telemetry = await transcribe_audio_sarvam(
            audio_bytes=audio_bytes,
            filename=safe_filename,
            language_code=language_code
        )
    
    if not transcript:
        from app.config import settings
        from app.services.agent_service import synthesize_speech_by_provider
        
        canonical_lang = settings.normalize_language_code(language_code)
        polite_msg = SILENT_SPEECH_MESSAGES.get(canonical_lang, SILENT_SPEECH_MESSAGES["hi-IN"])
        
        audio_b64 = None
        tts_telem = {}
        if generate_audio:
            audio_b64, tts_telem = await synthesize_speech_by_provider(polite_msg, canonical_lang, provider)
            
        return {
            "status": "warning",
            "query": "",
            "language": canonical_lang,
            "response_text": polite_msg,
            "audio_base64": audio_b64,
            "intent_route": "NO_SPEECH_DETECTED",
            "is_out_of_scope": False,
            "tool_used": None,
            "citations": [],
            "transcription": "",
            "user_quota": get_user_quota_info(user_email),
            "telemetry": {
                "stt": stt_telemetry,
                "tts": tts_telem
            }
        }
        
    result = await process_user_query(
        query_text=transcript,
        language_code=language_code,
        user_role=effective_role,
        generate_audio=generate_audio,
        provider=provider
    )
    result["transcription"] = transcript
    result["telemetry"]["stt"] = stt_telemetry
    result["user_quota"] = get_user_quota_info(user_email)

    # Log to audit trail
    log_audit_trail(
        user_email=user_email,
        query_text=transcript,
        query_type="voice",
        intent=result.get("intent_route"),
        tool_used=result.get("tool_used"),
        is_out_of_scope=result.get("is_out_of_scope", False),
        ip_address=client_ip
    )

    return result


@router.get("/health")
async def chat_health_check():
    """Health check for assistant services"""
    return {
        "status": "healthy",
        "service": "University Voice Assistant API",
        "stt_engine": "Sarvam saaras:v3",
        "tts_engine": "Sarvam bulbul:v3 + Azure Speech",
        "guardrail_engine": "Active (Intent & Out-of-Scope Filter)",
        "identity_firewall": "Active (JWT & Real-Email OTP Gatekeeper)"
    }
