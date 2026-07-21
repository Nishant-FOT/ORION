import { buildChokepointMonitoring, type ChokepointMonitor } from '@/services/chokepoint-monitoring';
import { fetchChokepointStatus } from '@/services/supply-chain';

export class ChokepointsPanel {
  private container: HTMLElement;
  private chokepoints: ChokepointMonitor[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    try {
      const status = await fetchChokepointStatus();
      this.chokepoints = buildChokepointMonitoring(status);
    } catch (err) {
      console.warn('[ChokepointsPanel] Failed to fetch data:', err);
      // Fallback data
      this.chokepoints = [
        {
          id: 'hormuz_strait',
          name: 'Strait of Hormuz',
          lat: 26.5,
          lon: 56.25,
          riskScore: 85,
          severityScore: 82,
          confidenceScore: 88,
          trendScore: 75,
          disruptionProbability: 0.35,
          status: 'Critical',
          evidence: ['Naval exercises expanding', '3 vessels rerouted', 'Premiums up'],
          sourceIds: [],
        },
        {
          id: 'suez',
          name: 'Suez Canal',
          lat: 30.5,
          lon: 32.3,
          riskScore: 42,
          severityScore: 40,
          confidenceScore: 92,
          trendScore: 30,
          disruptionProbability: 0.12,
          status: 'Elevated',
          evidence: ['Minor congestion southbound', 'Clearance time +2hrs'],
          sourceIds: [],
        },
        {
          id: 'malacca_strait',
          name: 'Strait of Malacca',
          lat: 2.5,
          lon: 101.5,
          riskScore: 12,
          severityScore: 10,
          confidenceScore: 95,
          trendScore: 5,
          disruptionProbability: 0.03,
          status: 'Normal',
          evidence: ['Clear', 'Routine patrols active'],
          sourceIds: [],
        },
      ];
    }
  }

  private getStatusBg(status: string): string {
    switch (status) {
      case 'Critical': return 'bg-error/10 text-error border border-error/20 animate-pulse-slow';
      case 'High Risk': return 'bg-error/10 text-error border border-error/20';
      case 'Elevated': return 'bg-white/10 text-on-surface';
      default: return 'bg-primary/10 text-primary border border-primary/20';
    }
  }

  render(): void {
    const chokepointsHtml = this.chokepoints.map(cp => {
      const statusBg = this.getStatusBg(cp.status);
      const isActive = cp.status === 'Critical' || cp.status === 'High Risk';
      const narrative = cp.evidence.join('. ') || 'No data available.';

      return `
        <div class="bg-white/5 hover:bg-white/10 transition-all p-4 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-white/5 group cursor-pointer hover:scale-[1.02] hover:shadow-lg">
          ${isActive ? `<div class="absolute left-0 top-0 bottom-0 w-1 bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)] group-hover:w-2 transition-all"></div>` : ''}
          <div class="flex justify-between items-start">
            <span class="font-data-md text-base text-on-surface pl-2 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300">${cp.name}</span>
            <span class="font-label-caps text-[10px] ${statusBg} px-2.5 py-1 rounded-md">${cp.riskScore}% RISK</span>
          </div>
          <p class="text-sm text-on-surface-variant pl-2 font-body-sm leading-relaxed group-hover:text-on-surface transition-colors">${narrative}</p>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Chokepoints</h3>
        <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors hover:scale-110 cursor-pointer">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">warning</span>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        ${chokepointsHtml}
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
