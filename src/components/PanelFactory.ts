// ORION Panel Factory — wires panel IDs to live-data components with resize + drag-and-drop support

import { PANEL_REGISTRY, type PanelConfig, type PanelCategory, resolvePanelSize } from '@/config/panel-registry';
import { ResizablePanel } from '@/components/ResizablePanel';

// Real data panels
import { LiveNewsPanel } from '@/components/panels/LiveNewsPanel';
import { BreakingNewsPanel } from '@/components/panels/BreakingNewsPanel';
import { CrossSourceSignalsPanel } from '@/components/panels/CrossSourceSignalsPanel';
import { ThreatTimelinePanel } from '@/components/panels/ThreatTimelinePanel';
import { MarketOverviewPanel } from '@/components/panels/MarketOverviewPanel';
import { EconomicIndicatorsPanel } from '@/components/panels/EconomicIndicatorsPanel';
import { MarketImplicationsPanel } from '@/components/panels/MarketImplicationsPanel';
import { StrategicPosturePanel } from '@/components/panels/StrategicPosturePanel';
import { UcdpEventsPanel } from '@/components/panels/UcdpEventsPanel';
import { SanctionsPanel } from '@/components/panels/SanctionsPanel';
import { RadiationPanel } from '@/components/panels/RadiationPanel';
import { ClimateAnomalyPanel } from '@/components/panels/ClimateAnomalyPanel';
import { DiseaseOutbreaksPanel } from '@/components/panels/DiseaseOutbreaksPanel';
import { DisplacementPanel } from '@/components/panels/DisplacementPanel';
import { SocialVelocityPanel } from '@/components/panels/SocialVelocityPanel';

import { AisShippingPanel } from '@/components/panels/AisShippingPanel';
import { InsightsPanel } from '@/components/panels/InsightsPanel';
import { ForecastPanel } from '@/components/panels/ForecastPanel';
import { GeopoliticalRiskPanel } from '@/components/panels/GeopoliticalRiskPanel';
import { DailyMarketBriefPanel } from '@/components/panels/DailyMarketBriefPanel';
import { ExecutiveActionPanel } from '@/components/panels/ExecutiveActionPanel';
import { ExecutiveReportsPanel } from '@/components/panels/ExecutiveReportsPanel';

import { MapContainer } from '@/components/MapContainer';
import { WorldClockPanel } from '@/components/panels/WorldClockPanel';
import { HormuzTrackerPanel } from '@/components/panels/HormuzTrackerPanel';
import { OrefSirensPanel } from '@/components/panels/OrefSirensPanel';
import { SupplyChainPanel } from '@/components/panels/SupplyChainPanel';
import { FearGreedPanel } from '@/components/panels/FearGreedPanel';
import { StrategicRiskPanel } from '@/components/panels/StrategicRiskPanel';
import { MarketBreadthPanel } from '@/components/panels/MarketBreadthPanel';
import { EconomicCalendarPanel } from '@/components/panels/EconomicCalendarPanel';
import { MacroSignalsPanel } from '@/components/panels/MacroSignalsPanel';
import { CotPositioningPanel } from '@/components/panels/CotPositioningPanel';
import { FinancialStressPanel } from '@/components/panels/FinancialStressPanel';
import { NationalDebtPanel } from '@/components/panels/NationalDebtPanel';
import { GulfEconomiesPanel } from '@/components/panels/GulfEconomiesPanel';
import { ConsumerPricesPanel } from '@/components/panels/ConsumerPricesPanel';
import { GdeltIntelPanel } from '@/components/panels/GdeltIntelPanel';
import { AirlineIntelPanel } from '@/components/panels/AirlineIntelPanel';
import { ServiceStatusPanel } from '@/components/panels/ServiceStatusPanel';
import { EnergyComplexPanel } from '@/components/panels/EnergyComplexPanel';
import { EnergyCrisisPanel } from '@/components/panels/EnergyCrisisPanel';
import { EnergyDisruptionsPanel } from '@/components/panels/EnergyDisruptionsPanel';
import { EnergyRiskPanel } from '@/components/panels/EnergyRiskPanel';
import { EnergySupplyPanel } from '@/components/panels/EnergySupplyPanel';
import { OilInventoriesPanel } from '@/components/panels/OilInventoriesPanel';
import { FuelPricesPanel } from '@/components/panels/FuelPricesPanel';
import { FuelShortagesPanel } from '@/components/panels/FuelShortagesPanel';
import { PipelineStatusPanel } from '@/components/panels/PipelineStatusPanel';
import { StorageFacilitiesPanel } from '@/components/panels/StorageFacilitiesPanel';
import { ChokepointStripPanel } from '@/components/panels/ChokepointStripPanel';
import { ChokepointMonitoringPanel } from '@/components/panels/ChokepointMonitoringPanel';
import { TradePolicyPanel } from '@/components/panels/TradePolicyPanel';
import { RenewableEnergyPanel } from '@/components/panels/RenewableEnergyPanel';
import { InvestmentsPanel } from '@/components/panels/InvestmentsPanel';
import { ProcurementAdvisorPanel } from '@/components/panels/ProcurementAdvisorPanel';
import { ReserveOptimizationPanel } from '@/components/panels/ReserveOptimizationPanel';
import { AaiiSentimentPanel } from '@/components/panels/AaiiSentimentPanel';
import { MacroTilesPanel } from '@/components/panels/MacroTilesPanel';
import { YieldCurvePanel } from '@/components/panels/YieldCurvePanel';
import { LiquidityShiftsPanel } from '@/components/panels/LiquidityShiftsPanel';
import { PositioningPanel } from '@/components/panels/PositioningPanel';
import { GoldIntelligencePanel } from '@/components/panels/GoldIntelligencePanel';
import { EtfFlowsPanel } from '@/components/panels/EtfFlowsPanel';

