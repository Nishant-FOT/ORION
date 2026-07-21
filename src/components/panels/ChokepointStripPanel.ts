import type { ChokepointMonitor } from '@/services/chokepoint-monitoring';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const STATUS_COLORS: Record<string, string> = {
  Normal: 'bg-primary',
  Elevated: 'bg-orange-400',
  'High Risk': 'bg-error',
  Critical: 'bg-error animate-pulse',
};

const STATUS_LABELS: Record<string, string> = {
  Normal: 'text-primary',
  Elevated: 'text-orange-400',
  'High Risk': 'text-error',
  Critical: 'text-error',
};

const CHOKEPOINTS: ChokepointMonitor[] = [
  { id: 'hormuz_strait', name: 'Hormuz', lat: 26.5, lon: 56.25, riskScore: 85, severityScore: 82, confidenceScore: 88, trendScore: 75, disruptionProbability: 0.35, status: 'Critical', evidence: [], sourceIds: [] },
  { id: 'red_sea', name: 'Red Sea', lat: 15, lon: 42, riskScore: 68, severityScore: 65, confidenceScore: 85, trendScore: 60, disruptionProbability: 0.28, status: 'High Risk', evidence: [], sourceIds: [] },
  { id: 'suez', name: 'Suez', lat: 30.5, lon: 32.3, riskScore: 42, severityScore: 40, confidenceScore: 92, trendScore: 30, disruptionProbability: 0.12, status: 'Elevated', evidence: [], sourceIds: [] },
  { id: 'bab_el_mandeb', name: 'Bab el-Mandeb', lat: 12.5, lon: 43.3, riskScore: 55, severityScore: 52, confidenceScore: 88, trendScore: 45, disruptionProbability: 0.22, status: 'Elevated', evidence: [], sourceIds: [] },
  { id: 'malacca_strait', name: 'Malacca', lat: 2.5, lon: 101.5, riskScore: 12, severityScore: 10, confidenceScore: 95, trendScore: 5, disruptionProbability: 0.03, status: 'Normal', evidence: [], sourceIds: [] },
];

export class ChokepointStripPanel {
  private container: HTMLElement;
  private chokepoints: ChokepointMonitor[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const [{ buildChokepointMonitoring }, { fetchChokepointStatus }] = await Promise.all([
      import('@/services/chokepoint-monitoring'),
      import('@/services/supply-chain'),
    ]);
    const result = await fetchPanelData(
      { name: 'chokepoint-strip', fallback: CHOKEPOINTS},
      async () => {
        const status = await fetchChokepointStatus();
        return buildChokepointMonitoring(status);
      },
      (data) => Array.isArray(data),
    );
    this.source = result.source;
    this.chokepoints = result.data;
  }

  private riskBar(score: number): string {
    const color = score >= 78 ? 'bg-error' : score >= 58 ? 'bg-orange-400' : score >= 32 ? 'bg-yellow-400' : 'bg-primary';
    return `<div class="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
      <div class="h-full ${color} rounded-full transition-all duration-700" style="width: ${score}%"></div>
    </div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Chokepoint Strip</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="material-symbols-outlined text-on-surface-variant text-sm">sailing</span>
        </div>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-2" style="scrollbar-width: thin;">
        ${this.chokepoints.map((cp, i) => {
          const dotColor = STATUS_COLORS[cp.status] ?? STATUS_COLORS.Normal;
          const textColor = STATUS_LABELS[cp.status] ?? STATUS_LABELS.Normal;
          return `
            <div class="flex-shrink-0 w-28 p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer hover:scale-105 border border-white/5"
                 style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex items-center gap-1.5 mb-1.5">
                <span class="w-2 h-2 rounded-full ${dotColor} flex-shrink-0"></span>
                <span class="text-[10px] font-label-caps text-on-surface-variant truncate">${cp.name}</span>
              </div>
              <div class="text-xl font-data-lg text-on-surface panel-stat-lg ${textColor}">${cp.riskScore}</div>
              ${this.riskBar(cp.riskScore)}
              <div class="text-[9px] font-data-md text-on-surface-variant mt-1">${cp.status}</div>
            </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
