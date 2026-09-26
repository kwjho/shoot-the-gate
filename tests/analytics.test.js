import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAnalytics, sanitize, OPT_OUT_KEY } from '../js/analytics.js';
import { GameEngine, MODES, buildDeck } from '../js/gameLogic.js';

const ID = 'G-KSDWKK794K';

function fakeEnv({ host = 'kwjho.github.io', search = '', nav = {}, stored = {} } = {}) {
  const store = new Map(Object.entries(stored));
  const head = [];
  const win = {
    navigator: nav,
    location: { hostname: host, search, origin: `https://${host}`, pathname: '/shoot-the-gate/' },
    localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) },
  };
  const doc = { referrer: 'https://example.com/path?q=secret', head: { append: (el) => head.push(el) }, createElement: () => ({}) };
  return { win, doc, head, store };
}
const make = (env, config = { enabled: true, measurementId: ID }) => createAnalytics({ win: env.win, doc: env.doc, config });
const events = (win) => win.dataLayer.map((a) => [...a]).filter((a) => a[0] === 'event');

test('loads gtag.js with privacy-first config', () => {
  const env = fakeEnv();
  const ga = make(env);
  assert.equal(ga.init(), true);
  assert.equal(env.head[0].src, `https://www.googletagmanager.com/gtag/js?id=${ID}`);
  assert.equal(env.head[0].async, true);
  const calls = env.win.dataLayer.map((a) => [...a]);
  const consent = calls.find((c) => c[0] === 'consent')[2];
  assert.equal(consent.ad_storage, 'denied');
  assert.equal(consent.ad_personalization, 'denied');
  const cfg = calls.find((c) => c[0] === 'config');
  assert.equal(cfg[1], ID);
  assert.equal(cfg[2].allow_google_signals, false);
  assert.equal(cfg[2].allow_ad_personalization_signals, false);
  assert.equal(cfg[2].page_location, 'https://kwjho.github.io/shoot-the-gate/');
  assert.equal(cfg[2].page_referrer, 'https://example.com/path');
});

test('stays off for placeholder id, disabled flag, DNT, GPC, opt-out and localhost', () => {
  const cases = [
    [fakeEnv(), { enabled: true, measurementId: 'G-XXXXXXXXXX' }, 'no-id'],
    [fakeEnv(), { enabled: false, measurementId: ID }, 'disabled'],
    [fakeEnv({ nav: { doNotTrack: '1' } }), undefined, 'privacy-signal'],
    [fakeEnv({ nav: { globalPrivacyControl: true } }), undefined, 'privacy-signal'],
    [fakeEnv({ stored: { [OPT_OUT_KEY]: 'off' } }), undefined, 'opted-out'],
    [fakeEnv({ host: 'localhost' }), undefined, 'localhost'],
  ];
  for (const [env, config, reason] of cases) {
    const ga = make(env, config);
    assert.equal(ga.blockedReason(), reason);
    assert.equal(ga.init(), false);
    assert.equal(env.head.length, 0, reason);
    assert.equal(ga.track('room_created'), null);
  }
  assert.equal(make(fakeEnv({ host: 'localhost', search: '?analytics=debug' })).init(), true);
});

test('only allow-listed events and enum/number params are sent', () => {
  assert.equal(sanitize('page_view', {}), null);
  assert.deepEqual(sanitize('round_complete', { result: 'win', bet_amount: 40.4, name: 'Alice', room: 'DRGN' }), { result: 'win', bet_amount: 40 });
  // free text or ids never pass as values
  assert.deepEqual(sanitize('game_start', { mode: 'Alice Chan', deck_type: '1_deck', players: Infinity }), { deck_type: '1_deck' });
  assert.deepEqual(sanitize('room_joined', { code: 'DRGN' }), {});
});

test('opt-out stops tracking and persists; opting back in resumes', () => {
  const env = fakeEnv();
  const ga = make(env);
  ga.init();
  ga.setEnabled(false);
  assert.equal(env.store.get(OPT_OUT_KEY), 'off');
  assert.equal(env.win[`ga-disable-${ID}`], true);
  assert.equal(ga.track('room_created'), null);
  ga.setEnabled(true);
  assert.equal(env.store.has(OPT_OUT_KEY), false);
  assert.deepEqual(ga.track('room_created'), {});
});

