# Barfi Blast — Game-Screen Responsive Layout Spec

**Date:** 2026-08-02 · **Author:** design direction · **Scope:** `css/style.css` only (plus one optional 1-line JS guard). No HTML changes. No engine changes.

---

## 0. Direction (the one-paragraph decision)

**The board is the hero; chrome pays rent.** The board's edge is always "everything the
chrome doesn't spend": `min(92vw, 100dvh − chrome, 680px)`. On wide+tall desktops the side
space stays **atmospheric** — bigger board (cap raised 520→680), HUD column widened to match
it, and cheap stagecraft (vignette + distant-diya bokeh) at ≥1400px. A side **rail** exists
only as the *survival layout* for short-landscape viewports (≤520px tall), where no amount of
top-chrome compression can produce touchable cells. Everything reflows live with pure CSS;
the only JS involved (toran re-tiling) already exists and needs no changes.

Why atmospheric (not a rail) on wide+tall desktop:

1. Match-3 attention is a tight loop (board ↔ moves ↔ goal). With a 680px board, the top
   chips sit *closer* to board center than a viewport-left rail would on a 1990px screen.
   A rail buys no glance advantage there.
2. The reported pain is "board too small, swimming in void" — not "HUD far away". Solve the
   actual complaint: board +25–31% on every desktop size, column widened 560→up to ~715px.
3. The vertical rhythm toran → HUD → dabba is the loved identity (a lit shop-front shrine).
   A second visual mass at the side unbalances that composition.
4. One desktop layout = resize continuity and half the QA surface. The rail appears only
   where the height math *forces* it (see §3, mode M3).

---

## 1. The layout law

```
board-edge = min( 92vw,  100dvh − chrome(mode),  680px )      // modes M0–M2
board-edge = min( 100dvh − 56px,  100vw − 300px,  680px )     // mode M3 (rail: chrome moves to x-axis)
column-w   = min( 96vw,  board-edge + 2·dabba-pad + 6px )     // HUD + score row track the board
```

`chrome(mode)` is the **measured** vertical cost of everything that isn't board, per mode.
Keep this table in sync if chip typography ever changes:

| Mode | padding-top | .game-head | gap | .score-row | gap | .dabba (pad+border) | padding-bottom | **chrome const** |
|------|------------:|-----------:|----:|-----------:|----:|--------------------:|---------------:|-----------------:|
| M1 default        | 64 | 55 (1 row)      | 8 | 24 | 8 | 38 (2×16+6) | 18 | **218** (215+3 slack) |
| M0 ≤560w (as today)| 54 | 106 (2 rows+6) | 8 | 21 | 8 | 30 (2×~12+6) | 18 | **244** |
| M2 compact        | 46 | 44 (slim row)   | 6 | 18 | 6 | 24 (2×9+6)  | 10 | **154** |
| M3 rail           | 8  | — (in rail)     | — | —  | — | 24          | 8  | **56** (40+16 slack for outline glow) |

### Ceiling: why 680px (was 520px)

- **Cell size.** 680/8 = **85px cells** — the sweet spot's upper bound. The SVG sweets are
  vector, so they render crisply; at 85px they read as "big juicy mithai". Above ~95px cells
  (board ≥ 760) the tray starts to feel sparse — per-cell padding is 6.5% so gaps scale up
  too, and a single sweet larger than a cursor-fist reads toy-like, not game-like.
- **Eye sweep.** 680px ≈ 17–18° of visual field at 60cm desktop viewing distance — the whole
  8×8 pattern stays inside a comfortable scan without head travel. 900px+ boards demand
  physical scanning and slow pattern recognition.
- **Fills the common tall case exactly.** chrome 218 + board 680 = 898 ≈ a 900px-tall
  viewport (1440×900-class laptops fill edge-to-edge). Taller viewports vertically center the
  column (§4 patch 2) so the composition stays deliberate instead of top-hugging.
- The old 520 cap + 58vh was the "narrow phone column on desktop" feel. 92vw stays as the
  narrow-viewport bound; it never binds above ~745px width.

---

## 2. Mode/breakpoint table

Order in the stylesheet matters: base → M0 (existing 560 block) → M2 → M3 → W1 → W2 →
overlay-short → **reduced-motion stays last**. M3 is a subset of M2's query, so M3
inherits M2's compact typography and only overrides placement — that's intentional.

