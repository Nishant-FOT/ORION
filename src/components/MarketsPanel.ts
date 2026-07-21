import { fetchCommodityQuotes, fetchMultipleStocks } from '@/services/market';

interface MarketItem {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changePercent: number;
}

export class MarketsPanel {
  private container: HTMLElement;
  private items: MarketItem[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    try {
      // Fetch commodities (oil, gas)
      const commodityResult = await fetchCommodityQuotes([
        { symbol: 'BZ=F', name: 'BRENT', display: 'Brent Crude' },
        { symbol: 'CL=F', name: 'WTI', display: 'WTI Crude' },
        { symbol: 'NG=F', name: 'NATGAS', display: 'Natural Gas' },
      ]);

      if (commodityResult.data) {
        this.items = commodityResult.data.map(q => ({
          symbol: q.symbol,
          name: q.display || q.symbol,
          exchange: this.getExchange(q.symbol),
          price: q.price ?? 0,
          changePercent: q.change ?? 0,
        }));
      }

      // Also fetch S&P Energy sector
      const sectorResult = await fetchMultipleStocks([{ symbol: 'XLE', name: 'XLE', display: 'S&P 500 ENERGY' }]);
      if (sectorResult.data) {
        for (const s of sectorResult.data) {
          this.items.push({
            symbol: 'XLE',
            name: 'S&P 500 ENERGY',
            exchange: 'Sector Index',
            price: s.price ?? 0,
            changePercent: s.change ?? 0,
          });
        }
      }
    } catch (err) {
      console.warn('[MarketsPanel] Failed to fetch data:', err);
      // Use fallback static data
      this.items = [
        { symbol: 'BZ=F', name: 'BRENT', exchange: 'ICE Futures', price: 84.50, changePercent: 1.2 },
        { symbol: 'CL=F', name: 'WTI', exchange: 'NYMEX', price: 80.12, changePercent: 0.8 },
        { symbol: 'NG=F', name: 'NATGAS', exchange: 'Henry Hub', price: 2.45, changePercent: -0.4 },
        { symbol: 'XLE', name: 'S&P 500 ENERGY', exchange: 'Sector Index', price: 682.10, changePercent: 1.5 },
      ];
    }
  }

  private getExchange(symbol: string): string {
    const exchanges: Record<string, string> = {
      'BZ=F': 'ICE Futures',
      'CL=F': 'NYMEX',
      'NG=F': 'Henry Hub',
    };
    return exchanges[symbol] || 'Exchange';
  }

  render(): void {
    const marketsHtml = this.items.map((item, i) => {
      const isPositive = item.changePercent >= 0;
      const changeClass = isPositive ? 'text-primary' : 'text-error';
      const arrowIcon = isPositive ? 'arrow_upward' : 'arrow_downward';
      const changeStr = `${isPositive ? '+' : ''}${item.changePercent.toFixed(1)}%`;
      const delay = 0.5 + i * 0.1;

      return `
        <div class="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-md opacity-0 animate-fade-in-up" style="animation-delay: ${delay}s;">
          <div>
            <div class="text-on-surface text-base group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300">${item.name}</div>
            <div class="text-xs text-on-surface-variant mt-0.5 group-hover:translate-x-1 duration-300">${item.exchange}</div>
          </div>
          <div class="text-right">
            <div class="text-on-surface text-lg shimmer-bg inline-block group-hover:text-primary transition-colors">$${item.price.toFixed(2)}</div>
            <div class="text-xs ${changeClass} flex items-center justify-end gap-1 mt-0.5 group-hover:scale-110 transition-transform origin-right">
              <span class="material-symbols-outlined text-xs">${arrowIcon}</span> ${changeStr}
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Markets</h3>
        <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors hover:scale-110 cursor-pointer">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">show_chart</span>
        </div>
      </div>
      <div class="flex flex-col gap-2 font-data-md">
        ${marketsHtml}
        <div class="w-full h-px bg-white/5 my-2"></div>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
