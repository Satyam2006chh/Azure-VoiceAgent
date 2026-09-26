"""
Azure RAG Ingestion Service.
Reads PDFs, chunks them with TikToken overlap, embeds them using Azure OpenAI,
and pushes the vectors to Azure AI Search.
"""
import os
import io
import time
import uuid
import logging
import tiktoken
import pymupdf  # PyMuPDF
from typing import List, Dict, Any
from app.config import settings

# Azure SDKs
from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    VectorSearch,
    HnswAlgorithmConfiguration,
    VectorSearchProfile
)
import httpx

logger = logging.getLogger(__name__)

async def get_embeddings(text: str) -> List[float]:
    """Generates vector using Azure OpenAI embedding deployment."""
    deployment = getattr(settings, "AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
    url = f"{settings.AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/deployments/{deployment}/embeddings?api-version=2024-02-15-preview"
    headers = {"api-key": settings.AZURE_OPENAI_API_KEY, "Content-Type": "application/json"}
    payload = {"input": text}
    
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=payload, timeout=20.0)
        r.raise_for_status()
        return r.json()["data"][0]["embedding"]

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts all text from a PDF file."""
    doc = pymupdf.open("pdf", pdf_bytes)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

def chunk_text(text: str, chunk_size: int = 400, chunk_overlap: int = 50) -> List[str]:
    """Chunks text accurately using tiktoken."""
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    
    chunks = []
    i = 0
    while i < len(tokens):
        chunk_tokens = tokens[i:i + chunk_size]
        chunks.append(enc.decode(chunk_tokens))
        i += chunk_size - chunk_overlap
    return chunks

def ensure_index_exists(index_name: str):
    """Creates the Azure AI Search index if it doesn't exist."""
    endpoint = settings.AZURE_SEARCH_ENDPOINT
    key = settings.AZURE_SEARCH_API_KEY
    if not endpoint or not key:
        logger.error("Azure Search credentials missing.")
        return

    credential = AzureKeyCredential(key)
    index_client = SearchIndexClient(endpoint=endpoint, credential=credential)
    
    if index_name not in [name for name in index_client.list_index_names()]:
        logger.info(f"Creating new Azure Search index: {index_name}")
        
        fields = [
            SimpleField(name="id", type=SearchFieldDataType.String, key=True),
            SimpleField(name="source_file", type=SearchFieldDataType.String, filterable=True),
            SearchableField(name="content", type=SearchFieldDataType.String),
            SearchField(
                name="content_vector",
                type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
                searchable=True,
                vector_search_dimensions=1536,
                vector_search_profile_name="myHnswProfile"
            )
        ]
        
        vector_search = VectorSearch(
            algorithms=[HnswAlgorithmConfiguration(name="myHnsw")],
            profiles=[VectorSearchProfile(name="myHnswProfile", algorithm_configuration_name="myHnsw")]
        )
        
        index = SearchIndex(name=index_name, fields=fields, vector_search=vector_search)
        index_client.create_index(index)
        logger.info("Index created successfully.")

async def process_and_index_document(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """End-to-End Pipeline: PDF -> Text -> Chunks -> Embeddings -> Azure AI Search."""
    t0 = time.time()
    
    # 1. Extract
    text = extract_text_from_pdf(file_bytes)
    if not text.strip():
        raise ValueError("Could not extract text from PDF.")
        
    # 2. Chunk
    chunks = chunk_text(text)
    
    # 3. Initialize Search Client
    index_name = settings.AZURE_SEARCH_INDEX_NAME
    ensure_index_exists(index_name)
    
    credential = AzureKeyCredential(settings.AZURE_SEARCH_API_KEY)
    search_client = SearchClient(endpoint=settings.AZURE_SEARCH_ENDPOINT, index_name=index_name, credential=credential)
    
    # 4. Embed and Upload
    documents_to_upload = []
    for i, chunk in enumerate(chunks):
        vector = await get_embeddings(chunk)
        doc_id = str(uuid.uuid4())
        
        documents_to_upload.append({
            "id": doc_id,
            "source_file": filename,
            "content": chunk,
            "content_vector": vector
        })
        
    search_client.upload_documents(documents=documents_to_upload)
    
    return {
        "status": "success",
        "filename": filename,
        "chunks_indexed": len(documents_to_upload),
        "processing_time_sec": round(time.time() - t0, 2)
    }
