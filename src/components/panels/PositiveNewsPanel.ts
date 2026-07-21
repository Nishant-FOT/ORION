import { createCircuitBreaker } from '@/utils';
import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';
import { externalApiUrl } from '@/services/live-data-service';

interface PositiveNewsItem {
  id: string;
  title: string;
  source: string;
  category: string;
  publishedAt: string;
  summary: string;
}

const breaker = createCircuitBreaker<PositiveNewsItem[]>({
  name: 'Positive News',
  persistCache: false,
});

const POSITIVE_TERMS = ['agreement', 'deal', 'cooperation', 'partnership', 'success', 'progress', 'growth', 'surge', 'boost', 'expand', 'invest', 'launch', 'approve', 'recover', 'improve', 'innovate', 'renewable', 'clean', 'sustainable', 'peace', 'ceasefire', 'humanitarian', 'aid', 'development'];

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('trade') || t.includes('tariff') || t.includes('export') || t.includes('import')) return 'Trade';
  if (t.includes('energy') || t.includes('solar') || t.includes('wind') || t.includes('oil') || t.includes('gas')) return 'Energy';
  if (t.includes('finance') || t.includes('bank') || t.includes('currency') || t.includes('swap')) return 'Finance';
  if (t.includes('health') || t.includes('medical') || t.includes('vaccine')) return 'Health';
  return 'General';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

async function fetchFromGdelt(): Promise<PositiveNewsItem[]> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - 3 * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      query: POSITIVE_TERMS.join(' OR '),
      mode: 'artlist',
      format: 'json',
      startdatetime: start.toISOString().replace(/[-:T]/g, '').slice(0, 14),
      enddatetime: end.toISOString().replace(/[-:T]/g, '').slice(0, 14),
      maxrecords: '30',
      sort: 'DateDesc',
    });

    const resp = await fetch(externalApiUrl(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, '/api/gdelt'), {
      signal: AbortSignal.timeout(12_000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const articles = data.articles || [];
    return articles
      .filter((a: { title?: string }) => {
        if (!a.title) return false;
        const t = a.title.toLowerCase();
        const hasPositive = POSITIVE_TERMS.some(k => t.includes(k));
        const hasNegative = ['war', 'attack', 'kill', 'death', 'crisis', 'disaster', 'collapse'].some(n => t.includes(n));
        return hasPositive && !hasNegative;
      })
      .slice(0, 10)
      .map((a: { title: string; source: string; seendate: string }, i: number) => ({
        id: `pn-${i}`,
        title: a.title,
        source: a.source || 'GDELT',
        category: categorize(a.title),
        publishedAt: a.seendate ? timeAgo(a.seendate) : 'recent',
        summary: a.title,
      }));
  } catch {
    return [];
  }
}

const DEMO_ITEMS: PositiveNewsItem[] = [
  { id: 'pn-demo-1', title: 'EU and Mercosur reach historic trade agreement', source: 'Reuters', category: 'Trade', publishedAt: '2h ago', summary: 'European Union and Mercosur finalize landmark trade deal after decades of negotiations, eliminating tariffs on key exports.' },
  { id: 'pn-demo-2', title: 'Renewable energy capacity surpasses fossil fuels in Europe', source: 'Bloomberg', category: 'Energy', publishedAt: '5h ago', summary: 'Wind and solar installations now generate more electricity than coal and gas plants across the EU for the first time.' },
  { id: 'pn-demo-3', title: 'Global health initiative secures $12B in funding', source: 'Financial Times', category: 'Health', publishedAt: '1d ago', summary: 'International coalition pledges record funding for vaccine development and disease prevention in developing nations.' },
  { id: 'pn-demo-4', title: 'Japan and South Korea launch joint semiconductor partnership', source: 'Nikkei Asia', category: 'Finance', publishedAt: '1d ago', summary: 'Major chip manufacturers agree to collaborate on next-generation fabrication technology and supply chain resilience.' },
];

export class PositiveNewsPanel {
  private container: HTMLElement;
  private items: PositiveNewsItem[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'PositiveNews', fallback: DEMO_ITEMS},
      async () => {
        const raw = getHydratedData('positiveGeoEvents') as { events?: Array<{ title: string; source: string; seendate: string }> } | undefined;
        if (raw?.events?.length) {
          return raw.events
            .filter((a: { title?: string }) => {
              if (!a.title) return false;
              const t = a.title.toLowerCase();
              const hasPositive = POSITIVE_TERMS.some(k => t.includes(k));
              const hasNegative = ['war', 'attack', 'kill', 'death', 'crisis', 'disaster', 'collapse'].some(n => t.includes(n));
              return hasPositive && !hasNegative;
            })
            .slice(0, 10)
            .map((a: { title: string; source: string; seendate: string }, i: number) => ({
              id: `pn-${i}`,
              title: a.title,
              source: a.source || 'GDELT',
              category: categorize(a.title),
              publishedAt: a.seendate ? timeAgo(a.seendate) : 'recent',
              summary: a.title,
            }));
        }
        const items = await breaker.execute(fetchFromGdelt, []);
        return items.length ? items : DEMO_ITEMS;
      },
      (_items) => true,
    );
    this.items = result.data;
    this.source = result.source;
  }

  private categoryColor(c: string): string {
    const m: Record<string, string> = {
      Trade: 'bg-primary/10 text-primary',
      Energy: 'bg-orange-400/10 text-orange-400',
      Finance: 'bg-yellow-400/10 text-yellow-400',
      Health: 'bg-green-400/10 text-green-400',
    };
    return m[c] || 'bg-white/5 text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Positive News</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">thumb_up</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      ${this.items.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">thumb_up</span>
            <span class="text-xs">No positive news found</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.items.map((item, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-start mb-1.5">
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded ${this.categoryColor(item.category)}">${item.category.toUpperCase()}</span>
              <span class="text-[10px] font-data-md text-on-surface-variant">${item.publishedAt}</span>
            </div>
            <div class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors mb-1">${item.title}</div>
            <p class="text-[10px] text-on-surface-variant font-body-sm leading-relaxed mb-1.5">${item.summary}</p>
            <div class="text-[9px] font-label-caps text-on-surface-variant/60">${item.source}</div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
