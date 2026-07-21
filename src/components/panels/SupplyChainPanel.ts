import { buildChokepointMonitoring, type ChokepointMonitor } from '@/services/chokepoint-monitoring';
import { fetchCriticalMinerals, fetchChokepointStatus } from '@/services/supply-chain';
import type { CriticalMineral, GetCriticalMineralsResponse } from '@/services/supply-chain';

interface ScenarioCard {
  name: string;
  icon: string;
  risk: number;
  description: string;
}

const SCENARIOS: ScenarioCard[] = [
  { name: 'Hormuz Blockade', icon: 'block', risk: 85, description: 'Full closure of Strait of Hormuz' },
  { name: 'Suez Closure', icon: 'water_off', risk: 42, description: 'Suez Canal blockage or attack' },
  { name: 'Red Sea Disruption', icon: 'sailing', risk: 68, description: 'Houthi attacks escalate further' },
  { name: 'Taiwan Strait', icon: 'sailing', risk: 55, description: 'PLA naval exercises disrupt lanes' },
  { name: 'Malacca Blockade', icon: 'anchor', risk: 12, description: 'Strait of Malacca restriction' },
];

export class SupplyChainPanel {
  private container: HTMLElement;
  private chokepoints: ChokepointMonitor[] = [];
  private minerals: CriticalMineral[] = [];
  private scenarios = SCENARIOS;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const [mineralsResult, cpStatusResult] = await Promise.allSettled([
        fetchCriticalMinerals(),
        fetchChokepointStatus(),
      ]);

      if (mineralsResult.status === 'fulfilled') {
        const resp = mineralsResult.value as GetCriticalMineralsResponse;
        this.minerals = (resp.minerals ?? []).slice(0, 5);
      }

      if (cpStatusResult.status === 'fulfilled') {
        const resp = cpStatusResult.value;
        this.chokepoints = buildChokepointMonitoring(resp);
      }
    } catch { /* defaults */ }

    if (this.chokepoints.length === 0) {
      this.chokepoints = buildChokepointMonitoring(null);
    }
    if (this.minerals.length === 0) {
      this.minerals = [
        { mineral: 'Lithium', hhi: 5184, riskRating: 'high', globalProduction: 180000, unit: 'tonnes', topProducers: [{ country: 'Australia', countryCode: 'AU', productionTonnes: 61000, sharePct: 52 }, { country: 'Chile', countryCode: 'CL', productionTonnes: 39000, sharePct: 33 }] },
        { mineral: 'Cobalt', hhi: 7225, riskRating: 'critical', globalProduction: 190000, unit: 'tonnes', topProducers: [{ country: 'DRC', countryCode: 'CD', productionTonnes: 130000, sharePct: 73 }, { country: 'Russia', countryCode: 'RU', productionTonnes: 9500, sharePct: 5 }] },
        { mineral: 'Rare Earths', hhi: 8100, riskRating: 'critical', globalProduction: 350000, unit: 'tonnes REO', topProducers: [{ country: 'China', countryCode: 'CN', productionTonnes: 210000, sharePct: 60 }] },
        { mineral: 'Gallium', hhi: 9025, riskRating: 'critical', globalProduction: 550, unit: 'tonnes', topProducers: [{ country: 'China', countryCode: 'CN', productionTonnes: 540, sharePct: 98 }] },
      ];
    }
  }

  private stressGauge(): number {
    if (this.chokepoints.length === 0) return 30;
    const avg = this.chokepoints.reduce((s, c) => s + c.riskScore, 0) / this.chokepoints.length;
    return Math.round(avg);
  }

  private hhiColor(hhi: number): string {
    if (hhi >= 7000) return 'text-error';
    if (hhi >= 4000) return 'text-orange-400';
    return 'text-primary';
  }

  private riskColor(risk: number): string {
    if (risk >= 70) return 'bg-error';
    if (risk >= 50) return 'bg-orange-400';
    if (risk >= 30) return 'bg-yellow-400';
    return 'bg-primary';
  }

  render(): void {
    const stress = this.stressGauge();
    const stressColor = stress >= 70 ? 'text-error' : stress >= 50 ? 'text-orange-400' : 'text-primary';

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Supply Chain</h3>
        <span class="material-symbols-outlined text-on-surface-variant text-sm">local_shipping</span>
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COMPOSITE STRESS</div>
        <div class="text-3xl font-data-lg ${stressColor} panel-stat-lg">${stress}</div>
        <div class="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div class="h-full ${stressColor.replace('text-', 'bg-')} rounded-full transition-all duration-1000" style="width: ${stress}%"></div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CRITICAL MINERALS</div>
        <div class="flex flex-col gap-1">
          ${this.minerals.map((m, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <span class="text-xs text-on-surface font-body-sm">${m.mineral}</span>
              <div class="flex items-center gap-2">
                <span class="text-[9px] font-data-md text-on-surface-variant">${m.topProducers?.[0]?.country ?? '—'}</span>
                <span class="text-[9px] font-data-md ${this.hhiColor(m.hhi)} px-1.5 py-0.5 rounded bg-white/5">HHI ${m.hhi}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">SCENARIO TRIGGERS</div>
      <div class="flex flex-wrap gap-1.5 mb-3">
        ${this.scenarios.map((s, i) => `
          <button class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer hover:scale-105" style="animation: fadeInUp 0.3s ease-out ${0.4 + 0.05 * i}s both;">
            <span class="material-symbols-outlined text-xs text-on-surface-variant">${s.icon}</span>
            <span class="text-[10px] text-on-surface font-body-sm">${s.name}</span>
            <span class="text-[9px] font-data-md ${this.riskColor(s.risk)} text-white px-1 rounded">${s.risk}%</span>
          </button>`).join('')}
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CHOKEPOINTS</div>
      <div class="flex flex-col gap-1">
        ${this.chokepoints.map(cp => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
            <span class="text-xs text-on-surface font-body-sm">${cp.name}</span>
            <span class="text-[9px] font-data-md px-1.5 py-0.5 rounded ${cp.status === 'Critical' ? 'bg-error text-white' : cp.status === 'High Risk' ? 'bg-error/10 text-error' : cp.status === 'Elevated' ? 'bg-orange-400/10 text-orange-400' : 'bg-primary/10 text-primary'}">${cp.riskScore}</span>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
