// Procedural rangoli — the kind drawn with colored powder at doorsteps on Diwali.
// Grammar of the real thing: strict radial symmetry (8/12/16), a center bindu,
// layered lotus-petal rings in alternating powder colors, dot rings at junctions,
// a scalloped rim — everything edged in rice-flour white. Seeded => deterministic.

import { makeRng } from './board.js';

const C = 200; // center of the 400×400 viewBox

// Diwali powder palette (vivid, floor-powder hues)
const POWDER = ['#F94F8E', '#FF9933', '#FFD54F', '#7CB342', '#9C5BC4', '#EF5350', '#26A6B5'];
const FLOUR = '#FFF8E6'; // rice-flour white

const pol = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
};

// One lotus petal: base on r0, bulging sides, pointed tip on r1.
function petal(r0, r1, deg, halfDeg) {
  const rm = r0 + (r1 - r0) * 0.55;
  return `M ${pol(r0, deg - halfDeg)}` +
    ` Q ${pol(rm, deg - halfDeg * 1.25)} ${pol(r1, deg)}` +
    ` Q ${pol(rm, deg + halfDeg * 1.25)} ${pol(r0, deg + halfDeg)}` +
    ` Q ${pol(r0 * 0.96, deg)} ${pol(r0, deg - halfDeg)} Z`;
}

function petalRing(n, r0, r1, fill, offsetDeg = 0, stroke = FLOUR, strokeW = 1.6) {
  const half = (360 / n) * 0.36;
  let out = `<g data-fold="${n}">`;
  for (let k = 0; k < n; k++) {
    out += `<path d="${petal(r0, r1, offsetDeg + (360 / n) * k, half)}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>`;
  }
  return out + '</g>';
}

function dotRing(n, r, dotR, fill, offsetDeg = 0) {
  let out = `<g data-fold="${n}">`;
  for (let k = 0; k < n; k++) {
    const [x, y] = pol(r, offsetDeg + (360 / n) * k).split(' ');
    out += `<circle cx="${x}" cy="${y}" r="${dotR}" fill="${fill}" stroke="${FLOUR}" stroke-width="0.8"/>`;
  }
  return out + '</g>';
}

// Scalloped rim: a powder BAND — outward semicircle bumps on the outside,
// inner hole punched with evenodd so the layers beneath stay visible.
function scallopRing(n, r, bump, fill) {
  const step = 360 / n;
  let d = `M ${pol(r, 0)}`;
  for (let k = 0; k < n; k++) {
    d += ` A ${bump} ${bump} 0 0 1 ${pol(r, (k + 1) * step)}`;
  }
  const hole = Math.max(10, r - bump * 0.55).toFixed(1);
  d += ` Z M ${(C - hole)} ${C}` +
    ` a ${hole} ${hole} 0 1 0 ${(hole * 2).toFixed(1)} 0` +
    ` a ${hole} ${hole} 0 1 0 ${(-hole * 2).toFixed(1)} 0 Z`;
  return `<g data-fold="${n}"><path d="${d}" fill="${fill}" fill-rule="evenodd" stroke="${FLOUR}" stroke-width="1.6"/></g>`;
}

function ring(r, stroke = FLOUR, w = 1.4) {
  return `<circle cx="${C}" cy="${C}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${w}"/>`;
}

export function rangoliSVG(seed) {
  const rng = makeRng(seed >>> 0);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  // rotate the palette so each rangoli leads with a different powder color
  const shift = Math.floor(rng() * POWDER.length);
  const col = (i) => POWDER[(shift + i) % POWDER.length];

  const N = pick([8, 12, 16]);           // master symmetry
  const step = 360 / N;
  let s = '';

  // 1. Bindu (center) + inner flower
  s += `<circle cx="${C}" cy="${C}" r="${10 + rng() * 5}" fill="${col(0)}" stroke="${FLOUR}" stroke-width="1.6"/>`;
  s += `<circle cx="${C}" cy="${C}" r="4" fill="${FLOUR}"/>`;
  s += petalRing(N, 18, 40 + rng() * 8, col(1));
  s += ring(46 + rng() * 4);

  // 2. Main lotus: two-tone layered petals, back layer offset half a step — the classic look
  const backR = 100 + rng() * 14;
  s += petalRing(N, 52, backR, col(2), step / 2);
  s += petalRing(N, 52, backR - 16, col(3));

  // 3. Junction dots
  s += dotRing(N, backR + 10, 3.5 + rng() * 1.5, col(4), step / 2);

  // 4. Optional second motif band
  const band = pick(['petals', 'scallop', 'dots']);
  const bandR = backR + 22;
  if (band === 'petals') {
    s += petalRing(N, bandR - 6, bandR + 26, col(5), step / 2);
  } else if (band === 'scallop') {
    s += scallopRing(N, bandR + 8, (Math.PI * (bandR + 8)) / N * 0.62, col(5));
  } else {
    s += dotRing(N * 2, bandR + 6, 2.6, col(5), step / 4);
  }

  // 5. Rim: scalloped border + outer dots + closing flour ring
  const rimR = bandR + 34;
  s += scallopRing(N, rimR, (Math.PI * rimR) / N * 0.58, col(6));
  s += dotRing(N, rimR + 14, 3, col(0), step / 2);
  s += ring(rimR + 22, FLOUR, 1.8);

  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${s}</svg>`;
}
