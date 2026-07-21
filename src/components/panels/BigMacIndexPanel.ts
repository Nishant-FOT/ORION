import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface BigMacEntry {
  country: string;
  currency: string;
  price: number;
  impliedRate: number;
  actualRate: number;
  valuation: number;
}

const DEMO: BigMacEntry[] = [
  { country: 'United States', currency: 'USD', price: 5.69, impliedRate: 1.0, actualRate: 1.0, valuation: 0 },
  { country: 'Euro Area', currency: 'EUR', price: 4.65, impliedRate: 0.817, actualRate: 0.921, valuation: -12 },
  { country: 'United Kingdom', currency: 'GBP', price: 3.79, impliedRate: 0.666, actualRate: 0.792, valuation: -18 },
  { country: 'Japan', currency: 'JPY', price: 450, impliedRate: 79.1, actualRate: 157.2, valuation: -50 },
  { country: 'China', currency: 'CNY', price: 24.4, impliedRate: 4.29, actualRate: 7.25, valuation: -41 },
  { country: 'India', currency: 'INR', price: 229, impliedRate: 40.2, actualRate: 83.4, valuation: -52 },
  { country: 'Brazil', currency: 'BRL', price: 22.9, impliedRate: 4.02, actualRate: 5.81, valuation: -31 },
  { country: 'Switzerland', currency: 'CHF', price: 6.72, impliedRate: 1.18, actualRate: 0.893, valuation: 24 },
];

export class BigMacIndexPanel {
  static readonly defaultEnabled = false;
  private container: HTMLElement;
  private entries: BigMacEntry[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'big-mac', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/economic/v1/list-bigmac-prices`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || !d.countries?.length) throw new Error('unavailable');
        const usEntry = d.countries.find((c: { name: string }) => c.name === 'United States');
        const usPrice = usEntry?.localPrice || 5.69;
        return d.countries.map((c: { name: string; localPrice: number; usdPrice: number; fxRate: number; wowPct: number }) => ({
          country: c.name,
          currency: c.name === 'United States' ? 'USD' : c.name.substring(0, 3).toUpperCase(),
          price: c.localPrice,
          impliedRate: c.usdPrice > 0 ? Math.round((c.localPrice / usPrice) * 1000) / 1000 : 1,
          actualRate: c.fxRate || 1,
          valuation: c.wowPct != null ? Math.round(c.wowPct * 10) / 10 : 0,
        })) as BigMacEntry[];
      },
      (data) => Array.isArray(data),
    );
    this.entries = data;
    this.source = source;
  }

  private valColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private valBg(v: number): string { return v > 0 ? 'bg-primary/60' : v < 0 ? 'bg-error/60' : 'bg-on-surface-variant/30'; }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Big Mac Index</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="flex flex-col gap-1.5" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.entries.map((e, i) => `
          <div class="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.03 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <div>
                <span class="text-xs font-data-md text-on-surface font-bold">${e.country}</span>
                <span class="text-[10px] font-data-md text-on-surface-variant/60 ml-1.5">${e.currency}</span>
              </div>
              <span class="text-xs font-data-md text-on-surface panel-stat">${e.currency === 'USD' ? '$' : e.currency === 'EUR' ? '\u20AC' : e.currency === 'GBP' ? '\u00A3' : e.currency === 'JPY' ? '\u00A5' : ''}${e.price.toLocaleString()}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-data-md text-on-surface-variant">Implied: ${e.impliedRate.toFixed(2)}</span>
                <span class="text-[10px] font-data-md text-on-surface-variant">Actual: ${e.actualRate.toFixed(2)}</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-12 bg-white/5 rounded-full h-1.5">
                  <div class="${this.valBg(e.valuation)} h-1.5 rounded-full" style="width: ${Math.min(Math.abs(e.valuation), 100)}%"></div>
                </div>
                <span class="text-[10px] font-data-md ${this.valColor(e.valuation)}">${e.valuation > 0 ? '+' : ''}${e.valuation}%</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
