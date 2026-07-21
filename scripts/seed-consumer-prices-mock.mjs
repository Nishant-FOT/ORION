#!/usr/bin/env node

/**
 * Seed realistic mock consumer-prices data for all 8 markets.
 * Used when consumer-prices-core service is not running.
 *
 * Usage: node scripts/seed-consumer-prices-mock.mjs
 */

import { loadEnvFile, writeExtraKeyWithMeta } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const MARKETS = [
  { code: 'ae', currency: 'AED', baseIndex: 112.3, retailers: ['lulu', 'carrefour', 'spinneys', 'choithrams'] },
  { code: 'au', currency: 'AUD', baseIndex: 108.7, retailers: ['woolworths', 'coles', 'aldi', 'iga'] },
  { code: 'br', currency: 'BRL', baseIndex: 145.2, retailers: ['pao-de-acucar', 'extra', 'assai', 'carrefour'] },
  { code: 'gb', currency: 'GBP', baseIndex: 121.4, retailers: ['tesco', 'sainsburys', 'asda', 'morrisons'] },
  { code: 'in', currency: 'INR', baseIndex: 138.9, retailers: ['bigbasket', 'blinkit', 'zepto', 'dmart'] },
  { code: 'sa', currency: 'SAR', baseIndex: 115.6, retailers: ['panda', 'tamimi', 'danube', 'carrefour'] },
  { code: 'sg', currency: 'SGD', baseIndex: 106.8, retailers: ['fairprice', 'cold-storage', 'sheng-siong', 'giant'] },
  { code: 'us', currency: 'USD', baseIndex: 119.5, retailers: ['walmart', 'target', 'kroger', 'costco'] },
];

const CATEGORIES = [
  { slug: 'staples', name: 'Staples & Grains' },
  { slug: 'dairy', name: 'Dairy & Eggs' },
  { slug: 'protein', name: 'Protein & Meat' },
  { slug: 'produce', name: 'Fresh Produce' },
  { slug: 'oils', name: 'Oils & Condiments' },
  { slug: 'beverages', name: 'Beverages' },
  { slug: 'household', name: 'Household' },
  { slug: 'personal-care', name: 'Personal Care' },
];

const PRODUCT_NAMES = {
  ae: ['Al Marai Milk 1L', 'Al Ain Water 1.5L', 'Nabati Cheese 400g', 'Al Ain Tomato Paste', 'Lulu Chicken Breast', 'Emirates Rice 5kg', 'Almarai Butter 200g', 'Fresh Onions 1kg'],
  au: ['Woolworths Milk 2L', 'Coles Bread 680g', 'Cage Eggs 12pk', 'Bananas 1kg', 'Bega Cheese 500g', 'Woolworths Chicken 1kg', 'Dairy澳Milk 1L', 'Coles Pasta 500g'],
  br: ['Arroz Tio João 5kg', 'Leite Italac 1L', 'Ovos Caipira 30un', 'Frango Resfriado 1kg', 'Feijão Carioca 1kg', 'Óleo Soja Liza 900ml', 'Açúcar Cristal 5kg', 'Pão Francês 1kg'],
  gb: ['Tesco Whole Milk 2L', 'Warburtons Toastie 800g', 'Tesco Eggs 10pk', 'British Chicken Breast', 'Tesco Cheddar 400g', 'Heinz Baked Beans', 'Veg Oil 1L', 'Kettle Chips 150g'],
  in: ['Amul Milk 1L', 'Britannia Bread', 'Farm Eggs 6pk', 'Fresh Paneer 200g', 'Toor Dal 1kg', 'Fortune Sunflower Oil 1L', 'Aashirvaad Atta 5kg', 'Surf Excel 1kg'],
  sa: ['Nadec Milk 2L', 'Lusine Bread 600g', 'Almarai Eggs 30pk', 'Fresh Chicken 1kg', 'Almarai Cheese 400g', 'Saudi Rice 5kg', 'Rozana Oil 1.5L', 'Panda Tomato Paste'],
  sg: ['FairPrice Milk 1L', 'Gardenia Bread', 'Kee Eggs 10pk', 'Fresh Chicken 1kg', 'FairPrice Rice 5kg', 'Knife Cooking Oil 1L', 'Meadows Cheese 200g', 'FairPrice Pasta 500g'],
  us: ['Great Value Milk 1gal', 'Wonder Bread 20oz', 'Large Eggs 12pk', 'Tyson Chicken Breast', 'Kraft Mac & Cheese', 'Bananas 1lb', 'Cheerios 18oz', 'Tide Pods 42ct'],
};

