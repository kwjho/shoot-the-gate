/**
 * main.js — application controller.
 *
 * Owns the session (which mode, who is the authority, which seats this device
 * controls) and routes actions:
 *
 *   UI ──action──▶ dispatch ─┬─ authority (solo / pass-and-play / host): engine.apply → commit
 *                            └─ guest: room.sendAction → host → broadcast → route
 *
 * `commit` is the single place where the authority publishes new state: it
 * broadcasts to guests (host only), hands state + events to the UI, and arms
 * the timers that advance turns and skip timed-out disconnected players.
 */

import { GameEngine, MODES, PHASES, RULES, sanitizeName } from './gameLogic.js';
import { HostRoom, ClientRoom, normalizeRoomCode, isValidRoomCode } from './peerManager.js';
import * as audio from './audioFx.js';
import * as i18n from './i18n.js';
import * as ui from './ui.js';
import { initAds } from './ads.js';
import { stats } from './statsManager.js';
import { analytics } from './analytics.js';
import { DEFAULTS, ANTE_OPTIONS, CHIP_OPTIONS, TIMING, PEER } from './config.js';

const { t } = i18n;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ─────────────────────────── persistence ─────────────────────────── */

const storage = {
  get(key, fallback = null, area = 'localStorage') {
    try {
      const raw = globalThis[area].getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value, area = 'localStorage') {
    try {
      globalThis[area].setItem(key, JSON.stringify(value));
    } catch {
      /* storage disabled */
    }
  },
};

const prefs = {
  nickname: '',
  deckMode: DEFAULTS.deckMode,
  potMode: DEFAULTS.potMode,
  ante: DEFAULTS.ante,
  startChips: DEFAULTS.startChips,
  localNames: [],
  ...storage.get('stg.prefs', {}),
};
const savePrefs = () => storage.set('stg.prefs', prefs);

/** Per-tab identity: survives a refresh (so a guest can reclaim their seat) but not a new tab. */
function clientId() {
  let id = storage.get('stg.clientId', null, 'sessionStorage');
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(9)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 14);
    storage.set('stg.clientId', id, 'sessionStorage');
  }
  return id;
}

/* ─────────────────────────── session ─────────────────────────── */

const app = {
  gen: 0,            // bumps on every session change; stale async callbacks check it
  role: null,        // 'local' | 'host' | 'client'
  engine: null,      // authority only
  room: null,        // HostRoom | ClientRoom
  code: null,
  myIds: new Set(),
  state: null,
  timers: { advance: 0, grace: 0 },
  graceKey: null,
  setupMode: 'single',
};

const ctx = () => ({ myIds: app.myIds, role: app.role, code: app.code });
const inPlay = () => !!app.state && app.state.phase !== PHASES.LOBBY && app.state.phase !== PHASES.GAMEOVER;

function endSession() {
  app.gen += 1;
  clearTimeout(app.timers.advance);
  clearTimeout(app.timers.grace);
  if (app.room) {
    if (app.role === 'host') app.room.close();
    else app.room.leave();
  }
  Object.assign(app, { role: null, engine: null, room: null, code: null, state: null, graceKey: null, myIds: new Set() });
  ui.setRoomChip(null);
  ui.resetTable();
  ui.closeGameOver();
  ui.busy(null);
}

/* ── authority ── */

function authorityApply(action) {
  const res = app.engine.apply(action);
  if (res.ok) commit(res.events);
  return res;
}

function commit(events) {
  const state = app.engine.getPublicState();
  app.state = state;
  if (app.role === 'host') app.room.broadcast({ type: 'state', state, events });
  route(state, events);
  if (events.some((e) => e.type === 'shoot' || e.type === 'nogate' || e.type === 'skip')) scheduleAdvance(state);
  if (app.role === 'host') watchGrace(state);
}

