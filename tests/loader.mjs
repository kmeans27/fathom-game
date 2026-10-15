// Loads the game's core (classic scripts, shared namespace) into one vm context for tests.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORDER = ['config.js', 'rng.js', 'zones.js', 'daily.js', 'rounds.js',
  'scoring.js', 'sonar.js', 'storage.js', 'stats.js', 'share.js', 'run.js'];

export function game(opts) {
  const coreDir = fileURLToPath(new URL('../js/core/', import.meta.url));
  const src = ORDER.map(f => fs.readFileSync(path.join(coreDir, f), 'utf8')).join('\n');

  // localStorage stub: an object-backed stand-in with the real API surface.
  // opts.throwStorage models a sandbox (file://, private mode) where storage throws.
  const store = Object.assign({}, (opts && opts.store) || {});
  const throwing = opts && opts.throwStorage;
  const localStorage = {
    getItem: k => { if (throwing) throw new Error('storage unavailable'); return Object.hasOwn(store, k) ? store[k] : null; },
    setItem: (k, v) => { if (throwing) throw new Error('storage unavailable'); store[k] = String(v); },
    removeItem: k => { if (throwing) throw new Error('storage unavailable'); delete store[k]; },
    _store: store
  };

  const sandbox = { window: {}, localStorage, console };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(src, ctx, { filename: 'fathom-core' });
  return sandbox.window.FATHOM;
}
