import sys
import unittest
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services.translator import translate  # noqa: E402


class TranslatorTests(unittest.TestCase):
    def test_exact_match_greeting(self):
        result = translate("नमस्ते")
        self.assertEqual(result["hindi"], "नमस्ते")
        self.assertEqual(result["santali"], "ᱡᱚᱦᱟᱨ")
        self.assertEqual(result["confidence"], "exact")

    def test_exact_match_phrase_ignores_extra_space_and_danda(self):
        result = translate("  बैठ जाओ। ")
        self.assertEqual(result["santali"], "ᱫᱩᱲᱩᱵ ᱢᱮ")
        self.assertEqual(result["confidence"], "exact")
        self.assertEqual(result["hindi"], "  बैठ जाओ। ")

    def test_partial_match_known_and_unknown_words(self):
        result = translate("शिक्षक और छात्र")
        self.assertEqual(result["confidence"], "partial")
        self.assertIn("ᱢᱟᱪᱮᱛ", result["santali"])
        self.assertIn("ᱯᱟᱹᱴᱷᱩᱣᱟᱹ", result["santali"])
        self.assertIn("और[?]", result["santali"])
        self.assertEqual(result["santali"], "ᱢᱟᱪᱮᱛ और[?] ᱯᱟᱹᱴᱷᱩᱣᱟᱹ")


if __name__ == "__main__":
    unittest.main()
