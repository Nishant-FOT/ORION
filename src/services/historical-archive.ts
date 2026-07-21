// ============================================================================
// Historical Intelligence Archive Service
// Institutional memory for ORION — stores, indexes, searches, and replays
// every signal, recommendation, decision, and outcome.
// ============================================================================

export type ArchiveEventType =
  | 'news'
  | 'intelligence_signal'
  | 'commodity_price'
  | 'ais_vessel'
  | 'shipping_route'
  | 'port_congestion'
  | 'chokepoint_risk'
  | 'country_instability'
  | 'supplier_risk'
  | 'procurement_recommendation'
  | 'scenario_simulation'
  | 'executive_alert'
  | 'ai_insight'
  | 'risk_model_output'
  | 'user_decision'
  | 'executive_report';

export type ArchiveRiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ArchiveSignalType = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface ArchiveEvent {
  id: string;
  type: ArchiveEventType;
  timestamp: number;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  country?: string;
  region?: string;
  supplier?: string;
  corridor?: string;
  chokepoint?: string;
  port?: string;
  vessel?: string;
  commodity?: string;
  signalType: ArchiveSignalType;
  riskLevel: ArchiveRiskLevel;
  confidence: number;
  tags: string[];
  keywords: string[];
  metadata: Record<string, unknown>;
}

export interface ArchiveScenario {
  id: string;
  name: string;
  description: string;
  startTimestamp: number;
  endTimestamp: number;
  events: ArchiveEvent[];
  riskModelVersion: string;
  predictedOutcome: string;
  actualOutcome?: string;
  accuracy?: number;
}

export interface ArchiveDecisionRecord {
  id: string;
  eventId: string;
  timestamp: number;
  triggeringEvent: string;
  supportingEvidence: string[];
  riskModelVersion: string;
  confidenceScore: number;
  recommendationGenerated: string;
  userDecision?: string;
  finalOutcome?: string;
  accuracy?: number;
  leadTimeMs?: number;
}

export interface ArchiveSearchFilter {
  dateFrom?: number;
  dateTo?: number;
  country?: string;
  region?: string;
  supplier?: string;
  corridor?: string;
  chokepoint?: string;
  port?: string;
  vessel?: string;
  commodity?: string;
  source?: string;
  signalType?: ArchiveSignalType;
  riskLevel?: ArchiveRiskLevel;
  confidenceMin?: number;
  confidenceMax?: number;
  eventType?: ArchiveEventType;
  tags?: string[];
  keywords?: string[];
  query?: string;
}

export interface ArchiveSearchResult {
  events: ArchiveEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ArchiveStats {
  totalEvents: number;
  eventsByType: Record<ArchiveEventType, number>;
  eventsByRisk: Record<ArchiveRiskLevel, number>;
  eventsByCountry: Record<string, number>;
  oldestEvent?: number;
  newestEvent?: number;
  dateRange: { from: number; to: number };
}

export interface BeforeAfterComparison {
  before: ArchiveStats;
  after: ArchiveStats;
  changedMetrics: {
    label: string;
    beforeValue: number | string;
    afterValue: number | string;
    delta: string;
    direction: 'up' | 'down' | 'same';
  }[];
  narrative: string;
}

export interface RetrospectiveReport {
  scenarioId: string;
  scenarioName: string;
  whatHappened: string;
  firstSignals: { event: ArchiveEvent; timeDeltaMs: number }[];
  earliestIndicators: string[];
  predictionAccuracy: number;
  recommendationEffectiveness: number;
  actionsToMinimizeDisruption: string[];
  mostAffectedSuppliers: string[];
  lessonsLearned: string[];
  generatedAt: number;
}

export interface PatternMatch {
  patternId: string;
  description: string;
  matchingEvents: ArchiveEvent[];
  similarity: number;
  statisticalSignificance: number;
  recurrenceCount: number;
}

// ============================================================================
// localStorage persistence
// ============================================================================

const ARCHIVE_STORAGE_KEY = 'orion-historical-archive';
const DECISIONS_STORAGE_KEY = 'orion-historical-decisions';
const SCENARIOS_STORAGE_KEY = 'orion-historical-scenarios';
const RETENTION_STORAGE_KEY = 'orion-archive-retention';
const MAX_EVENTS = 10_000;
const DEFAULT_RETENTION_DAYS = 365;

interface ArchiveStore {
  events: ArchiveEvent[];
  version: number;
}

function loadStore(): ArchiveStore {
  try {
    const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!raw) return { events: [], version: 1 };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { events: parsed, version: 1 };
    return { events: parsed.events ?? [], version: parsed.version ?? 1 };
  } catch {
    return { events: [], version: 1 };
  }
}

function saveStore(store: ArchiveStore): void {
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('[HistoricalArchive] Failed to save store:', err);
  }
}

function loadDecisions(): ArchiveDecisionRecord[] {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDecisions(decisions: ArchiveDecisionRecord[]): void {
  try {
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(decisions));
  } catch (err) {
    console.warn('[HistoricalArchive] Failed to save decisions:', err);
  }
}

