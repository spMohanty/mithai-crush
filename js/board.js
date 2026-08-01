// Mithai Crush — pure match-3 board logic. No DOM. Runs in browser and node:test.

export const SIZE = 8;
export const TYPES = ['laddoo', 'jalebi', 'katli', 'jamun', 'barfi', 'samosa'];
export const ROCKET_H = 'rocket_h'; // clears its row
export const ROCKET_V = 'rocket_v'; // clears its column
export const ANAAR = 'anaar';       // 3x3 blast
export const CHAKRI = 'chakri';     // color bomb, type 'any'

export function makeRng(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const idx = (r, c) => r * SIZE + c;
export const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
const onBoard = (r, c) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function boardFrom(grid, { chashni, types = TYPES } = {}) {
  const cells = [];
  let id = 1;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) cells.push({ id: id++, type: grid[r][c], special: null });
  }
  return {
    cells,
    chashni: chashni ? chashni.slice() : new Array(SIZE * SIZE).fill(0),
    types: types.slice(),
    nextId: id,
    cascade: 1,
  };
}

export function createBoard({ rng = makeRng(Math.floor(Math.random() * 2 ** 31)), types = TYPES, chashni } = {}) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const grid = [];
    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        let t;
        do { t = pick(rng, types); }
        while ((c >= 2 && row[c - 1] === t && row[c - 2] === t) ||
               (r >= 2 && grid[r - 1][c] === t && grid[r - 2][c] === t));
        row.push(t);
      }
      grid.push(row);
    }
    const board = boardFrom(grid, { chashni, types });
    if (findValidMoves(board).length) return board;
  }
  throw new Error('could not generate a playable board');
}

// ---- match detection ----------------------------------------------------

function runsIn(cells) {
  const runs = [];
  for (let r = 0; r < SIZE; r++) {
    let c = 0;
    while (c < SIZE) {
      const t = cells[idx(r, c)]?.type;
      if (!t || t === 'any') { c++; continue; }
      let e = c;
      while (e + 1 < SIZE && cells[idx(r, e + 1)]?.type === t) e++;
      const len = e - c + 1;
      if (len >= 3) {
        const list = [];
        for (let x = c; x <= e; x++) list.push(idx(r, x));
        runs.push({ dir: 'h', cells: list, type: t, len });
      }
      c = e + 1;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let r = 0;
    while (r < SIZE) {
      const t = cells[idx(r, c)]?.type;
      if (!t || t === 'any') { r++; continue; }
      let e = r;
      while (e + 1 < SIZE && cells[idx(e + 1, c)]?.type === t) e++;
      const len = e - r + 1;
      if (len >= 3) {
        const list = [];
        for (let x = r; x <= e; x++) list.push(idx(x, c));
        runs.push({ dir: 'v', cells: list, type: t, len });
      }
      r = e + 1;
    }
  }
  return runs;
}

export function findMatches(board) {
  const runs = runsIn(board.cells);
  const groups = [];
  for (const run of runs) {
    const touching = groups.filter(g => g.type === run.type && run.cells.some(i => g.set.has(i)));
    let g;
    if (touching.length === 0) {
      g = { type: run.type, set: new Set(), runH: 0, runV: 0 };
      groups.push(g);
    } else {
      g = touching[0];
      for (const other of touching.slice(1)) {
        for (const i of other.set) g.set.add(i);
        g.runH = Math.max(g.runH, other.runH);
        g.runV = Math.max(g.runV, other.runV);
        groups.splice(groups.indexOf(other), 1);
      }
    }
    for (const i of run.cells) g.set.add(i);
    if (run.dir === 'h') g.runH = Math.max(g.runH, run.len);
    else g.runV = Math.max(g.runV, run.len);
  }
  return groups.map(g => ({
    cells: [...g.set],
    type: g.type,
    runH: g.runH,
    runV: g.runV,
    pivot: [...g.set][0],
  }));
}

export function isAdjacent(a, b) {
  const [ar, ac] = rc(a), [br, bc] = rc(b);
  return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

function cellMakesMatch(cells, i) {
  const t = cells[i]?.type;
  if (!t || t === 'any') return false;
  const [r, c] = rc(i);
  let n = 1;
  for (let x = c - 1; x >= 0 && cells[idx(r, x)]?.type === t; x--) n++;
  for (let x = c + 1; x < SIZE && cells[idx(r, x)]?.type === t; x++) n++;
  if (n >= 3) return true;
  n = 1;
  for (let y = r - 1; y >= 0 && cells[idx(y, c)]?.type === t; y--) n++;
  for (let y = r + 1; y < SIZE && cells[idx(y, c)]?.type === t; y++) n++;
  return n >= 3;
}

export function isValidSwap(board, a, b) {
  if (!isAdjacent(a, b)) return false;
  const ta = board.cells[a], tb = board.cells[b];
  if (!ta || !tb) return false;
  if (ta.special && tb.special) return true;
  if (ta.special === CHAKRI || tb.special === CHAKRI) return true;
  const cells = board.cells;
  [cells[a], cells[b]] = [cells[b], cells[a]];
  const ok = cellMakesMatch(cells, a) || cellMakesMatch(cells, b);
  [cells[a], cells[b]] = [cells[b], cells[a]];
  return ok;
}

export function findValidMoves(board) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const i = idx(r, c);
      if (c + 1 < SIZE && isValidSwap(board, i, idx(r, c + 1))) moves.push([i, idx(r, c + 1)]);
      if (r + 1 < SIZE && isValidSwap(board, i, idx(r + 1, c))) moves.push([i, idx(r + 1, c)]);
    }
  }
  return moves;
}

