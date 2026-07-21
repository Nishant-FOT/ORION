import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Corridor {
  name: string;
  from: string;
  to: string;
  riskScore: number;
  vessels: number;
  transitDays: number;
  insurancePct: number;
  disruptions: number;
  alternatives: string[];
  icon: string;
}

const CORRIDORS: Corridor[] = [
  {
    name: 'Persian Gulf', from: 'Persian Gulf', to: 'West Coast India',
    riskScore: 82, vessels: 23, transitDays: 8, insurancePct: 3.2,
    disruptions: 2, alternatives: ['Ras Tanura bypass', 'Sumed pipeline reroute'],
    icon: 'sailing',
  },
  {
    name: 'Red Sea', from: 'Red Sea', to: 'West Coast India',
    riskScore: 75, vessels: 14, transitDays: 12, insurancePct: 4.5,
    disruptions: 3, alternatives: ['Cape of Good Hope', 'Overland via Suez pipeline'],
    icon: 'directions_boat',
  },
  {
    name: 'Cape Route', from: 'Cape of Good Hope', to: 'West Coast India',
    riskScore: 28, vessels: 8, transitDays: 28, insurancePct: 1.1,
    disruptions: 0, alternatives: ['Direct routing', 'Atlantic bypass'],
    icon: 'explore',
  },
  {
    name: 'Malacca', from: 'Strait of Malacca', to: 'East Coast India',
    riskScore: 45, vessels: 11, transitDays: 14, insurancePct: 1.8,
    disruptions: 1, alternatives: ['Lombok Strait', 'Sunda Strait'],
    icon: 'water',
  },
  {
    name: 'West Africa', from: 'West Africa', to: 'West Coast India',
    riskScore: 35, vessels: 6, transitDays: 22, insurancePct: 1.5,
    disruptions: 0, alternatives: ['Direct Atlantic routing', 'Suez Canal transit'],
    icon: 'waves',
  },
];

export class CorridorRiskMonitorPanel {
  private container: HTMLElement;
  private corridors = CORRIDORS;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'corridor-risk-monitor', fallback: CORRIDORS },
      async () => {
        const hydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
        const brent = hydrated?.prices?.find(p => p.commodity === 'RBRTE');
        if (!brent) return CORRIDORS;
        const brentPrice = brent.price;
        const volatilityAdjust = Math.min(10, Math.max(-10, (brentPrice - 80) * 0.5));
        return CORRIDORS.map(c => ({
          ...c,
          riskScore: Math.min(100, Math.max(0, Math.round(c.riskScore + volatilityAdjust * (c.riskScore / 100)))),
        }));
      },
    );
    this.corridors = data;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private riskColor(score: number): string {
    if (score >= 70) return 'text-error';
    if (score >= 50) return 'text-orange-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-primary';
  }

  private riskBg(score: number): string {
    if (score >= 70) return 'bg-error';
    if (score >= 50) return 'bg-orange-400';
    if (score >= 30) return 'bg-yellow-400';
    return 'bg-primary';
  }

  private riskLabel(score: number): string {
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'ELEVATED';
    if (score >= 30) return 'MODERATE';
    return 'LOW';
  }

  private riskBadge(score: number): string {
    if (score >= 70) return 'bg-error/10 text-error border border-error/20';
    if (score >= 50) return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    if (score >= 30) return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  private disruptionBadge(count: number): string {
    if (count >= 2) return 'bg-error/10 text-error border border-error/20';
    if (count === 1) return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-white/5 text-on-surface-variant border border-white/10';
  }

  render(): void {
    const totalVessels = this.corridors.reduce((s, c) => s + c.vessels, 0);
    const avgRisk = Math.round(this.corridors.reduce((s, c) => s + c.riskScore, 0) / this.corridors.length);
    const activeDisruptions = this.corridors.reduce((s, c) => s + c.disruptions, 0);

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Corridor Risk Monitor</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">radar</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">VESSELS IN TRANSIT</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${totalVessels}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">AVG RISK</div>
          <div class="text-2xl font-data-lg ${this.riskColor(avgRisk)} panel-stat-lg">${avgRisk}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DISRUPTIONS</div>
          <div class="text-2xl font-data-lg ${activeDisruptions > 0 ? 'text-error' : 'text-primary'} panel-stat-lg">${activeDisruptions}</div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out 0.15s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CORRIDOR MAP</div>
        <div class="relative flex flex-col items-center py-2">
          <div class="text-[9px] font-data-md text-on-surface mb-2 px-2 py-1 bg-primary/10 text-primary rounded border border-primary/20">INDIA</div>
          <div class="w-px h-2 bg-white/20"></div>
          <div class="grid grid-cols-5 gap-3 mt-1">
            ${this.corridors.map((c, i) => `
              <div class="flex flex-col items-center gap-1" style="animation: fadeInUp 0.3s ease-out ${0.2 + 0.05 * i}s both;">
                <div class="w-px h-3 ${this.riskBg(c.riskScore)} opacity-60"></div>
                <div class="w-8 h-8 rounded-lg ${this.riskBg(c.riskScore)} flex items-center justify-center opacity-80">
                  <span class="material-symbols-outlined text-white text-sm">${c.icon}</span>
                </div>
                <span class="text-[8px] font-label-caps text-on-surface-variant text-center leading-tight">${c.name}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        ${this.corridors.map((c, i) => `
          <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.35 + 0.06 * i}s both;">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-on-surface-variant text-sm">${c.icon}</span>
                <div>
                  <span class="text-[11px] text-on-surface font-body-sm">${c.from} → ${c.to}</span>
                </div>
              </div>
              <span class="px-2 py-0.5 text-[9px] font-data-md rounded ${this.riskBadge(c.riskScore)}">${this.riskLabel(c.riskScore)} ${c.riskScore}</span>
            </div>
            <div class="grid grid-cols-4 gap-2 mb-2">
              <div class="text-center">
                <div class="text-[8px] font-label-caps text-on-surface-variant">VESSELS</div>
                <div class="text-sm font-data-lg text-on-surface">${c.vessels}</div>
              </div>
              <div class="text-center">
                <div class="text-[8px] font-label-caps text-on-surface-variant">TRANSIT</div>
                <div class="text-sm font-data-lg text-on-surface">${c.transitDays}d</div>
              </div>
              <div class="text-center">
                <div class="text-[8px] font-label-caps text-on-surface-variant">INSURANCE</div>
                <div class="text-sm font-data-lg ${c.insurancePct > 3 ? 'text-error' : 'text-on-surface'}">${c.insurancePct}%</div>
              </div>
              <div class="text-center">
                <div class="text-[8px] font-label-caps text-on-surface-variant">DISRUPTIONS</div>
                <span class="inline-block px-1.5 py-0.5 text-[9px] font-data-md rounded ${this.disruptionBadge(c.disruptions)}">${c.disruptions}</span>
              </div>
            </div>
            <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
              <div class="h-full ${this.riskBg(c.riskScore)} rounded-full transition-all duration-1000" style="width: ${c.riskScore}%"></div>
            </div>
            ${c.alternatives.length > 0 ? `
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-[8px] font-label-caps text-on-surface-variant">ALTERNATIVES:</span>
                ${c.alternatives.map(a => `<span class="text-[8px] font-data-md px-1.5 py-0.5 bg-white/5 rounded text-on-surface-variant">${a}</span>`).join('')}
              </div>` : ''}
          </div>`).join('')}
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
