const API_BASE = "http://localhost:8000";

export async function callTranslate(text) {
  const response = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Translation request failed");
  }

  return response.json();
}
