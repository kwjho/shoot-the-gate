/**
 * ui.js — rendering and choreography.
 *
 * The UI never mutates game state. `present(state, events, ctx)` queues a
 * presentation: event animations play in order (deal → flip → stamp …), and
 * only then are numbers, controls and the scoreboard synced to `state`, so a
 * result is never spoiled before the ball card turns over.
 *
 * ctx = { myIds: Set<playerId>, role: 'local' | 'host' | 'client', code }
 */

import { t, getLang } from './i18n.js';
import {
  PHASES, MODES, DECK_MODES, RULES, betLimits, computeOdds, postPenalty, rankLabel, isRed, SUIT_GLYPH,
} from './gameLogic.js';
import * as audio from './audioFx.js';
import * as fx from './fx.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (n) => Number(n || 0).toLocaleString(getLang());
const pct = (x) => `${Math.round((x || 0) * 100)}%`;

let els = {};
let handlers = { dispatch: () => {} };
let current = { state: null, ctx: null };
let chain = Promise.resolve();
const bet = { key: '', value: 0, call: null };

/* ─────────────────────────── setup ─────────────────────────── */

export function init(opts) {
  handlers = { ...handlers, ...opts };
  els = {
    body: document.body,
    table: $('#table'),
    gate: $('#gate'),
    shoeTop: $('#shoeTop'),
    shoe: $('#shoe'),
    shoeCount: $('#shoeCount'),
    pot: $('#pot'),
    potLabel: $('#potLabel'),
    potValue: $('#potValue'),
    range: $('#range'),
    result: $('#result'),
    turnbar: $('#turnbar'),
    players: $('#players'),
    controls: $('#controls'),
    log: $('#log'),
    logLatest: $('#logLatest'),
    logBox: $('#logBox'),
    gameActions: $('#gameActions'),
    toasts: $('#toasts'),
    busy: $('#busy'),
    busyText: $('#busyText'),
    drawer: $('#drawer'),
    stats: $('#stats'),
    gameOver: $('#gameOver'),
    confirm: $('#confirm'),
    vignette: $('#vignette'),
    roomChip: $('#roomChip'),
    roomChipCode: $('#roomChipCode'),
  };

  buildRange();
  buildHeroCards();

  els.controls.addEventListener('click', onControlsClick);
  els.controls.addEventListener('input', (e) => {
    if (e.target.id === 'betRange') setBet(Number(e.target.value));
  });
  els.gate.addEventListener('click', (e) => {
    // Tapping the face-down pearl slot is a shortcut for "Shoot".
    if (e.target.closest('[data-slot="ball"]') && canShoot()) shoot();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.closest('input, select, button, textarea, dialog')) return;
    if (document.body.dataset.screen !== 'game') return;
    const primary = $('[data-act="deal"], [data-act="shoot"]', els.controls);
    if (primary && !primary.disabled) primary.click();
  });

  $$('.tab', els.drawer).forEach((tab) => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));
  els.drawer.addEventListener('click', (e) => {
    if (e.target === els.drawer) closeDrawer(); // backdrop
  });
  els.gameOver.addEventListener('cancel', (e) => e.preventDefault());
}

export function showScreen(name) {
  document.body.dataset.screen = name;
  $$('[data-screen]', $('#main')).forEach((s) => (s.hidden = s.dataset.screen !== name));
  window.scrollTo({ top: 0 });
}

/* ─────────────────────────── cards ─────────────────────────── */

export function makeCard(card, faceUp = false) {
  const el = document.createElement('div');
  el.className = `card${faceUp ? ' is-up' : ''}`;
  el.innerHTML = '<div class="card__inner"><div class="card__face card__back"></div><div class="card__face card__front"></div></div>';
  if (card) paintCard(el, card);
  return el;
}

function paintCard(el, card) {
  el.dataset.id = card.id;
  const front = $('.card__front', el);
  const rank = rankLabel(card.r);
  const suit = SUIT_GLYPH[card.s];
  front.dataset.color = isRed(card.s) ? 'red' : 'black';
  const value = card.r === 1 || card.r > 10 ? `<small class="card__value">= ${card.r}</small>` : '';
  const idx = `<b>${rank}</b><i>${suit}</i>`;
  front.innerHTML = `<span class="card__idx">${idx}</span><span class="card__center"><b>${rank}</b><i>${suit}</i>${value}</span><span class="card__idx card__idx--br">${idx}</span>`;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `${rank}${suit}`);
}

function slot(name) {
  return $(`[data-slot="${name}"]`, els.gate);
}

