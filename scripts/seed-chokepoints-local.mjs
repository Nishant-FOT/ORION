#!/usr/bin/env node

import { loadEnvFile, runSeed } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const CANONICAL_KEY = 'supply_chain:chokepoints:v4';

/**
 * Static chokepoint data for local seeding when the production API
 * (api.orion.app) is unreachable. Matches the exact response shape
 * returned by server/orion/supply-chain/v1/get-chokepoint-status.ts.
 *
 * Disruption scores are derived from threat level alone:
 *   war_zone  → 70, critical → 40, high → 30, elevated → 15, normal → 0
 * Status follows the scoring thresholds: <20 green, <50 yellow, else red.
 */

function scoreFromThreat(tl) {
  const map = { war_zone: 70, critical: 40, high: 30, elevated: 15, normal: 0 };
  return map[tl] ?? 0;
}

function statusFromScore(s) {
  if (s < 20) return 'green';
  if (s < 50) return 'yellow';
  return 'red';
}

function tierFromThreat(tl) {
  const map = {
    war_zone: 'WAR_RISK_TIER_WAR_ZONE',
    critical: 'WAR_RISK_TIER_CRITICAL',
    high: 'WAR_RISK_TIER_HIGH',
    elevated: 'WAR_RISK_TIER_ELEVATED',
    normal: 'WAR_RISK_TIER_NORMAL',
  };
  return map[tl] ?? 'WAR_RISK_TIER_NORMAL';
}

