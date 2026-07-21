import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface MacroTile {
  label: string;
  value: string;
  change: number;
  icon: string;
}

const DEMO: MacroTile[] = [
  { label: 'GDP', value: '2.4%', change: 0.3, icon: 'bar_chart' },
  { label: 'CPI', value: '3.2%', change: -0.1, icon: 'price_change' },
  { label: 'PMI', value: '52.8', change: 1.2, icon: 'factory' },
  { label: 'UNEMP', value: '4.1%', change: -0.2, icon: 'person_search' },
  { label: 'RETAIL', value: '+0.5%', change: 0.3, icon: 'shopping_cart' },
  { label: 'HOUSING', value: '1.28M', change: -3.0, icon: 'home' },
];

export class MacroTilesPanel {
  private container: HTMLElement;
  private tiles: MacroTile[] = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'macro-tiles', fallback: DEMO},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/market/v1/get-macro-tiles`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable || !d.tiles?.length) throw new Error('unavailable');
        return d.tiles as MacroTile[];
      },
      (data) => Array.isArray(data),
    );
    this.tiles = data;
    this.source = source;

    if (source === 'cached') {
      try {
        const gdpObs = (getHydratedData('fredGdp') as any)?.series?.observations ?? [];
        const cpiObs = (getHydratedData('fredCpi') as any)?.series?.observations ?? [];
        const unrateObs = (getHydratedData('fredUnemployment') as any)?.series?.observations ?? [];
        const fedObs = (getHydratedData('fredFedFunds') as any)?.series?.observations ?? [];
        const gdpVal = gdpObs[0]?.value ? parseFloat(gdpObs[0].value).toFixed(1) + '%' : null;
        const cpiVal = cpiObs[0]?.value ? parseFloat(cpiObs[0].value).toFixed(1) + '%' : null;
        const cpiChange = cpiObs[1]?.value && cpiObs[0]?.value ?
          (parseFloat(cpiObs[0].value) - parseFloat(cpiObs[1].value)).toFixed(1) : '0';
        const unrateVal = unrateObs[0]?.value ? parseFloat(unrateObs[0].value).toFixed(1) + '%' : null;
        const fedVal = fedObs[0]?.value ? parseFloat(fedObs[0].value).toFixed(2) + '%' : null;
        if (gdpVal || cpiVal) {
          this.tiles = [
            { label: 'GDP', value: gdpVal ?? 'N/A', change: 0, icon: 'bar_chart' },
            { label: 'CPI', value: cpiVal ?? 'N/A', change: parseFloat(cpiChange) || 0, icon: 'price_change' },
            { label: 'UNEMP', value: unrateVal ?? 'N/A', change: 0, icon: 'person_search' },
            { label: 'FED RATE', value: fedVal ?? 'N/A', change: 0, icon: 'account_balance' },
          ];
          this.source = 'live';
        }
      } catch { /* keep demo/cached */ }
    }
  }

  private changeColor(v: number): string { return v > 0 ? 'text-primary' : v < 0 ? 'text-error' : 'text-on-surface-variant'; }
  private changeIcon(v: number): string { return v > 0 ? '&#9650;' : v < 0 ? '&#9660;' : '&#9679;'; }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Macro Indicators</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="grid grid-cols-3 gap-2">
        ${this.tiles.map((t, i) => `
          <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
            <div class="flex items-center gap-1.5 mb-2">
              <span class="material-symbols-outlined text-on-surface-variant text-sm">${t.icon}</span>
              <span class="text-[10px] font-label-caps text-on-surface-variant">${t.label}</span>
            </div>
            <div class="text-2xl font-data-lg text-on-surface panel-stat">${t.value}</div>
            <div class="flex items-center gap-1 mt-1">
              <span class="${this.changeColor(t.change)} text-xs font-data-md">${this.changeIcon(t.change)} ${t.change > 0 ? '+' : ''}${t.change.toFixed(1)}%</span>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
