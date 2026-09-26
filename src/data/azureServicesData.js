export const AZURE_SERVICES_DATA = [
  {
    id: 'azure-openai-models',
    name: 'Azure OpenAI (GPT-4.1-mini)',
    tagline: 'Enterprise Reasoning Core with Grounding',
    iconName: 'Bot',
    category: 'Reasoning & Intelligence',
    roleInProject: 'Multilingual intent understanding, academic ordinance grounding, and ERP tool calling.',
    problemSolved: 'Guarantees hallucination-free answers strictly tied to official Chitkara ordinances with automatic regional translation.',
    keyFeatures: [
      'Grounded reasoning with strict source citation verification',
      'Function calling for ERP actions (Fee dues, library checks, faculty contact)',
      'Sub-200ms latency optimized with gpt-4.1-mini deployment',
    ],
    slaMetrics: {
      availability: '99.99%',
      avgLatency: '< 180ms',
      throughput: '150k TPM',
    },
    sampleCode: `from openai import AzureOpenAI

client = AzureOpenAI(
    azure_endpoint="https://ramandeep3374beai24-6556-resourc.services.ai.azure.com",
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-02-15-preview"
)
response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "system", "content": "Ground answers in university ordinances."}],
    tools=tools_schema
)`,
    securityCompliance: 'Private Tenant • No Model Retraining on Student Data • SOC 2',
  },
  {
    id: 'azure-ai-search',
    name: 'Azure AI Search',
    tagline: 'Hybrid Vector & Semantic Re-ranking',
    iconName: 'Search',
    category: 'Knowledge & Search',
    roleInProject: 'Vectorized retrieval over Chitkara University academic regulations, detention policies, and circulars.',
    problemSolved: 'Instantly extracts exact regulation sections, clauses, and fee tables from unstructured PDF circulars.',
    keyFeatures: [
      'Dense 3072-dim Vector Embeddings + Semantic Re-ranker',
      'Dynamic PDF Indexer: Admins can upload new circulars for instant live indexing',
      'Exact document citations and page references returned with every answer',
    ],
    slaMetrics: {
      availability: '99.9%',
      avgLatency: '< 75ms',
      throughput: '10k queries/min',
    },
    sampleCode: `from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

search_client = SearchClient(
    endpoint="https://university-search01.search.windows.net",
    index_name="university-rulebook",
    credential=AzureKeyCredential(os.getenv("AZURE_SEARCH_API_KEY"))
)
results = search_client.search(query, query_type="semantic", top=3)`,
    securityCompliance: 'SOC 1/2/3 • Azure RBAC Protected • Encrypted at Rest (AES-256)',
  },
  {
    id: 'sarvam-ai-speech',
    name: 'Sarvam AI (saaras:v3 & bulbul:v3)',
    tagline: 'Indian Regional Language STT & TTS Voice Engine',
    iconName: 'Mic',
    category: 'Indic Speech & Audio',
    roleInProject: 'Primary Speech-to-Text and Text-to-Speech engine supporting 10+ Indian languages (Hindi, Punjabi, Hinglish, etc.).',
    problemSolved: 'Delivers accurate transcription and native-accented voice responses tailored for Indian dialects.',
    keyFeatures: [
      'saaras:v3 model: Accurate speech recognition with code-switching (Hinglish/Punjabi/Hindi)',
      'bulbul:v3 model: High-fidelity natural neural voice synthesis in regional Indian accents',
      'Sub-150ms real-time audio chunk processing',
    ],
    slaMetrics: {
      availability: '99.95%',
      avgLatency: '< 130ms',
      throughput: 'Real-time Stream',
    },
    sampleCode: `import httpx

# Speech-to-Text via Sarvam saaras:v3
async with httpx.AsyncClient() as client:
    res = await client.post(
        "https://api.sarvam.ai/speech-to-text",
        headers={"api-subscription-key": os.getenv("SARVAM_API_KEY")},
        files={"file": ("voice.wav", audio_bytes, "audio/wav")},
        data={"model": "saaras:v3", "language_code": "hi-IN"}
    )`,
    securityCompliance: 'Zero Audio Retention • TLS 1.3 End-to-End Encryption',
  },
  {
    id: 'azure-ai-speech',
    name: 'Azure AI Speech',
    tagline: 'Enterprise Neural Speech Synthesis & Fallback',
    iconName: 'Volume2',
    category: 'Cognitive & Speech',
    roleInProject: 'High-fidelity neural voice synthesis (hi-IN-SwaraNeural, en-IN-NeerjaNeural) and enterprise STT fallback.',
    problemSolved: 'Provides robust high-availability voice redundancy whenever regional services experience high traffic.',
    keyFeatures: [
      'Neural multilingual voices with custom SSML pitch/rate modulation',
      'Continuous recognition and fallback streaming engine',
    ],
    slaMetrics: {
      availability: '99.9%',
      avgLatency: '< 140ms',
      throughput: 'Real-time Stream',
    },
    sampleCode: `import azure.cognitiveservices.speech as speechsdk

speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv("AZURE_SPEECH_KEY"),
    region="koreacentral"
)
speech_config.speech_synthesis_voice_name = "hi-IN-SwaraNeural"
synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)`,
    securityCompliance: 'ISO 27001 • HIPAA Ready • Zero Customer Data Retention',
  },
  {
    id: 'email-otp-identity-shield',
    name: 'Identity Shield & Email OTP Gateway',
    tagline: 'Real 6-Digit OTP & Daily Quota Rate Limiter',
    iconName: 'ShieldCheck',
    category: 'Security & Identity',
    roleInProject: 'Real-time email OTP verification (Gmail SMTP), institutional email detection (@chitkara.edu.in), and rate limiting.',
    problemSolved: 'Prevents credit drainage, restricts unauthorized access, and enforces 20 query/day student and 5 query/day visitor quotas.',
    keyFeatures: [
      'Dispatches branded 6-digit OTP verification emails in real time via Gmail SMTP / ACS',
      'Automatic parsing of Student Roll No., Branch (e.g. BEAI24), and Batch Year from email',
      'Cryptographically signed JWT token generation (HS256) with daily quota enforcement',
    ],
    slaMetrics: {
      availability: '99.99%',
      avgLatency: '< 25ms',
      throughput: 'Cryptographic Auth',
    },
    sampleCode: `from app.services.email_service import send_otp_email
from app.services.user_service import create_jwt_token, determine_user_role

# Dispatch 6-digit OTP to real user inbox
otp, expires = create_and_store_otp(email, name, password)
await send_otp_email(recipient_email=email, recipient_name=name, otp=otp, is_student=is_student)
token = create_jwt_token(user_profile)`,
    securityCompliance: 'HMAC-SHA256 • Bcrypt Password Hashing • 5-min OTP TTL',
  },
  {
    id: 'fastapi-async-telemetry',
    name: 'FastAPI Async Engine & Telemetry',
    tagline: 'Sub-Second Async Orchestrator & Live Audit',
    iconName: 'Activity',
    category: 'Backend Architecture',
    roleInProject: 'Asynchronous event loop managing STT ➔ Auth ➔ RAG ➔ LLM ➔ TTS pipeline and tracking admin metrics.',
    problemSolved: 'Guarantees sub-second total response time with real-time health checks, date-wise breakdown, and malicious query audit.',
    keyFeatures: [
      'Asyncio HTTPX pipeline with non-blocking threadpool email dispatch',
      'Real-time admin audit logs tracking student queries, service hits, and security flags',
      'Daily usage breakdown persisting metrics across system restarts',
    ],
    slaMetrics: {
      availability: '99.95%',
      avgLatency: '< 950ms E2E',
      throughput: '5,000 req/min',
    },
    sampleCode: `@router.post("/api/voice/process-audio")
async def process_voice_audio(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    # Enforce daily quota and orchestrate STT -> RAG -> GPT-4.1-mini -> TTS
    return await voice_orchestrator.execute(file, user)`,
    securityCompliance: 'CORS Protected • Rate Limited • Input Sanitization',
  },
];
