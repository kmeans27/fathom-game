/* a11y.js — reduced-motion query, aria-live announcer, focus helpers (§8.3). */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var live = null;

  F.a11y = {
    reducedMotion: function () {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !!F.storage.read().prefs.reducedMotion;
    },
    announce: function (text) {
      if (!live) return;
      live.textContent = text;
    },
    setLive: function (node) { live = node; }
  };

  F.bus.on('a11y:announce', function (payload) { F.a11y.announce(payload); });
})(window.FATHOM);
