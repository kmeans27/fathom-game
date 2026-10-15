/* fx.js — juice as pure bus subscriber (§7.1/§7.3). DOM-level shake and flash
   on the scope host; nothing here knows rules. Reduced-motion: no shake,
   no flash; the tier colour still carries the signal. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var scopeHost = null;
  var flashEl = null;

  F.fx = {
    bind: function (host) {
      scopeHost = host;
      flashEl = document.createElement('div');
      flashEl.setAttribute('aria-hidden', 'true');
      flashEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;';
      host.appendChild(flashEl);
    }
  };

  function shake(amp, ms) {
    if (!scopeHost || F.a11y.reducedMotion()) return;
    var steps = Math.min(10, Math.max(3, ms / 40));
    var i = 0;
    var iv = window.setInterval(function () {
      var x = (Math.random() * 2 - 1) * amp * (1 - i / steps);
      var y = (Math.random() * 2 - 1) * amp * (1 - i / steps);
      scopeHost.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      if (++i >= steps) {
        scopeHost.style.transform = '';
        window.clearInterval(iv);
      }
    }, 40);
  }

  function flash(color, ms) {
    if (!flashEl || F.a11y.reducedMotion()) return;
    flashEl.style.background = color;
    flashEl.style.opacity = '0.5';
    window.setTimeout(function () { flashEl.style.opacity = '0'; }, ms);
  }

  F.bus.on('run:lock', function (p) {
    var tier = p.contact.tier;
    if (tier === 'survey' || tier === 'bullseye') flash('#37e0ff', 90);
    if (tier === 'miss') shake(6, 260);
    if (p.contact.hullCost) shake(4, 200);
  });
  F.bus.on('run:crush', function () { shake(10, 500); });
})(window.FATHOM);
