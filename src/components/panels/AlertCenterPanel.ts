import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
}

interface AlertEvent {
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  value: number;
  threshold: number;
}

const DEFAULT_RULES: AlertRule[] = [
  { id: 'r1', name: 'Brent > $90', condition: 'Brent crude price exceeds', threshold: 90, severity: 'critical', enabled: true, lastTriggered: '2h ago', triggerCount: 3 },
  { id: 'r2', name: 'Hormuz Risk > 80', condition: 'Hormuz chokepoint risk score exceeds', threshold: 80, severity: 'critical', enabled: true, lastTriggered: '4h ago', triggerCount: 7 },
  { id: 'r3', name: 'SPR Days < 10', condition: 'US SPR cover falls below', threshold: 10, severity: 'high', enabled: true, lastTriggered: '1d ago', triggerCount: 12 },
  { id: 'r4', name: 'VIX > 25', condition: 'VIX fear index exceeds', threshold: 25, severity: 'high', enabled: false, lastTriggered: null, triggerCount: 0 },
  { id: 'r5', name: 'Red Sea Disruption', condition: 'Red Sea shipping disruption detected', threshold: 70, severity: 'high', enabled: true, lastTriggered: '6h ago', triggerCount: 15 },
  { id: 'r6', name: 'INR/USD > 85', condition: 'Indian Rupee depreciation exceeds', threshold: 85, severity: 'medium', enabled: true, lastTriggered: '3d ago', triggerCount: 2 },
];

const RECENT_EVENTS: AlertEvent[] = [
  { ruleId: 'r2', ruleName: 'Hormuz Risk > 80', message: 'Hormuz chokepoint risk at 82/100', severity: 'critical', timestamp: '2h ago', value: 82, threshold: 80 },
  { ruleId: 'r5', ruleName: 'Red Sea Disruption', message: 'Red Sea shipping disruption at 75%', severity: 'high', timestamp: '6h ago', value: 75, threshold: 70 },
  { ruleId: 'r1', ruleName: 'Brent > $90', message: 'Brent crude at $84.50 (approaching threshold)', severity: 'medium', timestamp: '8h ago', value: 84.5, threshold: 90 },
  { ruleId: 'r3', ruleName: 'SPR Days < 10', message: 'US SPR at 9.5 days cover', severity: 'high', timestamp: '1d ago', value: 9.5, threshold: 10 },
];

