import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface DigestItem {
  id: string;
  title: string;
  source: string;
  category: string;
  publishedAt: string;
  summary: string;
  sentiment: 'uplifting' | 'inspiring' | 'hopeful';
}

const DEMO_ITEMS: DigestItem[] = [
  { id: 'demo-1', title: 'Coral Reef Restoration Project Shows Record Growth', source: 'Nature Today', category: 'Environment', publishedAt: '2h ago', summary: 'A major coral reef restoration project in the Great Barrier Reef has achieved a 40% increase in coral coverage over the past year.', sentiment: 'hopeful' },
  { id: 'demo-2', title: 'Solar Energy Breakthrough Could Double Panel Efficiency', source: 'Tech Daily', category: 'Clean Energy', publishedAt: '4h ago', summary: 'Researchers have developed a new perovskite-silicon tandem solar cell that achieves record-breaking 47% efficiency.', sentiment: 'inspiring' },
  { id: 'demo-3', title: 'Global Literacy Rate Reaches All-Time High', source: 'UNESCO', category: 'Education', publishedAt: '6h ago', summary: 'The global adult literacy rate has reached 88%, with significant gains in Sub-Saharan Africa and South Asia.', sentiment: 'uplifting' },
];

const POSITIVE_KEYWORDS = [' breakthrough', ' recovery', ' success', ' progress', ' improve', ' growth', ' protect', ' restore', ' achieve', ' celebrate', ' help', ' donate', ' fund', ' invest', ' develop', ' advance', '创新', ' recover', ' sustainable', ' renewable', ' clean', ' heal', ' rescue', ' rebuild', ' unity', ' peace'];

function categorize(title: string): { category: string; sentiment: DigestItem['sentiment'] } {
  const t = title.toLowerCase();
  if (t.includes('education') || t.includes('literacy') || t.includes('school') || t.includes('learn'))
    return { category: 'Education', sentiment: 'uplifting' };
  if (t.includes('coral') || t.includes('ocean') || t.includes('forest') || t.includes('wildlife') || t.includes('species') || t.includes('climate') || t.includes('environment'))
    return { category: 'Environment', sentiment: 'hopeful' };
  if (t.includes('energy') || t.includes('solar') || t.includes('wind') || t.includes('renewable') || t.includes('clean'))
    return { category: 'Clean Energy', sentiment: 'inspiring' };
  if (t.includes('health') || t.includes('medical') || t.includes('vaccine') || t.includes('cure') || t.includes('disease'))
    return { category: 'Health', sentiment: 'uplifting' };
  return { category: 'General', sentiment: 'hopeful' };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export class GoodThingsDigestPanel {
  private container: HTMLElement;
  private items: DigestItem[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData<DigestItem[]>(
      { name: 'GoodThingsDigest', fallback: DEMO_ITEMS},
      async () => {
        const raw = getHydratedData('positiveGeoEvents') as { events?: Array<{ title: string; source: string; url: string; seendate: string }> } | undefined;
        if (raw?.events?.length) {
          return raw.events
            .filter((a: { title?: string }) => a.title && POSITIVE_KEYWORDS.some(k => a.title!.toLowerCase().includes(k.trim())))
            .slice(0, 10)
            .map((a: { title: string; source: string; seendate: string }, i: number) => {
              const { category, sentiment } = categorize(a.title);
              return {
                id: `gd-${i}`,
                title: a.title,
                source: a.source || 'GDELT',
                category,
                publishedAt: a.seendate ? timeAgo(a.seendate) : 'recent',
                summary: a.title,
                sentiment,
              };
            });
        }
        return DEMO_ITEMS;
      },
      (data) => Array.isArray(data)
    );
    this.items = result.data;
    this.source = result.source;
  }

  private sentimentIcon(s: string): string {
    if (s === 'uplifting') return 'sentiment_very_satisfied';
    if (s === 'inspiring') return 'emoji_events';
    return 'eco';
  }

  private sentimentColor(s: string): string {
    if (s === 'uplifting') return 'bg-green-400/10 text-green-400';
    if (s === 'inspiring') return 'bg-yellow-400/10 text-yellow-400';
    return 'bg-primary/10 text-primary';
  }

  private categoryColor(c: string): string {
    const m: Record<string, string> = {
      Education: 'bg-yellow-400/10 text-yellow-400',
      Environment: 'bg-green-400/10 text-green-400',
      'Clean Energy': 'bg-primary/10 text-primary',
      Health: 'bg-orange-400/10 text-orange-400',
    };
    return m[c] || 'bg-white/5 text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Good Things</h3>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-surface-variant text-sm">favorite</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      ${this.items.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">favorite</span>
            <span class="text-xs">No positive news found</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.items.map((item, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-start mb-1.5">
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-label-caps ${this.categoryColor(item.category)}">${item.category.toUpperCase()}</span>
                <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-label-caps ${this.sentimentColor(item.sentiment)}">
                  <span class="material-symbols-outlined text-[10px]">${this.sentimentIcon(item.sentiment)}</span>
                  ${item.sentiment.toUpperCase()}
                </span>
              </div>
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