/** After the hand's animations have played, dwell briefly, then pass the turn. */
function scheduleAdvance(state) {
  const gen = app.gen;
  const outcome = state.result?.outcome;
  let dwell = TIMING[outcome === 'nogate' ? 'nogate' : outcome === 'skip' ? 'skip' : 'resolved'];
  if (state.result?.big) dwell += 900;
  clearTimeout(app.timers.advance);
  ui.settled().then(() => {
    if (gen !== app.gen) return;
    clearTimeout(app.timers.advance);
    app.timers.advance = setTimeout(() => {
      if (gen === app.gen && app.engine?.state.phase === PHASES.RESOLVED) authorityApply({ type: 'advance' });
    }, dwell);
  });
}

/** Host: if the active player dropped mid-turn, give them PEER.turnGraceMs to come back. */
function watchGrace(state) {
  const p = state.players[state.turnIndex];
  const waiting = (state.phase === PHASES.AWAIT_DEAL || state.phase === PHASES.BETTING) && p && !p.connected;
  if (!waiting) {
    clearTimeout(app.timers.grace);
    app.graceKey = null;
    return;
  }
  const key = `${p.id}|${state.hand}|${state.round}`;
  if (app.graceKey === key) return;
  app.graceKey = key;
  clearTimeout(app.timers.grace);
  const gen = app.gen;
  app.timers.grace = setTimeout(() => {
    const s = app.engine?.state;
    const cur = s?.players[s.turnIndex];
    if (gen === app.gen && cur?.id === p.id && !cur.connected && (s.phase === PHASES.AWAIT_DEAL || s.phase === PHASES.BETTING)) {
      authorityApply({ type: 'skip', playerId: p.id });
    }
  }, PEER.turnGraceMs);
}

/** Called by the UI for the local player's intents. */
function dispatch(action) {
  if (!app.role) return;
  if (app.role === 'client') {
    app.room.sendAction(action);
    return;
  }
  const res = authorityApply(action);
  if (!res.ok) {
    ui.unlockControls();
    if (action.type !== 'draft') ui.toast(t(`err.${res.error}`), 'warn');
  }
}

function route(state, events = []) {
  // Every published batch of events (local authority, host or guest) passes
  // through here exactly once, so this is where lifetime stats are fed.
  stats.record(events, app.myIds);
  analytics.trackEngineEvents(events, { myIds: app.myIds, state });
  if (state.phase === PHASES.LOBBY) {
    if (document.body.dataset.screen !== 'lobby') ui.showScreen('lobby');
    ui.renderLobby(state, ctx());
    return;
  }
  if (document.body.dataset.screen !== 'game') ui.showScreen('game');
  ui.present(state, events, ctx());
}

/* ── solo & pass-and-play ── */

function startLocal(mode, settings, names) {
  endSession();
  app.role = 'local';
  app.engine = new GameEngine({ mode, settings });
  names.forEach((name, i) => app.engine.apply({ type: 'addPlayer', player: { id: `p${i + 1}`, name } }));
  app.myIds = new Set(app.engine.state.players.map((p) => p.id));
  ui.showScreen('game');
  authorityApply({ type: 'start' });
}

/* ── online: host ── */

const GUEST_ACTIONS = new Set(['deal', 'shoot', 'draft']);

async function hostRoom(settings, name) {
  endSession();
  const gen = app.gen;
  ui.busy(t('net.creating'));
  let room;
  try {
    room = await HostRoom.open();
  } catch (err) {
    if (gen === app.gen) {
      ui.busy(null);
      ui.toast(netErrorText(err), 'warn');
    }
    return;
  }
  if (gen !== app.gen) return room.close();
  ui.busy(null);

  Object.assign(app, { role: 'host', room, code: room.code, engine: new GameEngine({ mode: MODES.ONLINE, settings }) });
  const hostId = `h-${clientId()}`;
  app.engine.apply({ type: 'addPlayer', player: { id: hostId, name } });
  app.myIds = new Set([hostId]);

  room.on('hello', onGuestHello);
  room.on('leave', ({ playerId }) => {
    const phase = app.engine?.state.phase;
    const res = app.engine?.apply(
      phase === PHASES.LOBBY ? { type: 'removePlayer', playerId } : { type: 'setConnected', playerId, connected: false },
    );
    if (res?.ok) commit(res.events);
  });
  room.on('action', ({ playerId, action }) => {
    if (!GUEST_ACTIONS.has(action.type)) return;
    const res = authorityApply({ type: action.type, bet: action.bet, call: action.call, playerId });
    if (!res.ok && action.type !== 'draft') room.sendTo(playerId, { type: 'error', code: res.error });
  });
  room.on('error', (err) => console.warn('[host]', err));

  ui.setRoomChip(room.code);
  analytics.roomCreated();
  commit([]);
}

