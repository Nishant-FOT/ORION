import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface TradePolicy {
  name: string;
  type: string;
  status: string;
  detail: string;
  tariff: string;
  icon: string;
}

const DEMO_POLICIES: TradePolicy[] = [
  {
    name: 'US-EU LNG Partnership',
    type: 'Deal',
    status: 'Active',
    detail: 'Long-term LNG supply agreement (2024–2030)',
    tariff: '0%',
    icon: 'handshake',
  },
  {
    name: 'OPEC+ Quota Compliance',
    type: 'Quota',
    status: 'Compliant',
    detail: '1.2M bbl/day voluntary cuts through Q4 2026',
    tariff: '—',
    icon: 'group',
  },
  {
    name: 'China Refinery Tariffs',
    type: 'Tariff',
    status: 'Disputed',
    detail: '15% import duty on refined products from US',
    tariff: '15%',
    icon: 'gavel',
  },
  {
    name: 'EU Carbon Border Tax',
    type: 'Regulation',
    status: 'Phasing In',
    detail: 'CBAM applies to energy-intensive imports',
    tariff: '€85/tonne CO₂',
    icon: 'eco',
  },
  {
    name: 'Russia Oil Embargo',
    type: 'Sanction',
    status: 'Enforced',
    detail: 'Full ban on seaborne Russian crude (EU)',
    tariff: 'Ban',
    icon: 'block',
  },
];

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-primary/10 text-primary border border-primary/20',
  Compliant: 'bg-primary/10 text-primary border border-primary/20',
  Disputed: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
  'Phasing In': 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
  Enforced: 'bg-error/10 text-error border border-error/20',
};

export class TradePolicyPanel {
  private container: HTMLElement;
  private policies: TradePolicy[] = DEMO_POLICIES;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'trade-policy', fallback: DEMO_POLICIES},
      async () => {
        const res = await fetch('/api/trade/v1/get-trade-restrictions');
        if (!res.ok) throw new Error('not ok');
        const d = await res.json();
        if (d.unavailable) throw new Error('unavailable');
        const restrictions = (d.restrictions ?? []) as TradePolicy[];
        if (!restrictions.length) return DEMO_POLICIES;
        return restrictions;
      },
      (data) => Array.isArray(data),
    );
    this.policies = data;
    this.source = source;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Trade Policy</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-2">
        ${this.policies.map((p, i) => `
          <div class="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-xs text-on-surface-variant">${p.icon}</span>
                <span class="text-xs text-on-surface font-body-sm font-medium">${p.name}</span>
              </div>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-data-md ${STATUS_STYLES[p.status] ?? 'bg-white/5 text-on-surface-variant'}">${p.status}</span>
            </div>
            <div class="flex items-center justify-between ml-5">
              <span class="text-[9px] text-on-surface-variant font-body-sm">${p.detail}</span>
              <span class="text-[9px] font-data-md text-on-surface-variant px-1.5 py-0.5 rounded bg-white/5">${p.tariff}</span>
            </div>
          </div>`).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
