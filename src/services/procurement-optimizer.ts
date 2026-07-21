import { IMPORTER_COUNTRY_CONFIG, type EnergySupplyProduct } from '@/config/energy-supply-network';

export interface SupplierRiskProfile {
  sourceCountry: string;
  sourceName: string;
  product: EnergySupplyProduct;
  volumeBpd: number;
  pricePerBarrel: number;
  transportCostPerBarrel: number;
  deliveryDays: number;
  reliabilityScore: number;
  geopoliticalRisk: number;
  routeRisk: number;
  shippingRisk: number;
  insurancePremiumPct: number;
  sanctionsRisk: number;
  overallRisk: number;
  chokepoints: string[];
  region: string;
}

export interface ProcurementMixEntry {
  supplierId: string;
  sourceName: string;
  countryCode: string;
  product: EnergySupplyProduct;
  sharePct: number;
  volumeBpd: number;
  costPerBarrel: number;
  riskScore: number;
  chokepoints: string[];
}

export interface SupplierChange {
  sourceName: string;
  countryCode: string;
  currentSharePct: number;
  recommendedSharePct: number;
  changePct: number;
  reason: string;
}

export interface WhyReason {
  category: 'risk' | 'cost' | 'resilience' | 'diversification' | 'stability' | 'sanctions' | 'route';
  severity: 'critical' | 'high' | 'medium' | 'low';
  headline: string;
  detail: string;
  affectedSuppliers: string[];
}

export interface ProcurementRecommendation {
  id: string;
  countryCode: string;
  countryName: string;
  currentMix: ProcurementMixEntry[];
  recommendedMix: ProcurementMixEntry[];
  currentRisk: number;
  recommendedRisk: number;
  riskReductionPct: number;
  costIncreasePct: number;
  supplyStabilityImprovement: number;
  resilienceImprovement: number;
  currentCostPerBarrel: number;
  recommendedCostPerBarrel: number;
  diversificationScore: number;
  gulfDependencyPct: number;
  recommendedGulfPct: number;
  supplierChanges: SupplierChange[];
  whyReasons: WhyReason[];
  generatedAt: string;
}

