import { fetchMultipleStocks, fetchCommodityQuotes, type MarketFetchResult } from '@/services/market';
import { fetchFredData, type FredSeries } from '@/services/economic';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface BriefSection {
  category: string;
  items: Array<{ label: string; value: string; color?: string }>;
}

interface MarketBriefData {
  spy: { price: number; change: number } | null;
  vix: { price: number; change: number } | null;
  brent: { price: number; change: number } | null;
  gold: { price: number; change: number } | null;
  tenYear: { value: number | null } | null;
  twoYear: { value: number | null } | null;
}

function generateBrief(data: MarketBriefData): { stance: string; stanceColor: string; narrative: string; sections: BriefSection[] } {
  const vix = data.vix?.price ?? 18;
  const brentChange = data.brent?.change ?? 0;
  const yield10y = data.tenYear?.value ?? 4.25;
  const yield2y = data.twoYear?.value ?? 4.65;
  const spread = (yield10y - yield2y);

  let stance = 'Neutral';
  let stanceColor = 'text-orange-400';
  let narrative = '';

  if (vix < 15 && spread > 0 && brentChange <= 0) {
    stance = 'Bullish';
    stanceColor = 'text-primary';
    narrative = 'Low volatility, positive yield curve, and falling oil suggest risk-on positioning. Growth sectors favored.';
  } else if (vix > 20 || spread < -0.3 || brentChange > 2) {
    stance = 'Defensive';
    stanceColor = 'text-error';
    narrative = 'Elevated VIX or inverted yield curve signals caution. Consider reducing exposure to cyclicals and adding safe havens.';
  } else {
    narrative = 'Mixed signals across volatility, rates, and energy. Maintain diversified positioning with selective exposure.';
  }

  const sections: BriefSection[] = [];

  sections.push({
    category: 'SENTIMENT',
    items: [
      { label: 'Stance', value: stance, color: stanceColor },
      { label: 'VIX', value: vix.toFixed(1), color: vix > 20 ? 'text-error' : vix < 15 ? 'text-primary' : 'text-orange-400' },
      { label: 'S&P 500', value: data.spy ? `$${data.spy.price.toFixed(2)}` : 'N/A', color: (data.spy?.change ?? 0) >= 0 ? 'text-primary' : 'text-error' },
    ],
  });

  sections.push({
    category: 'ENERGY',
    items: [
      { label: 'Brent Crude', value: data.brent ? `$${data.brent.price.toFixed(2)}` : 'N/A' },
      { label: 'Oil 24h Change', value: `${brentChange >= 0 ? '+' : ''}${brentChange.toFixed(2)}%`, color: brentChange >= 0 ? 'text-error' : 'text-primary' },
      { label: 'Gold', value: data.gold ? `$${data.gold.price.toFixed(2)}` : 'N/A' },
    ],
  });

  sections.push({
    category: 'RATES',
    items: [
      { label: '10Y Yield', value: yield10y !== null ? `${yield10y.toFixed(2)}%` : 'N/A' },
      { label: '2Y Yield', value: yield2y !== null ? `${yield2y.toFixed(2)}%` : 'N/A' },
      { label: '10Y-2Y Spread', value: `${spread >= 0 ? '+' : ''}${spread.toFixed(2)}%`, color: spread >= 0 ? 'text-primary' : 'text-error' },
    ],
  });

  return { stance, stanceColor, narrative, sections };
}

