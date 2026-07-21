interface TickerQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  category: 'energy' | 'market' | 'fx' | 'rates' | 'commodity' | 'crypto';
}

const ENERGY_QUOTES: TickerQuote[] = [
  { symbol: 'BRENT', name: 'Brent Crude', price: 84.50, change: 1.02, changePct: 1.22, category: 'energy' },
  { symbol: 'WTI', name: 'WTI Crude', price: 80.12, change: 0.87, changePct: 1.10, category: 'energy' },
  { symbol: 'NG', name: 'Nat Gas', price: 2.87, change: -0.05, changePct: -1.71, category: 'energy' },
  { symbol: 'LNG', name: 'LNG Spot', price: 12.45, change: 0.32, changePct: 2.64, category: 'energy' },
  { symbol: 'HO', name: 'Heating Oil', price: 2.64, change: 0.04, changePct: 1.54, category: 'energy' },
  { symbol: 'RB', name: 'RBOB Gas', price: 2.52, change: -0.02, changePct: -0.79, category: 'energy' },
  { symbol: 'SPR', name: 'US SPR', price: 395.3, change: -1.2, changePct: -0.30, category: 'energy' },
  { symbol: 'OPEC', name: 'OPEC Basket', price: 82.10, change: 0.45, changePct: 0.55, category: 'energy' },
];

const MARKET_QUOTES: TickerQuote[] = [
  { symbol: 'SPX', name: 'S&P 500', price: 5432, change: 28, changePct: 0.52, category: 'market' },
  { symbol: 'NDX', name: 'Nasdaq 100', price: 19210, change: 145, changePct: 0.76, category: 'market' },
  { symbol: 'DJI', name: 'Dow Jones', price: 39872, change: -112, changePct: -0.28, category: 'market' },
  { symbol: 'VIX', name: 'Volatility', price: 14.2, change: -0.8, changePct: -5.33, category: 'market' },
  { symbol: 'NIFTY', name: 'Nifty 50', price: 22340, change: 85, changePct: 0.38, category: 'market' },
  { symbol: 'SENSEX', name: 'BSE Sensex', price: 73648, change: 210, changePct: 0.29, category: 'market' },
];

const FX_QUOTES: TickerQuote[] = [
  { symbol: 'DXY', name: 'US Dollar', price: 104.32, change: 0.18, changePct: 0.17, category: 'fx' },
  { symbol: 'EUR', name: 'EUR/USD', price: 1.0842, change: -0.0024, changePct: -0.22, category: 'fx' },
  { symbol: 'JPY', name: 'USD/JPY', price: 157.82, change: 0.34, changePct: 0.22, category: 'fx' },
  { symbol: 'INR', name: 'USD/INR', price: 83.45, change: 0.12, changePct: 0.14, category: 'fx' },
  { symbol: 'CNY', name: 'USD/CNY', price: 7.24, change: -0.01, changePct: -0.14, category: 'fx' },
];

const RATES_QUOTES: TickerQuote[] = [
  { symbol: 'US10Y', name: '10Y Treasury', price: 4.28, change: 0.03, changePct: 0.71, category: 'rates' },
  { symbol: 'US2Y', name: '2Y Treasury', price: 4.72, change: -0.02, changePct: -0.42, category: 'rates' },
  { symbol: 'US30Y', name: '30Y Treasury', price: 4.52, change: 0.04, changePct: 0.89, category: 'rates' },
  { symbol: 'IN10Y', name: 'India 10Y', price: 7.18, change: 0.01, changePct: 0.14, category: 'rates' },
];

const COMMODITY_QUOTES: TickerQuote[] = [
  { symbol: 'GLD', name: 'Gold', price: 2342, change: 18.5, changePct: 0.80, category: 'commodity' },
  { symbol: 'SLV', name: 'Silver', price: 29.85, change: 0.42, changePct: 1.43, category: 'commodity' },
  { symbol: 'CU', name: 'Copper', price: 4.52, change: 0.08, changePct: 1.80, category: 'commodity' },
  { symbol: 'URA', name: 'Uranium', price: 91.50, change: 2.10, changePct: 2.34, category: 'commodity' },
  { symbol: 'IRON', name: 'Iron Ore', price: 118.20, change: -1.40, changePct: -1.17, category: 'commodity' },
];

const ALL_QUOTES = [
  ...ENERGY_QUOTES,
  ...MARKET_QUOTES,
  ...FX_QUOTES,
  ...RATES_QUOTES,
  ...COMMODITY_QUOTES,
];

export class IntelTicker {
  private container: HTMLElement;
  private quotes: TickerQuote[];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.quotes = [...ALL_QUOTES];
  }

  async init(): Promise<void> {
    this.render();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.quotes.forEach(q => {
        const jitter = (Math.random() - 0.5) * 0.003;
        q.price = +(q.price * (1 + jitter)).toFixed(q.price > 1000 ? 0 : 2);
        q.change = +(q.price * jitter).toFixed(2);
        q.changePct = +(jitter * 100).toFixed(2);
      });
      this.render();
    }, 15000);
  }

  private formatPrice(q: TickerQuote): string {
    if (q.price >= 10000) return q.price.toLocaleString('en-US');
    if (q.price >= 1000) return q.price.toLocaleString('en-US');
    if (q.price < 10) return q.price.toFixed(2);
    return q.price.toFixed(2);
  }

  private categoryColor(cat: string): string {
    switch (cat) {
      case 'energy': return 'bg-emerald-500/20 text-emerald-400';
      case 'market': return 'bg-blue-500/20 text-blue-400';
      case 'fx': return 'bg-purple-500/20 text-purple-400';
      case 'rates': return 'bg-amber-500/20 text-amber-400';
      case 'commodity': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-white/10 text-white/60';
    }
  }

  render(): void {
    const allQuotes = [...this.quotes, ...this.quotes];

    const itemsHtml = allQuotes.map(q => {
      const isUp = q.changePct >= 0;
      const colorClass = isUp ? 'text-emerald-400' : 'text-red-400';
      const sign = isUp ? '+' : '';
      return `
        <div class="ticker-item flex items-center gap-1.5 shrink-0 px-2">
          <span class="text-[9px] font-bold px-1 py-0.5 rounded ${this.categoryColor(q.category)}">${q.symbol}</span>
          <span class="text-white text-[11px] font-semibold">${this.formatPrice(q)}</span>
          <span class="${colorClass} text-[10px] font-semibold">${sign}${q.changePct.toFixed(2)}%</span>
        </div>
        <div class="w-px h-3 bg-white/10 shrink-0"></div>
      `;
    }).join('');

    this.container.innerHTML = `<div class="ticker-track">${itemsHtml}</div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
