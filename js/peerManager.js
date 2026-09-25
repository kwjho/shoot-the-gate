/**
 * peerManager.js — serverless P2P rooms over WebRTC (PeerJS).
 *
 * Topology is a star: the host's browser is the single source of truth. It
 * runs the GameEngine, validates every action, and broadcasts public
 * snapshots. Guests only ever send intents ({ type: 'action', action }).
 *
 *   guest ──hello{name, clientId}──▶ host
 *   guest ◀──welcome{playerId, state}── host      (or reject{reason})
 *   guest ──action{…}──────────────▶ host
 *   guest ◀──state{state, events}───── host       (to every guest)
 *   both  ◀─ping/pong─▶ heartbeat, so half-open links are detected
 *
 * The room code (e.g. "DRGN") is the host's peer id on the broker, namespaced
 * with PEER.idPrefix. A guest reusing the same clientId (kept in
 * sessionStorage) after a refresh reclaims their seat.
 */

import { PEER } from './config.js';

export class NetError extends Error {
  constructor(code, cause) {
    super(code);
    this.code = code;
    this.cause = cause;
  }
}

class Emitter {
  #handlers = new Map();
  on(type, fn) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, new Set());
    this.#handlers.get(type).add(fn);
    return () => this.#handlers.get(type)?.delete(fn);
  }
  emit(type, payload) {
    for (const fn of this.#handlers.get(type) ?? []) {
      try {
        fn(payload);
      } catch (err) {
        console.error(err);
      }
    }
  }
}

/* ─────────────────────────── helpers ─────────────────────────── */

// Consonants only: codes read like "DRGN", never form words, and avoid I/O/0/1 confusion.
const CODE_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ';

export function makeRoomCode() {
  const buf = new Uint32Array(4);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join('');
}

export function normalizeRoomCode(raw) {
  return String(raw ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
}

export function isValidRoomCode(code) {
  return /^[A-Z]{4}$/.test(code);
}

let libPromise = null;

/** Load the PeerJS UMD bundle on demand (keeps first paint lean for offline modes). */
export function loadPeerLib() {
  if (globalThis.Peer) return Promise.resolve(globalThis.Peer);
  libPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEER.scriptUrl;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = () => (globalThis.Peer ? resolve(globalThis.Peer) : reject(new NetError('libLoad')));
    s.onerror = () => {
      libPromise = null;
      s.remove();
      reject(new NetError('libLoad'));
    };
    document.head.append(s);
  });
  return libPromise;
}

/** Broker options: PEER.server, or `?peer=host:port[/path]` for self-hosted PeerServer. */
function peerOptions() {
  const opts = { debug: 1 };
  let server = PEER.server;
  const override = new URLSearchParams(location.search).get('peer');
  if (override) {
    const m = override.match(/^([^:/]+)(?::(\d+))?(\/.*)?$/);
    if (m) {
      const port = Number(m[2] || 443);
      server = { host: m[1], port, path: m[3] || '/', secure: port === 443 };
    }
  }
  return server ? { ...opts, ...server } : opts;
}

function openPeer(Peer, id) {
  return new Promise((resolve, reject) => {
    const opts = peerOptions();
    const peer = id ? new Peer(id, opts) : new Peer(opts);
    const timer = setTimeout(() => fail(new NetError('timeout')), PEER.connectTimeoutMs);
    const onOpen = () => {
      cleanup();
      resolve(peer);
    };
    const onError = (err) => fail(new NetError(err?.type || 'network', err));
    function cleanup() {
      clearTimeout(timer);
      peer.off('open', onOpen);
      peer.off('error', onError);
    }
    function fail(err) {
      cleanup();
      peer.destroy();
      reject(err);
    }
    peer.on('open', onOpen);
    peer.on('error', onError);
  });
}

function send(conn, msg) {
  try {
    if (conn?.open) conn.send(msg);
  } catch (err) {
    console.warn('[peer] send failed', err);
  }
}

function isMessage(raw) {
  return raw && typeof raw === 'object' && typeof raw.type === 'string';
}

/* ─────────────────────────── Host ─────────────────────────── */

/**
 * Events: 'hello' {link, name, clientId}, 'action' {playerId, action},
 *         'leave' {playerId}, 'error' NetError
 */
export class HostRoom extends Emitter {
  static async open({ attempts = 6 } = {}) {
    const Peer = await loadPeerLib();
    for (let i = 0; i < attempts; i++) {
      const code = makeRoomCode();
      try {
        const peer = await openPeer(Peer, PEER.idPrefix + code);
        return new HostRoom(peer, code);
      } catch (err) {
        if (err.code !== 'unavailable-id') throw err;
      }
    }
    throw new NetError('noCode');
  }

