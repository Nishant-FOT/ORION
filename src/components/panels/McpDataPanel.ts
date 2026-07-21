import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface McpServer { id: string; name: string; status: string; lastSync: string; dataPoints: number; sources: string[]; }

const DEMO_SERVERS: McpServer[] = [
  {
    id: 'mcp-1', name: 'GDELT Event Stream', status: 'healthy', lastSync: '2026-07-17T14:32:00Z', dataPoints: 12480,
    sources: ['GDELT v3', 'ICEWS', 'Crisis Group'],
  },
  {
    id: 'mcp-2', name: 'Energy Intelligence', status: 'healthy', lastSync: '2026-07-17T14:28:00Z', dataPoints: 3420,
    sources: ['EIA API', 'Platts', 'OPEC Data'],
  },
  {
    id: 'mcp-3', name: 'Financial Markets', status: 'degraded', lastSync: '2026-07-17T13:15:00Z', dataPoints: 8750,
    sources: ['Yahoo Finance', 'Bloomberg Terminal', 'FRED'],
  },
];

export class McpDataPanel {
  private container: HTMLElement;
  private servers: McpServer[] = DEMO_SERVERS;
  private totalSources = 0;
  private healthyCount = 0;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData<McpServer[]>(
      { name: 'mcp-data', fallback: DEMO_SERVERS},
      async () => {
        const res = await fetch('/api/mcp/v1/list-servers');
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable) throw new Error('unavailable');
        return (d.servers ?? []) as McpServer[];
      },
      (_d) => true,
    );
    this.servers = data;
    this.source = source;
    this.computeTotals();
  }

  private computeTotals(): void {
    this.totalSources = this.servers.reduce((sum, s) => sum + s.sources.length, 0);
    this.healthyCount = this.servers.filter(s => s.status === 'healthy').length;
  }

  private statusDot(s: string): string { return s === 'healthy' ? 'bg-green-400' : s === 'degraded' ? 'bg-yellow-400' : 'bg-error'; }
  private statusBadge(s: string): string {
    const m: Record<string, string> = { healthy: 'bg-green-400/15 text-green-400 border-green-400/20', degraded: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', offline: 'bg-error/15 text-error border-error/20' };
    return m[s] || 'bg-white/5 text-on-surface-variant border-white/10';
  }
  private timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">MCP Data Sources</h3>
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${this.healthyCount}/${this.servers.length} UP</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="panel-grid-inner mb-3">
        <div class="p-3 bg-white/5 rounded-xl text-center">
          <div class="text-[10px] font-label-caps text-on-surface-variant">SERVERS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.servers.length}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center">
          <div class="text-[10px] font-label-caps text-on-surface-variant">SOURCES</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.totalSources}</div>
        </div>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 120px); overflow-y: auto;">
        ${this.servers.map((s, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full ${this.statusDot(s.status)}"></span>
                <span class="text-sm text-on-surface font-body-sm panel-body">${s.name}</span>
              </div>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.statusBadge(s.status)}">${s.status.toUpperCase()}</span>
            </div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] text-on-surface-variant">Last sync: ${this.timeAgo(s.lastSync)}</span>
              <span class="text-[10px] font-data-md text-on-surface-variant">${s.dataPoints.toLocaleString()} pts</span>
            </div>
            <div class="flex flex-wrap gap-1">
              ${s.sources.map(src => `<span class="text-[9px] font-data-md px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant">${src}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
