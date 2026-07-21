import { buildChokepointMonitoring, type ChokepointMonitor } from '@/services/chokepoint-monitoring';
import { fetchChokepointStatus } from '@/services/supply-chain';

const STATUS_COLORS: Record<string, string> = {
  Normal: 'bg-primary text-on-surface',
  Elevated: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
  'High Risk': 'bg-error/10 text-error border border-error/20',
  Critical: 'bg-error text-white animate-pulse',
};

const STATUS_ICONS: Record<string, string> = {
  Normal: 'check_circle',
  Elevated: 'warning',
  'High Risk': 'error',
  Critical: 'error',
};

export class HormuzTrackerPanel {
  private container: HTMLElement;
  private hormuz: ChokepointMonitor | null = null;
  private tankerCount = 24;
  private flowDelta = '-3.2%';
  private transitData = [
    { label: 'Oil Tankers', count: 18, max: 30 },
    { label: 'LNG Carriers', count: 5, max: 12 },
    { label: 'Bulk Cargo', count: 8, max: 20 },
  ];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const status = await fetchChokepointStatus();
      const monitors = buildChokepointMonitoring(status);
      this.hormuz = monitors.find(m => m.id === 'hormuz_strait') ?? null;
    } catch { /* defaults */ }

    if (!this.hormuz) {
      this.hormuz = {
        id: 'hormuz_strait', name: 'Strait of Hormuz', lat: 26.5, lon: 56.25,
        riskScore: 85, severityScore: 82, confidenceScore: 88, trendScore: 75,
        disruptionProbability: 0.35, status: 'Critical',
        evidence: ['Naval exercises expanding', '3 vessels rerouted', 'Premiums up 40%'],
        sourceIds: ['hormuz_strait'],
      };
    }
  }

  private barWidth(count: number, max: number): string {
    return `${Math.min(100, Math.round((count / max) * 100))}%`;
  }

  render(): void {
    const hp = this.hormuz!;
    const statusCls = STATUS_COLORS[hp.status] ?? STATUS_COLORS.Normal;
    const statusIcon = STATUS_ICONS[hp.status] ?? 'help';
    const prob = Math.round(hp.disruptionProbability * 100);

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Hormuz Tracker</h3>
        <span class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors hover:scale-110 cursor-pointer">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">sailing</span>
        </span>
      </div>
      <div class="panel-grid-inner mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">STATUS</div>
          <div class="inline-flex items-center gap-1 px-2 py-1 rounded-lg ${statusCls}">
            <span class="material-symbols-outlined text-sm">${statusIcon}</span>
            <span class="font-data-md text-xs">${hp.status}</span>
          </div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DISRUPTION PROB</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${prob}%</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">TANKERS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.tankerCount}</div>
          <div class="text-[10px] font-data-md text-error">${this.flowDelta}</div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TRANSIT VOLUMES</div>
        <div class="flex flex-col gap-2">
          ${this.transitData.map((t, i) => `
            <div style="animation: fadeInUp 0.3s ease-out ${0.1 * i}s both;">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[10px] text-on-surface-variant font-body-sm">${t.label}</span>
                <span class="text-[10px] text-on-surface font-data-md">${t.count}</span>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${this.barWidth(t.count, t.max)}"></div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">INTELLIGENCE</div>
      <div class="flex flex-col gap-1">
        ${hp.evidence.map((e, i) => `
          <div class="text-[11px] text-on-surface-variant font-body-sm p-2 hover:bg-white/5 rounded-lg transition-all" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
            <span class="material-symbols-outlined text-primary text-xs mr-1 align-middle">chevron_right</span>${e}
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
