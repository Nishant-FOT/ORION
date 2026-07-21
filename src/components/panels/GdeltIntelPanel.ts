import { INTEL_TOPICS, fetchAllTopicIntelligence, formatArticleDate, type TopicIntelligence, type GdeltArticle } from '@/services/gdelt-intel';

function toneColor(tone?: number): string {
  if (tone == null) return 'text-on-surface-variant';
  if (tone < -4) return 'text-error';
  if (tone < -2) return 'text-orange-400';
  if (tone < 0) return 'text-yellow-400';
  return 'text-primary';
}

function toneIcon(tone?: number): string {
  if (tone == null) return '';
  if (tone < -4) return '\u25B2';
  if (tone < -2) return '\u25B2';
  if (tone < 0) return '\u25CF';
  return '\u25BC';
}

const DEMO_TOPICS: Record<string, GdeltArticle[]> = {
  military: [
    { title: 'NATO conducts largest naval exercise in Baltic Sea amid heightened tensions', url: '', source: 'Reuters', date: '', tone: -2.1 },
    { title: 'India and Japan announce joint military drills in Indo-Pacific region', url: '', source: 'AP', date: '', tone: -0.8 },
    { title: 'US deploys additional carrier strike group to Eastern Mediterranean', url: '', source: 'BBC', date: '', tone: -3.2 },
  ],
  cyber: [
    { title: 'Major ransomware attack targets European energy grid operators', url: '', source: 'Reuters', date: '', tone: -5.1 },
    { title: 'APT group linked to state actor breaches defense contractor networks', url: '', source: 'AP', date: '', tone: -4.3 },
  ],
  nuclear: [
    { title: 'IAEA reports progress in Iran nuclear negotiations', url: '', source: 'BBC', date: '', tone: 1.2 },
    { title: 'North Korea satellite launch raises proliferation concerns', url: '', source: 'Reuters', date: '', tone: -3.8 },
  ],
  sanctions: [
    { title: 'EU announces new round of energy sanctions targeting Russia', url: '', source: 'Reuters', date: '', tone: -2.9 },
    { title: 'US Treasury expands sanctions on cryptocurrency exchanges', url: '', source: 'Bloomberg', date: '', tone: -1.5 },
  ],
  intelligence: [
    { title: 'Five Eyes alliance shares unprecedented intelligence on cyber threats', url: '', source: 'Guardian', date: '', tone: -1.0 },
    { title: 'Satellite imagery reveals covert military facility expansion', url: '', source: 'Reuters', date: '', tone: -3.5 },
  ],
  maritime: [
    { title: 'Red Sea shipping disruptions continue as Houthi attacks persist', url: '', source: 'AP', date: '', tone: -4.2 },
    { title: 'South China Sea patrol incidents escalate between naval forces', url: '', source: 'Reuters', date: '', tone: -3.0 },
    { title: 'Strait of Hormuz sees increased naval presence amid tensions', url: '', source: 'BBC', date: '', tone: -2.5 },
  ],
};

export class GdeltIntelPanel {
  private container: HTMLElement;
  private topicData: TopicIntelligence[] = [];
  private activeTopic = 'military';
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const results = await fetchAllTopicIntelligence();
      if (results.some(t => t.articles.length > 0)) {
        this.topicData = results;
        this.isLive = true;
        return;
      }
    } catch { /* live fetch failed */ }

    this.topicData = INTEL_TOPICS.map(topic => ({
      topic,
      articles: DEMO_TOPICS[topic.id] ?? [],
      fetchedAt: new Date(),
    }));
    this.isLive = false;
  }

  private getActiveArticles(): GdeltArticle[] {
    const found = this.topicData.find(t => t.topic.id === this.activeTopic);
    return found?.articles ?? [];
  }

  private switchTopic(id: string): void {
    this.activeTopic = id;
    this.render();
  }

  private topicCount(id: string): number {
    return this.topicData.find(t => t.topic.id === id)?.articles.length ?? 0;
  }

  render(): void {
    const live = this.isLive;
    const activeArticles = this.getActiveArticles();
    const activeTopicMeta = INTEL_TOPICS.find(t => t.id === this.activeTopic);

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">GDELT Intelligence</h3>
        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${live ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span><span class="text-[10px] font-data-md ${live ? 'text-primary' : 'text-on-surface-variant/60'}">${live ? 'LIVE' : 'CONNECTING'}</span></div>
      </div>

      <div class="flex gap-1 mb-3 flex-wrap">
        ${INTEL_TOPICS.map(t => `
          <button class="px-2 py-1 text-[9px] font-label-caps rounded-lg transition-all flex items-center gap-1 ${
            this.activeTopic === t.id ? 'bg-primary/15 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5 border border-transparent'
          }" data-gdelt-topic="${t.id}">
            <span>${t.icon}</span><span>${t.name}</span>
            <span class="text-[8px] opacity-60">(${this.topicCount(t.id)})</span>
          </button>
        `).join('')}
      </div>

      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 120px); overflow-y: auto;">
        ${activeArticles.length === 0 ? `
          <div class="text-xs text-on-surface-variant/40 text-center py-6">
            <span class="material-symbols-outlined text-2xl mb-2 block">search_off</span>
            No articles found for ${activeTopicMeta?.name ?? 'this topic'}
          </div>
        ` : activeArticles.map((a, i) => `
          <div class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;" ${a.url ? `onclick="window.open('${a.url}', '_blank')"` : ''}>
            <div class="flex items-start justify-between gap-2 mb-1">
              <span class="text-xs text-on-surface font-body-sm panel-body leading-relaxed line-clamp-2">${a.title}</span>
              <span class="text-[10px] shrink-0 ${toneColor(a.tone)}">${toneIcon(a.tone)}</span>
            </div>
            <div class="flex items-center gap-2 text-[9px] font-data-md text-on-surface-variant">
              <span>${a.source}</span>
              <span>\u00B7</span>
              <span>${formatArticleDate(a.date)}</span>
              ${a.tone != null ? `<span>\u00B7</span><span class="${toneColor(a.tone)}">Tone: ${a.tone > 0 ? '+' : ''}${a.tone.toFixed(1)}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.container.querySelectorAll('[data-gdelt-topic]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTopic(btn.getAttribute('data-gdelt-topic')!));
    });
  }

  destroy(): void { this.container.innerHTML = ''; }
}
