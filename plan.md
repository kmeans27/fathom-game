# FATHOM v1.0 — "The Descent"

**Rework plan for the FATHOM browser game.**
Status: proposed · Owner: whoever picks it up · Supersedes `ROADMAP.md` · Target: a complete, shippable, addictive, good-looking daily browser game.

> This document is written to be executed. It contains the design spec, every tunable number, the module map with function contracts, the art/audio direction, a phased build order, the test plan, and the definition of done. An agent should be able to implement v1.0 from this document alone. Where a decision is made, the reason is stated. Where a number is arbitrary, it is marked tunable.

---

## 0. TL;DR for the implementer

Rework FATHOM from **"buy precision, then guess a depth on a ruler"** into **"read a contact, buy exactly as much certainty as you can afford, then bet on how sure you are."**

Keep everything that is already good: the deep-sea identity, the deterministic daily seed, the shared ping economy, the one-gesture aim, the emoji share grid, local-first with no server, no build step, works from `file://`.

Add the three things that turn a quiz into a game:

1. **The read** — a *noisy* sonar scope. The contact is a cloud of returns, not a dot. Reading a scatter's centre is a real, learnable skill.
2. **The buy** — a tighter ping economy with a *third* action (`gain`) that helps you *judge* rather than hands you the answer, plus decoys that punish sloppy sweeps.
3. **The bet** — an explicit stake dial (`1× / 2× / 3×`) on your own confidence. Payout scales with the stake; a *miss* costs hull. Calibration — knowing how much you don't know — becomes the meta-skill.

Around that core: escalating depth zones, a hull you can crack, UTC-daily ritual with streaks, a logbook, achievements, a full Canvas-2D ocean, and real juice.

**Hard constraints (do not violate):**

- No build step, no bundler, no runtime dependencies. Classic `<script defer>` tags. `index.html` must still open and play from `file://`.
- Local-first. No accounts, no server, no leaderboard, no network calls at runtime. Ever.
- All core game logic is **pure and DOM-free** so it stays testable under `node --test`.

---

## 1. Why the current game isn't addictive yet (the honest diagnosis)

Read the v0.1 code before changing it; the diagnosis is the justification for every change below.

| Problem in v0.1 | Why it kills retention | Fix in v1.0 |
| --- | --- | --- |
| `echo` + centre the band is a near-solvable plan | Once solved, there is no skill left; you just execute. Game over. | Reading a *noisy scatter* is never fully solvable; `gain` sharpens judgement instead of revealing the answer. |
| Reward is capped per round, no risk | No tension, no regret, no "one more". | Stake dial: payout vs. hull. Misses hurt. Greed is a real decision. |
| Depth is pure output | Deeper = more points, but nothing changes. No escalation. | Depth zones change the rules: more noise, more decoys, higher payouts. |
| `blindBonus` is all-or-nothing | The only gamble is "use zero pings", which is a fork, not a dial. | Stake is continuous, independent of pings, and interactive. |
| Clicking a 1000 m ruler to ±5 m needs 0.5 % mouse precision | The skill ceiling is mouse control, not the game. | Aim is on a scatter's centroid; keyboard nudge exists for everyone. |
| Local-date daily, no played-today guard, no streak | The ritual is not actually shared and has no continuity. | UTC day key, one scored run per day, streaks, logbook. |
| Share grid colour-only | Fails colourblind players; the grid is the brag, so it must read. | Distinct glyph + shape per tier; grid is colourblind-safe by construction. |
| Bare CSS gradient + oscillator beeps | Fine, but not "good looking". | Procedural Canvas ocean, per-zone fauna, camera descent, layered audio. |

The moat — the thing that makes FATHOM unique — is **the bet**. Do not let a future change quietly delete the stake dial, hull, or `gain`; they are what makes this not-a-Wordle-clone.

---

## 2. The concept

### 2.1 One-line pitch

> A two-minute daily descent into the deep. Read the contact, buy just enough certainty, and bet on how sure you are — go deeper than everyone else without cracking the hull.

### 2.2 Tagline and hook

- **Tagline:** *Know how much you don't know.*
- **Hook (first 5 seconds):** a bright sonar ping arcs down a black scope, a scatter of returns blooms, a low drone swells — and you are already dragging to read it. No login, no menu wall.

### 2.3 Why it is addictive (mechanic → retention principle)

| Mechanic | Principle it exploits |
| --- | --- |
| Scatter-reading with `gain` | *Mastery* — a learnable skill with a visible curve. |
| Stake dial + hull | *Loss aversion + agency* — you chose the risk; the loss is yours. |
| Composability (`sweep` stacking vs `echo` vs `gain`) | *Expression* — multiple viable plans, a personal style. |
| Depth zones + floor at 7,000 m | *Anticipation* — a visible finish line you can almost touch. |
| Daily seed, one scored run | *Scarcity + ritual* — you get one shot; you come back tomorrow. |
| Streak + logbook + personal bests | *Accumulation* — quitting breaks something you own. |
| Share grid | *Social proof* — the brag is portable. |
| Two-minute run, instant restart | *Composure* — no friction to "one more". |

### 2.4 What is deliberately NOT in v1.0

Accounts, servers, leaderboards, multiplayer, monetisation, ads, analytics, backend, frameworks, bundlers, runtime dependencies, images, webfonts, sound files. Everything ships as text.

---

## 3. Core loop

A **run** is **8 contacts**. Each contact is one round:

```
BRIEF            read the site card, see the zone and its danger
  ↓
READ             the contact appears as a scatter on the sonar scope (0–1000 su)
  ↓
BUY (optional)   spend pings: sweep / echo / gain, in any order, any repeat
  ↓
BET              set the stake: 1× (CAUTION) · 2× (PRESS) · 3× (GAMBLE)
  ↓
LOCK IN          the sub descends; the true position is revealed; the result beats
  ↓
RESOLVE          points × stake × zone → metres of descent added to the run
  ↓
next contact … or RESULTS  (or, if the hull cracked: HULL LOST)
```

- The whole loop is **one gesture on the scope** plus three buttons and a dial.
- A run is designed to take **90–150 seconds**.
- Input must work with **mouse, touch, and keyboard**.

### 3.1 Axis vocabulary (keep this consistent in code and UI)

- **`su` — sonar units.** The scope axis, always `0…1000`. Every position, tolerance, noise and decoy is in `su`. Never call it "depth" in code.
- **`m` — metres.** The *run's* descent. Accumulated from points. This is the scoreboard number and never appears on the scope.
- This split is essential: it lets the aim window stay tight while the descent stays grand.

### 3.2 The sonar scope (the star of the screen)

