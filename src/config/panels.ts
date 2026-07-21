import type { PanelConfig, MapLayers, DataSourceId } from '@/types';
// boundary-ignore: isDesktopRuntime is a pure env probe with no service dependencies
import { isDesktopRuntime } from '@/services/runtime';

const _desktop = isDesktopRuntime();

// ============================================
// SINGLE VARIANT: ALL PANELS
// ============================================
// Panel order matters! First panels appear at top of grid.
const FULL_PANELS: Record<string, PanelConfig> = {
  map: { name: 'Global Map', enabled: true, priority: 1 },
  'live-news': { name: 'Live News', enabled: true, priority: 1 },
  insights: { name: 'AI Insights', enabled: true, priority: 1 },
  'threat-timeline': { name: 'Threat Timeline', enabled: true, priority: 1 },
  'strategic-posture': { name: 'AI Strategic Posture', enabled: true, priority: 1 },
  forecast: { name: 'AI Forecasts', enabled: true, priority: 1 },
  cii: { name: 'Country Instability', enabled: true, priority: 1 },
  'strategic-risk': { name: 'Strategic Risk Overview', enabled: true, priority: 1 },
  intel: { name: 'Intel Feed', enabled: true, priority: 1 },
  'gdelt-intel': { name: 'Live Intelligence', enabled: true, priority: 1 },
  cascade: { name: 'Infrastructure Cascade', enabled: true, priority: 1 },
  'military-correlation': { name: 'Force Posture', enabled: true, priority: 2 },
  'escalation-correlation': { name: 'Escalation Monitor', enabled: true, priority: 2 },
  'economic-correlation': { name: 'Economic Warfare', enabled: true, priority: 2 },
  'disaster-correlation': { name: 'Disaster Cascade', enabled: true, priority: 2 },
  politics: { name: 'World News', enabled: true, priority: 1 },
  us: { name: 'United States', enabled: true, priority: 1 },
  europe: { name: 'Europe', enabled: true, priority: 1 },
  middleeast: { name: 'Middle East', enabled: true, priority: 1 },
  africa: { name: 'Africa', enabled: true, priority: 1 },
  latam: { name: 'Latin America', enabled: true, priority: 1 },
  asia: { name: 'Asia-Pacific', enabled: true, priority: 1 },
  energy: { name: 'Energy & Resources', enabled: true, priority: 1 },
  gov: { name: 'Government', enabled: true, priority: 1 },
  polymarket: { name: 'Predictions', enabled: true, priority: 1 },
  commodities: { name: 'Metals & Materials', enabled: true, priority: 1 },
  'energy-complex': { name: 'Energy Complex', enabled: true, priority: 1 },
  'oil-inventories': { name: 'Oil Inventories', enabled: true, priority: 60 },
  markets: { name: 'Markets', enabled: true, priority: 1 },
  'daily-market-brief': { name: 'Daily Market Brief', enabled: true, priority: 1 },
  'chat-analyst': { name: 'ORION Analyst', enabled: true, priority: 1 },
  economic: { name: 'Macro Stress', enabled: true, priority: 1 },
  'trade-policy': { name: 'Trade Policy', enabled: true, priority: 1 },
  'supply-chain': { name: 'Supply Chain', enabled: true, priority: 1 },
  finance: { name: 'Financial', enabled: true, priority: 1 },
  tech: { name: 'Technology', enabled: true, priority: 2 },
  crypto: { name: 'Crypto', enabled: true, priority: 2 },
  heatmap: { name: 'Sector Heatmap', enabled: true, priority: 2 },
  ai: { name: 'AI/ML', enabled: true, priority: 2 },

  'macro-signals': { name: 'Market Regime', enabled: true, priority: 2 },
  'fear-greed': { name: 'Fear & Greed', enabled: true, priority: 2 },
  'aaii-sentiment': { name: 'AAII Sentiment', enabled: false, priority: 2 },
  'market-breadth': { name: 'Market Breadth', enabled: true, priority: 2 },
  'macro-tiles': { name: 'Macro Indicators', enabled: false, priority: 2 },
  'fsi': { name: 'Financial Stress', enabled: false, priority: 2 },
  'yield-curve': { name: 'Yield Curve', enabled: false, priority: 2 },
  'economic-calendar': { name: 'Economic Calendar', enabled: true, priority: 2 },
  'cot-positioning': { name: 'COT Positioning', enabled: true, priority: 2 },
  'liquidity-shifts': { name: 'Liquidity Shifts', enabled: true, priority: 2 },
  'positioning-247': { name: '24/7 Positioning', enabled: true, priority: 2 },
  'gold-intelligence': { name: 'Gold Intelligence', enabled: true, priority: 60 },
  'hormuz-tracker': { name: 'Hormuz Trade Tracker', enabled: true, priority: 2 },
  'energy-crisis': { name: 'Energy Crisis Tracker', enabled: true, priority: 2 },
  'pipeline-status': { name: 'Oil & Gas Pipeline Status', enabled: true, priority: 2 },
  'storage-facility-map': { name: 'Strategic Storage Atlas', enabled: true, priority: 2 },
  'fuel-shortages': { name: 'Global Fuel Shortage Registry', enabled: true, priority: 2 },
  'energy-disruptions': { name: 'Energy Disruptions Log', enabled: true, priority: 2 },
  'energy-risk-overview': { name: 'Global Energy Risk Overview', enabled: false, priority: 2 },
  'gulf-economies': { name: 'Gulf Economies', enabled: false, priority: 2 },
  'consumer-prices': { name: 'Consumer Prices', enabled: false, priority: 2 },
  'fuel-prices': { name: 'Fuel Prices', enabled: true, priority: 2 },
  'fao-food-price-index': { name: 'FAO Food Price Index', enabled: false, priority: 2 },
  'etf-flows': { name: 'BTC ETF Tracker', enabled: true, priority: 2 },
  stablecoins: { name: 'Stablecoins', enabled: true, priority: 2 },
  'ucdp-events': { name: 'UCDP Conflict Events', enabled: true, priority: 2 },
  'disease-outbreaks': { name: 'Disease Outbreaks', enabled: true, priority: 2 },
  'social-velocity': { name: 'Social Velocity', enabled: true, priority: 2 },
  'wsb-ticker-scanner': { name: 'WSB Ticker Scanner', enabled: true, priority: 75 },
  displacement: { name: 'UNHCR Displacement', enabled: true, priority: 2 },
  climate: { name: 'Climate Anomalies', enabled: true, priority: 2 },
  'climate-news': { name: 'Climate News', enabled: false, priority: 2 },
  'population-exposure': { name: 'Population Exposure', enabled: true, priority: 2 },
  'security-advisories': { name: 'Security Advisories', enabled: true, priority: 2 },
  'sanctions-pressure': { name: 'Sanctions Pressure', enabled: true, priority: 2 },
  'defense-patents': { name: 'R&D Signal', enabled: true, priority: 2 },
  'radiation-watch': { name: 'Radiation Watch', enabled: true, priority: 2 },
  'thermal-escalation': { name: 'Thermal Escalation', enabled: true, priority: 2 },
  'oref-sirens': { name: 'Israel Sirens', enabled: true, priority: 2 },
  'airline-intel': { name: 'Airline Intelligence', enabled: true, priority: 2 },
  'national-debt': { name: 'Global Debt Clock', enabled: true, priority: 2 },
  'cross-source-signals': { name: 'Cross-Source Signals', enabled: true, priority: 2 },
  'quantitative-risk': { name: 'Quantitative Risk Models', enabled: true, priority: 1 },
  'market-implications': { name: 'AI Market Implications', enabled: true, priority: 1 },
  'regional-intelligence': { name: 'Regional Intelligence', enabled: false, priority: 1 },
  'deduction': { name: 'Deduct Situation', enabled: false, priority: 1 },
  'geo-hubs': { name: 'Geopolitical Hubs', enabled: false, priority: 2 },
  'tech-hubs': { name: 'Hot Tech Hubs', enabled: false, priority: 2 },
  // Energy supply chain panels
  'orion-decision': { name: 'ORION Decision Desk', enabled: true, priority: 1 },
  'energy-supply-network': { name: 'Energy Supply Network', enabled: true, priority: 1 },
  'chokepoint-monitoring': { name: 'Chokepoint Monitoring', enabled: true, priority: 1 },
  'chokepoint-strip': { name: 'Chokepoint Status', enabled: true, priority: 1 },
  renewable: { name: 'Renewable Energy', enabled: true, priority: 2 },
  'gcc-investments': { name: 'GCC Energy Investments', enabled: true, priority: 2 },
  // ORION v2: Decision support panels
  'procurement-advisor': { name: 'Procurement Advisor', enabled: true, priority: 1 },
  'scenario-simulator': { name: 'Scenario Simulator', enabled: true, priority: 1 },
  'alert-config': { name: 'Alert Center', enabled: true, priority: 2 },
  'ais-shipping-intelligence': { name: 'AIS Shipping Intelligence', enabled: true, priority: 1 },
  'geopolitical-risk': { name: 'Geopolitical Risk Intel', enabled: true, priority: 1 },
  'reserve-optimizer': { name: 'Reserve Optimization Agent', enabled: true, priority: 1 },
  'executive-action-center': { name: 'Executive Action Center', enabled: true, priority: 1 },
  'executive-reports': { name: 'Executive Reports', enabled: true, priority: 1 },
  'alternative-routes': { name: 'Alternative Routes', enabled: true, priority: 1 },
  'historical-intelligence': { name: 'Historical Intelligence Explorer', enabled: true, priority: 1 },
};

