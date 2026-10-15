/* config.js — the single source of tunable truth (plan §6).
   No behaviour file may contain a magic number; import these. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  F.config = {
    RUN:     { contacts: 8, pingBudget: 12, maxPingsPerRound: 5, hull: 3 },

    SCOPE:   { maxSu: 1000, edgeMargin: 60, minTarget: 60, maxTarget: 940 },

    TIERS:   [ { id: 'survey',   tol: 5,   points: 100 },
               { id: 'bullseye', tol: 20,  points: 60 },
               { id: 'hit',      tol: 100, points: 30 },
               { id: 'graze',    tol: 250, points: 10 } ],
    MISS_ID: 'miss',

    PRICES:  { sweep: 1, echo: 2, gain: 1 },
    ECHO_BAND: 60,
    SWEEP_MIN_WINDOW: 2,
    MIN_DECOY_GAP: 120,
    MIN_DECOY_EDGE: 80,
    DECOY_MIN_SEP_FACTOR: 2,   // decoys stay >= 2*sigma apart (see docs/DESIGN.md)
    SCATTER_RETURNS: 90,       // returns per scatter (plan §3.2)
    SCATTER_ALPHA: 0.45,       // decoy alpha multiplier
    DECOY_SIGMA_FACTOR: 1.6,   // decoy scatter width multiplier

    STAKE_MULT:   { 1: 1, 2: 2, 3: 3 },
    STAKE_HULL_COST_ON_MISS: { 1: 1, 2: 2, 3: 3 },
    SURVEY_HEAL:  { minStake: 2, amount: 1, cap: 3 },
    DEPTH_PER_POINT: 2.2,
    FLOOR_M: 7000,

    ZONE_BY_CONTACT: ['sunlight', 'sunlight', 'twilight', 'twilight',
                      'midnight', 'midnight', 'abyssal', 'hadal'],

    DAILY_SEED_SALT: 'fathom:v2:',
    STORAGE_KEY: 'fathom:v2',
    V1_STORAGE_KEY: 'fath',   // v0.1 used a bare key; storage.js probes known legacy keys

    // Achievements (documented in docs/DESIGN.md; tunable)
    ACHIEVEMENTS: {
      'touch-the-floor': { minDepthM: 6500 },        // floor is 6996 max; 6500 is the realistic line
      'silent-survey':   {},                        // a SURVEY with zero pings spent
      'cold-blood':      {},                        // finished a run at exactly 1 hull
      'all-in':          {},                        // staked 3x on all contacts of a finished run
      'no-waste':        {},                        // finished a run spending no pings at all
      'hull-holds':      {},                        // finished a run with full hull
      'streak-7':        { streak: 7 }
    },

    HISTORY_CAP: 90,
    DAY_NUMBER_EPOCH: '2024-01-01'                  // day numbers count UTC days since this epoch
  };
})(window.FATHOM);
