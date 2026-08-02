// Barfi Blast — renderer, input, animation orchestration, progression.

import {
  SIZE, TYPES, ROCKET_H, ROCKET_V, ANAAR, CHAKRI,
  makeRng, createBoard, idx, rc, isValidSwap,
  findValidMoves, performSwap, resolveStep, ensurePlayable,
} from './board.js';
import { generateCertified, makeGenerosity, evaluateSwap, spectacleScore } from './director.js';
import { LEVELS, chashniArray } from './levels.js';
import { tileSVG, sweetSVG, SWEET_COLORS, SWEET_NAMES, injectDefs, chashniSwatchSVG } from './sweets.js';
import { sfx, initAudio, setMuted, isMuted } from './audio.js';

const nf = new Intl.NumberFormat('en-IN');
const $ = (s) => document.querySelector(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const COMBO_WORDS = ['Wah!', 'Shabash!', 'Kya baat hai!', 'Ek number!', 'Zabardast!', 'DHAMAKEDAAR!', 'FULL PAISA VASOOL!'];

// ---------- persistence ----------
const STORE_KEY = 'barfiBlast.v1';
const LEGACY_KEY = 'mithaiCrush.v1'; // pre-rebrand progress — migrated, never deleted
function loadProgress() {
  try {
    let raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        raw = legacy;
        try { localStorage.setItem(STORE_KEY, legacy); } catch { /* best effort */ }
      }
    }
    const p = JSON.parse(raw) || {};
    return { unlocked: 1, stars: {}, best: {}, muted: false, sawTutorial: false, seen: {}, ...p, seen: { ...(p.seen || {}) } };
  } catch { return { unlocked: 1, stars: {}, best: {}, muted: false, sawTutorial: false, seen: {} }; }
}
function saveProgress() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); }
  catch { /* storage unavailable (private mode / sandboxed embed) — play on without saving */ }
}
const progress = loadProgress();

// ---------- state ----------
const state = {
  level: null, board: null, rng: makeRng(Date.now() % 2 ** 31),
  score: 0, movesLeft: 0, collected: {},
  busy: false, selected: null, over: false,
  hintTimer: null, hintEls: [], golden: null,
  nukeOn: false, nukeEls: [], nukeTag: null,
};

const els = {
  board: $('#board'), chashni: $('#chashni-layer'), fx: $('#fx-layer'),
  combo: $('#combo-layer'), overlay: $('#overlay'), card: $('#overlay-card'),
  petals: $('#petal-layer'),
  score: $('#hud-score'), moves: $('#hud-moves'), goal: $('#hud-goal'),
  city: $('#hud-city'), levelno: $('#hud-levelno'),
  starFill: $('#star-fill'),
};
const tileEls = new Map(); // tile id -> element

// ---------- screens ----------
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
  if (name === 'map') renderMap();
  if (name === 'title') refreshTitle();
}
document.querySelectorAll('[data-nav]').forEach((b) =>
  b.addEventListener('click', () => {
    initAudio(); sfx.select();
    const leavingLevel = b.dataset.nav === 'map' && b.closest('#screen-game') &&
      state.level && !state.over && state.movesLeft < state.level.moves;
    if (leavingLevel) { showQuitConfirm(); return; }
    els.overlay.classList.add('hidden');
    showScreen(b.dataset.nav);
  }));

function showQuitConfirm() {
  const wasBusy = state.busy; // a cascade may still be resolving underneath
  state.busy = true;
  els.card.innerHTML = `
    <h2>Leave level?</h2>
    <p class="ov-sub">Progress in this level will be lost.</p>
    <div class="ov-buttons">
      <button class="btn btn-gold btn-mid" id="btn-stay">Keep Playing</button>
      <button class="btn btn-plain btn-mid" id="btn-leave">Leave</button>
    </div>`;
  els.overlay.classList.remove('hidden');
  $('#btn-stay').addEventListener('click', () => {
    els.overlay.classList.add('hidden');
    state.busy = wasBusy;
    if (!wasBusy) armHint();
  });
  $('#btn-leave').addEventListener('click', () => {
    state.over = true; // stops any in-flight cascade from popping a win/lose card over the map
    els.overlay.classList.add('hidden');
    showScreen('map');
  });
}

function refreshTitle() {
  const btn = $('#btn-play');
  const line = $('#title-progress');
  const starSum = LEVELS.reduce((s, l) => s + (progress.stars[l.id] || 0), 0);
  const allDone = LEVELS.every((l) => (progress.stars[l.id] || 0) > 0);
  if (allDone) {
    btn.innerHTML = 'PLAY <span class="btn-arrow">▶</span>';
    line.textContent = `All 9 cities cleared · ★ ${starSum}/27`;
  } else if (progress.unlocked > 1) {
    const next = LEVELS.find((l) => l.id === progress.unlocked);
    btn.innerHTML = 'CONTINUE <span class="btn-arrow">▶</span>';
    line.textContent = next ? `Next stop: ${next.city} · Level ${next.id}` : '';
  } else {
    btn.innerHTML = 'PLAY <span class="btn-arrow">▶</span>';
    line.textContent = '';
  }
}

