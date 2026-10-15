/* smoke.mjs — end-to-end headless run through F.run (plan §10.3).
   Run: node tests/smoke.mjs */
import { game } from './loader.mjs';

const F = game();
const dayKey = '2026-10-15';
const seed = F.daily.seed(dayKey);
F.run.create({ mode: 'daily', seed, dayKey });

let steps = 0;
for (let i = 0; i < 8; i++) {
  const rs = F.run.state();
  const truth = rs.contacts[rs.contact].truth;
  F.run.act('gain');                       // one judgement buy per contact
  F.run.setPick(truth + (i % 2 ? 12 : -12)); // deliberate jitter
  F.run.setStake(2);
  const cr = F.run.lock();
  if (!cr) throw new Error('lock failed at contact ' + i);
  steps++;
  const where = F.run.next();
  if (where === 'crushed' || where === 'results') break;
}

const res = F.run.results();
if (!(res.results.length === steps)) throw new Error('expected ' + steps + ' resolved contacts');
if (res.points < 0 || res.depthM < 0) throw new Error('negative score');
if (res.hull < 0) throw new Error('negative hull');
if (res.pingsLeft < 0) throw new Error('negative pings');
const txt = F.share.text(res);
console.log('SMOKE OK: contacts=' + res.results.length +
  ' points=' + res.points + ' depthM=' + res.depthM +
  ' hull=' + res.hull + ' pingsLeft=' + res.pingsLeft +
  ' crushed=' + res.crushed + '\n' + txt);
