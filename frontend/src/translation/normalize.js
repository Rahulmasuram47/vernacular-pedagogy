/**
 * Normalization utilities for Hindi text and ASR transcripts.
 */

const ASR_FILLERS = [
  /\b(अम्म|अह|उम|उम्म|हम्म)\b/gi,
  /\b(uh|um|er|ah)\b/gi,
];

const SPELLING_NORMALIZATIONS = [
  [/पांच/g, "पाँच"],
  [/यहा\b/g, "यहाँ"],
  [/वहा\b/g, "वहाँ"],
  [/खडा\b/g, "खड़ा"],
  [/बच्चो\b/g, "बच्चों"],
  [/छात्रो\b/g, "छात्रों"],
  [/कितापे\b/g, "किताबें"],
];

/**
 * Normalizes Hindi text:
 * - NFC Unicode normalization
 * - Strips zero-width joiners / non-joiners
 * - Normalizes ASR filler sounds and spelling variants
 * - Collapses whitespace
 * - Strips punctuation
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeHindi(text) {
  if (text == null) return "";
  let str = String(text).normalize("NFC");

  // Remove zero-width characters
  str = str.replace(/[\u200c\u200d\ufeff]/g, "");

  // Remove ASR fillers
  for (const pattern of ASR_FILLERS) {
    str = str.replace(pattern, "");
  }

  // Strip leading and trailing punctuation (including Hindi danda)
  str = str.replace(/[।॥!?.,;:—\-"'“”‘’()[\]{}<>\/\\~`_+=*&^%$#@]/g, " ");

  // Normalise spelling variants
  for (const [pattern, replacement] of SPELLING_NORMALIZATIONS) {
    str = str.replace(pattern, replacement);
  }

  // Collapse multiple spaces
  str = str.trim().replace(/\s+/g, " ");

  return str;
}

/**
 * Tokenizes normalized Hindi text into clean words.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenizeHindi(text) {
  const normalized = normalizeHindi(text);
  if (!normalized) return [];
  return normalized.split(" ").filter(Boolean);
}
