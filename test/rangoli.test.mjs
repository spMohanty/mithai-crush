import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rangoliSVG } from '../js/rangoli.js';

const FLOUR_HEX = '#FFF6E3';
const ZARI_HEX = '#E8B33C';

const bands = (svg) => [...svg.matchAll(/<g data-role="(\w+)" data-motif="(\w+)" data-fold="(\d+)"/g)]
  .map((m) => ({ role: m[1], motif: m[2], fold: Number(m[3]) }));
const elements = (svg) => (svg.match(/<path/g) || []).length + (svg.match(/<circle/g) || []).length;

test('rangoliSVG returns a well-formed svg with rangoli anatomy', () => {
  const svg = rangoliSVG(42);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('viewBox="0 0 400 400"'));
  assert.ok((svg.match(/<path/g) || []).length >= 20, 'has petal/scallop/border paths');
  // Dots are arc subpaths merged into shared paths rather than individual <circle> elements,
  // so anatomy is asserted on the arc command that draws them.
  assert.ok((svg.match(/ a [\d.]+ [\d.]+ 0 1 0 /g) || []).length >= 8, 'has dot courses and bindu');
  assert.ok(svg.includes(FLOUR_HEX), 'has rice-flour white outlines');
});

test('rangoliSVG is deterministic per seed and varies across seeds', () => {
  assert.equal(rangoliSVG(7), rangoliSVG(7));
  const distinct = new Set([rangoliSVG(1), rangoliSVG(2), rangoliSVG(3), rangoliSVG(4)]);
  assert.equal(distinct.size, 4, 'different seeds paint different rangoli');
});

test('every ring shares the master fold as a power-of-two multiple', () => {
  for (let seed = 0; seed < 24; seed++) {
    const svg = rangoliSVG(seed);
    const rings = bands(svg);
    assert.ok(rings.length >= 8, `seed ${seed}: at least eight symmetric layers`);
    const master = Number(svg.match(/data-master-fold="(\d+)"/)[1]);
    assert.ok([16, 20, 24].includes(master), `seed ${seed}: master fold ${master}`);
    for (const { fold } of rings) {
      const ratio = fold / master;
      // ½ is an octave too, and a load-bearing one: the hero and the centre run at half the
      // master so that making the trim finer does not drag the focal ring finer with it. The
      // top of the range comes from the aspect guard, which doubles a lattice or braid ring up
      // to two further octaves so its unit stays roughly as wide as its band is thick.
      assert.ok([0.5, 1, 2, 4, 8].includes(ratio), `seed ${seed}: fold ${fold} is not an octave of ${master}`);
    }
  }
});

test('hierarchy: one wide hero ring, and trim rings denser than it', () => {
  for (let seed = 0; seed < 24; seed++) {
    const rings = bands(rangoliSVG(seed));
    const hero = rings.filter((r) => r.role === 'hero');
    assert.equal(hero.length, 1, `seed ${seed}: exactly one hero ring`);
    // The hero deliberately carries the FEWEST repeats — few large motifs read as a statement,
    // many small ones as texture. So density is not monotonic outward; what must hold is that
    // the trim rings framing it are denser than the hero.
    const rim = rings.find((r) => r.role === 'rim');
    assert.ok(rim.fold > hero[0].fold, `seed ${seed}: rim (${rim.fold}) denser than hero (${hero[0].fold})`);
    assert.ok(rings.some((r) => r.fold >= hero[0].fold * 2), `seed ${seed}: a density octave exists`);
  }
});

