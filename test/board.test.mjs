import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIZE, TYPES, ROCKET_H, ROCKET_V, ANAAR, CHAKRI,
  makeRng, createBoard, boardFrom, idx, rc,
  findMatches, isAdjacent, isValidSwap, findValidMoves,
  performSwap, resolveStep, ensurePlayable,
} from '../js/board.js';

const [L, J, K, G, B, S] = TYPES; // laddoo jalebi katli jamun barfi samosa

// Rows cycle [L,J],[K,G],[B,S] — proven to contain zero matches and zero valid moves.
function noMoveGrid() {
  const rowTypes = [[L, J], [K, G], [B, S]];
  const grid = [];
  for (let r = 0; r < SIZE; r++) {
    const [a, b] = rowTypes[r % 3];
    grid.push(Array.from({ length: SIZE }, (_, c) => (c % 2 === 0 ? a : b)));
  }
  return grid;
}
function base() { return boardFrom(noMoveGrid()); }
function setType(board, r, c, type) { board.cells[idx(r, c)].type = type; }
function typesOf(board) { return board.cells.map(t => t.type); }
function countType(board, type) { return board.cells.filter(t => t && t.type === type).length; }

test('idx/rc roundtrip', () => {
  for (let i = 0; i < SIZE * SIZE; i++) {
    const [r, c] = rc(i);
    assert.equal(idx(r, c), i);
  }
});

test('makeRng is deterministic', () => {
  const a = makeRng(42), b = makeRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
  const seq = [makeRng(1)(), makeRng(2)()];
  assert.notEqual(seq[0], seq[1]);
});

test('createBoard: 64 tiles, no matches, >=1 valid move, across 100 seeds', () => {
  for (let seed = 0; seed < 100; seed++) {
    const board = createBoard({ rng: makeRng(seed) });
    assert.equal(board.cells.length, 64);
    assert.ok(board.cells.every(t => t && TYPES.includes(t.type) && t.special === null));
    assert.equal(findMatches(board).length, 0, `seed ${seed} has initial matches`);
    assert.ok(findValidMoves(board).length >= 1, `seed ${seed} has no valid moves`);
  }
});

test('createBoard passes chashni through', () => {
  const chashni = new Array(64).fill(0); chashni[idx(3, 3)] = 1;
  const board = createBoard({ rng: makeRng(7), chashni });
  assert.equal(board.chashni[idx(3, 3)], 1);
});

test('findMatches: horizontal and vertical threes, merged L overlap', () => {
  const b1 = base();
  setType(b1, 4, 2, L); setType(b1, 4, 3, L); setType(b1, 4, 4, L); // row4 is [K,G] row
  const m1 = findMatches(b1);
  assert.equal(m1.length, 1);
  assert.deepEqual([...m1[0].cells].sort((x, y) => x - y), [idx(4, 2), idx(4, 3), idx(4, 4)]);
  assert.equal(m1[0].type, L);

  const b2 = base();
  // col5 = J,G,S,J,G,S,J,G and (3,5) is already J; setting rows 2 and 4 to J gives exactly J,J,J
  setType(b2, 2, 5, J); setType(b2, 4, 5, J);
  const m2 = findMatches(b2);
  assert.equal(m2.length, 1);
  assert.deepEqual([...m2[0].cells].sort((x, y) => x - y), [idx(2, 5), idx(3, 5), idx(4, 5)]);

  const b3 = base(); // L-shape sharing corner (4,2): horizontal (4,2..4) + vertical (2..4,2) using base L at (3,2)
  setType(b3, 4, 2, L); setType(b3, 4, 3, L); setType(b3, 4, 4, L);
  setType(b3, 2, 2, L);
  const m3 = findMatches(b3);
  assert.equal(m3.length, 1, 'overlapping runs merge into one group');
  assert.equal(m3[0].cells.length ?? m3[0].cells.size, 5);
});

test('isAdjacent + non-adjacent swap invalid', () => {
  assert.ok(isAdjacent(idx(0, 0), idx(0, 1)));
  assert.ok(isAdjacent(idx(0, 0), idx(1, 0)));
  assert.ok(!isAdjacent(idx(0, 0), idx(0, 2)));
  assert.ok(!isAdjacent(idx(0, 7), idx(1, 0))); // no wraparound
  const b = base();
  assert.equal(performSwap(b, idx(0, 0), idx(0, 2), makeRng(1)), null);
});

