import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface GulfQuote { symbol: string; name: string; price: number; change: number; pctChange: number; currency?: string; }

const DEMO: GulfQuote[] = [
  { symbol: 'TASI', name: 'Saudi Tadawul', price: 12450.3, change: 85.2, pctChange: 0.69, currency: 'SAR' },
  { symbol: 'ADX', name: 'Abu Dhabi', price: 9825.1, change: -42.5, pctChange: -0.43, currency: 'AED' },
  { symbol: 'DFM', name: 'Dubai Financial', price: 4125.8, change: 18.9, pctChange: 0.46, currency: 'AED' },
  { symbol: 'QE', name: 'Qatar Exchange', price: 10890.4, change: 65.3, pctChange: 0.60, currency: 'QAR' },
  { symbol: 'KSE', name: 'Kuwait SE', price: 8125.6, change: -12.4, pctChange: -0.15, currency: 'KWD' },
  { symbol: 'BHB', name: 'Bahrain Bourse', price: 1985.2, change: 5.8, pctChange: 0.29, currency: 'BHD' },
];

const FLAGS: Record<string, string> = { TASI: '\uD83C\uDDF8\uD83C\uDDE6', ADX: '\uD83C\uDDC6\uD83C\uDDEA', DFM: '\uD83C\uDDC6\uD83C\uDDEA', QE: '\uD83C\uDDF6\uD83C\uDDE6', KSE: '\uD83C\uDDF0\uD83C\uDDFC', BHB: '\uD83C\uDDE7\uD83C\uDDED' };

export class GulfEconomiesPanel {
  private container: HTMLElement;
  private quotes: GulfQuote[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'gulf-economies', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/market/v1/list-gulf-quotes`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || !d.quotes?.length) throw new Error('unavailable');
        return d.quotes.map((q: { symbol: string; name: string; price: number; change: number; currency?: string }) => ({
          symbol: q.symbol,
          name: q.name,
          price: q.price,
          change: q.change,
          pctChange: q.price && q.change ? Math.round((q.change / (q.price - q.change)) * 100 * 100) / 100 : 0,
          currency: q.currency || q.symbol,
        })) as GulfQuote[];
      },
      (data) => Array.isArray(data),
    );
    this.quotes = data;
    this.source = source;
  }

  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private chgIcon(v: number): string { return v > 0 ? '\u25B2' : v < 0 ? '\u25BC' : '\u2013'; }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Gulf Economies</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="grid grid-cols-2 gap-2 panel-grid-inner" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.quotes.map((q, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center gap-1.5 mb-2">
              <span class="text-sm">${FLAGS[q.symbol] ?? '\uD83C\uDFDB\uFE0F'}</span>
              <span class="text-[10px] font-label-caps text-on-surface-variant">${q.symbol}</span>
            </div>
            <div class="text-sm font-data-lg text-on-surface mb-0.5">${q.price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '\u2014'}</div>
            <div class="text-[10px] font-data-md ${this.chgColor(q.pctChange)}">${this.chgIcon(q.pctChange)} ${q.pctChange > 0 ? '+' : ''}${q.pctChange?.toFixed(2)}%</div>
            <div class="text-[9px] font-data-md text-on-surface-variant/60 mt-1">${q.currency}</div>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
