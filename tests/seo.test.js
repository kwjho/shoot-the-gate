import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { DICTS } from '../js/i18n.js';

const root = new URL('..', import.meta.url);
const read = (f) => readFileSync(new URL(f, root), 'utf8');
const html = read('index.html');
const site = JSON.parse(read('package.json')).homepage;

test('generated SEO files are in sync with i18n and package.json', () => {
  execFileSync(process.execPath, ['scripts/build-seo.mjs', '--check'], { cwd: new URL('.', root), stdio: 'pipe' });
});

test('head carries title, description, keywords, canonical, OpenGraph and Twitter tags', () => {
  assert.match(html, /<title[^>]*>射龍門[^<]+<\/title>/);
  assert.match(html, /<meta name="description"[^>]*content="[^"]{80,}"/);
  assert.match(html, /<meta name="keywords" content="[^"]*射龍門[^"]*Shoot the Dragon Gate[^"]*撲克牌遊戲[^"]*網上對戰[^"]*撞柱[^"]*Card Game"/);
  assert.match(html, /<html lang="zh-HK">/);
  assert.match(html, /property="og:locale" content="zh_HK"/);
  assert.match(html, new RegExp(`<link rel="canonical" href="${site}" />`));
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) assert.match(html, new RegExp(`property="${p}" content="[^"]+"`));
  assert.match(html, /property="og:type" content="website"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /name="theme-color"/);
  assert.ok(existsSync(new URL('assets/og-image.png', root)));
});

test('JSON-LD describes a free WebApplication / VideoGame', () => {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  const ld = JSON.parse(raw);
  assert.deepEqual(ld['@type'], ['WebApplication', 'VideoGame']);
  for (const k of ['name', 'genre', 'operatingSystem', 'applicationCategory', 'offers']) assert.ok(ld[k], k);
  assert.equal(ld.offers.price, '0');
  assert.equal(ld.url, site);
});

test('rules, story and how-to are readable without JavaScript', () => {
  const body = html.slice(html.indexOf('<body'));
  const text = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  // Story + rules (pre-rendered zh-HK) and the how-to steps.
  assert.match(body, /<section class="guide"[\s\S]*<article class="prose"[\s\S]*<h3>鯉躍龍門<\/h3>/);
  for (const phrase of ['鯉躍龍門', '兩柱相連（無門）', '撞柱', '看懂機會率', '自由玩（無莊家）', '利是', DICTS['zh-HK']['howto.s1d']]) {
    assert.ok(text.includes(phrase), phrase);
  }
});

test('robots.txt allows everyone and points to the sitemap; sitemap lists the root URL', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  assert.match(robots, new RegExp(`Sitemap: ${site}sitemap.xml`));
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.match(sitemap, new RegExp(`<loc>${site}</loc>`));
});

test('index.html carries the standard Google tag for the configured GA4 id, behind privacy checks', async () => {
  const { ANALYTICS } = await import('../js/config.js');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(head.includes(`<script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.measurementId}"></script>`));
  assert.ok(head.indexOf('googletagmanager') < head.indexOf('<title'), 'tag sits near the top of <head>');
  const inline = head.match(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?<script>([\s\S]*?)<\/script>/)[1];
  for (const needle of ["globalPrivacyControl", "doNotTrack", "stg.analytics", "ga-disable-", "allow_google_signals: false", "page_location: location.origin + location.pathname"]) {
    assert.ok(inline.includes(needle), needle);
  }
  // privacy checks run before any config call
  assert.ok(inline.indexOf('return;') < inline.indexOf("gtag('config'"));
});