- A vertical ruler, `0 su` at the top, `1000 su` at the bottom (matches the "deeper = lower" language already in v0.1).
- The **contact** is rendered as a scatter of ~90 returns, sampled around the hidden true position with standard deviation `σ` (zone-dependent). The scatter's centroid *is* the truth. Reading a centroid is the skill.
- The scatter is **honest**: it is drawn from the same distribution the truth is drawn from, so a good reader is genuinely accurate. Do not fake it.
- **Decoys** render as dimmer (alpha × 0.45), wider (`σ × 1.6`) scatters. They are never within `120 su` of the truth.
- Your **pick** is a hairline with a glow. Drag anywhere on the scope to set it; the pick is also nudgeable by keyboard.
- After lock-in the true position is drawn as a solid amber line, the pick stays, and the error is shown in `su` and as a tier band, then everything animates.

### 3.3 The three purchases (ping economy)

A single **shared budget for the whole run**: `12 pings`, 8 contacts. Always-echo costs 16, so you *must* choose. Each action has a different *character*, not just a different price:

| Action | Cost | Effect | Character |
| --- | --- | --- | --- |
| **SWEEP** | 1 | Split the current window at its midpoint; you learn which half holds the truth. Any decoy in the discarded half is **crossed out**. | Cheap, iterative. Stacking 3 sweeps leaves a `125 su` window — tighter than echo — but slowly and it still leaves the scatter noisy. |
| **ECHO** | 2 | Draw a band of `±60 su` around the truth. Decoys inside the band are crossed out; the band is *always* truthful. | Expensive, decisive. Buying it every round is impossible. |
| **GAIN** | 1 | Halve the visible scatter's `σ` for the rest of the round. Does **not** tell you where the truth is. | The judgement helper. Rewards a player who reads well; useless to a player who guesses. |

Rules:
- Actions are applied in any order and may be repeated (`sweep` stacks, `echo` is idempotent and blocked when the window is already within the band, `gain` stacks once).
- The window starts at the full scope (`0…1000`). `sweep` can be used while `hi - lo > 2`.
- **Max pings per round: 5.** Excess pings are refused with a shake + buzz. This forces allocation across the run instead of dumping the budget on one contact.
- `gain` must visibly *change the scatter* (returns contract toward the truth) so the player sees what they bought.

### 3.4 Scoring

Positions are compared in `su` on the scope.

**Tiers** (`TIERS`, tolerance in `su`, base points):

| id | label | tolerance | base points |
| --- | --- | --- | --- |
| `survey` | SURVEY | ±5 | 100 |
| `bullseye` | BULLSEYE | ±20 | 60 |
| `hit` | HIT | ±100 | 30 |
| `graze` | GRAZE | ±250 | 10 |
| `miss` | MISS | >250 | 0 |

