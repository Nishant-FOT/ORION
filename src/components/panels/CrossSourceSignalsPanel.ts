import { loadAllCIIData } from '@/services/cii-data-loader';
import { fetchConflictEvents } from '@/services/conflict';
import { fetchCategoryFeeds } from '@/services/rss';
import { FEEDS } from '@/config/feeds';

interface Signal { id: string; type: string; title: string; confidence: number; sources: string[]; }

export class CrossSourceSignalsPanel {
  private container: HTMLElement;
  private signals: Signal[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const [localScores, conflicts, newsItems] = await Promise.allSettled([
        loadAllCIIData(),
        fetchConflictEvents(),
        fetchCategoryFeeds(FEEDS['live-news'] || []),
      ]);

      let riskMap = new Map<string, { score: number; level: string; trend: string }>();
      if (localScores.status === 'fulfilled' && localScores.value.length > 0) {
        for (const c of localScores.value) {
          riskMap.set(c.code, { score: c.score, level: c.level, trend: c.trend });
        }
      }

      const regionConflicts = new Map<string, string[]>();
      if (conflicts.status === 'fulfilled' && conflicts.value?.events) {
        for (const e of conflicts.value.events) {
          const r = e.country || 'Unknown';
          if (!regionConflicts.has(r)) regionConflicts.set(r, []);
          regionConflicts.get(r)!.push(e.source || 'Conflict data');
        }
      }

      const newsByRegion = new Map<string, string[]>();
      if (newsItems.status === 'fulfilled' && newsItems.value) {
        for (const item of newsItems.value) {
          const title = item.title.toLowerCase();
          for (const [region] of regionConflicts) {
            if (title.includes(region.toLowerCase())) {
              if (!newsByRegion.has(region)) newsByRegion.set(region, []);
              newsByRegion.get(region)!.push(item.source);
            }
          }
        }
      }

      for (const [region, conflictSources] of regionConflicts) {
        if (conflictSources.length < 2) continue;
        const risk = riskMap.get(region);
        const newsSources = newsByRegion.get(region) || [];
        const allSources = [...new Set([...conflictSources, ...newsSources])];
        if (allSources.length >= 2) {
          const confidence = Math.min(95, 55 + conflictSources.length * 5 + (risk?.score || 0) * 0.2 + newsSources.length * 3);
          this.signals.push({
            id: `cs-${region}`,
            type: 'Convergence',
            title: `Multi-source: ${region} activity`,
            confidence: Math.round(confidence),
            sources: allSources.slice(0, 5),
          });
        }
      }

      if (localScores.status === 'fulfilled' && localScores.value.length > 0) {
        const rising = localScores.value.filter(c => c.trend === 'rising' && c.score >= 50);
        if (rising.length > 0) {
          this.signals.push({
            id: 'cs-trend',
            type: 'Velocity',
            title: `${rising.length} countries with rising risk above threshold`,
            confidence: 78,
            sources: rising.map(c => c.name).slice(0, 4),
          });
        }
      }
    } catch { /* Render the real empty state below rather than fabricated signals. */ }
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Cross-Source Signals</h3>
        <span class="text-xs text-on-surface-variant font-data-md">${this.signals.length} detected</span>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.signals.length === 0 ? `
          <div class="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-on-surface-variant">
            No converged live signals are currently available.
          </div>
        ` : this.signals.map((s, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${s.type}</span>
              <span class="text-xs font-data-md ${s.confidence >= 80 ? 'text-primary' : 'text-secondary'} panel-stat">${s.confidence}%</span>
            </div>
            <div class="text-sm text-on-surface group-hover:text-primary transition-colors panel-body">${s.title}</div>
            <div class="flex flex-wrap gap-1 mt-2">
              ${s.sources.map(src => `<span class="text-[9px] font-data-md px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant">${src}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
