import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rangoliSVG } from '../js/rangoli.js';

test('rangoliSVG returns a well-formed svg with rangoli anatomy', () => {
  const svg = rangoliSVG(42);
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('viewBox="0 0 400 400"'));
  assert.ok((svg.match(/<path/g) || []).length >= 8, 'has petal/scallop paths');
  assert.ok((svg.match(/<circle/g) || []).length >= 8, 'has dot rings and bindu');
  assert.ok(svg.includes('#FFF8E6'), 'has rice-flour white outlines');
});

test('rangoliSVG is deterministic per seed and varies across seeds', () => {
  assert.equal(rangoliSVG(7), rangoliSVG(7));
  const distinct = new Set([rangoliSVG(1), rangoliSVG(2), rangoliSVG(3), rangoliSVG(4)]);
  assert.equal(distinct.size, 4, 'different seeds paint different rangoli');
});

test('rangoliSVG symmetry: petal counts are 8, 12, or 16 per layer', () => {
  for (let seed = 0; seed < 12; seed++) {
    const svg = rangoliSVG(seed);
    const folds = [...svg.matchAll(/data-fold="(\d+)"/g)].map((m) => Number(m[1]));
    assert.ok(folds.length >= 2, `seed ${seed}: at least two symmetric layers`);
    // petal layers use the master fold (8/12/16); dot rings may double it for density
    for (const n of folds) assert.ok([8, 12, 16, 24, 32].includes(n), `seed ${seed}: fold ${n}`);
  }
});
