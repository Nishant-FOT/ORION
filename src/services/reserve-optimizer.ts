/**
 * Strategic Petroleum Reserve Optimization Agent
 *
 * Ingests forecast disruptions, demand data, and current reserve levels
 * to produce actionable drawdown strategies, coverage analysis, depletion
 * forecasts, and replenishment plans for major oil-importing nations.
 */

import { IMPORTER_COUNTRY_CONFIG } from '@/config/energy-supply-network';
import { fetchCommodityQuotes } from '@/services/market';
import {
  fetchRiskModelOutputs,
  type RiskModelForecast,
} from '@/services/quantitative-risk-models';

// ─── Country Reserve Data ─────────────────────────────────────────────────────
// Reuses the same source of truth as scenario-engine.ts for consistency.

interface CountryReserveData {
  dailyImportBpd: number;
  coverDays: number;
  spbBarrels: number;
}

const COUNTRY_RESERVE_DATA: Record<string, CountryReserveData> = {
  IN: { dailyImportBpd: 4_500_000, coverDays: 10, spbBarrels: 5_200_000_000 },
  CN: { dailyImportBpd: 11_000_000, coverDays: 15, spbBarrels: 9_500_000_000 },
  JP: { dailyImportBpd: 3_200_000, coverDays: 20, spbBarrels: 3_200_000_000 },
  KR: { dailyImportBpd: 2_800_000, coverDays: 18, spbBarrels: 2_600_000_000 },
  EU: { dailyImportBpd: 8_500_000, coverDays: 25, spbBarrels: 1_500_000_000 },
  TW: { dailyImportBpd: 800_000, coverDays: 12, spbBarrels: 400_000_000 },
  TH: { dailyImportBpd: 900_000, coverDays: 8, spbBarrels: 300_000_000 },
  VN: { dailyImportBpd: 500_000, coverDays: 7, spbBarrels: 200_000_000 },
  SG: { dailyImportBpd: 1_200_000, coverDays: 5, spbBarrels: 100_000_000 },
  US: { dailyImportBpd: 3_000_000, coverDays: 30, spbBarrels: 3_700_000_000 },
  SA: { dailyImportBpd: 0, coverDays: 999, spbBarrels: 0 },
  AE: { dailyImportBpd: 0, coverDays: 999, spbBarrels: 0 },
  KW: { dailyImportBpd: 0, coverDays: 999, spbBarrels: 0 },
  IQ: { dailyImportBpd: 0, coverDays: 999, spbBarrels: 0 },
  IR: { dailyImportBpd: 0, coverDays: 999, spbBarrels: 0 },
};

const IEA_BENCHMARK_DAYS = 90;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DrawdownPhase {
  phase: number;
  label: string;
  triggerCondition: string;
  releaseRateBpd: number;
  durationDays: number;
  reserveDepletionBarrels: number;
  costAtCurrentPrice: number;
}

export interface DepletionDay {
  day: number;
  reserveBarrels: number;
  dailyReleaseRate: number;
  cumulativeDrawdown: number;
  coverageDaysRemaining: number;
  breachThreshold: boolean;
}

export interface ReplenishmentAction {
  timing: string;
  action: string;
  volumeBarrels: number;
  estimatedCost: number;
  sourceType: 'spot' | 'term' | 'swap' | 'coordinated';
  rationale: string;
}

export interface ReserveOptimizationResult {
  countryCode: string;
  countryName: string;
  generatedAt: string;

  currentCoverageDays: number;
  riskAdjustedCoverageDays: number;
  minimumCoverageDays: number;

  drawdownPhases: DrawdownPhase[];
  recommendedImmediateAction: string;
  totalReleaseCostEstimate: number;

  depletionCurve: DepletionDay[];
  daysUntilCritical: number;
  daysUntilExhaustion: number;

  replenishmentActions: ReplenishmentAction[];
  totalReplenishmentCost: number;
  replenishmentTimelineDays: number;

  currentBrentPrice: number;
  priceAtRisk: number;
  hedgingRecommendation: string;

