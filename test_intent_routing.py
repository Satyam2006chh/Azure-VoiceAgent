import asyncio, sys
sys.path.insert(0, 'backend')
from dotenv import load_dotenv
load_dotenv('backend/.env')
from app.services.llm_router import route_query_with_llm

test_queries = [
    ("meri fees kab tak jama karni hai?", "Hindi - Fee deadline"),
    ("library mein DBMS ki kitaab hai?", "Hindi - Library book"),
    ("Dr. Sharma ka cabin kahan hai?", "Hinglish - Faculty location"),
    ("What is the attendance rule?", "English - Attendance"),
    ("mera ghar kahan hai?", "Out of scope - personal"),
    ("Tell me about university ranking", "English - Ranking"),
    ("branch change ke liye CGPA kitna chahiye?", "Hindi - Branch change"),
    ("What is the weather today?", "Out of scope - weather"),
    ("hostel rules kya hain?", "Hindi - Hostel rules"),
    ("exam ke liye kitni attendance chahiye?", "Hindi - Exam attendance"),
    ("Tamil kya hai NAAC grade?", "Tamil-Hindi - NAAC"),
]

async def run():
    print("\n" + "="*70)
    print("  INTENT ROUTING TEST — MULTILINGUAL")
    print("="*70)
    for query, label in test_queries:
        result = await route_query_with_llm(query)
        scope = "IN-SCOPE " if result.get("is_in_scope") else "OUT-SCOPE"
        tool = result.get("tool_used", "N/A")
        reasoning = result.get("reasoning", "")[:75]
        print(f"\n[{scope}] {label}")
        print(f"  Query  : {query}")
        print(f"  Tool   : {tool}")
        print(f"  Reason : {reasoning}")
    print("\n" + "="*70)

asyncio.run(run())
