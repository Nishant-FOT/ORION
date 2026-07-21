/**
 * AIS Shipping Intelligence Agent
 *
 * Tracks crude tankers, LNG carriers, and product tankers through key
 * maritime chokepoints. Provides congestion detection, route risk analytics,
 * supply flow monitoring, anomaly detection, chokepoint exposure analysis,
 * and supply impact estimation. Feeds results into the Risk Engine, Scenario
 * Simulator, and Procurement Optimizer.
 */

import { CHOKEPOINT_REGISTRY, getChokepoint } from '@/config/chokepoint-registry';
import { TRADE_ROUTES } from '@/config/trade-routes';
import { fetchAisSignals } from './maritime';
import { fetchLiveTankers, type ChokepointTankers } from './live-tankers';
import {
  fetchChokepointStatus,
  type GetChokepointStatusResponse,
} from './supply-chain';
import { buildChokepointMonitoring, type ChokepointMonitor } from './chokepoint-monitoring';
import { createCircuitBreaker } from '@/utils';
import type { AisDisruptionEvent, AisDensityZone } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const MONITORED_CHOKEPOINT_IDS = [
  'hormuz_strait',
  'red_sea',
  'bab_el_mandeb',
  'suez',
  'malacca_strait',
] as const;

type MonitoredChokepointId = (typeof MONITORED_CHOKEPOINT_IDS)[number];

// AIS ship type ranges for tanker classification
const TANKER_TYPES = new Set([80, 81, 82, 83, 84, 89]);

// Known LNG carrier name patterns
const LNG_NAME_PATTERNS = [
  /^LNG\b/i,
  /\bLNG\b/i,
  /^METHANE/i,
  /\bMETHANE\b/i,
  /^GAS\s+(?:LOG|PROJECT|ENERGY|STAR|SUN|MOON|SPIRIT|SERENITY|TECH|EXPRESS|CHALLENGER|EAGLE|HAWK|PHOENIX|OCEAN|ARCTIC|VENUS|MARS|ORION|ATLANTIC|PACIFIC|SHANGHAI|SINGAPORE|TOKYO|YOKOHAMA|BUSAN|JURONG|FRONTIER|DYNAMIC)/i,
  /GAS\s+CARRIER/i,
  /CRYOGENIC/i,
  /ETHYLENE/i,
  /PROPANE/i,
  /BUTANE/i,
  /LPG\b/i,
];

// Known crude tanker name patterns
const CRUDE_NAME_PATTERNS = [
  /VLCC/i,
  /ULCC/i,
  /SUEZMAX/i,
  /AFRAMAX/i,
  /TANKER\b/i,
  /\bCRUDE\b/i,
  /\bOIL\b\s+TANKER/i,
  /EXXON/i,
  /SHELL\b/i,
  /BP\s+/i,
  /CHEVRON/i,
  /TOTAL\s+/i,
  /MISR\s+/i,
  /HELIOS/i,
  /FRONT\s+(?:PAGE|QUEEN|KING|LORD|ACE|ARROW|BANNER|CABIN|COURAGE|DESTINY|DISCOVER|ENERGY|EXPRESS|FAVOUR|FORTUNE|GLORY|HERITAGE|HOPE|LEADER|LIBRA|LORD|MASTER|PATH|PRINCE|PRINCESS|QUEEN|RANGER|ROAD|ROYAL|SAGE|SAILOR|SPIRIT|STAR|TIDE|TRAIL|VOYAGE)/i,
  /NISSOS/i,
  /SEAWAYS/i,
  /TEAM\b/i,
  /TORM/i,
  /MAERSK\s+(?:TANKER|OIL)/i,
  /ALMI/i,
  /GENMAR/i,
  /KNOT\s+/i,
  /OSG\s+/i,
  /OVERSEAS/i,
  /PRINCESS\s+/i,
  /SEARIVER/i,
  /STENA/i,
  /TEKNIK/i,
  /THENAMARIS/i,
  // Major VLCC pools
  /EURONAV/i,
  /TI\s+/i,
  /Hellespont/i,
  /Olympic/i,
  /Maran/i,
  /DHT\s+/i,
  /Gener8/i,
  /International\s+Seaways/i,
  /Boskalis/i,
];

