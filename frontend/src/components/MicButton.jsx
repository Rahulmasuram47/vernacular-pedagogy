import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { normalizeHindi } from "../translation/normalize.js";

/**
 * Robust Speech Recognition State Machine for Phase 1.
 *
 * Explicit states:
 * - IDLE: Ready to listen
 * - LISTENING: Audio recording active
 * - PROCESSING: Analyzing speech / normalizing
 * - SUCCESS: Speech recognized successfully
 * - PERMISSION_DENIED: Microphone runtime permission missing/rejected
 * - NO_SPEECH: Microphone heard silence / timeout
 * - RECOGNITION_UNAVAILABLE: OS SpeechRecognizer service not found
 * - OFFLINE_MODEL_UNAVAILABLE: Device lacks offline Hindi speech pack
 * - ERROR: Unrecoverable capture or recognition fault
 */
export const MIC_STATES = {
  IDLE: "IDLE",
  LISTENING: "LISTENING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  NO_SPEECH: "NO_SPEECH",
  RECOGNITION_UNAVAILABLE: "RECOGNITION_UNAVAILABLE",
  OFFLINE_MODEL_UNAVAILABLE: "OFFLINE_MODEL_UNAVAILABLE",
  ERROR: "ERROR",
  // Backward-compatibility alias
  READY: "IDLE",
};

export const MIC_LABELS = {
  IDLE: "🎤 बोलें",
  LISTENING: "🔴 सुन रहा हूँ...",
  PROCESSING: "⚙ आवाज़ समझी जा रही है...",
  SUCCESS: "✓ आवाज़ पहचानी गई",
  PERMISSION_DENIED: "🔒 माइक्रोफ़ोन अनुमति दें",
  NO_SPEECH: "🔇 पुनः बोलें",
  RECOGNITION_UNAVAILABLE: "⚠ पहचान सेवा अनुपलब्ध",
  OFFLINE_MODEL_UNAVAILABLE: "📡 ऑफ़लाइन पैक आवश्यक",
  ERROR: "⚠ पुनः प्रयास करें",
};

function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function isDeviceOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Maps raw plugin/browser errors into an explicit mic state and descriptive Hindi explanation.
 *
 * @param {any} error
 * @returns {{ state: string, message: string }}
 */
export function classifySpeechError(error) {
  const rawMsg =
    typeof error === "string"
      ? error
      : error?.message || error?.code || JSON.stringify(error) || "";
  const code = String(rawMsg).toLowerCase();
  const offline = isDeviceOffline();

  console.warn(
    "[SpeechRecognition] Error signature:",
    rawMsg,
    "| code:",
    code,
    "| isOffline:",
    offline
  );

  // 1. Microphone permission rejected or missing
  if (
    code.includes("permission") ||
    code.includes("notallowed") ||
    code.includes("not-allowed") ||
    code.includes("denied")
  ) {
    return {
      state: MIC_STATES.PERMISSION_DENIED,
      message:
        "माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया डिवाइस सेटिंग्स में जाकर ऐप को माइक्रोफ़ोन (Record Audio) की अनुमति दें।",
    };
  }

  // 2. Service completely unavailable on device
  if (
    code.includes("not_available") ||
    code.includes("unavailable") ||
    code.includes("no speech recognition service") ||
    code.includes("recognizer")
  ) {
    return {
      state: MIC_STATES.RECOGNITION_UNAVAILABLE,
      message:
        "इस डिवाइस पर Speech Recognition सेवा उपलब्ध नहीं है। कृपया Google ऐप या वॉइस रिकॉग्निशन सक्षम करें।",
    };
  }

  // 3. Offline model unavailable (network failure when offline)
  const isNetworkFailure =
    code.includes("network") ||
    code.includes("server") ||
    code.includes("error from server") ||
    code.includes("client");

  if (offline && isNetworkFailure) {
    return {
      state: MIC_STATES.OFFLINE_MODEL_UNAVAILABLE,
      message:
        "इस डिवाइस पर ऑफ़लाइन हिंदी आवाज़ पहचान उपलब्ध नहीं है। कृपया इंटरनेट चालू करें या डिवाइस सेटिंग्स (Google > Voice > Offline speech recognition) में जाकर हिन्दी पैक डाउनलोड करें, या नीचे सीधे टाइप करें।",
    };
  }

  // 4. No speech detected (silence / timeout / no match)
  if (
    code.includes("nomatch") ||
    code.includes("no-match") ||
    code.includes("no match") ||
    code.includes("no speech") ||
    code.includes("timeout") ||
    code.includes("speech_timeout")
  ) {
    return {
      state: MIC_STATES.NO_SPEECH,
      message:
        "कोई आवाज़ सुनाई नहीं दी। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।",
    };
  }

  // 5. Network failure while online
  if (isNetworkFailure && !offline) {
    return {
      state: MIC_STATES.ERROR,
      message:
        "आवाज़ पहचान सर्वर से संपर्क नहीं हो पाया। कृपया पुनः प्रयास करें या नीचे टाइप करें।",
    };
  }

  // 6. Audio capture device busy or error
  if (code.includes("busy")) {
    return {
      state: MIC_STATES.ERROR,
      message: "आवाज़ सेवा अभी व्यस्त है। कृपया एक क्षण रुककर दोबारा बोलें।",
    };
  }

  if (code.includes("audio") || code.includes("capture")) {
    return {
      state: MIC_STATES.ERROR,
      message: "माइक्रोफ़ोन से आवाज़ रिकॉर्ड करने में समस्या आई।",
    };
  }

  // Generic fallback
  return {
    state: MIC_STATES.ERROR,
    message: "आवाज़ पहचानने में समस्या आई। कृपया दोबारा प्रयास करें।",
  };
}

