import { useEffect, useRef, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { normalizeHindi } from "../translation/normalize.js";

/**
 * Hindi Speech Recognition
 *
 * Android:
 *   @capacitor-community/speech-recognition
 *
 * Browser development:
 *   Web Speech API
 *
 * Android WebView NEVER uses the Web Speech API.
 */

export const MIC_STATES = {
  READY: "READY",
  REQUESTING_PERMISSION: "REQUESTING_PERMISSION",
  LISTENING: "LISTENING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  PERMISSION_DENIED: "PERMISSION_DENIED",
};

export const MIC_LABELS = {
  READY: "🎤 बोलें",
  REQUESTING_PERMISSION: "🎤 माइक्रोफोन की अनुमति चाहिए...",
  LISTENING: "🔴 सुन रहा हूँ...",
  PROCESSING: "⚙ अनुवाद हो रहा है...",
  SUCCESS: "✓ अनुवाद तैयार है",
  ERROR: "⚠ आवाज़ समझ नहीं आई",
  PERMISSION_DENIED: "🎤 पुनः अनुमति दें",
};

function isNativeAndroid() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function isDeviceOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function mapSpeechErrorToHindi(error) {
  const rawMsg =
    typeof error === "string"
      ? error
      : error?.message || error?.code || JSON.stringify(error) || "";
  const code = String(rawMsg).toLowerCase();

  console.warn(
    "[SpeechRecognition] Error signature:",
    rawMsg,
    "| code:",
    code,
    "| navigator.onLine:",
    typeof navigator !== "undefined" ? navigator.onLine : "unknown"
  );

  // 1. Microphone permission denied
  if (
    code.includes("permission") ||
    code.includes("notallowed") ||
    code.includes("denied")
  ) {
    return "माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया सेटिंग्स में जाकर रिकॉर्ड ऑडियो की अनुमति दें।";
  }

  // 2. Offline recognition failure:
  // On devices without an offline Hindi speech recognition pack (e.g. Samsung Galaxy A17 5G),
  // recognition fails immediately when Wi-Fi/mobile data is turned off.
  const offline = isDeviceOffline();
  const isNetworkFailure =
    code.includes("network") ||
    code.includes("server") ||
    code.includes("service") ||
    code.includes("client");

  if (offline || (isNetworkFailure && offline)) {
    return "इस डिवाइस पर ऑफ़लाइन आवाज़ पहचान उपलब्ध नहीं है। कृपया इंटरनेट ऑन करें या नीचे टाइप करें।";
  }

  // 3. Normal recognition failures when Wi-Fi / internet is active:
  // (Do NOT show the offline message here - retain normal feedback)
  if (
    code.includes("nomatch") ||
    code.includes("no-match") ||
    code.includes("no match")
  ) {
    return "कोई शब्द पहचाना नहीं गया। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।";
  }

  if (code.includes("timeout") || code.includes("speech")) {
    return "समय समाप्त (टाइमआउट)। आवाज़ रिकॉर्ड नहीं हुई, कृपया दोबारा बोलें।";
  }

  if (
    code.includes("audio") ||
    code.includes("capture") ||
    code.includes("microphone")
  ) {
    return "माइक्रोफ़ोन से आवाज़ रिकॉर्ड करने में समस्या आई।";
  }

  if (code.includes("busy")) {
    return "आवाज़ सेवा व्यस्त है। कृपया एक क्षण रुककर दोबारा बोलें।";
  }

  if (
    code.includes("unavailable") ||
    code.includes("recognizer") ||
    code.includes("recognition")
  ) {
    return "इस डिवाइस पर Speech Recognition सेवा उपलब्ध नहीं है। Google ऐप इंस्टॉल या अपडेट करें।";
  }

  // If Wi-Fi is on but the speech server itself was unreachable
  if (isNetworkFailure && !offline) {
    return "इस डिवाइस पर ऑफ़लाइन आवाज़ पहचान उपलब्ध नहीं है। कृपया इंटरनेट ऑन करें या नीचे टाइप करें।";
  }

  // Generic fallback for any other failure while Wi-Fi is active
  return "आवाज़ पहचानने में समस्या आई। कृपया दोबारा प्रयास करें।";
}

export default function MicButton({
  onResult,
  onStatus,
  onListeningStart,
  disabled = false,
  autoTranslate = true,
}) {
  const [micState, setMicState] = useState(MIC_STATES.READY);
  const [supported, setSupported] = useState(true);

  const nativeListenerRef = useRef(null);
  const webRecognitionRef = useRef(null);
  const stoppingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const native = isNativeAndroid();

  // ------------------------------------------------------------
  // SUPPORT CHECK
  // ------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function checkSupport() {
      if (native) {
        try {
          const available = await SpeechRecognition.available();

          if (mounted) {
            setSupported(Boolean(available?.available));
          }

          console.log(
            "[SpeechRecognition] Native availability:",
            available
          );
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
        (window.SpeechRecognition ||
          window.webkitSpeechRecognition);

      const browserSupported = Boolean(WebSpeech);

      if (mounted) {
        setSupported(browserSupported);
      }

      if (!browserSupported) {
        console.warn(
          "[SpeechRecognition] Web Speech API is not available."
        );
      }
    }

    checkSupport();

    return () => {
      mounted = false;
    };
  }, [native]);

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
      console.warn(
        "[SpeechRecognition] Listener cleanup warning:",
        error
      );
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
      console.warn(
        "[SpeechRecognition] Browser recognition cleanup warning:",
        error
      );
    }

    webRecognitionRef.current = null;
  }, []);

  // ------------------------------------------------------------
  // CLEANUP EVERYTHING
  // ------------------------------------------------------------
  const cleanupRecognition = useCallback(async () => {
    cleanupWebRecognition();
    await removeNativeListener();
  }, [cleanupWebRecognition, removeNativeListener]);

  // ------------------------------------------------------------
  // FINAL RESULT HANDLER
  // ------------------------------------------------------------
  const finishWithText = useCallback(
    async (rawText) => {
      if (stoppingRef.current) {
        return;
      }

      stoppingRef.current = true;

      setMicState(MIC_STATES.PROCESSING);
      onStatus?.("⚙ अनुवाद हो रहा है...");

      const normalized = normalizeHindi(String(rawText || "").trim());

      console.log(
        "[SpeechRecognition] Final Hindi transcript:",
        normalized
      );

      await cleanupRecognition();

      if (normalized) {
        setMicState(MIC_STATES.SUCCESS);
        onResult?.(normalized);

        if (!autoTranslate) {
          onStatus?.("✓ अनुवाद तैयार है");
        }
      } else {
        setMicState(MIC_STATES.ERROR);
        onStatus?.(
          "कोई शब्द पहचाना नहीं गया। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।"
        );
      }

      finalTranscriptRef.current = "";
      stoppingRef.current = false;
    },
    [autoTranslate, cleanupRecognition, onResult, onStatus]
  );

  // ------------------------------------------------------------
  // NATIVE ANDROID SPEECH RECOGNITION
  // ------------------------------------------------------------
  const startNativeRecognition = useCallback(async () => {
    try {
      setMicState(MIC_STATES.REQUESTING_PERMISSION);
      onStatus?.("🎤 माइक्रोफोन की अनुमति चाहिए...");

      let permissions = await SpeechRecognition.checkPermissions();

      console.log(
        "[SpeechRecognition] Permission status:",
        permissions
      );

      if (permissions?.speechRecognition !== "granted") {
        permissions = await SpeechRecognition.requestPermissions();

        console.log(
          "[SpeechRecognition] Permission request result:",
          permissions
        );
      }

      if (permissions?.speechRecognition !== "granted") {
        setMicState(MIC_STATES.PERMISSION_DENIED);

        onStatus?.(
          "माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया सेटिंग्स में जाकर रिकॉर्ड ऑडियो की अनुमति दें।"
        );

        return;
      }

      await removeNativeListener();

      nativeListenerRef.current = await SpeechRecognition.addListener(
        "listeningState",
        (data) => {
          console.log(
            "[SpeechRecognition] listeningState:",
            data
          );

          if (data?.status === "started") {
            setMicState(MIC_STATES.LISTENING);
            onListeningStart?.();
            onStatus?.("🔴 सुन रहा हूँ...");
          }

          if (data?.status === "stopped") {
            console.log(
              "[SpeechRecognition] Native listening stopped."
            );
          }
        }
      );

      setMicState(MIC_STATES.LISTENING);
      onListeningStart?.();
      onStatus?.("🔴 सुन रहा हूँ...");

      console.log(
        "[SpeechRecognition] Starting native Hindi recognition..."
      );

      const result = await SpeechRecognition.start({
        language: "hi-IN",
        maxResults: 5,
        prompt: "हिंदी में बोलें...",
        popup: false,
        partialResults: false,
      });

      console.log(
        "[SpeechRecognition] Native result:",
        result
      );

      let text = "";

      if (Array.isArray(result?.matches) && result.matches.length > 0) {
        text = result.matches[0];
      } else if (typeof result?.text === "string") {
        text = result.text;
      } else if (typeof result?.result === "string") {
        text = result.result;
      }

      if (!text) {
        setMicState(MIC_STATES.ERROR);
        onStatus?.(
          "कोई शब्द पहचाना नहीं गया। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।"
        );

        await removeNativeListener();

        return;
      }

      finalTranscriptRef.current = text;

      await finishWithText(text);
    } catch (error) {
      console.error(
        "[SpeechRecognition] Native recognition failed:",
        error
      );

      const message = mapSpeechErrorToHindi(error);

      setMicState(MIC_STATES.ERROR);
      onStatus?.(message);

      await cleanupRecognition();

      stoppingRef.current = false;
    }
  }, [
    cleanupRecognition,
    finishWithText,
    onListeningStart,
    onStatus,
    removeNativeListener,
  ]);

  // ------------------------------------------------------------
  // STOP NATIVE RECOGNITION
  // ------------------------------------------------------------
  const stopNativeRecognition = useCallback(async () => {
    if (stoppingRef.current) {
      return;
    }

    stoppingRef.current = true;

    console.log(
      "[SpeechRecognition] Stopping native recognition..."
    );

    try {
      await SpeechRecognition.stop();
    } catch (error) {
      console.warn(
        "[SpeechRecognition] Native stop warning:",
        error
      );
    }

    await removeNativeListener();

    stoppingRef.current = false;
  }, [removeNativeListener]);

  // ------------------------------------------------------------
  // WEB SPEECH API FALLBACK
  // ------------------------------------------------------------
  const startWebRecognition = useCallback(() => {
    const WebSpeech =
      typeof window !== "undefined" &&
      (window.SpeechRecognition ||
        window.webkitSpeechRecognition);

    if (!WebSpeech) {
      setSupported(false);
      setMicState(MIC_STATES.ERROR);
      onStatus?.(
        "इस ब्राउज़र में Hindi Speech Recognition उपलब्ध नहीं है।"
      );
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
        console.log(
          "[SpeechRecognition] Browser recognition started."
        );

        setMicState(MIC_STATES.LISTENING);
        onListeningStart?.();
        onStatus?.("🔴 सुन रहा हूँ...");
      };

      recognition.onresult = (event) => {
        let text = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i += 1
        ) {
          const result = event.results[i];

          if (result?.isFinal && result[0]?.transcript) {
            text += result[0].transcript;
          }
        }

        text = text.trim();

        console.log(
          "[SpeechRecognition] Browser final result:",
          text
        );

        if (text) {
          finishWithText(text);
        }
      };

      recognition.onerror = (event) => {
        console.error(
          "[SpeechRecognition] Browser error:",
          event
        );

        const message = mapSpeechErrorToHindi(event?.error);

        setMicState(MIC_STATES.ERROR);
        onStatus?.(message);

        cleanupWebRecognition();

        stoppingRef.current = false;
      };

      recognition.onend = () => {
        console.log(
          "[SpeechRecognition] Browser recognition ended."
        );

        if (
          !stoppingRef.current &&
          webRecognitionRef.current === recognition &&
          micState === MIC_STATES.LISTENING
        ) {
          setMicState(MIC_STATES.ERROR);
          onStatus?.(
            "कोई शब्द पहचाना नहीं गया। कृपया दोबारा बोलें।"
          );
        }

        webRecognitionRef.current = null;
      };

      setMicState(MIC_STATES.REQUESTING_PERMISSION);
      onStatus?.("🎤 माइक्रोफोन की अनुमति चाहिए...");

      recognition.start();
    } catch (error) {
      console.error(
        "[SpeechRecognition] Browser start failed:",
        error
      );

      setMicState(MIC_STATES.ERROR);
      onStatus?.(mapSpeechErrorToHindi(error));

      cleanupWebRecognition();
      stoppingRef.current = false;
    }
  }, [
    cleanupWebRecognition,
    finishWithText,
    micState,
    onListeningStart,
    onStatus,
  ]);

  // ------------------------------------------------------------
  // START LISTENING
  // ------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (
      micState === MIC_STATES.LISTENING ||
      micState === MIC_STATES.PROCESSING ||
      micState === MIC_STATES.REQUESTING_PERMISSION
    ) {
      return;
    }

    finalTranscriptRef.current = "";
    stoppingRef.current = false;

    setMicState(MIC_STATES.REQUESTING_PERMISSION);

    if (native) {
      await startNativeRecognition();
    } else {
      startWebRecognition();
    }
  }, [
    micState,
    native,
    startNativeRecognition,
    startWebRecognition,
  ]);

  // ------------------------------------------------------------
  // STOP LISTENING
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

      setMicState(MIC_STATES.PROCESSING);
      onStatus?.("⚙ अनुवाद हो रहा है...");

      const text = finalTranscriptRef.current;

      if (text) {
        await finishWithText(text);
      } else {
        setMicState(MIC_STATES.ERROR);
        onStatus?.(
          "कोई शब्द पहचाना नहीं गया। कृपया थोड़ा स्पष्ट और माइक के पास बोलें।"
        );

        stoppingRef.current = false;
      }
    }
  }, [
    cleanupWebRecognition,
    finishWithText,
    native,
    onStatus,
    stopNativeRecognition,
  ]);

  // ------------------------------------------------------------
  // CLICK HANDLER
  // ------------------------------------------------------------
  const handleClick = useCallback(() => {
    if (!supported) {
      onStatus?.(
        "इस डिवाइस पर Speech Recognition उपलब्ध नहीं है।"
      );
      return;
    }

    if (micState === MIC_STATES.LISTENING) {
      stopListening();
      return;
    }

    if (
      micState === MIC_STATES.READY ||
      micState === MIC_STATES.SUCCESS ||
      micState === MIC_STATES.ERROR ||
      micState === MIC_STATES.PERMISSION_DENIED
    ) {
      startListening();
    }
  }, [
    micState,
    onStatus,
    startListening,
    stopListening,
    supported,
  ]);

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

  const buttonLabel =
    MIC_LABELS[micState] || MIC_LABELS.READY;

  const isBusy =
    micState === MIC_STATES.REQUESTING_PERMISSION ||
    micState === MIC_STATES.PROCESSING;

  const isListening =
    micState === MIC_STATES.LISTENING;

  return (
    <button
      type="button"
      className={`btn btn-mic${
        isListening ? " btn-mic-active" : ""
      }${
        micState === MIC_STATES.PERMISSION_DENIED
          ? " btn-mic-denied"
          : ""
      }`}
      onClick={handleClick}
      disabled={disabled || !supported || isBusy}
      aria-label="माइक्रोफ़ोन"
      aria-pressed={isListening}
    >
      {buttonLabel}
    </button>
  );
}