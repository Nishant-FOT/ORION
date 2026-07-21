import { fetchFlightDelays, fetchAviationNews, type AirportDelayAlert, type AviationNewsItem } from '@/services/aviation';
import { fetchMilitaryFlights } from '@/services/military-flights';
import type { MilitaryFlight } from '@/types';

const SEV_COLOR: Record<string, string> = {
  critical: 'bg-error/10 text-error border-error/20',
  high: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  low: 'bg-primary/10 text-primary border-primary/20',
};

const SEV_DOT: Record<string, string> = {
  critical: 'bg-error', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-primary',
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export class AirlineIntelPanel {
  private container: HTMLElement;
  private delays: AirportDelayAlert[] = [];
  private news: AviationNewsItem[] = [];
  private milFlights: MilitaryFlight[] = [];
  private activeTab: 'delays' | 'news' | 'military' = 'delays';
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    let gotLive = false;
    const [delayRes, newsRes, milRes] = await Promise.allSettled([
      fetchFlightDelays(),
      fetchAviationNews(['aviation', 'airline', 'airport'], 24, 10),
      fetchMilitaryFlights(),
    ]);

    if (delayRes.status === 'fulfilled' && delayRes.value.length > 0) {
      this.delays = delayRes.value.slice(0, 8);
      gotLive = true;
    }
    if (newsRes.status === 'fulfilled' && newsRes.value.length > 0) {
      this.news = newsRes.value.slice(0, 8);
      gotLive = true;
    }
    if (milRes.status === 'fulfilled' && milRes.value.flights.length > 0) {
      this.milFlights = milRes.value.flights.slice(0, 10);
      gotLive = true;
    }
    this.isLive = gotLive;
  }

  private switchTab(tab: typeof this.activeTab): void { this.activeTab = tab; this.render(); }

  private severityOf(d: AirportDelayAlert): 'critical' | 'high' | 'medium' | 'low' {
    if (d.severity === 'severe' || (d.cancelledFlights && d.cancelledFlights > 10)) return 'critical';
    if (d.severity === 'major') return 'high';
    if (d.severity === 'moderate') return 'medium';
    return 'low';
  }

  private renderDelays(): string {
    if (this.delays.length === 0) {
      return '<div class="text-xs text-on-surface-variant/40 text-center py-4">No active delays</div>';
    }
    return this.delays.map((d, i) => {
      const sev = this.severityOf(d);
      return `
        <div class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${SEV_DOT[sev]}"></span>
              <span class="text-xs text-on-surface font-body-sm panel-body font-medium">${d.iata}</span>
              <span class="text-[10px] text-on-surface-variant">${d.city}</span>
            </div>
            <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${SEV_COLOR[sev]}">${sev.toUpperCase()}</span>
          </div>
          <div class="text-[10px] text-on-surface-variant mb-1">${d.reason || d.delayType.replace(/_/g, ' ')}</div>
          <div class="flex items-center gap-3 text-[9px] font-data-md text-on-surface-variant">
            <span>Avg: <span class="text-on-surface">${d.avgDelayMinutes}m</span></span>
            ${d.delayedFlightsPct ? `<span>Delayed: <span class="text-on-surface">${d.delayedFlightsPct}%</span></span>` : ''}
            ${d.cancelledFlights ? `<span>Canc: <span class="text-error">${d.cancelledFlights}</span></span>` : ''}
            <span class="opacity-50">${d.totalFlights} flights</span>
          </div>
        </div>`;
    }).join('');
  }

  private renderNews(): string {
    if (this.news.length === 0) {
      return '<div class="text-xs text-on-surface-variant/40 text-center py-4">No aviation news</div>';
    }
    return this.news.map((n, i) => `
      <div class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;" ${n.url ? `onclick="window.open('${n.url}', '_blank')"` : ''}>
        <div class="text-xs text-on-surface font-body-sm panel-body leading-relaxed line-clamp-2 mb-1">${n.title}</div>
        <div class="text-[10px] text-on-surface-variant line-clamp-1 mb-1">${n.snippet}</div>
        <div class="flex items-center gap-2 text-[9px] font-data-md text-on-surface-variant">
          <span>${n.sourceName}</span>
          <span>\u00B7</span>
          <span>${timeAgo(n.publishedAt)}</span>
        </div>
      </div>`).join('');
  }

  private renderMilitary(): string {
    if (this.milFlights.length === 0) {
      return '<div class="text-xs text-on-surface-variant/40 text-center py-4">No military flights tracked</div>';
    }
    return this.milFlights.map((f, i) => `
      <div class="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all" style="animation: fadeInUp 0.3s ease-out ${0.04 * i}s both;">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span class="text-xs text-on-surface font-body-sm panel-body font-medium">${f.callsign}</span>
            <span class="text-[10px] text-on-surface-variant">${f.operator.toUpperCase()}</span>
          </div>
          <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded border ${f.confidence === 'high' ? 'bg-primary/10 text-primary border-primary/20' : f.confidence === 'medium' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-white/5 text-on-surface-variant border-white/10'}">${f.confidence}</span>
        </div>
        <div class="text-[10px] text-on-surface-variant mb-1">${f.aircraftType} \u00B7 ${f.aircraftModel || 'Unknown model'}</div>
        <div class="flex items-center gap-3 text-[9px] font-data-md text-on-surface-variant">
          <span>Alt: <span class="text-on-surface">${(f.altitude / 1000).toFixed(1)}k ft</span></span>
          <span>Speed: <span class="text-on-surface">${f.speed} kts</span></span>
          ${f.note ? `<span class="text-yellow-400">${f.note}</span>` : ''}
        </div>
      </div>`).join('');
  }

  render(): void {
    const live = this.isLive;
    const tabs: Array<{ id: 'delays' | 'news' | 'military'; label: string; count: number }> = [
      { id: 'delays', label: 'Delays', count: this.delays.length },
      { id: 'news', label: 'News', count: this.news.length },
      { id: 'military', label: 'Military', count: this.milFlights.length },
    ];
    const content = this.activeTab === 'delays' ? this.renderDelays()
      : this.activeTab === 'news' ? this.renderNews() : this.renderMilitary();

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Airline Intelligence</h3>
        <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full ${live ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span><span class="text-[10px] font-data-md ${live ? 'text-primary' : 'text-on-surface-variant/60'}">${live ? 'LIVE' : 'OFFLINE'}</span></div>
      </div>
      <div class="flex gap-1 mb-3">
        ${tabs.map(t => `
          <button class="px-2 py-1 text-[10px] font-label-caps rounded-lg transition-all flex items-center gap-1 ${this.activeTab === t.id ? 'bg-primary/15 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-white/5 border border-transparent'}" data-avi-tab="${t.id}">
            ${t.label} <span class="text-[8px] opacity-60">(${t.count})</span>
          </button>`).join('')}
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 110px); overflow-y: auto;">
        ${content}
      </div>`;

    this.container.querySelectorAll('[data-avi-tab]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-avi-tab') as typeof this.activeTab));
    });
  }

  destroy(): void { this.container.innerHTML = ''; }
}
