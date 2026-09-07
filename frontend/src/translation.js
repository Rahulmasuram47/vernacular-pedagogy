/**
 * Unified offline Hindi -> Santali translation entry point.
 * Powered by sentence-level intent detection, grammar transformation,
 * and educational domain vocabulary in ./translation/.
 */

import { translateSentence } from "./translation/engine.js";
import { normalizeHindi } from "./translation/normalize.js";
import {
  CONFIDENCE_LEVELS,
  CONFIDENCE_LABELS,
  LOW_CONFIDENCE_MESSAGE,
} from "./translation/types.js";

export {
  translateSentence,
  normalizeHindi,
  normalizeHindi as normalize,
  CONFIDENCE_LEVELS,
  CONFIDENCE_LABELS,
  LOW_CONFIDENCE_MESSAGE,
};

/**
 * Main translation function called by App.jsx and api.js.
 *
 * @param {string} text - Input Hindi text
 * @returns {{
 *   hindi: string,
 *   santali: string,
 *   confidence: "high" | "medium" | "low",
 *   needsConfirmation: boolean
 * }}
 */
export function translate(text) {
  return translateSentence(text);
}
