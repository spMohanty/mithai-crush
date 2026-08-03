# Barfi Blast — Luxury Art Direction

**Date:** 2026-08-03 · **Author:** design direction · **Scope:** `css/style.css`, `js/rangoli.js`,
`js/sweets.js`, `js/main.js` (render/decorate functions only), `index.html` (font link + a few
markup hooks). **Off-limits:** `js/board.js`, `js/director.js`, `js/levels.js` goal/moves/star
data, gameplay mechanics, copy policy.

**Target:** move from "nicely made indie game" to "boutique studio flagship". Intricacy is
welcomed. No build step, no frameworks, no external assets — everything procedural SVG/CSS.

---

## 0. The one-paragraph decision

**MEENAKARI MIDNIGHT — vark, enamel, and lamplight.**

The whole product is one piece of Jaipur *meenakari*: deep glassy enamel poured into raised
gold cloisons, lit by a single warm lamp from above-left. Every surface must earn a material —
the dabba is **lacquer**, the chrome is **kundan-set gold**, the cards are **hand-laid paper
with a foil edge**, the mithai wear **vark**. Nothing in the product is allowed to be "a
colored box with a gold border" ever again: gold is a raised *edge* with a light side and a
dark side, and enamel is a translucent *pool* with depth beneath it.

Two laws generate the entire system. Everything downstream is an application of them.

**THE CLOISON LAW.** Every gold edge is a three-part sandwich, never a single stroke:
an outer dark **seat line** where metal meets shadow → the **metal body** (a gradient running
*perpendicular* to the edge, dark→bright→dark) → an inner 1px **hot line**, the specular catch
on the bevel. Implementable as one gradient border plus two inset shadows. Costs nothing.

**THE ONE LAMP LAW.** Light arrives from ~15° above-left. Surface gradients run at **165deg**.
Specular highlights sit at **32% x / 24% y**. Shadows offset +y with a slight +x, and are
**plum-tinted, never black** — pure black over a plum ground produces dead grey mud. Every
shadow is a *ladder*: contact + form + ambient.

Why this direction and not, say, "gold minimalism": the identity already is a Diwali-night
mithai shop, and meenakari is the exact craft where *deep saturated color* and *gold* coexist
without either becoming gaudy. It lets us keep the festive palette the game needs while
supplying the discipline it lacks.

---

## 1. Diagnosis — why it currently reads "indie"

Blunt, with receipts. Line numbers are `css/style.css` unless noted.

### 1.1 One recipe at three sizes (the biggest tell)

```css
.ynode        { background: linear-gradient(160deg, rgba(122,30,60,.88), rgba(61,15,53,.92));
                border: 2px solid var(--gold-line); border-radius: 18px;
                box-shadow: 0 6px 16px rgba(0,0,0,.4); }          /* :197 */
.hud-chip     { background: linear-gradient(170deg, rgba(122,30,60,.85), rgba(48,12,40,.9));
                border: 2px solid var(--gold-line); border-radius: 14px;
                box-shadow: 0 4px 10px rgba(0,0,0,.35); }         /* :264 */
.dabba        { …; border: 3px solid var(--gold-deep); border-radius: 24px; }   /* :332 */
.overlay-card { …; border: 3px solid var(--gold-deep); border-radius: 26px; }   /* :512 */
```

Four different *objects* — a map plaque, a status chip, a sweets box, a paper card — rendered
as the same object at four scales. Luxury reads as luxury because materials are
**differentiated**: a gold band is not a lacquer tray is not a sheet of paper. Right now the
product has exactly one material.

### 1.2 Gold is a color, not a metal

`--gold-line: rgba(245,197,66,.55)` is a flat 55%-alpha stroke. Metal reads as metal only via
**anisotropic banding** — a gradient that reverses (dark→bright→dark→bright) across the
surface — plus a warm dark line on the shadow edge. Additionally `--gold: #F5C542` sits at hue
~46°, which is *green*-gold; real gold bodies live at 40–43° and their shadows shift *warmer*
(toward 38°), not just darker.

`.btn-gold` (:593) is closest to right, but `box-shadow: 0 6px 0 #7A4A00` is the hard-offset
chunky slab of hypercasual mobile games — the precise opposite signal.

### 1.3 Hard-offset "sticker" text shadows

```css
.logo-blast { text-shadow: 0 3px 0 var(--maroon), 0 6px 14px rgba(0,0,0,.55); }   /* :116 */
.logo-barfi { filter: drop-shadow(0 5px 0 rgba(83,15,45,.95)) …; }                /* :106 */
.map-title  { text-shadow: 0 3px 0 var(--maroon), …; }                            /* :183 */
.combo-toast{ filter: drop-shadow(0 4px 0 rgba(83,15,45,.95)) …; }                /* :482 */
```

A 3–5px solid slab under type is the free-to-play sticker idiom. Luxury display type gets
depth from **material**: foil gradient + 1px dark inner edge + soft ambient. A 2px emboss, not
a 5px slab.

### 1.4 Emoji as iconography

`🌊 🏛️ 🏰 🌉 🏖️ 🛕 🥥 🪔 🏔️` (`js/levels.js` `emblem`), plus `🔒` `🎯` `👆` `🔔/🔊/🔇` `☢` and
`★` as a text glyph in `.ov-stars`. This is the loudest indie signal available: another
vendor's art, another studio's style, another color temperature, re-rendered differently on
every OS. And the product contradicts itself — `.track-star` uses a proper SVG star path
(`index.html:92`) while `.ov-stars` uses the `★` character at 2.6rem.

### 1.5 No radius system, and the dabba is not concentric

Radii in use: 6, 10, 10%, 11, 12, 14, 18, 20, 24, 26, 999. Picked per element.

Worse, nested radii break the concentricity rule (`r_outer = r_inner + border + padding`):

```
.dabba        border-radius: 24px;  border 3px;  padding clamp(10px, 2.4vw, 16px)
.board-frame  border-radius: 12px
correct inner radius = 24 − 3 − pad  →  11px at pad=10  …  5px at pad=16
```

So on desktop the inner corner is more than twice as round as it should be, and the gold band
visibly **thins at the corners**. Nobody names this when they see it; everybody feels it.

### 1.6 Shadows: one light, one color, no ladder

`0 6px 16px rgba(0,0,0,.4)` · `0 4px 10px rgba(0,0,0,.35)` · `0 18px 40px rgba(0,0,0,.55)` ·
`0 24px 60px rgba(0,0,0,.6)`. Same recipe, always pure black, no contact shadow, no ambient
separation, no warm bounce. Over a plum ground, black shadows desaturate into grey mud.

### 1.7 Type: two faces, and Modak is doing jobs it cannot do

Modak is a superb chunky display face — one weight, no tabular figures, one width, muddy below
~24px. It is currently carrying: `.logo`, `.map-title`, `.hud-big` (the moves counter, at
1.7rem), `.overlay-card h2`, `.ov-score`, `.floatie`, `.combo-toast`. Setting the single
most-glanced number in the game in a display face with proportional figures is both a
legibility loss and a cheapness signal.

The system already knows better — `.score-value` (:297) explicitly opts out with the comment
*"numerals are data: UI face with tabular figures, not the bubbly display face"*. That
judgement is right and is not applied anywhere else.

There is also no **third register**. Every luxury type system has display / text / and a
letterspaced small-caps *label* register that carries the refinement. `.hud-sub` gestures at it
(`0.68rem`, `.06em`, uppercase, `opacity .7`) but it is just Baloo turned down.

### 1.8 Palette: seven hues at equal chroma is the definition of "no palette"

```js
// js/rangoli.js:11
const POWDER = ['#F94F8E','#FF9933','#FFD54F','#7CB342','#9C5BC4','#EF5350','#26A6B5'];
```

Seven hues, near-equal saturation and lightness, roughly evenly spaced around the wheel, then
walked with a random offset (`col(i) = POWDER[(shift+i) % 7]`) — so *adjacent rings land ~51°
apart in hue*, which is maximum discord. Luxury color is a **dominant + a near neighbour + one
cold accent**, with wide value separation.

Same story on the tiles: `#FB923C` `#F59E0B` `#F472B6` `#D4A017` `#8B4513` are Tailwind-default
adjacent, and Tailwind defaults are a recognisable "the developer picked the colors" signature.

### 1.9 The rangoli is treated as wallpaper, not as craft

