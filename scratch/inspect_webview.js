import http from "node:http";

async function main() {
  const json = await new Promise((resolve, reject) => {
    http.get("http://localhost:9222/json", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const page = json.find((t) => t.type === "page");
  if (!page) {
    console.error("No page target found");
    return;
  }

  console.log("Connecting to:", page.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onopen = async () => {
    console.log("Connected to DevTools protocol!");

    // Enable console & log
    await send("Console.enable");
    await send("Log.enable");
    await send("Runtime.enable");

    // Evaluate in WebView
    const evalResult = await send("Runtime.evaluate", {
      expression: `(async () => {
        const results = {};
        // 1. Check window.location
        results.location = window.location.href;
        results.origin = window.location.origin;

        // 2. Test fetch of vosk model
        const modelUrl = new URL("models/vosk-model-small-hi-0.22.tar.gz", window.location.href).href;
        results.modelUrl = modelUrl;
        try {
          const resp = await fetch(modelUrl);
          results.modelFetchStatus = resp.status;
          results.modelFetchOk = resp.ok;
          results.modelContentLength = resp.headers.get("content-length");
        } catch (e) {
          results.modelFetchError = e.message || String(e);
        }

        // 3. Test TextToSpeech / speechSynthesis for Santali
        results.hasSpeechSynthesis = "speechSynthesis" in window;
        if (window.speechSynthesis) {
          const voices = window.speechSynthesis.getVoices();
          results.voiceCount = voices.length;
          results.voices = voices.map(v => ({ name: v.name, lang: v.lang }));
        }

        // 4. Test Capacitor plugins
        results.hasCapacitor = !!window.Capacitor;
        if (window.Capacitor) {
          results.isNative = window.Capacitor.isNativePlatform ? window.Capacitor.isNativePlatform() : null;
          results.platform = window.Capacitor.getPlatform ? window.Capacitor.getPlatform() : null;
          results.plugins = Object.keys(window.Capacitor.Plugins || {});
        }

        return JSON.stringify(results, null, 2);
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    console.log("Evaluation result:\n", evalResult.result?.value);

    // Wait a bit to capture console events
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 2000);
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
    if (msg.method === "Console.messageAdded") {
      console.log("[Console.messageAdded]", msg.params.message.text);
    }
    if (msg.method === "Runtime.consoleAPICalled") {
      console.log("[Runtime.console]", msg.params.type, msg.params.args.map((a) => a.value ?? a.description).join(" "));
    }
    if (msg.method === "Log.entryAdded") {
      console.log("[Log.entryAdded]", msg.params.entry.text);
    }
  };
}

main().catch(console.error);