export default function MicButton({
  onResult,
  onStatus,
  onListeningStart,
  onMicStateChange,
  disabled = false,
  autoTranslate = true,
}) {
  const [micState, setMicState] = useState(MIC_STATES.IDLE);
  const [supported, setSupported] = useState(true);

  const nativeListenerRef = useRef(null);
  const webRecognitionRef = useRef(null);
  const stoppingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const native = isNativeAndroid();

  // Notify parent of state changes
  const updateState = useCallback(
    (newState) => {
      setMicState(newState);
      onMicStateChange?.(newState);
    },
    [onMicStateChange]
  );

  // ------------------------------------------------------------
  // SUPPORT & AVAILABILITY CHECK
  // ------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
      if (native) {
        try {
          const available = await SpeechRecognition.available();
          if (mounted) {
            const isAvail = Boolean(available?.available);
            setSupported(isAvail);
            if (!isAvail) {
              updateState(MIC_STATES.RECOGNITION_UNAVAILABLE);
              onStatus?.(
                "इस डिवाइस पर Speech Recognition सेवा उपलब्ध नहीं है।"
              );
            }
          }
          console.log("[SpeechRecognition] Native availability:", available);
        } catch (error) {
          console.error(
            "[SpeechRecognition] Availability check failed:",
            error
          );
          if (mounted) {
            setSupported(true);
          }
        }
        return;
      }

      const WebSpeech =
        typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

      const browserSupported = Boolean(WebSpeech);

      if (mounted) {
        setSupported(browserSupported);
        if (!browserSupported) {
          updateState(MIC_STATES.RECOGNITION_UNAVAILABLE);
          onStatus?.(
            "इस ब्राउज़र में Speech Recognition उपलब्ध नहीं है।"
          );
        }
      }
    }

    checkSupport();

    return () => {
      mounted = false;
    };
  }, [native, onStatus, updateState]);

  // ------------------------------------------------------------
  // CLEANUP NATIVE LISTENER
  // ------------------------------------------------------------
  const removeNativeListener = useCallback(async () => {
    if (!nativeListenerRef.current) {
      return;
    }
    try {
      await nativeListenerRef.current.remove();
    } catch (error) {
      console.warn("[SpeechRecognition] Listener cleanup warning:", error);
    }
    nativeListenerRef.current = null;
  }, []);

  // ------------------------------------------------------------
  // CLEANUP WEB RECOGNITION
  // ------------------------------------------------------------
  const cleanupWebRecognition = useCallback(() => {
    const recognition = webRecognitionRef.current;
    if (!recognition) {
      return;
    }
    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      recognition.stop();
    } catch (error) {
      console.warn("[SpeechRecognition] Web cleanup warning:", error);
    }
    webRecognitionRef.current = null;
  }, []);

  // ------------------------------------------------------------
  // CLEANUP ALL
  // ------------------------------------------------------------
  const cleanupRecognition = useCallback(async () => {
    cleanupWebRecognition();
    await removeNativeListener();
  }, [cleanupWebRecognition, removeNativeListener]);

  // ------------------------------------------------------------
  // FINISH WITH EXTRACTED TEXT
  // ------------------------------------------------------------
  const finishWithText = useCallback(
    async (rawText) => {
      if (stoppingRef.current) {
        return;
      }
      stoppingRef.current = true;

      updateState(MIC_STATES.PROCESSING);
      onStatus?.("⚙ अनुवाद हो रहा है...");

      const normalized = normalizeHindi(String(rawText || "").trim());

      console.log("[SpeechRecognition] Final transcript:", normalized);

      await cleanupRecognition();

      if (normalized) {
        updateState(MIC_STATES.SUCCESS);
        onResult?.(normalized);
        if (!autoTranslate) {
          onStatus?.("✓ आवाज़ पहचानी गई");
        }
      } else {
        updateState(MIC_STATES.NO_SPEECH);
        onStatus?.(
          "कोई शब्द पहचाना नहीं गया। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।"
        );
      }

      finalTranscriptRef.current = "";
      stoppingRef.current = false;
    },
    [autoTranslate, cleanupRecognition, onResult, onStatus, updateState]
  );

  // ------------------------------------------------------------
  // NATIVE ANDROID RECOGNITION
  // ------------------------------------------------------------
  const startNativeRecognition = useCallback(async () => {
    try {
      // 1. Check & request runtime permissions
      let permissions = await SpeechRecognition.checkPermissions();
      console.log("[SpeechRecognition] Permission status:", permissions);

      if (permissions?.speechRecognition !== "granted") {
        onStatus?.("🎤 माइक्रोफ़ोन की अनुमति चाहिए...");
        permissions = await SpeechRecognition.requestPermissions();
        console.log("[SpeechRecognition] Requested permissions:", permissions);
      }

      if (permissions?.speechRecognition !== "granted") {
        updateState(MIC_STATES.PERMISSION_DENIED);
        onStatus?.(
          "माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया सेटिंग्स में जाकर रिकॉर्ड ऑडियो की अनुमति दें।"
        );
        return;
      }

      await removeNativeListener();

      // 2. Add lifecycle listener for start/stop
      nativeListenerRef.current = await SpeechRecognition.addListener(
        "listeningState",
        (data) => {
          console.log("[SpeechRecognition] listeningState:", data);
          if (data?.status === "started") {
            updateState(MIC_STATES.LISTENING);
            onListeningStart?.();
            onStatus?.("🔴 सुन रहा हूँ... (हिंदी में बोलें)");
          }
        }
      );

      updateState(MIC_STATES.LISTENING);
      onListeningStart?.();
      onStatus?.("🔴 सुन रहा हूँ... (हिंदी में बोलें)");

      console.log("[SpeechRecognition] Starting native recognition (hi-IN)...");

      let result;
      try {
        // Attempt in-app listening first
        result = await SpeechRecognition.start({
          language: "hi-IN",
          maxResults: 5,
          prompt: "हिंदी में बोलें...",
          popup: false,
          partialResults: false,
        });
      } catch (inAppError) {
        console.warn(
          "[SpeechRecognition] In-app start failed, attempting system popup fallback:",
          inAppError
        );
        // Fallback to system popup dialog on Android devices where background service is restricted
        result = await SpeechRecognition.start({
          language: "hi-IN",
          maxResults: 5,
          prompt: "हिंदी में बोलें...",
          popup: true,
          partialResults: false,
        });
      }

      console.log("[SpeechRecognition] Native result:", result);

      let text = "";
      if (Array.isArray(result?.matches) && result.matches.length > 0) {
        text = result.matches[0];
      } else if (typeof result?.text === "string") {
        text = result.text;
      } else if (typeof result?.result === "string") {
        text = result.result;
      }

      if (!text) {
        updateState(MIC_STATES.NO_SPEECH);
        onStatus?.(
          "कोई शब्द पहचाना नहीं गया। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।"
        );
        await removeNativeListener();
        return;
      }

      finalTranscriptRef.current = text;
      await finishWithText(text);
    } catch (error) {
      console.error("[SpeechRecognition] Native recognition error:", error);
      const classified = classifySpeechError(error);
      updateState(classified.state);
      onStatus?.(classified.message);

      await cleanupRecognition();
      stoppingRef.current = false;
    }
  }, [
    cleanupRecognition,
    finishWithText,
    onListeningStart,
    onStatus,
    removeNativeListener,
    updateState,
  ]);

  // ------------------------------------------------------------
  // STOP NATIVE RECOGNITION
  // ------------------------------------------------------------
  const stopNativeRecognition = useCallback(async () => {
    if (stoppingRef.current) {
      return;
    }
    stoppingRef.current = true;
    console.log("[SpeechRecognition] Stopping native recognition...");

    try {
      await SpeechRecognition.stop();
    } catch (error) {
      console.warn("[SpeechRecognition] Native stop error:", error);
    }

    await removeNativeListener();
    stoppingRef.current = false;
  }, [removeNativeListener]);

  // ------------------------------------------------------------
  // WEB SPEECH API FALLBACK (BROWSER DEV)
  // ------------------------------------------------------------
  const startWebRecognition = useCallback(() => {
    const WebSpeech =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!WebSpeech) {
      setSupported(false);
      updateState(MIC_STATES.RECOGNITION_UNAVAILABLE);
      onStatus?.("इस ब्राउज़र में Hindi Speech Recognition उपलब्ध नहीं है।");
      return;
    }

    try {
      const recognition = new WebSpeech();
      webRecognitionRef.current = recognition;

      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 5;

      recognition.onstart = () => {
        console.log("[SpeechRecognition] Browser recognition started.");
        updateState(MIC_STATES.LISTENING);
        onListeningStart?.();
        onStatus?.("🔴 सुन रहा हूँ... (हिंदी में बोलें)");
      };

      recognition.onresult = (event) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res?.isFinal && res[0]?.transcript) {
            text += res[0].transcript;
          }
        }
        text = text.trim();
        console.log("[SpeechRecognition] Browser final text:", text);
        if (text) {
          finishWithText(text);
        }
      };

      recognition.onerror = (event) => {
        console.error("[SpeechRecognition] Browser error:", event);
        const classified = classifySpeechError(event?.error);
        updateState(classified.state);
        onStatus?.(classified.message);
        cleanupWebRecognition();
        stoppingRef.current = false;
      };

      recognition.onend = () => {
        console.log("[SpeechRecognition] Browser recognition ended.");
        if (
          !stoppingRef.current &&
          webRecognitionRef.current === recognition &&
          micState === MIC_STATES.LISTENING
        ) {
          updateState(MIC_STATES.NO_SPEECH);
          onStatus?.("कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।");
        }
        webRecognitionRef.current = null;
      };

      onStatus?.("🎤 माइक्रोफ़ोन की अनुमति चाहिए...");
      recognition.start();
    } catch (error) {
      console.error("[SpeechRecognition] Browser start failed:", error);
      const classified = classifySpeechError(error);
      updateState(classified.state);
      onStatus?.(classified.message);
      cleanupWebRecognition();
      stoppingRef.current = false;
    }
  }, [
    cleanupWebRecognition,
    finishWithText,
    micState,
    onListeningStart,
    onStatus,
    updateState,
  ]);

  // ------------------------------------------------------------
  // START LISTENING ENTRY POINT
  // ------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (
      micState === MIC_STATES.LISTENING ||
      micState === MIC_STATES.PROCESSING
    ) {
      return;
    }

    finalTranscriptRef.current = "";
    stoppingRef.current = false;

    if (native) {
      await startNativeRecognition();
    } else {
      startWebRecognition();
    }
  }, [micState, native, startNativeRecognition, startWebRecognition]);

  // ------------------------------------------------------------
  // STOP LISTENING ENTRY POINT
  // ------------------------------------------------------------
  const stopListening = useCallback(async () => {
    if (stoppingRef.current) {
      return;
    }

    if (native) {
      await stopNativeRecognition();
    } else {
      stoppingRef.current = true;
      cleanupWebRecognition();
      updateState(MIC_STATES.PROCESSING);
      onStatus?.("⚙ अनुवाद हो रहा है...");

      const text = finalTranscriptRef.current;
      if (text) {
        await finishWithText(text);
      } else {
        updateState(MIC_STATES.NO_SPEECH);
        onStatus?.("कोई शब्द पहचाना नहीं गया। कृपया दोबारा बोलें।");
        stoppingRef.current = false;
      }
    }
  }, [
    cleanupWebRecognition,
    finishWithText,
    native,
    onStatus,
    stopNativeRecognition,
    updateState,
  ]);

  // ------------------------------------------------------------
  // CLICK HANDLER
  // ------------------------------------------------------------
  const handleClick = useCallback(() => {
    if (!supported) {
      onStatus?.("इस डिवाइस पर Speech Recognition उपलब्ध नहीं है।");
      return;
    }

    if (micState === MIC_STATES.LISTENING) {
      stopListening();
      return;
    }

    // From any non-listening / error / idle state, clicking starts listening
    startListening();
  }, [micState, onStatus, startListening, stopListening, supported]);

  // ------------------------------------------------------------
  // UNMOUNT CLEANUP
  // ------------------------------------------------------------
  useEffect(() => {
    return () => {
      stoppingRef.current = true;
      cleanupWebRecognition();
      removeNativeListener().catch(() => {});
      finalTranscriptRef.current = "";
    };
  }, [cleanupWebRecognition, removeNativeListener]);

  const buttonLabel = MIC_LABELS[micState] || MIC_LABELS.IDLE;
  const isBusy = micState === MIC_STATES.PROCESSING;
  const isListening = micState === MIC_STATES.LISTENING;

  return (
    <button
      type="button"
      className={`btn btn-mic${isListening ? " btn-mic-active" : ""}${
        micState === MIC_STATES.PERMISSION_DENIED ? " btn-mic-denied" : ""
      }${
        micState === MIC_STATES.OFFLINE_MODEL_UNAVAILABLE ||
        micState === MIC_STATES.RECOGNITION_UNAVAILABLE
          ? " btn-mic-unavailable"
          : ""
      }`}
      onClick={handleClick}
      disabled={disabled || !supported || isBusy}
      aria-label="माइक्रोफ़ोन"
      aria-pressed={isListening}
      title={buttonLabel}
    >
      {buttonLabel}
    </button>
  );
}