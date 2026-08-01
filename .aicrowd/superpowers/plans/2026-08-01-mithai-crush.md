# Mithai Crush Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A polished, browser-playable desi match-3 (Candy Crush indianized) — mithai pieces, Diwali specials, Hinglish juice — as a static JS/CSS page.

**Architecture:** Pure game logic in `js/board.js` (no DOM, node-testable, returns declarative step diffs), thin data module for levels, SVG art generators, WebAudio synth, and a DOM/CSS renderer-orchestrator in `js/main.js`. DOM tiles absolutely positioned; all motion via CSS transitions/keyframes.

**Tech Stack:** Vanilla ES modules, CSS, `node --test`, Google Fonts (Modak, Baloo 2) with fallbacks, localStorage.

## Global Constraints

- No build step, no frameworks, no backend. Static files only.
- Board 8×8. Six sweet types: `laddoo, jalebi, katli, jamun, barfi, samosa`.
- Specials: `rocket_h` (clears row), `rocket_v` (clears column), `anaar` (3×3), `chakri` (color bomb). Horizontal 4-match → `rocket_v`; vertical 4-match → `rocket_h` (perpendicular clear, documented rule).
- Hinglish copy exactly per spec cascade ladder: "Wah!", "Shabash!", "Kya baat hai!", "Ek number!", "Zabardast!", "DHAMAKEDAAR!", "FULL PAISA VASOOL!".
- Scores formatted with `toLocaleString('en-IN')`.
- All state persisted under localStorage key `mithaiCrush.v1`.
- Every commit leaves `node --test test/` green.

---

### Task 1: Core board logic (TDD)

**Files:**
- Create: `js/board.js`, `test/board.test.mjs`

**Interfaces (Produces):**
```js
export const SIZE = 8;
export const TYPES = ['laddoo','jalebi','katli','jamun','barfi','samosa'];
export const ROCKET_H='rocket_h', ROCKET_V='rocket_v', ANAAR='anaar', CHAKRI='chakri';
export function makeRng(seed) // mulberry32; returns () => float [0,1)
export function createBoard({rng, types=TYPES, chashni=[]}) // -> Board with no matches, >=1 valid move
// Board: { cells: (Tile|null)[64], chashni: number[64], nextId }
// Tile: { id, type /* string; 'any' for chakri */, special: null|ROCKET_H|ROCKET_V|ANAAR|CHAKRI }
export function idx(r,c) / rc(i)
export function findMatches(board) // -> groups: {cells:number[], type, runH:number, runV:number, pivot:number}[]
export function isAdjacent(a,b)
export function isValidSwap(board,a,b) // special involved OR swap yields a match
export function findValidMoves(board) // -> [a,b][]
export function performSwap(board,a,b,rng) // -> null if invalid, else Step (may be pure-swap step w/ activations)
export function resolveStep(board,rng) // -> Step|null when stable
// Step: { cleared:number[], activated:{i,kind}[], created:{i,tile}[], chashniCleared:number[],
//         falls:{from,to,id}[], spawns:{to,tile}[], points, collected:Record<type,count>, swapped?:[a,b] }
export function ensurePlayable(board,rng) // -> {shuffled:boolean, board changes in place}
```

Rules locked here: special creation at swap cell (or pivot on cascades); >=5 straight → chakri; runH>=3 && runV>=3 → anaar; 4 straight → rocket (perpendicular); chain activations expand transitively within a step; chakri+chakri clears board; chakri+rocket clears that type + rocket line; chakri+anaar clears type + 3×3; rocket+rocket cross; anaar+anaar 5×5; rocket+anaar 3 rows+3 cols. Scoring: 60/cleared cell × cascade multiplier (multiplier = step index within one resolve chain, starting 1); +120 per special created; +500 chakri activation. Chashni: `chashni[i]>0` decrements when cell i cleared.

- [ ] Step 1: Write failing tests covering: deterministic rng; createBoard has no initial matches and >=1 valid move (100 seeds); findMatches H3/V3/L-overlap; rocket/chakri/anaar creation rules; perpendicular rocket orientation; invalid swap returns null and board unchanged; gravity compaction correctness (ids preserved, no holes, spawns fill top); resolveStep cascade until null; chakri swap clears all of type; rocket chain triggers anaar; chashni decrement on match; collect counts; ensurePlayable shuffles a no-move board into playable with same multiset of types.
- [ ] Step 2: `node --test test/` → all FAIL (module missing).
- [ ] Step 3: Implement `js/board.js` fully.
- [ ] Step 4: `node --test test/` → all PASS.
- [ ] Step 5: Commit "feat: core match-3 board logic with desi specials".

