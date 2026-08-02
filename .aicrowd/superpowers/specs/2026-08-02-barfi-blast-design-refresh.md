# Barfi Blast — Design Refresh Spec

Date: 2026-08-02
Supersedes audience framing of `2026-08-01-mithai-crush-design.md` (that spec targeted an Indian audience; the game now targets a **Western audience that enjoys Indian culture**). The visual identity, engine, and level set from that spec are unchanged.

## Design principles for this refresh

1. **Teach every desi noun exactly once, with a plain-English gloss, at the moment it matters.** A Westerner should never have to guess what a Chakri does — but they should get to *say* Chakri.
2. **Every screen answers "what am I doing right now?" without a timer.** Nothing load-bearing lives in a 2-second toast.
3. **The desi voice fires loudest at emotional peaks** (wins, combos), and stays out of buttons, labels, and instructions — per the copy policy.
4. **Refine, don't replace.** The Diwali-night mithai-shop identity is right. Most of this spec is copy, hierarchy, and onboarding — not new art.

Hard constraints honored throughout: vanilla ES modules + CSS, no build step, no new external assets/CDNs, `js/board.js` untouched, 9 levels, no monetization/accounts.

---

## 1. Naming & information architecture

### 1.1 Final name decisions (exact strings)

| Thing | Final name | Notes |
|---|---|---|
| Game | **Barfi Blast** | Fixed. |
| Tagline | **Match. Blast. Barfi.** | Fixed. |
| Map screen title | **Mithai Yatra** | KEEP — see verdict below. Gets a permanent English subtitle. |
| Map subtitle (new) | `A sweet tour of India — {done}/9 cities · ★ {stars}/27` | Functional English; doubles as progress meta. |
| Specials, family | **patakhas** | Flavor-text only ("Pop patakhas" on title). Never a label. Never applied to a person. |
| Special, line-clear | **Rocket** | Drop the compound "Patakha Rocket" everywhere. Gloss: *clears its whole row or column*. |
| Special, 3×3 | **Anaar** | Gloss: *blasts everything around it*. |
| Special, color bomb | **Chakri** | Gloss: *swap it with any sweet to clear every one of that kind*. |
| Cell overlay | **chashni glaze** | First mention in any context is always the two-word form "chashni glaze"; "chashni" alone thereafter. |
| Bonus event | **Diwali Dhamaka** | Keep. Proper-noun event + exclamation toast `DIWALI DHAMAKA!`. |
| Sweets | Laddoo, Jalebi, Kaju Katli, Gulab Jamun, Barfi, Samosa | Keep `SWEET_NAMES` as-is. |
| Sweet counts | `{Name} × {n}` (e.g. `Laddoo × 35`) | Standardized everywhere. Avoids pluralizing Hindi nouns ("Kaju Katlis" is not a word anyone should ship). |

**Why {Rocket, Anaar, Chakri} is consistent, not inconsistent:** in an actual Diwali firework box the three classics are literally called "rocket", "anaar", and "chakri" — the English/Hindi/Hindi mix *is* the authentic set. The compound "Patakha Rocket" is the odd one out: it implies "Patakha Anaar" should exist (redundant — an anaar *is* a patakha). Bare names + a one-time English function gloss is the rule.

### 1.2 Mithai Yatra — verdict: KEEP, add subtitle. Do not rename.

- It sits in exactly the slot the copy policy reserves for desi: a **proper noun** — the name of the campaign.
- The comprehension problem is real ("yatra" is not mainstream English) but the fix is a **subtitle, not a rename**: `A sweet tour of India — 3/9 cities · ★ 8/27` under the title teaches the word silently on first sight, and the title screen already primes it with "Tour India".
- Renaming to English ("Sweet Tour", "India Trail") flattens the exact brand voice the target audience came for, and breaks continuity with the README, the URL story, and marketing.
- Bonus: the subtitle carries the progress meta the map currently lacks, so the desi noun *buys* something functional.

### 1.3 Button & label inventory (final strings)

