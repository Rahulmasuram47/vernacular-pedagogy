/**
 * API abstraction layer.
 *
 * All operations now execute completely locally on-device via
 * in-app JS modules (translation.js and worksheet.js) without network calls.
 * Function signatures are preserved identically for App.jsx compatibility.
 */

import { translate } from "./translation.js";
import { listCategories, generateWorksheet } from "./worksheet.js";

/**
 * Translates Hindi text into Santali (Ol Chiki) using local dictionary lookup.
 *
 * @param {string} text
 * @returns {Promise<{ hindi: string, santali: string, confidence: "exact" | "partial" }>}
 */
export async function callTranslate(text) {
  return translate(text);
}

/**
 * Returns available worksheet categories from local dictionary.
 *
 * @returns {Promise<{ categories: string[] }>}
 */
export async function fetchWorksheetCategories() {
  return {
    categories: listCategories(),
  };
}

/**
 * Generates a bilingual worksheet for the selected category.
 *
 * @param {string} category
 * @returns {Promise<{ title: string, category: string, items: Array<{ hindi: string, santali: string }> }>}
 */
export async function callWorksheet(category) {
  return generateWorksheet(category);
}