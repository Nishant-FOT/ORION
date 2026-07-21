import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_SUPPLY_DATA = {
  routes: [
    { name: 'Persian Gulf → East Asia', share: 34, status: 'Normal' },
    { name: 'West Africa → Europe', share: 22, status: 'Normal' },
    { name: 'US Gulf → Europe', share: 18, status: 'Normal' },
    { name: 'Russia → China (pipeline)', share: 14, status: 'Normal' },
    { name: 'Americas → Asia', share: 12, status: 'Normal' },
  ],
  suppliers: [
    { country: 'Saudi Arabia', share: 18, trend: '+0.5%' },
    { country: 'Russia', share: 14, trend: '-1.2%' },
    { country: 'United States', share: 12, trend: '+2.1%' },
    { country: 'Iraq', share: 10, trend: '0.0%' },
    { country: 'UAE', share: 7, trend: '+0.3%' },
  ],
  dependencyScore: 62,
  routeExposure: 43,
};

type SupplyData = typeof DEMO_SUPPLY_DATA;

export class EnergySupplyPanel {
  private container: HTMLElement;
  private routes: { name: string; share: number; status: string }[] = [];
  private suppliers: { country: string; share: number; trend: string }[] = [];
  private dependencyScore = 0;
  private routeExposure = 0;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData<SupplyData>(
      { name: 'EnergySupply', fallback: DEMO_SUPPLY_DATA},
      async () => {
        const energyData = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; value: number }> } | undefined;
        const brent = energyData?.prices?.find(p => p.commodity === 'RBRTE');
        const brentVal = brent ? Number(brent.value) : 0;
        if (brentVal > 0) {
          return {
            routes: [
              { name: 'Persian Gulf → East Asia', share: 34, status: brentVal > 85 ? 'Elevated' : 'Normal' },
              { name: 'West Africa → Europe', share: 22, status: brentVal > 90 ? 'Disrupted' : 'Normal' },
              { name: 'US Gulf → Europe', share: 18, status: 'Normal' },
              { name: 'Russia → China (pipeline)', share: 14, status: 'Normal' },
              { name: 'Americas → Asia', share: 12, status: 'Normal' },
            ],
            suppliers: [
              { country: 'Saudi Arabia', share: 18, trend: brentVal > 80 ? '+0.5%' : '0.0%' },
              { country: 'Russia', share: 14, trend: brentVal > 85 ? '-1.2%' : '0.0%' },
              { country: 'United States', share: 12, trend: '+2.1%' },
              { country: 'Iraq', share: 10, trend: '0.0%' },
              { country: 'UAE', share: 7, trend: '+0.3%' },
            ],
            dependencyScore: Math.round(Math.min(100, brentVal * 0.7)),
            routeExposure: Math.round(Math.min(100, brentVal * 0.5)),
          };
        }
        return DEMO_SUPPLY_DATA;
      },
      (_data) => true
    );
    this.routes = result.data.routes;
    this.suppliers = result.data.suppliers;
    this.dependencyScore = result.data.dependencyScore;
    this.routeExposure = result.data.routeExposure;
    this.source = result.source;
  }

  private trendColor(trend: string): string {
    if (trend.startsWith('+')) return 'text-primary';
    if (trend.startsWith('-')) return 'text-error';
    return 'text-on-surface-variant';
  }

  private statusClass(status: string): string {
    if (status === 'Disrupted') return 'bg-error/10 text-error border border-error/20';
    if (status === 'Elevated') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-primary/10 text-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Energy Supply</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DEPENDENCY</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.dependencyScore}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">ROUTE EXPOSURE</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.routeExposure}</div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TOP SUPPLY ROUTES</div>
        <div class="flex flex-col gap-1">
          ${this.routes.map((r, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex items-center gap-2">
                <span class="text-xs text-on-surface font-body-sm">${r.name}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data-md ${this.statusClass(r.status)}">${r.status}</span>
                <span class="text-[9px] font-data-md text-on-surface-variant">${r.share}%</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">SUPPLIER MIX</div>
        <div class="flex flex-col gap-2">
          ${this.suppliers.map((s, i) => `
            <div style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-on-surface-variant font-body-sm">${s.country}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-data-md ${this.trendColor(s.trend)}">${s.trend}</span>
                  <span class="text-[10px] text-on-surface font-data-md">${s.share}%</span>
                </div>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${s.share}%"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
