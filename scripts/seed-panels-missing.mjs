#!/usr/bin/env node
/**
 * Seed all 6 missing panel data to Redis in one shot.
 * Usage: node scripts/seed-panels-missing.mjs
 */
import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();
const TTL = 86400 * 7; // 7 days

function wrap(data) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  return JSON.stringify({ _seed: { fetchedAt: Date.now(), recordCount: 1, sourceVersion: 'mock-v1', schemaVersion: 1, state: 'OK' }, data: obj });
}

async function redisSet(key, value) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, value, 'EX', TTL]),
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) throw new Error(`SET ${key}: HTTP ${resp.status}`);
}

// 1. Sanctions Pressure
function buildSanctions() {
  const countries = [
    { countryCode: 'RU', countryName: 'Russia', entryCount: 2847, newEntryCount: 12, vesselCount: 189, aircraftCount: 45 },
    { countryCode: 'IR', countryName: 'Iran', entryCount: 1923, newEntryCount: 8, vesselCount: 67, aircraftCount: 12 },
    { countryCode: 'KP', countryName: 'North Korea', entryCount: 845, newEntryCount: 3, vesselCount: 23, aircraftCount: 5 },
    { countryCode: 'SY', countryName: 'Syria', entryCount: 612, newEntryCount: 2, vesselCount: 15, aircraftCount: 3 },
    { countryCode: 'CU', countryName: 'Cuba', entryCount: 312, newEntryCount: 0, vesselCount: 8, aircraftCount: 1 },
    { countryCode: 'CN', countryName: 'China', entryCount: 287, newEntryCount: 5, vesselCount: 34, aircraftCount: 8 },
    { countryCode: 'BY', countryName: 'Belarus', entryCount: 198, newEntryCount: 2, vesselCount: 4, aircraftCount: 2 },
    { countryCode: 'VE', countryName: 'Venezuela', entryCount: 156, newEntryCount: 1, vesselCount: 12, aircraftCount: 3 },
  ];
  const programs = [
    { program: 'UKRAINE-EO14024', entryCount: 2847, newEntryCount: 12 },
    { program: 'IRAN-TRADE-EO13846', entryCount: 1923, newEntryCount: 8 },
    { program: 'DPRK-EO13466', entryCount: 845, newEntryCount: 3 },
    { program: 'SYRIA-EO13582', entryCount: 612, newEntryCount: 2 },
    { program: 'CUBA-EO13411', entryCount: 312, newEntryCount: 0 },
    { program: 'CHINA-EO13959', entryCount: 287, newEntryCount: 5 },
  ];
  const entries = [
    { id: 'SDN-1001', name: 'Gazprom Neft PJSC', entityType: 'entity', countryCodes: ['RU'], countryNames: ['Russia'], programs: ['UKRAINE-EO14024'], sourceLists: ['OFAC-SDN'], effectiveAt: '2024-02-12', isNew: true, note: 'Energy sector sanctions' },
    { id: 'SDN-1002', name: 'Sberbank of Russia', entityType: 'entity', countryCodes: ['RU'], countryNames: ['Russia'], programs: ['UKRAINE-EO14024'], sourceLists: ['OFAC-SDN'], effectiveAt: '2022-02-24', isNew: false, note: 'Major financial institution' },
    { id: 'SDN-1003', name: 'National Iranian Oil Company', entityType: 'entity', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-EO13846'], sourceLists: ['OFAC-SDN'], effectiveAt: '2018-11-05', isNew: true, note: 'Oil sector' },
    { id: 'SDN-1004', name: 'Vostochny Mining Co', entityType: 'entity', countryCodes: ['KP'], countryNames: ['North Korea'], programs: ['DPRK-EO13466'], sourceLists: ['OFAC-SDN'], effectiveAt: '2023-06-15', isNew: true, note: 'WMD proliferation' },
    { id: 'VES-2001', name: 'Lady R', entityType: 'vessel', countryCodes: ['RU'], countryNames: ['Russia'], programs: ['UKRAINE-EO14024'], sourceLists: ['OFAC-SDN'], effectiveAt: '2023-08-01', isNew: false, note: 'Sanctions-evading vessel' },
    { id: 'SDN-1005', name: 'Syrian Scientific Research Center', entityType: 'entity', countryCodes: ['SY'], countryNames: ['Syria'], programs: ['SYRIA-EO13582'], sourceLists: ['OFAC-SDN'], effectiveAt: '2019-04-10', isNew: false, note: 'CW program' },
    { id: 'SDN-1006', name: 'Belorusian Potash Company', entityType: 'entity', countryCodes: ['BY'], countryNames: ['Belarus'], programs: ['BELARUS-EO13405'], sourceLists: ['OFAC-SDN'], effectiveAt: '2021-08-09', isNew: true, note: 'Export restrictions' },
    { id: 'VES-2002', name: 'Pacific Voyager', entityType: 'vessel', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-EO13846'], sourceLists: ['OFAC-SDN'], effectiveAt: '2024-01-20', isNew: true, note: 'Oil smuggling vessel' },
    { id: 'SDN-1007', name: 'Shanghai Tech Research Institute', entityType: 'entity', countryCodes: ['CN'], countryNames: ['China'], programs: ['CHINA-EO13959'], sourceLists: ['OFAC-SDN'], effectiveAt: '2024-03-15', isNew: true, note: 'Military end-use' },
    { id: 'SDN-1008', name: 'Petróleos de Venezuela SA', entityType: 'entity', countryCodes: ['VE'], countryNames: ['Venezuela'], programs: ['VENEZUELA-EO13850'], sourceLists: ['OFAC-SDN'], effectiveAt: '2019-01-28', isNew: false, note: 'Oil sector' },
  ];
  return JSON.stringify({
    fetchedAt: new Date().toISOString(),
    datasetDate: new Date().toISOString(),
    totalCount: 7180,
    sdnCount: 6245,
    consolidatedCount: 935,
    newEntryCount: 33,
    vesselCount: 352,
    aircraftCount: 79,
    countries,
    programs,
    entries,
  });
}

// 2. Hormuz Trade Tracker
function buildHormuz() {
  const months = ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];
  function genSeries(base, trend) {
    return months.map((m, i) => ({ date: m + '-15', value: Math.round(base + trend * i + (Math.random() - 0.5) * base * 0.05) }));
  }
  return JSON.stringify({
    fetchedAt: Date.now(),
    updatedDate: '2026-06-28',
    title: 'Strait of Hormuz — Trade Flow Monitor',
    summary: 'Trade flows through the Strait of Hormuz remain under elevated scrutiny amid regional tensions. Crude oil tanker transits have declined 8% month-over-month while LNG shipments remain stable.',
    paragraphs: [
      'The Strait of Hormuz handles approximately 21 million barrels per day of crude oil and condensate, representing roughly 21% of global petroleum consumption.',
      'Recent geopolitical developments have increased insurance premiums for vessels transiting the strait, with war risk surcharges reaching 0.5% of hull value.',
    ],
    status: 'open',
    charts: [
      {
        label: 'Crude Oil',
        title: 'Monthly Crude Oil Transits (kb/d)',
        series: genSeries(21000, -150),
      },
      {
        label: 'LNG',
        title: 'Monthly LNG Shipments (MMt)',
        series: genSeries(26, 0.3),
      },
      {
        label: 'Fertilizer',
        title: 'Fertilizer Exports (kt)',
        series: genSeries(3200, -40),
      },
      {
        label: 'Agriculture',
        title: 'Agricultural Trade (kt)',
        series: genSeries(1800, 10),
      },
    ],
    attribution: { source: 'WTO DataLab', url: 'https://datalab.trade/ocean-freight' },
  });
}

// 3. Fuel Shortages
function buildFuelShortages() {
  return JSON.stringify({
    shortages: [
      { id: 'fs-001', country: 'Nigeria', product: 'petrol', severity: 'confirmed', firstSeen: '2025-11-15', lastConfirmed: '2026-06-20', resolvedAt: '', impactTypes: ['transport', 'power'], causeChain: ['subsidy_removal', 'pipeline_vandalism'], shortDescription: 'Widespread petrol shortages across Nigeria due to subsidy removal and pipeline disruptions', evidence: { evidenceSources: [{ authority: 'NRA', title: 'Nigerian Midstream Downstream Regulatory Authority Advisory', url: 'https://nra.gov.ng/advisory', date: '2026-06-20', sourceType: 'regulator' }], firstRegulatorConfirmation: '2025-12-01', classifierVersion: 'v1', classifierConfidence: 0.92, lastEvidenceUpdate: '2026-06-20' } },
      { id: 'fs-002', country: 'Lebanon', product: 'diesel', severity: 'confirmed', firstSeen: '2025-09-01', lastConfirmed: '2026-06-18', resolvedAt: '', impactTypes: ['power', 'transport', 'heating'], causeChain: ['currency_crisis', 'fuel_subsidy_cutoff'], shortDescription: 'Chronic diesel shortage impacting power generation and transportation', evidence: { evidenceSources: [{ authority: 'EDL', title: 'Électricité du Liban Fuel Status', url: 'https://edl.gov.lb/status', date: '2026-06-18', sourceType: 'regulator' }], firstRegulatorConfirmation: '2025-10-15', classifierVersion: 'v1', classifierConfidence: 0.88, lastEvidenceUpdate: '2026-06-18' } },
      { id: 'fs-003', country: 'Cuba', product: 'diesel', severity: 'confirmed', firstSeen: '2025-08-10', lastConfirmed: '2026-06-15', resolvedAt: '', impactTypes: ['power', 'transport'], causeChain: ['oil_import_decline', 'sanctions'], shortDescription: 'Critical diesel shortage causing rolling blackouts', evidence: { evidenceSources: [{ authority: 'CNE', title: 'Cuba Electric Union Report', url: 'https://cne.cu/report', date: '2026-06-15', sourceType: 'regulator' }], firstRegulatorConfirmation: '2025-09-20', classifierVersion: 'v1', classifierConfidence: 0.85, lastEvidenceUpdate: '2026-06-15' } },
      { id: 'fs-004', country: 'Bangladesh', product: 'petrol', severity: 'watch', firstSeen: '2026-03-01', lastConfirmed: '2026-06-10', resolvedAt: '', impactTypes: ['transport'], causeChain: ['import_dependency', 'forex_shortage'], shortDescription: 'Intermittent petrol shortages at urban stations', evidence: { evidenceSources: [{ authority: 'BPC', title: 'Bangladesh Petroleum Corporation Notice', url: 'https://bpc.gov.bd/notice', date: '2026-06-10', sourceType: 'regulator' }], firstRegulatorConfirmation: '2026-03-15', classifierVersion: 'v1', classifierConfidence: 0.72, lastEvidenceUpdate: '2026-06-10' } },
      { id: 'fs-005', country: 'Pakistan', product: 'diesel', severity: 'watch', firstSeen: '2026-01-20', lastConfirmed: '2026-06-08', resolvedAt: '', impactTypes: ['transport', 'agriculture'], causeChain: ['imf_austerity', 'import_restrictions'], shortDescription: 'Diesel supply constraints in agricultural regions', evidence: { evidenceSources: [{ authority: 'OGDCL', title: 'Oil and Gas Development Company Supply Update', url: 'https://ogdcl.com.pk/update', date: '2026-06-08', sourceType: 'operator' }], firstRegulatorConfirmation: '2026-02-10', classifierVersion: 'v1', classifierConfidence: 0.65, lastEvidenceUpdate: '2026-06-08' } },
      { id: 'fs-006', country: 'Sri Lanka', product: 'jet', severity: 'watch', firstSeen: '2026-02-15', lastConfirmed: '2026-06-05', resolvedAt: '', impactTypes: ['aviation'], causeChain: ['外汇_shortage', 'import_delays'], shortDescription: 'Jet fuel supply intermittent at Colombo airport', evidence: { evidenceSources: [{ authority: 'CAA', title: 'Civil Aviation Authority Sri Lanka', url: 'https://caalk.lk/advisory', date: '2026-06-05', sourceType: 'regulator' }], firstRegulatorConfirmation: '2026-03-01', classifierVersion: 'v1', classifierConfidence: 0.6, lastEvidenceUpdate: '2026-06-05' } },
    ],
    fetchedAt: new Date().toISOString(),
    classifierVersion: 'v1',
    upstreamUnavailable: false,
  });
}

// 4. Fear & Greed
function buildFearGreed() {
  return JSON.stringify({
    composite: { score: 42, label: 'Fear', previous: 38 },
    categories: {
      sentiment: { score: 35, weight: 0.12, contribution: 4.2 },
      volatility: { score: 55, weight: 0.10, contribution: 5.5 },
      positioning: { score: 28, weight: 0.10, contribution: 2.8 },
      trend: { score: 52, weight: 0.12, contribution: 6.2 },
      breadth: { score: 45, weight: 0.10, contribution: 4.5 },
      momentum: { score: 48, weight: 0.10, contribution: 4.8 },
      liquidity: { score: 38, weight: 0.10, contribution: 3.8 },
      credit: { score: 50, weight: 0.08, contribution: 4.0 },
      macro: { score: 32, weight: 0.10, contribution: 3.2 },
      crossAsset: { score: 45, weight: 0.08, contribution: 3.6 },
    },
    headerMetrics: {
      vix: { value: 22.5 },
      hySpread: { value: 4.15 },
      yield10y: { value: 4.28 },
      putCall: { value: 1.12 },
      pctAbove200d: { value: 44.2 },
      cnnFearGreed: { value: 38, label: 'Fear' },
      aaiBull: { value: 28.5 },
      aaiBear: { value: 42.3 },
      fedRate: { value: '4.50%' },
    },
    timestamp: new Date().toISOString(),
  });
}

// 5. Macro Signals (BTC Regime)
function buildMacroSignals() {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    verdict: 'CASH',
    bullishCount: 3,
    totalCount: 7,
    signals: {
      liquidity: { status: 'NEUTRAL', value: 0.82, sparkline: [0.78, 0.80, 0.79, 0.81, 0.82, 0.83, 0.82] },
      flowStructure: { status: 'MIXED', btcReturn5: -2.3, qqqReturn5: 1.1 },
      macroRegime: { status: 'NEUTRAL', qqqRoc20: 3.2, xlpRoc20: 2.8 },
      technicalTrend: { status: 'BEARISH', btcPrice: 104250, sma50: 106800, sma200: 98500, vwap30d: 105200, mayerMultiple: 1.06, sparkline: [108500, 107200, 106100, 105300, 104800, 104500, 104250] },
      hashRate: { status: 'GROWING', change30d: 4.2 },
      priceMomentum: { status: 'BEARISH' },
      fearGreed: { status: 'FEAR', value: 42, history: [{ value: 38, date: '2026-06-29' }, { value: 45, date: '2026-06-28' }, { value: 52, date: '2026-06-27' }, { value: 48, date: '2026-06-26' }, { value: 42, date: '2026-06-25' }] },
    },
    meta: { qqqSparkline: [525, 528, 531, 529, 532, 530, 528] },
  });
}