export class DailyMarketBriefPanel {
  private container: HTMLElement;
  private stance = 'Neutral';
  private stanceColor = 'text-orange-400';
  private narrative = '';
  private sections: BriefSection[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const DEMO_BRIEF: MarketBriefData = {
      spy: { price: 544.72, change: 0.32 },
      vix: { price: 14.2, change: -0.8 },
      brent: { price: 82.15, change: -0.5 },
      gold: { price: 2340.3, change: 0.4 },
      tenYear: { value: 4.25 },
      twoYear: { value: 4.65 },
    };
    const DEMO_SECTIONS: BriefSection[] = [
      { category: 'STATUS', items: [{ label: 'Data', value: 'Unavailable', color: 'text-on-surface-variant' }] },
    ];
    const fallback: MarketBriefData = DEMO_BRIEF;

    const result = await fetchPanelData(
      { name: 'daily-market-brief', fallback},
      async () => {
        const [stocksResult, commoditiesResult, fredResult] = await Promise.allSettled([
          fetchMultipleStocks([
            { symbol: 'SPY', name: 'S&P 500', display: 'SPY' },
            { symbol: '^VIX', name: 'VIX', display: 'VIX' },
          ]),
          fetchCommodityQuotes([
            { symbol: 'BZ=F', name: 'Brent', display: 'Brent Crude' },
            { symbol: 'GC=F', name: 'Gold', display: 'Gold' },
          ]),
          fetchFredData(),
        ]);

        const data: MarketBriefData = { spy: null, vix: null, brent: null, gold: null, tenYear: null, twoYear: null };

        if (stocksResult.status === 'fulfilled') {
          const res = stocksResult.value as MarketFetchResult;
          for (const q of res.data) {
            if (q.symbol === 'SPY') data.spy = { price: q.price ?? 0, change: q.change ?? 0 };
            if (q.symbol === '^VIX') data.vix = { price: q.price ?? 0, change: q.change ?? 0 };
          }
        }

        if (commoditiesResult.status === 'fulfilled') {
          const res = commoditiesResult.value as MarketFetchResult;
          for (const q of res.data) {
            if (q.symbol === 'BZ=F') data.brent = { price: q.price ?? 0, change: q.change ?? 0 };
            if (q.symbol === 'GC=F') data.gold = { price: q.price ?? 0, change: q.change ?? 0 };
          }
        }

        if (fredResult.status === 'fulfilled') {
          const series = fredResult.value as FredSeries[];
          for (const s of series) {
            if (s.id === 'DGS10') data.tenYear = { value: s.value };
            if (s.id === 'DGS2') data.twoYear = { value: s.value };
          }
        }

        return data;
      },
      (data) => data.spy !== null || data.vix !== null,
    );
    this.source = result.source;
    const brief = generateBrief(result.data);
    this.stance = brief.stance;
    this.stanceColor = brief.stanceColor;
    this.narrative = brief.narrative;
    this.sections = brief.sections;
    if (this.sections.length === 0) {
      this.stance = 'Neutral';
      this.stanceColor = 'text-on-surface-variant';
      this.narrative = 'No live market data available. Connect to a data source for real-time analysis.';
      this.sections = DEMO_SECTIONS;
    }
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Daily Market Brief</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="text-[10px] font-data-md text-on-surface-variant">${new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl mb-4 text-center hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DAILY STANCE</div>
        <div class="text-lg font-data-lg ${this.stanceColor} panel-stat">${this.stance}</div>
        <div class="text-[11px] text-on-surface-variant font-body-sm mt-2 leading-relaxed">${this.narrative}</div>
      </div>
      <div class="flex flex-col panel-list" style="max-height: calc(100% - 140px); overflow-y: auto;">
        ${this.sections.map((s, si) => `
          <div class="mb-3">
            <div class="text-[10px] font-label-caps text-primary mb-2 tracking-widest">${s.category}</div>
            <div class="flex flex-col gap-0.5">
              ${s.items.map((it, ii) => `
                <div class="flex justify-between items-center py-1.5" style="animation: fadeInUp 0.3s ease-out ${0.05 * (si * 3 + ii)}s both;">
                  <span class="text-xs text-on-surface-variant font-body-sm">${it.label}</span>
                  <span class="text-xs font-data-md ${it.color || 'text-on-surface'}">${it.value}</span>
                </div>
              `).join('')}
            </div>
            ${si < this.sections.length - 1 ? '<div class="w-full h-px bg-white/5 mt-3"></div>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
