import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface COTInstrument { name: string; netPosition: number | null; change: number | null; pctChange: number | null; }

const DEMO_COT: COTInstrument[] = [
  { name: 'E-Mini S&P 500', netPosition: -42300, change: -5100, pctChange: -13.7 },
  { name: 'Crude Oil WTI', netPosition: 187200, change: 12400, pctChange: 7.1 },
  { name: 'Gold', netPosition: 215600, change: 8900, pctChange: 4.3 },
  { name: 'Euro FX', netPosition: -68900, change: -3200, pctChange: 4.9 },
  { name: 'US Treasury Bonds', netPosition: 94500, change: 6100, pctChange: 6.9 },
];

export class CotPositioningPanel {
  private container: HTMLElement;
  private instruments: COTInstrument[] = [];
  private source: DataSource = 'cached';
  private errorMessage = '';

  constructor(container: HTMLElement) { this.container = container; }
  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'CotPositioning', fallback: DEMO_COT},
      async () => {
        const raw = getHydratedData('cotPositioning') as { instruments?: Array<{ name: string; netPosition: number | null; change: number | null; pctChange?: number | null }> } | undefined;
        if (raw?.instruments?.length) {
          return raw.instruments.map(inst => ({
            name: inst.name,
            netPosition: inst.netPosition ?? null,
            change: inst.change ?? null,
            pctChange: inst.pctChange ?? null,
          }));
        }
        return DEMO_COT;
      },
      (data) => Array.isArray(data),
    );
    this.instruments = result.data;
    this.source = result.source;
  }

  private netColor(v: number | null): string { return v == null ? 'text-on-surface-variant' : v > 0 ? 'text-primary' : 'text-error'; }
  private chgColor(v: number | null): string { return v == null ? 'text-on-surface-variant' : v > 0 ? 'text-green-400' : 'text-red-400'; }
  private barW(v: number | null): number { return v == null ? 0 : Math.min(Math.abs(v) / 2500, 100); }
  private barC(v: number | null): string { return v == null ? 'bg-white/20' : v > 0 ? 'bg-primary/60' : 'bg-error/60'; }

  render(): void {
    const hasData = this.instruments.length > 0;

    let body = '';
    if (hasData) {
      body = `
      <div class="flex flex-col gap-1.5 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.instruments.map((inst, i) => `
          <div class="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.03 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-on-surface font-body-sm panel-body">${inst.name}</span>
              <span class="text-xs font-data-md ${this.netColor(inst.netPosition)}">${inst.netPosition != null ? inst.netPosition.toLocaleString() : '\u2014'}</span>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5 mb-1"><div class="${this.barC(inst.netPosition)} h-1.5 rounded-full" style="width: ${this.barW(inst.netPosition)}%"></div></div>
            <div class="text-[10px] font-data-md text-on-surface-variant">
              ${inst.change != null ? `<span class="${this.chgColor(inst.change)}">Chg: ${inst.change > 0 ? '+' : ''}${inst.change.toLocaleString()}</span>` : ''}
              ${inst.pctChange != null ? `<span class="ml-2 ${this.chgColor(inst.pctChange)}">${inst.pctChange > 0 ? '+' : ''}${inst.pctChange.toFixed(1)}%</span>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
    } else {
      body = `<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">${this.errorMessage || 'No COT data available'}</div>`;
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">COT Positioning</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${body}`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