test('invalid swap returns null and leaves board unchanged', () => {
  const b = base();
  const before = JSON.stringify(b.cells);
  assert.equal(isValidSwap(b, idx(0, 0), idx(0, 1)), false);
  assert.equal(performSwap(b, idx(0, 0), idx(0, 1), makeRng(1)), null);
  assert.equal(JSON.stringify(b.cells), before);
});

test('no-move fixture has zero valid moves; ensurePlayable reshuffles preserving types', () => {
  const b = base();
  assert.equal(findValidMoves(b).length, 0);
  const before = typesOf(b).sort();
  const res = ensurePlayable(b, makeRng(5));
  assert.equal(res.shuffled, true);
  assert.ok(findValidMoves(b).length >= 1);
  assert.equal(findMatches(b).length, 0, 'shuffle must not leave ready-made matches');
  assert.deepEqual(typesOf(b).sort(), before);
});

test('simple 3-match swap: clears 3, scores 60*3, collects type', () => {
  const b = base();
  setType(b, 1, 1, L); // row0 is L J L J...; swapping (0,1)<->(1,1) makes L L L
  assert.ok(isValidSwap(b, idx(0, 1), idx(1, 1)));
  const step = performSwap(b, idx(0, 1), idx(1, 1), makeRng(3));
  assert.ok(step);
  assert.deepEqual(step.swapped, [idx(0, 1), idx(1, 1)]);
  assert.deepEqual([...step.cleared].sort((x, y) => x - y), [idx(0, 0), idx(0, 1), idx(0, 2)]);
  assert.equal(step.points, 180);
  assert.equal(step.collected[L], 3);
  assert.equal(step.created.length, 0);
});

test('gravity: falls compact columns, spawns fill from top, board stays full and ids unique', () => {
  const b = base();
  setType(b, 1, 1, L);
  const idsBefore = new Set(b.cells.map(t => t.id));
  const step = performSwap(b, idx(0, 1), idx(1, 1), makeRng(3));
  // cleared cells were the whole top row segment (0,0),(0,1),(0,2): nothing above them falls
  assert.equal(step.falls.length, 0);
  assert.equal(step.spawns.length, 3);
  assert.ok(step.spawns.every(s => [idx(0, 0), idx(0, 1), idx(0, 2)].includes(s.to)));
  assert.ok(b.cells.every(t => t !== null));
  const ids = b.cells.map(t => t.id);
  assert.equal(new Set(ids).size, 64, 'ids unique after refill');
  for (const sp of step.spawns) assert.ok(!idsBefore.has(sp.tile.id), 'spawned tiles are new');
});

test('mid-board clear makes tiles above fall with correct from/to', () => {
  const b = base();
  setType(b, 1, 1, B); setType(b, 1, 2, S); setType(b, 3, 2, S); setType(b, 4, 2, S);
  // swap (2,1)S <-> (1,1)B -> row2 = B B B at cols 0,1,2
  const movedIds = [b.cells[idx(0, 0)].id, b.cells[idx(1, 0)].id];
  const step = performSwap(b, idx(2, 1), idx(1, 1), makeRng(9));
  assert.deepEqual([...step.cleared].sort((x, y) => x - y), [idx(2, 0), idx(2, 1), idx(2, 2)]);
  assert.equal(step.points, 180);
  const fall00 = step.falls.find(f => f.from === idx(0, 0));
  const fall10 = step.falls.find(f => f.from === idx(1, 0));
  assert.deepEqual([fall00.to, fall10.to], [idx(1, 0), idx(2, 0)]);
  assert.equal(b.cells[idx(1, 0)].id, movedIds[0]);
  assert.equal(b.cells[idx(2, 0)].id, movedIds[1]);
});

