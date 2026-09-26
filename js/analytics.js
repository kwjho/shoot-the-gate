/**
 * analytics.js — Google Analytics 4, privacy-first.
 *
 * gtag.js is injected at runtime (never from static HTML), and only when
 * tracking is allowed. Every call goes through `track()`, which drops anything
 * that isn't an allow-listed event with allow-listed parameters:
 *
 *   game_start      mode, deck_type, shuffle, pot_mode, players
 *   round_complete  result, bet_amount, mode
 *   hit_the_post    bet_amount, penalty, mode
 *   room_created    (no parameters)
 *   room_joined     (no parameters)
 *
 * String parameters must be short snake_case enums, numbers must be finite
 * integers. No nicknames, room codes, player/client ids or free text can pass.
 *
 * Tracking stays off when: ANALYTICS.enabled is false, the id is the
 * placeholder, Do Not Track / Global Privacy Control is set, the player opted
 * out on privacy.html, or the site runs on localhost (use ?analytics=debug).
 */

import { ANALYTICS } from './config.js';

export const PLACEHOLDER_ID = 'G-XXXXXXXXXX';
export const OPT_OUT_KEY = 'stg.analytics';

const EVENTS = Object.freeze({
  game_start: ['mode', 'deck_type', 'shuffle', 'pot_mode', 'players'],
  round_complete: ['result', 'bet_amount', 'mode'],
  hit_the_post: ['bet_amount', 'penalty', 'mode'],
  room_created: [],
  room_joined: [],
});

const ENUM = /^[a-z0-9_]{1,32}$/;

const MODE = Object.freeze({ single: 'single_player', local: 'local_multi', online: 'online_p2p' });
const DECK = Object.freeze({
  'single-low': { deck_type: '1_deck', shuffle: 'when_low' },
  'single-every': { deck_type: '1_deck', shuffle: 'every_hand' },
  'four-low': { deck_type: '4_deck', shuffle: 'when_low' },
});
const RESULT = Object.freeze({ win: 'win', miss: 'lose', post: 'hit_post', nogate: 'no_gate' });

/** Keep only allow-listed params with enum strings or integers. */
export function sanitize(name, params = {}) {
  const allowed = EVENTS[name];
  if (!allowed) return null;
  const out = {};
  for (const key of allowed) {
    const v = params[key];
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = Math.round(v);
    else if (typeof v === 'string' && ENUM.test(v)) out[key] = v;
  }
  return out;
}

export function createAnalytics({ win = globalThis.window, doc = globalThis.document, config = ANALYTICS } = {}) {
  const id = String(config?.measurementId ?? '');
  let active = false;
  let loaded = false;

  const storage = () => {
    try {
      return win?.localStorage ?? null;
    } catch {
      return null;
    }
  };

  function optedOut() {
    return storage()?.getItem(OPT_OUT_KEY) === 'off';
  }

  function privacySignal() {
    const nav = win?.navigator ?? {};
    return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || win?.doNotTrack === '1';
  }

  function debugParam() {
    try {
      return new URLSearchParams(win?.location?.search ?? '').get('analytics') === 'debug';
    } catch {
      return false;
    }
  }

  function localHost() {
    const host = win?.location?.hostname ?? '';
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '';
  }

  /** Why tracking is off, or '' when it is allowed. */
  function blockedReason() {
    if (!config?.enabled) return 'disabled';
    if (!/^G-[A-Z0-9]{4,}$/.test(id) || id === PLACEHOLDER_ID) return 'no-id';
    if (privacySignal()) return 'privacy-signal';
    if (optedOut()) return 'opted-out';
    if (localHost() && !debugParam()) return 'localhost';
    return '';
  }

  function gtag() {
    // gtag.js reads the raw `arguments` object, so keep the classic signature.
    // eslint-disable-next-line prefer-rest-params
    win.dataLayer.push(arguments);
  }

  /** Inject gtag.js and send the (privacy-trimmed) page view. Safe to call twice. */
  function init() {
    if (loaded || !win || !doc) return active;
    if (blockedReason()) {
      if (id) win[`ga-disable-${id}`] = true;
      return false;
    }
    loaded = true;
    active = true;
    win[`ga-disable-${id}`] = false;
    win.dataLayer = win.dataLayer || [];
    win.gtag = win.gtag || gtag;

    // Consent Mode v2: measurement only, never advertising.
    win.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    win.gtag('js', new Date());
    win.gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Room codes travel in ?room=…; report the bare page instead.
      page_location: `${win.location.origin}${win.location.pathname}`,
      page_referrer: stripQuery(doc.referrer),
      ...(debugParam() ? { debug_mode: true } : {}),
    });

    const s = doc.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    doc.head.append(s);
    return true;
  }

  function stripQuery(url) {
    try {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`;
    } catch {
      return '';
    }
  }

  /** Send one allow-listed event. Returns the params actually sent, or null. */
  function track(name, params) {
    if (!active) return null;
    const clean = sanitize(name, params);
    if (!clean) return null;
    win.gtag('event', name, clean);
    return clean;
  }

  /** Turn tracking on or off for this browser (persisted). */
  function setEnabled(on) {
    try {
      if (on) storage()?.removeItem(OPT_OUT_KEY);
      else storage()?.setItem(OPT_OUT_KEY, 'off');
    } catch {
      /* storage blocked */
    }
    if (!on) {
      active = false;
      if (id) win[`ga-disable-${id}`] = true;
    } else if (loaded) {
      active = true;
      win[`ga-disable-${id}`] = false;
    } else {
      init();
    }
  }

  /* ── game-level helpers ── */

  const seen = new Set();

  /**
   * Map engine events to GA4 events. Only seats this device controls count
   * (like the stats store), so an online hand is reported once, by its player.
   */
  function trackEngineEvents(events, { myIds, state } = {}) {
    if (!active || !events?.length || !state) return;
    const mode = MODE[state.mode] ?? 'unknown';
    for (const ev of events) {
      if (ev.type === 'start') {
        if (!ev.playerIds?.some((pid) => myIds?.has(pid)) || seen.has(`g:${ev.gameId}`)) continue;
        seen.add(`g:${ev.gameId}`);
        track('game_start', {
          mode,
          ...(DECK[state.settings?.deckMode] ?? {}),
          pot_mode: state.settings?.potMode,
          players: state.players?.length,
        });
      } else if (ev.type === 'handEnd') {
        if (!myIds?.has(ev.playerId) || seen.has(`h:${ev.key}`)) continue;
        seen.add(`h:${ev.key}`);
        track('round_complete', { result: RESULT[ev.outcome] ?? 'other', bet_amount: ev.bet, mode });
        if (ev.outcome === 'post') track('hit_the_post', { bet_amount: ev.bet, penalty: -ev.delta, mode });
      }
    }
  }

  return {
    init,
    track,
    setEnabled,
    trackEngineEvents,
    roomCreated: () => track('room_created'),
    roomJoined: () => track('room_joined'),
    isActive: () => active,
    blockedReason,
  };
}

/** App-wide instance. */
export const analytics = createAnalytics();
