import { CHOKEPOINT_REGISTRY } from '@/config/chokepoint-registry';
import type { ChokepointInfo, GetChokepointStatusResponse } from '@/services/supply-chain';

export type ChokepointMonitorStatus = 'Normal' | 'Elevated' | 'High Risk' | 'Critical';

export interface ChokepointMonitor {
  id: string;
  name: string;
  lat: number;
  lon: number;
  riskScore: number;
  severityScore: number;
  confidenceScore: number;
  trendScore: number;
  disruptionProbability: number;
  status: ChokepointMonitorStatus;
  evidence: string[];
  sourceIds: string[];
}

const MONITORED_IDS = ['hormuz_strait', 'red_sea', 'bab_el_mandeb', 'suez', 'malacca_strait'] as const;

const BASELINE_SEVERITY: Record<string, number> = {
  hormuz_strait: 82,
  red_sea: 78,
  bab_el_mandeb: 84,
  suez: 70,
  malacca_strait: 48,
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function statusFrom(score: number): ChokepointMonitorStatus {
  if (score >= 78) return 'Critical';
  if (score >= 58) return 'High Risk';
  if (score >= 32) return 'Elevated';
  return 'Normal';
}

function flowStress(cp?: ChokepointInfo): number {
  const ratio = cp?.flowEstimate?.flowRatio;
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return 0;
  return clamp((1 - Math.min(1, ratio)) * 115);
}

function trendScore(cp?: ChokepointInfo): number {
  const wow = cp?.transitSummary?.wowChangePct;
  const wowScore = typeof wow === 'number' && wow < 0 ? Math.abs(wow) : 0;
  const disrupted = cp?.flowEstimate?.disrupted ? 35 : 0;
  return clamp(Math.max(disrupted, wowScore * 1.8));
}

function confidenceScore(cp?: ChokepointInfo, sourceCount = 1): number {
  let score = 35;
  if (cp?.transitSummary?.dataAvailable !== false && cp?.transitSummary) score += 22;
  if (cp?.flowEstimate) score += 18;
  if (typeof cp?.disruptionScore === 'number') score += 12;
  if ((cp?.activeWarnings ?? 0) > 0) score += 6;
  if (sourceCount > 1) score += 8;
  return clamp(score);
}

function riskScore(cp?: ChokepointInfo): number {
  const disruption = cp?.disruptionScore ?? 0;
  const warnings = Math.min(100, (cp?.activeWarnings ?? 0) * 12);
  const ais = Math.min(100, (cp?.aisDisruptions ?? 0) * 18);
  const transitRisk = cp?.transitSummary?.riskLevel === 'critical'
    ? 90
    : cp?.transitSummary?.riskLevel === 'high'
      ? 72
      : cp?.transitSummary?.riskLevel === 'medium'
        ? 48
        : 18;
  return clamp(Math.max(disruption, flowStress(cp), warnings, ais, transitRisk));
}

function monitorFrom(id: string, statusMap: Map<string, ChokepointInfo>): ChokepointMonitor {
  const registry = CHOKEPOINT_REGISTRY.find(cp => cp.id === id);
  const cp = statusMap.get(id);
  const risk = riskScore(cp);
  const severity = clamp(Math.max(BASELINE_SEVERITY[id] ?? 40, risk * 0.85));
  const trend = trendScore(cp);
  const confidence = confidenceScore(cp);
  const probability = clamp(risk * 0.58 + severity * 0.24 + trend * 0.18);
  return {
    id,
    name: registry?.displayName ?? cp?.name ?? id,
    lat: registry?.lat ?? cp?.lat ?? 0,
    lon: registry?.lon ?? cp?.lon ?? 0,
    riskScore: risk,
    severityScore: severity,
    confidenceScore: confidence,
    trendScore: trend,
    disruptionProbability: probability,
    status: statusFrom(probability),
    evidence: [
      cp?.transitSummary?.riskSummary || cp?.description || 'Baseline strategic chokepoint monitor',
      cp?.flowEstimate ? `Flow ${Math.round(cp.flowEstimate.flowRatio * 100)}% of baseline` : '',
      (cp?.activeWarnings ?? 0) > 0 ? `${cp?.activeWarnings} active navigational warnings` : '',
    ].filter(Boolean),
    sourceIds: [id],
  };
}

function redSeaMonitor(statusMap: Map<string, ChokepointInfo>): ChokepointMonitor {
  const registry = CHOKEPOINT_REGISTRY.find(cp => cp.id === 'red_sea');
  const bab = statusMap.get('bab_el_mandeb');
  const suez = statusMap.get('suez');
  const babRisk = riskScore(bab);
  const suezRisk = riskScore(suez);
  const risk = clamp(Math.max(babRisk, suezRisk, 45));
  const severity = clamp(Math.max(BASELINE_SEVERITY.red_sea ?? 78, risk * 0.9));
  const trend = clamp(Math.max(trendScore(bab), trendScore(suez)));
  const confidence = confidenceScore(bab, 2);
  const probability = clamp(risk * 0.56 + severity * 0.26 + trend * 0.18);
  return {
    id: 'red_sea',
    name: 'Red Sea',
    lat: registry?.lat ?? 20,
    lon: registry?.lon ?? 38,
    riskScore: risk,
    severityScore: severity,
    confidenceScore: confidence,
    trendScore: trend,
    disruptionProbability: probability,
    status: statusFrom(probability),
    evidence: [
      'Corridor monitor derived from Red Sea registry plus Bab-el-Mandeb and Suez live status.',
      bab?.transitSummary?.riskSummary || bab?.description || '',
      suez?.transitSummary?.riskSummary || suez?.description || '',
    ].filter(Boolean),
    sourceIds: ['red_sea', 'bab_el_mandeb', 'suez'],
  };
}

export function buildChokepointMonitoring(
  status?: GetChokepointStatusResponse | null,
): ChokepointMonitor[] {
  const statusMap = new Map((status?.chokepoints ?? []).map(cp => [cp.id, cp]));
  return MONITORED_IDS.map(id => id === 'red_sea' ? redSeaMonitor(statusMap) : monitorFrom(id, statusMap));
}
