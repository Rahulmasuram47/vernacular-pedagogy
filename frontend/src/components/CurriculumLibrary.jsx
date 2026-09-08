import { useState, useMemo, useCallback } from "react";
import {
  CURRICULUM_ITEMS,
  GRADES,
  SUBJECTS,
  CONTENT_TYPES,
} from "../data/curriculumData.js";
import { playSantaliAudio, hasSantaliAudio } from "../audio/santaliAudio.js";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

export default function CurriculumLibrary({
  onSelectForWorksheet,
  onSelectForFlashcards,
  onSelectForVoice,
  onBack,
}) {
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState(null);

  // ------------------------------------------------------------
  // FILTERING
  // ------------------------------------------------------------
  const filteredItems = useMemo(() => {
    return CURRICULUM_ITEMS.filter((item) => {
      if (selectedGrade !== "all" && item.grade !== selectedGrade) {
        return false;
      }
      if (selectedSubject !== "all" && item.subject !== selectedSubject) {
        return false;
      }
      if (selectedType !== "all" && item.contentType !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHindi = item.sourceHindi.toLowerCase().includes(q);
        const matchTopic = item.topic.toLowerCase().includes(q);
        const matchOutcome = item.outcomeDescription.toLowerCase().includes(q);
        if (!matchHindi && !matchTopic && !matchOutcome) {
          return false;
        }
      }
      return true;
    });
  }, [selectedGrade, selectedSubject, selectedType, searchQuery]);

  // ------------------------------------------------------------
  // AUDIO PLAYBACK
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

  const handlePlaySantali = async (item) => {
    setPlayingId(item.id);
    await playSantaliAudio(
      item.santaliTranslation,
      () => setPlayingId(item.id),
      () => setPlayingId(null)
    );
    setPlayingId(null);
  };

  return (
    <div className="curriculum-view no-print">
      {/* HEADER */}
      <div className="curriculum-header">
        <div>
          <h2>📚 FLN / NIPUN भारत पाठ्यक्रम पुस्तकालय</h2>
          <p className="curriculum-subtitle">
            बुनियादी साक्षरता एवं संख्या ज्ञान (FLN) हेतु मातृभाषा आधारित शिक्षण सामग्री
          </p>
        </div>

        <div className="curriculum-header-badges">
          <span className="offline-ready" title="पूर्णतः ऑफ़लाइन उपलब्ध">
            <span className="offline-dot" aria-hidden="true" />
            ✓ Offline Ready
          </span>

          {onBack && (
            <button
              type="button"
              className="btn btn-small btn-outline"
              onClick={onBack}
            >
              ← वापस मुख्य पृष्ठ
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="curriculum-filter-card">
        <div className="filter-grid">
          {/* Grade filter */}
          <div className="filter-group">
            <label htmlFor="curriculum-grade" className="filter-label">
              कक्षा (Grade):
            </label>
            <select
              id="curriculum-grade"
              className="input select-compact"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              {GRADES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject filter */}
          <div className="filter-group">
            <label htmlFor="curriculum-subject" className="filter-label">
              विषय (Subject):
            </label>
            <select
              id="curriculum-subject"
              className="input select-compact"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content type filter */}
          <div className="filter-group">
            <label htmlFor="curriculum-type" className="filter-label">
              सामग्री प्रकार (Type):
            </label>
            <select
              id="curriculum-type"
              className="input select-compact"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search query */}
          <div className="filter-group">
            <label htmlFor="curriculum-search" className="filter-label">
              खोजें (Search):
            </label>
            <input
              id="curriculum-search"
              type="text"
              className="input input-compact"
              placeholder="पाठ या निर्देश खोजें..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-meta-bar">
          <span className="results-count">
            दिखाए जा रहे पाठ: <strong>{filteredItems.length}</strong> /{" "}
            {CURRICULUM_ITEMS.length}
          </span>
          <span className="fln-notice">
            📌 एनआईपीयूएन भारत (NIPUN Bharat) प्रतिनिधि शिक्षण प्रतिफल
          </span>
        </div>
      </div>

      {/* CURRICULUM ITEMS LIST */}
      <div className="curriculum-list">
        {filteredItems.length === 0 ? (
          <div className="empty-curriculum-card">
            <p>चयनित फ़िल्टर के लिए कोई शिक्षण सामग्री नहीं मिली।</p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                setSelectedGrade("all");
                setSelectedSubject("all");
                setSelectedType("all");
                setSearchQuery("");
              }}
            >
              सभी फ़िल्टर हटाएँ
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const hasAudio = hasSantaliAudio(item.santaliTranslation);
            const isPlaying = playingId === item.id;

            return (
              <div key={item.id} className="curriculum-card">
                {/* CARD TOP META */}
                <div className="card-top-meta">
                  <div className="badge-cluster">
                    <span className="badge badge-grade">
                      कक्षा {item.grade}
                    </span>
                    <span
                      className={`badge badge-subject ${
                        item.subject === "numeracy" ? "num" : "lang"
                      }`}
                    >
                      {item.subject === "numeracy"
                        ? "🔢 संख्या ज्ञान"
                        : "📚 भाषा"}
                    </span>
                    <span className="badge badge-type">
                      {item.contentType === "lesson_script"
                        ? "📖 पाठ निर्देश"
                        : item.contentType === "activity"
                        ? "🎯 गतिविधि"
                        : "📝 आकलन"}
                    </span>
                  </div>

                  <span className="outcome-code" title={item.outcomeDescription}>
                    {item.learningOutcome}
                  </span>
                </div>

                {/* TOPIC & OUTCOME */}
                <h3 className="card-topic-title">{item.topic}</h3>
                <p className="card-outcome-desc">
                  <strong>शिक्षण प्रतिफल:</strong> {item.outcomeDescription}
                </p>

                {/* BILINGUAL CONTENT BOX */}
                <div className="curriculum-bilingual-box">
                  {/* HINDI */}
                  <div className="curr-lang-pane curr-hindi">
                    <div className="curr-pane-header">
                      <span>हिंदी निर्देश:</span>
                      <button
                        type="button"
                        className="btn-tts-icon"
                        onClick={() => speakHindi(item.sourceHindi)}
                        title="हिंदी उच्चारण सुनें"
                        aria-label="हिंदी उच्चारण सुनें"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="curr-text">{item.sourceHindi}</p>
                  </div>

                  {/* SANTALI */}
                  <div className="curr-lang-pane curr-santali">
                    <div className="curr-pane-header">
                      <span>संताली (ओल चिकी):</span>
                      {hasAudio && (
                        <button
                          type="button"
                          className={`btn-tts-icon ${isPlaying ? "playing" : ""}`}
                          onClick={() => handlePlaySantali(item)}
                          title="संताली उच्चारण सुनें"
                          aria-label="संताली उच्चारण सुनें"
                        >
                          {isPlaying ? "⏳" : "🔊"}
                        </button>
                      )}
                    </div>
                    <p className="curr-text santali">{item.santaliTranslation}</p>
                  </div>
                </div>

                {/* CLASSROOM ACTION WORKFLOWS */}
                <div className="curriculum-card-actions">
                  <button
                    type="button"
                    className="btn btn-small btn-primary"
                    onClick={() => onSelectForWorksheet?.(item)}
                    title="इस प्रतिफल पर द्विभाषी कार्यपत्रक बनाएँ"
                  >
                    📄 कार्यपत्रक बनाएँ
                  </button>

                  <button
                    type="button"
                    className="btn btn-small btn-secondary"
                    onClick={() => onSelectForFlashcards?.(item)}
                    title="इस विषय के दृश्य फ्लैशकार्ड देखें"
                  >
                    🗂️ दृश्य फ्लैशकार्ड
                  </button>

                  <button
                    type="button"
                    className="btn btn-small btn-outline"
                    onClick={() => onSelectForVoice?.(item)}
                    title="ध्वनि संवाद में अभ्यास करें"
                  >
                    🎙️ ध्वनि संवाद
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
