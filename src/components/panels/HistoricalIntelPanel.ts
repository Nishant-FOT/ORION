interface HistoricalParallel { id: string; era: string; title: string; summary: string; lessons: string[]; relevance: number; currentLink: string; }

export class HistoricalIntelPanel {
  private container: HTMLElement;
  private parallels: HistoricalParallel[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.parallels = [
      {
        id: 'p1', era: 'OCT 1962', title: 'Cuban Missile Crisis',
        summary: '13-day confrontation between US and Soviet Union over nuclear missiles in Cuba. Closest the world came to nuclear war during the Cold War.',
        lessons: ['Back-channel diplomacy enabled de-escalation', 'Military readiness without provocation critical', 'Mutual vulnerability can force compromise'],
        relevance: 85,
        currentLink: 'Current Hormuz standoff mirrors brinkmanship dynamics',
      },
      {
        id: 'p2', era: 'AUG 1990', title: 'Gulf War — Iraqi Invasion of Kuwait',
        summary: 'Iraq under Saddam Hussein invaded and annexed Kuwait, triggering a US-led coalition response and Operation Desert Storm.',
        lessons: ['Rapid international coalition formation possible', 'Energy supply threats mobilize global response', 'Military superiority decisive but occupation problematic'],
        relevance: 72,
        currentLink: 'Energy chokepoint parallels with Strait of Hormuz',
      },
      {
        id: 'p3', era: 'OCT 1956', title: 'Suez Crisis',
        summary: 'Israel, UK, and France invaded Egypt after Nasser nationalized the Suez Canal. US and USSR forced withdrawal, reshaping Middle East power dynamics.',
        lessons: ['Superpower pressure can override allied objectives', 'Nationalization of strategic assets triggers military response', 'Colonial-era alliances fractured under new realities'],
        relevance: 68,
        currentLink: 'Canal/chokepoint control remains a strategic flashpoint',
      },
    ];
  }

  private relevanceColor(r: number): string { return r >= 80 ? 'text-error' : r >= 65 ? 'text-orange-400' : 'text-yellow-400'; }
  private relevanceBar(r: number): string { return r >= 80 ? 'bg-error' : r >= 65 ? 'bg-orange-400' : 'bg-yellow-400'; }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Historical Parallels</h3>
        <span class="w-2 h-2 rounded-full bg-yellow-400"></span>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.parallels.map((p, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-label-caps px-1.5 py-0.5 rounded bg-white/10 text-on-surface-variant">${p.era}</span>
                <span class="text-sm text-on-surface font-body-sm panel-body">${p.title}</span>
              </div>
              <span class="text-xs font-data-md ${this.relevanceColor(p.relevance)}">${p.relevance}%</span>
            </div>
            <p class="text-[10px] text-on-surface-variant mb-2 leading-relaxed">${p.summary}</p>
            <div class="w-full h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.relevanceBar(p.relevance)} rounded-full transition-all duration-1000" style="width: ${p.relevance}%"></div>
            </div>
            <div class="text-[9px] font-label-caps text-primary mb-1.5">CURRENT LINK</div>
            <div class="text-[10px] text-on-surface-variant mb-2 italic">${p.currentLink}</div>
            <div class="flex flex-col gap-1">
              ${p.lessons.map(l => `
                <div class="flex items-start gap-1.5">
                  <span class="text-yellow-400 mt-0.5">•</span>
                  <span class="text-[10px] text-on-surface-variant">${l}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
