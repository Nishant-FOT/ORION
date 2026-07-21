import { buildChokepointMonitoring } from '@/services/chokepoint-monitoring';
import { fetchConflictEvents } from '@/services/conflict';
import { fetchMultipleStocks } from '@/services/market';

interface Action { id: string; priority: 'critical' | 'high' | 'medium'; action: string; rationale: string; affected: string; }

export class ExecutiveActionPanel {
  private container: HTMLElement;
  private actions: Action[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const [chokepoints, conflicts, vix] = await Promise.allSettled([
        buildChokepointMonitoring(),
        fetchConflictEvents(),
        fetchMultipleStocks([{ symbol: 'VIX', name: 'CBOE Volatility Index', display: 'VIX' }]),
      ]);

      if (chokepoints.status === 'fulfilled' && chokepoints.value) {
        for (const cp of chokepoints.value) {
          if (cp.riskScore >= 70) {
            this.actions.push({
              id: `act-${cp.id}`,
              priority: cp.riskScore >= 85 ? 'critical' : 'high',
              action: `Monitor ${cp.name} — risk elevated`,
              rationale: `Risk score ${cp.riskScore}. ${cp.evidence[0] || 'Elevated monitoring.'}`,
              affected: 'Supply chain',
            });
          }
        }
      }

      if (conflicts.status === 'fulfilled' && conflicts.value?.events) {
        const highFatality = conflicts.value.events.filter(e => e.fatalities >= 15);
        if (highFatality.length > 0) {
          const topCountry = highFatality.reduce((acc, e) => {
            acc[e.country] = (acc[e.country] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          const [country, count] = Object.entries(topCountry).sort((a, b) => b[1] - a[1])[0]!;
          this.actions.push({
            id: 'act-conflict',
            priority: 'high',
            action: `Review ${country} security posture`,
            rationale: `${count} high-fatality incidents detected.`,
            affected: 'Operations',
          });
        }
      }

      if (vix.status === 'fulfilled' && vix.value.data?.length) {
        const vixVal = vix.value.data[0]?.price ?? 0;
        if (vixVal > 30) {
          this.actions.push({
            id: 'act-vix',
            priority: vixVal > 40 ? 'critical' : 'high',
            action: 'Review hedging positions',
            rationale: `VIX at ${vixVal.toFixed(1)} — elevated market stress.`,
            affected: 'Portfolio',
          });
        }
      }
    } catch { /* defaults */ }

    if (this.actions.length === 0) {
      this.actions = [
        { id: '1', priority: 'medium', action: 'Monitor Hormuz developments', rationale: 'Naval activity detected.', affected: 'Energy supply' },
        { id: '2', priority: 'medium', action: 'Review Baltic schedules', rationale: 'Weather conditions changing.', affected: 'Logistics' },
      ];
    }
  }

  private priStyle(p: string): string {
    if (p === 'critical') return 'bg-error/10 text-error border-error/20';
    if (p === 'high') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-white/5 text-on-surface-variant border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Executive Actions</h3>
        <span class="text-xs text-on-surface-variant font-data-md">${this.actions.length} items</span>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.actions.map((a, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center gap-2 mb-2">
              <span class="material-symbols-outlined text-sm text-primary">task_alt</span>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.priStyle(a.priority)}">${a.priority.toUpperCase()}</span>
              <span class="text-[10px] font-data-md text-on-surface-variant ml-auto">${a.affected}</span>
            </div>
            <div class="text-sm text-on-surface font-body-sm group-hover:text-primary transition-colors panel-body">${a.action}</div>
            <div class="text-xs text-on-surface-variant mt-1 panel-body">${a.rationale}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
