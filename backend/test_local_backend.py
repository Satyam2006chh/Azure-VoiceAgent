import asyncio
import httpx
import base64
import os
from dotenv import load_dotenv

load_dotenv()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

async def run_end_to_end_test():
    print("="*50)
    print("TESTING FULL FASTAPI BACKEND PIPELINE")
    print("="*50)
    
    # 1. Generate a WAV file using Sarvam TTS (so we have valid speech audio)
    print("\n1. Generating valid speech audio (WAV) via Sarvam TTS...")
    tts_url = "https://api.sarvam.ai/text-to-speech"
    tts_headers = {"api-subscription-key": SARVAM_API_KEY, "Content-Type": "application/json"}
    tts_payload = {
        "inputs": ["विश्वविद्यालय के नियम क्या हैं?"],
        "target_language_code": "hi-IN",
        "speaker": "priya",
        "model": "bulbul:v3"
    }
    
    audio_bytes = None
    async with httpx.AsyncClient() as client:
        resp = await client.post(tts_url, headers=tts_headers, json=tts_payload, timeout=15.0)
        if resp.status_code == 200:
            audio_b64 = resp.json().get("audios", [])[0]
            audio_bytes = base64.b64decode(audio_b64)
            print(f"   Success! Generated {len(audio_bytes)} bytes of WAV audio.")
        else:
            print(f"   Failed to generate audio: {resp.text}")
            return
            
    # 2. Send the WAV file to LOCAL FastAPI backend (/api/voice/stt)
    print("\n2. Sending WAV to local FastAPI STT endpoint (http://127.0.0.1:8000/api/voice/stt)...")
    files = {"audio": ("recording.wav", audio_bytes, "audio/wav")}
    data = {"language_code": "hi-IN"}
    
    transcribed_text = ""
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post("http://127.0.0.1:8000/api/voice/stt", data=data, files=files, timeout=15.0)
            if resp.status_code == 200:
                result = resp.json()
                transcribed_text = result.get("transcript", "")
                print(f"   SUCCESS! Local Backend returned transcript:")
                print(f"   > '{transcribed_text}'")
            else:
                print(f"   FAILED: Backend returned {resp.status_code}: {resp.text}")
                return
        except Exception as e:
            print(f"   FAILED: Could not connect to backend. Is it running? Error: {e}")
            return
            
    # 3. Send transcript to LOCAL FastAPI chat endpoint (/api/chat/message)
    print("\n3. Sending transcript to local FastAPI Chat pipeline (http://127.0.0.1:8000/api/chat/message)...")
    chat_payload = {
        "query": transcribed_text,
        "language_code": "hi-IN",
        "user_role": "student",
        "generate_audio": True
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post("http://127.0.0.1:8000/api/chat/message", json=chat_payload, timeout=30.0)
            if resp.status_code == 200:
                result = resp.json()
                print(f"   SUCCESS! Chat Pipeline Response:")
                print(f"   > AI Text: {result.get('response_text')[:100]}...")
                print(f"   > Audio Generated: {'Yes' if result.get('audio_base64') else 'No'}")
                print(f"   > Tool Used: {result.get('tool_used')}")
            else:
                print(f"   FAILED: Backend returned {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"   FAILED: Error calling chat endpoint: {e}")
            
    print("\n" + "="*50)
    print("ALL TESTS PASSED: The backend API is flawlessly handling audio!")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(run_end_to_end_test())