| Mode | Media query | Toran | HUD | Score row | Board law |
|------|-------------|-------|-----|-----------|-----------|
| **M0** phone portrait | `(max-width: 560px)` *(existing block — only add 2 vars)* | 46px | 2-row wrap (existing order) | own row | `min(92vw, 100dvh−244, 520)` — **92vw always binds ≤560w**, so pixel-identical to today |
| **M1** default (portrait tablets, squarish + tall desktops) | *base rules* | 58px | 1 row, width = column | own row, width = column | `min(92vw, 100dvh−218, 680)` |
| **M2** compact (short-wide windows, short laptops) | `(min-width: 561px) and (orientation: landscape) and (max-height: 700px)` | 40px | 1 slim row (smaller type, 36px round buttons) | slim 18px strip | `min(92vw, 100dvh−154, 680)` |
| **M3** rail (phone landscape, squat windows) | `(min-width: 561px) and (orientation: landscape) and (max-height: 520px)` | hidden | 168px left rail: back+mute / city / **moves (hero)** / goal | in rail, below chips | `min(100dvh−56, 100vw−300, 680)` |
| **W1** wide atmosphere | `(min-width: 1400px)` | — | — | — | adds vignette + diya bokeh + rangoli nudge |
| **W2** big-desktop HUD scale | `(min-width: 1200px) and (min-height: 760px)` | — | type up one step (chrome 218→230) | value 1.7rem, track 16px | unchanged law, `--game-chrome: 230` |

**Threshold rationale**
- `700px` (M2): a 768-line laptop minus browser chrome lands at ~660–690 viewport height —
  the single most common "short" desktop case. iPad landscape (768) intentionally stays M1.
- `520px` (M3): with M2's 154px chrome, 8 touch cells × 44px (HIG minimum) + 154 = 506.
  Below ~520px tall, *no stacked layout can produce touchable cells* — chrome must leave the
  y-axis entirely. All landscape phones (375–428px tall) land here.
- `orientation: landscape` guards both compact tiers so phone *portrait* (which can be
  ≤700px tall) is never caught. `min-width: 561px` keeps the M0 block the sole owner of
  narrow widths (no cascade fights).
- Mode boundaries snap during live resize (board can *grow* when the window shrinks past
  700h, because chrome shrank more). This is intended; no width transitions — they'd fight
  live dragging.

---

## 3. Exact CSS patches

### Patch 1 — dvh unit shim (top of file, right after the `:root` block, ~line 24)

Custom-property indirection breaks classic two-line fallbacks, so define the unit once:

```css
/* Dynamic-viewport unit with vh fallback (pre-2022 Safari) */
:root { --dvh: 1vh; }
@supports (height: 1dvh) { :root { --dvh: 1dvh; } }
```

### Patch 2 — the law (replace `#screen-game` rule, line ~242)

```css
#screen-game {
  padding: 64px 10px 18px;
  gap: 8px;
  /* Layout law: the board gets every pixel the chrome doesn't spend. */
  --game-chrome: 218px;                 /* M1 vertical chrome — see spec §1 table */
  --board-max: 680px;                   /* 85px cells — spec §1 */
  --dabba-pad: clamp(10px, 2.4vw, 16px);
  --board-edge: min(92vw, 100 * var(--dvh) - var(--game-chrome), var(--board-max));
  --col-w: min(96vw, calc(var(--board-edge) + 2 * var(--dabba-pad) + 6px));
}

/* Tall viewports: center the column instead of top-hugging (mobile keeps today's flow). */
@media (min-width: 561px) {
  #screen-game { justify-content: center; }
}
```

### Patch 3 — wire the consumers (4 one-line edits)

```css
.game-head   { width: var(--col-w); }      /* was: width: min(560px, 96vw);  line ~245 */
.score-row   { width: var(--col-w); }      /* was: width: min(560px, 96vw);  line ~277 */
.dabba       { padding: var(--dabba-pad); }/* was: clamp(10px, 2.4vw, 16px); line ~321 — same value, now shared */
.board-frame { width: var(--board-edge); } /* was: min(92vw, 58vh, 520px);   line ~340 */
```

### Patch 4 — M0 constants (ADD inside the existing `@media (max-width: 560px)` block, line ~713; change nothing else there)

