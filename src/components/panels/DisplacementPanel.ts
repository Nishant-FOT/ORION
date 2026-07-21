import { fetchUnhcrPopulation } from '@/services/displacement';
import { fetchConflictEvents } from '@/services/conflict';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

export class DisplacementPanel {
  private container: HTMLElement;
  private data = { total: 0, topCountries: [] as Array<{ country: string; displaced: number; cause?: string }> };
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const DEMO_DISPLACEMENT = {
      total: 114000000,
      topCountries: [
        { country: 'Syria', displaced: 6800000 },
        { country: 'Ukraine', displaced: 6200000 },
        { country: 'Afghanistan', displaced: 5700000 },
        { country: 'South Sudan', displaced: 4200000 },
        { country: 'Myanmar', displaced: 3500000 },
      ],
    };
    const fallback = DEMO_DISPLACEMENT;

    const result = await fetchPanelData(
      { name: 'displacement', fallback},
      async () => {
        const [unhcrResult, conflictResult] = await Promise.allSettled([
          fetchUnhcrPopulation(),
          fetchConflictEvents(),
        ]);

        const data = { total: 0, topCountries: [] as Array<{ country: string; displaced: number; cause?: string }> };

        if (unhcrResult.status === 'fulfilled' && unhcrResult.value?.ok && unhcrResult.value.data) {
          data.total = unhcrResult.value.data.globalTotals?.total ?? 0;
          data.topCountries = (unhcrResult.value.data.countries ?? []).slice(0, 5).map(c => ({
            country: c.name || 'Unknown',
            displaced: c.totalDisplaced ?? 0,
          }));
        }

        if (conflictResult.status === 'fulfilled' && conflictResult.value?.events?.length) {
          const fatalitiesByCountry = new Map<string, number>();
          for (const e of conflictResult.value.events) {
            const c = e.country || 'Unknown';
            fatalitiesByCountry.set(c, (fatalitiesByCountry.get(c) || 0) + e.fatalities);
          }
          const conflictDisplacements = [...fatalitiesByCountry.entries()]
            .filter(([, f]) => f > 0)
            .map(([country, fatalities]) => ({
              country,
              displaced: fatalities * 50,
              cause: 'conflict' as const,
            }))
            .sort((a, b) => b.displaced - a.displaced);

          const existingCountries = new Set(data.topCountries.map(c => c.country));
          for (const cd of conflictDisplacements) {
            if (!existingCountries.has(cd.country)) {
              data.topCountries.push(cd);
              existingCountries.add(cd.country);
            }
          }
          data.topCountries = data.topCountries
            .sort((a, b) => b.displaced - a.displaced)
            .slice(0, 6);
        }

        return { total: data.total > 0 ? data.total : fallback.total, topCountries: data.topCountries.length > 0 ? data.topCountries : fallback.topCountries };
      },
      (_data) => true,
    );
    this.source = result.source;
    this.data = result.data;
  }

  render(): void {
    const maxD = Math.max(...this.data.topCountries.map(c => c.displaced), 1);
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Displacement</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="text-xs text-on-surface-variant font-data-md">${(this.data.total / 1e6).toFixed(1)}M total</span>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant">FORCIBLY DISPLACED</div>
        <div class="text-3xl font-data-lg text-error panel-stat-lg">${(this.data.total / 1e6).toFixed(1)}M</div>
      </div>
      <div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.data.topCountries.map((c, i) => `
          <div class="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="text-sm text-on-surface font-body-sm w-24 truncate panel-body">${c.country}</div>
            <div class="flex-grow h-2 bg-white/5 rounded-full overflow-hidden">
              <div class="h-full bg-error/60 rounded-full" style="width: ${(c.displaced / maxD * 100)}%"></div>
            </div>
            <div class="text-xs font-data-md text-on-surface-variant w-16 text-right">${(c.displaced / 1e6).toFixed(1)}M</div>
            ${c.cause ? '<span class="text-[9px] font-label-caps px-1 py-0.5 rounded bg-orange-400/10 text-orange-400">CONFLICT</span>' : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
