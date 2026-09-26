"""
Root runner script to launch the University Voice Assistant Backend from the project root.
"""
import sys
import subprocess
from pathlib import Path

if __name__ == "__main__":
    backend_dir = Path(__file__).resolve().parent / "backend"
    run_script = backend_dir / "run.py"
    try:
        subprocess.run([sys.executable, str(run_script)], cwd=str(backend_dir))
    except KeyboardInterrupt:
        print("\nBackend stopped.")