// ---------- mute ----------
setMuted(progress.muted);
function syncMuteButtons() {
  document.querySelectorAll('.btn-mute').forEach((b) => {
    b.textContent = isMuted() ? '🔇' : '🔊';
    b.setAttribute('aria-label', isMuted() ? 'Sound off' : 'Sound on');
  });
}
document.querySelectorAll('.btn-mute').forEach((b) =>
  b.addEventListener('click', () => {
    initAudio();
    setMuted(!isMuted());
    progress.muted = isMuted(); saveProgress(); syncMuteButtons();
    if (!isMuted()) sfx.select();
  }));
syncMuteButtons();

// ---------- title decorations ----------
function decorateTitle() {
  $('#title-sweets-top').innerHTML =
    `<svg viewBox="0 0 100 100">${sweetSVG('jalebi')}</svg>` +
    `<svg viewBox="0 0 100 100">${sweetSVG('laddoo')}</svg>` +
    `<svg viewBox="0 0 100 100">${sweetSVG('jamun')}</svg>`;
}
function decorateToran() {
  const svg = document.querySelector('.toran');
  if (!svg.clientHeight) return; // hidden (rail mode) — skip; resize back re-tiles it
  const path = svg.querySelector('.toran-string');
  const group = svg.querySelector('.toran-items');
  // Size the viewBox to the strip's real aspect ratio so nothing is ever sliced
  // off vertically (a fixed 800-wide drawing over-zooms and clips on wide screens),
  // and tile seamless 400-unit swags across the full width.
  const h = svg.clientHeight || 58;
  const W = Math.max(800, Math.ceil((window.innerWidth * 64) / h));
  svg.setAttribute('viewBox', `0 0 ${W} 64`);
  let d = 'M-10 22';
  for (let x = 0; x < W + 400; x += 400) {
    d += ` Q ${x + 100} 50 ${x + 200} 26 Q ${x + 300} 4 ${x + 400} 22`;
  }
  path.setAttribute('d', d);
  const len = path.getTotalLength();
  let out = '';
  for (let t = 14; t < len; t += 40) {
    const p = path.getPointAtLength(t);
    out += `<use href="#patta" x="0" y="0" transform="translate(${(p.x - 4).toFixed(1)} ${(p.y + 2).toFixed(1)}) rotate(8)"/>`;
    out += `<use href="#patta" x="0" y="0" transform="translate(${(p.x + 4).toFixed(1)} ${(p.y + 2).toFixed(1)}) rotate(-8)"/>`;
  }
  for (let t = 30; t < len; t += 40) {
    const p = path.getPointAtLength(t);
    out += `<use href="#genda" transform="translate(${p.x.toFixed(1)} ${(p.y + 6).toFixed(1)})"/>`;
  }
  group.innerHTML = out;
}
let toranResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(toranResizeTimer);
  toranResizeTimer = setTimeout(decorateToran, 150);
});

// ---------- map ----------
function goalText(level) {
  const g = level.goal;
  const parts = [];
  if (g.score) parts.push(`Score ${nf.format(g.score)} points`);
  if (g.collect) for (const [t, n] of Object.entries(g.collect)) parts.push(`${SWEET_NAMES[t]} × ${n}`);
  if (g.chashni) parts.push('Clear the chashni glaze');
  return parts.join(' + ');
}
function renderMap() {
  const ol = $('#yatra');
  ol.innerHTML = '';
  for (const level of LEVELS) {
    const li = document.createElement('li');
    const stars = progress.stars[level.id] || 0;
    const locked = level.id > progress.unlocked;
    li.className = 'ynode' + (locked ? ' locked' : '') + (level.id === progress.unlocked ? ' current' : '');
    li.innerHTML = `
      <div class="medal">${locked ? '🔒' : level.emblem}</div>
      <div class="info">
        <div class="city">${level.city}<small>${level.hindi}</small></div>
        <div class="lvlgoal">${goalText(level)} · ${level.moves} moves</div>
      </div>
      <div class="stars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3 - stars)}</span></div>`;
    if (!locked) li.addEventListener('click', () => { initAudio(); sfx.swapTick(); startLevel(level); });
    ol.appendChild(li);
  }
  const done = LEVELS.filter((l) => (progress.stars[l.id] || 0) > 0).length;
  const starSum = LEVELS.reduce((s, l) => s + (progress.stars[l.id] || 0), 0);
  $('#map-sub').innerHTML = `A sweet tour of India — ${done}/9 cities · <span class="star">★</span> ${starSum}/27`;
  requestAnimationFrame(() => ol.querySelector('.ynode.current')?.scrollIntoView({ block: 'center' }));
}