function onGuestHello({ link, name, clientId: cid }) {
  const room = app.room;
  const engine = app.engine;
  if (!engine) return;
  const safe = String(cid ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 24);
  if (!safe) return room.reject(link, 'rejected');
  const id = `g-${safe}`;
  const known = engine.state.players.some((p) => p.id === id);
  const res = known
    ? engine.apply({ type: 'setConnected', playerId: id, connected: true })
    : engine.apply({ type: 'addPlayer', player: { id, name: sanitizeName(name, t('setup.defaultGuest')) } });
  if (!res.ok) return room.reject(link, res.error);
  room.admit(link, id, engine.getPublicState());
  commit(res.events);
}

/* ── online: guest ── */

async function joinRoom(code, name) {
  endSession();
  const gen = app.gen;
  ui.busy(t('net.joining', { code }));
  let room;
  try {
    room = await ClientRoom.join(code, { name, clientId: clientId() });
  } catch (err) {
    if (gen === app.gen) {
      ui.busy(null);
      ui.toast(netErrorText(err), 'warn');
    }
    return;
  }
  if (gen !== app.gen) return room.leave();
  ui.busy(null);

  Object.assign(app, { role: 'client', room, code, myIds: new Set([room.playerId]), state: room.initialState });
  storage.set('stg.lastRoom', code, 'sessionStorage');
  room.on('state', ({ state, events }) => {
    if (gen !== app.gen || (app.state && state.seq < app.state.seq)) return;
    app.state = state;
    route(state, events);
  });
  room.on('error', (code) => {
    ui.unlockControls();
    ui.toast(t(`err.${code}`), 'warn');
  });
  room.on('lost', (reason) => {
    if (gen !== app.gen) return;
    ui.toast(t(`net.${reason}`), 'warn');
    app.room = null; // already torn down
    endSession();
    ui.showScreen('home');
  });
  ui.setRoomChip(code);
  analytics.roomJoined();
  route(room.initialState, []);
}

function netErrorText(err) {
  const known = ['libLoad', 'roomNotFound', 'timeout', 'full', 'noCode', 'browser-incompatible', 'duplicate', 'network'];
  return t(`net.${known.includes(err?.code) ? err.code : 'generic'}`);
}

/* ─────────────────────────── setup & join forms ─────────────────────────── */

function openSetup(mode) {
  app.setupMode = mode;
  const form = $('#setupForm');
  $$('[data-show-for]', form).forEach((el) => (el.hidden = !el.dataset.showFor.split(' ').includes(mode)));
  $('#nickname').value = prefs.nickname;
  const deck = form.querySelector(`input[name="deckMode"][value="${prefs.deckMode}"]`) ?? form.querySelector('input[name="deckMode"]');
  deck.checked = true;
  const pot = form.querySelector(`input[name="potMode"][value="${prefs.potMode}"]`) ?? form.querySelector('input[name="potMode"]');
  pot.checked = true;
  renderSegmented($('#anteOptions'), 'ante', ANTE_OPTIONS, prefs.ante);
  renderSegmented($('#chipOptions'), 'chips', CHIP_OPTIONS, prefs.startChips);
  if (!prefs.localNames.length) prefs.localNames = ['', ''];
  renderLocalNames();
  renderSetupTexts();
  ui.showScreen('setup');
}

function renderSetupTexts() {
  const mode = app.setupMode;
  const key = mode === 'online' ? 'online' : mode;
  $('#setupEyebrow').textContent = t(`mode.${key}`);
  $('#setupTitle').textContent = t(`setup.title.${key}`);
  $('#setupLede').textContent = t(`setup.lede.${key}`);
  $('#setupSubmit').textContent = t(`setup.submit.${key}`);
  renderLocalNames();
}

