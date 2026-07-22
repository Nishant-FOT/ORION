// ============================================================================
// Chokepoint Monitor Types
// ============================================================================

export type NaturalEventCategory =
  | 'severeStorms'
  | 'wildfires'
  | 'volcanoes'
  | 'earthquakes'
  | 'floods'
  | 'landslides'
  | 'drought'
  | 'dustHaze'
  | 'snow'
  | 'tempExtremes'
  | 'seaLakeIce'
  | 'waterColor'
  | 'manmade';

export const NATURAL_EVENT_CATEGORIES = new Set<NaturalEventCategory>([
  'severeStorms',
  'wildfires',
  'volcanoes',
  'earthquakes',
  'floods',
  'landslides',
  'drought',
  'dustHaze',
  'snow',
  'tempExtremes',
  'seaLakeIce',
  'waterColor',
  'manmade',
]);

export interface NaturalEvent {
  id: string;
  title: string;
  description?: string;
  category: NaturalEventCategory;
  categoryTitle: string;
  lat: number;
  lon: number;
  date: Date;
  magnitude?: number;
  magnitudeUnit?: string;
  sourceUrl?: string;
  sourceName?: string;
  closed: boolean;
  stormId?: string;
  stormName?: string;
  basin?: string;
  stormCategory?: number;
  classification?: string;
  windKt?: number;
  pressureMb?: number;
  movementDir?: number;
  movementSpeedKt?: number;
  forecastTrack?: unknown[];
  conePolygon?: number[][][];
  pastTrack?: unknown[];
}

export type ChokepointStatusLevel = 'normal' | 'elevated' | 'high_risk' | 'critical';

export interface ChokepointMonitorScore {
  risk: number;
  severity: number;
  confidence: number;
  trend: number;
  disruptionProbability: number;
  status: ChokepointStatusLevel;
  lastUpdated: string;
}

export interface ChokepointMonitor {
  id: string;
  name: string;
  lat: number;
  lon: number;
  score: ChokepointMonitorScore;
  riskFactors: string[];
  recentEvents: string[];
  breakdown: {
    conflict: number;
    aisAnomaly: number;
    congestion: number;
    warnings: number;
  };
}

// ============================================================================
// AIS & Maritime Types
// ============================================================================

export type AisDisruptionType = 'gap_spike' | 'chokepoint_congestion';

export type AisDisruptionSeverity = 'low' | 'elevated' | 'high';

export interface AisDisruptionEvent {
  id: string;
  name: string;
  type: AisDisruptionType;
  lat: number;
  lon: number;
  severity: AisDisruptionSeverity;
  changePct: number;
  windowHours: number;
  darkShips?: number;
  vesselCount: number;
  region?: string;
  description: string;
}

export interface AisDensityZone {
  id: string;
  name: string;
  lat: number;
  lon: number;
  intensity: number;
  deltaPct: number;
  shipsPerDay: number;
  note?: string;
}

// ============================================================================
// News / Intelligence Types
// ============================================================================

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type EventCategory =
  | 'military'
  | 'terrorism'
  | 'cyber'
  | 'political'
  | 'economic'
  | 'diplomatic'
  | 'humanitarian'
  | 'natural_disaster'
  | 'infrastructure'
  | 'nuclear'
  | 'maritime'
  | 'general'
  | 'conflict'
  | 'disaster'
  | 'health'
  | 'protest'
  | 'tech'
  | 'environmental'
  | 'crime';

export type SentimentType = 'negative' | 'neutral' | 'positive';

export type StoryPhase = 'breaking' | 'developing' | 'sustained' | 'fading';

export interface ThreatClassification {
  level: ThreatLevel;
  category: EventCategory;
  confidence: number;
  source: string;
}

export interface Feed {
  name: string;
  url: string | Record<string, string>;
  lang?: string;
  category?: string;
  type?: string;
  proxy?: boolean;
}

export type HappyContentCategory =
  | 'science-health'
  | 'nature-wildlife'
  | 'humanity-kindness'
  | 'innovation-tech'
  | 'climate-wins'
  | 'culture-community';

export interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: Date;
  isAlert: boolean;
  importanceScore?: number;
  corroborationCount?: number;
  locationName?: string;
  lat?: number;
  lon?: number;
  snippet?: string;
  lang?: string;
  monitorColor?: string;
  tier?: number;
  pubDateMissing?: boolean;
  happyCategory?: HappyContentCategory;
  imageUrl?: string;
  storyMeta?: {
    firstSeen: string;
    mentionCount: number;
    sourceCount: number;
    phase: StoryPhase;
  };
  threat?: ThreatClassification;
}

export interface EntityMention {
  entityId: string;
  entityType: 'country' | 'organization' | 'person' | 'crypto';
  displayName: string;
  mentionCount: number;
  avgConfidence: number;
  clusterIds: string[];
  topHeadlines: Array<{ title: string; source: string; link: string }>;
}

export interface VelocityMetrics {
  sourcesPerHour: number;
  level: VelocityLevel;
  trend: 'rising' | 'stable' | 'falling';
  sentiment: SentimentType;
  sentimentScore: number;
}

export type VelocityLevel = 'normal' | 'elevated' | 'spike' | 'quiet';

export interface ClusteredEvent {
  id: string;
  primaryTitle: string;
  primarySource: string;
  primaryLink: string;
  sourceCount: number;
  topSources: Array<{ name: string; tier: number; url: string }>;
  allItems: NewsItem[];
  firstSeen: Date;
  lastUpdated: Date;
  isAlert: boolean;
  monitorColor?: string;
  velocity?: VelocityMetrics;
  threat?: ThreatClassification;
  lat?: number;
  lon?: number;
  lang?: string;
  relatedHotspots?: string[];
}

export interface FocalPoint {
  id: string;
  entityId: string;
  entityType: 'country' | 'organization' | 'person' | 'crypto';
  displayName: string;
  newsMentions: number;
  newsVelocity: number;
  topHeadlines: Array<{ title: string; source: string; link: string }>;
  signalTypes: string[];
  signalCount: number;
  highSeverityCount: number;
  signalDescriptions: string[];
  focalScore: number;
  urgency: 'watch' | 'elevated' | 'critical';
  narrative: string;
  correlationEvidence: string[];
}

export interface FocalPointSummary {
  focalPoints: FocalPoint[];
  analyzedAt: Date;
  clusterCount: number;
  signalCountryCount: number;
}

export interface GdeltTensionPair {
  id: string;
  countries: [string, string];
  label: string;
  score: number;
  trend: 'rising' | 'stable' | 'falling';
  changePercent: number;
  region: string;
}

// ============================================================================
// Military Types
// ============================================================================

export type MilitaryBaseType = 'us-nato' | 'russia' | 'china' | 'uk' | 'france' | 'india' | 'japan' | 'italy' | 'uae' | 'other';

export type MilitaryOperator = 'usaf' | 'usn' | 'usmc' | 'usa' | 'raf' | 'rn' | 'faf' | 'gaf' | 'plaa' | 'plaaf' | 'plan' | 'vks' | 'iaf' | 'nato' | 'other';

export type MilitaryAircraftType = 'fighter' | 'bomber' | 'transport' | 'tanker' | 'awacs' | 'reconnaissance' | 'helicopter' | 'drone' | 'patrol' | 'special_ops' | 'vip' | 'unknown';

export type MilitaryVesselType = 'carrier' | 'destroyer' | 'frigate' | 'submarine' | 'cruiser' | 'amphibious' | 'support' | 'patrol' | 'mine warfare' | 'intelligence' | 'research' | 'unknown';

export interface MilitaryBase {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: MilitaryBaseType;
  country?: string;
  arm?: string;
  status?: string;
  description?: string;
}

export interface MilitaryBaseEnriched extends MilitaryBase {
  kind?: string;
  catAirforce?: boolean;
  catNaval?: boolean;
  catNuclear?: boolean;
  catSpace?: boolean;
  catTraining?: boolean;
}

