#!/usr/bin/env node
/**
 * build-seo.mjs — keeps the static SEO surface in sync with the source of truth.
 *
 *   npm run build:seo          rewrite index.html / privacy.html head blocks,
 *                              pre-render zh-HK copy, write robots.txt + sitemap.xml
 *   npm run build:seo -- --check   exit 1 if anything is out of date (used by tests)
 *
 * Site URL comes from package.json "homepage". Copy comes from js/i18n.js, so
 * the text crawlers see without JavaScript is exactly what players see in zh-HK.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICTS } from '../js/i18n.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const SITE = new URL(PKG.homepage).href.replace(/\/?$/, '/');
const LANG = 'zh-HK';
const dict = DICTS[LANG];
const t = (key) => dict[key] ?? DICTS.en[key] ?? key;
const check = process.argv.includes('--check');

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escText(s).replace(/"/g, '&quot;');

/* ── pre-render data-i18n* hooks with zh-HK copy ── */

function prerender(html) {
  // Plain text elements. Their content is text only (applyDom sets textContent).
  html = html.replace(
    /<([a-z][a-z0-9]*)(\s(?:[^>]*\s)?data-i18n="([\w.-]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (m, tag, attrs, key) => `<${tag}${attrs}>${escText(t(key))}</${tag}>`,
  );
  // Rich HTML blocks (dictionary-authored), unless opted out.
  html = html.replace(
    /<([a-z][a-z0-9]*)(\s(?:[^>]*\s)?data-i18n-html="([\w.-]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (m, tag, attrs, key) =>
      /data-prerender="skip"/.test(attrs) ? `<${tag}${attrs}></${tag}>` : `<${tag}${attrs}>${t(key).trim()}\n            </${tag}>`,
  );
  // Attributes.
  html = html.replace(/<[a-z][a-z0-9]*\s[^>]*data-i18n-attr="([^"]+)"[^>]*>/g, (tagText, spec) => {
    for (const pair of spec.split(';')) {
      const [attr, key] = pair.split(':').map((x) => x.trim());
      if (!attr || !key) continue;
      const value = escAttr(t(key));
      const re = new RegExp(`(\\s${attr}=")[^"]*(")`);
      tagText = re.test(tagText) ? tagText.replace(re, `$1${value}$2`) : tagText.replace(/\sdata-i18n-attr=/, ` ${attr}="${value}" data-i18n-attr=`);
    }
    return tagText;
  });
  return html;
}

/* ── generated <head> block ── */

function headBlock({ path = '', title, description, jsonLd, locale = 'zh_HK' }) {
  const url = new URL(path, SITE).href;
  const image = new URL('assets/og-image.png', SITE).href;
  const lines = [
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="射龍門 Shoot the Dragon Gate" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escAttr(title)}" />`,
    `<meta property="og:description" content="${escAttr(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="射龍門: two posts and the shot card on a jade felt table" />`,
    `<meta property="og:locale" content="${locale}" />`,
    ...['zh_HK', 'zh_CN', 'en_US'].filter((l) => l !== locale).map((l) => `<meta property="og:locale:alternate" content="${l}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escAttr(title)}" />`,
    `<meta name="twitter:description" content="${escAttr(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  if (jsonLd) lines.push(`<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>`);
  return lines.map((l) => `  ${l}`).join('\n');
}

function gameJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'VideoGame'],
    name: '射龍門 Shoot the Dragon Gate',
    alternateName: ['射龙门', 'Shoot the Dragon Gate', 'In-Between', 'Acey-Deucey'],
    url: SITE,
    image: new URL('assets/og-image.png', SITE).href,
    description: t('meta.description'),
    inLanguage: ['zh-HK', 'zh-CN', 'en'],
    genre: ['Card game', 'Casual game', 'Party game'],
    applicationCategory: 'GameApplication',
    applicationSubCategory: 'Card game',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript and a modern browser; online rooms use WebRTC.',
    gamePlatform: ['Web browser', 'Desktop', 'Mobile'],
    playMode: ['SinglePlayer', 'MultiPlayer'],
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 6 },
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
  };
}

function withHeadBlock(html, block) {
  const re = /(<!-- seo:start[^>]*-->)[\s\S]*?(\s*<!-- seo:end -->)/;
  if (!re.test(html)) throw new Error('seo:start / seo:end markers missing');
  return html.replace(re, `$1\n${block}$2`);
}

/* ── robots & sitemap ── */

const robots = `# ${SITE}
User-agent: *
Allow: /

Sitemap: ${new URL('sitemap.xml', SITE).href}
`;

function sitemap(lastmod) {
  const urls = [
    { loc: SITE, priority: '1.0', changefreq: 'weekly' },
    { loc: new URL('privacy.html', SITE).href, priority: '0.3', changefreq: 'yearly' },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;
}

/* ── run ── */

const outputs = new Map();
const read = (f) => (existsSync(join(ROOT, f)) ? readFileSync(join(ROOT, f), 'utf8') : '');

outputs.set(
  'index.html',
  withHeadBlock(
    prerender(read('index.html')),
    headBlock({ title: t('meta.title'), description: t('meta.description'), jsonLd: gameJsonLd() }),
  ),
);
outputs.set(
  'privacy.html',
  withHeadBlock(
    read('privacy.html'),
    headBlock({ path: 'privacy.html', title: 'Privacy · 射龍門 Shoot the Dragon Gate', description: 'Privacy policy for 射龍門 (Shoot the Dragon Gate): local-only storage, peer-to-peer rooms, and advertising cookies.', locale: 'en_US' }),
  ),
);
outputs.set('robots.txt', robots);
// Keep the existing lastmod in --check mode so the check doesn't fail just because the date changed.
const prevLastmod = read('sitemap.xml').match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
const today = new Date().toISOString().slice(0, 10);
outputs.set('sitemap.xml', sitemap(check && prevLastmod ? prevLastmod : today));

const stale = [];
for (const [file, content] of outputs) {
  if (read(file) === content) continue;
  stale.push(file);
  if (!check) writeFileSync(join(ROOT, file), content);
}

if (check) {
  if (stale.length) {
    console.error(`SEO files out of date: ${stale.join(', ')}. Run \`npm run build:seo\`.`);
    process.exit(1);
  }
  console.log('SEO files up to date.');
} else {
  console.log(stale.length ? `Updated: ${stale.join(', ')}` : 'Nothing to update.');
}
