<div align="center">

<p align="center">
  <img src="public/univoice-logo.svg" alt="UniVoice Logo" width="100"/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/azure-logo.svg" alt="Microsoft Azure Logo" width="80"/>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/sarvam-logo.svg" alt="Sarvam AI Logo" width="165"/>
</p>

# 🎙️ UniVoice: Multilingual AI University Assistant
### **Enterprise-Grade Multilingual Voice & Knowledge Gateway for Chitkara University**

[![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg?style=for-the-badge)](#)
[![Microsoft Azure](https://img.shields.io/badge/Cloud-Microsoft_Azure_AI-0078D4.svg?style=for-the-badge&logo=microsoft-azure&logoColor=white)](#)
[![Sarvam AI](https://img.shields.io/badge/Speech-Sarvam_AI_v3-FF6B6B.svg?style=for-the-badge)](#)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Async-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![React Vite](https://img.shields.io/badge/Frontend-React_18_+_Vite-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](#)
[![Security](https://img.shields.io/badge/Auth-Email_OTP_+_JWT-8B5CF6.svg?style=for-the-badge)](#)

</div>

---

## 📖 Table of Contents
1. [Overview & Problem Statement](#-overview--problem-statement)
2. [End-to-End System Architecture](#-end-to-end-system-architecture)
3. [Key Capabilities & Modules](#-key-capabilities--modules)
4. [Cloud Services & Technology Stack](#-cloud-services--technology-stack)
5. [Admin Telemetry & User Audit Center](#-admin-telemetry--user-audit-center)
6. [Project File Structure](#-project-file-structure)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [Environment Configuration Reference](#-environment-configuration-reference)
9. [API Endpoints Reference](#-api-endpoints-reference)
10. [Engineering Team](#-engineering-team)

---

## 🎯 Overview & Problem Statement

Academic institutions release thousands of critical updates across ordinances, examination regulations, fee deadlines, hostel rules, and syllabus circulars. Traditional search systems fall short due to:
- **Scattered Information:** Documents stored across static PDF files with complex legal phrasing.
- **Language Barriers:** Non-English native speakers struggle to comprehend intricate academic clauses.
- **Access Control & Credit Drainage:** Open AI assistants often suffer from abuse and credit exhaustion without verification.

**UniVoice** solves this through a voice-first, multilingual RAG (Retrieval-Augmented Generation) assistant powered by **Microsoft Azure AI Search**, **Azure OpenAI (`gpt-4.1-mini`)**, and **Sarvam AI**, protected by an **Email OTP & Role-Based Quota Gateway**.

---

## 🏗️ End-to-End System Architecture

```
                    [ 🎙️ Student Speaks in Hindi / Punjabi / English ]
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ 1. Speech-to-Text (STT) Layer                    │
                  │ • Primary: Sarvam AI (saaras:v3)                 │
                  │ • Fallback: Azure AI Speech Neural STT           │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ 2. Identity Shield & Security Gateway            │
                  │ • Real Email 6-Digit OTP via Gmail SMTP          │
                  │ • Role Detection (Chitkara Student vs Visitor)   │
                  │ • Roll No. & Batch Year Extraction from Email    │
                  │ • Cryptographic JWT Bearer Token (HS256)         │
                  │ • Daily Quota Limiter (20 Student / 5 Visitor)   │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │ 3. LLM Intent & Tool Calling Router              │
                  │ • Azure OpenAI (GPT-4.1-mini)                    │
                  │ • Routes to RAG, ERP Actions, or Guardrail       │
                  └─────────────┬────────────────────────┬───────────┘
                                │                        │
         [ Academic / Circular Query ]             [ Out-of-Scope Query ]
                                │                        │
                                ▼                        ▼
┌────────────────────────────────────────┐  ┌───────────────────────────────────┐
│ 4. RAG Knowledge Base Retrieval        │  │ 5. Guardrail & Security Audit     │
│ • Microsoft Azure AI Search            │  │ • Filters non-academic prompts    │
│ • Vector + Semantic Hybrid Re-ranking  │  │ • Logs malicious attempts to      │
│ • Dynamic PDF Circular Indexer Tool    │  │   Admin Audit Store               │
└──────────────────────┬─────────────────┘  └─────────────────┬─────────────────┘
                       │                                      │
                       └───────────────────┬──────────────────┘
                                           │
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │ 6. Neural Voice Synthesis (TTS)                  │
                  │ • Sarvam AI (bulbul:v3)                          │
                  │ • Azure AI Speech Neural High-Fidelity Voices    │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                      [ 🔊 Grounded Voice Response with Citations ]
```

---

## 🚀 Key Capabilities & Modules

### 1. 🎙️ Multilingual Voice Engine
- Supports **10+ Indian Languages**: Hindi, Punjabi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, and Hinglish.
- Natural speech synthesis responding in the exact dialect spoken by the user.

### 2. 🔐 Real Email OTP & Identity Gateway
- Dispatches a branded 6-digit verification code directly to user inboxes using **Gmail SMTP**.
- Automatically identifies verified university accounts (`@chitkara.edu.in`).
- Dynamically extracts metadata:
  - `satyam3396.beai24@chitkara.edu.in` ➔ **Roll No:** `3396`, **Branch:** `BEAI24`, **Batch:** `2024`.

### 3. 🛡️ Daily Quotas & Rate Limiting
- **Verified Students:** 20 voice queries/day with full ordinance access.
- **Campus Visitors:** 5 voice queries/day for general campus and admissions FAQs.
- Automatic daily quota reset at midnight (`00:00 UTC`).

### 4. 📚 Azure AI Search & Live PDF Indexer
- Indexes university ordinances, grade rules, and detention policies into **Azure AI Search**.
- Hybrid Vector Search + Semantic Re-ranking guarantees **zero hallucinations** with exact circular citations.
- Admin PDF Upload: Admins can upload new circulars which get chunked, embedded, and indexed immediately.

---

## 📊 Admin Telemetry & User Audit Center

Accessible at `http://localhost:5173/#/admin` (Default: `admin@gmail.com` / `admin123`):

- **Live Service Health Monitor:** Real-time health status for Azure OpenAI, Azure Search, Azure Speech, and Sarvam AI.
- **Date-wise Usage Breakdown:** Comprehensive daily query logs and multi-service consumption trends.
- **User Directory & Filter Engine:**
  - **Live Search Filter:** Search users by email, name, or roll number in real time.
  - **Filter Categories:** Filter by `All Users`, `🎓 Students`, `🌐 Visitors`, or `⚠️ Flagged`.
  - **Security Flags:** Highlights users attempting out-of-scope or exam-cheating queries.
- **Session Persistence:** Remembers admin session across hard page refreshes (`Ctrl+F5`).

---

## 🛠️ Cloud Services & Technology Stack

| Layer | Service / Model | Role |
| :--- | :--- | :--- |
| **Reasoning Engine** | Microsoft Azure OpenAI (`gpt-4.1-mini`) | Language understanding, intent routing, and tool execution |
| **Vector & Semantic Search** | Microsoft Azure AI Search | Sub-second RAG retrieval over university rulebooks |
| **Speech-to-Text (STT)** | Sarvam AI (`saaras:v3`) + Azure Speech | Ultra-fast regional Indian speech transcription |
| **Text-to-Speech (TTS)** | Sarvam AI (`bulbul:v3`) + Azure Speech | Localized neural voice audio generation |
| **Email Gateway** | Gmail SMTP / Azure Communication Services | Real-time OTP security verification emails |
| **Backend API** | FastAPI + Python 3.10+ (Asyncio HTTPX) | Token management, quota limiter, telemetry, and endpoints |
| **Frontend UI** | React.js (Vite) + Vanilla CSS | Dark theme glassmorphism design system with Google Font *Jost* |

---

## 📁 Project File Structure

```
AI-Powered-Voice-University-Assistant/
├── backend/
│   ├── app/
│   │   ├── config.py              # Environment variables & configuration
│   │   ├── telemetry.py           # Daily breakdown & service call telemetry
│   │   ├── main.py                # FastAPI app initialization & CORS
│   │   ├── routers/
│   │   │   ├── admin.py           # Admin stats, user audit, PDF manager
│   │   │   ├── auth.py            # OTP dispatch, verify, login, JWT
│   │   │   └── voice.py           # Audio processing, STT/TTS, RAG routing
│   │   └── services/
│   │       ├── email_service.py   # Branded HTML email dispatcher (SMTP)
│   │       ├── user_service.py    # User store, roll number parsing, quota
│   │       ├── pdf_indexer.py     # PDF chunking, embedding, Azure Search
│   │       ├── sarvam_service.py  # Sarvam STT & TTS integration
│   │       └── azure_service.py   # Azure OpenAI, Azure Speech, Azure Search
│   ├── run.py                     # Backend server entry point (Port 8000)
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # Cloud API keys & credentials
├── public/
│   ├── univoice-logo.svg          # High-resolution UniVoice Project Logo
│   └── favicon.svg                # Browser favicon
├── src/
│   ├── components/
│   │   ├── assistant/             # VoiceController, ChatHistory, AudioWaveform
│   │   ├── common/                # AuthModal (OTP & Login), CitationModal
│   │   └── layout/                # Navbar, Footer
│   ├── pages/
│   │   ├── AboutPage.jsx          # Overview & project vision
│   │   ├── AssistantPage.jsx      # Voice conversation interface
│   │   ├── ArchitecturePage.jsx   # Interactive technical blueprint simulator
│   │   ├── TechnologyPage.jsx     # Azure & Sarvam AI stack showcase
│   │   ├── TeamPage.jsx           # Engineering team credits
│   │   └── AdminPage.jsx          # Admin analytics, PDF manager & user audit
│   ├── context/
│   │   └── AppContext.jsx         # Global state (auth, voice, route, quotas)
│   ├── index.css                  # Global design system & Jost font styles
│   └── App.jsx                    # Root component & view router
├── package.json                   # Frontend dependencies
└── vite.config.js                 # Vite configuration with /api backend proxy
```

---

## ⚡ Installation & Setup Guide

### 1. Prerequisites
- **Node.js:** v18.0 or higher
- **Python:** v3.10, v3.11, or v3.12
- Active **Microsoft Azure** and **Sarvam AI** subscriptions

---

### 2. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Configure your .env file (see reference below)

# 5. Start the backend server
python run.py
```
> Server runs on `http://localhost:8000`. Interactive Swagger API docs at `http://localhost:8000/docs`.

---

### 3. Frontend Setup

```bash
# 1. From the project root directory
npm install

# 2. Launch the development server
npm run dev
```
> Application runs on `http://localhost:5173`.

---

## 🔑 Environment Configuration Reference (`backend/.env`)

```env
# ===== SARVAM AI (STT & TTS) =====
SARVAM_API_KEY=your_sarvam_api_key
SARVAM_STT_MODEL=saaras:v3
SARVAM_TTS_MODEL=bulbul:v3

# ===== AZURE OPENAI (GPT-4.1-mini) =====
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.services.ai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-mini

# ===== AZURE AI SEARCH =====
AZURE_SEARCH_API_KEY=your_azure_search_key
AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_INDEX_NAME=university-rulebook

# ===== AZURE AI SPEECH =====
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=koreacentral

# ===== SERVER =====
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# ===== EMAIL OTP (GMAIL SMTP) =====
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_character_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME=UniVoice Assistant

# ===== JWT AUTH & QUOTA =====
JWT_SECRET=univoice-secure-jwt-key-2026
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=72
STUDENT_DAILY_QUOTA=20
VISITOR_DAILY_QUOTA=5
```

---

## 📡 API Endpoints Reference

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/voice/process-audio` | Accepts voice audio, performs STT ➔ RAG ➔ TTS | `Bearer JWT` |
| `POST` | `/api/auth/send-otp` | Sends 6-digit OTP code to user's real email inbox | Public |
| `POST` | `/api/auth/verify-otp` | Verifies OTP and generates signed JWT token | Public |
| `POST` | `/api/auth/login` | Email + password login for existing accounts | Public |
| `GET` | `/api/auth/me` | Fetches current user profile and remaining daily quota | `Bearer JWT` |
| `POST` | `/api/admin/login` | Validates administrator credentials | Public |
| `GET` | `/api/admin/stats` | Returns total queries, today queries, and tool hits | `X-Admin-Token` |
| `GET` | `/api/admin/users` | Lists registered users, roll numbers, and audit counts | `X-Admin-Token` |
| `POST` | `/api/admin/upload-pdf` | Indexes a new PDF circular into Azure AI Search | `X-Admin-Token` |
| `GET` | `/api/admin/service-health` | Live operational health check for Azure & Sarvam | `X-Admin-Token` |

---

## 👥 Engineering Team

**Department of Computer Science & Engineering**  
*Chitkara University | Capstone Project 2025–2026*

- **Ramandeep Bansal**
- **Satyam Chhabra**
- **Sukritti Singla**
- **Simran**

---

<div align="center">
<b>UniVoice</b> · Engineered with Microsoft Azure Cloud & Sarvam AI · Built for Chitkara University
</div>