```css
.rangoli { width: 74vmin; opacity: .38; filter: blur(.6px);
           animation: rangoliSpin 140s linear infinite; }        /* :54 */
```

Four problems, in order of severity:

1. **It rotates.** A floor rangoli is drawn *on the ground*. Continuous rotation is the single
   strongest "this is a decorative gif" cue in the product.
2. **Full-saturation art knocked back with `opacity`.** Opacity over a dark ground both
   desaturates *and* darkens toward the backdrop → muddy mid-tones, not "faint gold linework".
3. **`blur(.6px)` on a 74vmin element** buys nothing visible and allocates a filter buffer of
   up to ~666² px, twice, permanently.
4. Structurally the generator is **one operation repeated at increasing radii** — see §3.

### 1.10 The grain overlay is (mostly) not rendering — a real bug

```css
.sky   { position: fixed; inset: 0; z-index: 0; }                /* :52  */
.grain { position: absolute; inset: 0; opacity: .05;
         mix-blend-mode: overlay; … }                            /* :65  */
body   { background: radial-gradient(…), radial-gradient(…), linear-gradient(…); }  /* :37 */
```

`.sky` is positioned **with `z-index: 0`**, so it creates a stacking context. `mix-blend-mode`
blends only against the backdrop *within* that context. The night gradient lives on `body`,
outside it. So `.grain` currently overlays against `.sky`'s transparent background — i.e.
against nothing — except where it crosses the two rangolis. The intended film-grain atmosphere
is largely absent. Fix in §4.0.

### 1.11 Default easing in the UI, expressive easing in the game

```
.ynode        transition: transform .18s ease, box-shadow .18s ease
.btn          transition: transform .12s ease, …
.tile-inner   transition: transform .15s ease
.star-fill    transition: width .5s ease
.track-star   transition: color .3s ease, transform .3s ease, filter .3s ease
```

`ease` is `cubic-bezier(.25,.1,.25,1)` — the browser default, the CSS equivalent of Arial.
Meanwhile the *game* animations do have authored curves (`cubic-bezier(.33,1.35,.5,1)`,
`(.2,1.6,.4,1)`). The product therefore has expressive game motion bolted to default UI
motion, which is felt as "the interface isn't part of the game".

Durations in use: .12 .15 .18 .25 .28 .3 .32 .4 .45 .5 .55 — no ladder.

### 1.12 Hover states are `filter: brightness()`

`.btn-gold:hover { filter: brightness(1.06) }` · `.btn-round:hover { filter: brightness(1.2) }`.
Brightness-filter hover is the universal "no hover state was designed here" tell.

### 1.13 The rocket beam scales the wrong axis

```css
.beam { animation: beamFade .45s ease-out forwards; }
@keyframes beamFade { 0% { transform: scaleY(.4) } 25% { transform: scaleY(1) } … }
```

For `ROCKET_V` the element is a tall bar, so `scaleY` grows it *lengthwise* from its centre —
correct-ish. For `ROCKET_H` the element is a wide bar, so `scaleY` merely makes it **thicker**.
The two orientations animate differently, and neither shoots outward from the firing cell. This
is a genuine craft bug, cheap to fix (§4.5).

### 1.14 Particles have no physics and no material

Sparks are 8px solid-fill circles on an evenly divided ring; fireworks are 16 evenly spaced
angles with `box-shadow: 0 0 8px`; petals are 14×10 solid blobs. No gravity, no size variation,
no gradient falloff, no burst flash. Gravity plus a one-frame flash is the difference between
"particles" and "fireworks".

### 1.15 Composition is centred, stacked, evenly spaced

Title is a flex column (gap 6/8). Map is a stack of near-identical cards nudged ±0.8° — a
"hand-made" cue that in practice just reads as a CSS trick, and which is exactly where a
gradient border will antialias worst. Game is three stacked bands. There is no anchor, no
asymmetry, no editorial moment anywhere.

### 1.16 The largest surface in the game is doing nothing

`.board-frame` is `rgba(30,6,4,.55)` with one inset shadow, holding 64 `.cwell`s that are a
1px `rgba(245,197,66,.14)` outline on a near-black square. That is the biggest continuous
surface on the primary screen, and it is a flat dark rectangle. A real mithai dabba's interior
is pleated paper, flocked velvet, or compartment dividers with a fillet.

### 1.17 Smaller misses

- `#genda` (`index.html:24`) is **four concentric circles**. A marigold is a dense pompom of
  dozens of tiny petal arcs. At 58px on retina, four circles read as four circles.
- The toran string is `stroke: #8D6E1F; stroke-width: 3` — a flat brown line where a
  twisted gold cord belongs.
- `.medal` is `radial-gradient(circle at 32% 28%, …)` — the single-highlight "3D ball" cliché.
- `.goal-panel` uses `border: 2px dashed` — dashed borders read as wireframe/unfinished.
- `.diya::after` (the oil pool) is a flat `rgba(255,200,120,.35)` ellipse.
- `softPulse` (opacity 1↔.55) is doing three unrelated jobs: rocket stripes, anaar flicker, and
  the W1 bokeh. At .55 the rocket blink reads as a rendering glitch rather than a pulse.
- Stagger exists in exactly two places (`.title-sweets-row` bob delays, `.ov-star` delays).

---

## 2. The token system

Add as new variables; **keep every existing variable name as an alias** so nothing regresses.

### 2.1 Ground — lacquer night

```css
--ink-900: #07030F;   /* contact shadows, vignette, deepest well */
--ink-800: #0E0519;   /* = existing --night-3 */
--ink-700: #170A2B;
--ink-600: #1C0A33;   /* = existing --night-1 */
--ink-500: #2A0E45;
--ink-400: #31104F;   /* = existing --night-2 */
--aubergine: #3D0F35; /* already used in the body radial */

--night-1: var(--ink-600);  --night-2: var(--ink-400);  --night-3: var(--ink-800);
```

### 2.2 Gold — a ladder, hue-shifted warm into shadow

```css
--au-100: #FFF3CE;   /* specular catch          */
--au-200: #FFE3A0;   /* hot   (≈ old --gold-hi) */
--au-300: #F7CE63;
--au-400: #E8B33C;   /* the true body — hue 41°, replaces the green-ish #F5C542 */
--au-500: #C6902A;
--au-600: #96651A;   /* shadow side of metal */
--au-700: #5E3D0C;   /* seat line            */
--au-800: #3A2405;

--gold: var(--au-400); --gold-hi: var(--au-200); --gold-deep: var(--au-600);
--gold-line: var(--au-500);
```

The metal ramp — this one gradient is the product's signature and must be reused verbatim:

```css
--au-ramp: linear-gradient(165deg,
  var(--au-600) 0%,  var(--au-300) 18%, var(--au-100) 30%,
  var(--au-400) 46%, var(--au-600) 62%, var(--au-300) 80%, var(--au-500) 100%);
```

Two bright bands with a dark trough between them: that reversal *is* what makes it metal.

### 2.3 Vark — silver leaf, cool, never neutral grey

```css
--vark-100: #FFFFFF; --vark-200: #E8EDF5; --vark-300: #C3CBD8;
--vark-400: #9AA4B4; --vark-500: #6E7789;
--vark-ramp: linear-gradient(158deg,
  #FFFFFF 0%, #AEB6C4 22%, #FDFEFF 40%, #8C95A6 58%, #E9EEF6 78%, #7C8598 100%);
```

### 2.4 Enamel — each jewel is a *pair* (surface + depth)

```css
--en-ruby:    #A8123C;  --en-ruby-d:    #4A0620;
--en-rani:    #E0245E;  --en-rani-d:    #7A0B2E;   /* brand pink, deepened from #E91E63 */
--en-firozi:  #0E8F94;  --en-firozi-d:  #054045;   /* peacock, deepened from #14B8A6 */
--en-emerald: #127A4E;  --en-emerald-d: #05341F;
--en-lapis:   #1B3C8F;  --en-lapis-d:   #0A1A44;
--en-safed:   #F7F1E1;  --en-safed-d:   #CDBFA0;

--rani: var(--en-rani); --peacock: var(--en-firozi);
```

Enamel surface recipe (one mixin, used on every enamel object):

```css
background:
  radial-gradient(120% 140% at 32% -8%, rgba(255,226,168,.16), transparent 46%),
  linear-gradient(165deg, var(--enamel), var(--enamel-d) 78%);
```

### 2.5 Light — flame, not enamel

