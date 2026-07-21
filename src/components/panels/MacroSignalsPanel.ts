import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface SignalData { status: string; value?: number; }
interface MacroData { verdict: string; bullishCount: number; totalCount: number; signals: Record<string, SignalData>; }

const DEMO: MacroData = {
  verdict: 'BUY', bullishCount: 5, totalCount: 7,
  signals: {
    liquidity: { status: 'BULLISH', value: 72 },
    flowStructure: { status: 'BULLISH', value: 65 },
    macroRegime: { status: 'NEUTRAL', value: 50 },
    technicalTrend: { status: 'BULLISH', value: 68 },
    hashRate: { status: 'BULLISH', value: 80 },
    priceMomentum: { status: 'BULLISH', value: 70 },
    fearGreed: { status: 'BEARISH', value: 35 },
  },
};

const LABELS: Record<string, string> = {
  liquidity: 'Liquidity', flowStructure: 'Flow Structure', macroRegime: 'Macro Regime',
  technicalTrend: 'Technical Trend', hashRate: 'Hash Rate', priceMomentum: 'Price Momentum', fearGreed: 'Fear & Greed',
};
const ICON: Record<string, string> = { BULLISH: '\u2191', BEARISH: '\u2193', NEUTRAL: '\u2192' };
const COLOR: Record<string, string> = { BULLISH: 'text-primary', BEARISH: 'text-error', NEUTRAL: 'text-yellow-400' };

export class MacroSignalsPanel {
  private container: HTMLElement;
  private data: MacroData = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'macro-signals', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/economic/v1/get-macro-signals`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || !d.verdict || d.verdict === 'UNKNOWN') throw new Error('unavailable');
        return d as MacroData;
      },
      (d) => !!d.verdict && d.verdict !== 'UNKNOWN',
    );
    this.data = data;
    this.source = source;
  }

  render(): void {
    const d = this.data;
    const vColor = d.verdict === 'BUY' ? 'text-primary' : d.verdict === 'SELL' ? 'text-error' : 'text-yellow-400';
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Macro Signals</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">VERDICT</div>
        <div class="text-2xl font-data-lg ${vColor} panel-stat-lg">${d.verdict}</div>
        <div class="text-[10px] font-data-md text-on-surface-variant mt-1">${d.bullishCount}/${d.totalCount} signals bullish</div>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 130px); overflow-y: auto;">
        ${Object.keys(LABELS).map((k, i) => {
          const s = d.signals[k];
          const st = s?.status ?? 'NEUTRAL';
          const icon = ICON[st]; const color = COLOR[st];
          return `<div class="flex items-center justify-between p-2 bg-white/5 rounded-lg" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <span class="text-xs text-on-surface font-body-sm panel-body">${LABELS[k]}</span>
            <div class="flex items-center gap-2"><span class="text-[10px] font-data-md ${color}">${st}</span><span class="text-sm ${color}">${icon}</span></div>
          </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
