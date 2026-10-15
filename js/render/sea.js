/* sea.js — depth gradient, blitted from a per-zone offscreen cache (§7.2).
   P2 quality: flat gradient; rays/caustics come in P3. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var cache = {}; // zoneId -> offscreen canvas (1x1 gradient strip, stretched)

  function strip(zoneId) {
    var z = F.zones.get(zoneId);
    var c = document.createElement('canvas');
    c.width = 1; c.height = 256;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, z.palette.top);
    grad.addColorStop(1, z.palette.bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, 1, 256);
    return c;
  }

  F.sea = { draw: function (frame, state) {
    var id = state.zone;
    if (!cache[id]) cache[id] = strip(id);
    frame.ctx.drawImage(cache[id], 0, 0, frame.w, frame.h);
  } };

  if (F.canvas) F.canvas.register('sea', F.sea.draw);
})(window.FATHOM);
