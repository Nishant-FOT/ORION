import { getMetricRange } from '@/services/time-series-store';

export interface PredictionResult {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  horizon: string;
  trend: 'rising' | 'falling' | 'stable';
  factors: string[];
}

export interface MonteCarloResult {
  metric: string;
  mean: number;
  median: number;
  p10: number;
  p90: number;
  probabilityAbove: (threshold: number) => number;
  simulations: number;
}

function exponentialSmoothing(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  const first = data[0];
  if (first === undefined) return [];
  const result = [first];
  for (let i = 1; i < data.length; i++) {
    const val = data[i];
    const prev = result[i - 1];
    if (val !== undefined && prev !== undefined) {
      result.push(alpha * val + (1 - alpha) * prev);
    }
  }
  return result;
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, r2: 0 };

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * (y[i] ?? 0), 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTot = y.reduce((a, b) => a + (b - yMean) ** 2, 0);
  const ssRes = y.reduce((a, b, i) => a + (b - (slope * (x[i] ?? 0) + intercept)) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

export async function predictMetric(
  metric: string,
  horizonHours: number = 24,
  windowMs: number = 7 * 24 * 60 * 60 * 1000,
): Promise<PredictionResult | null> {
  const entries = await getMetricRange(metric, Date.now() - windowMs, Date.now());
  if (entries.length < 3) return null;

  const values = entries.map(e => e.value);
  const timestamps = entries.map(e => e.timestamp);

  const smoothed = exponentialSmoothing(values, 0.3);
  const x = timestamps.map((_t, i) => i);
  const { slope, intercept, r2 } = linearRegression(x, smoothed);

  const current = smoothed[smoothed.length - 1] ?? 0;
  const predictedIdx = smoothed.length + horizonHours;
  const predicted = Math.max(0, slope * predictedIdx + intercept);

  const change = predicted - current;
  const trend = Math.abs(change) < current * 0.05 ? 'stable' : change > 0 ? 'rising' : 'falling';

  const factors: string[] = [];
  if (r2 > 0.7) factors.push('Strong historical trend');
  if (Math.abs(slope) > current * 0.1) factors.push('High momentum');
  if (entries.length > 20) factors.push('Sufficient data coverage');

  const confidence = Math.min(95, Math.max(10, r2 * 60 + (entries.length > 10 ? 20 : 0) + 15));

  return {
    metric,
    current,
    predicted: Math.round(predicted * 100) / 100,
    confidence: Math.round(confidence),
    horizon: `${horizonHours}h`,
    trend,
    factors,
  };
}

export async function monteCarloSimulation(
  metric: string,
  simulations: number = 1000,
  _horizonHours: number = 24,
  windowMs: number = 7 * 24 * 60 * 60 * 1000,
): Promise<MonteCarloResult | null> {
  const entries = await getMetricRange(metric, Date.now() - windowMs, Date.now());
  if (entries.length < 5) return null;

  const values = entries.map(e => e.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);

  const results: number[] = [];
  for (let i = 0; i < simulations; i++) {
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * stdDev * 2;
    const trendComponent = (Math.random() - 0.5) * stdDev * 0.5;
    results.push(Math.max(0, mean + noise + trendComponent));
  }

  results.sort((a, b) => a - b);

  const p10 = results[Math.floor(simulations * 0.1)] ?? 0;
  const p90 = results[Math.floor(simulations * 0.9)] ?? 0;
  const median = results[Math.floor(simulations * 0.5)] ?? 0;

  return {
    metric,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    p10: Math.round(p10 * 100) / 100,
    p90: Math.round(p90 * 100) / 100,
    probabilityAbove: (threshold: number) => {
      const count = results.filter(r => r > threshold).length;
      return Math.round((count / simulations) * 100);
    },
    simulations,
  };
}

export async function computeCostOfInaction(
  disruptionPct: number,
  dailyImportBpd: number,
  pricePerBarrel: number,
  daysRemaining: number = 30,
): Promise<{
  dailyLoss: number;
  totalLoss: number;
  priceImpact: number;
  recommendation: string;
}> {
  const barrelsLostPerDay = dailyImportBpd * (disruptionPct / 100);
  const dailyLoss = barrelsLostPerDay * pricePerBarrel;
  const totalLoss = dailyLoss * daysRemaining;
  const priceImpact = disruptionPct * 0.8;

  let recommendation: string;
  if (totalLoss > 1_000_000_000) {
    recommendation = 'CRITICAL: Immediate emergency procurement required. Activate strategic reserves.';
  } else if (totalLoss > 500_000_000) {
    recommendation = 'HIGH: Diversify supply sources and extend cover days. Pre-clear alternate ports.';
  } else if (totalLoss > 100_000_000) {
    recommendation = 'MEDIUM: Monitor closely and quote bypass premiums. Consider forward hedging.';
  } else {
    recommendation = 'LOW: Maintain current posture. Reassess if disruption persists beyond 7 days.';
  }

  return {
    dailyLoss: Math.round(dailyLoss),
    totalLoss: Math.round(totalLoss),
    priceImpact: Math.round(priceImpact * 100) / 100,
    recommendation,
  };
}

export const ORION_PREDICTIONS = {
  HORMUZ_DISRUPTION_PROB: 'orion.chokepoint.disruption_prob',
  RED_SEA_DISRUPTION_PROB: 'orion.chokepoint.red_sea.disruption_prob',
  BRENT_PRICE: 'orion.market.brent',
  WTI_PRICE: 'orion.market.wti',
  NATGAS_PRICE: 'orion.market.natgas',
  SHIPPING_STRESS: 'orion.shipping.stress',
  ENERGY_SHOCK_SCORE: 'orion.energy.shock_score',
} as const;
