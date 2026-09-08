import { useState, useRef, useCallback } from "react";
import MicButton, { MIC_STATES } from "./MicButton.jsx";
import { translate } from "../translation.js";
import { playSantaliAudio, hasSantaliAudio } from "../audio/santaliAudio.js";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

const SAMPLE_PHRASES = [
  { hindi: "नमस्ते", label: "नमस्ते" },
  { hindi: "किताब खोलो", label: "किताब खोलो" },
  { hindi: "बैठ जाओ", label: "बैठ जाओ" },
  { hindi: "खड़े हो जाओ", label: "खड़े हो जाओ" },
  { hindi: "ध्यान से सुनो", label: "ध्यान से सुनो" },
  { hindi: "शांत रहो", label: "शांत रहो" },
  { hindi: "यहाँ आओ", label: "यहाँ आओ" },
  { hindi: "पाँच", label: "संख्या 5" },
];

export default function VoiceDialogue({ onBack }) {
  const [pipelineState, setPipelineState] = useState("IDLE"); // IDLE, LISTENING, PROCESSING, TRANSLATING, PLAYING, SUCCESS, ERROR
  const [hindiText, setHindiText] = useState("");
  const [santaliText, setSantaliText] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const [audioStatus, setAudioStatus] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const speechEndTimeRef = useRef(null);

  // ------------------------------------------------------------
  // HINDI TTS
  // ------------------------------------------------------------
  const speakHindi = useCallback(async (text) => {
    if (!text) return;
    try {
      await TextToSpeech.speak({
        text,
        lang: "hi-IN",
        rate: 1.0,
      });
    } catch (err) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "hi-IN";
        window.speechSynthesis.speak(u);
      }
    }
  }, []);

  // ------------------------------------------------------------
  // EXECUTE CONNECTED PIPELINE
  // ------------------------------------------------------------
  const processVoiceInput = useCallback(
    async (recognizedHindi) => {
      const text = String(recognizedHindi || "").trim();
      if (!text) {
        setPipelineState("ERROR");
        setStatusMessage("कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।");
        return;
      }

      const t0 = speechEndTimeRef.current || performance.now();
      setHindiText(text);
      setPipelineState("PROCESSING");
      setStatusMessage("⚙ अनुवाद हो रहा है...");

      // Step 1: Local Translation
      const translationResult = translate(text);
      const translatedSantali = translationResult.santali || "";
      const isLowConfidence = Boolean(translationResult.needsConfirmation);

      setSantaliText(translatedSantali);
      setConfidence(translationResult.confidence);
      setNeedsConfirmation(isLowConfidence);

      const hasAudio = hasSantaliAudio(translatedSantali);

      // Step 2: Auto-play Santali Audio if available and confident
      if (hasAudio && !isLowConfidence) {
        setPipelineState("PLAYING");
        setAudioStatus("🔊 संताली ऑडियो बज रहा है...");

        const audioResult = await playSantaliAudio(
          translatedSantali,
          () => {
            // Audio start timestamp for exact end-to-end latency
            const totalElapsed = Math.round(performance.now() - t0);
            setLatencyMs(totalElapsed);
          },
          () => {
            setPipelineState("SUCCESS");
            setAudioStatus("✓ संताली ऑडियो पूर्ण हुआ");
          }
        );

        if (!audioResult.played) {
          const totalElapsed = Math.round(performance.now() - t0);
          setLatencyMs(totalElapsed);
          setPipelineState("SUCCESS");
          setAudioStatus("ℹ️ ऑडियो स्वचालित रूप से नहीं चल सका");
        }
      } else {
        const totalElapsed = Math.round(performance.now() - t0);
        setLatencyMs(totalElapsed);
        setPipelineState(isLowConfidence ? "CONFIRMATION_REQUIRED" : "SUCCESS");

        if (isLowConfidence) {
          setAudioStatus("⚠️ अनुवाद की पुष्टि आवश्यक है");
        } else if (!hasAudio) {
          setAudioStatus(
            "ℹ️ इस वाक्य के लिए संताली ऑडियो उपलब्ध नहीं है (मानक पाठ प्रदर्शित है)"
          );
        }
      }

      speechEndTimeRef.current = null;
    },
    []
  );

  // ------------------------------------------------------------
  // MIC HANDLERS
  // ------------------------------------------------------------
  const handleMicListeningStart = useCallback(() => {
    setPipelineState("LISTENING");
    setStatusMessage("🔴 सुन रहा हूँ... कक्षा का निर्देश बोलें");
    setAudioStatus("");
    setLatencyMs(null);
  }, []);

  const handleMicResult = useCallback(
    (transcript) => {
      speechEndTimeRef.current = performance.now();
      processVoiceInput(transcript);
    },
    [processVoiceInput]
  );

  const handleMicStatus = useCallback((status) => {
    setStatusMessage(status);
  }, []);

  const handleMicStateChange = useCallback((micState) => {
    if (micState === MIC_STATES.LISTENING) {
      setPipelineState("LISTENING");
    } else if (micState === MIC_STATES.PROCESSING) {
      setPipelineState("PROCESSING");
    } else if (micState === MIC_STATES.NO_SPEECH) {
      setPipelineState("NO_SPEECH");
    } else if (micState === MIC_STATES.PERMISSION_DENIED) {
      setPipelineState("PERMISSION_DENIED");
    } else if (micState === MIC_STATES.OFFLINE_MODEL_UNAVAILABLE) {
      setPipelineState("OFFLINE_MODEL_UNAVAILABLE");
    } else if (micState === MIC_STATES.ERROR) {
      setPipelineState("ERROR");
    }
  }, []);

  // Quick phrase tester
  const handleSampleClick = (sampleText) => {
    speechEndTimeRef.current = performance.now();
    processVoiceInput(sampleText);
  };

  return (
    <div className="voice-dialogue-view no-print">
      {/* HEADER */}
      <div className="dialogue-header">
        <div>
          <h2>ध्वनि संवाद (Voice Dialogue)</h2>
          <p className="dialogue-subtitle">
            शिक्षक हिंदी में बोलें → विद्यार्थी संताली में सुनें
          </p>
        </div>

        <div className="dialogue-header-actions">
          <span className="offline-ready" title="पूर्णतः ऑफ़लाइन कार्यरत">
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

      {/* PROMINENT MICROPHONE INTERACTION HERO */}
      <div className="dialogue-hero-card">
        <div className="dialogue-mic-wrapper">
          <MicButton
            onResult={handleMicResult}
            onStatus={handleMicStatus}
            onListeningStart={handleMicListeningStart}
            onMicStateChange={handleMicStateChange}
            autoTranslate={false}
          />
        </div>

        <div className="dialogue-status-wrapper">
          {pipelineState === "LISTENING" && (
            <div className="status-indicator listening-pulse">
              <span className="pulse-dot" />
              <strong>कक्षा में बोलिए... (सुन रहा हूँ)</strong>
            </div>
          )}

          {pipelineState === "PROCESSING" && (
            <div className="status-indicator">
              <span>⚙ समझ रहा हूँ और अनुवाद कर रहा हूँ...</span>
            </div>
          )}

          {pipelineState === "PLAYING" && (
            <div className="status-indicator playing-wave">
              <span>🔊 संताली ऑडियो सुनाई दे रहा है...</span>
            </div>
          )}

          {pipelineState === "IDLE" && (
            <p className="hint-text">
              👆 माइक बटन दबाएँ और हिंदी में निर्देश या प्रश्न बोलें
            </p>
          )}

          {statusMessage && pipelineState !== "IDLE" && (
            <p className="dialogue-status-text">{statusMessage}</p>
          )}
        </div>

        {/* LATENCY BENCHMARK DISPLAY */}
        {latencyMs !== null && (
          <div className="latency-badge-card">
            <div className="latency-row">
              <span className="latency-label">⏱️ Voice-to-Voice Latency:</span>
              <strong className="latency-value">
                {(latencyMs / 1000).toFixed(2)} सेकंड ({latencyMs} ms)
              </strong>
              {latencyMs <= 3000 ? (
                <span className="latency-tag pass">✅ &lt; 3 सेकंड (वास्तविक समय)</span>
              ) : (
                <span className="latency-tag warn">⚠️ &gt; 3 सेकंड</span>
              )}
            </div>
            <span className="latency-footnote">
              (भाषण समाप्ति → एसटीटी → अनुवाद → संताली ऑडियो प्रारंभ)
            </span>
          </div>
        )}
      </div>

      {/* BILINGUAL SPEECH RESULTS */}
      {(hindiText || santaliText) && (
        <div className="dialogue-results-grid">
          {/* TEACHER (HINDI) */}
          <div className="dialogue-card teacher-card">
            <div className="dialogue-card-header">
              <span className="role-badge teacher">👨‍🏫 शिक्षक ने कहा (हिंदी)</span>
              {hindiText && (
                <button
                  type="button"
                  className="btn-tts-icon"
                  onClick={() => speakHindi(hindiText)}
                  title="हिंदी में पुनः सुनें"
                  aria-label="हिंदी उच्चारण सुनें"
                >
                  🔊
                </button>
              )}
            </div>

            <div className="dialogue-text-body">
              <p className="dialogue-main-text">{hindiText}</p>
            </div>
          </div>

          {/* STUDENT (SANTALI - OL CHIKI) */}
          <div className="dialogue-card student-card">
            <div className="dialogue-card-header">
              <span className="role-badge student">👧 विद्यार्थी सुनेगा (संताली)</span>
              {santaliText && !needsConfirmation && hasSantaliAudio(santaliText) && (
                <button
                  type="button"
                  className="btn-tts-icon"
                  onClick={() => playSantaliAudio(santaliText)}
                  title="संताली में पुनः सुनें"
                  aria-label="संताली उच्चारण सुनें"
                >
                  🔊
                </button>
              )}
            </div>

            <div className="dialogue-text-body">
              <p className="dialogue-main-text santali">
                {needsConfirmation ? (
                  <span className="unconfirmed-warning">
                    ⚠️ {santaliText}
                  </span>
                ) : (
                  santaliText
                )}
              </p>

              {audioStatus && (
                <p className="audio-status-caption">{audioStatus}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOW-CONFIDENCE CONFIRMATION DIALOG */}
      {needsConfirmation && (
        <div className="confirmation-banner" role="alert">
          <p>
            <strong>⚠️ अनुवाद की पुष्टि आवश्यक है:</strong> इस वाक्य का मानक
            कक्षा अनुवाद सुनिश्चित नहीं है। क्या आप इसे सुधारना चाहते हैं?
          </p>
          <div className="confirmation-actions">
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                setNeedsConfirmation(false);
                setHindiText("");
                setSantaliText("");
              }}
            >
              🔄 दोबारा बोलें
            </button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => setNeedsConfirmation(false)}
            >
              ✓ पाठ स्वीकार करें
            </button>
          </div>
        </div>
      )}

      {/* INSTANT CLASSROOM PHRASE PILLS FOR TESTING / DEMOS */}
      <div className="quick-test-section">
        <label className="label-sm">
          💡 त्वरित कक्षा परीक्षण (Quick Classroom Demos):
        </label>
        <div className="quick-pill-container">
          {SAMPLE_PHRASES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              className="quick-pill-btn"
              onClick={() => handleSampleClick(sample.hindi)}
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