| Context | String |
|---|---|
| Title, no progress | `PLAY ▶` |
| Title, has progress | `CONTINUE ▶` |
| Title progress line | `Next stop: {City} · Level {n}` / all done: `All 9 cities cleared · ★ {n}/27` |
| Goal card | `Start` |
| Tutorial | `Let's Go!` |
| Quit confirm | `Keep Playing` (primary) / `Leave` (secondary) |
| Win card | `Next: {City} →` / `Replay` / `Map` |
| Lose card | `Try Again` / `Map` |
| HUD | `moves`, `Score`, `Level {n} · {देवनागरी}` |
| Mute buttons | aria-label `Sound on/off`; glyph 🔊/🔇 (P2 — see 3.6) |

### 1.4 Copy scrub (policy + consistency fixes)

| Where | Current | Final |
|---|---|---|
| `levels.js` L6 intro | `Amritsar! Collect laddoos AND barfis, ji!` | `Amritsar! Collect laddoos AND barfis!` — "ji" is a particle, neither proper noun nor exclamation; policy violation. |
| Win card, last level | `Full Yatra complete! 🇮🇳` | `All 9 cities cleared — tour complete!` — status text must be plain English. |
| Win card heading | `You Won! 🎉` | The city shout (`Jhakaas!` etc.) becomes the headline — see 2.6. |
| Lose card heading | `So Close! 😅` | `So close!` (emoji dropped, see 3.5). |
| Goal chip, chashni done | `clear! ✓` (via `'clear!'` + ✓ suffix) | `all clear ✓` (set text to `all clear`). |
| `goalText()` collect | `35 Laddoo` | `Laddoo × 35`. |
| `goalText()` chashni | `clear all chashni` | `Clear the chashni glaze`. |
| Tutorial | `Patakha Rocket` | `Rocket` (see 1.1). |

**Verified compliant — keep unchanged:** all 7 combo words (`Wah!` → `FULL PAISA VASOOL!`), all 9 city shouts (`Jhakaas!`, `Ek number!`, `Wah sa!`, `Darun!`, `Semma!`, `Balle balle!`, `Borem!`, `Bhaukaal!`, `Wah wah!`), `Namaste Mumbai!` (greeting-exclamation), `DIWALI DHAMAKA!`, the Devanagari dabba-lid tag `॥ शुभ स्वाद ॥` (decorative set dressing, not functional text), Devanagari city names as small accents.

---

## 2. Screen-by-screen UX changes

### 2.1 Title screen

**T1 — Returning players get no acknowledgment of progress. (P0)**
- *Problem:* Every visit looks like a first visit. No "where was I", no pull back into the journey.
- *Change:* When `progress.unlocked > 1`, button reads `CONTINUE ▶` and a progress line appears under it. All-done state keeps `PLAY ▶` with the completion line.
- *Copy:* `Next stop: Chennai · Level 5` / `All 9 cities cleared · ★ 21/27`.
- *Approach:* Add `<p id="title-progress" class="title-progress"></p>` after `#btn-play` in `index.html`. New `refreshTitle()` in `main.js` (called at boot and whenever `showScreen('title')` runs) sets button text + line from `progress`. CSS in 3.3. **S**

**T2 — Everything else: keep.** Logo treatment, bobbing jalebi/laddoo/jamun row, tagline, `Match mithai · Pop patakhas · Tour India` note, three diyas, toran. This screen already lands the identity. PLAY routing to the map (not straight into a level) is also right — the map is 2 seconds of world-building and gives agency.

### 2.2 Map (Mithai Yatra)

**M1 — Title is unglossed; map has no journey meta. (P1)**
- *Problem:* "Mithai Yatra" alone doesn't self-explain to the target audience; the map shows per-level stars but no overall progress.
- *Change:* Persistent subtitle line under the header, rendered by `renderMap()`.
- *Copy:* `A sweet tour of India — {done}/9 cities · ★ {stars}/27` where `done` = count of levels with ≥1 star, `stars` = sum of `progress.stars`. Fresh profile reads `A sweet tour of India — 0/9 cities · ★ 0/27` (showing the meta exists is the point).
- *Approach:* `<p id="map-sub" class="map-sub"></p>` between `.map-head` and `.map-scroll`. Star glyph wrapped in `<span>` colored turmeric. CSS in 3.3. **S**