function loadScenarios(): ArchiveScenario[] {
  try {
    const raw = localStorage.getItem(SCENARIOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScenarios(scenarios: ArchiveScenario[]): void {
  try {
    localStorage.setItem(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios));
  } catch (err) {
    console.warn('[HistoricalArchive] Failed to save scenarios:', err);
  }
}

// ============================================================================
// Retention Policy
// ============================================================================

export function getRetentionDays(): number {
  try {
    const raw = localStorage.getItem(RETENTION_STORAGE_KEY);
    return raw ? Number.parseInt(raw, 10) : DEFAULT_RETENTION_DAYS;
  } catch {
    return DEFAULT_RETENTION_DAYS;
  }
}

export function setRetentionDays(days: number): void {
  localStorage.setItem(RETENTION_STORAGE_KEY, String(Math.max(30, days)));
}

// ============================================================================
// Event CRUD
// ============================================================================

let _eventCounter = 0;

function generateEventId(): string {
  _eventCounter += 1;
  return `arch-${Date.now()}-${_eventCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

export function archiveEvent(
  event: Omit<ArchiveEvent, 'id'>,
): ArchiveEvent {
  const store = loadStore();
  const record: ArchiveEvent = { ...event, id: generateEventId() };
  store.events.push(record);
  enforceRetentionPolicy(store);
  enforceMaxEvents(store);
  saveStore(store);
  return record;
}

export function archiveEvents(
  events: Omit<ArchiveEvent, 'id'>[],
): ArchiveEvent[] {
  const store = loadStore();
  const records: ArchiveEvent[] = events.map((e) => ({
    ...e,
    id: generateEventId(),
  }));
  store.events.push(...records);
  enforceRetentionPolicy(store);
  enforceMaxEvents(store);
  saveStore(store);
  return records;
}

export function getEvent(id: string): ArchiveEvent | undefined {
  return loadStore().events.find((e) => e.id === id);
}

export function getAllEvents(): ArchiveEvent[] {
  return loadStore().events;
}

export function getEventsByType(type: ArchiveEventType): ArchiveEvent[] {
  return loadStore().events.filter((e) => e.type === type);
}

export function getEventsByCountry(country: string): ArchiveEvent[] {
  const lower = country.toLowerCase();
  return loadStore().events.filter(
    (e) => e.country?.toLowerCase() === lower,
  );
}

export function getEventsByDateRange(
  from: number,
  to: number,
): ArchiveEvent[] {
  return loadStore().events.filter(
    (e) => e.timestamp >= from && e.timestamp <= to,
  );
}

export function deleteEvent(id: string): boolean {
  const store = loadStore();
  const idx = store.events.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.events.splice(idx, 1);
  saveStore(store);
  return true;
}

export function clearArchive(): void {
  saveStore({ events: [], version: 1 });
  saveDecisions([]);
  saveScenarios([]);
}

// ============================================================================
// Live Data Ingestion
// ============================================================================

type IngestibleItem = {
  source: string;
  title: string;
  link?: string;
  pubDate?: Date;
  snippet?: string;
  isAlert?: boolean;
  importanceScore?: number;
  threat?: { level: string; category: string; confidence: number; source: string };
  locationName?: string;
};

export function ingestNewsItems(items: IngestibleItem[]): number {
  if (items.length === 0) return 0;
  const store = loadStore();
  const existingTitles = new Set(store.events.map((e) => e.title));
  let added = 0;

  for (const item of items) {
    if (existingTitles.has(item.title)) continue;
    const ts = item.pubDate?.getTime?.() ?? Date.now();
    const riskMap: Record<string, ArchiveRiskLevel> = {
      critical: 'critical', high: 'high', medium: 'medium', low: 'low', info: 'info',
    };
    const riskLevel = riskMap[item.threat?.level ?? ''] ?? (item.isAlert ? 'high' : 'info');
    const signalType: ArchiveSignalType = riskLevel === 'critical' || riskLevel === 'high'
      ? 'negative'
      : riskLevel === 'low' ? 'positive' : 'neutral';

    store.events.push({
      id: generateEventId(),
      type: 'news',
      timestamp: ts,
      title: item.title,
      summary: item.snippet ?? item.title,
      source: item.source,
      sourceUrl: item.link,
      country: item.locationName,
      signalType,
      riskLevel,
      confidence: item.threat?.confidence ?? item.importanceScore ?? 0.5,
      tags: [item.threat?.category ?? 'news', item.source.toLowerCase()],
      keywords: item.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      metadata: { category: item.threat?.category },
    });
    existingTitles.add(item.title);
    added++;
  }

  if (added > 0) {
    enforceRetentionPolicy(store);
    enforceMaxEvents(store);
    saveStore(store);
  }
  return added;
}

export function ingestIntelligenceSignals(signals: Array<{
  title: string;
  summary: string;
  source: string;
  timestamp: number;
  riskLevel?: string;
  signalType?: string;
  confidence?: number;
  country?: string;
  tags?: string[];
}>): number {
  if (signals.length === 0) return 0;
  const store = loadStore();
  const existingTitles = new Set(store.events.map((e) => e.title));
  let added = 0;

  for (const sig of signals) {
    if (existingTitles.has(sig.title)) continue;
    const riskMap: Record<string, ArchiveRiskLevel> = {
      critical: 'critical', high: 'high', medium: 'medium', low: 'low', info: 'info',
    };

    store.events.push({
      id: generateEventId(),
      type: 'intelligence_signal',
      timestamp: sig.timestamp,
      title: sig.title,
      summary: sig.summary,
      source: sig.source,
      country: sig.country,
      signalType: (sig.signalType as ArchiveSignalType) ?? 'neutral',
      riskLevel: riskMap[sig.riskLevel ?? ''] ?? 'medium',
      confidence: sig.confidence ?? 0.6,
      tags: sig.tags ?? ['intelligence'],
      keywords: sig.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      metadata: {},
    });
    existingTitles.add(sig.title);
    added++;
  }

  if (added > 0) {
    enforceRetentionPolicy(store);
    enforceMaxEvents(store);
    saveStore(store);
  }
  return added;
}

export function ingestMarketData(data: Array<{
  symbol: string;
  name: string;
  price: number;
  change?: number;
  changePercent?: number;
  commodity?: boolean;
}>): number {
  if (data.length === 0) return 0;
  const store = loadStore();
  const now = Date.now();
  let added = 0;

  for (const d of data) {
    const isNegative = (d.changePercent ?? 0) < -2;
    const isPositive = (d.changePercent ?? 0) > 2;

    store.events.push({
      id: generateEventId(),
      type: 'commodity_price',
      timestamp: now,
      title: `${d.name} (${d.symbol}): $${d.price.toFixed(2)}${d.changePercent != null ? ` (${d.changePercent >= 0 ? '+' : ''}${d.changePercent.toFixed(2)}%)` : ''}`,
      summary: `${d.name} trading at $${d.price.toFixed(2)}. ${d.changePercent != null ? `${d.changePercent >= 0 ? 'Up' : 'Down'} ${Math.abs(d.changePercent).toFixed(2)}%` : 'No change data'}.`,
      source: 'ORION Market Data',
      commodity: d.commodity ? d.name : undefined,
      signalType: isNegative ? 'negative' : isPositive ? 'positive' : 'neutral',
      riskLevel: Math.abs(d.changePercent ?? 0) > 5 ? 'high' : Math.abs(d.changePercent ?? 0) > 2 ? 'medium' : 'low',
      confidence: 0.95,
      tags: ['market', d.commodity ? 'commodity' : 'equity'],
      keywords: [d.symbol.toLowerCase(), d.name.toLowerCase()],
      metadata: { price: d.price, change: d.change, changePercent: d.changePercent },
    });
    added++;
  }

  if (added > 0) {
    enforceRetentionPolicy(store);
    enforceMaxEvents(store);
    saveStore(store);
  }
  return added;
}

export function ingestCrossSourceSignals(signals: Array<{
  title: string;
  description: string;
  source: string;
  timestamp: number;
  severity?: string;
  type?: string;
  country?: string;
  tags?: string[];
}>): number {
  if (signals.length === 0) return 0;
  const store = loadStore();
  const existingTitles = new Set(store.events.map((e) => e.title));
  let added = 0;

  for (const sig of signals) {
    if (existingTitles.has(sig.title)) continue;
    const riskMap: Record<string, ArchiveRiskLevel> = {
      critical: 'critical', high: 'high', medium: 'medium', low: 'low', info: 'info',
    };

    store.events.push({
      id: generateEventId(),
      type: 'ai_insight',
      timestamp: sig.timestamp,
      title: sig.title,
      summary: sig.description,
      source: sig.source,
      country: sig.country,
      signalType: sig.severity === 'high' || sig.severity === 'critical' ? 'negative' : 'mixed',
      riskLevel: riskMap[sig.severity ?? ''] ?? 'medium',
      confidence: 0.7,
      tags: sig.tags ?? ['cross-source', sig.type ?? 'signal'],
      keywords: sig.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
      metadata: { type: sig.type },
    });
    existingTitles.add(sig.title);
    added++;
  }

  if (added > 0) {
    enforceRetentionPolicy(store);
    enforceMaxEvents(store);
    saveStore(store);
  }
  return added;
}

export function ingestVesselData(vessels: Array<{
  vessel: string;
  lat: number;
  lon: number;
  type?: string;
  flag?: string;
  status?: string;
  corridor?: string;
}>): number {
  if (vessels.length === 0) return 0;
  const store = loadStore();
  const now = Date.now();
  let added = 0;

  for (const v of vessels) {
    if (!v.corridor) continue;
    store.events.push({
      id: generateEventId(),
      type: 'ais_vessel',
      timestamp: now,
      title: `Vessel ${v.vessel} (${v.type ?? 'unknown'}) in ${v.corridor}`,
      summary: `${v.flag ?? 'Unknown'} vessel "${v.vessel}" detected at ${v.lat.toFixed(2)}°N, ${v.lon.toFixed(2)}°E via AIS. Status: ${v.status ?? 'underway'}.`,
      source: 'ORION AIS',
      vessel: v.vessel,
      corridor: v.corridor,
      signalType: 'neutral',
      riskLevel: 'info',
      confidence: 0.85,
      tags: ['ais', 'vessel', v.corridor.toLowerCase()],
      keywords: [v.vessel.toLowerCase(), v.corridor.toLowerCase()],
      metadata: { lat: v.lat, lon: v.lon, type: v.type, flag: v.flag, status: v.status },
    });
    added++;
  }

  if (added > 0) {
    enforceRetentionPolicy(store);
    enforceMaxEvents(store);
    saveStore(store);
  }
  return added;
}

// ============================================================================
// Retention & Limits
// ============================================================================

function enforceRetentionPolicy(store: ArchiveStore): void {
  const retentionMs = getRetentionDays() * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  store.events = store.events.filter((e) => e.timestamp >= cutoff);
}

function enforceMaxEvents(store: ArchiveStore): void {
  if (store.events.length > MAX_EVENTS) {
    store.events = store.events.slice(-MAX_EVENTS);
  }
}

// ============================================================================
// Search
// ============================================================================

export function searchEvents(
  filter: ArchiveSearchFilter,
  page = 1,
  pageSize = 50,
): ArchiveSearchResult {
  let results = loadStore().events;

  if (filter.dateFrom != null) {
    results = results.filter((e) => e.timestamp >= filter.dateFrom!);
  }
  if (filter.dateTo != null) {
    results = results.filter((e) => e.timestamp <= filter.dateTo!);
  }
  if (filter.country) {
    const lower = filter.country.toLowerCase();
    results = results.filter(
      (e) => e.country?.toLowerCase().includes(lower),
    );
  }
  if (filter.region) {
    const lower = filter.region.toLowerCase();
    results = results.filter(
      (e) => e.region?.toLowerCase().includes(lower),
    );
  }
  if (filter.supplier) {
    const lower = filter.supplier.toLowerCase();
    results = results.filter(
      (e) => e.supplier?.toLowerCase().includes(lower),
    );
  }
  if (filter.corridor) {
    const lower = filter.corridor.toLowerCase();
    results = results.filter(
      (e) => e.corridor?.toLowerCase().includes(lower),
    );
  }
  if (filter.chokepoint) {
    const lower = filter.chokepoint.toLowerCase();
    results = results.filter(
      (e) => e.chokepoint?.toLowerCase().includes(lower),
    );
  }
  if (filter.port) {
    const lower = filter.port.toLowerCase();
    results = results.filter(
      (e) => e.port?.toLowerCase().includes(lower),
    );
  }
  if (filter.vessel) {
    const lower = filter.vessel.toLowerCase();
    results = results.filter(
      (e) => e.vessel?.toLowerCase().includes(lower),
    );
  }
  if (filter.commodity) {
    const lower = filter.commodity.toLowerCase();
    results = results.filter(
      (e) => e.commodity?.toLowerCase().includes(lower),
    );
  }
  if (filter.source) {
    const lower = filter.source.toLowerCase();
    results = results.filter(
      (e) => e.source?.toLowerCase().includes(lower),
    );
  }
  if (filter.signalType) {
    results = results.filter((e) => e.signalType === filter.signalType);
  }
  if (filter.riskLevel) {
    results = results.filter((e) => e.riskLevel === filter.riskLevel);
  }
  if (filter.confidenceMin != null) {
    results = results.filter((e) => e.confidence >= filter.confidenceMin!);
  }
  if (filter.confidenceMax != null) {
    results = results.filter((e) => e.confidence <= filter.confidenceMax!);
  }
  if (filter.eventType) {
    results = results.filter((e) => e.type === filter.eventType);
  }
  if (filter.tags && filter.tags.length > 0) {
    const tagSet = new Set(filter.tags.map((t) => t.toLowerCase()));
    results = results.filter((e) =>
      e.tags.some((t) => tagSet.has(t.toLowerCase())),
    );
  }
  if (filter.keywords && filter.keywords.length > 0) {
    const kwSet = new Set(filter.keywords.map((k) => k.toLowerCase()));
    results = results.filter((e) =>
      e.keywords.some((k) => kwSet.has(k.toLowerCase())),
    );
  }
  if (filter.query) {
    const q = filter.query.toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.source.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q)) ||
        e.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }

  results.sort((a, b) => b.timestamp - a.timestamp);
  const total = results.length;
  const start = (page - 1) * pageSize;
  const events = results.slice(start, start + pageSize);

  return { events, total, page, pageSize };
}

// ============================================================================
// Full-Text Semantic Search
// ============================================================================

export function semanticSearch(query: string): ArchiveEvent[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (terms.length === 0) return [];

  const store = loadStore();
  const scored: { event: ArchiveEvent; score: number }[] = [];

  for (const event of store.events) {
    let score = 0;
    const titleLower = event.title.toLowerCase();
    const summaryLower = event.summary.toLowerCase();

    for (const term of terms) {
      if (titleLower.includes(term)) score += 3;
      if (summaryLower.includes(term)) score += 1;
      if (event.tags.some((t) => t.toLowerCase().includes(term))) score += 2;
      if (event.keywords.some((k) => k.toLowerCase().includes(term))) score += 2;
      if (event.country?.toLowerCase().includes(term)) score += 2;
      if (event.commodity?.toLowerCase().includes(term)) score += 1;
      if (event.corridor?.toLowerCase().includes(term)) score += 1;
    }

    if (score > 0) {
      scored.push({ event, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 100).map((s) => s.event);
}

// ============================================================================
// Statistics
// ============================================================================

export function getArchiveStats(): ArchiveStats {
  const events = loadStore().events;
  const eventsByType = {} as Record<ArchiveEventType, number>;
  const eventsByRisk = {} as Record<ArchiveRiskLevel, number>;
  const eventsByCountry: Record<string, number> = {};

  for (const e of events) {
    eventsByType[e.type] = (eventsByType[e.type] ?? 0) + 1;
    eventsByRisk[e.riskLevel] = (eventsByRisk[e.riskLevel] ?? 0) + 1;
    if (e.country) {
      eventsByCountry[e.country] = (eventsByCountry[e.country] ?? 0) + 1;
    }
  }

  const timestamps = events.map((e) => e.timestamp).sort((a, b) => a - b);
  const oldest = timestamps[0];
  const newest = timestamps[timestamps.length - 1];

  return {
    totalEvents: events.length,
    eventsByType,
    eventsByRisk,
    eventsByCountry,
    oldestEvent: oldest,
    newestEvent: newest,
    dateRange: {
      from: oldest ?? Date.now(),
      to: newest ?? Date.now(),
    },
  };
}

// ============================================================================
// Decision Audit Trail
// ============================================================================

export function recordDecision(
  decision: Omit<ArchiveDecisionRecord, 'id'>,
): ArchiveDecisionRecord {
  const decisions = loadDecisions();
  const record: ArchiveDecisionRecord = {
    ...decision,
    id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  decisions.push(record);
  saveDecisions(decisions);
  return record;
}

export function getDecisions(): ArchiveDecisionRecord[] {
  return loadDecisions();
}

export function getDecisionByEventId(
  eventId: string,
): ArchiveDecisionRecord | undefined {
  return loadDecisions().find((d) => d.eventId === eventId);
}

export function updateDecision(
  id: string,
  updates: Partial<Omit<ArchiveDecisionRecord, 'id'>>,
): ArchiveDecisionRecord | null {
  const decisions = loadDecisions();
  const idx = decisions.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  const existing = decisions[idx]!;
  decisions[idx] = { ...existing, ...updates, id: existing.id };
  saveDecisions(decisions);
  return decisions[idx];
}

// ============================================================================
// Scenario Management
// ============================================================================

export function saveScenario(
  scenario: Omit<ArchiveScenario, 'id'>,
): ArchiveScenario {
  const scenarios = loadScenarios();
  const record: ArchiveScenario = {
    ...scenario,
    id: `scn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };
  scenarios.push(record);
  saveScenarios(scenarios);
  return record;
}

export function getScenarios(): ArchiveScenario[] {
  return loadScenarios();
}

export function getScenario(id: string): ArchiveScenario | undefined {
  return loadScenarios().find((s) => s.id === id);
}

export function updateScenario(
  id: string,
  updates: Partial<Omit<ArchiveScenario, 'id'>>,
): ArchiveScenario | null {
  const scenarios = loadScenarios();
  const idx = scenarios.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const existing = scenarios[idx]!;
  scenarios[idx] = { ...existing, ...updates, id: existing.id };
  saveScenarios(scenarios);
  return scenarios[idx];
}

// ============================================================================
// Before vs After Comparison
// ============================================================================

export function compareTimestamps(
  beforeTs: number,
  afterTs: number,
): BeforeAfterComparison {
  const beforeEvents = getEventsByDateRange(0, beforeTs);
  const afterEvents = getEventsByDateRange(0, afterTs);

  const beforeStats = computeStatsSnapshot(beforeEvents);
  const afterStats = computeStatsSnapshot(afterEvents);

  const changedMetrics: BeforeAfterComparison['changedMetrics'] = [];

  const metrics: { label: string; extractor: (s: ReturnType<typeof computeStatsSnapshot>) => number | string }[] = [
    { label: 'Total Events', extractor: (s) => s.total },
    { label: 'Critical Risks', extractor: (s) => s.critical },
    { label: 'High Risks', extractor: (s) => s.high },
    { label: 'Active Countries', extractor: (s) => s.countries },
    { label: 'Avg Confidence', extractor: (s) => s.avgConfidence },
    { label: 'Negative Signals', extractor: (s) => s.negative },
  ];

  for (const m of metrics) {
    const bv = m.extractor(beforeStats);
    const av = m.extractor(afterStats);
    const bNum = typeof bv === 'number' ? bv : parseFloat(String(bv)) || 0;
    const aNum = typeof av === 'number' ? av : parseFloat(String(av)) || 0;
    const delta = aNum - bNum;
    changedMetrics.push({
      label: m.label,
      beforeValue: bv,
      afterValue: av,
      delta: delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1),
      direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
    });
  }

  const narrative = buildComparisonNarrative(changedMetrics);

  return { before: beforeStats, after: afterStats, changedMetrics, narrative };
}

