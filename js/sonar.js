/* sonar.js — the two info actions. Pure: given a state, return a new state. */
import { TRENCH } from './balance.js';
export function sweep(state, target) {
  /* "which half is the target in?" — cheapest way to cut the map. */
  const mid = Math.round((state.hi + state.lo) / 2);
  const lo = target < mid ? state.lo : mid;
  const hi = target < mid ? mid : state.hi;
  return { ...state, lo, hi, pings: state.pings - TRENCH.sweepCost };
}
export function echo(state, target) {
  /* "the target is within this band" — expensive but precise. */
  const band = TRENCH.echoBand;
  return {
    ...state,
    lo: Math.max(state.lo, target - band),
    hi: Math.min(state.hi, target + band),
    pings: state.pings - TRENCH.echoCost,
    band: true,
  };
}
export function canSweep(state) { return state.pings >= TRENCH.sweepCost && state.hi - state.lo > 1; }
export function canEcho(state) { return state.pings >= TRENCH.echoCost; }
