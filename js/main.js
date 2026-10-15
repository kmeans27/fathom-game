/* main.js — the run loop. Owns state, wires the other modules.
   One gesture: drag the marker on the depth map, then choose info or commit. */

let state = null;

function refreshActions() {
  setActionEnabled('sweep', canSweep(state));
  setActionEnabled('echo', canEcho(state));
}

function start(mode, seed, label) {
  const rounds = generateRounds(seed);
  state = { rounds, i: 0, points: 0, pings: TRENCH.pingBudget, results: [], mode, label, lo: 0, hi: TRENCH.depthMax };
  document.getElementById('sea').style.setProperty('--depth', '0');
  banner(`DIVE #${label}`);
  openRound();
}

function openRound() {
  const r = state.rounds[state.i];
  state.lo = 0;
  state.hi = TRENCH.depthMax;
  state.roundPings = state.pings;
  state.guess = Math.round(TRENCH.depthMax / 2);
  setCard(r.name, r.flavour);
  setHud(state.points, state.pings, state.i + 1);
  clearBand();
  hideTarget();
  placeMark(TRENCH.depthMax / 2);
  refreshActions();
}

function commit() {
  const r = state.rounds[state.i];
  const guess = state.guess;
  const pingsUsed = state.roundPings - state.pings;
  const res = evaluate(guess, r.target, pingsUsed);
  const mapRect = document.querySelector('.map').getBoundingClientRect();
  const y = mapRect.top + (r.target / TRENCH.depthMax) * mapRect.height;
  logLine(`target ${r.target} m · you ${guess} m · ${res.err} m off · ${res.tier} +${res.points}`, res.tier);
  revealTarget(r.target);
  reveal(r.target, mapRect);
  if (res.tier !== 'miss') {
    burst(mapRect.left + mapRect.width / 2, y, res.tier === 'perfect' ? 18 : res.tier === 'bullseye' ? 12 : 8);
    hitSound(res.tier);
    const d = document.getElementById('sea');
    d.style.setProperty('--depth', String(state.points + res.points));
  } else {
    hitSound('miss');
  }
  shake(res.tier === 'perfect' ? 8 : 4);
    state.points += res.points;
  state.results.push({ tier: res.tier, pings: pingsUsed, target: r.target, guess });
  state.i++;
  if (state.i >= TRENCH.rounds) return finish();
  openRound();
}

function finish() {
  const label = state.label;
  const depth = state.points * TRENCH.pointsPerMetre;
  const txt = shareText(Number(label), state.results, state.points);
  setShare(txt);
  banner(`${depth} m — ${state.points} points`);
  fanfare();
  if (state.mode === 'daily') recordDaily(Number(label), state.points, depth, state.results, null);
}

function boot() {
  build();
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
    if (!state) return;
    const rect = map.getBoundingClientRect();
    const y = (ev.clientY ?? ev.touches?.[0]?.clientY ?? 0) - rect.top;
    state.guess = Math.round((y / rect.height) * TRENCH.depthMax);
    placeMark(state.guess);
  };
  map.addEventListener('pointermove', (e) => { if (e.buttons) onPoint(e); });
  map.addEventListener('pointerdown', onPoint);
  map.addEventListener('touchstart', onPoint);
  document.querySelector('[data-act="sweep"]')?.addEventListener('click', () => {
    if (!state || !canSweep(state)) return;
    const r = state.rounds[state.i];
    state = sweep(state, r.target);
    setBand(state.lo, state.hi);
    setHud(state.points, state.pings, state.i + 1);
    hitSound('graze');
    refreshActions();
  });
  document.querySelector('[data-act="echo"]')?.addEventListener('click', () => {
    if (!state || !canEcho(state)) return;
    const r = state.rounds[state.i];
    state = echo(state, r.target);
    setBand(state.lo, state.hi);
    setHud(state.points, state.pings, state.i + 1);
    hitSound('bullseye');
    refreshActions();
  });
  document.querySelector('[data-act="commit"]')?.addEventListener('click', commit);
}
try {
  boot();
} catch (e) {
  const ui = document.getElementById('ui');
  const d = document.createElement('div');
  d.textContent = 'LOAD ERROR: ' + e.message;
  ui.appendChild(d);
}
