/* balance.js — single source of truth for every tunable number.
   The design doc explains WHY these values are what they are. */
export const TRENCH = {
  depthMax: 1000,          // metres; the map is 0..1000
  rounds: 7,               // same as Krillion's 7 prompts
  pointsPerMetre: 10,      // score -> depth, like Krillion
  maxPoints: 700,          // perfect ceiling, like Krillion
  pingBudget: 10,          // total sonar pings for the whole run
  sweepCost: 1,            // tells you which half the target is in
  echoCost: 2,             // draws a band around the target
  echoBand: 80,            // +/- metres around the true target
  blindBonus: 2,           // tier multiplier for a 0-ping commitment
  zones: [                 // visual bands, top -> bottom
    { name: 'sunlight', to: 200 },
    { name: 'twilight', to: 1000 },
  ],
};
export const TIERS = [
  { id: 'perfect',   tol: 5,   points: 100 },
  { id: 'bullseye',  tol: 20,  points: 50 },
  { id: 'hit',       tol: 100, points: 20 },
  { id: 'graze',     tol: 250, points: 5 },
];
