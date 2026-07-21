import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface GeopoliticalHub {
  name: string;
  region: string;
  riskScore: number;
  trend: 'up' | 'down' | 'stable';
  lastEvent: string;
  timeAgo: string;
  icon: string;
  volatilityIndex: number;
}

const GLOBAL_HUBS: GeopoliticalHub[] = [
  { name: 'Strait of Hormuz', region: 'Persian Gulf', riskScore: 82, trend: 'up', lastEvent: 'Naval exercises reported', timeAgo: '2h ago', icon: 'water', volatilityIndex: 78 },
  { name: 'Red Sea / Bab el-Mandeb', region: 'Yemen', riskScore: 75, trend: 'up', lastEvent: 'Houthi drone attack', timeAgo: '4h ago', icon: 'directions_boat', volatilityIndex: 84 },
  { name: 'Taiwan Strait', region: 'East Asia', riskScore: 68, trend: 'stable', lastEvent: 'PLA aircraft incursions', timeAgo: '6h ago', icon: 'sailing', volatilityIndex: 52 },
  { name: 'South China Sea', region: 'Southeast Asia', riskScore: 61, trend: 'up', lastEvent: 'Philippine vessel confrontation', timeAgo: '12h ago', icon: 'anchor', volatilityIndex: 48 },
  { name: 'Eastern Mediterranean', region: 'Cyprus/Lebanon', riskScore: 54, trend: 'down', lastEvent: 'Gas field dispute talks', timeAgo: '1d ago', icon: 'local_gas_station', volatilityIndex: 35 },
  { name: 'Gulf of Guinea', region: 'West Africa', riskScore: 42, trend: 'stable', lastEvent: 'Piracy incident reported', timeAgo: '2d ago', icon: 'sailing', volatilityIndex: 28 },
  { name: 'Baltic Sea', region: 'Northern Europe', riskScore: 38, trend: 'down', lastEvent: 'Pipeline surveillance', timeAgo: '3d ago', icon: 'cable', volatilityIndex: 22 },
  { name: 'Panama Canal', region: 'Central America', riskScore: 35, trend: 'stable', lastEvent: 'Drought restrictions eased', timeAgo: '5d ago', icon: 'water', volatilityIndex: 18 },
];

export class GeopoliticalHubsPanel {
  private container: HTMLElement;
  private hubs: GeopoliticalHub[] = [];
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      {
        name: 'GeopoliticalHubsPanel',
        fallback: GLOBAL_HUBS.map(h => ({ ...h })),
      },
      async () => {
        const { fetchChokepointStatus } = await import('@/services/supply-chain');
        const status = await fetchChokepointStatus();
        if (status?.chokepoints?.length) {
          return status.chokepoints.slice(0, 8).map(cp => ({
            name: cp.name,
            region: cp.directions?.[0] ?? 'Global',
            riskScore: cp.disruptionScore,
            trend: cp.disruptionScore > 70 ? 'up' as const : cp.disruptionScore < 40 ? 'down' as const : 'stable' as const,
            lastEvent: cp.transitSummary?.riskLevel ?? 'Monitoring',
            timeAgo: 'Live',
            icon: 'radar',
            volatilityIndex: Math.round(cp.disruptionScore * 0.9),
          }));
        }
        return GLOBAL_HUBS.map(h => ({ ...h }));
      },
    );
    this.hubs = data;
    this.source = source;
  }

  private riskColor(s: number): string {
    if (s >= 75) return 'text-error';
    if (s >= 55) return 'text-orange-400';
    if (s >= 35) return 'text-yellow-400';
    return 'text-primary';
  }

  private riskBg(s: number): string {
    if (s >= 75) return 'bg-error';
    if (s >= 55) return 'bg-orange-400';
    if (s >= 35) return 'bg-yellow-400';
    return 'bg-primary';
  }

  private trendIcon(t: string): string {
    if (t === 'up') return '\u25B2 text-error';
    if (t === 'down') return '\u25BC text-primary';
    return '\u25C6 text-on-surface-variant';
  }

  render(): void {
    const avgRisk = Math.round(this.hubs.reduce((s, h) => s + h.riskScore, 0) / (this.hubs.length || 1));
    const highRisk = this.hubs.filter(h => h.riskScore >= 65).length;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Geopolitical Hubs</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">AVG RISK</div>
          <div class="text-xl font-data-lg ${this.riskColor(avgRisk)} panel-stat-lg">${avgRisk}</div>
        </div>
        <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">HIGH RISK</div>
          <div class="text-xl font-data-lg text-error panel-stat-lg">${highRisk}</div>
        </div>
        <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">HUBS</div>
          <div class="text-xl font-data-lg text-on-surface panel-stat-lg">${this.hubs.length}</div>
        </div>
      </div>
      <div class="flex flex-col gap-1.5" style="max-height: calc(100% - 160px); overflow-y: auto;">
        ${this.hubs.map((h, i) => `
          <div class="p-2.5 bg-white/5 hover:bg-white/10 transition-all rounded-xl flex items-center justify-between cursor-pointer group hover:scale-[1.01]" style="animation: fadeInUp 0.3s ease-out ${0.15 + 0.04 * i}s both;">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              <span class="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors">${h.icon}</span>
              <div class="min-w-0">
                <div class="text-xs text-on-surface font-body-sm truncate group-hover:text-primary transition-colors">${h.name}</div>
                <div class="text-[9px] text-on-surface-variant/60 font-data-md">${h.region} \u00B7 ${h.timeAgo}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] ${this.riskColor(h.riskScore)}">${h.riskScore}</span>
              <div class="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full ${this.riskBg(h.riskScore)} rounded-full transition-all duration-1000" style="width: ${h.riskScore}%"></div>
              </div>
              <span class="text-[10px] ${this.trendIcon(h.trend)}">${h.trend === 'up' ? '\u25B2' : h.trend === 'down' ? '\u25BC' : '\u25C6'}</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
