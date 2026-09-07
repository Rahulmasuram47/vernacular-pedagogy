import fs from "fs";
import path from "path";

const dict = JSON.parse(
  fs.readFileSync(
    path.resolve("frontend/src/data/santali_dictionary.json"),
    "utf-8"
  )
);

function normalize(text) {
  let str = (text != null ? String(text) : "").normalize("NFC");
  str = str.replace(/[\u200c\u200d]/g, "");
  str = str.trim().replace(/\s+/g, " ");
  str = str.replace(/^[।!?.,;:"'“”‘’()[\]{}]+|[।!?.,;:"'“”‘’()[\]{}]+$/g, "");
  return str;
}

const lookup = new Map();
for (const entry of dict) {
  const hindi = normalize(entry.hindi);
  const santali = (entry.santali != null ? String(entry.santali) : "").trim();
  if (!hindi || !santali) continue;
  if (!lookup.has(hindi)) {
    lookup.set(hindi, santali);
  }
}

function translate(text) {
  const original = text != null ? String(text) : "";
  const normalized = normalize(original);
  if (!normalized) return { hindi: original, santali: "", confidence: "partial" };
  const exact = lookup.get(normalized);
  if (exact !== undefined) return { hindi: original, santali: exact, confidence: "exact" };
  const parts = [];
  for (const token of normalized.split(" ")) {
    const key = normalize(token);
    if (!key) continue;
    const found = lookup.get(key);
    if (found !== undefined) parts.push(found);
    else parts.push(`${token}[?]`);
  }
  return { hindi: original, santali: parts.join(" "), confidence: "partial" };
}

console.log("Exact match 'किताब':", translate("किताब"));
console.log("Exact match 'नमस्ते':", translate("नमस्ते"));
console.log("Exact phrase 'बैठ जाओ':", translate("बैठ जाओ"));
console.log("Token match 'एक किताब':", translate("एक किताब"));
console.log("Unknown token 'कंप्यूटर':", translate("कंप्यूटर"));