### Task 2: Levels + art + audio modules

**Files:**
- Create: `js/levels.js`, `js/sweets.js`, `js/audio.js`

**Interfaces (Produces):**
```js
// levels.js
export const LEVELS = [ {id, city, hindiName, goal:{kind:'score'|'collect'|'chashni', ...}, moves, starScores:[s1,s2,s3], chashni?:number[], intro} x9 ]
// sweets.js
export function sweetSVG(type)            // inner SVG markup, viewBox 0 0 100 100
export function specialOverlaySVG(kind)   // rocket/anaar/chakri decorations
export function chakriSVG()
// audio.js
export const sfx = { pop(n), swapTick(), invalid(), rocket(), anaar(), chakri(), win(), lose(), select() };
export function initAudio() / setMuted(m) / isMuted()
```
Level ladder (Mumbai→Kashmir) exactly: 1 Mumbai score 5000/20mv · 2 Delhi collect 35 laddoo/22 · 3 Jaipur chashni 24 cells/24 · 4 Kolkata collect 45 jamun/24 · 5 Chennai score 30000/22 · 6 Amritsar collect 30 laddoo+30 barfi/26 · 7 Goa chashni 36/26 · 8 Varanasi score 60000/25 · 9 Kashmir chashni 40 + collect 30 katli/30.

- [ ] Steps: implement each module; smoke-import from node (`node -e "import('./js/levels.js')..."`); commit "feat: levels, sweet art, synth audio".

### Task 3: Shell + visual identity (index.html, css/style.css)

**Files:**
- Create: `index.html`, `css/style.css`, `.claude/launch.json`

Screens: `#screen-title` (logo, tagline "Ek Dum Desi Match-3", Khelo CTA), `#screen-map` (Mithai Yatra 9 nodes, stars, locks), `#screen-game` (HUD: moves/goal/score+stars progress, dabba board, toasts, combo text layer, particles layer), overlays (`#overlay-win`, `#overlay-lose`, `#overlay-pause`), mute + back controls.
Identity acceptance criteria (browser-verified): marigold toran across header; board reads as mithai dabba (warm box, golden dividers); plum/indigo festive backdrop with subtle rangoli; Modak/Baloo 2 loaded; palette = rani pink/marigold/turmeric/peacock/gold; lakh-formatted score; no layout overflow at 1280×800 and 375×812.

- [ ] Build shell + full CSS; launch static server via preview; screenshot title/map/game; iterate until acceptance criteria met; commit "feat: mithai dabba UI shell + festive identity".

### Task 4: Renderer/orchestrator (js/main.js)

**Files:**
- Create: `js/main.js` (imports board/levels/sweets/audio)

**Consumes:** exact APIs from Tasks 1–2.
Responsibilities: keyed tile DOM reconciliation (tile id → element; transforms from grid rc); input (click-select + drag both); swap animation → `performSwap` → animate each `resolveStep` (pops with score floaties, special booms, falls, spawns) with cascade toast ladder; goal tracking + HUD; win = leftover-move "Diwali Dhamaka" rockets bonus (+150/move) then overlay w/ stars + fireworks + marigold petals; lose overlay; hint pulse after 5s idle; `ensurePlayable` reshuffle toast "Koi chaal nahi! Phir se milate hain…"; localStorage progress; map unlock flow.

- [ ] Implement; manual browser QA: play L1 to win and to lose, verify all four specials fire visually, cascade toasts, reshuffle path (via seeded corner case if reachable), persistence across reload; console must be error-free; commit "feat: full game loop, juice, progression".

### Task 5: Autonomous polish iterations (the "would it click?" bar)

- [ ] Loop: screenshot → critique as a desi player (theme authenticity, readability of sweets at tile size, celebration payoff, copy tone) → refine art/CSS/copy → re-verify. Minimum three passes. Exit when: all sweets identifiable at a glance in screenshot, specials visually distinct, win moment feels festive (fireworks+petals), zero console errors/warnings across a full level play, and the title screen would make an Indian player smile.
- [ ] Final: README.md (how to run), `node --test` green, commit "polish: …" per pass.

## Self-Review

Spec coverage: pieces/specials/combos → T1; levels/goals/chashni → T2/T4; identity/toran/dabba/fonts/en-IN → T3; juice/toasts/hints/reshuffle/sounds/persistence → T2/T4; polish bar → T5. No placeholders left that hide decisions (visual tasks carry measurable acceptance criteria instead of frozen CSS by design). Type/name consistency: `rocket_h/rocket_v/anaar/chakri`, `performSwap/resolveStep/ensurePlayable` used consistently across tasks.
