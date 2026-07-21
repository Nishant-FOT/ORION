/**
 * Renewable energy data service -- displays renewable electricity share
 * from Our World in Data (OWID) for global + regional breakdown.
 *
 * Data is pre-seeded by seed-renewable-energy.mjs and read from
 * bootstrap/Redis. Falls back to live OWID CSV fetch when cache is empty.
 *
 * EIA installed capacity (solar, wind, coal) uses the RPC endpoint
 * or Redis-seeded EIA capacity data.
 */

import { fetchEnergyCapacityRpc } from '@/services/economic';
import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import { toApiUrl } from '@/services/runtime';
import { externalApiUrl } from '@/services/live-data-service';

// ---- Types ----

export interface RegionRenewableData {
  code: string;       // World Bank region code (e.g., "1W", "EAS")
  name: string;       // Human-readable name (e.g., "World", "East Asia & Pacific")
  percentage: number;  // Latest renewable electricity % value
  year: number;       // Year of latest data point
}

export interface RenewableEnergyData {
  globalPercentage: number;          // Latest global renewable electricity %
  globalYear: number;                // Year of latest global data
  historicalData: Array<{ year: number; value: number }>;  // Global time-series
  regions: RegionRenewableData[];    // Regional breakdown
}

// ---- Default / Empty ----

// Static fallback when seed data is unavailable and no cache exists.
// Source: Our World in Data (OWID) energy-data.csv — last verified Jun 2026
const FALLBACK_DATA: RenewableEnergyData = {
  globalPercentage: 33.8,
  globalYear: 2025,
  historicalData: [
    { year: 1990, value: 19.3 }, { year: 1995, value: 19.0 }, { year: 2000, value: 18.4 },
    { year: 2005, value: 17.7 }, { year: 2010, value: 20.3 }, { year: 2012, value: 21.7 },
    { year: 2014, value: 22.7 }, { year: 2016, value: 24.2 }, { year: 2018, value: 25.6 },
    { year: 2020, value: 28.0 }, { year: 2021, value: 28.1 }, { year: 2022, value: 29.5 },
    { year: 2023, value: 30.3 }, { year: 2024, value: 31.9 }, { year: 2025, value: 33.8 },
  ],
  regions: [
    { code: 'LCN', name: 'Latin America & Caribbean', percentage: 76.8, year: 2024 },
    { code: 'ECS', name: 'Europe & Central Asia', percentage: 41.6, year: 2025 },
    { code: 'OCN', name: 'Oceania', percentage: 41.4, year: 2024 },
    { code: 'NAC', name: 'North America', percentage: 28.8, year: 2024 },
    { code: 'EAS', name: 'East Asia & Pacific', percentage: 27.3, year: 2024 },
    { code: 'SSF', name: 'Sub-Saharan Africa', percentage: 24.7, year: 2024 },
  ],
};

// ---- Circuit Breaker (persistent cache for instant reload) ----

const renewableBreaker = createCircuitBreaker<RenewableEnergyData>({
  name: 'Renewable Energy',
  cacheTtlMs: 60 * 60 * 1000, // 1h — World Bank data changes yearly
  persistCache: false,
});

const capacityBreaker = createCircuitBreaker<CapacitySeries[]>({
  name: 'Energy Capacity',
  cacheTtlMs: 60 * 60 * 1000,
  persistCache: true,
});

// ---- Data Fetching (from seed via bootstrap) ----