import { WsbTickersPanel } from '@/components/panels/WsbTickersPanel';

import { DefensePatentsPanel } from '@/components/panels/DefensePatentsPanel';
import { ThermalEscalationPanel } from '@/components/panels/ThermalEscalationPanel';
import { SecurityAdvisoriesPanel } from '@/components/panels/SecurityAdvisoriesPanel';
import { PopulationExposurePanel } from '@/components/panels/PopulationExposurePanel';
import { DeductionPanel } from '@/components/panels/DeductionPanel';
import { CountryBriefPanel } from '@/components/panels/CountryBriefPanel';
import { CountryDeepDivePanel } from '@/components/panels/CountryDeepDivePanel';
import { CountryTimelinePanel } from '@/components/panels/CountryTimelinePanel';
import { HistoricalIntelPanel } from '@/components/panels/HistoricalIntelPanel';
import { RegionalIntelPanel } from '@/components/panels/RegionalIntelPanel';
import { ChatAnalystPanel } from '@/components/panels/ChatAnalystPanel';
import { McpDataPanel } from '@/components/panels/McpDataPanel';
import { CorrelationPanel } from '@/components/panels/CorrelationPanel';
import { MilitaryCorrelationPanel } from '@/components/panels/MilitaryCorrelationPanel';
import { EscalationCorrelationPanel } from '@/components/panels/EscalationCorrelationPanel';
import { EconomicCorrelationPanel } from '@/components/panels/EconomicCorrelationPanel';
import { DisasterCorrelationPanel } from '@/components/panels/DisasterCorrelationPanel';
import { CountryInstabilityIndexPanel } from '@/components/panels/CountryInstabilityIndexPanel';
import { CascadeAnalysisPanel } from '@/components/panels/CascadeAnalysisPanel';
import { QuantitativeRiskPanel } from '@/components/panels/QuantitativeRiskPanel';
import { ScenarioSimulatorPanel } from '@/components/panels/ScenarioSimulatorPanel';
import { HeroSpotlightPanel } from '@/components/panels/HeroSpotlightPanel';
import { PositiveNewsPanel } from '@/components/panels/PositiveNewsPanel';
import { GoodThingsDigestPanel } from '@/components/panels/GoodThingsDigestPanel';
import { BreakthroughsPanel } from '@/components/panels/BreakthroughsPanel';
import { SpeciesPanel } from '@/components/panels/SpeciesPanel';
import { OrionDecisionDeskPanel } from '@/components/panels/OrionDecisionDeskPanel';
import { AlternativeRoutesPanel } from '@/components/panels/AlternativeRoutesPanel';
import { IndiaEnergyHubPanel } from '@/components/panels/IndiaEnergyHubPanel';
import { IndiaSprTimelinePanel } from '@/components/panels/IndiaSprTimelinePanel';
import { RefineryCompatibilityPanel } from '@/components/panels/RefineryCompatibilityPanel';
import { CorridorRiskMonitorPanel } from '@/components/panels/CorridorRiskMonitorPanel';
import { AiScenarioSimulatorPanel } from '@/components/panels/AiScenarioSimulatorPanel';
import { EarthquakesPanel } from '@/components/panels/EarthquakesPanel';
import { WeatherAlertsPanel } from '@/components/panels/WeatherAlertsPanel';
import { ProcurementActionCenterPanel } from '@/components/panels/ProcurementActionCenterPanel';
import { LiveDisruptionProbabilityPanel } from '@/components/panels/LiveDisruptionProbabilityPanel';
import { GeopoliticalHubsPanel } from '@/components/panels/GeopoliticalHubsPanel';
import { AlertCenterPanel } from '@/components/panels/AlertCenterPanel';
import { LiveIntelligencePanel } from '@/components/panels/LiveIntelligencePanel';

