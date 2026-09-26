"""
FILE: check_services.py
PURPOSE: Verify all Azure + Sarvam AI services are reachable and responding.
Run: python check_services.py
"""
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

import httpx
from app.config import settings

OK   = "✅ PASS"
FAIL = "❌ FAIL"
SKIP = "⚠️  SKIP"


async def check_azure_openai():
    """Check Azure OpenAI GPT-4.1-mini is reachable."""
    url = (
        f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}"
        f"/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}"
        f"/chat/completions?api-version=2024-08-01-preview"
    )
    payload = {
        "messages": [{"role": "user", "content": "Reply with just: OK"}],
        "max_tokens": 5, "temperature": 0
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.post(url, headers={"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"}, json=payload)
        if r.status_code == 200:
            reply = r.json()["choices"][0]["message"]["content"].strip()
            print(f"  {OK}  Azure OpenAI (GPT-4.1-mini) — response: '{reply}'")
            return True
        print(f"  {FAIL} Azure OpenAI — HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"  {FAIL} Azure OpenAI — {e}")
    return False


async def check_azure_search():
    """Check Azure AI Search index is accessible."""
    url = f"{settings.AZURE_SEARCH_ENDPOINT.rstrip('/')}/indexes?api-version=2024-07-01"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(url, headers={"api-key": settings.AZURE_SEARCH_API_KEY})
        if r.status_code == 200:
            indexes = [i["name"] for i in r.json().get("value", [])]
            print(f"  {OK}  Azure AI Search — indexes: {indexes}")
            return True
        print(f"  {FAIL} Azure AI Search — HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"  {FAIL} Azure AI Search — {e}")
    return False


async def check_azure_speech():
    """Check Azure Speech token issuing."""
    if not settings.AZURE_SPEECH_KEY or not settings.AZURE_SPEECH_REGION:
        print(f"  {SKIP} Azure Speech — not configured in .env")
        return None
    url = f"https://{settings.AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.post(url, headers={"Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY})
        if r.status_code == 200:
            print(f"  {OK}  Azure Speech Token — issued ({len(r.text)} chars)")
            return True
        print(f"  {FAIL} Azure Speech — HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"  {FAIL} Azure Speech — {e}")
    return False


async def check_sarvam_tts():
    """Check Sarvam TTS (bulbul:v3) — Hindi test."""
    payload = {
        "inputs": ["नमस्ते, यह एक परीक्षण है।"],
        "target_language_code": "hi-IN",
        "speaker": "priya", "pitch": 0, "pace": 1.0,
        "loudness": 1.5, "speech_sample_rate": 22050,
        "enable_preprocessing": True, "model": "bulbul:v3"
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={"api-subscription-key": settings.SARVAM_API_KEY, "Content-Type": "application/json"},
                json=payload
            )
        if r.status_code == 200:
            audios = r.json().get("audios", [])
            if audios and len(audios[0]) > 100:
                print(f"  {OK}  Sarvam TTS (bulbul:v3) Hindi — audio bytes: {len(audios[0])}")
                return True
            print(f"  {FAIL} Sarvam TTS — empty audio response")
        else:
            print(f"  {FAIL} Sarvam TTS — HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"  {FAIL} Sarvam TTS — {e}")
    return False


async def check_sarvam_stt():
    """Check Sarvam STT (saaras:v3) API reachability with sine WAV."""
    import struct, math
    sr, dur = 16000, 1.0
    ns = int(sr * dur)
    pcm = b"".join(struct.pack("<h", int(32767 * 0.3 * math.sin(2 * math.pi * 440 * i / sr))) for i in range(ns))
    wav = (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVEfmt " +
           struct.pack("<IHHIIHH", 16, 1, 1, sr, sr * 2, 2, 16) + b"data" + struct.pack("<I", len(pcm)) + pcm)
    try:
        async with httpx.AsyncClient(timeout=15.0) as c:
            r = await c.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": settings.SARVAM_API_KEY},
                data={"model": "saaras:v3", "language_code": "hi-IN", "with_diarization": "false"},
                files={"file": ("audio.wav", wav, "audio/wav")}
            )
        if r.status_code == 200:
            print(f"  {OK}  Sarvam STT (saaras:v3) — API reachable (transcript: '{r.json().get('transcript','')[:30]}')")
            return True
        print(f"  {FAIL} Sarvam STT — HTTP {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"  {FAIL} Sarvam STT — {e}")
    return False


async def main():
    print("\n" + "="*60)
    print("  CHECK_SERVICES — UniVoice Backend Services")
    print("="*60)
    results = {}
    print("\n[Azure OpenAI]")
    results["openai"]  = await check_azure_openai()
    print("\n[Azure AI Search]")
    results["search"]  = await check_azure_search()
    print("\n[Azure Speech]")
    results["speech"]  = await check_azure_speech()
    print("\n[Sarvam TTS]")
    results["tts"]     = await check_sarvam_tts()
    print("\n[Sarvam STT]")
    results["stt"]     = await check_sarvam_stt()

    passed = sum(1 for v in results.values() if v is True)
    total  = sum(1 for v in results.values() if v is not None)
    print("\n" + "="*60)
    print(f"  RESULT: {passed}/{total} services healthy")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
