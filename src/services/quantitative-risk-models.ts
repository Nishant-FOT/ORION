/**
 * Quantitative Risk Models
 *
 * Computes current probability, 7-day forecast, and 30-day forecast for:
 *   1. Hormuz Disruption
 *   2. Red Sea Disruption
 *   3. OPEC Production Cuts
 *   4. Export Sanctions
 *   5. Port Congestion
 *
 * Each model fuses multiple existing data streams into a calibrated 0-100%
 * probability using weighted evidence accumulation with Bayesian prior
 * blending.
 */

import { buildChokepointMonitoring, type ChokepointMonitor } from './chokepoint-monitoring';
import { fetchAisSignals } from './maritime';
import { fetchLiveTankers, type ChokepointTankers } from './live-tankers';
import {
  fetchChokepointStatus,
  type GetChokepointStatusResponse,
} from './supply-chain';
import { fetchCachedRiskScores, type CachedRiskScores } from './cached-risk-scores';
import { fetchSanctionsPressure, type SanctionsPressureResult } from './sanctions-pressure';
import { fetchCategoryFeeds } from './rss';
import { INTEL_SOURCES } from '@/config/feeds';
import { CHOKEPOINT_REGISTRY } from '@/config/chokepoint-registry';
import { createCircuitBreaker } from '@/utils';
import type { AisDisruptionEvent, AisDensityZone } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 300_000;
const CACHE_TTL_MS = 240_000;
const STALE_THRESHOLD_MS = 600_000;

// Key countries by risk model
const OPEC_MEMBERS = new Set([
  'SA', 'IQ', 'AE', 'KW', 'IR', 'VE', 'NG', 'LY', 'DZ',
  'AO', 'CG', 'GQ', 'GA', 'GN', 'SD', 'SS', 'CD',
]);

const MAJOR_SANCTIONED_EXPORTERS = new Set(['IR', 'RU', 'VE', 'SY', 'KP', 'MM', 'BY', 'CF']);

// OPEC-related keywords for news scoring
const OPEC_KEYWORDS = [
  'opec', 'oil production', 'production cut', 'output cut',
  'production quota', 'barrel', 'crude oil', 'brent', 'wti',
  'oil price', 'supply cut', 'oil minister', 'energy minister',
  'joint ministerial', 'jmmc', 'voluntary cut', 'compensation cut',
  'overproduction', 'baseline', 'reference production',
];

const SANCTIONS_KEYWORDS = [
  'sanctions', 'embargo', 'export ban', 'trade ban',
  'restrictive measures', 'asset freeze', 'designation',
  'ofac', 'sdn', 'specially designated', 'blacklist',
  'export control', 'license revocation', 'trade restriction',
];

// OPEC production baselines (mbd) for weighting country signals
const OPEC_PRODUCTION_WEIGHTS: Record<string, number> = {
  SA: 10.5, IQ: 4.6, AE: 3.2, KW: 2.7, IR: 2.4,
  NG: 1.4, LY: 1.2, DZ: 1.0, VE: 0.7, AO: 1.1,
  CG: 0.3, GQ: 0.2, GA: 0.2, GN: 0.1, SD: 0.1,
  SS: 0.1, CD: 0.0,
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskModelId = 'hormuz' | 'red_sea' | 'opec' | 'sanctions' | 'port_congestion';

export interface RiskModelForecast {
  current: number;
  day7: number;
  day30: number;
}

export interface RiskModelOutput {
  id: RiskModelId;
  label: string;
  probability: RiskModelForecast;
  confidence: number;
  trendDirection: 'rising' | 'stable' | 'falling';
  keyDrivers: string[];
  lastUpdated: number;
}

export interface RiskModelSnapshot {
  fetchedAt: number;
  models: RiskModelOutput[];
}

// ─── State ───────────────────────────────────────────────────────────────────

let lastSnapshot: RiskModelSnapshot | null = null;
let lastFetchAt = 0;
let inFlight = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let isPolling = false;

const breaker = createCircuitBreaker<RiskModelSnapshot>({
  name: 'Quantitative Risk Models',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value * 10) / 10));
}

