import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStatsStore } from '../js/statsManager.js';
import { GameEngine, MODES, buildDeck } from '../js/gameLogic.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const card = (r, s = 'S') => ({ r, s, id: `x${s}${r}${Math.random()}` });

function game(mode = MODES.SINGLE, n = 1) {
  const engine = new GameEngine({ mode, settings: { ante: 10, startChips: 100 }, rng: () => 0.5 });
  for (let i = 1; i <= n; i++) engine.apply({ type: 'addPlayer', player: { id: `p${i}`, name: `P${i}` } });
  const start = engine.apply({ type: 'start' }).events;
  const stack = (...cards) => (engine.state.deck = [...buildDeck(1).slice(0, 30), ...cards.reverse()]);
  return { engine, start, stack };
}

test('records hands, wins, losses, posts, biggest win and net from engine events', () => {
  const store = createStatsStore({ storage: memoryStorage() });
  const mine = new Set(['p1']);
  const { engine, start, stack } = game();
  store.record(start, mine);
  stack(card(2), card(12), card(7), card(3), card(9), card(13), card(4), card(9), card(9, 'H'));
  const play = (bet) => {
    const evs = [...engine.apply({ type: 'deal', playerId: 'p1' }).events];
    if (engine.state.phase === 'betting') evs.push(...engine.apply({ type: 'shoot', playerId: 'p1', bet }).events);
    evs.push(...engine.apply({ type: 'advance' }).events);
    store.record(evs, mine);
  };
  play(40); // win 40
  play(15); // miss 15
  play(5);  // post 10
  const s = store.get();
  assert.equal(s.games, 1);
  assert.equal(s.hands, 3);
  assert.equal(s.wins, 1);
  assert.equal(s.losses, 1);
  assert.equal(s.postHits, 1);
  assert.equal(s.biggestWin, 40);
  // 4 antes of 10 (start + after each hand) and +40 −15 −10
  assert.equal(s.antes, 40);
  assert.equal(s.net, 40 - 15 - 10 - 40);
});

test('persists across instances and resets', () => {
  const storage = memoryStorage();
  const a = createStatsStore({ storage });
  a.record([{ type: 'handEnd', key: 'g:1', playerId: 'p1', outcome: 'win', bet: 20, delta: 20 }], new Set(['p1']));
  const b = createStatsStore({ storage });
  assert.equal(b.get().hands, 1);
  assert.equal(b.get().biggestWin, 20);
  b.reset();
  assert.equal(createStatsStore({ storage }).get().hands, 0);
});

test('ignores other players, duplicate hand keys and corrupt storage', () => {
  const storage = memoryStorage();
  storage.setItem('stg.stats.v1', '{not json');
  const store = createStatsStore({ storage });
  assert.equal(store.isEmpty(), true);
  const ev = { type: 'handEnd', key: 'g:7', playerId: 'p2', outcome: 'win', bet: 5, delta: 5 };
  store.record([ev], new Set(['p1']));
  assert.equal(store.get().hands, 0);
  const mineEv = { ...ev, playerId: 'p1' };
  store.record([mineEv], new Set(['p1']));
  store.record([mineEv], new Set(['p1']));
  assert.equal(store.get().hands, 1);
});

test('notifies subscribers on change', () => {
  const store = createStatsStore({ storage: memoryStorage() });
  let calls = 0;
  store.subscribe(() => calls++);
  store.record([{ type: 'handEnd', key: 'k', playerId: 'p1', outcome: 'nogate', bet: 0, delta: 0 }], new Set(['p1']));
  store.reset();
  assert.equal(calls, 2);
});
