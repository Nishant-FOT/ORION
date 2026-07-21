import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Indicator {
  name: string;
  value: string;
  change: string;
  changePercent: number;
  unit: string;
}

const DEMO_INDICATORS: Indicator[] = [
  { name: 'Unemployment', value: '4.1%', change: '+0.1', changePercent: 2.5, unit: '%' },
  { name: 'CPI Index', value: '312.5', change: '+0.3', changePercent: 0.1, unit: '' },
  { name: '10Y Treasury', value: '4.25%', change: '+0.02', changePercent: 0.5, unit: '%' },
  { name: '2Y Treasury', value: '4.65%', change: '-0.01', changePercent: -0.2, unit: '%' },
  { name: '10Y-2Y Spread', value: '-0.40%', change: '+0.03', changePercent: 0, unit: '%' },
  { name: 'Fed Funds Rate', value: '5.25%', change: '+0.00', changePercent: 0, unit: '%' },
  { name: 'VIX', value: '18.5', change: '-1.2', changePercent: -6.1, unit: '' },
];

export class EconomicIndicatorsPanel {
  private container: HTMLElement;
  private indicators: Indicator[] = DEMO_INDICATORS;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private buildIndicator(fredKey: string, name: string, unit: string): Indicator | null {
    const raw = getHydratedData(fredKey) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
    const obs = raw?.series?.observations;
    if (!obs || obs.length === 0) return null;
    const latest = obs.find(o => o.value !== '.');
    const previous = obs.slice(1).find(o => o.value !== '.');
    if (!latest) return null;
    const val = parseFloat(latest.value);
    const change = latest && previous ? (parseFloat(latest.value) - parseFloat(previous.value)).toFixed(2) : '0';
    const changeVal = parseFloat(change) || 0;
    return {
      name,
      value: isNaN(val) ? 'N/A' : `${val}${unit}`,
      change: `${changeVal >= 0 ? '+' : ''}${change}`,
      changePercent: changeVal,
      unit,
    };
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'economic-indicators', fallback: DEMO_INDICATORS},
      async () => {
        const indicators: Indicator[] = [];
        const fed = this.buildIndicator('fredFedFunds', 'Fed Funds Rate', '%');
        if (fed) indicators.push(fed);
        const unemp = this.buildIndicator('fredUnemployment', 'Unemployment', '%');
        if (unemp) indicators.push(unemp);
        const cpi = this.buildIndicator('fredCpi', 'CPI Index', '');
        if (cpi) indicators.push(cpi);
        const dgs10 = this.buildIndicator('fredDgs10', '10Y Treasury', '%');
        if (dgs10) indicators.push(dgs10);
        const dgs2 = this.buildIndicator('fredDgs2', '2Y Treasury', '%');
        if (dgs2) indicators.push(dgs2);
        if (dgs10 && dgs2) {
          const spread10 = parseFloat(dgs10.value) || 0;
          const spread2 = parseFloat(dgs2.value) || 0;
          const spreadVal = spread10 - spread2;
          indicators.push({
            name: '10Y-2Y Spread',
            value: `${spreadVal >= 0 ? '+' : ''}${spreadVal.toFixed(2)}%`,
            change: '+0.00',
            changePercent: 0,
            unit: '%',
          });
        }
        if (indicators.length === 0) return DEMO_INDICATORS;
        return indicators;
      },
      (data) => Array.isArray(data),
    );
    this.indicators = data;
    this.source = source;

    try {
      const { fetchIndiaEconomicData } = await import('@/services/live-data-service');
      const indiaData = await fetchIndiaEconomicData();
      const indiaIndicators = indiaData.map(item => ({
        name: item.name,
        value: item.value,
        change: 'N/A',
        changePercent: 0,
        unit: '',
      }));
      this.indicators.push(...indiaIndicators);
    } catch {}
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private trendIcon(ind: Indicator): string {
    if (ind.changePercent > 0.5) return '\u2191';
    if (ind.changePercent < -0.5) return '\u2193';
    return '\u2192';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Economic Indicators</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-1 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.indicators.map((ind, i) => {
          const trend = this.trendIcon(ind);
          const trendColor = ind.changePercent > 0 ? 'text-primary' : ind.changePercent < 0 ? 'text-error' : 'text-on-surface-variant';
          return `
          <div class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs text-on-surface-variant font-body-sm panel-body">${ind.name}</span>
              <span class="text-xs text-on-surface font-data-md panel-stat">${ind.value}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-[10px] text-on-surface-variant font-data-md">${ind.unit ? `Unit: ${ind.unit}` : ''}</span>
              <span class="text-[10px] ${trendColor} font-data-md">${trend} ${ind.change}</span>
            </div>
            <div class="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div class="h-full ${trendColor.replace('text-', 'bg-')} rounded-full" style="width: ${Math.min(100, Math.abs(ind.changePercent) * 3)}%"></div>
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