export interface MilitaryFlight {
  id: string;
  callsign: string;
  hexCode: string;
  registration?: string;
  aircraftType: MilitaryAircraftType;
  aircraftModel?: string;
  operator: MilitaryOperator;
  operatorCountry: string;
  lat: number;
  lon: number;
  altitude: number;
  heading: number;
  speed: number;
  verticalRate?: number;
  onGround: boolean;
  squawk?: string;
  origin?: string;
  destination?: string;
  lastSeen: Date;
  firstSeen?: Date;
  track?: [number, number][];
  confidence: 'high' | 'medium' | 'low';
  isInteresting?: boolean;
  note?: string;
  enriched?: {
    manufacturer?: string;
    owner?: string;
    operatorName?: string;
    typeCode?: string;
    builtYear?: number;
    confirmedMilitary: boolean;
    militaryBranch?: string;
  };
}

export interface MilitaryFlightCluster {
  id: string;
  name: string;
  lat: number;
  lon: number;
  flightCount: number;
  flights: MilitaryFlight[];
  dominantOperator?: MilitaryOperator;
  activityType: 'exercise' | 'patrol' | 'transport' | 'unknown';
}

export interface MilitaryVessel {
  id: string;
  mmsi: string;
  name: string;
  vesselType: MilitaryVesselType;
  aisShipType?: string;
  hullNumber?: string;
  operator: MilitaryOperator | 'other';
  operatorCountry: string;
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  course?: number;
  lastAisUpdate: Date;
  aisGapMinutes?: number;
  isDark: boolean;
  nearChokepoint?: string;
  nearBase?: string;
  track?: [number, number][];
  confidence: 'high' | 'medium' | 'low';
  isInteresting: boolean;
  note?: string;
  usniHomePort?: string;
  usniRegion?: string;
  usniDeploymentStatus?: string;
  usniArticleUrl?: string;
  usniArticleDate?: string;
  usniStrikeGroup?: string;
  usniActivityDescription?: string;
  usniSource?: boolean;
}

export interface MilitaryVesselCluster {
  id: string;
  name: string;
  lat: number;
  lon: number;
  vesselCount: number;
  vessels: MilitaryVessel[];
  region: string;
  activityType: 'exercise' | 'deployment' | 'transit' | 'unknown';
}

export interface APTGroup {
  id: string;
  name: string;
  aka: string;
  sponsor: string;
  lat: number;
  lon: number;
  mitreId: string;
  mitreUrl: string;
  description: string;
  tactics: string[];
  targetSectors: string[];
  active: boolean;
}

export interface USNIFleetReport {
  articleUrl: string;
  articleDate: string;
  articleTitle: string;
  battleForceSummary?: {
    totalShips: number;
    deployed: number;
    underway: number;
  };
  vessels: USNIVesselEntry[];
  strikeGroups: Array<{
    name: string;
    carrier: string;
    airWing: string;
    destroyerSquadron: string;
    escorts: string[];
  }>;
  regions: string[];
  parsingWarnings: string[];
  timestamp: string;
}

export interface USNIVesselEntry {
  name: string;
  hullNumber: string;
  vesselType: string;
  region: string;
  regionLat: number;
  regionLon: number;
  deploymentStatus: string;
  homePort?: string;
  strikeGroup?: string;
  activityDescription?: string;
  usniArticleUrl: string;
  usniArticleDate: string;
}

export interface RepairShip {
  id: string;
  name: string;
  lat: number;
  lon: number;
  operator?: string;
  status?: string;
  eta?: string;
  cableId?: string;
  nearestCableId?: string;
  nearestCableName?: string;
}

export type PizzIntDefconLevel = 1 | 2 | 3 | 4 | 5;

export interface PizzIntLocation {
  place_id: string;
  name: string;
  address: string;
  current_popularity: number;
  percentage_of_usual: number | null;
  is_spike: boolean;
  spike_magnitude: number | null;
  data_source: string;
  recorded_at: string;
  data_freshness: 'fresh' | 'stale';
  is_closed_now: boolean;
  lat?: number;
  lng?: number;
}

export interface PizzIntStatus {
  defconLevel: PizzIntDefconLevel;
  defconLabel: string;
  aggregateActivity: number;
  activeSpikes: number;
  locationsMonitored: number;
  locationsOpen: number;
  lastUpdate: Date;
  dataFreshness: 'fresh' | 'stale';
  locations: PizzIntLocation[];
}

