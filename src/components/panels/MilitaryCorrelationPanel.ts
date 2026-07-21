import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface MilitaryFinding { id: string; title: string; category: string; description: string; confidence: number; forceDeployments: string[]; escalationRisk: string; }

export class MilitaryCorrelationPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private findings: MilitaryFinding[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.findings = [
      {
        id: 'm1', title: 'Carrier group redeployment signals posture shift',
        category: 'FORCE DEPLOYMENT',
        description: 'USS Nimitz CSG redeployment from South China Sea to Arabian Sea correlates with heightened Iran tensions. Historical pattern: 78% of such moves precede kinetic action within 21 days.',
        confidence: 76, forceDeployments: ['USS Nimitz CSG → Arabian Sea', 'USS Bataan LHD → Eastern Med', 'RAF Typhoon detachment → Cyprus'],
        escalationRisk: 'high',
      },
      {
        id: 'm2', title: 'Joint exercises indicate alliance readiness',
        category: 'ALLIANCE ACTIVITY',
        description: 'Israel-US Juniper Cobra exercise accelerated timeline. Combined with UAE-Israel defense pact activation. Multi-lateral coordination pattern not seen since 2019.',
        confidence: 82, forceDeployments: ['US 6th Fleet augmented', 'IDF Northern Command elevated', 'Jordanian border units alert'],
        escalationRisk: 'medium',
      },
      {
        id: 'm3', title: 'Submarine movements suggest deterrent positioning',
        category: 'NAVAL INTELLIGENCE',
        description: 'Increased submarine activity detected across Mediterranean and Persian Gulf. Pattern matches pre-strike deterrent posture observed in 2003 and 2020.',
        confidence: 64, forceDeployments: ['Astute-class HMS reported Med transit', 'US Virginia-class Gulf presence', 'French Rubis-class活动增加'],
        escalationRisk: 'elevated',
      },
    ];
  }

  private confidenceColor(c: number): string { return c >= 75 ? 'text-error' : c >= 60 ? 'text-orange-400' : 'text-yellow-400'; }
  private confidenceBar(c: number): string { return c >= 75 ? 'bg-error' : c >= 60 ? 'bg-orange-400' : 'bg-yellow-400'; }
  private escalationBadge(e: string): string {
    const m: Record<string, string> = { high: 'bg-error/15 text-error border-error/20', elevated: 'bg-orange-400/15 text-orange-400 border-orange-400/20', medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', low: 'bg-white/5 text-on-surface-variant border-white/10' };
    return m[e] || 'bg-white/5 text-on-surface-variant border-white/10';
  }
  private categoryColor(c: string): string {
    const m: Record<string, string> = { 'FORCE DEPLOYMENT': 'bg-orange-400/15 text-orange-400', 'ALLIANCE ACTIVITY': 'bg-primary/15 text-primary', 'NAVAL INTELLIGENCE': 'bg-purple-400/15 text-purple-400' };
    return m[c] || 'bg-white/5 text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Military Correlations</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.findings.map((f, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded ${this.categoryColor(f.category)}">${f.category}</span>
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${this.escalationBadge(f.escalationRisk)}">${f.escalationRisk.toUpperCase()}</span>
            </div>
            <div class="text-sm text-on-surface font-body-sm panel-body mb-1">${f.title}</div>
            <p class="text-[10px] text-on-surface-variant leading-relaxed mb-2">${f.description}</p>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-label-caps text-on-surface-variant">CONFIDENCE</span>
              <span class="text-xs font-data-md ${this.confidenceColor(f.confidence)}">${f.confidence}%</span>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.confidenceBar(f.confidence)} rounded-full transition-all duration-1000" style="width: ${f.confidence}%"></div>
            </div>
            <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">FORCE DEPLOYMENTS</div>
            <div class="flex flex-col gap-1">
              ${f.forceDeployments.map(d => `
                <div class="flex items-start gap-1.5">
                  <span class="text-orange-400 mt-0.5">▸</span>
                  <span class="text-[10px] text-on-surface-variant">${d}</span>
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
