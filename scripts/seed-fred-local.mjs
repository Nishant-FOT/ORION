#!/usr/bin/env node

/**
 * Local FRED data seeder — replaces Railway's seed-economy.mjs for local dev.
 * Fetches FRED series directly (no proxy) and computes the Economic Stress Index.
 * Run: node scripts/seed-fred-local.mjs
 */

import { loadEnvFile, getRedisCredentials, writeExtraKeyWithMeta } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const FRED_KEY_PREFIX = 'economic:fred:v1';
const STRESS_INDEX_KEY = 'economic:stress-index:v1';
const FRED_TTL = 93600;          // 26h
const STRESS_INDEX_TTL = 21600;  // 6h

const FRED_SERIES = [
  'WALCL', 'FEDFUNDS', 'T10Y2Y', 'UNRATE', 'CPIAUCSL', 'DGS10', 'VIXCLS',
  'GDP', 'M2SL', 'DCOILWTICO', 'BAMLH0A0HYM2', 'ICSA', 'MORTGAGE30US',
  'BAMLC0A0CM', 'SOFR', 'DGS1MO', 'DGS3MO', 'DGS6MO', 'DGS1', 'DGS2', 'DGS5', 'DGS30',
  'T10Y3M', 'STLFSI4',
];

const STRESS_COMPONENTS = [
  { id: 'T10Y2Y',  label: 'Yield Curve',      weight: 0.20, score: (v) => clamp((0.5 - v) / (0.5 - (-1.5)) * 100) },
  { id: 'T10Y3M',  label: 'Bank Spread',       weight: 0.15, score: (v) => clamp((0.5 - v) / (0.5 - (-1.0)) * 100) },
  { id: 'VIXCLS',  label: 'Volatility',        weight: 0.20, score: (v) => clamp((v - 15) / (80 - 15) * 100) },
  { id: 'STLFSI4', label: 'Financial Stress',  weight: 0.20, score: (v) => clamp((v - (-1)) / (5 - (-1)) * 100) },
  { id: 'GSCPI',   label: 'Supply Chain',      weight: 0.15, score: (v) => clamp((v - (-2)) / (4 - (-2)) * 100) },
  { id: 'ICSA',    label: 'Job Claims',        weight: 0.10, score: (v) => clamp((v - 180000) / (500000 - 180000) * 100) },
];

function clamp(v) { return Math.min(100, Math.max(0, v)); }

function stressLabel(score) {
  if (score < 20) return 'Low';
  if (score < 40) return 'Moderate';
  if (score < 60) return 'Elevated';
  if (score < 80) return 'Severe';
  return 'Critical';
}

async function fetchFredSeries(seriesId, apiKey) {
  const obsParams = new URLSearchParams({
    series_id: seriesId, api_key: apiKey, file_type: 'json', sort_order: 'desc', limit: '120',
  });
  const metaParams = new URLSearchParams({
    series_id: seriesId, api_key: apiKey, file_type: 'json',
  });

  const [obsResp, metaResp] = await Promise.allSettled([
    fetch(`https://api.stlouisfed.org/fred/series/observations?${obsParams}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
    fetch(`https://api.stlouisfed.org/fred/series?${metaParams}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
  ]);

  if (obsResp.status === 'rejected') return null;

  const obsData = obsResp.value;
  const observations = (obsData.observations || [])
    .map(o => { const v = parseFloat(o.value); return Number.isNaN(v) || o.value === '.' ? null : { date: o.date, value: v }; })
    .filter(Boolean)
    .reverse();

  let title = seriesId, units = '', frequency = '';
  if (metaResp.status === 'fulfilled') {
    const meta = metaResp.value.seriess?.[0];
    if (meta) { title = meta.title || seriesId; units = meta.units || ''; frequency = meta.frequency || ''; }
  }

  return { seriesId, title, units, frequency, observations };
}

function computeStressIndex(fredResults) {
  const components = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const comp of STRESS_COMPONENTS) {
    const series = fredResults[comp.id];
    const obs = series?.observations;
    let rawValue = null;
    if (obs?.length > 0) {
      for (let j = obs.length - 1; j >= 0; j--) {
        const v = obs[j]?.value;
        if (typeof v === 'number' && Number.isFinite(v)) { rawValue = v; break; }
      }
    }

    if (rawValue === null) {
      components.push({ id: comp.id, label: comp.label, rawValue: null, missing: true, score: 0, weight: comp.weight });
      continue;
    }

    const score = comp.score(rawValue);
    weightedSum += score * comp.weight;
    totalWeight += comp.weight;
    console.log(`  [StressIndex] ${comp.id}: raw=${rawValue.toFixed(4)} score=${score.toFixed(1)}`);
    components.push({ id: comp.id, label: comp.label, rawValue, score, weight: comp.weight, missing: false });
  }

  if (totalWeight === 0) return null;

  const compositeScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  return { compositeScore, label: stressLabel(compositeScore), components, seededAt: new Date().toISOString(), unavailable: false };
}

async function main() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.error('Missing FRED_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('=== FRED Local Seeder ===');
  console.log(`Fetching ${FRED_SERIES.length} series from FRED API...`);

  const fredResults = {};
  let successCount = 0;

  for (const seriesId of FRED_SERIES) {
    try {
      const data = await fetchFredSeries(seriesId, apiKey);
      if (data) {
        fredResults[seriesId] = data;
        successCount++;
      }
      // 200ms delay between calls to be nice to FRED API
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.warn(`  FRED ${seriesId}: ${e.message}`);
    }
  }

  console.log(`\nFetched ${successCount}/${FRED_SERIES.length} series`);

  if (successCount === 0) {
    console.error('No FRED data fetched — check FRED_API_KEY');
    process.exit(1);
  }

  // Write each FRED series to Redis
  const { url, token } = getRedisCredentials();
  let written = 0;

  for (const [seriesId, data] of Object.entries(fredResults)) {
    const key = `${FRED_KEY_PREFIX}:${seriesId}:0`;
    const payload = { series: data };
    try {
      await writeExtraKeyWithMeta(key, payload, FRED_TTL, data.observations.length);
      written++;
    } catch (e) {
      console.warn(`  Write ${seriesId}: ${e.message}`);
    }
  }

  console.log(`Wrote ${written} FRED keys to Redis`);

  // Compute and write Stress Index
  const stress = computeStressIndex(fredResults);
  if (stress) {
    try {
      await writeExtraKeyWithMeta(STRESS_INDEX_KEY, stress, STRESS_INDEX_TTL, stress.components.length);
      console.log(`\nStress Index: ${stress.compositeScore} (${stress.label}) — ${stress.components.filter(c => !c.missing).length}/${stress.components.length} components`);
    } catch (e) {
      console.warn(`  Write stress index: ${e.message}`);
    }
  } else {
    console.warn('Could not compute stress index');
  }

  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
