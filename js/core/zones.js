/* zones.js — the escalation table (plan §4) plus per-zone art data (§7.2).
   Zone by contact index is the run's spine; zone by depth only drives the camera. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  var ZONE_DATA = {
    sunlight: {
      id: 'sunlight', label: 'SUNLIGHT', fromM: 0, toM: 200,
      mult: 1.00, sigma: 22, decoys: 0,
      palette: { top: '#0a4b74', bottom: '#0d6d9c', glow: '#37e0ff', fog: 'rgba(255,255,255,0.05)' },
      fauna: [{ kind: 'fish-school', count: 14 }],
      rays: 1.0, snow: 0.25, vignette: 0.0
    },
    twilight: {
      id: 'twilight', label: 'TWILIGHT', fromM: 200, toM: 1000,
      mult: 1.15, sigma: 34, decoys: 1,
      palette: { top: '#06294a', bottom: '#04182f', glow: '#2a7fa8', fog: 'rgba(120,180,255,0.04)' },
      fauna: [{ kind: 'jellyfish', count: 4 }],
      rays: 0.45, snow: 0.5, vignette: 0.15
    },
    midnight: {
      id: 'midnight', label: 'MIDNIGHT', fromM: 1000, toM: 4000,
      mult: 1.35, sigma: 52, decoys: 1,
      palette: { top: '#010a16', bottom: '#01060f', glow: '#1aa0c8', fog: 'rgba(90,160,255,0.03)' },
      fauna: [{ kind: 'lanternfish', count: 6 }, { kind: 'siphonophore', count: 1 }],
      rays: 0.0, snow: 0.85, vignette: 0.3
    },
    abyssal: {
      id: 'abyssal', label: 'ABYSSAL', fromM: 4000, toM: 6000,
      mult: 1.60, sigma: 74, decoys: 2,
      palette: { top: '#00040a', bottom: '#000205', glow: '#ffd479', fog: 'rgba(60,120,200,0.02)' },
      fauna: [{ kind: 'anglerfish', count: 1 }, { kind: 'isopod', count: 2 }],
      rays: 0.0, snow: 0.35, vignette: 0.45
    },
    hadal: {
      id: 'hadal', label: 'HADAL', fromM: 6000, toM: 7000,
      mult: 2.00, sigma: 100, decoys: 2,
      palette: { top: '#000103', bottom: '#000001', glow: '#ff5b5b', fog: 'rgba(30,60,90,0.02)' },
      fauna: [{ kind: 'vent', count: 3 }, { kind: 'tremor', count: 1 }],
      rays: 0.0, snow: 0.1, vignette: 0.7
    }
  };

  var ALL = ['sunlight', 'twilight', 'midnight', 'abyssal', 'hadal'];

  F.zones = {
    ALL: ALL,
    get: function (id) {
      var z = ZONE_DATA[id];
      if (!z) throw new Error('unknown zone: ' + id);
      return z;
    },
    forContact: function (i) {
      var id = CFG.ZONE_BY_CONTACT[i];
      if (!id) throw new Error('contact out of range: ' + i);
      return ZONE_DATA[id];
    },
    forDepth: function (m) {
      var pick = ZONE_DATA[ALL[0]];
      for (var k = 0; k < ALL.length; k++) {
        var z = ZONE_DATA[ALL[k]];
        if (m >= z.fromM) pick = z;
      }
      return pick;
    }
  };
})(window.FATHOM);
