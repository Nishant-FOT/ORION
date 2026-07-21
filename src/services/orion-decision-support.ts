import { createLazyClient, getRpcBaseUrl, rpcFetch } from '@/services/rpc-client';
import { fetchChokepointStatus, fetchShippingStress } from '@/services/supply-chain';
import { fetchCommodityQuotes } from '@/services/market';
import { IMPORTER_COUNTRY_CONFIG } from '@/config/energy-supply-network';
import {
  IntelligenceServiceClient,
  type ComputeEnergyShockScenarioResponse,
} from '@/generated/client/orion/intelligence/v1/service_client';
import {
  SupplyChainServiceClient,
  type ChokepointInfo,
  type EnergyDisruptionEntry,
} from '@/generated/client/orion/supply_chain/v1/service_client';

const getIntelligenceClient = createLazyClient(() => new IntelligenceServiceClient(getRpcBaseUrl(), {
  fetch: rpcFetch,
}));

const getSupplyChainClient = createLazyClient(() => new SupplyChainServiceClient(getRpcBaseUrl(), {
  fetch: rpcFetch,
}));

const IMPORTER_COUNTRIES = IMPORTER_COUNTRY_CONFIG.map(c => ({
  code: c.code,
  name: c.name,
  fuelMode: c.fuelMode,
}));

const WATCHED_CHOKEPOINTS = ['hormuz_strait', 'bab_el_mandeb', 'suez', 'malacca_strait', 'cape_of_good_hope', 'panama_canal'] as const;

const ENERGY_MARKET_META = [
  { symbol: 'BZ=F', name: 'Brent Crude', display: 'BRENT' },
  { symbol: 'CL=F', name: 'WTI Crude', display: 'WTI' },
  { symbol: 'NG=F', name: 'Natural Gas', display: 'NATGAS' },
];

export type OrionDecisionSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface OrionRecommendation {
  id: string;
  severity: OrionDecisionSeverity;
  countryCode: string;
  countryName: string;
  chokepointId: string;
  chokepointName: string;
  action: string;
  rationale: string;
  confidence: number;
  exposureScore: number;
  coverDays: number;
  disruptionPct: number;
  evidence: string[];
  limitations: string[];
}

export interface OrionDecisionBrief {
  posture: OrionDecisionSeverity;
  postureLabel: string;
  generatedAt: string;
  recommendedActions: OrionRecommendation[];
  chokepoints: ChokepointInfo[];
  activeDisruptions: EnergyDisruptionEntry[];
  marketSignals: Array<{ symbol: string; display: string; price: number; change: number }>;
  stress: { score: number; level: string; carriers: number; upstreamUnavailable: boolean };
  coverageNotes: string[];
  upstreamUnavailable: boolean;
}

interface ShockCandidate {
  country: (typeof IMPORTER_COUNTRIES)[number];
  chokepoint: ChokepointInfo;
  shock: ComputeEnergyShockScenarioResponse;
  disruptionPct: number;
}

function statusPressure(cp: ChokepointInfo): number {
  const status = `${cp.status} ${cp.transitSummary?.riskLevel ?? ''}`.toLowerCase();
  if (status.includes('closed') || status.includes('critical') || status.includes('war')) return 100;
  if (status.includes('disrupted') || status.includes('high')) return 80;
  if (status.includes('restricted') || status.includes('elevated') || status.includes('medium')) return 55;
  return 25;
}

function flowPressure(cp: ChokepointInfo): number {
  const ratio = cp.flowEstimate?.flowRatio;
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return 30;
  return Math.max(0, Math.min(100, (1 - Math.min(ratio, 1)) * 120));
}

function disruptionPctFor(cp: ChokepointInfo): number {
  const pressure = Math.max(statusPressure(cp), flowPressure(cp));
  if (pressure >= 90) return 80;
  if (pressure >= 70) return 60;
  if (pressure >= 45) return 40;
  return 25;
}

function maxProductDeficit(shock: ComputeEnergyShockScenarioResponse): number {
  const productDeficit = Math.max(0, ...shock.products.map(p => p.deficitPct || 0));
  const gasDeficit = shock.gasImpact?.dataAvailable ? (shock.gasImpact.deficitPct || 0) : 0;
  return Math.max(productDeficit, gasDeficit);
}