const FULL_MAP_LAYERS: MapLayers = {
  iranAttacks: !_desktop,
  gpsJamming: false,
  satellites: false,
  conflicts: true,
  bases: !_desktop,
  pipelines: true,
  storageFacilities: true,
  fuelShortages: true,
  hotspots: true,
  ais: true,
  nuclear: true,
  sanctions: true,
  weather: true,
  economic: true,
  waterways: true,
  outages: true,
  protests: false,
  military: true,
  natural: true,
  minerals: true,
  fires: true,
  ucdpEvents: false,
  displacement: false,
  climate: true,
  commodityHubs: true,
  tradeRoutes: true,
  commodityPorts: true,
  // Removed from sidepanel: irradiators, radiationWatch, cables, datacenters,
  // flights, spaceports, cyberThreats, dayNight, webcams, diseaseOutbreaks,
  // ciiChoropleth, resilienceScore, startupHubs, cloudRegions, accelerators,
  // techHQs, techEvents, stockExchanges, financialCenters, centralBanks,
  // gulfInvestments, positiveEvents, kindness, happiness, speciesRecovery,
  // renewableInstallations, miningSites, processingPlants, energySupplyNetwork,
  // chokepointMonitoring
  irradiators: false,
  radiationWatch: false,
  cables: false,
  datacenters: false,
  flights: false,
  spaceports: false,
  cyberThreats: false,
  dayNight: false,
  webcams: false,
  diseaseOutbreaks: false,
  ciiChoropleth: false,
  resilienceScore: false,
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  gulfInvestments: false,
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,
  miningSites: false,
  processingPlants: false,
  energySupplyNetwork: false,
  chokepointMonitoring: false,
};

