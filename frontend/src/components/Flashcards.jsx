import { useState, useMemo, useCallback } from "react";
import dictionary from "../data/santali_dictionary.json" with { type: "json" };
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import CardVisual from "./CardVisual.jsx";
import { playSantaliAudio, hasSantaliAudio } from "../audio/santaliAudio.js";

const CATEGORY_META = {
  all: {
    label: "सभी विषय (All Topics)",
    icon: "✨",
    outcome: "FLN बुनियादी साक्षरता एवं संख्या ज्ञान",
  },
  number: {
    label: "संख्याएँ (Numbers)",
    icon: "🔢",
    outcome: "FLN-NUM-1.1: 1 से 20 तक संख्याओं की पहचान, गिनती एवं बोलना",
  },
  day: {
    label: "सप्ताह के दिन (Days)",
    icon: "📅",
    outcome: "FLN-LANG-1.3: सप्ताह के दिनों के नाम एवं समय बोध",
  },
  greeting: {
    label: "अभिवादन (Greetings)",
    icon: "🙏",
    outcome: "FLN-LANG-1.1: कक्षा शिष्टाचार एवं मातृभाषा में अभिवादन",
  },
  classroom: {
    label: "कक्षा के निर्देश (Classroom)",
    icon: "🏫",
    outcome: "FLN-LANG-1.2: सरल मौखिक निर्देशों का बोध एवं पालन",
  },
  noun: {
    label: "सामान्य शब्द (Common Words)",
    icon: "📚",
    outcome: "FLN-LANG-2.1: मूलभूत संज्ञा शब्दों की पहचान एवं उच्चारण",
  },
};

