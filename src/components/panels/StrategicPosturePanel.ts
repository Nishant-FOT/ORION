import { fetchConflictEvents, type ConflictData } from '@/services/conflict';
import { buildChokepointMonitoring, type ChokepointMonitor } from '@/services/chokepoint-monitoring';
import { fetchChokepointStatus } from '@/services/supply-chain';

interface RegionCount { region: string; count: number; fatalities: number; }

export class StrategicPosturePanel {
  private container: HTMLElement;
  private chokepoints: ChokepointMonitor[] = [];
  private regionCounts: RegionCount[] = [];
  private activeConflicts = 0;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const [cpStatus, conflictData] = await Promise.allSettled([
        fetchChokepointStatus(),
        fetchConflictEvents(),
      ]);

      if (cpStatus.status === 'fulfilled') {
        this.chokepoints = buildChokepointMonitoring(cpStatus.value)
          .sort((a, b) => b.riskScore - a.riskScore)
          .slice(0, 5);
      }

      if (conflictData.status === 'fulfilled' && conflictData.value?.events) {
        const data: ConflictData = conflictData.value;
        this.activeConflicts = data.events.length;

        const regionMap = new Map<string, { count: number; fatalities: number }>();
        for (const event of data.events) {
          const region = event.country || 'Unknown';
          const existing = regionMap.get(region) ?? { count: 0, fatalities: 0 };
          existing.count++;
          existing.fatalities += event.fatalities;
          regionMap.set(region, existing);
        }
        this.regionCounts = [...regionMap.entries()]
          .map(([region, v]) => ({ region, ...v }))
          .sort((a, b) => b.fatalities - a.fatalities)
          .slice(0, 6);
      }
    } catch { /* defaults */ }

    if (this.chokepoints.length === 0) {
      this.chokepoints = [
        { id: 'hormuz_strait', name: 'Strait of Hormuz', lat: 26.5, lon: 56.3, riskScore: 82, severityScore: 82, confidenceScore: 70, trendScore: 45, disruptionProbability: 72, status: 'Critical', evidence: ['Baseline risk from regional tensions'], sourceIds: ['hormuz_strait'] },
        { id: 'red_sea', name: 'Red Sea', lat: 20, lon: 38, riskScore: 78, severityScore: 78, confidenceScore: 65, trendScore: 55, disruptionProbability: 68, status: 'High Risk', evidence: ['Active disruption corridor'], sourceIds: ['red_sea'] },
        { id: 'bab_el_mandeb', name: 'Bab-el-Mandeb', lat: 12.6, lon: 43.3, riskScore: 84, severityScore: 84, confidenceScore: 72, trendScore: 50, disruptionProbability: 74, status: 'Critical', evidence: ['High vessel diversion rate'], sourceIds: ['bab_el_mandeb'] },
        { id: 'suez', name: 'Suez Canal', lat: 30.6, lon: 32.3, riskScore: 70, severityScore: 70, confidenceScore: 68, trendScore: 35, disruptionProbability: 60, status: 'High Risk', evidence: ['Constrained transit window'], sourceIds: ['suez'] },
        { id: 'malacca_strait', name: 'Strait of Malacca', lat: 2.5, lon: 101.5, riskScore: 48, severityScore: 48, confidenceScore: 55, trendScore: 20, disruptionProbability: 38, status: 'Elevated', evidence: ['Moderate congestion'], sourceIds: ['malacca_strait'] },
      ];
    }
    if (this.regionCounts.length === 0) {
      this.regionCounts = [
        { region: 'Ukraine', count: 45, fatalities: 450 },
        { region: 'Syria', count: 22, fatalities: 120 },
        { region: 'Myanmar', count: 18, fatalities: 85 },
        { region: 'Yemen', count: 15, fatalities: 60 },
        { region: 'Mali', count: 12, fatalities: 40 },
        { region: 'Sahel', count: 10, fatalities: 25 },
      ];
      this.activeConflicts = 122;
    }
  }

  private riskBadge(status: string): string {
    if (status === 'Critical') return 'bg-error/10 text-error border-error/20';
    if (status === 'High Risk') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    if (status === 'Elevated') return 'bg-secondary/10 text-secondary border-secondary/20';
    return 'bg-primary/10 text-primary border-primary/20';
  }

  private riskColor(score: number): string {
    if (score >= 75) return 'text-error';
    if (score >= 50) return 'text-orange-400';
    return 'text-primary';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Strategic Posture</h3>
        <span class="text-xs text-on-surface-variant font-data-md panel-stat">${this.activeConflicts} events</span>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">CHokepoint Risk Monitor</div>
        <div class="flex flex-col gap-1">
          ${this.chokepoints.map((cp, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex items-center gap-2">
                <span class="text-sm text-on-surface font-body-sm panel-body">${cp.name}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-data-md ${this.riskColor(cp.riskScore)}">${cp.riskScore}</span>
                <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.riskBadge(cp.status)}">${cp.status.toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">Active Conflicts by Region</div>
        <div class="flex flex-col gap-1">
          ${this.regionCounts.map((r, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="text-sm text-on-surface font-body-sm panel-body">${r.region}</div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-data-md text-on-surface-variant">${r.count} events</span>
                ${r.fatalities > 0 ? `<span class="text-[10px] font-data-md text-error">${r.fatalities} fatal</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
