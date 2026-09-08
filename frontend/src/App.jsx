import { useState, useCallback, useEffect, useRef } from "react";
import { callTranslate, fetchWorksheetCategories, callWorksheet } from "./api.js";
import MicButton from "./components/MicButton.jsx";
import Flashcards from "./components/Flashcards.jsx";
import VoiceDialogue from "./components/VoiceDialogue.jsx";
import CurriculumLibrary from "./components/CurriculumLibrary.jsx";
import { playSantaliAudio, hasSantaliAudio } from "./audio/santaliAudio.js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

import {
  getHistory,
  addToHistory,
  clearHistory,
  getSavedWorksheets,
  saveWorksheet,
  deleteSavedWorksheet,
} from "./storage.js";

// IMPORTANT:
// This is the local/offline Hindi → Santali translation engine.
// It does not require the FastAPI backend.
import {
  translate as translateOffline,
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
} from "./translation.js";

const CATEGORY_LABELS = {
  number: "संख्याएँ",
  day: "सप्ताह के दिन",
  greeting: "अभिवादन",
  classroom: "कक्षा के निर्देश",
  noun: "सामान्य शब्द",
};

export default function App() {
  const [currentView, setCurrentView] = useState("home");

  // Translation state
  const [hindiText, setHindiText] = useState("");
  const [hindiResult, setHindiResult] = useState("");
  const [santaliResult, setSantaliResult] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [status, setStatus] = useState("");

  // General busy state
  const [worksheet, setWorksheet] = useState(null);
  const [busy, setBusy] = useState(false);

  // Voice-to-voice state
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceLatency, setVoiceLatency] = useState(null);
  const voiceStartTimeRef = useRef(null);

  const worksheetRef = useRef(null);

  // Worksheet state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [worksheetBusy, setWorksheetBusy] = useState(false);

  // History / saved worksheets
  const [history, setHistory] = useState([]);
  const [savedWorksheets, setSavedWorksheets] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // ------------------------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------------------------

  useEffect(() => {
    fetchWorksheetCategories()
      .then((data) => {
        const list = data.categories ?? [];

        setCategories(list);

        if (list.length > 0) {
          setSelectedCategory(list[0]);
        }
      })
      .catch(() => {
        setStatus("विषय सूची लोड नहीं हो पाई।");
      });

    setHistory(getHistory());
    setSavedWorksheets(getSavedWorksheets());
  }, []);

  // ------------------------------------------------------------
  // MANUAL TEXT TRANSLATION
  // ------------------------------------------------------------

  async function handleTranslate() {
    const text = hindiText.trim();

    if (!text) {
      setStatus("कृपया हिंदी में पाठ लिखें।");
      return;
    }

    setBusy(true);
    setStatus("अनुवाद हो रहा है...");
    setWorksheet(null);

    const startTime = performance.now();

    try {
      const data = await callTranslate(text);
      const elapsedMs = Math.round(performance.now() - startTime);

      console.log(`Translation round trip: ${elapsedMs}ms`, data);

      setHindiResult(data.hindi ?? text);
      setSantaliResult(data.santali ?? "");
      setConfidence(data.confidence || CONFIDENCE_LEVELS.LOW);
      setNeedsConfirmation(Boolean(data.needsConfirmation));

      const matchLabel =
        CONFIDENCE_LABELS[data.confidence] || CONFIDENCE_LABELS.low;

      if (data.needsConfirmation) {
        setStatus(`⚠ अनुवाद की पुष्टि आवश्यक है (${elapsedMs} ms)`);
      } else {
        setStatus(`अनुवाद तैयार है। ${matchLabel} (${elapsedMs} ms)`);
        const updatedHistory = addToHistory(data);
        setHistory(updatedHistory);
      }
    } catch (err) {
      console.error("Translation error:", err);
      setStatus("अनुवाद करने में समस्या आई। कृपया फिर से प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  // ------------------------------------------------------------
  // VOICE LISTENING START
  // ------------------------------------------------------------

  const handleMicListeningStart = useCallback(() => {
    voiceStartTimeRef.current = performance.now();

    setVoiceLatency(null);
    setVoiceProcessing(false);

    setStatus("🎤 हिंदी में बोलें...");
  }, []);

  // ------------------------------------------------------------
  // VOICE RESULT
  // ------------------------------------------------------------

  const handleMicResult = useCallback(async (transcript) => {
    const text = String(transcript ?? "").trim();

    if (!text) {
      setStatus("⚠ आवाज़ समझ नहीं आई। फिर से बोलें।");
      return;
    }

    setHindiText(text);
    setHindiResult(text);

    setVoiceProcessing(true);
    setBusy(true);

    setStatus("⚙ अनुवाद हो रहा है...");

    try {
      const data = translateOffline(text);

      console.log("Offline voice translation:", data);

      const santaliText = data.santali ?? "";

      setHindiResult(data.hindi ?? text);
      setSantaliResult(santaliText);
      setConfidence(data.confidence || CONFIDENCE_LEVELS.LOW);
      setNeedsConfirmation(Boolean(data.needsConfirmation));

      const matchLabel =
        CONFIDENCE_LABELS[data.confidence] || CONFIDENCE_LABELS.low;

      if (!data.needsConfirmation && santaliText.trim()) {
        const updatedHistory = addToHistory({
          hindi: data.hindi ?? text,
          santali: santaliText,
          confidence: data.confidence ?? "medium",
        });
        setHistory(updatedHistory);
      }

      const startTime = voiceStartTimeRef.current;
      const elapsedMs =
        startTime != null ? Math.round(performance.now() - startTime) : null;
      if (elapsedMs != null) {
        setVoiceLatency(elapsedMs);
      }

      if (data.needsConfirmation) {
        setStatus("⚠ आवाज़ पहचानी गई: अनुवाद की पुष्टि आवश्यक है");
      } else {
        setStatus(`✓ अनुवाद तैयार है (${matchLabel})`);
      }
    } catch (err) {
      console.error("Voice processing error:", err);
      setStatus("आवाज़ अनुवाद में समस्या आई। कृपया फिर से प्रयास करें।");
    } finally {
      setVoiceProcessing(false);
      setBusy(false);
      voiceStartTimeRef.current = null;
    }
  }, []);

  // ------------------------------------------------------------
  // MIC STATUS
  // ------------------------------------------------------------

  const handleMicStatus = useCallback((message) => {
    setStatus(message);
  }, []);

  // ------------------------------------------------------------
  // SANTALI AUDIO / TEXT-TO-SPEECH
  // ------------------------------------------------------------

  async function speakSantali(text) {
    const value = String(text ?? "").trim();

    if (!value || needsConfirmation || value === "अनुवाद की पुष्टि आवश्यक है") {
      setStatus("संताली अनुवाद उपलब्ध नहीं है।");
      return false;
    }

    // Step 1: Pre-recorded authentic Santali audio clips
    if (hasSantaliAudio(value)) {
      setStatus("🔊 संताली ऑडियो बज रहा है...");
      const res = await playSantaliAudio(
        value,
        () => setStatus("🔊 संताली ऑडियो बज रहा है..."),
        () => setStatus("✓ संताली ऑडियो पूर्ण हुआ")
      );
      if (res.played) return true;
    }

    // Step 2: Native Android TTS (if device OEM provides Santali TTS pack)
    try {
      if (TextToSpeech && typeof TextToSpeech.getSupportedLanguages === "function") {
        const langResult = await TextToSpeech.getSupportedLanguages().catch(() => null);
        const languages = (langResult?.languages || []).map((l) => String(l).toLowerCase());
        const hasSantali = languages.some(
          (l) => l.startsWith("sat") || l.includes("olck") || l.includes("santali")
        );

        if (hasSantali) {
          await TextToSpeech.speak({
            text: value,
            lang: "sat-IN",
            rate: 0.9,
          });
          return true;
        }
      }
    } catch (nativeError) {
      console.warn("Santali native TTS unavailable:", nativeError);
    }

    // Step 3: Browser fallback with voice check
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const voices = window.speechSynthesis.getVoices?.() || [];
        const hasSantaliBrowserVoice = voices.some((v) => {
          const lang = (v.lang || "").toLowerCase();
          return lang.startsWith("sat") || lang.includes("olck");
        });

        if (hasSantaliBrowserVoice) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(value);
          utterance.lang = "sat-IN";
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
          return true;
        }
      } catch (browserError) {
        console.warn("Santali browser TTS failed:", browserError);
      }
    }

    // Honest feedback - never silent fail
    setStatus("संताली ऑडियो इस वाक्य के लिए उपलब्ध नहीं है (मानक पाठ प्रदर्शित है)।");
    return false;
  }

  // ------------------------------------------------------------
  // HINDI TEXT-TO-SPEECH
  // ------------------------------------------------------------

  async function handleSpeakHindi(text) {
    if (!text) return;

    try {
      await TextToSpeech.speak({
        text,
        lang: "hi-IN",
        rate: 1.0,
      });
    } catch (err) {
      console.warn(
        "Capacitor TTS fallback to SpeechSynthesis:",
        err
      );

      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();

          const u = new SpeechSynthesisUtterance(text);

          u.lang = "hi-IN";

          window.speechSynthesis.speak(u);
        } catch (fallbackError) {
          console.warn("Hindi browser TTS failed:", fallbackError);
        }
      }
    }
  }

  // ------------------------------------------------------------
  // WORKSHEET GENERATION
  // ------------------------------------------------------------

  async function handleGenerateWorksheet() {
    if (!selectedCategory) {
      setStatus("कृपया पहले एक विषय चुनें।");
      return;
    }

    setWorksheetBusy(true);
    setStatus("कार्यपत्रक बन रहा है...");

    try {
      const data = await callWorksheet(selectedCategory);

      setWorksheet(data);

      setStatus("कार्यपत्रक तैयार है।");
    } catch (err) {
      console.error("Worksheet generation error:", err);

      setStatus("कार्यपत्रक नहीं बन पाया। कृपया फिर से प्रयास करें।");
    } finally {
      setWorksheetBusy(false);
    }
  }

  // ------------------------------------------------------------
  // PDF EXPORT
  // ------------------------------------------------------------

  async function handleExportPDF() {
    if (!worksheetRef.current || !worksheet) return;

    try {
      setStatus("PDF तैयार हो रहा है...");

      console.log(
        "[PDF-Debug] STEP 1: Starting html2canvas capture"
      );

      const canvas = await html2canvas(worksheetRef.current, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: "#ffffff",
        ignoreElements: (element) =>
          element.classList.contains("no-print"),
      });

      console.log(
        "[PDF-Debug] STEP 2: Canvas generated",
        canvas.width,
        canvas.height
      );

      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      console.log(
        "[PDF-Debug] STEP 3: Image data converted, length:",
        imgData.length
      );

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;

      const imgHeight =
        (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        imgData,
        "JPEG",
        10,
        10,
        imgWidth,
        Math.min(imgHeight, pageHeight - 20)
      );

      console.log("[PDF-Debug] STEP 4: Image added to jsPDF");

      const isCapacitor =
        typeof window !== "undefined" &&
        window.Capacitor &&
        window.Capacitor.isNativePlatform();

      const fileName = `worksheet_${Date.now()}.pdf`;

      if (isCapacitor) {
        console.log(
          "[PDF-Debug] STEP 5: Native Capacitor detected, getting base64"
        );

        const base64Data =
          pdf.output("datauristring").split(",")[1];

        console.log(
          "[PDF-Debug] STEP 6: Writing to Directory.Cache"
        );

        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        console.log(
          "[PDF-Debug] STEP 7: File written to cache:",
          writeResult.uri
        );

        console.log("[PDF-Debug] STEP 8: Invoking Share");

        await Share.share({
          title: worksheet.title || "द्विभाषी कार्यपत्रक",
          text: "हिंदी - संताली द्विभाषी कार्यपत्रक",
          url: writeResult.uri,
          dialogTitle: "कार्यपत्रक PDF साझा करें / खोलें",
        });

        setStatus(
          "PDF सफलतापूर्वक तैयार और साझा किया गया।"
        );
      } else {
        console.log(
          "[PDF-Debug] STEP 5: Web environment, saving directly"
        );

        pdf.save(fileName);

        setStatus("PDF सफलतापूर्वक डाउनलोड हो गया।");
      }
    } catch (err) {
      console.error(
        "[PDF-Debug] Error exporting PDF:",
        err
      );

      setStatus(
        "PDF बनाने में समस्या आई: " +
          (err.message || String(err))
      );
    }
  }

  // ------------------------------------------------------------
  // SAVE WORKSHEET
  // ------------------------------------------------------------

  function handleSaveWorksheet() {
    if (!worksheet) return;

    const updated = saveWorksheet(worksheet);

    setSavedWorksheets(updated);

    setStatus("कार्यपत्रक सहेजा गया।");
  }

  // ------------------------------------------------------------
  // DELETE SAVED WORKSHEET
  // ------------------------------------------------------------

  function handleDeleteSaved(savedAt) {
    const updated = deleteSavedWorksheet(savedAt);

    setSavedWorksheets(updated);
  }

  // ------------------------------------------------------------
  // CLEAR HISTORY
  // ------------------------------------------------------------

  function handleClearHistory() {
    clearHistory();

    setHistory([]);
  }

  // ------------------------------------------------------------
  // REUSE HISTORY ITEM
  // ------------------------------------------------------------

  function handleReuseHistoryItem(item) {
    setHindiText(item.hindi);
    setHindiResult(item.hindi);
    setSantaliResult(item.santali);

    setShowHistory(false);

    setStatus("इतिहास से भरा गया।");
  }

  // ------------------------------------------------------------
  // OPEN SAVED WORKSHEET
  // ------------------------------------------------------------

  function handleOpenSavedWorksheet(saved) {
    setWorksheet(saved);
    setShowSaved(false);
    setStatus("सहेजा गया कार्यपत्रक खोला गया।");
  }

  // ------------------------------------------------------------
  // CURRICULUM WORKFLOW HANDLERS
  // ------------------------------------------------------------

  function handleCurriculumToWorksheet(item) {
    if (item.worksheetCategory) {
      setSelectedCategory(item.worksheetCategory);
    }
    setCurrentView("worksheets");
    setStatus(`पाठ्यक्रम से चुना गया: ${item.topic} (अब कार्यपत्रक बनाएँ दबाएँ)`);
  }

  function handleCurriculumToFlashcards() {
    setCurrentView("flashcards");
  }

  function handleCurriculumToVoice() {
    setCurrentView("voice");
  }

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <div className="page">
      <header className="header">
        <div className="header-row">
          <h1>हिंदी → संताली अनुवाद</h1>

          <p
            className="offline-ready"
            title="This badge is built into the page. It does not check the internet."
          >
            <span
              className="offline-dot"
              aria-hidden="true"
            />

            Offline Ready
          </p>
        </div>

        <p className="lang-note">
          भाषा: संताली (ओल चिकी)
        </p>
      </header>

      {/* -------------------------------------------------------
          STATUS
      ------------------------------------------------------- */}

      {status && (
        <p
          className={`status status-banner no-print ${
            status.includes("⚠") || status.includes("समस्या") || status.includes("नहीं") || status.includes("विफल")
              ? "status-warning"
              : status.includes("✓") || status.includes("सफलतापूर्वक")
              ? "status-success"
              : status.includes("⏳") || status.includes("हो रहा है") || status.includes("तैयार की जा रही है")
              ? "status-info"
              : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      )}

      {/* -------------------------------------------------------
          VIEW SWITCHER
      ------------------------------------------------------- */}

      {/* -------------------------------------------------------
          VIEW SWITCHER (PHASE 7 - 6 CORE VIEWS)
      ------------------------------------------------------- */}

      <div className="view-switcher no-print">
        <button
          type="button"
          className={`tab-btn ${
            currentView === "home" ? "active" : ""
          }`}
          onClick={() => setCurrentView("home")}
          aria-label="गृह पृष्ठ (Home)"
        >
          🏠 मुख्य (Home)
        </button>

        <button
          type="button"
          className={`tab-btn ${
            currentView === "voice" ? "active" : ""
          }`}
          onClick={() => setCurrentView("voice")}
          aria-label="ध्वनि संवाद (Voice Dialogue)"
        >
          🎙️ ध्वनि संवाद (Voice)
        </button>

        <button
          type="button"
          className={`tab-btn ${
            currentView === "translate" ? "active" : ""
          }`}
          onClick={() => setCurrentView("translate")}
          aria-label="अनुवाद (Translate)"
        >
          📖 अनुवाद (Translate)
        </button>

        <button
          type="button"
          className={`tab-btn ${
            currentView === "curriculum" ? "active" : ""
          }`}
          onClick={() => setCurrentView("curriculum")}
          aria-label="पाठ्यक्रम (Curriculum)"
        >
          📚 पाठ्यक्रम (Curriculum)
        </button>

        <button
          type="button"
          className={`tab-btn ${
            currentView === "flashcards" ? "active" : ""
          }`}
          onClick={() => setCurrentView("flashcards")}
          aria-label="फ्लैशकार्ड (Flashcards)"
        >
          🗂️ फ्लैशकार्ड (Flashcards)
        </button>

        <button
          type="button"
          className={`tab-btn ${
            currentView === "worksheets" ? "active" : ""
          }`}
          onClick={() => setCurrentView("worksheets")}
          aria-label="कार्यपत्रक (Worksheets)"
        >
          📄 कार्यपत्रक (Worksheets)
        </button>
      </div>

      {/* -------------------------------------------------------
          MODULAR SCREENS (Home, Voice, Translate, Curriculum, Flashcards, Worksheets)
      ------------------------------------------------------- */}

      {currentView === "home" ? (
        <div className="home-screen-view no-print">
          <section className="card home-hero-card">
            <div className="home-hero-header">
              <span className="home-hero-badge">🇮🇳 SIH26042 / PS 1042</span>
              <h2>मातृभाषा आधारित बहुभाषी शिक्षण सहायक</h2>
              <p className="home-hero-subtitle">
                MTB-MLE Classroom Assistant: <strong>Hindi → Santali (ओल चिकी)</strong>
              </p>
            </div>

            <div className="home-status-banner">
              <span className="offline-dot" aria-hidden="true" />
              <div className="home-status-text">
                <strong>पूर्णतः ऑफ़लाइन कार्यरत (100% Offline Ready)</strong>
                <p>सभी अनुवाद, पाठ्यक्रम, कार्यपत्रक एवं फ्लैशकार्ड बिना इंटरनेट के तुरंत उपलब्ध हैं।</p>
              </div>
            </div>

            <h3 className="quick-actions-title">त्वरित कक्षा उपकरण (Quick Actions)</h3>
            <div className="home-quick-grid">
              <button
                type="button"
                className="home-tool-card voice-card"
                onClick={() => setCurrentView("voice")}
              >
                <span className="tool-icon">🎙️</span>
                <span className="tool-title">ध्वनि संवाद (Voice)</span>
                <span className="tool-desc">कक्षा में हिंदी में बोलें और संताली उच्चारण सुनें (Latency &lt; 3s)</span>
              </button>

              <button
                type="button"
                className="home-tool-card translate-card"
                onClick={() => setCurrentView("translate")}
              >
                <span className="tool-icon">📖</span>
                <span className="tool-title">द्विभाषी अनुवाद</span>
                <span className="tool-desc">कक्षा निर्देश, अभिवादन एवं संख्या शब्दों का स्थानीय अनुवाद</span>
              </button>

              <button
                type="button"
                className="home-tool-card curriculum-card"
                onClick={() => setCurrentView("curriculum")}
              >
                <span className="tool-icon">📚</span>
                <span className="tool-title">FLN पाठ्यक्रम</span>
                <span className="tool-desc">कक्षा 1 & 2 के लिए निपुण भारत प्रतिनिधि शिक्षण प्रतिफल पुस्तकालय</span>
              </button>

              <button
                type="button"
                className="home-tool-card flashcard-card"
                onClick={() => setCurrentView("flashcards")}
              >
                <span className="tool-icon">🗂️</span>
                <span className="tool-title">दृश्य फ्लैशकार्ड</span>
                <span className="tool-desc">प्रत्येक शब्द एवं संख्या के वास्तविक दृश्य चित्र एवं उच्चारण</span>
              </button>

              <button
                type="button"
                className="home-tool-card worksheet-card"
                onClick={() => setCurrentView("worksheets")}
              >
                <span className="tool-icon">📄</span>
                <span className="tool-title">कार्यपत्रक एवं PDF</span>
                <span className="tool-desc">छात्र अभ्यास के लिए द्विभाषी प्रिंट-रेडी PDF कार्यपत्रक बनाएँ</span>
              </button>
            </div>
          </section>

          {/* RECENT ACTIVITY SUMMARY */}
          {history.length > 0 && (
            <section className="card home-recent-card">
              <h3>हाल ही में अनुवादित शब्द (Recent Translations)</h3>
              <div className="home-recent-list">
                {history.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="home-recent-item">
                    <span className="recent-hindi">{item.hindi}</span>
                    <span className="recent-arrow">→</span>
                    <span className="recent-santali santali">{item.santali}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : currentView === "curriculum" ? (
        <CurriculumLibrary
          onSelectForWorksheet={handleCurriculumToWorksheet}
          onSelectForFlashcards={handleCurriculumToFlashcards}
          onSelectForVoice={handleCurriculumToVoice}
          onBack={() => setCurrentView("home")}
        />
      ) : currentView === "voice" ? (
        <VoiceDialogue onBack={() => setCurrentView("home")} />
      ) : currentView === "flashcards" ? (
        <Flashcards
          onBack={() => setCurrentView("home")}
        />
      ) : currentView === "worksheets" ? (
        <>
          {/* ---------------------------------------------------
              WORKSHEET GENERATOR SCREEN
          --------------------------------------------------- */}
          <section className="card no-print">
            <div className="worksheet-generator-header">
              <h2>द्विभाषी कार्यपत्रक बनाएँ (Bilingual Worksheets)</h2>
              <p className="worksheet-subtitle">
                कक्षा 1 और 2 के FLN प्रतिफल के अनुसार प्रिंट-रेडी कार्यपत्रक तैयार करें
              </p>
            </div>

            <label
              htmlFor="topic-select"
              className="label"
            >
              विषय चुनें (Select Topic)
            </label>

            <select
              id="topic-select"
              className="input"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value)
              }
            >
              {categories.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                >
                  {CATEGORY_LABELS[cat] ?? cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGenerateWorksheet}
              disabled={worksheetBusy}
            >
              {worksheetBusy
                ? "कार्यपत्रक बन रहा है..."
                : "कार्यपत्रक बनाएँ"}
            </button>

            <hr className="section-divider" />

            {/* Saved worksheets */}
            <button
              type="button"
              className="btn btn-link"
              onClick={() =>
                setShowSaved((v) => !v)
              }
            >
              {showSaved
                ? "सहेजे गए कार्यपत्रक छिपाएँ"
                : `सहेजे गए कार्यपत्रक देखें (${savedWorksheets.length})`}
            </button>

            {showSaved && (
              <div className="history-panel">
                {savedWorksheets.length === 0 && (
                  <p>
                    अभी कोई कार्यपत्रक सहेजा नहीं गया।
                  </p>
                )}

                {savedWorksheets.map((saved) => (
                  <div
                    key={saved.savedAt}
                    className="history-item"
                  >
                    <div>
                      <strong>
                        {saved.title}
                      </strong>
                    </div>

                    <div>
                      <button
                        type="button"
                        className="btn btn-small"
                        onClick={() =>
                          handleOpenSavedWorksheet(saved)
                        }
                      >
                        खोलें
                      </button>

                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() =>
                          handleDeleteSaved(
                            saved.savedAt
                          )
                        }
                      >
                        हटाएँ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* WORKSHEET DISPLAY & PRINT AREA */}
          {worksheet && (
            <section
              className="card worksheet"
              ref={worksheetRef}
            >
              {/* PRINT / WORKSHEET HEADER */}
              <div className="worksheet-print-header">
                <div className="worksheet-title-row">
                  <h2>{worksheet.title}</h2>
                  <div className="worksheet-meta-pills">
                    {worksheet.grade && (
                      <span className="worksheet-pill pill-grade">
                        {worksheet.grade}
                      </span>
                    )}
                    {worksheet.subject && (
                      <span className="worksheet-pill pill-subject">
                        {worksheet.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* STUDENT INFO FIELDS (Printed) */}
                <div className="worksheet-student-info">
                  <div className="info-field">
                    <span>विद्यार्थी का नाम:</span>
                    <span className="underline-blank"></span>
                  </div>
                  <div className="info-field">
                    <span>दिनांक:</span>
                    <span className="underline-blank small"></span>
                  </div>
                  <div className="info-field">
                    <span>कक्षा / रोल नं:</span>
                    <span className="underline-blank small"></span>
                  </div>
                </div>

                {/* OUTCOME BOX */}
                {worksheet.learningOutcome && (
                  <div className="worksheet-outcome-box">
                    <span className="outcome-tag">
                      🎯 प्रतिफल: {worksheet.learningOutcome}
                    </span>
                    <p className="outcome-text">
                      {worksheet.outcomeDescription}
                    </p>
                  </div>
                )}

                {/* BILINGUAL INSTRUCTIONS */}
                <div className="worksheet-instructions-box">
                  <p className="inst-hindi">
                    <strong>{worksheet.instructionsHindi || "निर्देश: नीचे दिए गए शब्दों को पढ़ें और सामने संताली में लिखें।"}</strong>
                  </p>
                  <p className="inst-santali santali">
                    {worksheet.instructionsSantali || "ᱫᱤᱥᱟᱹ: ᱞᱟᱛᱟᱨ ᱨᱮ ᱚᱞ ᱟᱠᱟᱱ ᱟᱹᱲᱟᱹ ᱠᱚ ᱯᱟᱲᱦᱟᱣ ᱢᱮ ᱟᱨ ᱥᱟᱢᱟᱝ ᱨᱮ ᱚᱞ ᱢᱮ᱾"}
                  </p>
                </div>
              </div>

              {/* TABLE */}
              <table className="worksheet-table">
                <thead>
                  <tr>
                    <th style={{ width: "30%" }}>हिंदी (Hindi)</th>
                    <th style={{ width: "35%" }}>संताली (Ol Chiki)</th>
                    <th style={{ width: "35%" }}>अभ्यास (छात्र स्वयं लिखें)</th>
                  </tr>
                </thead>

                <tbody>
                  {worksheet.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ws-hindi-cell">{item.hindi}</td>
                      <td className="santali ws-santali-cell">{item.santali}</td>
                      <td className="practice-blank-cell">
                        <div className="practice-writing-guide"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* WORKSHEET FOOTER */}
              <div className="worksheet-footer-row">
                <span>मूल्यांकन: ⭐ ⭐ ⭐ ⭐ ⭐</span>
                <span>शिक्षक हस्ताक्षर: _______________</span>
              </div>

              <div className="actions no-print">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportPDF}
                >
                  📄 PDF डाउनलोड / साझा करें
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSaveWorksheet}
                >
                  सहेजें
                </button>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          {/* ---------------------------------------------------
              TRANSLATE SCREEN
          --------------------------------------------------- */}

          <section className="card no-print">
            <label
              htmlFor="hindi-input"
              className="label"
            >
              हिंदी में लिखें
            </label>

            <textarea
              id="hindi-input"
              className="input"
              rows={4}
              value={hindiText}
              onChange={(e) =>
                setHindiText(e.target.value)
              }
              placeholder="यहाँ हिंदी वाक्य लिखें..."
            />

            <div className="actions">
              <MicButton
                onResult={handleMicResult}
                onStatus={handleMicStatus}
                onListeningStart={handleMicListeningStart}
                autoTranslate={true}
                disabled={busy && !voiceProcessing}
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTranslate}
                disabled={busy}
              >
                {busy
                  ? "अनुवाद हो रहा है..."
                  : "अनुवाद करें"}
              </button>
            </div>

            {/* Voice processing indicator */}

            {voiceProcessing && (
              <p
                className="status"
                role="status"
                aria-live="polite"
              >
                🎤 आवाज़ संसाधित हो रही है...
              </p>
            )}
          </section>

          {/* ---------------------------------------------------
              RESULTS
          --------------------------------------------------- */}

          <section className="card no-print">
            <h2>परिणाम</h2>

            <div className="bilingual">
              {/* Hindi */}

              <div className="pane">
                <div className="pane-header">
                  <h3>हिंदी</h3>

                  {hindiResult && (
                    <button
                      type="button"
                      className="btn-tts-icon"
                      onClick={() =>
                        handleSpeakHindi(hindiResult)
                      }
                      title="उच्चारण सुनें"
                      aria-label="हिंदी उच्चारण सुनें"
                    >
                      🔊
                    </button>
                  )}
                </div>

                <p className="result-text">
                  {busy ? (
                    <span className="result-placeholder">अनुवाद तैयार हो रहा है...</span>
                  ) : hindiResult ? (
                    hindiResult
                  ) : (
                    <span className="result-placeholder">मूल हिंदी पाठ यहाँ दिखेगा</span>
                  )}
                </p>
              </div>

              {/* Santali */}

              <div className="pane">
                <div className="pane-header">
                  <h3>संताली</h3>

                  {santaliResult && !needsConfirmation && (
                    <button
                      type="button"
                      className="btn-tts-icon"
                      onClick={() =>
                        speakSantali(santaliResult)
                      }
                      title="संताली उच्चारण सुनें"
                      aria-label="संताली उच्चारण सुनें"
                    >
                      🔊
                    </button>
                  )}
                </div>

                <p className={`result-text ${needsConfirmation ? "result-unconfirmed" : "santali"}`}>
                  {busy ? (
                    <span className="result-placeholder">अनुवाद तैयार हो रहा है...</span>
                  ) : needsConfirmation ? (
                    <span className="unconfirmed-warning">
                      ⚠️ अनुवाद की पुष्टि आवश्यक है (मानक अनुवाद अज्ञात)
                    </span>
                  ) : santaliResult ? (
                    santaliResult
                  ) : (
                    <span className="result-placeholder">अनुवाद यहाँ दिखेगा</span>
                  )}
                </p>
              </div>
            </div>

            {/* Confidence indicator badge */}
            {confidence && (
              <div className={`confidence-badge confidence-${confidence}`}>
                <span>{CONFIDENCE_LABELS[confidence] || CONFIDENCE_LABELS.low}</span>
              </div>
            )}

            {/* Low-confidence confirmation banner */}
            {needsConfirmation && (
              <div className="confirmation-banner" role="alert">
                <p>
                  <strong>⚠️ अनुवाद की पुष्टि आवश्यक है:</strong> इस वाक्य का मानक संताली अनुवाद ज्ञात नहीं है। क्या आप इसे सुधारना चाहते हैं?
                </p>
                <div className="confirmation-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      const el = document.getElementById("hindi-input");
                      el?.focus();
                    }}
                  >
                    ✏️ पुनः लिखें
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => {
                      setNeedsConfirmation(false);
                      setStatus("अनुवाद स्वीकार किया गया।");
                      const updatedHistory = addToHistory({
                        hindi: hindiResult,
                        santali: santaliResult,
                        confidence: "low",
                      });
                      setHistory(updatedHistory);
                    }}
                  >
                    ✓ पुष्टि करें
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------
                VOICE LATENCY
            ------------------------------------------------- */}

            {voiceLatency !== null && (
              <div className="voice-latency">
                <strong>
                  ⚡ Voice-to-Voice Response:
                </strong>{" "}
                {voiceLatency} ms

                {voiceLatency <= 3000 ? (
                  <span>
                    {" "}
                    — ✅ 3 सेकंड के अंदर
                  </span>
                ) : (
                  <span>
                    {" "}
                    — ⚠️ 3 सेकंड से अधिक
                  </span>
                )}
              </div>
            )}

            <hr className="section-divider" />

            {/* -------------------------------------------------
                HISTORY BUTTON
            ------------------------------------------------- */}

            <button
              type="button"
              className="btn btn-link"
              onClick={() =>
                setShowHistory((v) => !v)
              }
            >
              {showHistory
                ? "इतिहास छिपाएँ"
                : `इतिहास देखें (${history.length})`}
            </button>

            {showHistory && (
              <div className="history-panel">
                {history.length === 0 && (
                  <p>अभी कोई इतिहास नहीं है।</p>
                )}

                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="history-item"
                  >
                    <div>
                      <strong>
                        {item.hindi}
                      </strong>

                      <span className="santali">
                        {" "}
                        — {item.santali}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() =>
                        handleReuseHistoryItem(item)
                      }
                    >
                      फिर से उपयोग करें
                    </button>
                  </div>
                ))}

                {history.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={handleClearHistory}
                  >
                    इतिहास मिटाएँ
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}