// ============================================================================
// Cyber Types
// ============================================================================

export type CyberThreatType = 'c2_server' | 'malware_host' | 'phishing' | 'malicious_url';

export type CyberThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CyberThreatSource = 'feodo' | 'urlhaus' | 'c2intel' | 'otx' | 'abuseipdb';

export type CyberThreatIndicatorType = 'ip' | 'domain' | 'url';

export interface CyberThreat {
  id: string;
  type: CyberThreatType;
  source: CyberThreatSource;
  indicator: string;
  indicatorType: CyberThreatIndicatorType;
  lat: number;
  lon: number;
  country?: string;
  severity: CyberThreatSeverity;
  malwareFamily?: string;
  tags: string[];
  firstSeen?: string;
  lastSeen?: string;
}

// ============================================================================
// Market / Finance Types
// ============================================================================

export interface MarketData {
  symbol: string;
  name: string;
  display: string;
  price: number | null;
  change: number | null;
  changePercent?: number;
  sparkline?: number[];
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  display: string;
}

export interface Commodity {
  symbol: string;
  name: string;
  display: string;
  category?: string;
}

export interface CryptoData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  sparkline?: number[];
}

export interface TokenData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  change24h: number;
  change7d: number;
  sparkline?: number[];
  category?: string;
}

export interface Sector {
  symbol: string;
  name: string;
}

export type AssetType = 'pipeline' | 'cable' | 'datacenter' | 'base' | 'nuclear';

export interface DeductContextDetail {
  query: string;
  geoContext: string;
  autoSubmit?: boolean;
}

// ============================================================================
// Map / Geography Types
// ============================================================================

export interface Hotspot {
  id: string;
  name: string;
  subtext: string;
  lat: number;
  lon: number;
  location: string;
  keywords: string[];
  agencies: string[];
  description: string;
  status: string;
  level?: 'low' | 'elevated' | 'high';
  escalationScore?: number;
  escalationTrend?: 'stable' | 'escalating' | 'de-escalating';
  escalationIndicators?: string[];
  history?: {
    lastMajorEvent: string;
    lastMajorEventDate: string;
    precedentCount: number;
    precedentDescription: string;
    cyclicalRisk: string;
  };
  whyItMatters?: string;
}

export interface ConflictZone {
  id: string;
  name: string;
  coords: number[][];
  center: [number, number];
  intensity: 'low' | 'medium' | 'high';
  parties: string[];
  casualties: string;
  displaced: string;
  keywords: string[];
  startDate: string;
  location: string;
  description: string;
  keyDevelopments: string[];
  peaceAgreements?: string[];
  totalFatalities?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: 'oil' | 'gas' | 'lng';
  from?: string;
  to?: string;
  lat?: number;
  lon?: number;
  capacity?: string;
  status?: string;
  length?: string;
  countries?: string[];
  operator?: string;
  points?: number[][];
}

export interface UnderseaCable {
  id: string;
  name: string;
  points: number[][];
  major: boolean;
  rfsYear: number;
  owners: string[];
  landingPoints: Array<{
    country: string;
    countryName: string;
    city: string;
    lat: number;
    lon: number;
  }>;
  countriesServed: Array<{
    country: string;
    capacityShare: number;
    isRedundant: boolean;
  }>;
}

export interface CableAdvisory {
  id: string;
  cableId: string;
  cableName: string;
  type: string;
  severity: string;
  title?: string;
  description: string;
  date: string;
  reported?: string;
  source: string;
  lat?: number;
  lon?: number;
  impact?: string;
  repairEta?: string;
}

export type CableHealthStatus = 'healthy' | 'degraded' | 'disrupted' | 'fault' | 'unknown';

export interface CableHealthRecord {
  cableId: string;
  cableName: string;
  status: CableHealthStatus;
  latencyMs?: number;
  capacity?: number;
  lastChecked: string;
}

export interface CableHealthResponse {
  cables: Record<string, CableHealthRecord>;
  overallStatus: CableHealthStatus;
  lastUpdated: string;
}

