import os
from typing import Dict
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Explicitly load .env from backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    # Sarvam AI
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "sk_zp1562cc_hKTU1Al2uAGpfaOVbqVuTmF2")
    SARVAM_STT_MODEL: str = os.getenv("SARVAM_STT_MODEL", "saaras:v3")
    SARVAM_TTS_MODEL: str = os.getenv("SARVAM_TTS_MODEL", "bulbul:v3")
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: str = os.getenv("AZURE_OPENAI_API_KEY", "")
    AZURE_OPENAI_ENDPOINT: str = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    AZURE_OPENAI_DEPLOYMENT: str = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
    AZURE_SPEECH_KEY: str = os.getenv("AZURE_SPEECH_KEY", "")
    AZURE_SPEECH_REGION: str = os.getenv("AZURE_SPEECH_REGION", "centralindia")

    # Azure AI Search
    AZURE_SEARCH_API_KEY: str = os.getenv("AZURE_SEARCH_API_KEY", "")
    AZURE_SEARCH_ENDPOINT: str = os.getenv("AZURE_SEARCH_ENDPOINT", "")
    AZURE_SEARCH_INDEX_NAME: str = os.getenv("AZURE_SEARCH_INDEX_NAME", "university-rulebook")
    
    # Server
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

    # Email OTP (SMTP & Azure)
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@univoice-assistant.com")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "UniVoice Assistant")
    
    # JWT Auth & Daily Quotas
    JWT_SECRET: str = os.getenv("JWT_SECRET", "univoice-chitkara-secure-jwt-key-2026-auth-shield")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "72"))
    STUDENT_DAILY_QUOTA: int = int(os.getenv("STUDENT_DAILY_QUOTA", "20"))
    VISITOR_DAILY_QUOTA: int = int(os.getenv("VISITOR_DAILY_QUOTA", "5"))
    COLLEGE_EMAIL_DOMAIN: str = os.getenv("COLLEGE_EMAIL_DOMAIN", "chitkara.edu.in")
    
    # Supported Indian Languages mapping to Sarvam / Azure codes & speaker profiles
    # Supported Indian Languages mapping to Sarvam / Azure codes & speaker profiles
    LANGUAGE_MAPPINGS: Dict[str, Dict[str, str]] = {
        "hi-IN": {
            "name": "Hindi",
            "native": "हिन्दी",
            "sarvam_stt_code": "hi-IN",
            "sarvam_tts_code": "hi-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "hi-IN-MadhurNeural"  # Male Hindi voice
        },
        "en-IN": {
            "name": "English (India)",
            "native": "English (IN)",
            "sarvam_stt_code": "en-IN",
            "sarvam_tts_code": "en-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "en-IN-PrabhatNeural"  # Male Indian English voice
        },
        "ta-IN": {
            "name": "Tamil",
            "native": "தமிழ்",
            "sarvam_stt_code": "ta-IN",
            "sarvam_tts_code": "ta-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "ta-IN-ValluvarNeural"  # Male Tamil voice
        },
        "te-IN": {
            "name": "Telugu",
            "native": "తెలుగు",
            "sarvam_stt_code": "te-IN",
            "sarvam_tts_code": "te-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "te-IN-MohanNeural"  # Male Telugu voice
        },
        "mr-IN": {
            "name": "Marathi",
            "native": "मराठी",
            "sarvam_stt_code": "mr-IN",
            "sarvam_tts_code": "mr-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "mr-IN-ManoharNeural"  # Male Marathi voice
        },
        "bn-IN": {
            "name": "Bengali",
            "native": "বাংলা",
            "sarvam_stt_code": "bn-IN",
            "sarvam_tts_code": "bn-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "bn-IN-BashkarNeural"  # Male Bengali voice
        },
        "gu-IN": {
            "name": "Gujarati",
            "native": "ગુજરાતી",
            "sarvam_stt_code": "gu-IN",
            "sarvam_tts_code": "gu-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "gu-IN-NiranjanNeural"  # Male Gujarati voice
        },
        "kn-IN": {
            "name": "Kannada",
            "native": "ಕನ್ನಡ",
            "sarvam_stt_code": "kn-IN",
            "sarvam_tts_code": "kn-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "kn-IN-GaganNeural"  # Male Kannada voice
        },
        "ml-IN": {
            "name": "Malayalam",
            "native": "മലയാളം",
            "sarvam_stt_code": "ml-IN",
            "sarvam_tts_code": "ml-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "ml-IN-MidhunNeural"  # Male Malayalam voice
        },
        "pa-IN": {
            "name": "Punjabi",
            "native": "ਪੰਜਾਬੀ",
            "sarvam_stt_code": "pa-IN",
            "sarvam_tts_code": "pa-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "pa-IN-OjasNeural"  # Male Punjabi voice
        },
        "or-IN": {
            "name": "Odia",
            "native": "ଓଡ଼ିଆ",
            "sarvam_stt_code": "od-IN",
            "sarvam_tts_code": "od-IN",
            "sarvam_speaker": "priya",
            "azure_voice": "or-IN-SukantNeural"  # Male Odia voice
        }
    }

    def get_language_info(self, code: str) -> Dict[str, str]:
        """Resolves language info supporting both 2-letter codes ('ta', 'hi') and locales ('ta-IN', 'hi-IN')."""
        if not code:
            return self.LANGUAGE_MAPPINGS["hi-IN"]
        clean = code.strip()
        if clean in self.LANGUAGE_MAPPINGS:
            return self.LANGUAGE_MAPPINGS[clean]
        
        lower = clean.lower()
        # Try finding prefix or short code
        for key, val in self.LANGUAGE_MAPPINGS.items():
            k_prefix = key.split("-")[0].lower()
            if lower == k_prefix or lower.startswith(k_prefix + "-") or lower == key.lower():
                return val
                
        return self.LANGUAGE_MAPPINGS["hi-IN"]

    def normalize_language_code(self, code: str) -> str:
        """Returns the canonical locale code (e.g. 'ta' -> 'ta-IN')."""
        info = self.get_language_info(code)
        for key, val in self.LANGUAGE_MAPPINGS.items():
            if val == info:
                return key
        return "hi-IN"

settings = Settings()

