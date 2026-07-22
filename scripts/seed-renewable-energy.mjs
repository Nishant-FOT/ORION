#!/usr/bin/env node
/**
 * Seed script: Renewable energy data from Our World in Data (OWID)
 * 
 * Replaces the stale World Bank EG.ELC.RNEW.ZS indicator (stuck at 2021)
 * with live OWID data through 2024. Includes:
 * - Global renewable electricity share (time-series)
 * - Regional breakdown (7 regions)
 * - Generation mix (hydro, wind, solar, nuclear, fossil)
 * 
 * Usage:
 *   node scripts/seed-renewable-energy.mjs
 */

import { loadEnvFile, getRedisCredentials, runSeed } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const CANONICAL_KEY = 'economic:worldbank-renewable:v1';
const CAPACITY_KEY = 'renewable:eia-capacity-series:v1';

// OWID regions we track
const OWID_REGIONS = {
  'Africa': { code: 'SSF', name: 'Sub-Saharan Africa' },
  'Asia': { code: 'EAS', name: 'East Asia & Pacific' },
  'Europe': { code: 'ECS', name: 'Europe & Central Asia' },
  'North America': { code: 'NAC', name: 'North America' },
  'South America': { code: 'LCN', name: 'Latin America & Caribbean' },
  'Oceania': { code: 'OCN', name: 'Oceania' },
  'Middle East': { code: 'MEA', name: 'Middle East & N. Africa' },
};

async function fetchOwidData() {
  console.log('[renewable] Fetching OWID energy data CSV...');
  const resp = await fetch('https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!resp.ok) throw new Error(`OWID fetch failed: HTTP ${resp.status}`);
  const csv = await resp.text();
  const lines = csv.split('\n');
  console.log(`[renewable] CSV: ${lines.length} rows`);

  // Parse header
  const header = lines[0].split(',');
  const col = {};
  for (const name of ['country', 'year', 'renewables_share_elec', 'hydro_share_elec',
    'wind_share_elec', 'solar_share_elec', 'nuclear_share_elec', 'fossil_share_elec']) {
    col[name] = header.indexOf(name);
  }

  // Parse all rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');
    const country = cols[col.country];
    const year = parseInt(cols[col.year], 10);
    const renewElec = parseFloat(cols[col.renewables_share_elec]);
    if (!country || Number.isNaN(year) || Number.isNaN(renewElec)) continue;
    rows.push({
      country, year, renewElec,
      hydro: parseFloat(cols[col.hydro_share_elec]) || 0,
      wind: parseFloat(cols[col.wind_share_elec]) || 0,
      solar: parseFloat(cols[col.solar_share_elec]) || 0,
      nuclear: parseFloat(cols[col.nuclear_share_elec]) || 0,
      fossil: parseFloat(cols[col.fossil_share_elec]) || 0,
    });
  }

  // 1. World historical data
  const worldRows = rows
    .filter(r => r.country === 'World' && r.year >= 1990)
    .sort((a, b) => a.year - b.year);
  const historicalData = worldRows.map(r => ({
    year: r.year,
    value: Math.round(r.renewElec * 10) / 10,
  }));
  const latestWorld = worldRows[worldRows.length - 1];

  // 2. Regional data (latest year with data for each region)
  const regions = [];
  for (const [owidName, info] of Object.entries(OWID_REGIONS)) {
    const regionRows = rows
      .filter(r => r.country === owidName && !Number.isNaN(r.renewElec))
      .sort((a, b) => b.year - a.year);
    if (regionRows.length > 0) {
      const latest = regionRows[0];
      regions.push({
        code: info.code,
        name: info.name,
        percentage: Math.round(latest.renewElec * 10) / 10,
        year: latest.year,
      });
    }
  }
  regions.sort((a, b) => b.percentage - a.percentage);

  // 3. Build payload
  const payload = {
    globalPercentage: Math.round(latestWorld.renewElec * 1000) / 1000,
    globalYear: latestWorld.year,
    historicalData,
    regions,
    generationMix: {
      year: latestWorld.year,
      hydro: Math.round(latestWorld.hydro * 10) / 10,
      wind: Math.round(latestWorld.wind * 10) / 10,
      solar: Math.round(latestWorld.solar * 10) / 10,
      nuclear: Math.round(latestWorld.nuclear * 10) / 10,
      fossil: Math.round(latestWorld.fossil * 10) / 10,
    },
    dataSource: 'owid-energy-data',
    fetchedAt: Date.now(),
  };

  console.log(`[renewable] Global: ${payload.globalPercentage}% (${payload.globalYear})`);
  console.log(`[renewable] Historical points: ${historicalData.length}`);
  console.log(`[renewable] Regions: ${regions.length}`);
  regions.forEach(r => console.log(`  ${r.name}: ${r.percentage}% (${r.year})`));
  console.log(`[renewable] Generation mix:`, JSON.stringify(payload.generationMix));

  return payload;
}

// EIA capacity data from existing seed or fetch from API
async function fetchEiaCapacity() {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) {
    console.log('[capacity] No EIA_API_KEY — skipping EIA capacity seed');
    return null;
  }

  console.log('[capacity] Fetching EIA electricity capacity data...');
  const sources = [
    { code: 'SUN', name: 'Solar' },
    { code: 'WND', name: 'Wind' },
    { code: 'COL', name: 'Coal' },
  ];

  const series = [];
  for (const src of sources) {
    try {
      const url = `https://api.eia.gov/v2/electricity/operating-generator-capacity/data/?api_key=${apiKey}` +
        `&frequency=annual&data[0]=nameplate-capacity-mw&facets[fuel2002][]=${src.code}` +
        `&facets[sectorid][]=99&sort[0][column]=period&sort[0][direction]=desc&length=25`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      const data = json?.response?.data || [];
      // Aggregate by period (year)
      const byYear = {};
      for (const row of data) {
        const year = parseInt(row.period, 10);
        const mw = parseFloat(row['nameplate-capacity-mw']);
        if (Number.isNaN(year) || Number.isNaN(mw)) continue;
        byYear[year] = (byYear[year] || 0) + mw;
      }
      const points = Object.entries(byYear)
        .map(([year, capacityMw]) => ({ year: parseInt(year, 10), capacityMw: Math.round(capacityMw) }))
        .sort((a, b) => a.year - b.year);
      series.push({ source: src.code, name: src.name, data: points });
      console.log(`  ${src.name}: ${points.length} years, latest ${points[points.length - 1]?.capacityMw} MW`);
    } catch (err) {
      console.warn(`  ${src.name} fetch failed: ${err.message}`);
    }
  }
  return series.length > 0 ? { series, fetchedAt: Date.now() } : null;
}

async function main() {
  // Fetch OWID data
  const payload = await fetchOwidData();

  // Seed the canonical key
  await runSeed('economic', 'worldbank-renewable', CANONICAL_KEY, () => payload, {
    recordCount: payload.historicalData.length + payload.regions.length,
    sourceVersion: 'owid-v1',
    zeroIsValid: false,
  });

  // Also try to seed EIA capacity data
  const capacity = await fetchEiaCapacity();
  if (capacity) {
    const { url, token } = getRedisCredentials();
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', CAPACITY_KEY, JSON.stringify(capacity), 'EX', 7 * 24 * 3600]),
    });
    if (resp.ok) {
      console.log(`[capacity] Seeded ${capacity.series.length} series → ${CAPACITY_KEY}`);
    }
  }
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
