import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  POT_MODES, GameEngine, PHASES, MODES, RULES, classifyPosts, judgeShot, computeOdds, rankCounts,
  buildDeck, betLimits, normalizeSettings, sanitizeName,
} from '../js/gameLogic.js';

const card = (r, s = 'S', id = `x${s}${r}`) => ({ r, s, id });

/** Build an engine and stack the top of the deck (last element is drawn first). */
function rigged({ mode = MODES.LOCAL, players = 2, settings = {} } = {}) {
  const engine = new GameEngine({ mode, settings, rng: () => 0.5 });
  for (let i = 1; i <= players; i++) engine.apply({ type: 'addPlayer', player: { id: `p${i}`, name: `P${i}` } });
  const res = engine.apply({ type: 'start' });
  assert.equal(res.ok, true);
  const stack = (...cards) => {
    // draw order = cards order; pad beneath so reshuffle-when-low never triggers
    const pad = buildDeck(1).slice(0, 30);
    engine.state.deck = [...pad, ...cards.slice().reverse()];
  };
  return { engine, stack, s: engine.state };
}

test('classifyPosts: gate, pair, no gate', () => {
  assert.equal(classifyPosts(card(3), card(11)).kind, 'gate');
  assert.equal(classifyPosts(card(7), card(7)).kind, 'pair');
  assert.equal(classifyPosts(card(5), card(6)).kind, 'nogate');
  assert.equal(classifyPosts(card(1), card(1)).forcedCall, 'high');
  assert.equal(classifyPosts(card(13), card(13)).forcedCall, 'low');
});

test('judgeShot: inside wins, outside misses, equal rank hits the post', () => {
  const g = classifyPosts(card(3), card(11));
  assert.equal(judgeShot(g, card(7)), 'win');
  assert.equal(judgeShot(g, card(12)), 'miss');
  assert.equal(judgeShot(g, card(2)), 'miss');
  assert.equal(judgeShot(g, card(3)), 'post');
  assert.equal(judgeShot(g, card(11)), 'post');
  const pair = classifyPosts(card(7), card(7));
  assert.equal(judgeShot(pair, card(9), 'high'), 'win');
  assert.equal(judgeShot(pair, card(9), 'low'), 'miss');
  assert.equal(judgeShot(pair, card(2), 'low'), 'win');
  assert.equal(judgeShot(pair, card(7), 'high'), 'post');
});

test('start collects the ante from every player into the pot', () => {
  const { s } = rigged({ players: 3, settings: { ante: 10, startChips: 200 } });
  assert.equal(s.pot, 30);
  assert.deepEqual(s.players.map((p) => p.chips), [190, 190, 190]);
  assert.equal(s.phase, PHASES.AWAIT_DEAL);
  assert.equal(s.turnIndex, 0);
});

test('only the active player may act', () => {
  const { engine } = rigged();
  assert.equal(engine.apply({ type: 'deal', playerId: 'p2' }).error, 'notYourTurn');
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 5 }).error, 'badPhase');
});

test('win pays from the pot', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(2), card(12), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  assert.equal(s.phase, PHASES.BETTING);
  const res = engine.apply({ type: 'shoot', playerId: 'p1', bet: 15 });
  assert.equal(res.ok, true);
  assert.equal(s.result.outcome, 'win');
  assert.equal(s.players[0].chips, 90 + 15);
  assert.equal(s.pot, 20 - 15);
});

test('miss adds the bet to the pot', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(4), card(9), card(13));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 20 });
  assert.equal(s.result.outcome, 'miss');
  assert.equal(s.players[0].chips, 70);
  assert.equal(s.pot, 40);
});

test('hitting the post costs double, capped at the player stack', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(4), card(9), card(9, 'H'));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 20 });
  assert.equal(s.result.outcome, 'post');
  assert.equal(s.result.amount, 20 * RULES.postMultiplier);
  assert.equal(s.players[0].chips, 50);
  assert.equal(s.pot, 60);

  const b = rigged({ settings: { ante: 10, startChips: 100 } });
  b.s.players[0].chips = 15;
  b.s.pot = 500;
  b.stack(card(2), card(12), card(2, 'H'));
  b.engine.apply({ type: 'deal', playerId: 'p1' });
  b.engine.apply({ type: 'shoot', playerId: 'p1', bet: 15 });
  assert.equal(b.s.result.amount, 15);
  assert.equal(b.s.players[0].chips, 0);
});

test('bets are bounded by the player stack and the pot', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(2), card(12), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  assert.deepEqual(betLimits(s), { min: 1, max: 20 });
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 21 }).error, 'badBet');
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 0 }).error, 'badBet');
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 'abc' }).error, 'badBet');
});

test('consecutive posts are a no-gate pass without penalty', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(5), card(6));
  const res = engine.apply({ type: 'deal', playerId: 'p1' });
  assert.ok(res.events.some((e) => e.type === 'nogate'));
  assert.equal(s.phase, PHASES.RESOLVED);
  assert.equal(s.players[0].chips, 90);
  engine.apply({ type: 'advance' });
  assert.equal(s.turnIndex, 1);
  assert.equal(s.phase, PHASES.AWAIT_DEAL);
});