export interface Port {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  type: PortType;
  importance?: number;
  rank?: number;
  note?: string;
  description?: string;
}

export type PortType = 'container' | 'bulk' | 'oil' | 'lng' | 'naval' | 'multipurpose' | 'mixed';

export interface NuclearFacility {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'plant' | 'research' | 'enrichment' | 'reprocessing' | 'weapons' | 'test-site';
  status: 'active' | 'construction' | 'decommissioned';
  operator: string;
  operationalSince?: string;
  treaties?: string[];
  iaeaStatus?: string;
  keyEvents?: string[];
}

export interface Spaceport {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  operator: string;
  status: 'active' | 'inactive' | 'construction';
  launches: 'High' | 'Medium' | 'Low';
}

export interface GammaIrradiator {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface StrategicWaterway {
  id: string;
  chokepointId: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
}

export interface EconomicCenter {
  id: string;
  name: string;
  type: 'exchange' | 'central-bank' | 'financial-hub';
  lat: number;
  lon: number;
  country: string;
  marketHours?: {
    open: string;
    close: string;
    timezone: string;
  };
  description: string;
}

export interface InternetOutage {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: Date;
  country: string;
  region?: string;
  lat: number;
  lon: number;
  severity: 'partial' | 'major' | 'total';
  categories: string[];
  cause?: string;
  outageType?: string;
  endDate?: Date;
}

// ============================================================================
// Map Cluster Types
// ============================================================================

export interface MapDatacenterCluster {
  id: string;
  lat: number;
  lon: number;
  count: number;
  items: AIDataCenter[];
  _clusterId?: number;
}

export interface MapProtestCluster {
  id: string;
  lat: number;
  lon: number;
  count: number;
  items: SocialUnrestEvent[];
  maxSeverity: ProtestSeverity;
  hasRiot: boolean;
  _clusterId?: number;
}

export interface MapTechEventCluster {
  id: string;
  lat: number;
  lon: number;
  count: number;
  items: Array<{ id: string; title: string; lat: number; lng: number; country: string; daysUntil: number }>;
  _clusterId?: number;
}

export interface MapTechHQCluster {
  id: string;
  lat: number;
  lon: number;
  count: number;
  items: TechHQ[];
  _clusterId?: number;
}

// ============================================================================
// Protest Types
// ============================================================================

export type ProtestEventType = 'protest' | 'riot' | 'strike' | 'demonstration' | 'civil_unrest';

export type ProtestSeverity = 'low' | 'medium' | 'high';

export type ProtestSource = 'acled' | 'gdelt' | 'rss';

export interface SocialUnrestEvent {
  id: string;
  title: string;
  summary?: string;
  eventType: ProtestEventType;
  city?: string;
  country: string;
  region?: string;
  lat: number;
  lon: number;
  time: Date;
  severity: ProtestSeverity;
  fatalities?: number;
  sources: string[];
  sourceUrls?: string[];
  sourceType: ProtestSource;
  tags?: string[];
  actors?: string[];
  confidence: 'high' | 'medium' | 'low';
  validated: boolean;
}

export interface PopulationExposure {
  eventId: string;
  eventName: string;
  eventType: string;
  lat: number;
  lon: number;
  exposedPopulation: number;
  exposureRadiusKm: number;
}

// ============================================================================
// Gulf Investment Types
// ============================================================================

export type GulfInvestorCountry = 'UAE' | 'SA' | 'Qatar' | 'Kuwait' | 'Bahrain' | 'Oman';

export type GulfInvestingEntity = string;

export type GulfInvestmentSector = 'ports' | 'energy' | 'technology' | 'real_estate' | 'defense' | 'finance' | 'logistics' | 'mining' | 'healthcare' | 'telecom' | 'renewable' | 'media' | 'agriculture' | 'transport' | 'industrial' | 'manufacturing';

export type GulfInvestmentStatus = 'operational' | 'under_construction' | 'under-construction' | 'planned' | 'announced' | 'cancelled';

export interface GulfInvestment {
  id: string;
  investingEntity: string;
  investingCountry: GulfInvestorCountry;
  targetCountry: string;
  targetCountryIso: string;
  sector: GulfInvestmentSector;
  assetType: string;
  assetName: string;
  lat: number;
  lon: number;
  investmentUSD?: number;
  stakePercent?: number;
  status: GulfInvestmentStatus;
  yearAnnounced?: number;
  yearOperational?: number;
  description: string;
  sourceUrl?: string;
  tags?: string[];
}

// ============================================================================
// Startup / Tech Types
// ============================================================================

export interface StartupEcosystem {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  ecosystemTier: 'tier1' | 'tier2' | 'tier3';
  totalFunding2024: number;
  activeStartups: number;
  unicorns: number;
  topSectors: string[];
  majorVCs: string[];
  notableStartups: string[];
  avgSeedRound: number;
  avgSeriesA: number;
}

export interface TechCompany {
  id: string;
  name: string;
  sector: string;
  officeType: 'headquarters' | 'office' | 'research_lab' | 'major office';
  city: string;
  country: string;
  lat: number;
  lon: number;
  employees?: number;
  foundedYear?: number;
  keyProducts?: string[];
  valuation?: number;
  stockSymbol?: string;
}

export interface TechHQ {
  id: string;
  company: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  type: 'faang' | 'unicorn' | 'public' | 'semiconductor' | 'cloud' | 'ai';
  marketCap?: string;
}

export interface AIDataCenter {
  id: string;
  name: string;
  owner: string;
  country: string;
  lat: number;
  lon: number;
  status: 'existing' | 'planned' | 'construction' | 'decommissioned';
  chipType: string;
  chipCount: number;
  powerMW?: number;
  sector?: string;
}

export interface AIResearchLab {
  id: string;
  name: string;
  organization?: string;
  lat: number;
  lon: number;
  city: string;
  country: string;
  type?: string;
  foundedYear?: number;
  focus?: string[];
  focusAreas?: string[];
  notableWork?: string[];
  publications?: string[];
}

// ============================================================================
// CII / Cascade / Resilience Types
// ============================================================================

export interface InfrastructureNode {
  id: string;
  name: string;
  type: 'cable' | 'pipeline' | 'port' | 'chokepoint' | 'country' | 'datacenter' | 'base';
  lat?: number;
  lon?: number;
  coordinates?: [number, number];
  metadata?: Record<string, unknown>;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: string;
  strength: number;
  redundancy?: number;
  metadata?: {
    estimatedImpact?: string;
    [key: string]: unknown;
  };
}

export type CascadeImpactLevel = 'critical' | 'high' | 'medium' | 'low';

export interface CascadeAffectedNode {
  node: InfrastructureNode;
  impactLevel: CascadeImpactLevel;
  pathLength: number;
  dependencyChain: string[];
  redundancyAvailable: boolean;
  estimatedRecovery?: string;
}

export interface CascadeCountryImpact {
  country: string;
  countryName: string;
  impactLevel: CascadeImpactLevel;
  affectedCapacity: number;
}

export interface CascadeResult {
  source: InfrastructureNode;
  affectedNodes: CascadeAffectedNode[];
  countriesAffected: CascadeCountryImpact[];
  redundancies: Array<{ id: string; name: string; capacityShare: number }>;
}

export interface CriticalMineralProject {
  id: string;
  name: string;
  lat: number;
  lon: number;
  mineral: string;
  country: string;
  operator: string;
  status: 'producing' | 'development' | 'exploration' | 'paused';
  significance: string;
}

// ============================================================================
// Config / Panel / Monitor Types
// ============================================================================

export interface PanelConfig {
  name: string;
  enabled: boolean;
  priority?: number;
  sources?: string[];
}

export interface Monitor {
  id: string;
  keywords: string[];
  color: string;
  riskScore?: number;
}

export interface MonitoredAirport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  region: string;
}

