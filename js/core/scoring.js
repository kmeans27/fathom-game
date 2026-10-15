/* scoring.js — pure tier maths (plan §3.4/§3.5). Never touches the DOM. */
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';

  var CFG = F.config;

  function tierFor(errSu) {
    for (var i = 0; i < CFG.TIERS.length; i++) {
      if (errSu <= CFG.TIERS[i].tol) return CFG.TIERS[i].id;
    }
    return CFG.MISS_ID;
  }

  function pointsFor(tierId) {
    for (var i = 0; i < CFG.TIERS.length; i++) {
      if (CFG.TIERS[i].id === tierId) return CFG.TIERS[i].points;
    }
    return 0;
  }

  function evaluate(input) {
    var errSu = Math.abs(input.pickSu - input.truthSu);
    var tier = tierFor(errSu);
    var silent = input.pingsUsed === 0;
    var zone = F.zones.get(input.zoneId);
    var stakeMult = CFG.STAKE_MULT[input.stake];
    var basePoints = pointsFor(tier);
    var points = tier === CFG.MISS_ID
      ? 0
      : Math.round(basePoints * stakeMult * zone.mult);
    var metres = Math.round(points * CFG.DEPTH_PER_POINT);
    var hullCost = tier === CFG.MISS_ID ? CFG.STAKE_HULL_COST_ON_MISS[input.stake] : 0;
    var heal = CFG.SURVEY_HEAL;
    var surveyHeal = (tier === 'survey' && input.stake >= heal.minStake) ? heal.amount : 0;
    return {
      errSu: errSu,
      tier: tier,
      silent: silent,
      basePoints: basePoints,
      points: points,
      metres: metres,
      hullCost: hullCost,
      surveyHeal: surveyHeal
    };
  }

  // Worked-example fixture helper (plan Appendix B): max theoretical run.
  function maxTheoretical() {
    var survey = CFG.TIERS[0].points;
    var total = 0;
    for (var c = 0; c < CFG.RUN.contacts; c++) {
      var z = CFG.ZONE_BY_CONTACT[c];
      total += Math.round(survey * CFG.STAKE_MULT[3] * F.zones.get(z).mult);
    }
    return { points: total, metres: Math.round(total * CFG.DEPTH_PER_POINT) };
  }

  F.scoring = {
    tierFor: tierFor,
    pointsFor: pointsFor,
    evaluate: evaluate,
    maxTheoretical: maxTheoretical
  };
})(window.FATHOM);
