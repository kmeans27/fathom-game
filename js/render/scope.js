/* scope.js — the sonar scope panel: ruler, window band, scatter, decoys, pick,
   reveal, ping arcs (§7.2, §3.2). P2 quality: correct and legible, no bloom yet. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;
  var MAX = CFG.SCOPE.maxSu;

  function geom(w, h) {
    var pw = Math.min(w * 0.58, 560);
    var ph = h * 0.72;
    return { x: (w - pw) / 2, y: h * 0.14, w: pw, h: ph };
  }
  function suToY(g, su) { return g.y + (su / MAX) * g.h; }

  /* per-contact cached offsets: scatter and decoy jitter must be stable */
  var offsetsCache = {};
  function offsets(key, sigma) {
    var hit = offsetsCache[key];
    if (hit && hit.sigma === sigma) return hit;
    var s = F.rng.stream((key % 2147483647) | 1);
    var pts = [];
    for (var i = 0; i < 24; i++) {
      var g = (s() + s() + s() - 1.5) * 1.15 * sigma; // approx gaussian, sigma-scaled
      pts.push({ dy: g, dx: (s() - 0.5) * 0.62 });
    }
    var out = { pts: pts, sigma: sigma };
    offsetsCache[key] = out;
    return out;
  }

  var PING_LIFE = 700, RING_LIFE = 900;

  function draw(frame, state) {
    var ctx = frame.ctx;
    var g = geom(frame.w, frame.h);
    var z = F.zones.get(state.zone);
    var glow = z.palette.glow;

    /* glass panel */
    ctx.fillStyle = 'rgba(2,8,16,0.72)';
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = 'rgba(55,224,255,0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);

    /* ruler every 100 su */
    ctx.strokeStyle = 'rgba(55,224,255,0.12)';
    ctx.fillStyle = 'rgba(143,179,196,0.7)';
    ctx.font = '10px ui-monospace, monospace';
    for (var su = 100; su < MAX; su += 100) {
      var ry = suToY(g, su);
      ctx.beginPath();
      ctx.moveTo(g.x, ry); ctx.lineTo(g.x + 10, ry);
      ctx.moveTo(g.x + g.w - 10, ry); ctx.lineTo(g.x + g.w, ry);
      ctx.stroke();
      ctx.fillText(String(su), g.x + 14, ry - 3);
    }

    var rs = state.round;
    if (!rs) return;

    /* window band */
    var wy0 = suToY(g, rs.lo), wy1 = suToY(g, rs.hi);
    ctx.fillStyle = 'rgba(55,224,255,0.06)';
    ctx.fillRect(g.x, wy0, g.w, wy1 - wy0);
    ctx.strokeStyle = 'rgba(55,224,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(g.x, wy0); ctx.lineTo(g.x + g.w, wy0);
    ctx.moveTo(g.x, wy1); ctx.lineTo(g.x + g.w, wy1);
    ctx.stroke();

    /* scatter (additive dots around the hidden truth) */
    var off = offsets(state.rngSeed, rs.sigma);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow;
    var cx = g.x + g.w / 2;
    for (var p = 0; p < off.pts.length; p++) {
      var pt = off.pts[p];
      var py = suToY(g, Math.max(0, Math.min(MAX, state.contact.truth + pt.dy)));
      // draw only inside the current window
      if (py >= wy0 && py <= wy1) {
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(cx + pt.dx * g.w, py, 2.2, 0, 6.283);
          ctx.fill();
        }
      }
    /* decoys: dimmer, wider, ✕ when killed */
    ctx.globalAlpha = 0.35;
    for (var d = 0; d < rs.decoys.length; d++) {
      var dec = rs.decoys[d];
      var dy = suToY(g, dec.su);
      var dx = cx + (d % 2 ? -1 : 1) * g.w * 0.18;
      if (dec.dead) {
        ctx.strokeStyle = 'rgba(255,91,91,0.8)';
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx - 6, dy - 6); ctx.lineTo(dx + 6, dy + 6);
        ctx.moveTo(dx + 6, dy - 6); ctx.lineTo(dx - 6, dy + 6);
        ctx.stroke();
      } else {
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.2, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.restore();

    /* pick line */
    var py = suToY(g, state.pick);
    ctx.save();
    ctx.shadowColor = glow; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#37e0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x + 4, py); ctx.lineTo(g.x + g.w - 4, py);
    ctx.stroke();
    ctx.restore();

    /* ping arcs at the point where each ping fired */
    var now = frame.t;
    state.pings = state.pings.filter(function (a) { return now - a.t0 < PING_LIFE; });
    for (var a2 = 0; a2 < state.pings.length; a2++) {
      var arc = state.pings[a2];
      var k = (now - arc.t0) / PING_LIFE;
      var ay = suToY(g, arc.su);
      ctx.strokeStyle = 'rgba(55,224,255,' + (0.5 * (1 - k)).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, ay, 12 + k * 130, -0.8, 0.8);
      ctx.stroke();
    }

    /* reveal: truth marker after lock */
    if (state.reveal) {
      var rk = (now - state.reveal.t0) / RING_LIFE;
      if (rk < 1) {
        var ry2 = suToY(g, state.reveal.truthSu);
        ctx.strokeStyle = 'rgba(223,242,248,' + (0.9 * (1 - rk)).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, ry2, 6 + rk * 26, 0, 6.283);
        ctx.stroke();
        ctx.fillStyle = '#dff2f8';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(cx, ry2, 3, 0, 6.283);
        ctx.fill();
      }
    }
  }

  F.scope = { geom: geom, draw: draw, suToY: suToY };
  if (F.canvas) F.canvas.register('scope', draw);
})(window.FATHOM);
