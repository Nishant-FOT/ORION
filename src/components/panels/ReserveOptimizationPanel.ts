import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-error text-white animate-pulse',
  high: 'bg-error/10 text-error border border-error/20',
  medium: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
  low: 'bg-primary/10 text-primary border border-primary/20',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const DEMO_RESULT = {
  countryCode: 'US',
  countryName: 'United States',
  generatedAt: new Date().toISOString(),
  currentCoverageDays: 1233,
  riskAdjustedCoverageDays: 980,
  minimumCoverageDays: 90,
  severity: 'low' as string,
  hedgingRecommendation: 'HOLD',
  currentBrentPrice: 82.5,
  priceAtRisk: 95.0,
  daysUntilCritical: 850,
  daysUntilExhaustion: 1233,
  keyRisks: [
    'Hormuz closure risk at 35% — 3M bpd at stake',
    'SPR replenishment pace below pre-2020 levels',
    'Global demand growth +1.2M bpd YoY',
  ],
  drawdownPhases: [
    { phase: 1, label: 'Strategic Release', releaseRateBpd: 500_000, durationDays: 60, triggerCondition: 'Brent > $120', costAtCurrentPrice: 3_000_000_000 },
    { phase: 2, label: 'Emergency Drawdown', releaseRateBpd: 1_000_000, durationDays: 90, triggerCondition: 'Supply disruption confirmed', costAtCurrentPrice: 7_500_000_000 },
  ],
  limitations: [
    'Model assumes steady-state demand',
    'Political release decisions not modeled',
    'Refinery throughput constraints ignored',
  ],
};

type ReserveResult = typeof DEMO_RESULT;

export class ReserveOptimizationPanel {
  private container: HTMLElement;
  private result: ReserveResult = DEMO_RESULT;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<ReserveResult>(
      { name: 'reserve-optimizer', fallback: DEMO_RESULT},
      async () => {
        const { optimizeReserves } = await import('@/services/reserve-optimizer');
        const res = await optimizeReserves('US');
        return {
          countryCode: res.countryCode,
          countryName: res.countryName,
          generatedAt: res.generatedAt,
          currentCoverageDays: res.currentCoverageDays,
          riskAdjustedCoverageDays: res.riskAdjustedCoverageDays,
          minimumCoverageDays: res.minimumCoverageDays,
          severity: res.severity,
          hedgingRecommendation: res.hedgingRecommendation,
          currentBrentPrice: res.currentBrentPrice,
          priceAtRisk: res.priceAtRisk,
          daysUntilCritical: res.daysUntilCritical,
          daysUntilExhaustion: res.daysUntilExhaustion,
          keyRisks: res.keyRisks,
          drawdownPhases: res.drawdownPhases,
          limitations: res.limitations,
        } as ReserveResult;
      },
    );
    this.result = data;
    this.source = source;
  }

  private coverageBar(): string {
    const pct = Math.min(100, Math.round((this.result.currentCoverageDays / 1500) * 100));
    const color = this.result.currentCoverageDays >= 90 ? 'bg-primary' : this.result.currentCoverageDays >= 30 ? 'bg-orange-400' : 'bg-error';
    return `<div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div class="h-full ${color} rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
    </div>`;
  }

  render(): void {
    const r = this.result;
    const sevCls = SEVERITY_COLORS[r.severity] ?? SEVERITY_COLORS.low;
    const sevLabel = SEVERITY_LABELS[r.severity] ?? r.severity.toUpperCase();
    const timeSince = new Date(r.generatedAt).toLocaleTimeString();

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Reserve Optimizer</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COVERAGE</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${r.currentCoverageDays}</div>
          <div class="text-[9px] font-data-md text-on-surface-variant">days</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">SEVERITY</div>
          <div class="inline-flex items-center px-2 py-1 rounded-lg ${sevCls} text-[10px] font-data-md">${sevLabel}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">HEDGING</div>
          <div class="text-lg font-data-lg text-on-surface panel-stat-lg">${r.hedgingRecommendation}</div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COVERAGE LEVEL</div>
        ${this.coverageBar()}
        <div class="flex justify-between mt-1">
          <span class="text-[9px] text-on-surface-variant font-data-md">0d</span>
          <span class="text-[9px] text-on-surface-variant font-data-md">IEA: ${r.minimumCoverageDays}d</span>
          <span class="text-[9px] text-on-surface-variant font-data-md">1500d</span>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">DRAWDOWN PHASES</div>
        <div class="flex flex-col gap-1">
          ${r.drawdownPhases.map((p, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                 style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-data-md text-on-surface">${p.phase}</span>
                <div>
                  <div class="text-[10px] text-on-surface font-body-sm">${p.label}</div>
                  <div class="text-[9px] text-on-surface-variant font-data-md">${p.triggerCondition}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-[10px] text-on-surface font-data-md">${(p.releaseRateBpd / 1_000_000).toFixed(1)}M bpd</div>
                <div class="text-[9px] text-on-surface-variant font-data-md">${p.durationDays}d</div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">KEY RISKS</div>
      <div class="flex flex-col gap-1">
        ${r.keyRisks.map((risk, i) => `
          <div class="text-[10px] text-on-surface-variant font-body-sm p-2 hover:bg-white/5 rounded-lg transition-all flex items-start gap-1"
               style="animation: fadeInUp 0.3s ease-out ${0.4 + 0.05 * i}s both;">
            <span class="material-symbols-outlined text-error text-[10px] mt-0.5">warning</span>
            <span>${risk}</span>
          </div>`).join('')}
      </div>
      <div class="mt-2 text-[9px] text-on-surface-variant font-data-md text-right">Updated ${timeSince}</div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
