import { useState } from "react";
import { callTranslate } from "./api.js";

export default function App() {
  const [hindiText, setHindiText] = useState("");
  const [hindiResult, setHindiResult] = useState("");
  const [santaliResult, setSantaliResult] = useState("");
  const [status, setStatus] = useState("");
  const [worksheet, setWorksheet] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleTranslate() {
    const text = hindiText.trim();
    if (!text) {
      setStatus("कृपया हिंदी में पाठ लिखें।");
      return;
    }

    setBusy(true);
    setStatus("अनुवाद हो रहा है...");
    setWorksheet(null);

    try {
      const data = await callTranslate(text);
      setHindiResult(data.hindi ?? text);
      setSantaliResult(data.santali ?? "");
      setStatus(
        "अनुवाद तैयार है। (अभी केवल परीक्षण — असली अनुवाद बाद में जुड़ेगा)"
      );
    } catch (err) {
      setStatus(
        "सर्वर से जुड़ नहीं पाए। बैकएंड चल रहा है या नहीं, जाँचें।"
      );
    } finally {
      setBusy(false);
    }
  }

  function handleMicPlaceholder() {
    setStatus(
      "माइक्रोफ़ोन अभी तैयार नहीं है। बाद में आवाज़ से लिखना जुड़ेगा।"
    );
  }

  function handleWorksheet() {
    if (!hindiResult && !santaliResult) {
      setStatus("पहले अनुवाद करें, फिर कार्यपत्रक बनाएँ।");
      return;
    }

    setWorksheet({
      hindi: hindiResult,
      santali: santaliResult,
    });
    setStatus("कार्यपत्रक तैयार है। (अभी केवल परीक्षण)");
  }

  return (
    <div className="page">
      <header className="header">
        <h1>हिंदी → संताली अनुवाद</h1>
        <p className="lang-note">भाषा: संताली (ओल चिकी)</p>
      </header>

      <section className="card">
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
          <button
            type="button"
            className="btn btn-mic"
            onClick={handleMicPlaceholder}
            aria-label="माइक्रोफ़ोन"
          >
            🎤 माइक
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleTranslate}
            disabled={busy}
          >
            अनुवाद करें
          </button>
        </div>
      </section>

      <section className="card">
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

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleWorksheet}
        >
          कार्यपत्रक बनाएँ
        </button>
      </section>

      {worksheet && (
        <section className="card worksheet">
          <h2>द्विभाषी कार्यपत्रक</h2>
          <p>
            <strong>हिंदी:</strong> {worksheet.hindi}
          </p>
          <p className="santali">
            <strong>संताली:</strong> {worksheet.santali}
          </p>
        </section>
      )}

      {status && <p className="status">{status}</p>}
    </div>
  );
}
