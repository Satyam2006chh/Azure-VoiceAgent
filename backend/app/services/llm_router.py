import httpx
import json
import logging
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

async def route_query_with_llm(query: str) -> Dict[str, Any]:
    """
    Uses Azure OpenAI to determine if the query is in-scope for the university assistant
    and, if so, which tool to call.
    
    Returns a dict with:
    - is_in_scope: bool
    - tool_used: str (or None)
    - reasoning: str
    """
    
    if not settings.AZURE_OPENAI_API_KEY or not settings.AZURE_OPENAI_ENDPOINT:
        logger.warning("Azure OpenAI API Key or Endpoint not set. Falling back to default RAG tool.")
        return {
            "is_in_scope": True,
            "tool_used": "rag_university_ordinances",
            "reasoning": "Fallback due to missing credentials."
        }

    # Clean endpoint URL
    endpoint = settings.AZURE_OPENAI_ENDPOINT.rstrip('/')
    url = f"{endpoint}/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview"
    
    headers = {
        "Content-Type": "application/json",
        "api-key": settings.AZURE_OPENAI_API_KEY
    }
    
    system_prompt = """You are an intent router for a University Voice Assistant.
Your job is to read a user query (which can be in any language, including Hindi, English, Tamil, etc.) and classify it.

First, decide if the query is IN-SCOPE or OUT-OF-SCOPE.
IN-SCOPE queries are about the university: admissions, fees, library books, exam rules, faculty contacts, hostel rules, ranking, placements, or general academic rules.
OUT-OF-SCOPE queries are random general knowledge, weather, personal locations outside the university (e.g. "where is my house in Saharanpur"), movies, etc.

If IN-SCOPE, you MUST pick ONE of the following tools:
1. 'get_university_overview_and_ranking': For queries about university history, establishment, NIRF ranking, NAAC accreditation, campus area, general achievements.
2. 'check_library_status': For queries about library, books, availability, reading rooms, shelves.
3. 'find_faculty_contact': For queries about finding a professor, faculty, teacher, their cabin, or office hours.
4. 'check_fee_deadlines': For queries about fees, payment deadlines, late fees, penalties, tuition dues, admission fee details.
5. 'rag_university_ordinances': For deeper academic queries, rules, attendance policies, branch change rules, hostel rules, curfew, anti-ragging, exam passing criteria. Use this if the query is in-scope but doesn't perfectly fit tools 1-4.

Output valid JSON ONLY with the following schema:
{
    "is_in_scope": true/false,
    "tool_used": "tool_name" (or null if out of scope),
    "reasoning": "brief explanation"
}
"""

    payload = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        "temperature": 0.0,
        "response_format": {"type": "json_object"}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            return result
    except Exception as e:
        logger.error(f"Error calling Azure OpenAI for intent routing: {e}")
        # Graceful fallback
        return {
            "is_in_scope": True,
            "tool_used": "rag_university_ordinances",
            "reasoning": f"Fallback due to error: {e}"
        }
