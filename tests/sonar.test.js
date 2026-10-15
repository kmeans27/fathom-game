/* sonar.test.js — the three purchases as reducers (plan §3.3 rules). */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();
const CFG = F.config;
const S = F.sonar;

function mkContact(truth, decoys, sigma) {
  return { i: 0, zone: 'midnight', site: { name: 'x', flavour: 'y' }, truth, sigma, decoys };
}

t.test('init: full window, live decoys, zero pings', () => {
  const rs = S.init(mkContact(500, [100, 900], 52));
  a.strictEqual(rs.lo, 0);
  a.strictEqual(rs.hi, 1000);
  a.strictEqual(rs.sigma, 52);
  a.strictEqual(S.pingsUsed(rs), 0);
  a.deepStrictEqual(rs.decoys.map(d => d.su), [100, 900]);
});

t.test('sweep halves the window, keeps truth inside, stacks to 1000/2^n', () => {
  let rs = S.init(mkContact(612, [180, 950], 52));
  for (let n = 1; n <= 3; n++) {
    a.ok(S.canSweep(rs));
    const next = S.sweep(rs, 612);
    a.ok(Math.abs((next.hi - next.lo) - 1000 / Math.pow(2, n)) < 1);
    a.ok(next.lo <= 612 && next.hi >= 612);
    rs = next;
  }
  a.strictEqual(S.pingsUsed(rs), 3);
});

t.test('sweep kills decoys in the discarded half only', () => {
  const rs = S.init(mkContact(612, [180, 950], 52));
  const next = S.sweep(rs, 612);
  a.strictEqual(next.lo, 500); // truth >= mid -> keep upper half
  const dead = next.decoys.filter(d => d.dead);
  a.strictEqual(dead.length, 1);
  a.strictEqual(dead[0].su, 180);
});

t.test('sweep refuses at SWEEP_MIN_WINDOW or with no pings left', () => {
  const narrow = { lo: 499, hi: 501, sigma: 22, used: { sweep: 0, echo: 0, gain: 0 }, decoys: [] };
  a.ok(!S.canSweep(narrow)); // hi - lo === SWEEP_MIN_WINDOW
  a.strictEqual(S.sweep(narrow, 500), null);
  const ok = { lo: 498, hi: 501, sigma: 22, used: { sweep: 0, echo: 0, gain: 0 }, decoys: [] };
  a.ok(S.canSweep(ok));

  let cur = S.init(mkContact(500, [], 22));
  for (let n = 0; n < 5; n++) cur = S.sweep(cur, 500);
  a.ok(cur !== null);
  a.strictEqual(S.pingsUsed(cur), 5);
  a.ok(!S.canSweep(cur)); // per-round cap
});

t.test('echo sets the +/-60 band and kills outside decoys', () => {
  const rs = S.init(mkContact(612, [180, 600], 52));
  const next = S.echo(rs, 612);
  a.strictEqual(next.lo, 552);
  a.strictEqual(next.hi, 672);
  a.strictEqual(S.pingsUsed(next), 2);
  const dead = next.decoys.filter(d => d.dead);
  a.strictEqual(dead.length, 1);
  a.strictEqual(dead[0].su, 180);
});

t.test('echo is idempotent: refused when window already inside the band', () => {
  const rs = S.init(mkContact(612, [], 52));
  const once = S.echo(rs, 612);
  a.strictEqual(S.echo(once, 612), null);
  a.ok(!S.canEchoAt(once, 612));
});

t.test('echo clamps to the current window (sweep then echo)', () => {
  let rs = S.init(mkContact(612, [], 52));
  rs = S.sweep(rs, 612); // keep [500,1000]
  const next = S.echo(rs, 612);
  a.strictEqual(next.lo, 552);
  a.strictEqual(next.hi, 672);
});

t.test('gain halves sigma once and refuses twice', () => {
  let rs = S.init(mkContact(612, [], 100));
  const once = S.gain(rs);
  a.strictEqual(once.sigma, 50);
  a.strictEqual(S.gain(once), null);
  a.ok(!S.canGain(once));
});

t.test('per-round cap: any action refuses when 5 pings are used', () => {
  let rs = S.init(mkContact(612, [], 100));
  rs = S.gain(rs);
  rs = S.sweep(rs, 612);
  rs = S.sweep(rs, 612);
  rs = S.echo(rs, 612); // 1+1+1+2 = 5
  a.strictEqual(S.pingsUsed(rs), 5);
  a.ok(!S.canGain(rs));
  a.ok(!S.canSweep(rs));
  a.ok(!S.canEcho(rs));
});
