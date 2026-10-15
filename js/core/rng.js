/* rng.js — one deterministic stream per run (plan §5.2).
   mulberry32 + FNV-1a hash. Never call Math.random in core. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  function mulberry32(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  F.rng = {
    mulberry32: mulberry32,
    hashSeed: hashSeed,
    stream: function (seed) { return mulberry32(seed & 0xffffffff); }
  };
})(window.FATHOM);
