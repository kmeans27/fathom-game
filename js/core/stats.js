/* stats.js — streaks, bests, achievements, history summaries. Pure:
   everything takes data as arguments, nothing reads the environment. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  function streak(history, todayKey) {
    var best = 0, current = 0, prev = null;
    var keys = Object.keys(history || {});
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (prev && nextDayKey(prev) === k) current++; else current = 1;
      if (current > best) best = current;
      prev = k;
    }
    var cur = 0;
    if (todayKey && history[todayKey]) {
      cur = 1;
      var probe = prevDayKey(todayKey);
      while (history[probe]) { cur++; probe = prevDayKey(probe); }
    }
    return { current: cur, best: Math.max(best, cur) };
  }

  function nextDayKey(k) { return shiftDayKey(k, 1); }
  function prevDayKey(k) { return shiftDayKey(k, -1); }

  function shiftDayKey(k, delta) {
    var d = k.split('-');
    // Construct at UTC noon so DST and local TZ can never shift the day.
    var ms = Date.UTC(parseInt(d[0], 10), parseInt(d[1], 10) - 1, parseInt(d[2], 10), 12) + delta * 86400000;
    var out = new Date(ms);
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return out.getUTCFullYear() + '-' + p2(out.getUTCMonth() + 1) + '-' + p2(out.getUTCDate());
  }

  function best(history) {
    var out = null;
    var keys = Object.keys(history || {});
    for (var i = 0; i < keys.length; i++) {
      var h = history[keys[i]];
      if (!h || h.crushed) continue;
      if (!out || h.depthM > out.depthM) {
        out = { depthM: h.depthM, points: h.points, dayKey: keys[i], crushed: false };
      }
    }
    return out;
  }

  function zoneBest(history) {
    var out = { sunlight: 0, twilight: 0, midnight: 0, abyssal: 0, hadal: 0 };
    var keys = Object.keys(history || {});
    for (var i = 0; i < keys.length; i++) {
      var h = history[keys[i]];
      if (!h || h.crushed) continue;
      var zs = (h.zoneBest || {});
      for (var z in zs) { if ((out[z] || 0) < zs[z]) out[z] = zs[z]; }
    }
    return out;
  }

  function achievements(history, runResults) {
    var unlocked = [];
    var runs = [];
    var keys = Object.keys(history || {});
    for (var i = 0; i < keys.length; i++) runs.push(history[keys[i]]);
    if (runResults) runs.push(runResults);

    for (var r = 0; r < runs.length; r++) {
      var run = runs[r];
      if (!run) continue;
      if (!run.crushed && run.depthM >= CFG.ACHIEVEMENTS['touch-the-floor'].minDepthM)
        unlocked.push('touch-the-floor');
      var res = run.results || [];
      if (!run.crushed && run.pingsLeft === CFG.RUN.pingBudget && res.length === CFG.RUN.contacts)
        unlocked.push('no-waste');
      for (var s = 0; s < res.length; s++) {
        if (res[s].tier === 'survey' && res[s].silent) { unlocked.push('silent-survey'); break; }
      }
      if (!run.crushed && run.hull === CFG.RUN.hull) {
        var clean = (run.results || []).length === CFG.RUN.contacts;
        if (clean) {
          var noMiss = true;
          for (var m = 0; m < run.results.length; m++) if (run.results[m].hullCost > 0) noMiss = false;
          if (noMiss) unlocked.push('hull-holds');
        }
      }
      if (!run.crushed && run.hull === 1) unlocked.push('cold-blood');
      if (run.stakePlan && run.stakePlan.length === CFG.RUN.contacts) {
        var allIn = true;
        for (var a = 0; a < run.stakePlan.length; a++) if (run.stakePlan[a] < 3) allIn = false;
        if (allIn) unlocked.push('all-in');
      }
    }
    var st = streak(history, null);
    if (st.best >= CFG.ACHIEVEMENTS['streak-7'].streak) unlocked.push('streak-7');

    var uniq = [];
    for (var u = 0; u < unlocked.length; u++) {
      if (uniq.indexOf(unlocked[u]) === -1) uniq.push(unlocked[u]);
    }
    return uniq;
  }

  function summarize(history) {
    var depths = [];
    var keys = Object.keys(history || {});
    keys.sort();
    for (var i = 0; i < keys.length; i++) {
      depths.push({ dayKey: keys[i], depthM: (history[keys[i]] || {}).depthM || 0 });
    }
    var totalDepth = 0;
    for (var j = 0; j < depths.length; j++) totalDepth += depths[j].depthM;
    return {
      runs: depths.length,
      totalDepthM: totalDepth,
      histogram: depths,
      best: best(history),
      streak: streak(history, null)
    };
  }

  F.stats = {
    streak: streak,
    best: best,
    zoneBest: zoneBest,
    achievements: achievements,
    summarize: summarize,
    shiftDayKey: shiftDayKey
  };
})(window.FATHOM);