// ---------- HUD ----------
function goalHTML() {
  const g = state.level.goal;
  let html = '';
  if (g.score) {
    const done = state.score >= g.score;
    html += `<div class="goal-item ${done ? 'done' : ''}"><span class="goal-icon">🎯</span><span class="goal-count">${nf.format(g.score)}</span></div>`;
  }
  if (g.collect) {
    for (const [t, n] of Object.entries(g.collect)) {
      const have = Math.min(state.collected[t] || 0, n);
      const done = have >= n;
      html += `<div class="goal-item ${done ? 'done' : ''}"><svg viewBox="0 0 100 100">${sweetSVG(t)}</svg><span class="goal-count">${have}/${n}</span></div>`;
    }
  }
  if (g.chashni) {
    const left = state.board ? state.board.chashni.filter((v) => v > 0).length : 0;
    const done = left === 0;
    html += `<div class="goal-item ${done ? 'done' : ''}">${chashniSwatchSVG()}<span class="goal-count">${done ? 'all clear' : left + ' left'}</span></div>`;
  }
  return html;
}
function updateHUD() {
  els.score.textContent = nf.format(state.score);
  els.moves.textContent = state.movesLeft;
  els.moves.classList.toggle('low', state.movesLeft <= 5 && !state.over);
  els.goal.innerHTML = goalHTML();
  const [s1, s2, s3] = state.level.starScores;
  const frac = Math.min(state.score / s3, 1);
  els.starFill.style.width = `${(frac * 100).toFixed(1)}%`;
  document.querySelector('.track-star.s1').classList.toggle('lit', state.score >= s1);
  document.querySelector('.track-star.s2').classList.toggle('lit', state.score >= s2);
  document.querySelector('.track-star.s3').classList.toggle('lit', state.score >= s3);
}
function starsEarned() {
  const [s1, s2, s3] = state.level.starScores;
  return state.score >= s3 ? 3 : state.score >= s2 ? 2 : state.score >= s1 ? 1 : 1;
}

// ---------- board rendering ----------
function cellPct(v) { return `${v}`; }
function makeTileEl(tile, r, c) {
  const el = document.createElement('div');
  el.className = 'tile';
  el.style.setProperty('--r', cellPct(r));
  el.style.setProperty('--c', cellPct(c));
  el.dataset.id = tile.id;
  el.dataset.type = tile.type;
  if (tile.special) el.dataset.special = tile.special;
  el.innerHTML = `<div class="tile-inner">${tileSVG(tile)}</div>`;
  attachInput(el);
  tileEls.set(tile.id, el);
  els.board.appendChild(el);
  return el;
}
function renderBoard() {
  els.board.innerHTML = '';
  tileEls.clear();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const t = state.board.cells[idx(r, c)];
    if (t) makeTileEl(t, r, c);
  }
}
function renderChashni() {
  els.chashni.innerHTML = '';
  for (let i = 0; i < SIZE * SIZE; i++) {
    const d = document.createElement('div');
    d.className = 'cwell' + (state.board.chashni[i] > 0 ? ' chashni' : '');
    d.dataset.i = i;
    els.chashni.appendChild(d);
  }
}

// ---------- input ----------
let pointer = null; // { id, startX, startY, cellIdx }
function attachInput(el) {
  el.addEventListener('pointerdown', (e) => {
    if (state.busy || state.over) return;
    initAudio();
    const cell = elCell(el);
    pointer = { id: e.pointerId, startX: e.clientX, startY: e.clientY, cellIdx: cell, el };
    try { el.setPointerCapture?.(e.pointerId); } catch { /* inactive pointer id — capture is best-effort */ }
  });
  el.addEventListener('pointermove', (e) => {
    if (!pointer || pointer.id !== e.pointerId || state.busy || state.over) return;
    const target = swipeTarget(pointer, e.clientX, e.clientY);
    if (target === undefined) return; // hasn't travelled far enough yet
    const from = pointer.cellIdx;
    pointer = null;
    if (target !== null) attemptSwap(from, target);
  });
  el.addEventListener('pointerup', (e) => {
    if (!pointer || pointer.id !== e.pointerId) { pointer = null; return; }
    const ptr = pointer;
    pointer = null;
    if (state.busy || state.over) return;
    // Fast flicks can reach pointerup before any pointermove crossed the
    // threshold — decide swipe-vs-tap from the final position, not just moves.
    const target = swipeTarget(ptr, e.clientX, e.clientY);
    if (target !== undefined) {
      if (target !== null) attemptSwap(ptr.cellIdx, target);
      return;
    }
    handleTap(ptr.cellIdx);
  });
  el.addEventListener('pointercancel', () => { pointer = null; });
}

// undefined = not a swipe (too short); null = swipe off the board; number = target cell
function swipeTarget(ptr, x, y) {
  const dx = x - ptr.startX;
  const dy = y - ptr.startY;
  const cellPx = els.board.clientWidth / SIZE;
  const threshold = cellPx * 0.3;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return undefined;
  const [r, c] = rc(ptr.cellIdx);
  if (Math.abs(dx) > Math.abs(dy)) {
    const nc = c + Math.sign(dx);
    return nc >= 0 && nc < SIZE ? idx(r, nc) : null;
  }
  const nr = r + Math.sign(dy);
  return nr >= 0 && nr < SIZE ? idx(nr, c) : null;
}
function elCell(el) {
  // derive current grid cell from CSS vars (they always hold the logical position)
  return idx(parseInt(el.style.getPropertyValue('--r'), 10), parseInt(el.style.getPropertyValue('--c'), 10));
}
function tileAt(i) { return state.board.cells[i]; }
function elFor(i) { const t = tileAt(i); return t ? tileEls.get(t.id) : null; }

