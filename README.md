# 射龍門 · Shoot the Dragon Gate

The Lunar New Year card game in the browser. Two posts are dealt; bet that the
third card lands between them. Clip a post and you pay double.

- **Solo**: you against the house bank.
- **Pass & Play**: 2–6 players on one device, one shared pot.
- **Online Room**: serverless peer-to-peer play (WebRTC via PeerJS) with a
  4-letter room code.

Traditional Chinese, Simplified Chinese and English. Light and dark themes.
Points only: there is no real money.

## Run it

It is a fully static site with no build step.

```bash
npm start          # serves the folder on http://localhost:5173 (any static server works)
npm test           # engine, stats and SEO tests (node --test)
npm run build:seo  # regenerate SEO head tags, pre-rendered copy, robots.txt, sitemap.xml
```

Deploy by pointing Vercel, Netlify, GitHub Pages or any static host at the repository root.

## Architecture

```
index.html          markup for every screen, with i18n hooks and ad placeholders
css/styles.css      design tokens (light/dark), layouts, cards, table, motion
js/
  config.js         deploy switches: ENABLE_ADS, AdSense ids, PeerJS broker, pacing
  gameLogic.js      pure rules engine (no DOM): deck, antes, bets, payouts, turn order
  statsManager.js   all-time stats for this device (localStorage), fed by engine events
  peerManager.js    HostRoom / ClientRoom over PeerJS: handshake, heartbeat, rejoin
  audioFx.js        Web Audio synthesis for every sound (no audio files)
  fx.js             confetti, shake, number tweens, floaters
  ui.js             rendering and the animation queue (deal → flip → stamp)
  i18n.js           zh-TW / zh-CN / en dictionaries, including the story and rules articles
  ads.js            AdSense lifecycle (removed entirely when ENABLE_ADS is false)
  main.js           controller: sessions, routing, forms, timers
scripts/
  build-seo.mjs     SEO generator (see below)
  og-image.html     source for assets/og-image.png
tests/              node:test suites (engine, stats, SEO)
```

**One authority.** `GameEngine` owns the only mutable state and takes plain
action objects (`deal`, `shoot`, `advance`, …). In solo and pass-and-play the
engine runs locally. Online, the host's browser runs it, validates every guest
intent, and broadcasts a public snapshot. The snapshot leaves out the deck
order, so guests can't peek. Guests only ever send intents.

**Events drive the animation.** Each `apply()` returns events (`deal`,
`shoot`, `ante`, `reshuffle`, …). `ui.present(state, events)` plays them in
order and only then syncs chip counts, so a result is never shown before the
third card turns over. Peers render log entries from `{ key, vars }`, so each
player reads the log in their own language.

**Networking.** The room code is the host's PeerJS id, prefixed with
`PEER.idPrefix`. Guests keep a per-tab client id in `sessionStorage`, so after a
refresh, rejoining with the same code reclaims their seat. A ping/pong heartbeat
detects dropped peers. If the active player drops mid-turn, their turn is
skipped after `PEER.turnGraceMs`. For a self-hosted PeerServer, set
`PEER.server` or append `?peer=host:port` to the URL.

## Rules implemented

| Third card | Result |
|---|---|
| Strictly between the posts | Win the bet from the pot |
| Outside the posts | Lose the bet into the pot |
| Same rank as a post (撞柱) | Lose **2×** the bet, capped at your stack |

- A = 1 … K = 13. Posts are sorted low to high.
- Consecutive posts (無門) pass the turn with no penalty.
- Equal posts: call Higher or Lower first. A pair of aces can only go higher and a pair of kings only lower.
- Bets range from 1 to min(your chips, the pot). Everyone antes at the start of each round, and again whenever the pot is emptied.
- Shoe options: 1 deck reshuffled below 12 cards, 1 deck shuffled every hand, or 4 decks reshuffled below 15 cards.
- **Pot rule** (chosen at setup):
  - *Standard pot*: bets are capped at the pot. An emptied pot triggers a fresh ante, and in Solo, draining the bank wins.
  - *Free play · 無莊家*: bet up to your own stack. The house pays whatever the pot can't cover, and an empty pot never interrupts play.

## Stats

Every finished hand emits one `handEnd` event. `main.js` passes each batch of
events to `statsManager.record()` with the seats this device controls: you in
Solo, the whole table in pass-and-play, your own seat online. It tracks hands,
wins, losses, post hits, biggest single win and net chips (after antes), saved
in `localStorage` under `stg.stats.v1`. The Stats tab shows these all-time
totals above the current game's numbers, and **Reset stats** clears them.

## SEO

`package.json` → `homepage` is the canonical site URL. `npm run build:seo`:

- writes the canonical link, OpenGraph/Twitter tags and `WebApplication`/`VideoGame` JSON-LD between the `seo:start` / `seo:end` markers in `index.html` and `privacy.html`;
- pre-renders the zh-TW copy from `js/i18n.js` into every `data-i18n*` element, so the how-to, the story and the full rules (the home page `#guide` section) can be read without JavaScript;
- writes `robots.txt` and `sitemap.xml`.

`npm test` fails if any of these fall out of sync, so re-run the script after
editing copy in `js/i18n.js` or changing the homepage URL. On a GitHub *project*
page (`user.github.io/repo/`), crawlers only read `robots.txt` at the domain
root. Submit `sitemap.xml` in Search Console, or use a custom domain.

## AdSense

Ads are off by default. In `js/config.js`:

1. Set `ADSENSE_CLIENT` and the `AD_SLOTS` ids.
2. Rename `ads.txt.example` to `ads.txt` with your publisher id.
3. Flip `ENABLE_ADS = true`.

Placements: header, landscape sidebar, the Rules & Story drawer, and the
footer. Each slot is pushed only once it is visible. To see where ads would
render without enabling them, open the site with `?ads=preview`.
