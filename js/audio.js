// WebAudio synth — no assets, everything generated. Init on first user gesture.
//
// Signal graph: voice -> [dry] -> bus -> compressor -> destination
//                     \-> [send] -> convolver (generated hall) -> bus
// Richness comes from layering (transient + body + sparkle), FM bells,
// pitch-drop thumps, detuned pairs, and a shared reverb tail.

let ctx = null;
let bus = null;        // pre-compressor mix bus
let verb = null;       // convolver
let muted = false;

const BHUPALI = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3]; // Sa Re Ga Pa Dha — cascade melody
const SA = 523.25; // C5

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
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }
export function getAudioGraph() { return { ctx, bus }; } // for diagnostics/tests

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

// Detuned oscillator pair with optional pitch ramp.
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

// Two-operator FM — inharmonic ratios give temple-bell / ghungroo timbres.
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

// Tabla/dhol-style thump: sine pitch drop + skin slap.
function thump({ freq = 170, to = 55, dur = 0.28, peak = 0.55, delay = 0, slap = 0.12 }) {
  tone({ type: 'sine', freq, to, dur, peak, delay, wet: 0.08, pair: false });
  if (slap) noise({ dur: 0.03, freq: 2400, q: 0.7, peak: slap, delay, type: 'highpass', wet: 0 });
}

// Firecracker crackle tail — a scatter of tiny snaps, like an anaar fountain.
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

export const sfx = {
  select() {
    noise({ dur: 0.02, freq: 3200, q: 1, peak: 0.1, type: 'highpass', wet: 0 });
    tone({ type: 'triangle', freq: 840, dur: 0.05, peak: 0.12, wet: 0.05, pair: false });
  },
  swapTick() {
    noise({ dur: 0.09, freq: 900, sweepTo: 2600, q: 1.4, peak: 0.16, wet: 0.06 });
    tone({ type: 'triangle', freq: 480, to: 640, dur: 0.07, peak: 0.16, wet: 0.05 });
  },
  invalid() {
    thump({ freq: 130, to: 90, dur: 0.09, peak: 0.3, slap: 0.05 });
    thump({ freq: 110, to: 75, dur: 0.12, peak: 0.32, delay: 0.09, slap: 0.05 });
  },
  pop(n = 0) {
    const f = scaleNote(n);
    // click transient + detuned body with upward blip + faint bell sparkle
    noise({ dur: 0.018, freq: 4200, q: 0.8, peak: 0.15, type: 'highpass', wet: 0 });
    tone({ type: 'triangle', freq: f, to: f * 1.22, dur: 0.12, peak: 0.3, wet: 0.14 });
    tone({ type: 'sine', freq: f / 2, dur: 0.1, peak: 0.14, wet: 0.06, pair: false });
    bell({ freq: f * 2, ratio: 3.01, index: 60, dur: 0.16, peak: 0.07, wet: 0.3 });
  },
  rocket() {
    noise({ dur: 0.38, freq: 420, sweepTo: 5200, q: 2.2, peak: 0.5, wet: 0.22 });
    tone({ type: 'sawtooth', freq: 180, to: 1150, dur: 0.34, peak: 0.1, wet: 0.15, detune: 10 });
    noise({ dur: 0.05, freq: 3000, q: 1, peak: 0.35, delay: 0.34, type: 'highpass', wet: 0.35 });
    thump({ freq: 190, to: 70, dur: 0.16, peak: 0.3, delay: 0.35, slap: 0 });
  },
  anaar() {
    thump({ freq: 165, to: 42, dur: 0.42, peak: 0.7, slap: 0.2 });
    noise({ dur: 0.16, freq: 900, sweepTo: 180, q: 0.6, peak: 0.5, type: 'lowpass', wet: 0.25 });
    crackle({ count: 9, span: 0.55, peak: 0.18 });
  },
  chakri() {
    // spinning shimmer: quick bell run + circular whoosh
    for (let k = 0; k < 6; k++) {
      bell({ freq: scaleNote(k + 3), ratio: 2.4, index: 90, dur: 0.22, peak: 0.14, delay: k * 0.045, wet: 0.4 });
    }
    noise({ dur: 0.5, freq: 1400, sweepTo: 4800, q: 3.2, peak: 0.2, wet: 0.3 });
    noise({ dur: 0.34, freq: 4200, sweepTo: 1100, q: 3.2, peak: 0.12, delay: 0.18, wet: 0.3 });
    bell({ freq: SA * 4, ratio: 3.53, index: 200, dur: 0.7, peak: 0.16, delay: 0.26, wet: 0.5 });
  },
  dhamaka(i = 0) {
    const d = i * 0.11;
    noise({ dur: 0.04, freq: 3400, q: 0.7, peak: 0.4, delay: d, type: 'highpass', wet: 0.3 });
    thump({ freq: 200 + Math.random() * 60, to: 50, dur: 0.24, peak: 0.5, delay: d + 0.01, slap: 0 });
    crackle({ count: 3, span: 0.16, delay: d + 0.05, peak: 0.12 });
  },
  win() {
    // dhol intro, bell arpeggio up Bhupali, sparkle rain tail
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
    tone({ type: 'triangle', freq: 392, to: 370, dur: 0.32, peak: 0.22, wet: 0.2 });
    tone({ type: 'triangle', freq: 330, to: 312, dur: 0.34, peak: 0.2, delay: 0.3, wet: 0.2 });
    tone({ type: 'sine', freq: 262, to: 240, dur: 0.6, peak: 0.22, delay: 0.6, wet: 0.3 });
    thump({ freq: 120, to: 60, dur: 0.4, peak: 0.25, delay: 0.62, slap: 0 });
  },
  shuffle() {
    noise({ dur: 0.3, freq: 2600, sweepTo: 700, q: 1.2, peak: 0.18, wet: 0.2 });
    noise({ dur: 0.3, freq: 700, sweepTo: 2600, q: 1.2, peak: 0.18, delay: 0.24, wet: 0.2 });
    bell({ freq: SA * 2, ratio: 2.4, index: 70, dur: 0.3, peak: 0.1, delay: 0.4, wet: 0.4 });
  },
};