(`survey` replaces v0.1's `perfect`; rename everywhere. Keep the tier ids exactly as above — the share code, CSS and tests key off them.)

**Zone multipliers** (by contact index; see §4):

| zone | mult |
| --- | --- |
| Sunlight | 1.00 |
| Twilight | 1.15 |
| Midnight | 1.35 |
| Abyssal | 1.60 |
| Hadal | 2.00 |

**Stake multipliers:** `1× → 1`, `2× → 2`, `3× → 3`.

```
points = Math.round(tierPoints × stakeMult × zoneMult)   // miss => 0
```

**Descent:** `metres = Math.round(points × 2.2)`, accumulated across the run.

**The floor:** the trench floor is `7000 m`. A theoretically perfect run (8 × SURVEY, all staked 3×) scores exactly `3180 points = 6996 m` — i.e. the floor is *just* out of reach. This is intentional: "TOUCH THE FLOOR" stays a legendary, near-impossible goal and the aspirational moon-shot. If a theoretical max ever reaches 7,000 m, lower `depthPerPoint` slightly; add a unit test asserting `maxTheoreticalDepth < FLOOR`.

### 3.5 The stake dial and the hull

- **Stake** is chosen per contact, changeable until LOCK IN. Labels: `1× CAUTION`, `2× PRESS`, `3× GAMBLE`.
- The UI states the consequence in plain words: *"3× — a miss costs 3 hull."*
- **Hull integrity: 3.** A **miss** costs `stake` hull. Everything else (graze and up) costs nothing.
- **Recovery:** a `SURVEY` at stake ≥ 2 restores `1` hull (capped at 3). This creates the greed/caution loop: the bold play pays and heals, but a mistake at 3× can end you.
- On hull reaching `0` the run ends immediately → `HULL LOST`. The depth reached is banked and shown, but a crushed run **can never set a personal best** and the share card is stamped `⌁HULL LOST`. That sting is the whole point; do not soften it into a slap on the wrist.
- `silent = (pingsUsed === 0)` is still tracked. A silent hit earns the `💠` glyph.

### 3.6 The result beat (per contact)

Between LOCK IN and the next contact, play a fast, legible resolution (~1.2 s, skippable by click/keypress):

1. Camera descends (`metres` gained) — zone may change mid-beat.
2. The true line snaps in; the distance between pick and truth animates as a bracket.
3. Tier stamp lands (`SURVEY` / `BULLSEYE` / …), the number counts up, the stake flashes.
4. Sound: tier-specific (see §8).
5. For `survey`: freeze-frame (hit-stop), flash, particle burst, screen shake, and the hull pip re-lights if it recovered.

---

## 4. Progress, zones, and difficulty curve

Zones are the escalation and the visual variety. Contact `i` (1-based) sits in a zone by index:

| # | zone | depth band (m) | zone mult | noise `σ` (su) | visible 2σ | decoys |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sunlight | 0–200 | 1.00 | 22 | 44 | 0 |
| 2 | Sunlight | 0–200 | 1.00 | 22 | 44 | 0 |
| 3 | Twilight | 200–1000 | 1.15 | 34 | 68 | 1 |
| 4 | Twilight | 200–1000 | 1.15 | 34 | 68 | 1 |
| 5 | Midnight | 1000–4000 | 1.35 | 52 | 104 | 1 |
| 6 | Midnight | 1000–4000 | 1.35 | 52 | 104 | 1 |
| 7 | Abyssal | 4000–6000 | 1.60 | 74 | 148 | 2 |
| 8 | Hadal | 6000–7000 | 2.00 | 100 | 200 | 2 |

The zone a contact is *in* is determined by the contact's **index** (the table above), not by the player's accumulated depth — the run always visits all five zones. The player's *accumulated depth* only drives the camera, the sea rendering, and the "current zone" readout on the HUD.

Difficulty emerges from the table: Sunlight is a warm-up (centre a tight blob, no decoys), Hadal is a nightmare (`±100 su` truth, two decoys, and a GRAZE is a real outcome without an echo). The zone multipliers make the deep rounds *worth* the risk.

**Target/decoy generation rules (must hold):**
- Truth ∈ `[60, 940] su`, never near the edges, so "pick the end" is never free.
- A decoy is ≥ `120 su` from the truth and ≥ `80 su` from either edge.
- Decoys never overlap each other by more than `σ`.
- Noise is drawn deterministically from the seed (see §5.2).

---

## 5. Architecture

### 5.1 Guiding rules

1. **Core is pure.** `js/core/**` must not touch `document`, `window` (except the namespace assignment at the very bottom), `Math.random`, `Date.now`, or `localStorage` — except `storage.js`, `daily.js` and `stats.js`, which take their environment as injected arguments so they remain testable.
2. **Render never scores.** `js/render/**` reads state and draws. It never mutates game state.
3. **One event bus.** UI and render subscribe to state changes; nothing reaches into another module's internals.
4. **Numbers live in one file.** `js/core/config.js` is the *only* place with tunables. No magic numbers in behaviour code.
5. **Classic scripts, one namespace.** Every file starts with the same guard and attaches to `window.FATHOM`. No `import`/`export`, no IIFE needed, but keep the top-level surface small.

```js
// top of every module file
window.FATHOM = window.FATHOM || {};
(function (F) {
  'use strict';
  // ... module code ...
  F.scoring = { evaluate, tierFor };
})(window.FATHOM);
```

`index.html` loads files in dependency order with `<script defer>` — **core first, then render, then ui, then main**. Keep the existing "classic deferred scripts instead of ES modules" decision (commit `e39e7be`) because it preserves `file://`.

### 5.2 Determinism contract

- One `mulberry32` seeded stream per run, from `hashSeed('fathom:v2:' + dayKey)` for daily and from a random 32-bit int for endless.
- **Derive, don't draw.** Generation consumes the stream in a fixed order: for each contact, in order: `truth`, `decoys[]`, then nothing else. Render-time randomness (particle jitter, fauna wobble) uses a **separate non-gameplay stream** seeded from the run seed, so it can never desync the game.
- Expose `F.rng.stream(seed)` and never call `Math.random` in `js/core/**`. A test greps core for `Math.random`.

### 5.3 File map

```
index.html                  shell: <canvas id="sea">, DOM mount, script tags in order
assets/
  favicon.svg               reworked mark
  og.svg                    social/OG image (procedural SVG, no PNG needed)
css/
  tokens.css                design tokens: colour, type scale, spacing, radii, shadow, motion
  base.css                  reset + app layout (grid), focus rings
  ui.css                    components: buttons, dial, HUD, cards, log, share, dialogs, screens
  zones.css                 per-zone CSS variable overrides (class on <body>: .zone-hadal …)
js/
  core/
    rng.js                  mulberry32, hashSeed, stream()
    config.js               ALL tunables (see §6)
    zones.js                ZONES table + zoneFor(index) + palette/fauna/particle data
    rounds.js               generateRounds(seed) -> contacts[] (truth, decoys, zone, site)
    scoring.js              tierFor(err), evaluate(pick, truth, pingsUsed, stake, zone) -> Result
    sonar.js                sweep/echo/gain + can* predicates (pure reducers on round state)
    run.js                  run state machine: create/act/stake/lock/next/finish (pure)
    daily.js                dayKeyUtc(date), dailySeed(dayKey), nextUtcMidnight(date)
    share.js                grid, text, and a stable encode/decode for the run
    storage.js              namespaced localStorage with schema version + v1 migration
    stats.js                streaks, bests, achievements, history summaries (pure)
  render/
    canvas.js               DPR-aware sizing, single RAF loop, layer registry, quality scale
    sea.js                  depth gradient, god rays, caustics (cached offscreen)
    particles.js            pooled marine snow, bubbles, burst emitters
    fauna.js                procedural zone creatures (silhouette + bioluminescence)
    sub.js                  submersible + tether + camera descent easing
    scope.js                the sonar scope: ruler, window, scatter, decoys, pick, reveal, ping arcs
    fx.js                   shake, hitStop, flash, chromatic pulse, shake-free fallbacks
    transitions.js          round/zone/screen transitions
  audio/
    audio.js                engine: init on first gesture, master/mute, buses, reverb (delay+feedback)
    sfx.js                  ping, echo, gain, thud, tier chimes, ui clicks, hull crack
    bed.js                  depth-following drone/ambience
  ui/
    dom.js                  el() builder, els cache, event delegation helpers, formatters
    screens.js              screen router: MENU/BRIEF/RUN/RESULTS/LOGBOOK/SETTINGS
    hud.js                  points, depth, zone, pings, hull pips, round counter
    controls.js             sweep/echo/gain buttons, stake dial, lock button
    scopeinput.js           pointer + keyboard input for the scope -> F.run.setPick
    cards.js                site card (name/flavour/zone/danger)
    log.js                  the run log ("target x · you y · tier +n")
    share.js                share card DOM, copy, native share
    dialogs.js              onboarding, stats, settings, achievements toasts
    a11y.js                 aria-live announcer, focus management
  main.js                   boot: build DOM, wire bus, router, input, first-run tutorial
  tutorial.js               the interactive 3-panel onboarding over a real contact
tests/
  loader.mjs                loads js/core/*.js into a vm context, exposes FATHOM
  scoring.test.js  sonar.test.js  rounds.test.js  run.test.js
  daily.test.js    storage.test.js  stats.test.js  share.test.js
  determinism.test.js       (no Math.random in core; same seed => identical run)
docs/
  DESIGN.md                 why every number is what it is (rewrite)
  ARCHITECTURE.md           module contracts, bus, determinism (new)
  ART.md                    palette, zone look, motion and audio direction (new)
README.md                   pitch, how to play, how to run tests, how it's built
.github/workflows/test.yml  fixed CI: checkout, node, node --check + node --test
```

### 5.4 Module contracts

Core signatures (all pure; the implementer may add helpers but not remove these):

```js
// core/config.js
F.config = {
  RUN:     { contacts: 8, pingBudget: 12, maxPingsPerRound: 5, hull: 3 },
  SCOPE:   { maxSu: 1000, edgeMargin: 60, minTarget: 60, maxTarget: 940 },
  TIERS:   [ {id:'survey',tol:5,points:100}, {id:'bullseye',tol:20,points:60},
             {id:'hit',tol:100,points:30}, {id:'graze',tol:250,points:10} ],
  PRICES:  { sweep: 1, echo: 2, gain: 1 },
  ECHO_BAND: 60,
  SWEEP_MIN_WINDOW: 2,
  MIN_DECOY_GAP: 120, MIN_DECOY_EDGE: 80,
  STAKE_MULT:   { 1: 1, 2: 2, 3: 3 },
  STAKE_HULL_COST_ON_MISS: { 1: 1, 2: 2, 3: 3 },
  SURVEY_HEAL:  { minStake: 2, amount: 1, cap: 3 },
  DEPTH_PER_POINT: 2.2,
  FLOOR_M: 7000,
  ZONE_BY_CONTACT: ['sunlight','sunlight','twilight','twilight',
                    'midnight','midnight','abyssal','hadal'],
  DAILY_SEED_SALT: 'fathom:v2:',
  STORAGE_KEY: 'fathom:v2',
};

// core/rng.js
F.rng = { mulberry32(seed), hashSeed(str), stream(seed) }   // stream is stateful, mulberry32 under the hood

// core/zones.js
F.zones = {
  ALL: ['sunlight','twilight','midnight','abyssal','hadal'],
  get(id) -> { id, label, fromM, toM, mult, sigma, decoys, palette:{...}, fauna:[...], rays, snow, vignette },
  forContact(i) -> zone,
  forDepth(m) -> zone,                  // camera + HUD readout
};

// core/rounds.js
F.rounds = {
  generate(seed) -> Contact[],          // Contact = { i, zone, site:{name,flavour}, truth, sigma, decoys:[su], pings? no }
  dailySeed(dateOrKey),                 // delegates to daily.js
};

// core/sonar.js  — round state: { lo, hi, pings, sigma, used:{sweep,echo,gain}, decoys:[{su,dead}] }
F.sonar = {
  init(contact) -> RoundState,
  canSweep(rs), canEcho(rs), canGain(rs),
  sweep(rs) -> RoundState,              // halves window; kills decoys in the discarded half
  echo(rs)  -> RoundState,              // sets lo/hi to truth±ECHO_BAND; kills decoys outside
  gain(rs)  -> RoundState,              // sigma /= 2 (once)
  pingsUsed(rs) -> number,
};

// core/scoring.js
F.scoring = {
  tierFor(errSu) -> tierId,
  evaluate({ pickSu, truthSu, pingsUsed, stake, zoneId }) ->
    { errSu, tier, silent, basePoints, points, metres, hullCost, surveyHeal },
};

// core/run.js
F.run = {
  create({ mode:'daily'|'endless', seed, dayKey }) -> RunState,
  state -> RunState,                     // current, or null
  setPick(su), setStake(n),
  act(action),                           // 'sweep'|'echo'|'gain' — spends pings, returns bool
  lock() -> ContactResult,               // resolves the round, applies hull, assigns metres
  next() -> 'contact'|'results'|'crushed',
  results() -> RunResults,
};

// core/daily.js
F.daily = { dayKeyUtc(date), seed(dayKey), msUntilRollover(date), isSameDay(a,b) };

// core/storage.js
F.storage = { read(), write(state), migrate(v1State) -> v2State, clear(), available() };

// core/stats.js
F.stats = { streak(history, todayKey), best(history), achievements(history, run) -> string[], summarize(history) };

// core/share.js
F.share  = { grid(results), text(run), encode(run), decode(str) };
```

`RunState` (shape — keep names stable, tests assert on them):

```js
{
  mode, seed, dayKey|null,
  contact: 0,                          // index of the current contact
  points: 0, depthM: 0,
  pings: 12, hull: 3,
  stake: 1,
  pickSu: 500,
  round: RoundState,                   // from F.sonar.init
  results: ContactResult[],            // appended on lock()
  status: 'playing'|'results'|'crushed',
}
```

`ContactResult`: `{ i, zoneId, tier, errSu, silent, stake, points, metres, hullCost, surveyHeal, truthSu, pickSu, pingsUsed }`. The share grid and the log read only from this array.

### 5.5 The event bus

```js
F.bus = { on(evt, fn), emit(evt, payload) }
```

Events: `run:start`, `run:pick`, `run:stake`, `run:act`, `run:lock`, `run:resolve`, `run:zone`, `run:crush`,
`run:finish`, `screen:change`, `fx:shake`, `fx:burst`, `audio:ping`, `audio:echo`, `audio:gain`, `audio:tier`,
`audio:hull`, `a11y:announce`.

Rule: `run.js` is the only module that emits gameplay events; `fx`, `audio`, `ui`, `render` are pure subscribers. This is what keeps the juice decoupled from the rules.

---

## 6. Config (one table, the whole balance)

Everything below lives in `js/core/config.js` and is marked **tunable** unless noted.

| Key | Value | Rationale |
| --- | --- | --- |
| `RUN.contacts` | 8 | Longer than the 7 that made runs feel over just as they started. |
| `RUN.pingBudget` | 12 | Always-echo costs 16 → allocation is mandatory. |
| `RUN.maxPingsPerRound` | 5 | Stops one round from eating the run; forces planning. |
| `RUN.hull` | 3 | Enough to survive two mistakes (if staked low), not three. |
| `SCOPE.maxSu` | 1000 | Keeps parity with v0.1's feel. |
| `SCOPE.minTarget/maxTarget` | 60/940 | Edges are never free information. |
| `PRICES.sweep/echo/gain` | 1/2/1 | Sweep is the cheap scalpel; echo the decisive buy; gain the judgement buy. |
| `ECHO_BAND` | 60 | Guarantees ≥ HIT, close to BULLSEYE, never SURVEY. |
| `MIN_DECOY_GAP` | 120 | A decoy can mislead but cannot masquerade as truth. |
| `TIERS` | see §3.4 | Clean factor-ish steps so the share grid reads as a curve. |
| `STAKE_MULT` | 1/2/3 | Linear payout, linear risk — legible. |
| `SURVEY_HEAL` | stake≥2 → +1 | The greed/comeback loop. |
| `DEPTH_PER_POINT` | 2.2 | Makes a perfect run land at ~6,996 m, just shy of the floor. |
| `FLOOR_M` | 7000 | The myth. |
| zone `sigma` | 22/34/52/74/100 | The difficulty curve is mostly this column. |
| zone `mult` | 1.00/1.15/1.35/1.60/2.00 | Depth pays more, so risk is rational. |
| `DAILY_SEED_SALT` | `'fathom:v2:'` | Versioned so v1 dailies don't collide. |
| `STORAGE_KEY` | `'fathom:v2'` | New schema; migrate (not discard) v1 bests. |

**Balance assertions to encode as tests:**
- `maxTheoreticalDepth < FLOOR_M` (see §3.4).
- An all-echo plan (`8 × echo = 16`) exceeds `pingBudget` → allocation is forced.
- Centring an unassisted Sunlight scatter yields BULLSEYE-or-better in ≥ 60 % of seeds; Hadal unassisted yields HIT-or-worse in ≥ 60 % of seeds. (Property test over many seeds — this is the difficulty curve's regression guard.)

---

## 7. Look (art direction)

Everything is procedural: **no image files, no webfonts**. Target ≤ 200 KB total payload.

### 7.1 Palette and tokens (`css/tokens.css`)

```css
:root{
  /* ink + foam */
  --ink-0:#01050b; --ink-1:#04121f; --ink-2:#072a44; --ink-3:#0b4066;
  --foam:#dff2f8;  --foam-dim:#8fb3c4; --muted:#5d7f93;
  /* signals */
  --sonar:#37e0ff; --sonar-deep:#0f7fa8; --amber:#ffb347; --danger:#ff5b5b;
  --good:#5be39a;  --gilt:#ffd479;
  /* structure */
  --line:rgba(55,224,255,.28); --line-soft:rgba(55,224,255,.12);
  --glass:rgba(4,18,31,.62); --shadow:0 18px 60px rgba(0,0,0,.55);
  /* motion */
  --t-fast:120ms; --t-mid:240ms; --t-slow:520ms; --t-beat:1200ms;
  --e-out:cubic-bezier(.16,1,.3,1); --e-spring:cubic-bezier(.34,1.56,.64,1);
  /* type */
  --f-ui:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --f-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
```

- Logotype: `FATHOM` in `--f-ui`, weight 800, `letter-spacing:.42em`, gradient text from `--sonar` to `--foam`. No font download.
- Numbers (score, depth, pings) are `--f-mono` with `font-variant-numeric: tabular-nums` so they don't jitter while counting up.
- Tier colours (also used in the share grid): survey `--gilt`, bullseye `--amber`, hit `--sonar`, graze `--sonar-deep`, miss `--muted`.

### 7.2 Zone look (`css/zones.css` + `js/render/sea.js`)

| zone | water (top→bottom) | light | particles | fauna |
| --- | --- | --- | --- | --- |
| Sunlight | `#0a4b74 → #0d6d9c` | hard god rays, strong caustics | sparse marine snow | schooling fish silhouettes |
| Twilight | `#06294a → #04182f` | soft rays, fading caustics | more snow | jellyfish (pulsing) |
| Midnight | `#010a16 → #01060f` | none, only glow | dense snow | lanternfish dots, siphonophore line |
| Abyssal | `#00040a → #000205` | none | slow, sparse | anglerfish lure, giant isopod |
| Hadal | `#000103 → #000001` | none, heavy vignette | almost none, drifting silt | ooze cracks, pressure tremors, faint vents |

Implementation notes:
- Static per-zone gradients and caustic tiles are rendered **once** to an `OffscreenCanvas` and blitted, then scrolled; only particles and fauna are per-frame.
- The camera has a **descent easing**: between rounds the whole scene translates by the metres gained over `--t-beat`, with a slight scale-up (parallax) so motion reads as *sinking*.
- **Silt** rises past the lens when the sub drops more than 400 m in a beat — a cheap, potent sense of speed.
- The **scope** is drawn on canvas above the sea: a dark glass panel, a hairline graticule every 100 `su`, the window band as a translucent fill, the scatter as additive dots with a soft bloom, decoys dimmer/wider, the pick as a glowing hairline, and each ping as an expanding arc with a decaying ring.

### 7.3 Motion and juice (`js/render/fx.js`)

| Event | FX |
| --- | --- |
| `run:pick` | pick line snaps to cursor with a 40 ms trail; faint tick sound |
| `sweep` | horizontal scan line sweeps the discarded half, which dims and collapses; discarded decoys get an ✕ |
| `echo` | expanding ring from the band centre, band edges glow, decoys outside fade to nothing |
| `gain` | scatter contracts toward truth with a spring, returns sharpen; a rising shimmer |
| `lock` | sonar ping arc fires downward, scope dims except the pick |
| `survey` | **hit-stop 90 ms**, white flash, 24-particle burst, shake 8, gilt bloom, tether sparkles, hull pip relights |
| `bullseye` | 14-particle burst, shake 5, amber bloom |
| `hit` | small burst, shake 3 |
| `graze` | amber flicker, no shake |
| `miss` | red vignette pulse, shake 6, hull pip cracks and dies, deep thud, camera lurches |
| `crush` | screen cracks (procedural SVG-ish lines), everything dims, slow fade to results |
| zone change | 900 ms colour cross-fade + fauna swap + bed key change |
| new personal best | gilt flood, confetti of bioluminescent dots, logotype pulses |

Discipline:
- Animate **transform/opacity** wherever possible; animate canvas pixel work only in the pooled particle layer.
- **Hit-stop** = freeze the RAF-driven simulation for N ms (~2–4 frames), never block the main thread.
- Every FX has a **reduced-motion branch**: shake/hit-stop/parallax/bursts off, replaced by instant state change + a colour pulse. FX modules must early-return when `F.a11y.reducedMotion()`.

### 7.4 Audio (`js/audio/*`)

No files; all WebAudio synthesis. Engine starts **only after the first user gesture** (browsers require it) and is mute-by-default-then-persisted.

- **Buses:** `master → { sfx, bed }`, plus a shared `convolver-ish` tail built from `DelayNode` + feedback `GainNode` (a 0.6 s sonar tail) so pings sound like they're underwater. No ConvolverNode impulse files.
- **`ping`** — sine at `f`, exponential decay, through the sonar tail; pitch encodes the y-position on the scope (higher = shallower).
- **`sweep`** — a band-passed noise sweep, short.
- **`echo`** — a two-tone interval (a fifth), longer tail.
- **`gain`** — a rising filtered shimmer.
- **Tier chimes:** survey = 4-note arpeggio (523/659/784/1046); bullseye = 3 notes; hit = 2; graze = single soft note; miss = `thud` (70 Hz triangle + 46 Hz sub) plus a hull-crack noise burst.
- **`bed`** — a continuous low drone whose filter cutoff and detune follow depth: bright and open in Sunlight (a major-ish fifth), sub-bass and detuned in Hadal. Cross-fade on zone change over 900 ms.
- Respect a `mute` and a `reducedAudio` preference (reduced = no bed, no tail). Never autoplay. Cap concurrent voices (pool of 12).

---

## 8. Screens and UX

### 8.1 Screens (`js/ui/screens.js`)

1. **MENU** — logotype, best depth + streak, primary CTA `DAILY DIVE` (or `DAILY DONE — play endless`), secondary `ENDLESS`, tertiary `LOGBOOK` / `SETTINGS`. Shows `#0417 · UTC` and time to the next daily.
2. **BRIEF** — the site card (name, flavour from the existing `SITES` list — keep and extend it), zone badge, danger note (decoys), ping budget and hull. `BEGIN`. Auto-advance after 2.5 s or on any input.
3. **RUN** — the scope centre-stage; HUD top (depth, zone, points, pings, hull pips, contact `n/8`); controls bottom (SWEEP / ECHO / GAIN, stake dial, LOCK IN); the log collapsed to the last line.
4. **RESULTS** — depth reached (big, counting up with the camera settling), zone badge, tier breakdown as a row of stamps, ping plan (`4-2-0-…`), hull state, streak increment, personal-best comparison, share card, `PLAY ENDLESS`, `MENU`. On crush: a `HULL LOST` variant with a crack overlay.
5. **LOGBOOK** — best depth, best per zone, runs played, streak current/best, last 90 days as a small depth-histogram (canvas or CSS bars), and the achievements grid (locked greyed, unlocked gilt).
6. **SETTINGS** — mute, reduced audio, reduced motion (also auto from the media query), colourblind mode (adds tier labels to the grid), large targets, replay tutorial, reset data.

### 8.2 Onboarding (`js/tutorial.js`)

First run only (flag in storage), skippable, replayable from Settings. Three beats over a **real generated contact**, spotlighting the relevant UI:

1. *"Read the bloom — drag the line to the middle of the returns."* (no pings available yet)
2. *"Buy certainty. SWEEP halves the map. ECHO draws a band. GAIN sharpens your eye — it never tells you the answer."*
3. *"Bet on yourself. 3× pays triple; a miss costs 3 hull."*

Then a fourth micro-beat on the first real round only: a tooltip on LOCK IN. Total < 25 s.

### 8.3 Accessibility (`js/ui/a11y.js`)

- **Keyboard:** `←/→` or `↑/↓` nudge pick ±1 `su`, `Shift` ±10, `PageUp/PageDown` ±100; `1/2/3` stake; `S/E/G` actions; `Enter/Space` lock; `M` mute; `?` help; `Esc` pause. All controls reachable by Tab with visible focus rings.
- **Screen reader:** one `aria-live="polite"` region announces each result ("Contact 3: 42 sonar units off, HIT, staked 2×, 69 points, 1,200 metres down. 9 pings left, hull 2 of 3."). The scope is `role="slider"` with `aria-valuenow/min/max/text`.
- **Reduced motion:** honour `prefers-reduced-motion` automatically plus a manual override; no shake, no hit-stop, no parallax, instant transitions.
- **Colourblind:** tier is always expressed as a **glyph + label + colour**; the share grid uses distinct shapes (`⬛▲◆●✦⬛`) with colour only as reinforcement. Never colour alone.
- **Targets:** all hit areas ≥ 44 px; the scope is drag-anywhere.
- **Contrast:** all text ≥ AA on its own background; verify per zone.

### 8.4 Share (`js/core/share.js`)

```
FATHOM #0417 · 5,124 m · MIDNIGHT
✦◆◆●💠⬛✦◆
stake 3·3·1·2·3·1·2·3   hull ●●○   pings 2 left
fathom.local            (no URL in v1.0 — nothing to link)
```

- Line 1: day number (UTC, `#NNNN`), depth with thousands separators, zone of the deepest contact.
- Line 2: one glyph per contact — tier shape, `💠` for a silent hit, `⬛` for a miss.
- Line 3: the stake plan joined by `·`, hull pips, pings remaining. This is the replayable "plan" line, and it is the bragging detail that makes people compare.
- Crushed runs append `⌁HULL LOST`.
- `share.encode`/`decode` produce a compact base64 of `{dayKey, results[], pings, hull}` so a pasted code can be re-rendered as a card without a server. Optional but specified.

---

## 9. Persistence

`localStorage['fathom:v2']`, one JSON object, schema-versioned:

```js
{
  version: 2,
  history: {                      // keyed by dayKey, capped at 90 entries (drop oldest)
    "2026-10-15": { depthM, points, hull, crushed, pingsLeft, results:[ContactResult-lite], stakePlan }
  },
  best:     { depthM, points, dayKey, zoneId, crushed:false } | null,
  zoneBest: { sunlight: m, twilight: m, midnight: m, abyssal: m, hadal: m },
  streak:   { current, best, lastDay },
  seen:     { tutorial:false },
  prefs:    { mute:false, reducedAudio:false, reducedMotion:null, colourblind:false, largeTargets:false },
  achievements: ["silent-survey", ...],
  v1:       { best, played, streak }   // preserved from the old key on migration
}
```

Rules:
- Reads/writes are wrapped in try/catch; if storage is unavailable, the game runs fully but nothing persists and a one-line notice says so (`localStorage` in a `file://` sandbox can throw — this must never crash the game).
- **Migration:** on first v2 boot, read `fathom:v1`, keep `best`/`streak`/`played` under `v1`, set `version:2`. Do not delete the v1 key.
- Rollover: `playedToday` is derived from `history[dayKeyUtc(now)]`, so it is correct across timezones and DST by construction. A defensive timer re-checks `dayKeyUtc` every 60 s so a run left open past midnight flips cleanly.

---

## 10. Testing

### 10.1 Automated (`node --test tests/`)

`tests/loader.mjs` loads **only** `js/core/*.js` (in dependency order) into a `vm` context with injected `{ localStorage, Date }` stubs, and exposes `FATHOM`. Update the `ORDER`/`NAMES` arrays.

| File | Asserts |
| --- | --- |
| `scoring.test.js` | Every tier boundary (`4/5`, `19/20`, `99/100`, `249/250`, `250/251`), stake × zone maths, `metres` rounding, `hullCost`, `silent` flag, `surveyHeal` rules, `maxTheoreticalDepth < FLOOR_M`. |
| `sonar.test.js` | `sweep` halves and keeps truth inside; repeat sweeps stack to `1000/2^n`; `sweep` refuses at `SWEEP_MIN_WINDOW` or 0 pings; discarded-half decoys die; `echo` sets the ±60 band and kills outside decoys; `gain` halves sigma once and refuses twice; `maxPingsPerRound`. |
| `rounds.test.js` | Same seed ⇒ identical contacts; different seeds differ; 8 contacts; truth ∈ `[60,940]`; decoys ≥ `MIN_DECOY_GAP` from truth and `MIN_DECOY_EDGE` from edges; decoy counts match the zone table; zone sequence matches `ZONE_BY_CONTACT`. |
| `run.test.js` | Full scripted run start→results; hull maths and the crush path at 0 hull; crush ⇒ `best` not updated; `next()` routing; `stakePlan` recorded; points/depth monotonic. |
| `daily.test.js` | `dayKeyUtc` is UTC not local (test at 23:30 UTC and 00:30 UTC across a DST boundary); `msUntilRollover`; same day ⇒ same seed; `playedToday` derived correctly; streak continues on consecutive days, resets after a gap, `best` streak kept. |
| `storage.test.js` | v1 → v2 migration keeps v1 bests under `v1`; 90-entry cap drops the oldest; corrupt JSON is survived; unavailable storage returns defaults and never throws. |
| `stats.test.js` | Achievement unlocks (touch-the-floor, silent-survey, cold-blood, all-in, no-waste, hull-holds, streak-7); `summarize` histograms. |
| `share.test.js` | Grid glyph per tier, `💠` for silent hits, `⬛` for misses, stake plan format, `⌁HULL LOST`, `decode(encode(run))` round-trip. |
| `determinism.test.js` | Static scan: no `Math.random`, `Date.now`, or `new Date()` inside `js/core/**` except the allowed env-injected modules; two `create()` calls with the same seed produce byte-identical contact lists. |

Plus a CI step: `node --check` on **every** `.js` file in `js/` (the v0.1 README claimed this; make it real).

### 10.2 Manual QA matrix (record in `docs/ART.md` or a `docs/QA.md`)

- Browsers: Chrome, Firefox, Safari (macOS + iOS), Edge.
- `file://` direct open **and** a static server (GitHub Pages).
- Sizes: 360×640, 390×844, 768×1024, 1440×900, 2560×1440.
- Keyboard-only full run; screen reader announces results; `prefers-reduced-motion` run; mute after reload; colourblind grid legibility; two runs across UTC midnight; storage disabled (private mode, `file://`).
- Perf: 60 fps on a mid phone (throttle 4× CPU), first paint < 1 s, memory stable over 10 runs.

### 10.3 A headless "smoke run"

Ship `tests/smoke.mjs`: scripted via `F.run` — create a daily run, then for each contact: `act('gain')`, `setPick(truth + jitter)`, `setStake(2)`, `lock()`, `next()` — and assert the run finishes with a sane score and no exceptions. This is the end-to-end guard that core stays coherent without a browser.

---

## 11. Phased build (each phase shippable, in order)

> Strangler pattern: build the new core alongside the old, flip `main.js` over in P2, delete the old files in P6. Keep the game playable at every commit.

### P0 — Foundation (safety net first)
- Create the `js/core|render|audio|ui` tree; add the `window.FATHOM` namespace guard to every file.
- Fix `.github/workflows/test.yml`: add `actions/checkout`, `actions/setup-node`, then `node --check` over `js/**` and `node --test tests/`. (The current file has no checkout step and a bogus `runs-on: node-22-x`.)
- Add `tests/loader.mjs` rewrite and `determinism.test.js`.
- **Acceptance:** CI green; every file passes `node --check`; the v0.1 game still plays from `file://`; no console errors.

### P1 — Core rework (headless, logic-only)
- Implement `config, rng, zones, rounds, scoring, sonar, run, daily, storage, stats, share` with the contracts in §5.4.
- Full test suite from §10.1. The game is not yet wired to the UI.
- **Acceptance:** `tests/smoke.mjs` completes a run; every balance assertion in §6 passes; no `Math.random` in core.

### P2 — Shell and playability (ugly but correct)
- `screens.js` router, `hud.js`, `controls.js`, `scopeinput.js`, `cards.js`, `log.js`, `main.js` wiring; canvas `scope.js` with ruler, window, scatter, decoys, pick, reveal, ping arcs; stake dial.
- Mouse + touch + keyboard input; `a11y.js` announcer.
- **Acceptance:** a full daily run can be played and finished end to end on desktop and mobile, **keyboard-only**, and the crush path is reachable on purpose. Screens: MENU→BRIEF→RUN→RESULTS all reachable.

### P3 — The look
- `canvas.js` (DPR, RAF, layers, quality scale), `sea.js`, `particles.js`, `fauna.js`, `sub.js`, `transitions.js`; zone cross-fades; scope bloom/graticule; per-zone palettes.
- **Acceptance:** 60 fps on a mid-tier phone at quality 1.0 with adaptive drop; each of the five zones visually distinct in a screenshot; camera descent reads as sinking.

### P4 — Juice and audio
- `fx.js` (shake, hit-stop, flash, chroma pulse, cracks), `audio.js` + `sfx.js` + `bed.js`; every table row in §7.3/§7.4 wired through the bus.
- **Acceptance:** every action has a visual and audio response within one frame; hit-stop works without blocking; full reduced-motion and muted paths verified.

### P5 — Meta and ritual
- UTC daily guard, streaks, logbook + history histogram, achievements, personal bests, onboarding tutorial, settings, share v2 (copy + `navigator.share`), `PLAY ENDLESS` nudge after the daily.
- **Acceptance:** one scored daily per day; streak increments/resets correctly across a simulated midnight; logbook reflects history; tutorial is skippable and replayable.

### P6 — Hardening and ship
- Performance pass + adaptive quality; accessibility audit against §8.3; cross-browser + `file://` + Pages verification; delete all dead v0.1 code (`prng.js`, `balance.js`, `ui.js`, `fx.js`, `theme-ocean.css`, `dive.css` → folded into the new tree); rewrite `README.md`, `docs/DESIGN.md`, add `docs/ARCHITECTURE.md`, `docs/ART.md`; enable GitHub Pages.
- **Acceptance:** the §12 checklist is fully ticked.

---

## 12. Definition of done (v1.0)

- [ ] Opening `index.html` (double-click, `file://`) plays a full run with no console errors.
- [ ] The build has zero dependencies, zero network requests, zero image/audio files, and a total payload ≤ 200 KB.
- [ ] 8 contacts, 12-ping shared budget, 3 actions, stake dial, 3 hull — all implemented per §3/§6.
- [ ] All five zones are visually and mechanically distinct; the camera descent reads as sinking.
- [ ] A full run is completable in under 150 s and replayable from the menu in one tap.
- [ ] Daily seed is UTC-keyed and identical for every player on a given day; one scored run per day.
- [ ] Streak, personal best, per-zone bests, logbook and achievements persist and survive reload.
- [ ] Share text matches §8.4, is colourblind-safe, and copies with one tap.
- [ ] Keyboard-only, screen-reader, reduced-motion and colourblind paths all verified.
- [ ] `node --test tests/` green; `node --check` clean over all `js/**`; CI runs both on push.
- [ ] 60 fps on a mid-tier phone; first paint < 1 s; no memory growth over 10 runs.
- [ ] `README.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/ART.md` describe the shipped game.
- [ ] The stake/hull/`gain` triad is present and load-bearing (the moat is intact).

---

## 13. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| **Complexity bloat** — three actions + a dial + zones is more than v0.1; could be confusing. | Three actions and one dial is the ceiling. Onboarding on a real contact. The BRIEF screen restates the budget and hull every round. If playtests stall, cut `gain` (the smallest loss) before cutting the stake dial. |
| **Perceived unfairness** — "the scatter lied". | The scatter is sampled honestly from the truth; decoys can never sit within `MIN_DECOY_GAP`; results always show the truth line and the error. Never add hidden randomness after LOCK IN. |
| **Difficulty curve too flat/steep.** | The σ column is the single knob; encode the two property tests in §6 as regression guards and tune σ against them. |
| **Mobile performance.** | Adaptive quality scale (measure a rolling frame time; drop snow/fauna density, then cap DPR); offscreen-cached gradients/caustics; pooled particles; one RAF loop. |
| **`file://` breakage.** | Hard rule: classic `<script defer>`, no modules, no `fetch`. Add a manual `file://` check to the PR checklist; keep the existing commit's rationale in a comment in `index.html`. |
| **Storage unavailable** (`file://`, private mode). | Every storage call is try/catch; the game plays unpersisted with a one-line notice; tests cover it. |
| **Cross-timezone daily confusion.** | UTC keys everywhere, day number shown with a `UTC` label and a countdown to rollover on the menu. |
| **Scope creep.** | Phases are individually shippable; v1.0 is P0–P6. New ideas go to a "post-1.0" section in `ROADMAP.md`, not into a phase. |
| **The moat erodes** — a later refactor makes it a plain estimation quiz again. | §12's last checklist item; call out the stake/hull/gain triad in `docs/DESIGN.md` as non-negotiable. |

---

## 14. Post-1.0 (parked, not planned)

Keep `ROADMAP.md` honest and short. Parked, in rough order of appeal:

- **Reverse trench** — ascend from the floor; the same systems, inverted pressure. (Honest second daily.)
- **A second daily "deep contact"** — one hard contact per day, scored separately.
- **Ghost replays** — share a code that replays another player's pick/stake plan locally (still no server).
- **Fauna log** — a Pokédex of the creatures your depth has surfaced.
- **A static, PR-per-day leaderboard** — only if it can stay local-first and tamper-honest; otherwise stay out.
- **Multiplayer same-trench races** — needs a server; conflicts with local-first. Parked.

Explicitly never: accounts, subscriptions, paid tiers, ads, analytics.

---

## Appendix A — `index.html` skeleton

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>FATHOM — know how much you don't know</title>
  <meta name="description" content="A two-minute daily descent. Read the contact, buy just enough certainty, and bet on your own confidence — deeper without cracking the hull.">
  <meta name="theme-color" content="#01050b">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
  <link rel="stylesheet" href="css/ui.css">
  <link rel="stylesheet" href="css/zones.css">
  <!-- classic deferred scripts: keeps file:// working (see commit e39e7be) -->
  <script defer src="js/core/rng.js"></script>
  <script defer src="js/core/config.js"></script>
  <script defer src="js/core/zones.js"></script>
  <script defer src="js/core/daily.js"></script>
  <script defer src="js/core/rounds.js"></script>
  <script defer src="js/core/scoring.js"></script>
  <script defer src="js/core/sonar.js"></script>
  <script defer src="js/core/storage.js"></script>
  <script defer src="js/core/stats.js"></script>
  <script defer src="js/core/share.js"></script>
  <script defer src="js/core/run.js"></script>
  <script defer src="js/render/canvas.js"></script>
  <script defer src="js/render/sea.js"></script>
  <script defer src="js/render/particles.js"></script>
  <script defer src="js/render/fauna.js"></script>
  <script defer src="js/render/sub.js"></script>
  <script defer src="js/render/scope.js"></script>
  <script defer src="js/render/fx.js"></script>
  <script defer src="js/render/transitions.js"></script>
  <script defer src="js/audio/audio.js"></script>
  <script defer src="js/audio/sfx.js"></script>
  <script defer src="js/audio/bed.js"></script>
  <script defer src="js/ui/dom.js"></script>
  <script defer src="js/ui/a11y.js"></script>
  <script defer src="js/ui/hud.js"></script>
  <script defer src="js/ui/controls.js"></script>
  <script defer src="js/ui/scopeinput.js"></script>
  <script defer src="js/ui/cards.js"></script>
  <script defer src="js/ui/log.js"></script>
  <script defer src="js/ui/share.js"></script>
  <script defer src="js/ui/dialogs.js"></script>
  <script defer src="js/ui/screens.js"></script>
  <script defer src="js/tutorial.js"></script>
  <script defer src="js/main.js"></script>
</head>
<body data-zone="sunlight">
  <canvas id="sea" aria-hidden="true"></canvas>
  <div id="scope" aria-hidden="true"></div>
  <div id="ui"></div>
  <div id="live" class="sr-only" aria-live="polite"></div>
</body>
</html>
```

`#scope` is a positioning host for the canvas-drawn scope's DOM overlays (labels, the stake dial) so the scope can mix canvas art with accessible DOM controls.

## Appendix B — Worked example (use this as the implementation's own test fixture)

Seed `daily 2026-10-15`, contact 5 (Midnight, `σ=52`, 1 decoy, `mult 1.35`):

- Truth `su = 612`. Decoy at `su = 180` (gap 432 ≥ 120 ✓).
- Player drags to `560`, then **ECHO** (2 pings): window `552–672`, decoy at 180 dies, `σ` unchanged.
- Truth is at 612, so the honest move is 612 → a SURVEY is possible. Player picks `605`.
- Stake **3×**. Error `7 su` → `bullseye` (≤20). Points `round(60 × 3 × 1.35) = 243`. Metres `round(243 × 2.2) = 535 m`.
- Hull unchanged (no miss). Pings left `12 − 2 = 10`.
- Had the player staked 3× and missed (`>250 su`), hull would drop to 0 → `crushed`, and the run's depth would be banked but the share card stamped `⌁HULL LOST`.

Encode this exact scenario as a fixture in `run.test.js`.

## Appendix C — Screen-state diagram

```
MENU ──daily──▶ BRIEF ──BEGIN/timer──▶ RUN ──lock──▶ RESOLVE ──next──▶ RUN
  │                                      │                              │
  │                                      └──hull 0──────────────────────┴──▶ RESULTS(crushed)
  ├──endless──▶ BRIEF ─▶ RUN ─▶ RESOLVE ─▶ … ─▶ RESULTS
  ├──LOGBOOK ◀▶ MENU
  └──SETTINGS ◀▶ MENU
RESULTS ──endless──▶ BRIEF(direct)   RESULTS ──menu──▶ MENU
```
