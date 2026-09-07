/**
 * Truly offline bilingual worksheet generator.
 * Runs completely in-app with zero network calls.
 *
 * Direct port of backend/services/worksheet.py.
 */

import dictionary from "./data/santali_dictionary.json" with { type: "json" };

export const CATEGORY_TITLES = {
  number: "संख्याएँ (Numbers)",
  day: "सप्ताह के दिन (Days of the Week)",
  greeting: "अभिवादन (Greetings)",
  classroom: "कक्षा के निर्देश (Classroom Instructions)",
  noun: "सामान्य शब्द (Common Words)",
};

/**
 * Returns list of distinct categories currently present in the dictionary.
 * Preserves insertion order from the dictionary file.
 *
 * @returns {string[]}
 */
export function listCategories() {
  const seen = [];
  for (const entry of dictionary) {
    const category = entry.category;
    if (category && !seen.includes(category)) {
      seen.push(category);
    }
  }
  return seen;
}

/**
 * Builds a bilingual worksheet for the given category.
 *
 * @param {string} category
 * @returns {{ title: string, category: string, items: Array<{ hindi: string, santali: string }> }}
 */
export function generateWorksheet(category) {
  const matched = dictionary
    .filter(
      (entry) =>
        entry.category === category &&
        Boolean(entry.hindi) &&
        Boolean(entry.santali)
    )
    .map((entry) => ({
      hindi: String(entry.hindi),
      santali: String(entry.santali),
    }));

  if (matched.length === 0) {
    throw new Error(`No dictionary entries found for category '${category}'`);
  }

  const title = CATEGORY_TITLES[category] || category;

  return {
    title,
    category,
    items: matched,
  };
}
