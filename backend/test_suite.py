"""
Test suite to verify all tools, guardrails, and multilingual capabilities.
"""

import httpx

BASE_URL = "http://localhost:8000"

def test_all():
    print("=" * 60)
    print("RUNNING MULTILINGUAL VOICE ASSISTANT VERIFICATION SUITE")
    print("=" * 60)
    
    test_cases = [
        ("Saharanpur me mera ghar kahan hai?", "hi-IN", "OUT_OF_SCOPE_GUARDRAIL", None),
        ("University kab establish hui aur NIRF ranking kya hai?", "hi-IN", "IN_SCOPE_UNIVERSITY_QUERY", "get_university_overview_and_ranking"),
        ("6th semester fee deadline aur late fee penalty kitni hai?", "hi-IN", "IN_SCOPE_UNIVERSITY_QUERY", "check_fee_deadlines"),
        ("Library me data structures ki book available hai?", "hi-IN", "IN_SCOPE_UNIVERSITY_QUERY", "check_library_status"),
        ("Dr. Sharma ka cabin kahan hai aur office hours?", "hi-IN", "IN_SCOPE_UNIVERSITY_QUERY", "find_faculty_contact"),
        ("Exam me baithne ke liye minimum attendance kitni chahiye?", "hi-IN", "IN_SCOPE_UNIVERSITY_QUERY", "rag_university_ordinances"),
        ("What are the hostel night curfew timings and anti-ragging rules?", "en-IN", "IN_SCOPE_UNIVERSITY_QUERY", "rag_university_ordinances"),
        ("கல்லூரி சேர்க்கை மற்றும் கட்டண விவரங்கள் என்ன?", "ta-IN", "IN_SCOPE_UNIVERSITY_QUERY", "check_fee_deadlines")
    ]
    
    passed = 0
    for idx, (query, lang, expected_route, expected_tool) in enumerate(test_cases, 1):
        payload = {
            "query": query,
            "language_code": lang,
            "generate_audio": False
        }
        resp = httpx.post(f"{BASE_URL}/api/chat/message", json=payload, timeout=25.0)
        data = resp.json()
        
        route = data.get("intent_route")
        tool = data.get("tool_used")
        latency = data.get("telemetry", {}).get("total_latency_ms", 0)
        
        route_ok = route == expected_route
        tool_ok = tool == expected_tool
        
        if route_ok and tool_ok:
            passed += 1
            status = "PASS [OK]"
        else:
            status = "FAIL [X]"
            
        print(f"[{idx}] {status} | Lang: {lang} | Latency: {latency}ms")
        print(f"    Route: {route} (Expected: {expected_route})")
        print(f"    Tool:  {tool} (Expected: {expected_tool})")
        print(f"    Citations: {len(data.get('citations', []))}")
        print("-" * 60)
        
    print(f"TEST RESULTS: {passed}/{len(test_cases)} Passed Successfully!")
    print("=" * 60)

if __name__ == "__main__":
    test_all()
