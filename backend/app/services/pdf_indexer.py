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
from typing import List, Dict, Any
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
    Each chunk is tagged with source file, page number, and chunk index.
    """
    chunks = []
    try:
        doc = fitz.open(pdf_path)
        filename = Path(pdf_path).stem
        full_text = ""
        page_map = []  # (char_start, page_num)

        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            page_map.append((len(full_text), page_num + 1))
            full_text += text + "\n"

        doc.close()

        # Split into chunks with 50-word overlap
        words = full_text.split()
        overlap = 50
        step = chunk_size - overlap

        for i, start in enumerate(range(0, len(words), step)):
            chunk_words = words[start: start + chunk_size]
            if len(chunk_words) < 30:  # Skip tiny fragments
                continue
            chunk_text = " ".join(chunk_words)

            # Clean up excessive whitespace
            chunk_text = re.sub(r'\s+', ' ', chunk_text).strip()

            chunk_id = f"{filename}-chunk-{i}"
            chunks.append({
                "id": chunk_id,
                "title": _title_from_filename(filename),
                "section": f"Page chunk {i+1}",
                "category": _category_from_filename(filename),
                "content": chunk_text,
                "source_file": Path(pdf_path).name,
            })

        logger.info(f"Extracted {len(chunks)} chunks from {Path(pdf_path).name}")
    except Exception as e:
        logger.error(f"PDF extraction failed for {pdf_path}: {e}")

    return chunks


def _title_from_filename(name: str) -> str:
    """Convert snake_case filename to readable title."""
    return name.replace("_", " ").replace("-", " ").title()


def _category_from_filename(name: str) -> str:
    """Map filename to a category tag."""
    name_lower = name.lower()
    if "academic" in name_lower or "rule" in name_lower:
        return "academic_rules"
    if "library" in name_lower:
        return "library"
    if "exam" in name_lower:
        return "examination"
    if "fee" in name_lower or "circular" in name_lower:
        return "fees"
    if "hostel" in name_lower:
        return "hostel"
    return "university_ordinances"


async def index_chunks_to_azure(chunks: List[Dict[str, Any]]) -> bool:
    """
    Upload document chunks to Azure AI Search index using the Upload Documents API.
    Creates or updates documents (merge-or-upload).
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

    # Batch in groups of 100 (Azure limit per request)
    batch_size = 100
    total_indexed = 0

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i: i + batch_size]
        payload = {
            "value": [
                {"@search.action": "mergeOrUpload", **chunk}
                for chunk in batch
            ]
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code in (200, 207):
                    total_indexed += len(batch)
                    logger.info(f"Indexed batch of {len(batch)} chunks (total: {total_indexed})")
                else:
                    logger.warning(f"Azure Search indexing returned {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.error(f"Azure Search indexing exception: {e}")

    return total_indexed > 0


async def index_pdf(pdf_path: str) -> bool:
    """Full pipeline: Extract text from PDF → chunk → index into Azure AI Search."""
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
