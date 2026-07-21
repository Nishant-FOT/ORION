import { fetchClimateAnomalies, fetchCo2Monitoring } from '@/services/climate';
import { fetchClimateAirQuality } from '@/services/climate-air-quality';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Anomaly { zone: string; tempDelta: number; severity: string; type: string; }

export class ClimateAnomalyPanel {
  private container: HTMLElement;
  private anomalies: Anomaly[] = [];
  private co2 = { current: 'N/A', change: '', methane: '' };
  private elevatedAqiStations = 0;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private aqiSeverity(aqi: number): string {
    if (aqi >= 151) return 'extreme';
    if (aqi >= 101) return 'elevated';
    if (aqi >= 51) return 'moderate';
    return 'normal';
  }

  private async fetchData(): Promise<void> {
    const FALLBACK_ANOMALIES: Anomaly[] = [
      { zone: 'Arctic', tempDelta: 3.2, severity: 'extreme', type: 'warm' },
      { zone: 'Mediterranean', tempDelta: 2.1, severity: 'moderate', type: 'warm' },
      { zone: 'South Asia', tempDelta: 1.8, severity: 'moderate', type: 'warm' },
      { zone: 'Western US', tempDelta: -0.5, severity: 'normal', type: 'cold' },
      { zone: 'Sahel', tempDelta: 0.3, severity: 'normal', type: 'mixed' },
      { zone: 'Southeast Asia', tempDelta: 1.5, severity: 'moderate', type: 'wet' },
    ];
    const fallback = { anomalies: FALLBACK_ANOMALIES, co2: { current: '425 ppm', change: '+2.5 ppm/yr', methane: '1925 ppb' }, elevatedAqiStations: 0 };

    const result = await fetchPanelData(
      { name: 'climate-anomaly', fallback},
      async () => {
        const [anomalies, co2Data, airQuality] = await Promise.allSettled([
          fetchClimateAnomalies(),
          fetchCo2Monitoring(),
          fetchClimateAirQuality(),
        ]);

        let anomalyList: Anomaly[] = [];
        let co2Val = fallback.co2;
        let elevatedCount = 0;

        if (anomalies.status === 'fulfilled' && anomalies.value?.anomalies) {
          anomalyList = anomalies.value.anomalies.slice(0, 6).map(a => ({ zone: a.zone, tempDelta: a.tempDelta, severity: a.severity, type: a.type }));
        }
        if (co2Data.status === 'fulfilled' && co2Data.value) {
          co2Val = { current: `${co2Data.value.currentPpm} ppm`, change: `+${co2Data.value.annualGrowthRate} ppm/yr`, methane: `${co2Data.value.methanePpb} ppb` };
        }
        if (airQuality.status === 'fulfilled' && airQuality.value?.stations?.length) {
          const aqAnomalies: Anomaly[] = airQuality.value.stations.map(s => ({
            zone: s.city || 'Unknown',
            tempDelta: 0,
            severity: this.aqiSeverity(s.aqi),
            type: 'air_quality',
          }));
          anomalyList = [...aqAnomalies, ...anomalyList];
          elevatedCount = airQuality.value.stations.filter(s => s.aqi > 100).length;
        }

        return { anomalies: anomalyList.length > 0 ? anomalyList : fallback.anomalies, co2: co2Val, elevatedAqiStations: elevatedCount };
      },
      (_data) => true,
    );
    this.source = result.source;
    this.anomalies = result.data.anomalies;
    this.co2 = result.data.co2;
    this.elevatedAqiStations = result.data.elevatedAqiStations;
  }

  private sevStyle(s: string): string {
    if (s === 'extreme') return 'bg-error/10 text-error border-error/20';
    if (s === 'moderate') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-primary/10 text-primary border-primary/20';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Climate Anomaly</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="panel-grid-inner mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">CO2</div>
          <div class="text-sm font-data-md text-on-surface panel-stat">${this.co2.current}</div>
          <div class="text-[10px] text-error font-data-md">${this.co2.change}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">METHANE</div>
          <div class="text-sm font-data-md text-on-surface panel-stat">${this.co2.methane}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">ANOMALIES</div>
          <div class="text-sm font-data-md text-on-surface panel-stat">${this.anomalies.length}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">ELEVATED AQI</div>
          <div class="text-sm font-data-md text-on-surface panel-stat">${this.elevatedAqiStations}</div>
        </div>
      </div>
      <div class="flex flex-col gap-1 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.anomalies.map((a, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center gap-2">
              <span class="text-sm text-on-surface font-body-sm panel-body">${a.zone}</span>
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${this.sevStyle(a.severity)}">${a.type === 'air_quality' ? 'AQI' : a.type.toUpperCase()}</span>
            </div>
            <span class="text-sm font-data-md ${a.type === 'air_quality' ? (a.severity === 'extreme' || a.severity === 'elevated' ? 'text-error' : 'text-on-surface-variant') : (a.tempDelta > 1 ? 'text-error' : a.tempDelta < 0 ? 'text-secondary' : 'text-on-surface-variant')}">${a.type === 'air_quality' ? a.severity.toUpperCase() : `${a.tempDelta > 0 ? '+' : ''}${a.tempDelta.toFixed(1)}°C`}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
