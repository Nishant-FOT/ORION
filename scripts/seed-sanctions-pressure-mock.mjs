#!/usr/bin/env node

/**
 * Seed realistic mock sanctions-pressure data for the panel.
 * Used when the real OFAC seed times out or is unavailable.
 *
 * Usage: node scripts/seed-sanctions-pressure-mock.mjs
 */

import { loadEnvFile, writeExtraKeyWithMeta } from './_seed-utils.mjs';

loadEnvFile(import.meta.url);

const CANONICAL_KEY = 'sanctions:pressure:v1';
const ENTITY_INDEX_KEY = 'sanctions:entities:v1';
const COUNTRY_COUNTS_KEY = 'sanctions:country-counts:v1';
const STATE_KEY = 'sanctions:pressure:state:v1';
const CACHE_TTL = 15 * 60 * 60; // 15h

const COUNTRIES = [
  { countryCode: 'IR', countryName: 'Iran', entryCount: 1847, newEntryCount: 12, vesselCount: 89, aircraftCount: 23 },
  { countryCode: 'RU', countryName: 'Russia', entryCount: 1203, newEntryCount: 28, vesselCount: 45, aircraftCount: 11 },
  { countryCode: 'KP', countryName: 'North Korea', entryCount: 692, newEntryCount: 5, vesselCount: 31, aircraftCount: 8 },
  { countryCode: 'SY', countryName: 'Syria', entryCount: 411, newEntryCount: 3, vesselCount: 12, aircraftCount: 4 },
  { countryCode: 'CU', countryName: 'Cuba', entryCount: 234, newEntryCount: 0, vesselCount: 8, aircraftCount: 2 },
  { countryCode: 'VE', countryName: 'Venezuela', entryCount: 189, newEntryCount: 7, vesselCount: 14, aircraftCount: 3 },
  { countryCode: 'CN', countryName: 'China', entryCount: 156, newEntryCount: 15, vesselCount: 6, aircraftCount: 1 },
  { countryCode: 'BY', countryName: 'Belarus', entryCount: 98, newEntryCount: 4, vesselCount: 3, aircraftCount: 0 },
  { countryCode: 'MM', countryName: 'Myanmar', entryCount: 87, newEntryCount: 2, vesselCount: 5, aircraftCount: 1 },
  { countryCode: 'SD', countryName: 'Sudan', entryCount: 64, newEntryCount: 1, vesselCount: 2, aircraftCount: 0 },
  { countryCode: 'SO', countryName: 'Somalia', entryCount: 42, newEntryCount: 0, vesselCount: 4, aircraftCount: 0 },
  { countryCode: 'LB', countryName: 'Lebanon', entryCount: 38, newEntryCount: 3, vesselCount: 1, aircraftCount: 0 },
];

const PROGRAMS = [
  { program: 'IRAN-TRADE-SDN', entryCount: 892, newEntryCount: 8 },
  { program: 'UKRAINE-EO13662', entryCount: 645, newEntryCount: 14 },
  { program: 'DPRK3', entryCount: 523, newEntryCount: 3 },
  { program: 'SYRIA', entryCount: 378, newEntryCount: 2 },
  { program: 'CUBA-TRADE', entryCount: 212, newEntryCount: 0 },
  { program: 'VENEZUELA-EO13850', entryCount: 167, newEntryCount: 5 },
  { program: 'CHINA-EO13959', entryCount: 134, newEntryCount: 12 },
  { program: 'BELARUS-EO13405', entryCount: 87, newEntryCount: 3 },
  { program: 'SDSR', entryCount: 56, newEntryCount: 1 },
  { program: 'LEBANON', entryCount: 34, newEntryCount: 2 },
];

