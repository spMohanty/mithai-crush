// Mithai Yatra — 9 levels across India.
// goal: { score?: number, collect?: {type: count}, chashni?: true }
// Win when every present condition is met before moves run out.

import { idx } from './board.js';

function ring(r0, c0, r1, c1) {
  const cells = [];
  for (let c = c0; c <= c1; c++) { cells.push(idx(r0, c)); cells.push(idx(r1, c)); }
  for (let r = r0 + 1; r <= r1 - 1; r++) { cells.push(idx(r, c0)); cells.push(idx(r, c1)); }
  return [...new Set(cells)];
}
function block(r0, c0, r1, c1) {
  const cells = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells.push(idx(r, c));
  return cells;
}

// Jaipur mandala: hollow 6x6 ring + centre chowk (24 cells)
const JAIPUR = [...ring(1, 1, 6, 6), ...block(3, 3, 4, 4)];
// Goa: solid 6x6 beach of syrup (36 cells)
const GOA = block(1, 1, 6, 6);
// Kashmir: two valleys + diya dots (40 cells)
const KASHMIR = [
  ...block(0, 0, 1, 7), ...block(6, 0, 7, 7),
  idx(3, 2), idx(3, 5), idx(4, 2), idx(4, 5),
  idx(2, 3), idx(2, 4), idx(5, 3), idx(5, 4),
];

export const LEVELS = [
  {
    id: 1, city: 'Mumbai', hindi: 'मुंबई', emblem: '🌊', moves: 20,
    goal: { score: 5000 },
    starScores: [5000, 9000, 14000],
    intro: 'Namaste Mumbai! Match 3 sweets — just swipe!',
    shout: 'Jhakaas!',
    director: { opening: { minChain: 4, wantSpecial: true }, generosity: 0.2 },
  },
  {
    id: 2, city: 'Delhi', hindi: 'दिल्ली', emblem: '🏛️', moves: 24,
    goal: { collect: { laddoo: 30 } },
    starScores: [4000, 8000, 12000],
    intro: "Delhi's laddoos are legendary — collect 30!",
    shout: 'Ek number!',
    director: { opening: { minChain: 3 }, generosity: 0.15 },
  },
  {
    id: 3, city: 'Jaipur', hindi: 'जयपुर', emblem: '🏰', moves: 26,
    goal: { chashni: true }, chashni: JAIPUR,
    starScores: [5000, 9000, 14000],
    intro: 'The Pink City! Clear all the chashni glaze!',
    shout: 'Wah sa!',
    director: { opening: { minChain: 3 }, generosity: 0.2 },
  },
  {
    id: 4, city: 'Kolkata', hindi: 'कोलकाता', emblem: '🌉', moves: 26,
    goal: { collect: { jamun: 40 } },
    starScores: [6000, 10000, 15000],
    intro: 'Kolkata calling! Pop 40 gulab jamuns!',
    shout: 'Darun!',
    director: { generosity: 0.12 },
  },
  {
    id: 5, city: 'Chennai', hindi: 'चेन्नई', emblem: '🏖️', moves: 26,
    goal: { score: 30000 },
    starScores: [30000, 40000, 52000],
    intro: 'Chennai Express — hit 30,000 points!',
    shout: 'Semma!',
    director: { generosity: 0.18 },
  },
  {
    id: 6, city: 'Amritsar', hindi: 'अमृतसर', emblem: '🛕', moves: 26,
    goal: { collect: { laddoo: 30, barfi: 30 } },
    starScores: [7000, 12000, 17000],
    intro: 'Amritsar! Collect laddoos AND barfis!',
    shout: 'Balle balle!',
    director: { opening: { minChain: 3 }, generosity: 0.2 },
  },
  {
    id: 7, city: 'Goa', hindi: 'गोवा', emblem: '🥥', moves: 28,
    goal: { chashni: true }, chashni: GOA,
    starScores: [8000, 13000, 19000],
    intro: 'Goa vibes! The whole beach is glazed — clean it up!',
    shout: 'Borem!',
    director: { generosity: 0.1 },
  },
  {
    id: 8, city: 'Varanasi', hindi: 'वाराणसी', emblem: '🪔', moves: 26,
    goal: { score: 32000 },
    starScores: [32000, 42000, 56000],
    intro: 'The lanes of Varanasi — 32,000 points. Ready?',
    shout: 'Bhaukaal!',
    director: { generosity: 0.12 },
  },
  {
    id: 9, city: 'Kashmir', hindi: 'कश्मीर', emblem: '🏔️', moves: 34,
    goal: { chashni: true, collect: { katli: 30 } }, chashni: KASHMIR,
    starScores: [10000, 16000, 24000],
    intro: 'Kashmir, paradise on earth! Clear the chashni, collect the katli — win it all!',
    shout: 'Wah wah!',
    director: { opening: { minChain: 4 }, generosity: 0.18 },
  },
];

export function chashniArray(level) {
  const arr = new Array(64).fill(0);
  for (const i of level.chashni || []) arr[i] = 1;
  return arr;
}
