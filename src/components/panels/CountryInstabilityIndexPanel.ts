import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface InstabilityCountry {
  rank: number;
  country: string;
  code: string;
  score: number;
  trend: 'rising' | 'stable' | 'falling';
  level: string;
  change24h: number;
}

const DEMO_COUNTRIES: InstabilityCountry[] = [
  { rank: 1, country: 'Sudan', code: 'SD', score: 92, trend: 'rising', level: 'critical', change24h: 3.1 },
  { rank: 2, country: 'Yemen', code: 'YE', score: 88, trend: 'rising', level: 'critical', change24h: 1.8 },
  { rank: 3, country: 'Myanmar', code: 'MM', score: 84, trend: 'stable', level: 'high', change24h: 0.5 },
  { rank: 4, country: 'Somalia', code: 'SO', score: 79, trend: 'rising', level: 'high', change24h: 2.3 },
  { rank: 5, country: 'Afghanistan', code: 'AF', score: 76, trend: 'stable', level: 'high', change24h: -0.2 },
  { rank: 6, country: 'Ethiopia', code: 'ET', score: 71, trend: 'falling', level: 'elevated', change24h: -1.4 },
];

export class CountryInstabilityIndexPanel {
  private container: HTMLElement;
  private countries: InstabilityCountry[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'Country Instability Index', fallback: DEMO_COUNTRIES},
      async () => {
        const { loadAllCIIData } = await import('@/services/cii-data-loader');
        const data = await loadAllCIIData();
        if (data?.length) {
          return [...data]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((c, i) => ({
              rank: i + 1,
              country: c.name,
              code: c.code,
              score: c.score,
              trend: c.trend as InstabilityCountry['trend'],
              level: c.level,
              change24h: c.change24h,
            }));
        }
        return DEMO_COUNTRIES;
      },
      (data) => Array.isArray(data),
    );
    this.countries = result.data;
    this.source = result.source;
  }

  private scoreColor(s: number): string {
    if (s >= 80) return 'text-error';
    if (s >= 65) return 'text-orange-400';
    if (s >= 50) return 'text-yellow-400';
    return 'text-primary';
  }

  private barColor(s: number): string {
    if (s >= 80) return 'bg-error';
    if (s >= 65) return 'bg-orange-400';
    if (s >= 50) return 'bg-yellow-400';
    return 'bg-primary';
  }

  private levelBadge(l: string): string {
    const m: Record<string, string> = {
      critical: 'bg-error/15 text-error border-error/20',
      high: 'bg-orange-400/15 text-orange-400 border-orange-400/20',
      elevated: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20',
      normal: 'bg-white/5 text-on-surface-variant border-white/10',
    };
    return m[l] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  private trendIcon(t: string): string {
    return t === 'rising' ? 'trending_up' : t === 'falling' ? 'trending_down' : 'trending_flat';
  }

  private trendColor(t: string): string {
    return t === 'rising' ? 'text-error' : t === 'falling' ? 'text-primary' : 'text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Instability Index</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${this.countries.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">globe</span>
            <span class="text-xs">No instability data available</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.countries.map((c, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-2.5 rounded-xl border border-white/5 group cursor-pointer flex items-center gap-3" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <span class="text-xs font-data-md text-on-surface-variant/50 w-4 text-right">${c.rank}</span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors truncate">${c.country}</span>
                <div class="flex items-center gap-1.5">
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data-md border ${this.levelBadge(c.level)}">${c.level.toUpperCase()}</span>
                  <span class="text-[10px] font-data-md ${this.trendColor(c.trend)}">
                    <span class="material-symbols-outlined text-[10px] align-middle">${this.trendIcon(c.trend)}</span>
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full ${this.barColor(c.score)} rounded-full" style="width: ${c.score}%"></div>
                </div>
                <span class="text-sm font-data-lg ${this.scoreColor(c.score)} w-7 text-right">${c.score}</span>
                ${c.change24h !== 0 ? `
                  <span class="text-[9px] font-data-md ${c.change24h > 0 ? 'text-error' : 'text-primary'}">${c.change24h > 0 ? '+' : ''}${c.change24h}</span>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