function scoreCandidate(candidate: ShockCandidate): number {
  const deficit = maxProductDeficit(candidate.shock);
  const coverRisk = candidate.shock.effectiveCoverDays > 0
    ? Math.max(0, 45 - candidate.shock.effectiveCoverDays) * 1.2
    : 20;
  const livePressure = Math.max(statusPressure(candidate.chokepoint), flowPressure(candidate.chokepoint));
  const gulfExposure = (candidate.shock.gulfCrudeShare || 0) * 100;
  const gasExposure = (candidate.shock.gasImpact?.lngShareOfImports || 0) * 80;
  return Math.round(Math.min(100, deficit * 1.8 + coverRisk + livePressure * 0.35 + gulfExposure * 0.3 + gasExposure * 0.25));
}

function severityFor(score: number): OrionDecisionSeverity {
  if (score >= 80) return 'critical';
  if (score >= 62) return 'high';
  if (score >= 38) return 'medium';
  return 'low';
}

function confidenceFor(shock: ComputeEnergyShockScenarioResponse): number {
  let confidence = 35;
  if (shock.dataAvailable) confidence += 15;
  if (shock.jodiOilCoverage) confidence += 12;
  if (shock.comtradeCoverage) confidence += 12;
  if (shock.ieaStocksCoverage) confidence += 12;
  if (shock.portwatchCoverage) confidence += 10;
  if (shock.gasImpact?.dataAvailable) confidence += 7;
  if (shock.degraded) confidence -= 15;
  return Math.max(10, Math.min(95, confidence));
}

function actionFor(candidate: ShockCandidate, score: number): string {
  const coverDays = candidate.shock.effectiveCoverDays;
  const country = candidate.country.name;
  const cp = candidate.chokepoint.name;
  if (score >= 80 || coverDays > 0 && coverDays < 20) {
    return `Activate emergency procurement desk for ${country}: secure prompt cargoes not exposed to ${cp}, pre-clear drawdown options, and lock insurance capacity.`;
  }
  if (score >= 62) {
    return `Shift ${country} procurement into resilience mode: diversify tenders away from ${cp}, extend cover, and validate alternate discharge ports.`;
  }
  if (score >= 38) {
    return `Put ${country} contracts on watch: request supplier route disclosure, quote ${cp} bypass premiums, and refresh stock-cover assumptions.`;
  }
  return `Maintain ${country} monitoring posture: keep ${cp} triggers active and reprice if transit flow or product deficits deteriorate.`;
}

function rationaleFor(candidate: ShockCandidate, score: number): string {
  const deficit = maxProductDeficit(candidate.shock);
  const cover = candidate.shock.effectiveCoverDays;
  const liveFlow = candidate.shock.liveFlowRatio;
  const flowText = typeof liveFlow === 'number' ? `${Math.round(liveFlow * 100)}% live flow` : 'baseline flow assumption';
  return `${candidate.chokepoint.name} shock ranks ${score}/100 for ${candidate.country.name}: ${deficit.toFixed(1)}% max modeled fuel deficit, ${cover.toFixed(0)} days effective cover, ${flowText}.`;
}

function evidenceFor(candidate: ShockCandidate): string[] {
  const evidence = [
    candidate.shock.assessment,
    `${candidate.chokepoint.name}: ${candidate.chokepoint.status || 'status unknown'}; ${candidate.chokepoint.transitSummary?.riskSummary || candidate.chokepoint.description || 'no summary'}`,
  ];
  if (candidate.shock.gasImpact?.dataAvailable) evidence.push(candidate.shock.gasImpact.assessment);
  return evidence.filter(Boolean).slice(0, 3);
}

function postureLabel(posture: OrionDecisionSeverity): string {
  switch (posture) {
    case 'critical': return 'Immediate action';
    case 'high': return 'Resilience mode';
    case 'medium': return 'Watch and hedge';
    case 'low': return 'Normal monitoring';
  }
}

