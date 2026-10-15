/* screens.js — screen router only: owns the screen elements and show/hide.
   Content is built by main.js (and P5's logbook/settings modules). */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var D = F.dom;
  var NAMES = ['menu', 'brief', 'run', 'results', 'logbook', 'settings'];
  var els = {};
  var current = 'menu';

  for (var i = 0; i < NAMES.length; i++) {
    els[NAMES[i]] = D.el('div', 'screen');
    els[NAMES[i]].setAttribute('data-screen', NAMES[i]);
  }

  F.screens = {
    host: function () { return els; },
    get: function (name) { return els[name]; },
    show: function (name) {
      if (NAMES.indexOf(name) === -1) return false;
      current = name;
      for (var k in els) {
        if (k === name) els[k].removeAttribute('data-hidden');
        else els[k].setAttribute('data-hidden', '');
      }
      F.bus.emit('screen:change', { screen: name });
      return true;
    },
    current: function () { return current; },
    attach: function (uiHost) {
      for (var k in els) uiHost.appendChild(els[k]);
    }
  };
})(window.FATHOM);
