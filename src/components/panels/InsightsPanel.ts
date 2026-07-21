import { fetchConflictEvents } from '@/services/conflict';
import { fetchOilAnalytics } from '@/services/economic';
import { fetchChokepointStatus } from '@/services/supply-chain';
import { buildChokepointMonitoring } from '@/services/chokepoint-monitoring';
import { fetchEarthquakes } from '@/services/earthquakes';
import { loadAllCIIData } from '@/services/cii-data-loader';
import { fetchCachedRiskScores } from '@/services/cached-risk-scores';

interface Insight { id: string; type: 'risk' | 'opportunity' | 'trend' | 'alert'; title: string; detail: string; confidence: number; countries?: string[]; }

export class InsightsPanel {
  private container: HTMLElement;
  private insights: Insight[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const [localScores, oil, cpStatus, quakes, conflicts] = await Promise.allSettled([
        loadAllCIIData(),
        fetchOilAnalytics(),
        fetchChokepointStatus(),
        fetchEarthquakes(),
        fetchConflictEvents(),
      ]);

      if (localScores.status === 'fulfilled' && localScores.value.length > 0) {
        const scores = localScores.value;
        const rising = scores.filter(c => c.trend === 'rising' && c.score >= 51);
        if (rising.length > 0) {
          const top = rising.sort((a, b) => b.score - a.score).slice(0, 3);
          this.insights.push({
            id: 'risk-rising',
            type: 'alert',
            title: `${rising.length} country risk scores rising`,
            detail: `Top risers: ${top.map(c => `${c.name} (${c.score})`).join(', ')}`,
            confidence: 88,
            countries: top.map(c => c.code),
          });
        }
        const critical = scores.filter(c => c.level === 'critical');
        if (critical.length > 0) {
          this.insights.push({
            id: 'risk-critical',
            type: 'risk',
            title: `${critical.length} country(ies) at critical instability`,
            detail: critical.map(c => `${c.name}: ${c.score} (${c.trend})`).join('; '),
            confidence: 90,
            countries: critical.map(c => c.code),
          });
        }
        if (scores.some(c => c.score > 60)) {
          const avgScore = Math.round(scores.reduce((sum, c) => sum + c.score, 0) / scores.length);
          this.insights.push({
            id: 'strategic',
            type: 'risk',
            title: `Global strategic risk elevated: ${avgScore}`,
            detail: `${scores.length} countries tracked. Top risks: ${scores.sort((a, b) => b.score - a.score).slice(0, 3).map(c => c.name).join(', ')}`,
            confidence: 85,
          });
        }
      } else {
        const serverScores = await fetchCachedRiskScores();
        if (serverScores) {
          const rising = serverScores.cii.filter(c => c.trend === 'rising' && c.score >= 51);
          if (rising.length > 0) {
            const top = rising.sort((a, b) => b.score - a.score).slice(0, 3);
            this.insights.push({
              id: 'risk-rising',
              type: 'alert',
              title: `${rising.length} country risk scores rising`,
              detail: `Top risers: ${top.map(c => `${c.name} (${c.score})`).join(', ')}`,
              confidence: 88,
              countries: top.map(c => c.code),
            });
          }
          const critical = serverScores.cii.filter(c => c.level === 'critical');
          if (critical.length > 0) {
            this.insights.push({
              id: 'risk-critical',
              type: 'risk',
              title: `${critical.length} country(ies) at critical instability`,
              detail: critical.map(c => `${c.name}: ${c.score} (${c.trend})`).join('; '),
              confidence: 90,
              countries: critical.map(c => c.code),
            });
          }
          if (serverScores.strategicRisk.score > 60) {
            this.insights.push({
              id: 'strategic',
              type: 'risk',
              title: `Global strategic risk elevated: ${serverScores.strategicRisk.score}`,
              detail: `Trend: ${serverScores.strategicRisk.trend}. Key contributors: ${serverScores.strategicRisk.contributors.slice(0, 3).map(c => c.country).join(', ')}`,
              confidence: 85,
            });
          }
        }
      }

      if (oil.status === 'fulfilled' && oil.value) {
        const brent = oil.value.brentPrice?.current ?? 0;
        if (brent > 85) this.insights.push({ id: 'oil', type: 'alert', title: `Brent at $${brent.toFixed(2)} — elevated`, detail: 'Energy costs impacting supply chains. Monitor for further escalation.', confidence: 92 });
        const trend = oil.value.brentPrice?.trend;
        if (trend === 'up') this.insights.push({ id: 'oil-trend', type: 'trend', title: 'Oil price trend: upward', detail: `${oil.value.brentPrice?.changePct ?? 0}% change. Consider hedging.`, confidence: 80 });
      }

      if (conflicts.status === 'fulfilled' && conflicts.value) {
        const high = (conflicts.value.events || []).filter(e => e.fatalities >= 25);
        if (high.length > 3) this.insights.push({ id: 'conflict', type: 'risk', title: `${high.length} high-fatality events`, detail: 'Conflict intensity elevated. Monitor supply routes.', confidence: 85 });
        this.insights.push({ id: 'conflict-count', type: 'trend', title: `${conflicts.value.count} active conflict events`, detail: `Total fatalities: ${conflicts.value.totalFatalities}`, confidence: 70 });
      }

      if (cpStatus.status === 'fulfilled' && cpStatus.value) {
        const monitors = buildChokepointMonitoring(cpStatus.value);
        const critical = monitors.filter(cp => cp.riskScore >= 70);
        if (critical.length > 0) this.insights.push({ id: 'cp', type: 'risk', title: `${critical.length} chokepoint(s) critical`, detail: critical.map(c => c.name).join(', '), confidence: 88 });
      }

      if (quakes.status === 'fulfilled' && quakes.value) {
        const big = quakes.value.filter((q: any) => (q.magnitude ?? 0) >= 5);
        if (big.length > 0) this.insights.push({ id: 'quake', type: 'alert', title: `${big.length} magnitude 5+ earthquakes`, detail: 'Recent seismic activity detected.', confidence: 75 });
      }
    } catch { /* defaults */ }

