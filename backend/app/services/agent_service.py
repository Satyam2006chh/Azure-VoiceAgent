"""
University Agent Orchestrator & Multilingual Grounding Engine.
Orchestrates Intent Guardrails, Dynamic Tools, RAG Ordinances, and Speech Services.
"""

import time
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.services.intent_guardrail import GUARDRAIL_RESPONSES
from app.services.llm_router import route_query_with_llm
from app.services.rag_service import search_university_ordinances
from app.services.sarvam_service import synthesize_speech_sarvam
from app.services.azure_speech_service import synthesize_speech_azure
from app.services.azure_openai_service import generate_azure_openai_response
from app import telemetry
from app.tools.university_tools import (
    get_university_overview_and_ranking,
    check_library_status,
    find_faculty_contact,
    check_fee_deadlines
)

logger = logging.getLogger(__name__)

async def translate_query_to_english(query: str, lang_code: str) -> str:
    """
    Translates a non-English query to English using Azure OpenAI.
    This ensures RAG retrieval (Azure AI Search) always works on English text
    for maximum accuracy, while the response is still generated in the user's language.
    If translation fails or lang is already English, returns the original query.
    """
    if lang_code == "en-IN" or not query.strip():
        return query
    
    if not settings.AZURE_OPENAI_API_KEY or not settings.AZURE_OPENAI_ENDPOINT:
        return query  # fallback: use original query
    
    url = (
        f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}"
        f"/openai/deployments/{settings.AZURE_OPENAI_DEPLOYMENT}"
        f"/chat/completions?api-version=2024-08-01-preview"
    )
    headers = {"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"}
    payload = {
        "messages": [
            {"role": "system", "content": (
                "You are a precise translator. Translate the user query to English. "
                "Output ONLY the English translation — no explanations, no punctuation changes. "
                "If the input is already in English, return it as-is."
            )},
            {"role": "user", "content": query}
        ],
        "max_tokens": 100,
        "temperature": 0.0
    }
    try:
        import httpx
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(url, headers=headers, json=payload)
            if r.status_code == 200:
                translated = r.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"Translated query [{lang_code}]: '{query}' -> '{translated}'")
                return translated
    except Exception as ex:
        logger.warning(f"Query translation failed: {ex}")
    return query  # fallback to original


async def synthesize_speech_dual(
    text: str,
    canonical_lang: str,
    provider: str = "sarvam"
):
    """
    Dual-engine speech synthesis:
    Tries Sarvam AI first; if it returns no audio or fails, automatically falls back to Azure AI Speech.
    """
    if provider == "azure":
        try:
            audio_base64, tts_telemetry = await synthesize_speech_azure(text, canonical_lang)
            return audio_base64, tts_telemetry
        except Exception as e:
            logger.error(f"Azure Speech TTS attempt failed: {e}")
            return None, {"provider": "Dual TTS", "status": "failed", "error": str(e)}

    # 1. Try Sarvam AI first
    try:
        audio_base64, tts_telemetry = await synthesize_speech_sarvam(text, canonical_lang)
        if audio_base64:
            return audio_base64, tts_telemetry
    except Exception as e:
        logger.warning(f"Sarvam TTS attempt failed: {e}")
        
    logger.info("Sarvam TTS unavailable/empty, falling back to Azure AI Speech Neural TTS")
    # 2. Fallback to Azure Neural Speech
    try:
        audio_base64, tts_telemetry = await synthesize_speech_azure(text, canonical_lang)
        return audio_base64, tts_telemetry
    except Exception as e:
        logger.error(f"Azure Speech TTS attempt failed: {e}")
        return None, {"provider": "Dual TTS", "status": "failed", "error": str(e)}

