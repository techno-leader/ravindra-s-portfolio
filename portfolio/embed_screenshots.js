/**
 * Embeds captured screenshots into viewryt.html as base64 data URIs.
 * Run AFTER capture_screenshots.js has finished.
 *
 * Run: node embed_screenshots.js
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'viewryt.html');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const REPLACEMENTS = [
  // [placeholder id, nlp label, section name]
  ['nlp7-hero-placeholder',   'nlp7', 'hero'],
  ['nlp8-hero-placeholder',   'nlp8', 'hero'],
  ['nlp7-social-placeholder', 'nlp7', 'social'],
  ['nlp8-social-placeholder', 'nlp8', 'social'],
  ['nlp7-cta-placeholder',    'nlp7', 'cta'],
  ['nlp8-cta-placeholder',    'nlp8', 'cta'],
  ['nlp7-table-placeholder',  'nlp7', 'table'],
  ['nlp8-table-placeholder',  'nlp8', 'table'],
  ['nlp7-ing-placeholder',    'nlp7', 'ing'],
  ['nlp8-ing-placeholder',    'nlp8', 'ing'],
];

let html = fs.readFileSync(HTML_FILE, 'utf8');
let replaced = 0;

for (const [placeholderId, label, section] of REPLACEMENTS) {
  const imgPath = path.join(SCREENSHOTS_DIR, `${label}_${section}.png`);
  if (!fs.existsSync(imgPath)) {
    console.warn(`  ⚠ Missing: ${imgPath} — skipping`);
    continue;
  }

  const base64 = fs.readFileSync(imgPath, 'base64');
  const dataUri = `data:image/png;base64,${base64}`;

  // Replace the .screenshot-placeholder div that contains the element with this id
  const searchPattern = new RegExp(
    `<div class="screenshot-placeholder">[\\s\\S]*?id="${placeholderId}"[\\s\\S]*?<\\/div>`,
    'g'
  );
  const replacement = `<img class="screenshot-img" src="${dataUri}" alt="${label.toUpperCase()} ${section} section (mobile)" loading="lazy">`;

  const newHtml = html.replace(searchPattern, replacement);
  if (newHtml !== html) {
    html = newHtml;
    replaced++;
    console.log(`  ✓ Embedded ${label}_${section}`);
  } else {
    console.warn(`  ⚠ Pattern not found for: ${placeholderId}`);
  }
}

fs.writeFileSync(HTML_FILE, html, 'utf8');
console.log(`\nDone. ${replaced}/${REPLACEMENTS.length} screenshots embedded into viewryt.html`);
