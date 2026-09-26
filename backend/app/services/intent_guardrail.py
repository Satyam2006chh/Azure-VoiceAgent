"""
Intent Guardrail & Out-of-Scope Query Filter.
Catches non-university queries (e.g. "Mera ghar Saharanpur me kahan hai?")
and returns polite, friendly multilingual responses without routing to backend tools/RAG.
"""

from typing import Dict, Tuple, Optional

# Friendly multilingual polite redirect templates
GUARDRAIL_RESPONSES = {
    "hi-IN": (
        "नमस्ते! 😊 मैं आपका समर्पित यूनिवर्सिटी वॉयस असिस्टेंट हूँ। "
        "मेरा कार्य विशेष रूप से कॉलेज एडमिशन, परीक्षा, टाइमटेबल, लाइब्रेरी बुक्स, फीस डेडलाइन और फैकल्टी से जुड़े सवालों में आपकी सहायता करना है। "
        "यह सवाल यूनिवर्सिटी के दायरे से बाहर है। क्या आप यूनिवर्सिटी से संबंधित कुछ पूछना चाहते हैं?"
    ),
    "en-IN": (
        "Hello! 😊 I am your dedicated University Voice Assistant. "
        "I am designed specifically to help you with college admissions, exam dates, library books, fee deadlines, faculty cabins, and academic ordinances. "
        "This question is outside our university domain. How may I assist you with your campus or academic queries?"
    ),
    "ta-IN": (
        "வணக்கம்! 😊 நான் உங்கள் பல்கலைக்கழக குரல் உதவியாளர். "
        "கல்லூரி சேர்க்கை, தேர்வுகள், நூலகம், கட்டண காலக்கெடு மற்றும் பேராசிரியர்கள் தொடர்பான கேள்விகளுக்கு உதவ நான் இருக்கிறேன். "
        "பல்கலைக்கழகம் தொடர்பான தகவல்களுக்கு தயவுசெய்து கேட்கவும்."
    ),
    "te-IN": (
        "నమస్కారం! 😊 నేను మీ యూనివర్సిటీ వాయిస్ అసిస్టెంట్. "
        "కాలేజ్ అడ్మిషన్లు, పరీక్షలు, లైబ్రరీ పుస్తకాలు, ఫీజు గడువులు మరియు ఫ్యాకల్టీ వివరాలలో మీకు సహాయం చేయడమే నా పని. "
        "యూనివర్సిటీకి సంబంధించిన ఏవైనా ప్రశ్నలు ఉంటే దయచేసి అడగండి."
    ),
    "mr-IN": (
        "नमस्कार! 😊 मी तुमचा युनिव्हर्सिटी व्हॉइस असिस्टंट आहे. "
        "मी केवळ कॉलेज प्रवेश, परीक्षा, लायब्ररी, फी आणि प्राध्यापकांशी संबंधित प्रश्नांमध्ये मदत करू शकतो. "
        "कृपया विद्यापीठाशी संबंधित प्रश्न विचारा."
    ),
    "bn-IN": (
        "নমস্কার! 😊 আমি আপনার বিশ্ববিদ্যালয় ভয়েস সহকারী। "
        "কলেজ ভর্তি, পরীক্ষা, লাইব্রেরি, ফি এবং অনুষদ সম্পর্কিত তথ্যের জন্য আমি আপনাকে সাহায্য করতে প্রস্তুত। "
        "বিশ্ববিদ্যালয় সংক্রান্ত কোনো প্রশ্ন থাকলে দয়া করে জিজ্ঞাসা করুন।"
    ),
    "gu-IN": (
        "નમસ્તે! 😊 હું તમારો યુનિવર્સિટી વૉઇસ આસિસ્ટન્ટ છું. "
        "હું ફક્ત કૉલેજ એડમિશન, પરીક્ષા, લાઇબ્રેરી, ફી અને ફેકલ્ટી સંબંધિત પ્રશ્નોમાં મદદ કરી શકું છું. "
        "કૃપા કરીને યુનિવર્સિટી સંબંધિત પ્રશ્ન પૂછો."
    ),
    "kn-IN": (
        "ನಮಸ್ಕಾರ! 😊 ನಾನು ನಿಮ್ಮ ವಿಶ್ವವಿದ್ಯಾಲಯದ ಧ್ವನಿ ಸಹಾಯಕ. "
        "ಕಾಲೇಜು ಪ್ರವೇಶ, ಪರೀಕ್ಷೆಗಳು, ಗ್ರಂಥಾಲಯ ಮತ್ತು ಶುಲ್ಕದ ಬಗ್ಗೆ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. "
        "ದಯವಿಟ್ಟು ವಿಶ್ವವಿದ್ಯಾಲಯಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ."
    ),
    "ml-IN": (
        "നമസ്കാരം! 😊 ഞാൻ നിങ്ങളുടെ യൂണിവേഴ്സിറ്റി വോയ്സ് അസിസ്റ്റന്റാണ്. "
        "കോളേജ് അഡ്മിഷൻ, പരീക്ഷകൾ, ലൈബ്രറി, ഫീസ് എന്നിവയെക്കുറിച്ചുള്ള വിവരങ്ങളിൽ ഞാൻ നിങ്ങളെ സഹായിക്കാം. "
        "ദയവായി സർവകലാശാല സംബന്ധമായ ചോദ്യങ്ങൾ ചോദിക്കുക."
    ),
    "pa-IN": (
        "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! 😊 ਮੈਂ ਤੁਹਾਡਾ ਯੂਨੀਵਰਸਿਟੀ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਹਾਂ। "
        "ਮੈਂ ਸਿਰਫ਼ ਕਾਲਜ ਦਾਖਲੇ, ਪ੍ਰੀਖਿਆਵਾਂ, ਲਾਇਬ੍ਰੇਰੀ ਅਤੇ ਫੀਸਾਂ ਸੰਬੰਧੀ ਸਵਾਲਾਂ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। "
        "ਕਿਰਪਾ ਕਰਕੇ ਯੂਨੀਵਰਸਿਟੀ ਨਾਲ ਸੰਬੰਧਿਤ ਸਵਾਲ ਪੁੱਛੋ।"
    ),
    "or-IN": (
        "ନମସ୍କାର! 😊 ମୁଁ ଆପଣଙ୍କ ବିଶ୍ୱବିଦ୍ୟାଳୟ ଭଏସ୍ ଆସିଷ୍ଟାଣ୍ଟ। "
        "ମୁଁ କେବଳ କଲେଜ ଆଡମିଶନ, ପରୀକ୍ଷା, ଲାଇବ୍ରେରୀ ଏବଂ ଫିସ୍ ସମ୍ବନ୍ଧିତ ପ୍ରଶ୍ନରେ ସାହାଯ୍ୟ କରିପାରିବି। "
        "ଦୟାକରି ବିଶ୍ୱବିଦ୍ୟାଳୟ ସମ୍ବନ୍ଧୀୟ ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ।"
    )
}

