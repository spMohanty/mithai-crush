# Dopamine Director — Difficulty & Spectacle Engineering Spec

Date: 2026-08-02
Status: user-approved (hybrid approach, fully programmatic — no hand-authored boards).

## Goal

Engineer the reward schedule of Barfi Blast for virality: a guaranteed early "one right swap
→ massive chain" spectacle, a sawtooth difficulty curve, and a tunable generosity dial —
all search-generated, simulation-verified, zero human board authoring.

## Psychology model (the why)

- Dopamine tracks reward prediction error: better-than-expected outcomes, attributed to
  one's own skill. Cascades are the jackpot vehicle; attribution must stay with the player.
- Variable-ratio scheduling: fat-tailed cascade distribution (mostly modest, occasionally
  monstrous), sawtooth level difficulty (ramp → relief), near-miss losses driving retries.
- The first 90 seconds decide virality: Level 1 must contain a discovered-feeling spectacle.

## Architecture

New pure module `js/director.js` on top of the frozen engine. `js/board.js` gains ONE
additive, optional injection point; all 26 existing tests must pass unchanged.

### 1. board.js spawner hook (only engine touch)

`board.spawner?: (board, r, c, rng) => type|null` — consulted per refill spawn; falsy
return falls back to the existing random pick. Absent hook = byte-identical behavior.

### 2. director.js API

```js
cloneBoard(board)                          // deep clone incl. spawner ref
evaluateSwap(board, a, b, seed)            // full-cascade sim on a clone with seeded rng
                                           // -> {chain, points, cleared, created, activated} | null
spectacleScore(metrics)                    // points + 500·chain + 800·created + 600·activated
meetsProfile(metrics, profile)             // minChain / minPoints / wantSpecial checks
evaluateBoard(board, seed)                 // best swap across all valid moves
generateCertified({profile, chashni, spawner, seedBase, maxAttempts, budgetMs})
                                           // search seeded candidate boards; early-exit on first
                                           // profile-satisfying swap; else best-so-far.
                                           // -> {board, boardSeed, refillSeed, golden:{a,b},
                                           //     metrics, certified} | null
generateCertifiedAsync(opts)               // same, chunked via setTimeout slices + cancel token
makeGenerosity(g)                          // spawner: with prob min(g, 0.25), spawn the type
                                           // completing a settled near-pair (vertical below,
                                           // horizontal neighbors); else null (random)
```

Determinism invariant (THE core guarantee): replaying `golden` on `board` with
`makeRng(refillSeed)` reproduces `metrics` exactly, because outcomes are pure functions of
(board state, rng sequence) and the same spawner runs in sim and live. Covered by an
explicit replay-equivalence test.

### 3. Golden-swap seeded replay (main.js)

Certified level entry stores `state.golden = {a, b, seed, armed}`. In `attemptSwap`, if the
player's swap matches the armed golden pair (either order), the whole resolve chain uses
`makeRng(seed)` instead of `state.rng` — replaying the certified spectacle exactly. Any
successful swap disarms golden (board diverged). Invalid swaps don't disarm.

### 4. Discovery: spectacle-aware hints

`armHint` (5s idle): if golden armed → hint the golden pair. Otherwise rank all valid moves
by `spectacleScore(evaluateSwap(...))` with a fixed hint seed and pulse the best. Skilled
players never see it; hesitant players get steered into the fireworks. All hints get smarter.

### 5. Integration flow

- Level entry via map/Next (card shown): render organic board immediately; run
  `generateCertifiedAsync` behind the goal card (budget ≈ 600ms, chunked). The card's
  Start (and the first-run tutorial's Let's Go) awaits the search (bounded), applies the
  certified board + golden state, re-renders, then unblocks play. Replay/Try Again skip
  certification entirely — repeat plays stay organic (also hides the trick).
- The level's generosity spawner is installed on every board (organic and certified) and
  inside certification sims — required for replay determinism.

### 6. Per-level dopamine schedule (levels.js `director` config)

| Level | opening profile | generosity |
|---|---|---|
| 1 Mumbai | {minChain: 4, wantSpecial: true} | 0.20 |
| 2 Delhi | {minChain: 3} | 0.15 |
| 3 Jaipur | {minChain: 3} | 0.18 |
| 4 Kolkata | — | 0.12 |
| 5 Chennai | — | 0.12 |
| 6 Amritsar | {minChain: 3} | 0.20 |
| 7 Goa | — | 0.10 |
| 8 Varanasi | — | 0.10 |
| 9 Kashmir | {minChain: 4} | 0.15 |

Numbers are starting points; the sim harness owns final values.

### 7. Control instrument: e2e/sim-tune.mjs

Headless node harness (no browser): for each level × policy (random, greedy-sampled),
run N plays through the real engine incl. certification and generosity; report win rate,
avg moves spare, max-chain histogram, golden-hit rate. Targets: L1–3 ≥ 95% (greedy),
walls (L7–8) 60–75%, L1 golden chain ≥ 4 whenever certified. Tuning = edit config, re-run.

## Non-goals / guardrails

- No engine semantic changes; no monetization mechanics; no telemetry.
- Generosity hard cap 0.25, cascades only (never the initial deal).
- Search never blocks play: budget exhaustion ships best-so-far (certified: false).

## Acceptance

1. All existing tests green + new director/spawner tests green (incl. replay equivalence).
2. Fresh profile, L1, idle 5s → hint pulses golden pair; performing it yields chain ≥ 4
   and a special minted (when certified — expected common case), verified in browser.
3. Sim dashboard shows the sawtooth (win rates within target bands) before deploy.
