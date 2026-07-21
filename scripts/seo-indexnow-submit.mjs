#!/usr/bin/env node
/**
 * Submit all orion.app URLs to IndexNow after deploy.
 * Run once after deploying the IndexNow key file:
 *   node scripts/seo-indexnow-submit.mjs
 *
 * IndexNow requires all URLs in one request to share the same host.
 * Submits separate batches per subdomain.
 */

import { readdirSync } from 'node:fs';
import { basename } from 'node:path';

const KEY = 'a7f3e9d1b2c44e8f9a0b1c2d3e4f5a6b';
const BLOG_DIR = new URL('../blog-site/src/content/blog/', import.meta.url);

function getBlogPostUrls() {
  return readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => `https://www.orion.app/blog/posts/${basename(file, '.md')}/`)
    .sort();
}

const WWW_URLS = [
  'https://www.orion.app/',
  'https://www.orion.app/pro',
  'https://www.orion.app/blog/',
  ...getBlogPostUrls(),
];

const BATCHES = [
  {
    host: 'www.orion.app',
    urls: WWW_URLS,
  },
  { host: 'tech.orion.app', urls: ['https://tech.orion.app/'] },
  { host: 'finance.orion.app', urls: ['https://finance.orion.app/'] },
  { host: 'happy.orion.app', urls: ['https://happy.orion.app/'] },
];

const ENDPOINTS = [
  'https://api.indexnow.org/IndexNow',
  'https://www.bing.com/IndexNow',
  'https://searchadvisor.naver.com/indexnow',
  'https://search.seznam.cz/indexnow',
  'https://yandex.com/indexnow',
];

async function submit(endpoint, host, urlList) {
  const keyLocation = `https://${host}/${KEY}.txt`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'ORION-IndexNow/1.0 (+https://www.orion.app)',
    },
    body: JSON.stringify({ host, key: KEY, keyLocation, urlList }),
  });
  return { endpoint, host, status: res.status, ok: res.ok };
}

for (const { host, urls } of BATCHES) {
  console.log(`\n[${host}] (${urls.length} URLs)`);
  const results = await Promise.allSettled(ENDPOINTS.map(ep => submit(ep, host, urls)));
  for (const r of results) {
    if (r.status === 'fulfilled') {
      console.log(`  ${r.value.ok ? '✓' : '✗'} ${r.value.endpoint.replace('https://', '')} → ${r.value.status}`);
    } else {
      console.log(`  ✗ error: ${r.reason}`);
    }
  }
}
