import { fetchCommodityQuotes } from '@/services/market';
import { IMPORTER_COUNTRY_CONFIG } from '@/config/energy-supply-network';

export interface ScenarioInput {
  name: string;
  description: string;
  category: ScenarioCategory;
  chokepointIds: string[];
  disruptionPct: number;
  durationDays: number;
  affectedCountries: string[];
  simultaneous: boolean;
}

export type ScenarioCategory =
  | 'chokepoint_closure'
  | 'conflict_escalation'
  | 'production_cut'
  | 'sanctions'
  | 'market_shock'
  | 'insurance';

export interface ScenarioResult {
  id: string;
  name: string;
  description: string;
  category: ScenarioCategory;
  totalCostPerDay: number;
  totalCostPerWeek: number;
  totalCostPerMonth: number;
  affectedCountries: CountryImpact[];
  chokepointImpacts: ChokepointImpact[];
  timeToRecovery: number;
  escalationRisk: number;
  recommendation: string;
  generatedAt: string;
  supplyImpact: SupplyImpact;
  costImpact: CostImpact;
  importGap: ImportGap;
  refineryStress: RefineryStress;
  routeDiversion: RouteDiversion;
  strategicReserves: StrategicReserve;
  executiveSummary: string;
}

export interface CountryImpact {
  code: string;
  name: string;
  disruptionPct: number;
  dailyImportBpd: number;
  barrelsLostPerDay: number;
  costPerDay: number;
  coverDays: number;
  shortageSeverity: 'critical' | 'high' | 'medium' | 'low';
}

export interface ChokepointImpact {
  id: string;
  name: string;
  trafficDisrupted: number;
  rerouteCostPerDay: number;
  additionalDays: number;
}

export interface SupplyImpact {
  globalSuppyReductionPct: number;
  barrelsPerDayLost: number;
  barrelsPerWeekLost: number;
  affectedExportRoutes: number;
  timeToFullRecovery: number;
  supplyElasticity: number;
}

export interface CostImpact {
  brentPriceChange: number;
  brentNewPrice: number;
  dailyGlobalCost: number;
  weeklyGlobalCost: number;
  monthlyGlobalCost: number;
  shippingPremiumPct: number;
  insurancePremiumPct: number;
}

export interface ImportGap {
  worstCountry: string;
  worstGapPct: number;
  countriesBelowThreshold: number;
  totalShortfallBarrels: number;
  emergencyImportsNeeded: number;
}

export interface RefineryStress {
  globalUtilizationDrop: number;
  mostAffectedRefinery: string;
  crudeGradeMismatch: number;
  processingCutsPct: number;
  productShortfall: string;
}

export interface RouteDiversion {
  primaryAltRoute: string;
  additionalTransitDays: number;
  additionalCostPerBarrel: number;
  capacityUtilization: number;
  bottlenecks: string[];
}

export interface StrategicReserve {
  daysOfCoverRemaining: number;
  SPRDrawdownNeeded: boolean;
  totalReserveBarrels: number;
  reserveCoveragePct: number;
  coordinatedReleaseRecommended: boolean;
}

