import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface SeismicQuake {
  location: string;
  magnitude: number;
  depth: number;
  time: string;
}

const DEMO_QUAKES: Array<{ location: string; magnitude: number; depth: number; time: string }> = [
  { location: '200km SE of Tokyo', magnitude: 5.2, depth: 45, time: '2h ago' },
  { location: 'Near Istanbul', magnitude: 4.1, depth: 12, time: '6h ago' },
  { location: 'Off coast Chile', magnitude: 6.1, depth: 30, time: '12h ago' },
  { location: 'Eastern Turkey', magnitude: 4.8, depth: 15, time: '1d ago' },
  { location: 'Sichuan, China', magnitude: 3.9, depth: 22, time: '18h ago' },
  { location: 'Southern California', magnitude: 3.2, depth: 8, time: '1d ago' },
];

export class EarthquakesPanel {
  private container: HTMLElement;
  private quakes: Array<{ location: string; magnitude: number; depth: number; time: string }> = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'earthquakes', fallback: DEMO_QUAKES },
      async () => {
        const { getApiBaseUrl } = await import('@/services/runtime');
        const base = getApiBaseUrl() || '';
        const resp = await fetch(`${base}/api/seismology/v1/list-earthquakes`, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.unavailable) throw new Error('unavailable');
        const quakes: SeismicQuake[] = (data.quakes || data.earthquakes || [])
          .filter((q: { magnitude?: number }) => (q.magnitude ?? 0) >= 2.5)
          .sort((a: { magnitude: number }, b: { magnitude: number }) => b.magnitude - a.magnitude)
          .slice(0, 15)
          .map((q: { location?: string; place?: string; magnitude: number; depth: number; time?: string; timestamp?: number }) => ({
            location: q.location || q.place || 'Unknown',
            magnitude: q.magnitude ?? 0,
            depth: Math.round((q.depth ?? 0) * 10) / 10,
            time: q.time || (q.timestamp ? this.formatTime(q.timestamp) : 'Recent'),
          }));
        return quakes;
      },
      (data) => Array.isArray(data),
    );
    this.quakes = result.data;
    this.source = result.source;
  }

  private formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  private magColor(m: number): string {
    if (m >= 5) return 'text-error';
    if (m >= 4) return 'text-orange-400';
    return 'text-primary';
  }

  private magBg(m: number): string {
    if (m >= 5) return 'bg-error/10 border-error/20';
    if (m >= 4) return 'bg-orange-400/10 border-orange-400/20';
    return 'bg-primary/10 border-primary/20';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Earthquakes</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.quakes.map((q, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="min-w-0">
              <div class="text-sm text-on-surface font-body-sm panel-body truncate">${q.location}</div>
              <div class="text-[10px] text-on-surface-variant font-data-md">${q.depth}km depth · ${q.time}</div>
            </div>
            <span class="text-lg font-data-lg ${this.magColor(q.magnitude)} panel-stat-lg px-2 py-0.5 rounded border ${this.magBg(q.magnitude)}">M${q.magnitude.toFixed(1)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