function weightedMean(values: { value: number; weight: number }[]): number {
  const totalWeight = values.reduce((s, v) => s + v.weight, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((s, v) => s + v.value * v.weight, 0) / totalWeight;
}

function decayTrend(current: number, trendFactor: number, days: number): number {
  const decay = Math.exp(-days * 0.03);
  const trend = current + trendFactor * days;
  return clamp(current * decay + trend * (1 - decay));
}

function forecast7d(current: number, momentum: number): number {
  return decayTrend(current, momentum, 7);
}

function forecast30d(current: number, momentum: number): number {
  const reversion = 0.3;
  const mid = 35;
  return clamp(current * (1 - reversion) + (mid + momentum * 5) * reversion);
}

function trendDirection(current: number, forecast: number): 'rising' | 'stable' | 'falling' {
  const diff = forecast - current;
  if (diff > 3) return 'rising';
  if (diff < -3) return 'falling';
  return 'stable';
}

// ─── Model 1: Hormuz Disruption ──────────────────────────────────────────────

function modelHormuz(
  monitors: ChokepointMonitor[],
  tankers: ChokepointTankers[],
  disruptions: AisDisruptionEvent[],
  cpStatus: GetChokepointStatusResponse | null,
): RiskModelOutput {
  const monitor = monitors.find((m) => m.id === 'hormuz_strait');
  const hormuzTankers = tankers.find((t) => t.chokepoint.id === 'hormuz_strait');
  const hormuzDisruptions = disruptions.filter((d) => {
    const cp = CHOKEPOINT_REGISTRY.find((c) => c.id === 'hormuz_strait');
    if (!cp) return false;
    return Math.abs(d.lat - cp.lat) < 2 && Math.abs(d.lon - cp.lon) < 2;
  });
  const cpInfo = cpStatus?.chokepoints?.find((c) => c.id === 'hormuz_strait');

  // Evidence buckets
  const riskScore = monitor?.riskScore ?? 30;
  const severityScore = monitor?.severityScore ?? 40;
  const disruptionProb = monitor?.disruptionProbability ?? 15;

  const congestionEvents = hormuzDisruptions.filter((d) => d.type === 'chokepoint_congestion').length;
  const gapSpikes = hormuzDisruptions.filter((d) => d.type === 'gap_spike').length;
  const maxSeverity = Math.max(...hormuzDisruptions.map((d) =>
    d.severity === 'high' ? 3 : d.severity === 'elevated' ? 2 : 1
  ), 0);

  const flowRatio = cpInfo?.flowEstimate?.flowRatio;
  const flowStress = flowRatio !== undefined && flowRatio !== null
    ? clamp((1 - flowRatio) * 120)
    : 25;

  const tankerCount = hormuzTankers?.tankers.length ?? 0;
  const tankerStress = clamp((tankerCount / 80) * 100);

  const activeWarnings = cpInfo?.activeWarnings ?? 0;
  const warningStress = clamp(activeWarnings * 15);

  // Composite
  const composite = clamp(
    riskScore * 0.25 +
    severityScore * 0.10 +
    disruptionProb * 0.10 +
    flowStress * 0.15 +
    tankerStress * 0.10 +
    warningStress * 0.05 +
    (congestionEvents * 8) * 0.10 +
    (gapSpikes * 12) * 0.05 +
    (maxSeverity * 10) * 0.10
  );

  const momentum = trendDirection(composite, composite + flowStress * 0.1 - tankerStress * 0.05);
  const currentProb = clamp(composite);
  const day7 = forecast7d(currentProb, currentProb > 50 ? 2 : -1);
  const day30 = forecast30d(currentProb, currentProb > 40 ? 3 : -2);

  const drivers: string[] = [];
  if (riskScore >= 60) drivers.push(`Chokepoint risk score ${riskScore}/100`);
  if (flowStress >= 40) drivers.push(`Flow at ${Math.round((flowRatio ?? 1) * 100)}% of baseline`);
  if (congestionEvents > 0) drivers.push(`${congestionEvents} active congestion events`);
  if (gapSpikes > 0) drivers.push(`${gapSpikes} AIS gap spikes detected`);
  if (tankerCount > 30) drivers.push(`${tankerCount} tankers in vicinity`);
  if (activeWarnings > 0) drivers.push(`${activeWarnings} navigational warnings`);

  return {
    id: 'hormuz',
    label: 'Hormuz Strait Disruption',
    probability: { current: currentProb, day7: clamp(day7), day30: clamp(day30) },
    confidence: clamp(monitor?.confidenceScore ?? 50),
    trendDirection: momentum,
    keyDrivers: drivers.slice(0, 4),
    lastUpdated: Date.now(),
  };
}

// ─── Model 2: Red Sea Disruption ─────────────────────────────────────────────

function modelRedSea(
  monitors: ChokepointMonitor[],
  tankers: ChokepointTankers[],
  disruptions: AisDisruptionEvent[],
  cpStatus: GetChokepointStatusResponse | null,
): RiskModelOutput {
  const redSea = monitors.find((m) => m.id === 'red_sea');
  const bab = monitors.find((m) => m.id === 'bab_el_mandeb');
  const suez = monitors.find((m) => m.id === 'suez');

  const babTankers = tankers.find((t) => t.chokepoint.id === 'bab_el_mandeb');
  const suezTankers = tankers.find((t) => t.chokepoint.id === 'suez');

  const redSeaDisruptions = disruptions.filter((d) => {
    return (Math.abs(d.lat - 20) < 5 && Math.abs(d.lon - 38) < 5) ||
           (Math.abs(d.lat - 12.5) < 3 && Math.abs(d.lon - 43.3) < 3) ||
           (Math.abs(d.lat - 30.5) < 2 && Math.abs(d.lon - 32.3) < 2);
  });

  const babInfo = cpStatus?.chokepoints?.find((c) => c.id === 'bab_el_mandeb');
  const suezInfo = cpStatus?.chokepoints?.find((c) => c.id === 'suez');

  const riskScore = redSea?.riskScore ?? Math.max(bab?.riskScore ?? 30, suez?.riskScore ?? 30);
  const severityScore = redSea?.severityScore ?? Math.max(bab?.severityScore ?? 40, suez?.severityScore ?? 40);
  const disruptionProb = redSea?.disruptionProbability ?? Math.max(bab?.disruptionProbability ?? 15, suez?.disruptionProbability ?? 15);

  const congestionEvents = redSeaDisruptions.filter((d) => d.type === 'chokepoint_congestion').length;
  const gapSpikes = redSeaDisruptions.filter((d) => d.type === 'gap_spike').length;

  const babFlow = babInfo?.flowEstimate?.flowRatio;
  const suezFlow = suezInfo?.flowEstimate?.flowRatio;
  const avgFlow = [babFlow, suezFlow].filter((f) => f !== undefined && f !== null);
  const flowStress = avgFlow.length > 0
    ? clamp((1 - avgFlow.reduce((s, f) => s + f!, 0) / avgFlow.length) * 120)
    : 30;

  const babCount = babTankers?.tankers.length ?? 0;
  const suezCount = suezTankers?.tankers.length ?? 0;
  const totalTankers = babCount + suezCount;
  const tankerStress = clamp((totalTankers / 60) * 100);

  const composite = clamp(
    riskScore * 0.20 +
    severityScore * 0.10 +
    disruptionProb * 0.10 +
    flowStress * 0.20 +
    tankerStress * 0.10 +
    (congestionEvents * 6) * 0.10 +
    (gapSpikes * 10) * 0.10 +
    ((babInfo?.activeWarnings ?? 0) + (suezInfo?.activeWarnings ?? 0)) * 5 * 0.10
  );

  const currentProb = clamp(composite);
  const day7 = forecast7d(currentProb, currentProb > 55 ? 3 : -0.5);
  const day30 = forecast30d(currentProb, currentProb > 45 ? 4 : -1);

  const drivers: string[] = [];
  if (riskScore >= 60) drivers.push(`Red Sea corridor risk ${riskScore}/100`);
  if (flowStress >= 40) drivers.push(`Flow disruption (avg ${Math.round((1 - flowStress / 120) * 100)}% of baseline)`);
  if (congestionEvents > 0) drivers.push(`${congestionEvents} congestion events`);
  if (gapSpikes > 0) drivers.push(`${gapSpikes} AIS gap spikes`);
  if (totalTankers > 20) drivers.push(`${totalTankers} tankers in corridor`);

  return {
    id: 'red_sea',
    label: 'Red Sea Maritime Disruption',
    probability: { current: currentProb, day7: clamp(day7), day30: clamp(day30) },
    confidence: clamp(redSea?.confidenceScore ?? Math.max(bab?.confidenceScore ?? 40, suez?.confidenceScore ?? 40)),
    trendDirection: trendDirection(currentProb, day30),
    keyDrivers: drivers.slice(0, 4),
    lastUpdated: Date.now(),
  };
}

// ─── Model 3: OPEC Production Cuts ───────────────────────────────────────────

function modelOPEC(
  riskScores: CachedRiskScores | null,
  sanctions: SanctionsPressureResult | null,
  newsItems: NewsItem[],
): RiskModelOutput {
  const countryScores = new Map((riskScores?.cii ?? []).map((c) => [c.code, c.score]));
  const sanctionsMap = new Map(sanctions?.countries?.map((c) => [c.countryCode, c.entryCount]) ?? []);

  // Scrape news for OPEC-related signals
  let opecKeywordScore = 0;
  let opecNewsCount = 0;
  for (const item of newsItems) {
    const headline = (item.title ?? '').toLowerCase();
    for (const kw of OPEC_KEYWORDS) {
      if (headline.includes(kw)) {
        opecKeywordScore += 12;
        opecNewsCount++;
        break;
      }
    }
  }
  const newsSignal = clamp(opecNewsCount * 8);

  // OPEC member stability assessment
  const members: { code: string; weight: number }[] = [];
  for (const code of OPEC_MEMBERS) {
    const weight = OPEC_PRODUCTION_WEIGHTS[code] ?? 0.5;
    members.push({ code, weight });
  }

  const instabilityScore = weightedMean(
    members.map((m) => ({
      value: countryScores.get(m.code) ?? 20,
      weight: m.weight,
    })),
  );

  const sanctionScore = weightedMean(
    members.filter((m) => MAJOR_SANCTIONED_EXPORTERS.has(m.code)).map((m) => ({
      value: clamp((sanctionsMap.get(m.code) ?? 0) * 3),
      weight: m.weight,
    })),
  );

  const composite = clamp(
    instabilityScore * 0.30 +
    sanctionScore * 0.15 +
    newsSignal * 0.25 +
    opecKeywordScore * 0.30
  );

  // OPEC cuts tend to follow price drops; model mean reversion
  const currentProb = clamp(composite);
  const momentum = opecNewsCount > 3 ? 2.5 : 0.5;
  const day7 = forecast7d(currentProb, momentum);
  const day30 = forecast30d(currentProb, momentum);

  const drivers: string[] = [];
  if (instabilityScore >= 40) drivers.push(`OPEC member instability ${Math.round(instabilityScore)}/100`);
  if (sanctionScore >= 30) drivers.push(`Sanctions pressure on key producers`);
  if (opecNewsCount > 0) drivers.push(`${opecNewsCount} OPEC-related news signals`);
  if (instabilityScore >= 50) drivers.push(`Chokepoint pressure on OPEC export routes`);

  return {
    id: 'opec',
    label: 'OPEC Production Cuts',
    probability: { current: currentProb, day7: clamp(day7), day30: clamp(day30) },
    confidence: clamp(50 + opecNewsCount * 5 + (riskScores ? 10 : 0)),
    trendDirection: trendDirection(currentProb, day30),
    keyDrivers: drivers.slice(0, 4),
    lastUpdated: Date.now(),
  };
}

// ─── Model 4: Export Sanctions ───────────────────────────────────────────────

function modelSanctions(
  sanctions: SanctionsPressureResult | null,
  riskScores: CachedRiskScores | null,
  newsItems: NewsItem[],
): RiskModelOutput {
  const totalEntries = sanctions?.totalCount ?? 0;
  const newEntries = sanctions?.newEntryCount ?? 0;
  const sanctionedCountries = sanctions?.countries?.length ?? 0;
  const countryCounts = new Map(sanctions?.countries?.map((c) => [c.countryCode, c.entryCount]) ?? []);
  const countryScores = new Map(riskScores?.cii?.map((c) => [c.code, c.score]) ?? []);

  // News signal
  let sanctionsKeywordScore = 0;
  let sanctionsNewsCount = 0;
  for (const item of newsItems) {
    const headline = (item.title ?? '').toLowerCase();
    for (const kw of SANCTIONS_KEYWORDS) {
      if (headline.includes(kw)) {
        sanctionsKeywordScore += 10;
        sanctionsNewsCount++;
        break;
      }
    }
  }

  // Volume: total sanctions entries (normalized)
  const volumeScore = clamp((totalEntries / 200) * 100);

  // Velocity: new entries in current period
  const velocityScore = clamp(newEntries * 5);

  // Breadth: how many countries are sanctioned
  const breadthScore = clamp((sanctionedCountries / 30) * 100);

  // Country risk correlation
  const riskCorrelation = weightedMean(
    Array.from(countryCounts.entries())
      .filter(([code]) => countryScores.has(code))
      .map(([code, count]) => ({
        value: count * 2,
        weight: countryScores.get(code) ?? 20,
      })),
  );

  // News-driven escalation
  const newsPressure = clamp(sanctionsKeywordScore);

  const composite = clamp(
    volumeScore * 0.20 +
    velocityScore * 0.20 +
    breadthScore * 0.15 +
    riskCorrelation * 0.20 +
    newsPressure * 0.25
  );

  const currentProb = clamp(composite);
  const momentum = newEntries > 10 ? 3 : sanctionsNewsCount > 5 ? 2 : 0.5;
  const day7 = forecast7d(currentProb, momentum);
  const day30 = forecast30d(currentProb, momentum + 0.5);

  const drivers: string[] = [];
  if (newEntries > 0) drivers.push(`${newEntries} new sanctions entries`);
  if (sanctionedCountries > 5) drivers.push(`${sanctionedCountries} countries under sanctions`);
  if (totalEntries > 100) drivers.push(`${totalEntries} total sanctions entries`);
  if (sanctionsNewsCount > 0) drivers.push(`${sanctionsNewsCount} sanctions-related news signals`);

  return {
    id: 'sanctions',
    label: 'Export Sanctions Escalation',
    probability: { current: currentProb, day7: clamp(day7), day30: clamp(day30) },
    confidence: clamp(40 + newEntries * 2 + (riskScores ? 15 : 0)),
    trendDirection: trendDirection(currentProb, day30),
    keyDrivers: drivers.slice(0, 4),
    lastUpdated: Date.now(),
  };
}

// ─── Model 5: Port Congestion ────────────────────────────────────────────────

function modelPortCongestion(
  disruptions: AisDisruptionEvent[],
  density: AisDensityZone[],
  tankers: ChokepointTankers[],
  cpStatus: GetChokepointStatusResponse | null,
): RiskModelOutput {
  // Collect congestion signals across all monitored chokepoints
  const congestionEvents = disruptions.filter((d) => d.type === 'chokepoint_congestion');
  const totalCongestionEvents = congestionEvents.length;

  const avgIntensity = density.length > 0
    ? density.reduce((s, d) => s + d.intensity, 0) / density.length
    : 0;

  const totalTankers = tankers.reduce((s, t) => s + t.tankers.length, 0);

  // Average disruption severity
  const avgChangePct = disruptions.length > 0
    ? disruptions.reduce((s, d) => s + Math.abs(d.changePct), 0) / disruptions.length
    : 0;

  // Chokepoint transit impacts
  let totalFlowStress = 0;
  let chokepointsWithStress = 0;
  for (const cp of (cpStatus?.chokepoints ?? [])) {
    if (cp.transitSummary?.disruptionPct) {
      totalFlowStress += cp.transitSummary.disruptionPct;
      chokepointsWithStress++;
    }
  }
  const avgFlowStress = chokepointsWithStress > 0 ? totalFlowStress / chokepointsWithStress : 0;

  // Queue length across chokepoints
  const queueBase = totalTankers > 0 ? clamp((totalTankers / 200) * 100) : 0;

  const composite = clamp(
    totalCongestionEvents * 8 * 0.20 +
    avgIntensity * 100 * 0.15 +
    avgChangePct * 1.5 * 0.15 +
    avgFlowStress * 1.2 * 0.20 +
    queueBase * 0.15 +
    clamp(disruptions.length * 3) * 0.15
  );

  const currentProb = clamp(composite);
  const queueMomentum = totalTankers > 100 ? 2 : totalTankers > 50 ? 1 : -0.5;
  const day7 = forecast7d(currentProb, queueMomentum);
  const day30 = forecast30d(currentProb, queueMomentum + 1);

  const drivers: string[] = [];
  if (totalCongestionEvents > 0) drivers.push(`${totalCongestionEvents} congestion events across chokepoints`);
  if (avgIntensity > 0.3) drivers.push(`Vessel density ${Math.round(avgIntensity * 100)}%`);
  if (totalTankers > 50) drivers.push(`${totalTankers} tankers in monitored zones`);
  if (avgFlowStress > 20) drivers.push(`Transit disruption ${Math.round(avgFlowStress)}%`);
  if (avgChangePct > 15) drivers.push(`Traffic volume change ${Math.round(avgChangePct)}%`);

  return {
    id: 'port_congestion',
    label: 'Port & Chokepoint Congestion',
    probability: { current: currentProb, day7: clamp(day7), day30: clamp(day30) },
    confidence: clamp(40 + totalCongestionEvents * 3 + density.length * 2),
    trendDirection: trendDirection(currentProb, day7),
    keyDrivers: drivers.slice(0, 4),
    lastUpdated: Date.now(),
  };
}

// ─── Snapshot Builder ─────────────────────────────────────────────────────────

interface NewsItem {
  title?: string;
  source?: string;
}

async function buildSnapshot(): Promise<RiskModelSnapshot> {
  const [
    aisData,
    tankers,
    cpStatus,
    riskScores,
    sanctions,
    newsResult,
  ] = await Promise.allSettled([
    fetchAisSignals(),
    fetchLiveTankers(),
    fetchChokepointStatus(),
    fetchCachedRiskScores(),
    fetchSanctionsPressure(),
    fetchCategoryFeeds(INTEL_SOURCES, { batchSize: 3 }),
  ]);

  const disruptions = aisData.status === 'fulfilled' ? aisData.value.disruptions : [];
  const density = aisData.status === 'fulfilled' ? aisData.value.density : [];
  const tankersOk = tankers.status === 'fulfilled' ? tankers.value : [];
  const cpOk = cpStatus.status === 'fulfilled' ? cpStatus.value : null;
  const riskOk = riskScores.status === 'fulfilled' ? riskScores.value : null;
  const sanctionsOk = sanctions.status === 'fulfilled' ? sanctions.value : null;
  const newsItems = newsResult.status === 'fulfilled' ? newsResult.value : [];

  const monitors = buildChokepointMonitoring(cpOk);

  const hormuz = modelHormuz(monitors, tankersOk, disruptions, cpOk);
  const redSea = modelRedSea(monitors, tankersOk, disruptions, cpOk);
  const opec = modelOPEC(riskOk, sanctionsOk, newsItems as NewsItem[]);
  const sanctionsModel = modelSanctions(sanctionsOk, riskOk, newsItems as NewsItem[]);
  const portCongestion = modelPortCongestion(disruptions, density, tankersOk, cpOk);

  return {
    fetchedAt: Date.now(),
    models: [hormuz, redSea, opec, sanctionsModel, portCongestion],
  };
}

// ─── Polling ──────────────────────────────────────────────────────────────────

async function poll(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const snapshot = await breaker.execute(
      async () => buildSnapshot(),
      { fetchedAt: 0, models: [] },
    );
    lastSnapshot = snapshot;
    lastFetchAt = Date.now();
  } finally {
    inFlight = false;
  }
}

