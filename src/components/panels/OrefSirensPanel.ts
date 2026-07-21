import { fetchOrefAlerts, type OrefAlertsResponse, type OrefAlert } from '@/services/oref-alerts';

export class OrefSirensPanel {
  private container: HTMLElement;
  private response: OrefAlertsResponse | null = null;
  private history: OrefAlert[] = [];
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      this.response = await fetchOrefAlerts();
      if (this.response) {
        this.isLive = this.response.configured !== false;
      }
    } catch { /* empty */ }

    if (!this.response) {
      this.response = {
        configured: false,
        alerts: [],
        historyCount24h: 0,
        timestamp: new Date().toISOString(),
        error: 'API unavailable',
      };
    }

    if (this.response.alerts?.length) {
      this.history = this.response.alerts;
    } else {
      this.history = [];
    }
  }

  private formatTime(iso: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
    } catch {
      return '--:--';
    }
  }

  private isActive(): boolean {
    return this.response?.alerts?.length ? this.response.alerts.length > 0 : false;
  }

  render(): void {
    const active = this.isActive();
    const count24h = this.response?.historyCount24h ?? 0;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Oref Sirens</h3>
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors hover:scale-110 cursor-pointer">
            <span class="material-symbols-outlined text-on-surface-variant text-sm">notification_important</span>
          </span>
          <span class="w-2 h-2 rounded-full ${this.isLive ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span>
        </div>
      </div>
      ${active ? `
        <div class="p-4 rounded-xl bg-error/10 border border-error/30 mb-4 text-center animate-pulse">
          <div class="flex items-center justify-center gap-2 mb-1">
            <span class="material-symbols-outlined text-error text-lg">emergency</span>
            <span class="font-data-lg text-error panel-stat-lg text-xl">ACTIVE</span>
          </div>
          <div class="text-[11px] text-error/80 font-body-sm">${this.response!.alerts.length} active alert${this.response!.alerts.length > 1 ? 's' : ''}</div>
        </div>
      ` : `
        <div class="p-3 rounded-xl bg-white/5 border border-white/5 mb-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-1">
            <span class="material-symbols-outlined text-primary text-lg">check_circle</span>
            <span class="font-data-lg text-primary panel-stat-lg text-xl">ALL CLEAR</span>
          </div>
          <div class="text-[11px] text-on-surface-variant font-body-sm">${this.isLive ? 'No active sirens' : 'API offline'}</div>
        </div>
      `}
      <div class="panel-grid-inner mb-3">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">24H ALERTS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${count24h}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">HISTORY</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.history.length}</div>
        </div>
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">RECENT ALERTS</div>
      <div class="flex flex-col gap-1 panel-list" style="max-height: calc(100% - 220px); overflow-y: auto;">
        ${this.history.length === 0
          ? `<div class="text-xs text-on-surface-variant/40 text-center py-4">No recent alerts</div>`
          : this.history.slice(0, 20).map((a, i) => `
          <div class="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <span class="material-symbols-outlined text-primary text-xs flex-shrink-0">notification_important</span>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-on-surface font-body-sm truncate">${a.title || 'Siren'}</div>
              <div class="text-[9px] text-on-surface-variant font-data-md truncate">${a.data?.join(', ') || 'Multiple areas'}</div>
            </div>
            <span class="text-[9px] text-on-surface-variant font-data-md flex-shrink-0">${this.formatTime(a.alertDate)}</span>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
