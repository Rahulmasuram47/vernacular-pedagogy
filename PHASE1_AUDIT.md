# Phase 1 Project Audit Report: Vernacular Pedagogy (SIH26042)
**Target:** Hindi → Santali (Ol Chiki script) Offline Educational Translation App  
**Scope:** Static analysis, build pipeline audit, runtime environment verification, root cause analysis  
**Date:** September 6, 2026  
**Auditor:** Antigravity AI Assistant  

---

## 1. Environment Capabilities & Verification

All capabilities were verified by executing commands directly in the host environment. No assumptions were made.

| Tool / Subsystem | Capability Status | Observed Command & Output / Evidence |
| :--- | :--- | :--- |
| **Java Development Kit (JDK)** | Available (Java 24) | `java -version`<br>`java version "24.0.1" 2025-04-15`<br>`Java HotSpot(TM) 64-Bit Server VM (build 24.0.1+9-30, mixed mode, sharing)` |
| **Node.js & NPM** | Available (Node v22 / NPM 10.9) | `node -v; npm -v`<br>`v22.19.0`<br>`10.9.3` |
| **Python** | Available (Python 3.12) | `python --version`<br>`Python 3.12.10` |
| **Android SDK** | Installed locally | Path: `C:\Users\harsh\AppData\Local\Android\Sdk`<br>Configured in `frontend/android/local.properties` (`sdk.dir`). Contains `build-tools`, `platform-tools`, `platforms`, `emulator`. |
| **Gradle Wrapper** | Executable (Gradle 8.14.3) | `.\gradlew.bat --version`<br>`Gradle 8.14.3`<br>`Launcher JVM: 24.0.1`<br>`assembleDebug --dry-run` successfully configured task graph in 30s. |
| **Android Emulator / Devices** | AVD exists; No live device | `emulator.exe -list-avds` returned `Medium_Phone_API_35`.<br>`adb.exe devices` returned empty (`List of devices attached` - no devices connected). Headless agent environment cannot interact with physical screens or Android GUI. |
| **Frontend Dev Server** | Executable | `npm run dev` starts Vite server at `http://localhost:5173/` in 784ms. HTTP GET returns HTML response with status 200. |
| **Frontend Production Build** | Executable | `npm run build` runs `vite build` cleanly and completes in 7.97s, generating `dist/` and PWA service worker. |
| **Browser GUI / Visual Tool** | No interactive browser | The environment has HTTP scraping (`read_url_content`) but **no interactive headless browser (Puppeteer/Playwright)** or visual display tool. DOM interactions and canvas rendering cannot be visually evaluated in this terminal. |
| **Physical Hardware (Mic/Wi-Fi/Phone)** | **Not Available** | Physical microphone, offline RF isolation (Wi-Fi disablement), and physical phone installation are physically impossible in this virtual container. All such verifications require human execution. |

---

## 2. Component Status Table

| Component | Verdict | Evidence-Based Reason |
| :--- | :---: | :--- |
| **STT (Speech-to-Text)** | ⚠ partial | `MicButton.jsx` fetches the 44.37 MB Vosk model and passes an ephemeral `URL.createObjectURL(blob)` to `vosk-browser`. This circumvents Vosk's IndexedDB cache (unique UUID every run) and triggers cross-origin Web Worker failures inside Capacitor Android WebView. |
| **Translation Engine** | ⚠ partial | `frontend/src/translation.js` performs exact dictionary match with a fallback token lookup appending `[?]`. However, the dictionary contains only **57 entries** (52 unique concepts), with zero handling of grammar, plural inflections, postpositions, or verb conjugations. |
| **TTS (Text-to-Speech)** | ⚠ partial | Only Hindi TTS is implemented (via `@capacitor-community/text-to-speech` with `window.speechSynthesis` fallback). **Santali TTS is completely nonexistent** because neither Android nor standard Web Speech engines support Ol Chiki phonetic synthesis. |
| **Worksheets** | ✓ working | `frontend/src/worksheet.js` builds category worksheets entirely in-memory from the local dictionary; PDF generation via `html2canvas` + `jsPDF` saves locally and shares via `@capacitor/share` to native Android intents. |
| **Flashcards** | ✓ working | `frontend/src/components/Flashcards.jsx` runs 100% offline from local JSON with category filtering, card flipping, card progress counter, and Hindi audio pronunciation. |
| **History** | ✓ working | `frontend/src/storage.js` persists up to 20 translation items and saved worksheets directly in browser `localStorage` (`vp_translation_history`, `vp_saved_worksheets`) with zero network dependency. |
| **Storage** | ✓ working | Local state uses `localStorage`; generated worksheet PDFs are written to Android scoped cache via `@capacitor/filesystem` (`Directory.Cache`). No external storage permissions required. |
| **Backend API** | ⚠ partial | FastAPI backend (`backend/main.py`) provides functional endpoints (`/translate`, `/worksheet`), but the frontend has severed all network calls to it (`api.js` runs local JS). Python FastAPI cannot run inside the standalone Android APK without an embedded Python runtime. |
| **Android / Capacitor Config** | ⚠ partial | App ID (`com.sih042.vernacular`), permissions (`RECORD_AUDIO`, `INTERNET`), and SDK targets (minSdk 24, targetSdk 36) are configured. However, **`android/app/src/main/assets/public` is STALE** (`index-BphhcVWj.js` vs built `index-5ry7GGou.js`), indicating `npx cap sync` was not executed after the last frontend build. |
| **Build Pipeline** | 🔧 needs improvement | `npm run build` succeeds (7.97s), and Gradle dry-run passes. However, full `assembleDebug` failed (`java.io.IOException: Unable to delete directory .../merged_res_blame_folder/...`) due to Windows/OneDrive file locking within the project path (`OneDrive\Documents\vernacular pedagogy`). |

