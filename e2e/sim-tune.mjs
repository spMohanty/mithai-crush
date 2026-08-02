// Difficulty dashboard — headless plays through the real engine + director flow.
// This is the tuning instrument: edit levels.js director configs, re-run, compare.
//   node e2e/sim-tune.mjs [playsPerLevel]
import {
  makeRng, createBoard, findValidMoves, performSwap, resolveStep, ensurePlayable,
} from '../js/board.js';
import { LEVELS, chashniArray } from '../js/levels.js';
import {
  generateCertified, makeGenerosity, evaluateSwap, spectacleScore, cloneBoard,
} from '../js/director.js';

const N = Number(process.argv[2]) || 120;
const GREEDY_SAMPLE = 10; // moves fully simulated per turn for the greedy player

function goalsMet(level, sim) {
  const g = level.goal;
  if (g.score && sim.score < g.score) return false;
  if (g.collect) for (const [t, n] of Object.entries(g.collect)) if ((sim.collected[t] || 0) < n) return false;
  if (g.chashni && sim.board.chashni.some((v) => v > 0)) return false;
  return true;
}

function applyChain(sim, a, b, rng) {
  let step = performSwap(sim.board, a, b, rng);
  if (!step) return 0;
  let chain = 0;
  while (step) {
    chain++;
    sim.score += step.points;
    for (const [t, n] of Object.entries(step.collected)) sim.collected[t] = (sim.collected[t] || 0) + n;
    step = resolveStep(sim.board, rng);
  }
  return chain;
}

function playLevel(level, policy, seed) {
  const rng = makeRng(seed);
  const dcfg = level.director || {};
  const spawner = makeGenerosity(dcfg.generosity || 0);
  let board = null;
  let golden = null;
  if (dcfg.opening) {
    const pack = generateCertified({
      profile: dcfg.opening, chashni: chashniArray(level), spawner,
      seedBase: seed, maxAttempts: 300, budgetMs: 400,
    });
    if (pack) { board = pack.board; golden = pack; }
  }
  if (!board) {
    board = createBoard({ rng, chashni: chashniArray(level) });
    if (spawner) board.spawner = spawner;
  }
  const sim = { board, score: 0, collected: {} };
  let movesLeft = level.moves;
  let maxChain = 0;
  let goldenUsed = false;

  while (movesLeft > 0 && !goalsMet(level, sim)) {
    const moves = findValidMoves(sim.board);
    if (!moves.length) { try { ensurePlayable(sim.board, rng); continue; } catch { break; } }
    let pick;
    let useRng = rng;
    if (golden && !goldenUsed) {
      // both players notice the highlighted opening (mirrors the hint steering)
      pick = [golden.golden.a, golden.golden.b];
      useRng = makeRng(golden.refillSeed);
      goldenUsed = true;
    } else if (policy === 'random') {
      pick = moves[Math.floor(rng() * moves.length)];
    } else {
      // greedy over a sample of moves, judged by full-cascade simulation
      let best = null; let bestScore = -Infinity;
      const sample = moves.length <= GREEDY_SAMPLE ? moves
        : Array.from({ length: GREEDY_SAMPLE }, () => moves[Math.floor(rng() * moves.length)]);
      for (const [a, b] of sample) {
        const s = spectacleScore(evaluateSwap(sim.board, a, b, 999));
        if (s > bestScore) { bestScore = s; best = [a, b]; }
      }
      pick = best;
    }
    const chain = applyChain(sim, pick[0], pick[1], useRng);
    if (chain === 0) continue; // invalid pick (shouldn't happen) — don't burn a move
    maxChain = Math.max(maxChain, chain);
    movesLeft--;
  }
  return { won: goalsMet(level, sim), movesSpare: movesLeft, maxChain, score: sim.score };
}

console.log(`Simulating ${N} plays/level/policy…\n`);
console.log('level        policy  win%   avg spare  avg maxChain  chain>=4%');
for (const level of LEVELS) {
  for (const policy of ['greedy', 'random']) {
    let wins = 0; let spare = 0; let chains = 0; let big = 0;
    for (let i = 0; i < N; i++) {
      const r = playLevel(level, policy, i * 7919 + level.id * 101 + (policy === 'greedy' ? 0 : 500000));
      if (r.won) { wins++; spare += r.movesSpare; }
      chains += r.maxChain;
      if (r.maxChain >= 4) big++;
    }
    const winPct = ((wins / N) * 100).toFixed(0).padStart(4);
    const avgSpare = wins ? (spare / wins).toFixed(1).padStart(6) : '     -';
    console.log(
      `L${String(level.id).padEnd(2)}${level.city.padEnd(9)} ${policy.padEnd(6)} ${winPct}%  ${avgSpare}      ${(chains / N).toFixed(1).padStart(5)}      ${((big / N) * 100).toFixed(0).padStart(4)}%`
    );
  }
}
