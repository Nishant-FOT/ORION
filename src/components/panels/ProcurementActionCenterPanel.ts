import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

export class ProcurementActionCenterPanel {
  private container: HTMLElement;

  private contracts = [
    { id: 'OC-001', source: 'Iraq', grade: 'Basra Light', volume: '2.1M bbl/mo', price: '$81.20/bbl', status: 'active', expiry: 'Dec 2026' },
    { id: 'OC-002', source: 'Saudi Arabia', grade: 'Arab Light', volume: '1.5M bbl/mo', price: '$82.50/bbl', status: 'active', expiry: 'Mar 2027' },
    { id: 'OC-003', source: 'UAE', grade: 'Murban', volume: '0.8M bbl/mo', price: '$83.10/bbl', status: 'negotiating', expiry: 'Sep 2026' },
  ];

  private spotPurchases = [
    { source: 'Nigeria', grade: 'Qua Iboe', volume: '500K bbl', price: '$84.30/bbl', delivery: 'Aug 2026' },
    { source: 'Algeria', grade: 'Saharan Blend', volume: '300K bbl', price: '$83.80/bbl', delivery: 'Sep 2026' },
  ];

  private recommendedActions = [
    { rank: 1, action: 'Secure Emergency Spot Cargo', source: 'West Africa — Bonny Light', volume: '1.2M bbl', premium: '+$2.50 vs Brent', timeline: '25 days', risk: 'medium', rationale: 'Hormuz alternative, established trade route, competitive freight.' },
    { rank: 2, action: 'Extend Term Contract', source: 'Saudi Arabia — Arab Light', volume: '500K bbl/mo', premium: '+$0.80 vs Brent', timeline: '30 days', risk: 'low', rationale: 'Expand existing relationship, stable supply, favorable terms.' },
    { rank: 3, action: 'Diversify to Americas', source: 'Brazil — Buzios FPSO', volume: '800K bbl', premium: '+$0.80 vs Brent', timeline: '28 days', risk: 'low', rationale: 'Non-Middle East origin, pre-salt quality, growing production.' },
    { rank: 4, action: 'Engage Guyana Production', source: 'Guyana — Liza crude', volume: '600K bbl', premium: '+$1.20 vs Brent', timeline: '30 days', risk: 'medium', rationale: 'New producer, growing output, competitive pricing.' },
    { rank: 5, action: 'Emergency UAE Allocation', source: 'UAE — Murban', volume: '400K bbl', premium: '+$1.50 vs Brent', timeline: '12 days', risk: 'low', rationale: 'Proximity, established infrastructure, quick turnaround.' },
  ];

  private alternatives = [
    { country: 'West Africa', grade: 'Bonny Light', premium: '+$2.50', transit: '25 days', reliability: 88, note: 'Nigerian Light Sweet, low sulfur' },
    { country: 'US Gulf Coast', grade: 'WTI Midland', premium: '+$3.80', transit: '35 days', reliability: 95, note: 'Very low sulfur, high API gravity' },
    { country: 'Guyana', grade: 'Liza', premium: '+$1.20', transit: '30 days', reliability: 72, note: 'New production, growing output' },
    { country: 'Brazil', grade: 'Buzios', premium: '+$0.80', transit: '28 days', reliability: 90, note: 'Pre-salt quality, stable production' },
    { country: 'Mexico', grade: 'Maya', premium: '+$1.50', transit: '32 days', reliability: 78, note: 'Medium sour, well-established trade' },
  ];

  private tankers = [
    { name: 'VLCC Suezmax-1', type: 'VLCC', capacity: '2M bbl', location: 'Persian Gulf', status: 'available', eta: '3 days' },
    { name: 'Aframax Med-3', type: 'Aframax', capacity: '750K bbl', location: 'Mediterranean', status: 'booked', eta: '12 days' },
    { name: 'Suezmax WA-7', type: 'Suezmax', capacity: '1M bbl', location: 'West Africa', status: 'available', eta: '5 days' },
  ];

