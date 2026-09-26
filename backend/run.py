"""
Runner script for the FastAPI backend server.
"""

import sys
from pathlib import Path
import uvicorn

# Ensure backend directory is in sys.path and set as app_dir
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import settings

if __name__ == "__main__":
    print(f"Starting University Voice Assistant Backend on http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT}")
    print(f"Interactive Swagger Docs available at http://localhost:{settings.BACKEND_PORT}/docs")
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
        app_dir=str(backend_dir)
    )

