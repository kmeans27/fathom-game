import test from 'node:test';
import { strict as assert } from 'node:assert';
import { game } from './loader.mjs';
const { sweep, echo, canSweep, canEcho, TRENCH } = game();
const start = { lo: 0, hi: 1000, pings: TRENCH.pingBudget };
test('sweep halves the window', () => {
  const s = sweep(start, 700);
  assert.equal(s.lo, 500); assert.equal(s.hi, 1000); assert.equal(s.pings, 9);
});
test('sweep keeps the target inside the window', () => {
  const s = sweep(start, 300);
  assert(s.lo <= 300 && 300 <= s.hi);
});
test('echo draws a band of +/-80 m', () => {
  const s = echo(start, 700);
  assert.equal(s.lo, 620); assert.equal(s.hi, 780); assert.equal(s.pings, 8);
});
test('echo clamps to the map', () => {
  const s = echo(start, 980);
  assert.equal(s.hi, 1000); assert.equal(s.lo, 900);
});
test('sweep refuses when out of pings', () => {
  assert.equal(canSweep({ lo: 0, hi: 1000, pings: 0 }), false);
});
test('sweep refuses on a 1 m window', () => {
  assert.equal(canSweep({ lo: 500, hi: 501, pings: 5 }), false);
});
test('echo refuses when out of pings', () => {
  assert.equal(canEcho({ pings: 1 }), false);
});
