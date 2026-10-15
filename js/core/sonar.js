/* sonar.js — the three purchases as pure reducers on round state (plan §3.3).
   RoundState: { lo, hi, sigma, used:{sweep,echo,gain}, decoys:[{su,dead}] }
   Ping budget lives on the run; sonar enforces the per-round cap. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  function clone(rs) {
    return {
      lo: rs.lo, hi: rs.hi, sigma: rs.sigma,
      used: { sweep: rs.used.sweep, echo: rs.used.echo, gain: rs.used.gain },
      decoys: rs.decoys.map(function (d) { return { su: d.su, dead: d.dead }; })
    };
  }

  function pingsUsed(rs) {
    return rs.used.sweep * CFG.PRICES.sweep +
           rs.used.echo * CFG.PRICES.echo +
           rs.used.gain * CFG.PRICES.gain;
  }

  function roomLeft(rs) {
    return CFG.RUN.maxPingsPerRound - pingsUsed(rs);
  }

  function init(contact) {
    var rs = {
      lo: 0, hi: CFG.SCOPE.maxSu, sigma: contact.sigma,
      used: { sweep: 0, echo: 0, gain: 0 },
      decoys: contact.decoys.map(function (su) { return { su: su, dead: false }; })
    };
    return rs;
  }

  function canSweep(rs) {
    return rs.hi - rs.lo > CFG.SWEEP_MIN_WINDOW &&
           roomLeft(rs) >= CFG.PRICES.sweep;
  }

  function canEcho(rs) {
    if (roomLeft(rs) < CFG.PRICES.echo) return false;
    // idempotent: refuse when the window is already inside the band
    var band = CFG.ECHO_BAND;
    // truth is not in round state; the run checks truth-conditional refusal.
    return true;
  }

  function canEchoAt(rs, truthSu) {
    var band = CFG.ECHO_BAND;
    if (rs.lo >= truthSu - band && rs.hi <= truthSu + band) return false;
    return canEcho(rs);
  }

  function canGain(rs) {
    return rs.used.gain < 1 && roomLeft(rs) >= CFG.PRICES.gain;
  }

  function sweep(rs, truthSu) {
    if (!canSweep(rs)) return null;
    var next = clone(rs);
    var mid = (next.lo + next.hi) / 2;
    var keepLow = truthSu < mid;
    if (keepLow) next.hi = mid; else next.lo = mid;
    next.used.sweep++;
    for (var i = 0; i < next.decoys.length; i++) {
      var d = next.decoys[i];
      var inside = d.su >= next.lo && d.su <= next.hi;
      if (!inside) d.dead = true;
    }
    return next;
  }

  function echo(rs, truthSu) {
    if (!canEchoAt(rs, truthSu)) return null;
    var next = clone(rs);
    var band = CFG.ECHO_BAND;
    next.lo = Math.max(next.lo, truthSu - band);
    next.hi = Math.min(next.hi, truthSu + band);
    next.used.echo++;
    for (var i = 0; i < next.decoys.length; i++) {
      var d = next.decoys[i];
      if (d.su < next.lo || d.su > next.hi) d.dead = true;
    }
    return next;
  }

  function gain(rs) {
    if (!canGain(rs)) return null;
    var next = clone(rs);
    next.sigma = next.sigma / 2;
    next.used.gain++;
    return next;
  }

  F.sonar = {
    init: init,
    canSweep: canSweep,
    canEcho: canEcho,
    canEchoAt: canEchoAt,
    canGain: canGain,
    sweep: sweep,
    echo: echo,
    gain: gain,
    pingsUsed: pingsUsed,
    clone: clone
  };
})(window.FATHOM);
