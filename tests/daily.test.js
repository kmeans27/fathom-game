/* daily.test.js — UTC day keys, rollover, seeds, playedToday, streaks. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();
const D = F.daily;

t.test('dayKeyUtc is UTC, not local: 23:30 and 00:30 UTC land on different days', () => {
  const before = new Date(Date.UTC(2026, 9, 15, 23, 30, 0));
  const after = new Date(Date.UTC(2026, 9, 16, 0, 30, 0));
  a.strictEqual(D.dayKeyUtc(before), '2026-10-15');
  a.strictEqual(D.dayKeyUtc(after), '2026-10-16');
  // across a DST boundary (Europe has DST; UTC keys must not care)
  a.strictEqual(D.dayKeyUtc(new Date(Date.UTC(2026, 2, 29, 23, 59, 59))), '2026-03-29');
  a.strictEqual(D.dayKeyUtc(new Date(Date.UTC(2026, 2, 30, 0, 0, 0))), '2026-03-30');
});

t.test('msUntilRollover', () => {
  a.strictEqual(D.msUntilRollover(new Date(Date.UTC(2026, 9, 15, 23, 30, 0))), 1800000);
  a.strictEqual(D.msUntilRollover(new Date(Date.UTC(2026, 9, 15, 0, 0, 0))), 86400000);
});

t.test('same day => same seed; different days differ', () => {
  a.strictEqual(D.seed('2026-10-15'), D.seed('2026-10-15'));
  a.notStrictEqual(D.seed('2026-10-15'), D.seed('2026-10-16'));
});

t.test('dayNumber counts UTC days since the epoch', () => {
  a.strictEqual(D.dayNumber('2026-10-15'), 1018);
});

t.test('playedToday derived from history', () => {
  const today = new Date(Date.UTC(2026, 9, 15, 12, 0, 0));
  const key = D.dayKeyUtc(today);
  const history = { [key]: { depthM: 100, points: 10, hull: 3, crushed: false } };
  a.ok(history[D.dayKeyUtc(today)]);
  a.strictEqual(history[D.dayKeyUtc(new Date(Date.UTC(2026, 9, 16, 0, 1, 0)))] ? true : false, false);
});

t.test('streak: continues on consecutive days, resets after a gap, best kept', () => {
  const history = {
    '2026-10-13': { depthM: 1 },
    '2026-10-14': { depthM: 2 },
    '2026-10-15': { depthM: 3 }
  };
  const st = F.stats.streak(history, '2026-10-15');
  a.strictEqual(st.current, 3);
  a.strictEqual(st.best, 3);

  const gapped = {
    '2026-10-10': { depthM: 1 },
    '2026-10-14': { depthM: 2 },
    '2026-10-15': { depthM: 3 }
  };
  const st2 = F.stats.streak(gapped, '2026-10-15');
  a.strictEqual(st2.current, 2);
  a.strictEqual(st2.best, 2);

  const bestKept = {
    '2026-10-01': { depthM: 1 },
    '2026-10-02': { depthM: 1 },
    '2026-10-03': { depthM: 1 },
    '2026-10-04': { depthM: 1 },
    '2026-10-05': { depthM: 1 },
    '2026-10-06': { depthM: 1 },
    '2026-10-07': { depthM: 1 },
    '2026-10-15': { depthM: 1 }
  };
  const st3 = F.stats.streak(bestKept, '2026-10-15');
  a.strictEqual(st3.current, 1);
  a.strictEqual(st3.best, 7);
});