function handleTap(cell) {
  clearHint();
  const sel = state.selected;
  if (sel === null) { selectCell(cell); return; }
  if (sel === cell) { deselect(); return; }
  const [ar, ac] = rc(sel), [br, bc] = rc(cell);
  if (Math.abs(ar - br) + Math.abs(ac - bc) === 1) {
    deselect();
    attemptSwap(sel, cell);
  } else {
    deselect();
    selectCell(cell);
  }
}
function selectCell(i) {
  state.selected = i;
  elFor(i)?.classList.add('selected');
  sfx.select();
}
function deselect() {
  if (state.selected !== null) elFor(state.selected)?.classList.remove('selected');
  state.selected = null;
}

// ---------- swap + resolve ----------
function setPos(el, i) {
  const [r, c] = rc(i);
  el.style.setProperty('--r', cellPct(r));
  el.style.setProperty('--c', cellPct(c));
}
async function attemptSwap(a, b) {
  if (state.busy || state.over) return;
  state.busy = true;
  clearHint(); deselect(); clearNuke();

  const elA = elFor(a), elB = elFor(b);
  if (!elA || !elB) { state.busy = false; return; }
  elA.classList.add('swappingz');
  setPos(elA, b); setPos(elB, a);
  sfx.swapTick();
  await wait(270);

  // Golden replay: if this is the armed certified swap, resolve the whole chain with
  // the certification seed — reproducing the searched spectacle exactly.
  const g = state.golden;
  const isGolden = g && g.armed && ((a === g.a && b === g.b) || (a === g.b && b === g.a));
  const rng = isGolden ? makeRng(g.seed) : state.rng;

  const step = performSwap(state.board, a, b, rng);
  if (!step) {
    setPos(elA, a); setPos(elB, b);
    elA.classList.add('shake'); elB.classList.add('shake');
    sfx.invalid();
    await wait(420);
    elA.classList.remove('shake', 'swappingz'); elB.classList.remove('shake');
    state.busy = false;
    armHint();
    return;
  }
  if (g) g.armed = false; // any successful swap diverges the board from certification
  elA.classList.remove('swappingz');
  state.movesLeft--;
  updateHUD();

  let n = 1;
  await animateStep(step, n);
  let next;
  while ((next = resolveStep(state.board, rng))) {
    n++;
    await animateStep(next, n);
  }
  await settleTurn();
}

async function settleTurn() {
  if (state.over) return; // player left the level mid-cascade — never pop a card over the map
  updateHUD();
  if (goalsMet()) { await winFlow(); return; }
  if (state.movesLeft <= 0) { loseFlow(); return; }
  const res = ensurePlayable(state.board, state.rng);
  if (res.shuffled) {
    sfx.shuffle();
    toast('No moves left — reshuffling!', true);
    await wait(700);
    renderBoard();
  }
  state.busy = false;
  armHint();
}

function goalsMet() {
  const g = state.level.goal;
  if (g.score && state.score < g.score) return false;
  if (g.collect) for (const [t, nn] of Object.entries(g.collect)) if ((state.collected[t] || 0) < nn) return false;
  if (g.chashni && state.board.chashni.some((v) => v > 0)) return false;
  return true;
}

// ---------- step animation ----------
function boardRect() { return els.board.getBoundingClientRect(); }
function cellCenter(i) {
  const [r, c] = rc(i);
  const bw = els.board.clientWidth / SIZE;
  return { x: (c + 0.5) * bw, y: (r + 0.5) * bw };
}
function sparkBurst(i, colors, count = 10, dist = 60) {
  const { x, y } = cellCenter(i);
  for (let k = 0; k < count; k++) {
    const s = document.createElement('div');
    s.className = 'spark';
    const ang = (Math.PI * 2 * k) / count + Math.random() * 0.5;
    const d = dist * (0.6 + Math.random() * 0.7);
    s.style.left = `${x - 4}px`; s.style.top = `${y - 4}px`;
    s.style.background = colors[k % colors.length];
    s.style.setProperty('--dx', `${Math.cos(ang) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * d}px`);
    els.fx.appendChild(s);
    setTimeout(() => s.remove(), 600);
  }
}
function beam(kind, i) {
  const [r, c] = rc(i);
  const el = document.createElement('div');
  el.className = 'beam';
  if (kind === ROCKET_H) {
    el.style.left = '0'; el.style.right = '0';
    el.style.top = `${r * 12.5 + 3.5}%`; el.style.height = '5.5%';
  } else {
    el.style.top = '0'; el.style.bottom = '0';
    el.style.left = `${c * 12.5 + 3.5}%`; el.style.width = '5.5%';
    el.style.background = 'linear-gradient(180deg, transparent, rgba(255,224,138,.95), rgba(255,153,51,.9), rgba(255,224,138,.95), transparent)';
  }
  els.fx.appendChild(el);
  setTimeout(() => el.remove(), 500);
}
function floatie(i, text) {
  const { x, y } = cellCenter(i);
  const f = document.createElement('div');
  f.className = 'floatie';
  f.textContent = text;
  f.style.left = `${x - 20}px`; f.style.top = `${y - 14}px`;
  els.fx.appendChild(f);
  setTimeout(() => f.remove(), 900);
}
function toast(text, small = false) {
  const t = document.createElement('div');
  t.className = 'combo-toast' + (small ? ' toast-small' : '');
  t.textContent = text;
  els.combo.appendChild(t);
  setTimeout(() => t.remove(), 1150);
}

