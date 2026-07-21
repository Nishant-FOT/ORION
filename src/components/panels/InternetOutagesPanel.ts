import { fetchInternetOutages } from '@/services/infrastructure';
import type { InternetOutage } from '@/types';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_OUTAGES: InternetOutage[] = [
  { id: 'inet-1', country: 'Russia', severity: 'major', description: 'Major backbone disruption affecting multiple ISPs', title: 'Russia Backbone Outage', region: 'Eastern Europe', pubDate: new Date(Date.now() - 3600000), cause: 'fiber_cut', link: 'https://example.com/russia-outage', lat: 55.75, lon: 37.62, categories: ['backbone', 'fiber'] },
  { id: 'inet-2', country: 'Brazil', severity: 'partial', description: 'Intermittent connectivity loss in northern regions', title: 'Brazil Partial Outage', region: 'South America', pubDate: new Date(Date.now() - 7200000), cause: 'power_failure', link: 'https://example.com/brazil-outage', lat: -3.12, lon: -60.02, categories: ['power', 'regional'] },
  { id: 'inet-3', country: 'India', severity: 'major', description: 'CDN degradation affecting popular services', title: 'India CDN Issues', region: 'South Asia', pubDate: new Date(Date.now() - 1800000), cause: 'congestion', link: 'https://example.com/india-outage', lat: 28.61, lon: 77.21, categories: ['cdn', 'congestion'] },
  { id: 'inet-4', country: 'Nigeria', severity: 'total', description: 'Complete internet blackout in Lagos metro area', title: 'Nigeria Total Blackout', region: 'West Africa', pubDate: new Date(Date.now() - 5400000), cause: 'infrastructure_failure', link: 'https://example.com/nigeria-outage', lat: 6.52, lon: 3.38, categories: ['blackout', 'infrastructure'] },
];

export class InternetOutagesPanel {
  private container: HTMLElement;
  private outages: InternetOutage[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'internet-outages', fallback: DEMO_OUTAGES},
      () => fetchInternetOutages(),
      (data) => Array.isArray(data),
    );
    this.outages = result.data.slice(0, 8);
    this.source = result.source;
  }

  private sevBadge(s: string): string {
    if (s === 'major' || s === 'total' || s === 'critical') return 'bg-error/10 text-error border-error/20';
    if (s === 'moderate' || s === 'partial') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-primary/10 text-primary border-primary/20';
  }

  private sevIcon(s: string): string {
    if (s === 'total' || s === 'critical') return 'signal_cellular_off';
    if (s === 'major') return 'signal_cellular_alt_1_bar';
    return 'signal_cellular_alt';
  }

  private formatDuration(d: Date): string {
    const ms = Date.now() - d.getTime();
    if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.round(ms / 3600000)}h ago`;
    return `${Math.round(ms / 86400000)}d ago`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Internet Outages</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-on-surface-variant font-data-md">${this.outages.length} active</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      ${this.outages.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">signal_cellular_alt</span>
            <span class="text-xs">No internet outages detected</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.outages.map((o, i) => `
          <div class="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <span class="material-symbols-outlined text-sm ${this.sevIcon(o.severity).includes('off') ? 'text-error' : 'text-orange-400'}">${this.sevIcon(o.severity)}</span>
            <div class="flex-grow min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm text-on-surface font-body-sm panel-body truncate">${o.country}</span>
                <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.sevBadge(o.severity)} shrink-0">${o.severity.toUpperCase()}</span>
              </div>
              <div class="text-[10px] text-on-surface-variant font-data-md truncate">${o.description || o.title}</div>
              <div class="flex items-center gap-2 mt-0.5 text-[10px] font-data-md text-on-surface-variant">
                <span>${o.region || o.country}</span>
                <span>${this.formatDuration(o.pubDate)}</span>
                ${o.cause ? `<span class="text-on-surface-variant/60">${o.cause.replace('_', ' ')}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
