/**
 * statsManager.js — lifetime statistics for this device, persisted in localStorage.
 *
 * The engine emits one `handEnd` event per finished hand and an `ante` event
 * per round; the controller forwards every batch of events here together with
 * the ids of the seats this device controls (`myIds`). Only those seats count:
 * in Solo that is you, in pass-and-play the whole table, online your own seat.
 *
 * DOM-free apart from the injectable storage, so it runs under node:test.
 */

export const STORE_KEY = 'stg.stats.v1';

const COUNTERS = ['games', 'hands', 'wins', 'losses', 'postHits', 'noGates', 'biggestWin', 'net', 'wagered', 'antes'];

function blank(now = Date.now()) {
  const data = { v: 1, since: now, lastPlayed: 0 };
  for (const k of COUNTERS) data[k] = 0;
  return data;
}

function sanitize(raw) {
  const data = blank();
  if (!raw || typeof raw !== 'object') return data;
  for (const k of [...COUNTERS, 'since', 'lastPlayed']) {
    const n = Number(raw[k]);
    if (Number.isFinite(n)) data[k] = Math.trunc(n);
  }
  return data;
}

export function createStatsStore({ storage = globalThis.localStorage, key = STORE_KEY } = {}) {
  const listeners = new Set();
  const seen = new Set(); // hand keys / game ids already counted this page load
  let data = load();

  function load() {
    try {
      const raw = storage?.getItem(key);
      return raw ? sanitize(JSON.parse(raw)) : blank();
    } catch {
      return blank();
    }
  }

  function save() {
    try {
      storage?.setItem(key, JSON.stringify(data));
    } catch {
      /* private mode or quota: stats stay in memory for this visit */
    }
  }

  function notify() {
    for (const fn of listeners) fn(get());
  }

  function once(id) {
    if (seen.has(id)) return false;
    seen.add(id);
    if (seen.size > 2000) seen.delete(seen.values().next().value);
    return true;
  }

  function get() {
    return { ...data };
  }

  function isEmpty() {
    return data.hands === 0 && data.games === 0;
  }

  /** Fold a batch of engine events into the lifetime totals. */
  function record(events, myIds) {
    if (!events?.length || !myIds?.size) return false;
    let changed = false;
    for (const ev of events) {
      if (ev.type === 'start') {
        if (ev.playerIds?.some((id) => myIds.has(id)) && once(`game:${ev.gameId}`)) {
          data.games += 1;
          changed = true;
        }
      } else if (ev.type === 'ante') {
        for (const [pid, amount] of Object.entries(ev.paid ?? {})) {
          if (!myIds.has(pid) || !once(`ante:${ev.gameId ?? ''}:${ev.round}:${pid}`)) continue;
          data.antes += amount;
          data.net -= amount;
          changed = true;
        }
      } else if (ev.type === 'handEnd') {
        if (!myIds.has(ev.playerId) || !once(`hand:${ev.key}`)) continue;
        data.hands += 1;
        data.wagered += ev.bet;
        data.net += ev.delta;
        if (ev.outcome === 'win') {
          data.wins += 1;
          data.biggestWin = Math.max(data.biggestWin, ev.delta);
        } else if (ev.outcome === 'miss') data.losses += 1;
        else if (ev.outcome === 'post') data.postHits += 1;
        else if (ev.outcome === 'nogate') data.noGates += 1;
        changed = true;
      }
    }
    if (changed) {
      data.lastPlayed = Date.now();
      save();
      notify();
    }
    return changed;
  }

  function reset() {
    data = blank();
    save();
    notify();
  }

  /** Pick up changes written by another tab. */
  function reload() {
    data = load();
    notify();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { get, isEmpty, record, reset, reload, subscribe, key };
}

/** App-wide store backed by localStorage. */
export const stats = createStatsStore();
