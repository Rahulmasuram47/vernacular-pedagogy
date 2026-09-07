/**
 * Intent detection for classroom teacher instructions and dialogue.
 */

export const INTENTS = {
  SIT: "SIT",
  STAND: "STAND",
  OPEN_BOOK: "OPEN_BOOK",
  CLOSE_BOOK: "CLOSE_BOOK",
  LISTEN: "LISTEN",
  READ: "READ",
  WRITE: "WRITE",
  SPEAK: "SPEAK",
  LOOK: "LOOK",
  COME: "COME",
  GO: "GO",
  COUNT: "COUNT",
  SILENCE: "SILENCE",
  GREETING: "GREETING",
  QUESTION: "QUESTION",
  UNKNOWN: "UNKNOWN",
};

const ACTION_PATTERNS = [
  // Sit: बैठ जाओ, बैठो, बैठिए, बैठिये
  {
    intent: INTENTS.SIT,
    keywords: ["बैठ", "बैठो", "बैठिए", "बैठिये", "बैठना"],
  },
  // Stand: खड़े हो, खड़ा हो, खड़े हो जाओ, खड़े होइए, उठो
  {
    intent: INTENTS.STAND,
    keywords: ["खड़े", "खड़ा", "खडी", "खड़ी", "उठो"],
  },
  // Open book: किताब खोलो, पुस्तक खोलो, खोलो, खोलिए
  {
    intent: INTENTS.OPEN_BOOK,
    keywords: ["खोलो", "खोलिए", "खोलना"],
  },
  // Close: बंद करो, बंद कीजिए
  {
    intent: INTENTS.CLOSE_BOOK,
    keywords: ["बंद", "बन्द"],
  },
  // Listen: सुनो, सुनिए, ध्यान से सुनो
  {
    intent: INTENTS.LISTEN,
    keywords: ["सुनो", "सुनिए", "सुनना"],
  },
  // Silence: शांत रहो, चुप रहो, शोर मत करो
  {
    intent: INTENTS.SILENCE,
    keywords: ["चुप", "शांत", "शोर"],
  },
  // Read: पढ़ो, पढ़िए, पढ़ना
  {
    intent: INTENTS.READ,
    keywords: ["पढ़ो", "पढ़िए", "पढ़ना", "पढो", "पढिए"],
  },
  // Write: लिखो, लिखिए, लिखना
  {
    intent: INTENTS.WRITE,
    keywords: ["लिखो", "लिखिए", "लिखना"],
  },
  // Speak: बोलो, बोलिए, बताओ, उत्तर दो, जवाब दो
  {
    intent: INTENTS.SPEAK,
    keywords: ["बोलो", "बोलिए", "बताओ", "उत्तर", "जवाब"],
  },
  // Look: देखो, देखिए, देखना
  {
    intent: INTENTS.LOOK,
    keywords: ["देखो", "देखिए", "देखना"],
  },
  // Come: आओ, आइए, आना
  {
    intent: INTENTS.COME,
    keywords: ["आओ", "आइए", "आना"],
  },
  // Go: जाओ, जाइए, जाना
  {
    intent: INTENTS.GO,
    keywords: ["जाओ", "जाइए", "जाना"],
  },
  // Count: गिनो, गिनिए, गिनती करो
  {
    intent: INTENTS.COUNT,
    keywords: ["गिनो", "गिनिए", "गिनती"],
  },
  // Greeting: नमस्ते, नमस्कार, प्रणाम
  {
    intent: INTENTS.GREETING,
    keywords: ["नमस्ते", "नमस्कार", "प्रणाम", "जोहार"],
  },
];

const PLURAL_MARKERS = [
  "सब",
  "सभी",
  "लोग",
  "बच्चे",
  "बच्चों",
  "छात्रों",
  "विद्यार्थियों",
  "मिलकर",
  "सारे",
  "आप सब",
  "तुम सब",
];

/**
 * Analyzes Hindi tokens to extract classroom intent and grammatical features.
 *
 * @param {string[]} tokens
 * @param {string} rawNormalizedText
 * @returns {{
 *   intent: string,
 *   isPlural: boolean,
 *   subject: string | null,
 *   object: string | null,
 *   modifier: string | null,
 *   matchedKeywords: string[]
 * }}
 */
export function detectSentenceIntent(tokens, rawNormalizedText = "") {
  const text = rawNormalizedText || tokens.join(" ");

  // 1. Detect Plurality (group instruction vs individual)
  let isPlural = false;
  for (const marker of PLURAL_MARKERS) {
    if (tokens.includes(marker) || text.includes(marker)) {
      isPlural = true;
      break;
    }
  }

  // 2. Detect Action Intent
  let detectedIntent = INTENTS.UNKNOWN;
  const matchedKeywords = [];

  for (const action of ACTION_PATTERNS) {
    for (const kw of action.keywords) {
      if (tokens.includes(kw) || text.includes(kw)) {
        detectedIntent = action.intent;
        matchedKeywords.push(kw);
        break;
      }
    }
    if (detectedIntent !== INTENTS.UNKNOWN) break;
  }

  // 3. Detect Objects
  let object = null;
  if (text.includes("किताब") || text.includes("पुस्तक")) {
    object = "किताब";
  } else if (text.includes("कॉपी") || text.includes("कापी")) {
    object = "कॉपी";
  } else if (text.includes("पेंसिल")) {
    object = "पेंसिल";
  } else if (text.includes("बोर्ड") || text.includes("श्यामपट्ट")) {
    object = "बोर्ड";
  } else if (text.includes("चित्र") || text.includes("तस्वीर")) {
    object = "चित्र";
  } else if (text.includes("गिनती") || text.includes("संख्या")) {
    object = "गिनती";
  }

  // 4. Detect Subject / Addressee
  let subject = null;
  if (text.includes("सब लोग") || text.includes("सभी लोग")) {
    subject = "सब लोग";
  } else if (text.includes("सभी बच्चे") || text.includes("सब बच्चे")) {
    subject = "सभी बच्चे";
  } else if (text.includes("बच्चे") || text.includes("बच्चों")) {
    subject = "बच्चे";
  } else if (text.includes("छात्रों") || text.includes("विद्यार्थियों")) {
    subject = "छात्र";
  } else if (text.includes("सब") || text.includes("सभी")) {
    subject = "सब";
  }

  // 5. Detect Modifiers
  let modifier = null;
  if (text.includes("ध्यान से")) {
    modifier = "ध्यान से";
  } else if (text.includes("यहाँ") || text.includes("इधर")) {
    modifier = "यहाँ";
  } else if (text.includes("वहाँ") || text.includes("उधर")) {
    modifier = "वहाँ";
  } else if (text.includes("साफ") || text.includes("साफ-साफ")) {
    modifier = "साफ";
  } else if (text.includes("जोर से")) {
    modifier = "जोर से";
  }

  return {
    intent: detectedIntent,
    isPlural,
    subject,
    object,
    modifier,
    matchedKeywords,
  };
}
