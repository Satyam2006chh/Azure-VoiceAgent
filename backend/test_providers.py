"""
Full end-to-end test for both Sarvam and Azure TTS providers
against the local FastAPI backend running on localhost:8000
"""
import asyncio
import httpx
import base64
import os
from dotenv import load_dotenv

load_dotenv()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

async def generate_test_wav():
    """Generate a WAV audio file via Sarvam TTS to use as STT input."""
    tts_url = "https://api.sarvam.ai/text-to-speech"
    headers = {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}
    payload = {
        "inputs": ["विश्वविद्यालय में उपस्थिति नियम क्या है?"],
        "target_language_code": "hi-IN",
        "speaker": "priya",
        "model": "bulbul:v3"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(tts_url, headers=headers, json=payload, timeout=15.0)
        if resp.status_code == 200:
            audio_b64 = resp.json().get("audios", [])[0]
            return base64.b64decode(audio_b64)
    return None

async def test_stt(audio_bytes):
    """Test STT endpoint."""
    files = {"audio": ("recording.wav", audio_bytes, "audio/wav")}
    data = {"language_code": "hi-IN"}
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://127.0.0.1:8000/api/voice/stt", data=data, files=files, timeout=15.0)
        if resp.status_code == 200:
            return resp.json().get("transcript", "")
    return None

async def test_chat_with_provider(transcript, provider):
    """Test the chat/message endpoint with a given TTS provider."""
    payload = {
        "query": transcript,
        "language_code": "hi-IN",
        "user_role": "student",
        "generate_audio": True,
        "tts_provider": provider
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://127.0.0.1:8000/api/chat/message", json=payload, timeout=30.0)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "text": data.get("response_text", "")[:120],
                "has_audio": bool(data.get("audio_base64")),
                "audio_size": len(base64.b64decode(data["audio_base64"])) if data.get("audio_base64") else 0,
                "tts_provider": data.get("telemetry", {}).get("tts", {}).get("selected_provider", "?"),
                "tts_model": data.get("telemetry", {}).get("tts", {}).get("model", "?"),
                "tool_used": data.get("tool_used"),
            }
        return {"error": f"HTTP {resp.status_code}: {resp.text[:100]}"}

async def run_tests():
    print("=" * 60)
    print("PROVIDER COMPARISON TEST: SARVAM vs AZURE")
    print("=" * 60)

    print("\nStep 1: Generating test WAV audio via Sarvam TTS...")
    audio_bytes = await generate_test_wav()
    if not audio_bytes:
        print("FAILED to generate test audio. Check API key.")
        return
    print(f"   Generated {len(audio_bytes)} bytes of WAV audio.")

    print("\nStep 2: Transcribing via local STT endpoint...")
    transcript = await test_stt(audio_bytes)
    if not transcript:
        print("FAILED to transcribe audio.")
        return
    print(f"   Transcript: '{transcript}'")

    print("\n" + "=" * 60)
    print("Step 3: Testing SARVAM AI TTS provider...")
    print("=" * 60)
    sarvam_result = await test_chat_with_provider(transcript, "sarvam")
    if "error" in sarvam_result:
        print(f"   SARVAM FAILED: {sarvam_result['error']}")
    else:
        print(f"   Status       : SUCCESS")
        print(f"   AI Response  : {sarvam_result['text']}...")
        print(f"   Audio Generated: {'YES' if sarvam_result['has_audio'] else 'NO'}")
        print(f"   Audio Size   : {sarvam_result['audio_size']:,} bytes")
        print(f"   TTS Model    : {sarvam_result['tts_model']}")
        print(f"   Tool Used    : {sarvam_result['tool_used']}")

    print("\n" + "=" * 60)
    print("Step 4: Testing AZURE AI SPEECH TTS provider...")
    print("=" * 60)
    azure_result = await test_chat_with_provider(transcript, "azure")
    if "error" in azure_result:
        print(f"   AZURE FAILED: {azure_result['error']}")
    else:
        print(f"   Status       : SUCCESS")
        print(f"   AI Response  : {azure_result['text']}...")
        print(f"   Audio Generated: {'YES' if azure_result['has_audio'] else 'NO'}")
        print(f"   Audio Size   : {azure_result['audio_size']:,} bytes")
        print(f"   TTS Model    : {azure_result['tts_model']}")
        print(f"   Tool Used    : {azure_result['tool_used']}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    sarvam_ok = "error" not in sarvam_result and sarvam_result.get("has_audio")
    azure_ok = "error" not in azure_result and azure_result.get("has_audio")
    print(f"   Sarvam AI   : {'PASS' if sarvam_ok else 'FAIL'}")
    print(f"   Azure Speech: {'PASS' if azure_ok else 'FAIL'}")
    if sarvam_ok and azure_ok:
        print("\nBOTH PROVIDERS WORKING! The Provider Selection Modal is fully functional.")
    elif sarvam_ok:
        print("\nSarvam works. Azure has an issue (check AZURE_SPEECH_KEY + AZURE_SPEECH_REGION in .env)")
    elif azure_ok:
        print("\nAzure works. Sarvam has an issue.")
    else:
        print("\nBoth providers failed. Check backend logs.")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
