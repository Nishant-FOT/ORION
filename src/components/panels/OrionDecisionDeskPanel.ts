import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface OrionDecision {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  action: string;
  confidence: number;
  exposureScore: number;
  rationale: string;
}

const DEMO_DECISIONS: OrionDecision[] = [
  { id: 'dec-1', severity: 'critical', title: 'Strait of Hormuz → UAE Exposure', action: 'Diversify shipping routes via Suez; increase strategic reserves by 15 days', confidence: 92, exposureScore: 88, rationale: 'Geopolitical tension escalation near chokepoint with 21% of global oil transit' },
  { id: 'dec-2', severity: 'high', title: 'Panama Canal → Panama Exposure', action: 'Reroute via Cape of Good Hope for time-insensitive cargo', confidence: 85, exposureScore: 72, rationale: 'Drought conditions reducing daily transits from 36 to 24; backlog growing' },
  { id: 'dec-3', severity: 'medium', title: 'Suez Canal → Egypt Exposure', action: 'Maintain current routing but monitor Houthi activity; prepare contingency', confidence: 78, exposureScore: 55, rationale: 'Intermittent drone activity; commercial traffic proceeding with naval escort' },
  { id: 'dec-4', severity: 'low', title: 'Danish Straits → Denmark Exposure', action: 'No action required; continue standard transit scheduling', confidence: 95, exposureScore: 22, rationale: 'Stable conditions; minimal disruption risk in current quarter' },
];

export class OrionDecisionDeskPanel {
  private container: HTMLElement;
  private decisions: OrionDecision[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<OrionDecision[]>(
      { name: 'orion-decisions', fallback: DEMO_DECISIONS},
      async () => {
        const { fetchOrionDecisionBrief } = await import('@/services/orion-decision-support');
        const brief = await fetchOrionDecisionBrief();
        if (brief?.recommendedActions?.length) {
          return brief.recommendedActions.slice(0, 5).map(a => ({
            id: a.id,
            severity: a.severity,
            title: `${a.chokepointName} → ${a.countryName} Exposure`,
            action: a.action,
            confidence: a.confidence,
            exposureScore: a.exposureScore,
            rationale: a.rationale,
          }));
        }
        return DEMO_DECISIONS;
      },
    );
    this.decisions = data;
    this.source = source;
  }

  private severityColor(s: string): string {
    if (s === 'critical') return 'bg-error/10 text-error border border-error/20';
    if (s === 'high') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    if (s === 'medium') return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  private severityDot(s: string): string {
    if (s === 'critical') return 'bg-error animate-pulse';
    if (s === 'high') return 'bg-orange-400';
    if (s === 'medium') return 'bg-yellow-400';
    return 'bg-primary';
  }

  private exposureColor(s: number): string {
    if (s >= 75) return 'text-error';
    if (s >= 50) return 'text-orange-400';
    return 'text-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Orion Decision Desk</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="material-symbols-outlined text-on-surface-variant text-sm">psychology</span>
        </div>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.decisions.map((d, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 relative overflow-hidden group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="absolute left-0 top-0 bottom-0 w-1 ${this.severityDot(d.severity).split(' ')[0]} shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:w-2 transition-all"></div>
            <div class="pl-2">
              <div class="flex justify-between items-start mb-2">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-data-md ${this.severityColor(d.severity)}">
                  <span class="w-1.5 h-1.5 rounded-full ${this.severityDot(d.severity)}"></span>
                  ${d.severity.toUpperCase()}
                </span>
                <div class="flex items-center gap-2">
                  <div class="text-center">
                    <div class="text-[8px] font-label-caps text-on-surface-variant">CONF</div>
                    <div class="text-xs font-data-md text-on-surface">${d.confidence}%</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[8px] font-label-caps text-on-surface-variant">EXPOSURE</div>
                    <div class="text-xs font-data-md ${this.exposureColor(d.exposureScore)}">${d.exposureScore}</div>
                  </div>
                </div>
              </div>
              <div class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors mb-1">${d.title}</div>
              <p class="text-[10px] text-on-surface-variant font-body-sm leading-relaxed mb-2">${d.action}</p>
              <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-1.5">
                <div class="h-full ${d.exposureScore >= 75 ? 'bg-error' : d.exposureScore >= 50 ? 'bg-orange-400' : 'bg-primary'} rounded-full" style="width: ${d.exposureScore}%"></div>
              </div>
              <div class="text-[9px] font-data-md text-on-surface-variant/60 italic">${d.rationale}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
