// Loads the game's classic scripts (shared global scope) into one vm context for tests.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ORDER = ['prng.js', 'balance.js', 'rounds.js', 'score.js', 'sonar.js', 'save.js', 'share.js'];
const NAMES = ['mulberry32', 'hashSeed', 'TRENCH', 'TIERS', 'SITES', 'generateRounds', 'dailySeed',
  'evaluate', 'sweep', 'echo', 'canSweep', 'canEcho', 'KEY', 'load', 'save', 'recordDaily',
  'silentGlyph', 'shareGrid', 'shareText'];

export function game() {
  const jsDir = fileURLToPath(new URL('../js/', import.meta.url));
  const src = ORDER.map(f => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');
  const code = src + '\n({ ' + NAMES.map(n => n + ':' + n).join(',') + ' })';
  return vm.runInNewContext(code, { localStorage: {} });
}
