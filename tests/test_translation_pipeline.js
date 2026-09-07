/**
 * Comprehensive Unit Tests for Offline Hindi -> Santali Translation Pipeline.
 */

import assert from "node:assert/strict";
import { translateSentence } from "../frontend/src/translation/engine.js";
import { normalizeHindi } from "../frontend/src/translation/normalize.js";
import {
  CONFIDENCE_LEVELS,
  CONFIDENCE_LABELS,
  LOW_CONFIDENCE_MESSAGE,
} from "../frontend/src/translation/types.js";

let testsRun = 0;
let testsPassed = 0;

function runTest(name, fn) {
  testsRun++;
  try {
    fn();
    testsPassed++;
    console.log(`✓ PASS: ${name}`);
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err);
  }
}

console.log("=== RUNNING TRANSLATION PIPELINE UNIT TESTS ===\n");

// 1. Exact canonical phrases
runTest("Exact Match: Greeting 'नमस्ते'", () => {
  const res = translateSentence("नमस्ते");
  assert.equal(res.hindi, "नमस्ते");
  assert.equal(res.santali, "ᱡᱚᱦᱟᱨ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
  assert.equal(res.needsConfirmation, false);
});

runTest("Exact Match: Instruction 'किताब खोलो'", () => {
  const res = translateSentence("किताब खोलो");
  assert.equal(res.santali, "ᱯᱚᱛᱚᱵ ᱡᱷᱤᱡ ᱢᱮ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
  assert.equal(res.needsConfirmation, false);
});

runTest("Exact Match: Punctuation and Danda stripped '  बैठ जाओ। '", () => {
  const res = translateSentence("  बैठ जाओ। ");
  assert.equal(res.santali, "ᱫᱩᱲᱩᱵ ᱢᱮ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
  assert.equal(res.needsConfirmation, false);
});

// 2. Singular vs Plural Imperatives
runTest("Singular Imperative: 'बैठ जाओ' uses -me (ᱢᱮ)", () => {
  const res = translateSentence("बैठ जाओ");
  assert.ok(res.santali.includes("ᱢᱮ"), `Expected 'ᱢᱮ' in ${res.santali}`);
  assert.equal(res.santali, "ᱫᱩᱲᱩᱵ ᱢᱮ");
});

runTest("Plural Imperative: 'सब लोग बैठ जाओ' uses -pe (ᱯᱮ)", () => {
  const res = translateSentence("सब लोग बैठ जाओ");
  assert.ok(res.santali.includes("ᱯᱮ"), `Expected 'ᱯᱮ' in ${res.santali}`);
  assert.equal(res.santali, "ᱡᱚᱛᱚ ᱦᱚᱲ ᱫᱩᱲᱩᱵ ᱯᱮ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
});

// 3. Sentence-level Paraphrases
runTest("Paraphrase: 'सब लोग बैठ जाओ' and 'सब लोग बैठो' resolve to same action", () => {
  const res1 = translateSentence("सब लोग बैठ जाओ");
  const res2 = translateSentence("सब लोग बैठो");
  assert.equal(res1.santali, "ᱡᱚᱛᱚ ᱦᱚᱲ ᱫᱩᱲᱩᱵ ᱯᱮ");
  assert.equal(res2.santali, "ᱡᱚᱛᱚ ᱦᱚᱲ ᱫᱩᱲᱩᱵ ᱯᱮ");
  assert.equal(res1.santali, res2.santali);
});

runTest("Paraphrase: 'सभी बच्चे बैठ जाओ' and 'सभी बच्चे बैठो' resolve identically", () => {
  const res1 = translateSentence("सभी बच्चे बैठ जाओ");
  const res2 = translateSentence("सभी बच्चे बैठो");
  assert.equal(res1.santali, "ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹᱠᱚ ᱫᱩᱲᱩᱵ ᱯᱮ");
  assert.equal(res2.santali, "ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹᱠᱚ ᱫᱩᱲᱩᱵ ᱯᱮ");
});

// 4. Classroom Instructions Variation
runTest("Classroom Variation: 'सभी बच्चे ध्यान से सुनो'", () => {
  const res = translateSentence("सभी बच्चे ध्यान से सुनो");
  assert.equal(res.santali, "ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹᱠᱚ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱯᱮ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
});

runTest("Classroom Action: 'यहाँ आओ'", () => {
  const res = translateSentence("यहाँ आओ");
  assert.equal(res.santali, "ᱱᱚᱰᱮ ᱦᱮᱡ ᱢᱮ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
});

runTest("Classroom Action: 'चुप रहो'", () => {
  const res = translateSentence("चुप रहो");
  assert.equal(res.santali, "ᱪᱩᱯ ᱛᱟᱦᱮᱸᱱ ᱢᱮ");
  assert.equal(res.confidence, CONFIDENCE_LEVELS.HIGH);
});

// 5. Unknown Vocabulary & No [?] Marker
runTest("Unknown Vocabulary: No [?] marker, honest confirmation message", () => {
  const res = translateSentence("अज्ञात कंप्यूटर रोबोट");
  assert.ok(!res.santali.includes("[?]"), `Must not contain [?], got: ${res.santali}`);
  assert.equal(res.santali, LOW_CONFIDENCE_MESSAGE);
  assert.equal(res.confidence, CONFIDENCE_LEVELS.LOW);
  assert.equal(res.needsConfirmation, true);
});

// 6. Empty / Whitespace Input
runTest("Empty / Whitespace input handling", () => {
  const res1 = translateSentence("");
  assert.equal(res1.santali, "");
  assert.equal(res1.needsConfirmation, false);

  const res2 = translateSentence("   ");
  assert.equal(res2.santali, "");
  assert.equal(res2.needsConfirmation, false);
});

// 7. Confidence Score Labels
runTest("Confidence label mappings match specifications", () => {
  assert.equal(CONFIDENCE_LABELS.high, "✓ उच्च विश्वसनीयता");
  assert.equal(CONFIDENCE_LABELS.medium, "~ अनुमानित अनुवाद");
  assert.equal(CONFIDENCE_LABELS.low, "⚠ कृपया अनुवाद की पुष्टि करें");
});

console.log(`\n=== TEST SUMMARY: ${testsPassed}/${testsRun} PASSED ===`);
if (testsPassed !== testsRun) {
  process.exit(1);
}