export class AlertCenterPanel {
  private container: HTMLElement;
  private rules: AlertRule[] = DEFAULT_RULES;
  private events: AlertEvent[] = RECENT_EVENTS;
  private source: DataSource = 'cached';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
    this.startAutoRefresh();
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.fetchData().then(() => this.render());
    }, 300000);
  }

  private async fetchData(): Promise<void> {
    const fallback = { rules: DEFAULT_RULES, events: RECENT_EVENTS };
    const { data, source } = await fetchPanelData(
      { name: 'alert-center', fallback },
      async () => {
        const events = [...RECENT_EVENTS];
        const energyData = getHydratedData('energyPrices') as any;
        const prices: Array<{ commodity: string; price: number }> = energyData?.prices ?? [];
        if (prices.length > 0) {
          const brent = prices.find(p => p.commodity === 'RBRTE');
          const brentVal = brent ? brent.price : 0;
          const threshold = DEFAULT_RULES[0]?.threshold ?? 90;
          if (brent && brentVal > threshold) {
            events.unshift({
              ruleId: 'r1', ruleName: 'Brent > $90',
              message: `Brent crude at $${brentVal.toFixed(2)}`,
              severity: 'critical', timestamp: 'Just now',
              value: brentVal, threshold,
            });
          }
        }
        const inventoriesData = getHydratedData('crudeInventories') as any;
        const inventories: Array<{ period: string; stocksMb: number }> = inventoriesData?.weeks ?? [];
        if (inventories.length > 0) {
          const latest = inventories[0];
          const sprVal = latest?.stocksMb ?? 15;
          if (sprVal < 10) {
            events.unshift({
              ruleId: 'r3', ruleName: 'SPR Days < 10',
              message: `US SPR at ${sprVal.toFixed(1)} days cover`,
              severity: 'high', timestamp: 'Just now',
              value: sprVal, threshold: 10,
            });
          }
        }
        return { rules: DEFAULT_RULES, events: events.slice(0, 10) };
      },
    );
    this.rules = data.rules;
    this.events = data.events;
    this.source = source;
  }

  private sevColor(s: string): string {
    if (s === 'critical') return 'bg-error/10 text-error border border-error/20';
    if (s === 'high') return 'bg-orange-400/10 text-orange-400 border border-orange-400/20';
    if (s === 'medium') return 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20';
    return 'bg-primary/10 text-primary border border-primary/20';
  }

  private sevDot(s: string): string {
    if (s === 'critical') return 'bg-error animate-pulse';
    if (s === 'high') return 'bg-orange-400';
    if (s === 'medium') return 'bg-yellow-400';
    return 'bg-primary';
  }

  render(): void {
    const enabledCount = this.rules.filter(r => r.enabled).length;
    const criticalCount = this.events.filter(e => e.severity === 'critical').length;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Alert Center</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">ACTIVE RULES</div>
          <div class="text-xl font-data-lg text-primary panel-stat-lg">${enabledCount}</div>
        </div>
        <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.05s both;">
          <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">CRITICAL</div>
          <div class="text-xl font-data-lg text-error panel-stat-lg">${criticalCount}</div>
        </div>
        <div class="p-2 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out 0.1s both;">
          <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">EVENTS</div>
          <div class="text-xl font-data-lg text-on-surface panel-stat-lg">${this.events.length}</div>
        </div>
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">RECENT ALERTS</div>
      <div class="flex flex-col gap-1.5 mb-4" style="max-height: 140px; overflow-y: auto;">
        ${this.events.slice(0, 4).map((e, i) => `
          <div class="p-2 bg-white/5 hover:bg-white/10 transition-all rounded-xl flex items-start gap-2 cursor-pointer group" style="animation: fadeInUp 0.3s ease-out ${0.15 + 0.04 * i}s both;">
            <span class="w-1.5 h-1.5 rounded-full ${this.sevDot(e.severity)} mt-1.5 shrink-0"></span>
            <div class="flex-1 min-w-0">
              <div class="text-[10px] text-on-surface font-body-sm truncate">${e.message}</div>
              <div class="text-[9px] text-on-surface-variant/60 font-data-md">${e.ruleName} \u00B7 ${e.timestamp}</div>
            </div>
            <span class="text-[9px] font-data-md ${this.sevColor(e.severity)} px-1.5 py-0.5 rounded shrink-0">${e.severity}</span>
          </div>
        `).join('')}
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">RULES</div>
      <div class="flex flex-col gap-1" style="max-height: calc(100% - 320px); overflow-y: auto;">
        ${this.rules.map((r, i) => `
          <div class="p-2 bg-white/5 hover:bg-white/10 transition-all rounded-xl flex items-center justify-between cursor-pointer group" style="animation: fadeInUp 0.3s ease-out ${0.3 + 0.03 * i}s both;">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <span class="w-1.5 h-1.5 rounded-full ${r.enabled ? this.sevDot(r.severity) : 'bg-white/20'} shrink-0"></span>
              <span class="text-[10px] text-on-surface font-body-sm truncate">${r.name}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] text-on-surface-variant/60 font-data-md">${r.triggerCount}x</span>
              <div class="w-6 h-3.5 rounded-full ${r.enabled ? 'bg-primary/30' : 'bg-white/10'} relative cursor-pointer transition-colors" data-rule-toggle="${r.id}">
                <div class="w-2.5 h-2.5 rounded-full ${r.enabled ? 'bg-primary' : 'bg-white/30'} absolute top-0.5 transition-all ${r.enabled ? 'left-3.5' : 'left-0.5'}"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