const SUPPLIER_PROFILES: SupplierRiskProfile[] = [
  { sourceCountry: 'SA', sourceName: 'Saudi Arabia', product: 'crude', volumeBpd: 2_000_000, pricePerBarrel: 78, transportCostPerBarrel: 2.5, deliveryDays: 15, reliabilityScore: 85, geopoliticalRisk: 40, routeRisk: 35, shippingRisk: 25, insurancePremiumPct: 3.2, sanctionsRisk: 5, overallRisk: 38, chokepoints: ['hormuz_strait'], region: 'gulf' },
  { sourceCountry: 'AE', sourceName: 'UAE', product: 'crude', volumeBpd: 1_000_000, pricePerBarrel: 79, transportCostPerBarrel: 2.8, deliveryDays: 14, reliabilityScore: 82, geopoliticalRisk: 35, routeRisk: 30, shippingRisk: 20, insurancePremiumPct: 2.8, sanctionsRisk: 5, overallRisk: 32, chokepoints: ['hormuz_strait'], region: 'gulf' },
  { sourceCountry: 'IQ', sourceName: 'Iraq', product: 'crude', volumeBpd: 1_500_000, pricePerBarrel: 76, transportCostPerBarrel: 3.0, deliveryDays: 16, reliabilityScore: 70, geopoliticalRisk: 60, routeRisk: 45, shippingRisk: 35, insurancePremiumPct: 5.5, sanctionsRisk: 15, overallRisk: 55, chokepoints: ['hormuz_strait'], region: 'gulf' },
  { sourceCountry: 'QA', sourceName: 'Qatar', product: 'lng', volumeBpd: 800_000, pricePerBarrel: 82, transportCostPerBarrel: 3.5, deliveryDays: 18, reliabilityScore: 88, geopoliticalRisk: 30, routeRisk: 28, shippingRisk: 18, insurancePremiumPct: 2.5, sanctionsRisk: 5, overallRisk: 28, chokepoints: ['hormuz_strait'], region: 'gulf' },
  { sourceCountry: 'KW', sourceName: 'Kuwait', product: 'crude', volumeBpd: 1_200_000, pricePerBarrel: 77, transportCostPerBarrel: 2.6, deliveryDays: 15, reliabilityScore: 80, geopoliticalRisk: 38, routeRisk: 32, shippingRisk: 22, insurancePremiumPct: 3.0, sanctionsRisk: 8, overallRisk: 35, chokepoints: ['hormuz_strait'], region: 'gulf' },
  { sourceCountry: 'OM', sourceName: 'Oman', product: 'crude', volumeBpd: 900_000, pricePerBarrel: 78, transportCostPerBarrel: 2.7, deliveryDays: 14, reliabilityScore: 78, geopoliticalRisk: 32, routeRisk: 28, shippingRisk: 20, insurancePremiumPct: 2.6, sanctionsRisk: 5, overallRisk: 30, chokepoints: ['hormuz_strait'], region: 'gulf' },
  { sourceCountry: 'RU', sourceName: 'Russia', product: 'crude', volumeBpd: 1_200_000, pricePerBarrel: 74, transportCostPerBarrel: 4.0, deliveryDays: 25, reliabilityScore: 60, geopoliticalRisk: 75, routeRisk: 55, shippingRisk: 45, insurancePremiumPct: 8.0, sanctionsRisk: 85, overallRisk: 72, chokepoints: ['bosphorus', 'suez'], region: 'russia' },
  { sourceCountry: 'US', sourceName: 'United States', product: 'lng', volumeBpd: 1_500_000, pricePerBarrel: 85, transportCostPerBarrel: 4.5, deliveryDays: 22, reliabilityScore: 90, geopoliticalRisk: 10, routeRisk: 15, shippingRisk: 18, insurancePremiumPct: 1.5, sanctionsRisk: 2, overallRisk: 12, chokepoints: ['panama_canal'], region: 'usa' },
  { sourceCountry: 'NO', sourceName: 'Norway', product: 'crude', volumeBpd: 1_800_000, pricePerBarrel: 80, transportCostPerBarrel: 2.0, deliveryDays: 10, reliabilityScore: 95, geopoliticalRisk: 5, routeRisk: 8, shippingRisk: 10, insurancePremiumPct: 1.0, sanctionsRisk: 2, overallRisk: 8, chokepoints: [], region: 'europe' },
  { sourceCountry: 'BR', sourceName: 'Brazil', product: 'crude', volumeBpd: 1_000_000, pricePerBarrel: 77, transportCostPerBarrel: 3.5, deliveryDays: 20, reliabilityScore: 75, geopoliticalRisk: 20, routeRisk: 22, shippingRisk: 20, insurancePremiumPct: 2.0, sanctionsRisk: 3, overallRisk: 20, chokepoints: ['cape_of_good_hope'], region: 'americas' },
  { sourceCountry: 'NG', sourceName: 'Nigeria', product: 'crude', volumeBpd: 800_000, pricePerBarrel: 75, transportCostPerBarrel: 3.0, deliveryDays: 18, reliabilityScore: 65, geopoliticalRisk: 45, routeRisk: 38, shippingRisk: 32, insurancePremiumPct: 4.5, sanctionsRisk: 10, overallRisk: 42, chokepoints: ['cape_of_good_hope'], region: 'africa' },
  { sourceCountry: 'DZ', sourceName: 'Algeria', product: 'lng', volumeBpd: 600_000, pricePerBarrel: 80, transportCostPerBarrel: 2.5, deliveryDays: 12, reliabilityScore: 72, geopoliticalRisk: 35, routeRisk: 18, shippingRisk: 15, insurancePremiumPct: 2.8, sanctionsRisk: 5, overallRisk: 28, chokepoints: [], region: 'africa' },
  { sourceCountry: 'TN', sourceName: 'Trinidad', product: 'lng', volumeBpd: 400_000, pricePerBarrel: 83, transportCostPerBarrel: 3.0, deliveryDays: 14, reliabilityScore: 78, geopoliticalRisk: 15, routeRisk: 12, shippingRisk: 14, insurancePremiumPct: 1.8, sanctionsRisk: 2, overallRisk: 14, chokepoints: [], region: 'americas' },
];

const DEFAULT_COUNTRY_MIXES: Record<string, Array<{ id: string; sharePct: number }>> = {
  IN: [
    { id: 'IQ', sharePct: 35 }, { id: 'SA', sharePct: 25 }, { id: 'AE', sharePct: 15 },
    { id: 'RU', sharePct: 10 }, { id: 'US', sharePct: 10 }, { id: 'NG', sharePct: 5 },
  ],
  CN: [
    { id: 'SA', sharePct: 30 }, { id: 'RU', sharePct: 20 }, { id: 'NG', sharePct: 15 },
    { id: 'QA', sharePct: 10 }, { id: 'BR', sharePct: 10 }, { id: 'US', sharePct: 15 },
  ],
  JP: [
    { id: 'SA', sharePct: 35 }, { id: 'AE', sharePct: 15 }, { id: 'QA', sharePct: 20 },
    { id: 'US', sharePct: 15 }, { id: 'NO', sharePct: 15 },
  ],
  KR: [
    { id: 'SA', sharePct: 30 }, { id: 'KW', sharePct: 15 }, { id: 'QA', sharePct: 20 },
    { id: 'US', sharePct: 15 }, { id: 'NO', sharePct: 10 }, { id: 'NG', sharePct: 10 },
  ],
  EU: [
    { id: 'NO', sharePct: 30 }, { id: 'RU', sharePct: 15 }, { id: 'NG', sharePct: 15 },
    { id: 'US', sharePct: 20 }, { id: 'DZ', sharePct: 10 }, { id: 'BR', sharePct: 10 },
  ],
  TW: [
    { id: 'SA', sharePct: 30 }, { id: 'RU', sharePct: 20 }, { id: 'US', sharePct: 15 },
    { id: 'NG', sharePct: 15 }, { id: 'QA', sharePct: 10 }, { id: 'AE', sharePct: 10 },
  ],
  TH: [
    { id: 'SA', sharePct: 30 }, { id: 'AE', sharePct: 20 }, { id: 'NG', sharePct: 15 },
    { id: 'QA', sharePct: 15 }, { id: 'OM', sharePct: 10 }, { id: 'TN', sharePct: 10 },
  ],
  VN: [
    { id: 'SA', sharePct: 35 }, { id: 'RU', sharePct: 25 }, { id: 'NG', sharePct: 20 },
    { id: 'OM', sharePct: 10 }, { id: 'TN', sharePct: 10 },
  ],
  SG: [
    { id: 'SA', sharePct: 25 }, { id: 'AE', sharePct: 20 }, { id: 'RU', sharePct: 15 },
    { id: 'NG', sharePct: 15 }, { id: 'OM', sharePct: 15 }, { id: 'DZ', sharePct: 10 },
  ],
  US: [
    { id: 'US', sharePct: 40 }, { id: 'NO', sharePct: 25 }, { id: 'BR', sharePct: 15 },
    { id: 'NG', sharePct: 10 }, { id: 'TN', sharePct: 10 },
  ],
};

