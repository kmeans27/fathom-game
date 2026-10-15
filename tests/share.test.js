/* share.test.js — card format (plan §8.4), colourblind glyphs, replay codes. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();

const results = [
  { tier: 'survey', silent: false, stake: 3, points: 100 },
  { tier: 'bullseye', silent: false, stake: 3, points: 60 },
  { tier: 'bullseye', silent: false, stake: 1, points: 60 },
  { tier: 'graze', silent: false, stake: 2, points: 10 },
  { tier: 'hit', silent: true, stake: 3, points: 30 },
  { tier: 'miss', silent: false, stake: 1, points: 0 },
  { tier: 'survey', silent: false, stake: 2, points: 100 },
  { tier: 'bullseye', silent: false, stake: 3, points: 60 }
];
const runResults = {
  dayKey: '2026-10-15',
  depthM: 5124,
  points: 999,
  hull: 2,
  pingsLeft: 2,
  crushed: false,
  deepestZone: 'midnight',
  stakePlan: [3, 3, 1, 2, 3, 1, 2, 3],
  results: results
};

t.test('grid: distinct glyph per tier, silent hit gets the diamond, miss is the dark square', () => {
  const g = F.share.grid(results, null);
  a.strictEqual(g, '\u2726\u25C6\u25C6\u25CF\uD83D\uDCA1\u2B1B\u2726\u25C6');
});

t.test('text: header line with day number, thousands separators, deepest zone', () => {
  const txt = F.share.text(runResults);
  const lines = txt.split('\n');
  a.ok(lines[0].startsWith('FATHOM #1018 \u00B7 5,124 m \u00B7 MIDNIGHT'));
  a.ok(lines[2].startsWith('stake 3\u00B73\u00B71\u00B72\u00B73\u00B71\u00B72\u00B73   hull \u25CF\u25CF\u25CB   pings 2 left'));
  a.ok(!lines.some(l => l.includes('\u2301')), 'no HULL LOST when not crushed');
});

t.test('crushed runs are stamped', () => {
  const crushed = Object.assign({}, runResults, { crushed: true });
  a.ok(F.share.text(crushed).endsWith(' \u2301HULL LOST'));
});

t.test('colourblind mode adds tier labels', () => {
  const g = F.share.grid([{ tier: 'hit', silent: false, stake: 1, points: 30 }], { colourblind: true });
  a.strictEqual(g, '\u25B2 HIT');
});

t.test('encode/decode round-trips', () => {
  const code = F.share.encode(runResults);
  const back = F.share.decode(code);
  a.strictEqual(back.dayKey, runResults.dayKey);
  a.strictEqual(back.pingsLeft, runResults.pingsLeft);
  a.strictEqual(back.hull, runResults.hull);
  a.strictEqual(back.results.length, results.length);
  for (let i = 0; i < results.length; i++) {
    a.strictEqual(back.results[i].tier, results[i].tier);
    a.strictEqual(back.results[i].silent, results[i].silent);
    a.strictEqual(back.results[i].stake, results[i].stake);
  }
});