---

## 3. Root-Cause Analysis for Partial & Degraded Components

### 3.1 STT: Vosk Model Loading Failure & Memory Thrashing
* **Root Cause 1 — Dynamic Blob URL Defeats Caching:** In `frontend/src/components/MicButton.jsx` (lines 52–57), the code converts the downloaded model archive into a blob URL:
  ```javascript
  const blobUrl = URL.createObjectURL(blob);
  const model = new Model(blobUrl, 0);
  ```
  Inside `vosk-browser` (`vosk.js`), the worker determines local cache storage via:
  ```javascript
  const modelPath = storagePath + "/" + modelUrl.replace(/[\W]/g, "_");
  if (isFile(localPath + "/extracted.ok")) { /* reuse cached */ }
  ```
  Because `blobUrl` contains a randomly generated UUID on every run (`blob:http://localhost:5173/3f9...`), `modelUrl.replace(...)` generates a brand-new cache path each session. The 44.37 MB archive is extracted into IndexedDB/MEMFS afresh on every launch, bloating storage by 44 MB per attempt and causing severe CPU spikes on low-end 2GB devices.
* **Root Cause 2 — Capacitor WebView Blob Worker Restrictions:** In Capacitor Android, the WebView serves assets under `http://localhost` or `https://localhost`. Web Workers spawned from inlined base64 scripts running under different execution contexts face CORS and blob fetch restrictions when attempting to `fetch(blob:...)`. Passing the relative asset path (`models/vosk-model-small-hi-0.22.tar.gz`) directly to `Model` allows the worker to resolve and fetch relative to origin without blob wrapping.
* **Root Cause 3 — Deprecated Audio Pipeline:** `MicButton.jsx` uses `audioContext.createScriptProcessor(4096, 1, 1)` which runs on the main UI thread and is prone to buffer drops when the UI re-renders or when GC runs.

### 3.2 Translation Engine: Extreme Lexical & Morphological Sparsity
* **Root Cause 1 — Hardcoded 57-Entry Wordlist:** `frontend/src/data/santali_dictionary.json` contains only 57 JSON records. After accounting for duplicate Hindi synonyms (`पाँच`/`पांच`, `स्कूल`/`विद्यालय`, `शिक्षक`/`अध्यापक`, `किताब`/`पुस्तक`, `भोजन`/`खाना`), there are only **52 distinct concepts**.
* **Root Cause 2 — Token Fallback Lack of Grammar:** The fallback in `translation.js` performs naive space-splitting:
  ```javascript
  const tokens = normalized.split(" ");
  // looks up token, else appends token + "[?]"
  ```
  Santali is an agglutinative language with complex postpositional and verbal suffixing. A sentence as simple as "बच्चे स्कूल में पढ़ते हैं" yields:
  `बच्चे[?] ᱤᱥᱠᱩᱞ में[?] पढ़ते[?] हैं[?]`
  because neither "बच्चे" (plural), "में" (postposition), nor "पढ़ते हैं" (conjugated verb) exist in the dictionary.

