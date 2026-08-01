# Mithai Crush — एक दम देसी Match-3

Candy Crush, indianized. Swap **mithai** (Indian sweets), fire **Diwali patakhe**,
and travel a 9-city **Mithai Yatra** from Mumbai to Kashmir.

## Run it

Any static server works (ES modules need http, not file://):

```bash
python3 -m http.server 8341
```

Then open http://127.0.0.1:8341/ — no build step, no dependencies.

## Play

- Tap/click a sweet, then an adjacent one — or just swipe — to swap. Match 3+.
- **4 in a line** → Patakha **Rocket** (clears a row/column)
- **L/T shape** → **Anaar** (3×3 blast)
- **5 in a line** → **Chakri** (swap with anything to clear that whole sweet)
- Special + special swaps combo (chakri+chakri clears the board).
- Goal types: score target · collect sweets · clear pink **chashni** glaze.
- Leftover moves convert to a **Diwali Dhamaka** score bonus on win.
- Progress (stars, unlocks, best scores, mute) persists in localStorage.

## The dabba

| Sweet | Shape |
|---|---|
| Laddoo | boondi-textured orange sphere |
| Jalebi | glossy golden spiral |
| Kaju Katli | silver-vark diamond |
| Gulab Jamun | syrup-shined brown sphere |
| Barfi | pink square with vark + pista |
| Samosa | the savory gatecrasher |

## Code

```
js/board.js    pure match-3 engine (no DOM) — tested via `npm test` (node --test)
js/levels.js   Mithai Yatra level definitions
js/sweets.js   inline-SVG art for sweets + specials
js/audio.js    WebAudio synth (no assets)
js/main.js     rendering, input, animation, progression
css/style.css  Diwali-night visual identity
```

Dev console helper: `window.__mithai` (state, validMoves(), swap(a,b), startLevel(n)).

## E2E harnesses (optional)

`e2e/swipe-test.mjs` drives real CDP touch gestures against the live site; `e2e/audio-test.mjs`
measures every sound effect through the mix bus (run a local server first). Both need
`npm i -D puppeteer-core` and a local Chrome.

## Sound credits (all CC0 / public domain)

- [Kenney.nl](https://kenney.nl) — Interface Sounds, Impact Sounds, Music Jingles packs
- [25 CC0 bang / firework SFX](https://opengameart.org/content/25-cc0-bang-firework-sfx) (OpenGameArt)
- [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx) by rubberduck (OpenGameArt)
- [Swishes Sound Pack](https://opengameart.org/content/swishes-sound-pack) (OpenGameArt)

CC0 requires no attribution — credited with thanks anyway. If samples fail to load
(e.g. the single-file bundle), the game falls back to its built-in synth engine.
