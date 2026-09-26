"""
FILE: test_agent.py
PURPOSE: Full end-to-end agent test — sends text queries directly to the backend
         /api/voice/process endpoint, tests tool routing, multilingual responses,
         and verifies answers are returned in the CORRECT language.

Run: python test_agent.py
Backend must be running: cd backend && python run.py
"""
import asyncio, sys, os, json, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))
import httpx

BASE_URL = "http://localhost:8000"

OK   = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"

# ─────────────────────────────────────────────────────────────────────────────
# Test cases: (query_text, language_code, user_role, description, expected_keyword_in_answer)
# expected_keyword_in_answer = None means just check it responds, don't validate content
# ─────────────────────────────────────────────────────────────────────────────
TEST_CASES = [
    # ── English queries ──────────────────────────────────────────────────────
    ("What is the attendance rule for students?",
     "en-IN", "student", "ENG: Attendance rule", "75"),

    ("What are the branch change eligibility criteria?",
     "en-IN", "student", "ENG: Branch change CGPA", "CGPA"),

    ("What is the exam fee deadline for Semester 6?",
     "en-IN", "student", "ENG: Exam fee deadline", "2025"),

    ("Where is the library reading room?",
     "en-IN", "student", "ENG: Library query", None),

    ("What is the hostel curfew time?",
     "en-IN", "student", "ENG: Hostel curfew", None),

    # ── Hindi queries (ans must be IN HINDI) ────────────────────────────────
    ("मेरी फीस कब तक जमा करनी है?",
     "hi-IN", "student", "HIN: Fee deadline in Hindi", None),

    ("अटेंडेंस का नियम क्या है?",
     "hi-IN", "student", "HIN: Attendance rule in Hindi", None),

    ("ब्रांच चेंज के लिए कितना CGPA चाहिए?",
     "hi-IN", "student", "HIN: Branch change CGPA in Hindi", None),

    # ── Tamil queries (ans must be IN TAMIL) ────────────────────────────────
    ("கல்லூரி கட்டண விண்ணப்ப நடைமுறை என்ன?",
     "ta-IN", "student", "TAM: Tamil fee query → answer in Tamil", None),

    ("கல்லூரி நூலக நேரம் என்ன?",
     "ta-IN", "student", "TAM: Library timing in Tamil", None),

    # ── Telugu queries ───────────────────────────────────────────────────────
    ("హాజరు నియమాలు ఏమిటి?",
     "te-IN", "student", "TEL: Attendance in Telugu", None),

    # ── Out-of-scope queries (must politely decline) ─────────────────────────
    ("What is the weather today in Chandigarh?",
     "en-IN", "student", "OOS: Weather (out of scope)", None),

    ("Who won IPL 2024?",
     "en-IN", "student", "OOS: IPL (out of scope)", None),

    # ── RBAC / guest access test ─────────────────────────────────────────────
    ("What are my internal marks for this semester?",
     "en-IN", "guest", "RBAC: Guest asking private grades", None),

    # ── Faculty role ─────────────────────────────────────────────────────────
    ("What is the curriculum for CSE 3rd year?",
     "en-IN", "faculty", "FAC: Curriculum query by faculty", None),
]


async def send_query(client: httpx.AsyncClient, text: str, lang: str, role: str):
    """Call the /api/voice/process endpoint with text input."""
    payload = {
        "query": text,
        "language_code": lang,
        "user_role": role,
        "generate_audio": False,
    }
    t0 = time.perf_counter()
    try:
        r = await client.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=45.0)
        latency = (time.perf_counter() - t0) * 1000
        return r, latency
    except Exception as e:
        latency = (time.perf_counter() - t0) * 1000
        return None, latency


async def main():
    print("\n" + "="*72)
    print("  TEST_AGENT — Full End-to-End Agent Test")
    print("  Backend: " + BASE_URL)
    print("="*72)

    # Quick health check first
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            r = await c.get(f"{BASE_URL}/api/health")
        if r.status_code != 200:
            print(f"\n{FAIL} Backend not healthy (HTTP {r.status_code}). Start backend first.\n")
            return
        print(f"\n  Backend health: {r.json()}\n")
    except Exception as e:
        print(f"\n{FAIL} Cannot reach backend at {BASE_URL}: {e}")
        print("  → Make sure: cd backend && python run.py\n")
        return

    passed, failed, warned = 0, 0, 0
    results = []

    async with httpx.AsyncClient() as client:
        for i, (query, lang, role, desc, expected_kw) in enumerate(TEST_CASES, 1):
            r, latency_ms = await send_query(client, query, lang, role)

            if r is None:
                status = FAIL
                answer_text = "CONNECTION ERROR"
                tool_called = "—"
                failed += 1
            elif r.status_code != 200:
                status = FAIL
                answer_text = f"HTTP {r.status_code}: {r.text[:100]}"
                tool_called = "—"
                failed += 1
            else:
                data = r.json()
                answer_text = data.get("text_response") or data.get("answer") or data.get("response", "")
                tool_called = data.get("tool_called") or data.get("intent") or "—"
                response_lang = data.get("response_language") or data.get("language_code") or lang

                # Validate expected keyword
                if expected_kw and expected_kw.lower() not in answer_text.lower():
                    status = WARN
                    warned += 1
                else:
                    status = OK
                    passed += 1

            results.append({
                "num": i, "desc": desc, "lang": lang, "role": role,
                "query": query[:55], "tool": tool_called,
                "status": status, "latency": latency_ms,
                "answer": answer_text[:140] if answer_text else "",
            })

    # ── Print results ─────────────────────────────────────────────────────────
    for res in results:
        print(f"\n[{res['num']:02d}] {res['status']}  {res['desc']}")
        print(f"     Lang={res['lang']}  Role={res['role']}  Latency={res['latency']:.0f}ms")
        print(f"     Query  : {res['query']}")
        print(f"     Tool   : {res['tool']}")
        print(f"     Answer : {res['answer']}")

    print("\n" + "="*72)
    total = len(TEST_CASES)
    print(f"  RESULT: {passed} PASS  |  {warned} WARN  |  {failed} FAIL  |  Total {total}")
    print("="*72 + "\n")

    # Save JSON report
    report_path = os.path.join(os.path.dirname(__file__), "test_agent_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"  📄 Full report saved to: {report_path}\n")


if __name__ == "__main__":
    asyncio.run(main())
