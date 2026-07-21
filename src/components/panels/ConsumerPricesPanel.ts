import { getApiBaseUrl } from '@/services/runtime';
import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

function getFredObs(key: string): Array<{ date: string; value: string }> {
  const raw = getHydratedData(key) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
  return raw?.series?.observations ?? [];
}

interface PriceData { category: string; current: number; change: number; changePct: number; unit: string; period?: string; }
interface MoverData { name: string; change: number; current: number; }
interface SpreadData { retailer: string; spread: number; avgSpread: number; }

type Tab = 'overview' | 'categories' | 'movers' | 'spreads';

const DEMO_PRICES: PriceData[] = [
  { category: 'CPI (All Urban Consumers)', current: 314.2, change: 0.4, changePct: 0.13, unit: ' index', period: 'Jun 2026' },
  { category: 'Core CPI (Less Food & Energy)', current: 321.8, change: 0.3, changePct: 0.09, unit: ' index', period: 'Jun 2026' },
  { category: 'Gasoline (Regular)', current: 3.42, change: 0.08, changePct: 2.4, unit: '/gal', period: 'Jun 2026' },
  { category: 'Electricity (Residential)', current: 0.164, change: 0.002, changePct: 1.2, unit: '/kWh', period: 'Jun 2026' },
];

const DEMO_MOVERS: MoverData[] = [
  { name: 'Eggs', change: 8.2, current: 4.89 },
  { name: 'Beef', change: 3.1, current: 7.99 },
  { name: 'Bananas', change: -1.4, current: 0.68 },
  { name: 'Milk', change: 0.5, current: 4.29 },
];

const DEMO_SPREADS: SpreadData[] = [
  { retailer: 'Whole Foods', spread: 12.4, avgSpread: 9.8 },
  { retailer: 'Trader Joe\'s', spread: 6.2, avgSpread: 9.8 },
  { retailer: 'Kroger', spread: 8.7, avgSpread: 9.8 },
  { retailer: 'Walmart', spread: 5.1, avgSpread: 9.8 },
];

export class ConsumerPricesPanel {
  private container: HTMLElement;
  private activeTab: Tab = 'overview';
  private overview: PriceData[] = [];
  private categories: PriceData[] = [];
  private movers: MoverData[] = [];
  private spreads: SpreadData[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchAll(); this.render(); }

  private async fetchAll(): Promise<void> {
    const allData = await fetchPanelData(
      { name: 'Consumer Prices', fallback: { overview: DEMO_PRICES, categories: DEMO_PRICES, movers: DEMO_MOVERS, spreads: DEMO_SPREADS }},
      async () => {
        try {
          const base = getApiBaseUrl() || '';
          const [ovRes, catRes, movRes, sprRes] = await Promise.allSettled([
            fetch(`${base}/api/consumer-prices/v1/get-consumer-price-overview`),
            fetch(`${base}/api/consumer-prices/v1/list-consumer-price-categories`),
            fetch(`${base}/api/consumer-prices/v1/list-consumer-price-movers`),
            fetch(`${base}/api/consumer-prices/v1/list-retailer-price-spreads`),
          ]);
          let gotLive = false;
          const overview: PriceData[] = [];
          const categories: PriceData[] = [];
          const movers: MoverData[] = [];
          const spreads: SpreadData[] = [];
          if (ovRes.status === 'fulfilled' && ovRes.value.ok) {
            const d = await ovRes.value.json();
            if (!d.unavailable && d.prices?.length) { overview.push(...d.prices); gotLive = true; }
          }
          if (catRes.status === 'fulfilled' && catRes.value.ok) {
            const d = await catRes.value.json();
            if (!d.unavailable && d.categories?.length) { categories.push(...d.categories); gotLive = true; }
          }
          if (movRes.status === 'fulfilled' && movRes.value.ok) {
            const d = await movRes.value.json();
            if (!d.unavailable && d.movers?.length) { movers.push(...d.movers); gotLive = true; }
          }
          if (sprRes.status === 'fulfilled' && sprRes.value.ok) {
            const d = await sprRes.value.json();
            if (!d.unavailable && d.spreads?.length) { spreads.push(...d.spreads); gotLive = true; }
          }
          if (gotLive) return { overview, categories, movers, spreads };
        } catch { /* fall through to FRED */ }

        try {
          const cpiAll = getFredObs('fredCpi');

          const overview: PriceData[] = [];
          const categories: PriceData[] = [];

          if (cpiAll.length >= 2) {
            const latest = cpiAll[0]!;
            const previous = cpiAll[1]!;
            const latestVal = parseFloat(latest.value);
            const prevVal = parseFloat(previous.value);
            const change = latestVal - prevVal;
            const changePct = prevVal !== 0 ? (change / prevVal) * 100 : 0;
            overview.push({ category: 'CPI (All Urban Consumers)', current: latestVal, change, changePct, unit: ' index', period: latest.date });
            categories.push({ category: 'All Items', current: latestVal, change, changePct, unit: '%', period: `MoM: ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%` });
          }

          const movers: MoverData[] = [];
          try {
            const commodityData = getHydratedData('commodityQuotes') as any;
            const quotes: Array<{ name: string; change: number; current: number }> = commodityData?.quotes ?? [];
            if (quotes.length > 0) {
              movers.push(...quotes.map(q => ({ name: q.name, change: q.change, current: q.current })));
            }
          } catch { /* commodity movers unavailable */ }

          return { overview, categories, movers, spreads: DEMO_SPREADS };
        } catch { return { overview: DEMO_PRICES, categories: DEMO_PRICES, movers: DEMO_MOVERS, spreads: DEMO_SPREADS }; }
      },
      (_data) => true,
    );
    this.overview = allData.data.overview;
    this.categories = allData.data.categories;
    this.movers = allData.data.movers;
    this.spreads = allData.data.spreads;
    this.source = allData.source;
  }

