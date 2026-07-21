import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const SUPPLIERS = [
  { name: 'Iraq', share: 27, color: 'bg-red-400' },
  { name: 'Saudi Arabia', share: 18, color: 'bg-green-400' },
  { name: 'UAE', share: 7, color: 'bg-emerald-400' },
  { name: 'Kuwait', share: 5, color: 'bg-yellow-400' },
  { name: 'Russia', share: 4, color: 'bg-blue-400' },
];

const GAUGE_RADIUS = 54;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

export class IndiaEnergyHubPanel {
  private container: HTMLElement;
  private importPct = 88;
  private sprDays = 9.5;
  private hormuzExposure = 42;
  private dailyVolume = 4.5;
  private costPerBbl = 82;
  private riskScore = 72;
  private suppliers = SUPPLIERS;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const fallback = {
      importPct: 88,
      sprDays: 9.5,
      hormuzExposure: 42,
      dailyVolume: 4.5,
      costPerBbl: 82,
      riskScore: 72,
      suppliers: SUPPLIERS,
    };
    const { data, source } = await fetchPanelData(
      { name: 'india-energy-hub', fallback },
      async () => {
        const energyHydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
        const crudeHydrated = getHydratedData('crudeInventories') as { weeks?: Array<{ period: string; stocksMb: number }> } | undefined;
        const brent = energyHydrated?.prices?.find(p => p.commodity === 'RBRTE');
        let costPerBbl = fallback.costPerBbl;
        let sprDays = fallback.sprDays;
        if (brent) {
          costPerBbl = brent.price;
        }
        const weeks = crudeHydrated?.weeks;
        if (weeks && weeks.length > 0) {
          const totalStockMb = weeks[0]!.stocksMb;
          sprDays = Math.round((totalStockMb / fallback.dailyVolume) * 10) / 10;
        }
        return { ...fallback, costPerBbl, sprDays };
      },
    );
    this.importPct = data.importPct;
    this.sprDays = data.sprDays;
    this.hormuzExposure = data.hormuzExposure;
    this.dailyVolume = data.dailyVolume;
    this.costPerBbl = data.costPerBbl;
    this.riskScore = data.riskScore;
    this.suppliers = data.suppliers;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private severityColor(score: number): string {
    if (score >= 70) return 'text-error';
    if (score >= 50) return 'text-orange-400';
    return 'text-primary';
  }

  private severityBg(score: number): string {
    if (score >= 70) return 'bg-error';
    if (score >= 50) return 'bg-orange-400';
    return 'bg-primary';
  }

  private sprBadgeColor(): string {
    return 'bg-error text-white animate-pulse';
  }

  render(): void {
    const dashOffset = GAUGE_CIRCUMFERENCE - (this.importPct / 100) * GAUGE_CIRCUMFERENCE;
    const costAtRisk = this.dailyVolume * this.costPerBbl;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">India Energy Hub</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">energy_savings_leaf</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">SPR COVERAGE</div>
          <div class="text-2xl font-data-lg text-error panel-stat-lg">${this.sprDays}<span class="text-xs text-on-surface-variant"> days</span></div>
          <span class="inline-block mt-1 px-2 py-0.5 text-[9px] font-data-md rounded ${this.sprBadgeColor()}">CRITICAL</span>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">DAILY IMPORTS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.dailyVolume}<span class="text-xs text-on-surface-variant">M bbl</span></div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COST AT RISK</div>
          <div class="text-2xl font-data-lg text-orange-400 panel-stat-lg">$${costAtRisk.toFixed(0)}<span class="text-xs text-on-surface-variant">M/day</span></div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.15s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">IMPORT DEPENDENCY</div>
        <svg width="140" height="140" viewBox="0 0 140 140" class="mx-auto mb-2">
          <circle cx="70" cy="70" r="${GAUGE_RADIUS}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10" />
          <circle cx="70" cy="70" r="${GAUGE_RADIUS}" fill="none" stroke="${this.importPct >= 80 ? '#f87171' : this.importPct >= 60 ? '#fb923c' : '#4ade80'}" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${GAUGE_CIRCUMFERENCE}" stroke-dashoffset="${dashOffset}"
            transform="rotate(-90 70 70)" class="transition-all duration-1000" />
          <text x="70" y="65" text-anchor="middle" fill="currentColor" class="text-3xl font-data-lg text-on-surface">${this.importPct}%</text>
          <text x="70" y="85" text-anchor="middle" fill="currentColor" class="text-[10px] font-label-caps text-on-surface-variant">CRUDE OIL</text>
        </svg>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.2s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">HORMUZ EXPOSURE</div>
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl font-data-lg text-error panel-stat-lg">${this.hormuzExposure}%</span>
          <span class="text-[9px] text-on-surface-variant">of imports transit Strait of Hormuz</span>
        </div>
        <div class="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-error rounded-full transition-all duration-1000" style="width: ${this.hormuzExposure}%"></div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.25s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TOP 5 SUPPLIERS</div>
        <div class="flex flex-col gap-1.5">
          ${this.suppliers.map((s, i) => `
            <div class="flex items-center gap-2" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.05 * i}s both;">
              <span class="text-[11px] text-on-surface font-body-sm w-24">${s.name}</span>
              <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full ${s.color} rounded-full transition-all duration-1000" style="width: ${s.share}%"></div>
              </div>
              <span class="text-[9px] font-data-md text-on-surface-variant w-8 text-right">${s.share}%</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.4s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">SECURITY RISK SCORE</div>
        <div class="text-3xl font-data-lg ${this.severityColor(this.riskScore)} panel-stat-lg">${this.riskScore}<span class="text-base text-on-surface-variant">/100</span></div>
        <div class="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div class="h-full ${this.severityBg(this.riskScore)} rounded-full transition-all duration-1000" style="width: ${this.riskScore}%"></div>
        </div>
        <span class="inline-block mt-2 px-2 py-0.5 text-[9px] font-data-md rounded bg-error/10 text-error border border-error/20">HIGH RISK</span>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
