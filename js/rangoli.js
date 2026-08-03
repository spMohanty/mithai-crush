// Procedural rangoli — drafted, not generated.
//
// The reference is real Diwali doorstep rangoli and temple mandala work: strict radial
// symmetry, a dense ornate centre opening into an airy scalloped rim, layered lotus petals,
// pulli (dot) lattices, sikku kolam loops, ambi paisley, peacock eyes. Six ideas carry it:
//
//   A. BAND PLANNER, not a fixed lattice. A composition is a list of (role, weight) slots;
//      weights are normalised into contiguous radial bands. Because the bands abut exactly,
//      the drawing has no dead gaps — and because HERO carries a much larger weight than the
//      connectives, one ring genuinely dominates. That is hierarchy you can see.
//
//   B. FLAT ENAMEL, LAYERED SHAPES. Depth comes from stacking a back petal, a front petal and
//      an inset inner petal in stepped values — never from a gradient. Per-shape gradients are
//      what make procedural art read as "shiny bean"; meenakari enamel is flat and jewel-hard.
//
//   C. ANNULUS FILLS ARE THE ONLY RING FILLS. A closed path swept around the full circle
//      encloses the whole disc, so filling one paints a slab over the design. Every band fill
//      here punches an even-odd hole at its inner radius, so a band is always a band.
//
//   D. LINE QUALITY is most of the perceived craft. Every stroke is a soft wide chalk bed plus
//      a crisp narrow core (rice flour has exactly that halo), stroke weight is assigned per
//      role rather than per radius, and a two-harmonic angular DRIFT warms the geometry.
//      Per-point jitter reads digital; coherent drift reads as the artist's hand.
//
//   E. ONE PATH PER STYLE, NOT PER SHAPE. Every shape in a ring shares a fill and a stroke, so
//      the ring is emitted as a handful of multi-subpath paths. Identical pixels, ~5× fewer
//      nodes — and it makes fine detail almost free, because a course of forty beads costs the
//      same two elements as a course of eight.
//
//   F. GRANULARITY IS SUB-DETAIL, NOT MORE MOTIFS. What separates temple enamel from a large
//      simple flower is the second and third order of ornament: a bead at every petal tip, a
//      hairline echo running inside every outline, a tick in every interstice, and thin FILET
//      courses subdividing the majors. Those all ride on rule E, so the design gets three or
//      four times the visual incident for a handful of extra elements. The one thing that must
//      NOT get finer is the hero — see ROLE_FOLD.

import { makeRng } from './board.js';

const C = 200;          // centre of the 400×400 viewBox
const R = 190;          // outer radius
const FLOUR = '#FFF6E3'; // rice-flour white
// Metal mode is only ever used in-game (ambient inlay, board backing), where gold is the
// brand. It ignores the palette's metal so a silver set can't wash out against the toran.
const ZARI = '#E8B33C';

// Meenakari baksa (enamel box sets). The ladder matters more than the hues: `ground` is the
// dark bed, `deep` the shadow layer, `figure` the body colour, `light` the inset highlight —
// four rising values so layered petals separate without any gradient. `jewel` and `accent` are
// small-area only; a large area of gold at partial opacity over plum turns khaki, which is
// exactly the mud this palette is built to avoid.
const BAKSA = [
  { name: 'Firozi Night', ground: '#06222E', deep: '#0A3F52', figure: '#0FA3A8', light: '#6FDCD2', jewel: '#E23D6E', accent: '#FFC94A' },
  { name: 'Ruby Court',   ground: '#2C0413', deep: '#6E0C28', figure: '#C8102E', light: '#F87A8E', jewel: '#0FA3A8', accent: '#FFC94A' },
  { name: 'Emerald Bagh', ground: '#04200F', deep: '#0A4526', figure: '#12925A', light: '#63D68E', jewel: '#E23D6E', accent: '#FFD76A' },
  // Lapis carries a warm accent rather than a pale one: a near-white accent collides with the
  // rice-flour outline, so every small jewel in the set simply disappeared.
  { name: 'Lapis Sabha',  ground: '#070F30', deep: '#16307A', figure: '#2F57D0', light: '#7E9FF0', jewel: '#FF7A18', accent: '#FFD76A' },
  // Kesari's bed has to stay near-black: a mid-brown ground under a mid-brown shadow layer
  // turns the whole field to chocolate, and saffron loses its heat. The jewel is turquoise
  // rather than violet — orange against firozi is the complementary pair this palette wants.
  { name: 'Kesari Dusk',  ground: '#1A0800', deep: '#5E1A02', figure: '#F0620C', light: '#FFB25C', jewel: '#00A6A6', accent: '#FFE7A3' },
  { name: 'Rani Mahal',   ground: '#2B0526', deep: '#7A0A60', figure: '#E0218A', light: '#FF93C8', jewel: '#0FA3A8', accent: '#FFD76A' },
];

// Radial weights, not radii. HERO is ~2.5× the widest connective, which is what makes the
// composition read as "one statement ring framed by trim" instead of even stripes.
//
// FILET slots are the granularity workhorse: a ~4px hairline course wedged between the majors.
// They cost almost nothing, they never compete (they carry no fill and no silhouette), and
// they triple the number of concentric events the eye can count. Real temple work is full of
// them — the thin beaded string between two carved courses — and their absence is most of what
// made the earlier designs read "open".
const LAYOUTS = {
  'Padma Chakra':   [['bindu', 0.95], ['core', 1.35], ['filet', 0.26], ['reel', 0.42], ['field', 1.65], ['filet', 0.26], ['reel', 0.40], ['hero', 2.95], ['filet', 0.26], ['collar', 1.00], ['rim', 0.28], ['border', 1.10]],
  'Sikku Bel':      [['bindu', 0.85], ['core', 1.20], ['filet', 0.24], ['field', 1.35], ['reel', 0.45], ['filet', 0.24], ['field', 1.35], ['hero', 2.85], ['filet', 0.26], ['reel', 0.42], ['collar', 0.95], ['rim', 0.28], ['border', 1.15]],
  'Mor Darbar':     [['bindu', 0.95], ['core', 1.45], ['filet', 0.26], ['reel', 0.42], ['field', 1.80], ['filet', 0.26], ['hero', 3.10], ['filet', 0.26], ['reel', 0.40], ['collar', 1.05], ['rim', 0.28], ['border', 1.05]],
  'Kalash Mandala': [['bindu', 0.90], ['core', 1.30], ['filet', 0.24], ['field', 1.55], ['reel', 0.45], ['filet', 0.26], ['hero', 3.00], ['filet', 0.26], ['collar', 0.95], ['field', 1.10], ['rim', 0.28], ['border', 1.15]],
  'Chakra Sabha':   [['bindu', 1.00], ['core', 1.55], ['filet', 0.26], ['reel', 0.40], ['field', 1.75], ['filet', 0.26], ['reel', 0.40], ['hero', 2.70], ['filet', 0.26], ['collar', 1.10], ['rim', 0.28], ['border', 1.10]],
};

// Which motifs may fill each role. The seed picks one per slot, so variety is combinatorial
// across roles rather than a single "style" switch — two seeds sharing a layout still differ.
const ROLE_MOTIFS = {
  core:   ['lotusRing', 'roundRing', 'flameRing', 'leafRing'],
  field:  ['lotusRing', 'ambiRing', 'leafRing', 'jaliNet', 'sunburst', 'kolamLoop', 'roundRing', 'diaperNet'],
  reel:   ['beadReel', 'pulliRing', 'ropeTwist', 'chevronBand', 'dashRing', 'guilloche'],
  hero:   ['heroLotus', 'heroAmbi', 'heroPeacock', 'heroDiya', 'heroKalash'],
  collar: ['lotusRing', 'beadReel', 'pulliRing', 'kolamLoop', 'chevronBand', 'leafRing', 'guilloche'],
  border: ['scallopEdge', 'templeEdge', 'belCreeper', 'lotusEdge', 'toothEdge'],
  filet:  ['tickFilet', 'pearlFilet', 'zigFilet', 'lozengeFilet'],
};

