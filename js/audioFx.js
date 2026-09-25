/**
 * audioFx.js — every sound is synthesised live with the Web Audio API.
 * No audio files, nothing to download.
 *
 * The AudioContext is created lazily and resumed on the first user gesture
 * (browsers block autoplay). All voices route through a master gain and a
 * gentle compressor; the win chimes also feed a short feedback delay for air.
 */

const STORE_KEY = 'stg.muted';

let ctx = null;
let master = null;
let air = null; // delay send for chimes
let noise = null;
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false;
  }
}

function ensure() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(comp).connect(ctx.destination);

    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.19;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 3200;
    air = ctx.createGain();
    air.gain.value = 0.28;
    air.connect(delay).connect(tone).connect(feedback).connect(delay);
    tone.connect(master);

    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call from a user gesture so later sounds aren't blocked. */
export function unlock() {
  ensure();
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = !!value;
  try {
    localStorage.setItem(STORE_KEY, muted ? '1' : '0');
  } catch {
    /* private mode */
  }
  if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.02);
}

/* ─────────────────────────── voices ─────────────────────────── */

function env(gainNode, t, { attack = 0.005, peak = 0.3, decay = 0.2 }) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(peak, t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function tone({ freq, type = 'sine', at = 0, attack = 0.005, peak = 0.2, decay = 0.3, glideTo, send = false }) {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + attack + decay);
  env(g, t, { attack, peak, decay });
  osc.connect(g).connect(master);
  if (send) g.connect(air);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

function hiss({ at = 0, dur = 0.2, peak = 0.3, type = 'bandpass', from = 2000, to = 800, q = 0.9 }) {
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  env(g, t, { attack: 0.012, peak, decay: dur });
  src.connect(f).connect(g).connect(master);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const play = (fn) => (...args) => {
  if (muted || !ensure()) return;
  try {
    fn(...args);
  } catch (err) {
    console.warn('[audio]', err);
  }
};

/** Felt swish as a card leaves the shoe. */
export const slide = play((at = 0) => {
  hiss({ at, dur: 0.2, peak: 0.22, from: 2600, to: 700, q: 0.7 });
});

/** Crisp snap of a card turning over. */
export const flip = play((at = 0) => {
  hiss({ at, dur: 0.05, peak: 0.28, type: 'highpass', from: 3500, to: 2500, q: 0.5 });
  tone({ freq: 1500, glideTo: 520, at, attack: 0.002, peak: 0.08, decay: 0.05 });
});

/** Chips clattering into the pot. */
export const chips = play((count = 3) => {
  for (let i = 0; i < count; i++) {
    const at = i * 0.055 + Math.random() * 0.02;
    const base = 2300 + Math.random() * 500;
    tone({ freq: base, type: 'triangle', at, attack: 0.001, peak: 0.07, decay: 0.09 });
    tone({ freq: base * 1.47, at, attack: 0.001, peak: 0.04, decay: 0.07 });
  }
});

/** A quick riffle. */
export const shuffle = play(() => {
  for (let i = 0; i < 9; i++) hiss({ at: i * 0.045, dur: 0.06, peak: 0.12, from: 3200, to: 1800, q: 1.2 });
});

/** Soft wood-block tick when the turn passes. */
export const turn = play(() => {
  tone({ freq: 880, at: 0, attack: 0.002, peak: 0.07, decay: 0.08 });
  tone({ freq: 1320, at: 0.07, attack: 0.002, peak: 0.05, decay: 0.1 });
});

export const click = play(() => {
  tone({ freq: 1800, attack: 0.001, peak: 0.035, decay: 0.03 });
});

// Major pentatonic (宮商角徵羽) keeps the chimes bright and unmistakably festive.
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

/** Clean pentatonic arpeggio. */
export const win = play(() => {
  [2, 3, 4, 5].forEach((n, i) => {
    tone({ freq: PENTA[n], type: 'triangle', at: i * 0.075, attack: 0.004, peak: 0.16, decay: 0.55, send: true });
    tone({ freq: PENTA[n] * 2, at: i * 0.075, attack: 0.004, peak: 0.04, decay: 0.4, send: true });
  });
});

/** Longer cascade + shimmer for a pot-sweeping win. */
export const bigWin = play(() => {
  [0, 2, 3, 4, 5, 7, 8, 9].forEach((n, i) => {
    tone({ freq: PENTA[n], type: 'triangle', at: i * 0.07, attack: 0.004, peak: 0.15, decay: 0.8, send: true });
  });
  [PENTA[5], PENTA[7], PENTA[9]].forEach((f) =>
    tone({ freq: f, type: 'sine', at: 0.6, attack: 0.05, peak: 0.07, decay: 1.4, send: true }),
  );
  chips(6);
});

/** Two falling notes, understated. */
export const miss = play(() => {
  tone({ freq: 392, type: 'triangle', at: 0, attack: 0.01, peak: 0.13, decay: 0.22 });
  tone({ freq: 293.66, type: 'triangle', at: 0.14, attack: 0.01, peak: 0.12, decay: 0.38 });
});

/** 撞柱 — an inharmonic metal clang on the post, then a low penalty buzz. */
export const post = play(() => {
  [220, 563, 921, 1340].forEach((f, i) =>
    tone({ freq: f, type: 'sine', at: 0, attack: 0.001, peak: 0.14 / (i + 1), decay: 0.9 - i * 0.15 }),
  );
  tone({ freq: 90, glideTo: 42, type: 'sine', at: 0, attack: 0.003, peak: 0.35, decay: 0.35 });

  const t = ctx.currentTime + 0.12;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(200, t + 0.5);
  const g = ctx.createGain();
  env(g, t, { attack: 0.01, peak: 0.12, decay: 0.5 });
  f.connect(g).connect(master);
  for (const freq of [110, 116.5]) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    o.connect(f);
    o.start(t);
    o.stop(t + 0.6);
  }
});

/** 無門 — a muted, neutral double knock. */
export const nogate = play(() => {
  tone({ freq: 330, type: 'sine', at: 0, attack: 0.003, peak: 0.12, decay: 0.12 });
  tone({ freq: 330, type: 'sine', at: 0.14, attack: 0.003, peak: 0.09, decay: 0.16 });
});

/** Gentle bloom when a game starts or a player joins. */
export const gong = play(() => {
  [196, 392.5, 588, 791].forEach((f, i) =>
    tone({ freq: f, type: 'sine', at: 0, attack: 0.02, peak: 0.1 / (i + 1), decay: 1.6 - i * 0.3, send: true }),
  );
});
