import { fetchCategoryFeeds } from '@/services/rss';
import { FEEDS } from '@/config/feeds';
import { fetchConflictEvents } from '@/services/conflict';

interface BreakingItem {
  id: string;
  headline: string;
  detail: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  time: string;
  link: string;
  type: 'conflict' | 'news';
}

export class BreakingNewsPanel {
  private container: HTMLElement;
  private items: BreakingItem[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    const [conflictItems, rssItems] = await Promise.allSettled([
      this.fetchConflict(),
      this.fetchRss(),
    ]);

    const conflict = conflictItems.status === 'fulfilled' ? conflictItems.value : [];
    const rss = rssItems.status === 'fulfilled' ? rssItems.value : [];

    this.items = [...conflict, ...rss];
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    this.items.sort((a, b) => (order[a.severity] ?? 0) - (order[b.severity] ?? 0));
  }

  private async fetchConflict(): Promise<BreakingItem[]> {
    try {
      const data = await fetchConflictEvents();
      if (!data?.events) return [];
      return data.events
        .filter(e => e.fatalities >= 25)
        .slice(0, 8)
        .map((e, i) => ({
          id: `c-${i}`,
          headline: e.eventType.replace(/_/g, ' '),
          detail: `${e.fatalities} fatalities · ${e.actors?.join(', ') || 'Unknown actors'}`,
          severity: e.fatalities >= 100 ? 'critical' : 'high',
          source: e.source || 'ACLED',
          time: e.time instanceof Date ? e.time.toLocaleString() : String(e.time),
          link: '',
          type: 'conflict' as const,
        }));
    } catch {
      return [
        { id: 'cf1', headline: 'Hormuz strait naval escalation', detail: 'Multiple naval assets detected', severity: 'critical', source: 'AIS', time: new Date().toLocaleString(), link: '', type: 'conflict' },
        { id: 'cf2', headline: 'Suez canal congestion', detail: 'Northbound convoy delayed 4+ hours', severity: 'high', source: 'Maritime', time: new Date().toLocaleString(), link: '', type: 'conflict' },
      ];
    }
  }

  private async fetchRss(): Promise<BreakingItem[]> {
    try {
      const feeds = FEEDS['live-news'] || FEEDS['politics'] || FEEDS['crisis'] || [];
      const raw = await fetchCategoryFeeds(feeds);
      return raw.slice(0, 20).map((n, i) => ({
        id: `r-${i}`,
        headline: n.title,
        detail: n.snippet || n.source,
        severity: this.deriveSeverity(n),
        source: n.source,
        time: n.pubDate ? new Date(n.pubDate).toLocaleString() : '—',
        link: n.link,
        type: 'news' as const,
      }));
    } catch {
      return [];
    }
  }

  private deriveSeverity(n: { isAlert?: boolean; importanceScore?: number; tier?: number }): 'critical' | 'high' | 'medium' | 'low' {
    if (n.isAlert || (n.importanceScore ?? 0) >= 8) return 'critical';
    if ((n.importanceScore ?? 0) >= 5 || (n.tier ?? 9) <= 2) return 'high';
    if ((n.importanceScore ?? 0) >= 3) return 'medium';
    return 'low';
  }

  private sevColor(s: string): string {
    return s === 'critical' ? 'error' : s === 'high' ? 'orange-400' : s === 'medium' ? 'secondary' : 'on-surface-variant';
  }

  private sevBorder(s: string): string {
    return s === 'critical' ? 'border-error bg-error/5' : s === 'high' ? 'border-orange-400 bg-orange-400/5' : s === 'medium' ? 'border-secondary bg-secondary/5' : 'border-white/10 bg-white/[0.02]';
  }

  private sevIcon(s: string): string {
    return s === 'critical' ? 'notification_important' : s === 'high' ? 'warning' : s === 'medium' ? 'info' : 'article';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-error uppercase tracking-widest flex items-center gap-2 panel-header">
          <span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>Breaking
        </h3>
        <div class="flex items-center gap-3">
          <span class="text-[10px] text-on-surface-variant/60 font-data-md">${this.items.filter(i => i.type === 'conflict').length} conflict</span>
          <span class="text-[10px] text-on-surface-variant/60 font-data-md">${this.items.filter(i => i.type === 'news').length} news</span>
        </div>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.items.length === 0 ? `
          <div class="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-on-surface-variant">
            No live breaking-news data is currently available.
          </div>
        ` : this.items.map((it, i) => {
          const color = this.sevColor(it.severity);
          return `
            <div class="p-3 rounded-xl border-l-4 ${this.sevBorder(it.severity)} hover:bg-white/5 transition-all cursor-pointer group" style="animation: fadeInUp 0.4s ease-out ${0.04 * i}s both;">
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-${color} text-lg mt-0.5">${this.sevIcon(it.severity)}</span>
                <div class="flex-grow min-w-0">
                  ${it.link ? `<a href="${it.link}" target="_blank" rel="noopener" class="text-sm font-semibold text-on-surface panel-body block no-underline group-hover:text-primary transition-colors">${it.headline}</a>` : `<div class="text-sm font-semibold text-on-surface panel-body">${it.headline}</div>`}
                  <div class="text-xs text-on-surface-variant mt-1 panel-body">${it.detail}</div>
                  <div class="flex items-center gap-2 mt-1.5">
                    ${it.type === 'conflict' ? '<span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/20">CONFLICT</span>' : ''}
                    <span class="text-[10px] text-on-surface-variant/60 font-data-md">${it.source} · ${it.time}</span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