const CHOKEPOINTS_RAW = [
  {
    id: 'hormuz_strait', name: 'Strait of Hormuz', lat: 26.56, lon: 56.25,
    threatLevel: 'war_zone',
    threatDescription: 'Active conflict — Iran-Israel war; Iranian naval blockade risk and mines reported in Persian Gulf',
    routes: ['Gulf Oil Exports', 'Qatar LNG', 'Iran Exports'],
    directions: ['eastbound', 'westbound'],
  },
  {
    id: 'suez', name: 'Suez Canal', lat: 30.45, lon: 32.35,
    threatLevel: 'high',
    threatDescription: 'JWC Listed Area — adjacent to active Red Sea conflict and Iran-Israel war spillover',
    routes: ['China-Europe (Suez)', 'Gulf-Europe Oil', 'Qatar LNG-Europe'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'malacca_strait', name: 'Strait of Malacca', lat: 2.5, lon: 101.5,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['China-Middle East Oil', 'China-Europe (via Suez)', 'Japan-Middle East Oil'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'bab_el_mandeb', name: 'Bab el-Mandeb', lat: 12.58, lon: 43.33,
    threatLevel: 'critical',
    threatDescription: 'JWC Listed Area — active Houthi attacks on commercial shipping',
    routes: ['Suez-Indian Ocean', 'Gulf-Europe Oil', 'Red Sea Transit'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'panama', name: 'Panama Canal', lat: 9.08, lon: -79.68,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['US East Coast-Asia', 'US East Coast-South America', 'Atlantic-Pacific Bulk'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'taiwan_strait', name: 'Taiwan Strait', lat: 24.0, lon: 119.5,
    threatLevel: 'elevated',
    threatDescription: 'Cross-strait military tensions and PLA exercises',
    routes: ['China-Japan Trade', 'Korea-Southeast Asia', 'Pacific Semiconductor'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'cape_of_good_hope', name: 'Cape of Good Hope', lat: -34.36, lon: 18.49,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['Asia-Europe (Cape Route)', 'Gulf-Americas Oil', 'Suez Bypass'],
    directions: ['eastbound', 'westbound'],
  },
  {
    id: 'gibraltar', name: 'Strait of Gibraltar', lat: 35.96, lon: -5.35,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['Atlantic-Mediterranean', 'Gulf-Europe Oil (final leg)', 'India-Europe'],
    directions: ['eastbound', 'westbound'],
  },
  {
    id: 'bosphorus', name: 'Bosporus Strait', lat: 41.12, lon: 29.05,
    threatLevel: 'elevated',
    threatDescription: 'Montreux Convention restrictions; elevated due to Russia-Ukraine war and periodic Turkish traffic controls',
    routes: ['Russia Black Sea Exports', 'Ukraine Grain', 'Caspian Oil Transit', 'Aegean-Marmara Transit'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'korea_strait', name: 'Korea Strait', lat: 34.0, lon: 129.0,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['Japan-Korea Trade', 'China-Japan (alternate)', 'Pacific-East Asia'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'dover_strait', name: 'Dover Strait', lat: 51.05, lon: 1.45,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['North Sea-Atlantic', 'Europe Intra-Trade', 'UK-Continental Europe'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'kerch_strait', name: 'Kerch Strait', lat: 45.33, lon: 36.60,
    threatLevel: 'war_zone',
    threatDescription: 'Active conflict zone; Russia controls Kerch Bridge; Ukraine grain exports via Azov severely restricted',
    routes: ['Ukraine Grain (Azov)', 'Russia Azov Ports', 'Crimea Supply'],
    directions: ['northbound', 'southbound'],
  },
  {
    id: 'lombok_strait', name: 'Lombok Strait', lat: -8.47, lon: 115.72,
    threatLevel: 'normal',
    threatDescription: '',
    routes: ['Malacca Bypass (VLCCs)', 'Australia-Asia', 'Indian Ocean-Pacific'],
    directions: ['northbound', 'southbound'],
  },
];

function buildTransitSummary(id) {
  const baselines = {
    hormuz_strait:       { todayTotal: 82, todayTanker: 41, todayCargo: 22, todayOther: 19 },
    suez:                { todayTotal: 58, todayTanker: 18, todayCargo: 28, todayOther: 12 },
    malacca_strait:      { todayTotal: 145, todayTanker: 32, todayCargo: 78, todayOther: 35 },
    bab_el_mandeb:       { todayTotal: 64, todayTanker: 24, todayCargo: 26, todayOther: 14 },
    panama:              { todayTotal: 36, todayTanker: 4, todayCargo: 22, todayOther: 10 },
    taiwan_strait:       { todayTotal: 120, todayTanker: 15, todayCargo: 65, todayOther: 40 },
    cape_of_good_hope:   { todayTotal: 70, todayTanker: 28, todayCargo: 30, todayOther: 12 },
    gibraltar:           { todayTotal: 95, todayTanker: 35, todayCargo: 40, todayOther: 20 },
    bosphorus:           { todayTotal: 42, todayTanker: 12, todayCargo: 20, todayOther: 10 },
    korea_strait:        { todayTotal: 88, todayTanker: 10, todayCargo: 55, todayOther: 23 },
    dover_strait:        { todayTotal: 110, todayTanker: 18, todayCargo: 55, todayOther: 37 },
    kerch_strait:        { todayTotal: 8, todayTanker: 2, todayCargo: 4, todayOther: 2 },
    lombok_strait:       { todayTotal: 30, todayTanker: 14, todayCargo: 10, todayOther: 6 },
  };
  const b = baselines[id] ?? { todayTotal: 30, todayTanker: 10, todayCargo: 12, todayOther: 8 };
  return {
    todayTotal: b.todayTotal,
    todayTanker: b.todayTanker,
    todayCargo: b.todayCargo,
    todayOther: b.todayOther,
    wowChangePct: 0,
    history: [],
    riskLevel: '',
    incidentCount7d: 0,
    disruptionPct: 0,
    riskSummary: '',
    riskReportAction: '',
    dataAvailable: true,
  };
}

function buildPayload() {
  const chokepoints = CHOKEPOINTS_RAW.map((cp) => {
    const disruptionScore = scoreFromThreat(cp.threatLevel);
    const description = cp.threatDescription || 'No active disruptions';
    return {
      id: cp.id,
      name: cp.name,
      lat: cp.lat,
      lon: cp.lon,
      disruptionScore,
      status: statusFromScore(disruptionScore),
      activeWarnings: 0,
      aisDisruptions: 0,
      congestionLevel: 'normal',
      affectedRoutes: cp.routes,
      description,
      directions: cp.directions,
      directionalDwt: [],
      transitSummary: buildTransitSummary(cp.id),
      flowEstimate: undefined,
      warRiskTier: tierFromThreat(cp.threatLevel),
    };
  });

  return {
    chokepoints,
    fetchedAt: new Date().toISOString(),
    upstreamUnavailable: false,
  };
}

function validateFn(data) {
  return Array.isArray(data?.chokepoints) && data.chokepoints.length === 13;
}

const isMain = process.argv[1]?.endsWith('seed-chokepoints-local.mjs');

if (isMain) {
  runSeed('supply_chain', 'chokepoints', CANONICAL_KEY, buildPayload, {
    validateFn,
    ttlSeconds: 7200,
    sourceVersion: 'local-static-v1',
    declareRecords: (data) => Array.isArray(data?.chokepoints) ? data.chokepoints.length : 0,
    schemaVersion: 1,
    maxStaleMin: 60,
    recordCount: (data) => data?.chokepoints?.length || 0,
  }).catch((err) => {
    const cause = err.cause ? ` (cause: ${err.cause.message || err.cause.code || err.cause})` : '';
    console.error('FATAL:', (err.message || err) + cause);
    process.exit(1);
  });
}
