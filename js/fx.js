/* fx.js — the juice: screen shake, burst particles, and the reveal sweep.
   All transform/opacity only; every effect checks reduced motion itself. */
function shake(power = 6, ms = 260) {
  if (!motion()) return;
  const stage = document.getElementById('stage');
  stage.animate([
    { transform: 'translate(0,0)' },
    { transform: `translate(${power}px,${-power}px)` },
    { transform: `translate(${-power}px,${power}px)` },
    { transform: 'translate(0,0)' },
  ], { duration: ms, easing: 'ease-out' });
}
function burst(x, y, n = 10, color = 'rgba(47,212,255,0.9)') {
  if (!motion()) return;
  const layer = document.getElementById('stage');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.style.cssText = 'position:absolute;left:0;top:0;width:6px;height:6px;border-radius:50%;' +
      `background:${color};transform:translate(${x}px,${y}px);pointer-events:none`;
    layer.appendChild(p);
    const angle = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 26 + Math.random() * 42;
    p.animate([
      { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 },
      { transform: `translate(${x + Math.cos(angle) * dist}px,${y + Math.sin(angle) * dist}px) scale(.4)`, opacity: 0 },
    ], { duration: 480 + Math.random() * 240, easing: 'cubic-bezier(.1,.7,.3,1)' });
  }
}
function reveal(targetM, mapRect) {
  if (!motion()) return;
  const stage = document.getElementById('stage');
  const y = mapRect.top + (targetM / 1000) * mapRect.height;
  const w = mapRect.width;
  const sweep = document.createElement('div');
  sweep.style.cssText = 'position:absolute;height:2px;top:0;left:0;width:100%;pointer-events:none;' +
    'background:linear-gradient(90deg,transparent,var(--amber),transparent);' +
    `transform:translate(${mapRect.left}px,${y}px) scaleX(0);transform-origin:left center`;
  stage.appendChild(sweep);
  sweep.animate([
    { transform: `translate(${mapRect.left}px,${y}px) scaleX(0)`, opacity: 1 },
    { transform: `translate(${mapRect.left}px,${y}px) scaleX(1)`, opacity: 1, offset: 0.6 },
    { transform: `translate(${mapRect.left}px,${y}px) scaleX(1)`, opacity: 0 },
  ], { duration: 420, easing: 'ease-out' });
}