function renderSegmented(host, name, options, selected) {
  const value = options.includes(selected) ? selected : options[1];
  host.innerHTML = options
    .map((n) => `<label class="segmented__opt"><input type="radio" name="${name}" value="${n}" ${n === value ? 'checked' : ''} /><span class="num">${n.toLocaleString()}</span></label>`)
    .join('');
}

function renderLocalNames() {
  const list = $('#localPlayers');
  if (!list) return;
  const names = prefs.localNames;
  list.innerHTML = names
    .map((n, i) => `<li class="name-row">
        <span class="avatar avatar--index">${i + 1}</span>
        <input class="input" data-index="${i}" maxlength="16" value="${escapeAttr(n)}" placeholder="${escapeAttr(t('setup.playerN', { n: i + 1 }))}" aria-label="${escapeAttr(t('setup.playerN', { n: i + 1 }))}" />
        <button class="icon-btn icon-btn--sm" type="button" data-cmd="removeLocal" data-index="${i}" ${names.length <= RULES.minPlayers ? 'disabled' : ''} aria-label="${escapeAttr(t('setup.remove'))}">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17"/></svg></button>
      </li>`)
    .join('');
  $('#localCount').textContent = `${names.length} / ${RULES.maxPlayers}`;
  $('#addLocalBtn').disabled = names.length >= RULES.maxPlayers;
}

function escapeAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function submitSetup(e) {
  e.preventDefault();
  audio.unlock();
  const data = new FormData(e.target);
  const settings = {
    deckMode: String(data.get('deckMode')),
    potMode: String(data.get('potMode')),
    ante: Number(data.get('ante')),
    startChips: Number(data.get('chips')),
  };
  Object.assign(prefs, settings);
  const nick = String(data.get('nickname') ?? '').trim();
  if (app.setupMode !== 'local') prefs.nickname = nick;
  savePrefs();

  if (app.setupMode === 'single') {
    startLocal(MODES.SINGLE, settings, [sanitizeName(nick, t('setup.defaultSolo'))]);
  } else if (app.setupMode === 'local') {
    const names = prefs.localNames.map((n, i) => sanitizeName(n, t('setup.playerN', { n: i + 1 })));
    startLocal(MODES.LOCAL, settings, names);
  } else {
    hostRoom(settings, sanitizeName(nick, t('setup.defaultHost')));
  }
}

function openJoin(code = '') {
  $('#joinCode').value = normalizeRoomCode(code);
  $('#joinName').value = prefs.nickname;
  ui.showScreen('join');
  (code ? $('#joinName') : $('#joinCode')).focus({ preventScroll: true });
}

function submitJoin(e) {
  e.preventDefault();
  audio.unlock();
  const code = normalizeRoomCode($('#joinCode').value);
  if (!isValidRoomCode(code)) {
    ui.toast(t('err.badCode'), 'warn');
    $('#joinCode').focus();
    return;
  }
  const nick = $('#joinName').value.trim();
  prefs.nickname = nick;
  savePrefs();
  joinRoom(code, sanitizeName(nick, t('setup.defaultGuest')));
}

/* ─────────────────────────── commands ─────────────────────────── */

async function confirmLeave() {
  if (!app.role) return true;
  if (!inPlay() && app.role !== 'host') return true;
  return ui.confirm({
    title: t(app.role === 'host' ? 'confirm.closeTitle' : 'confirm.leaveTitle'),
    text: t(app.role === 'host' ? 'confirm.closeText' : 'confirm.leaveText'),
    ok: t(app.role === 'host' ? 'game.closeRoom' : 'game.leave'),
  });
}

function inviteLink() {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', app.code);
  const peer = new URLSearchParams(location.search).get('peer');
  if (peer) url.searchParams.set('peer', peer);
  return url.toString();
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  ui.toast(t('toast.copied'));
}