async function animateStep(step, n) {
  // specials fire
  const sparkCols = ['#FFD700', '#FF9933', '#E91E63', '#FFF3DC'];
  for (const a of step.activated) {
    if (a.kind === ROCKET_H || a.kind === ROCKET_V) { beam(a.kind, a.i); sfx.rocket(); }
    else if (a.kind === ANAAR) { sparkBurst(a.i, sparkCols, 14, 80); sfx.anaar(); }
    else if (a.kind === CHAKRI) { sparkBurst(a.i, ['#FF9933', '#FFD700', '#E91E63', '#009688', '#7C3AED'], 22, 130); sfx.chakri(); }
  }
  if (step.cleared.length) sfx.pop(n - 1);

  // combo words
  if (n >= 2) toast(COMBO_WORDS[Math.min(n - 2, COMBO_WORDS.length - 1)]);
  else if (step.cleared.length >= 10) toast(COMBO_WORDS[0]);

  // score floatie near the action
  if (step.points) {
    const at = step.swapped ? step.swapped[1] : step.cleared[0] ?? 0;
    floatie(at, `+${nf.format(step.points)}`);
    state.score += step.points;
  }

  // collected
  for (const [t, cnt] of Object.entries(step.collected)) {
    state.collected[t] = (state.collected[t] || 0) + cnt;
  }

  // pop cleared tiles (elements matched by id via current board is wrong — they're removed; use snapshot)
  const popped = [];
  for (const i of step.cleared) {
    // cleared tiles are already off the logical board; find their elements by on-screen cell
    const el = [...tileEls.values()].find((e) => elCell(e) === i && !e.classList.contains('popping'));
    if (el) { el.classList.add('popping'); popped.push(el); }
  }
  // small sparkle on each cleared cell
  if (step.cleared.length <= 12) {
    for (const i of step.cleared.slice(0, 6)) sparkBurst(i, sparkCols, 5, 30);
  }

  // chashni dissolve
  for (const i of step.chashniCleared) {
    const w = els.chashni.children[i];
    if (w && w.classList.contains('chashni')) {
      w.classList.add('dissolving');
      setTimeout(() => { w.classList.remove('chashni', 'dissolving'); }, 500);
    }
  }

  await wait(320);
  for (const el of popped) {
    tileEls.forEach((v, k) => { if (v === el) tileEls.delete(k); });
    el.remove();
  }

  // created specials appear (the tile they replace is consumed by the match)
  const SPECIAL_INTRO = {
    rocket: 'Rocket! Clears the whole line',
    anaar: 'Anaar! Blasts everything around it',
    chakri: 'Chakri! Swap it with any sweet',
  };
  for (const cr of step.created) {
    const [r, c] = rc(cr.i);
    const stale = [...tileEls.entries()].find(([, e]) => elCell(e) === cr.i);
    if (stale) { stale[1].remove(); tileEls.delete(stale[0]); }
    const el = makeTileEl(cr.tile, r, c);
    el.classList.add('spawnin', 'boomflash');
    setTimeout(() => el.classList.remove('spawnin', 'boomflash'), 400);
    // name each special once, at the moment the player first earns it
    const key = cr.tile.special === ANAAR ? 'anaar' : cr.tile.special === CHAKRI ? 'chakri' : 'rocket';
    if (!progress.seen[key]) {
      progress.seen[key] = true;
      saveProgress();
      toast(SPECIAL_INTRO[key], true);
    }
  }
  if (step.created.length) await wait(140);

  // falls
  for (const f of step.falls) {
    const el = tileEls.get(f.id);
    if (el) setPos(el, f.to);
  }

  // spawns: drop in from above
  const perCol = {};
  for (const sp of step.spawns) {
    const [r, c] = rc(sp.to);
    (perCol[c] ||= []).push({ ...sp, r });
  }
  for (const [c, list] of Object.entries(perCol)) {
    const count = list.length;
    for (const sp of list) {
      const el = makeTileEl(sp.tile, sp.r - count, Number(c));
      el.getBoundingClientRect(); // force reflow so the drop transitions
      setPos(el, sp.to);
    }
  }
  await wait(step.falls.length || step.spawns.length ? 330 : 60);

  // reconciliation sweep: drop any element whose tile no longer exists on the board
  const liveIds = new Set(state.board.cells.filter(Boolean).map((t) => t.id));
  for (const [id, el] of [...tileEls.entries()]) {
    if (!liveIds.has(id)) { el.remove(); tileEls.delete(id); }
  }
  updateHUD();
}

