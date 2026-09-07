const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../frontend/src');
const patterns = ['fetch', 'axios', 'XMLHttpRequest', 'localhost', '127.0.0.1', 'http:', 'https:'];
const results = [];

function search(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      search(full);
    } else {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, i) => {
        for (const p of patterns) {
          if (line.includes(p)) {
            const rel = path.relative(path.resolve(__dirname, '..'), full).replace(/\\/g, '/');
            results.push({ file: rel, line: i + 1, pattern: p, text: line.trim() });
          }
        }
      });
    }
  }
}

search(targetDir);
console.log(JSON.stringify(results, null, 2));
