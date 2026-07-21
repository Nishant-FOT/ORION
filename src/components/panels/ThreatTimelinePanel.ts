import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface DayBucket { date: string; events: Array<{ id: string; event: string; fatalities: number; region: string; type: string }>; critical: number; high: number; }

interface ConflictEvent { time: Date | string; id?: string; eventType: string; country: string; fatalities: number; }

const DEMO_EVENTS: ConflictEvent[] = [
  { id: 'evt-001', time: new Date(Date.now() - 86400000), eventType: 'battle', country: 'Sudan', fatalities: 32 },
  { id: 'evt-002', time: new Date(Date.now() - 86400000 * 2), eventType: 'explosion', country: 'Syria', fatalities: 15 },
  { id: 'evt-003', time: new Date(Date.now() - 86400000 * 2), eventType: 'violence_against_civilians', country: 'Myanmar', fatalities: 8 },
  { id: 'evt-004', time: new Date(Date.now() - 86400000 * 3), eventType: 'battle', country: 'Yemen', fatalities: 45 },
  { id: 'evt-005', time: new Date(Date.now() - 86400000 * 4), eventType: 'remote_violence', country: 'Somalia', fatalities: 5 },
  { id: 'evt-006', time: new Date(Date.now() - 86400000 * 5), eventType: 'battle', country: 'Ukraine', fatalities: 18 },
];

export class ThreatTimelinePanel {
  private container: HTMLElement;
  private buckets: DayBucket[] = [];
  private totalCritical = 0;
  private totalHigh = 0;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchLiveData();
    this.render();
  }

  private async fetchLiveData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'conflict-events', fallback: DEMO_EVENTS},
      async () => {
        const { fetchConflictEvents } = await import('@/services/conflict');
        const data = await fetchConflictEvents();
        if (!data.events.length) return DEMO_EVENTS;
        return data.events;
      },
      (data) => Array.isArray(data),
    );
    this.processEvents(result.data);
    this.source = result.source;
  }

  private processEvents(events: Array<{ time: Date | string; id?: string; eventType: string; country: string; fatalities: number }>): void {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent = events.filter(e => {
      const t = e.time instanceof Date ? e.time : new Date(e.time);
      return t >= sevenDaysAgo;
    });

    const dayMap = new Map<string, DayBucket>();
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      dayMap.set(key, { date: key, events: [], critical: 0, high: 0 });
    }

    this.totalCritical = 0;
    this.totalHigh = 0;

    for (const e of recent) {
      const t = e.time instanceof Date ? e.time : new Date(e.time);
      const key = t.toISOString().slice(0, 10);
      if (!dayMap.has(key)) continue;
      const bucket = dayMap.get(key)!;
      bucket.events.push({
        id: e.id || `tl-${bucket.events.length}`,
        event: `${e.eventType.replace(/_/g, ' ')} — ${e.country}`,
        fatalities: e.fatalities || 0,
        region: e.country || 'Unknown',
        type: e.eventType,
      });
      if (e.fatalities >= 25) { bucket.critical++; this.totalCritical++; }
      else if (e.fatalities >= 10) { bucket.high++; this.totalHigh++; }
    }

    this.buckets = [...dayMap.values()].filter(b => b.events.length > 0);
  }

  private dotColor(type: string): string {
    const m: Record<string, string> = { battle: 'bg-error', explosion: 'bg-orange-400', remote_violence: 'bg-secondary', violence_against_civilians: 'bg-error' };
    return m[type] || 'bg-white/30';
  }

  private severityBar(evs: Array<{ fatalities: number }>): string {
    const total = evs.length;
    const crit = evs.filter(e => e.fatalities >= 25).length;
    const high = evs.filter(e => e.fatalities >= 10 && e.fatalities < 25).length;
    const critPct = total > 0 ? (crit / total) * 100 : 0;
    const highPct = total > 0 ? (high / total) * 100 : 0;
    return `<div class="flex gap-px h-1 rounded-full overflow-hidden">
      ${critPct > 0 ? `<div class="bg-error" style="width:${critPct}%"></div>` : ''}
      ${highPct > 0 ? `<div class="bg-orange-400" style="width:${highPct}%"></div>` : ''}
      <div class="bg-white/10" style="width:${100 - critPct - highPct}%"></div>
    </div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Threat Timeline</h3>
        <div class="flex items-center gap-3">
          ${this.totalCritical > 0 ? `<span class="text-[10px] font-data-md text-error">${this.totalCritical} critical</span>` : ''}
          ${this.totalHigh > 0 ? `<span class="text-[10px] font-data-md text-orange-400">${this.totalHigh} high</span>` : ''}
          ${renderDataBadge(this.source)}
        </div>
      </div>
      ${this.buckets.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">timeline</span>
            <span class="text-xs">No recent threat events</span>
          </div>`
        : `<div class="flex flex-col panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.buckets.map((b, bi) => `
          <div style="animation: fadeInUp 0.4s ease-out ${0.06 * bi}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-data-md text-on-surface-variant">${b.date}</span>
              <span class="text-[9px] font-data-md text-on-surface-variant">${b.events.length} events</span>
            </div>
            ${this.severityBar(b.events)}
            <div class="ml-3 mt-1 mb-3">
              ${b.events.map((e, i) => `
                <div class="flex items-start gap-3">
                  <div class="flex flex-col items-center">
                    <div class="w-2.5 h-2.5 rounded-full ${this.dotColor(e.type)} flex-shrink-0 ring-2 ring-surface"></div>
                    ${i < b.events.length - 1 ? '<div class="w-px h-6 bg-white/10"></div>' : ''}
                  </div>
                  <div class="pb-2 flex-grow">
                    <div class="text-xs text-on-surface cursor-pointer hover:text-primary transition-colors panel-body">${e.event}</div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[9px] font-data-md text-on-surface-variant">${e.region}</span>
                      ${e.fatalities > 0 ? `<span class="text-[9px] font-data-md text-error">${e.fatalities} fatalities</span>` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
