/* stats.test.js — bests ignore crushed runs; achievements unlock; streak maths. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();
const CFG = F.config;

function fullRun(over) {
  const base = { crushed: false, pingsLeft: 0, hull: 3, results: [], stakePlan: [] };
  return Object.assign(base, over);
}

t.test('best() skips crushed runs', () => {
  const history = {
    '2026-10-14': { depthM: 9999, points: 1, hull: 0, crushed: true },
    '2026-10-15': { depthM: 500, points: 100, hull: 3, crushed: false }
  };
  const b = F.stats.best(history);
  a.strictEqual(b.depthM, 500);
  a.strictEqual(b.dayKey, '2026-10-15');
});

t.test('achievements unlock per definition', () => {
  const runs = [];
  // touch-the-floor: deep non-crushed run
  runs.push(fullRun({ depthM: 6600 }));
  // cold-blood: finished at exactly 1 hull
  runs.push(fullRun({ hull: 1 }));
  // all-in: every contact staked 3x
  runs.push(fullRun({ stakePlan: [3, 3, 3, 3, 3, 3, 3, 3] }));
  // hull-holds: full contacts, no misses, full hull
  runs.push(fullRun({
    hull: CFG.RUN.hull,
    results: Array(CFG.RUN.contacts).fill({ tier: 'hit', hullCost: 0, silent: false })
  }));
  // no-waste + silent-survey: zero pings used across a full run, one survey silent
  runs.push(fullRun({
    pingsLeft: CFG.RUN.pingBudget,
    results: Array(CFG.RUN.contacts).fill({ tier: 'survey', silent: true })
  }));
  const history = {};
  for (let i = 0; i < runs.length; i++) history['2026-01-0' + i] = runs[i];
  const unlocked = F.stats.achievements(history, null);
  for (const want of ['touch-the-floor', 'cold-blood', 'all-in', 'hull-holds', 'no-waste', 'silent-survey']) {
    a.ok(unlocked.indexOf(want) !== -1, want + ' unlocked');
  }

  // streak-7 via history continuity
  const hist7 = {};
  for (let i = 1; i <= 7; i++) hist7['2026-02-0' + i] = { depthM: 1, crushed: false };
  const u2 = F.stats.achievements(hist7, null);
  a.ok(u2.indexOf('streak-7') !== -1);
});

t.test('a crushed run can never set a personal best (run -> storage -> stats)', () => {
  const rs = F.run.create({ mode: 'daily', seed: F.daily.seed('2026-10-15'), dayKey: '2026-10-15' });
  for (let i = 0; i < 3; i++) {
    F.run.setPick(rs.contacts[i].truth + 400);
    F.run.setStake(3);
    F.run.lock();
    if (i < 2) F.run.next();
  }
  const res = F.run.results();
  a.strictEqual(res.crushed, true);
  const history = { '2026-10-15': { depthM: res.depthM, points: res.points, hull: 0, crushed: true } };
  a.strictEqual(F.stats.best(history), null);
});

t.test('summarize: histogram sorted by dayKey, totals', () => {
  const history = {
    '2026-10-15': { depthM: 300, crushed: false },
    '2026-10-13': { depthM: 100, crushed: false },
    '2026-10-14': { depthM: 200, crushed: false }
  };
  const s = F.stats.summarize(history);
  a.strictEqual(s.runs, 3);
  a.strictEqual(s.totalDepthM, 600);
  a.strictEqual(s.histogram.map(h => h.dayKey).join(','), '2026-10-13,2026-10-14,2026-10-15');
});