const COUNTRY_IMPORT_DATA: Record<string, { dailyImportBpd: number; coverDays: number; spbBarrels: number }> = {
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

const CHOKEPOINT_REROUTE_COST: Record<string, { additionalDays: number; costPerBarrel: number; altRoute: string }> = {
  hormuz_strait: { additionalDays: 15, costPerBarrel: 3.5, altRoute: 'Cape of Good Hope + Pipeline bypass' },
  suez: { additionalDays: 10, costPerBarrel: 2.8, altRoute: 'Cape of Good Hope' },
  bab_el_mandeb: { additionalDays: 8, costPerBarrel: 2.2, altRoute: 'Cape of Good Hope' },
  malacca_strait: { additionalDays: 12, costPerBarrel: 3.0, altRoute: 'Lombok Strait' },
  cape_of_good_hope: { additionalDays: 0, costPerBarrel: 0, altRoute: 'Direct route' },
  panama_canal: { additionalDays: 7, costPerBarrel: 2.0, altRoute: 'Suez Canal' },
  bosphorus: { additionalDays: 5, costPerBarrel: 1.5, altRoute: 'Pipeline bypass' },
};

export const PRESET_SCENARIOS: ScenarioInput[] = [
  {
    name: 'Hormuz Closure',
    description: 'Complete closure of Strait of Hormuz for 30 days — blocks 20% of global oil supply',
    category: 'chokepoint_closure',
    chokepointIds: ['hormuz_strait'],
    disruptionPct: 80,
    durationDays: 30,
    affectedCountries: ['IN', 'CN', 'JP', 'KR', 'TW', 'TH', 'VN'],
    simultaneous: false,
  },
  {
    name: 'Red Sea Attack',
    description: 'Sustained attacks on Red Sea shipping via Bab-el-Mandeb and Suez Canal',
    category: 'conflict_escalation',
    chokepointIds: ['bab_el_mandeb', 'suez'],
    disruptionPct: 60,
    durationDays: 45,
    affectedCountries: ['IN', 'CN', 'JP', 'KR', 'EU'],
    simultaneous: true,
  },
  {
    name: 'OPEC Production Cut',
    description: 'OPEC+ announces 3mbpd voluntary production cut to support prices',
    category: 'production_cut',
    chokepointIds: [],
    disruptionPct: 35,
    durationDays: 90,
    affectedCountries: ['IN', 'CN', 'JP', 'KR', 'EU', 'TW', 'TH', 'VN', 'US'],
    simultaneous: false,
  },
  {
    name: 'Iran-US Escalation',
    description: 'Military escalation between Iran and US — Hormuz threat + regional conflict',
    category: 'conflict_escalation',
    chokepointIds: ['hormuz_strait', 'bab_el_mandeb'],
    disruptionPct: 65,
    durationDays: 21,
    affectedCountries: ['IN', 'CN', 'JP', 'KR', 'EU', 'TW', 'TH', 'VN', 'SG'],
    simultaneous: true,
  },
  {
    name: 'Shipping Insurance Spike',
    description: 'War risk premiums surge 500% — war + piracy zones expanded',
    category: 'insurance',
    chokepointIds: ['hormuz_strait', 'bab_el_mandeb', 'malacca_strait'],
    disruptionPct: 30,
    durationDays: 60,
    affectedCountries: ['IN', 'CN', 'JP', 'KR', 'EU', 'TW', 'TH', 'VN', 'SG', 'US'],
    simultaneous: false,
  },
  {
    name: 'Export Ban',
    description: 'Major exporter imposes crude export embargo on select countries',
    category: 'sanctions',
    chokepointIds: ['hormuz_strait'],
    disruptionPct: 45,
    durationDays: 120,
    affectedCountries: ['CN', 'JP', 'KR', 'EU', 'TW'],
    simultaneous: false,
  },
  {
    name: 'Taiwan Strait Crisis',
    description: 'Military blockade of Taiwan Strait disrupting semiconductor and LNG supply chains',
    category: 'conflict_escalation',
    chokepointIds: ['malacca_strait'],
    disruptionPct: 70,
    durationDays: 45,
    affectedCountries: ['CN', 'JP', 'KR', 'TW', 'SG', 'VN'],
    simultaneous: false,
  },
  {
    name: 'Panama Canal Drought',
    description: 'Severe drought reduces Panama Canal draft restrictions — transit capacity cut 50%',
    category: 'chokepoint_closure',
    chokepointIds: ['panama_canal'],
    disruptionPct: 50,
    durationDays: 90,
    affectedCountries: ['US', 'CN', 'JP', 'KR'],
    simultaneous: false,
  },
  {
    name: 'Malacca Strait Piracy Surge',
    description: 'Escalated piracy and armed attacks in Malacca Strait — insurers raise war risk premiums',
    category: 'insurance',
    chokepointIds: ['malacca_strait'],
    disruptionPct: 25,
    durationDays: 60,
    affectedCountries: ['CN', 'JP', 'KR', 'TW', 'TH', 'VN', 'SG', 'IN'],
    simultaneous: false,
  },
  {
    name: 'Russia Sanctions Tightening',
    description: 'G7 tightens Russian oil sanctions — ban on refined products and price cap enforcement',
    category: 'sanctions',
    chokepointIds: ['bosphorus'],
    disruptionPct: 40,
    durationDays: 180,
    affectedCountries: ['CN', 'IN', 'EU', 'JP', 'KR'],
    simultaneous: false,
  },
  {
    name: 'Global Recession',
    description: 'Major economic downturn reduces global oil demand — OPEC+ responds with cuts',
    category: 'market_shock',
    chokepointIds: [],
    disruptionPct: 20,
    durationDays: 120,
    affectedCountries: ['US', 'EU', 'CN', 'JP', 'KR', 'IN'],
    simultaneous: false,
  },
  {
    name: 'Libya Production Collapse',
    description: 'Political crisis shuts down Libyan oil production — Mediterranean supply disrupted',
    category: 'production_cut',
    chokepointIds: ['bosphorus'],
    disruptionPct: 30,
    durationDays: 45,
    affectedCountries: ['EU', 'JP', 'KR', 'IN'],
    simultaneous: false,
  },
  {
    name: 'Hurricane Gulf Shutdown',
    description: 'Category 4+ hurricane forces US Gulf coast refinery and production shutdown',
    category: 'market_shock',
    chokepointIds: [],
    disruptionPct: 55,
    durationDays: 21,
    affectedCountries: ['US', 'EU', 'JP', 'KR'],
    simultaneous: false,
  },
  {
    name: 'China SPR Release',
    description: 'China strategically releases from Strategic Petroleum Reserve to suppress prices',
    category: 'market_shock',
    chokepointIds: [],
    disruptionPct: -15,
    durationDays: 30,
    affectedCountries: ['CN', 'IN', 'JP', 'KR', 'TW'],
    simultaneous: false,
  },
];

export function createDefaultScenario(): ScenarioInput {
  return PRESET_SCENARIOS[0]!;
}

export async function runScenario(scenario: ScenarioInput): Promise<ScenarioResult> {
  let brentPrice = 80;
  try {
    const quotes = await fetchCommodityQuotes([{ symbol: 'BZ=F', name: 'Brent', display: 'BRENT' }]);
    if (quotes.data.length > 0 && typeof quotes.data[0]?.price === 'number') {
      brentPrice = quotes.data[0].price;
    }
  } catch { /* use default */ }

  const countryImpacts: CountryImpact[] = scenario.affectedCountries.map(code => {
    const importData = COUNTRY_IMPORT_DATA[code] || { dailyImportBpd: 1_000_000, coverDays: 10, spbBarrels: 500_000_000 };
    const countryConfig = IMPORTER_COUNTRY_CONFIG.find(c => c.code === code);
    const barrelsLostPerDay = importData.dailyImportBpd * (scenario.disruptionPct / 100);
    const costPerDay = barrelsLostPerDay * brentPrice;
    const remainingCover = Math.max(0, importData.coverDays - scenario.durationDays);

    let shortageSeverity: CountryImpact['shortageSeverity'];
    if (remainingCover <= 0) shortageSeverity = 'critical';
    else if (remainingCover <= 5) shortageSeverity = 'high';
    else if (remainingCover <= 10) shortageSeverity = 'medium';
    else shortageSeverity = 'low';

    return {
      code,
      name: countryConfig?.name || code,
      disruptionPct: scenario.disruptionPct,
      dailyImportBpd: importData.dailyImportBpd,
      barrelsLostPerDay: Math.round(barrelsLostPerDay),
      costPerDay: Math.round(costPerDay),
      coverDays: remainingCover,
      shortageSeverity,
    };
  });

  const chokepointImpacts: ChokepointImpact[] = scenario.chokepointIds.map(id => {
    const reroute = CHOKEPOINT_REROUTE_COST[id] || { additionalDays: 10, costPerBarrel: 2.5, altRoute: 'Alternate routing' };
    const totalTraffic = countryImpacts.reduce((sum, c) => sum + c.dailyImportBpd, 0);
    const disruptedTraffic = totalTraffic * (scenario.disruptionPct / 100);
    const rerouteCostPerDay = disruptedTraffic * reroute.costPerBarrel;

    return {
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      trafficDisrupted: Math.round(disruptedTraffic),
      rerouteCostPerDay: Math.round(rerouteCostPerDay),
      additionalDays: reroute.additionalDays,
    };
  });

  const totalCostPerDay = countryImpacts.reduce((sum, c) => sum + c.costPerDay, 0) +
    chokepointImpacts.reduce((sum, c) => sum + c.rerouteCostPerDay, 0);

  const timeToRecovery = Math.max(...chokepointImpacts.map(c => c.additionalDays), 0) + scenario.durationDays;

  const escalationRisk = Math.min(100,
    scenario.disruptionPct * 0.4 +
    scenario.durationDays * 1.5 +
    scenario.chokepointIds.length * 10 +
    (scenario.simultaneous ? 20 : 0)
  );

  const barrelsLostPerDay = countryImpacts.reduce((sum, c) => sum + c.barrelsLostPerDay, 0);
  // totalDailyImports available for future use
  // const totalDailyImports = countryImpacts.reduce((sum, c) => sum + c.dailyImportBpd, 0);

  const brentPriceChange = Math.round(scenario.disruptionPct * 0.8);
  const brentNewPrice = Math.round(brentPrice * (1 + brentPriceChange / 100));

  const supplyImpact: SupplyImpact = {
    globalSuppyReductionPct: Math.round((barrelsLostPerDay / 100_000_000) * 100 * 10) / 10,
    barrelsPerDayLost: barrelsLostPerDay,
    barrelsPerWeekLost: barrelsLostPerDay * 7,
    affectedExportRoutes: scenario.chokepointIds.length,
    timeToFullRecovery: timeToRecovery,
    supplyElasticity: Math.round(scenario.disruptionPct * 0.3),
  };

  const costImpact: CostImpact = {
    brentPriceChange,
    brentNewPrice,
    dailyGlobalCost: Math.round(totalCostPerDay),
    weeklyGlobalCost: Math.round(totalCostPerDay * 7),
    monthlyGlobalCost: Math.round(totalCostPerDay * 30),
    shippingPremiumPct: Math.round(scenario.disruptionPct * 0.6),
    insurancePremiumPct: Math.round(scenario.disruptionPct * 1.2),
  };

  const worstCountry = countryImpacts.reduce((w, c) => c.coverDays < w.coverDays ? c : w, countryImpacts[0]!);
  const importGap: ImportGap = {
    worstCountry: worstCountry?.name ?? 'N/A',
    worstGapPct: worstCountry ? Math.round(((worstCountry.dailyImportBpd * scenario.disruptionPct / 100) / worstCountry.dailyImportBpd) * 100) : 0,
    countriesBelowThreshold: countryImpacts.filter(c => c.coverDays <= 7).length,
    totalShortfallBarrels: barrelsLostPerDay * scenario.durationDays,
    emergencyImportsNeeded: countryImpacts.filter(c => c.shortageSeverity === 'critical').length,
  };

  const refineryStress: RefineryStress = {
    globalUtilizationDrop: Math.round(scenario.disruptionPct * 0.4),
    mostAffectedRefinery: worstCountry?.name ?? 'N/A',
    crudeGradeMismatch: Math.round(scenario.disruptionPct * 0.2),
    processingCutsPct: Math.round(scenario.disruptionPct * 0.3),
    productShortfall: scenario.disruptionPct > 50 ? 'Gasoline, Diesel, Jet Fuel' : 'Diesel, Jet Fuel',
  };

  const fallback = { additionalDays: 0, costPerBarrel: 0, altRoute: 'No diversion needed' };
  const primaryReroute = (scenario.chokepointIds[0] && CHOKEPOINT_REROUTE_COST[scenario.chokepointIds[0]])
    || fallback;

  const routeDiversion: RouteDiversion = {
    primaryAltRoute: primaryReroute.altRoute,
    additionalTransitDays: primaryReroute.additionalDays,
    additionalCostPerBarrel: primaryReroute.costPerBarrel,
    capacityUtilization: Math.round(100 - scenario.disruptionPct * 0.5),
    bottlenecks: scenario.chokepointIds.map(id => id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
  };

  const totalReserves = scenario.affectedCountries.reduce((sum, code) => {
    const data = COUNTRY_IMPORT_DATA[code];
    return sum + (data?.spbBarrels ?? 0);
  }, 0);

  const daysOfCover = barrelsLostPerDay > 0 ? Math.round(totalReserves / barrelsLostPerDay) : 999;

  const strategicReserves: StrategicReserve = {
    daysOfCoverRemaining: daysOfCover,
    SPRDrawdownNeeded: daysOfCover < scenario.durationDays,
    totalReserveBarrels: totalReserves,
    reserveCoveragePct: Math.round((daysOfCover / Math.max(scenario.durationDays, 1)) * 100),
    coordinatedReleaseRecommended: scenario.disruptionPct > 50 && scenario.durationDays > 14,
  };

  const criticalCountries = countryImpacts.filter(c => c.shortageSeverity === 'critical');
  const highCountries = countryImpacts.filter(c => c.shortageSeverity === 'high');

  let recommendation: string;
  if (criticalCountries.length > 0) {
    recommendation = `CRITICAL: ${criticalCountries.length} countries face critical shortage. Activate emergency procurement for ${criticalCountries.map(c => c.name).join(', ')}. Draw down strategic reserves and secure spot cargoes from non-Gulf sources.`;
  } else if (highCountries.length > 0) {
    recommendation = `HIGH: ${highCountries.length} countries face high shortage risk. Diversify tenders away from affected chokepoints, extend cover days, and validate alternate discharge ports.`;
  } else {
    recommendation = `MEDIUM: Monitor situation closely. Quote bypass premiums and refresh stock-cover assumptions for affected countries.`;
  }

  const executiveSummary = buildExecutiveSummary(scenario, countryImpacts, supplyImpact, costImpact, importGap, strategicReserves);

  return {
    id: `scenario-${Date.now()}`,
    name: scenario.name,
    description: scenario.description,
    category: scenario.category,
    totalCostPerDay: Math.round(totalCostPerDay),
    totalCostPerWeek: Math.round(totalCostPerDay * 7),
    totalCostPerMonth: Math.round(totalCostPerDay * 30),
    affectedCountries: countryImpacts,
    chokepointImpacts,
    timeToRecovery,
    escalationRisk: Math.round(escalationRisk),
    recommendation,
    generatedAt: new Date().toISOString(),
    supplyImpact,
    costImpact,
    importGap,
    refineryStress,
    routeDiversion,
    strategicReserves,
    executiveSummary,
  };
}

function buildExecutiveSummary(
  scenario: ScenarioInput,
  countries: CountryImpact[],
  supply: SupplyImpact,
  cost: CostImpact,
  _gap: ImportGap,
  reserves: StrategicReserve,
): string {
  const critical = countries.filter(c => c.shortageSeverity === 'critical').length;
  const high = countries.filter(c => c.shortageSeverity === 'high').length;
  const barrelStr = supply.barrelsPerDayLost >= 1_000_000
    ? `${(supply.barrelsPerDayLost / 1_000_000).toFixed(1)}M bpd`
    : `${(supply.barrelsPerDayLost / 1_000).toFixed(0)}K bpd`;

  const parts: string[] = [];
  parts.push(`${scenario.name} would disrupt ${barrelStr} (${supply.globalSuppyReductionPct}% of global supply) for ${scenario.durationDays} days.`);
  parts.push(`Brent crude would spike ${cost.brentPriceChange}% to ~$${cost.brentNewPrice}/bbl, adding ${formatCost(cost.dailyGlobalCost)}/day in global costs.`);

  if (critical > 0) {
    parts.push(`${critical} countries face critical shortage with strategic reserves depleted within ${reserves.daysOfCoverRemaining} days.`);
  }
  if (high > 0) {
    parts.push(`${high} countries face high shortage risk requiring emergency procurement.`);
  }
  if (reserves.SPRDrawdownNeeded) {
    parts.push(`SPR drawdown recommended; coordinated release of ${(reserves.totalReserveBarrels / 1e9).toFixed(1)}B barrels would provide ${reserves.daysOfCoverRemaining} days of cover.`);
  }

  return parts.join(' ');
}

export async function compareScenarios(scenarios: ScenarioInput[]): Promise<ScenarioResult[]> {
  return Promise.all(scenarios.map(s => runScenario(s)));
}

export function formatCost(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount}`;
}

export function formatBarrels(bpd: number): string {
  if (bpd >= 1_000_000) return `${(bpd / 1_000_000).toFixed(1)}M bpd`;
  if (bpd >= 1_000) return `${(bpd / 1_000).toFixed(0)}K bpd`;
  return `${bpd} bpd`;
}