export type DataSourceId =
  | 'acled' | 'opensky' | 'wingbits' | 'ais' | 'usgs' | 'gdelt' | 'gdelt_doc'
  | 'rss' | 'polymarket' | 'predictions' | 'pizzint' | 'outages'
  | 'weather' | 'economic' | 'oil' | 'spending' | 'firms' | 'acled_conflict' | 'ucdp'
  | 'hapi' | 'ucdp_events' | 'unhcr' | 'climate' | 'worldpop' | 'giving' | 'bis'
  | 'bls' | 'wto_trade' | 'supply_chain' | 'security_advisories' | 'sanctions_pressure'
  | 'radiation' | 'gpsjam' | 'treasury_revenue' | 'thermal-escalation' | 'cross-source-signals';

export type DeviationLevel = 'normal' | 'elevated' | 'spike' | 'quiet' | 'high' | 'extreme';

// ============================================================================
// Map Layers (already in file, but re-exported here for completeness)
// ============================================================================

export interface MapLayers {
  conflicts: boolean;
  bases: boolean;
  cables: boolean;
  pipelines: boolean;
  hotspots: boolean;
  ais: boolean;
  nuclear: boolean;
  irradiators: boolean;
  radiationWatch?: boolean;
  sanctions: boolean;
  weather: boolean;
  economic: boolean;
  waterways: boolean;
  outages: boolean;
  datacenters: boolean;
  protests: boolean;
  flights: boolean;
  military: boolean;
  natural: boolean;
  spaceports: boolean;
  minerals: boolean;
  fires: boolean;
  ucdpEvents: boolean;
  displacement: boolean;
  climate: boolean;
  startupHubs: boolean;
  cloudRegions: boolean;
  accelerators: boolean;
  techHQs: boolean;
  techEvents: boolean;
  stockExchanges: boolean;
  financialCenters: boolean;
  centralBanks: boolean;
  commodityHubs: boolean;
  gulfInvestments: boolean;
  positiveEvents: boolean;
  kindness: boolean;
  happiness: boolean;
  speciesRecovery: boolean;
  renewableInstallations: boolean;
  tradeRoutes: boolean;
  iranAttacks: boolean;
  gpsJamming: boolean;
  satellites: boolean;
  ciiChoropleth: boolean;
  resilienceScore: boolean;
  dayNight: boolean;
  miningSites: boolean;
  processingPlants: boolean;
  commodityPorts: boolean;
  webcams: boolean;
  diseaseOutbreaks: boolean;
  storageFacilities?: boolean;
  fuelShortages?: boolean;
  liveTankers?: boolean;
  energySupplyNetwork?: boolean;
  chokepointMonitoring?: boolean;
}