// ---------- nuke vision (secret: type "boom" during a level) ----------
function toggleNuke(force) {
  state.nukeOn = force !== undefined ? !!force : !state.nukeOn;
  console.log(state.nukeOn ? '🧨 nuke vision ON' : '🧨 nuke vision off');
  if (state.nukeOn) showNuke(); else clearNuke();
}
function clearNuke() {
  for (const el of state.nukeEls) el.classList.remove('nuke');
  state.nukeEls = [];
  state.nukeTag?.remove();
  state.nukeTag = null;
}
function showNuke() {
  clearNuke();
  if (!state.nukeOn || !state.board || state.busy || state.over) return;
  if (!$('#screen-game').classList.contains('active')) return;
  let pair = null; let metrics = null; let exact = false;
  const g = state.golden;
  if (g && g.armed && isValidSwap(state.board, g.a, g.b)) {
    pair = [g.a, g.b]; metrics = g.metrics; exact = g.certified;
  } else {
    const moves = findValidMoves(state.board);
    if (!moves.length) return;
    let bestScore = -Infinity;
    for (const [a, b] of moves) {
      const m = evaluateSwap(state.board, a, b, 4242);
      const s = spectacleScore(m);
      if (s > bestScore) { bestScore = s; pair = [a, b]; metrics = m; }
    }
  }
  if (!pair || !metrics) return;
  for (const i of pair) {
    const el = elFor(i);
    if (el) { el.classList.add('nuke'); state.nukeEls.push(el); }
  }
  const { x, y } = cellCenter(Math.min(pair[0], pair[1]));
  const tag = document.createElement('div');
  tag.className = 'nuke-tag';
  tag.textContent = `☢ ×${metrics.chain} ${exact ? '' : '~'}${nf.format(metrics.points)}`;
  tag.style.left = `${x - 30}px`;
  tag.style.top = `${y - 52}px`;
  els.fx.appendChild(tag);
  state.nukeTag = tag;
}
const NUKE_CODE = 'boom';
let nukeBuffer = '';
window.addEventListener('keydown', (e) => {
  if (e.key.length !== 1) return;
  nukeBuffer = (nukeBuffer + e.key.toLowerCase()).slice(-NUKE_CODE.length);
  if (nukeBuffer === NUKE_CODE) { nukeBuffer = ''; toggleNuke(); }
});

// ---------- hints ----------
function armHint() {
  if (state.nukeOn) showNuke(); // nuke vision refreshes whenever the board settles
  clearTimeout(state.hintTimer);
  state.hintTimer = setTimeout(() => {
    if (state.busy || state.over) return;
    // Spectacle-aware steering: prefer the armed golden swap; otherwise rank all
    // valid moves by simulated outcome and pulse the best one.
    let pair = null;
    const g = state.golden;
    if (g && g.armed && isValidSwap(state.board, g.a, g.b)) {
      pair = [g.a, g.b];
    } else {
      const moves = findValidMoves(state.board);
      if (!moves.length) return;
      let bestScore = -Infinity;
      for (const [a, b] of moves) {
        const s = spectacleScore(evaluateSwap(state.board, a, b, 4242));
        if (s > bestScore) { bestScore = s; pair = [a, b]; }
      }
    }
    for (const i of pair) {
      const el = elFor(i);
      if (el) { el.classList.add('hint'); state.hintEls.push(el); }
    }
  }, 5000);
}
function clearHint() {
  clearTimeout(state.hintTimer);
  for (const el of state.hintEls) el.classList.remove('hint');
  state.hintEls = [];
  armHint();
}

// ---------- level flow ----------
function startLevel(level, { card = true } = {}) {
  state.level = level;
  state.score = 0;
  state.movesLeft = level.moves;
  state.collected = {};
  state.over = false;
  state.busy = false;
  state.selected = null;
  clearNuke();
  // Dopamine Director: on fresh entries (not replays), search for a certified opening —
  // a board whose best swap provably delivers the level's spectacle profile.
  const dcfg = level.director || {};
  const spawner = makeGenerosity(dcfg.generosity || 0);
  state.golden = null;
  let board = null;
  if (card && dcfg.opening) {
    const pack = generateCertified({
      profile: dcfg.opening,
      chashni: chashniArray(level),
      spawner,
      maxAttempts: 300,
      budgetMs: 150,
    });
    if (pack) {
      board = pack.board;
      state.golden = {
        a: pack.golden.a, b: pack.golden.b,
        seed: pack.refillSeed, metrics: pack.metrics,
        certified: pack.certified, armed: true,
      };
    }
  }
  if (!board) {
    board = createBoard({ rng: state.rng, chashni: chashniArray(level) });
    if (spawner) board.spawner = spawner;
  }
  state.board = board;
  els.city.textContent = level.city;
  els.levelno.textContent = `Level ${level.id} · ${level.hindi}`;
  renderChashni();
  renderBoard();
  updateHUD();
  showScreen('game');
  els.overlay.classList.add('hidden');
  if (!progress.sawTutorial) { showTutorial(level); }
  else if (card) { showGoalCard(level); }
  else { toast(level.intro, true); armHint(); }
}