```css
--marigold: #F58A1F;   /* was #FF9933 — 6% saturation pulled back; the original is neon */
--turmeric: #F5B92E;   /* was #FFC93C */
--saffron:  #E85D14;
```

### 2.6 Paper

```css
--paper-100: #FFF7E8; --paper-200: #FBECCF; --paper-300: #F0DCB4;
--ink-warm: #43200B; --ink-warm-2: #6B3A18;
--cream: var(--paper-100);   --maroon: #6E1A35;
```

### 2.7 Radii — a scale plus a law

```css
--r-1: 4px; --r-2: 8px; --r-3: 12px; --r-4: 18px; --r-5: 26px; --r-pill: 999px;
```

**Concentricity law:** `r_outer = r_inner + border + padding`. Enforce it with `calc()`, never
by eye:

```css
.dabba { border-radius: calc(var(--r-3) + var(--dabba-pad) + 3px); }  /* 25–31px, was flat 24 */
```

### 2.8 Shadow ladder — plum-tinted, contact + form + ambient

```css
--sh-contact: 0 1px 1px rgba(7,3,15,.60);
--sh-1: 0 1px 1px rgba(7,3,15,.50), 0 2px 4px rgba(28,10,51,.42);
--sh-2: 0 1px 1px rgba(7,3,15,.50), 0 4px 10px rgba(28,10,51,.42), 0 10px 24px rgba(7,3,15,.34);
--sh-3: 0 2px 2px rgba(7,3,15,.50), 0 10px 22px rgba(28,10,51,.45), 0 26px 56px rgba(7,3,15,.45);
--sh-lift: 0 2px 2px rgba(7,3,15,.50), 0 14px 30px rgba(28,10,51,.50), 0 34px 70px rgba(7,3,15,.50);
--glow-au: 0 0 0 1px rgba(255,227,160,.20), 0 0 18px rgba(232,179,60,.28);
```

### 2.9 The cloison

```css
--cloison:
  inset 0  0 0 1px rgba(255,243,206,.30),   /* inner hot line   */
  inset 0  1px 0   rgba(255,243,206,.50),   /* top catch (lamp) */
  inset 0 -1px 0   rgba(94,61,12,.55),      /* bottom seat      */
  0 0 0 1px var(--au-700);                  /* outer seat line  */
```

And the technique that makes gradient borders possible with zero cost — **background-clip
double-background**:

```css
.gold-band {
  border: 2px solid transparent;
  background-image: var(--surface), var(--au-ramp);
  background-origin: padding-box, border-box;
  background-clip: padding-box, border-box;
  box-shadow: var(--cloison), var(--sh-2);
}
```

This single utility replaces every `border: Npx solid var(--gold-line)` in the file and is the
highest-leverage change in the spec.

### 2.10 Easing + duration

```css
--e-out:    cubic-bezier(.16, 1, .30, 1);    /* workhorse: strong decel, no overshoot */
--e-snap:   cubic-bezier(.22, .90, .24, 1);  /* short UI                              */
--e-in-out: cubic-bezier(.65, 0, .35, 1);
--e-pop:    cubic-bezier(.34, 1.32, .48, 1); /* ONE small overshoot — game feedback only */
--e-in:     cubic-bezier(.55, 0, 1, .45);    /* exits                                 */

--d-micro: 120ms; --d-state: 200ms; --d-elem: 320ms; --d-card: 480ms; --d-scene: 900ms;
```

Rule: **overshoot is a gameplay reward, never a UI default.** `--e-pop` is allowed on tile
spawn, star landing, and combo toasts. Nothing else.

### 2.11 Type

Add exactly **one** family to the existing Google Fonts link: **Marcellus** (400, Roman
capitals, ~20KB latin). It supplies the missing brand/label register and reads "boutique"
instantly.

```html
<link href="https://fonts.googleapis.com/css2?family=Modak&family=Baloo+2:wght@500;600;700;800&family=Marcellus&display=swap" rel="stylesheet">
```

```css
--font-display: 'Modak', 'Baloo 2', system-ui, sans-serif;      /* unchanged */
--font-brand:   'Marcellus', 'Baloo 2', Georgia, serif;         /* NEW       */
--font-ui:      'Baloo 2', 'Trebuchet MS', system-ui, sans-serif;

--t-xs: .6875rem; --t-sm: .8125rem; --t-md: 1rem; --t-lg: 1.25rem;
--t-xl: 1.5625rem; --t-2xl: 1.953rem; --t-3xl: 2.441rem; --t-4xl: 3.052rem; --t-5xl: 3.815rem;
```

**Role assignment — enforce strictly:**

| Face | Allowed uses | Removed from |
|---|---|---|
| Modak (display) | `.logo-barfi/.logo-blast`, `.ov-shout` (city exclamations), `.combo-toast` | `.hud-big`, `.ov-score`, `.floatie`, `.map-title`, `.overlay-card h2` |
| Marcellus (brand) | `.map-title`, `.overlay-card h2`, `.ynode .city`, `.tagline`, `.ov-score`, `.dabba-lid-tag` latin, card eyebrows | — |
| Baloo 2 (UI) | all functional text, **all numerals**, all micro-labels | — |

Two hard rules:

- **Every numeral is Baloo 2 + `font-variant-numeric: tabular-nums`.** Currently only
  `.score-value` does this. Apply to `.hud-big`, `.goal-count`, `.ov-score`, `.floatie`,
  `.ynode .lvlgoal`. A score that reflows its digit widths as it ticks looks broken.
- **Marcellus never goes below 13px.** A 400-weight serif at 11px on a dark ground is fragile.
  The micro-label register stays Baloo 2 600 + `letter-spacing: .16em` + uppercase — which is
  what `.hud-sub` already does and does correctly.

Letterspacing law: display 0 → +.02em · brand +.02em at body, +.06em at ≥25px · micro-labels
+.16em uppercase · UI 0.

### 2.12 Spacing

Six values, no others: `--s-1: 4px; --s-2: 6px; --s-3: 10px; --s-4: 16px; --s-5: 26px;
--s-6: 42px`. (Current gaps: 6, 8, 10, 12, 14, 18, 26, 34 — arbitrary.)

---

## 3. The rangoli — craft deep-dive

This is the founder's specific ask, so it gets the most detail. Target: **professionally
drafted**, not generated.

### 3.1 Why the current generator looks procedural

Reading `js/rangoli.js` `rangoliSVG()`:

1. **One operation, repeated.** Steps 1–5 are `petalRing → petalRing ×2 → dotRing →
   (petals|scallop|dots) → scallopRing → dotRing → ring`. Rings 2, 4 and 5 are all "petals or
   scallops". Human rangoli alternates *categories*: figure → connective → field → border.
2. **Constant stroke weight** (1.6 / 1.4 / 0.8) everywhere. Hand-drawn flour lines vary 2–4× in
   width and taper at the ends.
3. **Every shape carries its own white outline.** In the real thing the rice-flour line *is*
   the drawing and the powder fills it — one continuous closed line per motif, not a stroke per
   primitive.
4. **Uniform angular density.** `N ∈ {8,12,16}` and every ring uses `N` or `2N`. Real designs
   *step up* fold count outward, because circumference grows.
5. **Palette walked at random offset** → adjacent rings ~51° apart in hue (§1.8).
6. **Vocabulary of three** (petals, dots, scallops). Missing: kolam loops, ambi/paisley,
   peacock eye, bel creeper, temple arch, pinwheel arms, diya.
7. `pick(['petals','scallop','dots'])` on a single band is variation *without intent* —
   parameter soup.

### 3.2 Principle A — construct, don't compose

Real rangoli and kolam begin from a **pulli** (dot) grid; every curve is defined by the dots it
loops around. So: build a **polar pulli lattice first**, then derive *every* motif from lattice
points. Two motifs that share a lattice point align automatically — and that automatic
alignment is precisely what separates "drafted" from "generated".

```js
// dense centre → airy rim.  γ ∈ [1.25, 1.45]
const K = 7;                 // 9 for the "hero" composition
const GAMMA = 1.32;
const r = k => R * Math.pow(k / K, GAMMA);

// fold count doubles at octave boundaries — circumference grows, so must detail
const F = pick([8, 12]);     // master fold. NOT 16 — too busy as a master at small sizes
const OCTAVES = [3, 6];
const n = k => F * Math.pow(2, OCTAVES.filter(o => k >= o).length);   // 8,8,8,16,16,16,32
```

