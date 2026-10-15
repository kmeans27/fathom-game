/* ui.js — every DOM node, the depth map, and the input controls.
   The map is a vertical ruler: 0 m at the top, 1000 m at the bottom.
   Guessing is one drag on that ruler, so the whole game is one gesture. */
let reduceMotion = false;
function motion() {
  return !reduceMotion && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}
const els = {};
function build() {
  const ui = document.getElementById('ui');
  ui.innerHTML = `
    <div class="masthead"><h1>FATHOM</h1><p class="tagline">a daily depth game</p></div>
    <div class="modes">
      <button class="btn" data-mode="daily">Daily Dive</button>
      <button class="btn" data-mode="endless">Endless Dive</button>
    </div>
    <div class="hud">
      <div class="hud-points">— / 700</div>
      <div class="hud-pings">—</div>
      <div class="hud-round">—</div>
    </div>
    <div class="map" role="img" aria-label="depth map from 0 to 1000 metres">
      <div class="map-band"></div>
      <div class="map-target"></div>
      <div class="map-mark"></div>
    </div>
    <div class="card"><h2 class="card-name"></h2><p class="card-flavour"></p></div>
    <div class="controls">
      <button class="btn" data-act="sweep">Sonar sweep</button>
      <button class="btn" data-act="echo">Echo</button>
      <button class="btn" data-act="commit">Lock in</button>
    </div>
    <div class="log"></div>
    <div class="sharewrap"><button class="btn" data-act="copy">Copy result</button><pre class="share"></pre></div>
  `;
  /* one lookup table instead of querySelector calls in the game loop */
  for (const id of ['map-band', 'map-target', 'map-mark', 'card-name', 'card-flavour',
                   'hud-points', 'hud-pings', 'hud-round', 'log', 'share']) {
    els[id] = ui.querySelector('.' + id);
  }
}
function pct(m) { return (m / TRENCH.depthMax) * 100; }
function setBand(lo, hi) {
  const band = els['map-band'];
  band.style.top = pct(lo) + '%';
  band.style.height = pct(hi - lo) + '%';
}
function setActionEnabled(act, on) {
  const btn = document.querySelector(`[data-act="${act}"]`);
  if (btn) btn.disabled = !on;
}
function clearBand() { els['map-band'].style.display = 'none'; }
function placeMark(m) { els['map-mark'].style.top = pct(m) + '%'; }
function revealTarget(m) {
  const t = els['map-target'];
  t.style.visibility = 'visible';
  t.style.top = pct(m) + '%';
}
function hideTarget() { els['map-target'].style.visibility = 'hidden'; }
function setCard(name, flavour) {
  els['card-name'].textContent = name;
  els['card-flavour'].textContent = flavour;
}
function setHud(points, pings, round) {
  els['hud-points'].textContent = `${points} / ${TRENCH.maxPoints}`;
  els['hud-pings'].textContent = `${pings} pings left`;
  els['hud-round'].textContent = `round ${round} of ${TRENCH.rounds}`;
}
function logLine(text, tier = null) {
  const line = document.createElement('div');
  line.className = 'log-line';
  if (tier) line.dataset.tier = tier;
  line.textContent = text;
  els['log'].appendChild(line);
}
function setShare(text) { els['share'].textContent = text; }
function banner(text) {
  const b = document.createElement('div');
  b.className = 'banner';
  b.textContent = text;
  document.getElementById('ui').appendChild(b);
  return b;
}