test('equal posts require a higher/lower call', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(7), card(7, 'H'), card(10));
  engine.apply({ type: 'deal', playerId: 'p1' });
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 5 }).error, 'needCall');
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 5, call: 'high' });
  assert.equal(s.result.outcome, 'win');
});

test('a pair of aces forces the "higher" call', () => {
  const { engine, stack, s } = rigged();
  stack(card(1), card(1, 'H'), card(4));
  engine.apply({ type: 'deal', playerId: 'p1' });
  assert.equal(s.draft.call, 'high');
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 5, call: 'low' }).error, 'needCall');
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 5 });
  assert.equal(s.result.outcome, 'win');
});

test('a new ante round starts after everyone has played', () => {
  const { engine, stack, s } = rigged({ players: 2, settings: { ante: 10, startChips: 100 } });
  stack(card(5), card(6), card(5), card(6));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'advance' });
  assert.equal(s.round, 1);
  engine.apply({ type: 'deal', playerId: 'p2' });
  const res = engine.apply({ type: 'advance' });
  assert.equal(s.round, 2);
  assert.ok(res.events.some((e) => e.type === 'ante'));
  assert.equal(s.pot, 40);
  assert.equal(s.turnIndex, 0);
});

test('an emptied pot triggers a fresh ante immediately', () => {
  const { engine, stack, s } = rigged({ players: 3, settings: { ante: 10, startChips: 100 } });
  stack(card(1), card(13), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 30 });
  assert.equal(s.pot, 0);
  assert.equal(s.result.swept, true);
  engine.apply({ type: 'advance' });
  assert.equal(s.round, 2);
  assert.equal(s.pot, 30);
  assert.equal(s.turnIndex, 1);
});

test('last player with chips wins the table', () => {
  const { engine, stack, s } = rigged({ players: 2, settings: { ante: 10, startChips: 100 } });
  s.players[0].chips = 10;
  stack(card(4), card(9), card(9, 'H'));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 10 });
  const res = engine.apply({ type: 'advance' });
  assert.equal(s.phase, PHASES.GAMEOVER);
  assert.deepEqual(s.winnerIds, ['p2']);
  assert.ok(res.events.some((e) => e.type === 'gameover'));
});

test('solo: house bank acts as the pot, antes go to the bank, bust ends the game', () => {
  const { engine, stack, s } = rigged({ mode: MODES.SINGLE, players: 1, settings: { ante: 10, startChips: 100 } });
  assert.equal(s.pot, 210);
  stack(card(4), card(9), card(13));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 90 });
  engine.apply({ type: 'advance' });
  assert.equal(s.phase, PHASES.GAMEOVER);
  assert.equal(s.endReason, 'bust');
});

test('solo: emptying the bank wins the game', () => {
  const { engine, stack, s } = rigged({ mode: MODES.SINGLE, players: 1, settings: { ante: 10, startChips: 100 } });
  s.pot = 50;
  s.players[0].chips = 500;
  stack(card(1), card(13), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 50 });
  engine.apply({ type: 'advance' });
  assert.equal(s.endReason, 'brokeBank');
  assert.deepEqual(s.winnerIds, ['p1']);
});

test('deck modes: reshuffle when low vs every hand', () => {
  const low = rigged({ settings: { deckMode: 'single-low' } });
  low.s.deck = low.s.deck.slice(0, 11);
  const r1 = low.engine.apply({ type: 'deal', playerId: 'p1' });
  assert.ok(r1.events.some((e) => e.type === 'reshuffle'));
  assert.equal(low.s.deck.length, 50);

  const every = rigged({ settings: { deckMode: 'single-every' } });
  const r2 = every.engine.apply({ type: 'deal', playerId: 'p1' });
  assert.ok(r2.events.some((e) => e.type === 'reshuffle' && e.everyHand));
  assert.equal(every.s.deck.length, 50);

  const four = rigged({ settings: { deckMode: 'four-low' } });
  assert.equal(four.s.deckTotal, 208);
});

test('disconnected players are skipped and the table pauses when nobody is left', () => {
  const { engine, stack, s } = rigged({ mode: MODES.ONLINE, players: 3 });
  stack(card(5), card(6));
  engine.apply({ type: 'setConnected', playerId: 'p2', connected: false });
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'advance' });
  assert.equal(s.players[s.turnIndex].id, 'p3');

  engine.apply({ type: 'skip', playerId: 'p3' });
  engine.apply({ type: 'setConnected', playerId: 'p1', connected: false });
  engine.apply({ type: 'setConnected', playerId: 'p3', connected: false });
  engine.apply({ type: 'advance' });
  assert.equal(s.phase, PHASES.PAUSED);
  const res = engine.apply({ type: 'setConnected', playerId: 'p2', connected: true });
  assert.equal(s.phase, PHASES.AWAIT_DEAL);
  assert.equal(s.players[s.turnIndex].id, 'p2');
  assert.ok(res.events.some((e) => e.type === 'turn'));
});

