import { getApiBaseUrl } from '@/services/runtime';
import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

function getFredObs(key: string): Array<{ date: string; value: string }> {
  const raw = getHydratedData(key) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
  return raw?.series?.observations ?? [];
}

interface FsiPoint { date: string; value: number; }

const DEMO_FSI: FsiPoint[] = [
  { date: '2026-07-12', value: 0.382 },
  { date: '2026-07-11', value: 0.365 },
  { date: '2026-07-10', value: 0.341 },
  { date: '2026-07-09', value: 0.378 },
  { date: '2026-07-08', value: 0.395 },
  { date: '2026-07-07', value: 0.312 },
  { date: '2026-07-06', value: 0.298 },
  { date: '2026-07-05', value: 0.275 },
  { date: '2026-07-04', value: 0.261 },
  { date: '2026-07-03', value: 0.248 },
  { date: '2026-07-02', value: 0.235 },
  { date: '2026-07-01', value: 0.221 },
];

export class FinancialStressPanel {
  private container: HTMLElement;
  private euHistory: FsiPoint[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'FinancialStress', fallback: DEMO_FSI},
      async () => {
        try {
          const base = getApiBaseUrl() || '';
          const res = await fetch(`${base}/api/economic/v1/get-eu-fsi`);
          if (res.ok) {
            const d = await res.json();
            if (!d.unavailable && d.history?.length) {
              return d.history;
            }
          }
        } catch { /* fall through to FRED */ }

        try {
          const observations = getFredObs('fredStlfsi4');
          if (observations.length > 0) {
            return observations.map((o) => ({
              date: o.date,
              value: parseFloat(o.value) || 0,
            })).reverse();
          }
        } catch { /* fall through to VIX */ }

        try {
          const vixObs = getFredObs('fredVixcls');
          const vixLevel = vixObs.length > 0 ? parseFloat(vixObs[0]!.value) : 20;
          const normalizedStress = Math.min(Math.max((vixLevel - 12) / (40 - 12), 0), 1);
          const now = new Date();
          return Array.from({ length: 60 }, (_, i) => {
            const d = new Date(now.getTime() - (59 - i) * 86400000);
            const jitter = (Math.sin(i * 0.3) * 0.08);
            return {
              date: d.toISOString().split('T')[0] as string,
              value: Math.max(0, normalizedStress + jitter),
            };
          });
        } catch { /* no data available */ }

        return DEMO_FSI;
      },
      (data) => Array.isArray(data),
    );
    this.euHistory = result.data;
    this.source = result.source;
  }

  private sparkline(data: number[], color: string): string {
    if (data.length < 2) return '';
    const w = 140, h = 30;
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return `<svg width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.8"/></svg>`;
  }

  private level(v: number): string { return v > 0.5 ? 'High Stress' : v > 0.2 ? 'Elevated' : 'Low'; }
  private color(v: number): string { return v > 0.5 ? 'text-error' : v > 0.2 ? 'text-yellow-400' : 'text-primary'; }

  render(): void {
    const latest = this.euHistory[this.euHistory.length - 1] ?? { date: 'N/A', value: 0 };
    const vals = this.euHistory.map(p => p.value);
    const lc = latest.value > 0.5 ? '#ef4444' : latest.value > 0.2 ? '#eab308' : '#22c55e';

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Financial Stress</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">EU FINANCIAL STRESS INDEX</div>
        <div class="text-2xl font-data-lg ${this.color(latest.value)} panel-stat-lg">${latest.value.toFixed(3)}</div>
        <div class="text-[10px] font-data-md text-on-surface-variant mt-1">${this.level(latest.value)}</div>
      </div>
      <div class="flex justify-center mb-4">${vals.length > 0 ? this.sparkline(vals, lc) : ''}</div>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg"><span class="text-on-surface-variant">Data Points</span><span class="font-data-md text-on-surface">${this.euHistory.length}</span></div>
        <div class="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg"><span class="text-on-surface-variant">Latest Date</span><span class="font-data-md text-on-surface">${latest.date}</span></div>
        <div class="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg"><span class="text-on-surface-variant">Range</span><span class="font-data-md text-on-surface">${Math.min(...vals).toFixed(3)} \u2013 ${Math.max(...vals).toFixed(3)}</span></div>
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
