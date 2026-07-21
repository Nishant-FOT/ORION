import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface BreadthData { currentPctAbove20d: number; currentPctAbove50d: number; currentPctAbove200d: number; history: Array<{ date: string; pctAbove20d: number; pctAbove50d: number; pctAbove200d: number }>; }

const EMPTY_DATA: BreadthData = {
  currentPctAbove20d: 0, currentPctAbove50d: 0, currentPctAbove200d: 0,
  history: [],
};

const DEMO_BREADTH: BreadthData = {
  currentPctAbove20d: 62.3,
  currentPctAbove50d: 54.8,
  currentPctAbove200d: 48.1,
  history: [
    { date: '2026-07-12', pctAbove20d: 61.5, pctAbove50d: 54.2, pctAbove200d: 47.8 },
    { date: '2026-07-11', pctAbove20d: 59.8, pctAbove50d: 53.6, pctAbove200d: 47.5 },
    { date: '2026-07-10', pctAbove20d: 57.2, pctAbove50d: 52.9, pctAbove200d: 47.2 },
    { date: '2026-07-09', pctAbove20d: 60.1, pctAbove50d: 53.4, pctAbove200d: 47.6 },
    { date: '2026-07-08', pctAbove20d: 63.7, pctAbove50d: 55.1, pctAbove200d: 48.3 },
    { date: '2026-07-07', pctAbove20d: 58.4, pctAbove50d: 53.0, pctAbove200d: 47.0 },
    { date: '2026-07-06', pctAbove20d: 55.9, pctAbove50d: 52.1, pctAbove200d: 46.5 },
    { date: '2026-07-05', pctAbove20d: 53.2, pctAbove50d: 51.0, pctAbove200d: 46.0 },
  ],
};

export class MarketBreadthPanel {
  private container: HTMLElement;
  private data: BreadthData = EMPTY_DATA;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'MarketBreadth', fallback: DEMO_BREADTH},
      async () => {
        const raw = getHydratedData('breadthHistory') as { current?: { pctAbove20d?: number; pctAbove50d?: number; pctAbove200d?: number }; history?: Array<{ date: string; pctAbove20d: number; pctAbove50d: number; pctAbove200d: number }> } | undefined;
        if (raw?.current) {
          return {
            currentPctAbove20d: raw.current.pctAbove20d ?? 0,
            currentPctAbove50d: raw.current.pctAbove50d ?? 0,
            currentPctAbove200d: raw.current.pctAbove200d ?? 0,
            history: raw.history ?? [],
          };
        }
        return EMPTY_DATA;
      },
      (data) => data.currentPctAbove20d > 0 || data.currentPctAbove50d > 0 || data.currentPctAbove200d > 0,
    );
    this.data = result.data;
    this.source = result.source;
  }

  private pctColor(v: number): string {
    return v >= 60 ? 'text-primary' : v >= 40 ? 'text-yellow-400' : 'text-error';
  }

  private sparkline(data: number[], color: string): string {
    if (data.length < 2) return '';
    const w = 120, h = 28;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return `<svg width="${w}" height="${h}" class="inline-block"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.7"/></svg>`;
  }

  render(): void {
    const d = this.data;
    const hasData = d.currentPctAbove20d > 0 || d.currentPctAbove50d > 0 || d.currentPctAbove200d > 0;
    const h20 = d.history.map(h => h.pctAbove20d);
    const h50 = d.history.map(h => h.pctAbove50d);
    const h200 = d.history.map(h => h.pctAbove200d);

    let body = '';
    if (hasData) {
      body = `
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center"><div class="text-[10px] font-label-caps text-on-surface-variant">20-DAY</div><div class="text-xl font-data-lg ${this.pctColor(d.currentPctAbove20d)} panel-stat-lg">${d.currentPctAbove20d.toFixed(1)}%</div></div>
        <div class="p-3 bg-white/5 rounded-xl text-center"><div class="text-[10px] font-label-caps text-on-surface-variant">50-DAY</div><div class="text-xl font-data-lg ${this.pctColor(d.currentPctAbove50d)} panel-stat-lg">${d.currentPctAbove50d.toFixed(1)}%</div></div>
        <div class="p-3 bg-white/5 rounded-xl text-center"><div class="text-[10px] font-label-caps text-on-surface-variant">200-DAY</div><div class="text-xl font-data-lg ${this.pctColor(d.currentPctAbove200d)} panel-stat-lg">${d.currentPctAbove200d.toFixed(1)}%</div></div>
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs"><span class="text-on-surface-variant">20d SMA</span><span class="text-blue-400">${this.sparkline(h20, '#3b82f6')}</span></div>
        <div class="flex items-center justify-between text-xs"><span class="text-on-surface-variant">50d SMA</span><span class="text-amber-400">${this.sparkline(h50, '#f59e0b')}</span></div>
        <div class="flex items-center justify-between text-xs"><span class="text-on-surface-variant">200d SMA</span><span class="text-green-400">${this.sparkline(h200, '#22c55e')}</span></div>
      </div>`;
    } else {
      body = '<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">No market breadth data available</div>';
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Market Breadth</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${body}`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
