/* share.js — the share card (plan §8.4) plus a serverless replay code.
   Colourblind-safe by construction: every tier has a distinct glyph. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  // Distinct shape per tier; colour only reinforces (plan §8.3).
  var GLYPHS = { survey: '\u2726', bullseye: '\u25C6', hit: '\u25B2', graze: '\u25CF', miss: '\u2B1B' };
  var SILENT_GLYPH = '\uD83D\uDCA1'; // diamond-with-inside-dot emoji (silent hit)

  function thousands(n) {
    var s = String(Math.abs(n));
    var out = '';
    while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (n < 0 ? '-' : '') + s + out;
  }

  function grid(results, prefs) {
    var cells = [];
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.tier === 'miss') { cells.push(GLYPHS.miss); continue; }
      if (r.silent && r.points > 0) { cells.push(SILENT_GLYPH); continue; }
      var g = GLYPHS[r.tier] || GLYPHS.graze;
      if (prefs && prefs.colourblind) g += ' ' + r.tier.toUpperCase();
      cells.push(g);
    }
    return cells.join('');
  }

  function hullPips(hull, cap) {
    var s = '';
    for (var i = 0; i < cap; i++) s += (i < hull ? '\u25CF' : '\u25CB');
    return s;
  }

  function text(runResults) {
    var head = runResults.dayKey
      ? 'FATHOM #' + pad4(F.daily.dayNumber(runResults.dayKey))
      : 'FATHOM ENDLESS';
    var lines = [];
    lines.push(head + ' \u00B7 ' +
      thousands(runResults.depthM) + ' m \u00B7 ' +
      F.zones.get(runResults.deepestZone || 'sunlight').label);
    lines.push(grid(runResults.results, null));
    lines.push('stake ' + runResults.stakePlan.join('\u00B7') +
      '   hull ' + hullPips(runResults.hull, CFG.RUN.hull) +
      '   pings ' + runResults.pingsLeft + ' left');
    var t = lines.join('\n');
    if (runResults.crushed) t += ' \u2301HULL LOST';
    return t;
  }

  function pad4(n) {
    var s = String(Math.max(0, n));
    while (s.length < 4) s = '0' + s;
    return s;
  }

  // Compact base64 replay code: {dayKey, results-lite, pings, hull}.
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function b64encode(str) {
    var out = '';
    for (var i = 0; i < str.length; i += 3) {
      var c0 = str.charCodeAt(i);
      var c1 = i + 1 < str.length ? str.charCodeAt(i + 1) : NaN;
      var c2 = i + 2 < str.length ? str.charCodeAt(i + 2) : NaN;
      var e0 = c0 >> 2;
      var e1 = ((c0 & 3) << 4) | (isNaN(c1) ? 0 : (c1 >> 4));
      var e2 = isNaN(c1) ? 64 : (((c1 & 15) << 2) | (isNaN(c2) ? 0 : (c2 >> 6)));
      var e3 = isNaN(c2) ? 64 : (c2 & 63);
      out += B64[e0] + B64[e1] + (e2 === 64 ? '=' : B64[e2]) + (e3 === 64 ? '=' : B64[e3]);
    }
    return out;
  }

  function b64decode(str) {
    var out = '';
    var vals = {};
    for (var i = 0; i < B64.length; i++) vals[B64[i]] = i;
    var c = 0, bits = 0;
    for (var j = 0; j < str.length; j++) {
      var ch = str[j];
      if (ch === '=') break;
      var v = vals[ch];
      if (v === undefined) continue;
      c = (c << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out += String.fromCharCode((c >> bits) & 255);
      }
    }
    return out;
  }

  function encode(runResults) {
    var lite = {
      d: runResults.dayKey,
      p: runResults.pingsLeft,
      h: runResults.hull,
      r: runResults.results.map(function (r) {
        return [r.tier === 'miss' ? 0 : ({ survey: 1, bullseye: 2, hit: 3, graze: 4 })[r.tier],
                r.silent ? 1 : 0, r.stake];
      })
    };
    return b64encode(JSON.stringify(lite));
  }

  function decode(code) {
    var lite = JSON.parse(b64decode(code));
    var TIER_BY_CODE = ['miss', 'survey', 'bullseye', 'hit', 'graze'];
    var results = lite.r.map(function (t) {
      return { tier: TIER_BY_CODE[t[0]], silent: t[1] === 1, stake: t[2] };
    });
    return { dayKey: lite.d, pingsLeft: lite.p, hull: lite.h, results: results };
  }

  F.share = {
    grid: grid,
    text: text,
    encode: encode,
    decode: decode,
    GLYPHS: GLYPHS
  };
})(window.FATHOM);