function getSupplierByCountry(code: string): SupplierRiskProfile | undefined {
  return SUPPLIER_PROFILES.find(s => s.sourceCountry === code);
}

function buildMix(_countryCode: string, mixDef: Array<{ id: string; sharePct: number }>): ProcurementMixEntry[] {
  const totalVolume = 4_000_000;
  return mixDef.map(entry => {
    const supplier = getSupplierByCountry(entry.id);
    if (!supplier) return null;
    const volumeBpd = Math.round(totalVolume * entry.sharePct / 100);
    return {
      supplierId: entry.id,
      sourceName: supplier.sourceName,
      countryCode: entry.id,
      product: supplier.product,
      sharePct: entry.sharePct,
      volumeBpd,
      costPerBarrel: supplier.pricePerBarrel + supplier.transportCostPerBarrel + (supplier.pricePerBarrel * supplier.insurancePremiumPct / 100),
      riskScore: supplier.overallRisk,
      chokepoints: supplier.chokepoints,
    };
  }).filter((e): e is ProcurementMixEntry => Boolean(e));
}

function computeMixCost(mix: ProcurementMixEntry[]): number {
  if (mix.length === 0) return 0;
  const totalVolume = mix.reduce((s, e) => s + e.volumeBpd, 0);
  if (totalVolume === 0) return 0;
  return mix.reduce((s, e) => s + e.costPerBarrel * e.volumeBpd, 0) / totalVolume;
}

function computeMixRisk(mix: ProcurementMixEntry[]): number {
  if (mix.length === 0) return 0;
  const totalVolume = mix.reduce((s, e) => s + e.volumeBpd, 0);
  if (totalVolume === 0) return 0;
  return mix.reduce((s, e) => s + e.riskScore * (e.volumeBpd / totalVolume), 0);
}

function computeHHI(mix: ProcurementMixEntry[]): number {
  return mix.reduce((s, e) => s + (e.sharePct / 100) ** 2, 0);
}

function computeGulfPct(mix: ProcurementMixEntry[]): number {
  return mix
    .filter(e => e.chokepoints.includes('hormuz_strait'))
    .reduce((s, e) => s + e.sharePct, 0);
}

function computeStabilityScore(mix: ProcurementMixEntry[]): number {
  if (mix.length === 0) return 0;
  const avgReliability = mix.reduce((s, e) => {
    const supplier = getSupplierByCountry(e.countryCode);
    return s + (supplier?.reliabilityScore ?? 70);
  }, 0) / mix.length;
  const avgDelivery = mix.reduce((s, e) => {
    const supplier = getSupplierByCountry(e.countryCode);
    return s + (supplier?.deliveryDays ?? 20);
  }, 0) / mix.length;
  const deliveryScore = Math.max(0, 100 - avgDelivery * 2);
  const hhi = computeHHI(mix);
  const diversificationBonus = (1 - hhi) * 30;
  return Math.round(avgReliability * 0.5 + deliveryScore * 0.2 + diversificationBonus);
}