function rand(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function generateSparkline(base, points = 12) {
  const data = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val += rand(-2, 2);
    data.push(Math.round(val * 10) / 10);
  }
  return data;
}

function generateSeries(base, days) {
  const series = [];
  let val = base;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    val += rand(-0.3, 0.3);
    const d = new Date(now - i * 86400000);
    series.push({
      date: d.toISOString().slice(0, 10),
      index: Math.round(val * 100) / 100,
    });
  }
  return series;
}

function overview(m) {
  const wowPct = rand(-1.5, 2.5);
  const momPct = rand(-0.8, 1.8);
  return {
    marketCode: m.code,
    asOf: String(Date.now()),
    currencyCode: m.currency,
    essentialsIndex: rand(m.baseIndex - 3, m.baseIndex + 3),
    valueBasketIndex: rand(m.baseIndex - 5, m.baseIndex + 1),
    wowPct,
    momPct,
    retailerSpreadPct: rand(3, 15),
    coveragePct: rand(75, 98),
    freshnessLagMin: randInt(15, 180),
    topCategories: CATEGORIES.slice(0, 4).map((c) => ({
      slug: c.slug,
      name: c.name,
      wowPct: rand(-2, 3),
      momPct: rand(-1.5, 2),
      currentIndex: rand(m.baseIndex - 5, m.baseIndex + 5),
      sparkline: generateSparkline(m.baseIndex),
      coveragePct: rand(70, 99),
      itemCount: randInt(8, 25),
    })),
    upstreamUnavailable: false,
  };
}

function categories(m, range) {
  return {
    marketCode: m.code,
    asOf: String(Date.now()),
    range,
    categories: CATEGORIES.map((c) => ({
      slug: c.slug,
      name: c.name,
      wowPct: rand(-2, 3),
      momPct: rand(-1.5, 2.5),
      currentIndex: rand(m.baseIndex - 5, m.baseIndex + 5),
      sparkline: generateSparkline(m.baseIndex),
      coveragePct: rand(70, 99),
      itemCount: randInt(8, 25),
    })),
    upstreamUnavailable: false,
  };
}

function movers(m, range) {
  const products = PRODUCT_NAMES[m.code] || PRODUCT_NAMES.ae;
  const risers = products.slice(0, randInt(3, 6)).map((p, i) => ({
    productId: `${m.code}-prod-${i}`,
    title: p,
    category: CATEGORIES[i % CATEGORIES.length].name,
    retailerSlug: m.retailers[i % m.retailers.length],
    changePct: rand(1, 12),
    currentPrice: rand(5, 80),
    currencyCode: m.currency,
  }));
  const fallers = products.slice(0, randInt(2, 4)).map((p, i) => ({
    productId: `${m.code}-prod-${i + 10}`,
    title: p,
    category: CATEGORIES[(i + 3) % CATEGORIES.length].name,
    retailerSlug: m.retailers[(i + 1) % m.retailers.length],
    changePct: rand(-10, -0.5),
    currentPrice: rand(3, 60),
    currencyCode: m.currency,
  }));
  return {
    marketCode: m.code,
    asOf: String(Date.now()),
    range,
    risers,
    fallers,
    upstreamUnavailable: false,
  };
}

