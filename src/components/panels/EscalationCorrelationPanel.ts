import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface EscalationPattern { id: string; title: string; type: string; description: string; probability: number; timeframe: string; triggers: string[]; deEscalationSignals: string[]; }

export class EscalationCorrelationPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private patterns: EscalationPattern[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.patterns = [
      {
        id: 'e1', title: 'Proxy-to-direct escalation pathway active', type: 'ESCALATION',
        description: 'Iran-Houthi-Hezbollah coordination chain shows elevated activation. Historical data indicates 3-step escalation pattern: proxy strike → retaliation → direct confrontation.',
        probability: 67, timeframe: '7-14 days',
        triggers: ['Soleimani-style targeting', 'Embassy attack', 'Naval vessel incident'],
        deEscalationSignals: ['Back-channel communications resumed', 'UNSC emergency session called', 'Oman mediation activity detected'],
      },
      {
        id: 'e2', title: 'Taiwan Strait de-escalation window', type: 'DE-ESCALATION',
        description: 'PLA exercise tempo reduced 40% from peak. Diplomatic signals from Beijing suggest preference for economic pressure over military escalation. Window estimated at 30-45 days.',
        probability: 58, timeframe: '30-45 days',
        triggers: ['Economic coercion tools preferred', 'Trade delegation scheduled', 'Multilateral forum engagement'],
        deEscalationSignals: ['Exercise schedule scaled back', 'Diplomatic envoy appointed', 'Business delegation visits planned'],
      },
      {
        id: 'e3', title: 'Black Sea corridor tensions pattern', type: 'ESCALATION',
        description: 'Grain deal expiration timeline creates pressure point. Naval posturing around Odesa matches 2022 pre-invasion pattern. Multiple indicators suggest 21-30 day escalation risk.',
        probability: 54, timeframe: '21-30 days',
        triggers: ['Grain deal collapse', 'Shipping lane blockade', 'Naval mine deployment'],
        deEscalationSignals: ['UN Secretary-General engagement', 'Turkey mediation proposal', 'African Union diplomatic push'],
      },
    ];
  }

  private probabilityColor(p: number): string { return p >= 65 ? 'text-error' : p >= 50 ? 'text-orange-400' : 'text-yellow-400'; }
  private probabilityBar(p: number): string { return p >= 65 ? 'bg-error' : p >= 50 ? 'bg-orange-400' : 'bg-yellow-400'; }
  private typeBadge(t: string): string {
    const m: Record<string, string> = { ESCALATION: 'bg-error/15 text-error border-error/20', 'DE-ESCALATION': 'bg-green-400/15 text-green-400 border-green-400/20' };
    return m[t] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Escalation Patterns</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.patterns.map((p, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.typeBadge(p.type)}">${p.type}</span>
              <span class="text-[10px] font-label-caps text-on-surface-variant">WINDOW: ${p.timeframe}</span>
            </div>
            <div class="text-sm text-on-surface font-body-sm panel-body mb-1">${p.title}</div>
            <p class="text-[10px] text-on-surface-variant leading-relaxed mb-2">${p.description}</p>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-label-caps text-on-surface-variant">PROBABILITY</span>
              <span class="text-xs font-data-md ${this.probabilityColor(p.probability)}">${p.probability}%</span>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.probabilityBar(p.probability)} rounded-full transition-all duration-1000" style="width: ${p.probability}%"></div>
            </div>
            <div class="mb-2">
              <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">${p.type === 'ESCALATION' ? 'TRIGGERS' : 'POSITIVE SIGNALS'}</div>
              <div class="flex flex-wrap gap-1">
                ${(p.type === 'ESCALATION' ? p.triggers : p.deEscalationSignals).map(t => `<span class="text-[9px] font-data-md px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant">${t}</span>`).join('')}
              </div>
            </div>
            <div>
              <div class="text-[9px] font-label-caps text-green-400 mb-1">DE-ESCALATION SIGNALS</div>
              <div class="flex flex-wrap gap-1">
                ${p.deEscalationSignals.map(s => `<span class="text-[9px] font-data-md px-1.5 py-0.5 rounded bg-green-400/10 text-green-400">${s}</span>`).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
