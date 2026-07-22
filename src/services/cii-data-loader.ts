import {
  ingestConflictsForCII,
  ingestProtestsForCII,
  ingestMilitaryForCII,
  ingestNewsForCII,
  ingestOutagesForCII,
  ingestGpsJammingForCII,
  ingestAisDisruptionsForCII,
  ingestEarthquakesForCII,
  ingestSanctionsForCII,
  ingestOrefForCII,
  ingestAviationForCII,
  ingestAdvisoriesForCII,
  ingestSatelliteFiresForCII,
  ingestTemporalAnomaliesForCII,
  ingestStrikesForCII,
  ingestDisplacementForCII,
  ingestClimateForCII,
  ingestUcdpForCII,
  ingestHapiForCII,
  calculateCII,
  startLearning,
  type CountryScore,
} from '@/services/country-instability';

let lastLoadTime = 0;
const LOAD_INTERVAL_MS = 5 * 60 * 1000;
let cachedScores: CountryScore[] | null = null;
let loading = false;
let loadPromise: Promise<CountryScore[]> | null = null;

export async function loadAllCIIData(force = false): Promise<CountryScore[]> {
  const now = Date.now();
  if (!force && cachedScores && now - lastLoadTime < LOAD_INTERVAL_MS) {
    return cachedScores;
  }
  if (loading && loadPromise) return loadPromise;

  loading = true;
  loadPromise = doLoad();
  try {
    const scores = await loadPromise;
    cachedScores = scores;
    lastLoadTime = Date.now();
    return scores;
  } finally {
    loading = false;
    loadPromise = null;
  }
}

export function getCachedCIIScores(): CountryScore[] | null {
  return cachedScores;
}

async function doLoad(): Promise<CountryScore[]> {
  startLearning();

  const results = await Promise.allSettled([
    loadConflicts(),
    loadProtests(),
    loadMilitary(),
    loadNews(),
    loadOutages(),
    loadGpsJamming(),
    loadAisDisruptions(),
    loadEarthquakes(),
    loadSanctions(),
    loadOref(),
    loadAviation(),
    loadAdvisories(),
    loadSatelliteFires(),
    loadTemporalAnomalies(),
    loadStrikes(),
    loadDisplacement(),
    loadClimate(),
    loadUcdp(),
    loadHapi(),
  ]);

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`[CII] ${failures.length}/20 data sources failed to load`);
  }

  return calculateCII();
}

async function loadConflicts(): Promise<void> {
  const { fetchConflictEvents } = await import('@/services/conflict');
  const result = await fetchConflictEvents();
  if (result?.events) ingestConflictsForCII(result.events);
}

async function loadProtests(): Promise<void> {
  const { fetchSocialVelocity } = await import('@/services/social-velocity');
  const result = await fetchSocialVelocity();
  const events = Array.isArray(result) ? result : [];
  ingestProtestsForCII(events as any);
}

async function loadMilitary(): Promise<void> {
  const [flightsMod, vesselsMod] = await Promise.all([
    import('@/services/military-flights'),
    import('@/services/military-vessels'),
  ]);
  const [flightsResult, vesselsResult] = await Promise.allSettled([
    flightsMod.fetchMilitaryFlights(),
    vesselsMod.fetchMilitaryVessels(),
  ]);
  const flights = flightsResult.status === 'fulfilled' ? (flightsResult.value?.flights ?? []) : [];
  const vessels = vesselsResult.status === 'fulfilled' ? (vesselsResult.value?.vessels ?? []) : [];
  if (flights.length > 0 || vessels.length > 0) {
    ingestMilitaryForCII(flights, vessels);
  }
}

async function loadNews(): Promise<void> {
  const { fetchFeed } = await import('@/services/rss');
  const { clusterNews } = await import('@/services/clustering');
  const feed = { name: 'Reuters Top', url: 'https://news.google.com/rss/search?q=site:reuters.com+when:1d&hl=en-US&gl=US&ceid=US:en' };
  const items = await fetchFeed(feed);
  if (items?.length) {
    const clustered = clusterNews(items);
    if (clustered.length > 0) ingestNewsForCII(clustered);
  }
}

async function loadOutages(): Promise<void> {
  const { fetchInternetOutages } = await import('@/services/infrastructure');
  const outages = await fetchInternetOutages();
  if (outages?.length) ingestOutagesForCII(outages);
}

async function loadGpsJamming(): Promise<void> {
  const { fetchGpsInterference } = await import('@/services/gps-interference');
  const result = await fetchGpsInterference();
  if (result?.hexes?.length) ingestGpsJammingForCII(result.hexes);
}

