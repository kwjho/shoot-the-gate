/**
 * gameLogic.js — the 射龍門 rules engine.
 *
 * Pure and DOM-free: it runs identically in the browser (solo, pass-and-play,
 * online host) and in Node (unit tests). The engine owns the only mutable copy
 * of the game state. Callers drive it with plain action objects:
 *
 *   const engine = new GameEngine({ mode: 'local', settings });
 *   const { ok, events, error } = engine.apply({ type: 'deal', playerId });
 *
 * `events` describe what just happened (deal, shoot, ante, …) so the UI can
 * animate it; `getPublicState()` returns a serialisable snapshot with the deck
 * order stripped, which is what gets rendered and broadcast to online peers.
 */

export const MODES = Object.freeze({ SINGLE: 'single', LOCAL: 'local', ONLINE: 'online' });

export const PHASES = Object.freeze({
  LOBBY: 'lobby',          // online room gathering players
  AWAIT_DEAL: 'await-deal', // active player must draw the two posts
  BETTING: 'betting',       // posts are open, active player sizes a bet
  RESOLVED: 'resolved',     // hand finished, waiting for the authority to advance
  PAUSED: 'paused',         // nobody eligible is connected
  GAMEOVER: 'gameover',
});

/** The three deck configurations offered on the setup screen. */
export const DECK_MODES = Object.freeze({
  'single-low': Object.freeze({ id: 'single-low', decks: 1, reshuffleBelow: 12, everyHand: false }),
  'single-every': Object.freeze({ id: 'single-every', decks: 1, reshuffleBelow: 0, everyHand: true }),
  'four-low': Object.freeze({ id: 'four-low', decks: 4, reshuffleBelow: 15, everyHand: false }),
});

/**
 * Pot rules chosen at setup:
 *   standard — traditional: a bet can never exceed the pot, and an emptied pot
 *              forces a fresh round of antes (in Solo, draining the bank wins).
 *   free     — 無莊家 / no pot limit: bet up to your own stack; anything the pot
 *              can't cover is paid by the house, and play never stops for an
 *              empty pot.
 */
export const POT_MODES = Object.freeze({ STANDARD: 'standard', FREE: 'free' });

export const RULES = Object.freeze({
  postMultiplier: 2, // 撞柱: hitting a post costs double the bet
  minBet: 1,
  minPlayers: 2,
  maxPlayers: 6,
  logLimit: 60,
  bigWinFloor: 100,  // a win this large (or one that sweeps the pot) is a "big win"
});

export const SUITS = Object.freeze(['S', 'H', 'D', 'C']);
// U+FE0E forces text presentation so iOS doesn't swap in emoji glyphs.
export const SUIT_GLYPH = Object.freeze({ S: '♠︎', H: '♥︎', D: '♦︎', C: '♣︎' });

/* ─────────────────────────── Pure helpers ─────────────────────────── */

export function secureRandom() {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  }
  return Math.random();
}

/** Fisher–Yates; returns a new array. */
export function shuffle(cards, rng = secureRandom) {
  const a = cards.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ace = 1 … King = 13. Card ids are unique within a multi-deck shoe. */
export function buildDeck(decks = 1) {
  const out = [];
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) {
      for (let r = 1; r <= 13; r++) out.push({ r, s, id: `${d}${s}${r}` });
    }
  }
  return out;
}