test('cascade: falling tiles form a second match with multiplier 2', () => {
  const b = base();
  setType(b, 1, 1, B); setType(b, 1, 2, S); setType(b, 3, 2, S); setType(b, 4, 2, S);
  const s1 = performSwap(b, idx(2, 1), idx(1, 1), makeRng(9));
  assert.equal(s1.points, 180);
  const s2 = resolveStep(b, makeRng(9));
  assert.ok(s2, 'cascade step exists');
  assert.ok(s2.cleared.length >= 3);
  assert.ok(s2.points >= 60 * s2.cleared.length * 2, 'second step doubles');
  let steps = 0;
  while (resolveStep(b, makeRng(9)) && steps < 20) steps++;
  assert.ok(steps < 20, 'resolves to stable');
  assert.ok(b.cells.every(t => t !== null));
});

test('horizontal 4-match creates column rocket at swap cell', () => {
  const b = base();
  // row0: L J L L J L J L ; set (1,1)=L then swap (0,1)<->(1,1) => L L L L
  setType(b, 0, 3, L); setType(b, 0, 4, J); setType(b, 1, 1, L);
  const step = performSwap(b, idx(0, 1), idx(1, 1), makeRng(2));
  assert.equal(step.created.length, 1);
  assert.equal(step.created[0].i, idx(0, 1));
  assert.equal(step.created[0].tile.special, ROCKET_V);
  assert.equal(step.cleared.length, 3, 'creation cell not cleared');
  assert.equal(step.points, 60 * 3 + 120);
});

test('vertical 4-match creates row rocket', () => {
  const b = base();
  // col0 rows: L K B L K B L K. Set (3,0)=B -> L K B B K B L K (max run 2).
  // Set (4,1)=B, swap (4,0)K <-> (4,1)B -> col0 rows 2..5 = B B B B.
  setType(b, 3, 0, B);
  setType(b, 4, 1, B);
  const step = performSwap(b, idx(4, 0), idx(4, 1), makeRng(2));
  assert.ok(step);
  assert.equal(step.created.length, 1);
  assert.equal(step.created[0].i, idx(4, 0));
  assert.equal(step.created[0].tile.special, ROCKET_H);
  assert.equal(step.cleared.length, 3);
});

test('5-in-a-row creates chakri', () => {
  const b = base();
  // row0 -> L L J L L J L J ; set (1,2)=L ; swap (0,2)<->(1,2) => L L L L L
  setType(b, 0, 1, L); setType(b, 0, 2, J); setType(b, 0, 3, L); setType(b, 0, 5, J); setType(b, 0, 6, L);
  setType(b, 1, 2, L);
  const step = performSwap(b, idx(0, 2), idx(1, 2), makeRng(2));
  assert.equal(step.created.length, 1);
  assert.equal(step.created[0].tile.special, CHAKRI);
  assert.equal(step.cleared.length, 4);
});

test('T-shape creates anaar', () => {
  const b = base();
  setType(b, 2, 0, S); setType(b, 2, 1, S); setType(b, 2, 3, G); // row2 -> S S B G ... (G stops the run at 3)
  setType(b, 0, 2, S); setType(b, 1, 2, S); setType(b, 3, 2, S);
  const step = performSwap(b, idx(2, 2), idx(3, 2), makeRng(2)); // brings S to (2,2)
  assert.equal(step.created.length, 1);
  assert.equal(step.created[0].i, idx(2, 2));
  assert.equal(step.created[0].tile.special, ANAAR);
  assert.equal(step.cleared.length, 4);
});

test('rocket in a normal match activates and clears its full row', () => {
  const b = base();
  setType(b, 4, 2, J); // row4=[K,G]: put J at (4,2)
  b.cells[idx(3, 3)].special = ROCKET_H; // (3,3) type J in row3 [L,J]
  // swap (3,2)L <-> (4,2)J => row3: (3,1)J (3,2)J (3,3)J
  const step = performSwap(b, idx(3, 2), idx(4, 2), makeRng(4));
  assert.ok(step);
  for (let c = 0; c < SIZE; c++) assert.ok(step.cleared.includes(idx(3, c)), `row3 col${c} cleared`);
  assert.ok(step.activated.some(a => a.kind === ROCKET_H && a.i === idx(3, 3)));
});

test('rocket blast chains an anaar caught in its row', () => {
  const b = base();
  setType(b, 4, 2, J);
  b.cells[idx(3, 3)].special = ROCKET_H;
  b.cells[idx(3, 6)].special = ANAAR;
  const step = performSwap(b, idx(3, 2), idx(4, 2), makeRng(4));
  assert.ok(step.activated.some(a => a.kind === ANAAR && a.i === idx(3, 6)));
  for (let r = 2; r <= 4; r++) for (let c = 5; c <= 7; c++) {
    assert.ok(step.cleared.includes(idx(r, c)), `anaar zone (${r},${c}) cleared`);
  }
});

