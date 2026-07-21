import { getHydratedData } from '@/services/bootstrap';

interface StablecoinData {
  totalMcap: number;
  usdt: { mcap: number; dominance: number };
  usdc: { mcap: number; dominance: number };
  supplyChange30d: number;
  historicalMcap: number[];
}

const EMPTY_DATA: StablecoinData = {
  totalMcap: 0,
  usdt: { mcap: 0, dominance: 0 },
  usdc: { mcap: 0, dominance: 0 },
  supplyChange30d: 0,
  historicalMcap: [],
};

export class StablecoinsPanel {
  private container: HTMLElement;
  private data: StablecoinData = EMPTY_DATA;
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const raw = getHydratedData('stablecoinMarkets') as { summary?: { totalMarketCap?: number }; stablecoins?: Array<{ name: string; symbol: string; marketCap?: number }> } | undefined;
      if (raw?.summary?.totalMarketCap && raw.summary.totalMarketCap > 0) {
        const totalMcap = raw.summary.totalMarketCap;
        const stablecoins = raw.stablecoins ?? [];
        const usdt = stablecoins.find(s => s.symbol?.toUpperCase() === 'USDT' || s.name?.toLowerCase() === 'tether');
        const usdc = stablecoins.find(s => s.symbol?.toUpperCase() === 'USDC' || s.name?.toLowerCase() === 'usd coin');
        const usdtMcap = (usdt?.marketCap ?? 0) / 1e9;
        const usdcMcap = (usdc?.marketCap ?? 0) / 1e9;
        this.data = {
          totalMcap: Math.round(totalMcap / 1e9),
          usdt: { mcap: Math.round(usdtMcap), dominance: Math.round((usdtMcap / (totalMcap / 1e9)) * 1000) / 10 },
          usdc: { mcap: Math.round(usdcMcap), dominance: Math.round((usdcMcap / (totalMcap / 1e9)) * 1000) / 10 },
          supplyChange30d: 0,
          historicalMcap: [Math.round(totalMcap / 1e9)],
        };
        this.isLive = true;
      }
    } catch { /* no data available */ }
  }

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
      <circle cx="${(data.length - 1) * step}" cy="${h - (((data[data.length - 1] ?? 0) - min) / range) * h}" r="2.5" fill="#84cc16"/>
    </svg>`;
  }

  render(): void {
    const d = this.data;
    const live = this.isLive;
    const hasData = d.totalMcap > 0;
    const other = d.totalMcap - d.usdt.mcap - d.usdc.mcap;

    let body = '';
    if (hasData) {
      body = `
      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all mb-3" style="animation: fadeInUp 0.3s ease-out;">
        <div class="text-[10px] font-label-caps text-on-surface-variant">TOTAL MARKET CAP</div>
        <div class="text-3xl font-data-lg text-on-surface panel-stat-lg">$${d.totalMcap}B</div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-[10px] font-data-md text-primary">30d: ${d.supplyChange30d >= 0 ? '+' : ''}$${Math.abs(d.supplyChange30d).toFixed(1)}B</span>
        </div>
        <div class="mt-2">${this.miniSparkline(d.historicalMcap)}</div>
      </div>

      <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">DOMINANCE</div>
        <div class="flex items-center gap-2 mb-2">
          <div class="flex-1 bg-white/5 rounded-full h-3">
            <div class="flex h-3 rounded-full overflow-hidden">
              <div class="bg-primary/70 h-3" style="width: ${d.usdt.dominance}%"></div>
              <div class="bg-blue-400/70 h-3" style="width: ${d.usdc.dominance}%"></div>
              <div class="bg-yellow-400/70 h-3" style="width: ${100 - d.usdt.dominance - d.usdc.dominance}%"></div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-primary/70"></span>
            <span class="text-[10px] font-data-md text-on-surface-variant">USDT</span>
            <span class="text-[10px] font-data-md text-on-surface">$${d.usdt.mcap}B</span>
            <span class="text-[10px] font-data-md text-on-surface-variant/60">${d.usdt.dominance}%</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-blue-400/70"></span>
            <span class="text-[10px] font-data-md text-on-surface-variant">USDC</span>
            <span class="text-[10px] font-data-md text-on-surface">$${d.usdc.mcap}B</span>
            <span class="text-[10px] font-data-md text-on-surface-variant/60">${d.usdc.dominance}%</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-yellow-400/70"></span>
            <span class="text-[10px] font-data-md text-on-surface-variant">OTHER</span>
            <span class="text-[10px] font-data-md text-on-surface-variant/60">$${other.toFixed(0)}B</span>
          </div>
        </div>
      </div>`;
    } else {
      body = '<div class="flex items-center justify-center h-32 text-on-surface-variant text-xs">No stablecoin data available</div>';
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Stablecoins</h3>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${live ? 'bg-primary animate-pulse' : 'bg-white/30'}"></span>
          <span class="text-[10px] font-data-md ${live ? 'text-primary' : 'text-on-surface-variant/60'}">${live ? 'LIVE' : 'NO DATA'}</span>
        </div>
      </div>
      ${body}`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
