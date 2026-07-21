#!/usr/bin/env node
/**
 * Seed mock resilience ranking data to Redis for local dev.
 * Usage: node scripts/seed-resilience-ranking-mock.mjs
 */
import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();

const RANKING_KEY = 'resilience:ranking:v25';
const META_KEY = 'seed-meta:resilience:ranking';

const COUNTRIES = [
  { code: 'US', score: 78, level: 'high', coverage: 0.92 },
  { code: 'CN', score: 65, level: 'moderate', coverage: 0.88 },
  { code: 'JP', score: 72, level: 'high', coverage: 0.91 },
  { code: 'DE', score: 75, level: 'high', coverage: 0.90 },
  { code: 'GB', score: 74, level: 'high', coverage: 0.89 },
  { code: 'IN', score: 52, level: 'moderate', coverage: 0.85 },
  { code: 'BR', score: 48, level: 'moderate', coverage: 0.83 },
  { code: 'FR', score: 73, level: 'high', coverage: 0.90 },
  { code: 'KR', score: 70, level: 'high', coverage: 0.88 },
  { code: 'AU', score: 76, level: 'high', coverage: 0.91 },
  { code: 'CA', score: 77, level: 'high', coverage: 0.90 },
  { code: 'RU', score: 42, level: 'low', coverage: 0.80 },
  { code: 'SA', score: 55, level: 'moderate', coverage: 0.82 },
  { code: 'AE', score: 62, level: 'moderate', coverage: 0.84 },
  { code: 'IL', score: 68, level: 'moderate', coverage: 0.87 },
  { code: 'TR', score: 50, level: 'moderate', coverage: 0.83 },
  { code: 'ID', score: 53, level: 'moderate', coverage: 0.82 },
  { code: 'MX', score: 47, level: 'moderate', coverage: 0.81 },
  { code: 'ZA', score: 38, level: 'low', coverage: 0.79 },
  { code: 'NG', score: 32, level: 'low', coverage: 0.75 },
  { code: 'PK', score: 35, level: 'low', coverage: 0.76 },
  { code: 'EG', score: 40, level: 'low', coverage: 0.78 },
  { code: 'PL', score: 66, level: 'moderate', coverage: 0.87 },
  { code: 'IT', score: 60, level: 'moderate', coverage: 0.86 },
  { code: 'ES', score: 64, level: 'moderate', coverage: 0.86 },
  { code: 'NL', score: 71, level: 'high', coverage: 0.89 },
  { code: 'SE', score: 79, level: 'high', coverage: 0.92 },
  { code: 'CH', score: 80, level: 'very_high', coverage: 0.93 },
  { code: 'SG', score: 74, level: 'high', coverage: 0.90 },
  { code: 'NO', score: 81, level: 'very_high', coverage: 0.93 },
  { code: 'FI', score: 77, level: 'high', coverage: 0.91 },
  { code: 'DK', score: 78, level: 'high', coverage: 0.92 },
  { code: 'IE', score: 72, level: 'high', coverage: 0.89 },
  { code: 'NZ', score: 75, level: 'high', coverage: 0.90 },
  { code: 'AR', score: 36, level: 'low', coverage: 0.77 },
  { code: 'CO', score: 44, level: 'moderate', coverage: 0.80 },
  { code: 'CL', score: 58, level: 'moderate', coverage: 0.84 },
  { code: 'PE', score: 45, level: 'moderate', coverage: 0.79 },
  { code: 'TH', score: 56, level: 'moderate', coverage: 0.83 },
  { code: 'VN', score: 51, level: 'moderate', coverage: 0.81 },
  { code: 'PH', score: 43, level: 'moderate', coverage: 0.79 },
  { code: 'MY', score: 61, level: 'moderate', coverage: 0.85 },
  { code: 'BD', score: 33, level: 'low', coverage: 0.74 },
  { code: 'KE', score: 37, level: 'low', coverage: 0.76 },
  { code: 'ET', score: 30, level: 'very_low', coverage: 0.72 },
  { code: 'GH', score: 41, level: 'moderate', coverage: 0.78 },
  { code: 'UA', score: 28, level: 'very_low', coverage: 0.70 },
  { code: 'IQ', score: 34, level: 'low', coverage: 0.75 },
  { code: 'IR', score: 31, level: 'low', coverage: 0.73 },
  { code: 'SY', score: 20, level: 'very_low', coverage: 0.65 },
  { code: 'VE', score: 25, level: 'very_low', coverage: 0.68 },
  { code: 'MM', score: 22, level: 'very_low', coverage: 0.66 },
  { code: 'YE', score: 18, level: 'very_low', coverage: 0.60 },
  { code: 'AF', score: 15, level: 'very_low', coverage: 0.55 },
  { code: 'CU', score: 39, level: 'low', coverage: 0.77 },
  { code: 'CZ', score: 67, level: 'moderate', coverage: 0.87 },
  { code: 'AT', score: 73, level: 'high', coverage: 0.90 },
  { code: 'BE', score: 69, level: 'moderate', coverage: 0.88 },
  { code: 'PT', score: 63, level: 'moderate', coverage: 0.85 },
  { code: 'GR', score: 54, level: 'moderate', coverage: 0.83 },
  { code: 'RO', score: 57, level: 'moderate', coverage: 0.84 },
];

const items = COUNTRIES.map((c) => ({
  countryCode: c.code,
  overallScore: c.score,
  level: c.level,
  lowConfidence: c.coverage < 0.80,
  overallCoverage: c.coverage,
  rankStable: true,
  headlineEligible: c.score >= 30,
}));

const ranking = {
  items,
  greyedOut: [],
  fetchedAt: new Date().toISOString(),
  scored: items.length,
  total: items.length,
  coverage: items.reduce((s, c) => s + c.overallCoverage, 0) / items.length,
  partial: false,
  _formula: 'd6',
  _intervalMethodology: 'weight-perturbation-sensitivity-v3',
};

async function redisSet(key, value, ex) {
  const args = ['SET', key, value];
  if (ex) args.push('EX', String(ex));
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!resp.ok) throw new Error(`SET ${key} failed: HTTP ${resp.status}`);
}

async function main() {
  console.log(`Seeding ${items.length} resilience ranking entries...`);

  await redisSet(RANKING_KEY, JSON.stringify(ranking), 86400);
  await redisSet(META_KEY, JSON.stringify({
    key: RANKING_KEY,
    seededAt: new Date().toISOString(),
    recordCount: items.length,
  }), 86400 * 7);

  console.log(`Done — seeded ${items.length} countries to ${RANKING_KEY}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
