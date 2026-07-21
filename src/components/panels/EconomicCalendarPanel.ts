import { getApiBaseUrl } from '@/services/runtime';
import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

function getFredObs(key: string): Array<{ date: string; value: string }> {
  const raw = getHydratedData(key) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
  return raw?.series?.observations ?? [];
}

interface EconEvent { event: string; country: string; date: string; impact: string; actual: string; estimate: string; previous: string; unit: string; }

const DEMO_EVENTS: EconEvent[] = [
  { event: 'CPI (All Urban Consumers)', country: 'US', date: '2026-07-15', impact: 'high', actual: '3.2%', estimate: '3.1%', previous: '3.3%', unit: '' },
  { event: 'Non-Farm Payrolls', country: 'US', date: '2026-07-11', impact: 'high', actual: '275K', estimate: '250K', previous: '218K', unit: '' },
  { event: 'ECB Interest Rate Decision', country: 'EU', date: '2026-07-10', impact: 'high', actual: '4.25%', estimate: '4.25%', previous: '4.50%', unit: '' },
  { event: 'GDP (QoQ)', country: 'US', date: '2026-07-18', impact: 'high', actual: '', estimate: '2.1%', previous: '1.4%', unit: '%' },
  { event: 'Consumer Sentiment (U. of Michigan)', country: 'US', date: '2026-07-14', impact: 'medium', actual: '72.6', estimate: '71.0', previous: '69.5', unit: '' },
  { event: 'Industrial Production Index', country: 'US', date: '2026-07-16', impact: 'medium', actual: '', estimate: '0.2%', previous: '-0.3%', unit: '%' },
];

const IMPACT_COLOR: Record<string, string> = {
  high: 'bg-error/15 text-error border-error/20',
  medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20',
  low: 'bg-white/5 text-on-surface-variant border-white/10',
};

const FRED_RELEASE_SERIES = [
  { id: 'CPIAUCSL', bootstrapKey: 'fredCpi', name: 'CPI (All Urban Consumers)', impact: 'high' },
  { id: 'UNRATE', bootstrapKey: 'fredUnemployment', name: 'Unemployment Rate', impact: 'high' },
  { id: 'FEDFUNDS', bootstrapKey: 'fredFedFunds', name: 'Federal Funds Rate', impact: 'high' },
  { id: 'DGS10', bootstrapKey: 'fredDgs10', name: '10-Year Treasury Yield', impact: 'medium' },
  { id: 'DGS2', bootstrapKey: 'fredDgs2', name: '2-Year Treasury Yield', impact: 'medium' },
  { id: 'GDP', bootstrapKey: 'fredGdp', name: 'Gross Domestic Product', impact: 'high' },
];

export class EconomicCalendarPanel {
  private container: HTMLElement;
  private events: EconEvent[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'EconomicCalendar', fallback: DEMO_EVENTS},
      async () => {
        try {
          const now = new Date();
          const from = now.toISOString().split('T')[0];
          const to = new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0];
          const base = getApiBaseUrl() || '';
          const res = await fetch(`${base}/api/economic/v1/get-economic-calendar?fromDate=${from}&toDate=${to}`);
          if (res.ok) {
            const d = await res.json();
            if (!d.unavailable && d.events?.length) {
              return d.events;
            }
          }
        } catch { /* fall through to FRED */ }

        try {
          const results = FRED_RELEASE_SERIES.map((s) => {
            const observations = getFredObs(s.bootstrapKey);
            if (observations.length >= 1) {
              const latest = observations[0]!;
              return {
                event: s.name,
                country: 'US',
                date: latest.date,
                impact: s.impact,
                actual: latest.value,
                estimate: '',
                previous: observations[1]?.value ?? '',
                unit: '',
              };
            }
            return null;
          });

          const events = results.filter((e): e is EconEvent => e !== null);

          if (events.length > 0) {
            return events;
          }
        } catch { /* no data available */ }

        return DEMO_EVENTS;
      },
      (data) => Array.isArray(data),
    );
    this.events = result.data;
    this.source = result.source;
  }

  private fmtDate(d: string): string {
    try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); } catch { return d; }
  }

  render(): void {
    const evts = this.events.slice(0, 8);
    const hasData = evts.length > 0;

    let body = '';
    if (hasData) {
      body = `
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${evts.map((e, i) => {
          const badge = IMPACT_COLOR[e.impact?.toLowerCase()] ?? IMPACT_COLOR.low;
          return `
          <div class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-on-surface font-body-sm panel-body truncate">${e.event}</span>
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border shrink-0 ml-2 ${badge}">${e.impact}</span>
            </div>
            <div class="flex items-center gap-3 text-[10px] font-data-md text-on-surface-variant">
              <span>${e.country}</span><span>${this.fmtDate(e.date)}</span>
              ${e.actual ? `<span class="text-on-surface">Act: ${e.actual}${e.unit}</span>` : ''}
              ${e.estimate ? `<span>Est: ${e.estimate}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    } else {
      body = '<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">No economic calendar data available</div>';
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Economic Calendar</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${body}`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