### 3.3 Principle B — motif families with roles, chosen by a grammar

Ring roles, always in this order:

```
BINDU → CORE → CONNECTIVE → FIELD → CONNECTIVE → FIELD(hero) → BORDER → RIM
```

| Role | Vocabulary |
|---|---|
| BINDU | centre dot + halo dot ring — *invariant, always* |
| CORE | lotus (padma), 8 or 12 petals — *invariant, always* |
| CONNECTIVE | pulli dot ring · kolam loop chain · bead-and-reel · micro-diamonds |
| FIELD | offset lotus layer · ambi ring · peacock-eye ring · pinwheel arms (sathiya) · scallop band · temple-arch band |
| BORDER | bel creeper · double scallop · lotus-petal collar · kalash arch |
| RIM | double flour line + fold dots + tapered tick marks |

Grammar constraints (these are what kill the soup):

- **No two adjacent rings from the same family.**
- **Exactly one hero ring** — the widest and most detailed FIELD, at ≈0.55R. Hierarchy requires
  a subject.
- **Four named compositions**, each a fixed role sequence: `Padma Chakra`, `Sikku Bel`,
  `Mor Darbar`, `Kalash Mandala`. The seed chooses template → palette → drift phases → which
  allowed motif fills each slot. Space ≈ 4 × 5 × 3³ ≈ 540 designs, *all of which are
  compositions*.

### 3.4 Principle C — line quality is 70% of perceived craft

Five rules, each individually cheap:

**1 · Double-line outlines.** Draw every motif outline twice on the same path: a wide "flour
bed" at `w` in `--flour` @ .38, then a narrow "chalk ridge" at `w × 0.42` @ 1.0. Instantly
reads as a real powder line with a bright crest.

**2 · Variable stroke weight by radius.** `w(r) = w0 * (1 − 0.45 * r/R)`. Thick in the dense
centre, fine at the airy rim — which is what a human hand does, because you press hardest where
you start.

**3 · Tapered ends.** `stroke-linecap: round` for the chalk layer; for hero motifs, draw the
outline as a *ribbon* — offset the path ±w/2 with w varying sinusoidally along the arc. Cheap
80% version: split the stroke into 3 segments with decreasing `stroke-width` toward the tips.

**4 · Deliberate imperfection — the single highest-leverage trick in this spec.**

```js
// seeded, TWO harmonics: a coherent drift, not noise
const A1 = .006 + rng()*.004, A2 = .003 + rng()*.003;
const p1 = rng()*Math.PI*2,   p2 = rng()*Math.PI*2;
const k1 = 2 + Math.floor(rng()*2), k2 = 5 + Math.floor(rng()*3);
const drift = deg => { const a = deg*Math.PI/180;
  return 1 + A1*Math.sin(k1*a + p1) + A2*Math.sin(k2*a + p2); };
const P = (r, deg) => pol(r * drift(deg), deg);     // every motif uses P, never pol
```

Per-point randomness reads as a *jitter filter* — digital. Smooth angular noise reads as *the
artist's hand drifted* — human. Same cost, opposite result.

**5 · Fill treatments.** Powder is matte and slightly domed: the base is bright, the edge goes
dark. So each petal gets a radial gradient running **base → tip = light → dark**, with a 2%
white sliver at the base. Simulate powder depth with a second path at 0.88 scale filled
`rgba(<ground-role>, .14)` — reuse the palette's *ground* colour, which is otherwise never
painted. No `mix-blend-mode`, no filters.

**Gold foil on the hero ring only.** The hero FIELD ring's outline strokes with the
`--au-ramp` as an SVG `linearGradient` at 35°. **One ring, ever.** Restraint is what makes it
read expensive instead of gaudy.

### 3.5 Palette rules — replace the 7-colour wheel walk

Five named **baksa** (box sets), each a hand-picked meenakari family of exactly five roles:

| Set | ground | figure | accent | jewel | metal |
|---|---|---|---|---|---|
| Firozi Night | `#0A3A4A` | `#0E8F94` | `#F5B92E` | `#E0245E` | au |
| Ruby Court | `#4A0A20` | `#A8123C` | `#F0C67A` | `#0E8F94` | au |
| Emerald Bagh | `#08301E` | `#127A4E` | `#F5B92E` | `#A8123C` | au |
| Lapis Sabha | `#0A1A44` | `#1B3C8F` | `#E8EDF5` | `#E0245E` | vark |
| Vark Moon | `#2A2436` | `#6E7789` | `#E8EDF5` | `#F5B92E` | vark |

Composition rules — these are the reason it will look designed:

- Rings **alternate figure / ground**.
- **Accent appears on exactly two rings.**
- **Jewel appears on exactly one** — the bindu, or the hero ring's centre dots.
- **Metal on the hero outline and the rim only.**
- The **ground colour is never painted** — it is implied by the page, and used solely for petal
  inner shadow. Cheap, and it is why the drawing will sit *in* the night rather than on it.

### 3.6 Motif recipes (code-ready)

Let `Δ = r1 − r0`, `h` = half-width in degrees, `P` = the drifted polar helper.

**Lotus petal (padma)** — the current petal is a 3-quad blob. A real lotus petal has a pointed
tip with a slight S, a shoulder at ~62%, and a waist at ~22%:

```
petal(r0, r1, θ, h):
  M  P(r0, θ − .34h)
  C  P(r0 + .22Δ, θ − .72h)   P(r0 + .62Δ, θ − 1.06h)   P(r1, θ)
  C  P(r0 + .62Δ, θ + 1.06h)  P(r0 + .22Δ, θ + .72h)    P(r0, θ + .34h)
  Q  P(r0 * .985, θ)          P(r0, θ − .34h)  Z
vein:  M P(r0 + .06Δ, θ)  Q P(r0 + .55Δ, θ + .12h)  P(r1 * .93, θ)     @ 0.5× stroke
```

The **vein** is what makes petals look drawn rather than stamped. Never omit it on CORE/hero.

**Kolam loop chain (sikku kolam)** — the signature motif; a single continuous line that loops
around each pulli without lifting. `b = .34 · 2πr/n`:

```
for k in 0..n−1:
  θ0 = k·step, θ1 = (k+1)·step, θm = θ0 + step/2
  M P(r, θ0)
  C P(r+b, θ0+.18·step)  P(r+b, θm−.18·step)  P(r+b·.86, θm)
  C P(r+b, θm+.18·step)  P(r+b, θ1−.18·step)  P(r, θ1)
```

Emit as **one path**, `fill: none`, double-line stroked. Mirror inward with `(r − b)` for the
full weave. This single motif does more to say "this is a real kolam" than anything else in the
vocabulary.

**Ambi (paisley / mango)** — `w = degrees(W / rc)`:

```
M P(rc − L/2, θ)
C P(rc − L/2, θ+w)      P(rc + .20L, θ + 1.25w)  P(rc + .42L, θ + .55w)
C P(rc + .56L, θ)       P(rc + .40L, θ − .30w)   P(rc + .22L, θ − .20w)   ← the hook
C P(rc,        θ − .9w) P(rc − .30L, θ − 1.0w)   P(rc − L/2, θ)  Z
inner: same path scaled .62 about the ambi centroid  (nested outline = the classic look)
seeds: 3 dots along the spine
```

**Peacock eye (mor chandrika)** — outer almond (two symmetric quads meeting at both tips),
inner disc at .55, inner-inner at .28, then 6–8 short radiating barbs at the outer edge.

**Bel (creeper vine) border** — the motif that makes a rim look *printed* rather than computed:
a sine spine `r(θ) = rB + amp·sin(n·θ)` sampled every `360/(8n)` degrees and smoothed, with a
leaf at every crest (pointing outward) and a bud at every trough (pointing inward).

**Kalash / temple arch band** — `n` ogee arches; each is two quadratics springing from `r` at
the fold boundaries and meeting at a point at `r + h`. Reads unmistakably as temple
architecture, which is exactly the register we want.

**Sathiya / pinwheel arms** — `n` swept commas from `r0` to `r1` with a 12–18° twist. Adds
motion-in-stillness without animating anything.

### 3.7 Density, hierarchy, symmetry

```
Ink density target per ring must DECREASE outward:
  d_k = 0.34 · (1 − 0.62 · k/K)
  measured as (paths_in_ring × avg_stroke_length × w) / band_area
Practical translation: inner rings get fills + veins; outer rings are lines only.
```

Path budgets — hard caps, enforce in code:

