"""Performance check: confirms translation responses are well under the
~3 second target from the problem statement, using local dictionary
lookups only (no network calls)."""

import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.translator import translate

SAMPLE_SENTENCES = [
    "बैठ जाओ",
    "किताब खोलो",
    "ध्यान से सुनो",
    "नमस्ते",
    "धन्यवाद",
    "एक",
    "दो पानी",
    "छात्र किताब पढ़ो",
    "यहाँ आओ",
    "चुप रहो",
]

TARGET_MS = 3000


def run_performance_check():
    results = []
    for sentence in SAMPLE_SENTENCES:
        start = time.perf_counter()
        result = translate(sentence)
        elapsed_ms = (time.perf_counter() - start) * 1000
        results.append((sentence, elapsed_ms, result["confidence"]))

    print(f"{'Sentence':<30} {'Time (ms)':<12} {'Confidence'}")
    print("-" * 60)
    for sentence, elapsed_ms, confidence in results:
        print(f"{sentence:<30} {elapsed_ms:<12.3f} {confidence}")

    max_time = max(r[1] for r in results)
    avg_time = sum(r[1] for r in results) / len(results)

    print("-" * 60)
    print(f"Average: {avg_time:.3f} ms | Max: {max_time:.3f} ms | Target: {TARGET_MS} ms")

    assert max_time < TARGET_MS, (
        f"Translation exceeded {TARGET_MS}ms target: {max_time:.3f}ms"
    )
    print("\n✅ All translations well under the 3-second target.")

    return {"average_ms": avg_time, "max_ms": max_time}


if __name__ == "__main__":
    run_performance_check()