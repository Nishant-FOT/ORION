import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface InventoryMetric {
  label: string;
  value: number;
  unit: string;
  change: number;
  icon: string;
}

const DEMO_INVENTORY: InventoryMetric[] = [
  { label: 'Commercial Stocks', value: 420, unit: 'M bbl', change: -2.1, icon: 'inventory_2' },
  { label: 'SPR', value: 372, unit: 'M bbl', change: 0, icon: 'local_fire_department' },
  { label: 'Total Reserve', value: 792, unit: 'M bbl', change: -2.1, icon: 'water_drop' },
];

export class OilInventoriesPanel {
  private container: HTMLElement;
  private inventory: InventoryMetric[] = DEMO_INVENTORY;
  private source: DataSource = 'cached';
  private latestPeriod = 'Week ending Jun 2026';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'oil-inventories', fallback: DEMO_INVENTORY},
      async () => {
        const raw = getHydratedData('crudeInventories') as { weeks?: Array<{ period: string; stocksMb: number }> } | undefined;
        const weeks = raw?.weeks;
        if (!weeks || weeks.length === 0) throw new Error('No crude inventory data');
        const latest = weeks[0];
        const previous = weeks[1];
        const totalStock = latest?.stocksMb ?? 0;
        const prevStock = previous?.stocksMb ?? 0;
        const change = totalStock - prevStock;
        this.latestPeriod = latest?.period || 'Recent';
        return [
          { label: 'Total Reserve', value: Math.round(totalStock), unit: 'M bbl', change: Math.round(change * 10) / 10, icon: 'water_drop' },
        ];
      },
      (data) => Array.isArray(data),
    );
    this.inventory = data;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private chgIcon(v: number): string { return v > 0 ? '\u25B2' : v < 0 ? '\u25BC' : '\u2013'; }
  private barWidth(val: number, max: number): string {
    return `${Math.min(100, Math.round((val / max) * 100))}%`;
  }

  render(): void {
    const total = this.inventory.find(i => i.label === 'Total Reserve');
    const maxBbl = total ? total.value : 800;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Oil Inventories</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="panel-grid-inner mb-4">
        ${this.inventory.map((m, i) => `
          <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">${m.label.toUpperCase()}</div>
            <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${m.value}${m.unit.replace('M bbl', '')}</div>
            <div class="text-[10px] font-data-md text-on-surface-variant/60 mt-0.5">${m.unit}</div>
            ${m.change !== 0 ? `<div class="text-[10px] font-data-md ${this.chgColor(m.change)} mt-1">${this.chgIcon(m.change)} ${m.change > 0 ? '+' : ''}${m.change.toFixed(1)}M WoW</div>` : ''}
          </div>`).join('')}
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">STOCKPILE BREAKDOWN</div>
        <div class="flex flex-col gap-2">
          ${this.inventory.filter(i => i.label !== 'Total Reserve').map((m, i) => `
            <div style="animation: fadeInUp 0.3s ease-out ${0.1 * i}s both;">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-on-surface-variant font-body-sm">${m.label}</span>
                <span class="text-[10px] text-on-surface font-data-md">${m.value}M bbl</span>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${this.barWidth(m.value, maxBbl)}"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DATA PERIOD</div>
      <div class="text-[11px] text-on-surface-variant font-body-sm p-2 hover:bg-white/5 rounded-lg transition-all" style="animation: fadeInUp 0.3s ease-out 0.5s both;">
        <span class="material-symbols-outlined text-primary text-xs mr-1 align-middle">calendar_today</span>${this.latestPeriod}
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