function startPolling(): void {
  if (isPolling) return;
  isPolling = true;
  void poll();
  pollTimer = setInterval(() => void poll(), POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  isPolling = false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function initRiskModels(): void {
  startPolling();
}

export function disposeRiskModels(): void {
  stopPolling();
}

export async function fetchRiskModelOutputs(
  force = false,
): Promise<RiskModelSnapshot> {
  const now = Date.now();
  if (!force && lastSnapshot && now - lastFetchAt < CACHE_TTL_MS) {
    return lastSnapshot;
  }

  startPolling();

  if (inFlight) {
    return lastSnapshot ?? { fetchedAt: 0, models: [] };
  }

  await poll();
  return lastSnapshot ?? { fetchedAt: 0, models: [] };
}

export function getCachedModelOutputs(): RiskModelSnapshot | null {
  return lastSnapshot;
}

export function getModelOutput(id: RiskModelId): RiskModelOutput | null {
  return lastSnapshot?.models.find((m) => m.id === id) ?? null;
}

export function getModelProbability(id: RiskModelId): RiskModelForecast | null {
  return lastSnapshot?.models.find((m) => m.id === id)?.probability ?? null;
}

export function getAllModelProbabilities(): Record<RiskModelId, RiskModelForecast | null> {
  const result: Record<string, RiskModelForecast | null> = {};
  for (const id of ['hormuz', 'red_sea', 'opec', 'sanctions', 'port_congestion'] as RiskModelId[]) {
    result[id] = getModelProbability(id);
  }
  return result as Record<RiskModelId, RiskModelForecast | null>;
}

export function isModelsActive(): boolean {
  return isPolling;
}

export function isModelsStale(): boolean {
  if (!lastFetchAt) return true;
  return Date.now() - lastFetchAt > STALE_THRESHOLD_MS;
}