// 6. Economic Stress (Macro Stress)
function buildEconomicStress() {
  return JSON.stringify({
    compositeScore: 58,
    label: 'Elevated',
    components: [
      { id: 'T10Y2Y', label: 'Yield Curve', rawValue: 0.12, score: 35, weight: 0.18, missing: false },
      { id: 'BAMLH0A0HYM2', label: 'High Yield Spread', rawValue: 4.15, score: 62, weight: 0.17, missing: false },
      { id: 'VIXCLS', label: 'VIX', rawValue: 22.5, score: 55, weight: 0.15, missing: false },
      { id: 'STLFSI4', label: 'St. Louis Fed Stress', rawValue: 0.82, score: 48, weight: 0.15, missing: false },
      { id: 'GSCPI', label: 'Global Supply Chain', rawValue: 1.85, score: 72, weight: 0.18, missing: false },
      { id: 'ICSA', label: 'Initial Claims', rawValue: 235000, score: 42, weight: 0.17, missing: false },
    ],
    seededAt: new Date().toISOString(),
    unavailable: false,
  });
}

async function main() {
  const tasks = [
    ['sanctions:pressure:v1', buildSanctions(), 'Sanctions Pressure'],
    ['supply_chain:hormuz_tracker:v1', buildHormuz(), 'Hormuz Trade Tracker'],
    ['energy:fuel-shortages:v1', buildFuelShortages(), 'Fuel Shortages'],
    ['market:fear-greed:v1', buildFearGreed(), 'Fear & Greed'],
    ['economic:macro-signals:v1', buildMacroSignals(), 'Macro Signals (BTC Regime)'],
    ['economic:stress-index:v1', buildEconomicStress(), 'Macro Stress'],
  ];

  for (const [key, value, name] of tasks) {
    const wrapped = wrap(value);
    await redisSet(key, wrapped);
    await redisSet(`seed-meta:${key.replace(/:/g, '-')}`, JSON.stringify({ fetchedAt: Date.now(), recordCount: 1, state: 'OK' }));
    console.log(`✓ ${name} → ${key}`);
  }

  console.log(`\nDone — seeded ${tasks.length} panels`);
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