function computeStatsSnapshot(events: ArchiveEvent[]) {
  const countries = new Set(events.map((e) => e.country).filter(Boolean));
  let totalConfidence = 0;
  let critical = 0;
  let high = 0;
  let negative = 0;

  for (const e of events) {
    totalConfidence += e.confidence;
    if (e.riskLevel === 'critical') critical++;
    if (e.riskLevel === 'high') high++;
    if (e.signalType === 'negative') negative++;
  }

  const eventsByType = {} as Record<ArchiveEventType, number>;
  const eventsByRisk = {} as Record<ArchiveRiskLevel, number>;
  const eventsByCountry: Record<string, number> = {};
  for (const e of events) {
    eventsByType[e.type] = (eventsByType[e.type] ?? 0) + 1;
    eventsByRisk[e.riskLevel] = (eventsByRisk[e.riskLevel] ?? 0) + 1;
    if (e.country) eventsByCountry[e.country] = (eventsByCountry[e.country] ?? 0) + 1;
  }

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  return {
    totalEvents: events.length,
    total: events.length,
    critical,
    high,
    countries: countries.size,
    avgConfidence: events.length > 0 ? totalConfidence / events.length : 0,
    negative,
    eventsByType,
    eventsByRisk,
    eventsByCountry,
    oldestEvent: firstEvent?.timestamp,
    newestEvent: lastEvent?.timestamp,
    dateRange: {
      from: firstEvent?.timestamp ?? Date.now(),
      to: lastEvent?.timestamp ?? Date.now(),
    },
  };
}