type PanelClass = new (container: HTMLElement) => { init(): Promise<void>; destroy(): void };

const PANEL_MAP: Record<string, PanelClass> = {
  // SIGNALS
  'live-news': LiveNewsPanel,
  'breaking-news': BreakingNewsPanel,
  'cross-source-signals': CrossSourceSignalsPanel,
  'threat-timeline': ThreatTimelinePanel,
  'climate-news': ClimateAnomalyPanel, // TODO: placeholder — no ClimateNewsPanel exists yet

  'ais-shipping': AisShippingPanel,
  'service-status': ServiceStatusPanel,
  'geopolitical-hubs': GeopoliticalHubsPanel,
  'live-intelligence': LiveIntelligencePanel,


  // MARKETS
  'markets': MarketOverviewPanel,
  'market-implications': MarketImplicationsPanel,
  'economic': EconomicIndicatorsPanel,

  // DEFENSE
  'strategic-posture': StrategicPosturePanel,
  'ucdp-events': UcdpEventsPanel,
  'sanctions': SanctionsPanel,
  'radiation': RadiationPanel,

  // CLIMATE
  'climate-anomaly': ClimateAnomalyPanel,
  'disease-outbreaks': DiseaseOutbreaksPanel,
  'displacement': DisplacementPanel,
  'social-velocity': SocialVelocityPanel,
  'earthquakes': EarthquakesPanel,
  'weather-alerts': WeatherAlertsPanel,

  // ANALYSIS
  'insights': InsightsPanel,
  'forecast': ForecastPanel,
  'geopolitical-risk': GeopoliticalRiskPanel,

  // REPORTS
  'daily-market-brief': DailyMarketBriefPanel,
  'executive-action': ExecutiveActionPanel,
  'executive-reports': ExecutiveReportsPanel,

  // MAP
  'map-container': MapContainer,

  // NEW
  'world-clock': WorldClockPanel,
  'hormuz': HormuzTrackerPanel,
  'oref-sirens': OrefSirensPanel,
  'supply-chain': SupplyChainPanel,
  'fear-greed': FearGreedPanel,
  'strategic-risk': StrategicRiskPanel,

  // MARKET PANELS
  'market-breadth': MarketBreadthPanel,
  'economic-calendar': EconomicCalendarPanel,
  'macro-signals': MacroSignalsPanel,
  'cot-positioning': CotPositioningPanel,
  'fsi': FinancialStressPanel,
  'national-debt': NationalDebtPanel,
  'gulf-economies': GulfEconomiesPanel,
  'consumer-prices': ConsumerPricesPanel,

  // GDELT
  'gdelt-intel': GdeltIntelPanel,
  'airline-intel': AirlineIntelPanel,

  // ENERGY
  'energy-complex': EnergyComplexPanel,
  'energy-crisis': EnergyCrisisPanel,
  'energy-disruptions': EnergyDisruptionsPanel,
  'energy-risk': EnergyRiskPanel,
  'energy-supply': EnergySupplyPanel,
  'oil-inventories': OilInventoriesPanel,
  'fuel-prices': FuelPricesPanel,
  'fuel-shortages': FuelShortagesPanel,
  'pipeline-status': PipelineStatusPanel,
  'storage-facilities': StorageFacilitiesPanel,
  'chokepoint-strip': ChokepointStripPanel,
  'chokepoint-monitoring': ChokepointMonitoringPanel,
  'trade-policy': TradePolicyPanel,
  'renewable-energy': RenewableEnergyPanel,
  'investments': InvestmentsPanel,
  'procurement': ProcurementAdvisorPanel,
  'reserves': ReserveOptimizationPanel,
  'alert-center': AlertCenterPanel,

  // MARKETS (additional)
  'aaii-sentiment': AaiiSentimentPanel,
  'macro-tiles': MacroTilesPanel,
  'yield-curve': YieldCurvePanel,
  'liquidity-shifts': LiquidityShiftsPanel,
  'positioning': PositioningPanel,
  'gold-intelligence': GoldIntelligencePanel,
  'etf-flows': EtfFlowsPanel,

  'wsb-tickers': WsbTickersPanel,


  // DEFENSE (additional)
  'defense-patents': DefensePatentsPanel,
  'thermal-escalation': ThermalEscalationPanel,
  'security-advisories': SecurityAdvisoriesPanel,

  // CLIMATE (additional)
  'population-exposure': PopulationExposurePanel,

  // ANALYSIS
  'deduction': DeductionPanel,
  'country-brief': CountryBriefPanel,
  'country-deep-dive': CountryDeepDivePanel,
  'country-timeline': CountryTimelinePanel,
  'historical-intel': HistoricalIntelPanel,
  'regional-intel': RegionalIntelPanel,
  'chat-analyst': ChatAnalystPanel,
  'mcp-data': McpDataPanel,
  'correlation': CorrelationPanel,
  'military-correlation': MilitaryCorrelationPanel,
  'escalation-correlation': EscalationCorrelationPanel,
  'economic-correlation': EconomicCorrelationPanel,
  'disaster-correlation': DisasterCorrelationPanel,
  'cii': CountryInstabilityIndexPanel,
  'cascade': CascadeAnalysisPanel,
  'quantitative-risk': QuantitativeRiskPanel,
  'scenario-simulator': ScenarioSimulatorPanel,
  'hero-spotlight': HeroSpotlightPanel,
  'positive-news': PositiveNewsPanel,
  'good-things': GoodThingsDigestPanel,
  'breakthroughs': BreakthroughsPanel,
  'species-panel': SpeciesPanel,

  // REPORTS (additional)
  'orion-decision': OrionDecisionDeskPanel,
  'alternative-routes': AlternativeRoutesPanel,

  // INDIA ENERGY SECURITY
  'india-energy-hub': IndiaEnergyHubPanel,
  'india-spr-timeline': IndiaSprTimelinePanel,
  'refinery-compatibility': RefineryCompatibilityPanel,
  'corridor-risk-monitor': CorridorRiskMonitorPanel,

  // AI & ADVANCED
  'ai-scenario-simulator': AiScenarioSimulatorPanel,
  'procurement-action-center': ProcurementActionCenterPanel,
  'live-disruption-probability': LiveDisruptionProbabilityPanel,
};

