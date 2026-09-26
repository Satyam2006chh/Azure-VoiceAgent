"""
University Dynamic Tools Execution Module.
Provides verified data lookup for the 4 core university tools.
"""

from typing import Dict, Any, Optional, List
from app.tools.mock_db import (
    UNIVERSITY_OVERVIEW_DB,
    LIBRARY_CATALOG_DB,
    FACULTY_DIRECTORY_DB,
    FEE_DEADLINES_DB
)
from app.config import settings
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
import httpx
import logging

logger = logging.getLogger(__name__)

async def get_embeddings_sync(text: str) -> List[float]:
    """Helper to get embeddings synchronously for the search tool."""
    deployment = getattr(settings, "AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
    url = f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/deployments/{deployment}/embeddings?api-version=2024-02-15-preview"
    headers = {"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"}
    payload = {"input": text}
    
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=payload, timeout=20.0)
        r.raise_for_status()
        return r.json()["data"][0]["embedding"]

async def search_official_documents(query: str) -> Dict[str, Any]:
    """
    Searches official uploaded PDFs in Azure AI Search using Hybrid Vector Search.
    Use this tool to find rules, policies, or information from uploaded circulars.
    """
    try:
        vector = await get_embeddings_sync(query)
        
        credential = AzureKeyCredential(settings.AZURE_SEARCH_API_KEY)
        search_client = SearchClient(
            endpoint=settings.AZURE_SEARCH_ENDPOINT, 
            index_name=settings.AZURE_SEARCH_INDEX_NAME, 
            credential=credential
        )
        
        vector_query = VectorizedQuery(
            vector=vector, k_nearest_neighbors=3, fields="content_vector"
        )
        
        results = search_client.search(
            search_text=query,
            vector_queries=[vector_query],
            top=3
        )
        
        chunks = []
        for result in results:
            chunks.append({
                "source": result.get("source_file", "Unknown"),
                "content": result["content"]
            })
            
        return {
            "tool": "search_official_documents",
            "status": "success" if chunks else "not_found",
            "query": query,
            "results": chunks
        }
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return {
            "tool": "search_official_documents",
            "status": "error",
            "message": "Failed to connect to Azure AI Search or index is empty."
        }

def get_university_overview_and_ranking(topic: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieves comprehensive university background, establishment year, accreditations,
    NIRF and QS rankings, campus infrastructure, leadership, and key highlights.
    """
    db = UNIVERSITY_OVERVIEW_DB
    topic_lower = topic.lower().strip() if topic else ""
    
    summary = f"{db['name']} was established in {db['established']}. It is NAAC Grade A++ accredited (Score 3.82) and ranked #12 in India by NIRF Engineering 2025."
    if "rank" in topic_lower or "nirf" in topic_lower or "naac" in topic_lower:
        summary = f"{db['name']} holds NAAC A++ (Score 3.82) accreditation and is ranked #12 in India by NIRF Engineering 2025."
    elif "campus" in topic_lower or "area" in topic_lower:
        summary = f"The university spans a {db['campus_size']} with 12 Advanced Research Centers of Excellence."

    return {
        "tool": "get_university_overview_and_ranking",
        "name": db["name"],
        "established": db["established"],
        "founder": db["founder"],
        "motto": db["motto"],
        "campus_size": db["campus_size"],
        "accreditation": db["accreditation"],
        "rankings": db["rankings"],
        "key_highlights": db["key_highlights"],
        "summary": summary,
        "contact": {
            "email": db["contact_email"],
            "helpline": db["helpline"]
        }
    }

def check_library_status(query: str, category: Optional[str] = None) -> Dict[str, Any]:
    """
    Searches the library catalog for textbook availability, rack locations,
    shelf details, and digital e-book links.
    """
    q = query.lower().strip()
    matches = []
    
    for book in LIBRARY_CATALOG_DB:
        title_match = any(word in book["title"].lower() for word in q.split())
        author_match = any(word in book["author"].lower() for word in q.split())
        category_match = category and category.lower() in book["category"].lower()
        
        if title_match or author_match or category_match or q in book["category"].lower() or q in book["book_id"].lower():
            matches.append(book)
            
    if not matches:
        # Fallback to returning the top available books
        return {
            "tool": "check_library_status",
            "status": "not_found",
            "query": query,
            "message": f"No direct catalog match found for '{query}'. Please check spelling or search by author.",
            "available_categories": ["Computer Science & Engineering", "Artificial Intelligence", "Electronics", "Mechanical"],
            "sample_available_books": [b["title"] for b in LIBRARY_CATALOG_DB[:3]]
        }
        
    return {
        "tool": "check_library_status",
        "status": "found",
        "query": query,
        "results_count": len(matches),
        "books": matches
    }

def find_faculty_contact(name: Optional[str] = None, department: Optional[str] = None) -> Dict[str, Any]:
    """
    Finds faculty details including cabin location, department, email,
    phone extension, and scheduled office hours for student meetings.
    """
    results = []
    name_clean = name.lower().replace("dr.", "").replace("dr", "").replace("prof.", "").replace("prof", "").strip() if name else ""
    dept_clean = department.lower().strip() if department else ""
    
    for fac in FACULTY_DIRECTORY_DB:
        name_match = name_clean and any(part in fac["name"].lower() for part in name_clean.split())
        dept_match = dept_clean and (dept_clean in fac["department"].lower() or dept_clean in fac["specialization"].lower())
        
        if (name_clean and name_match) or (dept_clean and dept_match) or (not name_clean and not dept_clean):
            results.append(fac)
            
    if not results and name:
        return {
            "tool": "find_faculty_contact",
            "status": "not_found",
            "query_name": name,
            "message": f"No faculty record found matching '{name}'.",
            "directory_help": "You may search by Department (e.g. CSE, ECE, Mechanical) or check with the HOD Office."
        }
        
    return {
        "tool": "find_faculty_contact",
        "status": "found",
        "faculty_list": results if results else FACULTY_DIRECTORY_DB[:2]
    }

def check_fee_deadlines(semester: Optional[int] = None, fee_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Checks fee deadlines, amount, late fee penalty schedule, and payment portal links.
    """
    if semester == 6 or (fee_type and "exam" in fee_type.lower()) or (fee_type and "sem" in fee_type.lower()):
        fee_item = FEE_DEADLINES_DB[0]
    elif fee_type and ("suppl" in fee_type.lower() or "backlog" in fee_type.lower()):
        fee_item = FEE_DEADLINES_DB[1]
    elif fee_type and ("hostel" in fee_type.lower() or "mess" in fee_type.lower()):
        fee_item = FEE_DEADLINES_DB[2]
    else:
        # Return primary active fee schedule (Semester 6 exam fee)
        fee_item = FEE_DEADLINES_DB[0]
        
    return {
        "tool": "check_fee_deadlines",
        "fee_details": fee_item,
        "all_schedules_summary": [
            {"type": f["fee_type"], "due_date": f["standard_due_date"], "amount": f["amount"]}
            for f in FEE_DEADLINES_DB
        ]
    }
