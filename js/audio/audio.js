/* audio.js — WebAudio engine: no files, all synthesis (§7.4).
   Engine starts only on the first gesture; master -> {sfx, bed} + sonar tail
   (DelayNode + feedback GainNode, ~0.6 s). Voice pool capped at 12. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var MAX_VOICES = 12;

  var A = {
    ctx: null,
    master: null, sfx: null, bed: null,
    tail: null, tailFeedback: null,
    liveVoices: 0,
    started: false,
    muted: false,
    reducedAudio: false
  };

  function ensure() {
    if (A.started) return A.ctx;
    try {
      if (!window.AudioContext) return null;
      var ctx = new AudioContext();
      A.ctx = ctx;
      A.master = ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(ctx.destination);
      A.sfx = ctx.createGain(); A.sfx.gain.value = 0.8; A.sfx.connect(A.master);
      A.bed = ctx.createGain(); A.bed.gain.value = 0.3; A.bed.connect(A.master);
      /* sonar tail: delay + feedback loop (no ConvolverNode impulse files) */
      A.tail = ctx.createDelay(1.0); A.tail.delayTime.value = 0.18; /* 3 bounces ≈ 0.6 s */
      A.tailFeedback = ctx.createGain(); A.tailFeedback.gain.value = 0.55;
      A.sfx.connect(A.tail);
      A.tail.connect(A.tailFeedback);
      A.tailFeedback.connect(A.tail);
      A.tailFeedback.connect(A.master);
      A.started = true;
      var prefs = F.storage.read().prefs;
      A.muted = !!prefs.mute;
      A.reducedAudio = !!prefs.reducedAudio;
    } catch (e) { A.ctx = null; }
    return A.ctx;
  }

  function voice(dur) {
    /* returns a fresh source-ready env or null if the pool is exhausted/muted */
    if (!ensure()) return null;
    if (A.muted) return null;
    if (A.liveVoices >= MAX_VOICES) return null;
    A.liveVoices++;
    var ctx = A.ctx;
    var g = ctx.createGain();
    g.connect(A.sfx);
    return { ctx: ctx, out: g, start: ctx.currentTime, end: ctx.currentTime + dur };
  }

  function done() { A.liveVoices = Math.max(0, A.liveVoices - 1); }

  A.play = function (name, payload) {
    var env = voice(payload.dur || 0.4);
    if (!env) return;
    try {
      if (name === 'ping') {
        /* sine, pitch encodes scope y: shallow = higher */
        var f = 300 + 500 * (1 - (payload.su || 500) / F.config.SCOPE.maxSu);
        var o = env.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        o.connect(env.out);
        env.out.gain.setValueAtTime(0.0, env.start);
        env.out.gain.exponentialRampToValueAtTime(0.5, env.start + 0.01);
        env.out.gain.exponentialRampToValueAtTime(0.001, env.start + 0.45);
        o.start(0); o.stop(env.start + 0.5);
        done(); return;
      }
      if (name === 'sweep') {
        /* band-passed noise sweep, short */
        var n = env.ctx.createOscillator(); n.type = 'triangle';
        n.frequency.setValueAtTime(200, env.start);
        n.frequency.exponentialRampToValueAtTime(1200, env.start + 0.18);
        n.connect(env.out);
        env.out.gain.setValueAtTime(0.25, env.start);
        env.out.gain.exponentialRampToValueAtTime(0.001, env.start + 0.22);
        n.start(0); n.stop(env.start + 0.25);
        done(); return;
      }
      if (name === 'echo') {
        /* two-tone interval (a fifth), longer tail */
        var base = 320;
        [base, base * 1.5].forEach(function (f, k) {
          var o = env.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
          o.connect(env.out);
          env.out.gain.setValueAtTime(0.3, env.start + k * 0.06);
          env.out.gain.exponentialRampToValueAtTime(0.001, env.start + 0.7);
          o.start(0); o.stop(env.start + 0.75);
        });
        done(); return;
      }
      if (name === 'gain') {
        /* rising filtered shimmer */
        var o2 = env.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 700;
        var fl = env.ctx.createGain();
        o2.connect(fl); fl.connect(env.out);
        fl.gain.value = 0.4;
        o2.frequency.exponentialRampToValueAtTime(1400, env.start + 0.35);
        env.out.gain.setValueAtTime(0.2, env.start);
        env.out.gain.exponentialRampToValueAtTime(0.001, env.start + 0.4);
        o2.start(0); o2.stop(env.start + 0.45);
        done(); return;
      }
      if (name === 'tier') {
        var notes = { survey: [523, 659, 784, 1046], bullseye: [659, 784, 1046],
          hit: [784, 1046], graze: [523], miss: [70], silent: [390] }[payload.tier];
        var step = payload.tier === 'miss' ? 0 : 0.09;
        for (var i = 0; i < notes.length; i++) {
          var t = env.ctx.createOscillator();
          t.type = payload.tier === 'miss' ? 'triangle' : 'sine';
          t.frequency.value = notes[i];
          if (payload.tier === 'miss') t.frequency.value = 70; /* thud */
          t.connect(env.out);
          var t0 = env.start + i * step;
          env.out.gain.setValueAtTime(0.35, t0);
          env.out.gain.exponentialRampToValueAtTime(0.001, t0 + (payload.tier === 'miss' ? 0.3 : 0.5));
          t.start(0); t.stop(t0 + 0.55);
          if (payload.tier === 'miss' && i === 0) {
            var sub = env.ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 46;
            sub.connect(env.out); sub.start(0); sub.stop(env.start + 0.3);
          }
        }
        done(); return;
      }
      if (name === 'hull') {
        /* hull-crack noise burst */
        var c = env.ctx.createOscillator(); c.type = 'triangle'; c.frequency.value = 90;
        c.connect(env.out);
        env.out.gain.setValueAtTime(0.5, env.start);
        env.out.gain.exponentialRampToValueAtTime(0.001, env.start + 0.35);
        c.start(0); c.stop(env.start + 0.4);
        done(); return;
      }
    } catch (e) { done(); }
  };

  A.setMuted = function (m) {
    A.muted = !!m;
    var st = F.storage.read();
    st.prefs.mute = A.muted;
    F.storage.write(st);
  };
  A.setReducedAudio = function (r) {
    A.reducedAudio = !!r;
    var st = F.storage.read();
    st.prefs.reducedAudio = A.reducedAudio;
    F.storage.write(st);
  };

  F.audio = A;
})(window.FATHOM);
