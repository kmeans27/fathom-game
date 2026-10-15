/* controls.js — action buttons, stake dial, LOCK IN (§8.1). DOM buttons:
   keyboard focus and Enter work for free; we only wire click -> core calls. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var D = F.dom;
  var CFG = F.config;

  var wrap = D.el('div', 'controls');
  var buttons = {};
  var lockBtn = null;
  var dialBtns = {};

  function mkAction(id, label, cost) {
    var b = D.el('button', 'action-btn');
    b.setAttribute('data-action', id);
    b.setAttribute('data-cost', String(cost));
    b.appendChild(D.txt(label));
    b.addEventListener('click', function () { F.run.act(id); });
    wrap.appendChild(b);
    buttons[id] = b;
  }

  F.controls = {
    build: function () {
      if (wrap.firstChild) return wrap;
      mkAction('sweep', 'SWEEP', CFG.PRICES.sweep);
      mkAction('echo', 'ECHO', CFG.PRICES.echo);
      mkAction('gain', 'GAIN', CFG.PRICES.gain);
      var dial = D.el('div', 'dial');
      for (var n = 1; n <= 3; n++) {
        var b = D.el('button', 'btn');
        b.setAttribute('data-stake', String(n));
        b.appendChild(D.txt(n + '\u00D7'));
        b.addEventListener('click', function () { F.run.setStake(n); });
        dial.appendChild(b);
        dialBtns[n] = b;
      }
      wrap.appendChild(dial);
      lockBtn = D.el('button', 'lock-btn');
      lockBtn.appendChild(D.txt('LOCK IN'));
      lockBtn.addEventListener('click', function () {
        F.run.lock(); // core emits run:lock/run:resolve itself
      });
      wrap.appendChild(lockBtn);
      return wrap;
    },
    setAfforded: function (rs) {
      var S = F.sonar;
      function setBtn(b, ok) {
        b.disabled = !ok;
        b.setAttribute('data-afforded', ok ? 'true' : 'false');
      }
      setBtn(buttons.sweep, S.canSweep(rs.round));
      setBtn(buttons.echo, S.canEcho(rs.round));
      setBtn(buttons.gain, S.canGain(rs.round));
      for (var n = 1; n <= 3; n++) {
        var cur = rs.stake === n;
        if (cur) dialBtns[n].setAttribute('aria-current', 'true');
        else dialBtns[n].removeAttribute('aria-current');
      }
    }
  };
})(window.FATHOM);
