import { getApiBaseUrl } from '@/services/runtime';
import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

function getFredObs(key: string): Array<{ date: string; value: string }> {
  const raw = getHydratedData(key) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
  return raw?.series?.observations ?? [];
}

interface DebtEntry { country: string; debtPerCapita: string; debtToGdp: string; currency: string; }

const DEMO_DEBT: DebtEntry[] = [
  { country: 'United States', debtPerCapita: '$101,000', debtToGdp: '123.0%', currency: 'USD' },
  { country: 'Japan', debtPerCapita: '¥14,200,000', debtToGdp: '261.0%', currency: 'JPY' },
  { country: 'China', debtPerCapita: '¥73,500', debtToGdp: '83.0%', currency: 'CNY' },
  { country: 'Germany', debtPerCapita: '€47,800', debtToGdp: '66.0%', currency: 'EUR' },
  { country: 'United Kingdom', debtPerCapita: '£42,300', debtToGdp: '101.0%', currency: 'GBP' },
];

export class NationalDebtPanel {
  private container: HTMLElement;
  private entries: DebtEntry[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'NationalDebt', fallback: DEMO_DEBT},
      async () => {
        try {
          const base = getApiBaseUrl() || '';
          const res = await fetch(`${base}/api/economic/v1/get-national-debt`);
          if (res.ok) {
            const d = await res.json();
            if (!d.unavailable && d.entries?.length) {
              return d.entries.slice(0, 10).map((e: Record<string, unknown>) => ({
                country: e.iso3 ?? e.country ?? 'Unknown',
                debtPerCapita: e.debtPerCapita ?? `$${((e.debtUsd as number) / 1e9).toFixed(0)}B`,
                debtToGdp: e.debtToGdp != null ? `${(e.debtToGdp as number).toFixed(1)}%` : '—',
                currency: e.currency ?? 'USD',
              }));
            }
          }
        } catch { /* fall through to FRED */ }

        try {
          const observations = getFredObs('fredGfdebtn');
          if (observations.length >= 1) {
            const latest = observations[0]!;
            const debtTrillions = parseFloat(latest.value) / 1000;
            const usPopulation = 334_000_000;
            const debtPerCapita = (debtTrillions * 1e12 / usPopulation);
            return [{
              country: 'United States',
              debtPerCapita: `$${Math.round(debtPerCapita).toLocaleString()}`,
              debtToGdp: '~123%',
              currency: 'USD',
            }];
          }
        } catch { /* no data available */ }

        return DEMO_DEBT;
      },
      (_entries) => true,
    );
    this.entries = result.data;
    this.source = result.source;
  }

  private debtNum(v: string): number { return parseFloat(v?.replace(/[^0-9.]/g, '') ?? '') || 0; }
  private barW(v: string): number { return Math.min(this.debtNum(v) * 0.5, 100); }
  private barC(v: string): string { const n = this.debtNum(v); return n > 150 ? 'bg-error/60' : n > 100 ? 'bg-yellow-400/60' : 'bg-primary/60'; }

  render(): void {
    const entries = this.entries.slice(0, 10);
    const hasData = entries.length > 0;

    let body = '';
    if (hasData) {
      body = `
      <div class="flex flex-col gap-1.5 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${entries.map((e, i) => `
          <div class="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-on-surface font-body-sm panel-body">${e.country}</span>
              <span class="text-[10px] font-data-md text-on-surface-variant">${e.currency}</span>
            </div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-data-md text-on-surface-variant">Per Capita: <span class="text-on-surface">${e.debtPerCapita}</span></span>
              <span class="text-[10px] font-data-md text-on-surface-variant">Debt/GDP: <span class="text-on-surface">${e.debtToGdp}</span></span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5"><div class="${this.barC(e.debtToGdp)} h-1.5 rounded-full" style="width: ${this.barW(e.debtToGdp)}%"></div></div>
          </div>`).join('')}
      </div>`;
    } else {
      body = '<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">No national debt data available</div>';
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">National Debt</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${body}`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