**M2 — Current city can be below the fold. (P1)**
- *Problem:* From city ~5 onward the glowing "PLAY ▶" node is off-screen; players land on a list of finished cities.
- *Change:* Auto-scroll the current node into view when the map opens.
- *Approach:* At the end of `renderMap()`: `requestAnimationFrame(() => ol.querySelector('.ynode.current')?.scrollIntoView({ block: 'center' }))` (instant, not smooth — no jank on screen switch). **S**

**M3 — Goal line format. (P1, part of copy scrub)**
- *Change:* Node line becomes e.g. `Laddoo × 35 · 22 moves`, `Clear the chashni glaze · 24 moves`, Kashmir: `Clear the chashni glaze + Kaju Katli × 30 · 30 moves` (wraps to 2 lines at 0.82rem — acceptable).

**M4 — Keep:** zigzag cards with alternating ±0.8° rotation, medal emblems, dotted center line, locked = grayscale + 🔒 with goal still visible (anticipation beats mystery), `PLAY ▶` badge on current, hover lift.

**M5 — P2 enrichments (nice-to-have):**
- Per-segment path fill: replace the single `.yatra::before` line with a short `::before` connector on each `li`, gold-solid for cleared nodes, dotted otherwise. **M**
- Level-number chip on each medal (`1`–`9`, 18px gold circle, absolute top-left) to make "3 of 9" legible at a glance. **S**
- Make each node a real `<button>` inside the `li` for keyboard access. **M**

### 2.3 Game HUD

**G1 — Mobile (≤560px) wrap is accidental, not composed. (P1)**
- *Problem:* Current wrap puts moves in row 1 (far from its partner, the goal) and gives the goal a lonely full-width row 2. The two per-turn glance stats — moves left, goal remaining — should sit together, nearest the board.
- *Change:* Row 1 = back · city/level chip · mute (navigation + identity). Row 2 = moves chip + goal chip (the gameplay pair).
- *Approach (replace current `@media (max-width: 560px)` order rules):*
```css
.game-head { flex-wrap: wrap; row-gap: 6px; }
.btn-back { order: 0; }
.hud-level { order: 1; flex: 1 1 0; }
.game-head .btn-mute { order: 2; }
.hud-moves { order: 3; flex: 0 0 88px; }
.hud-goal  { order: 4; flex: 1 1 0; justify-content: center; }
```
Row 1 fills the width (42px + flex + 42px), so wrap naturally starts row 2 at `.hud-moves`. **S**

**G2 — City sub-line can overflow its chip. (P1)**
- *Problem:* `.hud-sub` (`Level 4 · कोलकाता`) has no overflow handling; `.hud-label` does.
- *Change:* Add `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;` to `.hud-sub`. **S**

**G3 — Chashni goal icon lies. (P1)**
- *Problem:* 🍯 is an amber honey pot; chashni on the board is a pink glaze. The icon actively mis-teaches the association.
- *Change:* Replace with an inline-SVG pink swatch matching `.cwell.chashni`:
```html
<svg viewBox="0 0 100 100" aria-hidden="true">
  <rect x="14" y="14" width="72" height="72" rx="18" fill="#EC4899" stroke="#FBCFE8" stroke-width="6"/>
  <ellipse cx="38" cy="34" rx="16" ry="10" fill="#FFFFFF" opacity="0.45"/>
</svg>
```
- *Approach:* Add `chashniSwatchSVG()` to `sweets.js` (or a const in `main.js`), use in `goalHTML()`, the goal card, and the Jaipur first-time note. Keep 🎯 for score goals — the target metaphor is correct and legible at chip size. **S**

**G4 — Keep:** chip construction, score row, the star track (a genuinely good ambient 3-star meter — markers at 33/66/100% with glow-on-lit), moves-low red pulse at ≤5, en-IN number formatting.

### 2.4 Level start — the goal card (the biggest single fix)

