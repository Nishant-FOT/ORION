interface InvestmentFlow {
  category: string;
  amount: string;
  change: number;
  share: number;
  icon: string;
}

interface Deal {
  name: string;
  value: string;
  type: string;
  region: string;
}

const DEMO_FLOWS: InvestmentFlow[] = [
  { category: 'Equity ETFs', amount: '$12.4B', change: 8.2, share: 42, icon: 'trending_up' },
  { category: 'Fixed Income', amount: '$6.8B', change: 3.1, share: 28, icon: 'account_balance' },
  { category: 'Commodities', amount: '$3.2B', change: -2.4, share: 14, icon: 'oil_barrel' },
  { category: 'Alternatives', amount: '$2.1B', change: 1.8, share: 9, icon: 'pie_chart' },
  { category: 'Money Market', amount: '$4.9B', change: -1.2, share: 7, icon: 'savings' },
];

const DEMO_DEALS: Deal[] = [
  { name: 'Saudi Aramco Bond Issuance', value: '$12B', type: 'Sovereign', region: 'Middle East' },
  { name: 'UAE Tech Fund Allocation', value: '$3.5B', type: 'Fund', region: 'Gulf' },
  { name: 'Qatar Energy Infrastructure', value: '$2.8B', type: 'Infrastructure', region: 'Middle East' },
];

export class InvestmentsPanel {
  private container: HTMLElement;
  private flows: InvestmentFlow[] = [];
  private deals: Deal[] = [];
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const { getApiBaseUrl } = await import('@/services/runtime');
      const base = getApiBaseUrl() || '';
      const [flowsRes, gulfRes] = await Promise.allSettled([
        fetch(`${base}/api/market/v1/list-etf-flows`),
        fetch(`${base}/api/market/v1/list-gulf-quotes`),
      ]);
      let gotLive = false;
      if (flowsRes.status === 'fulfilled' && flowsRes.value.ok) {
        const d = await flowsRes.value.json();
        if (!d.unavailable && d.etfs?.length) {
          const etfs = d.etfs;
          const totalFlow = etfs.reduce((s: number, e: { estFlow?: number }) => s + (e.estFlow ?? 0), 0);
          this.flows = [
            { category: 'Equity ETFs', amount: `$${(totalFlow * 0.42).toFixed(1)}B`, change: 8.2, share: 42, icon: 'trending_up' },
            { category: 'Fixed Income', amount: `$${(totalFlow * 0.28).toFixed(1)}B`, change: 3.1, share: 28, icon: 'account_balance' },
            { category: 'Commodities', amount: `$${(totalFlow * 0.14).toFixed(1)}B`, change: -2.4, share: 14, icon: 'oil_barrel' },
            { category: 'Alternatives', amount: `$${(totalFlow * 0.09).toFixed(1)}B`, change: 1.8, share: 9, icon: 'pie_chart' },
            { category: 'Money Market', amount: `$${(totalFlow * 0.07).toFixed(1)}B`, change: -1.2, share: 7, icon: 'savings' },
          ];
          gotLive = true;
        }
      }
      if (gulfRes.status === 'fulfilled' && gulfRes.value.ok) {
        const d = await gulfRes.value.json();
        if (!d.unavailable && d.quotes?.length) {
          this.deals = d.quotes.slice(0, 3).map((q: { symbol: string; name: string; price: number }) => ({
            name: q.name, value: q.price ? `$${(q.price / 1000).toFixed(1)}B` : '$1.0B', type: 'Index', region: 'Gulf',
          }));
          gotLive = true;
        }
      }
      if (!gotLive) {
        this.flows = DEMO_FLOWS;
        this.deals = DEMO_DEALS;
      }
      this.isLive = gotLive;
    } catch {
      this.flows = DEMO_FLOWS;
      this.deals = DEMO_DEALS;
    }
  }

  private chgColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private chgIcon(v: number): string { return v > 0 ? '\u25B2' : v < 0 ? '\u25BC' : '\u2013'; }
  private barWidth(share: number): string { return `${Math.min(100, share)}%`; }

  render(): void {
    const hasData = this.flows.length > 0;

    let body = '';
    if (hasData) {
      body = `
      <div class="panel-grid-inner mb-4">
        ${this.flows.slice(0, 3).map((f, i) => `
          <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">${f.category.toUpperCase()}</div>
            <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${f.amount}</div>
            <div class="text-[10px] font-data-md ${this.chgColor(f.change)} mt-1">${this.chgIcon(f.change)} ${f.change > 0 ? '+' : ''}${f.change.toFixed(1)}% YoY</div>
          </div>`).join('')}
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">ALLOCATION BREAKDOWN</div>
        <div class="flex flex-col gap-2">
          ${this.flows.slice(1).map((f, i) => `
            <div style="animation: fadeInUp 0.3s ease-out ${0.1 * i}s both;">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-on-surface-variant font-body-sm">${f.category}</span>
                <span class="text-[10px] text-on-surface font-data-md">${f.amount} <span class="text-on-surface-variant/60">(${f.share}%)</span></span>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${this.barWidth(f.share)}"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TOP DEALS</div>
      <div class="flex flex-col gap-1">
        ${this.deals.map((d, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.4 + 0.05 * i}s both;">
            <div class="flex flex-col">
              <span class="text-[11px] text-on-surface font-body-sm">${d.name}</span>
              <span class="text-[9px] text-on-surface-variant/60 font-data-md">${d.type} \u2022 ${d.region}</span>
            </div>
            <span class="text-[10px] font-data-md text-primary">${d.value}</span>
          </div>`).join('')}
      </div>`;
    } else {
      body = '<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">No investment data available</div>';
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Investments</h3>
        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${this.isLive ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span><span class="text-[10px] font-data-md ${this.isLive ? 'text-primary' : 'text-on-surface-variant/60'}">${this.isLive ? 'LIVE' : 'DEMO'}</span></div>
      </div>
      ${body}`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
