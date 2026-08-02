# Dopamine Director Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline).
> Spec: ../specs/2026-08-02-dopamine-director-design.md — APIs, config table, and
> acceptance criteria live there; this plan sequences the work.

**Goal:** Search-certified opening spectacles, golden-swap seeded replay, spectacle-aware
hints, capped refill generosity, and a headless difficulty-tuning harness.

**Tech:** vanilla ES modules; `node --test`; no engine semantic changes.

### Task 1: board.js spawner hook + director.js core (TDD)
- Files: js/board.js (spawn site only), js/director.js (new), test/director.test.mjs (new)
- RED: tests for hook (forced type used; falsy → random; absent → unchanged), cloneBoard
  deep-independence, evaluateSwap (null on invalid; metrics on the known base fixture;
  same-seed determinism), meetsProfile, generateCertified (easy profile certifies with
  valid adjacent golden; impossible profile returns best-so-far uncertified),
  makeGenerosity (vertical-pair completion at g=1; null without pair; cap: roll 0.26
  never fires even at g=0.9), and REPLAY EQUIVALENCE (certified pack replayed manually
  → identical metrics).
- GREEN: implement per spec §2. Commit.

### Task 2: levels.js director config + main.js integration
- Files: js/levels.js (config only), js/main.js
- Config per spec §6. main.js: install spawner on every board; async certified search
  behind goal card / tutorial with cancel token; apply-at-close (await bounded); golden
  state + seeded replay in attemptSwap (single rng threaded through the whole chain;
  disarm on any successful swap); hint steering per spec §4.
- Verify in browser (fresh profile L1: hint → golden → chain ≥ 4, special minted; replay
  path stays organic; console clean). Commit.

### Task 3: e2e/sim-tune.mjs + tuning pass
- Headless: N plays per level × {random, greedy-K} policies through real flow (certify →
  play with generosity); print win rate / moves spare / chain histogram / golden-hit rate.
- Tune config to target bands (L1–3 ≥95% greedy; L7–8 60–75%); update levels.js numbers.
- npm test script fixed to glob both test files. Commit.

### Task 4: Deploy + live verify
- Push → Pages; live check main.js/director.js served; run e2e swipe test; memory update.

Self-review: spec §2/§4/§5/§6/§7 all covered by Tasks 1–3; acceptance items map to
Task 2 (browser) and Task 3 (dashboard); replay invariant tested in Task 1.