test('late joiners sit out until the next ante round', () => {
  const { engine, s } = rigged({ mode: MODES.ONLINE, players: 2, settings: { startChips: 100 } });
  engine.apply({ type: 'addPlayer', player: { id: 'p3', name: 'Late' } });
  const late = s.players[2];
  assert.equal(late.sittingOut, true);
  assert.equal(late.chips, 100);
});

test('public state hides the deck order but exposes rank counts', () => {
  const { engine } = rigged();
  const pub = engine.getPublicState();
  assert.equal(pub.deck, undefined);
  assert.equal(pub.deckCount, 52);
  assert.equal(rankCounts(buildDeck(1))[7], 4);
  assert.equal(pub.rankCounts.reduce((a, b) => a + b, 0), 52);
});

test('odds reflect remaining cards', () => {
  const counts = rankCounts(buildDeck(1));
  const odds = computeOdds(classifyPosts(card(1), card(13)), counts);
  assert.equal(Math.round(odds.win * 52), 44);
  assert.equal(Math.round(odds.post * 52), 8);
});

test('settings and names are sanitised', () => {
  assert.deepEqual(normalizeSettings({ deckMode: 'nope', ante: -5, startChips: 'x' }), {
    deckMode: 'single-low', ante: 1, startChips: 500, houseBank: 1000, potMode: 'standard',
  });
  assert.equal(normalizeSettings({ potMode: 'free' }).potMode, 'free');
  assert.equal(normalizeSettings({ potMode: 'bogus' }).potMode, 'standard');
  assert.equal(sanitizeName('  a\u0000b   c  '), 'ab c');
  assert.equal(sanitizeName(''), 'Player');
  assert.equal(sanitizeName('x'.repeat(40)).length, 16);
});

/* ── free play (無莊家 / no pot limit) ── */

test('free play: bets are limited by the stack, not the pot', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100, potMode: POT_MODES.FREE } });
  stack(card(2), card(12), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  assert.deepEqual(betLimits(s), { min: 1, max: 90 });
  assert.equal(engine.apply({ type: 'shoot', playerId: 'p1', bet: 90 }).ok, true);
});

test('free play: the house covers what the pot cannot, and play continues', () => {
  const { engine, stack, s } = rigged({ players: 3, settings: { ante: 10, startChips: 100, potMode: POT_MODES.FREE } });
  stack(card(1), card(13), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  const res = engine.apply({ type: 'shoot', playerId: 'p1', bet: 80 });
  assert.equal(s.players[0].chips, 90 + 80);
  assert.equal(s.pot, 0);
  assert.equal(s.result.housePaid, 50);
  assert.equal(s.stats.housePaid, 50);
  assert.equal(s.result.swept, false);
  assert.ok(res.events.some((e) => e.type === 'handEnd' && e.delta === 80));
  engine.apply({ type: 'advance' });
  assert.equal(s.round, 1, 'an empty pot does not force a re-ante in free play');
  assert.equal(s.turnIndex, 1);
  assert.equal(s.phase, PHASES.AWAIT_DEAL);
});

test('free play solo: draining the bank does not end the game', () => {
  const { engine, stack, s } = rigged({ mode: MODES.SINGLE, players: 1, settings: { ante: 10, startChips: 100, potMode: POT_MODES.FREE } });
  s.pot = 20;
  stack(card(1), card(13), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  engine.apply({ type: 'shoot', playerId: 'p1', bet: 60 });
  engine.apply({ type: 'advance' });
  assert.notEqual(s.phase, PHASES.GAMEOVER);
  assert.equal(s.pot, 10, 'next ante refills the bank');
});

test('standard mode still caps bets at the pot', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100, potMode: POT_MODES.STANDARD } });
  stack(card(2), card(12), card(7));
  engine.apply({ type: 'deal', playerId: 'p1' });
  assert.equal(betLimits(s).max, 20);
});

test('every finished hand emits one handEnd with a unique key and chip delta', () => {
  const { engine, stack, s } = rigged({ settings: { ante: 10, startChips: 100 } });
  stack(card(5), card(6), card(4), card(9), card(9, 'H'));
  const nogate = engine.apply({ type: 'deal', playerId: 'p1' }).events.filter((e) => e.type === 'handEnd');
  assert.equal(nogate.length, 1);
  assert.equal(nogate[0].outcome, 'nogate');
  assert.equal(nogate[0].delta, 0);
  engine.apply({ type: 'advance' });
  engine.apply({ type: 'deal', playerId: 'p2' });
  const post = engine.apply({ type: 'shoot', playerId: 'p2', bet: 5 }).events.filter((e) => e.type === 'handEnd');
  assert.equal(post.length, 1);
  assert.equal(post[0].outcome, 'post');
  assert.equal(post[0].delta, -10);
  assert.equal(post[0].playerId, 'p2');
  assert.notEqual(post[0].key, nogate[0].key);
  assert.ok(post[0].key.startsWith(s.gameId));
});
