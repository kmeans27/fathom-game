/* audio.js — tiny WebAudio pings. No files, no autoplay, fully optional. */
export let audioCtx = null;
export function initAudio() {
  try { audioCtx = new AudioContext(); } catch { audioCtx = null; }
}
export function ping(pitch = 0.18) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 1 / pitch;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
  osc.connect(gain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.65);
}
export function thud() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 70;
  gain.gain.value = 0.18;
  osc.connect(gain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}
