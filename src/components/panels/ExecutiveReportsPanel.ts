import { loadAllCIIData } from '@/services/cii-data-loader';
import { fetchConflictEvents } from '@/services/conflict';
import { buildChokepointMonitoring } from '@/services/chokepoint-monitoring';
import { fetchCachedRiskScores } from '@/services/cached-risk-scores';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_REPORT = { globalRiskLevel: 'elevated', globalRiskScore: 58, conflictCount: 12, highFatalityCount: 4, criticalChokepoints: 1, supplyChainStress: 'Elevated', regionsAtRisk: ['MENA', 'Eastern Europe', 'Indo-Pacific'] };

export class ExecutiveReportsPanel {
  private container: HTMLElement;
  private report = { globalRiskLevel: '—', globalRiskScore: 0, conflictCount: 0, highFatalityCount: 0, criticalChokepoints: 0, supplyChainStress: '—', regionsAtRisk: [] as string[] };
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const report = { globalRiskLevel: '—', globalRiskScore: 0, conflictCount: 0, highFatalityCount: 0, criticalChokepoints: 0, supplyChainStress: '—', regionsAtRisk: [] as string[] };

    const result = await fetchPanelData(
      { name: 'executive-report', fallback: DEMO_REPORT },
      async () => {
        const [localScores, conflicts, chokepoints] = await Promise.allSettled([
          loadAllCIIData(),
          fetchConflictEvents(),
          buildChokepointMonitoring(),
        ]);

        if (localScores.status === 'fulfilled' && localScores.value.length > 0) {
          const scores = localScores.value;
          const topUnstable = scores.sort((a, b) => b.score - a.score).slice(0, 5);
          const avgScore = Math.round(scores.reduce((sum, c) => sum + c.score, 0) / scores.length);
          report.globalRiskScore = avgScore;
          report.globalRiskLevel = avgScore >= 71 ? 'critical' : avgScore >= 56 ? 'high' : avgScore >= 41 ? 'elevated' : 'normal';
          report.regionsAtRisk = topUnstable.map(c => c.name);
        } else {
          const riskScores = await fetchCachedRiskScores();
          if (riskScores) {
            report.globalRiskScore = riskScores.strategicRisk.score;
            report.globalRiskLevel = riskScores.strategicRisk.level || 'low';
            const regions = new Set<string>();
            for (const c of riskScores.cii) {
              if (c.score >= 50) regions.add(c.name);
            }
            report.regionsAtRisk = [...regions].slice(0, 5);
          }
        }

        if (conflicts.status === 'fulfilled' && conflicts.value) {
          report.conflictCount = conflicts.value.count ?? 0;
          report.highFatalityCount = (conflicts.value.events || []).filter(e => e.fatalities >= 25).length;
        }

        if (chokepoints.status === 'fulfilled' && chokepoints.value) {
          const critical = chokepoints.value.filter(c => c.riskScore >= 70);
          report.criticalChokepoints = critical.length;
          if (critical.length >= 3) report.supplyChainStress = 'High';
          else if (critical.length >= 1) report.supplyChainStress = 'Elevated';
          else report.supplyChainStress = 'Normal';
        }
        return report;
      },
      (_data) => true,
    );
    this.report = result.data;
    this.source = result.source;
  }

  private levelColor(l: string): string {
    const m: Record<string, string> = { critical: 'text-error', high: 'text-orange-400', elevated: 'text-yellow-400', medium: 'text-yellow-400', normal: 'text-primary', low: 'text-on-surface-variant' };
    return m[l] || 'text-on-surface-variant';
  }

  render(): void {
    const r = this.report;
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Executive Report</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="text-[10px] font-data-md text-on-surface-variant">${new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div class="panel-grid-inner mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">GLOBAL RISK</div>
          <div class="text-2xl font-data-lg ${this.levelColor(r.globalRiskLevel)} panel-stat-lg">${r.globalRiskScore}</div>
          <div class="text-[9px] font-data-md text-on-surface-variant mt-1">${r.globalRiskLevel.toUpperCase()}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">CONFLICTS</div>
          <div class="text-2xl font-data-lg text-error panel-stat-lg">${r.conflictCount}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">CRITICAL CHOKEPOINTS</div>
          <div class="text-2xl font-data-lg text-orange-400 panel-stat-lg">${r.criticalChokepoints}</div>
          <div class="text-[9px] font-data-md text-on-surface-variant mt-1">${r.supplyChainStress}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">HIGH FATALITY</div>
          <div class="text-2xl font-data-lg text-error panel-stat-lg">${r.highFatalityCount}</div>
        </div>
      </div>
      <div>
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">REGIONS AT RISK</div>
        <div class="flex flex-wrap gap-1">
          ${r.regionsAtRisk.map(reg => `<span class="text-[10px] font-data-md px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">${reg}</span>`).join('')}
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