  severity: 'critical' | 'high' | 'medium' | 'low';
  keyRisks: string[];
  limitations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BrentMeta = [{ symbol: 'BZ=F', name: 'Brent Crude', display: 'BRENT' }];

function blendForecast(a: RiskModelForecast, b: RiskModelForecast): RiskModelForecast {
  return {
    current: Math.min(100, (a.current + b.current) / 2),
    day7: Math.min(100, (a.day7 + b.day7) / 2),
    day30: Math.min(100, (a.day30 + b.day30) / 2),
  };
}

function riskAdjustedDemand(
  dailyImportBpd: number,
  disruptionProb: number,
): number {
  // Under disruption, effective supply drops so replacement barrels cost more
  // and some imports simply cannot be replaced — model as a demand multiplier.
  return dailyImportBpd * (1 + disruptionProb / 200);
}

function computeSeverity(
  coverageDays: number,
  riskAdjustedDays: number,
  disruptionProb30: number,
): 'critical' | 'high' | 'medium' | 'low' {
  if (coverageDays < 7 || riskAdjustedDays < 5) return 'critical';
  if (coverageDays < 14 || riskAdjustedDays < 10 || disruptionProb30 > 70) return 'high';
  if (coverageDays < IEA_BENCHMARK_DAYS || disruptionProb30 > 30) return 'medium';
  return 'low';
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

function buildDrawdownPhases(
  reserveBarrels: number,
  dailyDemand: number,
  disruptionProb: number,
  brentPrice: number,
): DrawdownPhase[] {
  // Phase 1: Conservation (demand reduction 10-20%)
  const conserveRate = Math.round(dailyDemand * 0.15);
  const conserveDuration = Math.min(30, Math.floor(reserveBarrels * 0.1 / conserveRate));

  // Phase 2: Partial drawdown (release 20-40% of reserve over time)
  const partialRate = Math.round(dailyDemand * 0.30);
  const partialReserve = reserveBarrels * 0.4;
  const partialDuration = Math.min(60, Math.floor(partialReserve / partialRate));

  // Phase 3: Full drawdown (emergency, release at replacement rate)
  const fullRate = dailyDemand;
  const remainingReserve = reserveBarrels * 0.5;
  const fullDuration = Math.floor(remainingReserve / fullRate);

  return [
    {
      phase: 1,
      label: 'Conservation',
      triggerCondition: disruptionProb > 20 ? 'Enact immediately' : 'At 30% disruption probability',
      releaseRateBpd: conserveRate,
      durationDays: conserveDuration,
      reserveDepletionBarrels: conserveRate * conserveDuration,
      costAtCurrentPrice: conserveRate * conserveDuration * brentPrice,
    },
    {
      phase: 2,
      label: 'Partial Drawdown',
      triggerCondition: disruptionProb > 50 ? 'Enact at phase 1 completion' : 'At 60% disruption probability',
      releaseRateBpd: partialRate,
      durationDays: partialDuration,
      reserveDepletionBarrels: partialRate * partialDuration,
      costAtCurrentPrice: partialRate * partialDuration * brentPrice,
    },
    {
      phase: 3,
      label: 'Full Drawdown',
      triggerCondition: 'Coordinated IEA release or national emergency',
      releaseRateBpd: fullRate,
      durationDays: fullDuration,
      reserveDepletionBarrels: fullRate * fullDuration,
      costAtCurrentPrice: fullRate * fullDuration * brentPrice,
    },
  ];
}

function buildDepletionCurve(
  reserveBarrels: number,
  _dailyDemand: number,
  phases: DrawdownPhase[],
): DepletionDay[] {
  const curve: DepletionDay[] = [];
  let remaining = reserveBarrels;
  let cumulativeDrawn = 0;
  let currentRate = 0;
  let phaseDay = 0;
  let phaseIdx = 0;

  for (let day = 1; day <= 90; day++) {
    // Advance phase if needed
    if (phaseIdx < phases.length) {
      phaseDay++;
      const phase = phases[phaseIdx]!;
      if (phaseDay === 1) {
        currentRate = phase.releaseRateBpd;
      }
      if (phaseDay >= phase.durationDays) {
        phaseIdx++;
        phaseDay = 0;
        currentRate = phaseIdx < phases.length ? phases[phaseIdx]!.releaseRateBpd : 0;
      }
    }

    const drawn = Math.min(currentRate, remaining);
    remaining = Math.max(0, remaining - drawn);
    cumulativeDrawn += drawn;
    const coverageDays = drawn > 0 ? Math.floor(remaining / drawn) : 999;

    curve.push({
      day,
      reserveBarrels: Math.round(remaining),
      dailyReleaseRate: Math.round(drawn),
      cumulativeDrawdown: Math.round(cumulativeDrawn),
      coverageDaysRemaining: coverageDays,
      breachThreshold: remaining < reserveBarrels * 0.25,
    });
  }

  return curve;
}

function buildReplenishmentPlan(
  _countryCode: string,
  reserveBarrels: number,
  dailyDemand: number,
  disruptionProb30: number,
  brentPrice: number,
): ReplenishmentAction[] {
  const actions: ReplenishmentAction[] = [];
  const targetRefill = reserveBarrels * 0.6; // Target 60% refill

  // Immediate: spot purchases to cover near-term gap
  const spotVolume = Math.round(dailyDemand * 30 * Math.min(1, disruptionProb30 / 100));
  if (spotVolume > 0) {
    actions.push({
      timing: 'Immediate (Days 1-14)',
      action: 'Emergency spot procurement',
      volumeBarrels: spotVolume,
      estimatedCost: spotVolume * brentPrice * 1.08, // 8% premium
      sourceType: 'spot',
      rationale: `Cover ${Math.round(spotVolume / dailyDemand)} days of disrupted supply via spot market at ~8% premium`,
    });
  }

  // Short-term: term contract acceleration
  const termVolume = Math.round(targetRefill * 0.3);
  actions.push({
    timing: 'Short-term (Days 15-60)',
    action: 'Accelerate term contract deliveries',
    volumeBarrels: termVolume,
    estimatedCost: termVolume * brentPrice * 1.03,
    sourceType: 'term',
    rationale: 'Pull forward scheduled term deliveries and extend existing contracts at negotiated rates',
  });

  // Medium-term: strategic swaps
  const swapVolume = Math.round(targetRefill * 0.25);
  actions.push({
    timing: 'Medium-term (Days 30-90)',
    action: 'Government-to-government swaps',
    volumeBarrels: swapVolume,
    estimatedCost: swapVolume * brentPrice,
    sourceType: 'swap',
    rationale: 'Reciprocal reserve swaps with allied nations (Japan, Korea, EU) to share burden',
  });

  // Long-term: coordinated refill
  const coordinatedVolume = targetRefill - spotVolume - termVolume - swapVolume;
  if (coordinatedVolume > 0) {
    actions.push({
      timing: 'Long-term (Days 60-180)',
      action: 'Coordinated strategic refill',
      volumeBarrels: Math.max(0, coordinatedVolume),
      estimatedCost: Math.max(0, coordinatedVolume) * brentPrice * 0.97, // 3% discount for patient buying
      sourceType: 'coordinated',
      rationale: 'Gradual refill during price weakness, potentially coordinated with IEA member reserves',
    });
  }

  return actions;
}

function computePriceAtRisk(currentPrice: number, disruptionProb30: number): number {
  // Model: price spike scales with disruption probability
  // 30% prob → ~15% price increase, 80% prob → ~45% increase
  const multiplier = 1 + (disruptionProb30 / 100) * 0.55;
  return Math.round(currentPrice * multiplier * 100) / 100;
}

function hedgingRecommendation(disruptionProb30: number, coverageDays: number): string {
  if (disruptionProb30 > 60 && coverageDays < 20) {
    return 'BUY CALLS: High disruption risk with low coverage. Hedge 30-60 days of import volume with Brent call options at 5-10% OTM.';
  }
  if (disruptionProb30 > 40) {
    return ' COLLAR SPREAD: Moderate risk. Establish zero-cost collar (buy calls / sell puts) to cap upside price exposure while maintaining downside participation.';
  }
  if (coverageDays > IEA_BENCHMARK_DAYS) {
    return 'HOLD: Adequate coverage. Maintain existing hedges. Consider selling covered calls against inventory to generate income.';
  }
  return 'LIGHT HEDGE: Buy 3-month ATM calls on 15-20% of quarterly import volume as insurance.';
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function optimizeReserves(
  countryCode: string,
): Promise<ReserveOptimizationResult> {
  const countryData = COUNTRY_RESERVE_DATA[countryCode];
  if (!countryData || countryData.spbBarrels === 0) {
    throw new Error(`No reserve data available for ${countryCode}`);
  }

  const countryConfig = IMPORTER_COUNTRY_CONFIG.find(c => c.code === countryCode);
  const countryName = countryConfig?.name ?? countryCode;

  // Fetch live data in parallel
  const [riskSnapshot, commodityResult] = await Promise.all([
    fetchRiskModelOutputs(),
    fetchCommodityQuotes(BrentMeta),
  ]);

  // Extract disruption forecasts — blend hormuz + red_sea for composite risk
  const hormuzModel = riskSnapshot.models.find(m => m.id === 'hormuz');
  const redSeaModel = riskSnapshot.models.find(m => m.id === 'red_sea');

  let disruption: RiskModelForecast;
  if (hormuzModel && redSeaModel) {
    disruption = blendForecast(hormuzModel.probability, redSeaModel.probability);
  } else {
    disruption = hormuzModel?.probability
      ?? redSeaModel?.probability
      ?? { current: 0, day7: 0, day30: 0 };
  }

  // Brent price
  const brentQuote = commodityResult.data.find(q => q.symbol === 'BZ=F');
  const brentPrice = brentQuote?.price ?? 82;

  const reserveBarrels = countryData.spbBarrels;
  const dailyDemand = countryData.dailyImportBpd;

  // Coverage analysis
  const currentCoverageDays = Math.round(reserveBarrels / dailyDemand);
  const effectiveDemand = riskAdjustedDemand(dailyDemand, disruption.day30);
  const riskAdjustedCoverageDays = Math.round(reserveBarrels / effectiveDemand);

  // Drawdown strategy
  const drawdownPhases = buildDrawdownPhases(reserveBarrels, dailyDemand, disruption.current, brentPrice);
  const totalReleaseCost = drawdownPhases.reduce((sum, p) => sum + p.costAtCurrentPrice, 0);

  const immediateAction = disruption.current > 60
    ? `CRITICAL: Begin Phase 1 conservation measures immediately. Release rate: ${drawdownPhases[0]!.releaseRateBpd.toLocaleString()} bpd.`
    : disruption.current > 30
      ? `ELEVATED: Pre-position for Phase 1 drawdown. Activate emergency procurement contacts and assess spot market availability.`
      : `MONITORING: Maintain current reserve posture. Review hedging positions and confirm delivery schedules.`;

  // Depletion forecast
  const depletionCurve = buildDepletionCurve(reserveBarrels, dailyDemand, drawdownPhases);
  const criticalDay = depletionCurve.find(d => d.breachThreshold);
  const exhaustionDay = depletionCurve.find(d => d.reserveBarrels === 0);

  // Replenishment plan
  const replenishmentActions = buildReplenishmentPlan(
    countryCode, reserveBarrels, dailyDemand, disruption.day30, brentPrice,
  );
  const totalReplenishmentCost = replenishmentActions.reduce((sum, a) => sum + a.estimatedCost, 0);
  const maxTimeline = Math.max(...replenishmentActions.map(a => parseInt(a.timing.match(/\d+-(\d+)/)?.[1] ?? '180', 10)));

  // Severity & risks
  const severity = computeSeverity(currentCoverageDays, riskAdjustedCoverageDays, disruption.day30);

  const keyRisks: string[] = [];
  if (disruption.day30 > 50) keyRisks.push(`30-day disruption probability elevated at ${Math.round(disruption.day30)}%`);
  if (currentCoverageDays < IEA_BENCHMARK_DAYS) keyRisks.push(`Coverage ${currentCoverageDays} days below IEA 90-day benchmark`);
  if (riskAdjustedCoverageDays < 10) keyRisks.push(`Risk-adjusted coverage drops to ${riskAdjustedCoverageDays} days under stress`);
  if (severity === 'critical') keyRisks.push('Reserves may be insufficient for a 30-day full closure scenario');

  const limitations: string[] = [
    'Demand modeled from import volume; domestic production not included',
    'Reserve figures are publicly reported estimates, not verified inventories',
    'Price projections assume linear scaling with disruption probability',
    'Coordinated releases depend on IEA member cooperation',
  ];

  return {
    countryCode,
    countryName,
    generatedAt: new Date().toISOString(),

    currentCoverageDays,
    riskAdjustedCoverageDays,
    minimumCoverageDays: IEA_BENCHMARK_DAYS,

    drawdownPhases,
    recommendedImmediateAction: immediateAction,
    totalReleaseCostEstimate: totalReleaseCost,

    depletionCurve,
    daysUntilCritical: criticalDay?.day ?? 91,
    daysUntilExhaustion: exhaustionDay?.day ?? 91,

    replenishmentActions,
    totalReplenishmentCost,
    replenishmentTimelineDays: maxTimeline,

    currentBrentPrice: brentPrice,
    priceAtRisk: computePriceAtRisk(brentPrice, disruption.day30),
    hedgingRecommendation: hedgingRecommendation(disruption.day30, currentCoverageDays),

    severity,
    keyRisks,
    limitations,
  };
}
