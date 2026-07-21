import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface ProcurementAction {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  countryName: string;
  chokepointName: string;
  action: string;
  rationale: string;
  confidence: number;
  exposureScore: number;
  coverDays: number;
  disruptionPct: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-error text-white animate-pulse',
  high: 'bg-error/10 text-error border border-error/20',
  medium: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
  low: 'bg-primary/10 text-primary border border-primary/20',
};

const SEVERITY_ICONS: Record<string, string> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'check_circle',
};

const DEMO_POSTURE = 'ELEVATED';

const DEMO_ACTIONS: ProcurementAction[] = [
  { id: 'act-1', severity: 'critical', countryName: 'UAE', chokepointName: 'Strait of Hormuz', action: 'Secure 60-day strategic reserve; lock forward contracts at current Brent $82', rationale: 'Chokepoint disruption probability at 34% in next 90 days', confidence: 91, exposureScore: 85, coverDays: 42, disruptionPct: 28 },
  { id: 'act-2', severity: 'high', countryName: 'Panama', chokepointName: 'Panama Canal', action: 'Shift 30% of trans-Pacific volume to alternative carriers via Suez', rationale: 'Drought-driven draft restrictions reducing daily capacity by 33%', confidence: 84, exposureScore: 68, coverDays: 35, disruptionPct: 22 },
  { id: 'act-3', severity: 'medium', countryName: 'Egypt', chokepointName: 'Suez Canal', action: 'Pre-negotiate premium routing with logistics partners; diversify carriers', rationale: 'Intermittent naval escort delays adding 4-6 hours per transit', confidence: 76, exposureScore: 48, coverDays: 28, disruptionPct: 15 },
  { id: 'act-4', severity: 'low', countryName: 'Denmark', chokepointName: 'Danish Straits', action: 'No procurement action needed; maintain current contracts', rationale: 'Stable transit conditions with minimal disruption risk', confidence: 94, exposureScore: 18, coverDays: 21, disruptionPct: 5 },
];

export class ProcurementAdvisorPanel {
  private container: HTMLElement;
  private actions: ProcurementAction[] = [];
  private postureLabel = 'NORMAL';
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<{ actions: ProcurementAction[]; postureLabel: string }>(
      { name: 'procurement-advisor', fallback: { actions: DEMO_ACTIONS, postureLabel: DEMO_POSTURE }},
      async () => {
        const { fetchOrionDecisionBrief } = await import('@/services/orion-decision-support');
        const brief = await fetchOrionDecisionBrief();
        if (brief?.recommendedActions?.length) {
          return {
            postureLabel: brief.postureLabel,
            actions: brief.recommendedActions.slice(0, 5).map(r => ({
              id: r.id,
              severity: r.severity,
              countryName: r.countryName,
              chokepointName: r.chokepointName,
              action: r.action,
              rationale: r.rationale,
              confidence: r.confidence,
              exposureScore: r.exposureScore,
              coverDays: r.coverDays,
              disruptionPct: r.disruptionPct,
            })),
          };
        }
        return { actions: DEMO_ACTIONS, postureLabel: DEMO_POSTURE };
      },
    );
    this.actions = data.actions;
    this.postureLabel = data.postureLabel;
    this.source = source;
  }

  private severityColor(sev: string): string {
    if (sev === 'critical') return 'text-error';
    if (sev === 'high') return 'text-error';
    if (sev === 'medium') return 'text-orange-400';
    return 'text-primary';
  }

  private exposureBar(score: number): string {
    const color = score >= 70 ? 'bg-error' : score >= 40 ? 'bg-orange-400' : 'bg-primary';
    return `<div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div class="h-full ${color} rounded-full transition-all duration-700" style="width: ${score}%"></div>
    </div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Procurement Advisor</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="material-symbols-outlined text-on-surface-variant text-sm">gavel</span>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">POSTURE</div>
        <div class="text-2xl font-data-lg text-error panel-stat-lg">${this.postureLabel}</div>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 100px); overflow-y: auto;">
        ${this.actions.map((a, i) => {
          const sevCls = SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.medium;
          const sevIcon = SEVERITY_ICONS[a.severity] ?? 'info';
          return `
            <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden border border-white/5 group cursor-pointer hover:scale-[1.01]"
                 style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${sevCls} text-[10px] font-data-md">
                    <span class="material-symbols-outlined text-xs">${sevIcon}</span>
                    ${a.severity.toUpperCase()}
                  </span>
                  <span class="text-[10px] text-on-surface-variant font-body-sm">${a.countryName}</span>
                </div>
                <span class="text-[9px] font-data-md text-on-surface-variant">${a.chokepointName}</span>
              </div>
              <div class="font-data-md text-on-surface panel-body text-sm group-hover:text-primary transition-colors pl-1">${a.action}</div>
              <p class="text-[10px] text-on-surface-variant font-body-sm leading-relaxed pl-1">${a.rationale}</p>
              <div class="grid grid-cols-3 gap-2 pl-1">
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">CONF</div>
                  <div class="text-xs font-data-md ${this.severityColor(a.severity)}">${a.confidence}%</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">EXPOSURE</div>
                  <div class="text-xs font-data-md text-on-surface">${a.exposureScore}</div>
                  <div class="mt-0.5">${this.exposureBar(a.exposureScore)}</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">COVER</div>
                  <div class="text-xs font-data-md text-on-surface">${a.coverDays}d</div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
