import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Refinery {
  name: string;
  operator: string;
  location: string;
  capacity: string;
  utilization: number;
  compat: Record<string, 'green' | 'yellow' | 'red'>;
}

const CRUDE_GRADES = ['Arab Light', 'Basra Heavy', 'ESPO', 'Urals', 'Bonny Light', 'Murban', 'Al-Shaheen'];

const REFINERIES: Refinery[] = [
  {
    name: 'Jamnagar', operator: 'Reliance', location: 'Gujarat', capacity: '1.24M bbl/d', utilization: 92,
    compat: { 'Arab Light': 'green', 'Basra Heavy': 'green', 'ESPO': 'green', 'Urals': 'yellow', 'Bonny Light': 'green', 'Murban': 'green', 'Al-Shaheen': 'yellow' },
  },
  {
    name: 'Mangalore', operator: 'MRPL', location: 'Karnataka', capacity: '300K bbl/d', utilization: 88,
    compat: { 'Arab Light': 'green', 'Basra Heavy': 'yellow', 'ESPO': 'green', 'Urals': 'green', 'Bonny Light': 'yellow', 'Murban': 'green', 'Al-Shaheen': 'green' },
  },
  {
    name: 'Vadinar', operator: 'Nayara', location: 'Gujarat', capacity: '400K bbl/d', utilization: 85,
    compat: { 'Arab Light': 'green', 'Basra Heavy': 'green', 'ESPO': 'yellow', 'Urals': 'green', 'Bonny Light': 'green', 'Murban': 'yellow', 'Al-Shaheen': 'red' },
  },
  {
    name: 'Kochi', operator: 'BPCL', location: 'Kerala', capacity: '310K bbl/d', utilization: 79,
    compat: { 'Arab Light': 'green', 'Basra Heavy': 'red', 'ESPO': 'yellow', 'Urals': 'yellow', 'Bonny Light': 'green', 'Murban': 'green', 'Al-Shaheen': 'red' },
  },
  {
    name: 'Mathura', operator: 'HPCL', location: 'UP', capacity: '160K bbl/d', utilization: 91,
    compat: { 'Arab Light': 'green', 'Basra Heavy': 'yellow', 'ESPO': 'red', 'Urals': 'green', 'Bonny Light': 'yellow', 'Murban': 'green', 'Al-Shaheen': 'yellow' },
  },
  {
    name: 'Paradip', operator: 'IOCL', location: 'Odisha', capacity: '300K bbl/d', utilization: 86,
    compat: { 'Arab Light': 'green', 'Basra Heavy': 'green', 'ESPO': 'green', 'Urals': 'green', 'Bonny Light': 'red', 'Murban': 'green', 'Al-Shaheen': 'yellow' },
  },
];

const SWITCH_COSTS: Record<string, { time: string; cost: string; notes: string }> = {
  'Arab Light': { time: '3-5 days', cost: '$2-4M', notes: 'Minor adjustments' },
  'Basra Heavy': { time: '7-10 days', cost: '$8-15M', notes: 'Catalyst replacement' },
  'ESPO': { time: '5-7 days', cost: '$5-10M', notes: 'Desalter tuning' },
  'Urals': { time: '4-6 days', cost: '$3-7M', notes: 'Sulfur management' },
  'Bonny Light': { time: '2-4 days', cost: '$1-3M', notes: 'Quick switch' },
  'Murban': { time: '3-5 days', cost: '$2-5M', notes: 'Standard blend' },
  'Al-Shaheen': { time: '6-9 days', cost: '$6-12M', notes: 'Heavy grade config' },
};

