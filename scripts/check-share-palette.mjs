#!/usr/bin/env node
/* Pins js/fmb-share.js's canvas palette to js/season-data-2026.js.
 *
 *   node scripts/check-share-palette.mjs
 *
 * A share card draws to a canvas, where var(--eb) means nothing — so the
 * festival colours have to be duplicated as literals in the share file. That
 * duplicate is the one copy of the palette a stylesheet cannot keep honest,
 * and a share card is the one artefact that LEAVES the site: nobody who sees
 * one can hold it up against the page it came from.
 *
 * So this enforces, in both directions:
 *
 *   THEMES[slug].to === FESTIVALS_2026[slug].accentColor
 *   every festival with a page has a theme, and every theme has a festival
 *
 * Exits 1 on any mismatch so it can guard a build.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const dataSrc = await fs.readFile(path.join(ROOT, 'js/season-data-2026.js'), 'utf8');
const shareSrc = await fs.readFile(path.join(ROOT, 'js/fmb-share.js'), 'utf8');

/* FESTIVALS_2026 is a plain literal in a browser file, so evaluate just that
   declaration rather than importing a module that expects a `window`. */
const festMatch = dataSrc.match(/const FESTIVALS_2026\s*=\s*(\[[\s\S]*?\n\];)/);
if (!festMatch) {
  console.error('✗ could not find FESTIVALS_2026 in js/season-data-2026.js');
  process.exit(1);
}
const festivals = new Function('return ' + festMatch[1].replace(/;$/, ''))();

/* THEMES is likewise a literal; read the slug → `to` pairs out of it. */
const themeBlock = shareSrc.match(/var THEMES = \{([\s\S]*?)\n  \};/);
if (!themeBlock) {
  console.error('✗ could not find THEMES in js/fmb-share.js');
  process.exit(1);
}
const themes = {};
for (const m of themeBlock[1].matchAll(/'([a-z0-9-]+)':\s*\{[^}]*?to:\s*'(#[0-9a-fA-F]{6})'/g)) {
  themes[m[1]] = m[2].toLowerCase();
}

const problems = [];

for (const f of festivals) {
  const want = String(f.accentColor || '').toLowerCase();
  const got = themes[f.slug];
  if (!got) {
    problems.push(`${f.slug}: in FESTIVALS_2026 but has no THEME in fmb-share.js`);
  } else if (got !== want) {
    problems.push(`${f.slug}: THEME to=${got} but accentColor=${want}`);
  }
}

const slugs = new Set(festivals.map((f) => f.slug));
for (const slug of Object.keys(themes)) {
  if (!slugs.has(slug)) problems.push(`${slug}: has a THEME but is not in FESTIVALS_2026`);
}

if (problems.length) {
  console.error('✗ share palette out of sync with FESTIVALS_2026:\n');
  problems.forEach((p) => console.error('   ' + p));
  console.error('\nFix js/fmb-share.js THEMES (or the festival entry) so the two agree.');
  process.exit(1);
}

console.log(`✓ share palette in sync — ${Object.keys(themes).length} festival themes match FESTIVALS_2026`);