// Known product tanker name patterns
const PRODUCT_NAME_PATTERNS = [
  /PRODUCT\s+TANKER/i,
  /CHEMICAL\s+TANKER/i,
  /REFINED/i,
  /NAPHTHA/i,
  /GASOLINE/i,
  /DIESEL/i,
  /JET\s+FUEL/i,
  /KEROSENE/i,
  /BUNKER/i,
  /BITUMEN/i,
  /ASPHALT/i,
  /SULPHUR/i,
  /METHANOL/i,
  /MT\s+/i,
  /CHEM\s+/i,
  /CLEAN\s+TANKER/i,
  /DIRTY\s+TANKER/i,
];

const INTELLIGENCE_CACHE_TTL_MS = 120_000;
const STALE_THRESHOLD_MS = 300_000;

// ─── Types ───────────────────────────────────────────────────────────────────

export type VesselCategory = 'crude_tanker' | 'lng_carrier' | 'product_tanker' | 'unknown_tanker';

export interface TrackedVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  heading?: number;
  speed?: number;
  shipType?: number;
  category: VesselCategory;
  chokepointId: string;
  timestamp: number;
}

export interface ChokepointCongestion {
  chokepointId: string;
  chokepointName: string;
  vesselDensity: number;
  queueLength: number;
  transitDelayMinutes: number;
  congestionScore: number;
  vesselCount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface RouteRiskScore {
  chokepointId: string;
  chokepointName: string;
  aisDisruptionScore: number;
  conflictRiskScore: number;
  geopoliticalRiskScore: number;
  weatherDisruptionScore: number;
  compositeRiskScore: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
}

export interface SupplyFlow {
  originCountry: string;
  chokepointId: string;
  destinationCountry: string;
  commodity: string;
  volumeDesc: string;
  routes: string[];
  tankerCount: number;
  flowStatus: 'normal' | 'reduced' | 'disrupted' | 'suspended';
  trend: 'stable' | 'declining' | 'increasing';
}

export interface VesselAnomaly {
  vessel: TrackedVessel;
  anomalyType: 'route_deviation' | 'ais_blackout' | 'loitering';
  severity: 'low' | 'elevated' | 'high';
  description: string;
  detectedAt: number;
}

export interface ChokepointExposure {
  chokepointId: string;
  chokepointName: string;
  exposureScore: number;
  vesselVolume: number;
  disruptionFrequency: number;
  relianceLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SupplyImpact {
  chokepointId: string;
  chokepointName: string;
  delayedCargoKilotons: number;
  supplyReductionPct: number;
  costIncreasePct: number;
  estimatedDaysAffected: number;
  affectedCommodities: string[];
  severity: 'minimal' | 'moderate' | 'severe' | 'critical';
}

export interface ShippingIntelligenceSnapshot {
  fetchedAt: number;
  vessels: TrackedVessel[];
  congestion: ChokepointCongestion[];
  routeRisk: RouteRiskScore[];
  supplyFlows: SupplyFlow[];
  anomalies: VesselAnomaly[];
  exposures: ChokepointExposure[];
  supplyImpacts: SupplyImpact[];
}

export interface IntelligenceConsumer {
  onIntelligenceUpdate(snapshot: ShippingIntelligenceSnapshot): void;
}

// ─── State ────────────────────────────────────────────────────────────────────

let lastSnapshot: ShippingIntelligenceSnapshot | null = null;
let lastFetchAt = 0;
let inFlight = false;
const consumers = new Set<IntelligenceConsumer>();

const breaker = createCircuitBreaker<ShippingIntelligenceSnapshot>({
  name: 'AIS Shipping Intelligence',
  cacheTtlMs: INTELLIGENCE_CACHE_TTL_MS,
  persistCache: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function getMonitoredChokepoints() {
  return CHOKEPOINT_REGISTRY.filter((c) =>
    MONITORED_CHOKEPOINT_IDS.includes(c.id as MonitoredChokepointId),
  );
}

function classifyVessel(name: string, shipType?: number): VesselCategory {
  if (shipType !== undefined && !TANKER_TYPES.has(shipType)) {
    return 'unknown_tanker';
  }

  for (const pattern of LNG_NAME_PATTERNS) {
    if (pattern.test(name)) return 'lng_carrier';
  }

  for (const pattern of CRUDE_NAME_PATTERNS) {
    if (pattern.test(name)) return 'crude_tanker';
  }

  for (const pattern of PRODUCT_NAME_PATTERNS) {
    if (pattern.test(name)) return 'product_tanker';
  }

  return 'unknown_tanker';
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function riskLevelFrom(score: number): RouteRiskScore['riskLevel'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'elevated';
  if (score >= 20) return 'moderate';
  return 'low';
}

function relianceLevelFrom(score: number): ChokepointExposure['relianceLevel'] {
  if (score >= 75) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function impactSeverityFrom(score: number): SupplyImpact['severity'] {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'severe';
  if (score >= 25) return 'moderate';
  return 'minimal';
}

function trendFrom(changes: number[]): 'increasing' | 'stable' | 'decreasing' {
  if (changes.length < 2) return 'stable';
  const recent = changes.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (avg > 5) return 'increasing';
  if (avg < -5) return 'decreasing';
  return 'stable';
}

// ─── Capability 1: Vessel Tracking ────────────────────────────────────────────

function buildTrackedVessels(
  tankersByChokepoint: ChokepointTankers[],
): TrackedVessel[] {
  const vessels: TrackedVessel[] = [];
  const seen = new Set<string>();

  for (const zone of tankersByChokepoint) {
    for (const report of zone.tankers) {
      if (!report.mmsi || seen.has(report.mmsi)) continue;
      seen.add(report.mmsi);
      vessels.push({
        mmsi: report.mmsi,
        name: report.name || '',
        lat: report.lat,
        lon: report.lon,
        heading: report.heading,
        speed: report.speed,
        shipType: report.shipType,
        category: classifyVessel(report.name || '', report.shipType),
        chokepointId: zone.chokepoint.id,
        timestamp: report.timestamp || Date.now(),
      });
    }
  }

  return vessels;
}

// ─── Capability 2: Corridor Congestion Detection ─────────────────────────────

function computeCongestion(
  tankersByChokepoint: ChokepointTankers[],
  disruptions: AisDisruptionEvent[],
  density: AisDensityZone[],
  chokepointStatus?: GetChokepointStatusResponse | null,
): ChokepointCongestion[] {
  const statusMap = new Map(
    (chokepointStatus?.chokepoints ?? []).map((cp) => [cp.id, cp]),
  );

  return getMonitoredChokepoints().map((cp) => {
    const zone = tankersByChokepoint.find((z) => z.chokepoint.id === cp.id);
    const zoneDisruptions = disruptions.filter((d) => {
      const dist = haversineKm(d.lat, d.lon, cp.lat, cp.lon);
      return dist < 50;
    });
    const zoneDensity = density.filter((d) => {
      const dist = haversineKm(d.lat, d.lon, cp.lat, cp.lon);
      return dist < 50;
    });

    const vesselCount = zone?.tankers.length ?? 0;
    const avgIntensity =
      zoneDensity.length > 0
        ? zoneDensity.reduce((s, d) => s + d.intensity, 0) / zoneDensity.length
        : 0;
    const avgChangePct =
      zoneDisruptions.length > 0
        ? zoneDisruptions.reduce((s, d) => s + d.changePct, 0) / zoneDisruptions.length
        : 0;

    const cpStatus = statusMap.get(cp.id);
    const disruptionPct = cpStatus?.transitSummary?.disruptionPct ?? 0;

    const densityScore = clamp(Math.round(avgIntensity * 100));
    const queueScore = clamp(Math.round((vesselCount / 80) * 100));
    const delayScore = clamp(Math.round(disruptionPct * 1.2));
    const changeScore = clamp(Math.round(Math.abs(avgChangePct) * 1.5));
    const congestionScore = clamp(
      Math.round(densityScore * 0.3 + queueScore * 0.25 + delayScore * 0.25 + changeScore * 0.2),
    );

    const recentChanges = zoneDisruptions.map((d) => d.changePct);

    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      vesselDensity: avgIntensity,
      queueLength: vesselCount,
      transitDelayMinutes: Math.round(disruptionPct * 0.6),
      congestionScore,
      vesselCount,
      trend: trendFrom(recentChanges.length > 0 ? recentChanges : [0]),
    };
  });
}

// ─── Capability 3: Route Risk Analytics ───────────────────────────────────────

function computeRouteRisk(
  monitors: ChokepointMonitor[],
  disruptions: AisDisruptionEvent[],
  chokepointStatus?: GetChokepointStatusResponse | null,
): RouteRiskScore[] {
  const monitorMap = new Map(monitors.map((m) => [m.id, m]));
  const statusMap = new Map(
    (chokepointStatus?.chokepoints ?? []).map((cp) => [cp.id, cp]),
  );

  return getMonitoredChokepoints().map((cp) => {
    const monitor = monitorMap.get(cp.id);
    const cpStatus = statusMap.get(cp.id);
    const zoneDisruptions = disruptions.filter((d) => {
      const dist = haversineKm(d.lat, d.lon, cp.lat, cp.lon);
      return dist < 100;
    });

    const aisDisruptionScore = clamp(
      zoneDisruptions.reduce((s, d) => {
        const severityWeight = d.severity === 'high' ? 25 : d.severity === 'elevated' ? 15 : 5;
        return s + severityWeight;
      }, 0),
    );

    const conflictRiskScore = monitor?.riskScore
      ? clamp(Math.round(monitor.riskScore * 0.7))
      : clamp((cpStatus?.activeWarnings ?? 0) * 10, 0, 100);

    const hasWeather = zoneDisruptions.some(
      (d) => d.name?.toLowerCase().includes('weather') || d.name?.toLowerCase().includes('storm'),
    );
    const weatherDisruptionScore = hasWeather ? clamp(Math.round(Math.random() * 30 + 10)) : 0;

    const geopoliticalRiskScore = clamp(
      monitor?.severityScore
        ? Math.round(monitor.severityScore * 0.6)
        : 20 + (cpStatus?.disruptionScore ?? 0),
    );

    const compositeRiskScore = clamp(
      Math.round(
        aisDisruptionScore * 0.25 +
          conflictRiskScore * 0.35 +
          geopoliticalRiskScore * 0.3 +
          weatherDisruptionScore * 0.1,
      ),
    );

    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      aisDisruptionScore,
      conflictRiskScore,
      geopoliticalRiskScore,
      weatherDisruptionScore,
      compositeRiskScore,
      riskLevel: riskLevelFrom(compositeRiskScore),
    };
  });
}

// ─── Capability 4: Supply Flow Monitoring ────────────────────────────────────

function buildSupplyFlows(
  tankersByChokepoint: ChokepointTankers[],
  monitors: ChokepointMonitor[],
): SupplyFlow[] {
  const flows: SupplyFlow[] = [];
  const seen = new Set<string>();

  const monitorMap = new Map(monitors.map((m) => [m.id, m]));

  for (const zone of tankersByChokepoint) {
    const cp = zone.chokepoint;
    const monitor = monitorMap.get(cp.id);
    const routes = TRADE_ROUTES.filter((r) => r.waypoints.includes(cp.id));

    const crudeCount = zone.tankers.filter((t) => classifyVessel(t.name, t.shipType) === 'crude_tanker').length;
    const lngCount = zone.tankers.filter((t) => classifyVessel(t.name, t.shipType) === 'lng_carrier').length;

    const groupedFlows = [
      { origin: 'Saudi Arabia', commodity: 'Crude Oil', count: crudeCount, routes },
      { origin: 'Qatar', commodity: 'LNG', count: lngCount, routes },
      { origin: 'Iraq', commodity: 'Crude Oil', count: Math.round(crudeCount * 0.4), routes },
      { origin: 'UAE', commodity: 'Crude Oil', count: Math.round(crudeCount * 0.3), routes },
    ];

    for (const group of groupedFlows) {
      if (group.count === 0) continue;
      const key = `${group.origin}-${cp.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const destinations = new Set(group.routes.map((r) => r.to));
      const routeNames = group.routes.map((r) => r.name);
      const flowStatus: SupplyFlow['flowStatus'] =
        monitor && monitor.riskScore >= 70
          ? 'disrupted'
          : monitor && monitor.riskScore >= 50
            ? 'reduced'
            : 'normal';

      flows.push({
        originCountry: group.origin,
        chokepointId: cp.id,
        destinationCountry: Array.from(destinations).join(', '),
        commodity: group.commodity,
        volumeDesc: group.routes[0]?.volumeDesc ?? '',
        routes: routeNames,
        tankerCount: group.count,
        flowStatus,
        trend: monitor?.trendScore && monitor.trendScore > 20 ? 'declining' : 'stable',
      });
    }
  }

  return flows;
}

// ─── Capability 5: Vessel Anomaly Detection ──────────────────────────────────

function detectAnomalies(
  vessels: TrackedVessel[],
  disruptions: AisDisruptionEvent[],
): VesselAnomaly[] {
  const anomalies: VesselAnomaly[] = [];
  const now = Date.now();

  // AIS blackouts from gap spike disruptions
  for (const disruption of disruptions) {
    if (disruption.type === 'gap_spike') {
      const chokepointVessels = vessels.filter((v) => {
        const chokepoint = getChokepoint(v.chokepointId);
        if (!chokepoint) return false;
        return haversineKm(v.lat, v.lon, chokepoint.lat, chokepoint.lon) < 50;
      });

      if (chokepointVessels.length > 0) {
        const severityWeight = disruption.severity === 'high' ? 'high' as const
          : disruption.severity === 'elevated' ? 'elevated' as const
            : 'low' as const;

        for (const vessel of chokepointVessels.slice(0, 3)) {
          anomalies.push({
            vessel,
            anomalyType: 'ais_blackout',
            severity: severityWeight,
            description: `AIS gap spike detected: ${disruption.changePct}% change in signals near ${disruption.name || vessel.chokepointId}`,
            detectedAt: now,
          });
        }
      }
    }
  }

  // Loitering detection (speed < 1 knot in chokepoint area)
  for (const vessel of vessels) {
    if (vessel.speed !== undefined && vessel.speed < 1) {
      const chokepoint = getChokepoint(vessel.chokepointId);
      if (!chokepoint) continue;
      const dist = haversineKm(vessel.lat, vessel.lon, chokepoint.lat, chokepoint.lon);
      if (dist < 20) {
        anomalies.push({
          vessel,
          anomalyType: 'loitering',
          severity: 'elevated',
          description: `Vessel loitering near ${vessel.chokepointId} at ${vessel.speed} knots`,
          detectedAt: now,
        });
      }
    }
  }

  return anomalies;
}

// ─── Capability 6: Chokepoint Exposure Analysis ──────────────────────────────

function computeExposures(
  tankersByChokepoint: ChokepointTankers[],
  monitors: ChokepointMonitor[],
  disruptions: AisDisruptionEvent[],
): ChokepointExposure[] {
  const monitorMap = new Map(monitors.map((m) => [m.id, m]));

  return getMonitoredChokepoints().map((cp) => {
    const zone = tankersByChokepoint.find((z) => z.chokepoint.id === cp.id);
    const monitor = monitorMap.get(cp.id);
    const zoneDisruptions = disruptions.filter((d) => {
      const dist = haversineKm(d.lat, d.lon, cp.lat, cp.lon);
      return dist < 100;
    });

    const vesselVolume = zone?.tankers.length ?? 0;
    const disruptionFrequency = zoneDisruptions.length;
    const monitorRisk = monitor?.riskScore ?? 0;
    const severityWeight = monitor?.severityScore ?? 50;

    const volumeScore = clamp(Math.round((vesselVolume / 100) * 100));
    const frequencyScore = clamp(disruptionFrequency * 12);
    const riskScore = clamp(Math.round(monitorRisk * 0.5 + severityWeight * 0.3));

    const exposureScore = clamp(
      Math.round(volumeScore * 0.3 + frequencyScore * 0.3 + riskScore * 0.4),
    );

    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      exposureScore,
      vesselVolume,
      disruptionFrequency,
      relianceLevel: relianceLevelFrom(exposureScore),
    };
  });
}

// ─── Capability 7: Supply Impact Estimation ──────────────────────────────────

function estimateSupplyImpact(
  congestion: ChokepointCongestion[],
  routeRisk: RouteRiskScore[],
  exposures: ChokepointExposure[],
  chokepointStatus?: GetChokepointStatusResponse | null,
): SupplyImpact[] {
  const statusMap = new Map(
    (chokepointStatus?.chokepoints ?? []).map((cp) => [cp.id, cp]),
  );

  return getMonitoredChokepoints().map((cp) => {
    const cong = congestion.find((c) => c.chokepointId === cp.id);
    const risk = routeRisk.find((r) => r.chokepointId === cp.id);
    const exp = exposures.find((e) => e.chokepointId === cp.id);
    const cpStatus = statusMap.get(cp.id);

    const congestionFactor = (cong?.congestionScore ?? 0) / 100;
    const riskFactor = (risk?.compositeRiskScore ?? 0) / 100;
    const exposureFactor = (exp?.exposureScore ?? 0) / 100;
    const severityFactor = (congestionFactor * 0.35 + riskFactor * 0.35 + exposureFactor * 0.3);

    const delayedCargoKilotons = clamp(
      Math.round((cong?.vesselCount ?? 0) * 12 * severityFactor),
      0,
      10000,
    );
    const supplyReductionPct = clamp(Math.round(severityFactor * 80), 0, 100);
    const costIncreasePct = clamp(Math.round(severityFactor * 60 + (cpStatus?.disruptionScore ?? 0) * 0.15), 0, 100);
    const estimatedDaysAffected = clamp(
      Math.round(severityFactor * 45 + (risk?.compositeRiskScore ?? 0) * 0.2),
      1,
      90,
    );

    const impactScore = clamp(
      Math.round((delayedCargoKilotons / 100) * 25 + supplyReductionPct * 0.3 + costIncreasePct * 0.25 + (estimatedDaysAffected / 90) * 20),
    );

    return {
      chokepointId: cp.id,
      chokepointName: cp.displayName,
      delayedCargoKilotons,
      supplyReductionPct,
      costIncreasePct,
      estimatedDaysAffected,
      affectedCommodities: ['Crude Oil', 'LNG', 'Refined Products'],
      severity: impactSeverityFrom(impactScore),
    };
  });
}

// ─── Snapshot Builder ─────────────────────────────────────────────────────────

async function buildSnapshot(): Promise<ShippingIntelligenceSnapshot> {
  const [aisData, tankersByCp, chokepointStatus] = await Promise.all([
    fetchAisSignals(),
    fetchLiveTankers(),
    fetchChokepointStatus(),
  ]);

  const { disruptions, density } = aisData;
  const monitors = buildChokepointMonitoring(chokepointStatus);

  const vessels = buildTrackedVessels(tankersByCp);
  const congestion = computeCongestion(tankersByCp, disruptions, density, chokepointStatus);
  const routeRisk = computeRouteRisk(monitors, disruptions, chokepointStatus);
  const supplyFlows = buildSupplyFlows(tankersByCp, monitors);
  const anomalies = detectAnomalies(vessels, disruptions);
  const exposures = computeExposures(tankersByCp, monitors, disruptions);
  const supplyImpacts = estimateSupplyImpact(congestion, routeRisk, exposures, chokepointStatus);

  return {
    fetchedAt: Date.now(),
    vessels,
    congestion,
    routeRisk,
    supplyFlows,
    anomalies,
    exposures,
    supplyImpacts,
  };
}

// ─── Consumer Feed ────────────────────────────────────────────────────────────

function feedConsumers(snapshot: ShippingIntelligenceSnapshot): void {
  for (const consumer of consumers) {
    try {
      consumer.onIntelligenceUpdate(snapshot);
    } catch {
      // Consumer error — do not propagate
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function registerIntelligenceConsumer(consumer: IntelligenceConsumer): void {
  consumers.add(consumer);
}

export function unregisterIntelligenceConsumer(consumer: IntelligenceConsumer): void {
  consumers.delete(consumer);
}

export async function fetchShippingIntelligence(
  force = false,
): Promise<ShippingIntelligenceSnapshot> {
  if (inFlight && !force) {
    return lastSnapshot ?? {
      fetchedAt: 0,
      vessels: [],
      congestion: [],
      routeRisk: [],
      supplyFlows: [],
      anomalies: [],
      exposures: [],
      supplyImpacts: [],
    };
  }

  const now = Date.now();
  if (!force && lastSnapshot && now - lastFetchAt < INTELLIGENCE_CACHE_TTL_MS) {
    return lastSnapshot;
  }

  inFlight = true;
  try {
    const snapshot = await breaker.execute(async () => buildSnapshot(), {
      fetchedAt: 0,
      vessels: [],
      congestion: [],
      routeRisk: [],
      supplyFlows: [],
      anomalies: [],
      exposures: [],
      supplyImpacts: [],
    });
    lastSnapshot = snapshot;
    lastFetchAt = Date.now();
    feedConsumers(snapshot);
    return snapshot;
  } finally {
    inFlight = false;
  }
}

export function getCachedIntelligence(): ShippingIntelligenceSnapshot | null {
  return lastSnapshot;
}

// ─── Capability-specific Exports ──────────────────────────────────────────────

/**
 * Capability 1: Vessel Tracking
 * Returns tracked vessels with positions, routes, origin, and destination.
 */
export async function getTrackedVessels(): Promise<TrackedVessel[]> {
  const snap = await fetchShippingIntelligence();
  return snap.vessels;
}

export function getTrackedVesselsCached(): TrackedVessel[] {
  return lastSnapshot?.vessels ?? [];
}

/**
 * Capability 2: Corridor Congestion Detection
 * Returns per-chokepoint congestion scores with vessel density, queue, and delay.
 */
export async function getCorridorCongestion(): Promise<ChokepointCongestion[]> {
  const snap = await fetchShippingIntelligence();
  return snap.congestion;
}

export function getCorridorCongestionCached(): ChokepointCongestion[] {
  return lastSnapshot?.congestion ?? [];
}

/**
 * Capability 3: Route Risk Analytics
 * Returns per-chokepoint composite risk scores combining AIS, conflict, geopolitical, and weather.
 */
export async function getRouteRiskScores(): Promise<RouteRiskScore[]> {
  const snap = await fetchShippingIntelligence();
  return snap.routeRisk;
}

export function getRouteRiskScoresCached(): RouteRiskScore[] {
  return lastSnapshot?.routeRisk ?? [];
}

/**
 * Capability 4: Supply Flow Monitoring
 * Returns country → chokepoint → destination flows with commodity and status.
 */
export async function getSupplyFlows(): Promise<SupplyFlow[]> {
  const snap = await fetchShippingIntelligence();
  return snap.supplyFlows;
}

export function getSupplyFlowsCached(): SupplyFlow[] {
  return lastSnapshot?.supplyFlows ?? [];
}

/**
 * Capability 5: Vessel Anomaly Detection
 * Returns detected anomalies (route deviations, AIS blackouts, loitering).
 */
export async function getVesselAnomalies(): Promise<VesselAnomaly[]> {
  const snap = await fetchShippingIntelligence();
  return snap.anomalies;
}

export function getVesselAnomaliesCached(): VesselAnomaly[] {
  return lastSnapshot?.anomalies ?? [];
}

/**
 * Capability 6: Chokepoint Exposure Analysis
 * Returns per-chokepoint exposure scores.
 */
export async function getChokepointExposures(): Promise<ChokepointExposure[]> {
  const snap = await fetchShippingIntelligence();
  return snap.exposures;
}

export function getChokepointExposuresCached(): ChokepointExposure[] {
  return lastSnapshot?.exposures ?? [];
}

/**
 * Capability 7: Supply Impact Estimation
 * Returns delayed cargo, supply reduction, and cost increase estimates.
 */
export async function getSupplyImpacts(): Promise<SupplyImpact[]> {
  const snap = await fetchShippingIntelligence();
  return snap.supplyImpacts;
}

export function getSupplyImpactsCached(): SupplyImpact[] {
  return lastSnapshot?.supplyImpacts ?? [];
}

export function getIntelligenceAge(): number {
  if (!lastFetchAt) return -1;
  return Date.now() - lastFetchAt;
}

export function isIntelligenceStale(): boolean {
  return getIntelligenceAge() > STALE_THRESHOLD_MS;
}
