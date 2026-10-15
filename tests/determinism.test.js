/* determinism.test.js — no forbidden environment access in core; same seed,
   byte-identical contacts. */
import { game } from './loader.mjs';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { test as t } from 'node:test';
import a from 'node:assert';

const coreDir = fileURLToPath(new URL('../js/core/', import.meta.url));
const files = fs.readdirSync(coreDir).filter(f => f.endsWith('.js'));

t.test('no Math.random, Date.now, or bare new Date() anywhere in core', () => {
  function stripComments(s) {
    return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  }
  for (const f of files) {
    const src = stripComments(fs.readFileSync(path.join(coreDir, f), 'utf8'));
    a.ok(!/Math\s*\.\s*random/.test(src), f + ' has no Math.random');
    a.ok(!/Date\s*\.\s*now/.test(src), f + ' has no Date.now');
    a.ok(!/new Date\s*\(\s*\)/.test(src), f + ' has no bare new Date()');
  }
});

t.test('two create() calls with the same seed produce byte-identical contacts', () => {
  const F1 = game();
  const F2 = game();
  const seed = F1.daily.seed('2026-10-15');
  F1.run.create({ mode: 'daily', seed, dayKey: '2026-10-15' });
  F2.run.create({ mode: 'daily', seed, dayKey: '2026-10-15' });
  a.strictEqual(JSON.stringify(F1.run.state().contacts), JSON.stringify(F2.run.state().contacts));
});

t.test('rng stream is pure: same seed replays identically', () => {
  const F = game();
  const s1 = F.rng.stream(12345);
  const s2 = F.rng.stream(12345);
  for (let i = 0; i < 50; i++) a.strictEqual(s1(), s2());
});