const FULL_MOBILE_MAP_LAYERS: MapLayers = {
  iranAttacks: true,
  gpsJamming: false,
  satellites: false,
  conflicts: true,
  bases: false,
  cables: false,
  pipelines: false,
  storageFacilities: false,
  fuelShortages: false,
  hotspots: true,
  ais: false,
  nuclear: false,
  irradiators: false,
  radiationWatch: false,
  sanctions: true,
  weather: true,
  economic: false,
  waterways: false,
  outages: true,
  cyberThreats: false,
  datacenters: false,
  protests: false,
  flights: false,
  military: false,
  natural: true,
  spaceports: false,
  minerals: false,
  fires: false,
  ucdpEvents: false,
  displacement: false,
  climate: false,
  startupHubs: false,
  cloudRegions: false,
  accelerators: false,
  techHQs: false,
  techEvents: false,
  stockExchanges: false,
  financialCenters: false,
  centralBanks: false,
  commodityHubs: false,
  gulfInvestments: false,
  positiveEvents: false,
  kindness: false,
  happiness: false,
  speciesRecovery: false,
  renewableInstallations: false,
  tradeRoutes: false,
  ciiChoropleth: false,
  resilienceScore: false,
  dayNight: false,
  miningSites: false,
  processingPlants: false,
  commodityPorts: false,
  webcams: false,
  diseaseOutbreaks: false,
  energySupplyNetwork: false,
  chokepointMonitoring: false,
};

