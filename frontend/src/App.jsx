import { useState, useCallback, useEffect } from "react";
import { callTranslate, fetchWorksheetCategories, callWorksheet } from "./api.js";
import MicButton from "./components/MicButton.jsx";
import {
  getHistory,
  addToHistory,
  clearHistory,
  getSavedWorksheets,
  saveWorksheet,
  deleteSavedWorksheet,
} from "./storage.js";

const CATEGORY_LABELS = {
  number: "संख्याएँ",
  day: "सप्ताह के दिन",
  greeting: "अभिवादन",
  classroom: "कक्षा के निर्देश",
  noun: "सामान्य शब्द",
};

export default function App() {
  const [hindiText, setHindiText] = useState("");
  const [hindiResult, setHindiResult] = useState("");
  const [santaliResult, setSantaliResult] = useState("");
  const [status, setStatus] = useState("");
  const [worksheet, setWorksheet] = useState(null);
  const [busy, setBusy] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [worksheetBusy, setWorksheetBusy] = useState(false);

  const [history, setHistory] = useState([]);
  const [savedWorksheets, setSavedWorksheets] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    fetchWorksheetCategories()
      .then((data) => {
        const list = data.categories ?? [];
        setCategories(list);
        if (list.length > 0) setSelectedCategory(list[0]);
      })
      .catch(() => {
        setStatus(
          "विषय सूची लोड नहीं हो पाई। बैकएंड चल रहा है या नहीं, जाँचें।"
        );
      });

    setHistory(getHistory());
    setSavedWorksheets(getSavedWorksheets());
  }, []);

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
      console.log(`Translation round trip: ${elapsedMs}ms`);

      setHindiResult(data.hindi ?? text);
      setSantaliResult(data.santali ?? "");

      const matchLabel =
        data.confidence === "exact" ? "पूर्ण मिलान" : "आंशिक मिलान";
      setStatus(`अनुवाद तैयार है। ${matchLabel} (${elapsedMs} ms)`);

      const updatedHistory = addToHistory(data);
      setHistory(updatedHistory);
    } catch (err) {
      setStatus(
        "सर्वर से जुड़ नहीं पाए। बैकएंड चल रहा है या नहीं, जाँचें।"
      );
    } finally {
      setBusy(false);
    }
  }

  const handleMicResult = useCallback((transcript) => {
    setHindiText(transcript);
  }, []);

  const handleMicStatus = useCallback((message) => {
    setStatus(message);
  }, []);

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
      setStatus(
        "कार्यपत्रक नहीं बन पाया। बैकएंड चल रहा है या नहीं, जाँचें।"
      );
    } finally {
      setWorksheetBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleSaveWorksheet() {
    if (!worksheet) return;
    const updated = saveWorksheet(worksheet);
    setSavedWorksheets(updated);
    setStatus("कार्यपत्रक सहेजा गया।");
  }

  function handleDeleteSaved(savedAt) {
    const updated = deleteSavedWorksheet(savedAt);
    setSavedWorksheets(updated);
  }

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  function handleReuseHistoryItem(item) {
    setHindiText(item.hindi);
    setHindiResult(item.hindi);
    setSantaliResult(item.santali);
    setShowHistory(false);
    setStatus("इतिहास से भरा गया।");
  }

  function handleOpenSavedWorksheet(saved) {
    setWorksheet(saved);
    setShowSaved(false);
    setStatus("सहेजा गया कार्यपत्रक खोला गया।");
  }

  return (
    <div className="page">
      <header className="header">
        <div className="header-row">
          <h1>हिंदी → संताली अनुवाद</h1>
          <p className="offline-ready" title="This badge is built into the page. It does not check the internet.">
            <span className="offline-dot" aria-hidden="true" />
            Offline Ready
          </p>
        </div>
        <p className="lang-note">भाषा: संताली (ओल चिकी)</p>
      </header>

      <section className="card no-print">
        <label htmlFor="hindi-input" className="label">
          हिंदी में लिखें
        </label>
        <textarea
          id="hindi-input"
          className="input"
          rows={4}
          value={hindiText}
          onChange={(e) => setHindiText(e.target.value)}
          placeholder="यहाँ हिंदी वाक्य लिखें..."
        />

        <div className="actions">
          <MicButton
            onResult={handleMicResult}
            onStatus={handleMicStatus}
            disabled={busy}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTranslate}
            disabled={busy}
          >
            {busy ? "अनुवाद हो रहा है..." : "अनुवाद करें"}
          </button>
        </div>
      </section>

      <section className="card no-print">
        <h2>परिणाम</h2>
        <div className="bilingual">
          <div className="pane">
            <h3>हिंदी</h3>
            <p className="result-text">{hindiResult || "—"}</p>
          </div>
          <div className="pane">
            <h3>संताली</h3>
            <p className="result-text santali">{santaliResult || "—"}</p>
          </div>
        </div>

        <hr className="section-divider" />

        <button
          type="button"
          className="btn btn-link"
          onClick={() => setShowHistory((v) => !v)}
        >
          {showHistory ? "इतिहास छिपाएँ" : `इतिहास देखें (${history.length})`}
        </button>

        {showHistory && (
          <div className="history-panel">
            {history.length === 0 && <p>अभी कोई इतिहास नहीं है।</p>}
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <div>
                  <strong>{item.hindi}</strong>
                  <span className="santali"> — {item.santali}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => handleReuseHistoryItem(item)}
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

      <section className="card no-print">
        <h2>द्विभाषी कार्यपत्रक बनाएँ</h2>
        <label htmlFor="topic-select" className="label">
          विषय चुनें
        </label>
        <select
          id="topic-select"
          className="input"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
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
          {worksheetBusy ? "कार्यपत्रक बन रहा है..." : "कार्यपत्रक बनाएँ"}
        </button>

        <hr className="section-divider" />

        <button
          type="button"
          className="btn btn-link"
          onClick={() => setShowSaved((v) => !v)}
        >
          {showSaved
            ? "सहेजे गए कार्यपत्रक छिपाएँ"
            : `सहेजे गए कार्यपत्रक देखें (${savedWorksheets.length})`}
        </button>

        {showSaved && (
          <div className="history-panel">
            {savedWorksheets.length === 0 && (
              <p>अभी कोई कार्यपत्रक सहेजा नहीं गया।</p>
            )}
            {savedWorksheets.map((saved) => (
              <div key={saved.savedAt} className="history-item">
                <div>
                  <strong>{saved.title}</strong>
                </div>
                <div>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => handleOpenSavedWorksheet(saved)}
                  >
                    खोलें
                  </button>
                  <button
                    type="button"
                    className="btn btn-small btn-danger"
                    onClick={() => handleDeleteSaved(saved.savedAt)}
                  >
                    हटाएँ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {worksheet && (
        <section className="card worksheet">
          <h2>{worksheet.title}</h2>
          <table className="worksheet-table">
            <thead>
              <tr>
                <th>हिंदी</th>
                <th>संताली</th>
                <th>अभ्यास (लिखें)</th>
              </tr>
            </thead>
            <tbody>
              {worksheet.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.hindi}</td>
                  <td className="santali">{item.santali}</td>
                  <td className="practice-blank"></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="actions no-print">
            <button type="button" className="btn btn-secondary" onClick={handlePrint}>
              प्रिंट करें / PDF सहेजें
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleSaveWorksheet}>
              सहेजें
            </button>
          </div>
        </section>
      )}

      {status && <p className="status no-print">{status}</p>}
    </div>
  );
}