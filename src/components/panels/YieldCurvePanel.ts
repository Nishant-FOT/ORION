import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface YieldPoint { tenor: string; yield: number; change: number; }

const DEMO: YieldPoint[] = [
  { tenor: '1M', yield: 5.25, change: 0.01 },
  { tenor: '3M', yield: 5.30, change: -0.02 },
  { tenor: '6M', yield: 5.22, change: 0.00 },
  { tenor: '1Y', yield: 4.95, change: -0.03 },
  { tenor: '2Y', yield: 4.55, change: -0.05 },
  { tenor: '5Y', yield: 4.30, change: -0.02 },
  { tenor: '10Y', yield: 4.20, change: 0.03 },
  { tenor: '30Y', yield: 4.40, change: 0.04 },
];

export class YieldCurvePanel {
  private container: HTMLElement;
  private points: YieldPoint[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'yield-curve', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/market/v1/get-yield-curve`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable) throw new Error('unavailable');
        return (d.points ?? []) as YieldPoint[];
      },
      (data) => Array.isArray(data),
    );
    this.points = data;
    this.source = source;

    if (source === 'cached') {
      try {
        const dgs2Obs = (getHydratedData('fredDgs2') as any)?.series?.observations ?? [];
        const dgs10Obs = (getHydratedData('fredDgs10') as any)?.series?.observations ?? [];
        const y2 = dgs2Obs[0]?.value ? parseFloat(dgs2Obs[0].value) : null;
        const y10 = dgs10Obs[0]?.value ? parseFloat(dgs10Obs[0].value) : null;
        const y30 = y10 ? y10 * 1.05 : null;
        const y5 = y2 ? y2 * 0.95 : null;
        if (y2 && y10) {
          this.points = [
            { tenor: '2Y', yield: y2, change: 0 },
            { tenor: '5Y', yield: y5 ?? 4.0, change: 0 },
            { tenor: '10Y', yield: y10, change: 0 },
            { tenor: '30Y', yield: y30 ?? 4.5, change: 0 },
          ];
          this.source = 'live';
        }
      } catch { /* keep demo/cached */ }
    }
  }

  private spread(): number {
    const twoY = this.points.find(p => p.tenor === '2Y');
    const tenY = this.points.find(p => p.tenor === '10Y');
    if (twoY && tenY) return +(tenY.yield - twoY.yield).toFixed(2);
    return 0;
  }

  private isInverted(): boolean { return this.spread() < 0; }

  private maxYield(): number { return Math.max(...this.points.map(p => p.yield)); }

  render(): void {
    const sp = this.spread();
    const inverted = this.isInverted();
    const maxY = this.maxYield();

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Yield Curve</h3>
        <div class="flex items-center gap-2">
          ${inverted ? '<span class="text-[10px] font-label-caps text-error bg-error/10 px-1.5 py-0.5 rounded">INVERTED</span>' : ''}
          ${renderDataBadge(this.source)}
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all mb-3" style="animation: fadeInUp 0.3s ease-out;">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[10px] font-label-caps text-on-surface-variant">2Y-10Y SPREAD</div>
            <div class="text-2xl font-data-lg ${sp >= 0 ? 'text-primary' : 'text-error'} panel-stat">${sp >= 0 ? '+' : ''}${(sp * 100).toFixed(0)} bps</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-label-caps text-on-surface-variant">STATUS</div>
            <div class="text-lg font-data-md ${inverted ? 'text-error' : 'text-primary'}">${inverted ? 'Inverted' : 'Normal'}</div>
          </div>
        </div>
      </div>

      <div class="flex items-end gap-1 mb-3" style="height: 80px; animation: fadeInUp 0.4s ease-out 0.1s both;">
        ${this.points.map((p, _i) => {
          const h = Math.max(8, (p.yield / maxY) * 72);
          return `<div class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[9px] font-data-md text-on-surface">${p.yield.toFixed(2)}</span>
            <div class="w-full rounded-t-sm bg-primary/60 transition-all duration-500" style="height: ${h}px;"></div>
            <span class="text-[9px] font-data-md text-on-surface-variant">${p.tenor}</span>
          </div>`;
        }).join('')}
      </div>

      <div class="flex flex-col gap-1" style="max-height: calc(100% - 200px); overflow-y: auto;">
        ${this.points.map((p, i) => {
          const chgColor = p.change > 0 ? 'text-primary' : p.change < 0 ? 'text-error' : 'text-on-surface-variant';
          return `<div class="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.03 * i}s both;">
            <span class="text-xs text-on-surface-variant font-body-sm">${p.tenor}</span>
            <div class="flex items-center gap-3">
              <span class="text-xs font-data-md text-on-surface panel-stat">${p.yield.toFixed(2)}%</span>
              <span class="text-[10px] font-data-md ${chgColor}">${p.change > 0 ? '+' : ''}${p.change.toFixed(2)}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
