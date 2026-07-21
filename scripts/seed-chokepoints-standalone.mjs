#!/usr/bin/env node

/**
 * Standalone chokepoints seeder — calls the Vercel RPC endpoint to populate
 * supply_chain:chokepoints:v4 in Redis. Mirrors the relay's warm-ping in
 * ais-relay.cjs (line 4538).
 *
 * Usage: node scripts/seed-chokepoints-standalone.mjs
 */

import { loadEnvFile, CHROME_UA, getRedisCredentials } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const RELAY_API_KEY = process.env.ORION_RELAY_KEY || '';
const RPC_URL = 'https://api.orion.app/api/supply-chain/v1/get-chokepoint-status';
const CANONICAL_KEY = 'supply_chain:chokepoints:v4';
const META_KEY = 'seed-meta:supply_chain:chokepoints';

function warmPingHeaders() {
  const h = {
    'Content-Type': 'application/json',
    'User-Agent': CHROME_UA,
    Origin: 'https://orion.app',
  };
  if (RELAY_API_KEY) h['X-ORION-Key'] = RELAY_API_KEY;
  return h;
}

async function main() {
  console.log('=== Chokepoints Standalone Seed ===');
  console.log(`  RPC: ${RPC_URL}`);

  const resp = await fetch(RPC_URL, {
    method: 'POST',
    headers: warmPingHeaders(),
    body: '{}',
    signal: AbortSignal.timeout(60_000),
  });

  if (!resp.ok) {
    const keyNote = RELAY_API_KEY ? '' : ' (ORION_RELAY_KEY not set)';
    console.error(`  FAILED: HTTP ${resp.status}${keyNote}`);
    process.exit(1);
  }

  const data = await resp.json();
  const count = data?.chokepoints?.length || 0;
  console.log(`  RPC OK: ${count} chokepoints`);

  // Write seed-meta so health reports fresh data
  if (count > 0) {
    const { url, token } = getRedisCredentials();
    const meta = { fetchedAt: Date.now(), recordCount: count };
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', META_KEY, JSON.stringify(meta), 'EX', 604800]),
      signal: AbortSignal.timeout(5_000),
    }).catch(() => {});
    console.log(`  seed-meta written (${count} records)`);
  }

  // Verify the canonical key exists
  const { url, token } = getRedisCredentials();
  const verifyResp = await fetch(`${url}/get/${encodeURIComponent(CANONICAL_KEY)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5_000),
  });
  const verifyData = await verifyResp.json();
  if (verifyData.result) {
    console.log(`  Verified: ${CANONICAL_KEY} present in Redis`);
  } else {
    console.warn(`  WARNING: ${CANONICAL_KEY} not found after RPC call`);
  }

  console.log('\n=== Done ===');
}

main().catch((err) => {
  console.error('FATAL:', err.message || err);
  process.exit(1);
});
