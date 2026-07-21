import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CorrelationInsight { id: string; domain1: string; domain2: string; title: string; description: string; strength: number; direction: string; evidence: string[]; }

export class CorrelationPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private insights: CorrelationInsight[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.insights = [
      {
        id: 'c1', domain1: 'ENERGY', domain2: 'CONFLICT', title: 'Hormuz tensions drive Brent premium',
        description: 'Navel activity in Strait of Hormuz correlates with 12-18% Brent crude premium within 48 hours. Historical pattern consistent across 14 incidents since 2019.',
        strength: 91, direction: 'positive',
        evidence: ['Brent-WTI spread widened $4.20 during last standoff', 'Insurance premiums surged 340% on Gulf transits', 'Physical crude loading delays observed at Fujairah'],
      },
      {
        id: 'c2', domain1: 'MARKETS', domain2: 'GEOPOLITICAL', title: 'VIX spike precedes diplomatic moves',
        description: 'Elevated VIX (>25) historically precedes major diplomatic initiatives by 5-10 days. Market stress creates political pressure for resolution.',
        strength: 74, direction: 'positive',
        evidence: ['VIX 32 on July 8 preceded Negev summit call', 'Defense stocks inversely correlated with peace signals', 'Currency volatility in target nations spikes 72h prior'],
      },
      {
        id: 'c3', domain1: 'CYBER', domain2: 'MILITARY', title: 'Cyber probes indicate force posture shifts',
        description: 'State-sponsored cyber reconnaissance campaigns increase 300% in the 14 days preceding conventional military exercises or deployments.',
        strength: 68, direction: 'positive',
        evidence: ['APT group activity in Taiwan region up 280%', 'Critical infrastructure scanning patterns observed', 'Coordinated with PLA exercise announcements'],
      },
    ];
  }

  private strengthColor(s: number): string { return s >= 80 ? 'text-error' : s >= 65 ? 'text-orange-400' : 'text-yellow-400'; }
  private strengthBar(s: number): string { return s >= 80 ? 'bg-error' : s >= 65 ? 'bg-orange-400' : 'bg-yellow-400'; }
  private domainColor(d: string): string {
    const m: Record<string, string> = { ENERGY: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', CONFLICT: 'bg-error/15 text-error border-error/20', MARKETS: 'bg-primary/15 text-primary border-primary/20', GEOPOLITICAL: 'bg-orange-400/15 text-orange-400 border-orange-400/20', CYBER: 'bg-purple-400/15 text-purple-400 border-purple-400/20', MILITARY: 'bg-orange-400/15 text-orange-400 border-orange-400/20' };
    return m[d] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Cross-Domain Correlations</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.insights.map((ins, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${this.domainColor(ins.domain1)}">${ins.domain1}</span>
              <span class="text-on-surface-variant text-[10px]">↔</span>
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${this.domainColor(ins.domain2)}">${ins.domain2}</span>
            </div>
            <div class="text-sm text-on-surface font-body-sm panel-body mb-1">${ins.title}</div>
            <p class="text-[10px] text-on-surface-variant leading-relaxed mb-2">${ins.description}</p>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-label-caps text-on-surface-variant">STRENGTH</span>
              <span class="text-xs font-data-md ${this.strengthColor(ins.strength)}">${ins.strength}%</span>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.strengthBar(ins.strength)} rounded-full transition-all duration-1000" style="width: ${ins.strength}%"></div>
            </div>
            <div class="flex flex-col gap-1">
              ${ins.evidence.map(e => `
                <div class="flex items-start gap-1.5">
                  <span class="text-primary mt-0.5">•</span>
                  <span class="text-[10px] text-on-surface-variant">${e}</span>
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
