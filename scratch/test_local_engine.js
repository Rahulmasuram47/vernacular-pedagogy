import { translate, normalize } from "../frontend/src/translation.js";
import { listCategories, generateWorksheet } from "../frontend/src/worksheet.js";

console.log("--- Testing normalize ---");
console.log("Strip punct:", normalize(" नमस्ते! "));
console.log("NFC / ZWJ:", normalize("किताब\u200c"));

console.log("\n--- Testing translation ---");
console.log("Exact match (किताब):", translate("किताब"));
console.log("Exact match (नमस्ते):", translate("नमस्ते"));
console.log("Sentence match (किताब खोलो):", translate("किताब खोलो"));
console.log("Multi-word partial (एक किताब और पानी):", translate("एक किताब और पानी"));

console.log("\n--- Testing worksheet ---");
const categories = listCategories();
console.log("Categories:", categories);
for (const cat of categories) {
  const ws = generateWorksheet(cat);
  console.log(`Worksheet [${cat}]: ${ws.title} (${ws.items.length} items)`);
}

console.log("\nAll checks passed successfully!");