function findBetterSuppliers(
  countryCode: string,
  currentMix: ProcurementMixEntry[],
  maxGulfPct: number,
): { id: string; sharePct: number }[] {
  const currentGulfPct = computeGulfPct(currentMix);
  const needGulfReduction = currentGulfPct > maxGulfPct;

  const nonGulfLowRisk = SUPPLIER_PROFILES
    .filter(s => s.sourceCountry !== countryCode && !s.chokepoints.includes('hormuz_strait') && s.overallRisk < 30)
    .sort((a, b) => a.overallRisk - b.overallRisk);

  const newMix: Array<{ id: string; sharePct: number }> = [];

  for (const entry of currentMix) {
    const supplier = getSupplierByCountry(entry.countryCode);
    if (!supplier) continue;

    if (entry.riskScore > 55) {
      const replacement = nonGulfLowRisk.find(s => s.sourceCountry !== entry.countryCode);
      if (replacement) {
        const reducedPct = Math.max(5, entry.sharePct - 15);
        const gainPct = entry.sharePct - reducedPct;
        newMix.push({ id: entry.countryCode, sharePct: reducedPct });
        const existingReplacement = newMix.find(n => n.id === replacement.sourceCountry);
        if (existingReplacement) {
          existingReplacement.sharePct += gainPct;
        } else {
          newMix.push({ id: replacement.sourceCountry, sharePct: gainPct });
        }
        continue;
      }
    }

    if (needGulfReduction && entry.chokepoints?.includes('hormuz_strait') && entry.sharePct > 15) {
      const reducedPct = 15;
      const gainPct = entry.sharePct - reducedPct;
      newMix.push({ id: entry.countryCode, sharePct: reducedPct });
      const replacement = nonGulfLowRisk.find(s => !newMix.some(n => n.id === s.sourceCountry));
      if (replacement) {
        const existingReplacement = newMix.find(n => n.id === replacement.sourceCountry);
        if (existingReplacement) {
          existingReplacement.sharePct += gainPct;
        } else {
          newMix.push({ id: replacement.sourceCountry, sharePct: gainPct });
        }
      }
      continue;
    }

    const existing = newMix.find(n => n.id === entry.countryCode);
    if (existing) {
      existing.sharePct += entry.sharePct;
    } else {
      newMix.push({ id: entry.countryCode, sharePct: entry.sharePct });
    }
  }

  const existingCountries = new Set(newMix.map(n => n.id));
  const remainingNonGulf = nonGulfLowRisk.filter(s => !existingCountries.has(s.sourceCountry));
  if (remainingNonGulf.length > 0 && newMix.length < 6) {
    const gap = 100 - newMix.reduce((s, n) => s + n.sharePct, 0);
    if (gap > 0) {
      const best = remainingNonGulf[0]!;
      newMix.push({ id: best.sourceCountry, sharePct: Math.min(gap, 10) });
    }
  }

  const total = newMix.reduce((s, n) => s + n.sharePct, 0);
  if (total > 0 && Math.abs(total - 100) > 0.5) {
    const scale = 100 / total;
    for (const n of newMix) n.sharePct = Math.round(n.sharePct * scale);
    const diff = 100 - newMix.reduce((s, n) => s + n.sharePct, 0);
    if (diff !== 0 && newMix.length > 0) newMix[0]!.sharePct += diff;
  }

  return newMix.sort((a, b) => b.sharePct - a.sharePct);
}

