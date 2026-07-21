import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CascadeChain {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium';
  steps: Array<{ trigger: string; impact: string; secondary: string }>;
}

const DEMO_CASCADES: CascadeChain[] = [
  { id: 'escalation', name: 'Brent $87 — Escalation Cascade', severity: 'critical', steps: [{ trigger: 'Brent crude trading above $85 — sustained above threshold', impact: 'Energy-dependent economies face accelerating input cost inflation, current account pressures mount', secondary: 'Central banks forced to delay rate cuts; consumer spending contracts, recession risk rises globally' }] },
  { id: 'supply-shock', name: 'Supply Disruption Amplification', severity: 'high', steps: [{ trigger: 'Elevated prices incentivize supply hoarding and strategic reserve draws', impact: 'Import-dependent nations compete for spot cargoes, widening bid-ask spreads', secondary: 'Physical delivery delays cascade into refinery throughput reductions and product shortages' }] },
  { id: 'demand-pull', name: 'Demand-Pull Inflation Spiral', severity: 'medium', steps: [{ trigger: 'Sustained high energy costs feed into broader CPI across manufacturing and transport', impact: 'Wage-price spiral accelerates in energy-importing economies; real incomes decline', secondary: 'Consumer boycotts and reduced discretionary spending compound economic slowdown' }] },
];

export class CascadeAnalysisPanel {
  private container: HTMLElement;
  private cascades: CascadeChain[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<CascadeChain[]>(
      { name: 'cascade-analysis', fallback: DEMO_CASCADES},
      async () => {
        const { fetchCommodityQuotes } = await import('@/services/market');
        const result = await fetchCommodityQuotes([
          { symbol: 'BZ=F', name: 'Brent Crude', display: 'BRENT' },
        ]);
        const brent = result.data.find(q => q.symbol === 'BZ=F');
        if (brent && typeof brent.price === 'number' && Number.isFinite(brent.price)) {
          return this.buildCascades(brent.price);
        }
        return DEMO_CASCADES;
      },
    );
    this.cascades = data;
    this.source = source;
  }

  private buildCascades(brentPrice: number): CascadeChain[] {
    const chains: CascadeChain[] = [];

    if (brentPrice > 85) {
      chains.push({
        id: 'escalation',
        name: `Brent $${brentPrice.toFixed(0)} — Escalation Cascade`,
        severity: 'critical',
        steps: [{
          trigger: `Brent crude trading above $${brentPrice.toFixed(0)} — sustained above $85 threshold`,
          impact: 'Energy-dependent economies face accelerating input cost inflation, current account pressures mount',
          secondary: 'Central banks forced to delay rate cuts; consumer spending contracts, recession risk rises globally',
        }],
      });
      chains.push({
        id: 'supply-shock',
        name: 'Supply Disruption Amplification',
        severity: 'high',
        steps: [{
          trigger: 'Elevated prices incentivize supply hoarding and strategic reserve draws',
          impact: 'Import-dependent nations compete for spot cargoes, widening bid-ask spreads',
          secondary: 'Physical delivery delays cascade into refinery throughput reductions and product shortages',
        }],
      });
    } else if (brentPrice < 75) {
      chains.push({
        id: 'de-escalation',
        name: `Brent $${brentPrice.toFixed(0)} — De-escalation Cascade`,
        severity: 'medium',
        steps: [{
          trigger: `Brent crude trading at $${brentPrice.toFixed(0)} — below $75 threshold`,
          impact: 'Relief for energy importers; current account deficits narrow, inflation expectations ease',
          secondary: 'Central banks gain room for rate cuts; consumer confidence improves, demand recovery expected',
        }],
      });
    } else {
      chains.push({
        id: 'neutral',
        name: `Brent $${brentPrice.toFixed(0)} — Moderate Risk Zone`,
        severity: 'medium',
        steps: [{
          trigger: `Brent crude at $${brentPrice.toFixed(0)} — within $75-$85 band`,
          impact: 'Balanced energy markets; manageable input costs for most economies',
          secondary: 'No major escalation or de-escalation pressure; monitor for threshold breaches',
        }],
      });
    }

    return chains;
  }

  private severityColor(s: string): string {
    if (s === 'critical') return 'bg-error/10 text-error border border-error/20';
    if (s === 'high') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  private severityDot(s: string): string {
    if (s === 'critical') return 'bg-error';
    if (s === 'high') return 'bg-orange-400';
    return 'bg-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Cascade Analysis</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="material-symbols-outlined text-on-surface-variant text-sm">multi_step</span>
        </div>
      </div>
      <div class="flex flex-col gap-4 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.cascades.map((c, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.08 * i}s both;">
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors">${c.name}</span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-data-md ${this.severityColor(c.severity)}">
                <span class="w-1.5 h-1.5 rounded-full ${this.severityDot(c.severity)}"></span>
                ${c.severity.toUpperCase()}
              </span>
            </div>
            ${c.steps.map(step => `
              <div class="flex flex-col gap-2">
                <div class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-error text-sm mt-0.5">play_arrow</span>
                  <div>
                    <div class="text-[9px] font-label-caps text-error/80">TRIGGER</div>
                    <div class="text-[11px] text-on-surface font-body-sm">${step.trigger}</div>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-orange-400 text-sm mt-0.5">arrow_forward</span>
                  <div>
                    <div class="text-[9px] font-label-caps text-orange-400/80">PRIMARY IMPACT</div>
                    <div class="text-[11px] text-on-surface font-body-sm">${step.impact}</div>
                  </div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="material-symbols-outlined text-yellow-400 text-sm mt-0.5">loop</span>
                  <div>
                    <div class="text-[9px] font-label-caps text-yellow-400/80">SECONDARY EFFECT</div>
                    <div class="text-[11px] text-on-surface font-body-sm">${step.secondary}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
