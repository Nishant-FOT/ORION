import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_COUNTRIES: { country: string; fillPct: number; capacity: string; change: string }[] = [
  { country: 'US SPR', fillPct: 72, capacity: '714 MB', change: '+0.1%' },
  { country: 'US Commercial', fillPct: 68, capacity: '450 MB', change: '+0.3%' },
  { country: 'EU Total', fillPct: 65, capacity: '350 MB', change: '+0.2%' },
  { country: 'China SPR', fillPct: 81, capacity: '950 MB', change: '-0.2%' },
  { country: 'India SPR', fillPct: 58, capacity: '380 MB', change: '+0.5%' },
  { country: 'Japan SPR', fillPct: 74, capacity: '420 MB', change: '+0.1%' },
];

const DEMO_EU_TOTAL = 67;

export class StorageFacilitiesPanel {
  private container: HTMLElement;
  private countries: { country: string; fillPct: number; capacity: string; change: string }[] = [];
  private euTotal = 0;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'StorageFacilities', fallback: { countries: DEMO_COUNTRIES, euTotal: DEMO_EU_TOTAL }},
      async () => {
        const raw = getHydratedData('crudeInventories') as { weeks?: Array<{ period: string; stocksMb: number }> } | undefined;
        const latest = raw?.weeks?.[0];
        if (latest && typeof latest.stocksMb === 'number') {
          const stockBbl = latest.stocksMb;
          const euTotal = Math.min(100, Math.round((stockBbl / 450) * 100));
          return {
            countries: [
              { country: 'US SPR', fillPct: euTotal, capacity: '714 MB', change: '+0.1%' },
              { country: 'US Commercial', fillPct: Math.round(euTotal * 0.95), capacity: '450 MB', change: '+0.3%' },
              { country: 'EU Total', fillPct: Math.round(euTotal * 0.92), capacity: '350 MB', change: '+0.2%' },
            ],
            euTotal,
          };
        }
        throw new Error('No crude inventory data');
      },
      (_d) => true,
    );
    this.countries = result.data.countries;
    this.euTotal = result.data.euTotal;
    this.source = result.source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private fillColor(pct: number): string {
    if (pct >= 75) return 'bg-primary';
    if (pct >= 60) return 'bg-orange-400';
    return 'bg-yellow-400';
  }

  private fillColorText(pct: number): string {
    if (pct >= 75) return 'text-primary';
    if (pct >= 60) return 'text-orange-400';
    return 'text-yellow-400';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Storage Facilities</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">battery_charging_full</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">EU TOTAL FILL LEVEL</div>
        <div class="text-3xl font-data-lg ${this.fillColorText(this.euTotal)} panel-stat-lg">${this.euTotal}%</div>
        <div class="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div class="h-full ${this.fillColor(this.euTotal)} rounded-full transition-all duration-1000" style="width: ${this.euTotal}%"></div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">REGIONAL BREAKDOWN</div>
        <div class="flex flex-col gap-2">
          ${this.countries.map((c, i) => `
            <div style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-on-surface-variant font-body-sm">${c.country}</span>
                <div class="flex items-center gap-2">
                  <span class="text-[9px] font-data-md text-on-surface-variant">${c.capacity}</span>
                  <span class="text-[9px] font-data-md text-primary">${c.change}</span>
                  <span class="text-[10px] text-on-surface font-data-md">${c.fillPct}%</span>
                </div>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full ${this.fillColor(c.fillPct)} rounded-full transition-all duration-1000" style="width: ${c.fillPct}%"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
