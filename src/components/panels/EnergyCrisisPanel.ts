import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CrisisMetric {
  label: string;
  value: string;
  icon: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface Disruption {
  name: string;
  status: string;
  riskScore: number;
}

interface RecommendedAction {
  action: string;
  country: string;
  severity: string;
}

export class EnergyCrisisPanel {
  private container: HTMLElement;
  private crisis: CrisisMetric = { label: 'Crisis Level', value: 'N/A', icon: 'info', severity: 'low' };
  private disruptions: Disruption[] = [];
  private actions: RecommendedAction[] = [];
  private source: DataSource = 'cached';
  private stressScore = 0;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private computeCrisisData(brentVal: number, stockBbl?: number) {
    const stressScore = Math.round(Math.min(100, brentVal * 0.9));
    let severity: CrisisMetric['severity'] = 'low';
    let value = 'NORMAL';
    let icon = 'check_circle';
    if (brentVal > 95) { severity = 'critical'; value = 'CRITICAL'; icon = 'error'; }
    else if (brentVal > 85) { severity = 'high'; value = 'ELEVATED'; icon = 'warning'; }
    else if (brentVal > 75) { severity = 'medium'; value = 'CAUTION'; icon = 'info'; }
    const crisis: CrisisMetric = { label: 'Crisis Level', value, icon, severity };
    const disruptions: Disruption[] = [];
    const actions: RecommendedAction[] = [];
    if (brentVal > 80) {
      disruptions.push({ name: 'Brent price stress', status: 'Active', riskScore: Math.min(95, Math.round((brentVal - 70) * 2)) });
    }
    if (stockBbl !== undefined && stockBbl < 400_000_000) {
      disruptions.push({ name: 'Low crude inventories', status: 'Monitoring', riskScore: Math.round(((400_000_000 - stockBbl) / 400_000_000) * 80) });
    }
    if (brentVal > 80) actions.push({ action: 'Hedge Brent exposure via Q3 calls', country: 'Global', severity: 'high' });
    if (brentVal > 85) actions.push({ action: 'Diversify LNG sourcing', country: 'APAC', severity: 'medium' });
    if (stockBbl !== undefined && stockBbl < 400_000_000) actions.push({ action: 'Build strategic diesel reserves', country: 'IN', severity: 'medium' });
    return { crisis, disruptions, actions, stressScore };
  }

  private async fetchData(): Promise<void> {
    const fallback = this.computeCrisisData(80);
    const { data, source } = await fetchPanelData(
      { name: 'energy-crisis', fallback },
      async () => {
        const energyHydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
        const crudeHydrated = getHydratedData('crudeInventories') as { weeks?: Array<{ period: string; stocksMb: number }> } | undefined;
        const brent = energyHydrated?.prices?.find(p => p.commodity === 'RBRTE');
        if (!brent) return fallback;
        const brentVal = brent.price;
        const weeks = crudeHydrated?.weeks;
        let stockBbl: number | undefined;
        if (weeks && weeks.length > 0) {
          stockBbl = weeks[0]!.stocksMb * 1_000_000;
        }
        return this.computeCrisisData(brentVal, stockBbl);
      },
    );
    this.crisis = data.crisis;
    this.disruptions = data.disruptions;
    this.actions = data.actions;
    this.stressScore = data.stressScore;
    this.source = source;
  }

  private severityColor(s: string): string {
    if (s === 'critical') return 'bg-error text-white animate-pulse';
    if (s === 'high') return 'bg-error/10 text-error border border-error/20';
    if (s === 'medium') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }
  private riskColor(r: number): string {
    if (r >= 70) return 'text-error';
    if (r >= 50) return 'text-orange-400';
    return 'text-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Energy Crisis</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="panel-grid-inner mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">STATUS</div>
          <div class="inline-flex items-center gap-1 px-2 py-1 rounded-lg ${this.severityColor(this.crisis.severity)}">
            <span class="material-symbols-outlined text-sm">${this.crisis.icon}</span>
            <span class="font-data-md text-xs">${this.crisis.value}</span>
          </div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DISRUPTIONS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.disruptions.length}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">STRESS</div>
          <div class="text-2xl font-data-lg ${this.riskColor(this.stressScore)} panel-stat-lg">${this.stressScore}</div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">ACTIVE DISRUPTIONS</div>
        <div class="flex flex-col gap-1">
          ${this.disruptions.map((d, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
              <span class="text-[11px] text-on-surface font-body-sm">${d.name}</span>
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-data-md text-on-surface-variant">${d.status}</span>
                <span class="text-[9px] font-data-md ${this.riskColor(d.riskScore)}">${d.riskScore}%</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">RECOMMENDED ACTIONS</div>
      <div class="flex flex-col gap-1">
        ${this.actions.map((a, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.5 + 0.05 * i}s both;">
            <span class="text-[11px] text-on-surface font-body-sm">${a.action}</span>
            <span class="text-[9px] font-data-md px-1.5 py-0.5 rounded ${this.severityColor(a.severity)}">${a.country}</span>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