// ---- clearing engine ----------------------------------------------------

function blastCells(i, kind) {
  const [r, c] = rc(i);
  const out = [];
  if (kind === ROCKET_H) {
    for (let x = 0; x < SIZE; x++) out.push(idx(r, x));
  } else if (kind === ROCKET_V) {
    for (let y = 0; y < SIZE; y++) out.push(idx(y, c));
  } else if (kind === ANAAR) {
    for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) {
      if (onBoard(y, x)) out.push(idx(y, x));
    }
  }
  return out; // chakri hit by a blast clears only itself
}

// Builds one full step: clear -> create specials -> chain blasts -> gravity -> spawn.
function buildStep(board, rng, { matches = [], swapCells = null, seedClear = [], seedActivated = [], swapped = null }) {
  const cells = board.cells;
  const clear = new Set(seedClear);
  const created = [];
  const activated = [];
  const visited = new Set();

  for (const s of seedActivated) {
    activated.push(s);
    visited.add(s.i);
  }

  // Special creation from match groups.
  for (const g of matches) {
    for (const i of g.cells) clear.add(i);
    let kind = null;
    if (g.runH >= 5 || g.runV >= 5) kind = CHAKRI;
    else if (g.runH >= 3 && g.runV >= 3) kind = ANAAR;
    else if (g.runH === 4) kind = ROCKET_V;
    else if (g.runV === 4) kind = ROCKET_H;
    if (kind) {
      let at = g.pivot;
      if (swapCells) {
        const inGroup = swapCells.filter(sc => g.cells.includes(sc));
        if (inGroup.length) at = inGroup[0];
      }
      const tile = {
        id: board.nextId++,
        type: kind === CHAKRI ? 'any' : g.type,
        special: kind,
      };
      created.push({ i: at, tile });
    }
  }
  const creationCells = new Map(created.map(cr => [cr.i, cr.tile]));

  // Chain-activate every special caught in the clear set.
  let grew = true;
  while (grew) {
    grew = false;
    for (const i of [...clear]) {
      const t = cells[i];
      if (!t || !t.special || visited.has(i) || creationCells.has(i)) continue;
      visited.add(i);
      activated.push({ i, kind: t.special });
      for (const j of blastCells(i, t.special)) {
        if (!clear.has(j)) { clear.add(j); grew = true; }
      }
    }
  }

  // Newly created specials survive the step that created them.
  for (const i of creationCells.keys()) clear.delete(i);

  // Score, collection, chashni.
  const collected = {};
  for (const i of clear) {
    const t = cells[i];
    if (t && t.type !== 'any') collected[t.type] = (collected[t.type] || 0) + 1;
  }
  const chashniCleared = [];
  const chashniTargets = new Set([...clear, ...creationCells.keys()]);
  for (const i of chashniTargets) {
    if (board.chashni[i] > 0) {
      board.chashni[i]--;
      if (board.chashni[i] === 0) chashniCleared.push(i);
    }
  }
  const chakriBooms = activated.filter(a => a.kind === CHAKRI).length;
  const points = 60 * clear.size * board.cascade + 120 * created.length + 500 * chakriBooms;

  // Apply: place created specials, null out cleared.
  for (const [i, tile] of creationCells) cells[i] = tile;
  for (const i of clear) cells[i] = null;

  // Gravity + spawns.
  const falls = [];
  const spawns = [];
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      const t = cells[idx(r, c)];
      if (!t) continue;
      if (write !== r) {
        falls.push({ from: idx(r, c), to: idx(write, c), id: t.id });
        cells[idx(write, c)] = t;
        cells[idx(r, c)] = null;
      }
      write--;
    }
    for (let r = write; r >= 0; r--) {
      const tile = { id: board.nextId++, type: pick(rng, board.types), special: null };
      cells[idx(r, c)] = tile;
      spawns.push({ to: idx(r, c), tile });
    }
  }

  const step = {
    cleared: [...clear],
    activated,
    created,
    chashniCleared,
    falls,
    spawns,
    points,
    collected,
  };
  if (swapped) step.swapped = swapped;
  board.cascade++;
  return step;
}

