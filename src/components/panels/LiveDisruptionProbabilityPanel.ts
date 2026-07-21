import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

export class LiveDisruptionProbabilityPanel {
  private container: HTMLElement;

  private compositeScore = 72;
  private confidence = 87;

  private corridors = [
    { name: 'Strait of Hormuz', probability: 85, trend: +12, change24h: +5.2, history: [45, 52, 48, 60, 55, 68, 72, 75, 80, 85] },
    { name: 'Red Sea / Bab-el-Mandeb', probability: 68, trend: -3, change24h: -1.8, history: [55, 60, 72, 75, 70, 65, 62, 66, 70, 68] },
    { name: 'Suez Canal', probability: 42, trend: +2, change24h: +0.5, history: [30, 28, 32, 35, 38, 40, 38, 40, 41, 42] },
    { name: 'Russian ESPO Pipeline', probability: 55, trend: +8, change24h: +3.1, history: [35, 38, 42, 45, 48, 50, 52, 53, 54, 55] },
    { name: 'Malacca Strait', probability: 22, trend: -1, change24h: -0.3, history: [18, 20, 22, 25, 24, 23, 22, 21, 23, 22] },
  ];

  private signals = [
    { name: 'AIS Ship Tracking', status: 'active', dataPoints: '12,847', lastUpdate: '2 min ago', icon: '🚢' },
    { name: 'News Sentiment', status: 'active', dataPoints: '3,291', lastUpdate: '5 min ago', icon: '📰' },
    { name: 'Satellite Imagery', status: 'active', dataPoints: '847', lastUpdate: '15 min ago', icon: '🛰' },
    { name: 'Sanctions Database', status: 'active', dataPoints: '1,203', lastUpdate: '1 hr ago', icon: '⚖️' },
    { name: 'Weather Systems', status: 'active', dataPoints: '2,156', lastUpdate: '30 min ago', icon: '🌡' },
  ];

  private historicalEvents = [
    { event: '2019 Tanker Attacks (Gulf of Oman)', riskAt: 92, current: this.compositeScore, comparison: 'Current risk is 22% lower than peak 2019 levels' },
    { event: '2020 Soleimani Strike', riskAt: 88, current: this.compositeScore, comparison: 'Current risk is 18% lower than post-strike peak' },
    { event: '2023 Houthi Red Sea Crisis', riskAt: 78, current: this.compositeScore, comparison: 'Current risk is 8% lower but trending upward' },
  ];

