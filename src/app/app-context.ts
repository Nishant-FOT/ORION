import type { PanelConfig, MapLayers, NewsItem, MarketData, ClusteredEvent, CyberThreat, Monitor } from '@/types';

export type { CountryBriefSignals } from '@/types';

export interface IntelligenceCache {
  [key: string]: unknown;
}

export interface AppContext {
  map: unknown;
  readonly isMobile: boolean;
  readonly isDesktopApp: boolean;
  readonly container: HTMLElement;

  panels: Record<string, unknown>;
  newsPanels: Record<string, unknown>;
  panelSettings: Record<string, PanelConfig>;

  mapLayers: MapLayers;

  allNews: NewsItem[];
  newsByCategory: Record<string, NewsItem[]>;
  latestMarkets: MarketData[];
  latestPredictions: unknown[];
  latestTechEvents: unknown[];
  latestClusters: ClusteredEvent[];
  intelligenceCache: IntelligenceCache;
  cyberThreatsCache: CyberThreat[] | null;

  disabledSources: Set<string>;
  currentTimeRange: string;

  inFlight: Set<string>;
  seenGeoAlerts: Set<string>;
  monitors: Monitor[];

  signalModal: unknown;
  statusPanel: unknown;
  searchModal: unknown;
  findingsBadge: unknown;
  breakingBanner: unknown;
  playbackControl: unknown;
  exportPanel: unknown;
  unifiedSettings: unknown;
  pizzintIndicator: unknown;
  correlationEngine: unknown;
  llmStatusIndicator: unknown;
  countryBriefPage: unknown;
  countryTimeline: unknown;

  positivePanel: unknown;
  countersPanel: unknown;
  progressPanel: unknown;
  breakthroughsPanel: unknown;
  heroPanel: unknown;
  digestPanel: unknown;
  speciesPanel: unknown;
  renewablePanel: unknown;
  authModal: unknown;
  authHeaderWidget: unknown;
  tvMode: unknown;
  happyAllItems: NewsItem[];
  isDestroyed: boolean;
  isPlaybackMode: boolean;
  isIdle: boolean;
  initialLoadComplete: boolean;
  resolvedLocation: string;

  initialUrlState: unknown;
  readonly PANEL_ORDER_KEY: string;
  readonly PANEL_SPANS_KEY: string;
}

export interface AppModule {
  init(): void | Promise<void>;
  destroy(): void;
}
