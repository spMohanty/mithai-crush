// Inline-SVG art for every mithai and patakha. viewBox 0 0 100 100 throughout.
// Gradient ids repeat across instances of the same sweet with identical content,
// so cross-SVG id collisions are harmless.

import { ROCKET_H, ROCKET_V, ANAAR, CHAKRI } from './board.js';

export const SWEET_COLORS = {
  laddoo: '#FB923C',
  jalebi: '#F59E0B',
  katli: '#D6D3D1',
  jamun: '#8B4513',
  barfi: '#F472B6',
  samosa: '#D4A017',
  any: '#E91E63',
};

export const SWEET_NAMES = {
  laddoo: 'Laddoo', jalebi: 'Jalebi', katli: 'Kaju Katli',
  jamun: 'Gulab Jamun', barfi: 'Barfi', samosa: 'Samosa',
};

// All gradients live in ONE always-rendered defs sprite (see injectDefs) —
// gradients defined inside display:none subtrees break their references in Chrome.
export const GRADIENT_DEFS = `
  <radialGradient id="g-laddoo" cx="38%" cy="32%" r="75%">
    <stop offset="0%" stop-color="#FDBA74"/><stop offset="55%" stop-color="#F97316"/><stop offset="100%" stop-color="#C2410C"/>
  </radialGradient>
  <linearGradient id="g-katli" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#F5F5F4"/><stop offset="55%" stop-color="#D6D3D1"/><stop offset="100%" stop-color="#A8A29E"/>
  </linearGradient>
  <linearGradient id="g-vark" x1="0" y1="0" x2="1" y2="0.4">
    <stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#C0C0C8"/><stop offset="60%" stop-color="#F8FAFC"/><stop offset="100%" stop-color="#9CA3AF"/>
  </linearGradient>
  <radialGradient id="g-jamun" cx="36%" cy="30%" r="80%">
    <stop offset="0%" stop-color="#B45309"/><stop offset="55%" stop-color="#7C2D12"/><stop offset="100%" stop-color="#431407"/>
  </radialGradient>
  <linearGradient id="g-barfi" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="#FBCFE8"/><stop offset="60%" stop-color="#F472B6"/><stop offset="100%" stop-color="#DB2777"/>
  </linearGradient>
  <linearGradient id="g-barfivark" x1="0" y1="0" x2="1" y2="0.2">
    <stop offset="0%" stop-color="#FFFFFF"/><stop offset="50%" stop-color="#D1D5DB"/><stop offset="100%" stop-color="#F9FAFB"/>
  </linearGradient>
  <linearGradient id="g-samosa" x1="0.2" y1="0" x2="0.8" y2="1">
    <stop offset="0%" stop-color="#FDE68A"/><stop offset="45%" stop-color="#E9A23B"/><stop offset="100%" stop-color="#B45309"/>
  </linearGradient>`;

export function injectDefs(doc = document) {
  if (doc.getElementById('barfi-defs')) return;
  const holder = doc.createElement('div');
  holder.innerHTML = `<svg id="barfi-defs" aria-hidden="true" focusable="false"
    style="position:absolute;width:0;height:0;overflow:hidden"><defs>${GRADIENT_DEFS}</defs></svg>`;
  doc.body.prepend(holder.firstElementChild);
}