  private alerts = [
    { level: 'Warning', threshold: 60, current: this.compositeScore, active: this.compositeScore >= 60, color: 'yellow' },
    { level: 'Critical', threshold: 80, current: this.compositeScore, active: this.compositeScore >= 80, color: 'red' },
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
        name: 'LiveDisruptionProbabilityPanel',
        fallback: { compositeScore: this.compositeScore, corridors: this.corridors, historicalEvents: this.historicalEvents, alerts: this.alerts },
      },
      async () => {
        const hydrated = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number }> } | undefined;
        const brent = hydrated?.prices?.find(p => p.commodity === 'RBRTE');
        const wti = hydrated?.prices?.find(p => p.commodity === 'RWTC');
        if (!brent || !wti) return { compositeScore: this.compositeScore, corridors: this.corridors, historicalEvents: this.historicalEvents, alerts: this.alerts };
        const brentPrice = brent.price;
        const wtiPrice = wti.price;
        const spread = Math.abs(brentPrice - wtiPrice);
        const pricePressure = Math.min(20, Math.round(spread * 2));
        const compositeScore = Math.min(100, Math.max(0, this.compositeScore + pricePressure - 10));
        const corridors = this.corridors.map(c => ({
          ...c,
          probability: Math.min(100, Math.max(0, c.probability + Math.round((pricePressure - 10) * (c.probability / 100)))),
        }));
        const historicalEvents = this.historicalEvents.map(e => ({ ...e, current: compositeScore }));
        const alerts = this.alerts.map(a => ({ ...a, current: compositeScore, active: compositeScore >= a.threshold }));
        return { compositeScore, corridors, historicalEvents, alerts };
      },
    );
    this.compositeScore = data.compositeScore;
    this.corridors = data.corridors;
    this.historicalEvents = data.historicalEvents;
    this.alerts = data.alerts;
    this.source = source;
  }

  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => this.fetchData().then(() => this.render()), 300000);
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  }

  private getScoreBg(score: number): string {
    if (score >= 80) return 'stroke-red-500';
    if (score >= 60) return 'stroke-orange-500';
    if (score >= 40) return 'stroke-yellow-500';
    return 'stroke-green-500';
  }

  private getScoreGlow(score: number): string {
    if (score >= 80) return 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    if (score >= 60) return 'drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]';
    if (score >= 40) return 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]';
    return 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]';
  }

  private getTrendIcon(trend: number): string {
    if (trend > 0) return '▲';
    if (trend < 0) return '▼';
    return '—';
  }

  private getTrendColor(trend: number): string {
    if (trend > 5) return 'text-red-400';
    if (trend > 0) return 'text-orange-400';
    if (trend < -5) return 'text-green-400';
    if (trend < 0) return 'text-green-400';
    return 'text-white/40';
  }

  private generateSparkline(data: number[], width: number = 80, height: number = 24): string {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    return `<svg width="${width}" height="${height}" class="inline-block"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" class="${this.getScoreColor(data[data.length - 1] ?? 0)}"/></svg>`;
  }

  private renderGauge(score: number, size: number = 120, label: string = '', isLarge: boolean = false): string {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (score / 100) * circumference;
    const dashArray = `${progress} ${circumference - progress}`;
    const fontSize = isLarge ? 'text-3xl' : 'text-lg';
    const labelSize = isLarge ? 'text-[10px]' : 'text-[8px]';

    return `
      <div class="relative flex flex-col items-center">
        <svg width="${size}" height="${size}" class="${this.getScoreGlow(score)}" style="transform: rotate(-90deg)">
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${isLarge ? 8 : 5}"/>
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" class="${this.getScoreBg(score)}" stroke-width="${isLarge ? 8 : 5}" stroke-linecap="round" stroke-dasharray="${dashArray}" style="transition: stroke-dasharray 1s ease"/>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="${fontSize} font-data-lg ${this.getScoreColor(score)}">${score}</div>
          ${label ? `<div class="${labelSize} font-label-caps text-white/40 mt-0.5">${label}</div>` : ''}
        </div>
      </div>
    `;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
          <h3 class="text-xs font-label-caps text-white/60 tracking-wider">LIVE DISRUPTION PROBABILITY</h3>
          <div class="ml-auto">${renderDataBadge(this.source)}</div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-1 flex flex-col items-center justify-center bg-white/5 rounded-lg p-4 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-3">COMPOSITE DISRUPTION SCORE</div>
            ${this.renderGauge(this.compositeScore, 160, 'RISK', true)}
            <div class="mt-3 text-[10px] text-white/30 font-label-caps">LAST UPDATED: 2 MIN AGO</div>
          </div>

          <div class="lg:col-span-2">
            <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">CORRIDOR PROBABILITIES</h4>
            <div class="space-y-2">
              ${this.corridors.map(c => `
                <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div class="flex items-center justify-between mb-1">
                    <div class="text-sm text-white">${c.name}</div>
                    <div class="flex items-center gap-2">
                      ${this.generateSparkline(c.history)}
                      <span class="text-lg font-data-lg ${this.getScoreColor(c.probability)}">${c.probability}%</span>
                      <span class="text-[10px] ${this.getTrendColor(c.trend)}">${this.getTrendIcon(c.trend)} ${Math.abs(c.trend)}%</span>
                    </div>
                  </div>
                  <div class="w-full bg-white/10 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full ${this.getScoreBg(c.probability).replace('stroke-', 'bg-')}" style="width: ${c.probability}%"></div>
                  </div>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-[10px] text-white/30">24h: ${c.change24h > 0 ? '+' : ''}${c.change24h}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.1s">
          <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">CONFIDENCE & SIGNALS</h4>
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-[10px] font-label-caps text-white/40">MODEL CONFIDENCE</span>
              <span class="text-sm font-data-lg text-emerald-400">${this.confidence}%</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2">
              <div class="h-2 rounded-full bg-emerald-500" style="width: ${this.confidence}%"></div>
            </div>
          </div>
          <div class="space-y-2">
            ${this.signals.map(s => `
              <div class="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm">${s.icon}</span>
                  <span class="text-sm text-white">${s.name}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[10px] text-white/30">${s.dataPoints} pts</span>
                  <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span class="text-[10px] text-white/30">${s.lastUpdate}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.15s">
          <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">HISTORICAL COMPARISON</h4>
          <div class="space-y-3">
            ${this.historicalEvents.map(e => `
              <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs text-white font-semibold">${e.event}</div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-white/40">Peak:</span>
                    <span class="text-sm font-data-lg text-red-400">${e.riskAt}</span>
                  </div>
                </div>
                <div class="w-full bg-white/10 rounded-full h-1.5 mb-1">
                  <div class="h-1.5 rounded-full bg-red-500/50" style="width: ${e.riskAt}%"></div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-white/30">${e.comparison}</span>
                  <span class="text-[10px] ${this.getScoreColor(this.compositeScore)}">Now: ${this.compositeScore}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.2s">
        <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">ALERT THRESHOLDS</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${this.alerts.map(a => `
            <div class="bg-white/5 rounded-lg p-4 border ${a.active ? `border-${a.color}-500/30 bg-${a.color}-500/5` : 'border-white/5'}">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full ${a.active ? `bg-${a.color}-500 animate-pulse` : 'bg-white/20'}"></div>
                  <span class="text-sm text-white font-semibold">${a.level.toUpperCase()} THRESHOLD</span>
                </div>
                <span class="text-lg font-data-lg ${a.active ? `text-${a.color}-400` : 'text-white/30'}">${a.threshold}</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-2 mb-1">
                <div class="h-2 rounded-full ${a.active ? `bg-${a.color}-500` : 'bg-white/20'}" style="width: ${Math.min(100, (a.current / a.threshold) * 100)}%"></div>
              </div>
              <div class="text-[10px] ${a.active ? `text-${a.color}-400` : 'text-white/30'}">
                ${a.active ? `⚠ ACTIVE — Current score ${a.current} exceeds ${a.threshold} threshold` : `✓ OK — Current score ${a.current} below ${a.threshold} threshold`}
              </div>
            </div>
          `).join('')}
          <div class="bg-white/5 rounded-lg p-4 border border-emerald-500/20 bg-emerald-500/5">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span class="text-sm text-white font-semibold">NORMAL RANGE</span>
              </div>
              <span class="text-lg font-data-lg text-emerald-400">0-59</span>
            </div>
            <div class="w-full bg-white/10 rounded-full h-2 mb-1">
              <div class="h-2 rounded-full bg-emerald-500" style="width: ${this.compositeScore <= 59 ? '100' : '0'}%"></div>
            </div>
            <div class="text-[10px] ${this.compositeScore <= 59 ? 'text-emerald-400' : 'text-white/30'}">
              ${this.compositeScore <= 59 ? '✓ ACTIVE — Score within normal operating range' : `✗ EXCEEDED — Score ${this.compositeScore} above normal range`}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.container.innerHTML = '';
  }
}