function buildComparisonNarrative(
  metrics: BeforeAfterComparison['changedMetrics'],
): string {
  const parts: string[] = [];
  for (const m of metrics) {
    if (m.direction === 'same') continue;
    const verb = m.direction === 'up' ? 'increased' : 'decreased';
    parts.push(`${m.label} ${verb} from ${m.beforeValue} to ${m.afterValue} (${m.delta}).`);
  }
  return parts.length > 0
    ? `Between the two timestamps: ${parts.join(' ')}`
    : 'No significant changes detected between the two timestamps.';
}

// ============================================================================
// AI Retrospective Analysis
// ============================================================================

export function generateRetrospective(
  scenarioId: string,
): RetrospectiveReport | null {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;

  const events = scenario.events.sort((a, b) => a.timestamp - b.timestamp);
  const firstEventTs = events[0]?.timestamp ?? 0;
  const firstSignals = events.slice(0, 5).map((e, i) => ({
    event: e,
    timeDeltaMs: i === 0 ? 0 : e.timestamp - firstEventTs,
  }));

  const earliestIndicators = [
    ...new Set(firstSignals.map((s) => s.event.type)),
  ];

  const suppliers = events
    .map((e) => e.supplier)
    .filter(Boolean) as string[];
  const supplierCounts: Record<string, number> = {};
  for (const s of suppliers) {
    supplierCounts[s] = (supplierCounts[s] ?? 0) + 1;
  }
  const mostAffectedSuppliers = Object.entries(supplierCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name]) => name);

  const decisions = loadDecisions().filter((d) =>
    events.some((e) => e.id === d.eventId),
  );
  const effectiveDecisions = decisions.filter(
    (d) => d.accuracy != null && d.accuracy > 0.5,
  );
  const recommendationEffectiveness =
    decisions.length > 0
      ? effectiveDecisions.length / decisions.length
      : 0;

  const predictionAccuracy = scenario.accuracy ?? 0.5;

  const lessonsLearned: string[] = [];
  if (predictionAccuracy < 0.5) {
    lessonsLearned.push(
      'Model predictions were less than 50% accurate — review feature selection and training data.',
    );
  }
  if (firstSignals.length > 0 && firstSignals[0]!.event.riskLevel === 'low') {
    lessonsLearned.push(
      'Early signals were classified as low risk — consider lowering alert thresholds for similar event types.',
    );
  }
  if (recommendationEffectiveness < 0.5) {
    lessonsLearned.push(
      'Less than half of recommendations led to effective outcomes — review recommendation logic.',
    );
  }
  if (lessonsLearned.length === 0) {
    lessonsLearned.push(
      'System performed within expected parameters for this scenario.',
    );
  }

  return {
    scenarioId,
    scenarioName: scenario.name,
    whatHappened: scenario.description,
    firstSignals,
    earliestIndicators,
    predictionAccuracy,
    recommendationEffectiveness,
    actionsToMinimizeDisruption: [
      'Diversify supply sources before peak risk periods.',
      'Pre-position inventory at alternative ports.',
      'Activate backup shipping corridors early.',
    ],
    mostAffectedSuppliers,
    lessonsLearned,
    generatedAt: Date.now(),
  };
}

