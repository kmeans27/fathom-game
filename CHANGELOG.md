# CHANGELOG — FATHOM

## v1.0-dev (2026-10-15) — plan.md rework, phases P0–P5 complete, P6 partial

Built from `plan.md` (the v1.0 spec) on top of the v0.1 flat game, following the
strangler-fig migration the plan prescribes. Every phase was verified before
committing; the test suite gates the whole build.

### What was actually done (verified)

- **P0 — CI + module tree.** `.github/workflows/test.yml` syntax-checks every
  shipped file (`js/core`, `js/render`, `js/audio`, `js/ui`, `js`) and runs
  `node --test tests/*.test.js` plus `tests/smoke.mjs` as a step (a bare
  `tests/` dir argument is treated as a module path on Node 22, which CI pins).
  New `js/core|render|audio|ui` tree created.
- **P1 — pure core, fully tested (51 tests, all green).** `config, rng, zones,
  daily, rounds, scoring, sonar, storage, stats, share, run` — deterministic
  mulberry32/FNV-1a RNG, UTC day keys (DST-proof), pure reducers, run state
  machine owning the event bus, schema-versioned storage (v1→v2 migration,
  try/catch for file:// sandboxes), share card with per-tier glyphs,
  achievements/streaks/bests. `tests/determinism.test.js` proves no
  `Math.random`/`Date.now` in core; `tests/smoke.mjs` plays a headless run.
- **P2 — render + CSS.** Design tokens (`css/tokens.css`), base layout and
  layer stack, component styles, per-zone DOM retint via
  `body[data-zone=…]` with 900 ms cross-fade. Canvas engine with DPR handling
  and one RAF loop + layer registry; sea gradient from offscreen cache; scope
  ruler/window/scatter/pick/reveal/ping arcs. Verified live in a browser over
  `file://` (pixel-sampled gradient, full run played to RESULTS).
- **P3 — UI components.** `dom, a11y, hud, controls, scopeinput, cards, log`
  — DOM builders only; controls wire click→core calls; scope drag/keyboard →
  `F.run.setPick` with ±1/Shift ±10/PageUp ±100 steps (fixed an inverted-step
  bug found in live testing).
- **P4 — juice + audio.** `fx.js` (DOM-level shake/flash, reduced-motion aware),
  `audio.js` (lazy AudioContext on first gesture, master→{sfx,bed}, DelayNode
  + feedback sonar tail, 12-voice cap, prefs persisted), `sfx.js` and `bed.js`
  as pure bus subscribers per the §7.4 table. Verified live: engine starts on
  first gesture, full run plays with cues.
- **P5 — integration.** `screens.js` router (six screens, `data-hidden`
  switching), `main.js` rewritten as boot/glue only (no game maths), `index.html`
  flipped to the Appendix A skeleton with classic deferred scripts (keeps
  `file://` working). Legacy v0.1 flat files deleted once unreferenced.
  Verified live: menu → brief → run → results for daily and endless runs;
  share cards render (endless card fixed to read `FATHOM ENDLESS` when
  `dayKey` is null).
- **P6 (partial).** Global keyboard loop (S/E/G actions, 1/2/3 stake,
  Enter/Space lock, M mute, with a focused-button double-fire guard), run
  persistence to storage (`history[dayKey]`, `best`, achievements union),
  LOGBOOK screen (bests, zone bests, streak, 90-day CSS-bar histogram,
  achievements grid), SETTINGS screen (5 pref toggles + RESET DATA), menu
  variants (DAILY DONE state, `#NNNN · UTC · next rollover`).

### Bugs found and fixed during this build
- `share.text` threw for endless runs (null `dayKey`) → endless share header.
- `scopeinput` double-emitted `run:pick` with a payload shape that disagreed
  with core's; removed (core is the only emitter, per §5.4).
- Shift/arrows step sizes were inverted vs §8.3.
- a11y reduced-motion read an undefined `F.settings` → now reads persisted
  prefs.
- `controls.setAfforded` set only `.disabled` while CSS keyed off
  `data-afforded` → both now set.
- `.screen` overlay swallowed scope drags → pointer-events moved onto
  interactive components only.

### Not done yet (P6 remainder)
- Tutorial/onboarding (§8.2), particles/fauna/sub render layers, screen
  transitions, results-screen streak increment + personal-best comparison,
  scope `role="slider"` ARIA, colourblind tier labels in UI (share card
  already supports it), payload/asset budget check.

### Versioning
- Repo: this line is tagged **v1.0-dev**; v0.1 history stays in git log.
- Save data: storage schema `version: 2` with v1→v2 migration (`js/core/storage.js`);
  schema version is checked on every load.
- CI note: as of 2026-10-15 GitHub Actions jobs on this account fail instantly
  with "job not started, account locked due to a billing issue" — the workflow
  is valid; the same CI commands were run locally on Node 22 and all pass.
