import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface SpotlightItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
  summary: string;
  keyPoints: string[];
  source: string;
}

const DEMO_SPOTLIGHT: SpotlightItem = {
  id: 'spotlight-demo',
  title: 'Strait of Hormuz Tensions Escalate Amid New Sanctions',
  severity: 'high',
  timestamp: new Date().toISOString(),
  summary: 'Geopolitical tensions in the Strait of Hormuz have risen following the announcement of new sanctions targeting energy exports, raising concerns about supply disruptions.',
  keyPoints: [
    'New sanctions imposed on major energy exporter',
    'Shipping routes through Strait of Hormuz under increased scrutiny',
    'Oil futures rise on supply disruption fears',
    'Diplomatic talks stalled as regional tensions mount',
  ],
  source: 'GDELT',
};

export class HeroSpotlightPanel {
  private container: HTMLElement;
  private spotlight: SpotlightItem | null = null;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'HeroSpotlight', fallback: DEMO_SPOTLIGHT},
      async () => {
        const { fetchGdeltArticles } = await import('@/services/gdelt-intel');
        const articles = await fetchGdeltArticles(
          'energy OR oil OR geopolitics OR "strait of hormuz" OR OPEC OR sanctions OR "supply chain"',
          5,
          '24h'
        );
        if (articles.length) {
          const top = articles[0]!;
          return {
            id: 'spotlight-live',
            title: top.title,
            severity: this.assessSeverity(top.title),
            timestamp: top.date,
            summary: top.title,
            keyPoints: articles.slice(0, 4).map(a => a.title),
            source: top.source || 'GDELT',
          };
        }
        return { ...DEMO_SPOTLIGHT, id: 'spotlight-live' };
      },
    );
    this.spotlight = result.data;
    this.source = result.source;
  }

  private assessSeverity(title: string): 'critical' | 'high' | 'medium' {
    const lower = title.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency') || lower.includes('blockade') || lower.includes('attack')) return 'critical';
    if (lower.includes('sanction') || lower.includes('escalat') || lower.includes('military') || lower.includes('strike')) return 'high';
    return 'medium';
  }

  private severityColor(s: string): string {
    if (s === 'critical') return 'bg-error/10 text-error border border-error/20';
    if (s === 'high') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  private severityPulse(s: string): string {
    if (s === 'critical') return 'animate-pulse';
    return '';
  }

  render(): void {
    if (!this.spotlight) {
      this.container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Spotlight</h3>
          ${renderDataBadge(this.source)}
        </div>
        <div class="text-center py-8">
          <span class="material-symbols-outlined text-on-surface-variant/30 text-3xl mb-2 block">search_off</span>
          <div class="text-xs text-on-surface-variant/40">Connecting to live feeds...</div>
        </div>`;
      return;
    }

    const timeStr = new Date(this.spotlight.timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Spotlight</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="bg-white/5 hover:bg-white/10 transition-all p-4 rounded-xl border border-white/5 relative overflow-hidden" style="animation: fadeInUp 0.4s ease-out 0s both;">
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-error shadow-[0_0_12px_rgba(255,100,100,0.4)]"></div>
        <div class="pl-2">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-error ${this.severityPulse(this.spotlight.severity)}"></span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-data-md ${this.severityColor(this.spotlight.severity)}">
                ${this.spotlight.severity.toUpperCase()}
              </span>
            </div>
            <span class="text-[10px] font-data-md text-on-surface-variant">${timeStr}</span>
          </div>
          <h4 class="text-lg font-data-lg text-on-surface panel-body mb-2">${this.spotlight.title}</h4>
          <p class="text-[11px] text-on-surface-variant font-body-sm leading-relaxed mb-3">${this.spotlight.summary}</p>
          <div class="flex flex-col gap-1.5 mb-2">
            ${this.spotlight.keyPoints.map((kp, i) => `
              <div class="flex items-start gap-1.5" style="animation: fadeInUp 0.3s ease-out ${0.1 + 0.05 * i}s both;">
                <span class="material-symbols-outlined text-error text-[10px] mt-0.5">circle</span>
                <span class="text-[10px] text-on-surface-variant font-body-sm">${kp}</span>
              </div>
            `).join('')}
          </div>
          <div class="text-[9px] font-label-caps text-on-surface-variant/60 mt-1">SOURCE: ${this.spotlight.source}</div>
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
