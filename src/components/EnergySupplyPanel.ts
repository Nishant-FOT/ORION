import { buildEnergySupplyNetworkModel } from '@/services/energy-supply-network';
import { fetchOilAnalytics } from '@/services/economic';

interface FlowData {
  totalTransit: string;
  atRisk: string;
  vesselsActive: string;
  transitPercent: number;
  riskPercent: number;
  vesselsPercent: number;
  routes: Array<{ name: string; height: number; riskPortion: number }>;
}

export class EnergySupplyPanel {
  private container: HTMLElement;
  private data: FlowData | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    try {
      await Promise.all([
        buildEnergySupplyNetworkModel(),
        fetchOilAnalytics(),
      ]);

      // Use fallback data since metrics don't have transit/vessel data
      this.data = {
        totalTransit: '8.4M',
        atRisk: '1.2M',
        vesselsActive: '1,492',
        transitPercent: 80,
        riskPercent: 15,
        vesselsPercent: 65,
        routes: [
          { name: 'Suez', height: 80, riskPortion: 15 },
          { name: 'Malacca', height: 60, riskPortion: 0 },
          { name: 'Hormuz', height: 95, riskPortion: 40 },
          { name: 'Panama', height: 45, riskPortion: 0 },
        ],
      };
    } catch (err) {
      console.warn('[EnergySupplyPanel] Failed to fetch data:', err);
      this.data = {
        totalTransit: '8.4M',
        atRisk: '1.2M',
        vesselsActive: '1,492',
        transitPercent: 80,
        riskPercent: 15,
        vesselsPercent: 65,
        routes: [
          { name: 'Suez', height: 80, riskPortion: 15 },
          { name: 'Malacca', height: 60, riskPortion: 0 },
          { name: 'Hormuz', height: 95, riskPortion: 40 },
          { name: 'Panama', height: 45, riskPortion: 0 },
        ],
      };
    }
  }

  render(): void {
    if (!this.data) return;

    const barsHtml = this.data.routes.map(route => {
      const riskHeight = route.riskPortion;
      const safeHeight = 100 - riskHeight;
      return `
        <div class="w-full bg-gradient-to-t from-primary/10 to-primary/30 rounded-t-md flex flex-col justify-end group relative overflow-hidden border border-primary/20 border-b-0 hover:-translate-y-2 transition-transform duration-300 cursor-pointer" style="height: ${route.height}%;">
          <div class="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div class="absolute inset-0 shimmer-bg opacity-30"></div>
          ${riskHeight > 0 ? `<div class="bg-error/70 w-full group-hover:bg-error transition-colors backdrop-blur-sm" style="height: ${riskHeight}%;"></div>` : ''}
          <div class="bg-primary/50 w-full group-hover:bg-primary/70 transition-colors backdrop-blur-sm" style="height: ${safeHeight}%;"></div>
        </div>
      `;
    }).join('');

    const labelsHtml = this.data.routes.map(r =>
      `<span class="hover:text-primary hover:-translate-y-1 transition-all cursor-pointer">${r.name}</span>`
    ).join('');

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Global Flow Dynamics</h3>
        <div class="flex gap-2 bg-black/20 p-1 rounded-lg">
          <button class="text-xs bg-white/10 px-3 py-1.5 rounded-md text-on-surface shadow-sm transition-all hover:bg-white/20">VOL</button>
          <button class="text-xs px-3 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface transition-all hover:bg-white/5">VESSELS</button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="flex flex-col gap-1 hover:-translate-y-1 transition-transform">
          <div class="text-on-surface-variant font-label-caps text-[10px]">TOTAL TRANSIT</div>
          <div class="text-3xl font-data-lg text-on-surface tracking-tight shimmer-bg inline-block">${this.data.totalTransit} <span class="text-base text-on-surface-variant">bpd</span></div>
          <div class="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div class="h-full bg-primary/40 rounded-full flow-line" style="width: ${this.data.transitPercent}%;"></div></div>
        </div>
        <div class="flex flex-col gap-1 hover:-translate-y-1 transition-transform">
          <div class="text-on-surface-variant font-label-caps text-[10px]">AT RISK</div>
          <div class="text-3xl font-data-lg text-error tracking-tight shimmer-bg inline-block">${this.data.atRisk} <span class="text-base text-on-surface-variant">bpd</span></div>
          <div class="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div class="h-full bg-error/60 rounded-full relative overflow-hidden" style="width: ${this.data.riskPercent}%;"><div class="absolute inset-0 bg-white/20 animate-pulse"></div></div></div>
        </div>
        <div class="flex flex-col gap-1 hover:-translate-y-1 transition-transform">
          <div class="text-on-surface-variant font-label-caps text-[10px]">VESSELS ACTIVE</div>
          <div class="text-3xl font-data-lg text-primary tracking-tight shimmer-bg inline-block">${this.data.vesselsActive}</div>
          <div class="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden"><div class="h-full bg-primary rounded-full flow-line" style="width: ${this.data.vesselsPercent}%;"></div></div>
        </div>
      </div>
      <div class="flex-grow relative h-48 border-b border-l border-white/10 ml-8 mb-4">
        <div class="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-[10px] text-on-surface-variant font-data-md">
          <span>4M</span><span>3M</span><span>2M</span><span>1M</span><span>0</span>
        </div>
        <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div class="w-full h-px bg-white/5"></div>
          <div class="w-full h-px bg-white/5"></div>
          <div class="w-full h-px bg-white/5"></div>
          <div class="w-full h-px bg-white/5"></div>
          <div class="w-full h-px bg-white/5"></div>
        </div>
        <div class="absolute inset-0 flex items-end justify-around px-6 gap-8 z-10">
          ${barsHtml}
        </div>
        <div class="absolute -bottom-8 left-0 right-0 flex justify-around text-xs text-on-surface-variant font-data-md">
          ${labelsHtml}
        </div>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
