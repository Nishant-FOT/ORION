#!/usr/bin/env node
/**
 * Seed Cross-Source Signals + Economic Calendar to Redis.
 * Usage: node scripts/seed-panels-missing2.mjs
 */
import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();
const TTL = 86400 * 7;

function wrap(data) {
  return JSON.stringify({ _seed: { fetchedAt: Date.now(), recordCount: 1, sourceVersion: 'mock-v1', schemaVersion: 1, state: 'OK' }, data });
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

// 1. Cross-Source Signals
function buildCrossSourceSignals() {
  const now = Date.now();
  const h = (hrs) => now - hrs * 3600_000;
  return {
    signals: [
      { id: 'sig-001', type: 'CROSS_SOURCE_SIGNAL_TYPE_COMPOSITE_ESCALATION', theater: 'Eastern Mediterranean', summary: 'Three co-firing signal categories detected: GPS jamming, military flight surge, and thermal anomaly near Israel-Lebanon border zone.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_CRITICAL', severityScore: 92.4, detectedAt: h(2), contributingTypes: ['CROSS_SOURCE_SIGNAL_TYPE_GPS_JAMMING', 'CROSS_SOURCE_SIGNAL_TYPE_MILITARY_FLIGHT_SURGE', 'CROSS_SOURCE_SIGNAL_TYPE_THERMAL_SPIKE'], signalCount: 3 },
      { id: 'sig-002', type: 'CROSS_SOURCE_SIGNAL_TYPE_VIX_SPIKE', theater: 'Global Markets', summary: 'VIX surged above 30 following geopolitical escalation fears. Correlated with commodity shock and equity selloff.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_HIGH', severityScore: 78.1, detectedAt: h(5), contributingTypes: [], signalCount: 0 },
      { id: 'sig-003', type: 'CROSS_SOURCE_SIGNAL_TYPE_SHIPPING_DISRUPTION', theater: 'Red Sea', summary: 'Container shipping through Bab el-Mandeb down 35% week-over-week following renewed attacks on commercial vessels.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_HIGH', severityScore: 74.5, detectedAt: h(8), contributingTypes: [], signalCount: 0 },
      { id: 'sig-004', type: 'CROSS_SOURCE_SIGNAL_TYPE_UNREST_SURGE', theater: 'West Africa', summary: 'Social media indicators show protest activity surge in Nigeria over fuel subsidies and cost of living.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_MEDIUM', severityScore: 58.2, detectedAt: h(12), contributingTypes: [], signalCount: 0 },
      { id: 'sig-005', type: 'CROSS_SOURCE_SIGNAL_TYPE_CYBER_ESCALATION', theater: 'Eastern Europe', summary: 'DDoS attacks against critical infrastructure in Baltic states increased 200% in last 24 hours.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_MEDIUM', severityScore: 62.8, detectedAt: h(14), contributingTypes: [], signalCount: 0 },
      { id: 'sig-006', type: 'CROSS_SOURCE_SIGNAL_TYPE_COMMODITY_SHOCK', theater: 'Global Energy', summary: 'Brent crude spiked above $92/bbl on Hormuz strait tension escalation and inventory draws.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_HIGH', severityScore: 71.3, detectedAt: h(3), contributingTypes: [], signalCount: 0 },
      { id: 'sig-007', type: 'CROSS_SOURCE_SIGNAL_TYPE_WEATHER_EXTREME', theater: 'South Asia', summary: 'Monsoon flooding in Bangladesh displaces 2.3M people. Agricultural supply chain impacts expected.', severity: 'CROSS_SOURCE_SIGNAL_SEVERITY_MEDIUM', severityScore: 55.0, detectedAt: h(18), contributingTypes: [], signalCount: 0 },
    ],
    evaluatedAt: now,
    compositeCount: 1,
  };
}

// 2. Economic Calendar
function buildEconomicCalendar() {
  return {
    events: [
      { event: 'Non-Farm Payrolls', country: 'US', date: '2026-07-03', impact: 'high', actual: '', estimate: '195K', previous: '175K', unit: '' },
      { event: 'Unemployment Rate', country: 'US', date: '2026-07-03', impact: 'high', actual: '', estimate: '4.0%', previous: '4.1%', unit: '' },
      { event: 'CPI (YoY)', country: 'US', date: '2026-07-11', impact: 'high', actual: '', estimate: '3.1%', previous: '3.3%', unit: '' },
      { event: 'CPI (MoM)', country: 'US', date: '2026-07-11', impact: 'high', actual: '', estimate: '0.2%', previous: '0.1%', unit: '' },
      { event: 'Fed Interest Rate Decision', country: 'US', date: '2026-07-30', impact: 'high', actual: '', estimate: '4.50%', previous: '4.50%', unit: '' },
      { event: 'GDP (QoQ)', country: 'US', date: '2026-07-30', impact: 'high', actual: '', estimate: '2.1%', previous: '1.6%', unit: '' },
      { event: 'ISM Manufacturing PMI', country: 'US', date: '2026-07-01', impact: 'medium', actual: '50.3', estimate: '50.0', previous: '49.2', unit: '' },
      { event: 'Consumer Confidence', country: 'US', date: '2026-07-29', impact: 'medium', actual: '', estimate: '104.0', previous: '100.4', unit: '' },
      { event: 'Initial Jobless Claims', country: 'US', date: '2026-07-03', impact: 'medium', actual: '', estimate: '235K', previous: '236K', unit: '' },
      { event: 'Retail Sales (MoM)', country: 'US', date: '2026-07-16', impact: 'medium', actual: '', estimate: '0.3%', previous: '0.1%', unit: '' },
      { event: 'ECB Interest Rate Decision', country: 'EU', date: '2026-07-17', impact: 'high', actual: '', estimate: '2.75%', previous: '2.75%', unit: '' },
      { event: 'CPI (YoY)', country: 'EU', date: '2026-07-01', impact: 'high', actual: '', estimate: '2.5%', previous: '2.6%', unit: '' },
      { event: 'GDP (QoQ)', country: 'EU', date: '2026-07-16', impact: 'high', actual: '', estimate: '0.3%', previous: '0.3%', unit: '' },
      { event: 'Unemployment Rate', country: 'EU', date: '2026-07-02', impact: 'medium', actual: '', estimate: '6.4%', previous: '6.5%', unit: '' },
      { event: 'Trade Balance', country: 'DE', date: '2026-07-08', impact: 'medium', actual: '', estimate: '€15.2B', previous: '€13.8B', unit: '' },
      { event: 'GDP (QoQ)', country: 'GB', date: '2026-07-10', impact: 'high', actual: '', estimate: '0.5%', previous: '0.7%', unit: '' },
      { event: 'CPI (YoY)', country: 'GB', date: '2026-07-16', impact: 'high', actual: '', estimate: '3.5%', previous: '3.6%', unit: '' },
      { event: 'Unemployment Rate', country: 'JP', date: '2026-07-04', impact: 'medium', actual: '', estimate: '2.6%', previous: '2.6%', unit: '' },
      { event: 'GDP (QoQ)', country: 'JP', date: '2026-07-17', impact: 'high', actual: '', estimate: '0.5%', previous: '0.6%', unit: '' },
      { event: 'CPI (YoY)', country: 'CN', date: '2026-07-09', impact: 'medium', actual: '', estimate: '0.4%', previous: '0.3%', unit: '' },
      { event: 'GDP (QoQ)', country: 'CN', date: '2026-07-15', impact: 'high', actual: '', estimate: '5.1%', previous: '5.4%', unit: '' },
      { event: 'Trade Balance', country: 'CN', date: '2026-07-12', impact: 'medium', actual: '', estimate: '$78B', previous: '$82B', unit: '' },
      { event: 'Interest Rate Decision', country: 'AU', date: '2026-07-08', impact: 'high', actual: '', estimate: '4.10%', previous: '4.10%', unit: '' },
      { event: 'Employment Change', country: 'CA', date: '2026-07-11', impact: 'medium', actual: '', estimate: '20K', previous: '25K', unit: '' },
      { event: 'Interest Rate Decision', country: 'CA', date: '2026-07-16', impact: 'high', actual: '', estimate: '2.75%', previous: '2.75%', unit: '' },
    ],
    fromDate: '2026-06-30',
    toDate: '2026-07-31',
    total: 25,
    unavailable: false,
  };
}

async function main() {
  const tasks = [
    ['intelligence:cross-source-signals:v1', buildCrossSourceSignals(), 'Cross-Source Signals'],
    ['economic:econ-calendar:v1', buildEconomicCalendar(), 'Economic Calendar'],
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