| Instance | max paths |
|---|---|
| ambient background | 260 |
| board backing | 180 |
| map seal (54px) | 120 |

Symmetry:

- Master fold **F ∈ {8, 12}**; 16/32 appear only via octave doubling at the rim.
- **Mirror symmetry within each fold** — each motif symmetric about its own spoke. This is what
  real rangoli does and it is far calmer than rotational-only symmetry.
- **One deliberate asymmetry:** rotate the whole drawing by `(360/F) · 0.5 · rng()` so it never
  sits axis-aligned. Keep the existing half-step offset between the two lotus layers
  (`petalRing(N, 52, backR, col(2), step/2)`) — that instinct is correct.

### 3.8 Where rangoli appears — placement, opacity, motion

The headline recommendation: **stop using rangoli as wallpaper; use it as inlay.** A full-colour
rangoli at 38% opacity is a faded sticker. Gold-only linework at 12–16% on black is *embossed
floor inlay* — the same asset, an entirely different class of object.

| Placement | Palette | Size | Opacity | Motion |
|---|---|---|---|---|
| **Ambient** ×2 (existing `.rangoli-a/-b`) | metal-only monochrome (`--au-500`, no fills) | 92vmin, pushed further off-canvas so only a **quadrant arc** shows | **.16** | **none** — delete `rangoliSpin`, delete `blur(.6px)` |
| **Board backing** (new, inside `.board-frame`, below `.chashni-layer`) | metal-only, seeded by `level.id`, fold forced to 8/16/32 so it aligns with the 8×8 grid | inscribed circle of the board | **.11** | none |
| **Map seals** (replaces the 9 emoji medals) | the level's baksa, full colour | 54px | 1.0 | none; ring foil sweep only on `.ynode.current` |
| **Win moment** (behind the overlay card) | metal-only | 60vmin | .22 | **draws itself**: `stroke-dasharray/offset`, 900ms, ring-staggered, outline layer only, ≤40 paths |
| **Goal / tutorial card** watermark | `--ink-warm` monochrome | 120px, top-centre behind the city name | .08 | none |

Why static: the ambient rangoli currently animates forever on every screen, holding a
compositor layer alive during gameplay. Removing it is both a perf win and a taste win —
**restraint is the luxury signal here**. Motion gets spent on the win moment instead, where it
is earned.

Board backing is the sleeper hit of this whole spec: it explains the empty tray, gives each
city a floor of its own, and costs one static SVG that never repaints.

---

## 4. Screen-by-screen elevation

### 4.0 Global — fix the grain first (5 minutes, affects every screen)

```css
/* move the night gradient INTO the stacking context the grain blends against */
body { background: var(--ink-800); }
.sky {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(120vmax 90vmax at 50% -20%, var(--ink-400), transparent 60%),
    radial-gradient(90vmax 70vmax at 85% 110%, var(--aubergine), transparent 55%),
    linear-gradient(180deg, var(--ink-600), var(--ink-800));
}
.grain { opacity: .055; mix-blend-mode: overlay; }   /* now actually has a backdrop */
```

Also add a **second, coarser grain at `.04` / `multiply` on the cream cards only**, so paper
does not share the sky's texture. Different materials must have different noise.

### 4.1 Title

| Problem | Change |
|---|---|
| Logo uses a 5px solid slab shadow | **Foil-stamped metal.** Keep `background-clip: text`, swap the fill for a *reversing* foil ramp: `linear-gradient(178deg, var(--au-100) 0%, var(--au-300) 26%, #C97CA6 46%, var(--en-rani) 62%, var(--au-600) 78%, var(--au-200) 100%)`. Replace the slab with a **2px emboss**: a `::before` copy of the text (`content: attr(data-text)`) at `color: var(--au-800); transform: translateY(2px); z-index: -1`. Add a slow **foil sweep**: an `::after` copy with a narrow moving highlight gradient, `background-size: 300% 100%`, `background-position` animated 6s linear infinite, `opacity: .5`. |
| Tagline is plain turmeric text | Brand register: `--font-brand`, uppercase, `letter-spacing: .22em`, `--au-300`, with hairline rules either side (`::before/::after`, 28px × 1px, `linear-gradient(90deg, transparent, var(--au-600))`). The classic luxury-brand lockup. |
| 3 sweets in an evenly-spaced flex row, bobbing ±9px at 3.2s | Arrange as a **tight overlapping cluster on a thali arc** (an ellipse path via three different `translateY`/`rotate` offsets), centre sweet 1.15× and in front. Retune `bob` to −4px over 4.8s — the current 9px/3.2s is toy-bouncy. Let the logo **overlap** the cluster slightly: grid-breaking is the only spatial idea the title needs. |
| Diya row is a flex row with equal gaps | Seat the diyas on a **gold rule** with a small rangoli mark between them; stagger scale (centre 1.15×, sides 0.9×). Give each a static warm floor pool: `radial-gradient` ellipse, `--marigold` @ .10, 120px, `filter: blur(8px)` — 3 static blurs, never animated, fine. |
| No entrance orchestration | **The one orchestrated moment.** All `animation-delay` on existing elements, `both` fill: rangoli fade 0ms/900 → toran drop 120 → sweets 240 → logo scale-in 340 → tagline 480 → button 600 (with a single foil sweep at 900) → diyas ignite 700/820/940 (`flame` `scale(0)→1` + glow). This is the cheapest change in the spec with the largest "expensive" payoff. |

`.title-note` moves to the micro-label register: `--t-xs`, `.16em`, uppercase, `--au-500`.

### 4.2 Map — Mithai Yatra

**Medals → rangoli seals.** New `sealSVG(levelId)` in `js/rangoli.js`: a 3-ring mini-rangoli
(bindu + lotus core + kolam ring + rim) at 54px in the level's baksa, ≤120 paths, seeded by
`level.id` so the nine cities get nine coherent, distinct seals. Container gets
`border-radius: 50%` + `var(--cloison)`. Locked state = the seal rendered in `--vark-500`
monochrome with enamel replaced by `--ink-700` (an *unfired* enamel — a far better metaphor
than `filter: grayscale(.85)`), plus a drawn 14px SVG lock (shackle + body) instead of `🔒`.

This one change removes the loudest indie signal and showcases the rangoli work in the same
stroke. It should be P1's first task.

**Cards → enamel plaques, one enamel per city.** Apply §2.4's enamel recipe with the level's
figure colour, the §2.9 gradient border, `--sh-2`. Nine cities become nine enamels — the map
reads as a jeweller's tray, and progression becomes visible as material.

```css
.ynode {
  --enamel: var(--en-firozi); --enamel-d: var(--en-firozi-d);   /* per-level inline var */
  border: 2px solid transparent; border-radius: var(--r-4);
  background-image:
    radial-gradient(120% 140% at 32% -8%, rgba(255,226,168,.16), transparent 46%),
    linear-gradient(165deg, var(--enamel), var(--enamel-d) 78%),
    var(--au-ramp);
  background-origin: padding-box, padding-box, border-box;
  background-clip:  padding-box, padding-box, border-box;
  box-shadow: var(--cloison), var(--sh-2);
  transition: transform var(--d-state) var(--e-out), box-shadow var(--d-state) var(--e-out);
}
```

**Kill the ±0.8° rotation** (`:209–210`). Rotating a rectangle with a gradient border is exactly
where antialiasing looks cheapest. The alternating `align-self` already provides the zigzag;
add `margin-inline` offset for real asymmetry instead.

**Connector.** `border-left: 4px dotted` → a tapering gold rule:
`linear-gradient(180deg, transparent, var(--au-600) 12%, var(--au-500) 50%, var(--au-600) 88%, transparent)`
at 2px with `box-shadow: 0 0 8px rgba(232,179,60,.25)`, plus 6px rotated-square diamonds in
`--au-400` at the node junctions.

**Stars → SVG** (reuse the `.track-star` path from `index.html:92`). Lit = `--au-ramp` gradient
fill + `--glow-au`. Unlit = `--ink-700` fill with a 1px `--au-700` stroke — *an empty setting
waiting for a stone*, which is a much better unlit state than 25%-alpha cream.

**`PLAY ▶` badge** (`:233`): drop `background: var(--rani)`; make it a gold enamel tab —
`--au-ramp` body, `--ink-warm` text, `--font-brand` uppercase `.16em`, `--r-pill`,
`var(--cloison)`.

