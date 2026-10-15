/* sfx.js — pure bus subscriber: gameplay events -> audio cues (§7.4 table).
   Never emits; never touches core state. Reduced-audio = no sonar tail. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var A = null;

  F.bus.on('run:pick', function (p) {
    if (A === null) A = F.audio;
    A.play('ping', { su: p.pickSu, dur: 0.5 });
  });
  F.bus.on('run:act', function (p) {
    if (A === null) A = F.audio;
    A.play(p.action, { dur: p.action === 'echo' ? 0.8 : 0.5 });
  });
  F.bus.on('run:lock', function (p) {
    if (A === null) A = F.audio;
    A.play('tier', { tier: p.contact.tier, dur: 0.9 });
    if (p.contact.hullCost) A.play('hull', { dur: 0.4 });
  });
  F.bus.on('run:crush', function () {
    if (A === null) A = F.audio;
    A.play('hull', { dur: 0.4 });
  });
})(window.FATHOM);