```css
  #screen-game { --game-chrome: 244px; --board-max: 520px; }
```

(92vw binds at every real phone size, so the rendered board is unchanged; the constants only
make degenerate tiny-portrait windows subtract correctly instead of using 58vh.)

### Patch 5 — M2 compact tier (append in RESPONSIVE section, after the 560 block)

```css
/* M2 — COMPACT: landscape windows too short for full chrome (short-wide desktops, small laptops) */
@media (min-width: 561px) and (orientation: landscape) and (max-height: 700px) {
  .toran { height: 40px; }
  #screen-game {
    --game-chrome: 154px;               /* 46+44+6+18+6+24+10 — see spec §1 */
    --dabba-pad: 9px;
    padding: 46px 10px 10px;
    gap: 6px;
  }
  .game-head { gap: 6px; }
  .hud-chip  { padding: 3px 10px 4px; border-radius: 11px; }
  .hud-big   { font-size: 1.3rem; }
  .hud-label { font-size: 0.92rem; }
  .hud-sub   { font-size: 0.6rem; }     /* keep captions — a bare number is ambiguous */
  .goal-item { font-size: 0.85rem; }
  .goal-item svg { width: 20px; height: 20px; }
  .btn-round { width: 36px; height: 36px; font-size: 1rem; }
  .score-label { font-size: 0.62rem; }
  .score-value { font-size: 1.1rem; min-width: 60px; }
  .star-track  { height: 11px; }
  .track-star  { font-size: 0.85rem; }
  .dabba { border-radius: 18px; }
  .dabba-lid-tag { top: -10px; font-size: 0.68rem; padding: 1px 10px; }
}
```

### Patch 6 — M3 rail (append directly after Patch 5; inherits M2's compact type)

Pure CSS re-slotting of the existing DOM: `#screen-game` becomes a 2-column grid
(`head/score` rail + `dabba`); `.game-head` becomes an internal 2-col grid so back/mute
share the top row while the three chips stack full-width. Rail order top→bottom:
back+mute, city/level, **moves (the per-turn glance, biggest)**, goal, then score+stars.
`.combo-layer` and the overlay are `position: fixed` — untouched by the grid.

```css
/* M3 — RAIL: heights where any top chrome would starve the board (landscape phones, squat windows) */
@media (min-width: 561px) and (orientation: landscape) and (max-height: 520px) {
  .toran { display: none; }             /* deliberate identity trade — every px is gameplay here */
  #screen-game {
    --board-edge: min(100 * var(--dvh) - 56px, 100vw - 300px, 680px);
    display: grid;
    grid-template-columns: 168px auto;
    grid-template-areas: "head dabba" "score dabba";
    align-content: center;
    align-items: start;
    justify-content: center;
    column-gap: 16px;
    row-gap: 10px;
    padding: 8px 12px;
  }
  .game-head {
    grid-area: head;
    width: 168px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .game-head .btn-back { justify-self: start; }               /* auto-places row 1, col 1 */
  .game-head .btn-mute { grid-row: 1; grid-column: 2; justify-self: end; }
  .game-head .hud-chip { grid-column: 1 / -1; }               /* city, moves, goal stack full-width */
  .hud-big  { font-size: 1.5rem; }                            /* moves back up to hero size */
  .hud-goal { flex-wrap: wrap; justify-content: center; column-gap: 10px; }
  .score-row {
    grid-area: score;
    width: 168px;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 0;
  }
  .score-label, .score-value { text-align: center; }
  .score-value { min-width: 0; }
  .star-track  { width: 100%; }
  .dabba { grid-area: dabba; }
  .dabba-lid-tag { display: none; }
}
```

Width budget check: rail 168 + column-gap 16 + dabba chrome 24 + screen padding 24 = 232;
the `100vw − 300px` term leaves 68px slack for the gold outline glow and centering. On a
667×375 phone the whole assembly is ~545px wide — always fits.

### Patch 7 — overlay/goal-card on short screens (append after Patch 6)

Card already scrolls (`overflow-y: auto`) and is height-capped (`min(86dvh, 640px)`); this
just lets more content fit before scrolling kicks in:

