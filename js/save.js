/* save.js — localStorage only. No accounts, no server, no tamper-proof league. */
const KEY = 'fathom:v1';
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
function recordDaily(n, score, depth, results, best) {
  const s = load() ?? { played: [], best: null, streak: 0, lastDay: null };
  s.played = [...new Set([...(s.played ?? []), n])].sort();
  const perfect = results.every((r) => r.tier === 'perfect');
  if (!best || score > best.score) s.best = { score, depth, n, perfect };
  save(s);
  return s;
}
