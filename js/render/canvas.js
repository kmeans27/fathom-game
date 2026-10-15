/* canvas.js — DPR-aware sizing, one RAF loop, ordered layer registry (§5.3).
   Every renderer module registers a layer; only this file drives frames. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var C = {
    canvas: null, ctx: null,
    w: 0, h: 0, dpr: 1,
    layers: [],                 // ordered [{name, fn}]
    state: {                   // mutable frame state; renderers read this
      zone: 'sunlight',
      contact: null,           // {truth, sigma, i} — renderer may read world truth
      round: null,             // RoundState from F.sonar.init
      pick: 500,
      reveal: null,            // {truthSu, t0} set on lock
      pings: [],               // [{su, t0, kind}] — ping arcs
      rngSeed: 0               // per-contact seed for stable scatter offsets
    },
    quality: 1.0,
    started: false
  };

  function resize() {
    var el = C.canvas;
    if (!el) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth, h = window.innerHeight;
    if (w !== C.w || h !== C.h || dpr !== C.dpr) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      C.w = w; C.h = h; C.dpr = dpr;
      C.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  C.init = function (canvasEl) {
    C.canvas = canvasEl;
    C.ctx = canvasEl.getContext('2d');
    resize();
    if (!C.started) {
      C.started = true;
      requestAnimationFrame(loop);
    }
  };

  C.register = function (name, fn) {
    C.layers.push({ name: name, fn: fn });
  };

  function loop() {
    requestAnimationFrame(loop);
    resize();
    if (!C.ctx) return;
    var frame = { ctx: C.ctx, w: C.w, h: C.h, dpr: C.dpr, t: performance.now() };
    for (var i = 0; i < C.layers.length; i++) {
      try { C.layers[i].fn(frame, C.state); } catch (e) { /* one bad layer must not kill the rest */ }
    }
  }

  F.canvas = C;
})(window.FATHOM);
