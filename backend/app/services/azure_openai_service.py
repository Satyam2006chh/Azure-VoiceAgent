"""
Azure OpenAI Service — GPT-4o-mini for Natural Multilingual Response Generation.
Generates grounded, student-friendly responses from tool data in the user's language.
"""

import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

UNIVERSITY_SYSTEM_PROMPT = """You are UniVoice — a University Voice Assistant for a top-ranked Indian university (NAAC A++ Grade, NIRF #12 Engineering 2025).

You help students with university information: rankings, library books, faculty contacts, fee deadlines, and academic ordinances (attendance, hostel, branch change, exam rules).

════════════════════════════════════════
ANTI-HALLUCINATION RULES — FOLLOW EXACTLY
════════════════════════════════════════

RULE 1 — NUMBERS AND TIMES:
Every number, time, percentage, date, or amount you state MUST appear VERBATIM in the CONTEXT DATA below.
If you cannot find the exact value in the context, DO NOT guess or approximate it.
Say: "I could not find that specific detail in the official documents — please contact the relevant office."

RULE 2 — STRICT GROUNDING:
Do not use any knowledge from your training data.
Your ONLY source of truth is the CONTEXT DATA provided in each message.
If the context does not contain the answer, admit it honestly.

RULE 3 — LANGUAGE:
Respond ONLY in the language specified in the instruction, in its native script.

RULE 4 — BREVITY:
Keep your response to 2–3 sentences (optimised for voice playback).

RULE 5 — UNCERTAINTY:
If you are even slightly unsure about a specific value, say so and recommend the student verify directly with the relevant office or warden.
"""

async def generate_azure_openai_response(
    query: str,
    language_code: str,
    context_data: str,
    tool_name: str
) -> Optional[str]:
    """
    Calls Azure OpenAI GPT-4o-mini to generate a grounded, multilingual response.
    Returns None if Azure OpenAI is unavailable — caller uses hardcoded fallback.
    """
    if not settings.AZURE_OPENAI_API_KEY or not settings.AZURE_OPENAI_ENDPOINT:
        logger.warning("Azure OpenAI not configured — using hardcoded fallback")
        return None

    lang_info = settings.get_language_info(language_code)
    lang_name = lang_info.get("name", "English (India)")
    lang_native = lang_info.get("native", "")

    url = (
        f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}"
        f"/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}"
        f"/chat/completions?api-version=2024-08-01-preview"
    )

    headers = {
        "api-key": settings.AZURE_OPENAI_API_KEY,
        "Content-Type": "application/json"
    }

    user_message = (
        f"Student Query: {query}\n\n"
        f"════ CONTEXT DATA (tool: {tool_name}) ════\n"
        f"{context_data}\n"
        f"════════════════════════════════════════\n\n"
        f"Instruction: Answer the student query in {lang_name} ({lang_native}) language only, written in native script.\n"
        f"CRITICAL: Every time, date, number, or percentage you mention MUST be copied VERBATIM from the CONTEXT DATA above.\n"
        f"If the exact value is NOT present in the context, say: 'I could not find that exact detail in the official documents — please contact the relevant office directly.'\n"
        f"Keep your answer to 2-3 sentences for voice output."
    )

    payload = {
        "messages": [
            {"role": "system", "content": UNIVERSITY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 350,
        "temperature": 0.0,
        "top_p": 1.0
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                result = response.json()
                ai_text = result["choices"][0]["message"]["content"].strip()
                logger.info(f"Azure OpenAI response generated ({len(ai_text)} chars)")
                return ai_text
            else:
                logger.warning(f"Azure OpenAI HTTP {response.status_code}: {response.text[:200]}")
                return None
    except Exception as ex:
        logger.error(f"Azure OpenAI exception: {str(ex)}")
        return None