async function fetchOwidDataFresh(): Promise<RenewableEnergyData | null> {
  try {
    const resp = await fetch(externalApiUrl('https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv', '/api/github-raw'), {
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) return null;
    const csv = await resp.text();
    const lines = csv.split('\n');
    const header = lines[0]?.split(',') ?? [];
    const colCountry = header.indexOf('country');
    const colYear = header.indexOf('year');
    const colRenewElec = header.indexOf('renewables_share_elec');

    const rows: Array<{ country: string; year: number; value: number }> = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]?.split(',') ?? [];
      const country = colCountry >= 0 ? cols[colCountry] : undefined;
      const year = colYear >= 0 ? parseInt(cols[colYear] ?? '') : NaN;
      const value = colRenewElec >= 0 ? parseFloat(cols[colRenewElec] ?? '') : NaN;
      if (!country || isNaN(year) || isNaN(value)) continue;
      rows.push({ country, year, value });
    }

    const worldRows = rows.filter(r => r.country === 'World' && r.year >= 1990).sort((a, b) => a.year - b.year);
    if (worldRows.length === 0) return null;
    const latest = worldRows[worldRows.length - 1]!;

    const regionMap: Record<string, { code: string; name: string }> = {
      'Africa': { code: 'SSF', name: 'Sub-Saharan Africa' },
      'Asia': { code: 'EAS', name: 'East Asia & Pacific' },
      'Europe': { code: 'ECS', name: 'Europe & Central Asia' },
      'North America': { code: 'NAC', name: 'North America' },
      'South America': { code: 'LCN', name: 'Latin America & Caribbean' },
      'Oceania': { code: 'OCN', name: 'Oceania' },
    };
    const regions: RegionRenewableData[] = [];
    for (const [name, info] of Object.entries(regionMap)) {
      const rr = rows.filter(r => r.country === name && !isNaN(r.value)).sort((a, b) => b.year - a.year);
      if (rr.length > 0) {
        const first = rr[0]!;
        regions.push({ code: info.code, name: info.name, percentage: Math.round(first.value * 10) / 10, year: first.year });
      }
    }
    regions.sort((a, b) => b.percentage - a.percentage);

    return {
      globalPercentage: Math.round(latest.value * 1000) / 1000,
      globalYear: latest.year,
      historicalData: worldRows.map(r => ({ year: r.year, value: Math.round(r.value * 10) / 10 })),
      regions,
    };
  } catch { return null; }
}

async function fetchRenewableEnergyDataFresh(): Promise<RenewableEnergyData> {
  // 1. Try bootstrap hydration cache (first page load)
  const hydrated = getHydratedData('renewableEnergy') as RenewableEnergyData | undefined;
  if (hydrated?.historicalData?.length && hydrated.globalYear >= 2024) return hydrated;

  // 2. Fallback: fetch from bootstrap endpoint directly
  try {
    const resp = await fetch(toApiUrl('/api/bootstrap?keys=renewableEnergy'), {
      signal: AbortSignal.timeout(5_000),
    });
    if (resp.ok) {
      const { data } = (await resp.json()) as { data: { renewableEnergy?: RenewableEnergyData } };
      if (data.renewableEnergy?.historicalData?.length && data.renewableEnergy.globalYear >= 2024) return data.renewableEnergy;
    }
  } catch { /* fall through */ }

  // 3. Live OWID fetch (when bootstrap is empty or stale)
  const owid = await fetchOwidDataFresh();
  if (owid) return owid;

  // 4. Static fallback (always current — 2025 data)
  return FALLBACK_DATA;
}

/**
 * Fetch renewable energy data with persistent caching.
 * Returns instantly from IndexedDB cache on subsequent loads.
 */
export async function fetchRenewableEnergyData(): Promise<RenewableEnergyData> {
  return renewableBreaker.execute(() => fetchRenewableEnergyDataFresh(), FALLBACK_DATA);
}

// ========================================================================
// EIA Installed Capacity (solar, wind, coal)
// ========================================================================

export interface CapacityDataPoint {
  year: number;
  capacityMw: number;
}

export interface CapacitySeries {
  source: string;   // 'SUN', 'WND', 'COL'
  name: string;     // 'Solar', 'Wind', 'Coal'
  data: CapacityDataPoint[];
}

/**
 * Fetch installed generation capacity for solar, wind, and coal from EIA.
 * Returns typed CapacitySeries[] ready for panel rendering.
 * Gracefully degrades: on failure returns empty array.
 */
export async function fetchEnergyCapacity(): Promise<CapacitySeries[]> {
  return capacityBreaker.execute(async () => {
    const resp = await fetchEnergyCapacityRpc(['SUN', 'WND', 'COL'], 25);
    return resp.series.map(s => ({
      source: s.energySource,
      name: s.name,
      data: s.data.map(d => ({ year: d.year, capacityMw: d.capacityMw })),
    }));
  }, []);
}
