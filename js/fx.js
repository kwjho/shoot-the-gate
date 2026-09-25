/**
 * fx.js — visual feedback primitives: confetti, shake, number tweens, floaters.
 * Everything respects `prefers-reduced-motion`.
 */

const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
export const prefersReducedMotion = () => !!reduced?.matches;

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─────────────────────────── confetti ─────────────────────────── */

let canvas = null;
let particles = [];
let raf = 0;

function palette() {
  const css = getComputedStyle(document.documentElement);
  return ['--gold', '--gold-2', '--cinnabar', '--jade', '--paper']
    .map((v) => css.getPropertyValue(v).trim())
    .filter(Boolean);
}

/** Burst of paper confetti from a point (defaults to the centre of `origin`). */
export function confetti(origin, { count = 140 } = {}) {
  if (prefersReducedMotion()) return;
  canvas ??= document.getElementById('fxCanvas');
  if (!canvas) return;
  const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  const rect = origin?.getBoundingClientRect?.() ?? { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = palette();
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = 6 + Math.random() * 10;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      w: 5 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      tilt: Math.random() * Math.PI,
      color: colors[i % colors.length] || '#d4aa55',
      life: 0,
      ttl: 110 + Math.random() * 60,
      round: Math.random() < 0.18,
    });
  }
  if (!raf) raf = requestAnimationFrame(step);

  function step() {
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter((p) => p.life < p.ttl && p.y < innerHeight + 40);
    for (const p of particles) {
      p.life += 1;
      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.28;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.tilt += 0.12;
      const fade = Math.min(1, (p.ttl - p.life) / 30);
      c.save();
      c.globalAlpha = fade;
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      if (p.round) {
        c.beginPath();
        c.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        c.fill();
      } else {
        c.scale(1, Math.cos(p.tilt));
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      c.restore();
    }
    if (particles.length) raf = requestAnimationFrame(step);
    else {
      raf = 0;
      c.clearRect(0, 0, innerWidth, innerHeight);
    }
  }
}

/* ─────────────────────────── shake & pulses ─────────────────────────── */

export function shake(el, strength = 7) {
  if (!el || prefersReducedMotion()) return;
  const k = strength;
  el.animate(
    [
      { transform: 'translate3d(0,0,0)' },
      { transform: `translate3d(${-k}px, ${k * 0.3}px, 0) rotate(-0.4deg)` },
      { transform: `translate3d(${k * 0.8}px, ${-k * 0.25}px, 0) rotate(0.35deg)` },
      { transform: `translate3d(${-k * 0.5}px, ${k * 0.2}px, 0)` },
      { transform: `translate3d(${k * 0.3}px, 0, 0)` },
      { transform: `translate3d(${-k * 0.12}px, 0, 0)` },
      { transform: 'translate3d(0,0,0)' },
    ],
    { duration: 460, easing: 'cubic-bezier(.36,.07,.19,.97)' },
  );
}

/** Retrigger a CSS keyframe animation driven by a data attribute. */
export function pulse(el, attr, value) {
  if (!el) return;
  el.removeAttribute(attr);
  void el.offsetWidth; // restart the animation
  el.setAttribute(attr, value);
}

/* ─────────────────────────── numbers ─────────────────────────── */

const tweens = new WeakMap();

/** Count an element's number from its current value to `to`. */
export function tweenNumber(el, to, { duration = 650, format = (n) => n.toLocaleString() } = {}) {
  if (!el) return;
  const from = Number(el.dataset.value ?? to);
  el.dataset.value = String(to);
  cancelAnimationFrame(tweens.get(el));
  if (from === to || prefersReducedMotion()) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(Math.round(from + (to - from) * eased));
    if (t < 1) tweens.set(el, requestAnimationFrame(tick));
  };
  tweens.set(el, requestAnimationFrame(tick));
}

/** A small "+40" that rises and fades above an element. */
export function floater(anchor, text, tone = 'win') {
  if (!anchor) return;
  const r = anchor.getBoundingClientRect();
  if (!r.width) return;
  const el = document.createElement('div');
  el.className = `floater floater--${tone}`;
  el.textContent = text;
  el.style.left = `${r.left + r.width / 2}px`;
  el.style.top = `${r.top + r.height / 2}px`;
  document.body.append(el);
  const anim = el.animate(
    [
      { transform: 'translate(-50%, -50%) scale(.8)', opacity: 0 },
      { transform: 'translate(-50%, -90%) scale(1)', opacity: 1, offset: 0.2 },
      { transform: 'translate(-50%, -190%) scale(1)', opacity: 0 },
    ],
    { duration: prefersReducedMotion() ? 900 : 1300, easing: 'cubic-bezier(.16,1,.3,1)' },
  );
  anim.onfinish = () => el.remove();
}
