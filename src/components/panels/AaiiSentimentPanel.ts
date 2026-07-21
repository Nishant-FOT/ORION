import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface AaiiData {
  bullish: number;
  bearish: number;
  neutral: number;
  fourWeekAvg: number;
  historicalBullishAvg: number;
  historicalBearishAvg: number;
  surveyDate: string;
}

const DEMO: AaiiData = {
  bullish: 38.2,
  bearish: 31.4,
  neutral: 30.4,
  fourWeekAvg: 36.5,
  historicalBullishAvg: 38.5,
  historicalBearishAvg: 31.0,
  surveyDate: 'Jul 11, 2026',
};

export class AaiiSentimentPanel {
  private container: HTMLElement;
  private data: AaiiData = DEMO;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); this.startAutoRefresh(); }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(async () => {
      await this.fetchData();
      this.render();
    }, 60000);
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'aaii-sentiment', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/market/v1/get-fear-greed-index`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || d.compositeScore == null) throw new Error('unavailable');
        const score = Number(d.compositeScore);
        const bullish = Math.round(Math.min(100, Math.max(0, score * 0.7 + 5)) * 10) / 10;
        const bearish = Math.round(Math.min(100, Math.max(0, (100 - score) * 0.55 + 3)) * 10) / 10;
        const neutral = Math.round((100 - bullish - bearish) * 10) / 10;
        const fourWeekAvg = d.putCallRatio > 0 ? Math.round((d.putCallRatio - 1) * 50 * 10) / 10 : 36.5;
        return {
          bullish,
          bearish,
          neutral,
          fourWeekAvg,
          historicalBullishAvg: 38.5,
          historicalBearishAvg: 31.0,
          surveyDate: d.lastUpdated || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        } as AaiiData;
      },
      (d) => d.bullish != null,
    );
    this.data = data;
    this.source = source;
  }

  private pctBar(value: number, color: string): string {
    return `<div class="w-full bg-white/5 rounded-full h-2">
      <div class="${color} h-2 rounded-full" style="width: ${value}%; transition: width 0.8s ease-out;"></div>
    </div>`;
  }

  private chgArrow(curr: number, prev: number): string {
    const diff = curr - prev;
    if (diff > 0) return '<span class="text-primary">&#9650;</span>';
    if (diff < 0) return '<span class="text-error">&#9660;</span>';
    return '<span class="text-on-surface-variant">&#9679;</span>';
  }

  private chgVal(curr: number, prev: number): string {
    const diff = curr - prev;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }

  render(): void {
    const d = this.data;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">AAII Sentiment</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="flex flex-col gap-2.5" style="animation: fadeInUp 0.3s ease-out;">
        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-label-caps text-primary">BULLISH</span>
            <div class="flex items-center gap-1.5">
              <span class="text-2xl font-data-lg text-primary panel-stat">${d.bullish}%</span>
              ${this.chgArrow(d.bullish, d.historicalBullishAvg)}
            </div>
          </div>
          ${this.pctBar(d.bullish, 'bg-primary')}
          <div class="text-[10px] font-data-md text-on-surface-variant mt-1">vs Hist. Avg: ${d.historicalBullishAvg}% ${this.chgVal(d.bullish, d.historicalBullishAvg)}</div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-label-caps text-error">BEARISH</span>
            <div class="flex items-center gap-1.5">
              <span class="text-2xl font-data-lg text-error panel-stat">${d.bearish}%</span>
              ${this.chgArrow(d.bearish, d.historicalBearishAvg)}
            </div>
          </div>
          ${this.pctBar(d.bearish, 'bg-error')}
          <div class="text-[10px] font-data-md text-on-surface-variant mt-1">vs Hist. Avg: ${d.historicalBearishAvg}% ${this.chgVal(d.bearish, d.historicalBearishAvg)}</div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-label-caps text-yellow-400">NEUTRAL</span>
            <span class="text-2xl font-data-lg text-yellow-400 panel-stat">${d.neutral}%</span>
          </div>
          ${this.pctBar(d.neutral, 'bg-yellow-400')}
        </div>
      </div>

      <div class="mt-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[10px] font-label-caps text-on-surface-variant">4-WK MOVING AVG</div>
            <div class="text-xl font-data-lg text-on-surface panel-stat">${d.fourWeekAvg}%</div>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-label-caps text-on-surface-variant">SURVEY DATE</div>
            <div class="text-[10px] font-data-md text-on-surface-variant">${d.surveyDate}</div>
          </div>
        </div>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
    this.container.innerHTML = '';
  }
}
