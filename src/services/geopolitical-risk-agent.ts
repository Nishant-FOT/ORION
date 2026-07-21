/**
 * GeopoliticalRiskAgent
 *
 * Continuously ingests existing news feeds, event streams, and geopolitical
 * data sources to produce structured risk intelligence. Each risk item
 * includes a severity rating, affected region, confidence score, and
 * supply chain impact assessment.
 *
 * Feeds into:
 *   - Risk Engine (decisions)
 *   - Scenario Simulator (what-if)
 *   - Procurement Optimizer (cost/supply)
 */

import { fetchCategoryFeeds } from './rss';
import { fetchCachedRiskScores, type CachedRiskScores } from './cached-risk-scores';
import { fetchSanctionsPressure, type SanctionsPressureResult } from './sanctions-pressure';
import { fetchChokepointStatus } from './supply-chain';
import { buildChokepointMonitoring, type ChokepointMonitor } from './chokepoint-monitoring';
import { createCircuitBreaker } from '@/utils';
import { CHOKEPOINT_REGISTRY } from '@/config/chokepoint-registry';
import { CURATED_COUNTRIES } from '@/config/countries';
import { INTEL_SOURCES } from '@/config/feeds';

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 300_000;
const CACHE_TTL_MS = 240_000;
const STALE_THRESHOLD_MS = 600_000;
const MAX_RISK_ITEMS = 50;

const CONFLICT_KEYWORDS = [
  'attack', 'strike', 'missile', 'bomb', 'explosion', 'shelling',
  'artillery', 'airstrike', 'drone strike', 'military operation',
  'invasion', 'offensive', 'assault', 'barrage', 'rocket',
  'war', 'conflict', 'battle', 'siege', 'ceasefire violation',
];

const DIPLOMATIC_KEYWORDS = [
  'sanctions', 'embargo', 'expel', 'ambassador', 'diplomatic',
  'condemn', 'ultimatum', 'boycott', 'sever ties', 'recall',
  'expulsion', 'non grata', 'embassy closed', 'withdrawal',
];

const INSTABILITY_KEYWORDS = [
  'protest', 'riot', 'unrest', 'crackdown', 'curfew',
  'emergency', 'martial law', 'insurgency', 'rebellion',
  'coup', 'mutiny', 'demonstration', 'civil disobedience',
  'general strike', 'lockdown', 'state of emergency',
];

const MARITIME_KEYWORDS = [
  'tanker', 'shipping', 'maritime', 'naval', 'strait',
  'cargo ship', 'freighter', 'hijack', 'piracy', 'boarding',
  'chokepoint', 'sea lane', 'blockade', 'port closure',
];

const ECONOMIC_KEYWORDS = [
  'debt default', 'currency crisis', 'hyperinflation',
  'bank failure', 'credit downgrade', 'sovereign default',
  'capital controls', 'market crash', 'commodity shock',
  'energy crisis', 'food shortage', 'supply chain disruption',
];

const REGIONAL_IMPACT = new Map<string, string[]>([
  ['Gulf Region', ['IR', 'IQ', 'KW', 'SA', 'AE', 'QA', 'BH', 'OM']],
  ['Red Sea Basin', ['YE', 'SD', 'ER', 'DJ', 'EG', 'SA']],
  ['Eastern Mediterranean', ['IL', 'PS', 'LB', 'SY', 'CY', 'TR']],
  ['South China Sea', ['CN', 'VN', 'PH', 'MY', 'BN', 'TW']],
  ['Black Sea', ['UA', 'RU', 'RO', 'BG', 'TR', 'GE']],
  ['Horn of Africa', ['SO', 'ET', 'KE', 'DJ', 'ER']],
  ['Sahel Region', ['ML', 'NE', 'BF', 'TD', 'MR', 'SN']],
  ['Caucasus', ['GE', 'AM', 'AZ', 'RU']],
  ['Central Asia', ['KZ', 'UZ', 'TM', 'KG', 'TJ']],
  ['Baltic Region', ['EE', 'LV', 'LT', 'FI', 'PL']],
]);

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskSeverity = 'low' | 'moderate' | 'elevated' | 'high' | 'critical';

export type RiskCategory =
  | 'conflict'
  | 'diplomatic'
  | 'instability'
  | 'maritime'
  | 'economic'
  | 'sanctions'
  | 'humanitarian';

