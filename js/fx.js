/* fx.js — screen shake only. Cheap, transform-based, honours reduced motion. */
import { motion } from './ui.js';
export function shake(power = 6, ms = 260) {
  if (!motion()) return;
  const stage = document.getElementById('stage');
  stage.animate([
    { transform: 'translate(0,0)' },
    { transform: `translate(${power}px,${-power}px)` },
    { transform: `translate(${-power}px,${power}px)` },
    { transform: 'translate(0,0)' },
  ], { duration: ms, easing: 'ease-out' });
}
