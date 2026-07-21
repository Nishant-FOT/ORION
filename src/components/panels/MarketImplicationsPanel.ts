import { fetchConflictEvents, type ConflictEvent } from '@/services/conflict';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface Implication {
  id: string;
  event: string;
  direction: 'LONG' | 'SHORT' | 'HEDGE';
  asset: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

const DEFENSE_SECTORS = ['RTX', 'LMT', 'NOC', 'BA', 'GD'];
const REGION_ETFS: Record<string, string> = {
  'Syria': 'TUR',
  'Yemen': 'SAU',
  'Sudan': 'EGY',
  'Myanmar': 'THA',
  'Ethiopia': 'KEN',
  'Mali': 'MAR',
  'Somalia': 'KEN',
  'Democratic Republic of Congo': 'ZAF',
  'Nigeria': 'ZAF',
  'Iraq': 'KSA',
  'Pakistan': 'IND',
  'Afghanistan': 'PAK',
  'Ukraine': 'EIDO',
  'Russia': 'RSX',
  'China': 'FXI',
  'Iran': 'GULF',
};

function deterministicDefenseStock(eventId: string): string {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = ((hash << 5) - hash + eventId.charCodeAt(i)) | 0;
  }
  return DEFENSE_SECTORS[Math.abs(hash) % DEFENSE_SECTORS.length] ?? 'LMT';
}

const DEMO_IMPLICATIONS: Implication[] = [
  { id: 'imp-demo-1', event: 'BATTLE in Ukraine', direction: 'LONG', asset: 'RTX', confidence: 'HIGH', rationale: 'High-casualty conflict drives defense spending expectations' },
  { id: 'imp-demo-2', event: 'EXPLOSION in Yemen', direction: 'SHORT', asset: 'SAU', confidence: 'MEDIUM', rationale: 'Regional instability impacts local equity flows' },
  { id: 'imp-demo-3', event: 'BATTLE in Sudan', direction: 'HEDGE', asset: 'GLD', confidence: 'LOW', rationale: 'Geopolitical uncertainty supports safe-haven demand' },
  { id: 'imp-demo-4', event: 'PROTEST in Myanmar', direction: 'HEDGE', asset: 'TLT', confidence: 'LOW', rationale: 'Conflict event may drive risk-off positioning' },
];

function deriveImplication(e: ConflictEvent): Implication {
  const region = e.country;
  const fatalities = e.fatalities;

  if (fatalities >= 50) {
    return {
      id: `imp-${e.id}`,
      event: `${e.eventType.replace(/_/g, ' ')} in ${region}`,
      direction: 'LONG',
      asset: deterministicDefenseStock(e.id),
      confidence: 'HIGH',
      rationale: `High-casualty ${e.eventType.replace(/_/g, ' ')} event drives defense spending expectations`,
    };
  }

  if (fatalities >= 10) {
    const regionEtf = REGION_ETFS[region] || 'EEM';
    return {
      id: `imp-${e.id}`,
      event: `${e.eventType.replace(/_/g, ' ')} in ${region}`,
      direction: 'SHORT',
      asset: regionEtf,
      confidence: 'MEDIUM',
      rationale: `Regional instability may impact local equity flows`,
    };
  }

  if (e.eventType === 'battle' || e.eventType === 'explosion') {
    return {
      id: `imp-${e.id}`,
      event: `${e.eventType.replace(/_/g, ' ')} in ${region}`,
      direction: 'HEDGE',
      asset: 'GLD',
      confidence: 'LOW',
      rationale: `Geopolitical uncertainty supports safe-haven demand`,
    };
  }

  return {
    id: `imp-${e.id}`,
    event: `${e.eventType.replace(/_/g, ' ')} in ${region}`,
    direction: 'HEDGE',
    asset: 'TLT',
    confidence: 'LOW',
    rationale: `Conflict event may drive risk-off positioning`,
  };
}

export class MarketImplicationsPanel {
  private container: HTMLElement;
  private items: Implication[] = [];
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const result = await fetchPanelData(
      { name: 'MarketImplications', fallback: DEMO_IMPLICATIONS},
      async () => {
        const data = await fetchConflictEvents();
        const events = (data.events || [])
          .filter(e => e.fatalities >= 5)
          .sort((a, b) => b.fatalities - a.fatalities)
          .slice(0, 6);
        const result = events.map(deriveImplication);
        return result.length ? result : DEMO_IMPLICATIONS;
      },
      (_items) => true,
    );
    this.items = result.data;
    this.source = result.source;
  }

  private directionStyle(d: string): string {
    if (d === 'LONG') return 'bg-primary/10 text-primary border-primary/20';
    if (d === 'SHORT') return 'bg-error/10 text-error border-error/20';
    return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
  }

  private confidenceColor(c: string): string {
    if (c === 'HIGH') return 'text-primary';
    if (c === 'MEDIUM') return 'text-orange-400';
    return 'text-on-surface-variant';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Market Implications</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
        </div>
      </div>
      ${this.items.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">trending_up</span>
            <span class="text-xs">No market implications available</span>
          </div>`
        : `<div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.items.map((it, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.directionStyle(it.direction)}">${it.direction}</span>
              <span class="text-[10px] font-data-md text-on-surface-variant ml-auto">${it.asset}</span>
            </div>
            <div class="text-sm text-on-surface font-body-sm group-hover:text-primary transition-colors panel-body">${it.event}</div>
            <div class="flex justify-between items-center mt-1.5">
              <span class="text-[10px] text-on-surface-variant font-body-sm">${it.rationale}</span>
              <span class="text-[10px] font-data-md ${this.confidenceColor(it.confidence)}">${it.confidence}</span>
            </div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
