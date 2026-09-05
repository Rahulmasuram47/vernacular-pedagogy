SIH 042 — AI-Powered Vernacular Pedagogy and Real-Time Translation Tool

SIH Problem Statement

AI-Powered Vernacular Pedagogy and Real-Time Translation Tool for Mother Tongue-Based Primary Education.

Government of Jharkhand.

Main Objective

Build a prototype that helps primary-school children and teachers use mother-tongue/tribal-language educational content through translation, voice interaction, and bilingual learning material.

Mandatory Prototype Demonstration

The prototype must demonstrate:

1. At least one tribal language.
2. Hindi → tribal-language translation.
3. Real-time voice translation with approximately 3-second response time.
4. Bilingual worksheet generation.
5. Offline operation suitable for a low-end Android tablet.

Primary User

Primary-school teacher and/or student.

Core User Flow

Teacher/student enters or speaks Hindi.

↓

Hindi speech is converted to text if voice input is used.

↓

Hindi text is translated into the selected tribal language.

↓

Translated text is displayed in both Hindi and the tribal language.

↓

The system can optionally provide translated speech/audio.

↓

Teacher can generate a bilingual worksheet.

↓

The worksheet can be viewed/used offline.

Prototype Scope

Prioritize ONE tribal language and make it reliable.

Do NOT implement multiple tribal languages unless the core prototype is already stable.

Functional Priorities

P0 — Must Work

- Hindi text input
- Tribal-language selection
- Hindi → tribal-language translation
- Bilingual output
- Voice input
- Fast translation pipeline
- Bilingual worksheet generation
- Offline/local operation
- Demo-friendly UI

P1 — Important

- Text-to-speech
- Translation history
- Basic lesson/topic selection
- Download/save worksheet
- Local storage
- Basic teacher/student workflow

P2 — Only If Time Allows

- Multiple tribal languages
- Advanced personalization
- Analytics
- Gamification
- Advanced pronunciation analysis
- Cloud synchronization
- Complex authentication

Technical Principles

- Prefer lightweight/local models where possible.
- The core demo must work without an internet connection.
- Avoid making the prototype dependent on paid APIs.
- Avoid unnecessary cloud services.
- Keep the architecture modular so additional tribal languages can be added later.
- Optimize for low-end Android hardware.
- Minimize model size and memory usage.
- Cache models/data locally.
- Keep response latency low.
- Do not introduce unnecessary dependencies.

Offline Requirement

The main demonstration flow must be capable of working offline:

Hindi input
→ translation
→ tribal-language output
→ worksheet generation

Internet should NOT be required for the core demonstration.

If any feature genuinely requires internet, clearly isolate it as an optional feature.

UI Requirements

The UI should be simple enough for a primary-school teacher.

Prioritize:

- Large buttons
- Clear Hindi labels
- Clear tribal-language output
- Minimal navigation
- Large readable text
- Simple microphone interaction
- Obvious translation result
- Simple worksheet generation

Do not add unnecessary animations or decorative UI.

Development Rules

IMPORTANT:

- Inspect the existing project before modifying anything.
- Do not rewrite working code unnecessarily.
- Do not delete existing functionality.
- Do not redesign the entire project unless explicitly requested.
- Modify only files required for the requested task.
- Reuse existing components and utilities.
- Keep the architecture simple.
- Prefer working prototype functionality over advanced features.
- Do not add paid APIs or services without explicit approval.
- Do not assume internet connectivity.
- Test changes locally before considering a task complete.

Development Strategy

Build in this order:

1. Project architecture
2. Translation engine
3. Offline translation
4. Voice input
5. Voice/text pipeline
6. Bilingual worksheet generation
7. Local storage
8. Frontend integration
9. Android packaging
10. Performance testing
11. Final demo

Success Criteria

The final prototype should allow a judge to perform this demonstration:

1. Open the application.
2. Select the supported tribal language.
3. Enter or speak a Hindi sentence.
4. Receive the tribal-language translation quickly.
5. See Hindi and tribal-language text together.
6. Generate a bilingual worksheet.
7. Turn off internet connectivity.
8. Repeat the core translation/worksheet workflow successfully.

Important

This is a hackathon prototype.

A smaller, reliable, demonstrable implementation is better than a large unfinished system.
PROJECT: SIH Problem Statement 042 — AI-Powered Vernacular Pedagogy and Real-Time
Translation Tool for Mother Tongue-Based Primary Education (Govt. of Jharkhand)

GOAL: A working prototype for Hindi → Santali (Ol Chiki script) translation for
primary-school teachers/students, with voice input, bilingual worksheet generation,
and full offline operation on a low-end Android tablet.

TRIBAL LANGUAGE: Santali only. Do not implement any other tribal language.

HARD CONSTRAINTS (never violate these without asking me first):
- NO paid APIs. NO API keys requiring billing. NO cloud translation services
  (no Google Translate API, no Bhashini, no OpenAI/Anthropic calls in the CORE
  translation pipeline).
- The CORE demo flow (Hindi input → Santali translation → bilingual display →
  worksheet generation) MUST work with zero internet connection.
- Any feature that truly needs internet (e.g. optional cloud backup) must be
  clearly isolated, toggleable, and never block the core demo.
- Keep dependencies minimal. Prefer standard libraries over heavy frameworks.
- Optimize for low-end Android hardware: small memory footprint, no large ML
  models bundled unless quantized and genuinely lightweight.
- Modular architecture: adding a second tribal language later should only mean
  adding a new dictionary/data file, not rewriting the pipeline.

PROJECT FOLDER STRUCTURE (already created — do not restructure without asking):
  vernacular_pedagogy/
    frontend/
    backend/
    data/
    tests/
    database/
    models/
    docs/
    project_context.md
    README.md

CORE USER FLOW (must match exactly):
  1. Teacher/student enters or speaks Hindi.
  2. If voice input: Hindi speech → Hindi text (on-device/local STT).
  3. Hindi text → Santali text (local dictionary/rule-based translation engine).
  4. Display BOTH Hindi and Santali text together on screen.
  5. Optional: play translated audio (pre-recorded clips, not live TTS synthesis).
  6. Teacher generates a bilingual (Hindi + Santali) worksheet.
  7. Worksheet is viewable/usable fully offline.

PRIORITY ORDER (P0 must work, P1 important, P2 skip unless time remains):
  P0: Hindi text input, language confirmation (Santali fixed), Hindi→Santali
      translation, bilingual display, voice input, fast pipeline (~3s target),
      worksheet generation, offline operation, simple demo-ready UI.
  P1: text-to-speech (pre-recorded), translation history, basic topic/lesson
      picker, save/download worksheet, local storage.
  P2 (skip for now): multiple languages, personalization, analytics, gamification,
      pronunciation scoring, cloud sync, complex auth.

UI RULES:
- Simple enough for a primary-school teacher with no tech background.
- Large buttons, large readable text, clear Hindi labels, minimal navigation.
- One obvious microphone button, one obvious "translate" action, one obvious
  "generate worksheet" action.
- No decorative animations, no unnecessary UI complexity.

DEVELOPMENT RULES:
- Inspect existing code before modifying anything.
- Do not rewrite working code unless explicitly asked.
- Do not delete existing functionality.
- Modify only the files relevant to the current task — nothing else.
- Reuse existing components/utilities instead of duplicating logic.
- Keep the architecture simple; favor a working prototype over "clever" code.
- Do not introduce paid services or new heavy dependencies without asking me first.
- Never assume internet connectivity is available.
- After making changes, tell me exactly how to test them locally.

WHEN UNSURE: stop and ask me a specific question rather than guessing and
generating a large unrequested change.