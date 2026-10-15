/* log.js — the run log: "target x · you y · tier +n" (§8.1). Reads ContactResults only. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var D = F.dom;
  var wrap = D.el('div', 'log');

  F.log = {
    build: function () { return wrap; },
    clear: function () { while (wrap.firstChild) wrap.removeChild(wrap.firstChild); },
    line: function (r) {
      var l = D.el('div', 'log-line');
      l.appendChild(D.txt('contact ' + (r.i + 1) + ' \u00B7 target ' + r.truthSu +
        ' \u00B7 you ' + r.pickSu + ' \u00B7 ' + r.tier + ' +' + r.points));
      wrap.appendChild(l);
      while (wrap.childNodes.length > 3) wrap.removeChild(wrap.firstChild);
    }
  };
})(window.FATHOM);
