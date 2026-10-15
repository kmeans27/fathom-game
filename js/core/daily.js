/* daily.js — UTC day keys so the daily is the same trench for every player
   (plan §9: correct across timezones and DST by construction). */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function dayKeyUtc(date) {
    var y = date.getUTCFullYear();
    return y + '-' + pad2(date.getUTCMonth() + 1) + '-' + pad2(date.getUTCDate());
  }

  function seed(dayKey) {
    return F.rng.hashSeed(CFG.DAILY_SEED_SALT + dayKey);
  }

  function dayNumber(dayKey) {
    var e = CFG.DAY_NUMBER_EPOCH.split('-');
    var a = new Date(parseInt(e[0], 10), parseInt(e[1], 10) - 1, parseInt(e[2], 10));
    var d = dayKey.split('-');
    var b = new Date(parseInt(d[0], 10), parseInt(d[1], 10) - 1, parseInt(d[2], 10));
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function msUntilRollover(date) {
    var next = new Date(date.getTime());
    next.setUTCHours(0); next.setUTCMinutes(0); next.setUTCSeconds(0); next.setUTCMilliseconds(0);
    // next is start of current UTC day; roll forward one day
    var d = next.getTime();
    var nowMs = date.getTime();
    return 86400000 - (nowMs - d);
  }

  function isSameDay(a, b) { return dayKeyUtc(a) === dayKeyUtc(b); }

  F.daily = {
    dayKeyUtc: dayKeyUtc,
    seed: seed,
    dayNumber: dayNumber,
    msUntilRollover: msUntilRollover,
    isSameDay: isSameDay
  };
})(window.FATHOM);
