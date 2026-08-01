# Mithai Crush — Desi Candy Crush Design Spec

Date: 2026-08-01
Status: Approved for autonomous execution (user pre-authorized: "iterate autonomously until it's ready and works")

## Purpose

A polished, browser-playable match-3 game that takes the Candy Crush formula and makes it
authentically Indian — not a palette swap, but a game whose food, language, celebrations,
and visual identity land with an Indian audience on first sight.

## Success criteria

1. Fully working match-3: swap, match detection, cascades, gravity, refill, specials,
   combos, level goals, scoring, progression — no console errors, verified in the browser.
2. Reads as unmistakably desi within 3 seconds: mithai pieces, festive palette, Hinglish
   copy, Diwali-style celebrations, Indian numbering (lakh/crore separators).
3. Visual quality meets frontend-design skill standards — distinctive, not generic.
4. Runs as a static page (JS + CSS, no build step, no backend).

## Game design

### Pieces — the mithai (6 types, distinct silhouette + color)

| Sweet | Shape | Color story |
|---|---|---|
| Laddoo | circle, boondi texture | saffron orange |
| Jalebi | spiral | glossy gold |
| Kaju Katli | diamond, silver vark | pale silver-sage |
| Gulab Jamun | glossy dark sphere, syrup shine | deep brown |
| Barfi | square, vark + pistachio fleck | rose pink |
| Samosa | triangle, crimped edge | golden tan (the savory gatecrasher — intentional joke) |

### Specials — Diwali patakhe

- **Rocket** (4 in a line): clears a full row or column. Horizontal match → column rocket;
  vertical match → row rocket.
- **Anaar** (L/T of 5): 3×3 explosion.
- **Chakri** (5 in a line): color bomb — swap with any sweet to clear every sweet of that type.
- Special+special swaps: rocket+rocket = cross clear; anaar+anaar = 5×5; chakri+rocket =
  clear that color as if each were popped, plus the rocket line; chakri+chakri = full board clear.

### Levels — "Mithai Yatra"

9 levels along an India journey (Mumbai → Delhi → Jaipur → Kolkata → Chennai → Amritsar →
Goa → Varanasi → Kashmir). Sequential unlock, 1–3 stars by score, localStorage persistence.

Goal types:
1. **Score target** within move limit.
2. **Collect** — clear N of a named sweet.
3. **Chashni** — syrup-glazed cells; matching on a cell removes its glaze; clear all glaze.
   (Chashni is an overlay per cell — no changes to gravity/board shape.)

### Feel / juice

- Click-select-then-click-adjacent AND drag/swipe to swap. Invalid swap: shake + revert.
- Cascade multiplier with Hinglish toasts escalating: "Wah!" → "Shabash!" → "Kya baat hai!"
  → "Ek number!" → "Zabardast!" → "DHAMAKEDAAR!" → "FULL PAISA VASOOL!"
- Idle hint pulse after 5s. Auto-reshuffle when no valid moves.
- Level win: fireworks + falling marigold petals. Fail: "Koi baat nahi — phir se try karo!"
- WebAudio synth sounds (pops rising per cascade, boom for specials, win melody), mute toggle,
  initialized on first user gesture.

### Visual identity

- Board is a **mithai ka dabba** — sweets gift box with golden dividers.
- **Marigold toran** (garland with mango leaves) across the header.
- Palette: deep plum/indigo night backdrop with subtle rangoli motifs; rani pink, marigold,
  turmeric, peacock teal, gold foil accents.
- Type: "Modak" (chunky display, Devanagari-friendly) for logo/headers, "Baloo 2" for UI,
  with graceful system fallbacks if fonts fail to load.
- Scores formatted en-IN (1,00,000).

## Architecture

Vanilla ES modules, no build step. DOM tiles (absolutely positioned) + CSS transitions for
all movement; DOM particles for celebration effects.

```
index.html          screens: title, level select (yatra map), game, overlays
css/style.css       all styling + keyframe animations
js/board.js         PURE logic: grid, match finding, specials, gravity/refill, valid moves,
                    shuffle, chashni bookkeeping. No DOM. Node-testable.
js/levels.js        level definitions
js/sweets.js        inline-SVG art generators for sweets + special overlays
js/audio.js         WebAudio synth
js/main.js          rendering, animation orchestration, input, screens, persistence
test/board.test.mjs node --test suite for board.js
```

Resolve loop after a swap: find matches → pop (score + special creation) → gravity → refill
→ repeat until stable → goal check. Orchestrated with async/await; board.js returns
declarative diffs (cleared cells, moved tiles, spawned tiles) that main.js animates.

### Approaches considered

1. **DOM tiles + CSS animations — CHOSEN.** Easiest path to high visual polish, perfect fit
   for an 8×8 grid and the "JavaScript and CSS" brief.
2. Canvas renderer — better for thousand-particle effects but more code for UI/text, fights
   the CSS ask. Rejected.
3. React/Vue — build step and framework weight with zero benefit for a single-screen game.
   Rejected.

## Testing

- `node --test test/` covering: no-initial-match generation, H/V match detection incl.
  overlaps, special creation rules (4→rocket, 5→chakri, L/T→anaar), special activation cell
  sets and chain reactions, gravity/refill integrity, valid-move detection, shuffle
  preserving composition, chashni clearing.
- Browser verification via Claude browser pane each iteration: console clean, click-driven
  swaps resolve correctly, specials fire, level win/fail flows, visual screenshots reviewed
  against the "would this click with an Indian audience" bar.

## Out of scope (YAGNI)

Backend, accounts, lives/energy timers, boosters, irregular board masks, i18n toggle,
level editor, monetization anything.
