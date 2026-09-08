/**
 * Truly offline bilingual worksheet generator.
 * Runs completely in-app with zero network calls.
 * Enriched with FLN / NIPUN Bharat curriculum alignment, metadata, and bilingual instructions.
 */

import dictionary from "./data/santali_dictionary.json" with { type: "json" };

export const CATEGORY_TITLES = {
  number: "संख्याएँ (Numbers)",
  day: "सप्ताह के दिन (Days of the Week)",
  greeting: "अभिवादन (Greetings)",
  classroom: "कक्षा के निर्देश (Classroom Instructions)",
  noun: "सामान्य शब्द (Common Words)",
};

export const CATEGORY_CURRICULUM_META = {
  number: {
    grade: "कक्षा 1",
    subject: "संख्या ज्ञान (Numeracy)",
    learningOutcome: "FLN-NUM-1.1",
    outcomeDescription: "1 से 20 तक संख्याओं की पहचान, उच्चारण एवं संताली (ओल चिकी) में लेखन अभ्यास",
    instructionsHindi: "निर्देश: नीचे दिए गए हिंदी अंकों/शब्दों को पढ़ें और सामने संताली (ओल चिकी) में लिखने का अभ्यास करें।",
    instructionsSantali: "ᱫᱤᱥᱟᱹ: ᱞᱟᱛᱟᱨ ᱨᱮ ᱚᱞ ᱟᱠᱟᱱ ᱞᱮᱠᱷᱟ ᱠᱚ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱥᱟᱢᱟᱝ ᱨᱮ ᱚᱞ ᱢᱮ᱾",
  },
  day: {
    grade: "कक्षा 1 & 2",
    subject: "भाषा एवं साक्षरता (Language)",
    learningOutcome: "FLN-LANG-1.3",
    outcomeDescription: "सप्ताह के सात दिनों के नाम समझना एवं मातृभाषा में लेखन",
    instructionsHindi: "निर्देश: दिनों के नाम बोलें और संताली (ओल चिकी) में लिखने का अभ्यास करें।",
    instructionsSantali: "ᱫᱤᱥᱟᱹ: ᱢᱟᱦᱟᱸ ᱠᱚᱣᱟᱜ ᱧᱩᱛᱩᱢ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱥᱟᱱᱛᱟᱲᱤ ᱛᱮ ᱚᱞ ᱢᱮ᱾",
  },
  greeting: {
    grade: "कक्षा 1",
    subject: "भाषा एवं साक्षरता (Language)",
    learningOutcome: "FLN-LANG-1.1",
    outcomeDescription: "कक्षा शिष्टाचार एवं मातृभाषा आधारित अभिवादन का अभ्यास",
    instructionsHindi: "निर्देश: अभिवादन शब्दों का उच्चारण करें और संताली रूप लिखें।",
    instructionsSantali: "ᱫᱤᱥᱟᱹ: ᱡᱚᱦᱟᱨ ᱟᱹᱲᱟᱹ ᱠᱚ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱚᱞ ᱢᱮ᱾",
  },
  classroom: {
    grade: "कक्षा 1 & 2",
    subject: "भाषा एवं साक्षरता (Language)",
    learningOutcome: "FLN-LANG-1.2",
    outcomeDescription: "कक्षा निर्देशों का बोध एवं द्विभाषी अभिव्यक्ति",
    instructionsHindi: "निर्देश: निर्देशों को ध्यान से पढ़ें और संताली में अर्थ समझकर लिखें।",
    instructionsSantali: "ᱫᱤᱥᱟᱹ: ᱦᱩᱠᱩᱢ ᱠᱚ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱚᱞ ᱢᱮ᱾",
  },
  noun: {
    grade: "कक्षा 1 & 2",
    subject: "भाषा एवं साक्षरता (Language)",
    learningOutcome: "FLN-LANG-2.1",
    outcomeDescription: "कक्षा एवं दैनिक जीवन के प्रमुख संज्ञा शब्दों की पहचान एवं लेखन",
    instructionsHindi: "निर्देश: वस्तुओं के नाम पढ़ें और संताली शब्द का अभ्यास करें।",
    instructionsSantali: "ᱫᱤᱥᱟᱹ: ᱡᱤᱱᱤᱥ ᱠᱚᱣᱟᱜ ᱧᱩᱛᱩᱢ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱚᱞ ᱢᱮ᱾",
  },
};

/**
 * Returns list of distinct categories currently present in the dictionary.
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
 * Builds a bilingual worksheet for the given category with curriculum alignment.
 *
 * @param {string} category
 * @param {object} [customMeta]
 * @returns {{
 *   title: string,
 *   category: string,
 *   grade: string,
 *   subject: string,
 *   learningOutcome: string,
 *   outcomeDescription: string,
 *   instructionsHindi: string,
 *   instructionsSantali: string,
 *   items: Array<{ hindi: string, santali: string }>
 * }}
 */
export function generateWorksheet(category, customMeta = {}) {
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
  const defaultMeta = CATEGORY_CURRICULUM_META[category] || {
    grade: "कक्षा 1 & 2",
    subject: "बुनियादी शिक्षण",
    learningOutcome: "FLN-GEN-1.0",
    outcomeDescription: "द्विभाषी शब्द पहचान एवं अभ्यास",
    instructionsHindi: "निर्देश: नीचे दिए गए शब्दों को पढ़ें और संताली में लिखें।",
    instructionsSantali: "ᱫᱤᱥᱟᱹ: ᱞᱟᱛᱟᱨ ᱨᱮ ᱚᱞ ᱟᱠᱟᱱ ᱟᱹᱲᱟᱹ ᱠᱚ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱚᱞ ᱢᱮ᱾",
  };

  return {
    title: `द्विभाषी कार्यपत्रक: ${title}`,
    category,
    grade: customMeta.grade || defaultMeta.grade,
    subject: customMeta.subject || defaultMeta.subject,
    learningOutcome: customMeta.learningOutcome || defaultMeta.learningOutcome,
    outcomeDescription:
      customMeta.outcomeDescription || defaultMeta.outcomeDescription,
    instructionsHindi:
      customMeta.instructionsHindi || defaultMeta.instructionsHindi,
    instructionsSantali:
      customMeta.instructionsSantali || defaultMeta.instructionsSantali,
    items: matched,
  };
}
