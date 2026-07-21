import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface EnergyPrice {
  name: string;
  price: number;
  change: number;
  unit: string;
  supplyDemand?: string;
}

const DEMO_PRICES: EnergyPrice[] = [
  { name: 'WTI Crude', price: 68.45, change: 1.23, unit: '$/bbl', supplyDemand: 'Balanced' },
  { name: 'Brent Crude', price: 72.18, change: 0.87, unit: '$/bbl', supplyDemand: 'Tight' },
  { name: 'Gasoline', price: 2.42, change: -0.03, unit: '$/gal', supplyDemand: 'Soft' },
  { name: 'Diesel', price: 2.85, change: 0.12, unit: '$/gal', supplyDemand: 'Balanced' },
];

export class EnergyComplexPanel {
  private container: HTMLElement;
  private prices: EnergyPrice[] = DEMO_PRICES;
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
      { name: 'energy-complex', fallback: DEMO_PRICES},
      async () => {
        const hydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; name: string; price: number; unit: string; change: number }> } | undefined;
        if (hydrated?.prices && hydrated.prices.length > 0) {
          const seriesNameMap: Record<string, string> = {
            'RWTC': 'WTI Crude',
            'RBRTE': 'Brent Crude',
            'EER_EPMRU_PF4_Y35NY_DPG': 'Gasoline',
            'EER_EPD2F_PF4_Y35NY_DPG': 'Diesel',
          };
          return hydrated.prices.map((item) => ({
            name: seriesNameMap[item.commodity] || item.name || item.commodity,
            price: item.price || 0,
            change: item.change || 0,
            unit: item.unit || '$/unit',
            supplyDemand: 'Balanced',
          }));
        }
        return DEMO_PRICES;
      },
      (data) => Array.isArray(data),
    );
    this.prices = data;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private chgIcon(v: number): string { return v > 0 ? '\u25B2' : v < 0 ? '\u25BC' : '\u2013'; }
  private sdBadge(sd: string): string {
    if (sd === 'Tight') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    if (sd === 'Soft') return 'bg-primary/10 text-primary border border-primary/20';
    return 'bg-white/5 text-on-surface-variant border border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Energy Complex</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="panel-grid-inner mb-4">
        ${this.prices.map((p, i) => `
          <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">${p.name.toUpperCase()}</div>
            <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">$${p.price.toFixed(2)}</div>
            <div class="text-[10px] font-data-md ${this.chgColor(p.change)} mt-1">${this.chgIcon(p.change)} ${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}%</div>
            ${p.supplyDemand ? `<div class="mt-2"><span class="text-[9px] font-data-md px-1.5 py-0.5 rounded ${this.sdBadge(p.supplyDemand)}">${p.supplyDemand}</span></div>` : ''}
          </div>`).join('')}
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">SUPPLY / DEMAND SIGNALS</div>
      <div class="flex flex-col gap-1">
        ${this.prices.map((p, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
            <span class="text-[11px] text-on-surface font-body-sm">${p.name}</span>
            <span class="text-[10px] font-data-md px-1.5 py-0.5 rounded ${this.sdBadge(p.supplyDemand ?? 'Balanced')}">${p.supplyDemand ?? '\u2014'}</span>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
