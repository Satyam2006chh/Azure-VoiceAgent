import os
import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("AZURE_SPEECH_KEY")
region = os.getenv("AZURE_SPEECH_REGION")

if not key or not region:
    print("No key/region found")
    exit(1)

speech_config = speechsdk.SpeechConfig(subscription=key, region=region)
synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)

result = synthesizer.get_voices_async().get()
if result.reason == speechsdk.ResultReason.VoicesListRetrieved:
    for voice in result.voices:
        if voice.locale.endswith("-IN"):
            print(f"Locale: {voice.locale}, Name: {voice.name}, Gender: {voice.gender.name}")
else:
    print(f"Error: {result.error_details}")
