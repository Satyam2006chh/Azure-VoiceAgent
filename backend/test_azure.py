import asyncio, base64
from app.services.azure_speech_service import synthesize_speech_azure

async def main():
    b64, t = await synthesize_speech_azure('नमस्ते! मैं अज़ूर एआई स्पीच असिस्टेंट हूँ। यह मेरी पुरुष आवाज़ है।', 'hi-IN')
    with open('C:/Users/ASUS/.gemini/antigravity-ide/brain/542d444c-0c03-4f39-af0b-f46f6c45da12/scratch/azure_audio_hindi_male.wav', 'wb') as f:
        f.write(base64.b64decode(b64))
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