// ============================================
// UNIFIED PANEL REGISTRY
// ============================================

/** All panels — single variant. */
export const ALL_PANELS: Record<string, PanelConfig> = { ...FULL_PANELS };

/** Panel order — single variant. */
export const VARIANT_DEFAULTS: Record<string, string[]> = {
  full: Object.keys(FULL_PANELS),
};

/**
 * Returns the effective panel config for a given key.
 */
export function getEffectivePanelConfig(key: string, _variant: string): PanelConfig {
  return ALL_PANELS[key] ?? { name: key, enabled: false, priority: 2 };
}

/**
 * Returns true if `key` is in the default panel set.
 */
export function isPanelInVariantDefaults(key: string): boolean {
  return (VARIANT_DEFAULTS['full'] ?? []).includes(key);
}

export const FREE_MAX_PANELS = 9999;
export const FREE_MAX_SOURCES = 9999;

export function isFreePanelCapCounted(key: string): boolean {
  return key !== 'map' && !key.startsWith('cw-');
}

export function countFreePanelCapUsage(panelSettings: Record<string, PanelConfig>): number {
  return Object.entries(panelSettings).filter(([key, panel]) =>
    panel.enabled && isFreePanelCapCounted(key)
  ).length;
}

export function restoreFreeMapPanelAccess(
  panelSettings: Record<string, PanelConfig>,
): Record<string, PanelConfig> {
  const next: Record<string, PanelConfig> = {};
  for (const [key, config] of Object.entries(panelSettings)) {
    next[key] = { ...config };
  }

  if (next.map?.enabled === false && countFreePanelCapUsage(next) > FREE_MAX_PANELS) {
    next.map = { ...next.map, enabled: true };
  }

  return next;
}

/**
 * Returns true if the current user is entitled to enable/view this panel.
 */
export function isPanelEntitled(key: string, config: PanelConfig, isPro = false): boolean {
  void key;
  void config;
  void isPro;
  return true;
}

/**
 * Clamp a panel-settings map to the free-tier panel cap.
 */
export function enforceFreePanelLimit(
  panelSettings: Record<string, PanelConfig>,
  isPro: boolean,
): Record<string, PanelConfig> {
  const next: Record<string, PanelConfig> = {};
  for (const [key, config] of Object.entries(panelSettings)) {
    next[key] = { ...config };
  }

  void isPro;
  return next;
}

// ============================================
// VARIANT-AWARE EXPORTS
// ============================================
export const DEFAULT_PANELS: Record<string, PanelConfig> = Object.fromEntries(
  (VARIANT_DEFAULTS['full'] ?? []).map(key =>
    [key, getEffectivePanelConfig(key, 'full')]
  )
);

export const DEFAULT_MAP_LAYERS = FULL_MAP_LAYERS;
export const MOBILE_DEFAULT_MAP_LAYERS = FULL_MOBILE_MAP_LAYERS;

/** Maps map-layer toggle keys to their data-freshness source IDs (single source of truth). */
export const LAYER_TO_SOURCE: Partial<Record<keyof MapLayers, DataSourceId[]>> = {
  military: ['opensky', 'wingbits'],
  ais: ['ais'],
  natural: ['usgs'],
  weather: ['weather'],
  outages: ['outages'],
  cyberThreats: ['cyber_threats'],
  protests: ['acled', 'gdelt_doc'],
  ucdpEvents: ['ucdp_events'],
  displacement: ['unhcr'],
  climate: ['climate'],
  sanctions: ['sanctions_pressure'],
  radiationWatch: ['radiation'],
};

