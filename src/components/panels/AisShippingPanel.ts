import { fetchAisSignals } from '@/services/maritime';
import type { AisDisruptionEvent, AisDensityZone } from '@/types';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_DISRUPTIONS: AisDisruptionEvent[] = [
  { id: 'ais-dis-1', name: 'Red Sea Chokepoint', region: 'Middle East', type: 'chokepoint_congestion', severity: 'high', description: 'Elevated naval activity near Bab el-Mandeb', vesselCount: 340, changePct: -12, darkShips: 5, lat: 12.59, lon: 43.33, windowHours: 48 },
  { id: 'ais-dis-2', name: 'South China Sea', region: 'Asia', type: 'chokepoint_congestion', severity: 'elevated', description: 'Continued military exercises in shipping lanes', vesselCount: 520, changePct: -8, darkShips: 3, lat: 15.0, lon: 115.0, windowHours: 72 },
  { id: 'ais-dis-3', name: 'Strait of Hormuz', region: 'Middle East', type: 'chokepoint_congestion', severity: 'elevated', description: 'Increased IRGC patrol activity', vesselCount: 280, changePct: -5, darkShips: 2, lat: 26.57, lon: 56.25, windowHours: 36 },
];

const DEMO_DENSITY: AisDensityZone[] = [
  { id: 'ais-den-1', name: 'Malacca Strait', shipsPerDay: 210, deltaPct: 3, lat: 2.5, lon: 101.5, intensity: 0.85 },
  { id: 'ais-den-2', name: 'English Channel', shipsPerDay: 180, deltaPct: -2, lat: 50.5, lon: 0.5, intensity: 0.72 },
  { id: 'ais-den-3', name: 'Panama Canal', shipsPerDay: 95, deltaPct: 1, lat: 9.1, lon: -79.7, intensity: 0.45 },
];

type AisData = { disruptions: AisDisruptionEvent[]; density: AisDensityZone[] };

export class AisShippingPanel {
  private container: HTMLElement;
  private disruptions: AisDisruptionEvent[] = [];
  private density: AisDensityZone[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData<AisData>(
      { name: 'AisShipping', fallback: { disruptions: DEMO_DISRUPTIONS, density: DEMO_DENSITY }},
      async () => {
        const data = await fetchAisSignals();
        return {
          disruptions: data?.disruptions?.length ? data.disruptions.slice(0, 6) : DEMO_DISRUPTIONS,
          density: data?.density?.length ? data.density.slice(0, 5) : DEMO_DENSITY,
        };
      },
      (_data) => true
    );
    this.disruptions = result.data.disruptions;
    this.density = result.data.density;
    this.source = result.source;
  }

  private sevBadge(s: string): string {
    if (s === 'high') return 'bg-error/10 text-error border-error/20';
    if (s === 'elevated') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-primary/10 text-primary border-primary/20';
  }

  private typeLabel(t: string): string {
    if (t === 'chokepoint_congestion') return 'CONGESTION';
    return 'GAP SPIKE';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">AIS Shipping</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-data-md text-on-surface-variant">${this.disruptions.length} disruption${this.disruptions.length !== 1 ? 's' : ''}</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      ${this.disruptions.length === 0 && this.density.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">sailing</span>
            <span class="text-xs">No AIS data available</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.disruptions.map((d, i) => `
          <div class="p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-on-surface font-body-sm panel-body">${d.name || d.region}</span>
              <div class="flex items-center gap-1">
                <span class="text-[10px] font-label-caps px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant border border-white/10">${this.typeLabel(d.type)}</span>
                <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.sevBadge(d.severity)}">${d.severity.toUpperCase()}</span>
              </div>
            </div>
            <div class="text-[10px] text-on-surface-variant font-data-md mb-1">${d.description || d.region}</div>
            <div class="flex items-center gap-3 text-[10px] font-data-md text-on-surface-variant">
              <span>${d.region}</span>
              <span>${d.vesselCount ?? 0} vessels</span>
              <span>${d.changePct > 0 ? '+' : ''}${d.changePct ?? 0}% activity</span>
              ${d.darkShips ? `<span class="text-orange-400">${d.darkShips} dark</span>` : ''}
            </div>
          </div>
        `).join('')}
        ${this.density.length > 0 ? `
          <div class="mt-2 pt-2 border-t border-white/5">
            <div class="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider mb-1">Density Zones</div>
            ${this.density.map((z, i) => `
              <div class="flex items-center justify-between py-1 px-2 hover:bg-white/5 rounded transition-all" style="animation: fadeInUp 0.3s ease-out ${0.05 * (this.disruptions.length + i)}s both;">
                <span class="text-xs text-on-surface font-body-sm">${z.name}</span>
                <div class="flex items-center gap-2 text-[10px] font-data-md text-on-surface-variant">
                  <span>${z.shipsPerDay} ships/day</span>
                  <span class="${z.deltaPct > 0 ? 'text-primary' : z.deltaPct < 0 ? 'text-orange-400' : ''}">${z.deltaPct > 0 ? '+' : ''}${z.deltaPct}%</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
