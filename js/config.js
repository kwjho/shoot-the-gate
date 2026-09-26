/**
 * config.js — every deploy-time switch lives here.
 */

/* ─────────────────────────── Google AdSense ───────────────────────────
 *
 * ENABLE_ADS  (default: false)
 *
 *   false → js/ads.js removes every `.ad-slot` wrapper (and its
 *           <ins class="adsbygoogle">) from the DOM and never requests the
 *           AdSense script. Keep it false while your site is under review, or
 *           if you host the game without ads.
 *
 *   true  → js/ads.js injects adsbygoogle.js for ADSENSE_CLIENT and fills
 *           the slots below. Each slot is only pushed once it is actually
 *           visible: the sidebar waits for the landscape layout, and the drawer
 *           slot waits for the Rules & Story drawer to open, so AdSense never
 *           measures a zero-width container.
 *
 * Before flipping to true:
 *   1. Replace ADSENSE_CLIENT with your publisher id (ca-pub-…).
 *   2. Replace each AD_SLOTS id with a responsive display ad unit id.
 *   3. Publish /ads.txt at the site root (see ads.txt.example).
 */
export const ENABLE_ADS = false;

export const ADSENSE_CLIENT = 'ca-pub-0000000000000000';

export const AD_SLOTS = Object.freeze({
  header: '0000000001',  // leaderboard under the top bar
  sidebar: '0000000002', // landscape right panel, under the log
  drawer: '0000000003',  // inside the Rules & Story drawer
  footer: '0000000004',  // page footer
});

/** Dev aid: outline where ads would render while ENABLE_ADS is false.
 *  Also switchable at runtime with `?ads=preview`. */
export const SHOW_AD_PLACEHOLDERS = false;

/* ─────────────────────────── Networking (PeerJS) ─────────────────────────── */

export const PEER = Object.freeze({
  /** Loaded lazily, only when someone opens the online mode. */
  scriptUrl: 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
  /** Namespaces room ids on the shared PeerJS broker: `<prefix><CODE>`. */
  idPrefix: 'shoot-dragon-gate-v1-',
  /** null → the free PeerJS cloud broker. For a self-hosted PeerServer pass
   *  { host, port, path, secure }. Can be overridden with `?peer=host:port`. */
  server: null,
  protocol: 1,
  heartbeatMs: 4000,
  timeoutMs: 15000,
  connectTimeoutMs: 12000,
  /** How long the host waits for a disconnected active player before skipping them. */
  turnGraceMs: 20000,
});

/* ─────────────────────────── Game defaults & pacing ─────────────────────────── */

export const DEFAULTS = Object.freeze({
  deckMode: 'single-low',
  potMode: 'standard', // 'standard' | 'free' (無莊家 / no pot limit)
  ante: 10,
  startChips: 500,
});

export const ANTE_OPTIONS = Object.freeze([5, 10, 20, 50]);
export const CHIP_OPTIONS = Object.freeze([200, 500, 1000, 2000]);

/** Dwell time (ms) on a finished hand before the authority advances the turn. */
export const TIMING = Object.freeze({
  resolved: 2400,
  nogate: 1500,
  skip: 900,
});
