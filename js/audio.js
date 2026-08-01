// Audio engine — real CC0 samples first, synthesized fallback second.
//
// Samples (assets/sfx/, all CC0): Kenney.nl "Interface Sounds", "Impact Sounds",
// "Music Jingles"; OpenGameArt "25 CC0 bang/firework SFX", "100 CC0 SFX" and
// "Swishes" packs. Loaded lazily on first user gesture; any sample that fails
// to load (offline, single-file bundle, blocked fetch) falls back to the synth
// version of that effect so the game is never silent.
//
// Signal graph: voice -> [dry] -> bus -> compressor -> destination
//                     \-> [send] -> convolver (generated hall) -> bus

let ctx = null;
let bus = null;
let verb = null;
let muted = false;

const BHUPALI = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]; // Sa Re Ga Pa Dha
const SA = 523.25; // C5

const SAMPLE_FILES = {
  'ui-select': 'assets/sfx/ui-select.ogg',
  swap: 'assets/sfx/swap.ogg',
  invalid: 'assets/sfx/invalid.ogg',
  pop: 'assets/sfx/pop.ogg',
  whoosh: 'assets/sfx/whoosh.wav',
  crack: 'assets/sfx/crack.ogg',
  anaar: 'assets/sfx/anaar.ogg',
  'dhamaka-1': 'assets/sfx/dhamaka-1.ogg',
  'dhamaka-2': 'assets/sfx/dhamaka-2.ogg',
  'dhamaka-3': 'assets/sfx/dhamaka-3.ogg',
  gong: 'assets/sfx/gong.ogg',
  bell: 'assets/sfx/bell.ogg',
  win: 'assets/sfx/win.ogg',
  lose: 'assets/sfx/lose.ogg',
  shuffle: 'assets/sfx/shuffle.ogg',
};
const buffers = new Map();
let loadStarted = false;

function makeImpulse(dur = 1.5, decay = 3.2) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function loadSamples() {
  if (loadStarted || !ctx) return;
  loadStarted = true;
  for (const [name, url] of Object.entries(SAMPLE_FILES)) {
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })
      .then((ab) => ctx.decodeAudioData(ab))
      .then((buf) => buffers.set(name, buf))
      .catch(() => { /* stay on synth fallback for this effect */ });
  }
}

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 18;
  comp.ratio.value = 5;
  comp.attack.value = 0.003;
  comp.release.value = 0.22;

  const master = ctx.createGain();
  master.gain.value = 0.5;

  bus = ctx.createGain();
  bus.connect(comp);
  comp.connect(master);
  master.connect(ctx.destination);

  verb = ctx.createConvolver();
  verb.buffer = makeImpulse();
  const verbReturn = ctx.createGain();
  verbReturn.gain.value = 0.7;
  verb.connect(verbReturn);
  verbReturn.connect(bus);

  loadSamples();
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }
export function getAudioGraph() { return { ctx, bus }; }
export function loadedSamples() { return [...buffers.keys()]; }

const now = () => ctx.currentTime;

function route(g, wet = 0) {
  g.connect(bus);
  if (wet > 0) {
    const send = ctx.createGain();
    send.gain.value = wet;
    g.connect(send);
    send.connect(verb);
  }
}

function env(g, t0, attack, decay, peak = 1) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

// ---- sample player -------------------------------------------------------

function play(name, { rate = 1, gain = 1, delay = 0, wet = 0.15, cutAfter = null, jitter = 0.03 } = {}) {
  const buf = buffers.get(name);
  if (!ctx || muted || !buf) return false;
  const t0 = now() + delay;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * jitter);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  if (cutAfter) {
    g.gain.setValueAtTime(gain, t0 + cutAfter);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + cutAfter + 0.09);
  }
  src.connect(g);
  route(g, wet);
  src.start(t0);
  if (cutAfter) src.stop(t0 + cutAfter + 0.14);
  return true;
}

// ---- synth voices (fallback engine + sweetener layers) --------------------

function tone({ type = 'sine', freq = 440, to = null, dur = 0.15, peak = 0.4, delay = 0, wet = 0.12, detune = 6, pair = true }) {
  if (!ctx || muted) return;
  const t0 = now() + delay;
  const g = ctx.createGain();
  env(g, t0, 0.006, dur, peak);
  route(g, wet);
  const voices = pair ? [-detune / 2, detune / 2] : [0];
  for (const cents of voices) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
    o.detune.value = cents;
    o.connect(g);
    o.start(t0); o.stop(t0 + dur + 0.08);
  }
}

