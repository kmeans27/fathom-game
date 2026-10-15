/* score.js — pure scoring. No DOM, no state: testable in isolation. */

function evaluate(guess, target, pingsUsed) {
  const err = Math.abs(guess - target);
  let tier = null;
  for (const t of TIERS) {
    if (err <= t.tol) { tier = t; break; }
  }
  if (!tier) return { tier: 'miss', points: 0, err, silent: pingsUsed === 0 };
  const silent = pingsUsed === 0;
  const mult = silent ? TRENCH.blindBonus : 1;
  return {
    tier: tier.id,
    points: Math.min(tier.points * mult, TRENCH.maxPoints),
    silent,
    err,
  };
}