OUT_OF_SCOPE_KEYWORDS = [
    "saharanpur", "mera ghar", "meri bike", "meri car", "khana", "biryani",
    "weather", "mausam", "cricket", "ipl", "movie", "cinema", "song", "gaana",
    "joke", "chutkula", "politician", "election", "bjp", "congress", "aap",
    "bitcoin", "crypto", "share market", "dating", "girlfriend", "boyfriend",
    "shadi", "shaadi", "train ticket", "flight status", "restaurant", "hotel near"
]

UNIVERSITY_SCOPE_KEYWORDS = [
    # English
    "university", "college", "campus", "rank", "ranking", "established", "history",
    "fee", "fees", "exam", "examination", "semester", "sem", "timetable", "schedule",
    "library", "book", "books", "shelf", "rack", "reading room", "faculty", "professor",
    "teacher", "hod", "cabin", "office hour", "attendance", "75%", "medical", "cgpa",
    "sgpa", "backlog", "supplementary", "hostel", "mess", "curfew", "ragging",
    "anti-ragging", "ordinance", "rule", "admissions", "placement", "placement package",
    "timing", "timings", "time", "hours", "open", "close", "when",
    # Hindi Devanagari keywords
    "विश्वविद्यालय", "कॉलेज", "पुस्तकालय", "पुस्तक", "परीक्षा", "उपस्थिति",
    "फीस", "शुल्क", "सेमेस्टर", "टाइमटेबल", "हॉस्टल", "शिक्षक", "प्रोफेसर",
    "लाइब्रेरी", "समय", "किताब", "अटेंडेंस", "बैकलॉग", "रैंकिंग", "कैंपस",
    "नियम", "प्रवेश", "छात्र", "अध्यादेश",
    # Common transliterations
    "laibreri", "library timing", "pariksha", "upasthiti", "hostal", "univarsiti",
    "semester fee", "attendance rule", "branch change", "pustakalaya", "pustakaalay",
    "kitab", "pustak", "siksha", "shiksha", "campus", "padhai",
]

def check_intent_guardrail(query: str, language_code: str = "hi-IN") -> Tuple[bool, Optional[str], Dict[str, any]]:
    """
    Evaluates whether the user's query is in-scope (University academic domain)
    or out-of-scope (General random query).
    
    Returns:
        (is_out_of_scope: bool, redirect_message: Optional[str], telemetry: dict)
    """
    q = query.lower().strip()
    
    # Check explicit out of scope triggers
    is_explicit_out_of_scope = any(k in q for k in OUT_OF_SCOPE_KEYWORDS)
    has_university_context = any(k in q for k in UNIVERSITY_SCOPE_KEYWORDS)
    
    def _blocked_response(reason: str, keywords_found: list):
        lang = language_code if language_code in GUARDRAIL_RESPONSES else "en-IN"
        msg = GUARDRAIL_RESPONSES[lang]
        return True, msg, {
            "guardrail_status": "FILTERED_OUT_OF_SCOPE",
            "reason": reason,
            "detected_keywords": keywords_found,
            "action_taken": "Polite native-language redirect triggered without executing backend tools."
        }

    # Condition 1: Explicitly off-topic keyword detected
    if is_explicit_out_of_scope and not has_university_context:
        return _blocked_response(
            "Query detected as non-academic / external domain inquiry.",
            [k for k in OUT_OF_SCOPE_KEYWORDS if k in q]
        )

    # Condition 2: Zero university keywords and query is long enough to be a real question
    # Short queries (<=3 words) could be greetings or continuations — allow them
    word_count = len(q.split())
    if not has_university_context and word_count >= 4:
        return _blocked_response(
            "No university-related keywords detected in query.",
            []
        )
        
    return False, None, {
        "guardrail_status": "PASSED_IN_SCOPE",
        "action_taken": "Allowed to proceed to Agent & Knowledge Tools."
    }
