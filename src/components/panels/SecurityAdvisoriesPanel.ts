import { loadAdvisoriesFromServer, type SecurityAdvisory } from '@/services/security-advisories';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_ADVISORIES: SecurityAdvisory[] = [
  { title: 'Do Not Travel — Level 4', country: 'Ukraine', source: 'State Dept.', sourceCountry: 'US', pubDate: new Date(Date.now() - 86400000), link: 'https://example.com/ukraine-advisory' },
  { title: 'Exercise Increased Caution — Level 2', country: 'Colombia', source: 'State Dept.', sourceCountry: 'US', pubDate: new Date(Date.now() - 172800000), link: 'https://example.com/colombia-advisory' },
  { title: 'Reconsider Travel — Level 3', country: 'Haiti', source: 'State Dept.', sourceCountry: 'US', pubDate: new Date(Date.now() - 259200000), link: 'https://example.com/haiti-advisory' },
  { title: 'Exercise Increased Caution — Level 2', country: 'South Africa', source: 'State Dept.', sourceCountry: 'US', pubDate: new Date(Date.now() - 432000000), link: 'https://example.com/south-africa-advisory' },
];

export class SecurityAdvisoriesPanel {
  private container: HTMLElement;
  private advisories: SecurityAdvisory[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'security-advisories', fallback: DEMO_ADVISORIES},
      async () => {
        const res = await loadAdvisoriesFromServer();
        return res.advisories;
      },
      (data) => Array.isArray(data),
    );
    this.advisories = result.data;
    this.source = result.source;
  }

  private levelFromTitle(title: string): number {
    const t = title.toLowerCase();
    if (t.includes('do not travel') || t.includes('level 4')) return 4;
    if (t.includes('reconsider') || t.includes('level 3')) return 3;
    if (t.includes('exercise increased caution') || t.includes('level 2')) return 2;
    return 1;
  }

  private levelConfig(level: number): { color: string; bg: string; border: string } {
    const m: Record<number, { color: string; bg: string; border: string }> = {
      1: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
      2: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
      3: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
      4: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    };
    return m[level] ?? m[1]!;
  }

  render(): void {
    const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    this.advisories.forEach(a => {
      const lvl = this.levelFromTitle(a.title);
      levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1;
    });

    this.container.innerHTML = `
      <style>
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .panel-fade-in { animation: fadeInUp 0.4s ease-out forwards; }
      </style>
      <div class="bg-white/5 rounded-xl p-4 panel-fade-in">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase mb-1">Security Advisories</p>
            <p class="text-2xl font-data-lg text-white">${this.advisories.length} Active Alerts</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>

        ${this.advisories.length === 0
          ? `<div class="flex flex-col items-center justify-center py-8 text-slate-400/40">
              <span class="material-symbols-outlined text-2xl mb-2">warning</span>
              <span class="text-xs">No security advisories available</span>
            </div>`
          : `
        <div class="grid grid-cols-4 gap-2 mb-4">
          ${[1, 2, 3, 4].map(l => {
            const cfg = this.levelConfig(l);
            return `
              <div class="text-center">
                <p class="text-[10px] font-label-caps text-slate-400 mb-1">Level ${l}</p>
                <p class="text-lg font-data-lg ${cfg.color}">${levelCounts[l] ?? 0}</p>
              </div>
            `;
          }).join('')}
        </div>

        <div class="space-y-2 mb-3">
          ${this.advisories.slice(0, 10).map((a, i) => {
            const lvl = this.levelFromTitle(a.title);
            const cfg = this.levelConfig(lvl);
            return `
              <div class="bg-white/5 rounded-lg p-3 panel-fade-in" style="animation-delay:${i * 60}ms">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-xs text-white font-medium">${a.country || 'Unknown'}</p>
                      <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}">Level ${lvl}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-0.5">${a.title}</p>
                  </div>
                </div>
                <p class="text-[10px] text-slate-500 mt-1.5">${a.source} \u00B7 ${a.pubDate ? new Date(a.pubDate).toLocaleDateString() : ''}</p>
              </div>
            `;
          }).join('')}
        </div>

        <div class="bg-white/5 rounded-lg p-2.5 border border-white/5">
          <p class="text-[10px] text-slate-500 text-center">Level 4 <span class="text-red-400">Do Not Travel</span> &middot; Level 3 <span class="text-orange-400">Reconsider</span></p>
        </div>
        `}

        <div class="flex items-center justify-center gap-2 mt-3">
          ${renderDataBadge(this.source)}
          <p class="text-[10px] text-slate-600">Source: State Dept.</p>
        </div>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