  constructor(peer, code) {
    super();
    this.peer = peer;
    this.code = code;
    this.closed = false;
    this.links = new Set();
    peer.on('connection', (conn) => this.#accept(conn));
    // Lost the broker (not the guests): reconnect so new guests can still find us.
    peer.on('disconnected', () => {
      setTimeout(() => {
        if (!this.closed && !peer.destroyed && peer.disconnected) peer.reconnect();
      }, 1500);
    });
    peer.on('error', (err) => {
      if (err?.type === 'peer-unavailable') return; // a guest vanished mid-handshake
      this.emit('error', new NetError(err?.type || 'network', err));
    });
    this.heartbeat = setInterval(() => this.#tick(), PEER.heartbeatMs);
  }

  #accept(conn) {
    const link = { conn, playerId: null, lastSeen: Date.now() };
    this.links.add(link);
    conn.on('data', (raw) => {
      link.lastSeen = Date.now();
      if (!isMessage(raw)) return;
      switch (raw.type) {
        case 'ping': send(conn, { type: 'pong' }); return;
        case 'pong': return;
        case 'bye': conn.close(); return;
        case 'hello':
          if (!link.playerId) this.emit('hello', { link, name: raw.name, clientId: raw.clientId, v: raw.v });
          return;
        case 'action':
          if (link.playerId && isMessage(raw.action)) this.emit('action', { playerId: link.playerId, action: raw.action });
      }
    });
    conn.on('close', () => this.#drop(link));
    conn.on('error', () => this.#drop(link));
  }

  /** Seat a guest. If the same player already had a link (refresh / duplicate tab), retire it quietly. */
  admit(link, playerId, state) {
    for (const other of this.links) {
      if (other !== link && other.playerId === playerId) {
        other.playerId = null;
        this.links.delete(other);
        send(other.conn, { type: 'closed', reason: 'replaced' });
        setTimeout(() => other.conn.close(), 200);
      }
    }
    link.playerId = playerId;
    send(link.conn, { type: 'welcome', playerId, code: this.code, state });
  }

  reject(link, reason) {
    send(link.conn, { type: 'reject', reason });
    setTimeout(() => link.conn.close(), 300);
  }

  sendTo(playerId, msg) {
    for (const link of this.links) if (link.playerId === playerId) send(link.conn, msg);
  }

  broadcast(msg) {
    for (const link of this.links) if (link.playerId) send(link.conn, msg);
  }

  get guestCount() {
    return [...this.links].filter((l) => l.playerId).length;
  }

  #drop(link) {
    if (!this.links.delete(link)) return;
    if (link.playerId) this.emit('leave', { playerId: link.playerId });
  }

  #tick() {
    const now = Date.now();
    for (const link of this.links) {
      if (now - link.lastSeen > PEER.timeoutMs) {
        link.conn.close();
        this.#drop(link);
      } else {
        send(link.conn, { type: 'ping' });
      }
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.heartbeat);
    this.broadcast({ type: 'closed', reason: 'hostClosed' });
    setTimeout(() => this.peer.destroy(), 250);
  }
}

/* ─────────────────────────── Guest ─────────────────────────── */

/** Events: 'state' {state, events}, 'error' code (action refused), 'lost' reason */
export class ClientRoom extends Emitter {
  static async join(code, { name, clientId }) {
    const Peer = await loadPeerLib();
    const peer = await openPeer(Peer, null);
    return new Promise((resolve, reject) => {
      const conn = peer.connect(PEER.idPrefix + code, { reliable: true, serialization: 'json' });
      const timer = setTimeout(() => fail(new NetError('timeout')), PEER.connectTimeoutMs);
      const onPeerError = (err) =>
        fail(new NetError(err?.type === 'peer-unavailable' ? 'roomNotFound' : err?.type || 'network', err));
      const onData = (raw) => {
        if (!isMessage(raw)) return;
        if (raw.type === 'welcome') {
          cleanup();
          resolve(new ClientRoom(peer, conn, code, raw));
        } else if (raw.type === 'reject') {
          fail(new NetError(raw.reason || 'rejected'));
        }
      };
      const onClose = () => fail(new NetError('roomNotFound'));
      function cleanup() {
        clearTimeout(timer);
        peer.off('error', onPeerError);
        conn.off('data', onData);
        conn.off('close', onClose);
      }
      function fail(err) {
        cleanup();
        peer.destroy();
        reject(err);
      }
      peer.on('error', onPeerError);
      conn.on('open', () => send(conn, { type: 'hello', name, clientId, v: PEER.protocol }));
      conn.on('data', onData);
      conn.on('close', onClose);
    });
  }

  constructor(peer, conn, code, welcome) {
    super();
    this.peer = peer;
    this.conn = conn;
    this.code = code;
    this.playerId = welcome.playerId;
    this.initialState = welcome.state;
    this.lastSeen = Date.now();
    this.gone = false;
    conn.on('data', (raw) => {
      this.lastSeen = Date.now();
      if (!isMessage(raw)) return;
      if (raw.type === 'state') this.emit('state', { state: raw.state, events: raw.events ?? [] });
      else if (raw.type === 'error') this.emit('error', raw.code);
      else if (raw.type === 'ping') send(conn, { type: 'pong' });
      else if (raw.type === 'closed') this.#lost(raw.reason || 'hostClosed');
    });
    conn.on('close', () => this.#lost('hostLost'));
    peer.on('error', (err) => {
      if (err?.type === 'network' || err?.type === 'disconnected') return; // broker hiccup; data channel may be fine
      this.#lost('hostLost');
    });
    this.heartbeat = setInterval(() => {
      if (Date.now() - this.lastSeen > PEER.timeoutMs) this.#lost('hostLost');
      else send(conn, { type: 'ping' });
    }, PEER.heartbeatMs);
  }

  sendAction(action) {
    send(this.conn, { type: 'action', action });
  }

  #lost(reason) {
    if (this.gone) return;
    this.gone = true;
    clearInterval(this.heartbeat);
    this.emit('lost', reason);
    this.peer.destroy();
  }

  leave() {
    if (this.gone) return;
    send(this.conn, { type: 'bye' });
    this.gone = true;
    clearInterval(this.heartbeat);
    setTimeout(() => this.peer.destroy(), 150);
  }
}
