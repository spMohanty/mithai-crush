// WebAudio synth — no assets. Everything generated. Init on first user gesture.

let ctx = null;
let master = null;
let muted = false;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

function env(node, t0, attack, decay, peak = 1) {
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.linearRampToValueAtTime(peak, t0 + attack);
  node.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function tone({ type = 'sine', freq = 440, to = null, dur = 0.15, peak = 0.5, delay = 0 }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  env(g, t0, 0.008, dur, peak);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.2, freq = 800, q = 1, peak = 0.5, delay = 0, sweepTo = null, type = 'bandpass' }) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const g = ctx.createGain();
  env(g, t0, 0.005, dur, peak);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0);
}

export const sfx = {
  select() { tone({ type: 'triangle', freq: 700, dur: 0.05, peak: 0.2 }); },
  swapTick() { tone({ type: 'triangle', freq: 520, to: 660, dur: 0.07, peak: 0.25 }); },
  invalid() {
    tone({ type: 'square', freq: 140, to: 100, dur: 0.12, peak: 0.18 });
  },
  pop(n = 0) {
    const f = 420 * Math.pow(1.12, Math.min(n, 10));
    tone({ type: 'triangle', freq: f, to: f * 1.4, dur: 0.09, peak: 0.4 });
    noise({ dur: 0.05, freq: 2400, peak: 0.12 });
  },
  rocket() {
    noise({ dur: 0.32, freq: 500, sweepTo: 3800, q: 2.5, peak: 0.45 });
    tone({ type: 'sawtooth', freq: 200, to: 900, dur: 0.3, peak: 0.12 });
  },
  anaar() {
    noise({ dur: 0.4, freq: 220, sweepTo: 90, q: 0.8, peak: 0.6, type: 'lowpass' });
    tone({ type: 'sine', freq: 150, to: 55, dur: 0.38, peak: 0.5 });
  },
  chakri() {
    [660, 880, 1175, 1568].forEach((f, i) =>
      tone({ type: 'triangle', freq: f, dur: 0.14, peak: 0.3, delay: i * 0.05 }));
    noise({ dur: 0.45, freq: 1200, sweepTo: 5200, q: 3, peak: 0.25 });
  },
  dhamaka(i = 0) {
    noise({ dur: 0.25, freq: 320, sweepTo: 120, peak: 0.4, type: 'lowpass', delay: i * 0.12 });
    tone({ type: 'triangle', freq: 500 + i * 80, to: 900 + i * 90, dur: 0.15, peak: 0.25, delay: i * 0.12 });
  },
  win() {
    // little shehnai-ish pentatonic flourish + dhol thump
    const notes = [523, 587, 659, 784, 880, 1047];
    notes.forEach((f, i) => {
      tone({ type: 'triangle', freq: f, dur: 0.22, peak: 0.35, delay: i * 0.09 });
      tone({ type: 'sine', freq: f / 2, dur: 0.22, peak: 0.15, delay: i * 0.09 });
    });
    tone({ type: 'sine', freq: 130, to: 55, dur: 0.3, peak: 0.6 });
    tone({ type: 'sine', freq: 130, to: 55, dur: 0.3, peak: 0.5, delay: 0.35 });
  },
  lose() {
    tone({ type: 'triangle', freq: 392, to: 330, dur: 0.3, peak: 0.3 });
    tone({ type: 'triangle', freq: 294, to: 220, dur: 0.45, peak: 0.3, delay: 0.28 });
  },
};