function goalPanelHTML(level, head = 'Goal') {
  const g = level.goal;
  let rows = '';
  if (g.score) rows += `<div class="goal-panel-row"><span class="goal-icon">🎯</span><span>Score ${nf.format(g.score)} points</span></div>`;
  if (g.collect) {
    for (const [t, n] of Object.entries(g.collect)) {
      rows += `<div class="goal-panel-row"><svg viewBox="0 0 100 100">${sweetSVG(t)}</svg><span>${SWEET_NAMES[t]} × ${n}</span></div>`;
    }
  }
  if (g.chashni) {
    rows += `<div class="goal-panel-row">${chashniSwatchSVG()}<span>Clear the chashni glaze — ${(level.chashni || []).length} squares</span></div>`;
  }
  return `
  <div class="goal-panel">
    <div class="goal-panel-head">${head}</div>
    ${rows}
    <div class="goal-panel-moves">in ${level.moves} moves</div>
  </div>`;
}

function showGoalCard(level) {
  state.busy = true;
  const firstChashni = level.goal.chashni && !progress.seen.chashni;
  if (firstChashni) { progress.seen.chashni = true; saveProgress(); }
  els.card.innerHTML = `
    <h2>${level.city}</h2>
    <p class="ov-sub">Level ${level.id} · ${level.hindi}</p>
    <p class="ov-flavor">${level.intro}</p>
    ${goalPanelHTML(level)}
    ${firstChashni ? '<p class="goal-panel-new"><b>NEW — Chashni glaze:</b> the pink coating under some sweets. Match on top of it to wipe it clean.</p>' : ''}
    <div class="ov-buttons"><button id="btn-start" class="btn btn-gold btn-mid">Start</button></div>`;
  els.overlay.classList.remove('hidden');
  $('#btn-start').addEventListener('click', () => {
    els.overlay.classList.add('hidden');
    state.busy = false;
    armHint();
  });
}

function showTutorial(level) {
  state.busy = true;
  const strip = (svg) => svg.replace(/<\/?svg[^>]*>/g, '');
  els.card.innerHTML = `
    <h2>How to Play</h2>
    <div class="tut-row"><span class="tut-emoji">👆</span><span>Swipe two sweets to swap — line up <b>3 alike</b> to pop them!</span></div>
    <div class="tut-row"><svg viewBox="0 0 100 100">${strip(tileSVG({ type: 'laddoo', special: ROCKET_H }))}</svg><span><b>Match 4</b> → a Rocket — clears its whole row or column</span></div>
    <div class="tut-row"><svg viewBox="0 0 100 100">${strip(tileSVG({ type: 'barfi', special: ANAAR }))}</svg><span><b>Match an L or T</b> → an Anaar — blasts everything around it</span></div>
    <div class="tut-row"><svg viewBox="0 0 100 100">${strip(tileSVG({ type: 'any', special: CHAKRI }))}</svg><span><b>Match 5</b> → a Chakri — swap it with any sweet to clear every one of that kind</span></div>
    ${goalPanelHTML(level, `First stop: ${level.city}`)}
    <div class="ov-buttons"><button class="btn btn-gold btn-mid" id="btn-tut-go">Let's Go!</button></div>`;
  els.overlay.classList.remove('hidden');
  $('#btn-tut-go').addEventListener('click', () => {
    progress.sawTutorial = true; saveProgress();
    els.overlay.classList.add('hidden');
    state.busy = false;
    armHint();
  });
}

async function winFlow() {
  state.over = true;
  // Diwali Dhamaka: leftover moves become bonus
  if (state.movesLeft > 0) {
    toast('DIWALI DHAMAKA!');
    const iterations = Math.min(state.movesLeft, 10);
    const bonusPer = 150;
    for (let i = 0; i < iterations; i++) {
      state.movesLeft--;
      state.score += bonusPer;
      sfx.dhamaka(0);
      fwBurst(els.fx, Math.random() * els.board.clientWidth, Math.random() * els.board.clientHeight);
      updateHUD();
      await wait(150);
    }
    if (state.movesLeft > 0) {
      state.score += state.movesLeft * bonusPer;
      state.movesLeft = 0;
      updateHUD();
    }
  }
  const stars = starsEarned();
  const lv = state.level;
  progress.stars[lv.id] = Math.max(progress.stars[lv.id] || 0, stars);
  progress.best[lv.id] = Math.max(progress.best[lv.id] || 0, state.score);
  if (lv.id === progress.unlocked && progress.unlocked < LEVELS.length) progress.unlocked = lv.id + 1;
  saveProgress();
  sfx.win();
  celebration();
  await wait(600);
  const next = LEVELS.find((l) => l.id === lv.id + 1);
  const goalline = next ? 'Goal complete' : 'All 9 cities cleared — tour complete!';
  els.card.innerHTML = `
    <h2 class="ov-shout">${lv.shout}</h2>
    <p class="ov-sub">${lv.city} <small>${lv.hindi}</small> · Level ${lv.id} cleared</p>
    <div class="ov-stars">
      <span class="ov-star ${stars >= 1 ? 'lit' : ''}">★</span>
      <span class="ov-star ${stars >= 2 ? 'lit' : ''}">★</span>
      <span class="ov-star ${stars >= 3 ? 'lit' : ''}">★</span>
    </div>
    <div class="ov-score">${nf.format(state.score)}</div>
    <p class="ov-goalline">${goalline}</p>
    <div class="ov-buttons">
      ${next ? `<button class="btn btn-gold btn-mid" id="btn-next">Next: ${next.city} →</button>` : ''}
      <button class="btn btn-plain btn-mid" id="btn-retry">Replay</button>
      <button class="btn btn-plain btn-mid" id="btn-map">Map</button>
    </div>`;
  els.overlay.classList.remove('hidden');
  $('#btn-next')?.addEventListener('click', () => startLevel(next));
  $('#btn-retry').addEventListener('click', () => startLevel(lv, { card: false }));
  $('#btn-map').addEventListener('click', () => { els.overlay.classList.add('hidden'); showScreen('map'); });
}