export interface PanelInstance {
  id: string;
  config: PanelConfig;
  element: HTMLElement;
  panelComponent?: { destroy(): void };
  resizable?: ResizablePanel;
  destroy(): void;
}

export class PanelFactory {
  private instances: Map<string, PanelInstance> = new Map();
  private boundGridDragOver: ((e: DragEvent) => void) | null = null;
  private boundGridDrop: ((e: DragEvent) => void) | null = null;
  private boundGridDragLeave: ((e: DragEvent) => void) | null = null;

  async createPanel(config: PanelConfig, container: HTMLElement, deferInit = false): Promise<PanelInstance> {
    const element = document.createElement('div');
    element.id = `panel-${config.id}`;
    element.className = 'glass-panel rounded-3xl p-6 flex flex-col shadow-card card-hover';
    element.setAttribute('data-panel-id', config.id);
    element.setAttribute('data-category', config.category);

    const sizeConfig = resolvePanelSize(config, config.category);
    element.style.gridColumn = `span ${sizeConfig.defaultWidth}`;
    element.style.gridRow = `span ${sizeConfig.defaultHeight}`;

    container.appendChild(element);

    let panelComponent: { destroy(): void } | undefined;
    const PanelClass = PANEL_MAP[config.id];

    if (PanelClass) {
      try {
        const panel = new PanelClass(element);
        panelComponent = panel;
        if (deferInit) {
          this.renderLoadingSkeleton(element, config);
        } else {
          await panel.init();
        }
      } catch (err) {
        console.warn(`[PanelFactory] Failed: ${config.id}`, err);
        this.renderStub(element, config);
      }
    } else {
      this.renderStub(element, config);
    }

    const resizable = new ResizablePanel(element, {
      panelId: config.id,
      category: config.category,
      sizeConfig: config,
      onReorder: (fromIdx, toIdx) => this.handleReorder(fromIdx, toIdx),
    });

    const instance: PanelInstance = {
      id: config.id, config, element, panelComponent, resizable,
      destroy: () => {
        resizable.destroy();
        panelComponent?.destroy();
        element.remove();
        this.instances.delete(config.id);
      },
    };
    this.instances.set(config.id, instance);
    return instance;
  }