function effectiveTheme() {
  return document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function syncSoundButton() {
  const btn = $('#soundBtn');
  btn.setAttribute('aria-pressed', String(!audio.isMuted()));
  btn.classList.toggle('is-muted', audio.isMuted());
}

const commands = {
  async home() {
    if (!(await confirmLeave())) return;
    endSession();
    history.replaceState(null, '', location.pathname + keepPeerParam());
    ui.showScreen('home');
  },
  leave() {
    return commands.home();
  },
  setup(data) {
    openSetup(data.mode);
  },
  join() {
    openJoin('');
  },
  addLocal() {
    if (prefs.localNames.length >= RULES.maxPlayers) return;
    prefs.localNames.push('');
    renderLocalNames();
    $(`#localPlayers input[data-index="${prefs.localNames.length - 1}"]`)?.focus();
  },
  removeLocal(data) {
    if (prefs.localNames.length <= RULES.minPlayers) return;
    prefs.localNames.splice(Number(data.index), 1);
    renderLocalNames();
  },
  toggleSound() {
    audio.setMuted(!audio.isMuted());
    syncSoundButton();
    audio.click();
  },
  toggleTheme() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('stg.theme', next); // read raw by the pre-paint script
    } catch {
      /* ignore */
    }
  },
  openDrawer(data) {
    ui.openDrawer(data.tab);
  },
  closeDrawer() {
    ui.closeDrawer();
  },
  copyCode() {
    if (app.code) copy(app.code);
  },
  copyLink() {
    if (app.code) copy(inviteLink());
  },
  lobbyStart() {
    if (app.role === 'host') dispatch({ type: 'start' });
  },
  async endGame() {
    if (app.role === 'client' || !inPlay()) return;
    const ok = await ui.confirm({ title: t('confirm.endTitle'), text: t('confirm.endText'), ok: t('game.end') });
    if (ok && app.engine) authorityApply({ type: 'end' });
  },
  async resetStats() {
    const ok = await ui.confirm({ title: t('confirm.resetTitle'), text: t('confirm.resetText'), ok: t('stats.reset') });
    if (!ok) return;
    stats.reset();
    ui.toast(t('toast.statsReset'));
  },
  rematch() {
    if (!app.engine) return;
    ui.closeGameOver();
    // Drop seats whose owners have left before dealing a new game.
    for (const p of [...app.engine.state.players]) {
      if (!p.connected) app.engine.apply({ type: 'removePlayer', playerId: p.id });
    }
    ui.resetTable();
    dispatch({ type: 'start' });
  },
};

function keepPeerParam() {
  const peer = new URLSearchParams(location.search).get('peer');
  return peer ? `?peer=${encodeURIComponent(peer)}` : '';
}

/* ─────────────────────────── boot ─────────────────────────── */

function boot() {
  i18n.init();
  ui.init({ dispatch });
  initAds();
  analytics.init();
  syncSoundButton();

  const langSelect = $('#langSelect');
  langSelect.value = i18n.getLang();
  langSelect.addEventListener('change', () => i18n.setLang(langSelect.value));
  document.addEventListener('langchange', () => {
    langSelect.value = i18n.getLang();
    renderSetupTexts();
    ui.refresh();
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-cmd]');
    if (!el || el.disabled) return;
    audio.unlock();
    commands[el.dataset.cmd]?.({ ...el.dataset });
  });
  document.addEventListener('pointerdown', () => audio.unlock(), { once: true });

  $('#setupForm').addEventListener('submit', submitSetup);
  $('#localPlayers').addEventListener('input', (e) => {
    const i = Number(e.target.dataset.index);
    if (Number.isInteger(i)) prefs.localNames[i] = e.target.value;
  });
  $('#joinForm').addEventListener('submit', submitJoin);
  $('#joinCode').addEventListener('input', (e) => {
    e.target.value = normalizeRoomCode(e.target.value);
  });

  // Another tab finished a hand: pick up its totals.
  window.addEventListener('storage', (e) => {
    if (e.key === stats.key) stats.reload();
  });

  window.addEventListener('beforeunload', (e) => {
    if (inPlay() || (app.role === 'host' && app.room?.guestCount)) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  window.addEventListener('pagehide', () => {
    if (app.room) endSession();
  });

  const room = normalizeRoomCode(new URLSearchParams(location.search).get('room'));
  if (isValidRoomCode(room)) openJoin(room);
  else ui.showScreen('home');
}

boot();
