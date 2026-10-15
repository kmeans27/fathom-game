/* audio.js — tiny WebAudio pings. No files, no autoplay, fully optional.
   Pads carry a low fifth so hits read as sonar, not beeps. */
let audioCtx = null;
function initAudio() {
  try { audioCtx = new AudioContext(); } catch { audioCtx = null; }
}
function tone(freq, dur, peak = 0.1, type = 'sine') {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(peak, audioCtx.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  osc.connect(gain);
  osc.start();
  osc.stop(audioCtx.currentTime + dur + 0.05);
}
function ping(pitch = 0.18) {
  const f = 1 / pitch;
  tone(f, 0.55, 0.1);
  tone(f / 2, 0.4, 0.05);
}
function thud() {
  tone(70, 0.25, 0.18, 'triangle');
  tone(46, 0.3, 0.12, 'triangle');
}
function hitSound(tier) {
  if (tier === 'perfect') { ping(0.1); ping(0.16); tone(1600, 0.5, 0.06); }
  else if (tier === 'bullseye') ping(0.14);
  else if (tier === 'hit') ping(0.22);
  else if (tier === 'graze') tone(320, 0.4, 0.06);
  else thud();
}
function fanfare() {
  const notes = [523, 659, 784, 1046];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.4, 0.07);
}