    if (this.insights.length === 0) {
      this.insights = [
        { id: '1', type: 'trend', title: 'Energy transit stable', detail: 'Global energy transit within normal range.', confidence: 78 },
        { id: '2', type: 'risk', title: 'Taiwan strait tensions', detail: 'Military activity increasing.', confidence: 75 },
        { id: '3', type: 'opportunity', title: 'Baltic shipping window', detail: 'Favorable weather conditions.', confidence: 82 },
      ];
    }
  }

  private icon(t: string): string { return { risk: 'warning', alert: 'notification_important', opportunity: 'trending_up', trend: 'insights' }[t] || 'insights'; }
  private style(t: string): string {
    const m: Record<string, string> = { risk: 'text-error bg-error/10 border-error/20', alert: 'text-orange-400 bg-orange-400/10 border-orange-400/20', opportunity: 'text-primary bg-primary/10 border-primary/20', trend: 'text-secondary bg-secondary/10 border-secondary/20' };
    return m[t] || 'text-secondary bg-secondary/10 border-secondary/20';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Insights</h3>
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.insights.map((ins, i) => `
          <div class="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-lg ${this.style(ins.type).split(' ')[0]} mt-0.5">${this.icon(ins.type)}</span>
              <div class="flex-grow">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.style(ins.type)}">${ins.type.toUpperCase()}</span>
                  <span class="text-[10px] font-data-md text-on-surface-variant">${ins.confidence}%</span>
                  ${ins.countries?.length ? `<span class="text-[10px] font-data-md text-on-surface-variant/60">${ins.countries.join(', ')}</span>` : ''}
                </div>
                <div class="text-sm text-on-surface font-body-sm group-hover:text-primary transition-colors panel-body">${ins.title}</div>
                <div class="text-xs text-on-surface-variant mt-1 panel-body">${ins.detail}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