export interface GeopoliticalRiskEvent {
  id: string;
  event: string;
  severity: RiskSeverity;
  affectedRegion: string;
  affectedCountryCodes: string[];
  confidence: number;
  category: RiskCategory;
  supplyChainImpact: string;
  source: string;
  timestamp: number;
  score: number;
  relatedChokepoints: string[];
}

export interface GeopoliticalRiskSnapshot {
  fetchedAt: number;
  riskEvents: GeopoliticalRiskEvent[];
  regionalSummary: RegionalRiskSummary[];
}

export interface RegionalRiskSummary {
  region: string;
  countryCodes: string[];
  maxSeverity: RiskSeverity;
  activeEvents: number;
  score: number;
}

// ─── State ───────────────────────────────────────────────────────────────────

let lastSnapshot: GeopoliticalRiskSnapshot | null = null;
let lastFetchAt = 0;
let inFlight = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let isPolling = false;

const breaker = createCircuitBreaker<GeopoliticalRiskSnapshot>({
  name: 'Geopolitical Risk Agent',
  cacheTtlMs: CACHE_TTL_MS,
  persistCache: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function generateId(): string {
  return `geo-risk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function severityFromScore(score: number): RiskSeverity {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'elevated';
  if (score >= 20) return 'moderate';
  return 'low';
}

function categorizeHeadline(headline: string): RiskCategory {
  const lower = headline.toLowerCase();
  for (const kw of MARITIME_KEYWORDS) { if (lower.includes(kw)) return 'maritime'; }
  for (const kw of CONFLICT_KEYWORDS) { if (lower.includes(kw)) return 'conflict'; }
  for (const kw of DIPLOMATIC_KEYWORDS) { if (lower.includes(kw)) return 'diplomatic'; }
  for (const kw of INSTABILITY_KEYWORDS) { if (lower.includes(kw)) return 'instability'; }
  for (const kw of ECONOMIC_KEYWORDS) { if (lower.includes(kw)) return 'economic'; }
  return 'conflict';
}

function findAffectedCountries(headline: string, countryScores: Map<string, number>): string[] {
  const found: string[] = [];
  const lower = headline.toLowerCase();

  for (const [code, country] of Object.entries(CURATED_COUNTRIES)) {
    for (const alias of country.searchAliases) {
      if (lower.includes(alias.toLowerCase())) {
        found.push(code);
        break;
      }
    }
  }

  return found.length > 0 ? found : Array.from(countryScores.entries())
    .filter(([, score]) => score >= 40)
    .map(([c]) => c)
    .slice(0, 3);
}

function findRelatedChokepoints(countryCodes: string[]): string[] {
  const related = new Set<string>();
  for (const cp of CHOKEPOINT_REGISTRY) {
    const cpRegions: string[] = [];
    for (const [region, codes] of REGIONAL_IMPACT) {
      if (region.includes(cp.displayName) || codes.includes(cp.id.replace('_', ' '))) {
        cpRegions.push(...codes);
      }
    }
    const overlap = countryCodes.some((c) => cpRegions.includes(c));
    if (overlap) related.add(cp.id);
  }
  return Array.from(related);
}

function assessSupplyChainImpact(
  category: RiskCategory,
  severity: RiskSeverity,
  countryCodes: string[],
  chokepointMonitors: ChokepointMonitor[],
): string {
  const impactParts: string[] = [];
  const relatedChokepoints = findRelatedChokepoints(countryCodes);
  const countryList = countryCodes.join(', ');

  if (category === 'maritime' || relatedChokepoints.length > 0) {
    for (const cpId of relatedChokepoints) {
      const monitor = chokepointMonitors.find((m) => m.id === cpId);
      if (monitor && monitor.riskScore >= 50) {
        impactParts.push(`${monitor.name} at risk (score: ${monitor.riskScore})`);
      }
    }
  }

  if (category === 'conflict' && severity !== 'low') {
    impactParts.push(`Shipping routes through ${countryList} may face disruption`);
    impactParts.push(`Port operations at risk of delay or closure`);
  }

  if (category === 'sanctions' || category === 'diplomatic') {
    impactParts.push(`Trade flows to/from ${countryList} may be restricted`);
    impactParts.push(`Commodity supply chain re-routing likely`);
  }

  if (category === 'economic') {
    impactParts.push(`Currency volatility affecting trade settlements`);
    impactParts.push(`Credit availability for trade finance may tighten`);
  }

  if (category === 'instability') {
    impactParts.push(`Labor disruption at ports and logistics hubs`);
    impactParts.push(`Inland transport corridors may be affected`);
  }

  const severityDesc: Record<RiskSeverity, string> = {
    low: 'Minimal supply chain impact expected',
    moderate: 'Moderate supply chain delays possible',
    elevated: 'Elevated risk of supply chain disruption',
    high: 'Major supply chain disruption likely',
    critical: 'Severe supply chain disruption imminent',
  };

  const primary = severityDesc[severity];
  const details = impactParts.slice(0, 3).join('; ');

  return details ? `${primary}. ${details}.` : `${primary}.`;
}

function extractCountryRisk(riskScores: CachedRiskScores | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!riskScores) return map;
  for (const score of riskScores.cii) {
    map.set(score.code, score.score);
  }
  return map;
}

function extractSanctionsRisk(sanctions: SanctionsPressureResult | null): Map<string, number> {
  const map = new Map<string, number>();
  if (!sanctions?.countries) return map;
  for (const c of sanctions.countries) {
    map.set(c.countryCode, c.entryCount);
  }
  return map;
}

// ─── Risk Item Builders ───────────────────────────────────────────────────────

interface IngestedNewsItem {
  title?: string;
  source?: string;
  timestamp?: string;
}

function buildRiskFromNews(
  items: IngestedNewsItem[],
  countryScores: Map<string, number>,
  chokepointMonitors: ChokepointMonitor[],
  sanctionsRisk: Map<string, number>,
): GeopoliticalRiskEvent[] {
  const events: GeopoliticalRiskEvent[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const headline = item.title || '';
    if (!headline || seen.has(headline)) continue;
    seen.add(headline);

    const lower = headline.toLowerCase();
    let keywordScore = 0;
    for (const kw of [...CONFLICT_KEYWORDS, ...DIPLOMATIC_KEYWORDS, ...INSTABILITY_KEYWORDS, ...MARITIME_KEYWORDS, ...ECONOMIC_KEYWORDS]) {
      if (lower.includes(kw)) keywordScore += 8;
    }
    if (keywordScore === 0) continue;

    const category = categorizeHeadline(headline);
    const affectedCountries = findAffectedCountries(headline, countryScores);
    if (affectedCountries.length === 0) continue;

    const regionRisk = affectedCountries.reduce((sum, c) => sum + (countryScores.get(c) ?? 20), 0) / affectedCountries.length;
    const sanctionFactor = affectedCountries.reduce((sum, c) => sum + (sanctionsRisk.get(c) ?? 0) * 3, 0) / Math.max(affectedCountries.length, 1);

    const severityScore = clamp(keywordScore * 1.5 + regionRisk * 0.3 + sanctionFactor * 0.2);
    const severity = severityFromScore(severityScore);
    if (severity === 'low') continue;

    const supplyChainImpact = assessSupplyChainImpact(category, severity, affectedCountries, chokepointMonitors);

    events.push({
      id: generateId(),
      event: headline,
      severity,
      affectedRegion: affectedCountries.join(', '),
      affectedCountryCodes: affectedCountries,
      confidence: clamp(keywordScore * 4 + 30),
      category,
      supplyChainImpact,
      source: item.source || 'news',
      timestamp: item.timestamp ? new Date(item.timestamp).getTime() : Date.now(),
      score: severityScore,
      relatedChokepoints: findRelatedChokepoints(affectedCountries),
    });
  }

  return events.sort((a, b) => b.score - a.score).slice(0, MAX_RISK_ITEMS);
}

function buildRiskFromChokepoints(
  monitors: ChokepointMonitor[],
): GeopoliticalRiskEvent[] {
  const events: GeopoliticalRiskEvent[] = [];

  for (const monitor of monitors) {
    if (monitor.riskScore < 40) continue;

    const severity = severityFromScore(monitor.riskScore);
    const evidence = monitor.evidence.filter(Boolean).join(' ');
    const supplyChainImpact = `Chokepoint ${monitor.name} at risk (${monitor.status}). ${evidence}`;
    const regionEntry = Array.from(REGIONAL_IMPACT.entries()).find(
      ([, codes]) => codes.includes(monitor.id.replace('_strait', '').replace('_', '').toUpperCase()),
    );
    const countryCodes = regionEntry?.[1] ?? [];

    events.push({
      id: `chokepoint-${monitor.id}`,
      event: `${monitor.name} chokepoint risk: ${monitor.status}`,
      severity,
      affectedRegion: monitor.name,
      affectedCountryCodes: countryCodes,
      confidence: monitor.confidenceScore,
      category: 'maritime',
      supplyChainImpact,
      source: 'ais-chokepoint',
      timestamp: Date.now(),
      score: monitor.riskScore,
      relatedChokepoints: [monitor.id],
    });
  }

  return events;
}

function buildRiskFromCountryScores(
  riskScores: CachedRiskScores | null,
  sanctions: SanctionsPressureResult | null,
): GeopoliticalRiskEvent[] {
  const events: GeopoliticalRiskEvent[] = [];
  if (!riskScores) return events;

  const sanctionsMap = new Map(sanctions?.countries?.map((c) => [c.countryCode, c.entryCount]) ?? []);

  for (const score of riskScores.cii) {
    if (score.score < 45) continue;

    const sanctionCount = sanctionsMap.get(score.code) ?? 0;
    const severity = severityFromScore(score.score);
    const category: RiskCategory = score.score >= 60 ? 'conflict' : 'instability';
    const supplyChainImpact = `Country risk score ${score.score}/100 in ${score.name}. ${sanctionCount > 0 ? `${sanctionCount} active sanctions entries. ` : ''}Trade and logistics operations may be affected.`;

    events.push({
      id: `country-risk-${score.code}`,
      event: `${score.name} geopolitical risk elevated (${score.score}/100)`,
      severity,
      affectedRegion: score.code,
      affectedCountryCodes: [score.code],
      confidence: clamp(score.score),
      category,
      supplyChainImpact,
      source: 'cii-score',
      timestamp: Date.now(),
      score: score.score,
      relatedChokepoints: findRelatedChokepoints([score.code]),
    });
  }

  return events;
}

function buildRiskFromSanctions(sanctions: SanctionsPressureResult | null): GeopoliticalRiskEvent[] {
  const events: GeopoliticalRiskEvent[] = [];
  if (!sanctions?.countries) return events;

  for (const country of sanctions.countries) {
    if (country.entryCount < 10) continue;
    const severity = severityFromScore(clamp(country.entryCount * 2));
    if (severity === 'low') continue;

    events.push({
      id: `sanctions-${country.countryCode}`,
      event: `${country.countryCode} sanctions pressure (${country.entryCount} entries)`,
      severity,
      affectedRegion: country.countryCode,
      affectedCountryCodes: [country.countryCode],
      confidence: clamp(country.entryCount * 3 + 30),
      category: 'sanctions',
      supplyChainImpact: `Trade with ${country.countryCode} restricted; sanctions compliance required; financial transactions may be blocked.`,
      source: 'sanctions-pressure',
      timestamp: Date.now(),
      score: clamp(country.entryCount * 2),
      relatedChokepoints: findRelatedChokepoints([country.countryCode]),
    });
  }

  return events;
}

// ─── Regional Summary ─────────────────────────────────────────────────────────

function buildRegionalSummary(events: GeopoliticalRiskEvent[]): RegionalRiskSummary[] {
  const byRegion = new Map<string, GeopoliticalRiskEvent[]>();

  for (const [region, codes] of REGIONAL_IMPACT) {
    const regionEvents = events.filter((e) =>
      e.affectedCountryCodes.some((c) => codes.includes(c)),
    );
    if (regionEvents.length > 0) {
      byRegion.set(region, regionEvents);
    }
  }

  return Array.from(byRegion.entries()).map(([region, regionEvents]) => {
    const maxScore = Math.max(...regionEvents.map((e) => e.score));
    return {
      region,
      countryCodes: REGIONAL_IMPACT.get(region) ?? [],
      maxSeverity: severityFromScore(maxScore),
      activeEvents: regionEvents.length,
      score: maxScore,
    };
  }).sort((a, b) => b.score - a.score);
}

// ─── Snapshot Builder ─────────────────────────────────────────────────────────

async function buildSnapshot(): Promise<GeopoliticalRiskSnapshot> {
  const [news, riskScores, sanctions, chokepointStatus] = await Promise.allSettled([
    fetchCategoryFeeds(INTEL_SOURCES, { batchSize: 3 }),
    fetchCachedRiskScores(),
    fetchSanctionsPressure(),
    fetchChokepointStatus(),
  ]);

  const countryScores = extractCountryRisk(
    riskScores.status === 'fulfilled' ? riskScores.value : null,
  );
  const sanctionsRisk = extractSanctionsRisk(
    sanctions.status === 'fulfilled' ? sanctions.value : null,
  );

  const cpData = chokepointStatus.status === 'fulfilled' ? chokepointStatus.value : null;
  const chokepointMonitors = buildChokepointMonitoring(cpData);

  const fromNews = buildRiskFromNews(
    (news.status === 'fulfilled' ? news.value : []) as IngestedNewsItem[],
    countryScores,
    chokepointMonitors,
    sanctionsRisk,
  );

  const fromChokepoints = buildRiskFromChokepoints(chokepointMonitors);
  const fromCountryScores = buildRiskFromCountryScores(
    riskScores.status === 'fulfilled' ? riskScores.value : null,
    sanctions.status === 'fulfilled' ? sanctions.value : null,
  );
  const fromSanctions = buildRiskFromSanctions(
    sanctions.status === 'fulfilled' ? sanctions.value : null,
  );

  const merged = [
    ...fromNews,
    ...fromChokepoints,
    ...fromCountryScores,
    ...fromSanctions,
  ];

  const seen = new Set<string>();
  const deduped = merged.filter((e) => {
    const key = `${e.category}-${e.affectedRegion}-${e.event.slice(0, 40)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const riskEvents = deduped
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RISK_ITEMS);

  return {
    fetchedAt: Date.now(),
    riskEvents,
    regionalSummary: buildRegionalSummary(riskEvents),
  };
}

// ─── Polling ──────────────────────────────────────────────────────────────────

async function poll(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const snapshot = await breaker.execute(
      async () => buildSnapshot(),
      {
        fetchedAt: 0,
        riskEvents: [],
        regionalSummary: [],
      },
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

export function initGeopoliticalRiskAgent(): void {
  startPolling();
}

export function disposeGeopoliticalRiskAgent(): void {
  stopPolling();
}

export async function fetchGeopoliticalRisks(
  force = false,
): Promise<GeopoliticalRiskSnapshot> {
  const now = Date.now();
  if (!force && lastSnapshot && now - lastFetchAt < CACHE_TTL_MS) {
    return lastSnapshot;
  }

  startPolling();

  if (inFlight) {
    return lastSnapshot ?? {
      fetchedAt: 0,
      riskEvents: [],
      regionalSummary: [],
    };
  }

  await poll();
  return lastSnapshot ?? {
    fetchedAt: 0,
    riskEvents: [],
    regionalSummary: [],
  };
}

export function getCachedRisks(): GeopoliticalRiskSnapshot | null {
  return lastSnapshot;
}

export function getRisksBySeverity(severity: RiskSeverity): GeopoliticalRiskEvent[] {
  return lastSnapshot?.riskEvents.filter((e) => e.severity === severity) ?? [];
}

export function getRisksByRegion(countryCode: string): GeopoliticalRiskEvent[] {
  return lastSnapshot?.riskEvents.filter((e) =>
    e.affectedCountryCodes.includes(countryCode),
  ) ?? [];
}

export function getRisksByCategory(category: RiskCategory): GeopoliticalRiskEvent[] {
  return lastSnapshot?.riskEvents.filter((e) => e.category === category) ?? [];
}

export function getRisksAffectingChokepoint(chokepointId: string): GeopoliticalRiskEvent[] {
  return lastSnapshot?.riskEvents.filter((e) =>
    e.relatedChokepoints.includes(chokepointId),
  ) ?? [];
}

export function getHighestRiskEvents(count = 10): GeopoliticalRiskEvent[] {
  return lastSnapshot?.riskEvents.slice(0, count) ?? [];
}

export function getRegionalRiskSummary(): RegionalRiskSummary[] {
  return lastSnapshot?.regionalSummary ?? [];
}

export function getRegionalMaxSeverity(region: string): RiskSeverity | null {
  return lastSnapshot?.regionalSummary.find((r) => r.region === region)?.maxSeverity ?? null;
}

export function isAgentActive(): boolean {
  return isPolling;
}

export function getAgentAge(): number {
  if (!lastFetchAt) return -1;
  return Date.now() - lastFetchAt;
}

export function isAgentStale(): boolean {
  const age = getAgentAge();
  return age < 0 || age > STALE_THRESHOLD_MS;
}