export async function fetchOrionDecisionBrief(): Promise<OrionDecisionBrief> {
  const [chokepointResult, stressResult, disruptionResult, marketResult] = await Promise.allSettled([
    fetchChokepointStatus(),
    fetchShippingStress(),
    getSupplyChainClient().listEnergyDisruptions({ assetId: '', assetType: '', ongoingOnly: true }),
    fetchCommodityQuotes(ENERGY_MARKET_META),
  ]);

  const chokepoints = chokepointResult.status === 'fulfilled' ? chokepointResult.value.chokepoints : [];
  const stress = stressResult.status === 'fulfilled'
    ? {
      score: stressResult.value.stressScore,
      level: stressResult.value.stressLevel,
      carriers: stressResult.value.carriers.length,
      upstreamUnavailable: stressResult.value.upstreamUnavailable,
    }
    : { score: 0, level: 'unknown', carriers: 0, upstreamUnavailable: true };
  const activeDisruptions = disruptionResult.status === 'fulfilled' ? disruptionResult.value.events : [];
  const marketSignals = marketResult.status === 'fulfilled'
    ? marketResult.value.data
      .filter(q => typeof q.price === 'number' && Number.isFinite(q.price) && typeof q.change === 'number' && Number.isFinite(q.change))
      .map(q => ({ symbol: q.symbol, display: q.display, price: q.price as number, change: q.change as number }))
    : [];

  const chokepointMap = new Map(chokepoints.map(cp => [cp.id, cp]));
  const scenarioInputs = WATCHED_CHOKEPOINTS
    .map(id => chokepointMap.get(id))
    .filter((cp): cp is ChokepointInfo => Boolean(cp))
    .sort((a, b) => Math.max(statusPressure(b), flowPressure(b)) - Math.max(statusPressure(a), flowPressure(a)))
    .slice(0, 3);

  const shockResults = await Promise.allSettled(
    scenarioInputs.flatMap(chokepoint => IMPORTER_COUNTRIES.map(country => {
      const disruptionPct = disruptionPctFor(chokepoint);
      return getIntelligenceClient().computeEnergyShockScenario({
        countryCode: country.code,
        chokepointId: chokepoint.id,
        disruptionPct,
        fuelMode: country.fuelMode,
      }).then(shock => ({ country, chokepoint, shock, disruptionPct }));
    })),
  );

  const candidates = shockResults
    .filter((r): r is PromiseFulfilledResult<ShockCandidate> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter(c => c.shock.dataAvailable || c.shock.gasImpact?.dataAvailable || c.shock.coverageLevel !== 'unsupported');

  const recommendedActions = candidates
    .map(candidate => {
      const exposureScore = scoreCandidate(candidate);
      return {
        id: `${candidate.country.code}-${candidate.chokepoint.id}`,
        severity: severityFor(exposureScore),
        countryCode: candidate.country.code,
        countryName: candidate.country.name,
        chokepointId: candidate.chokepoint.id,
        chokepointName: candidate.chokepoint.name,
        action: actionFor(candidate, exposureScore),
        rationale: rationaleFor(candidate, exposureScore),
        confidence: confidenceFor(candidate.shock),
        exposureScore,
        coverDays: candidate.shock.effectiveCoverDays,
        disruptionPct: candidate.disruptionPct,
        evidence: evidenceFor(candidate),
        limitations: candidate.shock.limitations,
      };
    })
    .sort((a, b) => b.exposureScore - a.exposureScore)
    .slice(0, 5);

  const posture = recommendedActions[0]?.severity ?? (stress.score >= 65 ? 'high' : activeDisruptions.length > 0 ? 'medium' : 'low');
  const upstreamUnavailable =
    (chokepointResult.status === 'fulfilled' && chokepointResult.value.upstreamUnavailable) ||
    stress.upstreamUnavailable ||
    (disruptionResult.status === 'fulfilled' && disruptionResult.value.upstreamUnavailable) ||
    chokepointResult.status === 'rejected' ||
    disruptionResult.status === 'rejected';

  const coverageNotes = [
    `${chokepoints.length} chokepoints monitored`,
    `${activeDisruptions.length} active energy disruptions`,
    `${marketSignals.length} market quotes`,
    `${recommendedActions.length} ranked importer scenarios`,
  ];
  if (upstreamUnavailable) coverageNotes.push('one or more upstream feeds degraded');

  return {
    posture,
    postureLabel: postureLabel(posture),
    generatedAt: new Date().toISOString(),
    recommendedActions,
    chokepoints,
    activeDisruptions,
    marketSignals,
    stress,
    coverageNotes,
    upstreamUnavailable,
  };
}
