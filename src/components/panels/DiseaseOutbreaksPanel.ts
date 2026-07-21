import { fetchDiseaseOutbreaks } from '@/services/disease-outbreaks';
import { fetchHealthAirQuality } from '@/services/health-air-quality';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

export class DiseaseOutbreaksPanel {
  private container: HTMLElement;
  private outbreaks: Array<{ name: string; cases: number; deaths: number; region: string; severity: string }> = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const DEMO_OUTBREAKS = [
      { name: 'Mpox', cases: 12500, deaths: 45, region: 'Central Africa', severity: 'high' },
      { name: 'Dengue', cases: 350000, deaths: 250, region: 'Southeast Asia', severity: 'high' },
      { name: 'Cholera', cases: 8500, deaths: 180, region: 'Sahel', severity: 'moderate' },
      { name: 'H5N1 Avian Flu', cases: 900, deaths: 280, region: 'Global', severity: 'high' },
    ];
    const fallback = { outbreaks: DEMO_OUTBREAKS };

    const result = await fetchPanelData(
      { name: 'disease-outbreaks', fallback},
      async () => {
        const [diseaseData, airQualityData] = await Promise.allSettled([
          fetchDiseaseOutbreaks(),
          fetchHealthAirQuality(),
        ]);

        let list: typeof DEMO_OUTBREAKS = [];

        if (diseaseData.status === 'fulfilled' && diseaseData.value?.outbreaks) {
          list = diseaseData.value.outbreaks.slice(0, 5).map(o => ({
            name: o.disease || 'Unknown',
            cases: o.cases ?? 0,
            deaths: 0,
            region: o.location || 'Global',
            severity: (o.cases ?? 0) > 10000 ? 'high' : 'moderate',
          }));
        }
        if (airQualityData.status === 'fulfilled' && airQualityData.value?.alerts?.length) {
          const aqAlerts = airQualityData.value.alerts.map(a => ({
            name: `Air Quality: ${a.pollutant || 'Pollutant'}`,
            cases: 0,
            deaths: 0,
            region: a.city ? `${a.city}, ${a.countryCode}` : 'Unknown',
            severity: a.riskLevel || 'moderate',
          }));
          list = [...aqAlerts, ...list];
        }

        return { outbreaks: list.length > 0 ? list : fallback.outbreaks };
      },
      (_data) => true,
    );
    this.source = result.source;
    this.outbreaks = result.data.outbreaks;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Disease Outbreaks</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.outbreaks.map((o, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-on-surface font-body-sm panel-body">${o.name}</span>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md ${o.severity === 'high' ? 'bg-error/10 text-error border-error/20' : 'bg-orange-400/10 text-orange-400 border-orange-400/20'} border">${o.severity.toUpperCase()}</span>
            </div>
            <div class="flex items-center gap-3 text-[10px] font-data-md text-on-surface-variant panel-stat">
              <span>${o.cases.toLocaleString()} cases</span>
              <span>${o.deaths.toLocaleString()} deaths</span>
              <span>${o.region}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
