/**
 * Sentence-level Translation Engine for Hindi -> Santali (Ol Chiki).
 * Orchestrates normalization, phrase matching, intent detection,
 * grammar transformation, vocabulary lookup, and confidence scoring.
 */

import { CONFIDENCE_LEVELS, LOW_CONFIDENCE_MESSAGE } from "./types.js";
import { normalizeHindi, tokenizeHindi } from "./normalize.js";
import { VOCABULARY, CANONICAL_PHRASES } from "./vocabulary.js";
import { detectSentenceIntent, INTENTS } from "./intentDetector.js";
import { grammarTransform } from "./grammar.js";

/**
 * Translates Hindi sentence into Santali (Ol Chiki) with confidence scoring.
 *
 * @param {string} text - Input Hindi sentence or phrase
 * @returns {{
 *   hindi: string,
 *   santali: string,
 *   confidence: "high" | "medium" | "low",
 *   needsConfirmation: boolean
 * }}
 */
export function translateSentence(text) {
  const original = text != null ? String(text).trim() : "";
  const normalized = normalizeHindi(original);

  // 1. Empty input
  if (!normalized) {
    return {
      hindi: original,
      santali: "",
      confidence: CONFIDENCE_LEVELS.LOW,
      needsConfirmation: false,
    };
  }

  // 2. Canonical Phrase Exact Match (highest priority)
  if (CANONICAL_PHRASES[normalized]) {
    return {
      hindi: original,
      santali: CANONICAL_PHRASES[normalized],
      confidence: CONFIDENCE_LEVELS.HIGH,
      needsConfirmation: false,
    };
  }

  // 3. Single-Word / Concept Exact Match
  if (VOCABULARY[normalized]) {
    return {
      hindi: original,
      santali: VOCABULARY[normalized],
      confidence: CONFIDENCE_LEVELS.HIGH,
      needsConfirmation: false,
    };
  }

  const tokens = tokenizeHindi(normalized);

  // 4. Intent Detection & Grammar Transformation (Sentence-Level Paraphrases)
  const intentInfo = detectSentenceIntent(tokens, normalized);

  if (intentInfo.intent !== INTENTS.UNKNOWN) {
    const synthesized = grammarTransform(intentInfo);
    if (synthesized) {
      return {
        hindi: original,
        santali: synthesized,
        confidence: CONFIDENCE_LEVELS.HIGH,
        needsConfirmation: false,
      };
    }
  }

  // 5. Multi-word Token Vocabulary Assembly (Fallback)
  const matchedSantaliWords = [];
  let recognizedCount = 0;
  let totalCount = 0;

  for (const token of tokens) {
    // Skip minor Hindi helper postpositions for scoring
    if (["के", "का", "की", "में", "से", "पर", "को", "है", "हैं", "था", "थी"].includes(token)) {
      continue;
    }
    totalCount++;
    if (VOCABULARY[token]) {
      matchedSantaliWords.push(VOCABULARY[token]);
      recognizedCount++;
    }
  }

  // If a significant portion of words are recognized, return medium confidence
  if (totalCount > 0 && recognizedCount / totalCount >= 0.6) {
    return {
      hindi: original,
      santali: matchedSantaliWords.join(" "),
      confidence: CONFIDENCE_LEVELS.MEDIUM,
      needsConfirmation: false,
    };
  }

  // 6. Unknown / Low Confidence: NEVER output [?]; output honest confirmation message
  return {
    hindi: original,
    santali: LOW_CONFIDENCE_MESSAGE,
    confidence: CONFIDENCE_LEVELS.LOW,
    needsConfirmation: true,
  };
}
