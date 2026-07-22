import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapProvider, getMapTheme } from '@/config/basemap';
import { getStyleForProvider } from '@/config/basemap-styles';
import { INTEL_HOTSPOTS, STRATEGIC_WATERWAYS, CONFLICT_ZONES, MILITARY_BASES } from '@/config/geo';
import { NUCLEAR_FACILITIES, ECONOMIC_CENTERS, SPACEPORTS, CRITICAL_MINERALS, UNDERSEA_CABLES } from '@/config/geo-map';
import { PIPELINES } from '@/config/pipelines';
import { GAMMA_IRRADIATORS } from '@/config/irradiators';
import { PORTS } from '@/config/ports';
import { STOCK_EXCHANGES } from '@/config/finance-geo';
import { STARTUP_HUBS } from '@/config/tech-geo';
import { resolveTradeRouteSegments, TRADE_ROUTES } from '@/config/trade-routes';
import { getCountryAtCoordinates, preloadCountryGeometry } from '@/services/country-geometry';
import { LAYER_EXPLANATIONS, getLayersForVariant } from '@/config/map-layer-definitions';
import { renderLayerExplanationCard } from '@/utils/layer-explanation-card';
import { showLayerWarning } from '@/utils/layer-warning';
import { getStoredMapModePreference } from '@/services/map-mode-preference';
import { getHydratedData } from '@/services/bootstrap';

const DEG2RAD = Math.PI / 180;
const LAYER_WARNING_THRESHOLD = 15;

function greatCircleInterpolate(
  start: [number, number], end: [number, number], numPoints: number
): [number, number][] {
  const [lon1, lat1] = start;
  const [lon2, lat2] = end;
  if (Math.abs(lon1 - lon2) < 1e-6 && Math.abs(lat1 - lat2) < 1e-6) return [start];
  const φ1 = lat1 * DEG2RAD, λ1 = lon1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD, λ2 = lon2 * DEG2RAD;
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((φ2 - φ1) / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
    )
  );
  if (d < 1e-6 || numPoints < 3) return [start, end];
  const pts: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    pts.push([Math.atan2(y, x) / DEG2RAD, Math.atan2(z, Math.sqrt(x * x + y * y)) / DEG2RAD]);
  }
  return pts;
}

function splitAtAntimeridian(pts: [number, number][]): [number, number][][] {
  if (pts.length === 0) return [];
  const segments: [number, number][][] = [[pts[0]!]];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    if (Math.abs(curr[0] - prev[0]) > 180) {
      segments.push([curr]);
    } else {
      segments[segments.length - 1]!.push(curr);
    }
  }
  return segments.filter(s => s.length >= 2);
}

function interpolateLineViaGreatCircle(
  points: [number, number][], segments: number = 12
): [number, number][][] {
  if (points.length < 2) return [points];
  const cleaned: [number, number][] = [points[0]!];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    if (Math.abs(curr[0] - prev[0]) > 1e-6 || Math.abs(curr[1] - prev[1]) > 1e-6) {
      cleaned.push(curr);
    }
  }
  if (cleaned.length < 2) return [cleaned];
  const allPts: [number, number][] = [cleaned[0]!];
  for (let i = 1; i < cleaned.length; i++) {
    const arc = greatCircleInterpolate(cleaned[i - 1]!, cleaned[i]!, segments);
    for (let j = 1; j < arc.length; j++) allPts.push(arc[j]!);
  }
  return splitAtAntimeridian(allPts);
}

type MapMode = 'flat' | 'globe';

interface LayerDef { id: string; label: string; color: string; icon: string; category?: string; }

const LAYER_COLORS: Record<string, string> = {
  iranAttacks: '#ef4444', hotspots: '#f97316', conflicts: '#dc2626', bases: '#3b82f6',
  nuclear: '#a855f7', irradiators: '#f43f5e', radiationWatch: '#a855f7', spaceports: '#8b5cf6',
  satellites: '#64748b', cables: '#06b6d4', pipelines: '#f59e0b', datacenters: '#8b5cf6',
  military: '#3b82f6', ais: '#38bdf8', tradeRoutes: '#22d3ee', flights: '#60a5fa',
  protests: '#f59e0b', ucdpEvents: '#dc2626', displacement: '#fb923c', climate: '#22d3ee',
  weather: '#38bdf8',   outages: '#ef4444', natural: '#ef4444',
  fires: '#f97316', waterways: '#2dd4bf', economic: '#eab308', minerals: '#ec4899',
  gpsJamming: '#f472b6', ciiChoropleth: '#f59e0b', resilienceScore: '#3b82f6',
  dayNight: '#64748b', sanctions: '#94a3b8', startupHubs: '#22d3ee', techHQs: '#8b5cf6',
  accelerators: '#facc15', cloudRegions: '#06b6d4', techEvents: '#60a5fa',
  stockExchanges: '#facc15', financialCenters: '#eab308', gccInvestments: '#14b8a6',
  commodityHubs: '#f59e0b', positiveEvents: '#22c55e', kindness: '#f472b6',
  happiness: '#facc15', speciesRecovery: '#10b981', renewableInstallations: '#34d399',
  miningSites: '#a78bfa', processingPlants: '#c084fc', commodityPorts: '#14b8a6',
  oilStorage: '#f59e0b', lngTerminals: '#06b6d4', refineries: '#8b5cf6',
  powerPlants: '#eab308', storageFacilities: '#f59e0b', fuelShortages: '#ef4444',
  liveTankers: '#38bdf8', energySupplyNetwork: '#22d3ee', chokepointMonitoring: '#6bfb9a',
  energyCrisisPolicies: '#f43f5e', energyDisruptions: '#ef4444', euGasStorage: '#06b6d4',
  sprPolicies: '#f97316', electricityPrices: '#facc15', jodiOil: '#f59e0b',
};

const LAYER_ICONS: Record<string, string> = {
  iranAttacks: 'my_location', hotspots: 'sensors', conflicts: 'warning',
  bases: 'shield', nuclear: 'radioactivity', irradiators: 'warning',
  radiationWatch: 'radioactivity', spaceports: 'rocket_launch', satellites: 'satellite_alt',
  cables: 'cable', pipelines: 'local_gas_station', datacenters: 'dns',
  military: 'flight', ais: 'directions_boat', tradeRoutes: 'route',
  flights: 'flight', protests: 'group', ucdpEvents: 'local_fire_department',
  displacement: 'groups', climate: 'thunderstorm', weather: 'cloud',
  outages: 'signal_wifi_off', natural: 'thunderstorm',
  fires: 'local_fire_department', waterways: 'waves', economic: 'payments',
  minerals: 'diamond', gpsJamming: 'gps_off', ciiChoropleth: 'public',
  resilienceScore: 'trending_up', dayNight: 'dark_mode', sanctions: 'block',
  startupHubs: 'science', techHQs: 'corporate_fare', accelerators: 'bolt',
  cloudRegions: 'cloud', techEvents: 'event', stockExchanges: 'candlestick_chart',
  financialCenters: 'payments', gccInvestments: 'savings', commodityHubs: 'inventory_2',
  positiveEvents: 'thumb_up', kindness: 'favorite', happiness: 'sentiment_very_satisfied',
  speciesRecovery: 'eco', renewableInstallations: 'solar_power',
  miningSites: 'diamond', processingPlants: 'factory', commodityPorts: 'anchor',
  oilStorage: 'oil_barrel', lngTerminals: 'local_gas_station', refineries: 'factory',
  powerPlants: 'bolt', storageFacilities: 'warehouse', fuelShortages: 'warning',
  liveTankers: 'directions_boat', energySupplyNetwork: 'hub', chokepointMonitoring: 'water',
  energyCrisisPolicies: 'gavel', energyDisruptions: 'report', euGasStorage: 'gas_meter',
  sprPolicies: 'local_fire_department', electricityPrices: 'bolt', jodiOil: 'oil_barrel',
};

