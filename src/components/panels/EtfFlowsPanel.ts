import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface EtfFlow {
  ticker: string;
  name: string;
  flow: number;
  price: number;
  change: number;
}

const DEMO: EtfFlow[] = [
  { ticker: 'SPY', name: 'SPDR S&P 500', flow: 4.2, price: 512.35, change: 0.82 },
  { ticker: 'QQQ', name: 'Invesco Nasdaq 100', flow: 2.8, price: 438.21, change: 1.15 },
  { ticker: 'IWM', name: 'iShares Russell 2000', flow: -0.5, price: 204.88, change: -0.32 },
  { ticker: 'GLD', name: 'SPDR Gold Shares', flow: 1.1, price: 218.42, change: 0.65 },
  { ticker: 'XLE', name: 'Energy Select SPDR', flow: 0.3, price: 86.54, change: -0.18 },
];

export class EtfFlowsPanel {
  private container: HTMLElement;
  private etfs: EtfFlow[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'etf-flows', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/market/v1/list-etf-flows`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || !d.etfs?.length) throw new Error('unavailable');
        return d.etfs.map((e: { ticker: string; issuer?: string; price: number; priceChange?: number; estFlow?: number }) => ({
          ticker: e.ticker,
          name: e.issuer || e.ticker,
          flow: e.estFlow != null ? Math.round(e.estFlow * 10) / 10 : 0,
          price: e.price,
          change: e.priceChange != null ? Math.round(e.priceChange * 100) / 100 : 0,
        })) as EtfFlow[];
      },
      (data) => Array.isArray(data),
    );
    this.etfs = data;
    this.source = source;
  }

  private flowColor(v: number): string { return v > 0 ? 'text-primary' : 'text-error'; }
  private flowBarW(v: number): number { return Math.min(Math.abs(v) / 5 * 100, 100); }
  private flowBarC(v: number): string { return v > 0 ? 'bg-primary/60' : 'bg-error/60'; }
  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }

  render(): void {
    const totalFlow = this.etfs.reduce((s, e) => s + e.flow, 0);

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">ETF Flows</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all mb-3" style="animation: fadeInUp 0.3s ease-out;">
        <div class="text-[10px] font-label-caps text-on-surface-variant">WEEKLY NET FLOW</div>
        <div class="text-2xl font-data-lg ${totalFlow >= 0 ? 'text-primary' : 'text-error'} panel-stat">${totalFlow >= 0 ? '+' : ''}$${totalFlow.toFixed(1)}B</div>
      </div>

      <div class="flex flex-col gap-1.5" style="max-height: calc(100% - 100px); overflow-y: auto;">
        ${this.etfs.map((etf, i) => `
          <div class="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <div>
                <span class="text-xs font-data-md text-on-surface font-bold">${etf.ticker}</span>
                <span class="text-[10px] font-data-md text-on-surface-variant/60 ml-1.5 hidden sm:inline">${etf.name}</span>
              </div>
              <span class="text-sm font-data-md ${this.flowColor(etf.flow)} panel-stat">${etf.flow >= 0 ? '+' : ''}$${Math.abs(etf.flow).toFixed(1)}B</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mb-1">
              <div class="${this.flowBarC(etf.flow)} h-1.5 rounded-full" style="width: ${this.flowBarW(etf.flow)}%"></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-data-md text-on-surface-variant">$${etf.price.toFixed(2)}</span>
              <span class="text-[10px] font-data-md ${this.chgColor(etf.change)}">${etf.change > 0 ? '+' : ''}${etf.change.toFixed(2)}%</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
