/* run.test.js — the state machine: full scripted run, hull maths, crush path,
   plus the Appendix B worked example as a fixture. */
import { game } from './loader.mjs';
import { test as t } from 'node:test';
import a from 'node:assert';

const F = game();
const CFG = F.config;

function newDaily(dayKey) {
  const seed = F.daily.seed(dayKey);
  F.run.create({ mode: 'daily', seed, dayKey });
  return F.run.state();
}

t.test('create: initial state shape matches the spec', () => {
  const rs = newDaily('2026-10-15');
  a.strictEqual(rs.mode, 'daily');
  a.strictEqual(rs.dayKey, '2026-10-15');
  a.strictEqual(rs.contact, 0);
  a.strictEqual(rs.points, 0);
  a.strictEqual(rs.depthM, 0);
  a.strictEqual(rs.pings, CFG.RUN.pingBudget);
  a.strictEqual(rs.hull, CFG.RUN.hull);
  a.strictEqual(rs.stake, 1);
  a.strictEqual(rs.pickSu, 500);
  a.strictEqual(rs.status, 'playing');
});

t.test('act refuses: unknown action, per-round cap, then budget', () => {
  const rs = newDaily('2026-10-15');
  a.strictEqual(F.run.act('bogus'), false);
  for (let n = 0; n < 5; n++) a.ok(F.run.act('sweep'));
  a.strictEqual(rs.pings, 7);
  a.strictEqual(F.run.act('echo'), false); // per-round cap of 5 reached
  F.run.setPick(rs.contacts[0].truth);
  F.run.lock();
  F.run.next();
  a.ok(F.run.act('gain')); // new round: allowed, spends from the shared budget
  a.strictEqual(rs.pings, 6);
  for (let n = 0; n < 3; n++) a.ok(F.run.act('sweep'));
  a.strictEqual(rs.pings, 3);
  a.strictEqual(F.run.act('echo'), false); // 1 sweep + 1 gain = 3 used this round; echo needs 2 -> cap
});

t.test('Appendix B fixture: midnight contact, echo, pick truth-7, stake 3 => 243 pts / 535 m', () => {
  const rs = newDaily('2026-10-15');
  for (let i = 0; i < 4; i++) {
    F.run.setPick(F.run.state().contacts[rs.contact].truth);
    F.run.lock();
    a.strictEqual(F.run.next(), 'contact');
  }
  const contact = F.run.state().contacts[4];
  a.strictEqual(contact.zone, 'midnight');
  a.ok(F.run.act('echo'));
  F.run.setPick(contact.truth - 7);
  F.run.setStake(3);
  const cr = F.run.lock();
  a.strictEqual(cr.tier, 'bullseye');
  a.strictEqual(cr.errSu, 7);
  a.strictEqual(cr.points, 243);
  a.strictEqual(cr.metres, 535);
  a.strictEqual(cr.hullCost, 0);
  a.strictEqual(cr.pingsUsed, 2);
});

t.test('next() routing: contact -> ... -> results; last contact ends the run', () => {
  const rs = newDaily('2026-10-01');
  for (let i = 0; i < 7; i++) {
    F.run.setPick(rs.contacts[i].truth);
    F.run.lock();
    a.strictEqual(F.run.next(), 'contact');
  }
  F.run.setPick(rs.contacts[7].truth);
  F.run.lock();
  a.strictEqual(F.run.next(), 'results');
  const res = F.run.results();
  a.strictEqual(res.results.length, 8);
  a.strictEqual(res.crushed, false);
  a.ok(res.stakePlan.length === 8);
});

t.test('hull maths: miss costs stake; survey at stake>=2 heals capped at 3', () => {
  const rs = newDaily('2026-10-02');
  // deliberately miss at 1x, then survey-heal at 2x
  const far0 = rs.contacts[0].truth > 500 ? rs.contacts[0].truth - 400 : rs.contacts[0].truth + 400;
  F.run.setPick(far0);
  F.run.setStake(1);
  const m = F.run.lock();
  a.strictEqual(m.tier, 'miss');
  a.strictEqual(m.hullCost, 1);
  a.strictEqual(rs.hull, 2);
  a.strictEqual(F.run.next(), 'contact');
  F.run.setPick(rs.contacts[1].truth);
  F.run.setStake(2);
  const s = F.run.lock();
  a.strictEqual(s.tier, 'survey');
  a.strictEqual(s.surveyHeal, 1);
  a.strictEqual(rs.hull, 3);
});

t.test('crush at hull 0: run ends, depth banked, results stamped crushed', () => {
  const rs = newDaily('2026-10-03');
  for (let i = 0; i < 3; i++) {
    const t0 = rs.contacts[i].truth;
    F.run.setPick(t0 > 500 ? t0 - 400 : t0 + 400);
    F.run.setStake(1);
    const m = F.run.lock();
    a.ok(m.tier === 'miss' && m.hullCost === 1);
    if (i < 2) a.strictEqual(F.run.next(), 'contact');
  }
  a.strictEqual(rs.hull, 0);
  a.strictEqual(rs.status, 'crushed');
  a.strictEqual(F.run.next(), 'crushed');
  const res = F.run.results();
  a.strictEqual(res.crushed, true);
  a.ok(res.depthM >= 0); // banked
});

t.test('points and depth are monotonic across a full run', () => {
  const rs = newDaily('2026-10-04');
  let lastP = 0, lastD = 0;
  for (let i = 0; i < 8; i++) {
    F.run.setPick(rs.contacts[i].truth + 30);
    F.run.setStake(2);
    F.run.lock();
    a.ok(rs.points >= lastP);
    a.ok(rs.depthM >= lastD);
    lastP = rs.points; lastD = rs.depthM;
    if (i < 7) a.strictEqual(F.run.next(), 'contact');
  }
});
