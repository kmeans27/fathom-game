/* scopeinput.js — pointer/touch/keyboard input on the scope -> F.run.setPick (§8.3).
   Keyboard path: arrows nudge the pick; buttons cover the rest of the loop. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;
  var MAX = CFG.SCOPE.maxSu;

  function yToSu(clientY) {
    var g = F.scope.geom(window.innerWidth, window.innerHeight);
    var t = (clientY - g.y) / g.h;
    return Math.max(0, Math.min(MAX, Math.round(t * MAX)));
  }

  function setPick(su) {
    F.run.setPick(su); // core clamps, updates state, and emits run:pick {pickSu}
  }

  F.scopeinput = {
    bind: function (scopeHost) {
      var dragging = false;
      scopeHost.addEventListener('pointerdown', function (e) {
        dragging = true;
        setPick(yToSu(e.clientY));
      });
      scopeHost.addEventListener('pointermove', function (e) {
        if (dragging) setPick(yToSu(e.clientY));
      });
      scopeHost.addEventListener('pointerup', function () { dragging = false; });

      window.addEventListener('keydown', function (e) {
        var k = e.key;
        var rs = F.run.state();
        if (!rs) return;
        var step = 0;
        if (k === 'ArrowUp' || k === 'ArrowDown') {
          step = (e.shiftKey ? 10 : 1) * (k === 'ArrowUp' ? -1 : 1);
        } else if (k === 'PageUp') {
          step = -100;
        } else if (k === 'PageDown') {
          step = 100;
        } else {
          return;
        }
        e.preventDefault();
        setPick(Math.max(0, Math.min(MAX, rs.pickSu + step)));
      });
    }
  };
})(window.FATHOM);
