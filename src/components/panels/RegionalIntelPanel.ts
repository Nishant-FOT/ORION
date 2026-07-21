import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CountryCard { code: string; name: string; riskScore: number; trend: string; highlights: string[]; }

const DEMO_COUNTRIES: CountryCard[] = [
  { code: 'IR', name: 'Iran', riskScore: 82, trend: 'rising', highlights: ['Nuclear program expansion', 'Proxy militia activation'] },
  { code: 'IL', name: 'Israel', riskScore: 74, trend: 'stable', highlights: ['Multi-front security posture', 'Internal political division'] },
  { code: 'SA', name: 'Saudi Arabia', riskScore: 38, trend: 'stable', highlights: ['Vision 2030 acceleration', 'Diversification progress'] },
  { code: 'IQ', name: 'Iraq', riskScore: 61, trend: 'rising', highlights: ['Militia tensions', 'Oil production recovery'] },
  { code: 'AE', name: 'UAE', riskScore: 25, trend: 'stable', highlights: ['Economic hub stability', 'Tech sector growth'] },
];

export class RegionalIntelPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private region = '';
  private summary = '';
  private countries: CountryCard[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const fallback = { region: 'Middle East', summary: 'Elevated tension across multiple fronts. Iran proxy network active. Gulf state diplomatic realignment continues. Energy supply routes under monitoring.', countries: DEMO_COUNTRIES };
    const { data, source } = await fetchPanelData(
      { name: 'regional-intel', fallback},
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const res = await fetch(`${base}/api/intelligence/v1/get-country-risk`);
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable) throw new Error('unavailable');
        return {
          region: d.region || 'Middle East',
          summary: d.summary || 'Intelligence assessment in progress.',
          countries: (d.countries || []).map((c: { code: string; name: string; riskScore: number; trend: string; highlights: string[] }) => ({
            code: c.code,
            name: c.name,
            riskScore: c.riskScore,
            trend: c.trend,
            highlights: c.highlights || [],
          })),
        };
      },
      (_d) => true,
    );
    this.region = data.region;
    this.summary = data.summary;
    this.countries = data.countries;
    this.source = source;
  }

  private riskColor(s: number): string { return s >= 70 ? 'text-error' : s >= 50 ? 'text-orange-400' : s >= 30 ? 'text-yellow-400' : 'text-green-400'; }
  private riskBar(s: number): string { return s >= 70 ? 'bg-error' : s >= 50 ? 'bg-orange-400' : s >= 30 ? 'bg-yellow-400' : 'bg-green-400'; }
  private trendArrow(t: string): string { return t === 'rising' ? '↑' : t === 'falling' ? '↓' : '→'; }
  private trendColor(t: string): string { return t === 'rising' ? 'text-error' : t === 'falling' ? 'text-green-400' : 'text-on-surface-variant'; }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Regional Intel</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${this.region.toUpperCase()}</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl mb-3">
        <p class="text-xs text-on-surface-variant leading-relaxed">${this.summary}</p>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 80px); overflow-y: auto;">
        ${this.countries.map((c, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-on-surface font-body-sm panel-body">${c.name}</span>
              <div class="flex items-center gap-2">
                <span class="text-sm font-data-md ${this.riskColor(c.riskScore)}">${c.riskScore}</span>
                <span class="text-[10px] font-data-md ${this.trendColor(c.trend)}">${this.trendArrow(c.trend)}</span>
              </div>
            </div>
            <div class="w-full h-1.5 bg-white/5 rounded-full mb-2 overflow-hidden">
              <div class="h-full ${this.riskBar(c.riskScore)} rounded-full transition-all duration-1000" style="width: ${c.riskScore}%"></div>
            </div>
            <div class="flex flex-wrap gap-1">
              ${c.highlights.map(h => `<span class="text-[9px] font-data-md px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant">${h}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
