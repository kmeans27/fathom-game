# FATHOM — design notes

## The hook
A daily guessing game where the skill is *aim*, and the cost of aim is a shared budget.
Ten sonar pings for the whole run. Spend them where the trench is worth it, save
them for the rounds you'd rather gamble. That budget-allocation is the game's own
idea — Krillion scores rare answers, DLE games score deductions; FATHOM scores
*how much you paid to know*.

## Structure borrowed from the inspirations
- 7 rounds, ceiling 700 points, 1 point = 10 m, trench floor 7,000 m — Krillion's
  exact shape, so the score reads as a descent.
- Daily seed for everyone, shareable emoji grid — the DLE/Wordle daily ritual.
- One-shot, under two minutes a run — DLE's tempo.

## The two info actions
- **Sonar sweep (1 ping)** — tells you which half of your current window the target
  is in. Cheap, halves the map. Two sweeps in a row = a quarter window.
- **Echo (2 pings)** — draws a ±80 m band around the target. Expensive, precise.
- **0 pings** — blind commit. No information, but the tier score is doubled. The
  gamble is the same bet Cuttle makes you place with one slice.

## Why the numbers are what they are
- `pingBudget: 10` across 7 rounds: 10 is deliberately *not* enough to echo
  everywhere (7×2 = 14). A player who always echoes runs out around round 5 and
  has to gamble the last rounds; a player who never echoes is guessing 1000 m of
  map for a 5-point graze. The interesting plan is mixed: echo the deep rounds,
  sweep the cheap ones, blind-commit one or two for the ×2.
- `echoBand: 80` vs `bullseye tol: 20`: an echo guarantees a hit (±80 ≤ 100) and
  usually a bullseye if you centre the band. It never hands you a perfect —
  perfects come from blind play or from stacking a sweep inside a band.
- `perfect tol: 5` on a 1000 m map: 1% of the map. With a band you aim the middle,
  so perfects are a skill test against the band's edge, not luck.
- `blindBonus: 2`: a blind bullseye (×2 = 100) equals a paid perfect. The gamble
  is worth something real, but paid play still wins on expectation — the bonus is
  for the bragging, not the meta.
- Tiers 100/50/20/5 with tolerances 5/20/100/250: each tier is a clean factor
  apart so the share grid reads as a curve, and a graze (±250 = a quarter map) is
  the floor reward for a bad-faith click.
- `targets 60..940`: the map's edges are never targets, so "guess the edge" is
  never free information.

## Feel
- The page itself descends: `--depth` is set from your score and the background
  gradient and light shafts slide down. Your score *is* the descent, like Krillion.
- A hit plays a rising ping, a miss thuds, a perfect shakes the screen.
- Reduced motion: no shake, no drifting shafts, no animated banner.

## Deliberately not in v0.1
No accounts, no server, no leaderboard (local best only), no audio files.
