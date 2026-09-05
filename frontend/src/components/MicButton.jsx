import { useEffect, useRef, useState } from "react";

/**
 * Offline-aware Hindi voice input button.
 * Uses the browser's built-in Web Speech API (webkitSpeechRecognition).
 * This is NOT a paid API and requires no network call to run on
 * supported Android WebViews/Chrome, though exact offline behavior
 * varies by device — this component always degrades gracefully to
 * typed input if speech recognition is unavailable or fails.
 */
export default function MicButton({ onResult, onStatus, disabled }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) {
        onResult(transcript);
        onStatus("आवाज़ पहचानी गई।");
      } else {
        onStatus("आवाज़ समझ नहीं आई, कृपया दोबारा कोशिश करें।");
      }
      setListening(false);
    };

    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "no-speech") {
        onStatus("कोई आवाज़ नहीं सुनाई दी। दोबारा कोशिश करें।");
      } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        onStatus("माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया अनुमति दें।");
      } else {
        onStatus("आवाज़ पहचानने में समस्या हुई। कृपया टाइप करें।");
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;
    };
  }, [onResult, onStatus]);

  function handleClick() {
    if (!supported) {
      onStatus(
        "इस डिवाइस/ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। कृपया हिंदी में टाइप करें।"
      );
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      onStatus("सुन रहा है...");
      setListening(true);
      recognitionRef.current?.start();
    } catch (err) {
      setListening(false);
      onStatus("माइक्रोफ़ोन शुरू नहीं हो सका। कृपया टाइप करें।");
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-mic${listening ? " btn-mic-active" : ""}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label="माइक्रोफ़ोन"
      aria-pressed={listening}
    >
      {listening ? "🔴 सुन रहा है..." : "🎤 माइक"}
    </button>
  );
}