```css
/* Overlays on short screens — tighter card so goal/tutorial content fits before scrolling */
@media (max-height: 520px) {
  .overlay-card {
    max-height: 92vh;                   /* classic fallback pair — no var indirection needed */
    max-height: 92dvh;
    padding: 16px 18px 14px;
    border-radius: 20px;
  }
  .overlay-card h2 { font-size: clamp(1.5rem, 8vh, 2.4rem); }
  .ov-stars   { font-size: 2rem; margin: 6px 0 2px; }
  .goal-panel { padding: 8px 12px; margin: 8px 0 2px; }
  .tut-row    { margin: 8px 0; }
  .tut-row svg { width: 32px; height: 32px; }
}
```

### Patch 8 — W1 wide-screen atmosphere (append after Patch 7)

Stagecraft, not clutter: a soft vignette pulls focus to the play column, and a handful of
blurred "distant diya" bokeh dots warm the bottom corners. Uses the existing `softPulse`
keyframe; the global reduced-motion rule already blankets it. `.grain` is a child div, so
`.sky`'s pseudo-elements are free.

```css
/* W1 — wide-screen atmosphere: the void becomes a night-market horizon */
@media (min-width: 1400px) {
  .sky::before {                        /* distant diya bokeh, bottom corners */
    content: '';
    position: absolute; left: 0; right: 0; bottom: 0; height: 34vh;
    background:
      radial-gradient(6px 6px at 7% 76%,  rgba(255, 208, 112, 0.85), transparent 65%),
      radial-gradient(4px 4px at 12% 58%, rgba(255, 170, 60, 0.55),  transparent 65%),
      radial-gradient(5px 5px at 4% 44%,  rgba(255, 220, 140, 0.4),  transparent 65%),
      radial-gradient(6px 6px at 93% 72%, rgba(255, 208, 112, 0.85), transparent 65%),
      radial-gradient(4px 4px at 88% 54%, rgba(255, 170, 60, 0.55),  transparent 65%),
      radial-gradient(5px 5px at 96% 42%, rgba(255, 220, 140, 0.4),  transparent 65%);
    filter: blur(1.5px);
    animation: softPulse 4.5s ease-in-out infinite alternate;
  }
  .sky::after {                         /* focus vignette — must not darken the play column */
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 54% 60% at 50% 46%, transparent 58%, rgba(10, 3, 18, 0.45) 100%);
  }
  .rangoli-a { right: -14vmin; }        /* nudge the spinners inward so corners aren't bare */
  .rangoli-b { left: -16vmin; }
}
```

### Patch 9 — W2 big-desktop HUD scale (append after Patch 8)

The 680px board deserves chips scaled to match. Chrome grows ~12px, so bump the constant:

```css
/* W2 — big-desktop HUD: chips scale up to match the 680px board */
@media (min-width: 1200px) and (min-height: 760px) {
  #screen-game { --game-chrome: 230px; }
  .hud-big   { font-size: 1.95rem; }
  .hud-label { font-size: 1.12rem; }
  .goal-item { font-size: 1.05rem; }
  .goal-item svg { width: 30px; height: 30px; }
  .btn-round { width: 46px; height: 46px; }
  .score-value { font-size: 1.7rem; }
  .star-track  { height: 16px; }
}
```

---

## 4. JavaScript: nothing required

| Concern | Status |
|---|---|
| Toran re-tiling on resize | **Already handled.** `decorateToran()` reads `svg.clientHeight` and re-tiles via the existing debounced listener (`main.js:171-175`). Our CSS height changes (58→40px) fire the same `resize` event; rotation fires `resize` too. Zero changes. |
| Toran hidden in M3 | `clientHeight` is 0 → falls back to `58` (`main.js:150`) and draws into a hidden SVG — harmless. Leaving M3 by resize refires the listener and repopulates. **Optional 1-line polish** (not required): at the top of `decorateToran()` (main.js:143) add `if (!svg.clientHeight) return;`. |
| Board resize | Free. Tiles are `%`-sized and `--r/--c`-transformed; `swipeTarget` (main.js:322) and `cellCenter` (main.js:440-444) read `els.board.clientWidth` at call time, so thresholds and fx positions are always current. |
| Overlays / toasts | `position: fixed`, viewport-centered — unaffected by any mode. |
| Everything else | Pure CSS media queries + `min()`/`calc()`/custom properties. No container queries needed (all constraints are viewport-relative). |

---

## 5. Verification matrix (board edge in px, before → after)

