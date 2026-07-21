import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface RiskMetric {
  assetClass: string;
  symbol: string;
  var: number;
  cvar: number;
  stressTest: string;
  maxDrawdown: number;
  sharpeRatio: number;
}

const DEMO_METRICS: RiskMetric[] = [
  { assetClass: 'S&P 500', symbol: 'SPX', var: 2.1, cvar: 3.4, stressTest: '-18.2%', maxDrawdown: -22.5, sharpeRatio: 1.12 },
  { assetClass: 'US Treasuries', symbol: 'UST', var: 0.8, cvar: 1.5, stressTest: '-4.6%', maxDrawdown: -8.3, sharpeRatio: 0.45 },
  { assetClass: 'Crude Oil', symbol: 'CL=F', var: 4.5, cvar: 7.2, stressTest: '-32.1%', maxDrawdown: -41.0, sharpeRatio: 0.68 },
  { assetClass: 'Gold', symbol: 'GC=F', var: 1.2, cvar: 2.0, stressTest: '-8.5%', maxDrawdown: -12.1, sharpeRatio: 0.89 },
];

interface StressScenario {
  name: string;
  impact: string;
  probability: number;
}

const DEMO_SCENARIOS: StressScenario[] = [
  { name: 'Hormuz Closure', impact: '-12.4%', probability: 15 },
  { name: 'Recession Shock', impact: '-28.7%', probability: 22 },
  { name: 'Rate Spike +200bp', impact: '-8.3%', probability: 18 },
];

interface QrResult { metrics: RiskMetric[]; scenarios: StressScenario[]; }

export class QuantitativeRiskPanel {
  private container: HTMLElement;
  private metrics: RiskMetric[] = DEMO_METRICS;
  private scenarios: StressScenario[] = DEMO_SCENARIOS;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<QrResult>(
      {
        name: 'quantitative-risk',
        fallback: { metrics: DEMO_METRICS, scenarios: DEMO_SCENARIOS },
      },
      async () => {
        const res = await fetch('/api/risk/v1/get-quantitative-risk');
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable) throw new Error('unavailable');
        return { metrics: d.metrics ?? DEMO_METRICS, scenarios: d.scenarios ?? DEMO_SCENARIOS } as QrResult;
      },
      (_data) => true,
    );
    this.metrics = data.metrics;
    this.scenarios = data.scenarios;
    this.source = source;
  }

  private varColor(v: number): string {
    if (v >= 4) return 'text-error';
    if (v >= 2) return 'text-orange-400';
    return 'text-primary';
  }

  private stressColor(s: string): string {
    const val = parseFloat(s);
    if (val <= -20) return 'text-error';
    if (val <= -10) return 'text-orange-400';
    return 'text-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Quantitative Risk</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        <div class="bg-white/5 rounded-xl p-3 border border-white/5">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">VALUE AT RISK (95%)</div>
          <div class="flex flex-col gap-2">
            ${this.metrics.map((m, i) => `
              <div class="flex items-center gap-3" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
                <span class="text-xs text-on-surface font-body-sm w-24 truncate panel-body">${m.assetClass}</span>
                <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full ${m.var >= 4 ? 'bg-error' : m.var >= 2 ? 'bg-orange-400' : 'bg-primary'} rounded-full" style="width: ${Math.min(m.var * 15, 100)}%"></div>
                </div>
                <span class="text-xs font-data-md ${this.varColor(m.var)} w-10 text-right">${m.var}%</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 border border-white/5">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CVaR / STRESS TEST</div>
          <div class="grid grid-cols-4 gap-2">
            <div class="text-center">
              <div class="text-[9px] font-label-caps text-on-surface-variant">ASSET</div>
            </div>
            <div class="text-center">
              <div class="text-[9px] font-label-caps text-on-surface-variant">CVaR</div>
            </div>
            <div class="text-center">
              <div class="text-[9px] font-label-caps text-on-surface-variant">STRESS</div>
            </div>
            <div class="text-center">
              <div class="text-[9px] font-label-caps text-on-surface-variant">SHARPE</div>
            </div>
            ${this.metrics.map((m, i) => `
              <div class="contents" style="animation: fadeInUp 0.3s ease-out ${0.1 + 0.04 * i}s both;">
                <div class="text-[11px] text-on-surface font-data-md">${m.symbol}</div>
                <div class="text-[11px] font-data-md ${this.varColor(m.cvar)} text-right">${m.cvar}%</div>
                <div class="text-[11px] font-data-md ${this.stressColor(m.stressTest)} text-right">${m.stressTest}</div>
                <div class="text-[11px] font-data-md text-on-surface text-right">${m.sharpeRatio.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="bg-white/5 rounded-xl p-3 border border-white/5">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">STRESS SCENARIOS</div>
          <div class="flex flex-col gap-1.5">
            ${this.scenarios.map((s, i) => `
              <div class="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg transition-all" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
                <span class="text-[11px] text-on-surface font-body-sm">${s.name}</span>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] font-data-md text-on-surface-variant">${s.probability}%</span>
                  <span class="text-xs font-data-md ${parseFloat(s.impact) <= -20 ? 'text-error' : 'text-orange-400'}">${s.impact}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