**Current-node glow** (`:232`, `currentGlow`): a pulsing box-shadow reads as a cheap
"select me". Replace with a **travelling foil highlight** on the border gradient —
`background-size: 300% 100%` on the border layer, `background-position` animated over 3.2s. One
node, one screen.

**Header.** `.map-title` → `--font-brand`, delete `text-shadow: 0 3px 0 var(--maroon)`, add a
`--t-xs` letterspaced Devanagari kicker above in `--au-600` and a hairline gold rule beneath.

Entrance stagger: `--i` custom property per node, `animation-delay: calc(var(--i) * 40ms)`.

### 4.3 Game — HUD

**Differentiate the three chips by material.** They are not three of the same thing:

| Chip | Material | Rationale |
|---|---|---|
| `.hud-level` | **enamel plaque** in the city's colour, city in `--font-brand` | identity, matches its map node |
| `.hud-moves` | **gold cartouche** — `--au-ramp` body + cloison, numerals `--ink-warm`, Baloo 800, `tabular-nums` | the most-glanced number becomes the brightest object in the chrome: correct hierarchy, and it retires Modak at 1.7rem |
| `.hud-goal` | **dark lacquer well** — inset shadows only, no lift shadow | it is a *container of counters*, not an object. Inset vs. raised is the cheapest possible material differentiation |

`.hud-big.low` currently goes red + `pulseScale`. Replace with a **material state change**: the
cartouche becomes ruby enamel with a gold numeral, plus a 1px `translateY` breath. Changing what
something is *made of* is dramatically more premium than changing its colour and scaling it.

**De-emoji:** `🎯` → drawn bullseye (3 rings + centre dot, gold). `🔔/🔊/🔇` → drawn speaker ±
waves in `--au-300`. (Note: `index.html:63,84` ship `🔔` as the initial glyph and JS immediately
replaces it with 🔊/🔇 — the SVG swap fixes that flash too.)

**Star track → a gold rail with three empty settings.**

```css
.star-track { background: linear-gradient(180deg, var(--ink-900), var(--ink-700));
              box-shadow: var(--cloison); }
.star-fill  { background: linear-gradient(90deg, var(--au-600), var(--au-300) 60%, var(--au-100));
              transition: width 550ms var(--e-snap); }   /* was .5s ease */
```

Sheen on the fill **only during the win sequence** — restraint.

`.score-label` → micro-label register. `.score-value` → `--au-200`; keep its existing
tabular-nums decision and its comment verbatim.

### 4.4 Game — the dabba and the tray

The hero object. Five changes:

1. **Gradient border, not a flat stroke.** `border: 3px solid var(--gold-deep)` → §2.9 pattern
   with `--au-ramp`. The gold band gets a light side and a dark side for the first time.
2. **Delete `outline: 2px solid …; outline-offset: 4px`** (`:338–339`). Outlines cannot be
   gradients and their radius handling is inconsistent. Replace with a `::before` keyline ring:
   `inset: -7px; border-radius: calc(<outer> + 7px); border: 1px solid rgba(255,227,160,.22)`.
   *(Keep the `:focus-visible` outlines at `:579–580` — those are accessibility, untouchable.)*
3. **Concentric radius:** `border-radius: calc(var(--r-3) + var(--dabba-pad) + 3px)`. Fixes the
   corner-thinning of §1.5.
4. **Lacquer surface.** Deepen `--dabba-1/-2` to `#8E2318 → #4A0D06`. Move the top sheen
   off-centre to obey the One Lamp Law — it is currently at `50% 0%`, i.e. lit from directly
   overhead, which is why it reads flat:
   ```css
   background:
     radial-gradient(140% 90% at 26% -10%, rgba(255,214,150,.22), transparent 52%),
     linear-gradient(165deg, var(--dabba-1), var(--dabba-2));
   box-shadow: inset 0 2px 10px rgba(255,220,160,.18),
               inset 0 -10px 22px rgba(0,0,0,.50),
               inset 0 -1px 0 rgba(255,190,110,.14),      /* warm bounce from below */
               var(--sh-3);
   ```
5. **Embossed motif in the lacquer margin.** The 10–16px padding band currently shows bare red.
   Add a hairline gold chain via a tiny inline-SVG `background-image` at .18 opacity. Static,
   free, and exactly the intricacy the brief asks for.

`.dabba-lid-tag` → a **kundan-set nameplate**: `--au-ramp` body, `var(--cloison)`, a 1px
`--au-800` inner keyline, and a small drawn lotus glyph at each end.

**The tray interior** — the largest surface in the game (§1.16):

```css
.board-frame {
  background: radial-gradient(120% 100% at 50% 42%, #1A0708, #0B0303 78%);
  box-shadow: inset 0 4px 18px rgba(0,0,0,.75), inset 0 -1px 0 rgba(255,190,110,.10);
}
```

…plus the **level-seeded rangoli backing** at `--au` linework, opacity .11, `pointer-events:
none`, no filter, painted below `.chashni-layer`. The mithai now sit *on* a rangoli.

**The cells** — read as paper-liner compartments:

```css
.cwell {
  background: radial-gradient(120% 120% at 32% 22%, rgba(255,232,196,.045), rgba(0,0,0,.28));
  border: 1px solid rgba(232,179,60,.13);
  box-shadow: inset 0 1px 0 rgba(255,227,160,.10), inset 0 -1px 0 rgba(0,0,0,.35);
}
```

64 elements × 2 inset shadows is fine — they are static and never animate. **No filters here,
ever.**

`.cwell.chashni` is already good; add one more inset highlight arc so the glaze reads as syrup
with a meniscus. Keep the `::after` droplet — it is a genuinely nice detail.

### 4.5 Game — tiles and sweet art

The sweets are competent illustrations; they need to become *objects on a lit set*.

**Light consistency (already 80% there — finish it).** Highlights currently sit at 38%/32%
(laddoo), 36%/30% (jamun), and the linear gradients run top-left → bottom-right. Standardise
every one to **32% / 24%** and every linear to **165deg**. Small, systematic, felt.

**Rim light — the single biggest "premium product shot" trick.** Add one path per sweet: a
stroke with a `linearGradient` that is transparent on the lit side and `rgba(255,180,90,.55)` on
the lower-right, simulating the diya behind. One extra path each.

**Vark, properly.** `g-vark` is a 4-stop grey ramp. Upgrade to the §2.3 reversing
`--vark-ramp`, and add **2–3 crinkle lines** — vark is *beaten leaf*; it wrinkles. Thin
`rgba(255,255,255,.5)` polylines at odd angles across the katli diamond and the barfi top.
Cheapest authentic luxury detail in the entire game.

**Contact shadow inside the SVG, not in CSS.** `gulab jamun` already does this
(`<ellipse cx=50 cy=82 … opacity=.5>`). Give every sweet the same flat ground ellipse, then
keep **exactly one** CSS drop-shadow for the form shadow:

```css
.tile-inner { filter: drop-shadow(0 3px 5px rgba(7,3,15,.50)); }   /* plum-black, was pure black */
```

> **Performance flag:** do **not** stack two `drop-shadow()`s here. 64 tiles × 2 filters during
> a cascade is a real cost on mid phones. The SVG ellipse gives the contact shadow for free.

**Specials get gold.** Rocket stripes `#FFFFFF @ .92` → `--au-ramp` fill + `--au-800` keyline.
Anaar ring `#FFD700` stroke → the metal ramp. Chakri hub `#FFF7ED` → vark. Specials should read
as *upgraded material*, not just extra shapes.

> All new gradients **must** be added to `GRADIENT_DEFS` in `js/sweets.js` and injected via
> `injectDefs()` — gradients defined inside `display:none` subtrees break their references in
> Chrome. That comment at `js/sweets.js:22` is load-bearing.

**Selected state.** `wobble` (scale 1.14 + ±5° rotate) is toy-like. Replace with *lifted and
lit*: `scale(1.10)` plus a gold ring drawn beneath —

```css
.tile.selected::before { content:''; position:absolute; inset: var(--cell-pad); border-radius: 22%;
  box-shadow: 0 0 0 2px var(--au-400), 0 0 18px rgba(232,179,60,.5); }
.tile.selected .tile-inner { animation: breathe 1.6s var(--e-in-out) infinite; } /* 1.10 ↔ 1.13 */
```

Keep one filter on `.tile-inner` throughout.