function buildWhyReasons(
  countryCode: string,
  currentMix: ProcurementMixEntry[],
  _recommendedMix: ProcurementMixEntry[],
  currentRisk: number,
  recommendedRisk: number,
  costIncreasePct: number,
): WhyReason[] {
  const reasons: WhyReason[] = [];

  const gulfPct = computeGulfPct(currentMix);
  if (gulfPct > 40) {
    const gulfSuppliers = currentMix.filter(e => e.chokepoints.includes('hormuz_strait'));
    reasons.push({
      category: 'risk',
      severity: 'critical',
      headline: `Gulf dependency at ${Math.round(gulfPct)}% exceeds safety threshold`,
      detail: `${gulfSuppliers.map(e => e.sourceName).join(', ')} account for ${Math.round(gulfPct)}% of supply. A Hormuz closure would disrupt ${Math.round(gulfPct)}% of imports. Recommend capping Gulf exposure at 35-40% to limit single-chokepoint risk.`,
      affectedSuppliers: gulfSuppliers.map(e => e.sourceName),
    });
  }

  const highRisk = currentMix.filter(e => e.riskScore > 50);
  if (highRisk.length > 0) {
    const totalHighRiskShare = highRisk.reduce((s, e) => s + e.sharePct, 0);
    reasons.push({
      category: 'sanctions',
      severity: 'high',
      headline: `${highRisk.length} supplier(s) with elevated geopolitical/sanctions risk`,
      detail: `${highRisk.map(e => `${e.sourceName} (${e.riskScore} risk)`).join(', ')} represent ${totalHighRiskShare}% of supply. These suppliers face sanctions exposure, conflict zone transit, or political instability that could disrupt flows at short notice.`,
      affectedSuppliers: highRisk.map(e => e.sourceName),
    });
  }

  const hhi = computeHHI(currentMix);
  if (hhi > 0.2) {
    const dominant = [...currentMix].sort((a, b) => b.sharePct - a.sharePct).slice(0, 2);
    reasons.push({
      category: 'diversification',
      severity: 'medium',
      headline: `Supplier concentration (HHI ${(hhi * 1000).toFixed(0)}) above optimal`,
      detail: `${dominant.map(e => `${e.sourceName} (${e.sharePct}%)`).join(' and ')} dominate the mix. A diversified portfolio (HHI < 0.15) reduces vulnerability to any single supplier disruption.`,
      affectedSuppliers: dominant.map(e => e.sourceName),
    });
  }

  const slowSuppliers = currentMix.filter(e => {
    const s = getSupplierByCountry(e.countryCode);
    return s && s.deliveryDays > 20;
  });
  if (slowSuppliers.length > 0) {
    reasons.push({
      category: 'stability',
      severity: 'medium',
      headline: `${slowSuppliers.length} supplier(s) with extended delivery times`,
      detail: `${slowSuppliers.map(e => `${e.sourceName} (${getSupplierByCountry(e.countryCode)?.deliveryDays ?? '?'}d)`).join(', ')} have delivery times > 20 days. Shorter delivery windows improve response flexibility during supply disruptions.`,
      affectedSuppliers: slowSuppliers.map(e => e.sourceName),
    });
  }

  const cheapLowRisk = SUPPLIER_PROFILES.filter(s =>
    s.sourceCountry !== countryCode &&
    !s.chokepoints.includes('hormuz_strait') &&
    s.overallRisk < 20 &&
    s.reliabilityScore > 85
  );
  if (cheapLowRisk.length > 0) {
    const notUsed = cheapLowRisk.filter(s => !currentMix.some(e => e.countryCode === s.sourceCountry));
    if (notUsed.length > 0) {
      reasons.push({
        category: 'resilience',
        severity: 'high',
        headline: `Untapped low-risk suppliers available`,
        detail: `${notUsed.map(s => s.sourceName).join(', ')} offer risk scores < 20 with reliability > 85%. Adding these to the mix would improve resilience without significant cost increase.`,
        affectedSuppliers: notUsed.map(s => s.sourceName),
      });
    }
  }

  if (costIncreasePct > 5) {
    reasons.push({
      category: 'cost',
      severity: 'low',
      headline: `Cost increase of ${costIncreasePct.toFixed(1)}% accepted for resilience`,
      detail: `The recommended mix costs ${costIncreasePct.toFixed(1)}% more per barrel but reduces overall risk by ${Math.round((1 - recommendedRisk / currentRisk) * 100)}%. The cost premium is justified by lower disruption probability and reduced insurance exposure.`,
      affectedSuppliers: [],
    });
  }

  reasons.sort((a, b) => {
    const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return (sevOrder[b.severity] ?? 0) - (sevOrder[a.severity] ?? 0);
  });

  return reasons;
}

export async function optimizeProcurement(countryCode: string): Promise<ProcurementRecommendation> {
  const countryConfig = IMPORTER_COUNTRY_CONFIG.find(c => c.code === countryCode);
  const mixDef = DEFAULT_COUNTRY_MIXES[countryCode] || DEFAULT_COUNTRY_MIXES['IN']!;
  const currentMix = buildMix(countryCode, mixDef);

  const currentCost = computeMixCost(currentMix);
  const currentRisk = computeMixRisk(currentMix);
  const currentStability = computeStabilityScore(currentMix);
  const currentHHI = computeHHI(currentMix);
  const currentGulfPct = computeGulfPct(currentMix);

  const betterMixDef = findBetterSuppliers(countryCode, currentMix, 40);
  const recommendedMix = buildMix(countryCode, betterMixDef);

  const recommendedCost = computeMixCost(recommendedMix);
  const recommendedRisk = computeMixRisk(recommendedMix);
  const recommendedStability = computeStabilityScore(recommendedMix);
  const recommendedHHI = computeHHI(recommendedMix);
  const recommendedGulfPct = computeGulfPct(recommendedMix);

  const riskReductionPct = currentRisk > 0 ? Math.round((1 - recommendedRisk / currentRisk) * 100) : 0;
  const costIncreasePct = currentCost > 0 ? Math.round((recommendedCost / currentCost - 1) * 100 * 10) / 10 : 0;
  const stabilityImprovement = Math.round(recommendedStability - currentStability);
  const resilienceImprovement = Math.round((1 - recommendedHHI) * 100 - (1 - currentHHI) * 100);

  const supplierChanges: SupplierChange[] = [];
  const allCountryCodes = new Set([...currentMix.map(e => e.countryCode), ...recommendedMix.map(e => e.countryCode)]);
  for (const code of allCountryCodes) {
    const current = currentMix.find(e => e.countryCode === code);
    const recommended = recommendedMix.find(e => e.countryCode === code);
    const currentPct = current?.sharePct ?? 0;
    const recommendedPct = recommended?.sharePct ?? 0;
    if (Math.abs(currentPct - recommendedPct) < 0.5) continue;
    const supplier = getSupplierByCountry(code);
    let reason = '';
    if (currentPct > recommendedPct) {
      if (supplier && supplier.overallRisk > 50) reason = `Reduce exposure: ${supplier.sourceName} risk score ${supplier.overallRisk}`;
      else if (supplier && supplier.chokepoints.includes('hormuz_strait')) reason = `Reduce Gulf dependency for Hormuz resilience`;
      else reason = `Rebalance to diversify supplier base`;
    } else {
      if (supplier && supplier.overallRisk < 25) reason = `Increase: low-risk supplier (${supplier.overallRisk} risk, ${supplier.reliabilityScore}% reliability)`;
      else if (supplier && !supplier.chokepoints.includes('hormuz_strait')) reason = `Increase: non-Gulf route reduces chokepoint exposure`;
      else reason = `Strategic increase for portfolio balance`;
    }
    supplierChanges.push({
      sourceName: supplier?.sourceName ?? code,
      countryCode: code,
      currentSharePct: currentPct,
      recommendedSharePct: recommendedPct,
      changePct: Math.round(recommendedPct - currentPct),
      reason,
    });
  }
  supplierChanges.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));

  const whyReasons = buildWhyReasons(countryCode, currentMix, recommendedMix, currentRisk, recommendedRisk, costIncreasePct);

  return {
    id: `procurement-${countryCode}-${Date.now()}`,
    countryCode,
    countryName: countryConfig?.name ?? countryCode,
    currentMix,
    recommendedMix,
    currentRisk: Math.round(currentRisk),
    recommendedRisk: Math.round(recommendedRisk),
    riskReductionPct,
    costIncreasePct,
    supplyStabilityImprovement: stabilityImprovement,
    resilienceImprovement,
    currentCostPerBarrel: Math.round(currentCost * 100) / 100,
    recommendedCostPerBarrel: Math.round(recommendedCost * 100) / 100,
    diversificationScore: Math.round((1 - recommendedHHI) * 100),
    gulfDependencyPct: Math.round(currentGulfPct),
    recommendedGulfPct: Math.round(recommendedGulfPct),
    supplierChanges,
    whyReasons,
    generatedAt: new Date().toISOString(),
  };
}

