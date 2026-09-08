/**
 * Lightweight, resolution-independent SVG illustrations for Visual Flashcards.
 * Renders countable objects for numbers and child-friendly visual icons for words.
 * 100% offline, zero network requests, zero bundle bloat.
 */

export default function CardVisual({ item }) {
  if (!item) return null;

  const category = item.category || "";
  const hindi = (item.hindi || "").trim();

  // ------------------------------------------------------------
  // 1. NUMBERS (Exact countable visual objects)
  // ------------------------------------------------------------
  const numberMap = {
    "एक": 1,
    "दो": 2,
    "तीन": 3,
    "चार": 4,
    "पाँच": 5,
    "पांच": 5,
    "छह": 6,
    "सात": 7,
    "आठ": 8,
    "नौ": 9,
    "दस": 10,
  };

  const count = numberMap[hindi];

  if (category === "number" && count) {
    const colors = [
      "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4",
      "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"
    ];

    return (
      <div className="card-visual-container">
        <div className="countable-objects-grid">
          {Array.from({ length: count }).map((_, idx) => (
            <svg
              key={idx}
              className="countable-icon"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label={`वस्तु ${idx + 1}`}
            >
              <circle
                cx="24"
                cy="24"
                r="18"
                fill={colors[idx % colors.length]}
                opacity="0.9"
              />
              <circle cx="20" cy="20" r="4" fill="#ffffff" opacity="0.6" />
              <text
                x="24"
                y="30"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="16"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {idx + 1}
              </text>
            </svg>
          ))}
        </div>
        <span className="count-label">
          कुल वस्तुएँ: <strong>{count}</strong> ({hindi})
        </span>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 2. GREETINGS & MANNERS
  // ------------------------------------------------------------
  if (hindi === "नमस्ते" || hindi === "नमस्कार") {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
          {/* Folded hands / Namaste symbol */}
          <path
            d="M44 32 C44 26 48 24 50 24 C52 24 56 26 56 32 L56 68 C56 74 52 76 50 76 C48 76 44 74 44 68 Z"
            fill="#d97706"
          />
          <path
            d="M38 42 C38 36 42 34 44 34 L44 64 C44 68 40 70 38 66 Z"
            fill="#b45309"
          />
          <path
            d="M62 42 C62 36 58 34 56 34 L56 64 C56 68 60 70 62 66 Z"
            fill="#b45309"
          />
        </svg>
        <span className="concept-caption">प्रणाम / अभिवादन (Johar)</span>
      </div>
    );
  }

  if (hindi === "धन्यवाद") {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#ecfdf5" stroke="#10b981" strokeWidth="3" />
          <path
            d="M50 72 C50 72 26 54 26 38 C26 28 34 22 42 22 C47 22 50 26 50 26 C50 26 53 22 58 22 C66 22 74 28 74 38 C74 54 50 72 50 72 Z"
            fill="#059669"
          />
        </svg>
        <span className="concept-caption">आभार / कृतज्ञता (Sarhaw)</span>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 3. CLASSROOM OBJECTS
  // ------------------------------------------------------------
  if (hindi.includes("किताब") || hindi.includes("पुस्तक")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
          {/* Open Book */}
          <path
            d="M50 34 C40 30 28 32 20 36 L20 68 C28 64 40 62 50 66 C60 62 72 64 80 68 L80 36 C72 32 60 30 50 34 Z"
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="2"
          />
          <path d="M50 34 L50 66" stroke="#ffffff" strokeWidth="3" />
          <line x1="26" y1="44" x2="44" y2="42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="26" y1="52" x2="44" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="56" y1="42" x2="74" y2="44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="56" y1="50" x2="74" y2="52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="concept-caption">पुस्तक / पाठ्य सामग्री (Potob)</span>
      </div>
    );
  }

  if (hindi.includes("स्कूल") || hindi.includes("विद्यालय")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
          {/* Schoolhouse */}
          <path d="M50 20 L22 38 L26 76 L74 76 L78 38 Z" fill="#d97706" />
          <path d="M50 16 L18 36 L22 40 L50 22 L78 40 L82 36 Z" fill="#b45309" />
          <rect x="42" y="56" width="16" height="20" fill="#ffffff" />
          <rect x="30" y="44" width="12" height="12" fill="#fef08a" />
          <rect x="58" y="44" width="12" height="12" fill="#fef08a" />
        </svg>
        <span className="concept-caption">विद्यालय / पाठशाला (Iskul)</span>
      </div>
    );
  }

  if (hindi.includes("पानी") || hindi.includes("जल")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="3" />
          {/* Water drop */}
          <path
            d="M50 20 C50 20 28 48 28 62 C28 74 38 82 50 82 C62 82 72 74 72 62 C72 48 50 20 50 20 Z"
            fill="#0284c7"
          />
          <ellipse cx="44" cy="62" rx="4" ry="8" fill="#bae6fd" />
        </svg>
        <span className="concept-caption">जल / स्वच्छ पेयजल (Daah)</span>
      </div>
    );
  }

  if (hindi.includes("खाना") || hindi.includes("भोजन")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#ffedd5" stroke="#ea580c" strokeWidth="3" />
          {/* Food bowl */}
          <path d="M24 50 C24 72 76 72 76 50 Z" fill="#c2410c" />
          <ellipse cx="50" cy="50" rx="26" ry="8" fill="#fb923c" />
          <path d="M38 42 C38 34 42 30 40 24" stroke="#fdba74" strokeWidth="3" strokeLinecap="round" />
          <path d="M50 40 C50 32 54 28 52 22" stroke="#fdba74" strokeWidth="3" strokeLinecap="round" />
          <path d="M62 42 C62 34 66 30 64 24" stroke="#fdba74" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="concept-caption">भोजन / पोषण (Jomag)</span>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 4. CLASSROOM ACTIONS
  // ------------------------------------------------------------
  if (hindi.includes("बैठ")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#f3e8ff" stroke="#9333ea" strokeWidth="3" />
          {/* Sitting figure icon */}
          <circle cx="50" cy="28" r="8" fill="#7e22ce" />
          <path d="M50 38 L50 56 L64 56 L64 74" stroke="#7e22ce" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M38 56 L66 56" stroke="#a855f7" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="concept-caption">बैठने का निर्देश (Durup me)</span>
      </div>
    );
  }

  if (hindi.includes("खड़ा") || hindi.includes("खड़े")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#dcfce7" stroke="#16a34a" strokeWidth="3" />
          {/* Standing figure icon */}
          <circle cx="50" cy="24" r="8" fill="#15803d" />
          <line x1="50" y1="32" x2="50" y2="58" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
          <line x1="50" y1="58" x2="42" y2="80" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
          <line x1="50" y1="58" x2="58" y2="80" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
          <line x1="34" y1="42" x2="66" y2="42" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="concept-caption">खड़े होने का निर्देश (Tingu me)</span>
      </div>
    );
  }

  if (hindi.includes("सुनो") || hindi.includes("सुन")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#fef2f2" stroke="#ef4444" strokeWidth="3" />
          {/* Ear with listening soundwaves */}
          <path
            d="M42 28 C32 28 26 36 26 48 C26 62 34 72 44 72 C50 72 54 68 54 62 C54 56 48 54 44 54"
            stroke="#b91c1c"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M60 38 C66 44 66 54 60 60" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
          <path d="M68 32 C78 42 78 58 68 68" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="concept-caption">ध्यानपूर्वक सुनना (Anjom me)</span>
      </div>
    );
  }

  if (hindi.includes("पढ़ो") || hindi.includes("पढ़")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#f0fdf4" stroke="#22c55e" strokeWidth="3" />
          {/* Reading icon */}
          <circle cx="50" cy="28" r="8" fill="#16a34a" />
          <path d="M30 62 C40 56 48 58 50 62 C52 58 60 56 70 62" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" />
          <path d="M40 40 L34 56 M60 40 L66 56" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="concept-caption">पठन कौशल (Padhaw me)</span>
      </div>
    );
  }

  if (hindi.includes("लिखो") || hindi.includes("लिख")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#fdf4ff" stroke="#d946ef" strokeWidth="3" />
          {/* Pencil writing on pad */}
          <rect x="26" y="24" width="36" height="52" rx="4" fill="#fae8ff" stroke="#a21caf" strokeWidth="2" />
          <line x1="34" y1="36" x2="52" y2="36" stroke="#c026d3" strokeWidth="2" />
          <line x1="34" y1="46" x2="52" y2="46" stroke="#c026d3" strokeWidth="2" />
          <line x1="34" y1="56" x2="48" y2="56" stroke="#c026d3" strokeWidth="2" />
          {/* Pencil */}
          <path d="M68 20 L76 28 L54 50 L46 52 L48 44 Z" fill="#e11d48" stroke="#9f1239" strokeWidth="2" />
        </svg>
        <span className="concept-caption">लेखन अभ्यास (Ol me)</span>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 5. DAYS OF THE WEEK
  // ------------------------------------------------------------
  if (category === "day") {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="20" width="60" height="60" rx="8" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
          <rect x="20" y="20" width="60" height="18" rx="8" fill="#2563eb" />
          <line x1="34" y1="14" x2="34" y2="24" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />
          <line x1="66" y1="14" x2="66" y2="24" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" />
          <text
            x="50"
            y="62"
            textAnchor="middle"
            fill="#1e40af"
            fontSize="22"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            📅
          </text>
        </svg>
        <span className="concept-caption">सप्ताह का दिन ({hindi})</span>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 6. NOUNS & PEOPLE (Pencil, Child, Teacher, Student, Classroom)
  // ------------------------------------------------------------
  if (hindi.includes("पेंसिल")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" />
          <path d="M68 20 L76 28 L38 66 L26 70 L30 58 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
          <polygon points="26,70 30,58 38,66" fill="#fde68a" />
          <polygon points="26,70 29,66 33,70" fill="#1f2937" />
          <path d="M64 24 L72 32" stroke="#b45309" strokeWidth="2" />
        </svg>
        <span className="concept-caption">लेखनी / पेंसिल (Pensil)</span>
      </div>
    );
  }

  if (hindi.includes("बच्चा")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#eff6ff" stroke="#3b82f6" strokeWidth="3" />
          {/* Smiling child head */}
          <circle cx="50" cy="42" r="20" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="43" cy="38" r="3" fill="#1e293b" />
          <circle cx="57" cy="38" r="3" fill="#1e293b" />
          <path d="M43 48 Q50 56 57 48" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Child body */}
          <path d="M28 80 C28 66 38 64 50 64 C62 64 72 66 72 80 Z" fill="#3b82f6" />
        </svg>
        <span className="concept-caption">बालक / विद्यार्थी (Gidra)</span>
      </div>
    );
  }

  if (hindi.includes("शिक्षक") || hindi.includes("अध्यापक")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#ecfdf5" stroke="#10b981" strokeWidth="3" />
          {/* Teacher with glasses and board pointer */}
          <circle cx="50" cy="34" r="16" fill="#fed7aa" stroke="#ea580c" strokeWidth="2" />
          <rect x="40" y="30" width="8" height="6" rx="2" stroke="#374151" strokeWidth="2" fill="none" />
          <rect x="52" y="30" width="8" height="6" rx="2" stroke="#374151" strokeWidth="2" fill="none" />
          <line x1="48" y1="33" x2="52" y2="33" stroke="#374151" strokeWidth="2" />
          <path d="M45 42 Q50 46 55 42" stroke="#374151" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Body and book */}
          <path d="M28 78 C28 58 38 52 50 52 C62 52 72 58 72 78 Z" fill="#047857" />
          <rect x="58" y="56" width="18" height="24" rx="2" fill="#ffffff" stroke="#1f2937" strokeWidth="1.5" />
        </svg>
        <span className="concept-caption">गुरुजी / शिक्षक (Machet)</span>
      </div>
    );
  }

  if (hindi.includes("छात्र") || hindi.includes("विद्यार्थी")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="3" />
          {/* Student with school bag */}
          <circle cx="50" cy="36" r="15" fill="#fde047" stroke="#ca8a04" strokeWidth="2" />
          <circle cx="45" cy="34" r="2" fill="#1e293b" />
          <circle cx="55" cy="34" r="2" fill="#1e293b" />
          <path d="M46 42 Q50 46 54 42" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Body & backpack strap */}
          <path d="M30 76 C30 58 40 54 50 54 C60 54 70 58 70 76 Z" fill="#6d28d9" />
          <path d="M38 54 L34 76 M62 54 L66 76" stroke="#fbbf24" strokeWidth="3" />
        </svg>
        <span className="concept-caption">छात्र / शिक्षार्थी (Pathua)</span>
      </div>
    );
  }

  if (hindi.includes("कक्षा")) {
    return (
      <div className="card-visual-container">
        <svg
          className="concept-svg"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="44" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />
          {/* Blackboard and desks */}
          <rect x="22" y="24" width="56" height="34" rx="3" fill="#1e3a2b" stroke="#854d0e" strokeWidth="3" />
          <line x1="30" y1="36" x2="52" y2="36" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <line x1="30" y1="44" x2="68" y2="44" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          {/* Bench/desk */}
          <rect x="26" y="66" width="48" height="8" rx="2" fill="#92400e" />
          <line x1="32" y1="74" x2="32" y2="82" stroke="#78350f" strokeWidth="3" />
          <line x1="68" y1="74" x2="68" y2="82" stroke="#78350f" strokeWidth="3" />
        </svg>
        <span className="concept-caption">कक्षा कक्ष (Klas)</span>
      </div>
    );
  }

  // Generic clean fallback
  return (
    <div className="card-visual-container">
      <div className="generic-concept-badge">
        <span className="concept-letter">{hindi.charAt(0)}</span>
      </div>
      <span className="concept-caption">कक्षा शिक्षण शब्द</span>
    </div>
  );
}
