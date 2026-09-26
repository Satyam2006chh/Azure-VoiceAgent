import httpx
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Support running from project root OR from backend/ directory
script_dir = Path(__file__).resolve().parent  # backend/app/tools/
backend_dir = script_dir.parent.parent         # backend/
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Add backend/ to path so "app.data..." imports work
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.data.university_rulebook import UNIVERSITY_RULEBOOK_DOCS

endpoint = os.getenv("AZURE_SEARCH_ENDPOINT", "").rstrip("/")
key = os.getenv("AZURE_SEARCH_API_KEY")
index_name = os.getenv("AZURE_SEARCH_INDEX_NAME", "university-rulebook")

headers = {
    "api-key": key,
    "Content-Type": "application/json"
}

index_schema = {
    "name": index_name,
    "fields": [
        {"name": "id", "type": "Edm.String", "key": True, "searchable": False, "filterable": True, "retrievable": True},
        {"name": "title", "type": "Edm.String", "searchable": True, "retrievable": True},
        {"name": "category", "type": "Edm.String", "searchable": True, "filterable": True, "retrievable": True},
        {"name": "section", "type": "Edm.String", "searchable": True, "retrievable": True},
        {"name": "content", "type": "Edm.String", "searchable": True, "retrievable": True}
    ]
}

def create_and_populate_index():
    print(f"Creating Azure Search Index '{index_name}' at {endpoint}...")
    url = f"{endpoint}/indexes/{index_name}?api-version=2024-07-01"
    
    # 1. Create or update index
    resp = httpx.put(url, headers=headers, json=index_schema, timeout=15.0)
    print(f"Index creation response: {resp.status_code}")
    if resp.status_code not in (200, 201, 204):
        print(f"Failed to create index: {resp.text}")
        return False
    print(f"Index schema ready (status {resp.status_code})")

    # 2. Upload documents
    docs_to_upload = []
    for doc in UNIVERSITY_RULEBOOK_DOCS:
        docs_to_upload.append({
            "@search.action": "mergeOrUpload",
            "id": doc["id"].replace("-", "_"),  # Azure Search key safe
            "title": doc["title"],
            "category": doc["category"],
            "section": doc["section"],
            "content": doc["content"]
        })

    docs_url = f"{endpoint}/indexes/{index_name}/docs/index?api-version=2024-07-01"
    upload_resp = httpx.post(docs_url, headers=headers, json={"value": docs_to_upload}, timeout=15.0)
    print(f"Docs upload response: {upload_resp.status_code}")
    if upload_resp.status_code == 200:
        print(f"Successfully uploaded {len(docs_to_upload)} ordinance documents to Azure AI Search!")
        return True
    else:
        print(f"Failed to upload docs: {upload_resp.text}")
        return False

if __name__ == "__main__":
    create_and_populate_index()