**L1 — The level objective lives in a 2-second toast. (P0)**
- *Problem:* `toast(level.intro)` at start is the only sentence ever shown about the goal; the HUD chip is icons + numbers with no verbs. Players make their first three moves not knowing why. This is the standard match-3 pattern (goal card before play) and its absence is the game's largest UX debt.
- *Change:* A modal goal card over the (already rendered, dimmed-by-backdrop) board, shown whenever a level is entered **from the map or via `Next:`**. `Replay`/`Try Again` skip it (the player knows the goal) and get the small intro toast instead, as today.
- *Exact markup (Kolkata example):*
```html
<h2>Kolkata</h2>
<p class="ov-sub">Level 4 · कोलकाता</p>
<p class="ov-flavor">Kolkata calling! Pop 45 gulab jamuns!</p>
<div class="goal-panel">
  <div class="goal-panel-head">Goal</div>
  <div class="goal-panel-row"><svg viewBox="0 0 100 100"><!-- jamun --></svg><span>Gulab Jamun × 45</span></div>
  <div class="goal-panel-moves">in 24 moves</div>
</div>
<div class="ov-buttons"><button id="btn-start" class="btn btn-gold btn-mid">Start</button></div>
```
- *Goal rows by type:* score → 🎯 `Score 30,000 points`; collect → sweet SVG + `{Name} × {n}` (one row per sweet); chashni → pink swatch + `Clear the chashni glaze — {n} squares` (count from `level.chashni.length`).
- *First-time chashni note* (first chashni level entered, gated on new `progress.seen.chashni`): extra row under the panel:
  `NEW — Chashni glaze: the pink coating under some sweets. Match on top of it to wipe it clean.`
- *Approach:* `startLevel(level, { card = true } = {})`; call sites: map node + `#btn-next` → default; `#btn-retry`/`#btn-tryagain` → `{ card: false }`. New `goalPanelHTML(level)` shared by goal card, tutorial (2.7), and win card is not needed beyond these two — keep it small. While the card is open set `state.busy = true` (blocks input and hints); `Start` hides overlay, `busy = false`, `armHint()`. First-ever run of level 1 shows the tutorial variant instead (2.7) — never two modals. **M**

**L2 — P2:** add a star-thresholds line to the goal card: `★ 5,000 · ★★ 9,000 · ★★★ 14,000` (from `starScores`, en-IN formatted). One `<p class="goal-panel-stars">`. **S**

### 2.5 In-level feedback

**F1 — Specials are never named in play. (P1)**
- *Problem:* Tutorial names are forgotten by level 3; specials appear with a flash but anonymously. Newcomers can't build the vocabulary the brand depends on.
- *Change:* First time each special kind is **created** (the teachable moment — the player just earned it and is looking at it), show a small toast naming it + function. Once per profile.
- *Copy:* `Rocket! Clears the whole line` · `Anaar! Blasts everything around it` · `Chakri! Swap it with any sweet`.
- *Approach:* In `animateStep()`'s `step.created` loop, map `cr.tile.special` → flag key in new `progress.seen = {}` (`rocket` covers both H/V); if unseen: set flag, `saveProgress()`, `toast(text, true)`. **S**

**F2 — Keep:** combo-word ladder on cascades, `+points` floaties at the action site, shuffle toast (`No moves left — reshuffling!`), hint pulse at 5s idle, Diwali Dhamaka countdown with fireworks per converted move.

**F3 — P2 delight:** goal-chip count does a tiny pop (scale 1 → 1.3 → 1, 0.25s) when it decrements/increments. Needs diffing since `updateHUD()` rewrites `innerHTML` — compare previous counts, re-add a `.tick` class. **S** | First-ever chashni square cleared → one-time small toast `Chashni cleared!`. **S**

### 2.6 Win / lose cards

**W1 — The win card buries its best asset. (P0)**
- *Problem:* `You Won! 🎉` is the generic headline any match-3 has; the regional shout (`Jhakaas!` — the single most distinctive string in the game) is small text in a sub-line. Hierarchy is exactly inverted.
- *Change:* The shout **is** the headline. Plain-English status moves to the sub-line. The Next button carries the journey (`Next: Delhi →`). Emoji dropped (see 3.5).
- *Exact markup:*
```html
<h2 class="ov-shout">Jhakaas!</h2>
<p class="ov-sub">Mumbai <small>मुंबई</small> · Level 1 cleared</p>
<div class="ov-stars"><!-- unchanged star spans --></div>
<div class="ov-score">14,250</div>
<p class="ov-goalline">Goal complete</p>
<div class="ov-buttons">
  <button class="btn btn-gold btn-mid" id="btn-next">Next: Delhi →</button>
  <button class="btn btn-plain btn-mid" id="btn-retry">Replay</button>
  <button class="btn btn-plain btn-mid" id="btn-map">Map</button>
</div>
```
- `Goal complete` replaces `Goal complete! {full goal text}` — restating the goal after winning is noise.
- *Final level (9):* goalline becomes `All 9 cities cleared — tour complete!`; buttons `Replay` / `Map`. P2: add `★ {n}/27 collected` line.
- *Approach:* Rework the template string in `winFlow()`; `.ov-shout` CSS in 3.3. **S**