  private portCongestion = [
    { port: 'Jamnagar', congestion: 'High', waitTime: '48 hrs', capacity: '85%' },
    { port: 'Mumbai', congestion: 'Medium', waitTime: '24 hrs', capacity: '68%' },
    { port: 'Vishakhapatnam', congestion: 'Low', waitTime: '8 hrs', capacity: '42%' },
    { port: 'Kochi', congestion: 'Medium', waitTime: '18 hrs', capacity: '55%' },
  ];

  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      {
        name: 'ProcurementActionCenterPanel',
        fallback: { contracts: this.contracts, spotPurchases: this.spotPurchases },
      },
      async () => {
        const hydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
        const brent = hydrated?.prices?.find(p => p.commodity === 'RBRTE');
        if (!brent) return { contracts: this.contracts, spotPurchases: this.spotPurchases };
        const brentPrice = brent.price;
        const contracts = this.contracts.map(c => {
          const currentPrice = parseFloat(c.price.replace('$', '').split('/')[0] ?? '82');
          return { ...c, price: `$${(brentPrice + (currentPrice - 82)).toFixed(2)}/bbl` };
        });
        const spotPurchases = this.spotPurchases.map(s => {
          const currentPrice = parseFloat(s.price.replace('$', '').split('/')[0] ?? '82');
          return { ...s, price: `$${(brentPrice + (currentPrice - 82)).toFixed(2)}/bbl` };
        });
        return { contracts, spotPurchases };
      },
    );
    this.contracts = data.contracts;
    this.spotPurchases = data.spotPurchases;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private getRiskColor(risk: string): string {
    const map: Record<string, string> = { low: 'text-green-400 bg-green-500/10 border-green-500/20', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', high: 'text-orange-400 bg-orange-500/10 border-orange-500/20', critical: 'text-red-400 bg-red-500/10 border-red-500/20' };
    return map[risk] ?? map.low ?? '';
  }

  private getCongestionColor(level: string): string {
    const map: Record<string, string> = { Low: 'text-green-400', Medium: 'text-yellow-400', High: 'text-orange-400', Critical: 'text-red-400' };
    return map[level] || 'text-white/40';
  }

  private getStatusColor(status: string): string {
    const map: Record<string, string> = { active: 'text-green-400 bg-green-500/10', negotiating: 'text-yellow-400 bg-yellow-500/10', available: 'text-green-400 bg-green-500/10', booked: 'text-yellow-400 bg-yellow-500/10' };
    return map[status] || 'text-white/40 bg-white/5';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          <h3 class="text-xs font-label-caps text-white/60 tracking-wider">PROCUREMENT ACTION CENTER</h3>
          <div class="ml-auto">${renderDataBadge(this.source)}</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">ACTIVE CONTRACTS</div>
            <div class="text-2xl font-data-lg text-white">${this.contracts.length}</div>
            <div class="text-[10px] text-white/30 mt-1">4.4M bbl/month secured</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">SPOT PURCHASES</div>
            <div class="text-2xl font-data-lg text-emerald-400">${this.spotPurchases.length}</div>
            <div class="text-[10px] text-white/30 mt-1">800K bbl in pipeline</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">RECOMMENDED ACTIONS</div>
            <div class="text-2xl font-data-lg text-purple-400">${this.recommendedActions.length}</div>
            <div class="text-[10px] text-white/30 mt-1">3.5M bbl opportunity</div>
          </div>
        </div>
      </div>

      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp" style="animation-delay: 0.1s">
        <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">CURRENT CONTRACTS</h4>
        <div class="space-y-2">
          ${this.contracts.map(c => `
            <div class="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span class="text-xs font-bold text-emerald-400">${c.source.charAt(0)}</span>
                </div>
                <div>
                  <div class="text-sm text-white">${c.source} — ${c.grade}</div>
                  <div class="text-[10px] text-white/40">${c.id} • Expires ${c.expiry}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-data-lg text-white">${c.volume}</div>
                <div class="text-[10px] text-emerald-400">${c.price}</div>
              </div>
              <span class="px-2 py-0.5 text-[10px] font-label-caps rounded-full ${this.getStatusColor(c.status)}">${c.status.toUpperCase()}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp" style="animation-delay: 0.15s">
        <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">SPOT PURCHASES</h4>
        <div class="space-y-2">
          ${this.spotPurchases.map(s => `
            <div class="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span class="text-xs font-bold text-blue-400">${s.source.charAt(0)}</span>
                </div>
                <div>
                  <div class="text-sm text-white">${s.source} — ${s.grade}</div>
                  <div class="text-[10px] text-white/40">Delivery: ${s.delivery}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-data-lg text-white">${s.volume}</div>
                <div class="text-[10px] text-emerald-400">${s.price}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp" style="animation-delay: 0.2s">
        <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">RECOMMENDED PROCUREMENT ACTIONS</h4>
        <div class="space-y-3">
          ${this.recommendedActions.map(a => `
            <div class="bg-white/5 rounded-lg p-4 border border-white/5 hover:border-emerald-500/20 transition-colors cursor-pointer group">
              <div class="flex items-start justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span class="text-xs font-bold text-emerald-400">${a.rank}</span>
                  </div>
                  <div>
                    <div class="text-sm text-white font-semibold">${a.action}</div>
                    <div class="text-[10px] text-white/40">${a.source}</div>
                  </div>
                </div>
                <span class="px-2 py-0.5 text-[10px] font-label-caps rounded-full border ${this.getRiskColor(a.risk)}">${a.risk.toUpperCase()}</span>
              </div>
              <div class="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <div class="text-[10px] font-label-caps text-white/40">VOLUME</div>
                  <div class="text-sm font-data-lg text-white">${a.volume}</div>
                </div>
                <div>
                  <div class="text-[10px] font-label-caps text-white/40">PREMIUM</div>
                  <div class="text-sm font-data-lg text-emerald-400">${a.premium}</div>
                </div>
                <div>
                  <div class="text-[10px] font-label-caps text-white/40">TIMELINE</div>
                  <div class="text-sm font-data-lg text-white">${a.timeline}</div>
                </div>
              </div>
              <div class="text-[10px] text-white/40 mt-2 italic">${a.rationale}</div>
              <button data-execute="${a.rank}" class="mt-3 w-full py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded text-[10px] font-label-caps tracking-wider transition-colors opacity-0 group-hover:opacity-100">EXECUTE ACTION</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp" style="animation-delay: 0.25s">
        <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">ALTERNATIVE SOURCES</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-white/10">
                <th class="py-2 text-[10px] font-label-caps text-white/40">COUNTRY</th>
                <th class="py-2 text-[10px] font-label-caps text-white/40">GRADE</th>
                <th class="py-2 text-[10px] font-label-caps text-white/40">PREMIUM</th>
                <th class="py-2 text-[10px] font-label-caps text-white/40">TRANSIT</th>
                <th class="py-2 text-[10px] font-label-caps text-white/40">RELIABILITY</th>
                <th class="py-2 text-[10px] font-label-caps text-white/40">NOTE</th>
              </tr>
            </thead>
            <tbody>
              ${this.alternatives.map(a => `
                <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="py-2.5 text-sm text-white">${a.country}</td>
                  <td class="py-2.5 text-sm text-white/60">${a.grade}</td>
                  <td class="py-2.5 text-sm text-emerald-400 font-data-lg">${a.premium}</td>
                  <td class="py-2.5 text-sm text-white/60">${a.transit}</td>
                  <td class="py-2.5">
                    <div class="flex items-center gap-2">
                      <div class="w-16 bg-white/10 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full ${a.reliability > 85 ? 'bg-green-500' : a.reliability > 70 ? 'bg-yellow-500' : 'bg-orange-500'}" style="width: ${a.reliability}%"></div>
                      </div>
                      <span class="text-[10px] text-white/40">${a.reliability}%</span>
                    </div>
                  </td>
                  <td class="py-2.5 text-[10px] text-white/40">${a.note}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.3s">
          <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">TANKER AVAILABILITY</h4>
          <div class="space-y-2">
            ${this.tankers.map(t => `
              <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-sm text-white">${t.name}</div>
                  <span class="px-2 py-0.5 text-[10px] font-label-caps rounded-full ${this.getStatusColor(t.status)}">${t.status.toUpperCase()}</span>
                </div>
                <div class="flex items-center gap-4 text-[10px] text-white/40">
                  <span>${t.type} • ${t.capacity}</span>
                  <span>📍 ${t.location}</span>
                  <span>ETA: ${t.eta}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.35s">
          <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">PORT CONGESTION</h4>
          <div class="space-y-2">
            ${this.portCongestion.map(p => `
              <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                <div class="flex items-center justify-between mb-1">
                  <div class="text-sm text-white">${p.port}</div>
                  <span class="text-[10px] font-label-caps ${this.getCongestionColor(p.congestion)}">${p.congestion.toUpperCase()}</span>
                </div>
                <div class="flex items-center gap-4 text-[10px] text-white/40 mb-2">
                  <span>Wait: ${p.waitTime}</span>
                  <span>Capacity: ${p.capacity}</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full ${parseInt(p.capacity) > 75 ? 'bg-orange-500' : parseInt(p.capacity) > 50 ? 'bg-yellow-500' : 'bg-green-500'}" style="width: ${p.capacity}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    this.container.querySelectorAll('[data-execute]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = this.recommendedActions.find(a => a.rank === Number(btn.getAttribute('data-execute')));
        if (action) {
          btn.textContent = 'ACTION QUEUED';
          (btn as HTMLElement).classList.remove('bg-emerald-600/20', 'hover:bg-emerald-600/30');
          (btn as HTMLElement).classList.add('bg-emerald-600/40');
          (btn as HTMLElement).style.opacity = '1';
        }
      });
    });
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
