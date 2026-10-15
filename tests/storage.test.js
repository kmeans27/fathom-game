/* storage.test.js — migration, caps, corrupt data, unavailable storage. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

// vm-created objects have a different Object prototype than host literals,
// so cross-context comparisons must go through JSON, not deepStrictEqual.
function eqJson(x, y) { a.strictEqual(JSON.stringify(x), JSON.stringify(y)); }

t.test('v1 -> v2 migration keeps v1 bests under v1 and does not delete the v1 key', () => {
  const store = { 'fathom': JSON.stringify({ best: { depthM: 1234 }, played: 3, streak: { current: 2, best: 4 } }) };
  const F = game({ store });
  const st = F.storage.migrate(null);
  a.strictEqual(st.version, 2);
  eqJson(st.v1, { best: { depthM: 1234 }, played: 3, streak: { current: 2, best: 4 } });
  a.ok(Object.hasOwn(store, 'fathom')); // untouched
  const read = F.storage.read();
  eqJson(read.v1, st.v1);
});

t.test('explicit migrate(v1State) works without a legacy key', () => {
  const F = game();
  const st = F.storage.migrate({ best: { depthM: 7 } });
  eqJson(st.v1, { best: { depthM: 7 }, played: null, streak: null });
});

t.test('history cap drops the oldest dayKeys', () => {
  const F = game();
  const st = F.storage.defaultState();
  for (let i = 0; i < 95; i++) {
    const k = '2026-01-' + String(i % 28 + 1).padStart(2, '0') + '-' + i; // unique sortable keys
    st.history['day' + String(i).padStart(3, '0')] = { depthM: i };
  }
  a.strictEqual(Object.keys(st.history).length, 95);
  F.storage.write(st);
  const back = F.storage.read();
  a.strictEqual(Object.keys(back.history).length, F.config.HISTORY_CAP);
  a.strictEqual(back.history['day000'] ? true : false, false); // oldest dropped
  a.ok(back.history['day094']);
});

t.test('corrupt JSON is survived with defaults', () => {
  const F = game({ store: { 'fathom:v2': '{not json' } });
  const st = F.storage.read();
  a.strictEqual(st.version, 2);
  a.strictEqual(Object.keys(st.history).length, 0);
});

t.test('unavailable storage: read returns defaults, write returns false, nothing throws', () => {
  const F = game({ throwStorage: true });
  const st = F.storage.read();
  a.strictEqual(st.version, 2);
  a.strictEqual(F.storage.available(), false);
  a.strictEqual(F.storage.write(st), false);
  a.strictEqual(F.storage.clear(), false);
});

t.test('round-trip of a normal state', () => {
  const F = game();
  const st = F.storage.defaultState();
  st.history['2026-10-15'] = { depthM: 100, points: 10, hull: 3, crushed: false };
  a.strictEqual(F.storage.write(st), true);
  const back = F.storage.read();
  eqJson(back.history['2026-10-15'], st.history['2026-10-15']);
});
