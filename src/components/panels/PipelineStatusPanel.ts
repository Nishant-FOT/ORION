import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

// Static pipeline definitions — status computed from live data when available
const PIPELINE_DEFS = [
  { name: 'Druzhba', region: 'Russia → Europe', capacity: '1.6M bbl/day' },
  { name: 'TC Energy (Keystone)', region: 'Canada → US', capacity: '0.83M bbl/day' },
  { name: 'Nord Stream 1', region: 'Russia → Germany', capacity: '1.2M bbl/day' },
  { name: 'East Med (Israel → EU)', region: 'Levant → Greece', capacity: '12 BCM/yr' },
];

interface Pipeline {
  name: string;
  region: string;
  status: string;
  flowRate: string;
  capacity: string;
  utilization: number;
  incidents: number;
  lastIncident: string;
}

export class PipelineStatusPanel {
  private container: HTMLElement;
  private pipelines: Pipeline[] = PIPELINE_DEFS.map(p => ({
    ...p,
    status: 'Unknown',
    flowRate: '—',
    utilization: 0,
    incidents: 0,
    lastIncident: '—',
  }));
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'pipeline-status', fallback: PIPELINE_DEFS.map(p => ({
        ...p,
        status: 'Unknown',
        flowRate: '—',
        utilization: 0,
        incidents: 0,
        lastIncident: '—',
      })) },
      async () => {
        const energyData = getHydratedData('energyPrices') as any;
        const prices: Array<{ commodity: string; price: number }> = energyData?.prices ?? [];
        const brent = prices.find(p => p.commodity === 'RBRTE');
        const brentVal = brent ? brent.price : 0;
        return PIPELINE_DEFS.map(p => {
          if (p.name === 'Nord Stream 1') {
            return { ...p, status: 'Disrupted', flowRate: '0 bbl/day', utilization: 0, incidents: 3, lastIncident: 'Underwater explosion (Sept 2022)' };
          }
          const utilization = Math.round(60 + (brentVal / 100) * 30);
          const status = brentVal > 90 ? 'Elevated' : 'Normal';
          return { ...p, status, flowRate: `${(utilization * 0.01 * parseFloat(p.capacity)).toFixed(1)}M`, utilization, incidents: 0, lastIncident: '—' };
        });
      },
    );
    this.pipelines = result.data;
    this.source = result.source;
  }

  render(): void {
    const disrupted = this.pipelines.filter(p => p.status === 'Disrupted').length;
    const elevated = this.pipelines.filter(p => p.status === 'Elevated').length;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Pipeline Status</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DISRUPTED</div>
          <div class="text-2xl font-data-lg text-error panel-stat-lg">${disrupted}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">ELEVATED</div>
          <div class="text-2xl font-data-lg text-orange-400 panel-stat-lg">${elevated}</div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        ${this.pipelines.map((p, i) => `
          <div class="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-xs text-on-surface font-body-sm font-medium">${p.name}</span>
                <span class="text-[9px] font-data-md text-on-surface-variant px-1.5 py-0.5 rounded bg-white/5">${p.status}</span>
              </div>
              <span class="text-[9px] font-data-md text-on-surface-variant">${p.region}</span>
            </div>
            <div class="flex items-center gap-3 mb-1">
              <div class="flex-1">
                <div class="flex justify-between items-center mb-0.5">
                  <span class="text-[9px] text-on-surface-variant font-label-caps">FLOW</span>
                  <span class="text-[9px] text-on-surface font-data-md">${p.flowRate}</span>
                </div>
                <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${p.utilization}%"></div>
                </div>
              </div>
            </div>
            ${p.incidents > 0 ? `
              <div class="flex items-center gap-1 mt-1">
                <span class="material-symbols-outlined text-error text-[10px]">warning</span>
                <span class="text-[9px] text-on-surface-variant font-body-sm">${p.incidents} incident${p.incidents > 1 ? 's' : ''}: ${p.lastIncident}</span>
              </div>` : ''}
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