async def synthesize_speech_by_provider(
    text: str,
    canonical_lang: str,
    provider: str = "sarvam"
):
    """
    Provider-selective speech synthesis.
    If provider is 'azure', use Azure Neural TTS with male voices.
    If provider is 'sarvam', use Sarvam AI TTS.
    Falls back to dual engine if the chosen provider fails.
    """
    if provider == "azure":
        logger.info(f"Using Azure AI Speech TTS (provider=azure) for lang={canonical_lang}")
        try:
            audio_base64, tts_telemetry = await synthesize_speech_azure(text, canonical_lang)
            if audio_base64:
                telemetry.record_service_call("azure_speech_tts")
                return audio_base64, {**tts_telemetry, "selected_provider": "azure"}
        except Exception as e:
            logger.warning(f"Azure TTS failed, falling back to Sarvam: {e}")
        # Fallback to Sarvam if Azure fails
        audio_base64, tts_telemetry = await synthesize_speech_sarvam(text, canonical_lang)
        if audio_base64:
            telemetry.record_service_call("sarvam_tts")
        return audio_base64, {**tts_telemetry, "selected_provider": "azure", "fallback": "sarvam"}
    else:
        logger.info(f"Using Sarvam AI TTS (provider=sarvam) for lang={canonical_lang}")
        try:
            audio_base64, tts_telemetry = await synthesize_speech_sarvam(text, canonical_lang)
            if audio_base64:
                telemetry.record_service_call("sarvam_tts")
                return audio_base64, {**tts_telemetry, "selected_provider": "sarvam"}
        except Exception as e:
            logger.warning(f"Sarvam TTS failed, falling back to Azure: {e}")
        # Fallback to Azure if Sarvam fails
        audio_base64, tts_telemetry = await synthesize_speech_azure(text, canonical_lang)
        if audio_base64:
            telemetry.record_service_call("azure_speech_tts")
        return audio_base64, {**tts_telemetry, "selected_provider": "sarvam", "fallback": "azure"}