**W2 — P2:** `New best!` mini-tag next to score when `state.score > (progress.best[lv.id] || 0)` (compare before writing). **S**

**W3 — The lose card explains nothing actionable. (P1)**
- *Problem:* `Out of moves…` + encouragement, but not *how close* the player was — the one fact that converts a loss into an immediate retry.
- *Change:* Add a "Still needed" line computed from unmet goal parts; drop the redundant `No worries — try again!` line (the headline carries the warmth).
- *Copy:* `Still needed: 2,140 points` / `Still needed: Gulab Jamun × 12` / `Still needed: 9 chashni squares` — multiple parts joined with ` · `.
- *Exact markup:*
```html
<h2>So close!</h2>
<p class="ov-sub">Out of moves</p>
<p class="ov-needline">Still needed: Gulab Jamun × 12</p>
<div class="ov-score">8,930</div>
<div class="ov-buttons">
  <button class="btn btn-gold btn-mid" id="btn-retry">Try Again</button>
  <button class="btn btn-plain btn-mid" id="btn-map">Map</button>
</div>
```
- *Approach:* small `needLine()` in `loseFlow()`: score → `goal.score - state.score`; collect → `n - (collected[t]||0)` per sweet; chashni → `board.chashni.filter(v => v > 0).length`. **S**

### 2.7 Tutorial & onboarding

**O1 — Tutorial has wrong art, a missing special, and a premature lesson. (P0)**
- *Problems:* (a) The "Match 4 → Rocket" row shows a **plain laddoo** — art contradicts lesson; (b) **Anaar is never taught** anywhere; (c) chashni is taught at level 1 but first appears at level 3 — a wasted memory slot at the moment of highest cognitive load; (d) "Patakha Rocket" naming (see 1.1).
- *Change:* 4 rows with real special art + the level-1 goal folded in (so first-run needs only ONE modal — tutorial acts as the goal card):
```html
<h2>How to Play</h2>
<div class="tut-row"><span class="tut-emoji">👆</span><span>Swipe two sweets to swap — line up <b>3 alike</b> to pop them!</span></div>
<div class="tut-row"><!-- tileSVG({type:'laddoo', special:ROCKET_H}) --><span><b>Match 4</b> → a Rocket — clears its whole row or column</span></div>
<div class="tut-row"><!-- tileSVG({type:'barfi', special:ANAAR}) --><span><b>Match an L or T</b> → an Anaar — blasts everything around it</span></div>
<div class="tut-row"><!-- chakri svg, as today --><span><b>Match 5</b> → a Chakri — swap it with any sweet to clear every one of that kind</span></div>
<div class="goal-panel">
  <div class="goal-panel-head">First stop: Mumbai</div>
  <div class="goal-panel-row"><span class="goal-icon">🎯</span><span>Score 5,000 points</span></div>
  <div class="goal-panel-moves">in 20 moves</div>
</div>
<div class="ov-buttons"><button class="btn btn-gold btn-mid" id="btn-tut-go">Let's Go!</button></div>
```
- Chashni lesson **moves** to the Jaipur goal card's `NEW —` note (2.4) — taught at the exact moment it appears on the board.
- `Let's Go!` sets `sawTutorial`, closes, unblocks play. The follow-up `toast(level.intro)` is removed on this path (goal already stated).
- *Approach:* rewrite `showTutorial()`; special art via existing `tileSVG()` with the svg-wrapper strip already used for the chakri row. **S**

