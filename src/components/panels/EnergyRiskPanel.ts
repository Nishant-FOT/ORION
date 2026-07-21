const RISK_CATEGORIES = [
  { label: 'Geopolitical', key: 'geopolitical' },
  { label: 'Supply', key: 'supply' },
  { label: 'Demand', key: 'demand' },
  { label: 'Infrastructure', key: 'infrastructure' },
];

const TOP_RISKS = [
  { factor: 'Hormuz Strait congestion', severity: 82, icon: 'sailing' },
  { factor: 'OPEC+ quota volatility', severity: 71, icon: 'tune' },
  { factor: 'EU storage drawdown', severity: 64, icon: 'ev_station' },
  { factor: 'LNG tanker rerouting', severity: 58, icon: 'directions_boat' },
  { factor: 'Refinery maintenance backlog', severity: 45, icon: 'factory' },
];

export class EnergyRiskPanel {
  private container: HTMLElement;
  private overall = 67;
  private breakdown = { geopolitical: 72, supply: 61, demand: 55, infrastructure: 48 };
  private risks = TOP_RISKS;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const { fetchChokepointStatus } = await import('@/services/supply-chain');
      const status = await fetchChokepointStatus();
      const chokepoints = status?.chokepoints;
      if (chokepoints?.length) {
        const scores = chokepoints.map(cp => cp.disruptionScore);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const max = Math.round(Math.max(...scores));
        this.breakdown.geopolitical = max;
        this.breakdown.supply = avg;
        this.breakdown.demand = Math.round(avg * 0.8);
        this.breakdown.infrastructure = Math.round(avg * 0.7);
        this.overall = Math.round(
          (this.breakdown.geopolitical + this.breakdown.supply + this.breakdown.demand + this.breakdown.infrastructure) / 4
        );
      }
    } catch { /* demo defaults */ }
  }

  private riskColor(score: number): string {
    if (score >= 70) return 'text-error';
    if (score >= 50) return 'text-orange-400';
    return 'text-primary';
  }

  private riskBg(score: number): string {
    if (score >= 70) return 'bg-error';
    if (score >= 50) return 'bg-orange-400';
    return 'bg-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Energy Risk</h3>
        <span class="material-symbols-outlined text-on-surface-variant text-sm">gpp_maybe</span>
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COMPOSITE RISK SCORE</div>
        <div class="text-3xl font-data-lg ${this.riskColor(this.overall)} panel-stat-lg">${this.overall}<span class="text-base text-on-surface-variant">/100</span></div>
        <div class="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div class="h-full ${this.riskBg(this.overall)} rounded-full transition-all duration-1000" style="width: ${this.overall}%"></div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">RISK BREAKDOWN</div>
        <div class="grid grid-cols-2 gap-2">
          ${RISK_CATEGORIES.map((cat, i) => `
            <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">${cat.label}</div>
              <div class="text-xl font-data-lg ${this.riskColor(this.breakdown[cat.key as keyof typeof this.breakdown])}">${this.breakdown[cat.key as keyof typeof this.breakdown]}</div>
            </div>`).join('')}
        </div>
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TOP RISK FACTORS</div>
      <div class="flex flex-col gap-1">
        ${this.risks.map((r, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-xs text-on-surface-variant">${r.icon}</span>
              <span class="text-xs text-on-surface font-body-sm">${r.factor}</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full ${this.riskBg(r.severity)} rounded-full" style="width: ${r.severity}%"></div>
              </div>
              <span class="text-[9px] font-data-md ${this.riskColor(r.severity)}">${r.severity}</span>
            </div>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