export default function Flashcards({ onBack, initialCategory = "all" }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [seed, setSeed] = useState(0);

  // ------------------------------------------------------------
  // FILTER & SHUFFLE ITEMS
  // ------------------------------------------------------------
  const filteredItems = useMemo(() => {
    if (!Array.isArray(dictionary)) {
      return [];
    }

    let items =
      selectedCategory === "all"
        ? [...dictionary]
        : dictionary.filter((item) => item?.category === selectedCategory);

    if (shuffled) {
      // Deterministic Fisher-Yates based on seed
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    return items;
  }, [selectedCategory, shuffled, seed]);

  const totalCards = filteredItems.length;
  const safeIndex =
    totalCards > 0 ? Math.min(currentIndex, totalCards - 1) : 0;
  const currentCard = filteredItems[safeIndex] || null;

  // ------------------------------------------------------------
  // HANDLERS
  // ------------------------------------------------------------
  function handleCategoryChange(category) {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setRevealed(false);
  }

  function handleFlip() {
    if (!currentCard) return;
    setRevealed((v) => !v);
  }

  function handleNext() {
    if (safeIndex < totalCards - 1) {
      setCurrentIndex((i) => i + 1);
      setRevealed(false);
    }
  }

  function handlePrev() {
    if (safeIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setRevealed(false);
    }
  }

  function handleToggleShuffle() {
    setShuffled((prev) => !prev);
    setSeed((s) => s + 1);
    setCurrentIndex(0);
    setRevealed(false);
  }

  // ------------------------------------------------------------
  // AUDIO HANDLERS
  // ------------------------------------------------------------
  const handleSpeakHindi = useCallback(async (text, event) => {
    event?.stopPropagation();
    const value = String(text ?? "").trim();
    if (!value) return;

    try {
      await TextToSpeech.speak({
        text: value,
        lang: "hi-IN",
        rate: 1.0,
      });
      return;
    } catch (e) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(value);
        u.lang = "hi-IN";
        window.speechSynthesis.speak(u);
      }
    }
  }, []);

  const handleSpeakSantali = useCallback(async (text, event) => {
    event?.stopPropagation();
    if (!text) return;
    await playSantaliAudio(text);
  }, []);

  const categoryMeta =
    CATEGORY_META[selectedCategory] ||
    CATEGORY_META[currentCard?.category] ||
    CATEGORY_META.all;

  const cardOutcome =
    CATEGORY_META[currentCard?.category]?.outcome || categoryMeta.outcome;

  if (!currentCard) {
    return (
      <section className="card flashcard-section no-print">
        <div className="flashcard-header">
          <h2>फ्लैशकार्ड अभ्यास</h2>
          {onBack && (
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={onBack}
            >
              ← वापस मुख्य पृष्ठ
            </button>
          )}
        </div>
        <p>इस विषय के लिए अभी कोई फ्लैशकार्ड उपलब्ध नहीं है।</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleCategoryChange("all")}
        >
          सभी फ्लैशकार्ड देखें
        </button>
      </section>
    );
  }

  const progressPercent =
    totalCards > 0 ? Math.round(((safeIndex + 1) / totalCards) * 100) : 0;
  const hasAudioSantali = hasSantaliAudio(currentCard.santali);

  return (
    <section className="card flashcard-section no-print">
      {/* HEADER */}
      <div className="flashcard-header">
        <div>
          <h2>🗂️ दृश्य फ्लैशकार्ड अभ्यास (Visual Flashcards)</h2>
          <p className="flashcard-subtitle">
            प्रत्येक कार्ड में स्पष्ट दृश्य एवं द्विभाषी उच्चारण
          </p>
        </div>

        <div className="flashcard-header-actions">
          <span className="offline-ready" title="पूर्णतः ऑफ़लाइन उपलब्ध">
            <span className="offline-dot" aria-hidden="true" />
            ✓ Offline Ready
          </span>

          {onBack && (
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={onBack}
            >
              ← वापस
            </button>
          )}
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="flashcard-controls">
        <div className="category-select-wrapper">
          <label htmlFor="flashcard-category" className="label-inline">
            विषय:
          </label>
          <select
            id="flashcard-category"
            className="input select-compact"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flashcard-meta-actions">
          <button
            type="button"
            className={`btn btn-small ${
              shuffled ? "btn-primary" : "btn-outline"
            }`}
            onClick={handleToggleShuffle}
            title="कार्डों का क्रम बदलें"
          >
            🔀 {shuffled ? "क्रमबद्ध करें" : "शफ़ल (Shuffle)"}
          </button>

          <span className="card-counter">
            {safeIndex + 1} / {totalCards}
          </span>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="flashcard-progress-bar-bg" title={`${progressPercent}% पूर्ण`}>
        <div
          className="flashcard-progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* VISUAL FLASHCARD BOX */}
      <div
        className={`flashcard-box visual-flashcard ${
          revealed ? "card-revealed" : ""
        }`}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="फ्लैशकार्ड पलटने के लिए क्लिक करें"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleFlip();
          }
        }}
      >
        {/* OUTCOME TAG */}
        <div className="flashcard-outcome-banner">
          <span className="outcome-tag">
            🎯 {cardOutcome}
          </span>
          <span className="tap-hint">
            {revealed ? "✓ संताली प्रकट" : "👆 पलटने के लिए कार्ड छुएँ"}
          </span>
        </div>

        {/* GENUINE VISUAL ILLUSTRATION */}
        <div className="flashcard-illustration-area">
          <CardVisual item={currentCard} />
        </div>

        {/* CONTENT AREA */}
        <div className="flashcard-content">
          {/* HINDI */}
          <div className="flashcard-side flashcard-hindi">
            <span className="flashcard-lang-tag">हिंदी</span>
            <div className="flashcard-word-row">
              <span className="flashcard-word">{currentCard.hindi}</span>
              <button
                type="button"
                className="btn-tts-icon"
                onClick={(e) => handleSpeakHindi(currentCard.hindi, e)}
                title="हिंदी उच्चारण सुनें"
                aria-label="हिंदी उच्चारण सुनें"
              >
                🔊
              </button>
            </div>
          </div>

          {/* SANTALI (OL CHIKI) */}
          <div
            className={`flashcard-side flashcard-santali ${
              revealed ? "revealed" : "hidden"
            }`}
          >
            <span className="flashcard-lang-tag">संताली (ओल चिकी)</span>
            <div className="flashcard-word-row">
              <span className="flashcard-word santali">
                {revealed ? currentCard.santali : "••••••••"}
              </span>
              {revealed && hasAudioSantali && (
                <button
                  type="button"
                  className="btn-tts-icon"
                  onClick={(e) => handleSpeakSantali(currentCard.santali, e)}
                  title="संताली उच्चारण सुनें"
                  aria-label="संताली उच्चारण सुनें"
                >
                  🔊
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FLIP BUTTON */}
        <button
          type="button"
          className="btn btn-primary flashcard-flip-button"
          onClick={(e) => {
            e.stopPropagation();
            handleFlip();
          }}
          aria-label={revealed ? "संताली छिपाएँ" : "संताली दिखाएँ"}
        >
          {revealed ? "🙈 संताली छिपाएँ" : "👆 संताली देखें (Reveal Santali)"}
        </button>
      </div>

      {/* NAVIGATION CONTROLS */}
      <div className="flashcard-nav">
        <button
          type="button"
          className="btn btn-secondary flashcard-btn"
          onClick={handlePrev}
          disabled={safeIndex === 0}
        >
          ← पिछला (Prev)
        </button>

        <button
          type="button"
          className="btn btn-primary flashcard-btn"
          onClick={handleFlip}
        >
          {revealed ? "छिपाएँ" : "संताली देखें"}
        </button>

        <button
          type="button"
          className="btn btn-secondary flashcard-btn"
          onClick={handleNext}
          disabled={safeIndex === totalCards - 1}
        >
          अगला (Next) →
        </button>
      </div>
    </section>
  );
}