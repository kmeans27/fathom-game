/* rounds.js — the daily trench. Same seed => same 7 rounds for everyone. */
import { mulberry32, hashSeed } from './prng.js';
import { TRENCH } from './balance.js';

/* Flavour only. The numbers carry the gameplay; these lines carry the mood.
   Purely fictional dive sites — the target depths are seeded, not real data. */
export const SITES = [
  { name: 'The Lantern Shelf', flavour: 'Ship lanterns still warm to the touch.' },
  { name: 'Wreck of the S.S. Vesper', flavour: 'A liner that went down whole.' },
  { name: 'The Bone Orchard', flavour: 'Whale fall, spread like a garden.' },
  { name: 'Thermal Garden Nine', flavour: 'White gardens on black glass.' },
  { name: 'The Glass Meadow', flavour: 'Fields of sponge, brittle as windows.' },
  { name: 'Postbox Ridge', flavour: 'A mail shell, never opened.' },
  { name: 'The Choir Trench', flavour: 'The current sings through basalt.' },
  { name: 'Umbrella Fields', flavour: 'Parachutes that never landed.' },
  { name: 'The Salt Library', flavour: 'Shelves of pressed sediment.' },
  { name: 'Anchor Cemetery', flavour: 'Row after row of iron flowers.' },
  { name: 'Harp Reef', flavour: 'Strings of cable, tuned by the tide.' },
  { name: 'The Cradle', flavour: 'A dropped bass, still rocking.' },
  { name: 'Kite Graveyard', flavour: 'Kites that dove and never surfaced.' },
  { name: 'The Wedding Cake', flavour: 'Nine tiers, one candle, no fire.' },
  { name: 'Ferryman’s Chair', flavour: 'A seat bolted to the slope.' },
  { name: 'The Tin Orchard', flavour: 'Canned pears, labels intact.' },
  { name: 'Cathedral Flute', flavor: 'An organ pipe wide as a street.' },
  { name: 'The Long Kite', flavour: 'A banner, still snapping.' },
  { name: 'Ladder to Nowhere', flavour: 'Rungs down into the dark.' },
  { name: 'The Piano Well', flavour: 'Nocturnes from a drowned hall.' },
];
export function generateRounds(seed) {
  const rand = mulberry32(seed);
  /* Fisher-Yates on the site list, then a target per round.
     Targets avoid the exact edges so "guess the middle" is not a freebie. */
  const pool = SITES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const rounds = [];
  for (let i = 0; i < TRENCH.rounds; i++) {
    const target = 60 + Math.floor(rand() * (TRENCH.depthMax - 119));
    rounds.push({ ...pool[i], target });
  }
  return rounds;
}
export function dailySeed(date) {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return hashSeed('fathom:' + key);
}
