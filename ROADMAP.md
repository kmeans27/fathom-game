# ROADMAP

v0.1 is done and playable: daily seed, 7 rounds, shared ping budget, sweep/echo,
blind bonus, share grid, local bests, the descent. Everything below is next, in
order, each step shippable on its own.

## v0.2 — the daily ritual
- [ ] Day rollover at UTC midnight, shared for everyone (today: local date).
- [ ] A played-today guard: one daily run per day, with a "replay endless" nudge.
- [ ] Streak counter: consecutive days played, shown on the share card.

## v0.3 — the share card earns a home
- [ ] A static leaderboard: a small JSON index committed to the repo, PR per day.
      Tamper-limited like Krillion's local scores; say so in the UI, not in code.
- [ ] `shareText` gains the ping plan ("4-2-0-…") so replays of a run are possible.

## v0.4 — the game gets a second axis
- [ ] A second daily mode: the *reverse* trench — start at the floor, ascend.
      Same rules, inverted map; a different curve, not a reskin.
- [ ] Achievements (pure localStorage, no server): SILENT DESCENT (a blind
      perfect), NO WASTE (a run with 0 pings left), FULL BAND (7 bullseyes).

## v1.0 — polish pass
- [ ] The fauna: depth-zone silhouettes in the descent layer, seeded per day.
- [ ] Mobile pass: touch drag verified on the map, tap targets ≥ 44 px.
- [ ] A colour-blind-safe tier palette (the share grid must read without colour
      alone: add a shape per tier).
- [ ] A one-screen "how it works" card for first-time players.

## Parked, not planned
- Multiplayer same-trench races (needs a server; the local-first rule is the point).
- Accounts, subscriptions, paid tiers — FATHOM stays free and local.
