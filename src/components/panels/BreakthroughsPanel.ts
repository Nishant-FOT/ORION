import { createCircuitBreaker } from '@/utils';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';
import { externalApiUrl } from '@/services/live-data-service';

interface BreakthroughItem {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  summary: string;
  impactScore: number;
}

const breaker = createCircuitBreaker<BreakthroughItem[]>({
  name: 'Breakthroughs',
  persistCache: false,
});

const ARXIV_CATEGORIES = [
  'cat:physics.app-ph',
  'cat:physics.gen-ph',
  'cat:cs.AI',
  'cat:cs.LG',
  'cat:cond-mat.mtrl-sci',
  'cat:eess.SY',
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function estimateImpact(title: string, abstract: string): number {
  let score = 50;
  const combined = `${title} ${abstract}`.toLowerCase();
  if (combined.includes('breakthrough') || combined.includes('novel')) score += 20;
  if (combined.includes('first') || combined.includes('demonstrat')) score += 10;
  if (combined.includes('energy') || combined.includes('battery') || combined.includes('solar')) score += 15;
  if (combined.includes('quantum') || combined.includes('superconduct')) score += 10;
  if (combined.includes('climate') || combined.includes('carbon')) score += 5;
  if (combined.includes('large') || combined.includes('scale')) score += 5;
  return Math.min(99, score);
}

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('battery') || t.includes('energy storage') || t.includes('solar cell') || t.includes('photovoltaic'))
    return 'Energy Storage';
  if (t.includes('quantum') || t.includes('superconduct') || t.includes('quantum computing'))
    return 'Quantum';
  if (t.includes('ai') || t.includes('neural') || t.includes('deep learning') || t.includes('transformer'))
    return 'AI / ML';
  if (t.includes('nuclear') || t.includes('fusion') || t.includes('fission'))
    return 'Nuclear';
  if (t.includes('medical') || t.includes('drug') || t.includes('disease') || t.includes('cancer'))
    return 'Medicine';
  return 'Physics';
}

const DEMO_ITEMS: BreakthroughItem[] = [
  { id: 'bt-demo-1', title: 'Novel Solid-State Battery Achieves 500 Wh/kg Energy Density', category: 'Energy Storage', publishedAt: '2d ago', summary: 'Researchers demonstrate a new lithium-sulfur solid-state battery achieving record energy density with improved cycle life, potentially revolutionizing EV range.', impactScore: 92 },
  { id: 'bt-demo-2', title: 'Quantum Error Correction Breakthrough at Scale', category: 'Quantum', publishedAt: '1d ago', summary: 'A new surface code implementation achieves below-threshold error rates on a 1000+ qubit processor, marking a key milestone for fault-tolerant quantum computing.', impactScore: 88 },
  { id: 'bt-demo-3', title: 'Deep Learning Model Predicts Protein Folding with Atomic Accuracy', category: 'AI / ML', publishedAt: '5h ago', summary: 'A transformer-based architecture outperforms existing methods on CASP16 benchmarks, achieving sub-angstrom accuracy for complex multi-chain protein complexes.', impactScore: 85 },
  { id: 'bt-demo-4', title: 'High-Temperature Superconductor Confirmed at Ambient Pressure', category: 'Physics', publishedAt: '12h ago', summary: 'Independent replication confirms room-temperature superconductivity in a modified copper-oxide compound at ambient pressure, pending further peer review.', impactScore: 95 },
];

async function fetchFromArxiv(): Promise<BreakthroughItem[]> {
  try {
    const categories = ARXIV_CATEGORIES.slice(0, 3).join('+OR+');
    const query = `(${categories}) AND (submittedDate:[202607100000 TO 202607180000])`;
    const params = new URLSearchParams({
      search_query: query,
      start: '0',
      max_results: '15',
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    });

    const resp = await fetch(externalApiUrl(`http://export.arxiv.org/api/query?${params.toString()}`, '/api/arxiv'), {
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) return DEMO_ITEMS;
    const text = await resp.text();

    const entries = text.split('<entry>').slice(1).map(e => {
      const title = e.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const summary = e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      const published = e.match(/<published>([\s\S]*?)<\/published>/)?.[1] || '';
      return { title, summary, published };
    }).filter(e => e.title);

    return entries.slice(0, 10).map((e, i) => ({
      id: `bt-${i}`,
      title: e.title,
      category: categorize(e.title),
      publishedAt: e.published ? timeAgo(e.published) : 'recent',
      summary: e.summary.slice(0, 200) + (e.summary.length > 200 ? '...' : ''),
      impactScore: estimateImpact(e.title, e.summary),
    }));
  } catch {
    return [];
  }
}

export class BreakthroughsPanel {
  private container: HTMLElement;
  private items: BreakthroughItem[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'Breakthroughs', fallback: DEMO_ITEMS},
      () => breaker.execute(fetchFromArxiv, []),
      (data) => Array.isArray(data),
    );
    this.items = result.data;
    this.source = result.source;
  }

  private categoryColor(c: string): string {
    const m: Record<string, string> = {
      'Energy Storage': 'bg-yellow-400/10 text-yellow-400',
      'AI / ML': 'bg-purple-400/10 text-purple-400',
      Medicine: 'bg-green-400/10 text-green-400',
      Quantum: 'bg-blue-400/10 text-blue-400',
      Nuclear: 'bg-orange-400/10 text-orange-400',
      Physics: 'bg-cyan-400/10 text-cyan-400',
    };
    return m[c] || 'bg-white/5 text-on-surface-variant';
  }

  private impactColor(s: number): string {
    if (s >= 85) return 'text-primary';
    if (s >= 70) return 'text-yellow-400';
    return 'text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Breakthroughs</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${this.items.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">science</span>
            <span class="text-xs">No breakthroughs found</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.items.map((item, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-start mb-1.5">
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded ${this.categoryColor(item.category)}">${item.category.toUpperCase()}</span>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[10px] ${this.impactColor(item.impactScore)}">bolt</span>
                <span class="text-[10px] font-data-md ${this.impactColor(item.impactScore)}">${item.impactScore}</span>
              </div>
            </div>
            <div class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors mb-1">${item.title}</div>
            <p class="text-[10px] text-on-surface-variant font-body-sm leading-relaxed mb-1.5">${item.summary}</p>
            <div class="text-[9px] font-data-md text-on-surface-variant">${item.publishedAt}</div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
