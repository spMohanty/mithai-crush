import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TYPES, makeRng, boardFrom, idx, performSwap, resolveStep, isAdjacent, isValidSwap,
} from '../js/board.js';
import {
  cloneBoard, evaluateSwap, spectacleScore, meetsProfile, evaluateBoard,
  generateCertified, makeGenerosity,
} from '../js/director.js';

const [L, J, K, G, B, S] = TYPES;

// Same proven zero-match/zero-move fixture as the board suite.
function noMoveGrid() {
  const rowTypes = [[L, J], [K, G], [B, S]];
  const grid = [];
  for (let r = 0; r < 8; r++) {
    const [a, b] = rowTypes[r % 3];
    grid.push(Array.from({ length: 8 }, (_, c) => (c % 2 === 0 ? a : b)));
  }
  return grid;
}
const base = () => boardFrom(noMoveGrid());
const setType = (b, r, c, t) => { b.cells[idx(r, c)].type = t; };

test('board.spawner hook: forced type is used for every refill spawn', () => {
  const b = base();
  setType(b, 1, 1, L); // swap (0,1)<->(1,1) clears the top-left laddoo triple
  b.spawner = () => 'samosa';
  const step = performSwap(b, idx(0, 1), idx(1, 1), makeRng(3));
  assert.ok(step.spawns.length >= 3);
  assert.ok(step.spawns.every((sp) => sp.tile.type === 'samosa'));
});

test('board.spawner hook: falsy return falls back to random valid types', () => {
  const b = base();
  setType(b, 1, 1, L);
  b.spawner = () => null;
  const step = performSwap(b, idx(0, 1), idx(1, 1), makeRng(3));
  assert.ok(step.spawns.length >= 3);
  assert.ok(step.spawns.every((sp) => TYPES.includes(sp.tile.type)));
});

test('cloneBoard is deep: mutating the clone leaves the original untouched', () => {
  const b = base();
  b.chashni[idx(2, 2)] = 1;
  const c = cloneBoard(b);
  c.cells[0].type = 'samosa';
  c.chashni[idx(2, 2)] = 0;
  c.nextId += 100;
  assert.equal(b.cells[0].type, L);
  assert.equal(b.chashni[idx(2, 2)], 1);
  assert.notEqual(b.nextId, c.nextId);
});

test('evaluateSwap: invalid swap returns null and board is unchanged', () => {
  const b = base();
  const snapshot = JSON.stringify(b.cells);
  assert.equal(evaluateSwap(b, idx(0, 0), idx(0, 1), 42), null);
  assert.equal(JSON.stringify(b.cells), snapshot);
});

test('evaluateSwap: returns cascade metrics without mutating the input board', () => {
  const b = base();
  setType(b, 1, 1, L);
  const snapshot = JSON.stringify(b.cells);
  const m = evaluateSwap(b, idx(0, 1), idx(1, 1), 42);
  assert.ok(m);
  assert.ok(m.chain >= 1);
  assert.ok(m.points >= 180);
  assert.ok(m.cleared >= 3);
  assert.equal(typeof m.created, 'number');
  assert.equal(typeof m.activated, 'number');
  assert.equal(JSON.stringify(b.cells), snapshot, 'input board must stay pristine');
});

test('evaluateSwap: same seed twice gives identical metrics', () => {
  const b = base();
  setType(b, 1, 1, L);
  const m1 = evaluateSwap(b, idx(0, 1), idx(1, 1), 777);
  const m2 = evaluateSwap(b, idx(0, 1), idx(1, 1), 777);
  assert.deepEqual(m1, m2);
});

test('spectacleScore and meetsProfile', () => {
  const m = { chain: 4, points: 3000, cleared: 20, created: 1, activated: 0 };
  assert.ok(spectacleScore(m) > spectacleScore({ ...m, chain: 1, created: 0 }));
  assert.ok(meetsProfile(m, { minChain: 4 }));
  assert.ok(meetsProfile(m, { minChain: 3, minPoints: 2000, wantSpecial: true }));
  assert.ok(!meetsProfile(m, { minChain: 5 }));
  assert.ok(!meetsProfile(m, { minPoints: 5000 }));
  assert.ok(!meetsProfile({ ...m, created: 0 }, { wantSpecial: true }));
  assert.ok(!meetsProfile(null, {}));
});