Manually resize through these; board must never overflow and never scroll the page
(except the noted degenerate case):

| Viewport | Mode | Before | After | Cells | Note |
|---|---|---:|---:|---:|---|
| 375×812 (phone portrait) | M0 | 345 | **345** | 43px | **must be pixel-identical** |
| 390×844 (phone portrait) | M0 | 359 | **359** | 45px | identical |
| 768×1024 (iPad portrait) | M1 | 520 | **680** | 85px | +31% |
| 1024×768 (iPad landscape) | M1 | 445 | **550** | 69px | +24% |
| 1280×800 (laptop) | M1 | 464 | **582** | 73px | +25% |
| 1440×900 / 1920×1080 | M1 | 520 | **680** | 85px | +31%; fills 900h exactly (218+680=898) |
| 1366×662 (768 laptop − browser chrome) | M2 | 384 | **508** | 64px | +32% |
| 1990×600 (reported case) | M2 | 348 | **446** | 56px | +28% + W1 atmosphere |
| 926×428 (iPhone Pro Max landscape) | M3 | 248 | **372** | 46px | +50%; cells cross the 44px touch minimum |
| 812×375 (iPhone X landscape) | M3 | 218 | **319** | 40px | +46%; physical ceiling for this height |
| ~650×280 (fold cover, landscape) | M3 | — | 224 | 28px | degenerate; page may scroll — acceptable |

Also verify: live-drag a desktop window through 700h and 520h — layouts snap, nothing
overlaps, toran re-tiles within ~150ms; open the goal card and win card at 926×428 — card
scrolls internally, buttons reachable; run one full level at 1990×600 and 375×812.

---

## 6. Priorities

| # | Item | Patches | Size | Impact |
|---|---|---|---|---|
| **P0-1** | Sizing law + column tracking + centering + dvh shim | 1, 2, 3, 4 | **S** (~40 min incl. resize sweep) | Kills the desktop void: +25–31% board on every desktop/tablet; HUD stops being a detached 560px strip |
| **P0-2** | M2 compact tier | 5 | **M** (~1 h) | Fixes reported 1990×600 (348→446) and short laptops |
| **P1-1** | M3 rail | 6 | **M** (~1–1.5 h) | Phone landscape goes from unplayable (27–31px cells) to playable (40–46px) |
| **P1-2** | Overlay short-screen tighten | 7 | **S** (~15 min) | Goal/tutorial cards stop feeling cramped in landscape |
| **P2-1** | Wide atmosphere (vignette + bokeh) | 8 | **S** (~30 min) | ≥1400px stops feeling empty without touching the play column |
| **P2-2** | Big-desktop HUD scale | 9 | **S** (~20 min) | Chips match the bigger board's presence |

P0+P1 total ≈ 3–3.5 hours. Each patch is independently shippable in the listed order.

---

## 7. KEEP list (must not regress)

- **Mobile portrait (≤560px) is pixel-identical**: 2-row HUD wrap order (`back·city·mute /
  moves·goal`), 46px toran, 54px top padding, board bound by 92vw. Patch 4 adds only two
  custom properties to that block — verify 375×812 renders exactly as today.
- **Board stays square** (`aspect-ratio: 1`) in every mode; tile mechanics untouched
  (12.5% sizing, `--r/--c` transforms, `touch-action: none`, `.chashni-layer`/`.fx-layer`
  at `inset: 0` — they track the frame automatically).
- **Overlays**: fixed, centered, `width: min(92vw, 400px)`, internally scrollable; goal
  card / tutorial / win / lose flows unchanged. Combo toasts stay fixed-center.
- **Identity**: night-sky gradient, grain, rangoli spinners, maroon+gold dabba with lid tag,
  Modak/Baloo 2, diyas on title, toran on every screen — except M3 hides the toran (a
  documented survival-mode trade; dabba + rangoli + night sky carry the identity there).
- **`prefers-reduced-motion` block stays the last rule in the file** — its `*` blanket must
  cover the new W1 `softPulse` animation (it does, if order is preserved).
- **No JS behavior changes**: `decorateToran` resize listener (main.js:171-175), swipe
  thresholds, fx positioning, dev hooks (`window.__barfi`) all untouched.
- **No new assets, no build step, no frameworks** — vanilla CSS only; the two compact tiers
  and the rail are re-slottings of the existing DOM.