// ============================================================================
// Content Types
// ============================================================================

export interface RelatedAsset {
  id: string;
  name: string;
  type: AssetType;
  lat: number;
  lon: number;
  distanceKm?: number;
}

export interface RelatedAssetContext {
  assets: RelatedAsset[];
  origin: { label: string; lat: number; lon: number };
  types?: AssetType[];
}

export type UcdpEventType = 'state-based' | 'non-state' | 'one-sided';

export interface UcdpGeoEvent {
  id: string;
  date_start: string;
  date_end: string;
  latitude: number;
  longitude: number;
  country: string;
  side_a: string;
  side_b: string;
  deaths_best: number;
  deaths_low: number;
  deaths_high: number;
  type_of_violence: UcdpEventType;
  source_original: string;
}

// ============================================================================
// Country Brief / Signals Types
// ============================================================================

export type EscalationTrend = 'stable' | 'escalating' | 'de-escalating';

export interface CountryBriefSignals {
  criticalNews: number;
  protests: number;
  militaryFlights: number;
  militaryVessels: number;
  militaryFlightsInCountry: number;
  militaryVesselsInCountry: number;
  outages: number;
  aisDisruptions: number;
  satelliteFires: number;
  radiationAnomalies: number;
  temporalAnomalies: number;
  earthquakes: number;
  displacementOutflow: number;
  climateStress: number;
  conflictEvents: number;
  activeStrikes: number;
  orefSirens: number;
  orefHistory24h: number;
  aviationDisruptions: number;
  travelAdvisories: number;
  travelAdvisoryMaxLevel: string | null;
  gpsJammingHexes: number;
  isTier1: boolean;
  thermalEscalations: number;
  sanctionsDesignations: number;
  sanctionsNewDesignations: number;
}
