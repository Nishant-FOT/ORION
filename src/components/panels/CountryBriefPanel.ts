import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface KeyEvent { date: string; event: string; severity: string; }

interface CountryBriefResponse {
  countryCode: string;
  countryName: string;
  brief: string;
  model: string;
  generatedAt: number;
  sources: Array<{ title: string; source: string; url: string; publishedAt?: string }>;
}

export class CountryBriefPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  countryCode = '';
  countryName = '';
  private brief = '';
  private generatedAt = 0;
  private sources: Array<{ title: string; source: string; url: string; publishedAt?: string }> = [];
  private events: KeyEvent[] = [];
  private error = '';
  private loading = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderSkeleton();
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.loading = false;
    this.render();
  }

  private async fetchData(): Promise<void> {
    if (!this.countryCode) {
      this.error = 'No country selected';
      return;
    }
    try {
      const { getApiBaseUrl } = await import('@/services/runtime');
      const base = getApiBaseUrl() || '';
      const url = `${base}/api/intelligence/v1/get-country-intel-brief?country_code=${this.countryCode.toUpperCase()}&lang=en`;
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) {
        this.error = `Server returned ${res.status}`;
        return;
      }
      const d: CountryBriefResponse = await res.json();
      if (!d.brief) {
        this.error = 'No brief data available for this country';
        return;
      }
      this.brief = d.brief;
      this.countryName = d.countryName || this.countryName || this.countryCode;
      this.generatedAt = d.generatedAt;
      this.sources = d.sources || [];
      this.source = 'live';
      this.events = this.parseBriefEvents(this.brief);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load brief';
    }
  }

  private parseBriefEvents(brief: string): KeyEvent[] {
    const events: KeyEvent[] = [];
    const lines = brief.split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[•\-\*]\s*/, '').trim();
      if (!trimmed || trimmed.length < 10) continue;
      const severity = /critical|urgent|escalat|threat|attack|strike/i.test(trimmed)
        ? 'high'
        : /risk|concern|monitor|watch/i.test(trimmed)
          ? 'medium'
          : 'low';
      events.push({ date: this.formatDate(this.generatedAt), event: trimmed, severity });
    }
    return events.slice(0, 8);
  }

  private formatDate(ts: number): string {
    if (!ts) return '';
    return new Date(ts).toISOString().split('T')[0] ?? '';
  }

  private riskColorFromBrief(brief: string): { score: number; color: string; barColor: string } {
    const text = brief.toLowerCase();
    let score = 40;
    if (/critical|escalat|conflict|attack|war|crisis/i.test(text)) score += 30;
    if (/high risk|severe|urgent|threat/i.test(text)) score += 15;
    if (/sanction|disrupt|volatile|tension/i.test(text)) score += 10;
    if (/stable|improving|positive|growth/i.test(text)) score -= 10;
    score = Math.max(10, Math.min(95, score));
    const color = score >= 70 ? 'text-error' : score >= 50 ? 'text-orange-400' : score >= 30 ? 'text-yellow-400' : 'text-green-400';
    const barColor = score >= 70 ? 'bg-error' : score >= 50 ? 'bg-orange-400' : score >= 30 ? 'bg-yellow-400' : 'bg-green-400';
    return { score, color, barColor };
  }

  private severityBadge(s: string): string {
    const m: Record<string, string> = { critical: 'bg-error/15 text-error border-error/20', high: 'bg-orange-400/15 text-orange-400 border-orange-400/20', medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', low: 'bg-white/5 text-on-surface-variant border-white/10' };
    return m[s] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  private renderSkeleton(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Country Brief</h3>
        <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-white/5 text-on-surface-variant/40 border border-white/10 animate-pulse">LOADING</span>
      </div>
      <div class="p-3 bg-white/5 rounded-xl mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-label-caps text-on-surface-variant/40 animate-pulse">RISK ASSESSMENT</span>
          <span class="w-8 h-3 bg-white/10 rounded animate-pulse"></span>
        </div>
        <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div class="h-full bg-white/10 rounded-full animate-pulse" style="width: 60%"></div>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl mb-3 space-y-2">
        <div class="h-2 bg-white/10 rounded animate-pulse w-1/4"></div>
        <div class="h-2 bg-white/10 rounded animate-pulse w-full"></div>
        <div class="h-2 bg-white/10 rounded animate-pulse w-5/6"></div>
        <div class="h-2 bg-white/10 rounded animate-pulse w-3/4"></div>
        <div class="h-2 bg-white/10 rounded animate-pulse w-full"></div>
        <div class="h-2 bg-white/10 rounded animate-pulse w-2/3"></div>
      </div>
      <div class="space-y-1">
        <div class="h-2 bg-white/10 rounded animate-pulse w-1/3 mb-2"></div>
        <div class="h-8 bg-white/5 rounded-lg animate-pulse"></div>
        <div class="h-8 bg-white/5 rounded-lg animate-pulse"></div>
      </div>
    `;
  }

  render(): void {
    if (this.loading) {
      this.renderSkeleton();
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Country Brief</h3>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${(this.countryName || this.countryCode).toUpperCase()}</span>
            ${renderDataBadge('cached')}
          </div>
        </div>
        <div class="p-4 bg-white/5 rounded-xl text-center">
          <span class="material-symbols-outlined text-2xl text-on-surface-variant/40 mb-2">info</span>
          <div class="text-xs text-on-surface-variant">${this.error}</div>
        </div>
      `;
      return;
    }

    const { score, color, barColor } = this.riskColorFromBrief(this.brief);
    const briefHtml = this.brief
      ? this.brief.split('\n').map(line => {
          const trimmed = line.replace(/^[•\-\*]\s*/, '').trim();
          if (!trimmed) return '';
          if (/^[A-Z\s]+$/.test(trimmed)) {
            return `<div class="text-[10px] font-label-caps text-primary mt-3 mb-1">${trimmed}</div>`;
          }
          return `<div class="text-xs text-on-surface/90 font-body-sm leading-relaxed mb-1 pl-2 border-l border-white/10">${trimmed}</div>`;
        }).join('')
      : '<div class="text-xs text-on-surface-variant/60 animate-pulse">Generating intelligence brief...</div>';

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Country Brief</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${(this.countryName || this.countryCode).toUpperCase()}</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-label-caps text-on-surface-variant">RISK ASSESSMENT</span>
          <span class="text-sm font-data-md ${color}">${score}/100</span>
        </div>
        <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div class="h-full ${barColor} rounded-full transition-all duration-1000" style="width: ${score}%"></div>
        </div>
      </div>
      <div class="mb-3">
        <div class="p-3 bg-white/5 rounded-xl max-h-[300px] overflow-y-auto">
          ${briefHtml}
        </div>
      </div>
      ${this.sources.length > 0 ? `
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">SOURCES</div>
        <div class="flex flex-col gap-1">
          ${this.sources.slice(0, 4).map((s, i) => `
            <a href="${s.url}" target="_blank" rel="noopener" class="flex items-center gap-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all group" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <span class="text-[10px] text-primary font-data-md">[${i + 1}]</span>
              <div class="flex-1 min-w-0">
                <div class="text-[10px] text-on-surface font-body-sm truncate">${s.title}</div>
                <div class="text-[9px] text-on-surface-variant/60">${s.source}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
      ` : ''}
      ${this.events.length > 0 ? `
      <div>
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">KEY SIGNALS</div>
        <div class="flex flex-col gap-1">
          ${this.events.map((e, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex-1 min-w-0">
                <div class="text-xs text-on-surface font-body-sm panel-body truncate">${e.event}</div>
              </div>
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded-md border ${this.severityBadge(e.severity)} whitespace-nowrap ml-2">${e.severity.toUpperCase()}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