// Ratio of a role's repeat count to the master fold. Every value is an octave (½, 1, 2), so
// all rings still share lattice spokes and the layers look constructed rather than stacked.
//
// The centre and the HERO deliberately run at HALF the master. That inversion is the whole
// hierarchy argument: as the trim gets finer the statement ring must NOT follow it, or the
// design flattens into one uniform texture with no focal ring. The halving only applies once
// the master is dense enough to spare it — at the grid-locked 8 the board backing would be
// left with a four-lobed hero, so below 12 every role floors at 1×.
const ROLE_FOLD = { bindu: 0.5, core: 0.5, field: 1, reel: 1, hero: 0.5, collar: 1, rim: 2, border: 2, filet: 2 };

// Ornament aspect targets — the guard that makes one motif body work from fold 8 to fold 96.
//
// A band's repeat count is angular but its thickness is radial, so at a large radius a fixed
// fold makes each unit enormously wider than the band is thick. A braid whose unit is 38px of
// arc inside a 7px band is not a braid: it is a long tangential chord, and a ring of them reads
// as random lines crossing the design. That was the single worst artefact at high fold — the
// trim rings were spraying stray diagonals across the hero.
//
// So for every motif whose unit has a shape worth preserving, the planner doubles the repeat
// count (staying on the shared lattice, so the layers still register) until each unit is at
// most this many times wider than the band is thick. Lattices want to stay near square; bead
// courses can run looser before they look wrong. The effect is that the OUTER rings, which have
// the most room, end up the finest — which is exactly how real radial ornament is graded.
const ASPECT = {
  diaperNet: 2.4, jaliNet: 2.6, ropeTwist: 3.0, guilloche: 3.0, chevronBand: 3.0,
  kolamLoop: 3.2, zigFilet: 3.0, lozengeFilet: 3.4, dashRing: 4.0,
  beadReel: 4.5, pulliRing: 4.5, pearlFilet: 4.5, tickFilet: 3.2, rim: 4.5,
  // Petal rings get a target too, which only ever fires on a narrow ring at a large radius —
  // a collar. There, 24 medium petals sit in detached clumps with dead gaps between them;
  // 48 small ones read as a continuous carved course, and the contrast against a hero running
  // at a quarter of that count is most of what makes the hierarchy legible.
  lotusRing: 2.6, roundRing: 2.6, flameRing: 2.6, leafRing: 2.6, ambiRing: 2.6,
};

// Motif families. Adjacent bands are forced into different families, because the failure mode
// of radial art is petals-inside-petals-inside-petals: a ring of loops or dots between two
// petal rings is what lets the eye separate the layers. Filet motifs are deliberately absent —
// a hairline is structural punctuation, not ornament, so it is transparent to the rule and two
// petal bands separated only by a filet are still rejected.
const FAMILY = {
  lotusRing: 'petal', roundRing: 'petal', flameRing: 'petal', leafRing: 'petal', ambiRing: 'petal',
  jaliNet: 'net', sunburst: 'net', kolamLoop: 'net', diaperNet: 'net',
  beadReel: 'trim', pulliRing: 'trim', ropeTwist: 'trim', chevronBand: 'trim', dashRing: 'trim', guilloche: 'trim',
};

