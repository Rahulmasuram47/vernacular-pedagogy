# Vernacular Voice — Hindi → Santali Offline Translation Tool

**SIH Problem Statement:** SIH26042 / 042 — AI-Powered Vernacular Pedagogy and Real-Time Translation Tool for Mother Tongue-Based Primary Education
**Theme:** Education / EdTech · **Category:** Software
**Organization:** Government of Jharkhand
**Team:** Team Bytes

## What it does

An offline-first Android app that helps primary-school teachers translate Hindi classroom content into Santali (Ol Chiki script) in real time, and auto-generates bilingual worksheets and flashcards for mother-tongue-based learning — aligned with NEP 2020 and NIPUN Bharat.

## Features

| Feature | Status |
|---|---|
| Hindi → Santali translation (dictionary-based, Ol Chiki script) | ✅ Fully offline, verified on-device |
| Bilingual worksheet generation (by category) | ✅ Fully offline, verified on-device |
| Interactive flashcards with flip-to-reveal practice | ✅ Fully offline, verified on-device |
| PDF export & native share of worksheets | ✅ Fully offline, verified on-device |
| Hindi text-to-speech (audio pronunciation) | ✅ Offline where device has Hindi voice pack installed |
| Voice input (speech-to-text) | 🔧 In progress — reliable with internet; fully offline on-device recognition being finalized |
| Translation history & saved worksheets | ✅ Local storage, fully offline |

## Tech Stack

- **Frontend:** React 18 + Vite, packaged as a native Android app via Capacitor
- **Translation engine:** Local JSON dictionary (Hindi ↔ Santali) with rule-based grammar handling (singular/plural imperatives), zero network calls
- **PDF export:** `html2canvas` + `jsPDF`, saved via `@capacitor/filesystem` and shared via `@capacitor/share`
- **Text-to-speech:** `@capacitor-community/text-to-speech` (native Android TTS, with browser fallback)
- **Storage:** Browser `localStorage` for history and saved worksheets
- **Font:** Noto Sans Ol Chiki (bundled locally for Santali script rendering)

## Project Structure

```
vernacular pedagogy/
  frontend/
    src/
      App.jsx                 Main UI, state, and handlers
      api.js                  Local translation/worksheet calls
      translation/            Translation engine + normalization
      worksheet.js             Worksheet generation
      data/santali_dictionary.json   Hindi-Santali dictionary
      components/
        MicButton.jsx          Voice input
        Flashcards.jsx          Flashcard practice module
    android/                  Capacitor-generated native Android project
  docs/                       Audit reports, test checklists, dev notes
  backend/                    Optional FastAPI service (not required — app runs fully standalone)
```

## Running Locally

```bash
cd frontend
npm install
npm run dev        # local dev server at http://localhost:5173
```

## Building the Android APK

```bash
cd frontend
npm run build
npx cap sync android
cd android
.\gradlew.bat clean assembleDebug --no-daemon
```

The debug APK is generated at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## Offline Behavior

Translation, worksheet generation, flashcards, and PDF export work with zero internet connection, verified in Airplane Mode on a physical device. Voice input currently requires either an internet connection or a device with an offline Hindi speech recognition model installed by the manufacturer; a fully on-device speech pipeline is in active development.

## Roadmap

- Finalize fully offline speech-to-text across all device types
- Expand the Hindi-Santali dictionary beyond the current curated set
- Explore neural machine translation (e.g. IndicTrans2) for open-vocabulary sentences
- Record native-speaker Santali audio for text-to-speech output
- Extend architecture to additional tribal languages