  private renderLoadingSkeleton(element: HTMLElement, config: PanelConfig): void {
    element.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">${config.name}</h3>
        <div class="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
      </div>
      <div class="flex-grow flex flex-col gap-3">
        <div class="h-3 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
        <div class="h-3 bg-white/5 rounded-full w-1/2 animate-pulse"></div>
        <div class="h-3 bg-white/5 rounded-full w-2/3 animate-pulse"></div>
      </div>
    `;
  }

  private renderStub(element: HTMLElement, config: PanelConfig): void {
    const colorMap: Record<PanelCategory, string> = {
      map: 'primary', signals: 'error', markets: 'secondary', energy: 'primary',
      defense: 'error', climate: 'secondary', analysis: 'primary', reports: 'secondary',
    };
    const color = colorMap[config.category] || 'primary';
    element.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">${config.name}</h3>
        <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors hover:scale-110 cursor-pointer">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">${config.icon}</span>
        </div>
      </div>
      <div class="flex-grow flex flex-col gap-3">
        <div class="text-sm text-on-surface-variant font-body-sm leading-relaxed">${config.description}</div>
        <div class="mt-auto flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-${color}/50 animate-pulse"></span>
          <span class="text-xs text-${color} font-data-md">Registered</span>
        </div>
      </div>
    `;
  }

  async createCategoryView(category: PanelCategory, container: HTMLElement): Promise<PanelInstance[]> {
    const panels = PANEL_REGISTRY.filter(p => p.category === category);
    const instances: PanelInstance[] = [];
    const grid = document.createElement('div');
    grid.className = 'panel-grid';
    grid.id = `category-${category}`;

    const sortedPanels = this.sortPanelsByPosition(panels, category);

    // Phase 1: Create all DOM elements instantly (no data fetching)
    for (const config of sortedPanels) {
      instances.push(await this.createPanel(config, grid, true));
    }

    container.appendChild(grid);
    this.setupGridDropZone(grid, category);

    // Phase 2: Init panels in parallel batches (6 concurrent, 80ms stagger)
    const CONCURRENCY = 6;
    const STAGGER_MS = 80;
    const panelInstances = [...this.instances.values()].filter(
      i => i.config.category === category
    );

    for (let i = 0; i < panelInstances.length; i += CONCURRENCY) {
      const batch = panelInstances.slice(i, i + CONCURRENCY);
      await Promise.allSettled(
        batch.map((entry, batchIdx) =>
          new Promise<void>(resolve => {
            setTimeout(() => {
              const PanelClass = PANEL_MAP[entry.config.id];
              if (PanelClass && entry.panelComponent) {
                (entry.panelComponent as any).init?.()
                  ?.then?.(() => resolve())
                  ?.catch?.(() => resolve()) ?? resolve();
              } else {
                resolve();
              }
            }, STAGGER_MS * batchIdx);
          })
        )
      );
    }

    return instances;
  }

