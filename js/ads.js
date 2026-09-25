/**
 * ads.js — AdSense placement lifecycle.
 *
 * Markup: each placement is a wrapper `.ad-slot[data-ad="<key>"]` holding one
 * `<ins class="adsbygoogle">`. Keys map to AD_SLOTS in config.js.
 *
 * With ENABLE_ADS = false the wrappers are removed outright (or outlined when
 * previewing with `?ads=preview`), so the layout never reserves dead space.
 *
 * With ENABLE_ADS = true, a slot is pushed to AdSense the first time it has a
 * real width: header/footer right away, the sidebar once the landscape layout
 * shows it, the drawer slot when the Rules & Story drawer opens.
 */

import { ENABLE_ADS, ADSENSE_CLIENT, AD_SLOTS, SHOW_AD_PLACEHOLDERS } from './config.js';

const pushed = new WeakSet();
let scriptRequested = false;

function preview() {
  return SHOW_AD_PLACEHOLDERS || new URLSearchParams(location.search).get('ads') === 'preview';
}

function requestScript() {
  if (scriptRequested) return;
  scriptRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  document.head.append(s);
}

/** Push a slot if it's visible and hasn't been filled yet. Safe to call repeatedly. */
export function fillSlot(wrapper) {
  if (!ENABLE_ADS || !wrapper) return;
  const ins = wrapper.querySelector('ins.adsbygoogle');
  if (!ins || pushed.has(ins) || ins.getBoundingClientRect().width < 50) return;
  pushed.add(ins);
  try {
    (globalThis.adsbygoogle = globalThis.adsbygoogle || []).push({});
  } catch (err) {
    console.warn('[ads]', err);
  }
}

export function initAds() {
  const wrappers = [...document.querySelectorAll('.ad-slot[data-ad]')];

  if (!ENABLE_ADS) {
    if (preview()) wrappers.forEach((w) => (w.hidden = false, w.dataset.preview = ''));
    else wrappers.forEach((w) => w.remove());
    return;
  }

  requestScript();
  for (const w of wrappers) {
    const ins = w.querySelector('ins.adsbygoogle');
    ins.dataset.adClient = ADSENSE_CLIENT;
    ins.dataset.adSlot = AD_SLOTS[w.dataset.ad] ?? '';
    w.hidden = false;
  }

  // Fill whatever becomes visible (layout switches, drawer opening, screen changes).
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) fillSlot(e.target);
  });
  wrappers.forEach((w) => io.observe(w));
}
