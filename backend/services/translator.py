"""Offline Hindi → Santali dictionary translator. No network calls."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

UNKNOWN_MARKER = "[?]"

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DICTIONARY_PATH = _PROJECT_ROOT / "data" / "santali_dictionary.json"

_LOOKUP: dict[str, str] = {}


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFC", text or "")
    text = text.replace("\u200c", "").replace("\u200d", "")
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.strip("।!?.,;:\"'“”‘’()[]{}")
    return text


def _normalize_token(token: str) -> str:
    return _normalize(token)


def load_dictionary(path: Path | None = None) -> dict[str, str]:
    """Load JSON entries into an in-memory Hindi → Santali map.

    New vocabulary is added by appending objects to santali_dictionary.json
    with keys: hindi, santali, category. Duplicate Hindi keys keep the first.
    """
    dictionary_path = path or DEFAULT_DICTIONARY_PATH
    with dictionary_path.open(encoding="utf-8") as handle:
        entries = json.load(handle)

    lookup: dict[str, str] = {}
    if not isinstance(entries, list):
        raise ValueError("Dictionary JSON must be a list of entries")

    for entry in entries:
        hindi = _normalize(str(entry.get("hindi", "")))
        santali = str(entry.get("santali", "")).strip()
        if not hindi or not santali:
            continue
        lookup.setdefault(hindi, santali)

    return lookup


def _ensure_loaded() -> None:
    global _LOOKUP
    if not _LOOKUP:
        _LOOKUP = load_dictionary()


def reload_dictionary(path: Path | None = None) -> None:
    global _LOOKUP
    _LOOKUP = load_dictionary(path)


def translate(text: str) -> dict:
    """Translate Hindi text using exact then word-by-word dictionary lookup."""
    _ensure_loaded()
    original = text if text is not None else ""
    normalized = _normalize(original)

    if not normalized:
        return {"hindi": original, "santali": "", "confidence": "partial"}

    exact = _LOOKUP.get(normalized)
    if exact is not None:
        return {"hindi": original, "santali": exact, "confidence": "exact"}

    parts: list[str] = []
    for token in normalized.split(" "):
        key = _normalize_token(token)
        if not key:
            continue
        found = _LOOKUP.get(key)
        if found is not None:
            parts.append(found)
        else:
            parts.append(f"{token}{UNKNOWN_MARKER}")

    return {
        "hindi": original,
        "santali": " ".join(parts),
        "confidence": "partial",
    }


reload_dictionary()