export function getSupplierProfiles(): SupplierRiskProfile[] {
  return [...SUPPLIER_PROFILES];
}

// ── Live data fetching ──────────────────────────────────────────────
import { fetchCommodityQuotes } from '@/services/market';
import { fetchCachedRiskScores, type CachedCIIScore } from '@/services/cached-risk-scores';
import { fetchSanctionsPressure, type CountrySanctionsPressure } from '@/services/sanctions-pressure';
import { fetchChokepointStatus, type GetChokepointStatusResponse } from '@/services/supply-chain';

export interface LiveSupplierData {
  profiles: SupplierRiskProfile[];
  fetchedAt: string;
  liveSources: string[];
}

function buildLiveRiskFromCII(code: string, ciiScores: CachedCIIScore[]): number {
  const match = ciiScores.find(c => c.code === code || c.code?.toUpperCase() === code);
  if (!match) return 25;
  return Math.min(100, Math.max(0, match.score));
}

function buildSanctionsRisk(code: string, sanctions: CountrySanctionsPressure[]): number {
  const match = sanctions.find(s => s.countryCode === code || s.countryCode?.toUpperCase() === code);
  if (!match) return 2;
  const total = match.entryCount;
  if (total > 5000) return 90;
  if (total > 2000) return 70;
  if (total > 500) return 45;
  if (total > 100) return 25;
  if (total > 10) return 10;
  return 2;
}

function buildRouteRisk(chokepoints: string[], chokeStatus: GetChokepointStatusResponse): number {
  if (chokepoints.length === 0) return 5;
  let maxDisruption = 0;
  for (const cpId of chokepoints) {
    const cp = chokeStatus.chokepoints.find(c => c.id === cpId);
    if (cp) maxDisruption = Math.max(maxDisruption, cp.disruptionScore);
  }
  return Math.min(100, maxDisruption);
}

