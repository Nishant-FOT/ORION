import { loadAllCIIData } from '@/services/cii-data-loader';
import { fetchConflictEvents } from '@/services/conflict';
import { fetchCachedRiskScores } from '@/services/cached-risk-scores';

interface RiskItem { id: string; country: string; score: number; trend: string; level: string; change24h: number; factors: string[]; }

export class GeopoliticalRiskPanel {
  private container: HTMLElement;
  private risks: RiskItem[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const [localScores, conflicts] = await Promise.allSettled([
        loadAllCIIData(),
        fetchConflictEvents(),
      ]);

      if (localScores.status === 'fulfilled' && localScores.value.length > 0) {
        const sorted = localScores.value.sort((a, b) => b.score - a.score).slice(0, 10);
        const eventCounts = new Map<string, { count: number; fatalities: number }>();
        if (conflicts.status === 'fulfilled' && conflicts.value?.events) {
          for (const e of conflicts.value.events) {
            const c = e.country || 'Unknown';
            const prev = eventCounts.get(c) || { count: 0, fatalities: 0 };
            eventCounts.set(c, { count: prev.count + 1, fatalities: prev.fatalities + e.fatalities });
          }
        }
        this.risks = sorted.map(c => {
          const ev = eventCounts.get(c.code);
          const factors: string[] = [];
          if (c.trend === 'rising') factors.push('Rising trend');
          if (ev && ev.count > 0) factors.push(`${ev.count} events`);
          if (ev && ev.fatalities > 0) factors.push(`${ev.fatalities} fatalities`);
          if (c.components.conflict > 30) factors.push('Conflict pressure');
          if (c.components.security > 30) factors.push('Security alert');
          if (c.components.information > 30) factors.push('Info disruption');
          if (c.components.unrest > 30) factors.push('Civil unrest');
          return { id: `risk-${c.code}`, country: c.name, score: c.score, trend: c.trend, level: c.level, change24h: c.change24h, factors };
        });
        return;
      }

      const serverScores = await fetchCachedRiskScores();
      if (serverScores?.cii?.length) {
        const sorted = [...serverScores.cii].sort((a, b) => b.score - a.score).slice(0, 10);
        const eventCounts = new Map<string, { count: number; fatalities: number }>();
        if (conflicts.status === 'fulfilled' && conflicts.value?.events) {
          for (const e of conflicts.value.events) {
            const c = e.country || 'Unknown';
            const prev = eventCounts.get(c) || { count: 0, fatalities: 0 };
            eventCounts.set(c, { count: prev.count + 1, fatalities: prev.fatalities + e.fatalities });
          }
        }
        this.risks = sorted.map(c => {
          const ev = eventCounts.get(c.code);
          const factors: string[] = [];
          if (c.trend === 'rising') factors.push('Rising trend');
          if (ev && ev.count > 0) factors.push(`${ev.count} events`);
          if (ev && ev.fatalities > 0) factors.push(`${ev.fatalities} fatalities`);
          if (c.components.conflict > 30) factors.push('Conflict pressure');
          if (c.components.security > 30) factors.push('Security alert');
          return { id: `risk-${c.code}`, country: c.name, score: c.score, trend: c.trend, level: c.level, change24h: c.change24h, factors };
        });
      }
    } catch { /* defaults */ }

    if (this.risks.length === 0) {
      this.risks = [
        { id: '1', country: 'Iran', score: 82, trend: 'rising', level: 'critical', change24h: 5, factors: ['Hormuz tensions', 'Gaza conflict'] },
        { id: '2', country: 'China', score: 71, trend: 'rising', level: 'high', change24h: 3, factors: ['Taiwan strait', 'SCS disputes'] },
        { id: '3', country: 'Russia', score: 65, trend: 'stable', level: 'high', change24h: -1, factors: ['Ukraine conflict', 'Baltic NATO'] },
        { id: '4', country: 'Myanmar', score: 45, trend: 'rising', level: 'elevated', change24h: 8, factors: ['Civil unrest'] },
      ];
    }
  }

  private barColor(s: number): string { return s >= 80 ? 'bg-error' : s >= 65 ? 'bg-orange-400' : s >= 50 ? 'bg-yellow-400' : 'bg-primary'; }
  private scoreColor(s: number): string { return s >= 80 ? 'text-error' : s >= 65 ? 'text-orange-400' : s >= 50 ? 'text-yellow-400' : 'text-primary'; }
  private trendArrow(t: string): string { return t === 'rising' ? '↑' : t === 'falling' ? '↓' : '→'; }
  private trendColor(t: string): string { return t === 'rising' ? 'text-error' : t === 'falling' ? 'text-green-400' : 'text-on-surface-variant'; }
  private levelBadge(l: string): string {
    const m: Record<string, string> = { critical: 'bg-error/15 text-error border-error/20', high: 'bg-orange-400/15 text-orange-400 border-orange-400/20', elevated: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', normal: 'bg-white/5 text-on-surface-variant border-white/10', low: 'bg-white/5 text-on-surface-variant border-white/10' };
    return m[l] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Geopolitical Risk</h3>
        <span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.risks.map((r, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-on-surface font-body-sm panel-body">${r.country}</span>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.levelBadge(r.level)}">${r.level.toUpperCase()}</span>
                <span class="text-sm font-data-md ${this.scoreColor(r.score)} panel-stat">${r.score}</span>
                <span class="text-[10px] font-data-md ${this.trendColor(r.trend)}">${this.trendArrow(r.trend)}</span>
              </div>
            </div>
            <div class="w-full h-1.5 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.barColor(r.score)} rounded-full transition-all duration-1000" style="width: ${r.score}%"></div>
            </div>
            <div class="flex flex-wrap gap-1">
              ${r.factors.map(f => `<span class="text-[9px] font-data-md px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant">${f}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
