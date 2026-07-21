import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

function getFredObs(key: string): Array<{ date: string; value: string }> {
  const raw = getHydratedData(key) as { series?: { observations?: Array<{ date: string; value: string }> } } | undefined;
  return raw?.series?.observations ?? [];
}

interface LiquidityData {
  fedBalanceSheet: number;
  fedChange: number;
  m2: number;
  m2Change: number;
  reverseRepo: number;
  rrChange: number;
  onRrpTrend: number[];
}

const DEMO: LiquidityData = {
  fedBalanceSheet: 7.2,
  fedChange: -0.03,
  m2: 21.3,
  m2Change: 0.15,
  reverseRepo: 200,
  rrChange: -28,
  onRrpTrend: [245, 238, 225, 218, 210, 205, 200, 195, 192, 188, 185, 180],
};

export class LiquidityShiftsPanel {
  private container: HTMLElement;
  private data: LiquidityData = DEMO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'liquidity-shifts', fallback: DEMO},
      async () => {
        const walcl = getFredObs('fredWalcl');
        const m2sl = getFredObs('fredM2sl');
        const rrpValues = [200];
        const latestWalcl = parseFloat(walcl[0]?.value ?? '0');
        const prevWalcl = parseFloat(walcl[1]?.value ?? '0');
        const latestM2 = parseFloat(m2sl[0]?.value ?? '0');
        const prevM2 = parseFloat(m2sl[1]?.value ?? '0');
        const latestRrp = rrpValues[0] ?? 200;
        const prevRrp = rrpValues[1] ?? latestRrp;
        return {
          fedBalanceSheet: Math.round(latestWalcl / 1000 * 100) / 100,
          fedChange: Math.round((latestWalcl - prevWalcl) / 1000 * 100) / 100,
          m2: Math.round(latestM2 / 1000 * 10) / 10,
          m2Change: Math.round((latestM2 - prevM2) / 1000 * 100) / 100,
          reverseRepo: Math.round(latestRrp),
          rrChange: Math.round(latestRrp - prevRrp),
          onRrpTrend: rrpValues.slice(0, 12).reverse(),
        } as LiquidityData;
      },
      (d) => !!d.fedBalanceSheet,
    );
    this.data = data;
    this.source = source;
  }

  private fmt(v: number): string { return `$${v.toFixed(1)}T`; }

  private miniSparkline(data: number[]): string {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 120;
    const h = 32;
    const step = w / (data.length - 1);
    const points = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" class="w-full" style="height: 32px;">
      <polyline points="${points}" fill="none" stroke="#84cc16" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="${(data.length - 1) * step}" cy="${h - (((data[data.length - 1] ?? min) - min) / range) * h}" r="2.5" fill="#84cc16"/>
    </svg>`;
  }

  render(): void {
    const d = this.data;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Liquidity Shifts</h3>
        ${renderDataBadge(this.source)}
      </div>

      <div class="flex flex-col gap-2.5" style="animation: fadeInUp 0.3s ease-out;">
        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-label-caps text-on-surface-variant">FED BALANCE SHEET</span>
            <span class="text-[10px] font-data-md text-error">${d.fedChange > 0 ? '+' : ''}${d.fedChange.toFixed(2)}T/wk</span>
          </div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat">${this.fmt(d.fedBalanceSheet)}</div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-label-caps text-on-surface-variant">M2 MONEY SUPPLY</span>
            <span class="text-[10px] font-data-md text-primary">+${d.m2Change.toFixed(2)}T</span>
          </div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat">${this.fmt(d.m2)}</div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-label-caps text-on-surface-variant">REVERSE REPO</span>
            <span class="text-[10px] font-data-md ${d.rrChange > 0 ? 'text-primary' : 'text-error'}">${d.rrChange > 0 ? '+' : ''}${d.rrChange}B</span>
          </div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat">$${d.reverseRepo}B</div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">ON RRP TREND</div>
          ${this.miniSparkline(d.onRrpTrend)}
        </div>
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
