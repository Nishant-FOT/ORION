// ORION Panel Registry - All 161 panels organized by category

export type PanelCategory = 
  | 'map' 
  | 'signals' 
  | 'markets' 
  | 'energy' 
  | 'defense' 
  | 'climate' 
  | 'analysis' 
  | 'reports';

export interface PanelSizeConfig {
  /** Default width in grid columns (1–4). Falls back to category default if omitted. */
  defaultWidth?: number;
  /** Default height in grid rows (1–4). Falls back to category default if omitted. */
  defaultHeight?: number;
  /** Minimum width in grid columns. Defaults to 1. */
  minWidth?: number;
  /** Minimum height in grid rows. Defaults to 1. */
  minHeight?: number;
  /** Maximum width in grid columns. Defaults to 4. */
  maxWidth?: number;
  /** Maximum height in grid rows. Defaults to 4. */
  maxHeight?: number;
}

export interface PanelConfig extends PanelSizeConfig {
  id: string;
  name: string;
  category: PanelCategory;
  icon: string;
  description: string;
  defaultEnabled: boolean;
  priority: number;
}

/** Category-level fallback sizes when a panel doesn't declare its own. */
export const CATEGORY_SIZE_DEFAULTS: Record<PanelCategory, { defaultWidth: number; defaultHeight: number; minWidth: number; minHeight: number; maxWidth: number; maxHeight: number }> = {
  map:      { defaultWidth: 4, defaultHeight: 3, minWidth: 2, minHeight: 2, maxWidth: 4, maxHeight: 4 },
  signals:  { defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  markets:  { defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  energy:   { defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  defense:  { defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  climate:  { defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  analysis: { defaultWidth: 1, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
  reports:  { defaultWidth: 2, defaultHeight: 1, minWidth: 1, minHeight: 1, maxWidth: 3, maxHeight: 3 },
};

/** Resolves a panel's effective size config, falling back to category defaults. */
export function resolvePanelSize(panel: PanelSizeConfig, category: PanelCategory): Required<PanelSizeConfig> {
  const cat = CATEGORY_SIZE_DEFAULTS[category];
  return {
    defaultWidth:  Math.max(1, Math.min(4, panel.defaultWidth  ?? cat.defaultWidth)),
    defaultHeight: Math.max(1, Math.min(4, panel.defaultHeight ?? cat.defaultHeight)),
    minWidth:      Math.max(1, Math.min(4, panel.minWidth      ?? cat.minWidth)),
    minHeight:     Math.max(1, Math.min(4, panel.minHeight     ?? cat.minHeight)),
    maxWidth:      Math.max(1, Math.min(4, panel.maxWidth      ?? cat.maxWidth)),
    maxHeight:     Math.max(1, Math.min(4, panel.maxHeight     ?? cat.maxHeight)),
  };
}

export const PANEL_CATEGORIES: Record<PanelCategory, { name: string; icon: string; description: string }> = {
  map: { name: 'Map', icon: 'map', description: 'Geospatial visualization and route tracking' },
  signals: { name: 'Signals', icon: 'sensors', description: 'Real-time intelligence signals and alerts' },
  markets: { name: 'Markets', icon: 'candlestick_chart', description: 'Financial markets and commodities data' },
  energy: { name: 'Energy', icon: 'local_gas_station', description: 'Energy supply chain and infrastructure' },
  defense: { name: 'Defense', icon: 'shield', description: 'Military and defense intelligence' },
  climate: { name: 'Climate', icon: 'earthquake', description: 'Climate events and natural disasters' },
  analysis: { name: 'Analysis', icon: 'analytics', description: 'Deep analysis and intelligence reports' },
  reports: { name: 'Reports', icon: 'description', description: 'Executive summaries and decision support' },
};

export const PANEL_REGISTRY: PanelConfig[] = [
  // ═══════════════════════════════════════════════════════════════
  // MAP (1 panel)
  // ═══════════════════════════════════════════════════════════════
  { id: 'map-container', name: 'Interactive Map', category: 'map', icon: 'map', description: 'Geospatial visualization with 56 toggleable data layers', defaultEnabled: true, priority: 1, defaultWidth: 4, defaultHeight: 2 },

  // ═══════════════════════════════════════════════════════════════
  // SIGNALS (13 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'live-news', name: 'Live News Feed', category: 'signals', icon: 'newspaper', description: 'Real-time news from global sources', defaultEnabled: true, priority: 1, defaultWidth: 2, defaultHeight: 2 },
  { id: 'breaking-news', name: 'Breaking News', category: 'signals', icon: 'bolt', description: 'Critical breaking news alerts', defaultEnabled: true, priority: 2, defaultWidth: 2, defaultHeight: 1 },
  { id: 'cross-source-signals', name: 'Cross-Source Signals', category: 'signals', icon: 'hub', description: 'Correlated signals from multiple sources', defaultEnabled: true, priority: 4, defaultWidth: 2, defaultHeight: 2 },
  { id: 'threat-timeline', name: 'Threat Timeline', category: 'signals', icon: 'history', description: 'Historical threat progression', defaultEnabled: true, priority: 5, defaultWidth: 2, defaultHeight: 1 },
  { id: 'climate-news', name: 'Climate News', category: 'signals', icon: 'eco', description: 'Climate and environment news', defaultEnabled: true, priority: 6, defaultWidth: 1, defaultHeight: 1 },
  { id: 'gdelt-intel', name: 'GDELT Intelligence', category: 'signals', icon: 'analytics', description: 'GDELT global event monitoring', defaultEnabled: true, priority: 7, defaultWidth: 2, defaultHeight: 1 },
  { id: 'ais-shipping', name: 'AIS Shipping', category: 'signals', icon: 'directions_boat', description: 'Live vessel tracking via AIS', defaultEnabled: true, priority: 8, defaultWidth: 1, defaultHeight: 1 },
  { id: 'airline-intel', name: 'Airline Intelligence', category: 'signals', icon: 'flight', description: 'Flight tracking and delays', defaultEnabled: true, priority: 9, defaultWidth: 1, defaultHeight: 1 },

  { id: 'service-status', name: 'Service Status', category: 'signals', icon: 'health_and_safety', description: 'Platform service health', defaultEnabled: true, priority: 11, defaultWidth: 1, defaultHeight: 1 },
  { id: 'geopolitical-hubs', name: 'Geopolitical Hubs', category: 'signals', icon: 'public', description: 'Global geopolitical risk hotspot monitoring', defaultEnabled: true, priority: 12, defaultWidth: 2, defaultHeight: 2 },
  { id: 'live-intelligence', name: 'Live Intelligence', category: 'signals', icon: 'rss_feed', description: 'Real-time multi-source intelligence feed', defaultEnabled: true, priority: 13, defaultWidth: 2, defaultHeight: 2 },
  { id: 'world-clock', name: 'World Clock', category: 'signals', icon: 'schedule', description: 'Global time zones', defaultEnabled: false, priority: 14, defaultWidth: 1, defaultHeight: 1 },

  // ═══════════════════════════════════════════════════════════════
  // MARKETS (22 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'markets', name: 'Market Overview', category: 'markets', icon: 'candlestick_chart', description: 'Live market quotes and indices', defaultEnabled: true, priority: 1, defaultWidth: 2, defaultHeight: 2 },
  { id: 'market-implications', name: 'Market Implications', category: 'markets', icon: 'psychology', description: 'Geopolitical event impact on markets', defaultEnabled: true, priority: 2, defaultWidth: 2, defaultHeight: 1 },
  { id: 'market-breadth', name: 'Market Breadth', category: 'markets', icon: 'bar_chart', description: 'Advance/decline and breadth indicators', defaultEnabled: true, priority: 3, defaultWidth: 1, defaultHeight: 1 },
  { id: 'economic', name: 'Economic Indicators', category: 'markets', icon: 'trending_up', description: 'FRED, BLS, and economic data', defaultEnabled: true, priority: 4, defaultWidth: 2, defaultHeight: 2 },
  { id: 'economic-calendar', name: 'Economic Calendar', category: 'markets', icon: 'calendar_today', description: 'Upcoming economic events', defaultEnabled: true, priority: 5, defaultWidth: 1, defaultHeight: 2 },
  { id: 'fear-greed', name: 'Fear & Greed', category: 'markets', icon: 'mood', description: 'Market sentiment index', defaultEnabled: true, priority: 6, defaultWidth: 1, defaultHeight: 1 },
  { id: 'aaii-sentiment', name: 'AAII Sentiment', category: 'markets', icon: 'groups', description: 'Investor sentiment survey', defaultEnabled: true, priority: 7, defaultWidth: 1, defaultHeight: 1 },
  { id: 'macro-signals', name: 'Macro Signals', category: 'markets', icon: 'monitoring', description: 'Macroeconomic signal dashboard', defaultEnabled: true, priority: 8, defaultWidth: 2, defaultHeight: 1 },
  { id: 'macro-tiles', name: 'Macro Tiles', category: 'markets', icon: 'grid_view', description: 'Macro indicator tiles', defaultEnabled: true, priority: 9, defaultWidth: 1, defaultHeight: 1 },
  { id: 'fsi', name: 'Financial Stress', category: 'markets', icon: 'speed', description: 'Financial Stress Index', defaultEnabled: true, priority: 10, defaultWidth: 1, defaultHeight: 1 },
  { id: 'yield-curve', name: 'Yield Curve', category: 'markets', icon: 'show_chart', description: 'Treasury yield curve analysis', defaultEnabled: true, priority: 11, defaultWidth: 1, defaultHeight: 1 },
  { id: 'cot-positioning', name: 'COT Positioning', category: 'markets', icon: 'people', description: 'Commitment of Traders data', defaultEnabled: true, priority: 12, defaultWidth: 1, defaultHeight: 1 },
  { id: 'liquidity-shifts', name: 'Liquidity Shifts', category: 'markets', icon: 'water_drop', description: 'Global liquidity monitoring', defaultEnabled: true, priority: 13, defaultWidth: 1, defaultHeight: 1 },
  { id: 'positioning', name: 'Positioning', category: 'markets', icon: 'swap_vert', description: 'Market positioning analysis', defaultEnabled: true, priority: 14, defaultWidth: 1, defaultHeight: 1 },
  { id: 'gold-intelligence', name: 'Gold Intelligence', category: 'markets', icon: 'diamond', description: 'Gold market analysis', defaultEnabled: true, priority: 15, defaultWidth: 1, defaultHeight: 1 },
  { id: 'etf-flows', name: 'ETF Flows', category: 'markets', icon: 'account_balance', description: 'ETF fund flow data', defaultEnabled: true, priority: 16, defaultWidth: 1, defaultHeight: 1 },

  { id: 'wsb-tickers', name: 'WSB Tickers', category: 'markets', icon: 'forum', description: 'WallStreetBets trending tickers', defaultEnabled: false, priority: 18, defaultWidth: 1, defaultHeight: 1 },
  { id: 'national-debt', name: 'National Debt', category: 'markets', icon: 'payments', description: 'US national debt clock', defaultEnabled: false, priority: 19, defaultWidth: 1, defaultHeight: 1 },
  { id: 'gulf-economies', name: 'Gulf Economies', category: 'markets', icon: 'account_balance_wallet', description: 'Gulf state economic data', defaultEnabled: true, priority: 20, defaultWidth: 1, defaultHeight: 1 },
  { id: 'consumer-prices', name: 'Consumer Prices', category: 'markets', icon: 'shopping_cart', description: 'CPI and inflation data', defaultEnabled: true, priority: 21, defaultWidth: 1, defaultHeight: 1 },


  // ═══════════════════════════════════════════════════════════════
  // ENERGY (19 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'energy-complex', name: 'Energy Complex', category: 'energy', icon: 'local_gas_station', description: 'Oil, gas, and energy prices', defaultEnabled: true, priority: 1, defaultWidth: 1, defaultHeight: 1 },
  { id: 'energy-crisis', name: 'Energy Crisis', category: 'energy', icon: 'warning', description: 'Energy crisis monitoring', defaultEnabled: true, priority: 2, defaultWidth: 1, defaultHeight: 1 },
  { id: 'energy-disruptions', name: 'Energy Disruptions', category: 'energy', icon: 'power_off', description: 'Supply disruption tracking', defaultEnabled: true, priority: 3, defaultWidth: 1, defaultHeight: 1 },
  { id: 'energy-risk', name: 'Energy Risk Overview', category: 'energy', icon: 'gpp_maybe', description: 'Comprehensive energy risk assessment', defaultEnabled: true, priority: 4, defaultWidth: 1, defaultHeight: 1 },
  { id: 'energy-supply', name: 'Energy Supply Network', category: 'energy', icon: 'network_check', description: 'Global energy supply routes', defaultEnabled: true, priority: 5, defaultWidth: 1, defaultHeight: 1 },
  { id: 'oil-inventories', name: 'Oil Inventories', category: 'energy', icon: 'inventory_2', description: 'EIA crude oil stockpiles', defaultEnabled: true, priority: 6, defaultWidth: 1, defaultHeight: 1 },
  { id: 'fuel-prices', name: 'Fuel Prices', category: 'energy', icon: 'local_gas_station', description: 'Global fuel price tracking', defaultEnabled: true, priority: 7, defaultWidth: 1, defaultHeight: 1 },
  { id: 'fuel-shortages', name: 'Fuel Shortages', category: 'energy', icon: 'remove_circle', description: 'Fuel shortage alerts', defaultEnabled: true, priority: 8, defaultWidth: 1, defaultHeight: 1 },
  { id: 'pipeline-status', name: 'Pipeline Status', category: 'energy', icon: 'cable', description: 'Pipeline flow monitoring', defaultEnabled: true, priority: 9, defaultWidth: 1, defaultHeight: 1 },
  { id: 'storage-facilities', name: 'Storage Facilities', category: 'energy', icon: 'warehouse', description: 'Storage facility mapping', defaultEnabled: true, priority: 10, defaultWidth: 1, defaultHeight: 1 },
  { id: 'chokepoint-strip', name: 'Chokepoint Strip', category: 'energy', icon: 'view_column', description: 'Chokepoint status overview', defaultEnabled: true, priority: 11, defaultWidth: 1, defaultHeight: 1 },
  { id: 'chokepoint-monitoring', name: 'Chokepoint Monitoring', category: 'energy', icon: 'radar', description: 'Live chokepoint risk scores', defaultEnabled: true, priority: 12, defaultWidth: 1, defaultHeight: 1 },
  { id: 'hormuz', name: 'Hormuz Tracker', category: 'energy', icon: 'water', description: 'Strait of Hormuz status', defaultEnabled: true, priority: 13, defaultWidth: 1, defaultHeight: 1 },
  { id: 'supply-chain', name: 'Supply Chain', category: 'energy', icon: 'local_shipping', description: 'Supply chain disruption monitoring', defaultEnabled: true, priority: 14, defaultWidth: 2, defaultHeight: 1 },
  { id: 'trade-policy', name: 'Trade Policy', category: 'energy', icon: 'gavel', description: 'WTO trade policy data', defaultEnabled: true, priority: 15, defaultWidth: 1, defaultHeight: 1 },
  { id: 'renewable-energy', name: 'Renewable Energy', category: 'energy', icon: 'solar_power', description: 'Renewable energy capacity', defaultEnabled: true, priority: 16, defaultWidth: 1, defaultHeight: 1 },
  { id: 'investments', name: 'Energy Investments', category: 'energy', icon: 'trending_up', description: 'Energy sector investments', defaultEnabled: true, priority: 17, defaultWidth: 1, defaultHeight: 1 },
  { id: 'procurement', name: 'Procurement Advisor', category: 'energy', icon: 'shopping_bag', description: 'Procurement decision support', defaultEnabled: true, priority: 18, defaultWidth: 1, defaultHeight: 1 },
  { id: 'reserves', name: 'Reserve Optimization', category: 'energy', icon: 'savings', description: 'Strategic reserve management', defaultEnabled: true, priority: 19, defaultWidth: 1, defaultHeight: 1 },
  { id: 'alert-center', name: 'Alert Center', category: 'energy', icon: 'notifications_active', description: 'Custom alert rules and triggers', defaultEnabled: true, priority: 20, defaultWidth: 2, defaultHeight: 2 },
  { id: 'india-energy-hub', name: 'India Energy Hub', category: 'energy', icon: 'flag', description: 'India energy security dashboard', defaultEnabled: true, priority: 21, defaultWidth: 2, defaultHeight: 1 },
  { id: 'india-spr-timeline', name: 'India SPR Timeline', category: 'energy', icon: 'timer', description: 'Strategic Petroleum Reserve drawdown', defaultEnabled: true, priority: 21, defaultWidth: 2, defaultHeight: 1 },
  { id: 'refinery-compatibility', name: 'Refinery Compatibility', category: 'energy', icon: 'factory', description: 'Crude grade refinery matrix', defaultEnabled: true, priority: 22, defaultWidth: 2, defaultHeight: 1 },
  { id: 'corridor-risk-monitor', name: 'Corridor Risk Monitor', category: 'energy', icon: 'route', description: 'Import corridor risk scoring', defaultEnabled: true, priority: 23, defaultWidth: 2, defaultHeight: 1 },
  { id: 'ai-scenario-simulator', name: 'AI Scenario Simulator', category: 'energy', icon: 'smart_toy', description: 'AI-powered disruption scenario analysis', defaultEnabled: true, priority: 24, defaultWidth: 2, defaultHeight: 2 },
  { id: 'procurement-action-center', name: 'Procurement Action Center', category: 'energy', icon: 'shopping_cart', description: 'Actionable procurement rerouting', defaultEnabled: true, priority: 25, defaultWidth: 2, defaultHeight: 1 },
  { id: 'live-disruption-probability', name: 'Disruption Probability', category: 'energy', icon: 'gpp_maybe', description: 'Real-time disruption risk scoring', defaultEnabled: true, priority: 26, defaultWidth: 2, defaultHeight: 1 },

  // ═══════════════════════════════════════════════════════════════
  // DEFENSE (9 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'strategic-posture', name: 'Strategic Posture', category: 'defense', icon: 'shield', description: 'Global military posture assessment', defaultEnabled: true, priority: 1, defaultWidth: 2, defaultHeight: 2 },
  { id: 'strategic-risk', name: 'Strategic Risk', category: 'defense', icon: 'gpp_maybe', description: 'Strategic risk evaluation', defaultEnabled: true, priority: 2, defaultWidth: 1, defaultHeight: 1 },
  { id: 'defense-patents', name: 'Defense Patents', category: 'defense', icon: 'science', description: 'Defense technology patents', defaultEnabled: true, priority: 3, defaultWidth: 1, defaultHeight: 1 },
  { id: 'ucdp-events', name: 'UCDP Events', category: 'defense', icon: 'flag', description: 'Armed conflict event data', defaultEnabled: true, priority: 4, defaultWidth: 2, defaultHeight: 1 },
  { id: 'oref-sirens', name: 'Oref Sirens', category: 'defense', icon: 'notifications_active', description: 'Israel rocket alert sirens', defaultEnabled: true, priority: 5, defaultWidth: 1, defaultHeight: 1 },
  { id: 'thermal-escalation', name: 'Thermal Escalation', category: 'defense', icon: 'local_fire_department', description: 'Conflict thermal signatures', defaultEnabled: true, priority: 6, defaultWidth: 1, defaultHeight: 1 },
  { id: 'security-advisories', name: 'Security Advisories', category: 'defense', icon: 'security', description: 'Government security alerts', defaultEnabled: true, priority: 7, defaultWidth: 1, defaultHeight: 1 },
  { id: 'sanctions', name: 'Sanctions Pressure', category: 'defense', icon: 'block', description: 'OFAC/EU sanctions monitoring', defaultEnabled: true, priority: 8, defaultWidth: 2, defaultHeight: 1 },
  { id: 'radiation', name: 'Radiation Watch', category: 'defense', icon: 'radioactive', description: 'Nuclear radiation monitoring', defaultEnabled: true, priority: 9, defaultWidth: 1, defaultHeight: 1 },
  { id: 'cyber-threats-panel', name: 'Cyber Threats', category: 'defense', icon: 'security', description: 'Cyber threat intelligence monitoring', defaultEnabled: true, priority: 10, defaultWidth: 1, defaultHeight: 1 },

  // ═══════════════════════════════════════════════════════════════
  // CLIMATE (6 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'climate-anomaly', name: 'Climate Anomaly', category: 'climate', icon: 'thermostat', description: 'Temperature and weather anomalies', defaultEnabled: true, priority: 1, defaultWidth: 2, defaultHeight: 1 },
  { id: 'displacement', name: 'Displacement', category: 'climate', icon: 'directions_walk', description: 'Population displacement tracking', defaultEnabled: true, priority: 2, defaultWidth: 1, defaultHeight: 1 },
  { id: 'disease-outbreaks', name: 'Disease Outbreaks', category: 'climate', icon: 'coronavirus', description: 'Global disease outbreak monitoring', defaultEnabled: true, priority: 3, defaultWidth: 1, defaultHeight: 1 },
  { id: 'population-exposure', name: 'Population Exposure', category: 'climate', icon: 'groups', description: 'Population at risk data', defaultEnabled: true, priority: 4, defaultWidth: 1, defaultHeight: 1 },
  { id: 'social-velocity', name: 'Social Velocity', category: 'climate', icon: 'speed', description: 'Social unrest velocity index', defaultEnabled: true, priority: 5, defaultWidth: 1, defaultHeight: 1 },
  { id: 'earthquakes', name: 'Earthquakes', category: 'climate', icon: 'earthquake', description: 'Global earthquake monitoring', defaultEnabled: true, priority: 6, defaultWidth: 1, defaultHeight: 1 },
  { id: 'weather-alerts', name: 'Weather Alerts', category: 'climate', icon: 'cloud', description: 'Severe weather alert tracking', defaultEnabled: true, priority: 7, defaultWidth: 1, defaultHeight: 1 },

  // ═══════════════════════════════════════════════════════════════
  // ANALYSIS (25 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'insights', name: 'Insights', category: 'analysis', icon: 'lightbulb', description: 'AI-generated insights', defaultEnabled: true, priority: 1, defaultWidth: 2, defaultHeight: 2 },
  { id: 'deduction', name: 'Deduction', category: 'analysis', icon: 'psychology', description: 'Deductive reasoning engine', defaultEnabled: true, priority: 2, defaultWidth: 1, defaultHeight: 1 },
  { id: 'country-brief', name: 'Country Brief', category: 'analysis', icon: 'flag', description: 'Country intelligence briefing', defaultEnabled: true, priority: 3, defaultWidth: 1, defaultHeight: 1 },
  { id: 'country-deep-dive', name: 'Country Deep Dive', category: 'analysis', icon: 'search', description: 'Detailed country analysis', defaultEnabled: true, priority: 4, defaultWidth: 1, defaultHeight: 1 },
  { id: 'country-timeline', name: 'Country Timeline', category: 'analysis', icon: 'timeline', description: 'Country event timeline', defaultEnabled: true, priority: 5, defaultWidth: 1, defaultHeight: 1 },
  { id: 'historical-intel', name: 'Historical Intelligence', category: 'analysis', icon: 'history_edu', description: 'Historical context analysis', defaultEnabled: true, priority: 6, defaultWidth: 1, defaultHeight: 1 },
  { id: 'regional-intel', name: 'Regional Intelligence', category: 'analysis', icon: 'public', description: 'Regional intelligence board', defaultEnabled: true, priority: 7, defaultWidth: 1, defaultHeight: 1 },
  { id: 'forecast', name: 'Forecast', category: 'analysis', icon: 'auto_graph', description: 'Predictive forecasting', defaultEnabled: true, priority: 8, defaultWidth: 2, defaultHeight: 1 },
  { id: 'geopolitical-risk', name: 'Geopolitical Risk', category: 'analysis', icon: 'globe', description: 'Geopolitical risk assessment', defaultEnabled: true, priority: 9, defaultWidth: 2, defaultHeight: 1 },
  { id: 'chat-analyst', name: 'Chat Analyst', category: 'analysis', icon: 'chat', description: 'AI chat analyst', defaultEnabled: true, priority: 10, defaultWidth: 1, defaultHeight: 1 },
  { id: 'mcp-data', name: 'MCP Data', category: 'analysis', icon: 'database', description: 'MCP protocol data panel', defaultEnabled: true, priority: 11, defaultWidth: 1, defaultHeight: 1 },
  { id: 'correlation', name: 'Correlation Engine', category: 'analysis', icon: 'compare_arrows', description: 'Cross-domain correlation', defaultEnabled: true, priority: 12, defaultWidth: 1, defaultHeight: 1 },
  { id: 'military-correlation', name: 'Military Correlation', category: 'analysis', icon: 'shield', description: 'Military event correlation', defaultEnabled: true, priority: 13, defaultWidth: 1, defaultHeight: 1 },
  { id: 'escalation-correlation', name: 'Escalation Correlation', category: 'analysis', icon: 'trending_up', description: 'Escalation pattern analysis', defaultEnabled: true, priority: 14, defaultWidth: 1, defaultHeight: 1 },
  { id: 'economic-correlation', name: 'Economic Correlation', category: 'analysis', icon: 'account_balance', description: 'Economic event correlation', defaultEnabled: true, priority: 15, defaultWidth: 1, defaultHeight: 1 },
  { id: 'disaster-correlation', name: 'Disaster Correlation', category: 'analysis', icon: 'warning', description: 'Disaster event correlation', defaultEnabled: true, priority: 16, defaultWidth: 1, defaultHeight: 1 },
  { id: 'cii', name: 'Country Instability Index', category: 'analysis', icon: 'assessment', description: 'Country instability scoring', defaultEnabled: true, priority: 17, defaultWidth: 1, defaultHeight: 1 },
  { id: 'cascade', name: 'Cascade Analysis', category: 'analysis', icon: 'waterfall_chart', description: 'Event cascade modeling', defaultEnabled: true, priority: 18, defaultWidth: 1, defaultHeight: 1 },
  { id: 'quantitative-risk', name: 'Quantitative Risk', category: 'analysis', icon: 'calculate', description: 'Quantitative risk metrics', defaultEnabled: true, priority: 19, defaultWidth: 1, defaultHeight: 1 },
  { id: 'scenario-simulator', name: 'Scenario Simulator', category: 'analysis', icon: 'science', description: 'What-if scenario modeling', defaultEnabled: true, priority: 20, defaultWidth: 1, defaultHeight: 1 },
  { id: 'hero-spotlight', name: 'Hero Spotlight', category: 'analysis', icon: 'star', description: 'Featured intelligence item', defaultEnabled: true, priority: 21, defaultWidth: 1, defaultHeight: 1 },
  { id: 'positive-news', name: 'Positive News', category: 'analysis', icon: 'sentiment_satisfied', description: 'Positive news feed', defaultEnabled: false, priority: 22, defaultWidth: 1, defaultHeight: 1 },
  { id: 'good-things', name: 'Good Things Digest', category: 'analysis', icon: 'favorite', description: 'Uplifting news digest', defaultEnabled: false, priority: 23, defaultWidth: 1, defaultHeight: 1 },
  { id: 'breakthroughs', name: 'Breakthroughs', category: 'analysis', icon: 'emoji_events', description: 'Technology breakthroughs', defaultEnabled: false, priority: 24, defaultWidth: 1, defaultHeight: 1 },
  { id: 'species-panel', name: 'Species Comeback', category: 'analysis', icon: 'pets', description: 'Conservation success stories', defaultEnabled: false, priority: 25, defaultWidth: 1, defaultHeight: 1 },

  // ═══════════════════════════════════════════════════════════════
  // REPORTS (5 panels)
  // ═══════════════════════════════════════════════════════════════
  { id: 'daily-market-brief', name: 'Daily Market Brief', category: 'reports', icon: 'summarize', description: 'AI-generated market summary', defaultEnabled: true, priority: 1, defaultWidth: 2, defaultHeight: 2 },
  { id: 'executive-action', name: 'Executive Action Center', category: 'reports', icon: 'task_alt', description: 'Actionable recommendations', defaultEnabled: true, priority: 2, defaultWidth: 2, defaultHeight: 1 },
  { id: 'executive-reports', name: 'Executive Reports', category: 'reports', icon: 'assessment', description: 'Executive-level reports', defaultEnabled: true, priority: 3, defaultWidth: 2, defaultHeight: 2 },
  { id: 'orion-decision', name: 'ORION Decision Desk', category: 'reports', icon: 'balance', description: 'AI decision recommendations', defaultEnabled: true, priority: 4, defaultWidth: 1, defaultHeight: 1 },
  { id: 'alternative-routes', name: 'Alternative Routes', category: 'reports', icon: 'alt_route', description: 'Route alternative generator', defaultEnabled: true, priority: 5, defaultWidth: 1, defaultHeight: 1 },
];

// Helper functions
export function getPanelsByCategory(category: PanelCategory): PanelConfig[] {
  return PANEL_REGISTRY.filter(p => p.category === category);
}

export function getDefaultEnabledPanels(category: PanelCategory): PanelConfig[] {
  return PANEL_REGISTRY.filter(p => p.category === category && p.defaultEnabled);
}

export function getPanelById(id: string): PanelConfig | undefined {
  return PANEL_REGISTRY.find(p => p.id === id);
}
