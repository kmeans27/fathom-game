/* main.js — boot: build DOM, wire the bus, drive the screen router (§11 P2).
   The core is pure; everything here is glue. No game maths lives in this file. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var D = F.dom;
  var runStarted = false;

  function syncCanvas() {
    var rs = F.run.state();
    var st = F.canvas.state;
    if (!rs) { st.round = null; st.contact = null; return; }
    st.round = rs.round;
    st.contact = rs.contacts[rs.contact];
    st.pick = rs.pickSu;
    st.rngSeed = (rs.seed ^ ((rs.contact + 1) * 104729)) | 1;
  }

  function setZoneDom(zoneId) {
    document.body.setAttribute('data-zone', zoneId);
    F.canvas.state.zone = zoneId;
  }

  function clearScreen(name) {
    var s = F.screens.get(name);
    while (s.firstChild) s.removeChild(s.firstChild);
    return s;
  }

  /* ---- bus subscriptions (the only UI-side subscriber) ---- */
  function wireBus() {
    F.bus.on('run:pick', function (p) { F.canvas.state.pick = p.pickSu; });
    F.bus.on('run:act', function (p) {
      var rs = F.run.state();
      F.canvas.state.round = p.round;
      F.canvas.state.pings.push({ su: rs.pickSu, t0: performance.now(), kind: p.action });
      if (rs) F.controls.setAfforded(rs);
    });
    F.bus.on('run:lock', function (p) {
      F.canvas.state.reveal = { truthSu: p.contact.truthSu, t0: performance.now() };
      F.log.line(p.contact);
      F.a11y.announce('contact ' + (p.contact.i + 1) + ': ' + p.contact.tier +
        (p.contact.points ? ' plus ' + p.contact.points : '') +
        (p.contact.hullCost ? ', hull damage ' + p.contact.hullCost : ''));
    });
    F.bus.on('run:zone', function (p) {
      setZoneDom(p.zone);
      F.a11y.announce('entering ' + F.zones.get(p.zone).label);
    });
  }

  /* ---- screen content builders ---- */
  function buildMenu() {
    var s = clearScreen('menu');
    s.appendChild(D.el('div', 'logo')).appendChild(D.txt('FATHOM'));
    var st = F.storage.read();
    var todayKey = F.daily.dayKeyUtc(new Date());
    var doneToday = !!st.history[todayKey];

    var info = D.el('p');
    var best = F.stats.best(st.history);
    var depth = st.best && (!best || st.best.depthM >= best.depthM) ? st.best : best;
    info.appendChild(D.txt('best ' + (depth ? D.fmtInt(depth.depthM) + ' m' : '— — —')));
    var br = D.el('br');
    info.appendChild(br);
    info.appendChild(D.txt('#' + pad4(F.daily.dayNumber(todayKey)) + ' · UTC · next in ' + fmtUntil(F.daily.msUntilRollover(new Date()))));
    s.appendChild(info);

    if (!doneToday) {
      var dive = D.el('button', 'btn big');
      dive.appendChild(D.txt('DAILY DIVE'));
      dive.addEventListener('click', function () { startRun('daily'); });
      s.appendChild(dive);
    } else {
      var done = D.el('p');
      done.appendChild(D.txt('DAILY DONE — play endless'));
      s.appendChild(done);
    }
    var end = D.el('button', 'btn');
    end.appendChild(D.txt('ENDLESS'));
    end.addEventListener('click', function () { startRun('endless'); });
    s.appendChild(end);
    var lb = D.el('button', 'btn');
    lb.appendChild(D.txt('LOGBOOK'));
    lb.addEventListener('click', function () { F.screens.show('logbook'); buildLogbook(); });
    s.appendChild(lb);
    var set = D.el('button', 'btn');
    set.appendChild(D.txt('SETTINGS'));
    set.addEventListener('click', function () { F.screens.show('settings'); buildSettings(); });
    s.appendChild(set);
  }

  function pad4(n) { return ('0000' + n).slice(-4); }
  function fmtUntil(ms) {
    var m = Math.floor(ms / 60000);
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }

  function buildLogbook() {
    var s = clearScreen('logbook');
    var st = F.storage.read();
    var sum = F.stats.summarize(st.history);
    var head = D.el('div', 'lb-head');
    head.appendChild(D.txt('LOGBOOK'));
    s.appendChild(head);
    var rows = [
      'best ' + (sum.best ? D.fmtInt(sum.best.depthM) + ' m' : '—'),
      'runs ' + sum.runs + ' · total descent ' + D.fmtInt(sum.totalDepthM) + ' m',
      'streak ' + sum.streak.current + ' (best ' + sum.streak.best + ')'
    ];
    var zb = F.stats.zoneBest(st.history);
    for (var z in zb) {
      if (zb[z] > 0) rows.push(z + ' best ' + D.fmtInt(zb[z]) + ' m');
    }
    var list = D.el('div', 'lb-list');
    for (var i = 0; i < rows.length; i++) {
      var r = D.el('p');
      r.appendChild(D.txt(rows[i]));
      list.appendChild(r);
    }
    s.appendChild(list);
    var hist = D.el('div', 'hist');
    var bars = sum.histogram.slice(-90);
    var maxD = 1;
    for (var b = 0; b < bars.length; b++) if (bars[b].depthM > maxD) maxD = bars[b].depthM;
    for (var h = 0; h < bars.length; h++) {
      var bar = D.el('i', 'bar');
      bar.style.height = Math.max(4, Math.round(bars[h].depthM / maxD * 100)) + '%';
      hist.appendChild(bar);
    }
    s.appendChild(hist);
    var ach = D.el('div', 'ach');
    for (var key in F.config.ACHIEVEMENTS) {
      var cell = D.el('p', 'ach-cell');
      var unlocked = st.achievements.indexOf(key) !== -1;
      cell.setAttribute('data-unlocked', unlocked ? 'true' : 'false');
      cell.appendChild(D.txt(key));
      ach.appendChild(cell);
    }
    s.appendChild(ach);
    var back = D.el('button', 'btn');
    back.appendChild(D.txt('MENU'));
    back.addEventListener('click', function () { F.screens.show('menu'); buildMenu(); });
    s.appendChild(back);
  }

  function buildSettings() {
    var s = clearScreen('settings');
    var st = F.storage.read();
    var defs = [
      ['mute', 'mute'], ['reducedAudio', 'reduced audio'],
      ['reducedMotion', 'reduced motion'], ['colourblind', 'colourblind labels'],
      ['largeTargets', 'large targets']
    ];
    for (var i = 0; i < defs.length; i++) {
      var key = defs[i][0];
      var b = D.el('button', 'toggle');
      b.setAttribute('data-pref', key);
      var on = !!st.prefs[key];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.appendChild(D.txt((on ? '✓ ' : '· ') + defs[i][1]));
      b.addEventListener('click', function () {
        st.prefs[key] = !st.prefs[key];
        F.storage.write(st);
        if (key === 'mute') F.audio.setMuted(st.prefs.mute);
        if (key === 'reducedAudio') F.audio.setReducedAudio(st.prefs.reducedAudio);
        buildSettings(); // rebuild reflects the new state
      });
      s.appendChild(b);
    }
    var reset = D.el('button', 'btn danger');
    reset.appendChild(D.txt('RESET DATA'));
    reset.addEventListener('click', function () {
      F.storage.clear();
      F.screens.show('menu');
      buildMenu();
    });
    s.appendChild(reset);
    var back = D.el('button', 'btn');
    back.appendChild(D.txt('MENU'));
    back.addEventListener('click', function () { F.screens.show('menu'); buildMenu(); });
    s.appendChild(back);
  }

  function startRun(mode) {
    var opts;
    if (mode === 'daily') {
      var dayKey = F.daily.dayKeyUtc(new Date());
      opts = { mode: 'daily', seed: F.daily.seed(dayKey), dayKey: dayKey };
    } else {
      opts = { mode: 'endless', seed: F.rng.hashSeed('endless:' + Date.now()), dayKey: null };
    }
    F.run.create(opts);
    currentMode = mode;
    currentDayKey = opts.dayKey;
    runStarted = true;
    showBrief();
  }

  function showBrief() {
    F.screens.show('brief');
    var s = clearScreen('brief');
    var rs = F.run.state();
    s.appendChild(F.cards.build(rs.contacts[0]));
    var begin = D.el('button', 'btn big');
    begin.appendChild(D.txt('BEGIN'));
    begin.addEventListener('click', enterRun);
    s.appendChild(begin);
    setTimeout(function () {
      if (F.screens.current() === 'brief') enterRun(); // auto-advance after 2.5 s
    }, 2500);
  }

  function enterRun() {
    F.screens.show('run');
    var s = clearScreen('run');
    var rs = F.run.state();
    s.appendChild(F.hud.build());
    s.appendChild(F.controls.build());
    s.appendChild(F.log.build());
    s.appendChild(F.cards.build(rs.contacts[rs.contact]));
    F.hud.update(rs);
    F.controls.setAfforded(rs);
    syncCanvas();
    F.a11y.announce('contact 1 of ' + F.config.RUN.contacts);
  }

  /* flow after a lock: core emits run:resolve; main drives next(). */
  F.bus.on('run:resolve', function () {
    if (!runStarted || F.screens.current() !== 'run') return;
    var where = F.run.next();
    var rs = F.run.state();
    if (where === 'contact') {
      var s = F.screens.get('run');
      for (var i = 0; i < s.childNodes.length; i++) {
        if (s.childNodes[i].className === 'card') { s.removeChild(s.childNodes[i]); break; }
      }
      s.appendChild(F.cards.build(rs.contacts[rs.contact]));
      F.hud.update(rs);
      syncCanvas();
      F.a11y.announce('contact ' + (rs.contact + 1) + ' of ' + F.config.RUN.contacts);
    } else {
      showResults(where === 'crushed');
    }
  });

  var currentMode = null;   // 'daily' | 'endless'
  var currentDayKey = null;

  function persistRun(crushed) {
    var res = F.run.results();
    var st = F.storage.read();
    var zb = {};
    var cum = 0;
    for (var i = 0; i < res.results.length; i++) {
      cum += res.results[i].metres;
      var z = res.results[i].zoneId;
      if (!zb[z] || zb[z] < cum) zb[z] = Math.round(cum);
    }
    var entry = {
      depthM: Math.round(res.depthM), points: res.points,
      crushed: crushed, zoneBest: zb
    };
    if (currentMode === 'daily' && currentDayKey) st.history[currentDayKey] = entry;
    if (!st.best || entry.depthM > st.best.depthM) {
      st.best = { depthM: entry.depthM, points: entry.points, dayKey: currentDayKey, crushed: false };
    }
    var ach = F.stats.achievements(st.history, null);
    for (var a = 0; a < ach.length; a++) {
      if (st.achievements.indexOf(ach[a]) === -1) st.achievements.push(ach[a]);
    }
    F.storage.write(st);
  }

  function showResults(crushed) {
    var res = F.run.results();
    F.screens.show('results');
    var s = clearScreen('results');
    var big = D.el('div', 'results-big');
    big.appendChild(D.txt(D.fmtInt(res.depthM) + ' m'));
    s.appendChild(big);
    if (crushed) {
      var lost = D.el('div', 'hull-lost');
      lost.appendChild(D.txt('HULL LOST'));
      s.appendChild(lost);
    }
    var zone = D.el('div', 'zone-badge');
    zone.appendChild(D.txt((res.deepestZone || 'sunlight').toUpperCase()));
    s.appendChild(zone);
    var stamps = D.el('div', 'stamp');
    stamps.appendChild(D.txt(F.share.grid(res.results, null)));
    s.appendChild(stamps);
    var card = D.el('div', 'sharecard');
    card.appendChild(D.txt(F.share.text(res)));
    s.appendChild(card);
    var copy = D.el('button', 'btn');
    copy.appendChild(D.txt('COPY'));
    copy.addEventListener('click', function () {
      try { navigator.clipboard.writeText(F.share.text(res)); } catch (e2) { /* file:// */ }
    });
    s.appendChild(copy);
    var end = D.el('button', 'btn');
    end.appendChild(D.txt('PLAY ENDLESS'));
    end.addEventListener('click', function () { startRun('endless'); });
    s.appendChild(end);
    var menu = D.el('button', 'btn');
    menu.appendChild(D.txt('MENU'));
    menu.addEventListener('click', function () {
      F.screens.show('menu');
      buildMenu();
    });
    s.appendChild(menu);
    F.a11y.announce('run over: ' + Math.round(res.depthM) + ' metres' +
      (crushed ? ', hull lost' : ''));
  }

  function boot() {
    var uiHost = document.getElementById('ui');
    var scopeHost = document.getElementById('scope');
    var live = document.getElementById('live');
    var seaCanvas = document.getElementById('sea');

    F.canvas.init(seaCanvas);
    F.a11y.setLive(live);
    F.fx.bind(scopeHost);
    F.screens.attach(uiHost);
    F.scopeinput.bind(scopeHost);
    wireBus();
    wireKeyboard();
    setZoneDom('sunlight');
    F.screens.show('menu');
    buildMenu();
  }

  /* §8.3 global shortcuts: actions, stake, lock, mute — independent of focus. */
  function wireKeyboard() {
    window.addEventListener('keydown', function (e) {
      if (F.screens.current() !== 'run') return;
      if (e.target && e.target.tagName === 'BUTTON') return; // native activation
      var k = e.key;
      if (k === 's' || k === 'S') F.run.act('sweep');
      else if (k === 'e' || k === 'E') F.run.act('echo');
      else if (k === 'g' || k === 'G') F.run.act('gain');
      else if (k === '1' || k === '2' || k === '3') F.run.setStake(Number(k));
      else if (k === 'Enter' || k === ' ') F.run.lock();
      else if (k === 'm' || k === 'M') F.audio.setMuted(!F.audio.muted);
    });
  }

  try {
    boot();
  } catch (e) {
    var ui = document.getElementById('ui');
    var d = document.createElement('div');
    d.textContent = 'LOAD ERROR: ' + e.message;
    ui.appendChild(d);
  }
})(window.FATHOM);