async def process_user_query(
    query_text: str,
    language_code: str = "hi-IN",
    user_role: str = "student",
    generate_audio: bool = True,
    provider: str = "sarvam"
) -> Dict[str, Any]:
    """
    Full pipeline processing:
    1. Canonical Language Resolution
    2. LLM Intent & Tool Routing (Dynamic Azure OpenAI Call)
    3. Tool / RAG Execution
    4. Multilingual Response Formulation (Azure OpenAI GPT-4.1-mini)
    5. Provider-Selective Speech Synthesis (Sarvam bulbul:v3 OR Azure Neural Speech)
    tts_provider: 'sarvam' | 'azure' — selects which TTS engine to use
    """
    start_time = time.time()
    q_lower = query_text.lower().strip()
    canonical_lang = settings.normalize_language_code(language_code)
    
    # -------------------------------------------------------------
    # Step 1: LLM Intent Classification & Routing
    # -------------------------------------------------------------
    llm_decision = await route_query_with_llm(query_text)
    is_in_scope = llm_decision.get("is_in_scope", True)
    tool_used = llm_decision.get("tool_used", "rag_university_ordinances")
    guardrail_telemetry = {"llm_reasoning": llm_decision.get("reasoning", "")}
    
    # -------------------------------------------------------------
    # Step 2: Handle Out Of Scope
    # -------------------------------------------------------------
    if not is_in_scope:
        redirect_msg = GUARDRAIL_RESPONSES.get(canonical_lang, GUARDRAIL_RESPONSES["hi-IN"])
        
        audio_base64 = None
        tts_telemetry = {}
        if generate_audio:
            audio_base64, tts_telemetry = await synthesize_speech_by_provider(redirect_msg, canonical_lang, provider)
            
        telemetry.record_service_call("azure_openai")
        telemetry.record_query(tool_used="out_of_scope", is_out_of_scope=True)
        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            "status": "success",
            "query": query_text,
            "language": canonical_lang,
            "response_text": redirect_msg,
            "audio_base64": audio_base64,
            "intent_route": "OUT_OF_SCOPE_GUARDRAIL",
            "is_out_of_scope": True,
            "tool_used": None,
            "citations": [],
            "telemetry": {
                "total_latency_ms": elapsed_ms,
                "guardrail": guardrail_telemetry,
                "tts": tts_telemetry
            }
        }

    # -------------------------------------------------------------
    # Step 3: Tool Execution & Grounded Multilingual Formulation
    # -------------------------------------------------------------
    citations = []
    response_text = ""
    tool_context_str = ""
    
    if tool_used == "get_university_overview_and_ranking":
        tool_data = get_university_overview_and_ranking(q_lower)
        tool_context_str = json.dumps(tool_data, ensure_ascii=False)
        
        citations.append({
            "source_type": "Live University Directory & NIRF 2025 Gazette",
            "reference_id": "AITU-PUB-2025-01",
            "title": "University Institutional Ranking & Accreditation Portfolio",
            "section": "General Profile & NIRF Report"
        })
        
        # 1. Try dynamic generation with Azure OpenAI in user's target language
        response_text = await generate_azure_openai_response(
            query=query_text,
            language_code=canonical_lang,
            context_data=tool_context_str,
            tool_name=tool_used
        )
        
        # 2. Pre-baked fallback templates if OpenAI offline
        if not response_text:
            name = tool_data.get('name', 'The University')
            est = tool_data.get('established', 1985)
            if canonical_lang == "hi-IN":
                response_text = (
                    f"{name} की स्थापना वर्ष {est} में हुई थी। "
                    f"यूनिवर्सिटी NAAC A++ (Score 3.82) मान्यता प्राप्त है और NIRF Engineering 2025 में भारत में 12वीं रैंक पर है। "
                    f"यह 250 एकड़ के स्मार्ट ग्रीन कैंपस में स्थित है जिसमें 12 सेंटर ऑफ एक्सीलेंस और 94.8% प्लेसमेंट रिकॉर्ड है।"
                )
            elif canonical_lang == "ta-IN":
                response_text = (
                    f"{name} {est} ஆம் ஆண்டு நிறுவப்பட்டது. "
                    f"NAAC A++ அங்கீகாரம் பெற்றுள்ளது மற்றும் NIRF Engineering 2025 இல் 12வது இடத்தில் உள்ளது. "
                    f"250 ஏக்கர் பரப்பளவிலான ஸ்மார்ட் வளாகத்தில் 94.8% வேலைவாய்ப்பு பதிவு உள்ளது."
                )
            elif canonical_lang == "te-IN":
                response_text = (
                    f"{name} {est} లో స్థాపించబడింది. "
                    f"NAAC A++ గుర్తింపు మరియు NIRF 2025 లో 12వ ర్యాంక్ కలిగి ఉంది. "
                    f"250 ఎకరాల క్యాంపస్‌లో 94.8% ప్లేస్‌మెంట్ రికార్డ్ ఉంది."
                )
            else:
                response_text = (
                    f"{name} was established in {est}. "
                    f"It holds NAAC Grade A++ accreditation and is ranked #12 in India by NIRF Engineering 2025. "
                    f"The 250-acre smart green campus houses 12 Centers of Excellence with a 94.8% placement record."
                )

    elif tool_used == "check_library_status":
        tool_data = check_library_status(q_lower)
        tool_context_str = json.dumps(tool_data, ensure_ascii=False)
        
        citations.append({
            "source_type": "Central Library ILMS Database",
            "reference_id": "LIB-OPAC-LIVE",
            "title": "Central Library Online Public Access Catalog (OPAC)",
            "section": "Stack Management System"
        })
        
        response_text = await generate_azure_openai_response(
            query=query_text,
            language_code=canonical_lang,
            context_data=tool_context_str,
            tool_name=tool_used
        )
        
        if not response_text:
            if tool_data.get("status") == "found":
                b = tool_data["books"][0]
                if canonical_lang == "hi-IN":
                    response_text = (
                        f"पुस्तकालय में '{b['title']}' की कुल {b['available_copies']} प्रतियां उपलब्ध हैं। "
                        f"यह पुस्तक {b['floor']}, {b['shelf_location']} पर रखी गई है।"
                    )
                elif canonical_lang == "ta-IN":
                    response_text = (
                        f"நூலகத்தில் '{b['title']}' புத்தகத்தின் {b['available_copies']} பிரதிகள் உள்ளன. "
                        f"இது {b['floor']}, {b['shelf_location']} இல் வைக்கப்பட்டுள்ளது."
                    )
                else:
                    response_text = (
                        f"'{b['title']}' has {b['available_copies']} physical copies available in the Central Library at {b['floor']}, {b['shelf_location']}."
                    )
            else:
                if canonical_lang == "hi-IN":
                    response_text = "माफ़ कीजिए, कैटलॉग में यह पुस्तक सीधे नहीं मिली। आप लाइब्रेरी काउंटर पर संपर्क कर सकते हैं।"
                elif canonical_lang == "ta-IN":
                    response_text = "மன்னிக்கவும், அந்த புத்தகம் உடனடியாக கிடைக்கவில்லை. நூலக கவுண்டரில் சரிபார்க்கவும்."
                else:
                    response_text = "Sorry, that specific title was not found in the instant catalog. Please check at the Central Circulation Desk."

    elif tool_used == "find_faculty_contact":
        tool_data = find_faculty_contact(name=query_text)
        tool_context_str = json.dumps(tool_data, ensure_ascii=False)
        
        fac = tool_data["faculty_list"][0]
        citations.append({
            "source_type": "University ERP Staff Directory",
            "reference_id": "HR-FAC-2025",
            "title": "Academic Staff & Faculty Workload Directory",
            "section": fac["department"]
        })
        
        response_text = await generate_azure_openai_response(
            query=query_text,
            language_code=canonical_lang,
            context_data=tool_context_str,
            tool_name=tool_used
        )
        
        if not response_text:
            if canonical_lang == "hi-IN":
                response_text = (
                    f"{fac['name']} ({fac['designation']}, {fac['department']}) का केबिन {fac['cabin_location']} में है। "
                    f"उनसे मिलने का समय: {fac['office_hours']} है। ईमेल: {fac['email']}."
                )
            elif canonical_lang == "ta-IN":
                response_text = (
                    f"{fac['name']} ({fac['department']}) அறை {fac['cabin_location']} இல் உள்ளது. "
                    f"சந்திப்பு நேரம்: {fac['office_hours']}. மின்னஞ்சல்: {fac['email']}."
                )
            else:
                response_text = (
                    f"{fac['name']} ({fac['designation']}, {fac['department']}) is located at {fac['cabin_location']}. "
                    f"Office hours: {fac['office_hours']}. Email: {fac['email']}."
                )

    elif tool_used == "check_fee_deadlines":
        tool_data = check_fee_deadlines(semester=6)
        tool_context_str = json.dumps(tool_data, ensure_ascii=False)
        fee = tool_data["fee_details"]
        
        citations.append({
            "source_type": "Finance & Accounts Department Gazette",
            "reference_id": "FIN-SEM6-2026",
            "title": "Academic Year 2025-26 Fee Schedule & Surcharges",
            "section": "Clause 3.2 - Examination & Tuition Dues"
        })
        
        response_text = await generate_azure_openai_response(
            query=query_text,
            language_code=canonical_lang,
            context_data=tool_context_str,
            tool_name=tool_used
        )
        
        if not response_text:
            if canonical_lang == "hi-IN":
                response_text = (
                    f"{fee['fee_type']} जमा करने की अंतिम तिथि {fee['standard_due_date']} है (राशि: ₹{fee['amount']:,})। "
                    f"विलंब शुल्क: 26 से 31 मार्च तक ₹500 तथा 1 से 5 अप्रैल तक ₹1,500 पेनल्टी लागू होगी। "
                    f"भुगतान ईआरपी पोर्टल पर ऑनलाइन कर सकते हैं।"
                )
            elif canonical_lang == "ta-IN":
                response_text = (
                    f"{fee['fee_type']} செலுத்த கடைசி தேதி {fee['standard_due_date']} (தொகை: ₹{fee['amount']:,}). "
                    f"மார்ச் 26 முதல் தாமத கட்டணம் ₹500 வசூலிக்கப்படும். ERP போர்ட்டலில் ஆன்லைனில் செலுத்தலாம்."
                )
            else:
                response_text = (
                    f"The last date for {fee['fee_type']} is {fee['standard_due_date']} (Amount: ₹{fee['amount']:,}). "
                    f"Late fee: ₹500 from March 26-31. Pay online via the university ERP portal."
                )

    else:
        # Default RAG Ordinances
        tool_used = "rag_university_ordinances"
        # Translate query to English for better RAG retrieval accuracy
        english_query = await translate_query_to_english(query_text, canonical_lang)
        rag_docs = await search_university_ordinances(english_query, top_k=2)
        top_doc = rag_docs[0]
        tool_context_str = json.dumps(rag_docs, ensure_ascii=False)
        
        for doc in rag_docs:
            citations.append({
                "source_type": "Official University Academic Ordinances",
                "reference_id": doc["doc_id"],
                "title": doc["title"],
                "section": doc["section"]
            })
            
        response_text = await generate_azure_openai_response(
            query=query_text,
            language_code=canonical_lang,
            context_data=tool_context_str,
            tool_name=tool_used
        )
        
        if not response_text:
            cat = top_doc.get("category", "")
            if "attendance" in cat or "acad" in cat:
                if canonical_lang == "hi-IN":
                    response_text = (
                        "विश्वविद्यालय अध्यादेश के अनुसार, परीक्षा में बैठने के लिए न्यूनतम 75% उपस्थिति अनिवार्य है। "
                        "प्रमाणित मेडिकल आधार पर 10% तक की छूट मिल सकती है।"
                    )
                elif canonical_lang == "ta-IN":
                    response_text = (
                        "பல்கலைக்கழக விதிகளின்படி, தேர்வெழுத குறைந்தபட்சம் 75% வருகை கட்டாயமாகும். மருத்துவ காரணங்களுக்காக 10% வரை சலுகை வழங்கப்படலாம்."
                    )
                else:
                    response_text = (
                        "As per University Ordinance Section 4.1, a minimum of 75% attendance is mandatory in each enrolled course to appear in examinations."
                    )
            elif "branch" in cat:
                if canonical_lang == "hi-IN":
                    response_text = "प्रथम वर्ष के बाद ब्रांच चेंज के लिए न्यूनतम 8.50 CGPA आवश्यक है और कोई बैकलॉग नहीं होना चाहिए।"
                elif canonical_lang == "ta-IN":
                    response_text = "முதல் ஆண்டிற்குப் பிறகு கிளை மாற்றத்திற்கு குறைந்தபட்சம் 8.50 CGPA தேவை மற்றும் அரியர்ஸ் இருக்கக்கூடாது."
                else:
                    response_text = "Branch change after 1st year requires a minimum cumulative CGPA of 8.50 with zero backlogs."
            else:
                response_text = top_doc.get("content", "University rules apply.")

    # -------------------------------------------------------------
    # Step 4: Speech Synthesis (Dual Provider: Sarvam + Azure Speech)
    # -------------------------------------------------------------
    audio_base64 = None
    tts_telemetry = {}
    if generate_audio and response_text:
        audio_base64, tts_telemetry = await synthesize_speech_by_provider(response_text, canonical_lang, provider)
        
    telemetry.record_service_call("azure_openai")
    telemetry.record_service_call("azure_search")
    telemetry.record_query(tool_used=tool_used, is_out_of_scope=False)
    elapsed_ms = int((time.time() - start_time) * 1000)
    
    return {
        "status": "success",
        "query": query_text,
        "language": canonical_lang,
        "response_text": response_text,
        "audio_base64": audio_base64,
        "intent_route": "IN_SCOPE_UNIVERSITY_QUERY",
        "is_out_of_scope": False,
        "tool_used": tool_used,
        "citations": citations,
        "telemetry": {
            "total_latency_ms": elapsed_ms,
            "guardrail": guardrail_telemetry,
            "tool_or_rag": tool_used,
            "tts": tts_telemetry
        }
    }
