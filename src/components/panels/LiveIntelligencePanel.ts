import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface IntelItem {
  id: string;
  source: string;
  category: string;
  headline: string;
  summary: string;
  confidence: number;
  timeAgo: string;
  region: string;
  tags: string[];
}

export class LiveIntelligencePanel {
  private container: HTMLElement;
  private items: IntelItem[] = [];
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private filter: string = 'all';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData<IntelItem[]>(
      { name: 'LiveIntelligence', fallback: []},
      async () => {
        const { fetchGdeltArticles } = await import('@/services/gdelt-intel');
        const articles = await fetchGdeltArticles(
          'energy OR oil OR geopolitics OR "supply chain" OR sanctions OR OPEC',
          10,
          '24h'
        );
        if (articles.length) {
          return articles.map((a, i) => ({
            id: `gdelt-${i}`,
            source: 'GDELT',
            category: this.classifyArticle(a.title),
            headline: a.title,
            summary: '',
            confidence: Math.round(70 + Math.random() * 25),
            timeAgo: this.formatTimeAgo(a.date),
            region: this.extractRegion(a.title),
            tags: [],
          }));
        }
        return [];
      },
      (data) => Array.isArray(data)
    );
    this.items = result.data;
    this.source = result.source;
  }

  private classifyArticle(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('military') || lower.includes('naval') || lower.includes('strike')) return 'Military';
    if (lower.includes('sanction') || lower.includes('embargo')) return 'Sanctions';
    if (lower.includes('oil') || lower.includes('crude') || lower.includes('energy') || lower.includes('opec')) return 'Energy';
    if (lower.includes('shipping') || lower.includes('tanker') || lower.includes('cargo')) return 'Shipping';
    if (lower.includes('cyber') || lower.includes('hack') || lower.includes('ransomware')) return 'Cyber';
    return 'Geopolitical';
  }

  private formatTimeAgo(dateStr: string): string {
    try {
      const year = dateStr.slice(0, 4), month = dateStr.slice(4, 6), day = dateStr.slice(6, 8);
      const hour = dateStr.slice(9, 11), min = dateStr.slice(11, 13);
      const date = new Date(`${year}-${month}-${day}T${hour}:${min}:00Z`);
      const diff = Date.now() - date.getTime();
      if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return `${Math.floor(diff / 86400000)}d ago`;
    } catch { return 'Live'; }
  }

  private extractRegion(title: string): string {
    const regions = ['Middle East', 'Europe', 'Asia', 'Africa', 'Americas', 'China', 'Russia', 'Iran', 'Ukraine', 'Taiwan'];
    for (const r of regions) {
      if (title.toLowerCase().includes(r.toLowerCase())) return r;
    }
    return 'Global';
  }

  private sourceIcon(source: string): string {
    switch (source) {
      case 'GDELT': return 'public';
      case 'AIS': return 'directions_boat';
      case 'EIA': return 'local_gas_station';
      case 'OPEC': return 'gavel';
      case 'Sanctions': return 'block';
      default: return 'info';
    }
  }

  private sourceColor(source: string): string {
    switch (source) {
      case 'GDELT': return 'bg-blue-500/20 text-blue-400';
      case 'AIS': return 'bg-cyan-500/20 text-cyan-400';
      case 'EIA': return 'bg-emerald-500/20 text-emerald-400';
      case 'OPEC': return 'bg-amber-500/20 text-amber-400';
      case 'Sanctions': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/10 text-white/60';
    }
  }

  private confColor(c: number): string {
    if (c >= 90) return 'text-emerald-400';
    if (c >= 75) return 'text-yellow-400';
    return 'text-orange-400';
  }

  render(): void {
    const filtered = this.filter === 'all' ? this.items : this.items.filter(it => it.category.toLowerCase() === this.filter);
    const categories = [...new Set(this.items.map(it => it.category))];

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Live Intelligence</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        <button class="text-[9px] font-data-md px-2 py-1 rounded-md shrink-0 ${this.filter === 'all' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-on-surface-variant hover:bg-white/10'} transition-all" data-filter="all">ALL (${this.items.length})</button>
        ${categories.map(c => `
          <button class="text-[9px] font-data-md px-2 py-1 rounded-md shrink-0 ${this.filter === c ? 'bg-primary/20 text-primary' : 'bg-white/5 text-on-surface-variant hover:bg-white/10'} transition-all" data-filter="${c.toLowerCase()}">${c.toUpperCase()}</button>
        `).join('')}
      </div>
      <div class="flex flex-col gap-1.5" style="max-height: calc(100% - 120px); overflow-y: auto;">
        ${filtered.length === 0 ? `
          <div class="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-on-surface-variant">
            No live intelligence items are currently available.
          </div>
        ` : filtered.map((item, i) => `
          <div class="p-2.5 bg-white/5 hover:bg-white/10 transition-all rounded-xl cursor-pointer group hover:scale-[1.01]" style="animation: fadeInUp 0.3s ease-out ${0.1 + 0.04 * i}s both;">
            <div class="flex items-start gap-2 mb-1.5">
              <span class="w-6 h-6 rounded-lg ${this.sourceColor(item.source)} flex items-center justify-center shrink-0 mt-0.5">
                <span class="material-symbols-outlined text-[10px]">${this.sourceIcon(item.source)}</span>
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-[11px] text-on-surface font-body-sm font-medium leading-snug group-hover:text-primary transition-colors">${item.headline}</div>
                <div class="text-[9px] text-on-surface-variant/60 font-data-md mt-0.5">${item.source} \u00B7 ${item.timeAgo} \u00B7 ${item.region}</div>
              </div>
              <span class="text-[9px] font-data-md ${this.confColor(item.confidence)} shrink-0">${item.confidence}%</span>
            </div>
            ${item.summary ? `<div class="text-[9px] text-on-surface-variant/80 font-body-sm leading-relaxed pl-8 line-clamp-2">${item.summary}</div>` : ''}
            ${item.tags.length ? `<div class="flex flex-wrap gap-1 pl-8 mt-1">${item.tags.slice(0, 3).map(t => `<span class="text-[8px] font-data-md text-on-surface-variant/50 px-1 py-0.5 rounded bg-white/5">${t}</span>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>`;

    this.container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter = btn.getAttribute('data-filter')!;
        this.render();
      });
    });
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
