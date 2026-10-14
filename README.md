# FATHOM

A daily depth game in the browser. Same trench for every player, every day.

Ten sonar pings for seven rounds. Spend them where the trench is worth it —
save them for the rounds you'd rather gamble. Every point takes you ten metres
down. The ceiling is 7,000 m: the floor of the trench.

Play it by opening `index.html` — no build, no dependencies, no accounts.

## How a round plays

1. A dive site is named. Somewhere between 0 m and 1000 m is the target depth.
2. Drag the marker to where you think it is.
3. Before you commit, spend pings:
   - **Sonar sweep** (1 ping) — which half of your window the target is in.
   - **Echo** (2 pings) — a ±80 m band around the target.
   - **Nothing** — blind commit, but the score for that round is doubled.
4. **Lock in.** Tiers: perfect ±5 m (100), bullseye ±20 m (50), hit ±100 m (20),
   graze ±250 m (5), miss 0.

Seven rounds, 700 points ceiling, one point = ten metres.

## Why it's a game and not a quiz
The daily seed is the same for everyone: same sites, same targets, same order.
Your result is a shareable grid — colours for tiers, a 💠 for a hit you paid
nothing for. The grid is the brag; the number is the depth you reached.

## Layout of the code
One file per small part — the game is the map of its own files.

| file | what it owns |
| --- | --- |
| `index.html` | the shell: three layers (sea, stage, ui) and nothing else |
| `js/main.js` | the run loop; owns state, wires the rest |
| `js/balance.js` | every tunable number in one place |
| `js/rounds.js` | the seeded trench: sites, targets, daily seed |
| `js/sonar.js` | the two info actions, pure |
| `js/score.js` | tiers and the blind bonus, pure |
| `js/share.js` | the emoji grid and share text |
| `js/save.js` | localStorage bests — no accounts, no server |
| `js/ui.js` | every DOM node, the depth map, input controls |
| `js/fx.js` | screen shake |
| `js/audio.js` | tiny WebAudio pings, no files |
| `css/base.css` | layout only |
| `css/theme-ocean.css` | colour and type only |
| `css/dive.css` | the descent itself: the page sinks as your score rises |
| `tests/` | node:test for score, sonar, rounds |
| `docs/DESIGN.md` | why every number is what it is |
| `ROADMAP.md` | where v0.1 ends and v1.0 begins |

## Tests
`node --test tests/` — 20 checks over scoring boundaries, sonar narrowing,
seed determinism. The game loads with `node --check` on every module.

## Roadmap
See `ROADMAP.md`. v0.1 is what plays here: the full loop, daily seed, share
grid, local bests. The roadmap is the honest next steps, not a wishlist.