const ENTRIES = [
  { id: 'SDN:10001', name: 'National Iranian Oil Company', entityType: 'entity', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-SDN'], effectiveAt: Date.now() - 86400000 * 5, isNew: true, note: 'State-owned petroleum entity' },
  { id: 'SDN:10002', name: 'Gazprom Neft', entityType: 'entity', countryCodes: ['RU'], countryNames: ['Russia'], programs: ['UKRAINE-EO13662'], effectiveAt: Date.now() - 86400000 * 3, isNew: true, note: 'Russian oil major' },
  { id: 'SDN:10003', name: 'Pacific Energy Navigation Corp', entityType: 'vessel', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-SDN'], effectiveAt: Date.now() - 86400000 * 10, isNew: true, note: 'Oil tanker fleet operator' },
  { id: 'SDN:10004', name: 'Korean People\'s Army Unit 820', entityType: 'entity', countryCodes: ['KP'], countryNames: ['North Korea'], programs: ['DPRK3'], effectiveAt: Date.now() - 86400000 * 15, isNew: false, note: 'Military procurement unit' },
  { id: 'SDN:10005', name: 'Rosneft Trading SA', entityType: 'entity', countryCodes: ['RU'], countryNames: ['Russia'], programs: ['UKRAINE-EO13662'], effectiveAt: Date.now() - 86400000 * 2, isNew: true, note: 'Rosneft trading arm' },
  { id: 'SDN:10006', name: 'Syrian Scientific Research Center', entityType: 'entity', countryCodes: ['SY'], countryNames: ['Syria'], programs: ['SYRIA'], effectiveAt: Date.now() - 86400000 * 20, isNew: false, note: 'WMD-related research' },
  { id: 'SDN:10007', name: 'Venezuela PDVSA', entityType: 'entity', countryCodes: ['VE'], countryNames: ['Venezuela'], programs: ['VENEZUELA-EO13850'], effectiveAt: Date.now() - 86400000 * 8, isNew: true, note: 'State oil company' },
  { id: 'SDN:10008', name: 'COSCO Shipping (Dalian)', entityType: 'vessel', countryCodes: ['CN'], countryNames: ['China'], programs: ['CHINA-EO13959'], effectiveAt: Date.now() - 86400000 * 1, isNew: true, note: 'Sanctioned shipping subsidiary' },
  { id: 'SDN:10009', name: 'Belaruskali', entityType: 'entity', countryCodes: ['BY'], countryNames: ['Belarus'], programs: ['BELARUS-EO13405'], effectiveAt: Date.now() - 86400000 * 12, isNew: false, note: 'Potash producer' },
  { id: 'SDN:10010', name: 'Myanmar Military procurement office', entityType: 'entity', countryCodes: ['MM'], countryNames: ['Myanmar'], programs: ['SDSR'], effectiveAt: Date.now() - 86400000 * 7, isNew: true, note: 'Armed forces procurement' },
  { id: 'SDN:10011', name: 'Mahan Air', entityType: 'aircraft', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-SDN'], effectiveAt: Date.now() - 86400000 * 30, isNew: false, note: 'IRGC-linked airline' },
  { id: 'SDN:10012', name: 'Iran Air', entityType: 'aircraft', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-SDN'], effectiveAt: Date.now() - 86400000 * 45, isNew: false, note: 'National carrier — restricted' },
  { id: 'SDN:10013', name: 'Seaborne Energy DMCC', entityType: 'vessel', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-SDN'], effectiveAt: Date.now() - 86400000 * 4, isNew: true, note: 'Shadow fleet operator' },
  { id: 'SDN:10014', name: 'Lendero Shipping Ltd', entityType: 'vessel', countryCodes: ['RU'], countryNames: ['Russia'], programs: ['UKRAINE-EO13662'], effectiveAt: Date.now() - 86400000 * 6, isNew: true, note: 'Sanctioned tanker fleet' },
  { id: 'SDN:10015', name: 'Cuba Petroleo (CUPET)', entityType: 'entity', countryCodes: ['CU'], countryNames: ['Cuba'], programs: ['CUBA-TRADE'], effectiveAt: Date.now() - 86400000 * 60, isNew: false, note: 'State oil company' },
  { id: 'SDN:10016', name: 'Sudan Mining Corp', entityType: 'entity', countryCodes: ['SD'], countryNames: ['Sudan'], programs: ['SDSR'], effectiveAt: Date.now() - 86400000 * 25, isNew: false, note: 'Gold mining sanctions evasion' },
  { id: 'SDN:10017', name: 'Hormuz Shipping Line', entityType: 'vessel', countryCodes: ['IR'], countryNames: ['Iran'], programs: ['IRAN-TRADE-SDN'], effectiveAt: Date.now() - 86400000 * 2, isNew: true, note: 'Tanker fleet — strait transit' },
  { id: 'SDN:10018', name: 'Al Qaed Al Islamiyah Trading', entityType: 'entity', countryCodes: ['LB'], countryNames: ['Lebanon'], programs: ['LEBANON'], effectiveAt: Date.now() - 86400000 * 9, isNew: true, note: 'Terrorist financing network' },
  { id: 'SDN:10019', name: 'Shandong Aviation Group', entityType: 'aircraft', countryCodes: ['CN'], countryNames: ['China'], programs: ['CHINA-EO13959'], effectiveAt: Date.now() - 86400000 * 14, isNew: false, note: 'Military-adjacent aviation' },
  { id: 'SDN:10020', name: 'Somali Gold Trading Co', entityType: 'entity', countryCodes: ['SO'], countryNames: ['Somalia'], programs: ['SDSR'], effectiveAt: Date.now() - 86400000 * 35, isNew: false, note: 'Conflict minerals' },
];

async function run() {
  console.log(`[sanctions-mock] seeding mock sanctions data...`);

  const now = Date.now();
  const totalCount = ENTRIES.length;
  const vesselCount = ENTRIES.filter(e => e.entityType === 'vessel').length;
  const aircraftCount = ENTRIES.filter(e => e.entityType === 'aircraft').length;
  const newEntryCount = ENTRIES.filter(e => e.isNew).length;

  const payload = {
    fetchedAt: String(now),
    datasetDate: String(now - 86400000 * 2),
    totalCount: 4962,
    sdnCount: 3284,
    consolidatedCount: 1678,
    newEntryCount: 80,
    vesselCount: 217,
    aircraftCount: 52,
    countries: COUNTRIES,
    programs: PROGRAMS,
    entries: ENTRIES,
  };

  const entityIndex = ENTRIES.map(e => ({
    id: e.id,
    name: e.name,
    et: e.entityType,
    cc: e.countryCodes.slice(0, 3),
    pr: e.programs.slice(0, 3),
  }));

  const countryCounts = {};
  for (const c of COUNTRIES) {
    countryCounts[c.countryCode] = c.entryCount;
  }

  const state = { entryIds: ENTRIES.map(e => e.id) };

  const writes = [
    { key: CANONICAL_KEY, data: payload, ttl: CACHE_TTL, recordCount: payload.totalCount },
    { key: ENTITY_INDEX_KEY, data: entityIndex, ttl: CACHE_TTL, recordCount: entityIndex.length },
    { key: COUNTRY_COUNTS_KEY, data: countryCounts, ttl: CACHE_TTL, recordCount: Object.keys(countryCounts).length },
    { key: STATE_KEY, data: state, ttl: CACHE_TTL, recordCount: state.entryIds.length },
  ];

  let failed = 0;
  for (const { key, data, ttl, recordCount } of writes) {
    try {
      await writeExtraKeyWithMeta(key, data, ttl, recordCount);
      console.log(`  wrote ${key} (${recordCount} records)`);
    } catch (err) {
      console.error(`  failed ${key}: ${err.message}`);
      failed++;
    }
  }

  console.log(`[sanctions-mock] done. ${writes.length - failed}/${writes.length} keys written.`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('[sanctions-mock] seed failed:', err);
  process.exit(1);
});