// ============================================================================
// Pattern Discovery
// ============================================================================

export function findPatternMatches(
  description: string,
): PatternMatch[] {
  const terms = description
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  const events = loadStore().events;
  const matches: PatternMatch[] = [];

  const keywordGroups: Record<string, ArchiveEvent[]> = {};
  for (const event of events) {
    for (const kw of event.keywords) {
      const key = kw.toLowerCase();
      if (!keywordGroups[key]) keywordGroups[key] = [];
      keywordGroups[key]!.push(event);
    }
  }

  for (const term of terms) {
    const matchingEvents = events.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term) ||
        e.keywords.some((k) => k.toLowerCase().includes(term)) ||
        e.tags.some((t) => t.toLowerCase().includes(term)),
    );

    if (matchingEvents.length >= 2) {
      const similarity = Math.min(
        1,
        matchingEvents.length / Math.max(events.length * 0.1, 1),
      );
      matches.push({
        patternId: `pat-${term.replace(/\s+/g, '-')}`,
        description: `Events related to "${term}"`,
        matchingEvents: matchingEvents.slice(0, 20),
        similarity,
        statisticalSignificance: Math.min(
          1,
          matchingEvents.length / 10,
        ),
        recurrenceCount: matchingEvents.length,
      });
    }
  }

  matches.sort((a, b) => b.similarity - a.similarity);
  return matches.slice(0, 10);
}