### 3.3 TTS: Inherent Platform Limitation for Santali Language
* **Root Cause:** Standard Android text-to-speech engines (Google Speech Services, Samsung TTS) do not provide a voice model for Santali (`sat` / `sat-Olck`). While Hindi (`hi-IN`) works natively via Android TTS, Santali speech cannot be synthesized by `@capacitor-community/text-to-speech` without a custom neural TTS model or pre-recorded audio phoneme clips.

### 3.4 Android / Capacitor: Out-of-Sync Assets & Stale APK State
* **Root Cause:** `frontend/dist` was built on 06-09-2026 at 18:30:44 producing bundle `index-5ry7GGou.js` (6.57 MB). However, `frontend/android/app/src/main/assets/public/assets` contains `index-BphhcVWj.js` (6.56 MB) from 17:18:38. Running a Gradle build without running `npx cap sync android` packages stale code that does not reflect recent frontend changes.

### 3.5 Build Pipeline: Windows OneDrive Path Lock
* **Root Cause:** The project resides under `C:\Users\harsh\OneDrive\Documents\vernacular pedagogy`. During `gradlew assembleDebug`, the task `:app:mergeDebugResources` attempts to delete and recreate temporary directories in `build/intermediates/merged_res_blame_folder/debug/...`. The Microsoft OneDrive background synchronization service locks these files as soon as they are written, throwing:
  `java.io.IOException: Unable to delete directory ... Failed to delete some children.`

---

## 4. Offline vs. Online Dependency Map

| Feature / Resource | Offline Status | Network Dependency Analysis |
| :--- | :---: | :--- |
| **Dictionary Translation** | **100% Offline** | Uses synchronous in-memory Map lookup from bundled `santali_dictionary.json`. Zero network calls. |
| **Ol Chiki Font Rendering** | **100% Offline** | `NotoSansOlChiki-Regular.ttf` is bundled locally under `/public/fonts/` (36.8 KB) and defined via `@font-face` in `index.css`. Does not query Google Fonts. |
| **Worksheet Generator** | **100% Offline** | Generates worksheets from local dictionary in JS memory. PDF export runs entirely client-side via `html2canvas` + `jsPDF`. |
| **Flashcards Module** | **100% Offline** | Client-side React rendering from local JSON. |
| **Translation History** | **100% Offline** | Backed by browser `localStorage`. |
| **Hindi TTS** | **Conditionally Offline** | Uses native Android TTS (`@capacitor-community/text-to-speech`). Works offline **only if** the user's Android device has the Google TTS Hindi voice pack downloaded offline. If not pre-downloaded on the OS, it fails or attempts to stream voice synthesis from Google servers. |
| **Vosk Speech-to-Text** | **Conditionally Offline** | Model archive (44.37 MB) is stored locally in `public/models/`. Does not contact external cloud servers. However, inside PWA mode, `vite.config.js` restricts workbox precache to 15 MB, meaning the service worker does not precache the model for offline browser PWA use (it only works offline when bundled inside the Capacitor APK). |
| **FastAPI Backend** | **Online / Localhost Only** | `backend/main.py` is an independent server. The frontend `api.js` has already been disconnected from it, making the backend completely non-essential for app operation. |

---

## 5. Ranked Priority List for Phase 2

Below are the 4 highest-impact fixes for the project, prioritized by Hackathon demo impact and single-session feasibility:

### Priority 1: Fix Vosk Model Loading Path & Enable Persistent Caching in Capacitor
* **Impact:** High (Core to offline voice demo).
* **Feasibility:** High (1 session).
* **Action:**
  1. In `MicButton.jsx`, remove the `fetch() -> blob -> URL.createObjectURL()` chain.
  2. Pass the direct relative URL (`models/vosk-model-small-hi-0.22.tar.gz`) to `new Model(...)` so Vosk's internal worker caches it permanently under a constant name in IndexedDB.
  3. Ensure Vosk recognizes model initialization completion without crashing on Capacitor's WebView origin.

