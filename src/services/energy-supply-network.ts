import {
  ENERGY_NETWORK_NODES,
  ENERGY_SUPPLY_NETWORK_SOURCE,
  ENERGY_SUPPLY_ROUTES,
  IMPORTER_COUNTRY_CONFIG,
  type EnergyNetworkNode,
  type EnergySupplyRoute,
} from '@/config/energy-supply-network';
import type { GetChokepointStatusResponse } from '@/services/supply-chain';

export interface EnergySupplyRouteAssessment extends EnergySupplyRoute {
  supplier: EnergyNetworkNode;
  importer: EnergyNetworkNode;
  liveChokepointScore: number;
  adjustedRouteExposure: number;
  riskAdjustedDependency: number;
}

export interface EnergySupplyNetworkMetrics {
  supplierMix: Array<{ supplierId: string; name: string; dependencyPct: number; riskAdjustedDependency: number; region: string }>;
  routeDependency: Array<{ chokepointId: string; dependencyPct: number; routeCount: number }>;
  importExposure: number;
  riskAdjustedDependency: number;
  supplierConcentrationHhi: number;
  topSupplierShare: number;
  highestExposureRoute: string;
}

export interface CountryNetworkSummary {
  code: string;
  name: string;
  routeCount: number;
  totalDependency: number;
  avgExposure: number;
  avgRiskAdjusted: number;
  hhi: number;
  topSupplier: string;
  topSupplierPct: number;
  gulfDependencyPct: number;
  chokepointExposure: Array<{ chokepointId: string; dependencyPct: number }>;
}