async function dealCard(slotName, card, { delay = 0 } = {}) {
  const target = slot(slotName);
  $('.card', target)?.remove();
  const el = makeCard(card, false);
  target.append(el);
  if (fx.prefersReducedMotion()) return el;
  const from = els.shoeTop.getBoundingClientRect();
  const to = el.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const s = from.width / (to.width || 1);
  setTimeout(() => audio.slide(), delay);
  await el.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) rotate(-18deg) scale(${s})`, opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { transform: 'translate(0, 0) rotate(1.5deg) scale(1.02)', offset: 0.82 },
      { transform: 'translate(0, 0) rotate(0) scale(1)', opacity: 1 },
    ],
    { duration: 620, delay, easing: 'cubic-bezier(.2,.9,.25,1)', fill: 'backwards' },
  ).finished;
  return el;
}

async function flipCard(el) {
  if (!el) return;
  audio.flip();
  el.classList.add('is-up');
  if (fx.prefersReducedMotion()) return;
  await $('.card__inner', el).animate(
    [
      { transform: 'rotateY(0deg)' },
      { transform: 'rotateY(90deg) translateZ(34px) scale(1.07)', offset: 0.5 },
      { transform: 'rotateY(180deg)' },
    ],
    { duration: 640, easing: 'cubic-bezier(.3,.7,.2,1)' },
  ).finished;
}

async function clearTable({ animate = true } = {}) {
  hideStamp();
  delete els.table.dataset.lamp;
  const cards = $$('.card', els.gate);
  if (!cards.length) return;
  if (animate && !fx.prefersReducedMotion()) {
    await Promise.all(
      cards.map((c, i) =>
        c.animate(
          [
            { transform: 'none', opacity: 1 },
            { transform: `translate(${-30 - i * 10}px, 40px) rotate(${-10 + i * 4}deg) scale(.86)`, opacity: 0 },
          ],
          { duration: 300, delay: i * 45, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' },
        ).finished,
      ),
    );
  }
  cards.forEach((c) => c.remove());
}

/** Make the table match `state` without animation (joins, reconnects, language switches). */
function syncTable(state) {
  const want = { left: state.posts?.[0], right: state.posts?.[1], ball: state.ball };
  for (const [name, card] of Object.entries(want)) {
    const existing = $('.card', slot(name));
    if (!card) {
      existing?.remove();
      continue;
    }
    if (existing?.dataset.id === card.id) {
      existing.classList.add('is-up');
      continue;
    }
    existing?.remove();
    slot(name).append(makeCard(card, true));
  }
  if (!state.result) hideStamp();
}

function buildHeroCards() {
  const host = $('#heroCards');
  if (!host) return;
  const demo = [
    { r: 3, s: 'S', id: 'h1' },
    { r: 9, s: 'D', id: 'h2' },
    { r: 12, s: 'H', id: 'h3' },
  ];
  demo.forEach((c, i) => {
    const el = makeCard(c, i !== 1);
    el.classList.add('hero-card');
    el.style.setProperty('--i', i);
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    const toggle = () => {
      audio.unlock();
      audio.flip();
      el.classList.toggle('is-up');
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle()));
    host.append(el);
  });
}

/* ─────────────────────────── stamp & lamp ─────────────────────────── */

function showStamp(tone, glyph, amount = '') {
  els.result.className = `result result--${tone}`;
  els.result.innerHTML = `<span class="stamp"><span class="stamp__glyph">${esc(glyph)}</span>${
    amount ? `<span class="stamp__amount num">${esc(amount)}</span>` : ''
  }</span>`;
  void els.result.offsetWidth;
  els.result.classList.add('is-shown');
}

function hideStamp() {
  els.result.className = 'result';
  els.result.textContent = '';
}

function setLamp(tone) {
  fx.pulse(els.table, 'data-lamp', tone);
}

/* ─────────────────────────── presentation queue ─────────────────────────── */

export function present(state, events = [], ctx) {
  const run = async () => {
    current = { state, ctx };
    const animated = events.length > 0 && document.body.dataset.screen === 'game';
    if (animated) {
      els.controls.classList.add('is-locked');
      if (events.some((e) => e.type === 'turn' || e.type === 'start' || e.type === 'gameover')) {
        await clearTable({ animate: !events.some((e) => e.type === 'start') });
      }
      for (const ev of events) await animateEvent(ev, state, ctx);
    }
    renderGame(state, ctx);
    els.controls.classList.remove('is-locked');
    if (events.some((e) => e.type === 'gameover')) {
      await fx.wait(700);
      openGameOver(state, ctx);
    }
  };
  chain = chain.then(run, run).catch((err) => console.error('[ui]', err));
  return chain;
}

/** Wait for queued animations to finish (used by the authority before scheduling the next turn). */
export function settled() {
  return chain;
}

async function animateEvent(ev, state, ctx) {
  const name = (id) => state.players.find((p) => p.id === id)?.name ?? '';
  switch (ev.type) {
    case 'start':
      audio.gong();
      if (els.gameOver.open) els.gameOver.close();
      break;
    case 'reshuffle':
      fx.pulse(els.shoe, 'data-shuffle', '1');
      audio.shuffle();
      if (!ev.everyHand) toast(t('toast.reshuffle', { n: ev.total }));
      await fx.wait(ev.everyHand ? 200 : 480);
      break;
    case 'ante': {
      audio.chips(4);
      fx.pulse(els.pot, 'data-bump', '1');
      if (ev.total) fx.floater(els.potValue, `+${fmt(ev.total)}`, 'gold');
      for (const [pid, amt] of Object.entries(ev.paid)) fx.floater(playerRow(pid), `−${fmt(amt)}`, 'muted');
      tweenPot(state.pot);
      await fx.wait(260);
      break;
    }
    case 'turn':
      audio.turn();
      break;
    case 'deal': {
      const [a, b] = ev.posts;
      const [ea, eb] = await Promise.all([dealCard('left', a), dealCard('right', b, { delay: 150 })]);
      await Promise.all([flipCard(ea), fx.wait(140).then(() => flipCard(eb))]);
      renderRange(state, ctx);
      break;
    }
    case 'nogate':
      showStamp('nogate', t('stamp.nogate'));
      setLamp('nogate');
      audio.nogate();
      announce(t('result.nogate', { name: name(ev.playerId) }));
      await fx.wait(300);
      break;
    case 'shoot':
      await playShot(ev, state, ctx);
      break;
    case 'skip':
      showStamp('nogate', t('stamp.skip'));
      break;
    case 'join':
    case 'rejoin':
      if (state.phase !== PHASES.LOBBY && !ctx.myIds.has(ev.playerId)) toast(t(`toast.${ev.type}`, { name: name(ev.playerId) }));
      break;
    case 'leave':
      if (state.phase !== PHASES.LOBBY) toast(t('toast.leave', { name: name(ev.playerId) }), 'warn');
      break;
  }
}

async function playShot(ev, state, ctx) {
  const el = await dealCard('ball', ev.ball);
  els.table.classList.add('is-suspense');
  await fx.wait(fx.prefersReducedMotion() ? 0 : 420);
  await flipCard(el);
  els.table.classList.remove('is-suspense');
  renderRange(state, ctx);

  const who = state.players.find((p) => p.id === ev.playerId);
  const row = playerRow(ev.playerId);
  if (ev.outcome === 'win') {
    showStamp(ev.big ? 'big' : 'win', t('stamp.win'), `+${fmt(ev.amount)}`);
    setLamp(ev.big ? 'big' : 'win');
    if (ev.big) {
      audio.bigWin();
      fx.confetti(els.gate, { count: ev.swept ? 200 : 150 });
    } else {
      audio.win();
    }
    fx.floater(row, `+${fmt(ev.amount)}`, 'win');
  } else if (ev.outcome === 'post') {
    showStamp('post', t('stamp.post'), `−${fmt(ev.amount)}`);
    setLamp('post');
    audio.post();
    fx.shake(els.table, 8);
    fx.pulse(els.vignette, 'data-on', 'post');
    fx.floater(row, `−${fmt(ev.amount)}`, 'post');
  } else {
    showStamp('miss', t('stamp.miss'), `−${fmt(ev.amount)}`);
    setLamp('miss');
    audio.miss();
    fx.floater(row, `−${fmt(ev.amount)}`, 'muted');
  }
  announce(resultSentence(state.result ?? ev, who?.name ?? ''));
  tweenPot(state.pot);
  await fx.wait(320);
}

function resultSentence(r, name) {
  if (!r) return '';
  return t(`result.${r.outcome}`, { name, amount: fmt(r.amount), bet: fmt(r.bet), mult: RULES.postMultiplier });
}

function announce(text) {
  els.result.setAttribute('aria-label', text);
}

/* ─────────────────────────── game rendering ─────────────────────────── */

function renderGame(state, ctx) {
  current = { state, ctx };
  if (state.phase === PHASES.LOBBY) return;
  syncTable(state);
  renderHud(state);
  renderTurnbar(state, ctx);
  renderPlayers(state, ctx);
  renderControls(state, ctx);
  renderRange(state, ctx);
  renderLog(state);
  renderGameActions(state, ctx);
  if (els.drawer.open) renderStats(state);
  if (state.phase !== PHASES.GAMEOVER && els.gameOver.open) els.gameOver.close();
}

/** Re-render everything in the current language (no animation). */
export function refresh() {
  if (current.state) {
    renderGame(current.state, current.ctx);
    if (current.state.phase === PHASES.LOBBY) renderLobby(current.state, current.ctx);
  }
  if (els.drawer?.open) renderStats(current.state);
}

export function resetTable() {
  $$('.card', els.gate).forEach((c) => c.remove());
  hideStamp();
  delete els.table.dataset.lamp;
  els.controls.innerHTML = '';
  delete els.controls.dataset.sig;
  els.players.innerHTML = '';
  els.potValue.dataset.value = '0';
  bet.key = '';
  current = { state: null, ctx: null };
  if (els.gameOver.open) els.gameOver.close();
}

function tweenPot(value) {
  fx.tweenNumber(els.potValue, value, { format: fmt });
}

function renderHud(state) {
  els.potLabel.textContent = state.mode === MODES.SINGLE ? t('hud.bank') : t('hud.pot');
  tweenPot(state.pot);
  const cfg = DECK_MODES[state.settings.deckMode];
  els.shoeCount.textContent = cfg.everyHand ? '52' : `${state.deckCount}`;
  els.shoe.title = t('hud.shoe', { n: state.deckCount, total: state.deckTotal });
  els.shoe.dataset.low = String(!cfg.everyHand && state.deckCount < cfg.reshuffleBelow + 6);
}

function hue(name) {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

function initial(name) {
  return (Array.from(String(name).trim())[0] || '?').toUpperCase();
}

function avatar(p, cls = 'avatar') {
  return `<span class="${cls}" style="--hue:${hue(p.name)}">${esc(initial(p.name))}</span>`;
}

function isMine(ctx, id) {
  return !!ctx?.myIds?.has(id);
}

function displayName(state, ctx, p) {
  // In pass-and-play every seat is "mine", so show names; elsewhere "You" reads better.
  return isMine(ctx, p.id) && ctx.role !== 'local' ? t('turn.you') : p.name;
}

function renderTurnbar(state, ctx) {
  const p = state.players[state.turnIndex];
  const mine = p && isMine(ctx, p.id);
  let what;
  switch (state.phase) {
    case PHASES.AWAIT_DEAL: what = mine ? t('turn.yourDeal') : t('turn.dealing'); break;
    case PHASES.BETTING: what = mine ? t('turn.yourBet') : t('turn.betting'); break;
    case PHASES.RESOLVED: what = t(`turn.res.${state.result?.outcome ?? 'skip'}`); break;
    case PHASES.PAUSED: what = t('turn.paused'); break;
    case PHASES.GAMEOVER: what = t('turn.gameover'); break;
    default: what = '';
  }
  const showWho = p && state.phase !== PHASES.PAUSED && state.phase !== PHASES.GAMEOVER;
  els.turnbar.dataset.mine = String(!!mine && state.phase !== PHASES.GAMEOVER);
  els.turnbar.innerHTML = `
    ${showWho ? avatar(p, 'avatar avatar--lg') : '<span class="avatar avatar--lg avatar--seal">門</span>'}
    <span class="turnbar__text">
      <span class="turnbar__who">${showWho ? esc(displayName(state, ctx, p)) : esc(t('app.title'))}</span>
      <span class="turnbar__what">${esc(what)}</span>
    </span>
    <span class="turnbar__tags">
      ${state.mode !== MODES.SINGLE ? `<span class="tag">${esc(t('turn.round', { n: state.round }))}</span>` : ''}
      <span class="tag tag--quiet">${esc(t(`deck.short.${state.settings.deckMode}`))}</span>
    </span>`;
}

function playerRow(id) {
  return els.players.querySelector(`[data-pid="${CSS.escape(id)}"]`);
}

function renderPlayers(state, ctx) {
  const list = els.players;
  const live = new Set();
  const inHand = [PHASES.AWAIT_DEAL, PHASES.BETTING, PHASES.RESOLVED].includes(state.phase);
  state.players.forEach((p, i) => {
    live.add(p.id);
    let li = playerRow(p.id);
    if (!li) {
      li = document.createElement('li');
      li.className = 'player';
      li.dataset.pid = p.id;
      li.innerHTML = '<span class="avatar"></span><span class="player__body"><span class="player__name"></span><span class="player__meta"></span></span><span class="player__chips num" data-value="0">0</span>';
    }
    list.append(li);
    const active = inHand && i === state.turnIndex;
    li.classList.toggle('is-active', active);
    li.classList.toggle('is-me', isMine(ctx, p.id) && ctx.role !== 'local');
    li.classList.toggle('is-offline', !p.connected);
    li.classList.toggle('is-out', p.chips <= 0 && state.phase !== PHASES.LOBBY);
    li.classList.toggle('is-winner', state.phase === PHASES.GAMEOVER && state.winnerIds.includes(p.id));
    if (active) li.setAttribute('aria-current', 'true');
    else li.removeAttribute('aria-current');
    const av = $('.avatar', li);
    av.style.setProperty('--hue', hue(p.name));
    av.textContent = initial(p.name);
    $('.player__name', li).innerHTML = `${esc(p.name)}${li.classList.contains('is-me') ? ` <em>${esc(t('board.you'))}</em>` : ''}`;
    let meta;
    if (!p.connected) meta = t('board.offline');
    else if (p.sittingOut) meta = t('board.nextRound');
    else if (p.chips <= 0) meta = t('board.out');
    else if (active) meta = t('board.playing');
    else meta = t('board.record', { w: p.wins, h: p.postHits });
    $('.player__meta', li).textContent = meta;
    fx.tweenNumber($('.player__chips', li), p.chips, { format: fmt });
  });
  $$('.player', list).forEach((li) => !live.has(li.dataset.pid) && li.remove());
}

/* ── range strip: A…K with remaining-card meters ── */

function buildRange() {
  const cells = Array.from({ length: 13 }, (_, i) => {
    const r = i + 1;
    return `<li class="range__cell" data-r="${r}"><span class="range__meter"><i></i></span><span class="range__rank">${rankLabel(r)}</span></li>`;
  }).join('');
  els.range.innerHTML = `<ol class="range__cells" aria-hidden="true">${cells}</ol><p class="range__caption" id="rangeCaption"></p>`;
}

function renderRange(state, ctx) {
  const counts = state.rankCounts ?? [];
  const cfg = DECK_MODES[state.settings.deckMode];
  const full = cfg.decks * 4;
  const gate = state.gate;
  const p = state.players[state.turnIndex];
  const mine = p && isMine(ctx, p.id) && state.phase === PHASES.BETTING;
  const call = mine ? bet.call : state.draft?.call ?? null;

  $$('.range__cell', els.range).forEach((cell) => {
    const r = Number(cell.dataset.r);
    let zone = '';
    if (gate) {
      if (gate.kind === 'pair') {
        if (r === gate.lo) zone = 'post';
        else if (call) zone = (call === 'high' ? r > gate.lo : r < gate.lo) ? 'in' : 'out';
        else zone = 'maybe';
      } else if (r === gate.lo || r === gate.hi) zone = 'post';
      else zone = r > gate.lo && r < gate.hi ? 'in' : 'out';
    }
    cell.dataset.zone = zone;
    cell.classList.toggle('is-ball', !!state.ball && state.ball.r === r);
    // every-hand mode shows a full fresh deck minus what is on the table
    const n = cfg.everyHand && !gate ? full : counts[r] ?? 0;
    $('i', cell).style.setProperty('--fill', String(Math.min(1, n / full)));
    cell.title = t('range.left', { rank: rankLabel(r), n });
  });

  const cap = $('#rangeCaption', els.range);
  const odds = computeOdds(gate, counts);
  let text;
  if (!gate) text = t('range.idle');
  else if (gate.kind === 'nogate') text = t('range.nogate');
  else if (gate.kind === 'pair') {
    text = call
      ? t('range.oddsCall', { win: pct(call === 'high' ? odds.high : odds.low), post: pct(odds.post) })
      : t('range.oddsPair', { high: pct(odds.high), low: pct(odds.low), post: pct(odds.post) });
  } else text = t('range.odds', { win: pct(odds.win), post: pct(odds.post) });
  cap.textContent = text;
}

/* ── controls ── */

function canShoot() {
  const { state, ctx } = current;
  if (!state || state.phase !== PHASES.BETTING || els.controls.classList.contains('is-locked')) return false;
  const p = state.players[state.turnIndex];
  if (!p || !isMine(ctx, p.id)) return false;
  return state.gate.kind !== 'pair' || !!bet.call;
}

function syncBetDraft(state) {
  const key = `${state.hand}|${state.turnIndex}`;
  const { min, max } = betLimits(state);
  if (bet.key !== key) {
    bet.key = key;
    bet.value = Math.min(max, Math.max(min, state.settings.ante));
    bet.call = state.gate?.forcedCall ?? null;
  }
  bet.value = Math.min(max, Math.max(Math.max(1, min), bet.value));
}

function renderControls(state, ctx) {
  const el = els.controls;
  const p = state.players[state.turnIndex];
  const mine = !!p && isMine(ctx, p.id);
  const lang = getLang();
  let sig = '';
  let html = '';

  if (state.phase === PHASES.AWAIT_DEAL && p) {
    sig = `deal|${p.id}|${mine}|${state.hand}|${lang}`;
    html = mine
      ? `<div class="ctl ctl--deal">
          ${state.mode === MODES.LOCAL ? `<p class="ctl__eyebrow">${esc(t('ctl.passTo', { name: p.name }))}</p>` : ''}
          <button class="btn btn--primary btn--xl" type="button" data-act="deal"><span class="btn__glyph" aria-hidden="true">發</span>${esc(t('ctl.deal'))}</button>
          <p class="ctl__hint">${esc(t('ctl.dealHint', { ante: fmt(state.settings.ante) }))}</p>
        </div>`
      : waitingHtml(t('ctl.waitDeal', { name: p.name }));
  } else if (state.phase === PHASES.BETTING && p) {
    const { min, max } = betLimits(state);
    if (mine) {
      syncBetDraft(state);
      sig = `bet|${p.id}|${state.hand}|${min}|${max}|${lang}`;
      html = betHtml(state, min, max);
    } else {
      const d = state.draft;
      sig = `watch|${p.id}|${d?.bet}|${d?.call}|${lang}`;
      const bits = [];
      if (d?.call) bits.push(t(d.call === 'high' ? 'ctl.higher' : 'ctl.lower'));
      if (d?.bet) bits.push(t('ctl.eyeing', { bet: fmt(d.bet) }));
      html = waitingHtml(t('ctl.waitBet', { name: p.name }), bits.join(' · '));
    }
  } else if (state.phase === PHASES.RESOLVED && p) {
    const r = state.result;
    sig = `res|${state.hand}|${r?.outcome}|${state.seq}|${lang}`;
    const next = state.mode === MODES.SINGLE ? '' : nextPlayerName(state);
    html = `<div class="ctl ctl--result ctl--${esc(r?.outcome)}">
        <p class="ctl__result">${esc(resultSentence(r, p.name))}</p>
        ${next ? `<p class="ctl__hint"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span> ${esc(t('ctl.nextUp', { name: next }))}</p>` : ''}
      </div>`;
  } else if (state.phase === PHASES.PAUSED) {
    sig = `paused|${lang}`;
    html = waitingHtml(t('ctl.paused'));
  } else if (state.phase === PHASES.GAMEOVER) {
    sig = `over|${state.seq}|${lang}|${ctx.role}`;
    html = `<div class="ctl ctl--over"><p class="ctl__result">${esc(gameOverTitle(state))}</p>
      ${ctx.role !== 'client' ? `<button class="btn btn--primary btn--xl" type="button" data-cmd="rematch">${esc(t('over.again'))}</button>` : `<p class="ctl__hint">${esc(t('over.waitHost'))}</p>`}</div>`;
  }

  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig;
    el.innerHTML = html;
  }
  if (state.phase === PHASES.BETTING && mine) updateBetUi(state);
}

function nextPlayerName(state) {
  const n = state.players.length;
  for (let i = 1; i <= n; i++) {
    const p = state.players[(state.turnIndex + i) % n];
    if (p.chips > 0 && p.connected && !p.sittingOut) return p.name;
  }
  return '';
}

function waitingHtml(title, sub = '') {
  return `<div class="ctl ctl--wait"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <p class="ctl__wait">${esc(title)}</p>${sub ? `<p class="ctl__draft">${esc(sub)}</p>` : ''}</div>`;
}

function betHtml(state, min, max) {
  const gate = state.gate;
  const odds = computeOdds(gate, state.rankCounts);
  const call = gate.kind === 'pair'
    ? `<div class="call" role="group" aria-label="${esc(t('ctl.callLabel'))}">
        <p class="ctl__eyebrow">${esc(t('ctl.pairTitle', { rank: rankLabel(gate.lo) }))}</p>
        <div class="call__opts">
          <button class="call__btn" type="button" data-call="low" ${gate.forcedCall === 'high' ? 'disabled' : ''}>
            <span class="call__arrow" aria-hidden="true">↓</span><span>${esc(t('ctl.lower'))}</span><small class="num">${pct(odds?.low)}</small></button>
          <button class="call__btn" type="button" data-call="high" ${gate.forcedCall === 'low' ? 'disabled' : ''}>
            <span class="call__arrow" aria-hidden="true">↑</span><span>${esc(t('ctl.higher'))}</span><small class="num">${pct(odds?.high)}</small></button>
        </div>
      </div>`
    : '';
  return `<div class="ctl ctl--bet">
      ${call}
      <div class="bet">
        <div class="bet__head">
          <label class="bet__label" for="betRange">${esc(t('ctl.bet'))}</label>
          <output class="bet__value num" id="betValue" for="betRange"></output>
        </div>
        <div class="bet__slider">
          <button class="step" type="button" data-step="-1" aria-label="${esc(t('ctl.less'))}">−</button>
          <input type="range" id="betRange" min="${Math.max(1, min)}" max="${max}" step="1" />
          <button class="step" type="button" data-step="1" aria-label="${esc(t('ctl.more'))}">+</button>
        </div>
        <div class="bet__quick">
          <button class="chip-btn" type="button" data-quick="min">${esc(t('ctl.min'))}</button>
          <button class="chip-btn" type="button" data-quick="quarter">¼</button>
          <button class="chip-btn" type="button" data-quick="half">½</button>
          <button class="chip-btn" type="button" data-quick="max">${esc(t('ctl.max'))}</button>
        </div>
        <p class="bet__risk" id="betRisk"></p>
      </div>
      <button class="btn btn--shoot btn--xl" type="button" data-act="shoot"><span class="btn__glyph" aria-hidden="true">射</span><span id="shootLabel">${esc(t('ctl.shoot'))}</span></button>
    </div>`;
}

function updateBetUi(state) {
  const { min, max } = betLimits(state);
  const range = $('#betRange', els.controls);
  if (!range) return;
  range.value = String(bet.value);
  const span = max - Math.max(1, min);
  range.style.setProperty('--pct', span > 0 ? `${((bet.value - Math.max(1, min)) / span) * 100}%` : '100%');
  $('#betValue', els.controls).textContent = fmt(bet.value);
  const p = state.players[state.turnIndex];
  $('#betRisk', els.controls).textContent = t('ctl.risk', {
    win: fmt(bet.value),
    post: fmt(postPenalty(bet.value, p.chips)),
  });
  $$('[data-call]', els.controls).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.call === bet.call)));
  const shootBtn = $('[data-act="shoot"]', els.controls);
  const needCall = state.gate.kind === 'pair' && !bet.call;
  shootBtn.disabled = needCall;
  $('#shootLabel', els.controls).textContent = needCall ? t('ctl.pickCall') : t('ctl.shootFor', { bet: fmt(bet.value) });
  $$('[data-quick]', els.controls).forEach((b) => b.setAttribute('aria-pressed', String(quickValue(b.dataset.quick, state) === bet.value)));
  renderRange(state, current.ctx);
  els.table.classList.toggle('is-armed', !needCall);
}

function quickValue(kind, state) {
  const { min, max } = betLimits(state);
  const lo = Math.max(1, min);
  switch (kind) {
    case 'min': return lo;
    case 'quarter': return Math.max(lo, Math.round(max / 4));
    case 'half': return Math.max(lo, Math.round(max / 2));
    default: return max;
  }
}

function stepSize(max) {
  return max <= 40 ? 1 : max <= 400 ? 5 : max <= 2000 ? 10 : 50;
}

let draftTimer = 0;
function setBet(value, { silent = false } = {}) {
  const { state, ctx } = current;
  if (!state || state.phase !== PHASES.BETTING) return;
  const { min, max } = betLimits(state);
  bet.value = Math.min(max, Math.max(Math.max(1, min), Math.round(value)));
  updateBetUi(state);
  if (!silent) audio.click();
  // Online: let the table watch the bet move (throttled).
  if (ctx.role !== 'local') {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      const p = current.state?.players[current.state.turnIndex];
      if (p && current.state.phase === PHASES.BETTING) handlers.dispatch({ type: 'draft', playerId: p.id, bet: bet.value, call: bet.call });
    }, 140);
  }
}

function shoot() {
  const { state } = current;
  const p = state.players[state.turnIndex];
  els.controls.classList.add('is-locked');
  els.table.classList.remove('is-armed');
  handlers.dispatch({ type: 'shoot', playerId: p.id, bet: bet.value, call: bet.call });
}

function onControlsClick(e) {
  const btn = e.target.closest('button');
  // data-cmd buttons are handled by the app-level delegate in main.js
  if (!btn || btn.dataset.cmd || btn.disabled || els.controls.classList.contains('is-locked')) return;
  audio.unlock();
  const { state } = current;
  if (!state) return;
  const p = state.players[state.turnIndex];
  if (btn.dataset.act === 'deal') {
    els.controls.classList.add('is-locked');
    handlers.dispatch({ type: 'deal', playerId: p.id });
  } else if (btn.dataset.act === 'shoot') {
    if (canShoot()) shoot();
  } else if (btn.dataset.call) {
    bet.call = btn.dataset.call;
    setBet(bet.value);
  } else if (btn.dataset.quick) {
    setBet(quickValue(btn.dataset.quick, state));
  } else if (btn.dataset.step) {
    setBet(bet.value + Number(btn.dataset.step) * stepSize(betLimits(state).max));
  }
}

/** Unlock controls after a rejected action (e.g. host refused a stale bet). */
export function unlockControls() {
  els.controls.classList.remove('is-locked');
}

function renderLog(state) {
  const items = state.log.slice(0, 40);
  els.log.replaceChildren(
    ...items.map((entry) => {
      const li = document.createElement('li');
      li.className = `log__item tone-${entry.tone}`;
      li.textContent = t(entry.k, entry.v);
      return li;
    }),
  );
  els.logLatest.textContent = items[0] ? t(items[0].k, items[0].v) : '';
}

function renderGameActions(state, ctx) {
  const inGame = state.phase !== PHASES.GAMEOVER;
  const html = [
    ctx.role !== 'client' && inGame ? `<button class="btn btn--ghost btn--sm" type="button" data-cmd="endGame">${esc(t('game.end'))}</button>` : '',
    `<button class="btn btn--ghost btn--sm" type="button" data-cmd="leave">${esc(t(ctx.role === 'host' ? 'game.closeRoom' : 'game.leave'))}</button>`,
  ].join('');
  if (els.gameActions.dataset.sig !== html) {
    els.gameActions.dataset.sig = html;
    els.gameActions.innerHTML = html;
  }
}

/* ─────────────────────────── game over ─────────────────────────── */

function gameOverTitle(state) {
  const winners = state.players.filter((p) => state.winnerIds.includes(p.id)).map((p) => p.name);
  switch (state.endReason) {
    case 'bust': return t('over.bust');
    case 'brokeBank': return t('over.brokeBank');
    case 'lastStanding': return t('over.winner', { name: winners.join(', ') });
    default: return winners.length ? t('over.leader', { name: winners.join(', ') }) : t('over.ended');
  }
}

function openGameOver(state, ctx) {
  if (state.phase !== PHASES.GAMEOVER) return;
  $('#gameOverEyebrow').textContent = t('over.eyebrow');
  $('#gameOverTitle').textContent = gameOverTitle(state);
  const sorted = [...state.players].sort((a, b) => b.chips - a.chips);
  $('#standings').innerHTML = sorted
    .map((p, i) => `<li class="standing${state.winnerIds.includes(p.id) ? ' is-winner' : ''}">
        <span class="standing__rank num">${i + 1}</span>${avatar(p)}
        <span class="standing__name">${esc(p.name)}</span>
        <span class="standing__chips num">${fmt(p.chips)}</span></li>`)
    .join('');
  $('#gameOverActions').innerHTML = [
    ctx.role !== 'client'
      ? `<button class="btn btn--primary" type="button" data-cmd="rematch">${esc(t('over.again'))}</button>`
      : `<p class="modal__text">${esc(t('over.waitHost'))}</p>`,
    `<button class="btn" type="button" data-cmd="leave">${esc(t('over.home'))}</button>`,
  ].join('');
  if (state.winnerIds.some((id) => isMine(ctx, id)) && ctx.role !== 'local') fx.confetti(null, { count: 180 });
  if (!els.gameOver.open) els.gameOver.showModal();
}

export function closeGameOver() {
  if (els.gameOver.open) els.gameOver.close();
}

/* ─────────────────────────── lobby ─────────────────────────── */

export function renderLobby(state, ctx) {
  current = { state, ctx };
  const code = ctx.code ?? '----';
  const tiles = $('#lobbyCode');
  if (tiles.dataset.code !== code) {
    tiles.dataset.code = code;
    tiles.innerHTML = [...code].map((ch, i) => `<span style="--i:${i}">${esc(ch)}</span>`).join('');
    tiles.setAttribute('aria-label', code.split('').join(' '));
  }
  $('#lobbyCount').textContent = `${state.players.length} / ${RULES.maxPlayers}`;
  $('#lobbyPlayers').innerHTML = state.players
    .map((p, i) => `<li class="lobby-player${p.connected ? '' : ' is-offline'}">${avatar(p)}
        <span class="lobby-player__name">${esc(p.name)}</span>
        ${i === 0 ? `<span class="tag tag--gold">${esc(t('lobby.host'))}</span>` : ''}
        ${isMine(ctx, p.id) ? `<span class="tag">${esc(t('board.you'))}</span>` : ''}</li>`)
    .join('') + Array.from({ length: Math.max(0, RULES.minPlayers - state.players.length) },
    () => `<li class="lobby-player is-empty"><span class="avatar avatar--empty"></span><span class="lobby-player__name">${esc(t('lobby.empty'))}</span></li>`).join('');

  const s = state.settings;
  $('#lobbySettings').innerHTML = `
    <div><dt>${esc(t('setup.deck'))}</dt><dd>${esc(t(`deck.short.${s.deckMode}`))}</dd></div>
    <div><dt>${esc(t('setup.ante'))}</dt><dd class="num">${fmt(s.ante)}</dd></div>
    <div><dt>${esc(t('setup.chips'))}</dt><dd class="num">${fmt(s.startChips)}</dd></div>
    <div><dt>${esc(t('lobby.postRule'))}</dt><dd class="num">×${RULES.postMultiplier}</dd></div>`;

  const enough = state.players.length >= RULES.minPlayers;
  $('#lobbyActions').innerHTML = ctx.role === 'host'
    ? `<button class="btn btn--primary btn--xl" type="button" data-cmd="lobbyStart" ${enough ? '' : 'disabled'}>${esc(t('lobby.start'))}</button>
       <p class="ctl__hint">${esc(enough ? t('lobby.ready') : t('lobby.needMore'))}</p>
       <button class="btn btn--ghost btn--sm" type="button" data-cmd="leave">${esc(t('game.closeRoom'))}</button>`
    : `<div class="ctl ctl--wait"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><p class="ctl__wait">${esc(t('lobby.waitHost'))}</p></div>
       <button class="btn btn--ghost btn--sm" type="button" data-cmd="leave">${esc(t('game.leave'))}</button>`;
}

export function setRoomChip(code) {
  els.roomChip.hidden = !code;
  els.roomChipCode.textContent = code || '';
}

/* ─────────────────────────── drawer & stats ─────────────────────────── */

export function openDrawer(tab = 'origin') {
  selectTab(tab);
  if (!els.drawer.open) els.drawer.showModal();
}

export function closeDrawer() {
  if (!els.drawer.open) return;
  els.drawer.classList.add('is-closing');
  setTimeout(() => {
    els.drawer.classList.remove('is-closing');
    els.drawer.close();
  }, fx.prefersReducedMotion() ? 0 : 220);
}

function selectTab(tab) {
  $$('.tab', els.drawer).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  $$('[data-pane]', els.drawer).forEach((p) => (p.hidden = p.dataset.pane !== tab));
  if (tab === 'stats') renderStats(current.state);
  $('.drawer__body', els.drawer).scrollTop = 0;
}

export function renderStats(state) {
  if (!state || state.phase === PHASES.LOBBY || !state.stats.hands) {
    els.stats.innerHTML = `<div class="stats__empty"><span class="seal seal--lg" aria-hidden="true">空</span><p>${esc(t('stats.empty'))}</p></div>`;
    return;
  }
  const s = state.stats;
  const tiles = [
    ['hands', fmt(s.hands)],
    ['winRate', s.shots ? pct(s.wins / s.shots) : '—'],
    ['postHits', fmt(s.postHits)],
    ['biggestWin', fmt(s.biggestWin), s.biggestWinBy],
    ['biggestPot', fmt(s.biggestPot)],
    ['wagered', fmt(s.wagered)],
  ];
  const parts = [
    // Order matters: adjacent segments were validated for colour-vision separation.
    ['win', s.wins],
    ['post', s.postHits],
    ['miss', s.misses],
    ['nogate', s.noGates],
  ];
  const total = parts.reduce((a, [, n]) => a + n, 0) || 1;
  els.stats.innerHTML = `
    <p class="stats__lede">${esc(t('stats.lede'))}</p>
    <div class="stat-grid">${tiles
      .map(([k, v, by]) => `<div class="stat"><span class="stat__label">${esc(t(`stats.${k}`))}</span><span class="stat__value num">${esc(v)}</span>${
        by ? `<span class="stat__sub">${esc(t('stats.by', { name: by }))}</span>` : ''}</div>`)
      .join('')}</div>
    <figure class="outcomes">
      <figcaption class="outcomes__title">${esc(t('stats.outcomes'))}</figcaption>
      <div class="outcomes__bar" role="img" aria-label="${esc(parts.map(([k, n]) => `${t(`stats.o.${k}`)} ${n}`).join(', '))}">
        ${parts.filter(([, n]) => n).map(([k, n]) => `<span class="outcomes__seg outcomes__seg--${k}" style="flex-grow:${n}" title="${esc(`${t(`stats.o.${k}`)} · ${n} (${pct(n / total)})`)}"></span>`).join('')}
      </div>
      <ul class="outcomes__legend">${parts
        .map(([k, n]) => `<li><span class="swatch swatch--${k}" aria-hidden="true"></span>${esc(t(`stats.o.${k}`))}<b class="num">${n}</b><span class="num muted">${pct(n / total)}</span></li>`)
        .join('')}</ul>
    </figure>
    <table class="stat-table">
      <thead><tr><th>${esc(t('stats.player'))}</th><th class="num">${esc(t('stats.chips'))}</th><th class="num">${esc(t('stats.wins'))}</th><th class="num">${esc(t('stats.posts'))}</th></tr></thead>
      <tbody>${[...state.players].sort((a, b) => b.chips - a.chips)
        .map((p) => `<tr><td>${avatar(p, 'avatar avatar--sm')} ${esc(p.name)}</td><td class="num">${fmt(p.chips)}</td><td class="num">${p.wins}</td><td class="num">${p.postHits}</td></tr>`)
        .join('')}</tbody>
    </table>`;
}

/* ─────────────────────────── feedback primitives ─────────────────────────── */

export function toast(message, tone = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.textContent = message;
  els.toasts.append(el);
  while (els.toasts.children.length > 3) els.toasts.firstChild.remove();
  setTimeout(() => {
    el.classList.add('is-leaving');
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

export function busy(text) {
  els.busy.hidden = !text;
  els.busyText.textContent = text || '';
}

export function confirm({ title, text, ok }) {
  return new Promise((resolve) => {
    $('#confirmTitle').textContent = title;
    $('#confirmText').textContent = text;
    $('#confirmOk').textContent = ok;
    els.confirm.returnValue = '';
    els.confirm.addEventListener('close', () => resolve(els.confirm.returnValue === 'ok'), { once: true });
    els.confirm.showModal();
  });
}
