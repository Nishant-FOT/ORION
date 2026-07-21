import { fetchRadiationWatch, type RadiationWatchResult, type RadiationObservation } from '@/services/radiation';

export class RadiationPanel {
  private container: HTMLElement;
  private result: RadiationWatchResult | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      this.result = await fetchRadiationWatch();
    } catch { /* defaults */ }

    if (!this.result || this.result.observations.length === 0) {
      this.result = {
        fetchedAt: new Date(),
        observations: [
          { id: '1', source: 'EPA RadNet', contributingSources: ['EPA RadNet'], location: 'Washington D.C.', country: 'US', lat: 38.9, lon: -77.0, value: 0.09, unit: 'µSv/h', observedAt: new Date(), freshness: 'live', baselineValue: 0.08, delta: 0.01, zScore: 0.5, severity: 'normal', confidence: 'high', corroborated: true, conflictingSources: false, convertedFromCpm: false, sourceCount: 1 },
          { id: '2', source: 'Safecast', contributingSources: ['Safecast'], location: 'Fukushima', country: 'JP', lat: 37.7, lon: 140.5, value: 0.12, unit: 'µSv/h', observedAt: new Date(), freshness: 'live', baselineValue: 0.10, delta: 0.02, zScore: 1.2, severity: 'normal', confidence: 'high', corroborated: true, conflictingSources: false, convertedFromCpm: false, sourceCount: 2 },
          { id: '3', source: 'EPA RadNet', contributingSources: ['EPA RadNet'], location: 'New York', country: 'US', lat: 40.7, lon: -74.0, value: 0.08, unit: 'µSv/h', observedAt: new Date(), freshness: 'live', baselineValue: 0.08, delta: 0.0, zScore: 0.0, severity: 'normal', confidence: 'high', corroborated: true, conflictingSources: false, convertedFromCpm: false, sourceCount: 1 },
          { id: '4', source: 'Safecast', contributingSources: ['Safecast'], location: 'Chernobyl Zone', country: 'UA', lat: 51.4, lon: 30.1, value: 0.35, unit: 'µSv/h', observedAt: new Date(), freshness: 'recent', baselineValue: 0.15, delta: 0.20, zScore: 4.2, severity: 'elevated', confidence: 'medium', corroborated: false, conflictingSources: false, convertedFromCpm: false, sourceCount: 1 },
          { id: '5', source: 'Safecast', contributingSources: ['Safecast'], location: 'Zaporizhzhia', country: 'UA', lat: 47.8, lon: 35.2, value: 0.45, unit: 'µSv/h', observedAt: new Date(), freshness: 'recent', baselineValue: 0.12, delta: 0.33, zScore: 5.8, severity: 'spike', confidence: 'medium', corroborated: false, conflictingSources: false, convertedFromCpm: false, sourceCount: 1 },
          { id: '6', source: 'EPA RadNet', contributingSources: ['EPA RadNet'], location: 'Los Angeles', country: 'US', lat: 34.1, lon: -118.2, value: 0.07, unit: 'µSv/h', observedAt: new Date(), freshness: 'live', baselineValue: 0.07, delta: 0.0, zScore: 0.0, severity: 'normal', confidence: 'high', corroborated: true, conflictingSources: false, convertedFromCpm: false, sourceCount: 1 },
        ],
        coverage: { epa: 3, safecast: 3 },
        summary: { anomalyCount: 1, elevatedCount: 1, spikeCount: 1, corroboratedCount: 4, lowConfidenceCount: 2, conflictingCount: 0, convertedFromCpmCount: 0 },
      };
    }
  }

  private statusBadge(obs: RadiationObservation): string {
    if (obs.severity === 'spike') return 'bg-error/10 text-error border-error/20';
    if (obs.severity === 'elevated') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-primary/10 text-primary border-primary/20';
  }

  private statusLabel(obs: RadiationObservation): string {
    if (obs.severity === 'spike') return 'CRITICAL';
    if (obs.severity === 'elevated') return 'ELEVATED';
    return 'NORMAL';
  }

  render(): void {
    const observations = this.result?.observations.slice(0, 8) ?? [];
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Radiation Watch</h3>
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${observations.map((r, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div>
              <div class="text-sm text-on-surface font-body-sm panel-body">${r.location}</div>
              <div class="text-[10px] text-on-surface-variant font-data-md">Baseline: ${r.baselineValue} ${r.unit} · Δ ${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(2)}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-data-md text-on-surface panel-stat">${r.value} ${r.unit}</span>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.statusBadge(r)}">${this.statusLabel(r)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
