/* bed.js — continuous low drone; brightness follows zone (§7.4).
   Sunlight: bright, open fifth. Hadal: sub-bass, detuned. 900 ms cross-fade
   on zone change. No bed at all under reducedAudio. Subscriber only. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var ZONE_ORDER = ['sunlight', 'twilight', 'midnight', 'abyssal', 'hadal'];
  var live = []; /* [{rig, fadeOut(t)}] */

  function spawn(zoneId) {
    var A = F.audio;
    if (!A.ctx || A.muted || A.reducedAudio) return;
    var ctx = A.ctx;
    var i = ZONE_ORDER.indexOf(zoneId);
    if (i < 0) i = 0;
    var t = i / (ZONE_ORDER.length - 1); /* 0 shallow .. 1 deep */

    var g = ctx.createGain();
    g.connect(A.bed);
    var now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.3);

    /* two sustained voices: root + open fifth, detuned with depth */
    var root = 90 - 52 * t;                 /* 90 -> 38 Hz */
    var detune = -180 * t;                 /* cents */

    /* filter cutoff closes with depth: 900 -> 140 Hz */
    var bq = ctx.createBiquadFilter();
    bq.type = 'bandpass';
    bq.frequency.value = 900 - 760 * t;
    bq.connect(g);
    var oscs = [];
    for (var k = 0; k < 2; k++) {
      var o = ctx.createOscillator();
      o.type = k === 0 ? 'sine' : 'triangle';
      o.frequency.value = k === 0 ? root : root * 1.5;
      o.detune.value = detune * (k === 0 ? 1 : 0.6);
      var inner = ctx.createGain();
      o.connect(inner);
      inner.connect(bq);
      o.start(0);
      oscs.push(o);
    }

    live.push({ oscs: oscs, gain: g, ctx: ctx });
  }

  function fadeOutOld() {
    if (!live.length) return;
    var old = live.shift();
    var now = old.ctx.currentTime;
    old.gain.linearRampToValueAtTime(0, now + 0.9); /* 900 ms cross-fade */
    for (var i = 0; i < old.oscs.length; i++) old.oscs[i].stop(now + 1.0);
  }

  F.bus.on('run:zone', function (p) {
    fadeOutOld();
    spawn(p.zone);
  });
})(window.FATHOM);
