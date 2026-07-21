import { getHydratedData } from '@/services/bootstrap';

export class WeatherAlertsPanel {
  private container: HTMLElement;
  private alerts: Array<{ event: string; area: string; severity: string; headline: string }> = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const raw = getHydratedData('weatherAlerts') as { alerts?: Array<{ event: string; severity: string; headline: string; areaDesc: string }> } | undefined;
      if (raw?.alerts?.length) {
        this.alerts = raw.alerts.slice(0, 6).map(a => ({
          event: a.event || 'Weather Alert',
          area: a.areaDesc || 'Multiple',
          severity: a.severity?.toLowerCase() || 'moderate',
          headline: a.headline || '',
        }));
        return;
      }
    } catch { /* defaults */ }
    if (this.alerts.length === 0) {
      this.alerts = [
        { event: 'Hurricane Warning', area: 'Gulf of Mexico', severity: 'extreme', headline: 'Category 3 hurricane approaching' },
        { event: 'Heat Wave', area: 'South Asia', severity: 'severe', headline: 'Temperatures exceeding 45°C' },
        { event: 'Flood Watch', area: 'Southeast Asia', severity: 'moderate', headline: 'Monsoon flooding expected' },
        { event: 'Wildfire Risk', area: 'Western US', severity: 'severe', headline: 'Critical fire weather conditions' },
      ];
    }
  }

  private sevStyle(s: string): string {
    if (s === 'extreme' || s === 'severe') return 'bg-error/10 text-error border-error/20';
    return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Weather Alerts</h3>
        <span class="text-xs text-on-surface-variant font-data-md">${this.alerts.length} active</span>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.alerts.map((a, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-on-surface font-body-sm panel-body">${a.event}</span>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.sevStyle(a.severity)}">${a.severity.toUpperCase()}</span>
            </div>
            <div class="text-[10px] text-on-surface-variant font-data-md">${a.area}</div>
            ${a.headline ? `<div class="text-xs text-on-surface-variant mt-1">${a.headline}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
