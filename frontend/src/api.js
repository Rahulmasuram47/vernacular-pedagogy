const API_BASE = "http://localhost:8000";

export async function callTranslate(text) {
  const response = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Translate request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchWorksheetCategories() {
  const response = await fetch(`${API_BASE}/worksheet/categories`);

  if (!response.ok) {
    throw new Error(`Categories request failed: ${response.status}`);
  }

  return response.json();
}

export async function callWorksheet(category) {
  const response = await fetch(`${API_BASE}/worksheet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
  });

  if (!response.ok) {
    throw new Error(`Worksheet request failed: ${response.status}`);
  }

  return response.json();
}