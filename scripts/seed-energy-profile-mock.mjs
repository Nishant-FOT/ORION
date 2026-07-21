#!/usr/bin/env node
/**
 * Seed mock energy profile data for major countries.
 * Usage: node scripts/seed-energy-profile-mock.mjs
 */
import { loadEnvFile, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const { url, token } = getRedisCredentials();

const PROFILES = [
  { code: 'US', mixYear: 2024, coal: 16.2, gas: 43.1, oil: 1.0, nuclear: 18.2, renew: 21.5, wind: 10.2, solar: 5.6, hydro: 5.5, importShare: 0.15 },
  { code: 'CN', mixYear: 2024, coal: 58.4, gas: 8.5, oil: 1.8, nuclear: 5.2, renew: 26.1, wind: 10.1, solar: 6.8, hydro: 9.0, importShare: 0.22 },
  { code: 'JP', mixYear: 2024, coal: 28.5, gas: 32.1, oil: 5.2, nuclear: 8.3, renew: 25.9, wind: 1.2, solar: 11.8, hydro: 7.9, importShare: 0.88 },
  { code: 'DE', mixYear: 2024, coal: 24.1, gas: 18.2, oil: 0.5, nuclear: 0, renew: 56.2, wind: 27.5, solar: 14.8, hydro: 3.5, importShare: 0.68 },
  { code: 'GB', mixYear: 2024, coal: 0.5, gas: 37.2, oil: 0.3, nuclear: 14.8, renew: 47.2, wind: 29.5, solar: 5.2, hydro: 2.1, importShare: 0.42 },
  { code: 'IN', mixYear: 2024, coal: 72.1, gas: 4.2, oil: 0.5, nuclear: 3.1, renew: 20.1, wind: 5.5, solar: 6.8, hydro: 7.6, importShare: 0.18 },
  { code: 'BR', mixYear: 2024, coal: 3.2, gas: 11.5, oil: 2.1, nuclear: 1.2, renew: 82.0, wind: 13.5, solar: 5.8, hydro: 62.5, importShare: 0.08 },
  { code: 'FR', mixYear: 2024, coal: 0.8, gas: 7.2, oil: 0.9, nuclear: 64.2, renew: 26.9, wind: 10.2, solar: 5.5, hydro: 11.0, importShare: 0.12 },
  { code: 'KR', mixYear: 2024, coal: 32.1, gas: 29.5, oil: 1.2, nuclear: 27.5, renew: 9.7, wind: 0.8, solar: 5.2, hydro: 3.2, importShare: 0.82 },
  { code: 'AU', mixYear: 2024, coal: 48.2, gas: 20.1, oil: 1.5, nuclear: 0, renew: 30.2, wind: 12.5, solar: 14.2, hydro: 5.5, importShare: 0.05 },
  { code: 'CA', mixYear: 2024, coal: 4.2, gas: 14.5, oil: 1.0, nuclear: 12.8, renew: 67.5, wind: 8.5, solar: 3.2, hydro: 55.5, importShare: 0.18 },
  { code: 'RU', mixYear: 2024, coal: 16.2, gas: 48.5, oil: 1.8, nuclear: 20.2, renew: 13.3, wind: 0.5, solar: 0.8, hydro: 12.0, importShare: 0.02 },
  { code: 'SA', mixYear: 2024, coal: 0, gas: 62.1, oil: 28.5, nuclear: 0, renew: 9.4, wind: 0.2, solar: 4.5, hydro: 0.1, importShare: 0.05 },
  { code: 'AE', mixYear: 2024, coal: 0, gas: 88.2, oil: 5.1, nuclear: 0, renew: 6.7, wind: 0, solar: 4.2, hydro: 0, importShare: 0.32 },
  { code: 'IL', mixYear: 2024, coal: 0.5, gas: 42.1, oil: 2.2, nuclear: 0, renew: 15.2, wind: 0.8, solar: 12.5, hydro: 1.8, importShare: 0.72 },
  { code: 'TR', mixYear: 2024, coal: 31.2, gas: 28.5, oil: 1.2, nuclear: 4.5, renew: 34.6, wind: 11.2, solar: 6.8, hydro: 16.5, importShare: 0.52 },
  { code: 'ID', mixYear: 2024, coal: 62.5, gas: 18.2, oil: 2.1, nuclear: 0, renew: 17.2, wind: 0.5, solar: 2.8, hydro: 13.5, importShare: 0.15 },
  { code: 'MX', mixYear: 2024, coal: 5.2, gas: 58.5, oil: 3.5, nuclear: 1.5, renew: 31.3, wind: 8.2, solar: 5.5, hydro: 17.5, importShare: 0.28 },
  { code: 'ZA', mixYear: 2024, coal: 82.5, gas: 2.8, oil: 0.5, nuclear: 5.2, renew: 9.0, wind: 3.5, solar: 2.8, hydro: 2.5, importShare: 0.12 },
  { code: 'NG', mixYear: 2024, coal: 0, gas: 78.5, oil: 15.2, nuclear: 0, renew: 6.3, wind: 0, solar: 1.2, hydro: 5.0, importShare: 0.08 },
  { code: 'PL', mixYear: 2024, coal: 55.2, gas: 10.5, oil: 1.2, nuclear: 0, renew: 33.1, wind: 12.5, solar: 8.2, hydro: 2.5, importShare: 0.22 },
  { code: 'IT', mixYear: 2024, coal: 5.2, gas: 48.5, oil: 1.5, nuclear: 0, renew: 44.8, wind: 10.5, solar: 12.2, hydro: 18.5, importShare: 0.62 },
  { code: 'ES', mixYear: 2024, coal: 2.1, gas: 29.5, oil: 0.8, nuclear: 20.5, renew: 47.1, wind: 22.5, solar: 18.2, hydro: 5.8, importShare: 0.28 },
  { code: 'NL', mixYear: 2024, coal: 1.2, gas: 42.5, oil: 1.5, nuclear: 3.2, renew: 51.6, wind: 18.5, solar: 12.2, hydro: 0.5, importShare: 0.65 },
  { code: 'SE', mixYear: 2024, coal: 0.5, gas: 1.2, oil: 0.3, nuclear: 30.2, renew: 67.8, wind: 12.5, solar: 2.2, hydro: 45.5, importShare: 0.15 },
  { code: 'NO', mixYear: 2024, coal: 0, gas: 1.5, oil: 0.2, nuclear: 0, renew: 98.3, wind: 10.5, solar: 0.5, hydro: 87.2, importShare: 0.08 },
  { code: 'UA', mixYear: 2024, coal: 22.5, gas: 8.5, oil: 1.2, nuclear: 55.2, renew: 12.6, wind: 2.5, solar: 1.8, hydro: 8.2, importShare: 0.18 },
  { code: 'SG', mixYear: 2024, coal: 1.2, gas: 95.2, oil: 0.5, nuclear: 0, renew: 3.1, wind: 0, solar: 2.5, hydro: 0, importShare: 0.98 },
  { code: 'TH', mixYear: 2024, coal: 12.5, gas: 55.2, oil: 1.2, nuclear: 0, renew: 31.1, wind: 1.8, solar: 5.5, hydro: 23.8, importShare: 0.18 },
  { code: 'MY', mixYear: 2024, coal: 38.5, gas: 42.2, oil: 0.5, nuclear: 0, renew: 18.8, wind: 0.5, solar: 2.8, hydro: 15.5, importShare: 0.12 },
  { code: 'PK', mixYear: 2024, coal: 55.2, gas: 32.5, oil: 1.5, nuclear: 5.2, renew: 5.6, wind: 1.2, solar: 1.5, hydro: 2.8, importShare: 0.32 },
  { code: 'EG', mixYear: 2024, coal: 0.5, gas: 88.5, oil: 5.2, nuclear: 0, renew: 5.8, wind: 1.5, solar: 3.2, hydro: 1.0, importShare: 0.42 },
];

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
  console.log(`Seeding ${PROFILES.length} energy profiles...`);
  const cmds = PROFILES.map(p => {
    const data = JSON.stringify({
      mixAvailable: true, mixYear: p.mixYear, coalShare: p.coal, gasShare: p.gas,
      oilShare: p.oil, nuclearShare: p.nuclear, renewShare: p.renew,
      windShare: p.wind, solarShare: p.solar, hydroShare: p.hydro,
      importShare: p.importShare, gasStorageAvailable: false,
      electricityAvailable: false, jodiOilAvailable: false,
      jodiGasAvailable: false, ieaStocksAvailable: false,
    });
    return redisSet(`energy:spine:v1:${p.code}`, data, 86400 * 30);
  });
  await Promise.all(cmds);
  console.log(`Done — seeded ${PROFILES.length} energy profiles`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
