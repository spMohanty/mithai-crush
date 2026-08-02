// Dopamine Director — search-certified opening spectacles, spectacle scoring, and
// the refill-generosity spawner. Pure logic on top of the frozen engine in board.js:
// everything here is a function of (board state, rng seed), which is what makes the
// certified golden-swap replay exact. No DOM.

import {
  SIZE, makeRng, createBoard, findValidMoves, performSwap, resolveStep, idx,
} from './board.js';

export function cloneBoard(board) {
  return {
    cells: board.cells.map((t) => (t ? { ...t } : null)),
    chashni: board.chashni.slice(),
    types: board.types.slice(),
    nextId: board.nextId,
    cascade: board.cascade,
    spawner: board.spawner,
  };
}

// Simulate one swap to completion on a clone. null if the swap is invalid.
export function evaluateSwap(board, a, b, seed) {
  const sim = cloneBoard(board);
  const rng = makeRng(seed);
  let step = performSwap(sim, a, b, rng);
  if (!step) return null;
  const m = { chain: 0, points: 0, cleared: 0, created: 0, activated: 0 };
  while (step) {
    m.chain++;
    m.points += step.points;
    m.cleared += step.cleared.length;
    m.created += step.created.length;
    m.activated += step.activated.length;
    step = resolveStep(sim, rng);
  }
  return m;
}

export function spectacleScore(m) {
  if (!m) return -1;
  return m.points + m.chain * 500 + m.created * 800 + m.activated * 600;
}

export function meetsProfile(m, profile = {}) {
  if (!m) return false;
  if (profile.minChain && m.chain < profile.minChain) return false;
  if (profile.minPoints && m.points < profile.minPoints) return false;
  if (profile.wantSpecial && m.created < 1) return false;
  return true;
}

export function evaluateBoard(board, seed) {
  const moves = findValidMoves(board);
  let best = null;
  for (const [a, b] of moves) {
    const metrics = evaluateSwap(board, a, b, seed);
    if (!metrics) continue;
    if (!best || spectacleScore(metrics) > spectacleScore(best.metrics)) {
      best = { a, b, metrics };
    }
  }
  return { moves: moves.length, best };
}

function searchAttempt(i, { seedBase, chashni, spawner, profile }) {
  const boardSeed = (seedBase + i * 7919) >>> 0;
  const board = createBoard({ rng: makeRng(boardSeed), chashni });
  if (spawner) board.spawner = spawner;
  const refillSeed = (boardSeed ^ 0x9e3779b9) >>> 0;
  const moves = findValidMoves(board);
  let best = null;
  for (const [a, b] of moves) {
    const metrics = evaluateSwap(board, a, b, refillSeed);
    if (!metrics) continue;
    if (!best || spectacleScore(metrics) > spectacleScore(best.metrics)) {
      best = { a, b, metrics };
    }
    if (profile && meetsProfile(metrics, profile)) {
      return { board, boardSeed, refillSeed, golden: { a, b }, metrics, certified: true };
    }
  }
  if (!best) return null;
  return { board, boardSeed, refillSeed, golden: { a: best.a, b: best.b }, metrics: best.metrics, certified: false };
}

// Search seeded candidate boards for one whose best opening swap satisfies the profile.
// Never blocks play: on budget/attempt exhaustion returns the best pack found (uncertified).
export function generateCertified({
  profile = null, chashni, spawner = null,
  seedBase = Math.floor(Math.random() * 2 ** 31), maxAttempts = 200, budgetMs = 250,
} = {}) {
  const t0 = Date.now();
  let bestPack = null;
  for (let i = 0; i < maxAttempts; i++) {
    if (budgetMs && Date.now() - t0 > budgetMs) break;
    const pack = searchAttempt(i, { seedBase, chashni, spawner, profile });
    if (!pack) continue;
    if (pack.certified) return pack;
    if (!bestPack || spectacleScore(pack.metrics) > spectacleScore(bestPack.metrics)) {
      bestPack = pack;
    }
  }
  return bestPack;
}

const GENEROSITY_CAP = 0.25;

// Refill spawner: with probability min(g, cap), propose the type that completes a
// settled near-pair (extending a live cascade by one more step). Falsy = random spawn.
export function makeGenerosity(g) {
  const p = Math.min(g || 0, GENEROSITY_CAP);
  if (p <= 0) return null;
  const normal = (board, r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
    const t = board.cells[idx(r, c)];
    return t && !t.special && t.type !== 'any' ? t.type : null;
  };
  return (board, r, c, rng) => {
    if (rng() >= p) return null;
    const below1 = normal(board, r + 1, c);
    if (below1 && below1 === normal(board, r + 2, c)) return below1;
    const left1 = normal(board, r, c - 1);
    if (left1 && left1 === normal(board, r, c - 2)) return left1;
    const right1 = normal(board, r, c + 1);
    if (right1 && right1 === normal(board, r, c + 2)) return right1;
    if (left1 && left1 === normal(board, r, c + 1)) return left1;
    return null;
  };
}
