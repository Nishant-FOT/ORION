import { createCircuitBreaker } from '@/utils';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface SpeciesItem {
  id: string;
  name: string;
  scientificName: string;
  status: string;
  recoveryPct: number;
  populationEstimate: string;
  region: string;
  summary: string;
}

const breaker = createCircuitBreaker<SpeciesItem[]>({
  name: 'Species Recovery',
  persistCache: false,
});

const RECOVERY_SPECIES = [
  { name: 'Bald Eagle', scientificName: 'Haliaeetus leucocephalus', iucnId: '22695167', region: 'North America' },
  { name: 'Humpback Whale', scientificName: 'Megaptera novaeangliae', iucnId: '13006', region: 'Global Oceans' },
  { name: 'Green Sea Turtle', scientificName: 'Chelonia mydas', iucnId: '4615', region: 'Tropical Oceans' },
  { name: 'Southern White Rhinoceros', scientificName: 'Ceratotherium simum simum', iucnId: '4185', region: 'Southern Africa' },
  { name: 'Gray Wolf', scientificName: 'Canis lupus', iucnId: '3746', region: 'Northern Hemisphere' },
  { name: 'Bengal Tiger', scientificName: 'Panthera tigris tigris', iucnId: '136823', region: 'South Asia' },
  { name: 'Whooping Crane', scientificName: 'Grus americana', iucnId: '22692429', region: 'North America' },
  { name: 'Iberian Lynx', scientificName: 'Lynx pardinus', iucnId: '12520', region: 'Southern Europe' },
];

const DEMO_ITEMS: SpeciesItem[] = [
  { id: 'sp-demo-1', name: 'Bald Eagle', scientificName: 'Haliaeetus leucocephalus', status: 'Recovered', recoveryPct: 90, populationEstimate: '316,700', region: 'North America', summary: 'IUCN status: LC. Population trending upward. Successful conservation through DDT ban and habitat protection.' },
  { id: 'sp-demo-2', name: 'Humpback Whale', scientificName: 'Megaptera novaeangliae', status: 'Recovering', recoveryPct: 72, populationEstimate: '80,000', region: 'Global Oceans', summary: 'IUCN status: NT. Population trending upward. International whaling ban has enabled significant recovery.' },
  { id: 'sp-demo-3', name: 'Green Sea Turtle', scientificName: 'Chelonia mydas', status: 'At Risk', recoveryPct: 50, populationEstimate: '85,000 nesting females', region: 'Tropical Oceans', summary: 'IUCN status: VU. Population trend uncertain. Threatened by bycatch, habitat loss, and climate change.' },
  { id: 'sp-demo-4', name: 'Bengal Tiger', scientificName: 'Panthera tigris tigris', status: 'Endangered', recoveryPct: 30, populationEstimate: '2,500', region: 'South Asia', summary: 'IUCN status: EN. Population under pressure. Poaching and habitat fragmentation remain primary threats.' },
];

async function fetchSpeciesData(): Promise<SpeciesItem[]> {
  try {
    const token = '';
    const ids = RECOVERY_SPECIES.map(s => s.iucnId).join(',');
    const url = token
      ? `https://apiv3.iucnredlist.org/api/v3/species/${ids}?token=${token}`
      : `https://apiv3.iucnredlist.org/api/v3/species/${ids}?token=`;

    const resp = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) return DEMO_ITEMS;
    const data = await resp.json();
    const result = data.result || data.Result || [];

    return result.map((sp: { taxonid?: number; scientific_name?: string; common_name?: string; category?: string; population_trend?: string; assessed_date?: string }, i: number) => {
      const meta = RECOVERY_SPECIES.find(s => s.iucnId === String(sp.taxonid)) ?? RECOVERY_SPECIES[i] ?? RECOVERY_SPECIES[0];
      const cat = (sp.category || '').toUpperCase();
      const statusMap: Record<string, string> = {
        'LC': 'Recovered', 'NT': 'Recovering', 'VU': 'At Risk',
        'EN': 'Endangered', 'CR': 'Critical',
      };
      const status = statusMap[cat] || 'At Risk';
      const pctMap: Record<string, number> = { 'LC': 90, 'NT': 72, 'VU': 50, 'EN': 30, 'CR': 15 };
      return {
        id: `sp-${sp.taxonid || i}`,
        name: sp.common_name || (meta?.name ?? 'Unknown'),
        scientificName: sp.scientific_name || (meta?.scientificName ?? 'Unknown'),
        status,
        recoveryPct: pctMap[cat] || 50,
        populationEstimate: sp.population_trend || 'Unknown',
        region: meta?.region ?? 'Unknown',
        summary: `IUCN status: ${sp.category || 'N/A'}. ${sp.population_trend === 'increasing' ? 'Population trending upward.' : sp.population_trend === 'decreasing' ? 'Population under pressure.' : 'Population trend uncertain.'}`,
      };
    });
  } catch {
    return DEMO_ITEMS;
  }
}

export class SpeciesPanel {
  private container: HTMLElement;
  private items: SpeciesItem[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'Species Recovery', fallback: DEMO_ITEMS},
      () => breaker.execute(fetchSpeciesData, []),
      (data) => Array.isArray(data),
    );
    this.items = result.data;
    this.source = result.source;
  }

  private statusColor(s: string): string {
    if (s === 'Recovered') return 'bg-green-400/10 text-green-400 border border-green-400/20';
    if (s === 'Recovering') return 'bg-primary/10 text-primary border border-primary/20';
    return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
  }

  private progressColor(p: number): string {
    if (p >= 80) return 'bg-green-400';
    if (p >= 50) return 'bg-primary';
    return 'bg-yellow-400';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Species Recovery</h3>
        ${renderDataBadge(this.source)}
      </div>
      ${this.items.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">pets</span>
            <span class="text-xs">No species data available</span>
            <span class="text-[10px] mt-1">IUCN Red List API key required</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.items.map((item, i) => `
          <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5 group cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex justify-between items-start mb-1">
              <div>
                <div class="text-sm font-data-md text-on-surface panel-body group-hover:text-primary transition-colors">${item.name}</div>
                <div class="text-[9px] font-data-md text-on-surface-variant/60 italic">${item.scientificName}</div>
              </div>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data-md border ${this.statusColor(item.status)}">${item.status.toUpperCase()}</span>
            </div>
            <p class="text-[10px] text-on-surface-variant font-body-sm leading-relaxed mb-2">${item.summary}</p>
            <div class="flex items-center gap-3 mb-1.5">
              <div class="flex-1">
                <div class="flex justify-between mb-0.5">
                  <span class="text-[9px] font-label-caps text-on-surface-variant">RECOVERY</span>
                  <span class="text-[10px] font-data-md text-on-surface">${item.recoveryPct}%</span>
                </div>
                <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div class="h-full ${this.progressColor(item.recoveryPct)} rounded-full transition-all duration-1000" style="width: ${item.recoveryPct}%"></div>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 text-[9px] font-data-md text-on-surface-variant">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">public</span> ${item.region}</span>
            </div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
