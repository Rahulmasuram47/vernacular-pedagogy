"""Offline bilingual worksheet generator. No network calls.

Builds a worksheet from santali_dictionary.json entries filtered by
category. Categories currently available: number, day, greeting,
classroom, noun. New categories are picked up automatically as long as
matching entries exist in the dictionary JSON — no code change needed.
"""

from __future__ import annotations

import json
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DICTIONARY_PATH = _PROJECT_ROOT / "data" / "santali_dictionary.json"

CATEGORY_TITLES = {
    "number": "संख्याएँ (Numbers)",
    "day": "सप्ताह के दिन (Days of the Week)",
    "greeting": "अभिवादन (Greetings)",
    "classroom": "कक्षा के निर्देश (Classroom Instructions)",
    "noun": "सामान्य शब्द (Common Words)",
}


def _load_entries(path: Path | None = None) -> list[dict]:
    dictionary_path = path or DEFAULT_DICTIONARY_PATH
    with dictionary_path.open(encoding="utf-8") as handle:
        entries = json.load(handle)
    if not isinstance(entries, list):
        raise ValueError("Dictionary JSON must be a list of entries")
    return entries


def list_categories(path: Path | None = None) -> list[str]:
    """Return categories that actually have dictionary entries."""
    entries = _load_entries(path)
    seen: list[str] = []
    for entry in entries:
        category = entry.get("category")
        if category and category not in seen:
            seen.append(category)
    return seen


def generate_worksheet(category: str, path: Path | None = None) -> dict:
    """Build a bilingual worksheet for the given category.

    Returns a dict shaped as:
    {
      "title": "...",
      "category": "...",
      "items": [ {"hindi": "...", "santali": "..."} ]
    }
    Raises ValueError if the category has no matching entries.
    """
    entries = _load_entries(path)
    matched = [
        {"hindi": e.get("hindi", ""), "santali": e.get("santali", "")}
        for e in entries
        if e.get("category") == category and e.get("hindi") and e.get("santali")
    ]

    if not matched:
        raise ValueError(f"No dictionary entries found for category '{category}'")

    title = CATEGORY_TITLES.get(category, category)

    return {
        "title": title,
        "category": category,
        "items": matched,
    }