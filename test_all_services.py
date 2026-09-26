"""
Quick test — checks all critical services:
1. Sarvam TTS (Hindi, English, Tamil, Telugu, Marathi, Bengali, Gujarati, Kannada)
2. Sarvam STT (with synthetic WAV)
3. Azure OpenAI (GPT-4.1-mini)
4. Azure Speech Token
"""

import asyncio
import sys
import os
import struct
import math
import base64

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

import httpx
from app.config import settings

SARVAM_KEY = settings.SARVAM_API_KEY
AZURE_OAI_KEY = settings.AZURE_OPENAI_API_KEY
AZURE_OAI_ENDPOINT = settings.AZURE_OPENAI_ENDPOINT
AZURE_OAI_DEPLOY = settings.AZURE_OPENAI_DEPLOYMENT
AZURE_SPEECH_KEY = settings.AZURE_SPEECH_KEY
AZURE_SPEECH_REGION = settings.AZURE_SPEECH_REGION

OK = "[PASS]"
FAIL = "[FAIL]"


def make_sine_wav(duration_s=1.5, sample_rate=16000, freq=440) -> bytes:
    num_samples = int(sample_rate * duration_s)
    data_size = num_samples * 2
    wav = bytearray()
    wav += b'RIFF'
    wav += struct.pack('<I', 36 + data_size)
    wav += b'WAVE'
    wav += b'fmt '
    wav += struct.pack('<I', 16)
    wav += struct.pack('<H', 1)
    wav += struct.pack('<H', 1)
    wav += struct.pack('<I', sample_rate)
    wav += struct.pack('<I', sample_rate * 2)
    wav += struct.pack('<H', 2)
    wav += struct.pack('<H', 16)
    wav += b'data'
    wav += struct.pack('<I', data_size)
    for i in range(num_samples):
        sample = int(32767 * 0.5 * math.sin(2 * math.pi * freq * i / sample_rate))
        wav += struct.pack('<h', sample)
    return bytes(wav)