// ============================================
// PANEL CATEGORY MAP
// ============================================
export const PANEL_CATEGORY_MAP: Record<string, { labelKey: string; panelKeys: string[] }> = {
  core: {
    labelKey: 'header.panelCatCore',
    panelKeys: ['map', 'live-news', 'insights', 'strategic-posture'],
  },
  intelligence: {
    labelKey: 'header.panelCatIntelligence',
    panelKeys: ['cii', 'strategic-risk', 'threat-timeline', 'intel', 'gdelt-intel', 'cascade', 'forecast', 'cross-source-signals', 'regional-intelligence', 'deduction', 'chat-analyst', 'thermal-escalation', 'social-velocity', 'geo-hubs', 'historical-intelligence'],
  },
  correlation: {
    labelKey: 'header.panelCatCorrelation',
    panelKeys: ['military-correlation', 'escalation-correlation', 'economic-correlation', 'disaster-correlation'],
  },
  regionalNews: {
    labelKey: 'header.panelCatRegionalNews',
    panelKeys: ['politics', 'us', 'europe', 'middleeast', 'africa', 'latam', 'asia'],
  },
  energySupply: {
    labelKey: 'header.panelCatMarketsFinance',
    panelKeys: ['orion-decision', 'energy-supply-network', 'chokepoint-monitoring', 'quantitative-risk', 'ais-shipping-intelligence', 'geopolitical-risk', 'reserve-optimizer', 'procurement-advisor', 'scenario-simulator', 'alert-config', 'chokepoint-strip', 'pipeline-status', 'storage-facility-map', 'fuel-shortages', 'energy-disruptions', 'hormuz-tracker', 'energy-crisis', 'energy-risk-overview', 'renewable'],
  },
  markets: {
    labelKey: 'header.panelCatMarketsFinance',
    panelKeys: ['commodities', 'energy-complex', 'oil-inventories', 'fuel-prices', 'markets', 'economic', 'trade-policy', 'sanctions-pressure', 'supply-chain', 'finance', 'polymarket', 'macro-signals', 'gulf-economies', 'gcc-investments', 'etf-flows', 'stablecoins', 'crypto', 'heatmap', 'aaii-sentiment', 'cot-positioning', 'economic-calendar', 'fear-greed', 'fsi', 'macro-tiles', 'market-breadth', 'liquidity-shifts', 'national-debt', 'positioning-247', 'wsb-ticker-scanner', 'yield-curve', 'gold-intelligence', 'market-implications', 'consumer-prices'],
  },
  topical: {
    labelKey: 'header.panelCatTopical',
    panelKeys: ['energy', 'gov', 'tech', 'ai'],
  },
  dataTracking: {
    labelKey: 'header.panelCatDataTracking',
    panelKeys: ['ucdp-events', 'displacement', 'climate', 'climate-news', 'population-exposure', 'security-advisories', 'radiation-watch', 'oref-sirens', 'disease-outbreaks', 'fao-food-price-index', 'defense-patents'],
  },
};

export interface VariantPanelCategory {
  key: string;
  labelKey: string;
  panelKeys: string[];
}

export function getVariantPanelCategories(
  panelSettings: Record<string, PanelConfig>,
  _variant: string,
): VariantPanelCategory[] {
  return Object.entries(PANEL_CATEGORY_MAP)
    .filter(([, def]) => def.panelKeys.some((pk) => panelSettings[pk]?.enabled))
    .map(([key, def]) => ({ key, labelKey: def.labelKey, panelKeys: def.panelKeys }));
}

export function getProPanelKeys(
  _panelSettings: Record<string, PanelConfig>,
  _variant: string,
): string[] {
  return [];
}

// Monitor palette — fixed category colors persisted to localStorage (not theme-dependent)
export const MONITOR_COLORS = [
  '#44ff88',
  '#ff8844',
  '#4488ff',
  '#ff44ff',
  '#ffff44',
  '#ff4444',
  '#44ffff',
  '#88ff44',
  '#ff88ff',
  '#88ffff',
];

export const STORAGE_KEYS = {
  panels: 'orion-panels',
  monitors: 'orion-monitors',
  mapLayers: 'orion-layers',
  disabledFeeds: 'orion-disabled-feeds',
  liveChannels: 'orion-live-channels',
} as const;
