/* storage.js — namespaced, schema-versioned localStorage (plan §9).
   Every access is try/catch: storage can throw from a file:// sandbox and
   the game must keep playing unpersisted. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;
  var KEY = CFG.STORAGE_KEY;
  var LEGACY_KEYS = ['fathom', 'fath', 'fathom:v1'];

  function defaultState() {
    return {
      version: 2,
      history: {},
      best: null,
      zoneBest: { sunlight: 0, twilight: 0, midnight: 0, abyssal: 0, hadal: 0 },
      streak: { current: 0, best: 0, lastDay: null },
      seen: { tutorial: false },
      prefs: { mute: false, reducedAudio: false, reducedMotion: null, colourblind: false, largeTargets: false },
      achievements: [],
      v1: null
    };
  }

  function available() {
    try {
      void lsGet(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function lsGet(k) { return localStorage.getItem(k); }
  function lsSet(k, v) { localStorage.setItem(k, v); }
  function lsDel(k) { localStorage.removeItem(k); }

  function read() {
    try {
      var raw = lsGet(KEY);
      if (!raw) {
        var migrated = migrate(null);
        return migrated;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return defaultState();
      var st = defaultState();
      // Merge shallowly: unknown keys survive, missing keys keep defaults.
      for (var k in parsed) { if (k !== 'version') st[k] = parsed[k]; }
      st.version = 2;
      return st;
    } catch (e) {
      return defaultState();
    }
  }

  function migrate(v1State) {
    var st = defaultState();
    var legacy = null;
    try {
      for (var i = 0; i < LEGACY_KEYS.length; i++) {
        var raw = lsGet(LEGACY_KEYS[i]);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') { legacy = parsed; break; }
        }
      }
    } catch (e) { /* ignore; no legacy */ }
    var src = v1State || legacy;
    if (src) {
      st.v1 = { best: src.best || null, played: src.played || null, streak: src.streak || null };
    }
    return st;
  }

  function write(state) {
    try {
      var out = JSON.parse(JSON.stringify(state));
      // cap history at HISTORY_CAP, dropping oldest dayKeys
      var keys = Object.keys(out.history || {});
      if (keys.length > CFG.HISTORY_CAP) {
        keys.sort();
        var drop = keys.length - CFG.HISTORY_CAP;
        for (var i = 0; i < drop; i++) delete out.history[keys[i]];
      }
      lsSet(KEY, JSON.stringify(out));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    try { lsDel(KEY); return true; } catch (e) { return false; }
  }

  F.storage = {
    read: read,
    write: write,
    migrate: migrate,
    clear: clear,
    available: available,
    defaultState: defaultState,
    key: KEY
  };
})(window.FATHOM);