function spread(m) {
  const retailers = m.retailers.map((r, i) => ({
    slug: r,
    name: r.charAt(0).toUpperCase() + r.slice(1).replace(/-/g, ' '),
    basketTotal: rand(80, 200),
    deltaVsCheapest: rand(0, 30),
    deltaVsCheapestPct: rand(0, 18),
    itemCount: randInt(20, 40),
    freshnessMin: randInt(20, 300),
    currencyCode: m.currency,
  }));
  return {
    marketCode: m.code,
    asOf: String(Date.now()),
    basketSlug: `essentials-${m.code}`,
    currencyCode: m.currency,
    retailers,
    spreadPct: rand(5, 15),
    upstreamUnavailable: false,
  };
}

function freshness(m) {
  const retailers = m.retailers.map((r) => ({
    slug: r,
    name: r.charAt(0).toUpperCase() + r.slice(1).replace(/-/g, ' '),
    lastRunAt: new Date(Date.now() - randInt(10, 400) * 60000).toISOString(),
    status: Math.random() > 0.1 ? 'ok' : 'stalled',
    parseSuccessRate: rand(0.85, 1),
    freshnessMin: randInt(10, 400),
  }));
  return {
    marketCode: m.code,
    asOf: String(Date.now()),
    retailers,
    overallFreshnessMin: Math.min(...retailers.map((r) => r.freshnessMin)),
    stalledCount: retailers.filter((r) => r.status === 'stalled').length,
    upstreamUnavailable: false,
  };
}

function basketSeries(m, range) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  return {
    marketCode: m.code,
    basketSlug: `essentials-${m.code}`,
    asOf: String(Date.now()),
    currencyCode: m.currency,
    range,
    essentialsSeries: generateSeries(m.baseIndex, days),
    valueSeries: generateSeries(m.baseIndex - 3, days),
    upstreamUnavailable: false,
  };
}

async function run() {
  const TTL = 86400; // 24h — long enough to persist

  const writes = [];

  for (const m of MARKETS) {
    // Overview
    writes.push({ key: `consumer-prices:overview:${m.code}`, data: overview(m), recordCount: 1 });

    // Categories (3 ranges)
    for (const range of ['7d', '30d', '90d']) {
      writes.push({ key: `consumer-prices:categories:${m.code}:${range}`, data: categories(m, range), recordCount: CATEGORIES.length });
    }

    // Movers (2 ranges)
    for (const range of ['7d', '30d']) {
      const mv = movers(m, range);
      writes.push({ key: `consumer-prices:movers:${m.code}:${range}`, data: mv, recordCount: mv.risers.length + mv.fallers.length });
    }

    // Retailer spread
    writes.push({ key: `consumer-prices:retailer-spread:${m.code}:essentials-${m.code}`, data: spread(m), recordCount: m.retailers.length });

    // Freshness
    writes.push({ key: `consumer-prices:freshness:${m.code}`, data: freshness(m), recordCount: m.retailers.length });

    // Basket series (3 ranges)
    for (const range of ['7d', '30d', '90d']) {
      const bs = basketSeries(m, range);
      const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
      writes.push({ key: `consumer-prices:basket-series:${m.code}:essentials-${m.code}:${range}`, data: bs, recordCount: days + 1 });
    }
  }

  console.log(`[consumer-prices-mock] seeding ${writes.length} keys for ${MARKETS.length} markets...`);

  let failed = 0;
  for (const { key, data, recordCount } of writes) {
    try {
      await writeExtraKeyWithMeta(key, data, TTL, recordCount);
    } catch (err) {
      console.error(`  [consumer-prices-mock] failed ${key}: ${err.message}`);
      failed++;
    }
  }

  console.log(`[consumer-prices-mock] done. ${writes.length - failed}/${writes.length} keys written.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('[consumer-prices-mock] seed failed:', err);
  process.exit(1);
});
