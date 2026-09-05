const HISTORY_KEY = "vp_translation_history";
const WORKSHEETS_KEY = "vp_saved_worksheets";
const MAX_HISTORY = 20;

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? safeParse(raw, []) : [];
}

export function addToHistory(entry) {
  const history = getHistory();
  const record = {
    hindi: entry.hindi,
    santali: entry.santali,
    confidence: entry.confidence,
    timestamp: new Date().toISOString(),
  };
  const updated = [record, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function getSavedWorksheets() {
  const raw = localStorage.getItem(WORKSHEETS_KEY);
  return raw ? safeParse(raw, []) : [];
}

export function saveWorksheet(worksheet) {
  const saved = getSavedWorksheets();
  const record = {
    ...worksheet,
    savedAt: new Date().toISOString(),
  };
  const updated = [record, ...saved];
  localStorage.setItem(WORKSHEETS_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteSavedWorksheet(savedAt) {
  const saved = getSavedWorksheets();
  const updated = saved.filter((w) => w.savedAt !== savedAt);
  localStorage.setItem(WORKSHEETS_KEY, JSON.stringify(updated));
  return updated;
}