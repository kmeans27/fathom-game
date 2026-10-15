/* rounds.test.js — generation contract (plan §4 rules) + the difficulty-curve
   property tests from §6. The reader model (centroid + Gaussian acuity error
   proportional to sigma) is a test fixture, not game code. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();
const CFG = F.config;

function gen(seed) { return F.rounds.generate(seed); }

t.test('same seed => identical contacts; different seeds differ', () => {
  const s = F.daily.seed('2026-10-15');
  a.strictEqual(JSON.stringify(gen(s)), JSON.stringify(gen(s)));
  const other = F.daily.seed('2026-10-16');
  a.notStrictEqual(JSON.stringify(gen(s)), JSON.stringify(gen(other)));
});

t.test('8 contacts; zone sequence matches ZONE_BY_CONTACT', () => {
  const cs = gen(F.daily.seed('2026-01-01'));
  a.strictEqual(cs.length, CFG.RUN.contacts);
  for (let i = 0; i < cs.length; i++) {
    a.strictEqual(cs[i].zone, CFG.ZONE_BY_CONTACT[i]);
    a.strictEqual(cs[i].i, i);
    a.ok(cs[i].site && cs[i].site.name && cs[i].site.flavour);
  }
});

t.test('truth within [60,940] on every seed', () => {
  for (let s = 0; s < 200; s++) {
    for (const c of gen(s)) {
      a.ok(c.truth >= CFG.SCOPE.minTarget && c.truth <= CFG.SCOPE.maxTarget);
    }
  }
});

t.test('decoy rules: >= MIN_DECOY_GAP from truth, >= MIN_DECOY_EDGE from edges, separated', () => {
  const minSep = CFG.DECOY_MIN_SEP_FACTOR * 0; // per-zone below
  for (let s = 0; s < 200; s++) {
    for (const c of gen(s)) {
      const zone = F.zones.get(c.zone);
      a.strictEqual(c.decoys.length, zone.decoys);
      for (const d of c.decoys) {
        a.ok(Math.abs(d - c.truth) >= CFG.MIN_DECOY_GAP);
        a.ok(d >= CFG.MIN_DECOY_EDGE);
        a.ok(d <= CFG.SCOPE.maxSu - CFG.MIN_DECOY_EDGE);
      }
      for (let x = 0; x < c.decoys.length; x++) {
        for (let y = x + 1; y < c.decoys.length; y++) {
          a.ok(Math.abs(c.decoys[x] - c.decoys[y]) >= CFG.DECOY_MIN_SEP_FACTOR * zone.sigma);
        }
      }
    }
  }
});

t.test('difficulty curve: unassisted Sunlight is readable, Hadal is not', () => {
  // Reader model: centroid of 90 honest returns + Gaussian acuity error 0.4*sigma.
  const READ_FACTOR = 0.4;
  const N = 300;
  let sunGood = 0, hadBad = 0;
  for (let s = 0; s < N; s++) {
    const cs = gen(F.daily.seed('2026-01-01') + s);
    const rand = F.rng.stream((F.daily.seed('2026-01-01') + s) ^ 0x51a3);
    for (const idx of [0, 7]) {
      const c = cs[idx];
      let sum = 0;
      for (let k = 0; k < CFG.SCATTER_RETURNS; k++) {
        // Box-Muller around the truth
        const u1 = Math.max(rand(), 1e-12);
        const th = 2 * Math.PI * rand();
        sum += c.truth + c.sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(th);
      }
      const centroid = sum / CFG.SCATTER_RETURNS;
      const u1b = Math.max(rand(), 1e-12);
      const thb = 2 * Math.PI * rand();
      const readErr = (READ_FACTOR * c.sigma) * Math.sqrt(-2 * Math.log(u1b)) * Math.cos(thb);
      const pick = centroid + readErr;
      const err = Math.abs(pick - c.truth);
      const tier = F.scoring.tierFor(err);
      if (idx === 0) { if (tier === 'survey' || tier === 'bullseye') sunGood++; }
      else { if (tier === 'hit' || tier === 'graze' || tier === 'miss') hadBad++; }
    }
  }
  a.ok(sunGood / N >= 0.6, 'Sunlight readability ' + (sunGood / N));
  a.ok(hadBad / N >= 0.6, 'Hadal unassisted ' + (hadBad / N));
});