export function rangoliSVG(seed, { mode = 'colour', folds = null } = {}) {
  const rng = makeRng((seed >>> 0) || 1);
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const metal = mode === 'metal';
  const pal = BAKSA[Math.floor(rng() * BAKSA.length)];
  // 8 is reachable only via the explicit `folds` option (the board locks to it for grid
  // alignment). The master governs the FINE work — field, trim, filets — not the hero, so it
  // can run much denser than it used to without inflating the focal ring.
  const F = folds || pick([16, 20, 24]);

  // ---- D: coherent two-harmonic drift. Small on purpose — a drafted line is confident. ----
  const A1 = 0.0028 + rng() * 0.0026, A2 = 0.0014 + rng() * 0.0016;
  const p1 = rng() * Math.PI * 2, p2 = rng() * Math.PI * 2;
  const k1 = 2 + Math.floor(rng() * 2), k2 = 5 + Math.floor(rng() * 3);
  const drift = (deg) => {
    const a = (deg * Math.PI) / 180;
    return 1 + A1 * Math.sin(k1 * a + p1) + A2 * Math.sin(k2 * a + p2);
  };
  // Every motif goes through P/XY — nothing converts polar coordinates on its own, so the
  // drift applies uniformly and neighbouring rings stay in register.
  const XY = (r, deg) => {
    const rr = r * drift(deg), a = (deg * Math.PI) / 180;
    return [C + rr * Math.cos(a), C + rr * Math.sin(a)];
  };
  // One decimal, not two. The viewBox is 400 units and the largest instance renders under 2×,
  // so 0.1 of a unit is at most a fifth of a pixel — well under the drift's own wobble — while
  // the second decimal was costing ~10% of the markup across three designs on a page.
  const P = (r, deg) => {
    const [x, y] = XY(r, deg);
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  // Half the arc gap between neighbours at a given radius and fold. Every fine-detail radius is
  // clamped against this, so raising the master fold makes the ornament finer instead of making
  // it collide — the single guard that lets one motif body serve fold 8 and fold 48.
  const span = (r, n) => (Math.PI * r) / n;

  // ================= ink =================
  // A stroke is two paths: a wide low-opacity bed (chalk dust spreading off the line) and a
  // crisp core. Weight comes from the role, so the hero outline is visibly heavier than trim.
  // Fine sub-detail always passes bed:false — dozens of overlapping beds compound into a milky
  // haze, and haze is the exact opposite of the crispness that makes dense work readable.
  const INK = metal ? ZARI : FLOUR;
  const line = (d, { w = 1.5, op = 1, bed = true, cap = 'round' } = {}) => {
    if (!d) return '';
    let s = '';
    if (bed) {
      s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${(w * 1.9).toFixed(2)}"` +
           ` stroke-opacity="${((metal ? 0.13 : 0.15) * op).toFixed(3)}" stroke-linecap="${cap}" stroke-linejoin="round"/>`;
    }
    s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w.toFixed(2)}"` +
         `${op !== 1 ? ` stroke-opacity="${op}"` : ''} stroke-linecap="${cap}" stroke-linejoin="round"/>`;
    return s;
  };
  const fill = (d, colour, op = 1) =>
    (metal || !d) ? '' : `<path d="${d}" fill="${colour}"${op !== 1 ? ` fill-opacity="${op}"` : ''}/>`;

  // C: a full circle as a second subpath, so even-odd turns any swept boundary into a band.
  const circleD = (r) =>
    `M ${(C - r).toFixed(1)} ${C} a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0` +
    ` a ${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0 Z`;
  const bandFill = (outerD, rInner, colour, op = 1) =>
    metal ? '' : `<path d="${outerD} Z ${circleD(rInner)}" fill="${colour}"` +
      `${op !== 1 ? ` fill-opacity="${op}"` : ''} fill-rule="evenodd"/>`;

  // E: dots accumulate into one subpath string, then one fill + one stroke for the whole ring.
  const dotD = (r, th, rad) => {
    const [x, y] = XY(r, th);
    return ` M ${(x - rad).toFixed(1)} ${y.toFixed(1)} a ${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0` +
      ` ${(2 * rad).toFixed(1)} 0 a ${rad.toFixed(1)} ${rad.toFixed(1)} 0 1 0 ${(-2 * rad).toFixed(1)} 0 Z`;
  };
  const dots = (d, colour, w = 0.9) => {
    if (!d) return '';
    return (metal ? '' : `<path d="${d.trim()}" fill="${colour}"/>`) +
      `<path d="${d.trim()}" fill="none" stroke="${INK}" stroke-width="${w.toFixed(2)}"` +
      `${metal ? ' stroke-opacity="0.85"' : ''}/>`;
  };

  // The angular half-width a petal may occupy, clamped at both ends. The ceiling stops a low
  // fold count inflating petals into fat beans; the floor stops a narrow band at a large radius
  // (every outer border) shrinking them into sparse tabs with gaps between.
  const petalH = (n, r0, r1) => {
    const step = 360 / n, rMid = (r0 + r1) / 2;
    const aspect = ((0.36 * (r1 - r0)) / rMid) * (180 / Math.PI);
    return Math.min(step * 0.46, Math.max(aspect, step * 0.28));
  };

  // A circle sampled through the drift, so even plain rings carry the hand. The step is chosen
  // for a constant SAGITTA rather than a constant angle: a fixed step either facets the big
  // outer circles (the error grows with radius) or wastes hundreds of points on the small inner
  // ones. Solving r·θ²/8 ≤ 0.25 units holds every circle within half a pixel of true at the
  // largest size these render, while cutting the point count on the inner rings by about half.
  const ringPath = (r, stepDeg = 0) => {
    const s = stepDeg || Math.max(2.5, Math.min(14, 57.3 * Math.sqrt(2 / Math.max(r, 1))));
    let d = `M ${P(r, 0)}`;
    for (let a = s; a <= 360; a += s) d += ` L ${P(r, a)}`;
    return d + ' Z';
  };
  // Several concentric keylines merged into a single stroked path. A drafted design is full of
  // these; at one element per set they are the cheapest density in the file.
  const keylines = (rs, { w = 0.7, op = 0.5 } = {}) =>
    line(rs.map((r) => ringPath(r)).join(' '), { w, op, bed: false });

  // ================= petal anatomy =================
  // A lotus petal: narrow base, shoulder at ~60%, fine point, faintly concave near the tip.
  // `sharp` pulls the outer control angularly inward — lower is a needle, higher is a blade.
  const petal = (r0, r1, th, h, sharp = 0.52) => {
    const D = r1 - r0, w0 = h * 0.30;
    return `M ${P(r0, th - w0)}` +
      ` C ${P(r0 + 0.26 * D, th - h * 1.02)} ${P(r0 + 0.74 * D, th - h * sharp)} ${P(r1, th)}` +
      ` C ${P(r0 + 0.74 * D, th + h * sharp)} ${P(r0 + 0.26 * D, th + h * 1.02)} ${P(r0, th + w0)}` +
      ` Q ${P(r0 * 0.985, th)} ${P(r0, th - w0)} Z`;
  };
  // Kamal: broad and blunt, the outer row of a temple lotus.
  const roundPetal = (r0, r1, th, h) => {
    const D = r1 - r0, w0 = h * 0.34;
    return `M ${P(r0, th - w0)}` +
      ` C ${P(r0 + 0.16 * D, th - h * 1.18)} ${P(r1 - 0.06 * D, th - h * 0.92)} ${P(r1, th)}` +
      ` C ${P(r1 - 0.06 * D, th + h * 0.92)} ${P(r0 + 0.16 * D, th + h * 1.18)} ${P(r0, th + w0)}` +
      ` Q ${P(r0 * 0.985, th)} ${P(r0, th - w0)} Z`;
  };
  // Diya flame: pinched waist, full belly, drawn tip.
  const flamePetal = (r0, r1, th, h) => {
    const D = r1 - r0, w0 = h * 0.26;
    return `M ${P(r0, th - w0)}` +
      ` C ${P(r0 + 0.08 * D, th - h * 0.98)} ${P(r0 + 0.44 * D, th - h * 1.16)} ${P(r0 + 0.66 * D, th - h * 0.46)}` +
      ` C ${P(r0 + 0.86 * D, th - h * 0.18)} ${P(r1, th - h * 0.05)} ${P(r1, th)}` +
      ` C ${P(r1, th + h * 0.05)} ${P(r0 + 0.86 * D, th + h * 0.18)} ${P(r0 + 0.66 * D, th + h * 0.46)}` +
      ` C ${P(r0 + 0.44 * D, th + h * 1.16)} ${P(r0 + 0.08 * D, th + h * 0.98)} ${P(r0, th + w0)}` +
      ` Q ${P(r0 * 0.985, th)} ${P(r0, th - w0)} Z`;
  };
  // Leaf: pointed at both ends, widest at the middle.
  const leafPetal = (r0, r1, th, h) => {
    const D = r1 - r0;
    return `M ${P(r0, th)}` +
      ` C ${P(r0 + 0.22 * D, th - h * 0.92)} ${P(r0 + 0.78 * D, th - h * 0.92)} ${P(r1, th)}` +
      ` C ${P(r0 + 0.78 * D, th + h * 0.92)} ${P(r0 + 0.22 * D, th + h * 0.92)} ${P(r0, th)} Z`;
  };
  // Ambi: the mango hook. The tip leans hard off-axis and the trailing edge curls back under —
  // without that asymmetry the shape is just an egg.
  const ambiPetal = (r0, r1, th, h) => {
    const D = r1 - r0;
    return `M ${P(r0, th - h * 0.55)}` +
      ` C ${P(r0 + 0.30 * D, th - h * 1.05)} ${P(r0 + 0.80 * D, th - h * 0.70)} ${P(r1, th + h * 0.35)}` +
      ` C ${P(r0 + 0.80 * D, th + h * 0.55)} ${P(r0 + 0.45 * D, th + h * 1.00)} ${P(r0, th + h * 0.55)}` +
      ` Q ${P(r0 * 0.985, th)} ${P(r0, th - h * 0.55)} Z`;
  };
  // Spine plus two ribs.
  const veins = (r0, r1, th, h) => {
    const D = r1 - r0;
    return ` M ${P(r0 + 0.12 * D, th)} L ${P(r0 + 0.84 * D, th)}` +
      ` M ${P(r0 + 0.26 * D, th)} Q ${P(r0 + 0.50 * D, th - h * 0.44)} ${P(r0 + 0.70 * D, th - h * 0.30)}` +
      ` M ${P(r0 + 0.26 * D, th)} Q ${P(r0 + 0.50 * D, th + h * 0.44)} ${P(r0 + 0.70 * D, th + h * 0.30)}`;
  };

  const SHAPES = { lotusRing: petal, roundRing: roundPetal, flameRing: flamePetal, leafRing: leafPetal };

  // ================= ring motifs =================
  // Two interleaved rows: a recessed back row in `deep` peeking between a front row in
  // `figure`, each front petal carrying an inset `light` petal. Flat colours, stacked.
  //
  // On top of that skeleton sit the three sub-detail courses that carry the granularity:
  //   ECHO   — a hairline contour tracked between the front outline and the inset, the classic
  //            double-lining of enamel work. One element, and it doubles the apparent linework.
  //   BEADS  — a bead at every tip and a seed at every base, so the ring has a fine rhythm at a
  //            scale below the petal itself.
  //   TICKS  — a short radial stroke in every interstice, which subdivides the visible ground
  //            and stops wide bands reading as empty plate between motifs.
  // All three are suppressed on bands too narrow to hold them, or they turn into grit.
  const petalRing = (shape, n, r0, r1, off, { weight = 1.5, backRow = true, inner = true } = {}) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    const fine = D > 13, gap = span((r0 + r1) / 2, n);
    let back = '', front = '', echo = '', ins = '', vein = '', tips = '', seeds = '', ticks = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k, mid = off + step * (k + 0.5);
      if (backRow) back += shape(r0 + 0.05 * D, r1 - 0.17 * D, mid, h * 0.90);
      front += shape(r0, r1, th, h);
      if (fine) echo += shape(r0 + 0.055 * D, r1 - 0.055 * D, th, h * 0.80);
      if (inner && D > 12) ins += shape(r0 + 0.17 * D, r1 - 0.20 * D, th, h * 0.50);
      else vein += veins(r0, r1, th, h);
      if (fine) {
        tips += dotD(r1 - 0.11 * D, th, Math.min(D * 0.048, gap * 0.30, 2.3));
        seeds += dotD(r0 + 0.11 * D, th, Math.min(D * 0.036, gap * 0.24, 1.7));
        // The interstitial tick rides the seam, not the gap centre when a back row already
        // fills it — two marks in one gap is clutter, one mark per seam is a course.
        ticks += backRow
          ? ` M ${P(r0 + 0.06 * D, mid)} L ${P(r0 + 0.26 * D, mid)}`
          : ` M ${P(r0 + 0.14 * D, mid)} L ${P(r1 - 0.14 * D, mid)}`;
      }
    }
    return `<g data-fold="${n}">` +
      fill(back, pal.deep) + line(back, { w: weight * 0.62, op: 0.7, bed: false }) +
      fill(front, pal.figure) + line(front, { w: weight }) +
      line(echo, { w: weight * 0.30, op: 0.45, bed: false }) +
      fill(ins, pal.light) + line(ins, { w: weight * 0.42, op: 0.8, bed: false }) +
      line(vein, { w: weight * 0.36, op: 0.55, bed: false }) +
      line(ticks.trim(), { w: weight * 0.30, op: 0.42, bed: false }) +
      dots(tips, pal.accent, 0.6) + dots(seeds, pal.jewel, 0.55) + '</g>';
  };

  // Bead courses alternate a full bead with a half bead and now carry a fine tick on every
  // seam — a reel of plain beads is a necklace, a reel of beads and ticks is architecture.
  const beadReel = (n, r0, r1, off) => {
    const rm = (r0 + r1) / 2, step = 360 / n;
    const rad = Math.min((r1 - r0) * 0.34, span(rm, n) * 0.5);
    let big = '', small = '', ticks = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      if (k % 2) small += dotD(rm, th, rad * 0.55); else big += dotD(rm, th, rad);
      ticks += ` M ${P(r0 + (r1 - r0) * 0.14, th + step * 0.5)} L ${P(r1 - (r1 - r0) * 0.14, th + step * 0.5)}`;
    }
    return `<g data-fold="${n}">${keylines([r0, rm, r1], { w: 0.6, op: 0.42 })}` +
      line(ticks.trim(), { w: 0.55, op: 0.45, bed: false }) +
      dots(big, pal.jewel, 0.8) + dots(small, pal.accent, 0.7) + '</g>';
  };

  // Pulli: the dot lattice. Each dot now sits inside a hairline halo, which is how a drawn
  // pulli actually looks once the chalk has been pressed down — dot, then the ring it sits in.
  const pulliRing = (n, r0, r1, off) => {
    const rm = (r0 + r1) / 2, step = 360 / n;
    const rad = Math.min((r1 - r0) * 0.26, span(rm, n) * 0.42, 3.4);
    let d = '', halo = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      d += dotD(rm, th, rad);
      halo += dotD(rm, th, rad * 1.85);
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.75, op: 0.5 })}` +
      line(halo.trim(), { w: 0.5, op: 0.4, bed: false }) + dots(d, pal.accent, 0.8) + '</g>';
  };

  // Rope twist: leaning strokes between two guide circles. A single lean is a comb; the
  // counter-lean is what makes it read as a braid, and it is one extra element for double the
  // line density — the best granularity trade in the trim set.
  const ropeTwist = (n, r0, r1, off) => {
    const step = 360 / n, rm = (r0 + r1) / 2;
    let d = '', back = '', pips = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k;
      d += ` M ${P(r0, a)} Q ${P(rm, a + step * 0.30)} ${P(r1, a + step * 0.72)}`;
      back += ` M ${P(r0, a + step * 0.72)} Q ${P(rm, a + step * 0.42)} ${P(r1, a)}`;
      pips += dotD(rm, a + step * 0.36, Math.min((r1 - r0) * 0.11, 1.5));
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.75, op: 0.5 })}` +
      line(back.trim(), { w: 0.7, op: 0.45, bed: false }) +
      line(d.trim(), { w: 1.05, op: 0.85, bed: false }) + dots(pips, pal.accent, 0.5) + '</g>';
  };

  const chevronBand = (n, r0, r1, off) => {
    const step = 360 / n, D = r1 - r0;
    let d = `M ${P(r0, off)}`, echo = `M ${P(r0 + 0.26 * D, off)}`;
    for (let k = 0; k < n; k++) {
      d += ` L ${P(r1, off + step * (k + 0.5))} L ${P(r0, off + step * (k + 1))}`;
      echo += ` L ${P(r1 - 0.26 * D, off + step * (k + 0.5))} L ${P(r0 + 0.26 * D, off + step * (k + 1))}`;
    }
    return `<g data-fold="${n}">${bandFill(d + ` L ${P(r0, off)}`, r0, pal.figure, 0.9)}` +
      line(d, { w: 1.2 }) + line(echo, { w: 0.55, op: 0.5, bed: false }) +
      keylines([r0], { w: 0.65, op: 0.45 }) + '</g>';
  };

  // Alternating long and short ticks around a centre keyline: the same band the old version
  // drew with one tick length, but with an internal beat you can count.
  const dashRing = (n, r0, r1, off) => {
    const step = 360 / n, D = r1 - r0;
    let long = '', short = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k;
      long += ` M ${P(r0, a)} L ${P(r1, a)}`;
      short += ` M ${P(r0 + 0.28 * D, a + step * 0.5)} L ${P(r1 - 0.28 * D, a + step * 0.5)}`;
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.75, op: 0.5 })}` +
      line(long.trim(), { w: 1.05, op: 0.8, bed: false }) +
      line(short.trim(), { w: 0.7, op: 0.55, bed: false }) + '</g>';
  };

  // Guilloche: two counter-running waves crossing into a chain of lenses, with a bead in each.
  // The oldest fine-ornament trick there is (it is what engine-turned bank-note borders are),
  // and at two elements for the whole ring it is nearly free density.
  const guilloche = (n, r0, r1, off) => {
    const rm = (r0 + r1) / 2, amp = (r1 - r0) * 0.36, step = 360 / n;
    let a = `M ${P(rm + amp, off)}`, b = `M ${P(rm - amp, off)}`, eyes = '';
    for (let k = 0; k < n; k++) {
      const s = off + step * k, e = s + step;
      a += ` C ${P(rm + amp, s + step * 0.36)} ${P(rm - amp, e - step * 0.36)} ${P(rm - amp, e)}`;
      b += ` C ${P(rm - amp, s + step * 0.36)} ${P(rm + amp, e - step * 0.36)} ${P(rm + amp, e)}`;
      eyes += dotD(rm, s + step * 0.5, Math.min((r1 - r0) * 0.10, span(rm, n) * 0.22, 1.6));
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.7, op: 0.45 })}` +
      line(a + ' ' + b, { w: 0.95, op: 0.85, bed: false }) + dots(eyes, pal.accent, 0.55) + '</g>';
  };

  // Jali: two mirrored sweeps crossing into a diamond net, with a bead at each crossing. Cheap
  // in paths, extremely dense to the eye. No chalk bed — dozens of overlapping beds compound
  // into a milky haze that fogs the whole band. A second net at half pitch sits inside the
  // first, so the lattice has two scales the way real pierced stonework does.
  const jaliNet = (n, r0, r1, off) => {
    const step = 360 / n, D = r1 - r0;
    let d = '', inner = '', beads = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k;
      d += ` M ${P(r0, a)} Q ${P(r0 + D * 0.5, a + step * 0.5)} ${P(r1, a + step)}`;
      d += ` M ${P(r0, a)} Q ${P(r0 + D * 0.5, a - step * 0.5)} ${P(r1, a - step)}`;
      inner += ` M ${P(r0 + D * 0.28, a + step * 0.5)} Q ${P(r0 + D * 0.5, a + step * 0.75)} ${P(r1 - D * 0.28, a + step)}`;
      inner += ` M ${P(r0 + D * 0.28, a + step * 0.5)} Q ${P(r0 + D * 0.5, a + step * 0.25)} ${P(r1 - D * 0.28, a)}`;
      beads += dotD(r0 + D * 0.5, a + step * 0.5, Math.min(span(r0 + D * 0.5, n) * 0.26, 2.0));
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.75, op: 0.5 })}` +
      line(d.trim(), { w: 1.0, op: 0.85, bed: false }) +
      line(inner.trim(), { w: 0.55, op: 0.45, bed: false }) + dots(beads, pal.accent, 0.6) + '</g>';
  };

  // Diaper: the offset lozenge grid of Mughal tilework, two courses deep, each cell carrying a
  // pip. It is the most granular thing in the set and exists for exactly that reason — one
  // motif whose whole identity is "small repeating unit".
  const diaperNet = (n, r0, r1, off) => {
    const D = r1 - r0, step = 360 / n, rows = D > 26 ? 2 : 1;
    let cells = '', pips = '';
    for (let row = 0; row < rows; row++) {
      const a0 = r0 + (D * row) / rows, a1 = r0 + (D * (row + 1)) / rows;
      const h = step * (row % 2 ? 0.5 : 0.5), shift = row % 2 ? step * 0.5 : 0;
      for (let k = 0; k < n; k++) {
        const th = off + step * k + shift;
        cells += `M ${P(a0, th)} L ${P((a0 + a1) / 2, th - h * 0.92)} L ${P(a1, th)}` +
                 ` L ${P((a0 + a1) / 2, th + h * 0.92)} Z`;
        pips += dotD((a0 + a1) / 2, th, Math.min((a1 - a0) * 0.11, span((a0 + a1) / 2, n) * 0.20, 1.7));
      }
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.8, op: 0.55 })}` +
      fill(cells, pal.figure, 0.55) + line(cells, { w: 0.85, op: 0.8, bed: false }) +
      dots(pips, pal.accent, 0.55) + '</g>';
  };

  // Kiran: a ray band at double density, alternating long and short so the band has an internal
  // beat. Blunt equal wedges read as a crude pinwheel; tapered alternating rays read as chakra.
  // Each long ray now carries a hairline spine, which is what stops a big ray band reading as
  // flat coloured wedges once the design is scaled up.
  const sunburst = (n, r0, r1, off) => {
    const m = n * 2, step = 360 / m, D = r1 - r0, h = step * 0.36;
    let long = '', short = '', spines = '';
    for (let k = 0; k < m; k++) {
      const th = off + step * k, isLong = k % 2 === 0;
      const tip = isLong ? r1 : r1 - D * 0.36;
      const d = `M ${P(r0, th - h)} Q ${P(r0 + D * 0.52, th - h * 0.38)} ${P(tip, th)}` +
                ` Q ${P(r0 + D * 0.52, th + h * 0.38)} ${P(r0, th + h)} Z`;
      if (isLong) { long += d; spines += ` M ${P(r0 + D * 0.14, th)} L ${P(r1 - D * 0.12, th)}`; }
      else short += d;
    }
    // The short rays sit a step above the plate rather than at `deep`, or they disappear into
    // whatever dark value is behind them and the band reads as bare spikes.
    return `<g data-fold="${m}">` +
      fill(short, pal.light, 0.30) + line(short, { w: 0.75, op: 0.8, bed: false }) +
      fill(long, pal.figure) + line(long, { w: 1.1, bed: false }) +
      line(spines.trim(), { w: 0.5, op: 0.45, bed: false }) +
      keylines([r0], { w: 0.85, op: 0.6 }) + '</g>';
  };

  // Sikku kolam: one continuous loop chain that swings around each lattice dot and back, with
  // a smaller counter-chain woven through it.
  const kolamLoop = (n, r0, r1, off) => {
    const rm = (r0 + r1) / 2, amp = (r1 - r0) * 0.42, step = 360 / n;
    let d = `M ${P(rm + amp, off)}`, inner = '', beads = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k, b = a + step;
      d += ` C ${P(rm + amp * 2.0, a + step * 0.30)} ${P(rm + amp * 1.6, a + step * 0.66)} ${P(rm, a + step * 0.5)}` +
           ` C ${P(rm - amp * 1.6, b - step * 0.34)} ${P(rm - amp * 2.0, b - step * 0.06)} ${P(rm + amp, b)}`;
      inner += ` M ${P(rm + amp * 0.9, a + step * 0.18)} Q ${P(rm, a + step * 0.5)} ${P(rm - amp * 0.9, a + step * 0.82)}`;
      beads += dotD(rm, a + step * 0.5, Math.min(span(rm, n) * 0.22, 1.9));
    }
    return `<g data-fold="${n}">${line(d, { w: 1.4 })}` +
      line(inner.trim(), { w: 0.55, op: 0.42, bed: false }) + dots(beads, pal.accent, 0.6) + '</g>';
  };

  const ambiRing = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let outer = '', echo = '', ins = '', eyes = '', seeds = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      outer += ambiPetal(r0, r1, th, h);
      echo += ambiPetal(r0 + 0.08 * D, r1 - 0.09 * D, th, h * 0.80);
      ins += ambiPetal(r0 + 0.20 * D, r1 - 0.22 * D, th, h * 0.52);
      eyes += dotD(r0 + 0.30 * D, th, Math.min(D * 0.08, span(r0 + 0.3 * D, n) * 0.28, 3));
      seeds += dotD(r0 + 0.58 * D, th + h * 0.18, Math.min(D * 0.045, 1.7));
    }
    return `<g data-fold="${n}">` +
      fill(outer, pal.figure) + line(outer, { w: 1.5 }) +
      line(echo, { w: 0.5, op: 0.45, bed: false }) +
      fill(ins, pal.light) + line(ins, { w: 0.7, op: 0.8, bed: false }) +
      dots(eyes, pal.jewel, 0.8) + dots(seeds, pal.accent, 0.5) + '</g>';
  };

  // ================= filet motifs =================
  // Hairline courses, ~4px wide, that subdivide the majors. They carry no fill and no
  // silhouette by design: a filet that competes is a band, and then there is no hierarchy left.
  const tickFilet = (n, r0, r1, off) => {
    const step = 360 / n;
    let t = '';
    for (let k = 0; k < n; k++) t += ` M ${P(r0, off + step * k)} L ${P(r1, off + step * k)}`;
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.7, op: 0.55 })}` +
      line(t.trim(), { w: 0.6, op: 0.5, bed: false }) + '</g>';
  };

  const pearlFilet = (n, r0, r1, off) => {
    const rm = (r0 + r1) / 2, step = 360 / n;
    const rad = Math.min((r1 - r0) * 0.34, span(rm, n) * 0.44, 2.1);
    let d = '';
    for (let k = 0; k < n; k++) d += dotD(rm, off + step * k, k % 2 ? rad * 0.6 : rad);
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.6, op: 0.45 })}` +
      dots(d, pal.accent, 0.5) + '</g>';
  };

  const zigFilet = (n, r0, r1, off) => {
    const step = 360 / n;
    let d = `M ${P(r0, off)}`;
    for (let k = 0; k < n; k++) d += ` L ${P(r1, off + step * (k + 0.5))} L ${P(r0, off + step * (k + 1))}`;
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.6, op: 0.45 })}` +
      line(d, { w: 0.7, op: 0.65, bed: false }) + '</g>';
  };

  const lozengeFilet = (n, r0, r1, off) => {
    const step = 360 / n, rm = (r0 + r1) / 2, h = step * 0.34;
    let d = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      d += `M ${P(r0, th)} L ${P(rm, th - h)} L ${P(r1, th)} L ${P(rm, th + h)} Z`;
    }
    return `<g data-fold="${n}">${keylines([r0, r1], { w: 0.6, op: 0.42 })}` +
      fill(d, pal.light, 0.45) + line(d, { w: 0.6, op: 0.7, bed: false }) + '</g>';
  };

  // ================= hero motifs =================
  // The hero band is wide, so it can afford a back row, a front row, an inset, a jewel and a
  // filler bud in every interstice. Density here is what stops the design reading as a flower —
  // and because the hero runs at half the master fold, it can absorb all of it without the
  // motifs shrinking below the size that makes them the focal ring.
  const interstitialBud = (n, r0, r1, off) => {
    const step = 360 / n, D = r1 - r0;
    let buds = '', tips = '', stems = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * (k + 0.5);
      buds += petal(r0 + 0.04 * D, r0 + 0.42 * D, th, step * 0.16, 0.4);
      tips += dotD(r0 + 0.52 * D, th, 1.9) + dotD(r0 + 0.66 * D, th, 1.2);
      stems += ` M ${P(r0 + 0.44 * D, th)} L ${P(r0 + 0.60 * D, th)}` +
        ` M ${P(r0 + 0.74 * D, th - step * 0.10)} Q ${P(r0 + 0.86 * D, th)} ${P(r0 + 0.74 * D, th + step * 0.10)}`;
    }
    return fill(buds, pal.accent) + line(buds, { w: 0.8, op: 0.85, bed: false }) +
      line(stems.trim(), { w: 0.5, op: 0.45, bed: false }) + dots(tips, pal.accent, 0.6);
  };

  const heroLotus = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let back = '', front = '', echo = '', ins = '', vein = '', jewels = '', seeds = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      back += roundPetal(r0 + 0.06 * D, r1 - 0.14 * D, off + step * (k + 0.5), h * 0.94);
      front += petal(r0, r1, th, h, 0.48);
      echo += petal(r0 + 0.055 * D, r1 - 0.06 * D, th, h * 0.80, 0.46);
      ins += petal(r0 + 0.15 * D, r1 - 0.20 * D, th, h * 0.54, 0.44);
      vein += veins(r0 + 0.15 * D, r1 - 0.20 * D, th, h * 0.54);
      jewels += dotD(r0 + 0.13 * D, th, D * 0.070);
      // A graduated seed course up the axis: the detail you only notice on the second look.
      seeds += dotD(r0 + 0.46 * D, th, D * 0.030) + dotD(r0 + 0.62 * D, th, D * 0.024) +
        dotD(r0 + 0.76 * D, th, D * 0.018);
    }
    return `<g data-fold="${n}">` +
      fill(back, pal.deep) + line(back, { w: 1.1, op: 0.7, bed: false }) +
      fill(front, pal.figure) + line(front, { w: 2.2 }) +
      line(echo, { w: 0.6, op: 0.5, bed: false }) +
      fill(ins, pal.light) + line(ins, { w: 0.9, op: 0.85, bed: false }) +
      line(vein, { w: 0.6, op: 0.5, bed: false }) + dots(jewels, pal.jewel, 0.9) +
      dots(seeds, pal.accent, 0.55) + interstitialBud(n, r0, r1, off) + '</g>';
  };

  const heroAmbi = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let back = '', front = '', echo = '', ins = '', spine = '', big = '', small = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      back += petal(r0 + 0.06 * D, r1 - 0.06 * D, off + step * (k + 0.5), step * 0.17, 0.42);
      front += ambiPetal(r0, r1, th, h);
      echo += ambiPetal(r0 + 0.09 * D, r1 - 0.10 * D, th, h * 0.78);
      ins += ambiPetal(r0 + 0.24 * D, r1 - 0.26 * D, th, h * 0.44);
      // A spine following the hook, then a seed field along it — an ambi with only an outline
      // and a couple of dots reads as a potato; the interior curve is what names the motif.
      spine += ` M ${P(r0 + 0.16 * D, th)} C ${P(r0 + 0.50 * D, th - h * 0.40)}` +
        ` ${P(r0 + 0.80 * D, th - h * 0.28)} ${P(r1 - 0.10 * D, th + h * 0.10)}`;
      big += dotD(r0 + 0.26 * D, th - h * 0.10, D * 0.055);
      small += dotD(r0 + 0.46 * D, th - h * 0.02, D * 0.040) +
        dotD(r0 + 0.63 * D, th + h * 0.14, D * 0.030) + dotD(r0 + 0.76 * D, th + h * 0.26, D * 0.022);
    }
    return `<g data-fold="${n}">` +
      fill(back, pal.deep) + line(back, { w: 1.0, op: 0.7, bed: false }) +
      fill(front, pal.figure) + line(front, { w: 2.2 }) +
      line(echo, { w: 0.6, op: 0.5, bed: false }) +
      fill(ins, pal.light) + line(ins, { w: 0.9, op: 0.85, bed: false }) +
      line(spine.trim(), { w: 0.75, op: 0.6, bed: false }) +
      dots(big, pal.accent, 0.9) + dots(small, pal.accent, 0.7) + '</g>';
  };

  const heroPeacock = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let barbs = '', vane = '', ins = '', echo = '', eyes = '', pupils = '', rachis = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      // barbs: a fan of fine strokes, the plume behind each eye. Seven rather than five, and
      // the plume is where a peacock band earns its density.
      const bt = off + step * (k + 0.5);
      for (let j = -3; j <= 3; j++) {
        barbs += ` M ${P(r0 + 0.10 * D, bt)} Q ${P(r0 + 0.55 * D, bt + j * h * 0.22)} ${P(r1 - 0.06 * D, bt + j * h * 0.40)}`;
      }
      vane += petal(r0, r1, th, h, 0.50);
      ins += petal(r0 + 0.10 * D, r1 - 0.10 * D, th, h * 0.66, 0.46);
      echo += petal(r0 + 0.20 * D, r1 - 0.20 * D, th, h * 0.50, 0.44);
      // The eye. Concentric circles read as an eyeball; the mor eye is an oval sitting high on
      // the vane, so it is drawn as a small round petal with a single pupil.
      eyes += roundPetal(r0 + 0.40 * D, r0 + 0.82 * D, th, h * 0.44);
      pupils += dotD(r0 + 0.60 * D, th, D * 0.055);
      rachis += ` M ${P(r0 + 0.08 * D, th)} L ${P(r0 + 0.40 * D, th)}`;
    }
    return `<g data-fold="${n}">` +
      line(barbs.trim(), { w: 0.7, op: 0.5, bed: false }) +
      fill(vane, pal.deep) + line(vane, { w: 2.0 }) +
      fill(ins, pal.figure) + line(ins, { w: 0.9, op: 0.8, bed: false }) +
      line(echo, { w: 0.5, op: 0.45, bed: false }) +
      line(rachis.trim(), { w: 0.6, op: 0.5, bed: false }) +
      fill(eyes, pal.jewel) + line(eyes, { w: 0.9, op: 0.9, bed: false }) +
      dots(pupils, pal.accent, 0.7) + '</g>';
  };

  const heroDiya = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1) * 0.94, D = r1 - r0;
    let bowls = '', rims = '', flames = '', wicks = '', pips = '', rays = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      // bowl: a wide shallow vessel sitting on the inner radius
      bowls += `M ${P(r0 + 0.02 * D, th - h * 0.95)}` +
        ` C ${P(r0 + 0.30 * D, th - h * 0.80)} ${P(r0 + 0.30 * D, th + h * 0.80)} ${P(r0 + 0.02 * D, th + h * 0.95)}` +
        ` C ${P(r0 - 0.10 * D, th + h * 0.30)} ${P(r0 - 0.10 * D, th - h * 0.30)} ${P(r0 + 0.02 * D, th - h * 0.95)} Z`;
      rims += ` M ${P(r0 + 0.10 * D, th - h * 0.72)} Q ${P(r0 + 0.22 * D, th)} ${P(r0 + 0.10 * D, th + h * 0.72)}`;
      flames += flamePetal(r0 + 0.24 * D, r1, th, h * 0.74);
      wicks += flamePetal(r0 + 0.34 * D, r1 - 0.16 * D, th, h * 0.40);
      pips += dotD(r0 + 0.14 * D, th, D * 0.055);
      // Light thrown off each flame — three short rays, the drawn convention for a lit diya.
      for (let j = -1; j <= 1; j++) {
        rays += ` M ${P(r1 - 0.06 * D, th + j * h * 0.55)} L ${P(r1 + 0.04 * D, th + j * h * 0.78)}`;
      }
    }
    return `<g data-fold="${n}">` +
      fill(bowls, pal.figure) + line(bowls, { w: 1.8 }) +
      line(rims.trim(), { w: 0.6, op: 0.55, bed: false }) +
      fill(flames, pal.accent) + line(flames, { w: 1.6 }) +
      fill(wicks, pal.jewel) + line(wicks, { w: 0.7, op: 0.8, bed: false }) +
      line(rays.trim(), { w: 0.55, op: 0.5, bed: false }) +
      dots(pips, pal.light, 0.8) + interstitialBud(n, r0, r1, off) + '</g>';
  };

  const heroKalash = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let arches = '', inners = '', echo = '', keys = '', finials = '', buds = '', jambs = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      // temple arch: straight jambs, ogee shoulders, a finial dot on the crown
      arches += `M ${P(r0, th - h)} L ${P(r0 + 0.50 * D, th - h * 0.94)}` +
        ` C ${P(r0 + 0.82 * D, th - h * 0.86)} ${P(r1 - 0.06 * D, th - h * 0.40)} ${P(r1 - 0.10 * D, th)}` +
        ` C ${P(r1 - 0.06 * D, th + h * 0.40)} ${P(r0 + 0.82 * D, th + h * 0.86)} ${P(r0 + 0.50 * D, th + h * 0.94)}` +
        ` L ${P(r0, th + h)} Z`;
      inners += `M ${P(r0 + 0.16 * D, th - h * 0.62)} L ${P(r0 + 0.52 * D, th - h * 0.58)}` +
        ` C ${P(r0 + 0.74 * D, th - h * 0.50)} ${P(r1 - 0.20 * D, th - h * 0.24)} ${P(r1 - 0.24 * D, th)}` +
        ` C ${P(r1 - 0.20 * D, th + h * 0.24)} ${P(r0 + 0.74 * D, th + h * 0.50)} ${P(r0 + 0.52 * D, th + h * 0.58)}` +
        ` L ${P(r0 + 0.16 * D, th + h * 0.62)} Z`;
      echo += `M ${P(r0 + 0.08 * D, th - h * 0.80)} L ${P(r0 + 0.51 * D, th - h * 0.76)}` +
        ` C ${P(r0 + 0.78 * D, th - h * 0.68)} ${P(r1 - 0.13 * D, th - h * 0.32)} ${P(r1 - 0.17 * D, th)}` +
        ` C ${P(r1 - 0.13 * D, th + h * 0.32)} ${P(r0 + 0.78 * D, th + h * 0.68)} ${P(r0 + 0.51 * D, th + h * 0.76)}` +
        ` L ${P(r0 + 0.08 * D, th + h * 0.80)} Z`;
      // Fluting on the jambs — an arcade of plain arches is a silhouette, a fluted one is
      // carving.
      for (let j = -1; j <= 1; j += 2) {
        jambs += ` M ${P(r0 + 0.06 * D, th + j * h * 0.42)} L ${P(r0 + 0.46 * D, th + j * h * 0.40)}`;
      }
      keys += dotD(r0 + 0.52 * D, th, D * 0.085);
      finials += dotD(r1 - 0.02 * D, th, D * 0.048);
      buds += petal(r0 + 0.06 * D, r0 + 0.40 * D, th + step * 0.5, step * 0.15, 0.4);
    }
    return `<g data-fold="${n}">` +
      fill(arches, pal.figure) + line(arches, { w: 2.0 }) +
      line(echo, { w: 0.55, op: 0.45, bed: false }) +
      fill(inners, pal.deep) + line(inners, { w: 0.9, op: 0.8, bed: false }) +
      line(jambs.trim(), { w: 0.5, op: 0.45, bed: false }) +
      dots(keys, pal.jewel, 0.9) + dots(finials, pal.accent, 0.8) +
      fill(buds, pal.accent) + line(buds, { w: 0.8, op: 0.85, bed: false }) + '</g>';
  };

  // ================= border motifs =================
  // These own the outer silhouette. Crests reach the full radius, so the outline of the whole
  // rangoli is lobed rather than a machined circle — the single strongest "hand-made" cue.
  const scallopEdge = (n, r0, r1, off) => {
    const step = 360 / n, D = r1 - r0, base = r0 + D * 0.44;
    let d = `M ${P(base, off)}`, echo = `M ${P(base + D * 0.12, off)}`, beads = '', cusps = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k;
      d += ` C ${P(r1 * 1.005, a + step * 0.16)} ${P(r1 * 1.005, a + step * 0.84)} ${P(base, a + step)}`;
      echo += ` C ${P(r1 - D * 0.14, a + step * 0.18)} ${P(r1 - D * 0.14, a + step * 0.82)} ${P(base + D * 0.12, a + step)}`;
      beads += dotD(r0 + D * 0.22, a + step * 0.5, Math.min(D * 0.13, span(r0 + D * 0.22, n) * 0.34, 2.6));
      cusps += ` M ${P(base, a)} L ${P(base - D * 0.20, a)}`;
    }
    // Fill only the lobes (inner radius = the trough line), not the whole band. Filling to r0
    // turns the border into one plain slab of colour, which is what a machine-made edge looks
    // like; a real border is a narrow ribbon with a bead course running inside it.
    return `<g data-fold="${n}">${bandFill(d, base, pal.figure)}${line(d, { w: 1.5 })}` +
      line(echo, { w: 0.55, op: 0.5, bed: false }) +
      keylines([r0, base], { w: 0.9, op: 0.6 }) +
      line(cusps.trim(), { w: 0.55, op: 0.5, bed: false }) + dots(beads, pal.accent, 0.6) + '</g>';
  };

  const toothEdge = (n, r0, r1, off) => {
    const step = 360 / n, D = r1 - r0, base = r0 + D * 0.40;
    let d = `M ${P(base, off)}`, echo = '', beads = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k;
      d += ` L ${P(r1, a + step * 0.5)} L ${P(base, a + step)}`;
      echo += ` M ${P(base + D * 0.10, a + step * 0.18)} L ${P(r1 - D * 0.18, a + step * 0.5)}` +
        ` L ${P(base + D * 0.10, a + step * 0.82)}`;
      beads += dotD(r0 + D * 0.20, a + step * 0.5, Math.min(D * 0.12, span(r0 + D * 0.2, n) * 0.32, 2.4));
    }
    return `<g data-fold="${n}">${bandFill(d, base, pal.figure)}${line(d, { w: 1.4 })}` +
      line(echo.trim(), { w: 0.55, op: 0.5, bed: false }) +
      keylines([r0, base], { w: 0.9, op: 0.6 }) + dots(beads, pal.accent, 0.55) + '</g>';
  };

  const lotusEdge = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let outer = '', echo = '', ins = '', tips = '', gaps = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      outer += petal(r0 - 0.04 * D, r1, th, h, 0.46);
      echo += petal(r0 + 0.04 * D, r1 - 0.07 * D, th, h * 0.78, 0.44);
      ins += petal(r0 + 0.14 * D, r1 - 0.24 * D, th, h * 0.46, 0.42);
      tips += dotD(r1 - 0.10 * D, th, Math.min(D * 0.055, 1.9));
      gaps += ` M ${P(r0 + 0.06 * D, th + step * 0.5)} L ${P(r0 + 0.34 * D, th + step * 0.5)}`;
    }
    return `<g data-fold="${n}">${keylines([r0], { w: 1.1, op: 0.7 })}` +
      line(gaps.trim(), { w: 0.5, op: 0.45, bed: false }) +
      fill(outer, pal.figure) + line(outer, { w: 1.5 }) +
      line(echo, { w: 0.5, op: 0.45, bed: false }) +
      fill(ins, pal.accent) + line(ins, { w: 0.6, op: 0.75, bed: false }) +
      dots(tips, pal.light, 0.5) + '</g>';
  };

  const templeEdge = (n, r0, r1, off) => {
    const step = 360 / n, h = petalH(n, r0, r1), D = r1 - r0;
    let d = '', echo = '', beads = '', pins = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      d += `M ${P(r0, th - h)} L ${P(r1 - 0.30 * D, th - h * 0.62)}` +
        ` Q ${P(r1, th)} ${P(r1 - 0.30 * D, th + h * 0.62)} L ${P(r0, th + h)} Z`;
      echo += `M ${P(r0 + 0.10 * D, th - h * 0.78)} L ${P(r1 - 0.40 * D, th - h * 0.48)}` +
        ` Q ${P(r1 - 0.14 * D, th)} ${P(r1 - 0.40 * D, th + h * 0.48)} L ${P(r0 + 0.10 * D, th + h * 0.78)} Z`;
      beads += dotD(r0 + 0.42 * D, th, Math.min(D * 0.13, span(r0 + 0.42 * D, n) * 0.3));
      pins += dotD(r0 + 0.24 * D, th + step * 0.5, Math.min(D * 0.06, 1.6));
    }
    return `<g data-fold="${n}">${keylines([r0], { w: 1.1, op: 0.7 })}` +
      fill(d, pal.figure) + line(d, { w: 1.5 }) +
      line(echo, { w: 0.5, op: 0.45, bed: false }) +
      dots(beads, pal.accent, 0.8) + dots(pins, pal.light, 0.5) + '</g>';
  };

  // Bel: a running creeper, leaves alternating either side of the vine. Every radius here is a
  // fraction of the band width, so no leaf can swing outside r1 — a creeper that throws leaves
  // past the rim reads as debris floating off the design, not as a border. It runs over its own
  // dark ribbon, because a bare vine leaves the widest band of the design looking unfinished.
  const belCreeper = (n, r0, r1, off) => {
    const D = r1 - r0, rm = (r0 + r1) / 2, amp = D * 0.20, step = 360 / n;
    let vine = `M ${P(rm, off)}`, leaves = '', buds = '', curls = '', ribs = '';
    for (let k = 0; k < n; k++) {
      const a = off + step * k;
      vine += ` Q ${P(rm + amp * (k % 2 ? 1.5 : -1.5), a + step * 0.5)} ${P(rm, a + step)}`;
      const lr = rm + amp * (k % 2 ? 1.2 : -1.2);
      leaves += leafPetal(lr - amp * 1.1, lr + amp * 1.5, a + step * 0.5, step * 0.32);
      ribs += ` M ${P(lr - amp * 0.9, a + step * 0.5)} L ${P(lr + amp * 1.3, a + step * 0.5)}`;
      const br = rm + amp * (k % 2 ? -1.0 : 1.0);
      buds += leafPetal(br - amp * 0.55, br + amp * 0.75, a, step * 0.18);
      // A tendril off every node — the thing that makes a creeper look grown rather than laid.
      curls += ` M ${P(rm, a)} Q ${P(rm + amp * (k % 2 ? -1.7 : 1.7), a + step * 0.16)} ${P(rm + amp * (k % 2 ? -1.1 : 1.1), a + step * 0.34)}`;
    }
    return `<g data-fold="${n}">${bandFill(ringPath(r1), r0, pal.deep, 0.6)}` +
      keylines([r0, r1], { w: 1.0, op: 0.6 }) + line(vine, { w: 1.9 }) +
      line(curls.trim(), { w: 0.55, op: 0.5, bed: false }) +
      fill(leaves, pal.figure) + line(leaves, { w: 1.1, op: 0.95, bed: false }) +
      line(ribs.trim(), { w: 0.45, op: 0.5, bed: false }) +
      fill(buds, pal.accent) + line(buds, { w: 0.7, op: 0.8, bed: false }) + '</g>';
  };

  // ================= centre and rim =================
  // The bindu is the smallest thing in the design and the first place the eye lands once the
  // whole disc is on screen at size, so it gets two petal rows rather than one.
  const bindu = (n, r0, r1, off) => {
    const step = 360 / n;
    let rosette = '', under = '', pips = '';
    for (let k = 0; k < n; k++) {
      const th = off + step * k;
      rosette += petal(r1 * 0.34, r1 * 0.96, th, step * 0.44, 0.46);
      under += petal(r1 * 0.30, r1 * 0.74, th + step * 0.5, step * 0.34, 0.44);
      pips += dotD(r1 * 0.62, th + step * 0.5, r1 * 0.045);
    }
    return `<g data-fold="${n}">` +
      fill(under, pal.deep) + line(under, { w: 0.6, op: 0.7, bed: false }) +
      fill(rosette, pal.figure) + line(rosette, { w: 0.9, op: 0.9, bed: false }) +
      dots(pips, pal.accent, 0.45) +
      dots(dotD(0, 0, r1 * 0.36), pal.jewel, 1.4) +
      dots(dotD(0, 0, r1 * 0.15), pal.accent, 0.9) + '</g>';
  };

  // A fine double keyline with ticks between — the drafted trim that separates the field from
  // the border, and the one place a machined-looking circle is correct.
  const rimTrim = (n, r0, r1) => {
    let ticks = '';
    for (let k = 0; k < n; k++) { const a = (360 / n) * k; ticks += ` M ${P(r0, a)} L ${P(r1, a)}`; }
    return `<g data-fold="${n}">` +
      line(ringPath(r0), { w: 1.6, op: 0.9, bed: false }) +
      line(ringPath(r1), { w: 0.8, op: 0.6, bed: false }) +
      line(ticks.trim(), { w: 0.8, op: 0.65, bed: false }) + '</g>';
  };

  const RING = {
    beadReel, pulliRing, ropeTwist, chevronBand, dashRing, guilloche,
    jaliNet, sunburst, kolamLoop, ambiRing, diaperNet,
    heroLotus, heroAmbi, heroPeacock, heroDiya, heroKalash,
    scallopEdge, toothEdge, lotusEdge, templeEdge, belCreeper,
    tickFilet, pearlFilet, zigFilet, lozengeFilet,
  };

  // ================= A: plan the bands, then draw =================
  const foldOf = (role) => {
    const ratio = ROLE_FOLD[role];
    return Math.round(F * (F >= 12 ? ratio : Math.max(1, ratio)));
  };

  // Double a band's repeat count, on the lattice, until its unit is no wider than the band is
  // thick times the motif's aspect target. Capped at two octaves: past that even correct
  // ornament stops resolving and turns into grey texture.
  const proportion = (n, r0, r1, motif) => {
    const target = ASPECT[motif];
    if (!target) return n;
    let m = n;
    const unit = () => (2 * Math.PI * ((r0 + r1) / 2)) / m;
    while (unit() > (r1 - r0) * target && m < n * 4) m *= 2;
    return m;
  };

  const tplName = pick(Object.keys(LAYOUTS));
  const slots = LAYOUTS[tplName];
  const total = slots.reduce((a, s) => a + s[1], 0);
  let acc = 0;
  let prevFamily = null;
  let prevFilet = null;
  const bands = slots.map(([role, w], i) => {
    const r0 = (acc / total) * R;
    acc += w;
    const r1 = (acc / total) * R;
    let n = foldOf(role);
    // Pick a motif from a different family than the band inside it where the role allows one.
    let motif = role;
    if (ROLE_MOTIFS[role]) {
      const opts = ROLE_MOTIFS[role];
      if (role === 'filet') {
        // Filets sit outside the family rule, so they need their own anti-repeat: three
        // identical hairline courses in one design is the tell that a machine drew it.
        const fresh = opts.filter((m) => m !== prevFilet);
        motif = pick(fresh.length ? fresh : opts);
        prevFilet = motif;
      } else {
        const fresh = opts.filter((m) => FAMILY[m] && FAMILY[m] !== prevFamily);
        motif = pick(fresh.length ? fresh : opts);
        if (FAMILY[motif]) prevFamily = FAMILY[motif];
      }
    }
    // Applied after the motif is known, and before `off`, so the half-step stagger still lands
    // on the count the ring is actually drawn with.
    n = proportion(n, r0, r1, motif);
    return { role, r0, r1, n, off: i % 2 ? 180 / n : 0, motif };
  });

  let body = '';
  // The enamel bed: a dark plate under everything up to the border, so the jewel colours have
  // something to sit against. It stops at the border's inner edge, letting the lobed border
  // crests break the silhouette. Metal mode is pure linework and gets no plate.
  const borderBand = bands.find((b) => b.role === 'border');
  if (!metal) {
    const pr = borderBand ? borderBand.r0 : R * 0.92;
    body += `<circle cx="${C}" cy="${C}" r="${pr.toFixed(2)}" fill="${pal.ground}"/>`;
  }

  for (const b of bands) {
    const { role, r0, r1, n, off, motif } = b;
    // Line-only motifs can leave a band looking like a hole in the plate, so they get a value
    // annulus that turns the hole into a deliberate concentric zone. It stays well below full
    // `deep`: back rows and shadow shapes are painted in `deep`, and an annulus at that same
    // value swallows them whole. Motifs that already lay down fills are excluded outright, and
    // so are filets — a filet is meant to read as a gap between courses, not as a course.
    if (role !== 'filet' && (FAMILY[motif] === 'net' || FAMILY[motif] === 'trim') &&
        motif !== 'sunburst' && motif !== 'chevronBand' && motif !== 'diaperNet') {
      body += bandFill(ringPath(r1), r0, pal.deep, 0.34);
    }
    // Tag each ring with the role and motif that produced it. Costs nothing at render time and
    // makes the output legible when you are staring at a design wondering which band went wrong.
    const tag = (s) => s.replace('<g data-fold=', `<g data-role="${role}" data-motif="${motif}" data-fold=`);
    if (role === 'bindu') { body += tag(bindu(n, r0, r1, off)); continue; }
    if (role === 'rim') { body += tag(rimTrim(n, r0, r1)); continue; }
    if (SHAPES[motif]) {
      const weight = role === 'field' ? 1.7 : role === 'core' ? 1.4 : 1.1;
      body += tag(petalRing(SHAPES[motif], n, r0, r1, off, { weight, inner: role !== 'collar' }));
      continue;
    }
    body += tag(RING[motif](n, r0, r1, off));
  }

  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"` +
    ` data-baksa="${pal.name}" data-composition="${tplName}" data-master-fold="${F}">${body}</svg>`;
}