  private chgColor(v: number): string { return v > 0 ? 'text-error' : v < 0 ? 'text-primary' : 'text-on-surface-variant'; }

  private switchTab(tab: Tab): void { this.activeTab = tab; this.render(); }

  private renderOverview(): string {
    return this.overview.map((p, i) => `
      <div class="flex items-center justify-between p-2 bg-white/5 rounded-lg" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
        <span class="text-xs text-on-surface font-body-sm panel-body">${p.category}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs font-data-md text-on-surface">${p.current?.toFixed(1)}${p.unit}</span>
          <span class="text-[10px] font-data-md ${this.chgColor(p.changePct)}">${p.changePct > 0 ? '+' : ''}${p.changePct?.toFixed(1)}%</span>
        </div>
      </div>`).join('');
  }

  private renderCategories(): string {
    return this.categories.map((c, i) => `
      <div class="p-2 bg-white/5 rounded-lg" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-on-surface font-body-sm panel-body">${c.category}</span>
          <span class="text-[10px] font-data-md ${this.chgColor(c.changePct)}">${c.changePct > 0 ? '+' : ''}${c.changePct?.toFixed(1)}%</span>
        </div>
        <div class="text-[10px] font-data-md text-on-surface-variant">${c.period}</div>
      </div>`).join('');
  }

  private renderMovers(): string {
    return this.movers.map((m, i) => `
      <div class="flex items-center justify-between p-2 bg-white/5 rounded-lg" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
        <span class="text-xs text-on-surface font-body-sm panel-body">${m.name}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs font-data-md text-on-surface">$${m.current?.toFixed(2)}</span>
          <span class="text-[10px] font-data-md ${this.chgColor(m.change)}">${m.change > 0 ? '+' : ''}${m.change?.toFixed(1)}%</span>
        </div>
      </div>`).join('');
  }

  private renderSpreads(): string {
    return this.spreads.map((s, i) => `
      <div class="p-2 bg-white/5 rounded-lg" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-on-surface font-body-sm panel-body">${s.retailer}</span>
          <span class="text-xs font-data-md ${s.spread > s.avgSpread ? 'text-yellow-400' : 'text-primary'}">${s.spread?.toFixed(1)}%</span>
        </div>
        <div class="w-full bg-white/5 rounded-full h-1"><div class="bg-primary/60 h-1 rounded-full" style="width: ${Math.min((s.spread / 30) * 100, 100)}%"></div></div>
        <div class="text-[9px] font-data-md text-on-surface-variant mt-1">Avg: ${s.avgSpread?.toFixed(1)}%</div>
      </div>`).join('');
  }

  render(): void {
    const tabs: Array<{ id: Tab; label: string }> = [
      { id: 'overview', label: 'Overview' }, { id: 'categories', label: 'Categories' },
      { id: 'movers', label: 'Movers' }, { id: 'spreads', label: 'Spreads' },
    ];
    const hasData = this.overview.length > 0 || this.categories.length > 0;
    const content = !hasData ? '<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">No consumer price data available</div>'
      : this.activeTab === 'overview' ? this.renderOverview()
      : this.activeTab === 'categories' ? this.renderCategories()
      : this.activeTab === 'movers' ? this.renderMovers() : this.renderSpreads();

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Consumer Prices</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex gap-1 mb-3 flex-wrap">${tabs.map(t => `
        <button class="px-2 py-1 text-[10px] font-label-caps rounded-lg transition-all ${this.activeTab === t.id ? 'bg-primary/15 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5 border border-transparent'}" data-cp-tab="${t.id}">${t.label}</button>
      `).join('')}</div>
      <div class="flex flex-col gap-1.5 panel-list" style="max-height: calc(100% - 110px); overflow-y: auto;">${content}</div>`;

    this.container.querySelectorAll('[data-cp-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-cp-tab') as Tab));
    });
  }

  destroy(): void { this.container.innerHTML = ''; }
}
