import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const INDEX_SYMBOLS = [
  { symbol: 'SPY', name: 'S&P 500 ETF', display: 'SPY' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', display: 'QQQ' },
  { symbol: 'DIA', name: 'Dow Jones ETF', display: 'DIA' },
  { symbol: 'IWM', name: 'Russell 2000 ETF', display: 'IWM' },
  { symbol: '^VIX', name: 'Volatility Index', display: 'VIX' },
];

const COMMODITY_SYMBOLS = [
  { symbol: 'CL=F', name: 'WTI Crude', display: 'WTI' },
  { symbol: 'GC=F', name: 'Gold', display: 'Gold' },
  { symbol: 'NG=F', name: 'Natural Gas', display: 'NatGas' },
];

interface MarketCard {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
}

const DEMO_INDICES: MarketCard[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 532.40, change: 1.25, changePercent: 0.24, exchange: 'INDEX' },
  { symbol: 'QQQ', name: 'Nasdaq 100', price: 458.70, change: 2.10, changePercent: 0.46, exchange: 'INDEX' },
  { symbol: 'DIA', name: 'Dow Jones', price: 395.15, change: -0.80, changePercent: -0.20, exchange: 'INDEX' },
  { symbol: 'IWM', name: 'Russell 2000', price: 208.30, change: 0.65, changePercent: 0.31, exchange: 'INDEX' },
  { symbol: '^VIX', name: 'VIX', price: 14.25, change: -0.45, changePercent: -3.06, exchange: 'CBOE' },
];

const DEMO_COMMODITIES: MarketCard[] = [
  { symbol: 'CL=F', name: 'WTI Crude', price: 80.12, change: 0.80, changePercent: 1.01, exchange: 'NYMEX' },
  { symbol: 'GC=F', name: 'Gold', price: 2380.50, change: 7.50, changePercent: 0.32, exchange: 'COMEX' },
  { symbol: 'NG=F', name: 'Natural Gas', price: 2.45, change: -0.04, changePercent: -1.61, exchange: 'Henry Hub' },
];

interface MarketOverviewData {
  indices: MarketCard[];
  commodities: MarketCard[];
}

export class MarketOverviewPanel {
  private container: HTMLElement;
  private indices: MarketCard[] = DEMO_INDICES;
  private commodities: MarketCard[] = DEMO_COMMODITIES;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<MarketOverviewData>(
      { name: 'market-overview', fallback: { indices: DEMO_INDICES, commodities: DEMO_COMMODITIES }},
      async () => {
        const marketRaw = getHydratedData('marketQuotes') as { stocks?: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }> } | undefined;
        const commodityRaw = getHydratedData('commodityQuotes') as { commodities?: Array<{ symbol: string; name: string; price: number; change: number; changePercent: number }> } | undefined;

        const stockList = marketRaw?.stocks ?? [];
        const indices = stockList.length > 0
          ? INDEX_SYMBOLS.map(s => {
              const q = stockList.find(st => st.symbol === s.symbol);
              return {
                symbol: s.symbol,
                name: s.name,
                price: q?.price ?? 0,
                change: q?.change ?? 0,
                changePercent: q?.changePercent ?? 0,
                exchange: s.symbol === '^VIX' ? 'CBOE' : 'INDEX',
              };
            })
          : DEMO_INDICES;

        const commList = commodityRaw?.commodities ?? [];
        const commodities = commList.length > 0
          ? COMMODITY_SYMBOLS.map(s => {
              const q = commList.find(c => c.symbol === s.symbol);
              const ex: Record<string, string> = { 'CL=F': 'NYMEX', 'GC=F': 'COMEX', 'NG=F': 'Henry Hub' };
              return {
                symbol: s.symbol,
                name: s.name,
                price: q?.price ?? 0,
                change: q?.change ?? 0,
                changePercent: q?.changePercent ?? 0,
                exchange: ex[s.symbol] || '',
              };
            })
          : DEMO_COMMODITIES;

        return { indices, commodities };
      },
      (_data) => true,
    );
    this.indices = data.indices;
    this.commodities = data.commodities;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private cardColor(c: MarketCard): string {
    if (c.symbol === '^VIX') return c.change > 0 ? 'text-error' : 'text-primary';
    return c.change >= 0 ? 'text-primary' : 'text-error';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Markets</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2 uppercase tracking-wider">Indices</div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        ${this.indices.map((c, i) => {
          const pos = c.change >= 0;
          const color = this.cardColor(c);
          return `<div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-[10px] text-on-surface-variant font-data-md">${c.exchange}</div>
            <div class="text-on-surface font-body-sm panel-body">${c.name}</div>
            <div class="font-data-md panel-stat-lg ${color}">$${c.price.toFixed(2)}</div>
            <div class="flex items-center gap-1 mt-1">
              <div class="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full ${pos ? 'bg-primary' : 'bg-error'} rounded-full" style="width: ${Math.min(100, Math.abs(c.changePercent) * 10)}%"></div>
              </div>
              <span class="text-[10px] ${pos ? 'text-primary' : 'text-error'} font-data-md">${pos ? '\u2191' : '\u2193'} ${Math.abs(c.changePercent).toFixed(2)}%</span>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2 uppercase tracking-wider">Commodities</div>
      <div class="flex flex-col gap-1 panel-list" style="max-height: 200px; overflow-y: auto;">
        ${this.commodities.map((c, i) => {
          const pos = c.change >= 0;
          return `<div class="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.04 * i}s both;">
            <div>
              <div class="text-xs text-on-surface font-body-sm">${c.name}</div>
              <div class="text-[10px] text-on-surface-variant font-data-md">${c.exchange}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-on-surface font-data-md">$${c.price.toFixed(2)}</div>
              <div class="text-[10px] ${pos ? 'text-primary' : 'text-error'} font-data-md">${pos ? '\u2191' : '\u2193'} ${Math.abs(c.changePercent).toFixed(2)}%</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