export function rankLabel(r) {
  return { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[r] ?? String(r);
}

export function isRed(suit) {
  return suit === 'H' || suit === 'D';
}

export function cardText(card) {
  return card ? `${rankLabel(card.r)}${SUIT_GLYPH[card.s]}` : '';
}

/**
 * Classify two posts:
 *   pair   — equal ranks, player must call higher / lower
 *   nogate — consecutive ranks (無門), nothing can fit between
 *   gate   — a normal gate
 */
export function classifyPosts(a, b) {
  const lo = Math.min(a.r, b.r);
  const hi = Math.max(a.r, b.r);
  if (lo === hi) return { kind: 'pair', lo, hi, forcedCall: lo === 1 ? 'high' : lo === 13 ? 'low' : null };
  if (hi - lo === 1) return { kind: 'nogate', lo, hi, forcedCall: null };
  return { kind: 'gate', lo, hi, forcedCall: null };
}

/** Returns 'win' | 'miss' | 'post'. */
export function judgeShot(gate, ball, call) {
  const r = ball.r;
  if (gate.kind === 'pair') {
    if (r === gate.lo) return 'post';
    if (call === 'high') return r > gate.lo ? 'win' : 'miss';
    return r < gate.lo ? 'win' : 'miss';
  }
  if (r === gate.lo || r === gate.hi) return 'post';
  return r > gate.lo && r < gate.hi ? 'win' : 'miss';
}

/** Remaining cards per rank, index 1…13 (index 0 unused). */
export function rankCounts(deck) {
  const counts = new Array(14).fill(0);
  for (const c of deck) counts[c.r] += 1;
  return counts;
}

/** Probabilities for the next card given the remaining shoe composition. */
export function computeOdds(gate, counts) {
  if (!gate || !counts) return null;
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const sum = (from, to) => {
    let s = 0;
    for (let r = Math.max(1, from); r <= Math.min(13, to); r++) s += counts[r];
    return s;
  };
  if (gate.kind === 'pair') {
    return {
      total,
      post: counts[gate.lo] / total,
      high: sum(gate.lo + 1, 13) / total,
      low: sum(1, gate.lo - 1) / total,
    };
  }
  if (gate.kind === 'nogate') return null;
  const win = sum(gate.lo + 1, gate.hi - 1);
  const post = counts[gate.lo] + counts[gate.hi];
  return { total, win: win / total, post: post / total, miss: (total - win - post) / total };
}

/** Bet bounds for the active player, derived from a (public or private) state. */
export function betLimits(state) {
  const p = state.players[state.turnIndex];
  if (!p) return { min: 0, max: 0 };
  const cap = state.settings?.potMode === POT_MODES.FREE ? p.chips : Math.min(p.chips, state.pot);
  const max = Math.max(0, cap);
  return { min: Math.min(RULES.minBet, max), max };
}

/** Largest amount a hit-the-post can cost for a given bet. */
export function postPenalty(bet, chips) {
  return Math.min(bet * RULES.postMultiplier, chips);
}

function clampInt(v, min, max, fallback) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normalizeSettings(raw = {}) {
  const deckMode = DECK_MODES[raw.deckMode] ? raw.deckMode : 'single-low';
  const ante = clampInt(raw.ante, 1, 10_000, 10);
  const startChips = clampInt(raw.startChips, 20, 1_000_000, 500);
  const houseBank = clampInt(raw.houseBank, 20, 10_000_000, startChips * 2);
  const potMode = raw.potMode === POT_MODES.FREE ? POT_MODES.FREE : POT_MODES.STANDARD;
  return { deckMode, ante, startChips, houseBank, potMode };
}

export function sanitizeName(raw, fallback = 'Player') {
  const s = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  return s || fallback;
}

class RuleError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function freshStats() {
  return {
    hands: 0, shots: 0, wins: 0, misses: 0, postHits: 0, noGates: 0,
    biggestWin: 0, biggestWinBy: '', biggestPot: 0, wagered: 0, reshuffles: 0,
    housePaid: 0, // free-play wins the pot couldn't cover
  };
}

/* ─────────────────────────── Engine ─────────────────────────── */

export class GameEngine {
  constructor({ mode = MODES.LOCAL, settings = {}, rng = secureRandom } = {}) {
    this.rng = rng;
    this.state = {
      seq: 0,
      gameId: '',
      mode,
      settings: normalizeSettings(settings),
      phase: PHASES.LOBBY,
      players: [],
      pot: 0,
      round: 0,
      hand: 0,
      turnIndex: 0,
      roundTurnsLeft: 0,
      deck: [],
      deckTotal: 0,
      posts: null,
      gate: null,
      ball: null,
      draft: null,
      result: null,
      endReason: null,
      winnerIds: [],
      log: [],
      logSeq: 0,
      stats: freshStats(),
    };
  }

  get active() {
    return this.state.players[this.state.turnIndex] ?? null;
  }

  /** Apply an action. Never throws for rule violations; returns { ok, error }. */
  apply(action) {
    const events = [];
    try {
      switch (action?.type) {
        case 'addPlayer': this.#addPlayer(action, events); break;
        case 'removePlayer': this.#removePlayer(action, events); break;
        case 'setConnected': this.#setConnected(action, events); break;
        case 'start': this.#start(events); break;
        case 'deal': this.#deal(action, events); break;
        case 'draft': this.#draft(action); break;
        case 'shoot': this.#shoot(action, events); break;
        case 'skip': this.#skip(action, events); break;
        case 'advance': this.#advance(events); break;
        case 'end': this.#end(events); break;
        default: throw new RuleError('unknownAction');
      }
    } catch (err) {
      if (err instanceof RuleError) return { ok: false, error: err.code, events: [] };
      throw err;
    }
    this.state.seq += 1;
    return { ok: true, events };
  }

  /** Serialisable snapshot without the deck order (safe to broadcast). */
  getPublicState() {
    const { deck, ...rest } = this.state;
    const pub = JSON.parse(JSON.stringify(rest));
    pub.deckCount = deck.length;
    pub.rankCounts = rankCounts(deck);
    return pub;
  }

  /* ── roster ── */

  #addPlayer({ player }, events) {
    const s = this.state;
    const id = String(player?.id ?? '');
    if (!id) throw new RuleError('badPlayer');
    if (s.players.some((p) => p.id === id)) throw new RuleError('duplicate');
    const cap = s.mode === MODES.SINGLE ? 1 : RULES.maxPlayers;
    if (s.players.length >= cap) throw new RuleError('full');
    const inGame = s.phase !== PHASES.LOBBY && s.phase !== PHASES.GAMEOVER;
    const p = {
      id,
      name: sanitizeName(player.name, `Player ${s.players.length + 1}`),
      chips: inGame ? s.settings.startChips : 0,
      connected: true,
      sittingOut: inGame, // joins at the next ante round
      wins: 0,
      postHits: 0,
    };
    s.players.push(p);
    if (inGame) this.#log('log.join', { name: p.name }, 'info');
    events.push({ type: 'join', playerId: id });
  }

  #removePlayer({ playerId }, events) {
    const s = this.state;
    if (s.phase !== PHASES.LOBBY && s.phase !== PHASES.GAMEOVER) throw new RuleError('badPhase');
    const i = s.players.findIndex((p) => p.id === playerId);
    if (i < 0) throw new RuleError('badPlayer');
    s.players.splice(i, 1);
    s.turnIndex = 0;
    events.push({ type: 'leave', playerId });
  }

  #setConnected({ playerId, connected }, events) {
    const s = this.state;
    const p = s.players.find((x) => x.id === playerId);
    if (!p) throw new RuleError('badPlayer');
    if (p.connected === !!connected) return;
    p.connected = !!connected;
    const inGame = s.phase !== PHASES.LOBBY;
    if (inGame) this.#log(connected ? 'log.rejoin' : 'log.leave', { name: p.name }, 'info');
    events.push({ type: connected ? 'rejoin' : 'leave', playerId });
    if (connected && s.phase === PHASES.PAUSED) this.#beginTurn(events, s.turnIndex, false);
  }

  /* ── game flow ── */

  #start(events) {
    const s = this.state;
    if (s.phase !== PHASES.LOBBY && s.phase !== PHASES.GAMEOVER) throw new RuleError('badPhase');
    const need = s.mode === MODES.SINGLE ? 1 : RULES.minPlayers;
    if (s.players.length < need) throw new RuleError('needPlayers');

    for (const p of s.players) {
      p.chips = s.settings.startChips;
      p.sittingOut = false;
      p.wins = 0;
      p.postHits = 0;
    }
    Object.assign(s, {
      gameId: Math.floor(this.rng() * 36 ** 6).toString(36).padStart(6, '0') + (Date.now() % 1e6).toString(36),
      pot: s.mode === MODES.SINGLE ? s.settings.houseBank : 0,
      round: 0, hand: 0, turnIndex: 0, roundTurnsLeft: 0,
      endReason: null, winnerIds: [], log: [], stats: freshStats(),
    });
    this.#clearHand();
    this.#reshuffle();
    events.push({ type: 'start', gameId: s.gameId, playerIds: s.players.map((p) => p.id) });
    this.#log('log.start', { n: s.players.length }, 'info');
    this.#beginTurn(events, 0, true);
  }

  #deal({ playerId }, events) {
    const s = this.state;
    this.#assertTurn(PHASES.AWAIT_DEAL, playerId);
    this.#ensureDeck(events);
    const posts = [this.#draw(), this.#draw()].sort((a, b) => a.r - b.r);
    const gate = classifyPosts(posts[0], posts[1]);
    const p = this.active;
    s.posts = posts;
    s.gate = gate;
    s.hand += 1;
    s.stats.hands += 1;
    events.push({ type: 'deal', playerId: p.id, posts, kind: gate.kind });

    const vars = { name: p.name, a: cardText(posts[0]), b: cardText(posts[1]) };
    if (gate.kind === 'nogate') {
      s.stats.noGates += 1;
      s.result = { outcome: 'nogate', playerId: p.id };
      s.phase = PHASES.RESOLVED;
      this.#log('log.nogate', vars, 'muted');
      events.push({ type: 'nogate', playerId: p.id });
      this.#handEnd(events, p, 'nogate', 0, 0);
      return;
    }
    this.#log(gate.kind === 'pair' ? 'log.pair' : 'log.deal', vars, 'info');
    s.draft = { bet: null, call: gate.forcedCall };
    s.phase = PHASES.BETTING;
  }

  /** Live bet preview broadcast to spectators; no events, no validation beyond clamping. */
  #draft({ playerId, bet, call }) {
    const s = this.state;
    this.#assertTurn(PHASES.BETTING, playerId);
    const { min, max } = betLimits(s);
    const n = Math.floor(Number(bet));
    s.draft = {
      bet: Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : null,
      call: s.gate.forcedCall ?? (call === 'high' || call === 'low' ? call : null),
    };
  }

  #shoot({ playerId, bet, call }, events) {
    const s = this.state;
    this.#assertTurn(PHASES.BETTING, playerId);
    const p = this.active;
    const { min, max } = betLimits(s);
    const amountBet = Math.floor(Number(bet));
    if (!Number.isFinite(amountBet) || amountBet < Math.max(1, min) || amountBet > max) {
      throw new RuleError('badBet');
    }
    let theCall = null;
    if (s.gate.kind === 'pair') {
      theCall = s.gate.forcedCall ?? call;
      if (theCall !== 'high' && theCall !== 'low') throw new RuleError('needCall');
      if (s.gate.forcedCall && call && call !== s.gate.forcedCall) throw new RuleError('needCall');
    }

    const ball = this.#draw();
    const outcome = judgeShot(s.gate, ball, theCall);
    let amount;
    let housePaid = 0;
    if (outcome === 'win') {
      amount = amountBet;
      p.chips += amount;
      // Standard bets never exceed the pot. In free play the house tops up the shortfall.
      const fromPot = Math.min(amount, s.pot);
      s.pot -= fromPot;
      housePaid = amount - fromPot;
      s.stats.housePaid += housePaid;
      p.wins += 1;
      s.stats.wins += 1;
      if (amount > s.stats.biggestWin) {
        s.stats.biggestWin = amount;
        s.stats.biggestWinBy = p.name;
      }
    } else {
      amount = outcome === 'post' ? postPenalty(amountBet, p.chips) : amountBet;
      p.chips -= amount;
      s.pot += amount;
      if (outcome === 'post') {
        p.postHits += 1;
        s.stats.postHits += 1;
      } else {
        s.stats.misses += 1;
      }
    }
    s.stats.shots += 1;
    s.stats.wagered += amountBet;
    this.#touchPot();

    const swept = outcome === 'win' && s.pot === 0 && !this.#freePlay;
    const big = outcome === 'win' && (amount >= Math.max(RULES.bigWinFloor, s.settings.startChips * 0.4) || swept);
    s.ball = ball;
    s.draft = { bet: amountBet, call: theCall };
    s.result = { outcome, amount, bet: amountBet, call: theCall, playerId: p.id, ball, big, swept, housePaid };
    s.phase = PHASES.RESOLVED;

    const vars = { name: p.name, bet: amountBet, amount, ball: cardText(ball) };
    this.#log(`log.${outcome}`, vars, outcome === 'win' ? 'win' : outcome === 'post' ? 'post' : 'miss');
    events.push({ type: 'shoot', ...s.result });
    this.#handEnd(events, p, outcome, amountBet, outcome === 'win' ? amount : -amount);
  }

  /** Authority-only: forfeit the active turn (e.g. a disconnected player timed out). */
  #skip({ playerId }, events) {
    const s = this.state;
    if (s.phase !== PHASES.AWAIT_DEAL && s.phase !== PHASES.BETTING) throw new RuleError('badPhase');
    const p = this.active;
    if (playerId && p?.id !== playerId) throw new RuleError('notYourTurn');
    s.result = { outcome: 'skip', playerId: p.id };
    s.phase = PHASES.RESOLVED;
    this.#log('log.skip', { name: p.name }, 'muted');
    events.push({ type: 'skip', playerId: p.id });
  }

  #advance(events) {
    const s = this.state;
    if (s.phase !== PHASES.RESOLVED) throw new RuleError('badPhase');
    this.#clearHand();
    s.roundTurnsLeft = Math.max(0, s.roundTurnsLeft - 1);
    // Free play never forces a re-ante just because the pot ran dry.
    const newRound = s.roundTurnsLeft <= 0 || (s.mode !== MODES.SINGLE && !this.#freePlay && s.pot <= 0);
    this.#beginTurn(events, s.turnIndex + 1, newRound);
  }

  #end(events) {
    const s = this.state;
    if (s.phase === PHASES.LOBBY || s.phase === PHASES.GAMEOVER) throw new RuleError('badPhase');
    this.#finish({ reason: 'ended' }, events);
  }

  /* ── internals ── */

  get #freePlay() {
    return this.state.settings.potMode === POT_MODES.FREE;
  }

  /**
   * One summary event per finished hand (win, miss, post or no gate), so
   * listeners such as the persistent stats store never have to reconstruct a
   * hand from the individual deal/shoot events. `key` is unique per hand.
   */
  #handEnd(events, p, outcome, bet, delta) {
    const s = this.state;
    events.push({
      type: 'handEnd',
      key: `${s.gameId}:${s.hand}`,
      playerId: p.id,
      outcome,
      bet,
      delta,
      chips: p.chips,
      pot: s.pot,
    });
  }

  #assertTurn(phase, playerId) {
    if (this.state.phase !== phase) throw new RuleError('badPhase');
    if (!this.active || this.active.id !== playerId) throw new RuleError('notYourTurn');
  }

  #eligible(p) {
    return p.chips > 0 && p.connected && !p.sittingOut;
  }

  #nextEligible(from) {
    const n = this.state.players.length;
    for (let i = 0; i < n; i++) {
      const idx = (((from + i) % n) + n) % n;
      if (this.#eligible(this.state.players[idx])) return idx;
    }
    return -1;
  }

  #beginTurn(events, from, newRound) {
    const s = this.state;
    let over = this.#checkGameOver();
    if (over) return this.#finish(over, events);
    if (newRound) {
      this.#startRound(events);
      over = this.#checkGameOver();
      if (over) return this.#finish(over, events);
    }
    const idx = this.#nextEligible(from);
    if (idx < 0) {
      s.phase = PHASES.PAUSED;
      events.push({ type: 'paused' });
      return;
    }
    s.turnIndex = idx;
    s.phase = PHASES.AWAIT_DEAL;
    events.push({ type: 'turn', playerId: s.players[idx].id });
  }

  /** Everyone at the table antes into the pot (in solo, into the house bank). */
  #startRound(events) {
    const s = this.state;
    s.round += 1;
    let total = 0;
    const paid = {};
    for (const p of s.players) {
      if (p.sittingOut && p.chips > 0) p.sittingOut = false;
      if (p.connected && !p.sittingOut && p.chips > 0) {
        const pay = Math.min(s.settings.ante, p.chips);
        p.chips -= pay;
        total += pay;
        paid[p.id] = pay;
      }
    }
    s.pot += total;
    this.#touchPot();
    s.roundTurnsLeft = s.players.filter((p) => this.#eligible(p)).length;
    if (s.mode !== MODES.SINGLE) this.#log('log.round', { round: s.round, total }, 'muted');
    events.push({ type: 'ante', gameId: s.gameId, round: s.round, total, paid });
  }

  #checkGameOver() {
    const s = this.state;
    if (s.mode === MODES.SINGLE) {
      const p = s.players[0];
      if (!p) return null;
      if (p.chips <= 0) return { reason: 'bust', winners: [] };
      if (s.pot <= 0 && !this.#freePlay) return { reason: 'brokeBank', winners: [p.id] };
      return null;
    }
    const alive = s.players.filter((p) => p.chips > 0);
    if (alive.length <= 1) return { reason: 'lastStanding', winners: alive.map((p) => p.id) };
    return null;
  }

  #finish({ reason, winners }, events) {
    const s = this.state;
    if (!winners) {
      const top = Math.max(...s.players.map((p) => p.chips));
      winners = s.players.filter((p) => p.chips === top).map((p) => p.id);
    }
    this.#clearHand();
    s.phase = PHASES.GAMEOVER;
    s.endReason = reason;
    s.winnerIds = winners;
    const names = s.players.filter((p) => winners.includes(p.id)).map((p) => p.name).join(', ');
    if (names) this.#log('log.gameover', { name: names }, 'info');
    else this.#log('log.gameoverHouse', {}, 'post');
    events.push({ type: 'gameover', reason, winners });
  }

  #clearHand() {
    Object.assign(this.state, { posts: null, gate: null, ball: null, draft: null, result: null });
  }

  #ensureDeck(events) {
    const s = this.state;
    const cfg = DECK_MODES[s.settings.deckMode];
    if (cfg.everyHand || s.deck.length < Math.max(cfg.reshuffleBelow, 3)) {
      this.#reshuffle();
      if (!cfg.everyHand) this.#log('log.reshuffle', { n: s.deckTotal }, 'muted');
      events.push({ type: 'reshuffle', everyHand: cfg.everyHand, total: s.deckTotal });
    }
  }

  #reshuffle() {
    const s = this.state;
    const cfg = DECK_MODES[s.settings.deckMode];
    s.deck = shuffle(buildDeck(cfg.decks), this.rng);
    s.deckTotal = s.deck.length;
    s.stats.reshuffles += 1;
  }

  #draw() {
    const card = this.state.deck.pop();
    if (!card) throw new RuleError('emptyDeck');
    return card;
  }

  #touchPot() {
    const s = this.state;
    if (s.pot > s.stats.biggestPot) s.stats.biggestPot = s.pot;
  }

  #log(k, v, tone) {
    const s = this.state;
    s.logSeq += 1;
    s.log.unshift({ id: s.logSeq, k, v, tone });
    if (s.log.length > RULES.logLimit) s.log.length = RULES.logLimit;
  }
}