const SUPPLIER_META: Array<{
  code: string; name: string; product: EnergySupplyProduct; region: string;
  basePrice: number; transportCost: number; deliveryDays: number;
  reliabilityBase: number; geoRiskBase: number; shippingRiskBase: number;
  insurancePctBase: number; chokepoints: string[];
}> = [
  { code: 'SA', name: 'Saudi Arabia', product: 'crude', region: 'gulf', basePrice: 78, transportCost: 2.5, deliveryDays: 15, reliabilityBase: 85, geoRiskBase: 40, shippingRiskBase: 25, insurancePctBase: 3.2, chokepoints: ['hormuz_strait'] },
  { code: 'AE', name: 'UAE', product: 'crude', region: 'gulf', basePrice: 79, transportCost: 2.8, deliveryDays: 14, reliabilityBase: 82, geoRiskBase: 35, shippingRiskBase: 20, insurancePctBase: 2.8, chokepoints: ['hormuz_strait'] },
  { code: 'IQ', name: 'Iraq', product: 'crude', region: 'gulf', basePrice: 76, transportCost: 3.0, deliveryDays: 16, reliabilityBase: 70, geoRiskBase: 60, shippingRiskBase: 35, insurancePctBase: 5.5, chokepoints: ['hormuz_strait'] },
  { code: 'QA', name: 'Qatar', product: 'lng', region: 'gulf', basePrice: 82, transportCost: 3.5, deliveryDays: 18, reliabilityBase: 88, geoRiskBase: 30, shippingRiskBase: 18, insurancePctBase: 2.5, chokepoints: ['hormuz_strait'] },
  { code: 'KW', name: 'Kuwait', product: 'crude', region: 'gulf', basePrice: 77, transportCost: 2.6, deliveryDays: 15, reliabilityBase: 80, geoRiskBase: 38, shippingRiskBase: 22, insurancePctBase: 3.0, chokepoints: ['hormuz_strait'] },
  { code: 'OM', name: 'Oman', product: 'crude', region: 'gulf', basePrice: 78, transportCost: 2.7, deliveryDays: 14, reliabilityBase: 78, geoRiskBase: 32, shippingRiskBase: 20, insurancePctBase: 2.6, chokepoints: ['hormuz_strait'] },
  { code: 'RU', name: 'Russia', product: 'crude', region: 'russia', basePrice: 74, transportCost: 4.0, deliveryDays: 25, reliabilityBase: 60, geoRiskBase: 75, shippingRiskBase: 45, insurancePctBase: 8.0, chokepoints: ['bosphorus', 'suez'] },
  { code: 'US', name: 'United States', product: 'lng', region: 'usa', basePrice: 85, transportCost: 4.5, deliveryDays: 22, reliabilityBase: 90, geoRiskBase: 10, shippingRiskBase: 18, insurancePctBase: 1.5, chokepoints: ['panama_canal'] },
  { code: 'NO', name: 'Norway', product: 'crude', region: 'europe', basePrice: 80, transportCost: 2.0, deliveryDays: 10, reliabilityBase: 95, geoRiskBase: 5, shippingRiskBase: 10, insurancePctBase: 1.0, chokepoints: [] },
  { code: 'BR', name: 'Brazil', product: 'crude', region: 'americas', basePrice: 77, transportCost: 3.5, deliveryDays: 20, reliabilityBase: 75, geoRiskBase: 20, shippingRiskBase: 20, insurancePctBase: 2.0, chokepoints: ['cape_of_good_hope'] },
  { code: 'NG', name: 'Nigeria', product: 'crude', region: 'africa', basePrice: 75, transportCost: 3.0, deliveryDays: 18, reliabilityBase: 65, geoRiskBase: 45, shippingRiskBase: 32, insurancePctBase: 4.5, chokepoints: ['cape_of_good_hope'] },
  { code: 'DZ', name: 'Algeria', product: 'lng', region: 'africa', basePrice: 80, transportCost: 2.5, deliveryDays: 12, reliabilityBase: 72, geoRiskBase: 35, shippingRiskBase: 15, insurancePctBase: 2.8, chokepoints: [] },
  { code: 'TN', name: 'Trinidad', product: 'lng', region: 'americas', basePrice: 83, transportCost: 3.0, deliveryDays: 14, reliabilityBase: 78, geoRiskBase: 15, shippingRiskBase: 14, insurancePctBase: 1.8, chokepoints: [] },
];

export async function fetchLiveSupplierData(): Promise<LiveSupplierData> {
  const liveSources: string[] = [];
  const [commodities, riskScores, sanctions, chokeStatus] = await Promise.all([
    fetchCommodityQuotes([{ symbol: 'BZ=F', name: 'Brent Crude', display: 'BRENT' }]).catch(() => null),
    fetchCachedRiskScores().catch(() => null),
    fetchSanctionsPressure().catch(() => null),
    fetchChokepointStatus().catch(() => null),
  ]);

  const brentPrice = commodities?.data?.[0]?.price ?? 78;

  const ciiScores = riskScores?.cii ?? [];
  if (ciiScores.length > 0) liveSources.push('CII Risk Scores');

  const sanctionsCountries = sanctions?.countries ?? [];
  if (sanctionsCountries.length > 0) liveSources.push('OFAC Sanctions');

  const chokepoints = chokeStatus?.chokepoints ?? [];
  if (chokepoints.length > 0) liveSources.push('AIS Chokepoint Data');

  const profiles: SupplierRiskProfile[] = SUPPLIER_META.map(meta => {
    const ciiRisk = buildLiveRiskFromCII(meta.code, ciiScores);
    const sanctionRisk = buildSanctionsRisk(meta.code, sanctionsCountries);
    const routeRisk = buildRouteRisk(meta.chokepoints, chokeStatus ?? { chokepoints: [], fetchedAt: '', upstreamUnavailable: true });

    const pricePerBarrel = meta.basePrice * (brentPrice / 78);
    const geopoliticalRisk = Math.round(ciiRisk * 0.6 + meta.geoRiskBase * 0.4);
    const overallRisk = Math.round(
      geopoliticalRisk * 0.35 +
      routeRisk * 0.25 +
      sanctionRisk * 0.20 +
      meta.shippingRiskBase * 0.20
    );
    const reliabilityScore = Math.max(50, Math.min(99, meta.reliabilityBase - Math.round(sanctionRisk * 0.15)));

    return {
      sourceCountry: meta.code,
      sourceName: meta.name,
      product: meta.product,
      volumeBpd: 1_000_000,
      pricePerBarrel: Math.round(pricePerBarrel * 100) / 100,
      transportCostPerBarrel: meta.transportCost,
      deliveryDays: meta.deliveryDays,
      reliabilityScore,
      geopoliticalRisk,
      routeRisk: Math.round(routeRisk),
      shippingRisk: meta.shippingRiskBase,
      insurancePremiumPct: meta.insurancePctBase + Math.round(sanctionRisk * 0.05 * 10) / 10,
      sanctionsRisk: Math.round(sanctionRisk),
      overallRisk: Math.min(100, overallRisk),
      chokepoints: meta.chokepoints,
      region: meta.region,
    };
  });

  return {
    profiles,
    fetchedAt: new Date().toISOString(),
    liveSources,
  };
}