**O2 — Back button destroys a run with zero friction, and can pop a win card over the map. (P0)**
- *Problems:* (a) One mistap on ← discards all level progress instantly; (b) latent bug: pressing ← mid-cascade lets the resolve chain finish on the (hidden) game screen — `settleTurn()` has no `state.over` guard, so a win/lose overlay can appear **on top of the map**.
- *Change:* The game screen's ← shows a confirm card — but only when a move has been spent (`state.movesLeft < state.level.moves` and `!state.over`); otherwise leave instantly. `Leave` sets `state.over = true` before navigating, and `settleTurn()` gains an entry guard `if (state.over) return;`.
- *Exact markup:*
```html
<h2>Leave level?</h2>
<p class="ov-sub">Progress in this level will be lost.</p>
<div class="ov-buttons">
  <button class="btn btn-gold btn-mid" id="btn-stay">Keep Playing</button>
  <button class="btn btn-plain btn-mid" id="btn-leave">Leave</button>
</div>
```
- *Approach:* Give the game-screen back button its own handler (remove it from the generic `[data-nav]` binding or branch inside it). `Keep Playing` just hides the overlay. Defensive one-liner: any navigation to the map hides the overlay. **S**

**O3 — Onboarding arc summary (result of 2.4 + 2.5 + 2.7):** Level 1 = one merged tutorial+goal modal → play. Every new level = goal card with flavor line. First Rocket/Anaar/Chakri = named toast at creation. First chashni level = NEW note on its goal card. Nothing is taught before it exists; everything is named once, in English, then celebrated in Hindi.

---

## 3. Visual refinements (within the existing identity)

### 3.1 Keep — explicitly

Palette variables, night-sky gradients, rangoli spinners, grain overlay, toran garland, diya row, the dabba treatment (border, outline, lid tag `॥ शुभ स्वाद ॥`), all six sweet SVGs, special overlays, star track, combo-toast gradient text, petal + firework celebrations, Modak/Baloo 2 pairing, en-IN formatting, zigzag map cards, `prefers-reduced-motion` kill-switch. None of this churns.

### 3.2 New component styles (exact values)

```css
/* Title progress line (T1) */
.title-progress { color: var(--turmeric); font-weight: 700; font-size: 0.95rem;
  margin-top: 10px; text-shadow: 0 2px 6px rgba(0,0,0,0.5); }

/* Map subtitle (M1) */
.map-sub { width: min(560px, 94vw); text-align: center; font-size: 0.85rem; font-weight: 700;
  letter-spacing: 0.04em; opacity: 0.78; margin: -2px auto 8px; }
.map-sub .star { color: var(--turmeric); }

/* Goal panel (L1, O1) — cream-card inset */
.goal-panel { background: rgba(122,30,60,0.08); border: 2px dashed rgba(122,30,60,0.35);
  border-radius: 14px; padding: 10px 14px; margin: 10px 0 4px;
  display: flex; flex-direction: column; align-items: center; gap: 6px; }
.goal-panel-head { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em;
  text-transform: uppercase; opacity: 0.6; }
.goal-panel-row { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.05rem; }
.goal-panel-row svg { width: 30px; height: 30px; }
.goal-panel-moves { font-weight: 700; opacity: 0.75; font-size: 0.9rem; }

/* Flavor line on goal card (L1) */
.ov-flavor { font-weight: 600; font-style: italic; opacity: 0.8; margin: 4px 0 0; }

/* Win shout headline (W1) */
.ov-shout { font-size: clamp(2.4rem, 10vw, 3.3rem); transform: rotate(-2deg); line-height: 1; }
/* (inherits h2's Modak/maroon/text-shadow — the stars and petals supply the color) */

/* Lose delta line (W3) */
.ov-needline { font-weight: 800; color: #9A3412; margin: 4px 0; }
```

### 3.3 Small corrective tweaks

- `.hud-sub` → add `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;` (G2).
- `.overlay-card` → add `max-height: min(86dvh, 640px); overflow-y: auto;` — the tutorial and goal cards must never clip on a 320×568 viewport.
- Mobile HUD order block per G1 (replaces the current order rules inside the existing media query; keep `#screen-game { padding-top: 54px }` and the toran height reduction).
- Win-card sub Devanagari: `.ov-sub small { font-weight: 600; opacity: 0.7; }`.

