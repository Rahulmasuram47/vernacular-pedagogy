/**
 * Santali grammar transformations and sentence generation.
 * Handles SOV ordering, singular/plural imperative markers (ᱢᱮ / ᱯᱮ),
 * and educational sentence synthesis.
 */

import { INTENTS } from "./intentDetector.js";
import { VOCABULARY } from "./vocabulary.js";

// Santali imperative markers
const IMPERATIVE_SINGULAR = "ᱢᱮ";
const IMPERATIVE_PLURAL = "ᱯᱮ";

/**
 * Maps intents to base Santali verb stems and default objects/modifiers.
 */
const INTENT_VERB_MAP = {
  [INTENTS.SIT]: {
    stem: "ᱫᱩᱲᱩᱵ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.STAND]: {
    stem: "ᱛᱤᱸᱜᱩ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.OPEN_BOOK]: {
    stem: "ᱡᱷᱤᱡ",
    defaultModifier: null,
    defaultObject: "ᱯᱚᱛᱚᱵ", // book
  },
  [INTENTS.CLOSE_BOOK]: {
    stem: "ᱵᱚᱸᱫᱽ",
    defaultModifier: null,
    defaultObject: "ᱯᱚᱛᱚᱵ",
  },
  [INTENTS.LISTEN]: {
    stem: "ᱟᱸᱡᱚᱢ",
    defaultModifier: "ᱫᱷᱮᱭᱟᱱ ᱛᱮ", // carefully
    defaultObject: null,
  },
  [INTENTS.SILENCE]: {
    stem: "ᱪᱩᱯ ᱛᱟᱦᱮᱸᱱ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.READ]: {
    stem: "ᱯᱟᱲᱦᱟᱣ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.WRITE]: {
    stem: "ᱚᱞ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.SPEAK]: {
    stem: "ᱨᱚᱲ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.LOOK]: {
    stem: "ᱧᱮᱞ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.COME]: {
    stem: "ᱦᱮᱡ",
    defaultModifier: "ᱱᱚᱰᱮ", // here
    defaultObject: null,
  },
  [INTENTS.GO]: {
    stem: "ᱪᱟᱞᱟᱣ",
    defaultModifier: "ᱚᱸᱰᱮ", // there
    defaultObject: null,
  },
  [INTENTS.COUNT]: {
    stem: "ᱞᱮᱠᱷᱟᱭ",
    defaultModifier: null,
    defaultObject: null,
  },
  [INTENTS.GREETING]: {
    stem: "ᱡᱚᱦᱟᱨ",
    isGreeting: true,
  },
};

/**
 * Assembles parsed grammatical constituents into valid Santali word order.
 *
 * @param {{
 *   intent: string,
 *   isPlural: boolean,
 *   subject: string | null,
 *   object: string | null,
 *   modifier: string | null
 * }} intentInfo
 * @returns {string | null}
 */
export function grammarTransform(intentInfo) {
  const { intent, isPlural, subject, object, modifier } = intentInfo;

  if (intent === INTENTS.UNKNOWN) {
    return null;
  }

  const mapping = INTENT_VERB_MAP[intent];
  if (!mapping) return null;

  if (mapping.isGreeting) {
    return "ᱡᱚᱦᱟᱨ";
  }

  const parts = [];

  // 1. Subject (SOV: Subject first)
  if (subject) {
    const santaliSubject = VOCABULARY[subject];
    if (santaliSubject) {
      parts.push(santaliSubject);
    }
  }

  // 2. Spatial / Adverbial Modifier
  let santaliMod = null;
  if (modifier && VOCABULARY[modifier]) {
    santaliMod = VOCABULARY[modifier];
  } else if (mapping.defaultModifier) {
    santaliMod = mapping.defaultModifier;
  }
  if (santaliMod) {
    parts.push(santaliMod);
  }

  // 3. Direct Object
  let santaliObj = null;
  if (object && VOCABULARY[object]) {
    santaliObj = VOCABULARY[object];
  } else if (mapping.defaultObject) {
    santaliObj = mapping.defaultObject;
  }
  if (santaliObj) {
    parts.push(santaliObj);
  }

  // 4. Verb Stem + Imperative Marker
  const verbStem = mapping.stem;
  const marker = isPlural ? IMPERATIVE_PLURAL : IMPERATIVE_SINGULAR;

  parts.push(`${verbStem} ${marker}`);

  return parts.join(" ").trim();
}
