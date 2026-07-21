import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface WsbTicker {
  ticker: string;
  mentions: number;
  sentiment: number;
}

const DEMO: WsbTicker[] = [
  { ticker: 'GME', mentions: 842, sentiment: 0.82 },
  { ticker: 'AMC', mentions: 631, sentiment: 0.75 },
  { ticker: 'NVDA', mentions: 420, sentiment: 0.91 },
  { ticker: 'TSLA', mentions: 315, sentiment: 0.68 },
  { ticker: 'AAPL', mentions: 284, sentiment: 0.85 },
  { ticker: 'AMD', mentions: 201, sentiment: 0.72 },
];

export class WsbTickersPanel {
  static readonly defaultEnabled = false;
  private container: HTMLElement;
  private tickers: WsbTicker[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    this.tickers = DEMO;
    this.source = 'cached';
  }

  private sentimentColor(v: number): string { return v >= 0.7 ? 'text-primary' : v >= 0.4 ? 'text-yellow-400' : 'text-error'; }
  private sentimentBar(v: number): string { return v >= 0.7 ? 'bg-primary/60' : v >= 0.4 ? 'bg-yellow-400/60' : 'bg-error/60'; }

  render(): void {
    const maxMentions = Math.max(...this.tickers.map(t => t.mentions));

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">WSB Tickers</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="flex flex-col gap-1.5" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.tickers.map((t, i) => {
          const barW = (t.mentions / maxMentions) * 100;
          return `<div class="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-data-md text-on-surface font-bold">${t.ticker}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs font-data-md text-on-surface-variant">${t.mentions} mentions</span>
                <span class="text-xs font-data-md ${this.sentimentColor(t.sentiment)}">${t.sentiment.toFixed(2)}</span>
              </div>
            </div>
            <div class="w-full bg-white/5 rounded-full h-1.5">
              <div class="${this.sentimentBar(t.sentiment)} h-1.5 rounded-full" style="width: ${barW}%"></div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