test('adjacent bands never repeat a motif family', () => {
  const FAM = {
    lotusRing: 'petal', roundRing: 'petal', flameRing: 'petal', leafRing: 'petal', ambiRing: 'petal',
    jaliNet: 'net', sunburst: 'net', kolamLoop: 'net', diaperNet: 'net',
    beadReel: 'trim', pulliRing: 'trim', ropeTwist: 'trim', chevronBand: 'trim', dashRing: 'trim',
    guilloche: 'trim',
  };
  // Filet motifs are deliberately unmapped: a hairline course is transparent to the family
  // rule, so two petal bands separated only by a filet must still count as adjacent here.
  const FILETS = ['tickFilet', 'pearlFilet', 'zigFilet', 'lozengeFilet'];
  // Roles whose motifs are allowed to sit outside the family rule. Anything else that is
  // unmapped would be silently skipped below, which is exactly how this table went stale once.
  const EXEMPT = new Set(['bindu', 'rim', 'hero', 'border', 'filet']);
  for (let seed = 0; seed < 40; seed++) {
    const rings = bands(rangoliSVG(seed));
    for (const r of rings) {
      if (EXEMPT.has(r.role)) continue;
      assert.ok(FAM[r.motif], `seed ${seed}: motif ${r.motif} has no family — add it to FAMILY`);
    }
    for (const r of rings.filter((x) => x.role === 'filet')) {
      assert.ok(FILETS.includes(r.motif), `seed ${seed}: ${r.motif} is not a known filet`);
    }
    const fams = rings.map((r) => FAM[r.motif]).filter(Boolean);
    for (let i = 1; i < fams.length; i++) {
      assert.notEqual(fams[i], fams[i - 1], `seed ${seed}: two ${fams[i]} bands in a row`);
    }
  }
});

test('ring fills are annuli, never a disc covering the design', () => {
  // The original defect: a boundary swept around the full circle was closed and filled, which
  // painted a flat slab over everything inside it. Any full-sweep fill must punch an even-odd
  // hole at its inner radius, and the enamel plate is the only solid disc in the drawing.
  for (let seed = 0; seed < 24; seed++) {
    const svg = rangoliSVG(seed);
    const rules = svg.match(/fill-rule="(\w+)"/g) || [];
    for (const r of rules) assert.equal(r, 'fill-rule="evenodd"', `seed ${seed}: non-evenodd band fill`);
    assert.equal((svg.match(/<circle/g) || []).length, 1, `seed ${seed}: plate is the only solid disc`);
  }
});

test('composes by a named grammar, with several compositions and palettes in play', () => {
  const comps = new Set(), palettes = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const svg = rangoliSVG(seed);
    const comp = svg.match(/data-composition="([^"]+)"/)?.[1];
    const baksa = svg.match(/data-baksa="([^"]+)"/)?.[1];
    assert.ok(comp, `seed ${seed}: has a named composition`);
    assert.ok(baksa, `seed ${seed}: has a named palette`);
    comps.add(comp); palettes.add(baksa);
  }
  assert.ok(comps.size >= 4, 'multiple compositions appear across seeds');
  assert.ok(palettes.size >= 4, 'multiple palettes appear across seeds');
});

test('metal mode is monochrome zari linework with no enamel', () => {
  for (let seed = 0; seed < 12; seed++) {
    const svg = rangoliSVG(seed, { mode: 'metal' });
    assert.ok(!svg.includes('radialGradient'), 'no petal gradients in metal mode');
    assert.ok(!svg.includes(FLOUR_HEX), 'no rice-flour white in metal mode');
    assert.ok(svg.includes(ZARI_HEX), 'draws in the brand gold');
    assert.equal((svg.match(/<circle/g) || []).length, 0, 'no enamel plate in metal mode');
    // every fill is either absent or explicitly none — metal mode paints nothing
    for (const f of svg.match(/fill="([^"]+)"/g) || []) {
      assert.equal(f, 'fill="none"', `seed ${seed}: metal mode painted ${f}`);
    }
  }
});

test('folds option forces a grid-aligned master fold', () => {
  // Checked across seeds, not just one, because which motifs land decides how far the aspect
  // guard doubles each ring — and every one of those counts still has to divide the 8×8 grid.
  for (let seed = 0; seed < 24; seed++) {
    const svg = rangoliSVG(seed, { mode: 'metal', folds: 8 });
    assert.equal(svg.match(/data-master-fold="(\d+)"/)[1], '8');
    for (const { fold } of bands(svg)) {
      assert.ok([8, 16, 32, 64].includes(fold), `seed ${seed}: fold ${fold} aligns to an 8×8 grid`);
    }
  }
});

test('stays cheap enough to drop three of these on a page', () => {
  let worst = 0;
  for (let seed = 0; seed < 200; seed++) {
    for (const mode of ['colour', 'metal']) worst = Math.max(worst, elements(rangoliSVG(seed, { mode })));
  }
  assert.ok(worst <= 120, `worst-case element count ${worst} should stay under 120`);
});
