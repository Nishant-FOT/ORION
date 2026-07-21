import { fetchCyberThreats } from '@/services/cyber';
import type { CyberThreat } from '@/types';

export class CyberThreatsPanel {
  private container: HTMLElement;
  private threats: CyberThreat[] = [];
  private isLive = false;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      const data = await fetchCyberThreats({ limit: 20 });
      if (data?.length) {
        this.threats = data.slice(0, 8);
        this.isLive = true;
      }
    } catch { /* empty */ }
  }

  private sevBadge(s: string): string {
    if (s === 'critical') return 'bg-error/10 text-error border-error/20';
    if (s === 'high') return 'bg-orange-400/10 text-orange-400 border-orange-400/20';
    if (s === 'medium') return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
    return 'bg-white/5 text-on-surface-variant border-white/10';
  }

  private typeIcon(t: string): string {
    if (t === 'c2_server') return 'dns';
    if (t === 'malware_host') return 'bug_report';
    if (t === 'phishing') return 'phishing';
    return 'link';
  }

  private typeLabel(t: string): string {
    if (t === 'c2_server') return 'C2';
    if (t === 'malware_host') return 'MALWARE';
    if (t === 'phishing') return 'PHISH';
    return 'URL';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Cyber Threats</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-data-md text-on-surface-variant">${this.threats.length} indicators</span>
          <span class="w-2 h-2 rounded-full ${this.isLive ? 'bg-error animate-pulse' : 'bg-white/30'}"></span>
        </div>
      </div>
      ${this.threats.length === 0
        ? `<div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
            <span class="material-symbols-outlined text-2xl mb-2">security</span>
            <span class="text-xs">No cyber threat data available</span>
          </div>`
        : `<div class="flex flex-col gap-2 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.threats.map((t, i) => `
          <div class="p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm text-on-surface-variant">${this.typeIcon(t.type)}</span>
                <span class="text-[10px] font-label-caps px-1.5 py-0.5 rounded bg-white/5 text-on-surface-variant border border-white/10">${this.typeLabel(t.type)}</span>
                <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.sevBadge(t.severity)}">${t.severity.toUpperCase()}</span>
              </div>
              ${t.country ? `<span class="text-[10px] font-data-md text-on-surface-variant">${t.country}</span>` : ''}
            </div>
            <div class="text-xs text-on-surface font-body-sm font-mono truncate panel-body">${t.indicator}</div>
            <div class="flex items-center gap-3 mt-1 text-[10px] font-data-md text-on-surface-variant">
              ${t.malwareFamily ? `<span class="text-orange-400">${t.malwareFamily}</span>` : ''}
              <span>${t.source}</span>
              ${t.firstSeen ? `<span>${new Date(t.firstSeen).toLocaleDateString()}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`}
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