  private sortPanelsByPosition(panels: PanelConfig[], category: PanelCategory): PanelConfig[] {
    const positions = ResizablePanel.loadAllPositions(category);
    return [...panels].sort((a, b) => {
      const posA = positions[a.id];
      const posB = positions[b.id];
      const orderA = posA?.order ?? a.priority;
      const orderB = posB?.order ?? b.priority;
      return orderA - orderB;
    });
  }

  /**
   * Grid-level drag-and-drop zone. This is the single handler for ALL panels
   * in this category grid. We use the static ResizablePanel.getDraggingId()
   * to know which panel is being dragged.
   */
  private setupGridDropZone(grid: HTMLElement, _category: PanelCategory): void {
    // Clean up previous handlers if any
    this.teardownGridDropZone();

    this.boundGridDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';

      const draggingEl = ResizablePanel.getDraggingElement();
      if (!draggingEl) return;

      // Find which panel the cursor is currently over
      const target = this.findDropTarget(grid, e.clientX, e.clientY);
      if (!target || target === draggingEl) {
        this.clearDropIndicators(grid);
        return;
      }

      // Show before/after indicator on the target
      this.clearDropIndicators(grid);
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        target.classList.add('drop-before');
      } else {
        target.classList.add('drop-after');
      }
    };

    this.boundGridDrop = (e: DragEvent) => {
      e.preventDefault();
      this.clearDropIndicators(grid);

      const draggingEl = ResizablePanel.getDraggingElement();
      const draggingId = ResizablePanel.getDraggingId();
      if (!draggingEl || !draggingId) return;

      // Find which panel the cursor is over
      const target = this.findDropTarget(grid, e.clientX, e.clientY);
      if (!target || target === draggingEl) return;

      // Determine insert position: before or after the target
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;

      // Perform the DOM reorder
      if (insertBefore) {
        grid.insertBefore(draggingEl, target);
      } else {
        // Insert after target (target.nextSibling might be null, which means append at end)
        grid.insertBefore(draggingEl, target.nextSibling);
      }

      // Persist new order
      this.persistPositions(grid);

      // Visual feedback: brief flash
      draggingEl.classList.add('just-dropped');
      setTimeout(() => draggingEl.classList.remove('just-dropped'), 300);
    };

    this.boundGridDragLeave = (e: DragEvent) => {
      // Only clear indicators if we're actually leaving the grid (not entering a child)
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !grid.contains(related)) {
        this.clearDropIndicators(grid);
      }
    };

    grid.addEventListener('dragover', this.boundGridDragOver);
    grid.addEventListener('drop', this.boundGridDrop);
    grid.addEventListener('dragleave', this.boundGridDragLeave);
  }

  private teardownGridDropZone(): void {
    // We don't have a reference to the old grid here, but the cleanup
    // happens when destroyAll() is called and the grid is removed from DOM.
  }

  /**
   * Find the panel element under the cursor. Returns the closest panel child
   * of the grid that contains the (x, y) point.
   */
  private findDropTarget(grid: HTMLElement, x: number, y: number): HTMLElement | null {
    const children = Array.from(grid.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement
    );

    for (const child of children) {
      const rect = child.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return child;
      }
    }
    return null;
  }

  private clearDropIndicators(grid: HTMLElement): void {
    grid.querySelectorAll('.drop-before, .drop-after').forEach(el => {
      el.classList.remove('drop-before', 'drop-after');
    });
  }

  private persistPositions(grid: HTMLElement): void {
    const children = Array.from(grid.children).filter(
      (c): c is HTMLElement => c instanceof HTMLElement
    );
    children.forEach((child, index) => {
      const panelId = child.getAttribute('data-panel-id');
      if (panelId) {
        ResizablePanel.savePosition(panelId, { order: index });
      }
    });
  }

  private handleReorder(_fromIdx: number, _toIdx: number): void {
    // Reorder is handled via DOM manipulation in the drop handler
  }

  getPanel(id: string): PanelInstance | undefined { return this.instances.get(id); }
  getAllPanels(): PanelInstance[] { return Array.from(this.instances.values()); }

  destroyAll(): void {
    // Tear down grid drop zone
    this.teardownGridDropZone();
    // Destroy all panel instances
    for (const i of this.instances.values()) i.destroy();
    this.instances.clear();
  }
}

export const panelFactory = new PanelFactory();
