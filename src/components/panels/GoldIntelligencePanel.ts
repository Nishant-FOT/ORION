import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface GoldData {
  price: number;
  realYield: number;
  centralBankBuying: number;
  etfFlows: number;
  priceChange: number;
  dxy: number;
}

const DEMO: GoldData = {
  price: 2342,
  realYield: 2.1,
  centralBankBuying: 1136,
  etfFlows: 48.5,
  priceChange: 18.5,
  dxy: 104.2,
};

export class GoldIntelligencePanel {
  private container: HTMLElement;
  private data: GoldData = DEMO;
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
      { name: 'gold-intelligence', fallback: DEMO},
      async () => {
        const raw = getHydratedData('commodityQuotes') as { commodities?: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }> } | undefined;
        const gold = raw?.commodities?.find(c => c.symbol === 'GC=F' || c.name?.toLowerCase().includes('gold'));
        if (gold && gold.price > 0) {
          return { ...DEMO, price: gold.price, priceChange: gold.change } as GoldData;
        }
        return DEMO as GoldData;
      },
      (d) => d.price > 0,
    );
    this.data = data;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  render(): void {
    const d = this.data;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Gold Intelligence</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all mb-3" style="animation: fadeInUp 0.3s ease-out;">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[10px] font-label-caps text-yellow-400">GOLD SPOT</div>
            <div class="text-3xl font-data-lg text-on-surface panel-stat-lg">$${d.price.toLocaleString()}</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-label-caps text-on-surface-variant">CHANGE</div>
            <div class="text-lg font-data-md ${d.priceChange >= 0 ? 'text-primary' : 'text-error'}">${d.priceChange >= 0 ? '+' : ''}$${Math.abs(d.priceChange).toFixed(1)}</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant">REAL YIELD</div>
          <div class="text-xl font-data-lg ${d.realYield > 2 ? 'text-error' : 'text-primary'} panel-stat">${d.realYield.toFixed(1)}%</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out 0.15s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant">DXY</div>
          <div class="text-xl font-data-lg text-on-surface panel-stat">${d.dxy.toFixed(1)}</div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all mb-2" style="animation: fadeInUp 0.3s ease-out 0.2s both;">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-label-caps text-on-surface-variant">CENTRAL BANK BUYING</span>
          <span class="text-xl font-data-lg text-yellow-400 panel-stat">${d.centralBankBuying.toLocaleString()}<span class="text-[10px] font-data-md text-on-surface-variant ml-1">tons/yr</span></span>
        </div>
        <div class="w-full bg-white/5 rounded-full h-1.5 mt-1">
          <div class="bg-yellow-400/60 h-1.5 rounded-full" style="width: ${Math.min(d.centralBankBuying / 15, 100)}%"></div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out 0.25s both;">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-label-caps text-on-surface-variant">ETF FLOWS</span>
          <span class="text-sm font-data-md ${d.etfFlows >= 0 ? 'text-primary' : 'text-error'}">${d.etfFlows >= 0 ? '+' : ''}$${Math.abs(d.etfFlows).toFixed(1)}B</span>
        </div>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
