import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';
import { buildChokepointMonitoring, type ChokepointMonitor } from '@/services/chokepoint-monitoring';
import { fetchChokepointStatus } from '@/services/supply-chain';

const DEMO_CHOKEPOINTS: ChokepointMonitor[] = [
  { id: 'hormuz_strait', name: 'Strait of Hormuz', lat: 26.5, lon: 56.25, riskScore: 85, severityScore: 82, confidenceScore: 88, trendScore: 75, disruptionProbability: 0.35, status: 'Critical', evidence: ['Naval exercises expanding', '3 vessels rerouted', 'Premiums up'], sourceIds: [] },
  { id: 'suez', name: 'Suez Canal', lat: 30.5, lon: 32.3, riskScore: 42, severityScore: 40, confidenceScore: 92, trendScore: 30, disruptionProbability: 0.12, status: 'Elevated', evidence: ['Minor congestion southbound', 'Clearance time +2hrs'], sourceIds: [] },
  { id: 'malacca_strait', name: 'Strait of Malacca', lat: 2.5, lon: 101.5, riskScore: 12, severityScore: 10, confidenceScore: 95, trendScore: 5, disruptionProbability: 0.03, status: 'Normal', evidence: ['Clear', 'Routine patrols active'], sourceIds: [] },
  { id: 'red_sea', name: 'Red Sea', lat: 15, lon: 42, riskScore: 68, severityScore: 65, confidenceScore: 85, trendScore: 60, disruptionProbability: 0.28, status: 'High Risk', evidence: ['Houthi activity', 'Rerouting advised'], sourceIds: [] },
  { id: 'bab_el_mandeb', name: 'Bab el-Mandeb', lat: 12.5, lon: 43.3, riskScore: 55, severityScore: 52, confidenceScore: 88, trendScore: 45, disruptionProbability: 0.22, status: 'Elevated', evidence: ['Naval presence increased'], sourceIds: [] },
];

export class ChokepointsPanel {
  private container: HTMLElement;
  private chokepoints: ChokepointMonitor[] = DEMO_CHOKEPOINTS;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'chokepoints', fallback: DEMO_CHOKEPOINTS},
      async () => {
        const status = await fetchChokepointStatus();
        const result = buildChokepointMonitoring(status);
        return result;
      },
      (data) => Array.isArray(data),
    );
    this.chokepoints = data;
    this.source = source;
  }

  private getStatusBg(status: string): string {
    if (status === 'Critical') return 'bg-error/10 text-error border border-error/20 animate-pulse-slow';
    if (status === 'High Risk') return 'bg-error/10 text-error border border-error/20';
    if (status === 'Elevated') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Chokepoints</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.chokepoints.map(cp => {
          const isActive = cp.status === 'Critical' || cp.status === 'High Risk';
          const narrative = cp.evidence.join('. ') || 'No data available.';
          return `
            <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden border border-white/5 group cursor-pointer hover:scale-[1.01]">
              ${isActive ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)] group-hover:w-2 transition-all"></div>' : ''}
              <div class="flex justify-between items-start">
                <span class="font-data-md text-on-surface panel-body pl-2 group-hover:text-primary transition-colors">${cp.name}</span>
                <span class="font-label-caps text-[10px] ${this.getStatusBg(cp.status)} px-2.5 py-1 rounded-md">${cp.riskScore}% RISK</span>
              </div>
              <p class="text-xs text-on-surface-variant pl-2 font-body-sm leading-relaxed group-hover:text-on-surface transition-colors">${narrative}</p>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
