import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface DisruptionEvent {
  name: string;
  type: string;
  status: string;
  severity: number;
  affectedRoutes: string[];
  region: string;
}

const DEMO_DISRUPTIONS: DisruptionEvent[] = [
  { name: 'North Sea Platform Shutdown', type: 'Infrastructure', status: 'Critical', severity: 87, affectedRoutes: ['Forties Blend', 'Oseberg'], region: 'North Sea' },
  { name: 'Red Sea Shipping Diversion', type: 'Supply Chain', status: 'Active', severity: 72, affectedRoutes: ['Suez Canal', 'Bab el-Mandeb'], region: 'Middle East' },
  { name: 'Gulf of Mexico Storm Warning', type: 'Weather', status: 'Active', severity: 58, affectedRoutes: ['WTI Cushing', 'Gulf Coast'], region: 'Americas' },
  { name: 'Caspian Pipeline Maintenance', type: 'Maintenance', status: 'Monitoring', severity: 35, affectedRoutes: ['BTC Blend', 'CPC Blend'], region: 'Central Asia' },
];

export class EnergyDisruptionsPanel {
  private container: HTMLElement;
  private disruptions: DisruptionEvent[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'energy-disruptions', fallback: DEMO_DISRUPTIONS},
      async () => {
        const energyData = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; value: number }> } | undefined;
        const brent = energyData?.prices?.find(p => p.commodity === 'RBRTE');
        const brentVal = brent ? Number(brent.value) : 0;
        const events: DisruptionEvent[] = [];
        if (brentVal > 85) {
          events.push({
            name: 'Brent Price Spike',
            type: 'Price Disruption',
            status: 'Active',
            severity: Math.min(95, Math.round((brentVal - 70) * 2)),
            affectedRoutes: ['Global crude flows'],
            region: 'Global',
          });
        }
        if (brentVal > 90) {
          events.push({
            name: 'High Brent Premium',
            type: 'Market Stress',
            status: 'Active',
            severity: Math.min(90, Math.round((brentVal - 75) * 1.8)),
            affectedRoutes: ['Brent-linked pricing'],
            region: 'Global',
          });
        }
        events.push({
          name: 'Normal Operations',
          type: 'Operational Status',
          status: 'Stable',
          severity: 15,
          affectedRoutes: ['All routes nominal'],
          region: 'Global',
        });
        return events;
      },
      (data) => Array.isArray(data),
    );
    this.disruptions = result.data;
    this.source = result.source;
  }

  private severityBg(s: number): string {
    if (s >= 80) return 'bg-error/10 text-error border border-error/20 animate-pulse-slow';
    if (s >= 60) return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    if (s >= 40) return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }
  private statusBadge(s: string): string {
    if (s === 'Critical' || s === 'Severe') return 'bg-error/10 text-error border border-error/20';
    if (s === 'Active') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-white/5 text-on-surface-variant border border-white/10';
  }

  render(): void {
    const activeCount = this.disruptions.filter(d => d.status === 'Active' || d.status === 'Critical' || d.status === 'Severe').length;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Energy Disruptions</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="panel-grid-inner mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">ACTIVE EVENTS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${activeCount}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">TOTAL EVENTS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.disruptions.length}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">AVG SEVERITY</div>
          <div class="text-2xl font-data-lg text-orange-400 panel-stat-lg">${Math.round(this.disruptions.reduce((s, d) => s + d.severity, 0) / (this.disruptions.length || 1))}%</div>
        </div>
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">DISRUPTION EVENTS</div>
      <div class="flex flex-col gap-2" style="max-height: calc(100% - 200px); overflow-y: auto;">
        ${this.disruptions.map((d, i) => {
          const isActive = d.status === 'Active' || d.status === 'Critical' || d.status === 'Severe';
          return `
            <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden border border-white/5 group cursor-pointer hover:scale-[1.01]" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
              ${isActive ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)] group-hover:w-2 transition-all"></div>' : ''}
              <div class="flex justify-between items-start">
                <span class="font-data-md text-on-surface panel-body pl-2 group-hover:text-primary transition-colors">${d.name}</span>
                <span class="font-label-caps text-[10px] ${this.severityBg(d.severity)} px-2.5 py-1 rounded-md">${d.severity}%</span>
              </div>
              <div class="flex items-center gap-2 pl-2">
                <span class="text-[9px] font-data-md px-1.5 py-0.5 rounded ${this.statusBadge(d.status)}">${d.status}</span>
                <span class="text-[9px] font-data-md text-on-surface-variant/60">${d.type}</span>
              </div>
              <div class="flex flex-wrap gap-1 pl-2 mt-1">
                ${d.affectedRoutes.map(r => `<span class="text-[9px] font-data-md text-on-surface-variant/60 px-1.5 py-0.5 rounded bg-white/5">${r}</span>`).join('')}
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
