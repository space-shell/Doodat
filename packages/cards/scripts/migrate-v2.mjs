// One-time migration: v1 cards -> v2 schema.
// Adds `difficulty` (per-domain tertile by a content demand score),
// folds spiritual `passage_ref` into `sources[]`, drops `passage_ref`/`expanded_link`.
// Three intensity texts are RETAINED (difficulty selects which one renders).
//
// Run: node packages/cards/scripts/migrate-v2.mjs
import { physicalCards } from '../src/data/physical.ts';
import { mentalCards } from '../src/data/mental.ts';
import { spiritualCards } from '../src/data/spiritual.ts';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Content demand score — higher = harder. Drives per-domain tertile assignment. */
function demandScore(card) {
  const text = `${card.intensity_low} ${card.intensity_medium} ${card.intensity_high}`;
  let s = 0;
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:hours?)/gi)) s += +m[1] * 60;
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:mins?|minutes?)/gi)) s += +m[1];
  for (const m of text.matchAll(/(\d+)\s*(?:seconds?)/gi)) s += +m[1] / 10;
  for (const m of text.matchAll(/(\d+)\s*sets?/gi)) s += +m[1] * 4;
  if (/\b(full|complete a|deep work|elimination|carnivore|hiit|sprint|for time)\b/i.test(text)) s += 20;
  return s;
}

/** Assign low/medium/high by per-domain tertile of the demand score (10/10/10). */
function assignDifficulty(cards) {
  const ranked = [...cards].sort((a, b) =>
    demandScore(b) - demandScore(a) || (a.id < b.id ? -1 : 1),
  );
  const n = ranked.length;
  const third = Math.round(n / 3);
  const out = new Map();
  ranked.forEach((c, i) => {
    out.set(c.id, i < third ? 'high' : i < n - third ? 'medium' : 'low');
  });
  return out;
}

/** Infer source kind: "Author, Title" -> book, otherwise scripture. */
function sourceKind(ref) {
  return /^[^,]+,\s*[A-Z]/.test(ref) ? 'book' : 'scripture';
}

const KEY_ORDER = [
  'id', 'type', 'domain', 'category', 'difficulty',
  'intensity_low', 'intensity_medium', 'intensity_high',
  'context', 'tags', 'created_at',
  'tradition', 'sources', 'agnostic_interpretation', 'cross_tradition_pair',
];

function migrate(card, difficulty) {
  const out = {};
  for (const k of KEY_ORDER) {
    if (!(k in card) || card[k] === undefined) continue;
    out[k] = card[k];
  }
  out.difficulty = difficulty;
  if (card.passage_ref) {
    out.sources = [{ citation: card.passage_ref, kind: sourceKind(card.passage_ref) }];
  }
  return out;
}

/** TS literal serializer: single quotes, unquoted identifier keys, inline arrays/objects. */
function fmt(val) {
  if (typeof val === 'string') {
    const hasSingle = val.includes("'");
    const hasDual = val.includes('"');
    if (!hasSingle) return `'${val}'`;
    if (!hasDual) return `"${val}"`;
    return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `[${val.map(fmt).join(', ')}]`;
  if (val && typeof val === 'object') {
    const entries = Object.entries(val).map(([k, v]) => `${k}: ${fmt(v)}`);
    return `{ ${entries.join(', ')} }`;
  }
  return String(val);
}

function fmtCard(card) {
  const present = KEY_ORDER.filter((k) => k in card && card[k] !== undefined);
  const lines = present.map((k, i) => {
    const comma = i < present.length - 1 ? ',' : '';
    return `    ${k}: ${fmt(card[k])}${comma}`;
  });
  return `  {\n${lines.join('\n')}\n  }`;
}

function fmtFile(varName, cards) {
  const header = "import type { ContentCard } from '../types';\n\n";
  const body = cards.map(fmtCard).join(',\n');
  return `${header}export const ${varName}: ContentCard[] = [\n${body},\n];\n`;
}

function migrateDomain(varName, cards, fileName) {
  const diff = assignDifficulty(cards);
  const migrated = cards.map((c) => migrate(c, diff.get(c.id)));
  const spread = { low: 0, medium: 0, high: 0 };
  for (const c of migrated) spread[c.difficulty]++;
  console.log(`${varName}: ${cards.length} cards -> difficulty spread`, spread);
  writeFileSync(resolve(__dirname, '..', 'src', 'data', fileName), fmtFile(varName, migrated));
  return migrated;
}

migrateDomain('physicalCards', physicalCards, 'physical.ts');
migrateDomain('mentalCards', mentalCards, 'mental.ts');
migrateDomain('spiritualCards', spiritualCards, 'spiritual.ts');

console.log('\nMigration complete. Difficulty is heuristic (tertile by demand score); re-author later.');