### 3.4 Focus visibility (currently absent)

```css
.btn:focus-visible { outline: 3px solid var(--turmeric); outline-offset: 3px; }
.ynode:focus-visible { outline: 3px solid var(--turmeric); outline-offset: 2px; }
```
Minimum viable keyboard support; full board keyboard nav is out of scope (noted P2/M5).

### 3.5 Emoji discipline in overlay cards

Remove 🎉 / 😅 / 🇮🇳 from overlay card *text* (headlines now carry the emotion; cards read premium). Emoji stay where they are **iconography**: map medals (🌊 🏛️ …), 🔒 lock, 🎯 score goal, 👆 tutorial gesture, 🔊 mute.

### 3.6 Mute glyph (P2)

🔔/🔕 is notification language, not sound language. Swap to 🔊/🔇 in `syncMuteButtons()`; keep the round-chip styling.

---

## 4. Prioritized plan

Estimates: **S** < 30 min · **M** ≈ 1 h · **L** > 2 h. All P0+P1 are vanilla JS/CSS in `main.js`, `levels.js` (strings only), `sweets.js` (one swatch fn), `index.html` (two elements), `style.css`. `board.js` untouched.

### P0 — must (≈ 3 h): the "do I know what I'm doing?" tier

| # | Item | Spec | Est |
|---|---|---|---|
| 1 | Level-start goal card (+ replay skips it, busy gating, chashni NEW note) | 2.4 | **M** |
| 2 | Quit confirm on ← + `state.over` guard in `settleTurn()` (fixes overlay-over-map bug) | 2.7 O2 | **S** |
| 3 | Win card hierarchy flip: shout headline, `Next: {City} →`, final-level variant, emoji cleanup | 2.6 W1 | **S** |
| 4 | Tutorial rewrite: real Rocket art, add Anaar, remove premature chashni, merge level-1 goal | 2.7 O1 | **S** |
| 5 | Title CONTINUE state + `Next stop:` line | 2.1 T1 | **S** |

### P1 — strong improvements (≈ 2 h): the "does it feel cared-for?" tier

| # | Item | Spec | Est |
|---|---|---|---|
| 6 | First-creation special toasts (`Rocket! Clears the whole line` …) + `progress.seen` | 2.5 F1 | **S** |
| 7 | Map subtitle with journey progress + auto-scroll to current city | 2.2 M1–M2 | **S** |
| 8 | Mobile HUD regroup (moves+goal row above board) + `.hud-sub` ellipsis | 2.3 G1–G2 | **S** |
| 9 | Lose card `Still needed:` delta line | 2.6 W3 | **S** |
| 10 | Chashni goal-icon pink swatch SVG (chip + cards) | 2.3 G3 | **S** |
| 11 | Copy scrub: "ji", `× n` format, `all clear`, `All 9 cities cleared`, `Clear the chashni glaze` | 1.4 | **S** |
| 12 | `:focus-visible` styles + overlay-card max-height safety | 3.3–3.4 | **S** |

### P2 — nice-to-have

- Star-thresholds line on goal card (`★ 5,000 · ★★ 9,000 · ★★★ 14,000`) — **S**
- `New best!` tag on win card — **S**
- Final-win `★ {n}/27 collected` summary — **S**
- Level-number chips on map medals — **S**
- Per-segment gold path fill on map — **M**
- Goal-chip tick animation on progress; first-chashni-clear toast — **S** each
- Mute glyph 🔊/🔇 — **S**
- Map nodes as real `<button>`s (keyboard) — **M**
- Full keyboard board navigation — **L** (explicitly deferred)

### Explicitly not proposed
Frameworks, build steps, external assets/CDNs (existing Google Fonts link stands as-is), engine (`board.js`) changes, new levels, monetization, accounts, i18n toggles.

---

## Appendix: state additions

`progress` gains one key: `seen: {}` (flags: `rocket`, `anaar`, `chakri`, `chashni`), default-merged in `loadProgress()` like existing keys — backward compatible with saved `barfiBlast.v1` / migrated `mithaiCrush.v1` blobs.