// ── Efficient frontier computation ──────────────────────────────────

export interface FrontierPoint {
  cost: number;
  risk: number;
  resilience: number;
  allocations: Record<string, number>;
}

export interface PortfolioMetrics {
  expectedCost: number;
  riskScore: number;
  resilienceScore: number;
  supplyStability: number;
  deliveryTime: number;
  disruptionProbability: number;
  gulfExposure: number;
  hhi: number;
  insuranceCostPct: number;
  insuranceCostPerBarrel: number;
}

export function computePortfolioMetrics(
  allocations: Record<string, number>,
  profiles: SupplierRiskProfile[],
): PortfolioMetrics {
  const totalAlloc = Object.values(allocations).reduce((s, v) => s + v, 0);
  if (totalAlloc === 0) {
    return { expectedCost: 0, riskScore: 0, resilienceScore: 0, supplyStability: 0, deliveryTime: 0, disruptionProbability: 0, gulfExposure: 0, hhi: 0, insuranceCostPct: 0, insuranceCostPerBarrel: 0 };
  }

  let expectedCost = 0;
  let riskScore = 0;
  let deliveryTime = 0;
  let reliabilitySum = 0;
  let gulfExposure = 0;
  let hhi = 0;
  let insuranceCostPct = 0;
  let insuranceCostPerBarrel = 0;

  for (const [code, alloc] of Object.entries(allocations)) {
    const pct = alloc / totalAlloc;
    const profile = profiles.find(p => p.sourceCountry === code);
    if (!profile) continue;

    const insCost = profile.pricePerBarrel * profile.insurancePremiumPct / 100;
    expectedCost += (profile.pricePerBarrel + profile.transportCostPerBarrel + insCost) * pct;
    insuranceCostPct += profile.insurancePremiumPct * pct;
    insuranceCostPerBarrel += insCost * pct;
    riskScore += profile.overallRisk * pct;
    deliveryTime += profile.deliveryDays * pct;
    reliabilitySum += profile.reliabilityScore * pct;
    hhi += pct * pct;

    if (profile.chokepoints.includes('hormuz_strait')) {
      gulfExposure += pct * 100;
    }
  }

  const resilienceScore = Math.round((1 - hhi) * 100);
  const supplyStability = Math.round(reliabilitySum * 0.6 + resilienceScore * 0.4);
  const disruptionProbability = Math.round(riskScore * 0.7 + gulfExposure * 0.3);

  return {
    expectedCost: Math.round(expectedCost * 100) / 100,
    riskScore: Math.round(riskScore),
    resilienceScore,
    supplyStability,
    deliveryTime: Math.round(deliveryTime * 10) / 10,
    disruptionProbability: Math.min(100, disruptionProbability),
    gulfExposure: Math.round(gulfExposure),
    hhi: Math.round(hhi * 1000) / 1000,
    insuranceCostPct: Math.round(insuranceCostPct * 10) / 10,
    insuranceCostPerBarrel: Math.round(insuranceCostPerBarrel * 100) / 100,
  };
}

export function computeEfficientFrontier(
  profiles: SupplierRiskProfile[],
  numSamples = 200,
): FrontierPoint[] {
  const points: FrontierPoint[] = [];
  const codes = profiles.map(p => p.sourceCountry);
  if (codes.length === 0) return points;

  for (let i = 0; i < numSamples; i++) {
    const raw: number[] = codes.map(() => Math.random());
    const sum = raw.reduce((s, v) => s + v, 0);
    const allocations: Record<string, number> = {};
    codes.forEach((code, idx) => {
      allocations[code] = Math.round(((raw[idx] ?? 0) / sum) * 100);
    });
    const diff = 100 - Object.values(allocations).reduce((s, v) => s + v, 0);
    if (diff !== 0 && codes[0]) allocations[codes[0]] = (allocations[codes[0]] ?? 0) + diff;

    const metrics = computePortfolioMetrics(allocations, profiles);
    points.push({
      cost: metrics.expectedCost,
      risk: metrics.riskScore,
      resilience: metrics.resilienceScore,
      allocations,
    });
  }

  return points;
}
