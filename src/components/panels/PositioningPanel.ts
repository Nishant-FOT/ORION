import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface PositioningAsset {
  name: string;
  netLong: number;
  speculativeLong: number;
  speculativeShort: number;
  commercialHedge: number;
  change: number;
}

const DEMO: PositioningAsset[] = [
  { name: 'S&P 500', netLong: 180000, speculativeLong: 320000, speculativeShort: 140000, commercialHedge: -210000, change: 12500 },
  { name: 'Gold', netLong: 210000, speculativeLong: 285000, speculativeShort: 75000, commercialHedge: -195000, change: 8200 },
  { name: 'Crude Oil', netLong: 250000, speculativeLong: 340000, speculativeShort: 90000, commercialHedge: -280000, change: -5400 },
  { name: 'Euro FX', netLong: 85000, speculativeLong: 145000, speculativeShort: 60000, commercialHedge: -95000, change: 4200 },
  { name: '10Y T-Note', netLong: -42000, speculativeLong: 55000, speculativeShort: 97000, commercialHedge: 78000, change: -3100 },
  { name: 'Japanese Yen', netLong: -38000, speculativeLong: 42000, speculativeShort: 80000, commercialHedge: 62000, change: 1200 },
];

export class PositioningPanel {
  private container: HTMLElement;
  private assets: PositioningAsset[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'positioning', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/market/v1/get-cot-positioning`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || !d.assets?.length) throw new Error('unavailable');
        return d.assets as PositioningAsset[];
      },
      (data) => Array.isArray(data),
    );
    this.assets = data;
    this.source = source;
  }

  private netColor(v: number): string { return v > 0 ? 'text-primary' : 'text-error'; }
  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }

  private netBar(v: number): string {
    const w = Math.min(Math.abs(v) / 3500, 100);
    const c = v > 0 ? 'bg-primary/60' : 'bg-error/60';
    return `<div class="w-full bg-white/5 rounded-full h-1.5"><div class="${c} h-1.5 rounded-full" style="width: ${w}%"></div></div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Positioning</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="flex flex-col gap-1.5" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.assets.map((a, i) => `
          <div class="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.03 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-on-surface font-body-sm">${a.name}</span>
              <span class="text-xs font-data-md ${this.netColor(a.netLong)} panel-stat">${a.netLong > 0 ? '+' : ''}${a.netLong.toLocaleString()}</span>
            </div>
            ${this.netBar(a.netLong)}
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-3">
                <span class="text-[10px] font-data-md text-primary">Long: ${a.speculativeLong.toLocaleString()}</span>
                <span class="text-[10px] font-data-md text-error">Short: ${a.speculativeShort.toLocaleString()}</span>
              </div>
              <span class="text-[10px] font-data-md ${this.chgColor(a.change)}">Chg: ${a.change > 0 ? '+' : ''}${a.change.toLocaleString()}</span>
            </div>
            <div class="text-[10px] font-data-md text-on-surface-variant mt-0.5">Commercial: ${a.commercialHedge > 0 ? '+' : ''}${a.commercialHedge.toLocaleString()}</div>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