test('chakri swapped with a normal clears every tile of that type', () => {
  const b = base();
  b.cells[idx(0, 0)] = { id: 999, type: 'any', special: CHAKRI };
  const jCount = countType(b, J);
  const step = performSwap(b, idx(0, 0), idx(0, 1), makeRng(6)); // (0,1) is J
  assert.ok(step);
  assert.equal(step.cleared.length, jCount + 1, 'all J + the chakri itself');
  assert.ok(step.cleared.includes(idx(0, 0)));
  assert.ok(step.points >= 60 * (jCount + 1) + 500);
  assert.ok(step.activated.some(a => a.kind === CHAKRI));
});

test('chakri + chakri clears the whole board', () => {
  const b = base();
  b.cells[idx(0, 0)] = { id: 900, type: 'any', special: CHAKRI };
  b.cells[idx(0, 1)] = { id: 901, type: 'any', special: CHAKRI };
  const step = performSwap(b, idx(0, 0), idx(0, 1), makeRng(6));
  assert.equal(step.cleared.length, 64);
});

test('rocket + rocket = cross clear at target', () => {
  const b = base();
  b.cells[idx(3, 3)].special = ROCKET_H;
  b.cells[idx(3, 4)].special = ROCKET_V;
  const step = performSwap(b, idx(3, 3), idx(3, 4), makeRng(6));
  const expect = new Set();
  for (let c = 0; c < SIZE; c++) expect.add(idx(3, c));
  for (let r = 0; r < SIZE; r++) expect.add(idx(r, 4));
  assert.equal(step.cleared.length, expect.size);
  for (const i of expect) assert.ok(step.cleared.includes(i));
});

test('anaar + anaar = 5x5 blast at target', () => {
  const b = base();
  b.cells[idx(3, 3)].special = ANAAR;
  b.cells[idx(3, 4)].special = ANAAR;
  const step = performSwap(b, idx(3, 3), idx(3, 4), makeRng(6));
  assert.equal(step.cleared.length, 25); // rows 1..5 x cols 2..6 fully on-board
});

test('rocket + anaar = 3 rows + 3 cols', () => {
  const b = base();
  b.cells[idx(3, 3)].special = ROCKET_H;
  b.cells[idx(3, 4)].special = ANAAR;
  const step = performSwap(b, idx(3, 3), idx(3, 4), makeRng(6));
  assert.equal(step.cleared.length, 3 * 8 + 3 * 8 - 9);
});

test('chakri + rocket clears that type plus the rocket line', () => {
  const b = base();
  b.cells[idx(0, 0)] = { id: 902, type: 'any', special: CHAKRI };
  b.cells[idx(0, 1)].special = ROCKET_V; // type J
  const step = performSwap(b, idx(0, 0), idx(0, 1), makeRng(6));
  for (let r = 0; r < SIZE; r++) assert.ok(step.cleared.includes(idx(r, 1)), 'rocket column cleared');
  assert.ok(step.cleared.includes(idx(0, 0)));
});

test('chashni decrements only on cleared cells', () => {
  const b = base();
  setType(b, 1, 1, B); setType(b, 1, 2, S); setType(b, 3, 2, S); setType(b, 4, 2, S);
  b.chashni[idx(2, 0)] = 1; b.chashni[idx(2, 1)] = 1; b.chashni[idx(7, 7)] = 1;
  const step = performSwap(b, idx(2, 1), idx(1, 1), makeRng(9));
  assert.deepEqual([...step.chashniCleared].sort((x, y) => x - y), [idx(2, 0), idx(2, 1)]);
  assert.equal(b.chashni[idx(2, 0)], 0);
  assert.equal(b.chashni[idx(7, 7)], 1);
});

test('special swap with normal (non-chakri) still needs a match', () => {
  const b = base();
  b.cells[idx(3, 3)].special = ROCKET_H;
  assert.equal(performSwap(b, idx(3, 3), idx(3, 4), makeRng(1)), null, 'rocket+normal with no match is invalid');
});
