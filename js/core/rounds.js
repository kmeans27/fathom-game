/* rounds.js — the daily trench (plan §5.2: derive, don't draw.
   Stream order per contact: truth, then decoys. Site shuffle runs first
   so the contact stream order above stays exact. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  /* Flavour only — the numbers carry the gameplay, these lines carry the mood.
     Fictional dive sites; depths are seeded, not real data. */
  var SITES = [
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
    { name: 'Ferryman\u2019s Chair', flavour: 'A seat bolted to the slope.' },
    { name: 'The Tin Orchard', flavour: 'Canned pears, labels intact.' },
    { name: 'Cathedral Flute', flavour: 'An organ pipe wide as a street.' },
    { name: 'The Long Kite', flavour: 'A banner, still snapping.' },
    { name: 'Ladder to Nowhere', flavour: 'Rungs down into the dark.' },
    { name: 'The Piano Well', flavour: 'Nocturnes from a drowned hall.' }
  ];

  function generate(seed) {
    var rand = F.rng.stream(seed);
    var pool = SITES.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }

    var contacts = [];
    for (var c = 0; c < CFG.RUN.contacts; c++) {
      var zone = F.zones.forContact(c);
      var truth = CFG.SCOPE.minTarget +
        Math.floor(rand() * (CFG.SCOPE.maxTarget - CFG.SCOPE.minTarget + 1));

      var decoys = [];
      var minSep = CFG.DECOY_MIN_SEP_FACTOR * zone.sigma;
      var guard = 0;
      while (decoys.length < zone.decoys && guard < 200) {
        guard++;
        var d = CFG.MIN_DECOY_EDGE +
          Math.floor(rand() * (CFG.SCOPE.maxSu - 2 * CFG.MIN_DECOY_EDGE + 1));
        if (Math.abs(d - truth) < CFG.MIN_DECOY_GAP) continue;
        var clash = false;
        for (var k = 0; k < decoys.length; k++) {
          if (Math.abs(d - decoys[k]) < minSep) { clash = true; break; }
        }
        if (clash) continue;
        decoys.push(d);
      }
      if (decoys.length < zone.decoys) {
        throw new Error('decoy generation starved: seed=' + seed + ' contact=' + c);
      }

      contacts.push({
        i: c,
        zone: zone.id,
        site: pool[c],
        truth: truth,
        sigma: zone.sigma,
        decoys: decoys
      });
    }
    return contacts;
  }

  F.rounds = {
    generate: generate,
    SITES: SITES
  };
})(window.FATHOM);
