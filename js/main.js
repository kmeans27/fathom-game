/* main.js — the run loop. Owns state, wires the other modules.
   One gesture: drag the marker on the depth map, then choose info or commit. */
import { TRENCH } from './balance.js';
import { generateRounds, dailySeed } from './rounds.js';
import { evaluate } from './score.js';
import { sweep, echo, canSweep, canEcho } from './sonar.js';
import { shareText } from './share.js';
import { recordDaily } from './save.js';
import { shake } from './fx.js';
import { initAudio, ping, thud } from './audio.js';
import * as UI from './ui.js';

let state = null;

function start(mode, seed, label) {
  const rounds = generateRounds(seed);
  state = { rounds, i: 0, points: 0, pings: TRENCH.pingBudget, results: [], mode, label, lo: 0, hi: TRENCH.depthMax };
  document.getElementById('sea').style.setProperty('--depth', '0');
  UI.banner(`DIVE #${label}`);
  openRound();
}

function openRound() {
  const r = state.rounds[state.i];
  state.lo = 0;
  state.hi = TRENCH.depthMax;
  state.used = 0;
  UI.setCard(r.name, r.flavour);
  UI.setHud(state.points, state.pings, state.i + 1);
  UI.clearBand();
  UI.hideTarget();
  UI.placeMark(TRENCH.depthMax / 2);
  UI.logLine('');
}

function commit() {
  const r = state.rounds[state.i];
  const guess = state.guess;
  const pingsUsed = TRENCH.pingBudget - state.pings - state.used;
  const res = evaluate(guess, r.target, pingsUsed);
  UI.revealTarget(r.target);
  UI.logLine(`target ${r.target} m · you ${guess} m · ${res.err} m off · ${res.tier} +${res.points}`);
  state.points += res.points;
  state.results.push({ tier: res.tier, pings: pingsUsed, target: r.target, guess });
  if (res.tier !== 'miss') {
    ping(0.12);
    const d = document.getElementById('sea');
    d.style.setProperty('--depth', String(state.points));
  } else { thud(); }
  shake(res.tier === 'perfect' ? 8 : 4);
  state.i++;
  if (state.i >= TRENCH.rounds) return finish();
  openRound();
}

function finish() {
  const label = state.label;
  const depth = state.points * TRENCH.pointsPerMetre;
  const txt = shareText(Number(label), state.results, state.points);
  UI.setShare(txt);
  UI.banner(`${depth} m — ${state.points} points`);
  if (state.mode === 'daily') recordDaily(Number(label), state.points, depth, state.results, null);
}

export function boot() {
  UI.build();
  initAudio();
  const now = new Date();
  const n = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  document.querySelector('[data-mode="daily"]')?.addEventListener('click', () => start('daily', dailySeed(now), String(n)));
  document.querySelector('[data-mode="endless"]')?.addEventListener('click', () => start('endless', Math.floor(Math.random() * 1e9), '0000'));
  document.querySelector('[data-act="copy"]')?.addEventListener('click', () => {
    if (state) navigator.clipboard?.writeText(shareText(Number(state.label), state.results, state.points));
  });
  const map = document.querySelector('.map');
  const onPoint = (ev) => {
    const rect = map.getBoundingClientRect();
    const y = (ev.clientY ?? ev.touches?.[0]?.clientY ?? 0) - rect.top;
    state.guess = Math.round((y / rect.height) * TRENCH.depthMax);
    UI.placeMark(state.guess);
  };
  map.addEventListener('pointermove', (e) => { if (e.buttons) onPoint(e); });
  map.addEventListener('pointerdown', onPoint);
  map.addEventListener('touchstart', onPoint);
  document.querySelector('[data-act="sweep"]')?.addEventListener('click', () => {
    if (!state) return;
    const r = state.rounds[state.i];
    if (!canSweep(state)) return;
    state = sweep(state, r.target);
    UI.setBand(state.lo, state.hi);
    UI.setHud(state.points, state.pings, state.i + 1);
    ping(0.3);
  });
  document.querySelector('[data-act="echo"]')?.addEventListener('click', () => {
    if (!state) return;
    const r = state.rounds[state.i];
    if (!canEcho(state)) return;
    state = echo(state, r.target);
    UI.setBand(state.lo, state.hi);
    UI.setHud(state.points, state.pings, state.i + 1);
    ping(0.09);
  });
  document.querySelector('[data-act="commit"]')?.addEventListener('click', commit);
}
boot();