test('evaluateBoard finds a best swap on a board with moves', () => {
  const b = base();
  setType(b, 1, 1, L);
  const { best, moves } = evaluateBoard(b, 42);
  assert.ok(moves >= 1);
  assert.ok(best);
  assert.ok(isAdjacent(best.a, best.b));
  assert.ok(best.metrics.chain >= 1);
});

test('generateCertified: easy profile certifies with a playable golden swap', () => {
  const pack = generateCertified({ profile: { minChain: 1 }, seedBase: 7, maxAttempts: 60, budgetMs: 10000 });
  assert.ok(pack);
  assert.equal(pack.certified, true);
  assert.ok(isAdjacent(pack.golden.a, pack.golden.b));
  assert.ok(isValidSwap(pack.board, pack.golden.a, pack.golden.b));
  assert.ok(pack.metrics.chain >= 1);
  assert.equal(typeof pack.boardSeed, 'number');
  assert.equal(typeof pack.refillSeed, 'number');
});

test('generateCertified: impossible profile still returns best-so-far, uncertified', () => {
  const pack = generateCertified({ profile: { minChain: 99 }, seedBase: 7, maxAttempts: 12, budgetMs: 10000 });
  assert.ok(pack);
  assert.equal(pack.certified, false);
  assert.ok(pack.board);
  assert.ok(pack.metrics);
});

test('REPLAY EQUIVALENCE: golden swap under the certification seed reproduces metrics exactly', () => {
  const pack = generateCertified({ profile: { minChain: 2 }, seedBase: 11, maxAttempts: 300, budgetMs: 20000 });
  assert.ok(pack, 'search must produce a pack');
  const sim = cloneBoard(pack.board);
  const rng = makeRng(pack.refillSeed);
  let step = performSwap(sim, pack.golden.a, pack.golden.b, rng);
  assert.ok(step, 'golden swap must be valid');
  const m = { chain: 0, points: 0, cleared: 0, created: 0, activated: 0 };
  while (step) {
    m.chain++;
    m.points += step.points;
    m.cleared += step.cleared.length;
    m.created += step.created.length;
    m.activated += step.activated.length;
    step = resolveStep(sim, rng);
  }
  assert.deepEqual(m, pack.metrics);
});

test('makeGenerosity: completes a settled vertical pair below the spawn cell', () => {
  const b = base();
  setType(b, 4, 0, 'jalebi');
  setType(b, 5, 0, 'jalebi');
  const sp = makeGenerosity(1);
  assert.equal(sp(b, 3, 0, () => 0), 'jalebi');
});

test('makeGenerosity: null when no near-pair exists around the spawn cell', () => {
  // craft a neighborhood where every reference pair differs
  const grid = noMoveGrid();
  grid[2] = [B, S, B, J, B, S, B, S]; // straddle of (2,2) -> S vs J differ; pairs differ
  grid[3][2] = K; grid[4][2] = G;     // vertical below (2,2) differs
  const b = boardFrom(grid);
  const sp = makeGenerosity(1);
  assert.equal(sp(b, 2, 2, () => 0), null);
});

test('makeGenerosity: probability gate and hard cap at 0.25', () => {
  const b = base();
  setType(b, 4, 0, 'jalebi');
  setType(b, 5, 0, 'jalebi');
  const sp = makeGenerosity(0.9); // requested above the cap
  assert.equal(sp(b, 3, 0, () => 0.24), 'jalebi', 'roll below cap fires');
  assert.equal(sp(b, 3, 0, () => 0.26), null, 'roll above cap never fires even at g=0.9');
  assert.equal(makeGenerosity(0), null, 'zero generosity means no spawner at all');
});
