from fastapi import APIRouter, HTTPException, UploadFile, File
import logging
from app.services.rag_ingestion import process_and_index_document

router = APIRouter(prefix="/api/documents", tags=["Document Ingestion"])
logger = logging.getLogger(__name__)

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Uploads a PDF, chunks it, embeds it, and indexes it in Azure AI Search."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        file_bytes = await file.read()
        logger.info(f"Received document upload: {file.filename} ({len(file_bytes)} bytes)")
        
        result = await process_and_index_document(file_bytes, file.filename)
        return result
    
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