const LAYER_CATEGORIES: Record<string, string> = {
  iranAttacks: 'conflicts', hotspots: 'conflicts', conflicts: 'conflicts',
  bases: 'infrastructure', nuclear: 'infrastructure', irradiators: 'infrastructure',
  radiationWatch: 'environment', spaceports: 'infrastructure', satellites: 'infrastructure',
  cables: 'infrastructure', pipelines: 'infrastructure', datacenters: 'infrastructure',
  military: 'conflicts', ais: 'maritime', tradeRoutes: 'maritime',
  flights: 'maritime', protests: 'conflicts', ucdpEvents: 'conflicts',
  displacement: 'conflicts', climate: 'environment', weather: 'environment',
  outages: 'infrastructure', natural: 'environment',
  fires: 'environment', waterways: 'maritime', economic: 'economic',
  minerals: 'economic', gpsJamming: 'environment', ciiChoropleth: 'economic',
  resilienceScore: 'economic', dayNight: 'environment', sanctions: 'economic',
  startupHubs: 'economic', techHQs: 'economic', accelerators: 'economic',
  cloudRegions: 'economic', techEvents: 'economic', stockExchanges: 'economic',
  financialCenters: 'economic', gccInvestments: 'economic', commodityHubs: 'economic',
  positiveEvents: 'environment', kindness: 'environment', happiness: 'environment',
  speciesRecovery: 'environment', renewableInstallations: 'environment',
  miningSites: 'economic', processingPlants: 'economic', commodityPorts: 'maritime',
  oilStorage: 'infrastructure', lngTerminals: 'infrastructure', refineries: 'infrastructure',
  powerPlants: 'infrastructure', storageFacilities: 'infrastructure', fuelShortages: 'infrastructure',
  liveTankers: 'maritime', energySupplyNetwork: 'infrastructure', chokepointMonitoring: 'maritime',
  energyCrisisPolicies: 'economic', energyDisruptions: 'infrastructure', euGasStorage: 'infrastructure',
  sprPolicies: 'economic', electricityPrices: 'economic', jodiOil: 'economic',
};

const CATEGORY_LABELS: Record<string, string> = {
  conflicts: 'Conflicts & Security',
  maritime: 'Maritime & Trade',
  infrastructure: 'Infrastructure',
  economic: 'Economic',
  environment: 'Environment & Weather',
};

const LAYER_KEY_TO_MAP_IDS: Record<string, string[]> = {
  conflicts: ['conflict-zones-fill', 'conflict-zones-border'],
  gpsJamming: ['gps-jamming-fill', 'gps-jamming-border'],
  tradeRoutes: ['trade-routes-line', 'trade-routes-dash'],
  hotspots: ['intel-hotspots', 'intel-hotspots-glow'],
  bases: ['military-bases'],
  nuclear: ['nuclear'],
  military: ['military-vessels', 'military-vessels-glow'],
  ais: ['ais-shipping'],
  protests: ['protests'],
  ucdpEvents: ['ucdp-events', 'ucdp-events-glow'],
  weather: ['weather', 'weather-glow'],
  natural: ['natural-disasters', 'natural-disasters-glow'],
  fires: ['wildfires', 'wildfires-glow'],
  waterways: ['waterways', 'waterways-glow'],
  economic: ['economic'],
  minerals: ['minerals'],
  sanctions: ['sanctions'],
  cables: ['cables'],
  pipelines: ['pipelines'],
  spaceports: ['spaceports'],
  irradiators: ['irradiators'],
  datacenters: ['datacenters'],
};

const FLAT_LAYER_KEYS = new Set(Object.keys(LAYER_KEY_TO_MAP_IDS));

function buildCanonicalLayers(): LayerDef[] {
  const variant = (window as any).__orionVariant || 'full';
  const defs = getLayersForVariant(variant, 'flat');
  return defs
    .filter(d => FLAT_LAYER_KEYS.has(d.key))
    .map(d => ({
      id: d.key,
      label: d.fallbackLabel || d.key,
      color: LAYER_COLORS[d.key] || '#94a3b8',
      icon: LAYER_ICONS[d.key] || 'circle',
      category: LAYER_CATEGORIES[d.key] || 'infrastructure',
    }));
}

const LAYERS = buildCanonicalLayers();