**Beam fix (§1.13).** Horizontal beams must `scaleX`, vertical must `scaleY`, both with
`transform-origin` at the firing cell so the beam *shoots outward*. Retime to a 60ms flash-in /
380ms decay, and add a 2px hot core in `--au-100` over the existing soft body.

### 4.6 Overlays and cards

| Problem | Change |
|---|---|
| Cream card + gold border, no material | **Hand-laid paper in a gold frame.** `linear-gradient(168deg, var(--paper-100), var(--paper-200) 62%, var(--paper-300))` + the coarse grain `::before` at `.04 / multiply`. Border via §2.9 at 2.5px. |
| `outline: 2px … ; outline-offset: 5px` (`:521`) | Replace with a shadow ring that follows the radius exactly and can carry the colour ladder: `0 0 0 5px rgba(7,3,15,.35), 0 0 0 6.5px rgba(232,179,60,.42)`. |
| Nothing signals "invitation" | Add an **inner keyline**: `::after { inset: 8px; border: 1px solid rgba(110,26,53,.20); border-radius: calc(var(--r-5) - 8px) }`. The certificate/invitation move — instantly expensive, one rule. |
| `h2` in Modak for functional headings | `--font-brand` for "How to Play", "Leave level?", "So close!". **Modak stays only on `.ov-shout`** (the city exclamation) — that is the festive moment and it has earned the display face. |
| `.ov-stars` uses `★` text at 2.6rem | SVG stars with `--au-ramp` fill + a white specular facet triangle. Unlit = `--paper-300` fill, `rgba(67,32,11,.18)` stroke. Consistent with the map and the track at last. |
| `.goal-panel` `border: 2px dashed` | **Debossed into the paper:** `background: rgba(110,26,53,.055); box-shadow: inset 0 1px 2px rgba(67,32,11,.22), inset 0 -1px 0 rgba(255,255,255,.6); border: none; border-radius: var(--r-3)` + a 1px `rgba(110,26,53,.16)` hairline. Inset panels should look *pressed in*, not sketched. |
| `cardPop` overshoots (`scale(.7) translateY(24px)`, `cubic-bezier(.2,1.4,.4,1)`) | `scale(.965) translateY(10px)` over `var(--d-card)` with `var(--e-out)` — decelerate, no bounce. Then **stagger the contents**: eyebrow 60ms, h2 120, sub 180, panel 260, buttons 340. The stagger *is* the "considered" feeling. |

**Buttons.** `.btn-gold`'s `box-shadow: 0 6px 0 #7A4A00` slab → a metal ladder:

```css
box-shadow:
  inset 0 1px 0 var(--au-100), inset 0 -1px 0 var(--au-700),
  0 1px 0 var(--au-800), 0 2px 3px rgba(7,3,15,.50), 0 8px 18px rgba(7,3,15,.40);
```

Press = `translateY(1px)` with the shadows collapsing (not `translateY(3px)`). Hover = a **foil
sweep** (`::after`, `background-size: 300% 100%`, `background-position` transition 600ms), not
`filter: brightness(1.06)`. `.btn-plain`'s `2.5px solid rgba(…)` → a 1px double keyline.

### 4.7 Effects and celebration

- **Combo toast:** keep Modak (festive is correct here). Swap the slab
  `drop-shadow(0 4px 0 …)` for `drop-shadow(0 2px 0 rgba(58,36,5,.85)) drop-shadow(0 10px 22px rgba(7,3,15,.55))`,
  and use the reversing foil ramp. Add a thin gold underline that draws in (`scaleX(0→1)`, 240ms,
  120ms delay).
- **Floaties:** `--font-display` → `--font-ui` 800 `tabular-nums` (a score is data), `--au-200`.
  Retime `floatUp` to 34px over 720ms with `var(--e-out)`. **Smaller and faster reads richer
  than big and slow.**
- **Sparks:** `background: radial-gradient(circle at 40% 35%, #FFF6DC, <color> 55%, transparent 78%)`,
  per-spark size 4–9px, and **add gravity** — end at `translate(var(--dx), calc(var(--dy) + 14px))`.
  Gravity is the whole difference between "particles" and "confetti".
- **Fireworks:** three shell types — *peony* (even ring + gravity), *willow* (downward-biased,
  long fade, gold only), *chrysanthemum* (two rings at different radii) — plus a **one-frame
  flash** at the burst point (a 40px white radial, opacity 1→0 in 90ms). The flash is what makes
  a firework feel loud.
- **Petals:** add `linear-gradient(160deg, <lighter>, <color>)` and vary size 9–18px; keep the
  existing sway/spin custom properties.

**The win beat sheet — the one orchestrated moment.** Currently `sfx.win() → celebration()`
dumps 6 bursts + 44 petals simultaneously, then waits 600ms. Mostly a *retiming* of existing
calls:

```
t=0     board dims (.board-frame::after → .35) + a single gold flash frame
t=80    rangoli draws itself behind the overlay (900ms, stroke-dash, ring-staggered)
t=140   firework 1 — gold willow, centre-high
t=380   firework 2 — left
t=620   firework 3 — right
t=500   petals begin (1.2s stagger)
t=900   card rises (480ms, --e-out) with content stagger
t=1400  stars land 0 / 240 / 480ms  (starPop delays already exist — keep)
```

---

## 5. Motion and materials

### 5.1 Where motion is cheap now, and the fix

| Current | Fix |
|---|---|
| `ease` on every UI transition | the §2.10 easing set; `--e-out` is the default |
| `.tile:hover .tile-inner { scale(1.07) }` @ `.15s ease` | `1.05` @ `var(--d-micro) var(--e-snap)` |
| `pulseScale` on low moves | material change (ruby cartouche) + 1px breath |
| `wobble` on selection | lift + gold ring (§4.5) |
| `currentGlow` box-shadow pulse | travelling foil on the border gradient |
| `rangoliSpin 140s infinite` | **delete** — plus `filter: blur(.6px)` |
| `softPulse` doing three jobs | split: bokeh 7s opacity+scale; rocket `.78↔1` (`.55` reads as a glitch); anaar fast 3-stop irregular |
| Stagger present in 2 places | add to: title entrance, map nodes (`--i`), card contents, HUD chips on level start, goal-panel rows |

Duration ladder replaces the current eleven arbitrary values (§2.10).

### 5.2 Materials — worth it and cheap enough for 60fps

| Material | Technique | Cost | Verdict |
|---|---|---|---|
| Gradient borders | `background-clip: padding-box, border-box` | free | **do everywhere** |
| Cloison | 3 inset shadows + 1 outer | free | **do everywhere** |
| Emboss / deboss | `inset 0 1px 0 light, inset 0 -1px 0 dark` | free | do |
| Foil sweep | `background-position` on `background-size: 300%` | GPU-cheap **if** few elements and never over the board | logo (loop), buttons (hover), star fill (win only), win-card border (once) |
| Grain | existing data-URI, `mix-blend-mode` on **static** elements only | one composite | do — and fix §4.0 |
| SVG rim light / specular | a path inside the sweet SVG | free | do |
| Contact shadow | flat ellipse inside the SVG | free | do |
| Glass / `backdrop-filter` | — | expensive | **no.** The one existing `blur(3px)` on `.overlay` is acceptable because the board is paused. Add no more. |

### 5.3 Performance guardrails (non-negotiable)

1. **No `filter` or `backdrop-filter`** on `.tile`, `.tile-inner`, `.cwell`, or anything inside
   `.board` / `.fx-layer` beyond the single existing `drop-shadow`.
2. The board-backing rangoli is **static**, `pointer-events: none`, no filter, and must not be
   an ancestor of any animating element.
3. `background-position` animations only on elements that are **not** ancestors of the board.
4. `mix-blend-mode` only on static overlays (`.grain`, card paper). Never inside `.board`.
5. The number of simultaneously animating elements during a cascade must not increase.
6. Rangoli path budgets (§3.7) are hard caps.
7. Toran marigold detail capped at **16 petals** — see the P2 note in §6.

### 5.4 Reduced motion — one thing the current rule will not cover

