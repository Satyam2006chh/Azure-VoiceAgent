"""
Azure OpenAI Service — GPT-4o-mini for Natural Multilingual Response Generation.
Generates grounded, student-friendly responses from tool data in the user's language.
"""

import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

UNIVERSITY_SYSTEM_PROMPT = """You are UniVoice — a friendly, expert University Voice Assistant for a top-ranked Indian university (NAAC A++ Grade, NIRF #12 Engineering 2025).

You help students, faculty, and visitors with:
- University overview, rankings, history, and campus info
- Library book availability and shelf locations  
- Faculty cabin locations, office hours, and emails
- Fee deadlines, amounts, late fee penalties, and payment portal
- Attendance rules, branch change, hostel policies (academic ordinances)

STRICT RULES:
1. Respond ONLY in the language specified in the instruction
2. Ground every response in the provided CONTEXT DATA — never invent facts
3. Be warm, concise, and student-friendly
4. Keep response to 2-3 sentences maximum (for voice playback)
5. If data is not in context, say so honestly and redirect to relevant office
6. Use simple language appropriate for speaking out loud
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
        f"Retrieved University Data (from tool: {tool_name}):\n{context_data}\n\n"
        f"Instruction: Respond to the student query in {lang_name} ({lang_native}) language only, written in its native script. "
        f"Be concise (2-3 sentences maximum, for spoken voice output) and warm. Ground answer strictly in the data above."
    )

    payload = {
        "messages": [
            {"role": "system", "content": UNIVERSITY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        "max_tokens": 280,
        "temperature": 0.5,
        "top_p": 0.9
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
