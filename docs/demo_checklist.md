# SIH 042 — Final Demo Checklist

Run through this exact sequence before presenting to judges, and again
live during the demo if time allows.

## Pre-Demo Setup (do this 10 minutes before your slot)

1. Close all old terminals to avoid port conflicts.
2. Open exactly 2 terminals:
   - Terminal A: backend
   - Terminal B: frontend
3. Start backend:cd backend
uvicorn main:app --reload
4. Start frontend (dev mode is fine for live demo; use preview mode only
   if you want to show the PWA/offline story):cd frontend
npm run dev
5. Open the app in a clean browser tab. Hard-refresh once.
6. Confirm "Offline Ready" badge is visible.

## Live Demo Script (matches PS Success Criteria exactly)

1. **Open the application** — already done in setup above.
2. **Select the supported tribal language** — point at "भाषा: संताली
   (ओल चिकी)" label. Explain: per problem statement instructions, one
   language was prioritized and made reliable rather than spreading
   effort across many.
3. **Enter or speak a Hindi sentence** — demo BOTH:
   - Type "बैठ जाओ" and click अनुवाद करें
   - Then click 🎤 माइक and speak a different phrase, e.g. "किताब खोलो"
4. **Receive the translation quickly** — point at the on-screen timing
   in the status message (e.g. "(12 ms)"). Say out loud: "well under
   the 3-second requirement."
5. **See Hindi and Santali together** — point at both panes in परिणाम.
6. **Generate a bilingual worksheet** — pick a topic (e.g. कक्षा के
   निर्देश), click कार्यपत्रक बनाएँ. Show the table.
   - Optionally click प्रिंट करें to show the clean printable layout.
7. **Turn off internet connectivity** — actually disable WiFi in front
   of judges, or airplane mode if on a laptop.
8. **Repeat the core workflow offline** — translate a new phrase, then
   generate another worksheet. Both must work with WiFi visibly off.

## Talking Points (be upfront, this builds credibility)

- Translation engine is a curated offline dictionary + rule-based
  lookup, not a trained neural model — deliberate choice given Santali
  has no public parallel corpus and the PS explicitly disallows paid
  APIs/heavy cloud dependencies.
- Voice input uses the browser's built-in Web Speech API. State clearly
  whether it worked offline on your test device or not — if it needed
  connectivity once for language pack download, say so honestly, and
  point out typed Hindi input is the guaranteed 100% offline fallback.
- Frontend is packaged as an installable PWA (Progressive Web App) —
  works on Android tablets via "Add to Home Screen," no native Android
  build/signing pipeline needed for this prototype stage.
- Architecture is modular: adding a second tribal language later means
  adding entries to a new dictionary JSON file, not rewriting the
  pipeline — directly addresses the PS's "keep architecture modular"
  requirement.
- Current dictionary covers ~[fill in count] Hindi-Santali entries
  across numbers, days, greetings, classroom phrases, and common nouns.
  Roadmap: expand dictionary coverage, add pre-recorded native-speaker
  audio for TTS, explore on-device quantized NMT once training data
  exists.

## If Something Breaks Live

- If backend disconnects: check Terminal A is still running, don't
  panic — restart with the same `uvicorn main:app --reload` command.
- If a word isn't in the dictionary: this is expected and honest — the
  UI shows `[?]` markers for unknown words. Say: "the dictionary is
  intentionally curated and expandable; unknown words are flagged
  rather than silently guessed, which is safer for classroom use."
- Never apologize excessively — a smaller, reliable, working demo is
  literally what the PS itself asks for over an unfinished large system.