`:864` is `*, *::before, *::after { animation-duration: .001s !important }`. New *looping*
background-position sweeps would technically satisfy it while still repainting every frame. Add
an explicit belt-and-braces line inside the same block:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001s !important; transition-duration: .001s !important; }
  .logo-barfi::after, .btn-gold::after, .ynode.current, .star-fill::after { animation: none !important; }
}
```

The rule must remain **last in the file**.

---

## 6. Prioritized plan

**P0 — the perceived-quality cliff. All of it is cheap; none of it touches layout or input.**

| # | Item | Est | Rationale |
|---|---|---|---|
| 1 | Token layer (§2) — palettes, radii, shadows, easing, type scale, `--cloison`, `--au-ramp`; old names aliased | M | Enables everything else. Zero regression risk. |
| 2 | **Gold becomes a material** — gradient borders + cloison on `.dabba`, `.hud-chip`, `.ynode`, `.overlay-card`, `.btn-gold`, `.dabba-lid-tag`, `.medal`; delete both decorative `outline`s | M | Highest ratio in the entire spec. Fixes §1.1 and §1.2 at once. |
| 3 | **De-emoji** — SVG target, mute, lock, stars (map + overlay) | S | Loudest indie tell; smallest diff. |
| 4 | Type roles — Modak → logo/shout/combo only; add Marcellus; `tabular-nums` on all numerals; micro-label register | S/M | Fixes the moves counter, the system's self-contradiction, and supplies the missing third register. |
| 5 | Shadow + easing sweep — every black shadow → the plum ladder; every `ease` → the set | S | Mechanical, global, immediately felt. |
| 6 | Grain stacking-context fix (§4.0) | S | A real bug; restores atmosphere the design already intended. |
| 7 | Radius concentricity on `.dabba` / `.board-frame` | S | One `calc()`; stops the gold band thinning at the corners. |
| 8 | **Rangoli v2 core** (§3) — lattice, drift, double-line, baksa palettes, 4 templates, motif vocabulary; ambient re-treatment (gold monochrome, .16, **static**, 92vmin) | L | The founder's ask, and the single most "crafted" change available. |
| 9 | Board-backing rangoli, level-seeded, .11 | S once #8 lands | Makes the largest dead surface sing. |

**P1 — the boutique layer.**

| # | Item | Est | Rationale |
|---|---|---|---|
| 10 | Map rangoli **seals** replacing the 9 emoji + per-city enamel plaques + gold connector; drop the ±0.8° rotation | M | Turns the weakest screen into the showcase for #8. |
| 11 | Dabba lacquer + tray interior + `.cwell` liner + margin emboss | M | The hero object finally reads as an object. |
| 12 | Title orchestration + logo foil emboss + tagline lockup + diya seating | M | First impression; almost entirely `animation-delay`. |
| 13 | Card system — paper texture, inner keyline, debossed goal panel, SVG stars, content stagger, retimed `cardPop` | M | Overlays appear at every level start and end. |
| 14 | Sweet refinement — vark ramp + crinkles, rim light, SVG contact shadows, gold specials, light standardisation | M | The tiles must survive a luxury frame. |
| 15 | HUD chip differentiation (enamel / cartouche / well) + low-moves material state | S/M | Correct hierarchy on the number players stare at. |
| 16 | Selected / hint state redesign + beam axis fix (§1.13) | S | Kills the last toy-like motion; fixes a real bug. |
| 17 | Win beat sheet retiming + rangoli draw-on | M | Mostly retiming existing calls into a sequence. |

**P2 — connoisseur.**

| # | Item | Est | Note |
|---|---|---|---|
| 18 | Toran v2 — dense marigolds, twisted gold cord, beaded drops, hanging shadow | M | ⚠ paint cost, see below |
| 19 | Firework shell types + gravity + flash frame; spark/petal/floatie refinement | M | |
| 20 | **Tiro Devanagari Hindi** for Devanagari (`मुंबई`, `॥ शुभ स्वाद ॥`) | S | ⚠ needs a woff2 added to `scripts/build-single.mjs` for the single-file bundle |
| 21 | Per-city hue on the board backing | S | Extends the map's enamel identity into play |

### Risk register

- **New font.** One extra family only. `display=swap` is already in place. `scripts/build-single.mjs`
  needs `marcellus-latin.woff2` added to its `face()` list or the single-file bundle silently
  falls back to Baloo — it skips missing files gracefully, so this fails *quietly*. Check it.
- **Toran paint cost (P2 #18).** `decorateToran` emits a `<use>` every 40 path-units; at 1440px
  that is ~42 flowers + ~84 leaves. Going from 4 shapes per flower to 28 means ~1,200 painted
  shapes. `<use>` keeps the DOM at 42 nodes and it is painted once (never animated), so it is
  acceptable — but **cap flower detail at 16 petals** and measure before shipping.
- **Rangoli path budgets** are hard caps (§3.7). Map seals render lazily inside `renderMap()`
  already — keep it that way; do not pre-render nine seals at boot.
- **Do not stack drop-shadows on `.tile-inner`** (§4.5). This is the one change that could
  visibly regress mid-phone cascade performance.
- **Reduced-motion:** add the explicit `animation: none` line of §5.4 for the looping sweeps.
- **`.rangoli` blur removal and `rangoliSpin` deletion are perf *wins*** — a permanently
  animating compositor layer currently persists through gameplay.

---

## 7. KEEP list — do not churn

These are already right. Several are load-bearing and were clearly hard-won.

1. **The board sizing law and every responsive mode** — `min(92vw, 100dvh − chrome, 680px)`,
   M0–M3, W1, W2, and the `--game-chrome` table. Untouchable. Nothing in this spec changes
   vertical chrome heights; if any does, update the table in the responsive spec.
2. **`--dvh` with the `@supports` fallback.**
3. **The diya flame stack** — three layers, per-diya phase offsets so the trio never syncs.
   Genuinely excellent; the best motion in the product. Only *seat* it better (§4.1).
4. **`.score-value`'s tabular-nums decision and its comment.** It is the correct instinct; the
   rest of the system should be brought up to it, not the reverse.
5. **`.track-star`'s `translate(-50%, -50%)` geometric-centre fix** and its comment.
6. **All touch/input handling** — `touch-action: none` on `.tile` and `.board`, pointer capture,
   `swipeTarget`'s `undefined`/`null`/number contract, the pointerup flick fallback.
7. **`injectDefs()` and the always-rendered defs sprite.** The `display:none` gradient bug is
   real; every new gradient goes in `GRADIENT_DEFS`.
8. **`decorateToran`'s viewBox re-tiling math** (aspect-ratio-derived `W`, seamless 400-unit
   swags). Change the ornaments, not the tiling.
9. **The dabba concept itself** — a gift box holding the board, with a lid tag. That is the
   product's best idea.
10. **Paper-on-lacquer contrast** for overlays. A cream card against a night scene is a real
    material contrast; refine it, do not flatten it.
11. **The grain overlay concept** (just make it actually render, §4.0).
12. **All copy** — city shouts, combo words, `॥ शुभ स्वाद ॥`, "Mithai Yatra", the special
    intro toasts, and the copy policy generally.
13. **`.hud-sub` keeping captions in compact mode** ("a bare number is ambiguous") — correct.
14. **The `prefers-reduced-motion` block's position as the last rule in the file.**
15. **The half-step offset between the two lotus layers** in `rangoliSVG` — the one place the
    current generator already applies real rangoli grammar.
16. **`:focus-visible` outlines** at `:579–580`. Accessibility, not decoration.

---

## 8. Acceptance checks

Before calling any phase done:

- [ ] `grep -c "solid var(--gold-line)"` → 0 (all gold edges are bands, not strokes)
- [ ] `grep "rgba(0, *0, *0"` in shadow declarations → 0 (all shadows plum-tinted)
- [ ] `grep -c "s ease[;,]"` → 0 (no default easing left in UI transitions)
- [ ] No emoji remain in `index.html`, `js/main.js` render paths, or `js/levels.js` `emblem`
- [ ] Modak appears on exactly three selectors: `.logo-*`, `.ov-shout`, `.combo-toast`
- [ ] Every numeral element declares `font-variant-numeric: tabular-nums`
- [ ] `.tile-inner` has exactly one `drop-shadow()`
- [ ] No `filter` / `backdrop-filter` inside `.board`, `.fx-layer`, or on `.cwell`
- [ ] `rangoliSpin` and `.rangoli { filter: blur(...) }` are gone
- [ ] Rangoli path counts within budget (260 / 180 / 120)
- [ ] Mobile portrait ≤560px: board still 92vw; M0–M3 / W1 / W2 all unchanged
- [ ] `prefers-reduced-motion` is still the last rule, and sweeps are explicitly `animation: none`
- [ ] `npm test` passes (engine untouched)
- [ ] `node scripts/build-single.mjs` still produces a working single file with the new font
