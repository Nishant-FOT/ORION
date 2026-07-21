import { fetchForecastFeed } from '@/services/forecast';
import type { Forecast as ServiceForecast } from '@/services/forecast';
import { loadAllCIIData } from '@/services/cii-data-loader';
import { fetchConflictEvents } from '@/services/conflict';
import { fetchCachedRiskScores } from '@/services/cached-risk-scores';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface PanelForecast { id: string; horizon: string; scenario: string; probability: number; impact: string; }

const DEMO_FORECASTS: PanelForecast[] = [
  { id: '1', horizon: '7 days', scenario: 'Hormuz tension escalation', probability: 35, impact: 'Oil price +$5-10' },
  { id: '2', horizon: '14 days', scenario: 'Baltic weather disruption', probability: 20, impact: 'Shipping delays' },
  { id: '3', horizon: '30 days', scenario: 'SCS military exercise', probability: 45, impact: 'Route diversions' },
  { id: '4', horizon: '7 days', scenario: 'Gaza ceasefire progress', probability: 25, impact: 'Regional de-escalation' },
];

export class ForecastPanel {
  private container: HTMLElement;
  private forecasts: PanelForecast[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'forecasts', fallback: DEMO_FORECASTS },
      async () => {
        const feed = await fetchForecastFeed();
        if (feed.forecasts?.length) {
          return feed.forecasts.slice(0, 6).map((f: ServiceForecast) => ({
            id: f.id,
            horizon: f.timeHorizon || '7 days',
            scenario: f.scenario || f.title || 'Unnamed scenario',
            probability: Math.round((f.probability ?? 0) * 100),
            impact: f.feedSummary || f.trend || 'Potential impact',
          }));
        }

        let highRisk: Array<{ code: string; name: string; score: number; trend: string }> = [];
        let activeConflicts: Array<{ fatalities: number }> = [];
        let criticalCountries: Array<{ code: string; name: string; score: number; trend: string; level: string }> = [];

        const [localScores, conflictResult] = await Promise.allSettled([
          loadAllCIIData(),
          fetchConflictEvents(),
        ]);

        if (localScores.status === 'fulfilled' && localScores.value.length > 0) {
          highRisk = localScores.value.filter(c => c.score >= 66 && c.trend === 'rising');
          criticalCountries = localScores.value.filter(c => c.level === 'critical');
        } else {
          const serverScores = await fetchCachedRiskScores();
          if (serverScores) {
            highRisk = serverScores.cii.filter(c => c.score >= 66 && c.trend === 'rising');
            criticalCountries = serverScores.cii.filter(c => c.level === 'critical');
          }
        }

        if (conflictResult.status === 'fulfilled' && conflictResult.value) {
          activeConflicts = (conflictResult.value.events || []).filter(e => e.fatalities >= 10);
        }

        const forecasts: PanelForecast[] = [];
        for (const c of highRisk.slice(0, 3)) {
          forecasts.push({
            id: `fc-${c.code}`,
            horizon: '7 days',
            scenario: `${c.name} instability escalation`,
            probability: Math.min(85, Math.round(c.score * 0.9)),
            impact: `Country risk score ${c.score} (${c.trend}). Monitor political situation.`,
          });
        }

        if (activeConflicts.length > 5) {
          forecasts.push({
            id: 'fc-conflict',
            horizon: '14 days',
            scenario: 'Elevated global conflict activity',
            probability: Math.min(70, Math.round(activeConflicts.length * 8)),
            impact: `${activeConflicts.length} high-casualty events. Supply chain risk.`,
          });
        }

        for (const c of criticalCountries.slice(0, 2)) {
          forecasts.push({
            id: `fc-crit-${c.code}`,
            horizon: '30 days',
            scenario: `${c.name} crisis deepening`,
            probability: Math.round(c.score),
            impact: `Critical instability level. Regional spillover possible.`,
          });
        }
        return forecasts.length ? forecasts : DEMO_FORECASTS;
      },
      (data) => Array.isArray(data),
    );
    this.forecasts = result.data;
    this.source = result.source;
  }

  private probColor(p: number): string { return p >= 40 ? 'text-error' : p >= 25 ? 'text-orange-400' : 'text-primary'; }
  private probBar(p: number): string {
    const color = p >= 40 ? 'bg-error' : p >= 25 ? 'bg-orange-400' : 'bg-primary';
    return `<div class="h-1 rounded-full ${color} transition-all" style="width: ${Math.min(100, p)}%"></div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Forecast</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.forecasts.map((f, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20">${f.horizon}</span>
              <span class="text-xs font-data-md ${this.probColor(f.probability)}">${f.probability}% prob</span>
            </div>
            <div class="text-sm text-on-surface font-body-sm panel-body mb-2">${f.scenario}</div>
            <div class="w-full bg-white/5 rounded-full mb-2">${this.probBar(f.probability)}</div>
            <div class="text-xs text-on-surface-variant panel-body">Impact: ${f.impact}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
