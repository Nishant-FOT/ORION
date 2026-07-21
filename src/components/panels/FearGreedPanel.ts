import { getHydratedData } from '@/services/bootstrap';

interface FearGreedData {
  value: number;
  label: string;
  previousClose: number;
  weeklyChange: number;
  monthlyChange: number;
}

const LABEL_COLORS: Record<string, string> = {
  'Extreme Fear': 'text-error',
  'Fear': 'text-orange-400',
  'Neutral': 'text-yellow-400',
  'Greed': 'text-primary',
  'Extreme Greed': 'text-emerald-400',
};

function getLabel(value: number): string {
  if (value <= 25) return 'Extreme Fear';
  if (value <= 45) return 'Fear';
  if (value <= 55) return 'Neutral';
  if (value <= 75) return 'Greed';
  return 'Extreme Greed';
}

function getGaugeColor(value: number): string {
  if (value <= 25) return '#ef4444';
  if (value <= 45) return '#f97316';
  if (value <= 55) return '#eab308';
  if (value <= 75) return '#84cc16';
  return '#22c55e';
}

function trendArrow(val: number): string {
  if (val > 0) return '<span class="text-primary">&#9650;</span>';
  if (val < 0) return '<span class="text-error">&#9660;</span>';
  return '<span class="text-on-surface-variant">&#9679;</span>';
}

export class FearGreedPanel {
  private container: HTMLElement;
  private data: FearGreedData = { value: 50, label: 'Neutral', previousClose: 48, weeklyChange: 2, monthlyChange: -5 };
  private isLive = false;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    try {
      const raw = getHydratedData('fearGreedIndex') as { composite?: { score: number; label?: string; previous?: number } } | undefined;
      const composite = raw?.composite;
      if (composite && composite.score > 0) {
        const prev = composite.previous ?? composite.score;
        this.data = {
          value: composite.score,
          label: composite.label || getLabel(composite.score),
          previousClose: prev,
          weeklyChange: composite.score - prev,
          monthlyChange: 0,
        };
        this.isLive = true;
        return;
      }
    } catch { /* fall through to default */ }
    this.isLive = false;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  render(): void {
    const d = this.data;
    const live = this.isLive;
    const color = getGaugeColor(d.value);
    const labelColor = LABEL_COLORS[d.label] || 'text-on-surface';
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (d.value / 100) * circumference * 0.75;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Fear & Greed</h3>
        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${live ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span><span class="text-[10px] font-data-md ${live ? 'text-primary' : 'text-on-surface-variant/60'}">${live ? 'LIVE' : 'DEMO'}</span></div>
      </div>
      <div class="flex flex-col items-center mb-4">
        <svg width="140" height="100" viewBox="0 0 120 100">
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="10" stroke-dasharray="${circumference * 0.75} ${circumference * 0.25}" stroke-linecap="round" transform="rotate(135 60 60)"/>
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="10" stroke-dasharray="${circumference - offset} ${offset}" stroke-linecap="round" transform="rotate(135 60 60)" style="transition: stroke-dasharray 1s ease-out;"/>
        </svg>
        <div class="text-center -mt-6">
          <div class="text-3xl font-data-lg text-on-surface panel-stat-lg">${d.value}</div>
          <div class="text-[10px] font-label-caps ${labelColor} uppercase tracking-wider">${d.label}</div>
        </div>
      </div>
      <div class="panel-grid-inner mb-3">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">PREV CLOSE</div>
          <div class="text-lg font-data-lg text-on-surface panel-stat">${d.previousClose}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">WEEKLY</div>
          <div class="text-lg font-data-lg ${d.weeklyChange >= 0 ? 'text-primary' : 'text-error'} panel-stat">${trendArrow(d.weeklyChange)} ${d.weeklyChange > 0 ? '+' : ''}${d.weeklyChange}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">MONTHLY</div>
          <div class="text-lg font-data-lg ${d.monthlyChange >= 0 ? 'text-primary' : 'text-error'} panel-stat">${trendArrow(d.monthlyChange)} ${d.monthlyChange > 0 ? '+' : ''}${d.monthlyChange}</div>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
        <div class="flex items-center gap-2 mb-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">trending_up</span>
          <span class="text-[10px] font-label-caps text-on-surface-variant">TREND</span>
        </div>
        <div class="flex items-center gap-1">
          ${Array.from({ length: 30 }, (_, i) => {
            const val = 20 + Math.sin(i * 0.3 + d.value * 0.05) * 30 + Math.random() * 10;
            const h = Math.max(4, Math.round(val * 0.5));
            const c = getGaugeColor(val);
            return `<div class="flex-1 rounded-sm" style="height: ${h}px; background: ${c}; opacity: 0.7;"></div>`;
          }).join('')}
        </div>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
