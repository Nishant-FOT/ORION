import { fetchProtestEvents } from '@/services/unrest';
import { fetchSocialVelocity } from '@/services/social-velocity';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

const DEMO_SOCIAL: Array<{ country: string; type: string; intensity: string; count: number; velocity?: number }> = [
  { country: 'Iran', type: 'protest', intensity: 'high', count: 24 },
  { country: 'Lebanon', type: 'protest', intensity: 'high', count: 18 },
  { country: 'Kenya', type: 'protest', intensity: 'moderate', count: 12 },
  { country: 'Argentina', type: 'protest', intensity: 'moderate', count: 9 },
  { country: 'France', type: 'protest', intensity: 'low', count: 5 },
];

export class SocialVelocityPanel {
  private container: HTMLElement;
  private events: Array<{ country: string; type: string; intensity: string; count: number; velocity?: number }> = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'social-velocity', fallback: DEMO_SOCIAL },
      async () => {
        const events: Array<{ country: string; type: string; intensity: string; count: number; velocity?: number }> = [];

        const [protestData, velocityData] = await Promise.allSettled([
          fetchProtestEvents(),
          fetchSocialVelocity(),
        ]);

        if (protestData.status === 'fulfilled' && protestData.value?.events) {
          const byCountry = new Map<string, number>();
          for (const e of protestData.value.events) {
            const c = e.country || 'Unknown';
            byCountry.set(c, (byCountry.get(c) || 0) + 1);
          }
          events.push(...[...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([country, count]) => ({
            country, type: 'protest', intensity: count > 10 ? 'high' : count > 5 ? 'moderate' : 'low', count,
          })));
        }

        if (velocityData.status === 'fulfilled' && velocityData.value?.posts?.length) {
          const bySubreddit = new Map<string, { posts: number; maxVelocity: number; totalVelocity: number }>();
          for (const p of velocityData.value.posts) {
            const sub = p.subreddit || 'Unknown';
            const existing = bySubreddit.get(sub) || { posts: 0, maxVelocity: 0, totalVelocity: 0 };
            existing.posts++;
            existing.maxVelocity = Math.max(existing.maxVelocity, p.velocityScore || 0);
            existing.totalVelocity += p.velocityScore || 0;
            bySubreddit.set(sub, existing);
          }
          const velocityEntries = [...bySubreddit.entries()].map(([subreddit, data]) => ({
            country: subreddit,
            type: 'social',
            intensity: data.maxVelocity > 100 ? 'high' : data.maxVelocity > 50 ? 'moderate' : 'low',
            count: data.posts,
            velocity: Math.round(data.totalVelocity / data.posts),
          }));

          const existingCountries = new Set(events.map(e => e.country));
          for (const ve of velocityEntries) {
            if (!existingCountries.has(ve.country)) {
              events.push(ve);
              existingCountries.add(ve.country);
            }
          }
        }

        const result = events
          .sort((a, b) => (b.velocity || 0) - (a.velocity || 0) || b.count - a.count)
          .slice(0, 6);
        return result.length ? result : DEMO_SOCIAL;
      },
      (data) => Array.isArray(data),
    );
    this.events = result.data;
    this.source = result.source;
  }

  private sevStyle(s: string): string {
    if (s === 'high') return 'bg-error/10 text-error border-error/20';
    if (s === 'moderate') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    return 'bg-primary/10 text-primary border-primary/20';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Social Velocity</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.events.map((e, i) => `
          <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-sm text-on-surface font-body-sm panel-body">${e.country}</div>
            <div class="flex items-center gap-2">
              ${e.velocity !== undefined ? `<span class="text-xs font-data-md text-on-surface-variant">v${e.velocity}</span>` : ''}
              <span class="text-xs font-data-md text-on-surface-variant">${e.count} events</span>
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.sevStyle(e.intensity)}">${e.intensity.toUpperCase()}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
