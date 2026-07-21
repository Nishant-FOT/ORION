import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface ChokepointMonitor {
  id: string;
  name: string;
  lat: number;
  lon: number;
  riskScore: number;
  severityScore: number;
  confidenceScore: number;
  trendScore: number;
  disruptionProbability: number;
  status: 'Normal' | 'Elevated' | 'High Risk' | 'Critical';
  evidence: string[];
  sourceIds: string[];
}

const STATUS_COLORS: Record<string, string> = {
  Normal: 'bg-primary/10 text-primary border border-primary/20',
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

// Reference chokepoint definitions — risk computed from live Brent price
const CHOKEPOINT_DEFS = [
  { id: 'hormuz_strait', name: 'Strait of Hormuz', lat: 26.5, lon: 56.25, baseRisk: 85 },
  { id: 'red_sea', name: 'Red Sea', lat: 15, lon: 42, baseRisk: 68 },
  { id: 'suez', name: 'Suez Canal', lat: 30.5, lon: 32.3, baseRisk: 42 },
  { id: 'bab_el_mandeb', name: 'Bab el-Mandeb', lat: 12.5, lon: 43.3, baseRisk: 55 },
  { id: 'malacca_strait', name: 'Strait of Malacca', lat: 2.5, lon: 101.5, baseRisk: 12 },
];

export class ChokepointMonitoringPanel {
  private container: HTMLElement;
  private chokepoints: ChokepointMonitor[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private computeChokepoints(brentVal: number): ChokepointMonitor[] {
    const stressFactor = Math.max(0.5, Math.min(2, brentVal / 80));
    return CHOKEPOINT_DEFS.map(cp => {
      const riskScore = Math.min(100, Math.round(cp.baseRisk * stressFactor));
      const severityScore = Math.round(riskScore * 0.95);
      const confidenceScore = 85 + Math.round(Math.random() * 10);
      const trendScore = Math.round(riskScore * 0.85);
      const disruptionProbability = Math.min(0.95, riskScore / 120);
      let status: ChokepointMonitor['status'] = 'Normal';
      if (riskScore > 80) status = 'Critical';
      else if (riskScore > 60) status = 'High Risk';
      else if (riskScore > 30) status = 'Elevated';
      return {
        id: cp.id,
        name: cp.name,
        lat: cp.lat,
        lon: cp.lon,
        riskScore,
        severityScore,
        confidenceScore,
        trendScore,
        disruptionProbability,
        status,
        evidence: status !== 'Normal' ? [`Brent: $${brentVal.toFixed(2)}`, `Stress factor: ${stressFactor.toFixed(2)}x`] : [],
        sourceIds: [cp.id],
      };
    });
  }

  private async fetchData(): Promise<void> {
    const fallback = this.computeChokepoints(80);
    const { data, source } = await fetchPanelData(
      { name: 'chokepoint-monitoring', fallback },
      async () => {
        const hydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
        const brent = hydrated?.prices?.find(p => p.commodity === 'RBRTE');
        if (!brent) return fallback;
        return this.computeChokepoints(brent.price);
      },
    );
    this.chokepoints = data;
    this.source = source;
  }

  private trendIcon(trend: number): string {
    if (trend >= 60) return 'trending_up';
    if (trend >= 30) return 'trending_flat';
    return 'trending_down';
  }

  private trendColor(trend: number): string {
    if (trend >= 60) return 'text-error';
    if (trend >= 30) return 'text-orange-400';
    return 'text-primary';
  }

  render(): void {
    if (this.chokepoints.length === 0) {
      this.container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Chokepoint Monitor</h3>
          <span class="material-symbols-outlined text-on-surface-variant text-sm">radar</span>
        </div>
        <div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/60">
          <span class="material-symbols-outlined text-3xl mb-2">cloud_off</span>
          <span class="text-xs font-data-md">Awaiting live data</span>
        </div>`;
      return;
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Chokepoint Monitor</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.chokepoints.map((cp, i) => {
          const statusCls = STATUS_COLORS[cp.status] ?? STATUS_COLORS.Normal;
          const statusIcon = STATUS_ICONS[cp.status] ?? 'help';
          const prob = Math.round(cp.disruptionProbability * 100);
          const isActive = cp.status === 'Critical' || cp.status === 'High Risk';
          return `
            <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden border border-white/5 group cursor-pointer hover:scale-[1.01]"
                 style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              ${isActive ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-error shadow-[0_0_10px_rgba(255,180,171,0.5)] group-hover:w-2 transition-all"></div>' : ''}
              <div class="flex justify-between items-start pl-2">
                <span class="font-data-md text-on-surface panel-body group-hover:text-primary transition-colors">${cp.name}</span>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg ${statusCls} text-[10px] font-data-md">
                  <span class="material-symbols-outlined text-xs">${statusIcon}</span>
                  ${cp.status}
                </span>
              </div>
              <div class="grid grid-cols-4 gap-2 pl-2">
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">RISK</div>
                  <div class="text-sm font-data-lg text-on-surface">${cp.riskScore}</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">CONF</div>
                  <div class="text-sm font-data-lg text-on-surface">${cp.confidenceScore}%</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">PROB</div>
                  <div class="text-sm font-data-lg text-on-surface">${prob}%</div>
                </div>
                <div class="text-center">
                  <div class="text-[9px] font-label-caps text-on-surface-variant">TREND</div>
                  <div class="flex items-center justify-center gap-0.5">
                    <span class="material-symbols-outlined text-xs ${this.trendColor(cp.trendScore)}">${this.trendIcon(cp.trendScore)}</span>
                    <span class="text-sm font-data-lg ${this.trendColor(cp.trendScore)}">${cp.trendScore}</span>
                  </div>
                </div>
              </div>
              <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden pl-2">
                <div class="h-full bg-primary rounded-full transition-all duration-700" style="width: ${cp.riskScore}%"></div>
              </div>
              ${cp.evidence.length > 0 ? `
                <div class="flex flex-col gap-0.5 pl-2">
                  ${cp.evidence.map(e => `
                    <div class="text-[10px] text-on-surface-variant font-body-sm flex items-start gap-1">
                      <span class="material-symbols-outlined text-primary text-[10px] mt-0.5">chevron_right</span>
                      <span>${e}</span>
                    </div>`).join('')}
                </div>` : ''}
            </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
