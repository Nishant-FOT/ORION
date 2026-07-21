import { fetchThermalEscalations, type ThermalEscalationCluster } from '@/services/thermal-escalation';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_CLUSTERS: ThermalEscalationCluster[] = [
  { id: 'therm-1', regionLabel: 'Sahel Belt', countryName: 'Mali', countryCode: 'ML', context: 'conflict_adjacent', lat: 17.57, lon: -4.0, observationCount: 42, confidence: 'high', zScore: 3.8, totalFrp: 12500, persistenceHours: 72, status: 'spike', uniqueSourceCount: 3, maxBrightness: 350, avgBrightness: 310, maxFrp: 800, nightDetectionShare: 0.4, baselineExpectedCount: 12, baselineExpectedFrp: 4000, countDelta: 30, frpDelta: 8500, strategicRelevance: 'high', nearbyAssets: ['Timbuktu Airfield'], narrativeFlags: ['military'], firstDetectedAt: new Date(Date.now() - 72 * 3600000), lastDetectedAt: new Date() },
  { id: 'therm-2', regionLabel: 'Amazon Basin', countryName: 'Brazil', countryCode: 'BR', context: 'wildland', lat: -3.1, lon: -60.0, observationCount: 28, confidence: 'medium', zScore: 2.5, totalFrp: 8900, persistenceHours: 48, status: 'elevated', uniqueSourceCount: 2, maxBrightness: 320, avgBrightness: 280, maxFrp: 600, nightDetectionShare: 0.1, baselineExpectedCount: 8, baselineExpectedFrp: 2500, countDelta: 20, frpDelta: 6400, strategicRelevance: 'medium', nearbyAssets: ['Manaus Port'], narrativeFlags: ['deforestation'], firstDetectedAt: new Date(Date.now() - 48 * 3600000), lastDetectedAt: new Date() },
  { id: 'therm-3', regionLabel: 'Southeast', countryName: 'Ukraine', countryCode: 'UA', context: 'industrial', lat: 48.3, lon: 37.5, observationCount: 15, confidence: 'high', zScore: 4.1, totalFrp: 5600, persistenceHours: 96, status: 'persistent', uniqueSourceCount: 4, maxBrightness: 400, avgBrightness: 340, maxFrp: 1200, nightDetectionShare: 0.6, baselineExpectedCount: 3, baselineExpectedFrp: 1000, countDelta: 12, frpDelta: 4600, strategicRelevance: 'high', nearbyAssets: ['Donetsk Rail Hub'], narrativeFlags: ['infrastructure'], firstDetectedAt: new Date(Date.now() - 96 * 3600000), lastDetectedAt: new Date() },
  { id: 'therm-4', regionLabel: 'Central Highlands', countryName: 'Myanmar', countryCode: 'MM', context: 'conflict_adjacent', lat: 20.8, lon: 96.5, observationCount: 19, confidence: 'low', zScore: 1.7, totalFrp: 3200, persistenceHours: 24, status: 'normal', uniqueSourceCount: 1, maxBrightness: 290, avgBrightness: 260, maxFrp: 400, nightDetectionShare: 0.2, baselineExpectedCount: 10, baselineExpectedFrp: 2000, countDelta: 9, frpDelta: 1200, strategicRelevance: 'low', nearbyAssets: [], narrativeFlags: [], firstDetectedAt: new Date(Date.now() - 24 * 3600000), lastDetectedAt: new Date() },
];

export class ThermalEscalationPanel {
  private container: HTMLElement;
  private clusters: ThermalEscalationCluster[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'thermal-escalations', fallback: DEMO_CLUSTERS},
      async () => {
        const data = await fetchThermalEscalations(10);
        return data.clusters;
      },
      (data) => Array.isArray(data),
    );
    this.clusters = result.data;
    this.source = result.source;
  }

  private getConfidenceColor(c: string): string {
    if (c === 'high') return 'text-red-400 bg-red-500/20';
    if (c === 'medium') return 'text-amber-400 bg-amber-500/20';
    return 'text-slate-400 bg-slate-500/20';
  }

  private getSeverity(status: string): { label: string; color: string } {
    if (status === 'spike' || status === 'persistent') return { label: 'CRITICAL', color: 'text-red-400 bg-red-500/20 border-red-500/30' };
    if (status === 'elevated') return { label: 'HIGH', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    return { label: 'NORMAL', color: 'text-slate-300 bg-slate-500/20 border-slate-500/30' };
  }

  render(): void {
    this.container.innerHTML = `
      <style>
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .panel-fade-in { animation: fadeInUp 0.4s ease-out forwards; }
      </style>
      <div class="bg-white/5 rounded-xl p-4 panel-fade-in">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase mb-1">Thermal Escalation</p>
            <p class="text-2xl font-data-lg text-white">${this.clusters.length} Active Signals</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/>
            </svg>
          </div>
        </div>

        ${this.clusters.length === 0
          ? `<div class="flex flex-col items-center justify-center py-8 text-slate-400/40">
              <span class="material-symbols-outlined text-2xl mb-2">local_fire_department</span>
              <span class="text-xs">No thermal anomalies detected</span>
            </div>`
          : `
        <div class="space-y-2 mb-4">
          ${this.clusters.map((c, i) => {
            const sev = this.getSeverity(c.status);
            return `
              <div class="bg-white/5 rounded-lg p-3 panel-fade-in" style="animation-delay:${i * 80}ms">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <div class="min-w-0">
                    <p class="text-xs text-white font-medium">${c.regionLabel || c.countryName}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${c.context.replace('_', ' ')}</p>
                  </div>
                  <span class="shrink-0 text-[10px] font-label-caps px-2 py-0.5 rounded-full border ${sev.color}">${sev.label}</span>
                </div>
                <div class="flex items-center gap-3 text-[10px]">
                  <span class="text-slate-500">${c.lat.toFixed(2)}N, ${c.lon.toFixed(2)}E</span>
                  <span class="text-orange-400 font-medium">${c.observationCount} obs</span>
                  <span class="${this.getConfidenceColor(c.confidence)} px-1.5 py-0.5 rounded-full font-label-caps">${c.confidence} conf</span>
                </div>
                <div class="flex items-center gap-2 mt-1 text-[9px] text-slate-500">
                  <span>z: ${c.zScore.toFixed(1)}</span>
                  <span>frp: ${Math.round(c.totalFrp)}</span>
                  <span>persistence: ${c.persistenceHours}h</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        `}

        <div class="bg-white/5 rounded-lg p-3 border border-white/5">
          <div class="flex items-center gap-2 mb-1">
            ${renderDataBadge(this.source)}
            <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase">Satellite Feed</p>
          </div>
          <p class="text-[10px] text-slate-500">VIIRS/MODIS thermal anomaly data \u00B7 ${this.source === 'live' ? 'Live' : this.source === 'cached' ? 'Cached' : 'Demo'}</p>
        </div>

        <p class="text-[10px] text-slate-600 mt-3 text-center">Source: NASA FIRMS</p>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