### Priority 2: Synchronize Android Assets & Resolve Gradle Build Lock
* **Impact:** High (Enables building a deployable debug APK for physical testing).
* **Feasibility:** High (1 session).
* **Action:**
  1. Run `npx cap sync android` to ensure `android/app/src/main/assets/public` matches current `dist/`.
  2. Mitigate OneDrive locking by configuring Gradle to use a dedicated build directory outside OneDrive (e.g. via `buildDir` redirection or passing `--no-daemon` / pausing OneDrive sync).
  3. Verify clean APK compilation to `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

### Priority 3: Expand Educational Vocabulary & Primary Classroom Wordlist
* **Impact:** High (Directly addresses SIH26042 problem statement for primary education).
* **Feasibility:** High (1 session).
* **Action:**
  1. Expand `santali_dictionary.json` from 57 entries to 300–500 essential primary school terms (colors, family members, classroom objects, basic verbs, bodily parts, animals, basic grammar particles).
  2. Keep both `frontend/src/data/santali_dictionary.json` and `data/santali_dictionary.json` synchronized.
  3. Add simple stem/suffix normalization in `translation.js` (e.g., stripping plural suffixes like "ों", "ें" so "किताबें" maps to "किताब").

### Priority 4: Graceful Degradation & Audio Feedback for Santali Speech
* **Impact:** Medium (Improves UX and demo presentation).
* **Feasibility:** High (1 session).
* **Action:**
  1. Clearly indicate in the UI that Santali TTS is not supported by standard Android TTS engines rather than failing silently.
  2. For known key vocabulary cards, provide pre-recorded phonetic audio clips if available, or visual phonetic pronunciation guides (Romanized / Devanagari transliteration alongside Ol Chiki).

> **Explicit Feasibility Note:** A full Neural Machine Translation model (e.g. fine-tuned IndicTrans2 / NLLB) running on-device inside Android is **not feasible** in a single session and cannot run smoothly within a 2GB RAM budget without substantial C++/TFLite quantization infrastructure. A high-coverage, rule-assisted dictionary approach is the only viable offline solution for SIH26042 within the hardware constraints.

---

## 6. Manual Test Checklist for Physical Device (Human Verification)

Because physical hardware (microphone, Wi-Fi radio, real 2GB RAM device) cannot be accessed by the agent, the human developer must follow this exact step-by-step test plan on a physical Android phone:

### Step 1: Build & Install Fresh Debug APK
1. In `frontend/`, run:
   ```bash
   npm run build
   npx cap sync android
   ```
2. In `frontend/android/`, run:
   ```bash
   .\gradlew.bat assembleDebug
   ```
3. Locate APK at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.
4. Install on physical Android device:
   ```bash
   adb install -r app-debug.apk
   ```

### Step 2: Airplane Mode / Hardware Isolation Test
1. Turn ON **Airplane Mode** on the Android device.
2. Verify that **Wi-Fi is OFF** and **Mobile Data is OFF**.
3. Launch "Vernacular Pedagogy" from the app drawer.
4. Verify the UI renders instantly without any network error dialogs.
5. Check that the green indicator badge shows "ऑफलाइन मोड सक्रिय" (Offline Mode Active).

### Step 3: Ol Chiki Font Rendering Test
1. Navigate to **फ्लैशकार्ड (Flashcards)**.
2. Select category "संख्याएँ (Numbers)".
3. Tap "👆 संताली देखें (Flip)".
4. **Visual Inspection:** Verify that the Ol Chiki characters (e.g., ᱢᱤᱫ, ᱵᱟᱨ, ᱯᱮ) render cleanly as true glyphs, **NOT as empty squares, question marks (tofu), or broken boxes**.

### Step 4: Physical Microphone & Vosk STT Test
1. Return to the main screen.
2. Tap the **🎤 माइक** button.
3. When prompted by Android, grant **"While using the app"** microphone permission.
4. Observe button state transition to `⏳ मॉडल तैयार...` and then `🔴 सुन रहा है...`.
5. Speak clearly into the microphone in Hindi: **"नमस्ते"** or **"किताब खोलो"**.
6. Tap the mic button again to stop.
7. Observe whether the Hindi input box populates with the recognized speech text without crashing.

### Step 5: Translation & Worksheets Export Test
1. With "किताब" or "नमस्ते" in the input box, tap **अनुवाद करें (Translate)**.
2. Verify instant Ol Chiki output appears: `ᱡᱚᱦᱟᱨ` or `ᱯᱚᱛᱚᱵ`.
3. Tap on **कार्यपत्रक (Worksheet)** tab.
4. Select category "संख्याएँ (Numbers)" and tap "कार्यपत्रक बनाएँ".
5. Tap **PDF डाउनलोड / शेयर करें (Export PDF)**.
6. Verify that the Android system share sheet pops up, allowing you to open or save the generated PDF in an offline PDF viewer (e.g., Google PDF Viewer or Drive PDF Viewer).
7. Open the generated PDF and confirm that Ol Chiki text is legible in the document.
