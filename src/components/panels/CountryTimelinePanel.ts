interface TimelineEvent { id: string; date: string; title: string; detail: string; severity: string; category: string; }

export class CountryTimelinePanel {
  private container: HTMLElement;
  private country = '';
  private events: TimelineEvent[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.country = 'Israel';
    this.events = [
      { id: 't1', date: '2026-07-16', title: 'Iron Dome activation near Gaza border', detail: 'Multiple projectiles intercepted. IDF responds with targeted strikes.', severity: 'high', category: 'MILITARY' },
      { id: 't2', date: '2026-07-14', title: 'Diplomatic summit in Negev', detail: 'Regional leaders meet to discuss de-escalation framework.', severity: 'low', category: 'DIPLOMATIC' },
      { id: 't3', date: '2026-07-12', title: 'Lebanon border incident', detail: 'Cross-border fire exchange. UNIFIL monitoring escalated patrols.', severity: 'critical', category: 'CONFLICT' },
      { id: 't4', date: '2026-07-09', title: 'Judicial reform legislation passed', detail: 'Knesset approves controversial amendment. Protests reported in Tel Aviv.', severity: 'medium', category: 'POLITICAL' },
      { id: 't5', date: '2026-07-06', title: 'Cyberattack on water infrastructure', detail: 'Attempted breach of national water authority. System isolated within minutes.', severity: 'high', category: 'CYBER' },
    ];
  }

  private severityBadge(s: string): string {
    const m: Record<string, string> = { critical: 'bg-error/15 text-error border-error/20', high: 'bg-orange-400/15 text-orange-400 border-orange-400/20', medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', low: 'bg-white/5 text-on-surface-variant border-white/10' };
    return m[s] || 'bg-white/5 text-on-surface-variant border-white/10';
  }
  private categoryColor(c: string): string {
    const m: Record<string, string> = { MILITARY: 'text-error', CONFLICT: 'text-orange-400', CYBER: 'text-purple-400', POLITICAL: 'text-yellow-400', DIPLOMATIC: 'text-green-400' };
    return m[c] || 'text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Country Timeline</h3>
        <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${this.country.toUpperCase()}</span>
      </div>
      <div class="flex flex-col gap-0 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.events.map((e, i) => `
          <div class="relative pl-4 pb-3 border-l border-white/10" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="absolute left-0 top-0 w-2 h-2 rounded-full ${e.severity === 'critical' ? 'bg-error' : e.severity === 'high' ? 'bg-orange-400' : e.severity === 'medium' ? 'bg-yellow-400' : 'bg-white/20'} -translate-x-[5px]"></div>
            <div class="bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-all cursor-pointer">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-data-md text-on-surface-variant">${e.date}</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-[9px] font-label-caps ${this.categoryColor(e.category)}">${e.category}</span>
                  <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${this.severityBadge(e.severity)}">${e.severity.toUpperCase()}</span>
                </div>
              </div>
              <div class="text-sm text-on-surface font-body-sm panel-body mb-1">${e.title}</div>
              <div class="text-[10px] text-on-surface-variant leading-relaxed">${e.detail}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
