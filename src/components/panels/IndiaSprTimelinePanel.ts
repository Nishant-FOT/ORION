import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Cavern {
  name: string;
  location: string;
  capacity: number;
  current: number;
  color: string;
}

interface DrawdownPhase {
  name: string;
  duration: string;
  trigger: string;
  release: string;
  color: string;
}

interface IntlCompare {
  country: string;
  days: number;
  benchmark: number;
  color: string;
}

const CAVERNS: Cavern[] = [
  { name: 'Padur', location: 'Karnataka', capacity: 2.5, current: 2.1, color: 'bg-primary' },
  { name: 'Visakhapatnam', location: 'Andhra Pradesh', capacity: 1.33, current: 1.1, color: 'bg-blue-400' },
  { name: 'Mangalore', location: 'Karnataka', capacity: 1.5, current: 1.25, color: 'bg-emerald-400' },
];

const PHASES: DrawdownPhase[] = [
  { name: 'Conservation', duration: '0-15 days', trigger: 'Supply disruption detected', release: '0.1M bbl/day', color: 'bg-yellow-400' },
  { name: 'Partial Release', duration: '15-45 days', trigger: 'Sustained disruption', release: '0.3M bbl/day', color: 'bg-orange-400' },
  { name: 'Emergency Drawdown', duration: '45-90 days', trigger: 'Critical shortage', release: '0.5M bbl/day', color: 'bg-error' },
];

const INTCOMPARE: IntlCompare[] = [
  { country: 'India', days: 9.5, benchmark: 90, color: 'bg-error' },
  { country: 'IEA Benchmark', days: 90, benchmark: 90, color: 'bg-primary' },
  { country: 'China', days: 90, benchmark: 90, color: 'bg-blue-400' },
  { country: 'Japan', days: 200, benchmark: 90, color: 'bg-emerald-400' },
];

export class IndiaSprTimelinePanel {
  private container: HTMLElement;
  private caverns = CAVERNS;
  private phases = PHASES;
  private intlCompare = INTCOMPARE;
  private totalCurrent = 4.45;
  private totalCapacity = 5.33;
  private sprDays = 9.5;
  private replenishWindow = 52;
  private brentPrice = 82;
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
      {
        name: 'IndiaSprTimelinePanel',
        fallback: { sprDays: this.sprDays, totalCurrent: this.totalCurrent },
      },
      async () => {
        const raw = getHydratedData('crudeInventories') as { weeks?: Array<{ period: string; stocksMb?: number | string }> } | undefined;
        const weeks = raw?.weeks ?? [];
        if (weeks.length > 0) {
          const latest = weeks[0]!;
          const stocksMb = Number(latest.stocksMb);
          if (!isNaN(stocksMb) && stocksMb > 0) {
            const sprBbl = stocksMb * 1_000_000;
            const totalDailyDemand = 4.5;
            const sprDays = Math.round((sprBbl / (totalDailyDemand * 1_000_000)) * 10) / 10;
            const totalCurrent = Math.round((sprBbl / 1_000_000_000) * 100) / 100;
            return { sprDays, totalCurrent };
          }
        }
        return { sprDays: this.sprDays, totalCurrent: this.totalCurrent };
      },
    );
    this.sprDays = data.sprDays;
    this.totalCurrent = data.totalCurrent;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private coverageColor(): string {
    if (this.sprDays < 15) return 'text-error';
    if (this.sprDays < 30) return 'text-orange-400';
    return 'text-primary';
  }

  private phaseCost(phase: DrawdownPhase): string {
    const bblRelease = parseFloat(phase.release.replace('M', '')) * 1_000_000;
    const days = parseInt(phase.duration.split('-')[1] ?? '') - parseInt(phase.duration.split('-')[0] ?? '');
    const cost = bblRelease * days * this.brentPrice;
    if (cost >= 1e9) return `$${(cost / 1e9).toFixed(1)}B`;
    return `$${(cost / 1e6).toFixed(0)}M`;
  }

  render(): void {
    const fillPct = Math.round((this.totalCurrent / this.totalCapacity) * 100);

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">SPR Timeline</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">oil_barrel</span>
          ${renderDataBadge(this.source)}
          <span class="text-[9px] font-data-md text-on-surface-variant">· ${fillPct}% CAPACITY</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">TOTAL SPR</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.totalCurrent}<span class="text-xs text-on-surface-variant">MT</span></div>
          <div class="text-[9px] text-on-surface-variant">of ${this.totalCapacity}MT capacity</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COVERAGE</div>
          <div class="text-2xl font-data-lg ${this.coverageColor()} panel-stat-lg">${this.sprDays}<span class="text-xs text-on-surface-variant"> days</span></div>
          <div class="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div class="h-full bg-error rounded-full" style="width: ${Math.min(100, (this.sprDays / 90) * 100)}%"></div>
          </div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">REPLENISH</div>
          <div class="text-2xl font-data-lg text-orange-400 panel-stat-lg">${this.replenishWindow}<span class="text-xs text-on-surface-variant"> days</span></div>
          <div class="text-[9px] text-on-surface-variant">emergency window</div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.15s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CAVERN LEVELS</div>
        <div class="flex flex-col gap-2">
          ${this.caverns.map((c, i) => {
            const pct = Math.round((c.current / c.capacity) * 100);
            return `
              <div style="animation: fadeInUp 0.3s ease-out ${0.2 + 0.05 * i}s both;">
                <div class="flex justify-between items-center mb-1">
                  <div>
                    <span class="text-[11px] text-on-surface font-body-sm">${c.name}</span>
                    <span class="text-[9px] text-on-surface-variant ml-1">${c.location}</span>
                  </div>
                  <span class="text-[9px] font-data-md text-on-surface-variant">${c.current}/${c.capacity}MT</span>
                </div>
                <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full ${c.color} rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.3s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">DRAWDOWN PHASES</div>
        <div class="flex flex-col gap-2">
          ${this.phases.map((p, i) => `
            <div class="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out ${0.35 + 0.05 * i}s both;">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${p.color}"></span>
                  <span class="text-[11px] text-on-surface font-body-sm">${p.name}</span>
                </div>
                <span class="text-[9px] font-data-md text-on-surface-variant">${p.duration}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-[9px] text-on-surface-variant">${p.trigger}</span>
                <span class="text-[9px] font-data-md ${i === 2 ? 'text-error' : 'text-on-surface-variant'}">${p.release} · ${this.phaseCost(p)}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.5s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">INTERNATIONAL COMPARISON (DAYS)</div>
        <div class="flex flex-col gap-2">
          ${this.intlCompare.map((c, i) => {
            const barWidth = Math.min(100, (c.days / 200) * 100);
            return `
              <div style="animation: fadeInUp 0.3s ease-out ${0.55 + 0.05 * i}s both;">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-[11px] text-on-surface font-body-sm">${c.country}</span>
                  <span class="text-[9px] font-data-md ${c.days < 30 ? 'text-error' : 'text-on-surface-variant'}">${c.days} days</span>
                </div>
                <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full ${c.color} rounded-full transition-all duration-1000" style="width: ${barWidth}%"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 h-px bg-white/10"></div>
          <span class="text-[9px] text-on-surface-variant">IEA 90-day benchmark shown as reference</span>
          <div class="flex-1 h-px bg-white/10"></div>
        </div>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
