"""
PDF Indexer — Extracts text from PDFs using PyMuPDF and indexes chunks into Azure AI Search.
Supports both local filesystem PDFs and uploaded PDFs from the admin panel.
"""

import fitz  # PyMuPDF
import httpx
import logging
import json
import re
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app import telemetry

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# PDFs to auto-index at startup (from the Desktop)
BOOTSTRAP_PDFS = [
    r"C:\Users\Raman Bansal\OneDrive\Desktop\Azure\Academic_Rules_2025.pdf",
    r"C:\Users\Raman Bansal\OneDrive\Desktop\Azure\Central_Library_Rules.pdf",
    r"C:\Users\Raman Bansal\OneDrive\Desktop\Azure\Exam_Regulations.pdf",
    r"C:\Users\Raman Bansal\OneDrive\Desktop\Azure\Fee_Circular_Even_Sem.pdf",
    r"C:\Users\Raman Bansal\OneDrive\Desktop\Azure\Hostel_Guidelines.pdf",
]


def extract_text_chunks(pdf_path: str, chunk_size: int = 500) -> List[Dict[str, Any]]:
    """
    Extract text from a PDF and split into overlapping chunks.
    Each chunk is tagged with source file and chunk index.
    Only includes fields accepted by the Azure Search index schema:
    id, source_file, content  (content_vector added later via get_embedding)
    """
    chunks = []
    try:
        doc = fitz.open(pdf_path)
        filename = Path(pdf_path).stem
        full_text = ""

        for page in doc:
            full_text += page.get_text("text") + "\n"
        doc.close()

        # Split into chunks with 50-word overlap
        words = full_text.split()
        overlap = 50
        step = chunk_size - overlap

        for i, start in enumerate(range(0, len(words), step)):
            chunk_words = words[start: start + chunk_size]
            if len(chunk_words) < 30:  # Skip tiny fragments
                continue
            chunk_text = re.sub(r'\s+', ' ', " ".join(chunk_words)).strip()

            chunks.append({
                "id": f"{filename}-chunk-{i}",
                "source_file": Path(pdf_path).name,
                "content": chunk_text,
            })

        logger.info(f"Extracted {len(chunks)} chunks from {Path(pdf_path).name}")
    except Exception as e:
        logger.error(f"PDF extraction failed for {pdf_path}: {e}")

    return chunks


async def get_embedding(text: str) -> Optional[List[float]]:
    """
    Generate an embedding vector for a text chunk using Azure OpenAI.
    Uses text-embedding-3-small (1536-dim). Falls back to None on failure
    so the chunk is still indexed without a vector (keyword-only search).
    """
    if not settings.AZURE_OPENAI_API_KEY or not settings.AZURE_OPENAI_ENDPOINT:
        return None

    # Try text-embedding-3-small first, fall back to text-embedding-ada-002
    for deployment in ("text-embedding-3-small", "text-embedding-ada-002"):
        url = (
            f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}"
            f"/openai/deployments/{deployment}/embeddings?api-version=2024-02-15-preview"
        )
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                r = await client.post(
                    url,
                    headers={"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"},
                    json={"input": text[:8000]},  # stay within token limit
                )
                if r.status_code == 200:
                    return r.json()["data"][0]["embedding"]
                elif r.status_code == 404:
                    # Deployment not found — try next
                    continue
                else:
                    logger.warning(f"Embedding API returned {r.status_code} for {deployment}: {r.text[:200]}")
        except Exception as e:
            logger.warning(f"Embedding failed for deployment {deployment}: {e}")

    return None


async def index_chunks_to_azure(chunks: List[Dict[str, Any]]) -> bool:
    """
    Upload document chunks to Azure AI Search.
    Generates content_vector embeddings for each chunk.
    Falls back to uploading without vector if embeddings fail
    (chunk is still searchable via keyword search).
    """
    if not settings.AZURE_SEARCH_API_KEY or not settings.AZURE_SEARCH_ENDPOINT:
        logger.warning("Azure Search not configured — skipping cloud indexing.")
        return False

    url = (
        f"{settings.AZURE_SEARCH_ENDPOINT.rstrip('/')}"
        f"/indexes/{settings.AZURE_SEARCH_INDEX_NAME}/docs/index"
        f"?api-version=2024-07-01"
    )
    headers = {
        "api-key": settings.AZURE_SEARCH_API_KEY,
        "Content-Type": "application/json",
    }

    # Generate embeddings for all chunks
    logger.info(f"Generating embeddings for {len(chunks)} chunks...")
    enriched = []
    for chunk in chunks:
        vector = await get_embedding(chunk["content"])
        doc = {
            "@search.action": "mergeOrUpload",
            "id": chunk["id"],
            "source_file": chunk["source_file"],
            "content": chunk["content"],
        }
        if vector:
            doc["content_vector"] = vector
        enriched.append(doc)

    # Batch upload in groups of 100
    batch_size = 100
    total_indexed = 0

    for i in range(0, len(enriched), batch_size):
        batch = enriched[i: i + batch_size]
        payload = {"value": batch}
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code in (200, 207):
                    total_indexed += len(batch)
                    logger.info(f"Indexed batch of {len(batch)} chunks (total: {total_indexed})")
                    # Log any per-document errors from 207
                    if resp.status_code == 207:
                        for item in resp.json().get("value", []):
                            if not item.get("status"):
                                logger.warning(f"Doc {item.get('key')} failed: {item.get('errorMessage')}")
                else:
                    logger.error(f"Azure Search indexing returned {resp.status_code}: {resp.text[:300]}")
        except Exception as e:
            logger.error(f"Azure Search indexing exception: {e}")

    return total_indexed > 0


async def index_pdf(pdf_path: str) -> bool:
    """Full pipeline: Extract text from PDF → chunk → embed → index into Azure AI Search."""
    filename = Path(pdf_path).name
    logger.info(f"Starting indexing pipeline for: {filename}")

    chunks = extract_text_chunks(pdf_path)
    if not chunks:
        logger.warning(f"No chunks extracted from {filename}")
        return False

    success = await index_chunks_to_azure(chunks)
    if success:
        telemetry.add_indexed_pdf(filename)
        logger.info(f"Successfully indexed {filename} ({len(chunks)} chunks) into Azure AI Search")
    return success


async def bootstrap_index_pdfs():
    """
    Auto-index bootstrap PDFs at server startup.
    Skips PDFs that are already indexed.
    """
    already_indexed = telemetry._store.get("indexed_pdfs", [])
    logger.info(f"Bootstrap PDF indexing started. Already indexed: {already_indexed}")

    for pdf_path in BOOTSTRAP_PDFS:
        filename = Path(pdf_path).name
        if filename in already_indexed:
            logger.info(f"Skipping already-indexed: {filename}")
            continue
        if not Path(pdf_path).exists():
            logger.warning(f"Bootstrap PDF not found, skipping: {pdf_path}")
            continue
        await index_pdf(pdf_path)

    logger.info("Bootstrap PDF indexing complete.")
