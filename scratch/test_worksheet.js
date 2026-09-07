import fs from "fs";
import path from "path";

const dict = JSON.parse(
  fs.readFileSync(
    path.resolve("frontend/src/data/santali_dictionary.json"),
    "utf-8"
  )
);

const CATEGORY_TITLES = {
  number: "संख्याएँ (Numbers)",
  day: "सप्ताह के दिन (Days of the Week)",
  greeting: "अभिवादन (Greetings)",
  classroom: "कक्षा के निर्देश (Classroom Instructions)",
  noun: "सामान्य शब्द (Common Words)",
};

function listCategories() {
  const seen = [];
  for (const entry of dict) {
    const cat = entry.category;
    if (cat && !seen.includes(cat)) seen.push(cat);
  }
  return seen;
}

function generateWorksheet(category) {
  const matched = dict
    .filter((e) => e.category === category && e.hindi && e.santali)
    .map((e) => ({ hindi: String(e.hindi), santali: String(e.santali) }));
  if (matched.length === 0) throw new Error(`No entries for category ${category}`);
  return {
    title: CATEGORY_TITLES[category] || category,
    category,
    items: matched,
  };
}

const cats = listCategories();
console.log("Categories found:", cats);
cats.forEach((c) => {
  const ws = generateWorksheet(c);
  console.log(`- Category [${c}]: "${ws.title}" with ${ws.items.length} items`);
});
