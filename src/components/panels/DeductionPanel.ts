import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Evidence { source: string; detail: string; reliability: number; }
interface Hypothesis { id: string; title: string; confidence: number; status: string; evidence: Evidence[]; }

export class DeductionPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private hypotheses: Hypothesis[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.hypotheses = [
      {
        id: 'h1', title: 'Iran proxy escalation likely within 72h', confidence: 78, status: 'ACTIVE',
        evidence: [
          { source: 'SIGINT', detail: 'Encrypted comms surge between Tehran and Baghdad', reliability: 82 },
          { source: 'OSINT', detail: 'Militia convoy movements along Euphrates corridor', reliability: 71 },
          { source: 'HUMINT', detail: 'Asset reports IRGC Quds Force staging near border', reliability: 65 },
        ],
      },
      {
        id: 'h2', title: 'Hormuz naval standoff de-escalation probable', confidence: 62, status: 'WEAKENING',
        evidence: [
          { source: 'GEOINT', detail: 'Iranian naval vessels returning to Bandar Abbas', reliability: 88 },
          { source: 'SIGINT', detail: 'Reduced jamming activity in Strait corridor', reliability: 74 },
        ],
      },
      {
        id: 'h3', title: 'China-Taiwan airspace incident within 14 days', confidence: 41, status: 'MONITORING',
        evidence: [
          { source: 'OSINT', detail: 'PLA Air Force exercises in Fujian province', reliability: 79 },
          { source: 'SIGINT', detail: 'Increased surveillance flights near median line', reliability: 68 },
          { source: 'HUMINT', detail: 'Diplomatic source indicates heightened alert status', reliability: 52 },
        ],
      },
    ];
  }

  private confidenceColor(c: number): string { return c >= 70 ? 'text-error' : c >= 50 ? 'text-orange-400' : 'text-yellow-400'; }
  private confidenceBar(c: number): string { return c >= 70 ? 'bg-error' : c >= 50 ? 'bg-orange-400' : 'bg-yellow-400'; }
  private statusBadge(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'bg-error/15 text-error border-error/20', WEAKENING: 'bg-orange-400/15 text-orange-400 border-orange-400/20', MONITORING: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20' };
    return m[s] || 'bg-white/5 text-on-surface-variant border-white/10';
  }
  private reliabilityColor(r: number): string { return r >= 80 ? 'text-green-400' : r >= 65 ? 'text-yellow-400' : 'text-on-surface-variant'; }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">AI Deductive Reasoning</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.hypotheses.map((h, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-on-surface font-body-sm panel-body">${h.title}</span>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.statusBadge(h.status)}">${h.status}</span>
            </div>
            <div class="w-full h-1.5 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.confidenceBar(h.confidence)} rounded-full transition-all duration-1000" style="width: ${h.confidence}%"></div>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-label-caps text-on-surface-variant">CONFIDENCE</span>
              <span class="text-sm font-data-md ${this.confidenceColor(h.confidence)}">${h.confidence}%</span>
            </div>
            <div class="flex flex-col gap-1">
              ${h.evidence.map(e => `
                <div class="flex items-start gap-2 p-1.5 bg-white/5 rounded-lg">
                  <span class="text-[9px] font-label-caps px-1 py-0.5 rounded bg-white/10 text-on-surface-variant whitespace-nowrap">${e.source}</span>
                  <span class="text-[10px] text-on-surface-variant flex-1">${e.detail}</span>
                  <span class="text-[9px] font-data-md ${this.reliabilityColor(e.reliability)}">${e.reliability}%</span>
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