export class MapContainer {
  private container: HTMLElement;
  private mode: MapMode = 'flat';
  private map: maplibregl.Map | null = null;
  private globe: any = null;
  private popup: maplibregl.Popup | null = null;
  private activeLayers = new Set(LAYERS.map(l => l.id));
  private layerPanelOpen = false;
  private geoData: Record<string, any[]> = {};
  private cargoAnimationFrame: number | null = null;
  private lastCargoUpdateAt = 0;
  private autoGlobeSwitching = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    this.collectGeoData();
    this.renderShell();
    preloadCountryGeometry().catch(() => {});
    await this.initFlatMap();
    this.bindEvents();
    const savedMode = getStoredMapModePreference();
    if (savedMode === 'globe') {
      await this.switchMode('globe');
    }
  }

  private collectGeoData(): void {
    // Trade routes
    const tradeSegments = resolveTradeRouteSegments();
    const routeLines: { name: string; category: string; status: string; points: [number, number][] }[] = [];
    const routeGroups = new Map<string, typeof tradeSegments>();
    for (const seg of tradeSegments) {
      const arr = routeGroups.get(seg.routeId) ?? [];
      arr.push(seg);
      routeGroups.set(seg.routeId, arr);
    }
    for (const [routeId, segs] of routeGroups) {
      const route = TRADE_ROUTES.find(r => r.id === routeId);
      const pts: [number, number][] = [];
      for (const s of segs.sort((a, b) => a.segmentIndex - b.segmentIndex)) {
        if (pts.length === 0) pts.push(s.sourcePosition);
        pts.push(s.targetPosition);
      }
      routeLines.push({ name: route?.name ?? routeId, category: route?.category ?? 'container', status: route?.status ?? 'active', points: pts });
    }

    // Simulated AIS shipping dots (major shipping lanes)
    const aisDots = [
      { name: 'Tanker convoy', lat: 26.5, lon: 56.3, type: 'tanker' },
      { name: 'Container fleet', lat: 1.2, lon: 103.8, type: 'container' },
      { name: 'LNG carrier', lat: 25.3, lon: 51.5, type: 'lng' },
      { name: 'Bulk carrier', lat: -33.9, lon: 18.4, type: 'bulk' },
      { name: 'Container ship', lat: 31.2, lon: 32.3, type: 'container' },
      { name: 'Oil tanker', lat: 12.8, lon: 45.0, type: 'tanker' },
      { name: 'Chemical tanker', lat: 22.3, lon: 114.2, type: 'tanker' },
      { name: 'RoRo vessel', lat: 35.1, lon: 129.0, type: 'roro' },
      { name: 'General cargo', lat: -6.2, lon: 106.8, type: 'cargo' },
      { name: 'Container vessel', lat: 19.4, lon: 72.8, type: 'container' },
      { name: 'VLCC', lat: 26.0, lon: 56.5, type: 'tanker' },
      { name: 'Grain carrier', lat: 35.0, lon: -90.0, type: 'bulk' },
      { name: 'Container ship', lat: 25.0, lon: 55.0, type: 'container' },
      { name: 'LPG carrier', lat: 25.8, lon: 51.8, type: 'lng' },
      { name: 'Iron ore carrier', lat: -20.0, lon: 118.5, type: 'bulk' },
    ];

    // Simulated military vessels
    const milVessels = [
      { name: 'USS Dwight D. Eisenhower (CVN-69)', lat: 12.5, lon: 43.2, type: 'carrier' },
      { name: 'USS Bataan (LHD-5)', lat: 31.2, lon: 32.3, type: 'amphibious' },
      { name: 'HMS Queen Elizabeth (R08)', lat: 12.0, lon: 44.5, type: 'carrier' },
      { name: 'INS Vikramaditya (R33)', lat: 18.9, lon: 72.8, type: 'carrier' },
      { name: 'Type 003 Fujian (18)', lat: 25.0, lon: 121.5, type: 'carrier' },
      { name: 'Admiral Kuznetsov (063)', lat: 35.0, lon: 18.0, type: 'carrier' },
      { name: 'USS Ronald Reagan (CVN-76)', lat: 15.0, lon: 145.0, type: 'carrier' },
      { name: 'USS Nimitz (CVN-68)', lat: 8.0, lon: 117.0, type: 'carrier' },
      { name: 'FS Charles de Gaulle (R91)', lat: 25.0, lon: 58.0, type: 'carrier' },
      { name: 'JS Kaga (DDH-184)', lat: 15.0, lon: 140.0, type: 'helicopter' },
    ];

    // Simulated protest events
    const protestEvents = [
      { name: 'Anti-government protests', lat: 30.0, lon: 31.2, intensity: 'high' },
      { name: 'Labor strikes', lat: 51.5, lon: -0.1, intensity: 'medium' },
      { name: 'Climate demonstrations', lat: 48.9, lon: 2.3, intensity: 'low' },
      { name: 'Food price protests', lat: 14.6, lon: -17.4, intensity: 'high' },
      { name: 'Political unrest', lat: -1.3, lon: 36.8, intensity: 'medium' },
      { name: 'Student protests', lat: 19.4, lon: -99.1, intensity: 'low' },
      { name: 'Anti-war demonstrations', lat: 55.8, lon: 37.6, intensity: 'medium' },
      { name: 'Ethnic tensions', lat: 4.0, lon: 7.0, intensity: 'high' },
    ];

    // Simulated GPS jamming zones
    const gpsJamming = [
      { name: 'Baltic GPS Interference', lat: 59.5, lon: 24.0, radius: 80, severity: 'high' },
      { name: 'Eastern Med Jamming', lat: 34.0, lon: 33.0, radius: 60, severity: 'medium' },
      { name: 'Black Sea Interference', lat: 44.0, lon: 35.0, radius: 50, severity: 'high' },
      { name: 'Middle East GPS Anomaly', lat: 30.0, lon: 48.0, radius: 70, severity: 'medium' },
      { name: 'South China Sea Jamming', lat: 15.0, lon: 115.0, radius: 90, severity: 'low' },
    ];

    // Simulated weather alerts
    const weatherAlerts = [
      { name: 'Hurricane Warning - Atlantic', lat: 25.0, lon: -70.0, severity: 'extreme' },
      { name: 'Typhoon Watch - W. Pacific', lat: 18.0, lon: 135.0, severity: 'severe' },
      { name: 'Cyclone Alert - Indian Ocean', lat: -15.0, lon: 80.0, severity: 'moderate' },
      { name: 'Arctic Storm - N. Atlantic', lat: 60.0, lon: -30.0, severity: 'moderate' },
      { name: 'Heat Dome - Mediterranean', lat: 38.0, lon: 25.0, severity: 'severe' },
      { name: 'Monsoon Alert - Bay of Bengal', lat: 16.0, lon: 88.0, severity: 'extreme' },
    ];

    // Simulated natural disasters
    const naturalDisasters = [
      { name: 'Earthquake M6.2 - Japan', lat: 36.5, lon: 140.5, type: 'earthquake' },
      { name: 'Volcanic Activity - Iceland', lat: 63.9, lon: -22.4, type: 'volcano' },
      { name: 'Flash Floods - Pakistan', lat: 28.0, lon: 68.0, type: 'flood' },
      { name: 'Landslide - Indonesia', lat: -7.5, lon: 110.4, type: 'landslide' },
      { name: 'Tsunami Watch - Pacific', lat: 10.0, lon: 140.0, type: 'tsunami' },
    ];

    // Simulated wildfires
    const wildfires = [
      { name: 'California Wildfire Complex', lat: 37.5, lon: -120.0, intensity: 'high' },
      { name: 'Canadian Boreal Fires', lat: 55.0, lon: -110.0, intensity: 'extreme' },
      { name: 'Australian Bushfire', lat: -33.0, lon: 148.0, intensity: 'medium' },
      { name: 'Siberian Wildfires', lat: 60.0, lon: 100.0, intensity: 'high' },
      { name: 'Amazon Rainforest Fires', lat: -5.0, lon: -60.0, intensity: 'medium' },
      { name: 'Mediterranean Fires', lat: 38.0, lon: 24.0, intensity: 'high' },
    ];

    // Simulated data centers
    const datacenters = [
      { name: 'AWS us-east-1', lat: 39.0, lon: -77.5, type: 'cloud' },
      { name: 'Azure West Europe', lat: 52.4, lon: 4.7, type: 'cloud' },
      { name: 'GCP asia-southeast1', lat: 1.3, lon: 103.8, type: 'cloud' },
      { name: 'Equinix Frankfurt', lat: 50.1, lon: 8.7, type: 'colocation' },
      { name: 'Digital Realty Tokyo', lat: 35.7, lon: 139.7, type: 'colocation' },
      { name: 'Alibaba Hangzhou', lat: 30.3, lon: 120.2, type: 'cloud' },
      { name: 'Reliance Jio Mumbai', lat: 19.1, lon: 72.9, type: 'cloud' },
    ];

    // Simulated power plants
    const powerPlants = [
      { name: 'Jaitapur Nuclear', lat: 16.6, lon: 73.3, type: 'nuclear' },
      { name: 'Kudankulam Nuclear', lat: 8.2, lon: 77.7, type: 'nuclear' },
      { name: 'Mundra Solar Park', lat: 23.3, lon: 69.6, type: 'solar' },
      { name: 'Bhadla Solar Park', lat: 27.5, lon: 71.9, type: 'solar' },
      { name: 'Mukundapur Wind Farm', lat: 17.5, lon: 74.0, type: 'wind' },
      { name: 'Raichur Thermal', lat: 16.2, lon: 77.4, type: 'thermal' },
    ];

    // Simulated UCDP events
    const ucdpEvents = [
      { name: 'Battle - Marib, Yemen', lat: 15.4, lon: 45.3, type: 'battle' },
      { name: 'Air strike - Idlib, Syria', lat: 35.9, lon: 36.6, type: 'airstrike' },
      { name: 'Shelling - Donetsk, Ukraine', lat: 48.0, lon: 37.8, type: 'shelling' },
      { name: 'IED - Lake Chad Basin', lat: 12.5, lon: 14.5, type: 'ied' },
      { name: 'Clash - Manipur, India', lat: 24.8, lon: 93.9, type: 'clash' },
      { name: 'Ambush - Cabo Delgado, Mozambique', lat: -12.0, lon: 40.5, type: 'ambush' },
    ];

    // Simulated sanctions zones
    const sanctionsZones = [
      { name: 'Russia - Full Sanctions', lat: 55.75, lon: 37.62, level: 'full' },
      { name: 'Iran - Oil Sanctions', lat: 32.4, lon: 53.7, level: 'full' },
      { name: 'North Korea - Embargo', lat: 39.0, lon: 125.7, level: 'full' },
      { name: 'Syria - Trade Restrictions', lat: 33.5, lon: 36.3, level: 'partial' },
      { name: 'Venezuela - Oil Sanctions', lat: 10.5, lon: -66.9, level: 'partial' },
      { name: 'Myanmar - Arms Embargo', lat: 19.8, lon: 96.2, level: 'partial' },
    ];

    // Strategic waterways
    const waterways = STRATEGIC_WATERWAYS.map((w: any) => ({ name: w.label ?? w.name, lat: w.lat, lon: w.lon }));

    this.geoData = {
      'conflict-zones': CONFLICT_ZONES.map(z => ({ name: z.name, lat: z.center[1], lon: z.center[0], coords: z.coords })),
      'intel-hotspots': INTEL_HOTSPOTS.map((h: any) => ({ name: h.label ?? h.name, lat: h.lat, lon: h.lon, risk: h.risk })),
      'chokepoints': STRATEGIC_WATERWAYS.map((w: any) => ({ name: w.label ?? w.name, lat: w.lat, lon: w.lon })),
      'military-bases': MILITARY_BASES.slice(0, 50).map((b: any) => ({ name: b.label ?? b.name, lat: b.lat, lon: b.lon, type: b.type })),
      'nuclear': NUCLEAR_FACILITIES.filter((_, i) => i % 3 === 0).slice(0, 40).map((n: any) => ({ name: n.label ?? n.name, lat: n.lat, lon: n.lon, type: n.type })),
      'cables': UNDERSEA_CABLES.map(c => ({ name: c.id ?? c.name, points: c.points })),
      'pipelines': PIPELINES.map(p => ({ name: p.id ?? p.name, type: p.type, points: p.points })),
      'ports': PORTS.slice(0, 40).map((p: any) => ({ name: p.label ?? p.name, lat: p.lat, lon: p.lon, type: p.type })),
      'economic': ECONOMIC_CENTERS.slice(0, 30).map((e: any) => ({ name: e.label ?? e.name, lat: e.lat, lon: e.lon, type: e.type })),
      'spaceports': SPACEPORTS.map((s: any) => ({ name: s.label ?? s.name, lat: s.lat, lon: s.lon })),
      'minerals': CRITICAL_MINERALS.map((m: any) => ({ name: m.label ?? m.name, lat: m.lat, lon: m.lon, mineral: m.mineral })),
      'irradiators': GAMMA_IRRADIATORS.filter((_, i) => i % 5 === 0).slice(0, 30).map((g: any) => ({ name: g.label ?? g.name, lat: g.lat, lon: g.lon })),
      'startups': STARTUP_HUBS.map((h: any) => ({ name: h.label ?? h.name, lat: h.lat, lon: h.lon, tier: h.tier })),
      'exchanges': STOCK_EXCHANGES.slice(0, 20).map((e: any) => ({ name: e.label ?? e.name, lat: e.lat, lon: e.lon })),
      'trade-routes': routeLines,
      'ais-shipping': aisDots,
      'military-vessels': milVessels,
      'waterways': waterways,
      'protests': protestEvents,
      'gps-jamming': gpsJamming,
      'weather': weatherAlerts,
      'natural-disasters': naturalDisasters,
      'wildfires': wildfires,
      'datacenters': datacenters,
      'power-plants': powerPlants,
      'ucdp-events': ucdpEvents,
      'sanctions': sanctionsZones,
    };
  }

  private renderShell(): void {
    // The dashboard makes whole panels draggable for reordering. The map needs
    // pointer drags for pan/rotate, so opt its complete surface out of that
    // outer drag handler.
    this.container.setAttribute('data-no-drag', '');
    this.container.style.padding = '0';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.innerHTML = `
      <div class="absolute inset-0 overflow-hidden bg-black">
        <div id="map-container-flat" class="w-full h-full"></div>
        <div id="map-container-globe" class="w-full h-full hidden"></div>
        <div class="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          <div id="mode-switcher" class="flex rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 overflow-hidden">
            <button data-mode="flat" class="mode-btn px-2 py-1.5 text-[10px] font-data-md text-primary bg-primary/10 transition-all" title="2D Map">
              <span class="material-symbols-outlined text-sm align-middle">map</span>
            </button>
            <button data-mode="globe" class="mode-btn px-2 py-1.5 text-[10px] font-data-md text-on-surface-variant hover:bg-white/10 transition-all" title="3D Globe">
              <span class="material-symbols-outlined text-sm align-middle">public</span>
            </button>
          </div>
          <button id="layer-toggle-btn" class="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-on-surface-variant hover:bg-white/10 transition-all" title="Toggle layers">
            <span class="material-symbols-outlined text-sm">layers</span>
          </button>
        </div>
        <div id="layer-panel" class="absolute top-14 right-3 z-20 w-72 rounded-xl bg-[#0a1a2e]/95 backdrop-blur-md border border-white/10 shadow-xl hidden overflow-hidden">
          <div class="px-3 py-2 border-b border-white/10 flex items-center justify-between">
            <span class="text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider">Layers</span>
            <div class="flex items-center gap-2">
              <button id="layer-select-all" class="text-[10px] text-primary hover:text-primary/80 font-data-md">All</button>
              <button id="layer-select-none" class="text-[10px] text-on-surface-variant hover:text-primary font-data-md">None</button>
            </div>
          </div>
          <div class="px-3 py-1.5 border-b border-white/5">
            <input id="layer-search" type="text" placeholder="Search layers..." class="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-[10px] text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div id="layer-list" class="max-h-[400px] overflow-y-auto p-1.5"></div>
          <div id="layer-explanation" class="hidden px-3 py-2 border-t border-white/5 max-h-[200px] overflow-y-auto"></div>
        </div>
        <div id="hormuz-widget" class="absolute bottom-[140px] left-3 z-20 w-64 rounded-xl bg-[#0a1a2e]/95 backdrop-blur-md border border-white/10 shadow-xl p-3">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-emerald-400">water</span>
              <span class="text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider">Hormuz Risk</span>
            </div>
            <span id="hormuz-status" class="text-[10px] font-data-md text-primary">LIVE</span>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span id="hormuz-score" class="text-3xl font-data-lg text-emerald-400">--</span>
            <div class="text-right">
              <div id="hormuz-level" class="text-[10px] font-label-caps text-on-surface-variant">LOADING</div>
              <div id="hormuz-trend" class="text-[10px] font-data-md text-on-surface-variant/60"></div>
            </div>
          </div>
          <div class="w-full bg-white/10 rounded-full h-1.5 mb-2">
            <div id="hormuz-bar" class="h-1.5 rounded-full bg-emerald-400 transition-all duration-1000" style="width: 0%"></div>
          </div>
          <div id="hormuz-details" class="text-[9px] font-data-md text-on-surface-variant/60"></div>
        </div>
      </div>
    `;
  }

  private mapResizeObserver: ResizeObserver | null = null;

  private async initFlatMap(): Promise<void> {
    const provider = getMapProvider();
    const theme = getMapTheme(provider);
    const style = await getStyleForProvider(provider, theme);
    const el = this.container.querySelector('#map-container-flat') as HTMLElement;
    if (!el) return;

    this.map = new maplibregl.Map({
      container: el,
      style: style as any,
      center: [0, 20],
      zoom: 1.2,
      minZoom: 0,
      maxZoom: 18,
      pitch: 0,
      renderWorldCopies: false,
      attributionControl: false,
    });

    this.map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'bottom-left');
    this.map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-right');

    this.popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, className: 'map-popup', maxWidth: '280px' });

    this.map.on('load', () => {
      this.addFlatSources();
      this.addFlatLayers();
      this.bindMapClickHandlers();
      this.renderLayerList();
      this.updateHormuzWidget();
      setInterval(() => this.updateHormuzWidget(), 300000);
      requestAnimationFrame(() => this.map?.resize());
      // Animate trade route dashes
      let dashStep = 0;
      const animateDashes = () => {
        dashStep = (dashStep + 1) % 60;
        if (this.map?.getLayer('trade-routes-dash')) {
          this.map.setPaintProperty('trade-routes-dash', 'line-dasharray', [0, 4 + (dashStep % 3), 3]);
        }
        requestAnimationFrame(animateDashes);
      };
      requestAnimationFrame(animateDashes);
      this.startCargoAnimation();
    });

    // At the edge of the 2D world's useful zoom range, transition into the
    // globe instead of leaving the user on an increasingly empty flat canvas.
    this.map.on('zoomend', () => {
      if (this.mode !== 'flat' || this.autoGlobeSwitching || (this.map?.getZoom() ?? 1) > 0.85) return;
      this.autoGlobeSwitching = true;
      void this.switchMode('globe').finally(() => { this.autoGlobeSwitching = false; });
    });

    this.mapResizeObserver?.disconnect();
    this.mapResizeObserver = new ResizeObserver(() => this.map?.resize());
    this.mapResizeObserver.observe(el);
  }

  private addFlatSources(): void {
    if (!this.map) return;

    const conflictFeatures = (this.geoData['conflict-zones'] || []).map(z => ({
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [z.coords] },
      properties: { id: z.name, name: z.name },
    }));
    this.map.addSource('conflict-zones', { type: 'geojson', data: { type: 'FeatureCollection', features: conflictFeatures } });

    // Trade routes as line sources
    const tradeRouteFeatures: any[] = [];
    for (const r of this.geoData['trade-routes'] || []) {
      const segs = interpolateLineViaGreatCircle(r.points, 12);
      for (const seg of segs) {
        tradeRouteFeatures.push({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: seg },
          properties: { name: r.name, category: r.category, status: r.status },
        });
      }
    }
    this.map.addSource('trade-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: tradeRouteFeatures } });
    this.map.addSource('cargo-vessels', { type: 'geojson', data: this.getCargoFeatureCollection(Date.now()) });

    // GPS jamming zones as polygon circles
    const gpsJamFeatures = (this.geoData['gps-jamming'] || []).map((j: any) => {
      const center: [number, number] = [j.lon, j.lat];
      const radiusKm = j.radius || 50;
      const coords: [number, number][] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * 2 * Math.PI;
        const dx = radiusKm * Math.cos(angle) / 111.32;
        const dy = radiusKm * Math.sin(angle) / 111.32;
        coords.push([center[0] + dx, center[1] + dy]);
      }
      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [coords] },
        properties: { name: j.name, severity: j.severity },
      };
    });
    this.map.addSource('gps-jamming', { type: 'geojson', data: { type: 'FeatureCollection', features: gpsJamFeatures } });

    for (const [key, data] of Object.entries(this.geoData)) {
      if (['conflict-zones', 'cables', 'pipelines', 'trade-routes', 'gps-jamming'].includes(key)) continue;
      const pointData = Array.isArray(data) ? data.filter((d: any) => d.lat != null && d.lon != null) : [];
      if (pointData.length === 0) continue;
      this.map.addSource(key, {
        type: 'geojson',
        data: this.toPointGeoJSON(pointData),
      });
    }

    const cableFeatures: any[] = [];
    for (const c of this.geoData['cables'] || []) {
      const segs = interpolateLineViaGreatCircle(c.points, 12);
      for (const seg of segs) {
        cableFeatures.push({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: seg },
          properties: { name: c.name },
        });
      }
    }
    this.map.addSource('cables', { type: 'geojson', data: { type: 'FeatureCollection', features: cableFeatures } });

    const pipelineFeatures: any[] = [];
    for (const p of this.geoData['pipelines'] || []) {
      const segs = interpolateLineViaGreatCircle(p.points, 12);
      for (const seg of segs) {
        pipelineFeatures.push({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: seg },
          properties: { name: p.name, type: p.type },
        });
      }
    }
    this.map.addSource('pipelines', { type: 'geojson', data: { type: 'FeatureCollection', features: pipelineFeatures } });
  }

  private addFlatLayers(): void {
    if (!this.map) return;

    // Conflict zones
    this.map.addLayer({ id: 'conflict-zones-fill', type: 'fill', source: 'conflict-zones', paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.12 } });
    this.map.addLayer({ id: 'conflict-zones-border', type: 'line', source: 'conflict-zones', paint: { 'line-color': '#ef4444', 'line-width': 1.5, 'line-opacity': 0.6 } });

    // GPS jamming zones
    this.map.addLayer({ id: 'gps-jamming-fill', type: 'fill', source: 'gps-jamming', paint: { 'fill-color': '#f472b6', 'fill-opacity': 0.08 } });
    this.map.addLayer({ id: 'gps-jamming-border', type: 'line', source: 'gps-jamming', paint: { 'line-color': '#f472b6', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [3, 2] } });

    // Trade routes - animated dashes
    this.map.addLayer({ id: 'trade-routes-line', type: 'line', source: 'trade-routes', paint: { 'line-color': '#22d3ee', 'line-width': 2, 'line-opacity': 0.6 } });
    this.map.addLayer({ id: 'trade-routes-dash', type: 'line', source: 'trade-routes', paint: { 'line-color': '#67e8f9', 'line-width': 1, 'line-opacity': 0.8, 'line-dasharray': [0, 4, 3] } });
    this.map.addLayer({ id: 'cargo-vessels-glow', type: 'circle', source: 'cargo-vessels', paint: { 'circle-radius': 8, 'circle-color': '#38bdf8', 'circle-opacity': 0.18 } });
    this.map.addLayer({ id: 'cargo-vessels', type: 'circle', source: 'cargo-vessels', paint: { 'circle-radius': 3.5, 'circle-color': '#e0f2fe', 'circle-stroke-color': '#38bdf8', 'circle-stroke-width': 1.5 } });

    // Point layers
    const circleConfigs: Record<string, { color: string; radius: number; glow?: boolean }> = {
      'intel-hotspots': { color: '#f97316', radius: 6, glow: true },
      'chokepoints': { color: '#6bfb9a', radius: 8, glow: true },
      'military-bases': { color: '#3b82f6', radius: 4 },
      'nuclear': { color: '#a855f7', radius: 4 },
      'ports': { color: '#14b8a6', radius: 4 },
      'economic': { color: '#eab308', radius: 4 },
      'spaceports': { color: '#8b5cf6', radius: 5 },
      'minerals': { color: '#ec4899', radius: 5 },
      'irradiators': { color: '#f43f5e', radius: 3 },
      'startups': { color: '#22d3ee', radius: 5 },
      'exchanges': { color: '#facc15', radius: 5 },
      'ais-shipping': { color: '#38bdf8', radius: 3 },
      'military-vessels': { color: '#818cf8', radius: 5 },
      'waterways': { color: '#2dd4bf', radius: 6, glow: true },
      'protests': { color: '#f59e0b', radius: 4 },
      'weather': { color: '#38bdf8', radius: 5, glow: true },
      'natural-disasters': { color: '#ef4444', radius: 6, glow: true },
      'wildfires': { color: '#f97316', radius: 5, glow: true },
      'datacenters': { color: '#8b5cf6', radius: 3 },
      'power-plants': { color: '#eab308', radius: 4 },
      'ucdp-events': { color: '#dc2626', radius: 4, glow: true },
      'sanctions': { color: '#94a3b8', radius: 5 },
    };

    for (const [id, cfg] of Object.entries(circleConfigs)) {
      if (this.map.getSource(id)) {
        if (cfg.glow) {
          this.map.addLayer({ id: `${id}-glow`, type: 'circle', source: id, paint: { 'circle-radius': cfg.radius * 2.5, 'circle-color': cfg.color, 'circle-opacity': 0.12 } });
        }
        this.map.addLayer({
          id, type: 'circle', source: id,
          paint: { 'circle-radius': cfg.radius, 'circle-color': cfg.color, 'circle-stroke-color': '#fff', 'circle-stroke-width': 0.8, 'circle-opacity': 0.9 },
        });
      }
    }

    // Cables and pipelines
    this.map.addLayer({ id: 'cables', type: 'line', source: 'cables', paint: { 'line-color': '#06b6d4', 'line-width': 1.5, 'line-opacity': 0.5 } });
    this.map.addLayer({ id: 'pipelines', type: 'line', source: 'pipelines', paint: { 'line-color': '#f59e0b', 'line-width': 1.5, 'line-opacity': 0.5 } });

    // Labels
    const labelFeatures = [
      ...(this.geoData['chokepoints'] || []),
      ...(this.geoData['waterways'] || []),
      ...(this.geoData['conflict-zones'] || []).map(z => ({ name: z.name, lat: z.lat, lon: z.lon })),
    ];
    this.map.addSource('map-labels', { type: 'geojson', data: this.toPointGeoJSON(labelFeatures) });
    this.map.addLayer({
      id: 'map-labels', type: 'symbol', source: 'map-labels',
      layout: { 'text-field': ['get', 'name'], 'text-size': 9, 'text-offset': [0, 1.2], 'text-anchor': 'top' },
      paint: { 'text-color': '#cbd5e1', 'text-halo-color': '#000', 'text-halo-width': 1.5 },
    });
  }

  private async switchMode(newMode: MapMode): Promise<void> {
    if (newMode === this.mode) return;

    const flatEl = this.container.querySelector('#map-container-flat') as HTMLElement;
    const globeEl = this.container.querySelector('#map-container-globe') as HTMLElement;

    if (newMode === 'flat') {
      flatEl.classList.remove('hidden');
      globeEl.classList.add('hidden');
      if (!this.map) await this.initFlatMap();
      if (this.map) {
        this.map.setProjection({ type: 'mercator' });
        this.map.resize();
        this.map.easeTo({ center: [0, 20], zoom: 1.2, pitch: 0, bearing: 0, duration: 800 });
      }
    } else if (newMode === 'globe') {
      flatEl.classList.remove('hidden');
      globeEl.classList.add('hidden');
      this.popup?.remove();
      if (!this.map) await this.initFlatMap();
      if (this.map) {
        this.map.setProjection({ type: 'globe' });
        this.map.resize();
        this.map.easeTo({ center: [0, 0], zoom: 0, pitch: 0, bearing: 0, duration: 900 });
      }
    }

    this.mode = newMode;
    this.updateModeButtons();
    try { localStorage.setItem('orion-map-mode', JSON.stringify(newMode)); } catch {}
  }


  private getCargoFeatureCollection(nowMs: number): any {
    const routes = (this.geoData['trade-routes'] || []).filter((route: any) => route.points?.length >= 2);
    const features = routes.slice(0, 14).map((route: any, index: number) => {
      const progress = ((nowMs / 180_000) + index * 0.137) % 1;
      const point = this.getRoutePosition(route.points, progress);
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: point },
        properties: { name: `${route.name} cargo`, category: route.category },
      };
    });
    return { type: 'FeatureCollection', features };
  }

  private getRoutePosition(points: [number, number][], progress: number): [number, number] {
    const lengths: number[] = [];
    let total = 0;
    for (let index = 1; index < points.length; index++) {
      const [fromLon, fromLat] = points[index - 1]!;
      const [toLon, toLat] = points[index]!;
      const dx = Math.min(Math.abs(toLon - fromLon), 360 - Math.abs(toLon - fromLon));
      const length = Math.hypot(dx, toLat - fromLat);
      lengths.push(length);
      total += length;
    }
    let remaining = progress * total;
    for (let index = 1; index < points.length; index++) {
      const segmentLength = lengths[index - 1]!;
      if (remaining > segmentLength) { remaining -= segmentLength; continue; }
      const [fromLon, fromLat] = points[index - 1]!;
      const [rawToLon, toLat] = points[index]!;
      const toLon = Math.abs(rawToLon - fromLon) > 180
        ? rawToLon + (rawToLon < fromLon ? 360 : -360)
        : rawToLon;
      const ratio = segmentLength ? remaining / segmentLength : 0;
      const lon = ((fromLon + (toLon - fromLon) * ratio + 540) % 360) - 180;
      return [lon, fromLat + (toLat - fromLat) * ratio];
    }
    return points[points.length - 1]!;
  }

  private startCargoAnimation(): void {
    if (this.cargoAnimationFrame !== null) return;
    const animate = (nowMs: number) => {
      if (nowMs - this.lastCargoUpdateAt >= 120) {
        const source = this.map?.getSource('cargo-vessels') as maplibregl.GeoJSONSource | undefined;
        source?.setData(this.getCargoFeatureCollection(nowMs));
        this.lastCargoUpdateAt = nowMs;
      }
      this.cargoAnimationFrame = requestAnimationFrame(animate);
    };
    this.cargoAnimationFrame = requestAnimationFrame(animate);
  }


  private updateModeButtons(): void {
    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-mode') === this.mode;
      btn.classList.toggle('text-primary', isActive);
      btn.classList.toggle('bg-primary/10', isActive);
      btn.classList.toggle('text-on-surface-variant', !isActive);
    });
  }

  private renderLayerList(filter = ''): void {
    const list = this.container.querySelector('#layer-list');
    if (!list) return;

    const filterLower = filter.toLowerCase();
    const categories = [
      { id: 'conflicts', label: CATEGORY_LABELS['conflicts'] },
      { id: 'maritime', label: CATEGORY_LABELS['maritime'] },
      { id: 'infrastructure', label: CATEGORY_LABELS['infrastructure'] },
      { id: 'economic', label: CATEGORY_LABELS['economic'] },
      { id: 'environment', label: CATEGORY_LABELS['environment'] },
    ];

    let html = '';
    for (const cat of categories) {
      const catLayers = LAYERS.filter(l => l.category === cat.id && (!filterLower || l.label.toLowerCase().includes(filterLower) || l.id.toLowerCase().includes(filterLower)));
      if (catLayers.length === 0) continue;
      const allActive = catLayers.every(l => this.activeLayers.has(l.id));
      html += `
        <div class="mb-2">
          <button data-cat-toggle="${cat.id}" class="w-full flex items-center justify-between px-2 py-1 text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider hover:text-primary transition-colors">
            <span>${cat.label}</span>
            <span class="text-[9px] font-data-md ${allActive ? 'text-primary' : 'text-on-surface-variant/40'}">${catLayers.filter(l => this.activeLayers.has(l.id)).length}/${catLayers.length}</span>
          </button>
          <div class="flex flex-col gap-0.5">
      `;
      for (const l of catLayers) {
        const active = this.activeLayers.has(l.id);
        const hasExplanation = LAYER_EXPLANATIONS[l.id as keyof typeof LAYER_EXPLANATIONS];
        html += `
          <button data-layer="${l.id}" class="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-all hover:bg-white/5 group ${active ? '' : 'opacity-35'}">
            <span class="material-symbols-outlined text-[12px]" style="color:${l.color}">${l.icon}</span>
            <span class="text-[10px] text-on-surface font-body-sm flex-grow">${l.label}</span>
            ${hasExplanation ? `<button data-layer-info="${l.id}" class="opacity-0 group-hover:opacity-100 transition-opacity material-symbols-outlined text-[10px] text-on-surface-variant/60 hover:text-primary" title="Layer info">info</button>` : ''}
            <span class="w-2.5 h-2.5 rounded-sm border border-white/20 flex items-center justify-center ${active ? 'bg-primary/20 border-primary/40' : ''}">
              ${active ? '<span class="w-1.5 h-1.5 rounded-[2px] bg-primary"></span>' : ''}
            </span>
          </button>
        `;
      }
      html += `</div></div>`;
    }
    list.innerHTML = html;
  }

  private bindEvents(): void {
    // Layer search
    const searchInput = this.container.querySelector('#layer-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.renderLayerList(searchInput.value);
      });
    }

    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      // Mode switcher
      const modeBtn = target.closest('[data-mode]') as HTMLElement;
      if (modeBtn) {
        await this.switchMode(modeBtn.getAttribute('data-mode') as MapMode);
        return;
      }

      // Layer toggle
      const toggleBtn = target.closest('#layer-toggle-btn');
      if (toggleBtn) {
        this.layerPanelOpen = !this.layerPanelOpen;
        this.container.querySelector('#layer-panel')?.classList.toggle('hidden', !this.layerPanelOpen);
        return;
      }

      // Select all
      if (target.closest('#layer-select-all')) {
        LAYERS.forEach(l => this.activeLayers.add(l.id));
        this.syncLayerVisibility();
        this.renderLayerList(searchInput?.value);
        return;
      }

      // Select none
      if (target.closest('#layer-select-none')) {
        this.activeLayers.clear();
        this.syncLayerVisibility();
        this.renderLayerList(searchInput?.value);
        return;
      }

      // Layer info button
      const infoBtn = target.closest('[data-layer-info]') as HTMLElement;
      if (infoBtn) {
        e.stopPropagation();
        const layerKey = infoBtn.getAttribute('data-layer-info')!;
        const explanation = LAYER_EXPLANATIONS[layerKey as keyof typeof LAYER_EXPLANATIONS];
        if (explanation) {
          const layerDef = LAYERS.find(l => l.id === layerKey);
          const cardEl = this.container.querySelector('#layer-explanation');
          if (cardEl) {
            cardEl.innerHTML = renderLayerExplanationCard(layerDef?.label || layerKey, explanation);
            cardEl.classList.remove('hidden');
            cardEl.querySelector('.layer-explanation-close')?.addEventListener('click', () => {
              cardEl.classList.add('hidden');
            });
          }
        }
        return;
      }

      // Category toggle
      const catToggle = target.closest('[data-cat-toggle]') as HTMLElement;
      if (catToggle) {
        const catId = catToggle.getAttribute('data-cat-toggle')!;
        const catLayers = LAYERS.filter(l => l.category === catId);
        const allActive = catLayers.every(l => this.activeLayers.has(l.id));
        if (allActive) {
          catLayers.forEach(l => this.activeLayers.delete(l.id));
        } else {
          catLayers.forEach(l => this.activeLayers.add(l.id));
        }
        if (this.activeLayers.size > LAYER_WARNING_THRESHOLD) {
          showLayerWarning(LAYER_WARNING_THRESHOLD);
        }
        this.syncLayerVisibility();
        this.renderLayerList(searchInput?.value);
        return;
      }

      // Layer toggle
      const layerBtn = target.closest('[data-layer]') as HTMLElement;
      if (layerBtn) {
        const id = layerBtn.getAttribute('data-layer')!;
        this.activeLayers.has(id) ? this.activeLayers.delete(id) : this.activeLayers.add(id);
        if (this.activeLayers.size > LAYER_WARNING_THRESHOLD) {
          showLayerWarning(LAYER_WARNING_THRESHOLD);
        }
        this.syncLayerVisibility();
        this.renderLayerList(searchInput?.value);
        return;
      }

      // Country brief open from popup
      const countryOpenBtn = target.closest('[data-country-open]') as HTMLElement;
      if (countryOpenBtn) {
        const code = countryOpenBtn.getAttribute('data-country-open')!;
        this.openCountryBrief(code);
        return;
      }
    });
  }

  private bindMapClickHandlers(): void {
    if (!this.map) return;

    const nonClickable = new Set(['cables', 'pipelines', 'conflicts', 'gpsJamming', 'tradeRoutes']);
    const clickableMapIds: string[] = [];
    for (const l of LAYERS) {
      if (nonClickable.has(l.id)) continue;
      const mapIds = LAYER_KEY_TO_MAP_IDS[l.id] || [l.id];
      for (const mapId of mapIds) {
        if (!this.map.getLayer(mapId)) continue;
        clickableMapIds.push(mapId);
        this.map.on('mouseenter', mapId, () => { this.map!.getCanvas().style.cursor = 'pointer'; });
        this.map.on('mouseleave', mapId, () => { this.map!.getCanvas().style.cursor = ''; });
        this.map.on('click', mapId, (e) => {
          e.originalEvent.stopPropagation();
          const f = e.features?.[0];
          if (!f?.properties) return;
          const p = f.properties;
          const name = String(p.name || p.Name || '');
          const type = String(p.type || p.Type || '');
          const detail = String(p.severity || p.risk || p.mineral || p.tier || p.level || '');
          this.popup?.setLngLat(e.lngLat)
            .setHTML(`<div style="padding:8px;font-size:12px;color:#e2e8f0;font-family:inherit;"><b style="color:#f1f5f9;">${name}</b>${type ? `<br/><span style="color:#94a3b8;">${type}</span>` : ''}${detail ? `<br/><span style="color:#6bfb9a;font-size:10px;">${detail}</span>` : ''}</div>`)
            .addTo(this.map!);
        });
      }
    }

    this.map.on('click', 'conflict-zones-fill', (e) => {
      e.originalEvent.stopPropagation();
      const f = e.features?.[0];
      if (!f?.properties) return;
      const name = String(f.properties.name || f.properties.Name || 'Unknown Zone');
      this.popup?.setLngLat(e.lngLat)
        .setHTML(`<div style="padding:8px;font-size:12px;color:#e2e8f0;font-family:inherit;"><b style="color:#f1f5f9;">${name}</b><br/><span style="color:#ef4444;font-weight:600;">Active Conflict Zone</span></div>`)
        .addTo(this.map!);
    });
    this.map.on('mouseenter', 'conflict-zones-fill', () => { this.map!.getCanvas().style.cursor = 'pointer'; });
    this.map.on('mouseleave', 'conflict-zones-fill', () => { this.map!.getCanvas().style.cursor = ''; });

    this.map.on('click', (e) => {
      const features = this.map!.queryRenderedFeatures(e.point, { layers: clickableMapIds.concat(['conflict-zones-fill']) });
      if (features && features.length > 0) return;
      const hit = getCountryAtCoordinates(e.lngLat.lat, e.lngLat.lng);
      if (!hit) return;
      this.popup?.setLngLat(e.lngLat)
        .setHTML(`<div style="padding:10px;font-size:12px;color:#e2e8f0;font-family:inherit;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:16px;">${String.fromCodePoint(...[...hit.code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))}</span>
            <b style="color:#f1f5f9;">${hit.name}</b>
          </div>
          <div style="color:#94a3b8;">ISO: ${hit.code.toUpperCase()}</div>
          <div style="margin-top:6px;color:#6bfb9a;cursor:pointer;text-decoration:underline;" data-country-open="${hit.code}">Open Country Brief →</div>
        </div>`)
        .addTo(this.map!);
    });
  }

  private syncLayerVisibility(): void {
    if (!this.map) return;
    for (const l of LAYERS) {
      const vis = this.activeLayers.has(l.id) ? 'visible' : 'none';
      const mapIds = LAYER_KEY_TO_MAP_IDS[l.id] || [l.id];
      for (const mapId of mapIds) {
        if (this.map.getLayer(mapId)) this.map.setLayoutProperty(mapId, 'visibility', vis);
      }
    }
    if (this.map.getLayer('map-labels')) this.map.setLayoutProperty('map-labels', 'visibility', 'visible');
  }

  private toPointGeoJSON(features: { name: string; lat: number; lon: number; [k: string]: any }[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: features.map(f => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lon, f.lat] },
        properties: { name: f.name, ...Object.fromEntries(Object.entries(f).filter(([k]) => !['name', 'lat', 'lon'].includes(k))) },
      })),
    };
  }

  private openCountryBrief(code: string): void {
    window.dispatchEvent(new CustomEvent('orion:open-country-brief', { detail: { code } }));
  }

  private async updateHormuzWidget(): Promise<void> {
    try {
      const energyData = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
      const inventories = getHydratedData('crudeInventories') as { weeks?: Array<{ period: string; stocksMb: number }> } | undefined;

      let riskScore = 65;
      let details = 'Baseline monitoring';

      if (energyData?.prices) {
        const brent = energyData.prices.find(p => p.commodity === 'RBRTE');
        const wti = energyData.prices.find(p => p.commodity === 'RWTC');
        if (brent) {
          const brentVal = Number(brent.price);
          if (brentVal > 90) riskScore += 15;
          else if (brentVal > 85) riskScore += 8;
          else if (brentVal < 75) riskScore -= 10;
          details = `Brent: $${brentVal.toFixed(2)}`;
        }
        if (brent && wti) {
          const spread = Number(brent.price) - Number(wti.price);
          if (spread > 8) riskScore += 10;
          details += ` | Spread: $${spread.toFixed(2)}`;
        }
      }

      if (inventories?.weeks?.[0]) {
        const sprVal = inventories.weeks[0].stocksMb;
        details += ` | Stocks: ${sprVal.toFixed(0)}M bbl`;
      }

      riskScore = Math.max(0, Math.min(100, riskScore));

      const scoreEl = document.getElementById('hormuz-score');
      const barEl = document.getElementById('hormuz-bar');
      const levelEl = document.getElementById('hormuz-level');
      const detailsEl = document.getElementById('hormuz-details');

      if (scoreEl) scoreEl.textContent = String(riskScore);
      if (barEl) barEl.style.width = `${riskScore}%`;
      if (levelEl) {
        if (riskScore >= 80) { levelEl.textContent = 'CRITICAL'; levelEl.className = 'text-[10px] font-label-caps text-red-400'; }
        else if (riskScore >= 60) { levelEl.textContent = 'ELEVATED'; levelEl.className = 'text-[10px] font-label-caps text-orange-400'; }
        else if (riskScore >= 40) { levelEl.textContent = 'MODERATE'; levelEl.className = 'text-[10px] font-label-caps text-yellow-400'; }
        else { levelEl.textContent = 'LOW'; levelEl.className = 'text-[10px] font-label-caps text-emerald-400'; }
      }
      if (detailsEl) detailsEl.textContent = details;

      if (barEl) {
        if (riskScore >= 80) barEl.className = 'h-1.5 rounded-full bg-red-400 transition-all duration-1000';
        else if (riskScore >= 60) barEl.className = 'h-1.5 rounded-full bg-orange-400 transition-all duration-1000';
        else if (riskScore >= 40) barEl.className = 'h-1.5 rounded-full bg-yellow-400 transition-all duration-1000';
        else barEl.className = 'h-1.5 rounded-full bg-emerald-400 transition-all duration-1000';
      }
    } catch {
      const scoreEl = document.getElementById('hormuz-score');
      if (scoreEl) scoreEl.textContent = '--';
    }
  }

  destroy(): void {
    this.mapResizeObserver?.disconnect();
    if (this.cargoAnimationFrame !== null) cancelAnimationFrame(this.cargoAnimationFrame);
    this.popup?.remove();
    if (this.mode === 'globe' && this.globe) this.globe._destructor?.();
    this.map?.remove();
    this.container.innerHTML = '';
  }
}
