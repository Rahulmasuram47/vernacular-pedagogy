import { useState, useMemo } from "react";
import dictionary from "../data/santali_dictionary.json" with { type: "json" };
import { TextToSpeech } from "@capacitor-community/text-to-speech";

const CATEGORY_META = {
  all: {
    label: "सभी विषय (All Topics)",
    icon: "✨",
  },
  number: {
    label: "संख्याएँ (Numbers)",
    icon: "🔢",
  },
  day: {
    label: "सप्ताह के दिन (Days)",
    icon: "📅",
  },
  greeting: {
    label: "अभिवादन (Greetings)",
    icon: "🙏",
  },
  classroom: {
    label: "कक्षा के निर्देश (Classroom)",
    icon: "🏫",
  },
  noun: {
    label: "सामान्य शब्द (Common Words)",
    icon: "📚",
  },
};

export default function Flashcards({ onBack }) {
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [revealed, setRevealed] =
    useState(false);

  /*
   * ------------------------------------------------------------
   * FILTER DICTIONARY
   * ------------------------------------------------------------
   */

  const filteredItems = useMemo(() => {
    if (!Array.isArray(dictionary)) {
      return [];
    }

    if (selectedCategory === "all") {
      return dictionary;
    }

    return dictionary.filter(
      (item) =>
        item?.category === selectedCategory
    );
  }, [selectedCategory]);

  /*
   * ------------------------------------------------------------
   * CURRENT CARD
   * ------------------------------------------------------------
   */

  const totalCards = filteredItems.length;

  const safeIndex =
    totalCards > 0
      ? Math.min(
          currentIndex,
          totalCards - 1
        )
      : 0;

  const currentCard =
    filteredItems[safeIndex] || null;

  /*
   * ------------------------------------------------------------
   * CATEGORY
   * ------------------------------------------------------------
   */

  function handleCategoryChange(category) {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setRevealed(false);
  }

  /*
   * ------------------------------------------------------------
   * FLIP
   * ------------------------------------------------------------
   */

  function handleFlip() {
    if (!currentCard) {
      return;
    }

    setRevealed((value) => !value);
  }

  /*
   * ------------------------------------------------------------
   * NEXT
   * ------------------------------------------------------------
   */

  function handleNext() {
    if (safeIndex < totalCards - 1) {
      setCurrentIndex(
        (index) => index + 1
      );

      setRevealed(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * PREVIOUS
   * ------------------------------------------------------------
   */

  function handlePrev() {
    if (safeIndex > 0) {
      setCurrentIndex(
        (index) => index - 1
      );

      setRevealed(false);
    }
  }

  /*
   * ------------------------------------------------------------
   * HINDI TTS
   * ------------------------------------------------------------
   */

  async function handleSpeakHindi(text, event) {
    event?.stopPropagation();

    const value = String(text ?? "").trim();

    if (!value) {
      return;
    }

    try {
      await TextToSpeech.speak({
        text: value,
        lang: "hi-IN",
        rate: 1.0,
      });

      return;
    } catch (nativeError) {
      console.warn(
        "[Flashcards] Native Hindi TTS failed:",
        nativeError
      );
    }

    /*
     * Browser fallback.
     */
    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.cancel();

        const utterance =
          new SpeechSynthesisUtterance(
            value
          );

        utterance.lang = "hi-IN";
        utterance.rate = 1.0;

        window.speechSynthesis.speak(
          utterance
        );
      } catch (browserError) {
        console.warn(
          "[Flashcards] Browser Hindi TTS failed:",
          browserError
        );
      }
    }
  }

  /*
   * ------------------------------------------------------------
   * CATEGORY META
   * ------------------------------------------------------------
   */

  const categoryMeta =
    CATEGORY_META[
      currentCard?.category
    ] || {
      label:
        currentCard?.category ||
        "शब्द",
      icon: "📖",
    };

  /*
   * ------------------------------------------------------------
   * EMPTY STATE
   * ------------------------------------------------------------
   */

  if (!currentCard) {
    return (
      <section className="card flashcard-section no-print">
        <div className="flashcard-header">
          <h2>
            फ्लैशकार्ड अभ्यास
          </h2>

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

        <p>
          इस विषय के लिए अभी कोई फ्लैशकार्ड उपलब्ध नहीं है।
        </p>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            handleCategoryChange("all")
          }
        >
          सभी फ्लैशकार्ड देखें
        </button>
      </section>
    );
  }

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <section className="card flashcard-section no-print">
      {/* HEADER */}

      <div className="flashcard-header">
        <h2>
          फ्लैशकार्ड अभ्यास (Flashcards)
        </h2>

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

      {/* CATEGORY */}

      <div className="flashcard-controls">
        <label
          htmlFor="flashcard-category"
          className="label-inline"
        >
          विषय:
        </label>

        <select
          id="flashcard-category"
          className="input select-compact"
          value={selectedCategory}
          onChange={(event) =>
            handleCategoryChange(
              event.target.value
            )
          }
        >
          {Object.entries(
            CATEGORY_META
          ).map(([key, meta]) => (
            <option
              key={key}
              value={key}
            >
              {meta.icon} {meta.label}
            </option>
          ))}
        </select>

        <span className="card-counter">
          {safeIndex + 1} / {totalCards}
        </span>
      </div>

      {/* FLASHCARD */}

      <div className="flashcard-box">
        <div className="flashcard-badge">
          <span>
            {categoryMeta.icon}{" "}
            {categoryMeta.label}
          </span>

          <span className="tap-hint">
            {revealed
              ? "संताली दिखाई जा रही है"
              : "नीचे बटन दबाकर संताली देखें"}
          </span>
        </div>

        <div className="flashcard-content">
          {/* HINDI */}

          <div className="flashcard-side flashcard-hindi">
            <span className="flashcard-lang-tag">
              हिंदी
            </span>

            <div className="flashcard-word-row">
              <span className="flashcard-word">
                {currentCard.hindi}
              </span>

              <button
                type="button"
                className="btn-tts-icon"
                onClick={(event) =>
                  handleSpeakHindi(
                    currentCard.hindi,
                    event
                  )
                }
                title="हिंदी उच्चारण सुनें"
                aria-label="हिंदी उच्चारण सुनें"
              >
                🔊
              </button>
            </div>
          </div>

          {/* SANTALI */}

          <div
            className={`flashcard-side flashcard-santali ${
              revealed
                ? "revealed"
                : "hidden"
            }`}
          >
            <span className="flashcard-lang-tag">
              संताली (ओल चिकी)
            </span>

            <span className="flashcard-word santali">
              {revealed
                ? currentCard.santali
                : "••••••"}
            </span>
          </div>
        </div>

        {/* EXPLICIT FLIP BUTTON */}

        <button
          type="button"
          className="btn btn-primary flashcard-flip-button"
          onClick={handleFlip}
          aria-label={
            revealed
              ? "संताली छिपाएँ"
              : "संताली दिखाएँ"
          }
        >
          {revealed
            ? "🙈 संताली छिपाएँ"
            : "👆 संताली देखें (Flip)"}
        </button>
      </div>

      {/* NAVIGATION */}

      <div className="flashcard-nav">
        <button
          type="button"
          className="btn btn-secondary flashcard-btn"
          onClick={handlePrev}
          disabled={safeIndex === 0}
        >
          ← पिछला
        </button>

        <button
          type="button"
          className="btn btn-primary flashcard-btn"
          onClick={handleFlip}
        >
          {revealed
            ? "छिपाएँ"
            : "संताली देखें"}
        </button>

        <button
          type="button"
          className="btn btn-secondary flashcard-btn"
          onClick={handleNext}
          disabled={
            safeIndex ===
            totalCards - 1
          }
        >
          अगला →
        </button>
      </div>
    </section>
  );
}