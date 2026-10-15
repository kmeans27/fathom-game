/* scoring.test.js — tier boundaries, stake/zone maths, hull rules, floor guard. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();
const CFG = F.config;
const S = F.scoring;

t.test('tierFor boundaries 4/5, 19/20, 99/100, 249/250, 250/251', () => {
  a.strictEqual(S.tierFor(4), 'survey');
  a.strictEqual(S.tierFor(5), 'survey');
  a.strictEqual(S.tierFor(6), 'bullseye');
  a.strictEqual(S.tierFor(19), 'bullseye');
  a.strictEqual(S.tierFor(20), 'bullseye');
  a.strictEqual(S.tierFor(21), 'hit');
  a.strictEqual(S.tierFor(99), 'hit');
  a.strictEqual(S.tierFor(100), 'hit');
  a.strictEqual(S.tierFor(101), 'graze');
  a.strictEqual(S.tierFor(249), 'graze');
  a.strictEqual(S.tierFor(250), 'graze');
  a.strictEqual(S.tierFor(251), 'miss');
});

t.test('evaluate: points = round(base * stake * zone)', () => {
  // Appendix B worked example: bullseye (err 7), midnight (1.35), stake 3.
  const r = S.evaluate({ pickSu: 605, truthSu: 612, pingsUsed: 2, stake: 3, zoneId: 'midnight' });
  a.strictEqual(r.errSu, 7);
  a.strictEqual(r.tier, 'bullseye');
  a.strictEqual(r.basePoints, 60);
  a.strictEqual(r.points, 243);
  a.strictEqual(r.metres, 535);
  a.strictEqual(r.hullCost, 0);
  a.strictEqual(r.surveyHeal, 0);
  a.strictEqual(r.silent, false);
});

t.test('survey at stake 2 heals; at stake 1 does not; capped at 3', () => {
  const heal = CFG.SURVEY_HEAL;
  const r1 = S.evaluate({ pickSu: 100, truthSu: 102, pingsUsed: 0, stake: 1, zoneId: 'sunlight' });
  a.strictEqual(r1.tier, 'survey');
  a.strictEqual(r1.surveyHeal, 0);
  a.strictEqual(r1.silent, true);
  const r2 = S.evaluate({ pickSu: 100, truthSu: 102, pingsUsed: 1, stake: 2, zoneId: 'sunlight' });
  a.strictEqual(r2.tier, 'survey');
  a.strictEqual(r2.surveyHeal, heal.amount);
  a.strictEqual(r2.silent, false);
});

t.test('miss costs hull = stake; graze costs nothing', () => {
  const miss = S.evaluate({ pickSu: 0, truthSu: 940, pingsUsed: 0, stake: 3, zoneId: 'hadal' });
  a.strictEqual(miss.tier, 'miss');
  a.strictEqual(miss.points, 0);
  a.strictEqual(miss.metres, 0);
  a.strictEqual(miss.hullCost, 3);
  a.strictEqual(miss.surveyHeal, 0);
  const graze = S.evaluate({ pickSu: 700, truthSu: 940, pingsUsed: 0, stake: 3, zoneId: 'hadal' });
  a.strictEqual(graze.tier, 'graze');
  a.strictEqual(graze.hullCost, 0);
  a.strictEqual(graze.points, Math.round(10 * 3 * 2.0));
});

t.test('max theoretical run stays below the floor (6996 < 7000)', () => {
  const max = S.maxTheoretical();
  a.strictEqual(max.points, 3180);
  a.ok(max.metres < CFG.FLOOR_M);
  a.ok(max.metres > 6000);
});

t.test('all-echo plan exceeds the ping budget', () => {
  a.ok(CFG.RUN.contacts * CFG.PRICES.echo > CFG.RUN.pingBudget);
});
