import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CorrelationFinding {
  id: string;
  pair: string;
  correlation: number;
  impactScore: number;
  direction: 'positive' | 'negative';
  timeframe: string;
  summary: string;
}

const breaker = createCircuitBreaker<CorrelationFinding[]>({
  name: 'Economic Correlations',
  persistCache: false,
});

interface FredSeries {
  observations: Array<{ date: string; value: string }>;
}

function getFredFromBootstrap(seriesId: string): FredSeries {
  const raw = getHydratedData(`fred${seriesId.charAt(0) + seriesId.slice(1).toLowerCase()}`) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
  return { observations: raw?.series?.observations ?? [] };
}

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const xSlice = xs.slice(-n);
  const ySlice = ys.slice(-n);
  const meanX = xSlice.reduce((s, v) => s + v, 0) / n;
  const meanY = ySlice.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xSlice[i] ?? 0) - meanX;
    const dy = (ySlice[i] ?? 0) - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function toNumbers(obs: Array<{ value: string }>): number[] {
  return obs.map(o => parseFloat(o.value)).filter(v => !isNaN(v));
}

const DEMO_FINDINGS: CorrelationFinding[] = [
  { id: 'ec-demo-1', pair: 'Interest Rates → Oil Price', correlation: -0.42, impactScore: 68, direction: 'negative', timeframe: 'FRED time-series', summary: 'Fed funds rate and WTI crude price show moderate inverse correlation. Rate hikes tend to suppress oil demand expectations.' },
  { id: 'ec-demo-2', pair: 'Trade Weighted Dollar → Oil', correlation: -0.31, impactScore: 55, direction: 'negative', timeframe: 'FRED time-series', summary: 'Dollar index and WTI crude correlation suggests stronger dollar depresses commodity prices globally.' },
  { id: 'ec-demo-3', pair: 'Interest Rates → Unemployment', correlation: 0.28, impactScore: 42, direction: 'positive', timeframe: 'FRED time-series', summary: 'Fed funds rate and unemployment rate show mild positive correlation. Current labor market shows resilience to monetary tightening.' },
];

async function computeFromFred(): Promise<CorrelationFinding[]> {
  const fedfunds = getFredFromBootstrap('FEDFUNDS');
  const dcoilwtico = getFredFromBootstrap('DCOILWTICO');
  const tradeWeighted = getFredFromBootstrap('TWEXB');
  const unrateData = getFredFromBootstrap('UNRATE');

  const findings: CorrelationFinding[] = [];
  const fedRate = toNumbers(fedfunds.observations);
  const oilPrice = toNumbers(dcoilwtico.observations);
  const tradeIndex = toNumbers(tradeWeighted.observations);
  const unempRate = toNumbers(unrateData.observations);

  if (fedRate.length > 5 && oilPrice.length > 5) {
    const corr = pearsonCorrelation(fedRate, oilPrice);
    findings.push({
      id: 'ec-rate-oil',
      pair: 'Interest Rates → Oil Price',
      correlation: Math.round(corr * 100) / 100,
      impactScore: Math.round(Math.abs(corr) * 90),
      direction: corr >= 0 ? 'positive' : 'negative',
      timeframe: 'FRED time-series',
      summary: `Fed funds rate and WTI crude price correlation of ${corr.toFixed(2)}. ${corr < -0.3 ? 'Rate hikes inversely affect oil demand expectations.' : 'Current monetary policy shows mixed oil price signals.'}`,
    });
  }

  if (tradeIndex.length > 5 && oilPrice.length > 5) {
    const corr = pearsonCorrelation(tradeIndex, oilPrice);
    findings.push({
      id: 'ec-trade-oil',
      pair: 'Trade Weighted Dollar → Oil',
      correlation: Math.round(corr * 100) / 100,
      impactScore: Math.round(Math.abs(corr) * 85),
      direction: corr >= 0 ? 'positive' : 'negative',
      timeframe: 'FRED time-series',
      summary: `Dollar index and WTI crude correlation of ${corr.toFixed(2)}. Stronger dollar typically depresses commodity prices.`,
    });
  }

  if (fedRate.length > 5 && unempRate.length > 5) {
    const corr = pearsonCorrelation(fedRate, unempRate);
    findings.push({
      id: 'ec-rate-unemp',
      pair: 'Interest Rates → Unemployment',
      correlation: Math.round(corr * 100) / 100,
      impactScore: Math.round(Math.abs(corr) * 75),
      direction: corr >= 0 ? 'positive' : 'negative',
      timeframe: 'FRED time-series',
      summary: `Fed funds rate and unemployment rate correlation of ${corr.toFixed(2)}. ${corr < 0 ? 'Rate hikes historically precede unemployment increases.' : 'Current labor market shows resilience to monetary tightening.'}`,
    });
  }

  return findings;
}

export class EconomicCorrelationPanel {
  private container: HTMLElement;
  private findings: CorrelationFinding[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'Economic Correlations', fallback: DEMO_FINDINGS},
      () => breaker.execute(computeFromFred, []),
      (data) => Array.isArray(data),
    );
    this.findings = result.data;
    this.source = result.source;
  }

  private impactBadge(s: number): string {
    if (s >= 75) return 'bg-error/10 text-error border border-error/20';
    if (s >= 50) return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  private corrBarColor(c: number): string {
    const abs = Math.abs(c);
    if (abs >= 0.8) return 'bg-error';
    if (abs >= 0.6) return 'bg-orange-400';
    return 'bg-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Economic Correlations</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${this.findings.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">coronavirus</span>
            <span class="text-xs">No economic correlations available</span>
          </div>`
        : `<div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.findings.map((f, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors">${f.pair}</span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-data-md ${this.impactBadge(f.impactScore)}">
                <span class="material-symbols-outlined text-[10px]">bolt</span>
                ${f.impactScore}
              </span>
            </div>
            <div class="flex items-center gap-3 mb-2">
              <div class="text-[10px] font-label-caps text-on-surface-variant">CORR</div>
              <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full ${this.corrBarColor(f.correlation)} rounded-full" style="width: ${Math.abs(f.correlation) * 100}%"></div>
              </div>
              <span class="text-xs font-data-md ${f.direction === 'negative' ? 'text-error' : 'text-primary'}">${f.correlation > 0 ? '+' : ''}${f.correlation.toFixed(2)}</span>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[9px] font-label-caps text-on-surface-variant">TIMEFRAME</span>
              <span class="text-[10px] font-data-md text-on-surface-variant">${f.timeframe}</span>
            </div>
            <p class="text-[11px] text-on-surface-variant font-body-sm leading-relaxed">${f.summary}</p>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
