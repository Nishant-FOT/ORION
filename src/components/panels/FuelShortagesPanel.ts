import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_FUEL_DATA = {
  countries: [
    { country: 'Japan', code: 'JP', deficitRisk: 3, lngDependency: 94, icon: 'flag' },
    { country: 'EU', code: 'EU', deficitRisk: 2, lngDependency: 42, icon: 'flag' },
    { country: 'India', code: 'IN', deficitRisk: 1, lngDependency: 52, icon: 'flag' },
    { country: 'South Korea', code: 'KR', deficitRisk: 1, lngDependency: 87, icon: 'flag' },
    { country: 'China', code: 'CN', deficitRisk: 0, lngDependency: 18, icon: 'flag' },
  ],
  projections: [
    { quarter: 'Q3 2026', risk: 1, trend: '+1.2%' },
    { quarter: 'Q4 2026', risk: 4, trend: '+2.8%' },
    { quarter: 'Q1 2027', risk: 8, trend: '+3.1%' },
  ],
};

type FuelData = typeof DEMO_FUEL_DATA;

export class FuelShortagesPanel {
  private container: HTMLElement;
  private countries: { country: string; code: string; deficitRisk: number; lngDependency: number; icon: string }[] = [];
  private projections: { quarter: string; risk: number; trend: string }[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData<FuelData>(
      { name: 'FuelShortages', fallback: DEMO_FUEL_DATA},
      async () => {
        const energyData = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; value: number }> } | undefined;
        const brent = energyData?.prices?.find(p => p.commodity === 'RBRTE');
        if (brent) {
          const brentVal = Number(brent.value);
          const stressFactor = Math.max(0, (brentVal - 70) / 30);
          const baseRisk = Math.round(stressFactor * 10);
          return {
            countries: [
              { country: 'Japan', code: 'JP', deficitRisk: Math.round(15 * stressFactor), lngDependency: 94, icon: 'flag' },
              { country: 'EU', code: 'EU', deficitRisk: Math.round(12 * stressFactor), lngDependency: 42, icon: 'flag' },
              { country: 'India', code: 'IN', deficitRisk: Math.round(8 * stressFactor), lngDependency: 52, icon: 'flag' },
              { country: 'South Korea', code: 'KR', deficitRisk: Math.round(6 * stressFactor), lngDependency: 87, icon: 'flag' },
              { country: 'China', code: 'CN', deficitRisk: Math.round(4 * stressFactor), lngDependency: 18, icon: 'flag' },
            ],
            projections: [
              { quarter: 'Q3 2026', risk: baseRisk, trend: '+1.2%' },
              { quarter: 'Q4 2026', risk: baseRisk + 3, trend: '+2.8%' },
              { quarter: 'Q1 2027', risk: baseRisk + 7, trend: '+3.1%' },
            ],
          };
        }
        return DEMO_FUEL_DATA;
      },
      (_data) => true
    );
    this.countries = result.data.countries;
    this.projections = result.data.projections;
    this.source = result.source;
  }

  private riskColor(risk: number): string {
    if (risk >= 12) return 'text-error';
    if (risk >= 8) return 'text-orange-400';
    if (risk >= 5) return 'text-yellow-400';
    return 'text-primary';
  }

  private riskBg(risk: number): string {
    if (risk >= 12) return 'bg-error';
    if (risk >= 8) return 'bg-orange-400';
    if (risk >= 5) return 'bg-yellow-400';
    return 'bg-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Fuel Shortages</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">LNG VULNERABILITY BY COUNTRY</div>
        <div class="flex flex-col gap-1">
          ${this.countries.map((c, i) => `
            <div class="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-xs text-on-surface-variant">${c.icon}</span>
                  <span class="text-xs text-on-surface font-body-sm">${c.country}</span>
                </div>
                <span class="text-[9px] font-data-md ${this.riskColor(c.deficitRisk)} px-1.5 py-0.5 rounded bg-white/5">${c.deficitRisk}%</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <div class="text-[9px] text-on-surface-variant font-label-caps mb-0.5">DEFICIT RISK</div>
                  <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full ${this.riskBg(c.deficitRisk)} rounded-full transition-all duration-1000" style="width: ${Math.min(100, c.deficitRisk * 5)}%"></div>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="text-[9px] text-on-surface-variant font-label-caps mb-0.5">LNG DEPENDENCY</div>
                  <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${c.lngDependency}%"></div>
                  </div>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="w-full h-px bg-white/5 my-3"></div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">DEFICIT PROJECTIONS</div>
      <div class="flex flex-col gap-1">
        ${this.projections.map((p, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.4 + 0.05 * i}s both;">
            <span class="text-xs text-on-surface font-body-sm">${p.quarter}</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-data-md ${this.riskColor(p.risk)}">${p.risk}%</span>
              <span class="text-[9px] font-data-md text-error">${p.trend}</span>
            </div>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