async def test_sarvam_tts(lang_code: str, text: str, label: str):
    headers = {"api-subscription-key": SARVAM_KEY, "Content-Type": "application/json"}
    speaker_map = {
        "hi-IN": "priya", "en-IN": "ananya", "ta-IN": "diya",
        "te-IN": "ananya", "mr-IN": "priya", "bn-IN": "priya",
        "gu-IN": "priya", "kn-IN": "ananya", "ml-IN": "ananya", "pa-IN": "priya"
    }
    payload = {
        "inputs": [text],
        "target_language_code": lang_code,
        "speaker": speaker_map.get(lang_code, "priya"),
        "pitch": 0, "pace": 1.0, "loudness": 1.5,
        "speech_sample_rate": 22050,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post("https://api.sarvam.ai/text-to-speech", headers=headers, json=payload)
    if r.status_code == 200:
        audios = r.json().get("audios", [])
        if audios and len(audios[0]) > 100:
            print(f"  {OK} Sarvam TTS [{label}] — base64 len: {len(audios[0])}")
            return True
        print(f"  {FAIL} Sarvam TTS [{label}] — empty audio")
        return False
    print(f"  {FAIL} Sarvam TTS [{label}] — HTTP {r.status_code}: {r.text[:120]}")
    return False


async def test_sarvam_stt(lang_code: str, label: str):
    headers = {"api-subscription-key": SARVAM_KEY}
    wav_bytes = make_sine_wav()
    data = {"model": "saaras:v3", "language_code": lang_code, "with_diarization": "false"}
    files = {"file": ("audio.wav", wav_bytes, "audio/wav")}
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post("https://api.sarvam.ai/speech-to-text", headers=headers, data=data, files=files)
    if r.status_code == 200:
        transcript = r.json().get("transcript", "")
        print(f"  {OK} Sarvam STT [{label}] — API reachable, transcript: '{transcript[:50]}'")
        return True
    print(f"  {FAIL} Sarvam STT [{label}] — HTTP {r.status_code}: {r.text[:120]}")
    return False


async def test_azure_openai():
    url = (
        f"{AZURE_OAI_ENDPOINT.rstrip('/')}"
        f"/openai/deployments/{AZURE_OAI_DEPLOY}"
        f"/chat/completions?api-version=2024-08-01-preview"
    )
    headers = {"api-key": AZURE_OAI_KEY, "Content-Type": "application/json"}
    payload = {
        "messages": [
            {"role": "system", "content": "You are a helpful university assistant."},
            {"role": "user", "content": "What are the fee deadlines? Reply in 1 sentence."}
        ],
        "max_tokens": 100, "temperature": 0.3
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, headers=headers, json=payload)
    if r.status_code == 200:
        reply = r.json()["choices"][0]["message"]["content"].strip()
        print(f"  {OK} Azure OpenAI GPT-4.1-mini — '{reply[:80]}'")
        return True
    print(f"  {FAIL} Azure OpenAI — HTTP {r.status_code}: {r.text[:200]}")
    return False


async def test_azure_speech_token():
    if not AZURE_SPEECH_KEY or not AZURE_SPEECH_REGION:
        print(f"  {FAIL} Azure Speech — not configured")
        return False
    url = f"https://{AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken"
    headers = {"Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY}
    async with httpx.AsyncClient(timeout=8.0) as client:
        r = await client.post(url, headers=headers)
    if r.status_code == 200:
        print(f"  {OK} Azure Speech Token — obtained ({len(r.text)} chars)")
        return True
    print(f"  {FAIL} Azure Speech Token — HTTP {r.status_code}: {r.text[:120]}")
    return False


async def main():
    print("\n" + "="*60)
    print("  UNIVOICE SERVICE TEST — ALL LANGUAGES")
    print("="*60)

    print("\n[1] Sarvam TTS (bulbul:v3) — 8 languages")
    tts_tests = [
        ("hi-IN", "नमस्ते, आपकी फीस की जानकारी यहां है।", "Hindi"),
        ("en-IN", "Hello, here is your fee information.", "English"),
        ("ta-IN", "வணக்கம், இங்கே உங்கள் கட்டண தகவல் உள்ளது.", "Tamil"),
        ("te-IN", "నమస్కారం, మీ రుసుం సమాచారం ఇక్కడ ఉంది.", "Telugu"),
        ("mr-IN", "नमस्कार, येथे तुमची फी माहिती आहे.", "Marathi"),
        ("bn-IN", "নমস্কার, এখানে আপনার ফি তথ্য আছে।", "Bengali"),
        ("gu-IN", "નમસ્તે, અહીં તમારી ફી માહિતી છે.", "Gujarati"),
        ("kn-IN", "ನಮಸ್ಕಾರ, ಇಲ್ಲಿ ನಿಮ್ಮ ಶುಲ್ಕ ಮಾಹಿತಿ ಇದೆ.", "Kannada"),
    ]
    tts_pass = 0
    for lang, text, label in tts_tests:
        ok = await test_sarvam_tts(lang, text, label)
        if ok:
            tts_pass += 1

    print(f"\n  TTS: {tts_pass}/{len(tts_tests)} passed")

    print("\n[2] Sarvam STT (saaras:v3) — API reachability test")
    stt_tests = [("hi-IN", "Hindi"), ("en-IN", "English"), ("ta-IN", "Tamil")]
    stt_pass = 0
    for lang, label in stt_tests:
        ok = await test_sarvam_stt(lang, label)
        if ok:
            stt_pass += 1
    print(f"  STT: {stt_pass}/{len(stt_tests)} passed")

    print("\n[3] Azure OpenAI — GPT-4.1-mini")
    oai_ok = await test_azure_openai()

    print("\n[4] Azure Speech — Token Auth")
    speech_ok = await test_azure_speech_token()

    print("\n" + "="*60)
    total = tts_pass + stt_pass + int(oai_ok) + int(speech_ok)
    max_t = len(tts_tests) + len(stt_tests) + 2
    print(f"  FINAL: {total}/{max_t} services working")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