export interface EnergySupplyNetworkModel {
  nodes: readonly EnergyNetworkNode[];
  routes: EnergySupplyRouteAssessment[];
  metrics: EnergySupplyNetworkMetrics;
  countrySummaries: CountryNetworkSummary[];
  selectedCountry: string | null;
  source: string;
  fetchedAt: string;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function routeLiveScore(route: EnergySupplyRoute, chokepoints?: GetChokepointStatusResponse | null): number {
  if (!chokepoints?.chokepoints?.length) return 0;
  const scoreMap = new Map(chokepoints.chokepoints.map(cp => [cp.id, cp.disruptionScore || 0]));
  return route.chokepoints.reduce((max, id) => Math.max(max, scoreMap.get(id) ?? 0), 0);
}

function adjustedExposure(route: EnergySupplyRoute, liveScore: number): number {
  return clamp(route.routeExposure * 0.68 + liveScore * 0.32);
}

function buildCountrySummary(
  countryCode: string,
  routes: EnergySupplyRouteAssessment[],
): CountryNetworkSummary | null {
  const config = IMPORTER_COUNTRY_CONFIG.find(c => c.code === countryCode);
  if (!config) return null;
  const countryRoutes = routes.filter(r => r.importer.countryCode === countryCode);
  if (countryRoutes.length === 0) return null;

  const totalDependency = countryRoutes.reduce((sum, r) => sum + r.dependencyPct, 0);
  const avgExposure = countryRoutes.reduce((sum, r) => sum + r.adjustedRouteExposure, 0) / countryRoutes.length;
  const avgRiskAdjusted = countryRoutes.reduce((sum, r) => sum + r.riskAdjustedDependency, 0);
  const hhi = Math.round(countryRoutes.reduce((sum, r) => sum + r.dependencyPct ** 2, 0));
  const sorted = [...countryRoutes].sort((a, b) => b.dependencyPct - a.dependencyPct);
  const top = sorted[0]!;

  const gulfRoutes = countryRoutes.filter(r =>
    r.supplier.region === 'gulf'
  );
  const gulfDependencyPct = gulfRoutes.reduce((sum, r) => sum + r.dependencyPct, 0);

  const chokepointMap = new Map<string, number>();
  for (const route of countryRoutes) {
    for (const cpId of route.chokepoints) {
      chokepointMap.set(cpId, (chokepointMap.get(cpId) ?? 0) + route.dependencyPct);
    }
  }
  const chokepointExposure = [...chokepointMap.entries()]
    .map(([chokepointId, dependencyPct]) => ({ chokepointId, dependencyPct: Number(dependencyPct.toFixed(1)) }))
    .sort((a, b) => b.dependencyPct - a.dependencyPct);

  return {
    code: countryCode,
    name: config.name,
    routeCount: countryRoutes.length,
    totalDependency,
    avgExposure: Number(avgExposure.toFixed(1)),
    avgRiskAdjusted: Number(avgRiskAdjusted.toFixed(1)),
    hhi,
    topSupplier: top.supplier.name,
    topSupplierPct: top.dependencyPct,
    gulfDependencyPct,
    chokepointExposure,
  };
}

export function buildEnergySupplyNetworkModel(
  chokepoints?: GetChokepointStatusResponse | null,
  selectedCountry?: string | null,
): EnergySupplyNetworkModel {
  const nodeMap = new Map(ENERGY_NETWORK_NODES.map(node => [node.id, node]));
  const routes: EnergySupplyRouteAssessment[] = ENERGY_SUPPLY_ROUTES.map(route => {
    const supplier = nodeMap.get(route.supplierId);
    const importer = nodeMap.get(route.importerId);
    if (!supplier || !importer) {
      throw new Error(`Energy supply route ${route.id} references an unknown node`);
    }
    const liveChokepointScore = routeLiveScore(route, chokepoints);
    const adjustedRouteExposure = adjustedExposure(route, liveChokepointScore);
    return {
      ...route,
      supplier,
      importer,
      liveChokepointScore,
      adjustedRouteExposure,
      riskAdjustedDependency: Number((route.dependencyPct * adjustedRouteExposure / 100).toFixed(1)),
    };
  });

  const filteredRoutes = selectedCountry
    ? routes.filter(r => r.importer.countryCode === selectedCountry)
    : routes;

  const supplierMix = filteredRoutes
    .map(route => ({
      supplierId: route.supplierId,
      name: route.supplier.name,
      dependencyPct: route.dependencyPct,
      riskAdjustedDependency: route.riskAdjustedDependency,
      region: route.supplier.region,
    }))
    .sort((a, b) => b.dependencyPct - a.dependencyPct);

  const chokepointMap = new Map<string, { chokepointId: string; dependencyPct: number; routeCount: number }>();
  for (const route of filteredRoutes) {
    for (const chokepointId of route.chokepoints) {
      const entry = chokepointMap.get(chokepointId) ?? { chokepointId, dependencyPct: 0, routeCount: 0 };
      entry.dependencyPct += route.dependencyPct;
      entry.routeCount += 1;
      chokepointMap.set(chokepointId, entry);
    }
  }

  const importExposure = Number(filteredRoutes.reduce((sum, route) => sum + route.dependencyPct * route.adjustedRouteExposure / 100, 0).toFixed(1));
  const riskAdjustedDependency = Number(filteredRoutes.reduce((sum, route) => sum + route.riskAdjustedDependency, 0).toFixed(1));
  const supplierConcentrationHhi = Math.round(filteredRoutes.reduce((sum, route) => sum + route.dependencyPct ** 2, 0));
  const topRoute = [...filteredRoutes].sort((a, b) => b.adjustedRouteExposure - a.adjustedRouteExposure)[0];

  const countrySummaries = IMPORTER_COUNTRY_CONFIG
    .map(c => buildCountrySummary(c.code, routes))
    .filter((s): s is CountryNetworkSummary => s !== null)
    .sort((a, b) => b.avgRiskAdjusted - a.avgRiskAdjusted);

  return {
    nodes: ENERGY_NETWORK_NODES,
    routes: filteredRoutes.sort((a, b) => b.riskAdjustedDependency - a.riskAdjustedDependency),
    metrics: {
      supplierMix,
      routeDependency: [...chokepointMap.values()]
        .map(entry => ({ ...entry, dependencyPct: Number(entry.dependencyPct.toFixed(1)) }))
        .sort((a, b) => b.dependencyPct - a.dependencyPct),
      importExposure,
      riskAdjustedDependency,
      supplierConcentrationHhi,
      topSupplierShare: filteredRoutes.length > 0 ? Math.max(...filteredRoutes.map(route => route.dependencyPct)) : 0,
      highestExposureRoute: topRoute?.corridor ?? '',
    },
    countrySummaries,
    selectedCountry: selectedCountry ?? null,
    source: ENERGY_SUPPLY_NETWORK_SOURCE,
    fetchedAt: new Date().toISOString(),
  };
}

export function getImporterCountries() {
  return IMPORTER_COUNTRY_CONFIG;
}
