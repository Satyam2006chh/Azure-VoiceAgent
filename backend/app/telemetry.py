"""
Telemetry Module — Tracks API usage, query counts, and tool hits in-memory.
Data persists across requests within a single server session.
Saved to a JSON file for cross-restart persistence.
"""

import json
import os
import logging
from datetime import datetime, date
from typing import Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

TELEMETRY_FILE = Path(__file__).parent.parent / "telemetry_data.json"

# ─────────────────────────────────────────
# In-Memory Store
# ─────────────────────────────────────────
_store: Dict[str, Any] = {
    "daily_queries": {},       # {"2025-09-22": 15}
    "tool_hits": {             # tool usage counts
        "rag_university_ordinances": 0,
        "get_university_overview_and_ranking": 0,
        "check_library_status": 0,
        "find_faculty_contact": 0,
        "check_fee_deadlines": 0,
        "out_of_scope": 0,
    },
    "service_calls": {          # total calls per provider
        "sarvam_stt": 0,
        "sarvam_tts": 0,
        "azure_speech_tts": 0,
        "azure_openai": 0,
        "azure_search": 0,
    },
    "daily_service_calls": {},  # {"2025-09-22": {"sarvam_stt": 3, ...}}
    "total_queries": 0,
    "indexed_pdfs": [],         # list of indexed PDF filenames
    "language_hits": {},        # {"hi-IN": 45, "pa-IN": 30, ...}
    "language_latency": {},     # {"hi-IN": [320, 410, ...]} — last 50 latencies per lang
}


def _today() -> str:
    return date.today().isoformat()


def _load():
    """Load telemetry from disk if available."""
    global _store
    if TELEMETRY_FILE.exists():
        try:
            with open(TELEMETRY_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                # Merge saved data into store (keep defaults for missing keys)
                for key in _store:
                    if key in saved:
                        _store[key] = saved[key]
            # Ensure new keys exist for old telemetry files
            _store.setdefault("language_hits", {})
            _store.setdefault("language_latency", {})
            logger.info("Telemetry data loaded from disk.")
        except Exception as e:
            logger.warning(f"Could not load telemetry: {e}")


def _save():
    """Persist telemetry to disk atomically (write to temp file, then rename)."""
    tmp = TELEMETRY_FILE.with_suffix(".tmp")
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(_store, f, indent=2, ensure_ascii=False)
        tmp.replace(TELEMETRY_FILE)  # atomic on POSIX; near-atomic on Windows
    except Exception as e:
        logger.warning(f"Could not save telemetry: {e}")
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass


def record_query(tool_used: str = "rag_university_ordinances", is_out_of_scope: bool = False):
    """Record a completed query with its tool used."""
    today = _today()
    _store["total_queries"] += 1
    _store["daily_queries"][today] = _store["daily_queries"].get(today, 0) + 1

    if is_out_of_scope:
        _store["tool_hits"]["out_of_scope"] = _store["tool_hits"].get("out_of_scope", 0) + 1
    else:
        _store["tool_hits"][tool_used] = _store["tool_hits"].get(tool_used, 0) + 1

    _save()


def record_service_call(service: str):
    """Record an API call to a specific service."""
    today = _today()
    _store["service_calls"][service] = _store["service_calls"].get(service, 0) + 1

    if today not in _store["daily_service_calls"]:
        _store["daily_service_calls"][today] = {}
    _store["daily_service_calls"][today][service] = (
        _store["daily_service_calls"][today].get(service, 0) + 1
    )
    _save()


def add_indexed_pdf(filename: str):
    """Register a newly indexed PDF."""
    if filename not in _store["indexed_pdfs"]:
        _store["indexed_pdfs"].append(filename)
        _save()


def remove_indexed_pdf(filename: str):
    """Remove a PDF from the indexed list."""
    if filename in _store["indexed_pdfs"]:
        _store["indexed_pdfs"].remove(filename)
        _save()


def record_language(language_code: str, latency_ms: int = 0):
    """Record a query's language and response latency for analytics."""
    lang = language_code.strip() if language_code else "unknown"
    _store["language_hits"][lang] = _store["language_hits"].get(lang, 0) + 1

    if latency_ms > 0:
        if lang not in _store["language_latency"]:
            _store["language_latency"][lang] = []
        # Keep last 50 latencies per language to avoid unbounded growth
        _store["language_latency"][lang].append(latency_ms)
        if len(_store["language_latency"][lang]) > 50:
            _store["language_latency"][lang] = _store["language_latency"][lang][-50:]
    _save()


def get_language_stats() -> Dict[str, Any]:
    """Return language usage distribution and avg latency per language."""
    LANG_NAMES = {
        "hi-IN": "Hindi", "en-IN": "English", "pa-IN": "Punjabi",
        "ta-IN": "Tamil", "te-IN": "Telugu", "mr-IN": "Marathi",
        "bn-IN": "Bengali", "gu-IN": "Gujarati", "kn-IN": "Kannada",
        "ml-IN": "Malayalam", "or-IN": "Odia", "unknown": "Unknown",
    }
    hits = dict(_store.get("language_hits", {}))
    latencies = dict(_store.get("language_latency", {}))
    total = sum(hits.values()) or 1

    result = []
    for lang_code, count in sorted(hits.items(), key=lambda x: -x[1]):
        avg_lat = 0
        if lang_code in latencies and latencies[lang_code]:
            avg_lat = int(sum(latencies[lang_code]) / len(latencies[lang_code]))
        result.append({
            "language_code": lang_code,
            "language_name": LANG_NAMES.get(lang_code, lang_code),
            "query_count": count,
            "percentage": round((count / total) * 100, 1),
            "avg_latency_ms": avg_lat,
        })

    return {
        "languages": result,
        "total_queries": sum(hits.values()),
        "total_languages_used": len(hits),
    }


def get_stats() -> Dict[str, Any]:
    """Return full stats for the admin dashboard."""
    today = _today()
    from datetime import timedelta

    # Last 7 days of queries
    last_7 = {}
    for i in range(6, -1, -1):
        d = (date.today() - timedelta(days=i)).isoformat()
        last_7[d] = _store["daily_queries"].get(d, 0)

    today_services = _store["daily_service_calls"].get(today, {})

    return {
        "total_queries": _store["total_queries"],
        "today_queries": _store["daily_queries"].get(today, 0),
        "last_7_days": last_7,
        "tool_hits": dict(_store["tool_hits"]),
        "service_calls_total": dict(_store["service_calls"]),
        "service_calls_today": today_services,
        # Full date-keyed history — every day ever recorded
        "all_daily_queries": dict(_store["daily_queries"]),
        "all_daily_service_calls": dict(_store["daily_service_calls"]),
        "indexed_pdfs": list(_store["indexed_pdfs"]),
    }


def get_daily_breakdown() -> Dict[str, Any]:
    """Return a per-day summary of queries + service calls for all recorded dates."""
    all_dates = sorted(
        set(list(_store["daily_queries"].keys()) + list(_store["daily_service_calls"].keys())),
        reverse=True,  # newest first
    )

    rows = []
    for d in all_dates:
        svc = _store["daily_service_calls"].get(d, {})
        rows.append({
            "date": d,
            "queries": _store["daily_queries"].get(d, 0),
            "sarvam_stt": svc.get("sarvam_stt", 0),
            "sarvam_tts": svc.get("sarvam_tts", 0),
            "azure_speech_tts": svc.get("azure_speech_tts", 0),
            "azure_openai": svc.get("azure_openai", 0),
            "azure_search": svc.get("azure_search", 0),
        })

    return {"rows": rows, "total_days": len(rows)}


# Load saved data on module import
_load()