export function performSwap(board, a, b, rng) {
  if (!isAdjacent(a, b)) return null;
  const ta = board.cells[a], tb = board.cells[b];
  if (!ta || !tb) return null;
  board.cascade = 1;

  const bothSpecial = ta.special && tb.special;
  const chakriInvolved = ta.special === CHAKRI || tb.special === CHAKRI;

  if (bothSpecial || chakriInvolved) {
    const seedClear = [];
    const seedActivated = [];
    const kinds = [ta.special, tb.special];
    const addTypeCells = (type) => {
      for (let i = 0; i < SIZE * SIZE; i++) {
        if (board.cells[i]?.type === type) seedClear.push(i);
      }
    };
    if (kinds[0] === CHAKRI && kinds[1] === CHAKRI) {
      for (let i = 0; i < SIZE * SIZE; i++) seedClear.push(i);
      seedActivated.push({ i: a, kind: CHAKRI }, { i: b, kind: CHAKRI });
    } else if (chakriInvolved) {
      const [ci, oi] = ta.special === CHAKRI ? [a, b] : [b, a];
      const other = board.cells[oi];
      seedClear.push(ci, oi);
      seedActivated.push({ i: ci, kind: CHAKRI });
      if (other.special) {
        // chakri + rocket/anaar: clear that type, then let the special fire too
        addTypeCells(other.type);
        seedActivated.push({ i: oi, kind: other.special });
        for (const j of blastCells(oi, other.special)) seedClear.push(j);
      } else {
        addTypeCells(other.type);
      }
    } else {
      // two non-chakri specials — combo at the target cell b
      const [br, bc] = rc(b);
      const rockets = kinds.filter(k => k === ROCKET_H || k === ROCKET_V).length;
      const anaars = kinds.filter(k => k === ANAAR).length;
      seedClear.push(a, b);
      if (rockets === 2) {
        seedActivated.push({ i: b, kind: ROCKET_H }, { i: b, kind: ROCKET_V });
        for (const j of blastCells(b, ROCKET_H)) seedClear.push(j);
        for (const j of blastCells(b, ROCKET_V)) seedClear.push(j);
      } else if (anaars === 2) {
        seedActivated.push({ i: a, kind: ANAAR }, { i: b, kind: ANAAR });
        for (let y = br - 2; y <= br + 2; y++) for (let x = bc - 2; x <= bc + 2; x++) {
          if (onBoard(y, x)) seedClear.push(idx(y, x));
        }
      } else {
        // rocket + anaar: three rows + three cols through b
        seedActivated.push({ i: a, kind: ta.special }, { i: b, kind: tb.special });
        for (let y = br - 1; y <= br + 1; y++) {
          if (y < 0 || y >= SIZE) continue;
          for (let x = 0; x < SIZE; x++) seedClear.push(idx(y, x));
        }
        for (let x = bc - 1; x <= bc + 1; x++) {
          if (x < 0 || x >= SIZE) continue;
          for (let y = 0; y < SIZE; y++) seedClear.push(idx(y, x));
        }
      }
    }
    return buildStep(board, rng, { seedClear, seedActivated, swapped: [a, b] });
  }

  // Normal swap: must create a match.
  const cells = board.cells;
  [cells[a], cells[b]] = [cells[b], cells[a]];
  const matches = findMatches(board);
  if (matches.length === 0) {
    [cells[a], cells[b]] = [cells[b], cells[a]];
    return null;
  }
  return buildStep(board, rng, { matches, swapCells: [a, b], swapped: [a, b] });
}

export function resolveStep(board, rng) {
  const matches = findMatches(board);
  if (matches.length === 0) return null;
  return buildStep(board, rng, { matches });
}

export function ensurePlayable(board, rng) {
  if (findValidMoves(board).length) return { shuffled: false };
  const bag = board.cells.map(t => t);
  for (let attempt = 0; attempt < 100; attempt++) {
    // Constructive re-deal: place shuffled tiles avoiding instant 3-runs.
    const pool = bag.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const placed = new Array(SIZE * SIZE).fill(null);
    let ok = true;
    for (let r = 0; r < SIZE && ok; r++) {
      for (let c = 0; c < SIZE && ok; c++) {
        const fits = (t) =>
          !(c >= 2 && placed[idx(r, c - 1)]?.type === t.type && placed[idx(r, c - 2)]?.type === t.type) &&
          !(r >= 2 && placed[idx(r - 1, c)]?.type === t.type && placed[idx(r - 2, c)]?.type === t.type);
        let pos = pool.findIndex(t => t.type === 'any' || fits(t));
        if (pos === -1) { ok = false; break; }
        placed[idx(r, c)] = pool[pos];
        pool.splice(pos, 1);
      }
    }
    if (!ok) continue;
    const trial = { ...board, cells: placed };
    if (findMatches(trial).length === 0 && findValidMoves(trial).length > 0) {
      board.cells = placed;
      return { shuffled: true };
    }
  }
  throw new Error('could not reshuffle into a playable board');
}