// ============================================================================
// Timeline Generation
// ============================================================================

export interface TimelineEntry {
  timestamp: number;
  type: ArchiveEventType;
  title: string;
  riskLevel: ArchiveRiskLevel;
  signalType: ArchiveSignalType;
  source: string;
  eventId: string;
}

export function generateTimeline(
  from?: number,
  to?: number,
): TimelineEntry[] {
  let events = loadStore().events;
  if (from != null) events = events.filter((e) => e.timestamp >= from);
  if (to != null) events = events.filter((e) => e.timestamp <= to);

  return events
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => ({
      timestamp: e.timestamp,
      type: e.type,
      title: e.title,
      riskLevel: e.riskLevel,
      signalType: e.signalType,
      source: e.source,
      eventId: e.id,
    }));
}

// ============================================================================
// Export Helpers
// ============================================================================

export function exportAsCSV(events: ArchiveEvent[]): string {
  const headers = [
    'ID',
    'Type',
    'Timestamp',
    'Title',
    'Summary',
    'Source',
    'Country',
    'Region',
    'Risk Level',
    'Signal Type',
    'Confidence',
    'Tags',
    'Keywords',
  ];
  const rows = events.map((e) => [
    e.id,
    e.type,
    new Date(e.timestamp).toISOString(),
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.summary.replace(/"/g, '""')}"`,
    `"${e.source.replace(/"/g, '""')}"`,
    e.country ?? '',
    e.region ?? '',
    e.riskLevel,
    e.signalType,
    String(e.confidence),
    `"${e.tags.join('; ')}"`,
    `"${e.keywords.join('; ')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportAsJSON(events: ArchiveEvent[]): string {
  return JSON.stringify(events, null, 2);
}

// ============================================================================
// Seed Demo Data
// ============================================================================

export function seedDemoArchive(): void {
  seedDemoScenarios();
  const store = loadStore();
  if (store.events.length > 0) return;

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const demoEvents: Omit<ArchiveEvent, 'id'>[] = [
    {
      type: 'news',
      timestamp: now - 30 * DAY,
      title: 'Iran-US Naval Confrontation in Strait of Hormuz',
      summary: 'Two Iranian fast boats approached a US destroyer in the Strait of Hormuz, triggering a heightened alert status across the Persian Gulf.',
      source: 'Reuters',
      country: 'Iran',
      region: 'Middle East',
      corridor: 'Strait of Hormuz',
      chokepoint: 'Hormuz',
      signalType: 'negative',
      riskLevel: 'critical',
      confidence: 0.92,
      tags: ['hormuz', 'iran', 'military', 'naval'],
      keywords: ['iran', 'hormuz', 'naval', 'confrontation', 'strait'],
      metadata: {},
    },
    {
      type: 'chokepoint_risk',
      timestamp: now - 29 * DAY,
      title: 'Hormuz Chokepoint Risk Elevated to Critical',
      summary: 'Risk score for Strait of Hormuz increased to 9.2/10 following naval confrontation. Insurance premiums surged 40%.',
      source: 'ORION Risk Model',
      country: 'Iran',
      region: 'Middle East',
      chokepoint: 'Hormuz',
      signalType: 'negative',
      riskLevel: 'critical',
      confidence: 0.95,
      tags: ['hormuz', 'risk', 'insurance'],
      keywords: ['hormuz', 'risk', 'insurance', 'premium'],
      metadata: { riskScore: 9.2, insuranceDelta: 0.4 },
    },
    {
      type: 'commodity_price',
      timestamp: now - 28 * DAY,
      title: 'Brent Crude Surges Past $95 on Hormuz Tensions',
      summary: 'Brent crude oil jumped 8% to $95.40/bbl as Hormuz chokepoint risk rattled global energy markets.',
      source: 'Bloomberg',
      country: 'Global',
      region: 'Global',
      commodity: 'Crude Oil',
      signalType: 'negative',
      riskLevel: 'high',
      confidence: 0.98,
      tags: ['oil', 'brent', 'commodity'],
      keywords: ['brent', 'crude', 'oil', 'price', 'surge'],
      metadata: { price: 95.4, change: 0.08 },
    },
    {
      type: 'ais_vessel',
      timestamp: now - 27 * DAY,
      title: 'Vessel Rerouting Detected — Tankers Avoid Hormuz',
      summary: 'AIS data shows 12 VLCCs rerouted around Cape of Good Hope, adding 10-14 days to transit times.',
      source: 'ORION AIS Intelligence',
      corridor: 'Cape of Good Hope',
      chokepoint: 'Hormuz',
      signalType: 'negative',
      riskLevel: 'high',
      confidence: 0.88,
      tags: ['ais', 'vessel', 'rerouting', 'tanker'],
      keywords: ['vlcc', 'reroute', 'tanker', 'hormuz', 'cape'],
      metadata: { vesselsRerouted: 12, extraDays: 12 },
    },
    {
      type: 'procurement_recommendation',
      timestamp: now - 26 * DAY,
      title: 'ORION Recommends Forward Contracting 90-Day Supply',
      summary: 'Based on escalating Hormuz risk, ORION recommends locking in forward contracts for 90-day crude supply at current prices.',
      source: 'ORION Procurement Advisor',
      signalType: 'mixed',
      riskLevel: 'medium',
      confidence: 0.82,
      tags: ['procurement', 'recommendation', 'forward'],
      keywords: ['procurement', 'forward', 'contract', 'supply'],
      metadata: { contractDays: 90, urgency: 'high' },
    },
    {
      type: 'executive_alert',
      timestamp: now - 25 * DAY,
      title: 'Executive Alert: Hormuz Disruption Probability Exceeds 60%',
      summary: 'Critical alert for C-suite: probability of Hormuz disruption exceeds 60% within 14 days. Recommend activating contingency logistics.',
      source: 'ORION Executive Action Center',
      signalType: 'negative',
      riskLevel: 'critical',
      confidence: 0.78,
      tags: ['executive', 'alert', 'hormuz'],
      keywords: ['executive', 'alert', 'disruption', 'probability'],
      metadata: { disruptionProb: 0.62 },
    },
    {
      type: 'ai_insight',
      timestamp: now - 20 * DAY,
      title: 'Pattern Match: 2019 Saudi Aramco Attack Similarities',
      summary: 'AI detected 73% similarity between current Hormuz tensions and the September 2019 Abqaiq-Khurais attack pattern.',
      source: 'ORION Pattern Engine',
      signalType: 'negative',
      riskLevel: 'high',
      confidence: 0.73,
      tags: ['pattern', 'ai', 'aramco'],
      keywords: ['pattern', 'aramco', 'abqaiq', 'similarity'],
      metadata: { similarity: 0.73, historicalEvent: '2019 Abqaiq' },
    },
    {
      type: 'scenario_simulation',
      timestamp: now - 15 * DAY,
      title: 'Scenario: Full Hormuz Closure — 30-Day Impact',
      summary: 'Simulation shows $12B daily trade disruption, 21M bpd oil flow cut, global GDP -0.3% over 6 months.',
      source: 'ORION Scenario Simulator',
      signalType: 'negative',
      riskLevel: 'critical',
      confidence: 0.85,
      tags: ['scenario', 'simulation', 'hormuz'],
      keywords: ['hormuz', 'closure', 'scenario', 'impact', 'gdp'],
      metadata: { dailyTradeDisruption: 12e9, oilFlowCut: 21e6, gdpImpact: -0.003 },
    },
    {
      type: 'user_decision',
      timestamp: now - 14 * DAY,
      title: 'Decision: Activate Alternative Supply Routes',
      summary: 'Operations team approved activation of Cape of Good Hope route and increased West African crude purchases by 15%.',
      source: 'ORION Decision Desk',
      signalType: 'mixed',
      riskLevel: 'medium',
      confidence: 0.9,
      tags: ['decision', 'supply-route', 'alternative'],
      keywords: ['decision', 'route', 'alternative', 'africa'],
      metadata: { routeActivated: 'Cape of Good Hope', volumeIncrease: 0.15 },
    },
    {
      type: 'shipping_route',
      timestamp: now - 10 * DAY,
      title: 'Cape Route Congestion Reaches 85% Capacity',
      summary: 'Cape of Good Hope corridor at 85% capacity as tanker traffic surges. Average waiting time increased to 36 hours.',
      source: 'ORION Shipping Monitor',
      corridor: 'Cape of Good Hope',
      signalType: 'negative',
      riskLevel: 'high',
      confidence: 0.91,
      tags: ['shipping', 'congestion', 'cape'],
      keywords: ['cape', 'congestion', 'capacity', 'tanker'],
      metadata: { capacity: 0.85, waitHours: 36 },
    },
    {
      type: 'country_instability',
      timestamp: now - 5 * DAY,
      title: 'Iran Instability Score Increases to 8.1',
      summary: 'Country instability score rose from 6.4 to 8.1 following internal political tensions and external military pressure.',
      source: 'ORION Country Intelligence',
      country: 'Iran',
      region: 'Middle East',
      signalType: 'negative',
      riskLevel: 'high',
      confidence: 0.87,
      tags: ['iran', 'instability', 'country-risk'],
      keywords: ['iran', 'instability', 'political', 'score'],
      metadata: { previousScore: 6.4, currentScore: 8.1 },
    },
    {
      type: 'executive_report',
      timestamp: now - 2 * DAY,
      title: 'Weekly Executive Briefing — Hormuz Crisis Status',
      summary: 'Crisis entering week 5. Supply diversification underway. Brent stabilizing at $92. Insurance premiums declining. Risk remains elevated.',
      source: 'ORION Executive Reports',
      signalType: 'mixed',
      riskLevel: 'medium',
      confidence: 0.88,
      tags: ['executive', 'briefing', 'weekly'],
      keywords: ['executive', 'briefing', 'status', 'crisis'],
      metadata: { brentPrice: 92, crisisWeek: 5 },
    },
  ];

  for (const event of demoEvents) {
    store.events.push({ ...event, id: generateEventId() });
  }

  saveStore(store);
  seedDemoScenarios();
}

function seedDemoScenarios(): void {
  const existing = loadScenarios();
  if (existing.length > 0) return;

  const store = loadStore();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  const iranUsEvents = store.events.filter(
    (e) =>
      e.country === 'Iran' ||
      e.corridor === 'Strait of Hormuz' ||
      e.chokepoint === 'Hormuz' ||
      e.tags.includes('hormuz') ||
      e.tags.includes('iran'),
  );

  const scenarios: Omit<ArchiveScenario, 'id'>[] = [
    {
      name: 'March 2025 Iran-US Hormuz Standoff',
      description:
        'Naval confrontation in the Strait of Hormuz triggered a 5-week energy crisis. Insurance premiums surged, VLCCs rerouted via Cape of Good Hope, and Brent crude spiked to $95/bbl before stabilizing.',
      startTimestamp: now - 30 * DAY,
      endTimestamp: now - 2 * DAY,
      events: iranUsEvents.length > 0 ? iranUsEvents : store.events.slice(0, 12),
      riskModelVersion: 'v2.4.1',
      predictedOutcome: '60% probability of full Hormuz closure within 14 days',
      actualOutcome:
        'Partial disruption lasting 5 weeks. No full closure. Supply diversification via Cape route mitigated worst-case.',
      accuracy: 0.72,
    },
    {
      name: 'Red Sea Shipping Attacks — Dec 2023 to Mar 2024',
      description:
        'Houthi attacks on commercial shipping in the Red Sea forced major carriers to reroute around the Cape of Good Hope, adding 10-14 days transit and $1M+ per voyage.',
      startTimestamp: now - 90 * DAY,
      endTimestamp: now - 60 * DAY,
      events: store.events.filter(
        (e) =>
          e.corridor === 'Cape of Good Hope' ||
          e.tags.includes('shipping') ||
          e.tags.includes('reroute'),
      ).length > 0
        ? store.events.filter(
            (e) =>
              e.corridor === 'Cape of Good Hope' ||
              e.tags.includes('shipping') ||
              e.tags.includes('reroute'),
          )
        : store.events.slice(0, 8),
      riskModelVersion: 'v2.3.0',
      predictedOutcome: 'Sustained rerouting for 3-6 months with $15B annual trade impact',
      actualOutcome:
        'Rerouting persisted for 4+ months. Annualized cost exceeded $20B. Insurance premiums increased 300%.',
      accuracy: 0.65,
    },
    {
      name: 'OPEC Emergency Production Cut — April 2024',
      description:
        'OPEC+ announced surprise 1.65M bpd production cut, the largest since 2020. Brent surged 8% on announcement.',
      startTimestamp: now - 45 * DAY,
      endTimestamp: now - 40 * DAY,
      events: store.events.filter((e) => e.commodity === 'Crude Oil').length > 0
        ? store.events.filter((e) => e.commodity === 'Crude Oil')
        : store.events.slice(0, 6),
      riskModelVersion: 'v2.4.0',
      predictedOutcome: 'Brent to reach $100/bbl within 2 weeks, gradual normalization over 3 months',
      actualOutcome:
        'Brent peaked at $95/bbl then declined as non-OPEC supply filled gap. Market absorbed cut in 6 weeks.',
      accuracy: 0.58,
    },
  ];

  for (const scenario of scenarios) {
    existing.push({ ...scenario, id: `scn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` });
  }
  saveScenarios(existing);
}