async function loadAisDisruptions(): Promise<void> {
  const { fetchAisSignals } = await import('@/services/maritime');
  const result = await fetchAisSignals();
  if (result?.disruptions?.length) ingestAisDisruptionsForCII(result.disruptions);
}

async function loadEarthquakes(): Promise<void> {
  const { fetchEarthquakes } = await import('@/services/earthquakes');
  const quakes = await fetchEarthquakes();
  if (quakes?.length) ingestEarthquakesForCII(quakes);
}

async function loadSanctions(): Promise<void> {
  const { fetchSanctionsPressure } = await import('@/services/sanctions-pressure');
  const result = await fetchSanctionsPressure();
  if (result?.countries?.length) ingestSanctionsForCII(result.countries);
}

async function loadOref(): Promise<void> {
  const { fetchOrefAlerts, fetchOrefHistory } = await import('@/services/oref-alerts');
  const [alertsResult, historyResult] = await Promise.allSettled([
    fetchOrefAlerts(),
    fetchOrefHistory(),
  ]);
  const alertCount = alertsResult.status === 'fulfilled' ? (alertsResult.value?.alerts?.length ?? 0) : 0;
  const historyCount24h = historyResult.status === 'fulfilled' ? (historyResult.value?.historyCount24h ?? 0) : 0;
  if (alertCount > 0 || historyCount24h > 0) {
    ingestOrefForCII(alertCount, historyCount24h);
  }
}

async function loadAviation(): Promise<void> {
  const { fetchFlightDelays } = await import('@/services/aviation');
  const alerts = await fetchFlightDelays();
  if (alerts?.length) ingestAviationForCII(alerts);
}

async function loadAdvisories(): Promise<void> {
  const { loadAdvisoriesFromServer } = await import('@/services/security-advisories');
  const result = await loadAdvisoriesFromServer();
  if (result?.advisories?.length) ingestAdvisoriesForCII(result.advisories);
}

async function loadSatelliteFires(): Promise<void> {
  const { fetchAllFires } = await import('@/services/wildfires');
  const result = await fetchAllFires();
  if (result?.regions) {
    const fires: Array<{ lat: number; lon: number; brightness: number; frp: number; region?: string }> = [];
    for (const [region, detections] of Object.entries(result.regions)) {
      for (const d of detections) {
        fires.push({
          lat: d.location?.latitude ?? 0,
          lon: d.location?.longitude ?? 0,
          brightness: d.brightness ?? 0,
          frp: d.frp ?? 0,
          region,
        });
      }
    }
    if (fires.length > 0) ingestSatelliteFiresForCII(fires);
  }
}

async function loadTemporalAnomalies(): Promise<void> {
  const { fetchLiveAnomalies } = await import('@/services/temporal-baseline');
  const result = await fetchLiveAnomalies();
  if (result?.anomalies?.length) ingestTemporalAnomaliesForCII(result.anomalies);
}

async function loadStrikes(): Promise<void> {
  const { fetchIranEvents } = await import('@/services/conflict');
  const events = await fetchIranEvents();
  if (events?.length) {
    const mapped = events.map(e => ({
      id: e.id,
      category: e.category,
      severity: e.severity,
      latitude: e.latitude,
      longitude: e.longitude,
      timestamp: typeof e.timestamp === 'string' ? Date.parse(e.timestamp) / 1000 : Number(e.timestamp),
      title: e.title,
      locationName: e.locationName,
    }));
    ingestStrikesForCII(mapped);
  }
}

async function loadDisplacement(): Promise<void> {
  const { fetchUnhcrPopulation } = await import('@/services/displacement');
  const result = await fetchUnhcrPopulation();
  if (result?.data?.countries?.length) ingestDisplacementForCII(result.data.countries);
}

async function loadClimate(): Promise<void> {
  const { fetchClimateAnomalies } = await import('@/services/climate');
  const result = await fetchClimateAnomalies();
  if (result?.anomalies?.length) ingestClimateForCII(result.anomalies);
}

async function loadUcdp(): Promise<void> {
  const { fetchUcdpClassifications } = await import('@/services/conflict');
  const classifications = await fetchUcdpClassifications();
  if (classifications?.size) ingestUcdpForCII(classifications);
}

async function loadHapi(): Promise<void> {
  const { fetchHapiSummary } = await import('@/services/conflict');
  const summaries = await fetchHapiSummary();
  if (summaries?.size) ingestHapiForCII(summaries);
}