test('maps engine events to game_start, round_complete and hit_the_post', () => {
  const env = fakeEnv();
  const ga = make(env);
  ga.init();
  const engine = new GameEngine({ mode: MODES.LOCAL, settings: { deckMode: 'four-low', potMode: 'free', ante: 10, startChips: 100 }, rng: () => 0.5 });
  engine.apply({ type: 'addPlayer', player: { id: 'p1', name: 'Alice Chan' } });
  engine.apply({ type: 'addPlayer', player: { id: 'p2', name: 'Bob' } });
  const myIds = new Set(['p1', 'p2']);
  const feed = (evs) => ga.trackEngineEvents(evs, { myIds, state: engine.getPublicState() });
  feed(engine.apply({ type: 'start' }).events);
  const c = (r, s = 'S') => ({ r, s, id: `${s}${r}${Math.random()}` });
  // the engine draws from the end: 4, 9 (posts), 9♥ (shot), then 5, 6
  engine.state.deck = [...buildDeck(1).slice(0, 30), c(6), c(5), c(9, 'H'), c(9), c(4)];
  // p1: 4–9 hit the post on 9; p2: 5–6 no gate
  feed(engine.apply({ type: 'deal', playerId: 'p1' }).events);
  feed(engine.apply({ type: 'shoot', playerId: 'p1', bet: 5 }).events);
  feed(engine.apply({ type: 'advance' }).events);
  feed(engine.apply({ type: 'deal', playerId: 'p2' }).events);

  const sent = events(env.win);
  assert.deepEqual(sent[0], ['event', 'game_start', { mode: 'local_multi', deck_type: '4_deck', shuffle: 'when_low', pot_mode: 'free', players: 2 }]);
  assert.deepEqual(sent[1], ['event', 'round_complete', { result: 'hit_post', bet_amount: 5, mode: 'local_multi' }]);
  assert.deepEqual(sent[2], ['event', 'hit_the_post', { bet_amount: 5, penalty: 10, mode: 'local_multi' }]);
  assert.deepEqual(sent[3], ['event', 'round_complete', { result: 'no_gate', bet_amount: 0, mode: 'local_multi' }]);
  assert.equal(sent.length, 4);
  assert.ok(!JSON.stringify(env.win.dataLayer.map((a) => [...a])).includes('Alice'), 'no nicknames in the data layer');
});

test('online: only this device’s seat is reported, and each hand once', () => {
  const env = fakeEnv();
  const ga = make(env);
  ga.init();
  const state = { mode: 'online', settings: { deckMode: 'single-low', potMode: 'standard' }, players: [{}, {}] };
  const ev = { type: 'handEnd', key: 'g:1', playerId: 'someone-else', outcome: 'win', bet: 10, delta: 10 };
  ga.trackEngineEvents([ev], { myIds: new Set(['me']), state });
  const mine = { ...ev, key: 'g:2', playerId: 'me' };
  ga.trackEngineEvents([mine], { myIds: new Set(['me']), state });
  ga.trackEngineEvents([mine], { myIds: new Set(['me']), state });
  assert.deepEqual(events(env.win), [['event', 'round_complete', { result: 'win', bet_amount: 10, mode: 'online_p2p' }]]);
});

test('reuses the <head> Google tag instead of loading gtag.js twice', () => {
  const env = fakeEnv();
  env.win.dataLayer = [['config', ID]];
  env.win.gtag = function () { env.win.dataLayer.push(arguments); };
  env.win.__stgGtag = ID;
  const ga = make(env);
  assert.equal(ga.init(), true);
  assert.equal(env.head.length, 0, 'no second script tag');
  assert.equal(env.win.dataLayer.filter((a) => a[0] === 'config').length, 1, 'no second config');
  assert.deepEqual(ga.track('room_joined'), {});
});