const boondi = (cx, cy, r, fill, op = 1) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`;

function laddooSVG() {
  let dots = '';
  const spots = [
    [38, 34, '#FDBA74'], [56, 30, '#F97316'], [68, 44, '#FDBA74'], [30, 50, '#F97316'],
    [46, 48, '#FFD9A8'], [62, 58, '#EA580C'], [36, 66, '#FDBA74'], [52, 70, '#F97316'],
    [68, 70, '#FDBA74'], [26, 38, '#EA580C'], [58, 44, '#FB923C'], [42, 58, '#EA580C'],
  ];
  for (const [x, y, f] of spots) dots += boondi(x, y, 4.6, f, 0.9);
  return `
  <circle cx="50" cy="52" r="36" fill="url(#g-laddoo)"/>
  ${dots}
  <ellipse cx="38" cy="34" rx="14" ry="9" fill="#FFF7ED" opacity="0.35" transform="rotate(-24 38 34)"/>
  <path d="M46 18 q4 -6 8 0 q-4 4 -8 0" fill="#16A34A"/>`;
}

function jalebiSVG() {
  const spiral = 'M50 50 a6 6 0 0 1 12 0 a12 12 0 0 1 -24 0 a18 18 0 0 1 36 0 a24 24 0 0 1 -48 0 a30 30 0 0 1 55 -8';
  return `
  <path d="${spiral}" fill="none" stroke="#B45309" stroke-width="15" stroke-linecap="round" opacity="0.9"/>
  <path d="${spiral}" fill="none" stroke="#F59E0B" stroke-width="11" stroke-linecap="round"/>
  <path d="${spiral}" fill="none" stroke="#FCD34D" stroke-width="3.5" stroke-linecap="round" opacity="0.85"
        transform="translate(-1.5 -2)"/>
  <circle cx="30" cy="34" r="2.4" fill="#FFFBEB" opacity="0.9"/>
  <circle cx="66" cy="62" r="2" fill="#FFFBEB" opacity="0.7"/>`;
}

function katliSVG() {
  return `
  <polygon points="50,9 91,50 50,91 9,50" fill="url(#g-katli)" stroke="#78716C" stroke-width="1.5"/>
  <polygon points="50,16 84,50 50,84 16,50" fill="url(#g-vark)" opacity="0.85"/>
  <polygon points="50,16 84,50 67,67 33,33" fill="#FFFFFF" opacity="0.25"/>
  <circle cx="50" cy="50" r="3" fill="#E7E5E4" stroke="#A8A29E" stroke-width="1"/>`;
}

function jamunSVG() {
  return `
  <ellipse cx="50" cy="82" rx="30" ry="8" fill="#92400E" opacity="0.5"/>
  <circle cx="50" cy="50" r="34" fill="url(#g-jamun)" stroke="#D97706" stroke-width="2" stroke-opacity="0.55"/>
  <ellipse cx="38" cy="36" rx="13" ry="8" fill="#FDE68A" opacity="0.45" transform="rotate(-20 38 36)"/>
  <circle cx="60" cy="66" r="2.5" fill="#FBBF24" opacity="0.5"/>
  <rect x="44" y="16" width="7" height="3" rx="1.5" fill="#4ADE80" transform="rotate(-18 47 17)"/>
  <rect x="53" y="15" width="6" height="3" rx="1.5" fill="#16A34A" transform="rotate(14 56 16)"/>`;
}

function barfiSVG() {
  return `
  <rect x="16" y="16" width="68" height="68" rx="10" fill="url(#g-barfi)" stroke="#BE185D" stroke-width="1.5"/>
  <rect x="16" y="16" width="68" height="22" rx="10" fill="url(#g-barfivark)" opacity="0.9"/>
  <rect x="16" y="30" width="68" height="8" fill="#F9A8D4" opacity="0.6"/>
  <circle cx="34" cy="60" r="2.6" fill="#15803D"/>
  <circle cx="56" cy="68" r="2.2" fill="#16A34A"/>
  <circle cx="68" cy="54" r="2.4" fill="#15803D"/>
  <circle cx="45" cy="26" r="2" fill="#FFFFFF" opacity="0.9"/>`;
}

function samosaSVG() {
  return `
  <path d="M50 10 Q54 10 56 15 L87 72 Q90 78 84 80 L16 80 Q10 78 13 72 L44 15 Q46 10 50 10 Z"
        fill="url(#g-samosa)" stroke="#92400E" stroke-width="2"/>
  <path d="M50 14 L50 78" stroke="#C2410C" stroke-width="2" opacity="0.4"/>
  <path d="M18 74 Q50 66 82 74" fill="none" stroke="#FDE68A" stroke-width="3" opacity="0.5"/>
  <circle cx="40" cy="46" r="2.5" fill="#92400E" opacity="0.35"/>
  <circle cx="60" cy="56" r="3" fill="#92400E" opacity="0.3"/>
  <circle cx="50" cy="32" r="2" fill="#92400E" opacity="0.3"/>
  <circle cx="33" cy="64" r="2.2" fill="#92400E" opacity="0.3"/>`;
}

const SWEETS = {
  laddoo: laddooSVG, jalebi: jalebiSVG, katli: katliSVG,
  jamun: jamunSVG, barfi: barfiSVG, samosa: samosaSVG,
};

export function sweetSVG(type) {
  return (SWEETS[type] || laddooSVG)();
}

// --- specials ------------------------------------------------------------

function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

export function chakriSVG() {
  const colors = ['#FF9933', '#FFD700', '#E91E63', '#009688', '#7C3AED', '#EF4444'];
  let segs = '';
  for (let k = 0; k < 6; k++) {
    segs += `<path d="${arc(50, 50, 33, k * 60, k * 60 + 46)}" stroke="${colors[k]}" stroke-width="15" fill="none" stroke-linecap="round"/>`;
  }
  return `
  <g class="chakri-spin" style="transform-origin:50px 50px">
    ${segs}
    <circle cx="50" cy="50" r="17" fill="#FFF7ED"/>
    <path d="M50 50 a5 5 0 0 1 8 4 a10 10 0 0 1 -16 -6" fill="none" stroke="#E91E63" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="50" r="3" fill="#B91C1C"/>
  </g>`;
}

function rocketOverlay(vertical) {
  // Bold stripes across the sweet in the clear direction + a patakha-rocket badge.
  const rot = vertical ? '' : ' transform="rotate(90 50 50)"';
  return `
  <g${rot}>
    <g class="rocket-pulse">
      <rect x="28" y="8" width="10" height="84" rx="5" fill="#FFFFFF" opacity="0.92" stroke="rgba(190,24,93,0.5)" stroke-width="1.5"/>
      <rect x="45" y="4" width="10" height="92" rx="5" fill="#FFFFFF" opacity="0.92" stroke="rgba(190,24,93,0.5)" stroke-width="1.5"/>
      <rect x="62" y="8" width="10" height="84" rx="5" fill="#FFFFFF" opacity="0.92" stroke="rgba(190,24,93,0.5)" stroke-width="1.5"/>
      <path d="M33 8 L38 -2 L43 8 Z" fill="#FFD700" transform="translate(-5 4)"/>
      <path d="M50 0 L56 10 L44 10 Z" fill="#FFD700"/>
      <path d="M67 8 L72 -2 L77 8 Z" fill="#FFD700" transform="translate(-5 4)"/>
    </g>
    <g transform="translate(70 2) scale(0.34)">
      <rect x="36" y="18" width="20" height="46" rx="9" fill="#E11D48" stroke="#7F1D1D" stroke-width="3"/>
      <path d="M46 -8 L62 22 L30 22 Z" fill="#FFC107" stroke="#B45309" stroke-width="3"/>
      <rect x="42" y="64" width="8" height="18" fill="#8D6E63"/>
      <path d="M30 70 Q46 88 62 70" stroke="#FF9933" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>
  </g>`;
}

function anaarOverlay() {
  // Whole-tile flame ring + a fat fuse: unmistakably a bomb about to go off.
  return `
  <circle cx="50" cy="52" r="45" fill="#FF9933" opacity="0.14"/>
  <g class="anaar-spin" style="transform-origin:50px 52px">
    <circle cx="50" cy="52" r="43" fill="none" stroke="#FFD700" stroke-width="5"
      stroke-dasharray="10 9" stroke-linecap="round"/>
  </g>
  <g class="anaar-flicker">
    <path d="M50 10 Q48 -2 58 -4" stroke="#166534" stroke-width="4" fill="none" stroke-linecap="round" transform="translate(0 8)"/>
    <g transform="translate(58 2)">
      <path d="M0 0 L4 8 L13 8 L6 13 L9 22 L0 16 L-9 22 L-6 13 L-13 8 L-4 8 Z" fill="#FFD700"/>
      <circle r="3.5" cy="8" fill="#FFF7ED"/>
    </g>
  </g>`;
}

// Pink swatch matching .cwell.chashni — used wherever the chashni goal is shown.
export function chashniSwatchSVG() {
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <rect x="14" y="14" width="72" height="72" rx="18" fill="#EC4899" stroke="#FBCFE8" stroke-width="6"/>
    <ellipse cx="38" cy="34" rx="16" ry="10" fill="#FFFFFF" opacity="0.45"/>
  </svg>`;
}

export function tileSVG(tile) {
  let inner;
  if (tile.special === CHAKRI) {
    inner = chakriSVG();
  } else {
    inner = sweetSVG(tile.type);
    if (tile.special === ROCKET_V) inner += rocketOverlay(true);
    else if (tile.special === ROCKET_H) inner += rocketOverlay(false);
    else if (tile.special === ANAAR) inner += anaarOverlay();
  }
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${inner}</svg>`;
}
