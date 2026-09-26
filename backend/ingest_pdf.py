import asyncio
import argparse
import sys
import os

# Add the parent directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.rag_ingestion import process_and_index_document

async def main():
    parser = argparse.ArgumentParser(description="Ingest a local PDF into Azure AI Search")
    parser.add_argument("pdf_path", help="Path to the local PDF file")
    args = parser.parse_args()

    pdf_path = args.pdf_path
    if not os.path.exists(pdf_path):
        print(f"Error: File not found -> {pdf_path}")
        return

    filename = os.path.basename(pdf_path)
    print(f"Reading {filename}...")
    
    with open(pdf_path, "rb") as f:
        file_bytes = f.read()

    print("Processing, chunking, embedding, and indexing into Azure AI Search...")
    print("Please wait, this may take a few moments depending on the file size.")
    
    try:
        result = await process_and_index_document(file_bytes, filename)
        print("\n[SUCCESS] Success!")
        print(f"- File: {result['filename']}")
        print(f"- Chunks Indexed: {result['chunks_indexed']}")
        print(f"- Time Taken: {result['processing_time_sec']} seconds")
    except Exception as e:
        print(f"\n[ERROR] Error during ingestion: {e}")

if __name__ == "__main__":
    asyncio.run(main())
