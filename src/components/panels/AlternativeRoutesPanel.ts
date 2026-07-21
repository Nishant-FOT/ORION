interface BypassRoute {
  id: string;
  name: string;
  chokepoint: string;
  transitDays: number;
  costMultiplier: number;
  capacityPct: number;
  status: 'active' | 'limited' | 'planned';
  summary: string;
}

// Reference route definitions (static shipping route data, not demo data)
const REFERENCE_ROUTES: BypassRoute[] = [
  {
    id: 'br-1',
    name: 'Cape of Good Hope',
    chokepoint: 'Suez Canal',
    transitDays: 34,
    costMultiplier: 1.85,
    capacityPct: 100,
    status: 'active',
    summary: 'Full-capacity alternative for Suez transit. Adds 10–14 days vs Suez route. Most carriers have activated Cape routing.',
  },
  {
    id: 'br-2',
    name: 'Trans-Siberian Rail',
    chokepoint: 'Strait of Malacca',
    transitDays: 18,
    costMultiplier: 2.4,
    capacityPct: 45,
    status: 'limited',
    summary: 'Rail corridor from Vladivostok to Europe. Limited to 45% of vessel capacity equivalent. Viable for high-value cargo.',
  },
  {
    id: 'br-3',
    name: 'Northern Sea Route',
    chokepoint: 'Panama Canal',
    transitDays: 22,
    costMultiplier: 1.6,
    capacityPct: 30,
    status: 'limited',
    summary: 'Arctic passage available Jul–Nov. Seasonal window restricts year-round use. Growing ice-free days extending the window.',
  },
];

export class AlternativeRoutesPanel {
  private container: HTMLElement;
  private routes: BypassRoute[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const { fetchBypassOptions } = await import('@/services/supply-chain');
      const result = await fetchBypassOptions('hormuz_strait', 'container', 100);
      if (result?.options?.length) {
        this.routes = result.options.slice(0, 5).map((opt, i) => ({
          id: opt.id ?? `route-${i}`,
          name: opt.name ?? `Bypass ${i + 1}`,
          chokepoint: 'Hormuz',
          transitDays: opt.addedTransitDays ?? 0,
          costMultiplier: opt.addedCostMultiplier ?? 1.0,
          capacityPct: 0,
          status: 'planned' as const,
          summary: opt.activationThreshold ?? '',
        }));
        return;
      }
    } catch { /* live fetch failed */ }
    this.routes = REFERENCE_ROUTES.map(r => ({ ...r }));
  }

  private statusColor(s: string): string {
    if (s === 'active') return 'bg-green-400/10 text-green-400 border border-green-400/20';
    if (s === 'limited') return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
    return 'bg-white/5 text-on-surface-variant border border-white/10';
  }

  private statusDot(s: string): string {
    if (s === 'active') return 'bg-green-400';
    if (s === 'limited') return 'bg-yellow-400';
    return 'bg-white/30';
  }

  private costColor(c: number): string {
    if (c >= 2.0) return 'text-error';
    if (c >= 1.5) return 'text-orange-400';
    return 'text-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Alternative Routes</h3>
        <span class="material-symbols-outlined text-on-surface-variant text-sm">route</span>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.routes.map((r, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-start mb-2">
              <div>
                <div class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors">${r.name}</div>
                <div class="text-[9px] font-data-md text-on-surface-variant/60">Bypass for ${r.chokepoint}</div>
              </div>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-data-md border ${this.statusColor(r.status)}">
                <span class="w-1.5 h-1.5 rounded-full ${this.statusDot(r.status)}"></span>
                ${r.status.toUpperCase()}
              </span>
            </div>
            <p class="text-[10px] text-on-surface-variant font-body-sm leading-relaxed mb-2">${r.summary}</p>
            <div class="grid grid-cols-3 gap-2 text-center mb-2">
              <div class="bg-white/5 rounded-lg p-1.5">
                <div class="text-[8px] font-label-caps text-on-surface-variant">TRANSIT</div>
                <div class="text-xs font-data-md text-on-surface">${r.transitDays}d</div>
              </div>
              <div class="bg-white/5 rounded-lg p-1.5">
                <div class="text-[8px] font-label-caps text-on-surface-variant">COST</div>
                <div class="text-xs font-data-md ${this.costColor(r.costMultiplier)}">${r.costMultiplier}x</div>
              </div>
              <div class="bg-white/5 rounded-lg p-1.5">
                <div class="text-[8px] font-label-caps text-on-surface-variant">CAPACITY</div>
                <div class="text-xs font-data-md text-on-surface">${r.capacityPct}%</div>
              </div>
            </div>
            <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full ${r.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'} rounded-full transition-all" style="width: ${r.capacityPct}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