function noise({ dur = 0.2, freq = 800, q = 1, peak = 0.4, delay = 0, sweepTo = null, type = 'bandpass', wet = 0.1 }) {
  if (!ctx || muted) return;
  const t0 = now() + delay;
  const len = Math.max(1, Math.ceil(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t0);
  f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const g = ctx.createGain();
  env(g, t0, 0.004, dur, peak);
  src.connect(f); f.connect(g);
  route(g, wet);
  src.start(t0);
}

function bell({ freq = 880, ratio = 2.76, index = 180, dur = 0.6, peak = 0.3, delay = 0, wet = 0.35, bend = null }) {
  if (!ctx || muted) return;
  const t0 = now() + delay;
  const car = ctx.createOscillator();
  car.frequency.setValueAtTime(freq, t0);
  if (bend) car.frequency.exponentialRampToValueAtTime(freq * bend, t0 + dur);
  const mod = ctx.createOscillator();
  mod.frequency.value = freq * ratio;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(index, t0);
  mg.gain.exponentialRampToValueAtTime(0.5, t0 + dur * 0.8);
  mod.connect(mg); mg.connect(car.frequency);
  const g = ctx.createGain();
  env(g, t0, 0.003, dur, peak);
  car.connect(g);
  route(g, wet);
  car.start(t0); car.stop(t0 + dur + 0.1);
  mod.start(t0); mod.stop(t0 + dur + 0.1);
}

function thump({ freq = 170, to = 55, dur = 0.28, peak = 0.55, delay = 0, slap = 0.12 }) {
  tone({ type: 'sine', freq, to, dur, peak, delay, wet: 0.08, pair: false });
  if (slap) noise({ dur: 0.03, freq: 2400, q: 0.7, peak: slap, delay, type: 'highpass', wet: 0 });
}

function crackle({ count = 8, span = 0.5, delay = 0.06, peak = 0.16 }) {
  for (let k = 0; k < count; k++) {
    noise({
      dur: 0.025 + Math.random() * 0.03,
      freq: 2200 + Math.random() * 4500,
      q: 2.5,
      peak: peak * (0.5 + Math.random() * 0.8),
      delay: delay + Math.pow(Math.random(), 1.6) * span,
      type: 'bandpass',
      wet: 0.25,
    });
  }
}

function scaleNote(n) {
  const oct = Math.floor(n / BHUPALI.length);
  return SA * BHUPALI[n % BHUPALI.length] * Math.pow(2, Math.min(oct, 2));
}
function scaleRate(n) {
  const oct = Math.floor(n / BHUPALI.length);
  return BHUPALI[n % BHUPALI.length] * Math.pow(2, Math.min(oct, 1));
}

// ---- public effects: sample first, synth fallback -------------------------

export const sfx = {
  select() {
    if (play('ui-select', { gain: 0.5, wet: 0.04, jitter: 0.02 })) return;
    noise({ dur: 0.02, freq: 3200, q: 1, peak: 0.1, type: 'highpass', wet: 0 });
    tone({ type: 'triangle', freq: 840, dur: 0.05, peak: 0.12, wet: 0.05, pair: false });
  },
  swapTick() {
    if (play('swap', { gain: 0.7, wet: 0.06 })) return;
    noise({ dur: 0.09, freq: 900, sweepTo: 2600, q: 1.4, peak: 0.16, wet: 0.06 });
    tone({ type: 'triangle', freq: 480, to: 640, dur: 0.07, peak: 0.16, wet: 0.05 });
  },
  invalid() {
    if (play('invalid', { gain: 0.75, wet: 0.1, jitter: 0.01 })) return;
    thump({ freq: 130, to: 90, dur: 0.09, peak: 0.3, slap: 0.05 });
    thump({ freq: 110, to: 75, dur: 0.12, peak: 0.32, delay: 0.09, slap: 0.05 });
  },
  pop(n = 0) {
    const f = scaleNote(n);
    if (play('pop', { rate: scaleRate(n), gain: 0.7, wet: 0.12 })) {
      // faint bell sparkle rides on top of the real plop
      bell({ freq: f * 2, ratio: 3.01, index: 60, dur: 0.14, peak: 0.05, wet: 0.3 });
      return;
    }
    noise({ dur: 0.018, freq: 4200, q: 0.8, peak: 0.15, type: 'highpass', wet: 0 });
    tone({ type: 'triangle', freq: f, to: f * 1.22, dur: 0.12, peak: 0.3, wet: 0.14 });
    tone({ type: 'sine', freq: f / 2, dur: 0.1, peak: 0.14, wet: 0.06, pair: false });
    bell({ freq: f * 2, ratio: 3.01, index: 60, dur: 0.16, peak: 0.07, wet: 0.3 });
  },
  rocket() {
    if (play('whoosh', { rate: 0.82, gain: 0.9, wet: 0.2 })) {
      play('crack', { delay: 0.26, gain: 0.7, cutAfter: 0.42, wet: 0.3 });
      return;
    }
    noise({ dur: 0.38, freq: 420, sweepTo: 5200, q: 2.2, peak: 0.5, wet: 0.22 });
    tone({ type: 'sawtooth', freq: 180, to: 1150, dur: 0.34, peak: 0.1, wet: 0.15, detune: 10 });
    noise({ dur: 0.05, freq: 3000, q: 1, peak: 0.35, delay: 0.34, type: 'highpass', wet: 0.35 });
    thump({ freq: 190, to: 70, dur: 0.16, peak: 0.3, delay: 0.35, slap: 0 });
  },
  anaar() {
    if (play('anaar', { gain: 0.85, wet: 0.3, jitter: 0.02 })) {
      thump({ freq: 150, to: 45, dur: 0.3, peak: 0.32, slap: 0 }); // sub-bass body under the recording
      return;
    }
    thump({ freq: 165, to: 42, dur: 0.42, peak: 0.7, slap: 0.2 });
    noise({ dur: 0.16, freq: 900, sweepTo: 180, q: 0.6, peak: 0.5, type: 'lowpass', wet: 0.25 });
    crackle({ count: 9, span: 0.55, peak: 0.18 });
  },
  chakri() {
    if (play('gong', { rate: 1.18, gain: 0.85, wet: 0.4 })) {
      for (let k = 0; k < 5; k++) {
        play('bell', { rate: scaleRate(k + 2), gain: 0.5, delay: 0.05 + k * 0.055, wet: 0.4, jitter: 0.01 });
      }
      return;
    }
    for (let k = 0; k < 6; k++) {
      bell({ freq: scaleNote(k + 3), ratio: 2.4, index: 90, dur: 0.22, peak: 0.14, delay: k * 0.045, wet: 0.4 });
    }
    noise({ dur: 0.5, freq: 1400, sweepTo: 4800, q: 3.2, peak: 0.2, wet: 0.3 });
    noise({ dur: 0.34, freq: 4200, sweepTo: 1100, q: 3.2, peak: 0.12, delay: 0.18, wet: 0.3 });
    bell({ freq: SA * 4, ratio: 3.53, index: 200, dur: 0.7, peak: 0.16, delay: 0.26, wet: 0.5 });
  },
  dhamaka(i = 0) {
    const name = ['dhamaka-1', 'dhamaka-2', 'dhamaka-3'][i % 3];
    if (play(name, { delay: i * 0.11, gain: 0.85, cutAfter: 0.55, rate: 1 + ((i * 7) % 5) * 0.04, wet: 0.25 })) return;
    const d = i * 0.11;
    noise({ dur: 0.04, freq: 3400, q: 0.7, peak: 0.4, delay: d, type: 'highpass', wet: 0.3 });
    thump({ freq: 200 + Math.random() * 60, to: 50, dur: 0.24, peak: 0.5, delay: d + 0.01, slap: 0 });
    crackle({ count: 3, span: 0.16, delay: d + 0.05, peak: 0.12 });
  },
  win() {
    if (play('win', { gain: 1.0, wet: 0.35, jitter: 0 })) {
      play('gong', { delay: 0.12, rate: 1.35, gain: 0.35, wet: 0.5 });
      play('anaar', { delay: 0.5, gain: 0.5, wet: 0.45 }); // celebratory firework under the jingle
      return;
    }
    thump({ freq: 150, to: 48, dur: 0.3, peak: 0.6 });
    thump({ freq: 200, to: 70, dur: 0.22, peak: 0.45, delay: 0.16 });
    thump({ freq: 150, to: 48, dur: 0.34, peak: 0.6, delay: 0.34 });
    const run = [0, 1, 2, 3, 4, 5, 7, 9];
    run.forEach((deg, i) => {
      bell({ freq: scaleNote(deg), ratio: 2.76, index: 140, dur: 0.5, peak: 0.22, delay: 0.24 + i * 0.09, wet: 0.45 });
    });
    bell({ freq: scaleNote(10), ratio: 2.76, index: 160, dur: 1.1, peak: 0.26, delay: 0.24 + run.length * 0.09, wet: 0.55 });
    crackle({ count: 10, span: 1.1, delay: 0.5, peak: 0.1 });
  },
  lose() {
    if (play('lose', { gain: 0.9, wet: 0.3, jitter: 0 })) return;
    tone({ type: 'triangle', freq: 392, to: 370, dur: 0.32, peak: 0.22, wet: 0.2 });
    tone({ type: 'triangle', freq: 330, to: 312, dur: 0.34, peak: 0.2, delay: 0.3, wet: 0.2 });
    tone({ type: 'sine', freq: 262, to: 240, dur: 0.6, peak: 0.22, delay: 0.6, wet: 0.3 });
    thump({ freq: 120, to: 60, dur: 0.4, peak: 0.25, delay: 0.62, slap: 0 });
  },
  shuffle() {
    if (play('shuffle', { gain: 1.7, wet: 0.15 })) {
      play('bell', { rate: 1.5, delay: 0.35, gain: 0.3, wet: 0.4 });
      return;
    }
    noise({ dur: 0.3, freq: 2600, sweepTo: 700, q: 1.2, peak: 0.18, wet: 0.2 });
    noise({ dur: 0.3, freq: 700, sweepTo: 2600, q: 1.2, peak: 0.18, delay: 0.24, wet: 0.2 });
    bell({ freq: SA * 2, ratio: 2.4, index: 70, dur: 0.3, peak: 0.1, delay: 0.4, wet: 0.4 });
  },
};
