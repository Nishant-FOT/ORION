import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface FuelPrice {
  region: string;
  fuel: string;
  price: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const DEMO_FUEL: FuelPrice[] = [
  { region: 'US', fuel: 'Gasoline', price: 2.42, unit: '$/gal', change: -0.03, trend: 'down' },
  { region: 'US', fuel: 'Diesel', price: 2.85, unit: '$/gal', change: 0.12, trend: 'up' },
  { region: 'US', fuel: 'Crude Oil', price: 68.45, unit: '$/bbl', change: 1.23, trend: 'up' },
  { region: 'US', fuel: 'Brent Crude', price: 72.18, unit: '$/bbl', change: 0.87, trend: 'up' },
];

export class FuelPricesPanel {
  private container: HTMLElement;
  private fuelPrices: FuelPrice[] = DEMO_FUEL;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'fuel-prices', fallback: DEMO_FUEL},
      async () => {
        const hydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; name: string; price: number; unit: string; change: number }> } | undefined;
        if (hydrated?.prices && hydrated.prices.length > 0) {
          const seriesFuelMap: Record<string, { fuel: string; unit: string }> = {
            'EER_EPMRU_PF4_Y35NY_DPG': { fuel: 'Gasoline', unit: '$/gal' },
            'EER_EPD2F_PF4_Y35NY_DPG': { fuel: 'Diesel', unit: '$/gal' },
            'RWTC': { fuel: 'Crude Oil', unit: '$/bbl' },
            'RBRTE': { fuel: 'Brent Crude', unit: '$/bbl' },
          };
          return hydrated.prices.map((item) => {
            const meta = seriesFuelMap[item.commodity] || { fuel: item.name || item.commodity, unit: item.unit || '$/unit' };
            return {
              region: 'US',
              fuel: meta.fuel,
              price: item.price || 0,
              unit: meta.unit,
              change: item.change || 0,
              trend: (item.change || 0) > 0 ? 'up' as const : (item.change || 0) < 0 ? 'down' as const : 'stable' as const,
            };
          });
        }
        return DEMO_FUEL;
      },
      (data) => Array.isArray(data),
    );
    this.fuelPrices = data;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private chgIcon(v: number): string { return v > 0 ? '\u25B2' : v < 0 ? '\u25BC' : '\u2013'; }
  private trendBadge(t: string): string {
    if (t === 'up') return 'bg-error/10 text-error';
    if (t === 'down') return 'bg-primary/10 text-primary';
    return 'bg-white/5 text-on-surface-variant';
  }

  render(): void {
    const regions = Array.from(new Set(this.fuelPrices.map(f => f.region)));

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Fuel Prices</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="panel-grid-inner mb-4">
        ${this.fuelPrices.filter((_, i) => i < 4).map((f, i) => `
          <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">${f.fuel.toUpperCase()}</div>
            <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${f.price.toFixed(2)}</div>
            <div class="text-[10px] font-data-md ${this.chgColor(f.change)} mt-1">${this.chgIcon(f.change)} ${f.change > 0 ? '+' : ''}${f.change.toFixed(2)}</div>
            <div class="text-[9px] font-data-md text-on-surface-variant/60 mt-1">${f.unit}</div>
          </div>`).join('')}
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">BY REGION</div>
      <div class="flex flex-col gap-1" style="max-height: calc(100% - 260px); overflow-y: auto;">
        ${regions.map(region => `
          <div class="text-[10px] font-label-caps text-on-surface-variant mt-2 mb-1">${region}</div>
          ${this.fuelPrices.filter(f => f.region === region).map((f, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
              <span class="text-[11px] text-on-surface font-body-sm">${f.fuel}</span>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-data-md text-on-surface">${f.price.toFixed(2)} ${f.unit}</span>
                <span class="text-[9px] font-data-md px-1.5 py-0.5 rounded ${this.trendBadge(f.trend)}">${this.chgIcon(f.change)}</span>
              </div>
            </div>`).join('')}
        `).join('')}
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
