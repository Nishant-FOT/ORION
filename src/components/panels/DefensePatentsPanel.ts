export class DefensePatentsPanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {}


  render(): void {
    const patents = [
      { id: 'US20260145231', title: 'Directed Energy Weapon Cooling System', assignee: 'Lockheed Martin', filed: '2026-04-12', status: 'Filed' },
      { id: 'US20260139872', title: 'Hypersonic Vehicle Guidance Algorithm', assignee: 'Raytheon Technologies', filed: '2026-03-28', status: 'Granted' },
      { id: 'US20260135410', title: 'Quantum-Resistant Communication Protocol', assignee: 'Northrop Grumman', filed: '2026-03-15', status: 'Filed' },
      { id: 'US20260128955', title: 'Autonomous Swarm Coordination System', assignee: 'Lockheed Martin', filed: '2026-02-20', status: 'Pending' },
      { id: 'US20260121300', title: 'Multi-Spectrum Target Acquisition Sensor', assignee: 'Raytheon Technologies', filed: '2026-01-31', status: 'Granted' }
    ];

    const assigneeCounts: Record<string, number> = {};
    patents.forEach(p => { assigneeCounts[p.assignee] = (assigneeCounts[p.assignee] || 0) + 1; });

    const statusColor: Record<string, string> = {
      'Filed': 'bg-blue-500/20 text-blue-400',
      'Granted': 'bg-emerald-500/20 text-emerald-400',
      'Pending': 'bg-amber-500/20 text-amber-400'
    };

    this.container.innerHTML = `
      <style>
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .panel-fade-in { animation: fadeInUp 0.4s ease-out forwards; }
      </style>
      <div class="bg-white/5 rounded-xl p-4 panel-fade-in">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase mb-1">Defense Patents</p>
            <p class="text-2xl font-data-lg text-white">${patents.length} Recent Filings</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
        </div>

        <div class="space-y-2 mb-4">
          ${patents.map((p, i) => `
            <div class="bg-white/5 rounded-lg p-3 panel-fade-in" style="animation-delay:${i * 60}ms">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-xs text-white font-medium truncate">${p.title}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">${p.id} &middot; ${p.assignee}</p>
                </div>
                <span class="shrink-0 text-[10px] font-label-caps px-2 py-0.5 rounded-full ${statusColor[p.status]}">${p.status}</span>
              </div>
              <p class="text-[10px] text-slate-500 mt-1">Filed ${p.filed}</p>
            </div>
          `).join('')}
        </div>

        <div class="border-t border-white/10 pt-3">
          <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase mb-2">Top Assignees</p>
          <div class="flex gap-2 flex-wrap">
            ${Object.entries(assigneeCounts).map(([name, count]) => `
              <div class="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2">
                <span class="text-xs text-white">${name}</span>
                <span class="text-[10px] font-label-caps px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <p class="text-[10px] text-slate-600 mt-3 text-center">Demo data &middot; Source: USPTO</p>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
