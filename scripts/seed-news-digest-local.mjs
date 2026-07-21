#!/usr/bin/env node

/**
 * Minimal news digest seeder — fetches from a few public RSS feeds and writes
 * a digest to Redis so insights/forecasts can process it.
 */

import { loadEnvFile, runSeed, CHROME_UA } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const CANONICAL_KEY = 'news:digest:v1:full:en';

const RSS_FEEDS = [
  { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?best-topics=political-general&post_type=best' },
  { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml' },
  { name: 'Guardian World', url: 'https://www.theguardian.com/world/rss' },
];

function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml))) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/)?.[1] ?? block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? '';
    const desc = block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/)?.[1] ?? block.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? '';
    if (title.trim()) {
      items.push({
        title: title.replace(/<[^>]*>/g, '').trim().slice(0, 200),
        link: link.trim(),
        pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: '',
        summary: desc.replace(/<[^>]*>/g, '').trim().slice(0, 300),
      });
    }
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const resp = await fetch(feed.url, {
      headers: { 'User-Agent': CHROME_UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) { console.warn(`  ${feed.name}: HTTP ${resp.status}`); return []; }
    const xml = await resp.text();
    const items = parseRssItems(xml).slice(0, 15).map(i => ({ ...i, source: feed.name }));
    console.log(`  ${feed.name}: ${items.length} items`);
    return items;
  } catch (e) {
    console.warn(`  ${feed.name}: ${e.message}`);
    return [];
  }
}

function buildPayload() {
  const categories = { politics: { items: [] }, technology: { items: [] }, general: { items: [] } };
  return { categories, feedStatuses: {}, generatedAt: new Date().toISOString() };
}

async function main() {
  console.log('=== Local News Digest Seed ===');
  const allItems = [];
  for (const feed of RSS_FEEDS) {
    const items = await fetchFeed(feed);
    allItems.push(...items);
    await new Promise(r => setTimeout(r, 300));
  }

  if (allItems.length === 0) {
    console.error('FATAL: No items fetched from any feed');
    process.exit(1);
  }

  allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  const payload = {
    categories: { general: { items: allItems } },
    feedStatuses: {},
    generatedAt: new Date().toISOString(),
  };

  await runSeed('news', 'digest', CANONICAL_KEY, () => payload, {
    validateFn: (d) => Array.isArray(d?.categories?.general?.items) && d.categories.general.items.length > 0,
    ttlSeconds: 7200,
    sourceVersion: 'local-rss-v1',
    declareRecords: (d) => d?.categories?.general?.items?.length || 0,
    schemaVersion: 1,
    maxStaleMin: 60,
    recordCount: (d) => d?.categories?.general?.items?.length || 0,
  });
}

main().catch((err) => {
  console.error('FATAL:', err.message || err);
  process.exit(1);
});