function needLine() {
  const g = state.level.goal;
  const parts = [];
  if (g.score && state.score < g.score) parts.push(`${nf.format(g.score - state.score)} points`);
  if (g.collect) {
    for (const [t, n] of Object.entries(g.collect)) {
      const short = n - (state.collected[t] || 0);
      if (short > 0) parts.push(`${SWEET_NAMES[t]} × ${short}`);
    }
  }
  if (g.chashni) {
    const left = state.board.chashni.filter((v) => v > 0).length;
    if (left > 0) parts.push(`${left} chashni square${left === 1 ? '' : 's'}`);
  }
  return parts.length ? `Still needed: ${parts.join(' · ')}` : '';
}

function loseFlow() {
  state.over = true;
  sfx.lose();
  const lv = state.level;
  const need = needLine();
  els.card.innerHTML = `
    <h2>So close!</h2>
    <p class="ov-sub">Out of moves</p>
    ${need ? `<p class="ov-needline">${need}</p>` : ''}
    <div class="ov-score">${nf.format(state.score)}</div>
    <div class="ov-buttons">
      <button class="btn btn-gold btn-mid" id="btn-retry">Try Again</button>
      <button class="btn btn-plain btn-mid" id="btn-map">Map</button>
    </div>`;
  els.overlay.classList.remove('hidden');
  $('#btn-retry').addEventListener('click', () => startLevel(lv, { card: false }));
  $('#btn-map').addEventListener('click', () => { els.overlay.classList.add('hidden'); showScreen('map'); });
}

// ---------- celebrations ----------
function fwBurst(container, x, y) {
  const colors = ['#FFD700', '#FF9933', '#E91E63', '#14B8A6', '#FFF3DC', '#7C3AED'];
  for (let k = 0; k < 16; k++) {
    const s = document.createElement('div');
    s.className = 'fw';
    const ang = (Math.PI * 2 * k) / 16 + Math.random() * 0.4;
    const d = 50 + Math.random() * 90;
    s.style.left = `${x}px`; s.style.top = `${y}px`;
    s.style.background = colors[k % colors.length];
    s.style.boxShadow = `0 0 8px ${colors[k % colors.length]}`;
    s.style.setProperty('--dx', `${Math.cos(ang) * d}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * d}px`);
    s.style.animationDuration = `${0.6 + Math.random() * 0.5}s`;
    container.appendChild(s);
    setTimeout(() => s.remove(), 1200);
  }
}
function celebration() {
  // fireworks across screen
  const layer = els.petals;
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      fwBurst(layer, 60 + Math.random() * (window.innerWidth - 120), 80 + Math.random() * (window.innerHeight * 0.5));
      sfx.dhamaka(i % 3);
    }, i * 260);
  }
  // marigold petals
  const petalColors = ['#FF9933', '#F59E0B', '#FBBF24', '#E8730C', '#E91E63'];
  for (let i = 0; i < 44; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = petalColors[i % petalColors.length];
    p.style.setProperty('--sway', `${-60 + Math.random() * 120}px`);
    p.style.setProperty('--spin', `${360 + Math.random() * 720}deg`);
    p.style.animationDuration = `${2.4 + Math.random() * 2.2}s`;
    p.style.animationDelay = `${Math.random() * 1.4}s`;
    layer.appendChild(p);
    setTimeout(() => p.remove(), 6200);
  }
}

// ---------- boot ----------
$('#btn-play').addEventListener('click', () => {
  initAudio(); sfx.swapTick();
  showScreen('map');
});
injectDefs();
decorateTitle();
decorateToran();
refreshTitle();

// Dev/testing hook (harmless in production; enables scripted play + state inspection).
window.__barfi = {
  state, progress,
  validMoves: () => findValidMoves(state.board),
  swap: (a, b) => attemptSwap(a, b),
  startLevel: (id, opts) => startLevel(LEVELS.find((l) => l.id === id), opts),
  render: () => { renderBoard(); renderChashni(); updateHUD(); },
  settle: () => settleTurn(),
  nuke: (v) => toggleNuke(v),
  rc, idx,
};
