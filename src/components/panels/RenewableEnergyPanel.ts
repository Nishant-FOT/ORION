interface RegionData {
  code: string;
  name: string;
  percentage: number;
  year: number;
}

interface PanelData {
  globalPercentage: number;
  globalYear: number;
  regions: RegionData[];
  capacity: Array<{ name: string; growth: string; color: string }>;
}

const EMPTY_DATA: PanelData = {
  globalPercentage: 0,
  globalYear: 0,
  regions: [],
  capacity: [],
};

export class RenewableEnergyPanel {
  private container: HTMLElement;
  private data: PanelData = { ...EMPTY_DATA };
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const { fetchRenewableEnergyData, fetchEnergyCapacity } = await import('@/services/renewable-energy-data');
      const [renewable, capacity] = await Promise.allSettled([
        fetchRenewableEnergyData(),
        fetchEnergyCapacity(),
      ]);

      let gotLive = false;

      if (renewable.status === 'fulfilled') {
        const d = renewable.value;
        if (d.globalPercentage > 0) {
          this.data.globalPercentage = d.globalPercentage;
          this.data.globalYear = d.globalYear;
          this.data.regions = d.regions.slice(0, 6);
          gotLive = true;
        }
      }

      if (capacity.status === 'fulfilled' && capacity.value.length > 0) {
        const capMap: Record<string, { name: string; color: string }> = {
          SUN: { name: 'Solar', color: 'bg-yellow-400' },
          WND: { name: 'Wind', color: 'bg-cyan-400' },
          COL: { name: 'Coal', color: 'bg-gray-400' },
        };
        this.data.capacity = capacity.value.map(s => {
          const meta = capMap[s.source] ?? { name: s.name, color: 'bg-primary' };
          const latest = s.data[s.data.length - 1];
          const prev = s.data[s.data.length - 2];
          const growth = latest && prev ? Math.round(((latest.capacityMw - prev.capacityMw) / prev.capacityMw) * 100) : 0;
          return { name: meta.name, growth: `${growth >= 0 ? '+' : ''}${growth}%`, color: meta.color };
        });
        gotLive = true;
      }

      this.isLive = gotLive;

      if (!gotLive) {
        this.data = {
          globalPercentage: 30,
          globalYear: 2024,
          regions: [
            { code: 'EU', name: 'Europe', percentage: 45, year: 2024 },
            { code: 'NA', name: 'North America', percentage: 28, year: 2024 },
            { code: 'APAC', name: 'Asia Pacific', percentage: 22, year: 2024 },
            { code: 'SA', name: 'South America', percentage: 38, year: 2024 },
            { code: 'AF', name: 'Africa', percentage: 18, year: 2024 },
          ],
          capacity: [
            { name: 'Solar', growth: '+12%', color: 'bg-yellow-400' },
            { name: 'Wind', growth: '+8%', color: 'bg-cyan-400' },
            { name: 'Coal', growth: '-3%', color: 'bg-gray-400' },
          ],
        };
      }
    } catch { /* defaults remain empty */ }
  }

  private regionBar(pct: number): string {
    const color = pct >= 50 ? 'bg-primary' : pct >= 30 ? 'bg-cyan-400' : 'bg-orange-400';
    return `<div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div class="h-full ${color} rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
    </div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Renewable Energy</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">eco</span>
          <span class="w-2 h-2 rounded-full ${this.isLive ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span>
        </div>
      </div>
      ${this.data.globalPercentage === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">eco</span>
            <span class="text-xs">No renewable energy data available</span>
          </div>`
        : `
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">GLOBAL RENEWABLE %</div>
        <div class="text-3xl font-data-lg text-primary panel-stat-lg">${this.data.globalPercentage}%</div>
        <div class="text-[10px] font-data-md text-on-surface-variant">${this.data.globalYear}</div>
        <div class="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${this.data.globalPercentage}%"></div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">REGIONAL BREAKDOWN</div>
        <div class="flex flex-col gap-2">
          ${this.data.regions.map((r, i) => `
            <div style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-on-surface-variant font-body-sm">${r.name}</span>
                <span class="text-[10px] text-on-surface font-data-md">${r.percentage}%</span>
              </div>
              ${this.regionBar(r.percentage)}
            </div>`).join('')}
        </div>
      </div>
      ${this.data.capacity.length > 0 ? `
        <div class="w-full h-px bg-white/5 my-3"></div>
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CAPACITY TRENDS</div>
        <div class="flex gap-2">
          ${this.data.capacity.map((c, i) => `
            <div class="flex-1 p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer"
                 style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
              <div class="w-2 h-2 rounded-full ${c.color} mx-auto mb-1"></div>
              <div class="text-[9px] font-label-caps text-on-surface-variant">${c.name}</div>
              <div class="text-xs font-data-md text-on-surface">${c.growth}</div>
            </div>`).join('')}
        </div>` : ''}`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