export class RefineryCompatibilityPanel {
  private container: HTMLElement;
  private refineries = REFINERIES;
  private crudeGrades = CRUDE_GRADES;
  private switchCosts = SWITCH_COSTS;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      {
        name: 'RefineryCompatibilityPanel',
        fallback: { refineries: this.refineries },
      },
      async () => {
        const raw = getHydratedData('refineryInputs') as { weeks?: Array<{ period: string; inputsMbblpd: string | number }> } | undefined;
        const weeks = raw?.weeks ?? [];
        if (weeks.length > 0) {
          const latest = weeks[0]!;
          const inputBbl = Number(latest.inputsMbblpd);
          if (!isNaN(inputBbl) && inputBbl > 0) {
            const avgUtilPct = Math.min(100, Math.round((inputBbl / 18_000_000) * 100));
            const refineries = REFINERIES.map(r => ({
              ...r,
              utilization: Math.min(100, Math.max(50, r.utilization + Math.round((avgUtilPct - 87) * 0.5))),
            }));
            return { refineries };
          }
        }
        return { refineries: this.refineries };
      },
    );
    this.refineries = data.refineries;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private compatDot(color: 'green' | 'yellow' | 'red'): string {
    const cls = color === 'green' ? 'bg-primary' : color === 'yellow' ? 'bg-yellow-400' : 'bg-error';
    return `<span class="w-2.5 h-2.5 rounded-full ${cls} inline-block"></span>`;
  }

  private utilColor(u: number): string {
    if (u >= 90) return 'text-primary';
    if (u >= 80) return 'text-on-surface';
    return 'text-orange-400';
  }

  render(): void {
    const greenCount = this.refineries.reduce((sum, r) =>
      sum + Object.values(r.compat).filter(v => v === 'green').length, 0);
    const totalCells = this.refineries.length * this.crudeGrades.length;
    const compatPct = Math.round((greenCount / totalCells) * 100);

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Refinery Compatibility</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">REFINERIES</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.refineries.length}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">COMPAT RATE</div>
          <div class="text-2xl font-data-lg text-primary panel-stat-lg">${compatPct}%</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">AVG UTIL</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${Math.round(this.refineries.reduce((s, r) => s + r.utilization, 0) / this.refineries.length)}%</div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all cursor-pointer overflow-x-auto" style="animation: fadeInUp 0.3s ease-out 0.15s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">COMPATIBILITY MATRIX</div>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-1 mb-1">
            <div class="w-24 shrink-0"></div>
            ${this.crudeGrades.map(g => `<div class="flex-1 text-center text-[8px] font-label-caps text-on-surface-variant min-w-[44px]">${g.split(' ')[0]}</div>`).join('')}
          </div>
          ${this.refineries.map((r, i) => `
            <div class="flex items-center gap-1 py-1 hover:bg-white/5 rounded transition-all" style="animation: fadeInUp 0.3s ease-out ${0.2 + 0.04 * i}s both;">
              <div class="w-24 shrink-0">
                <div class="text-[10px] text-on-surface font-body-sm truncate">${r.name}</div>
                <div class="text-[8px] text-on-surface-variant">${r.operator}</div>
              </div>
              ${this.crudeGrades.map(g => `<div class="flex-1 flex justify-center min-w-[44px]">${this.compatDot(r.compat[g] ?? 'green')}</div>`).join('')}
            </div>`).join('')}
        </div>
        <div class="flex items-center gap-4 mt-3">
          <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-primary"></span><span class="text-[9px] text-on-surface-variant">Compatible</span></div>
          <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-400"></span><span class="text-[9px] text-on-surface-variant">Needs adjustment</span></div>
          <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-error"></span><span class="text-[9px] text-on-surface-variant">Incompatible</span></div>
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl mb-4 hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.35s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">UTILIZATION RATES</div>
        <div class="flex flex-col gap-1.5">
          ${this.refineries.map((r, i) => `
            <div class="flex items-center gap-2" style="animation: fadeInUp 0.3s ease-out ${0.4 + 0.04 * i}s both;">
              <span class="text-[10px] text-on-surface font-body-sm w-20 truncate">${r.name}</span>
              <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full ${r.utilization >= 90 ? 'bg-primary' : r.utilization >= 80 ? 'bg-blue-400' : 'bg-orange-400'} rounded-full transition-all duration-1000" style="width: ${r.utilization}%"></div>
              </div>
              <span class="text-[9px] font-data-md ${this.utilColor(r.utilization)} w-10 text-right">${r.utilization}%</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.55s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">SWITCHING COSTS</div>
        <div class="flex flex-col gap-1">
          ${Object.entries(this.switchCosts).map(([grade, info], i) => `
            <div class="flex items-center justify-between p-1.5 hover:bg-white/5 rounded transition-all" style="animation: fadeInUp 0.3s ease-out ${0.6 + 0.03 * i}s both;">
              <div>
                <span class="text-[10px] text-on-surface font-body-sm">${grade}</span>
                <span class="text-[8px] text-on-surface-variant ml-1">${info.notes}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-[9px] font-data-md text-on-surface-variant">${info.time}</span>
                <span class="text-[9px] font-data-md text-orange-400">${info.cost}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
