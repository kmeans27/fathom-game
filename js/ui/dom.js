/* dom.js — el() builder, formatters (§5.3). No state, no events. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return node;
  }

  F.dom = {
    el: el,
    txt: function (s) { return document.createTextNode(String(s)); },
    fmtInt: function (n) {
      var s = String(Math.round(n)), out = '';
      while (s.length > 3) { out = ',' + s.slice(-3) + out; s = s.slice(0, -3); }
      return s + out;
    },
    fmtSu: function (su) { return Math.round(su) + ' m'; }
  };
})(window.FATHOM);
