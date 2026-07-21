import { fetchServiceStatuses, type ServiceStatusResult } from '@/services/infrastructure';

type CategoryFilter = 'all' | 'cloud' | 'dev' | 'comm' | 'ai' | 'saas';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  cloud: 'Cloud',
  dev: 'Dev',
  comm: 'Comm',
  ai: 'AI',
  saas: 'SaaS',
};

export class ServiceStatusPanel {
  private container: HTMLElement;
  private services: ServiceStatusResult[] = [];
  private loading = true;
  private error: string | null = null;
  private filter: CategoryFilter = 'all';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> {
    this.render();
    await this.fetchStatus();
  }

  private async fetchStatus(): Promise<void> {
    try {
      const data = await fetchServiceStatuses();
      if (data.success) {
        this.services = data.services;
        this.error = null;
      } else {
        this.error = 'Failed to load status';
      }
    } catch {
      this.error = 'Failed to load status';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private setFilter(filter: CategoryFilter): void {
    this.filter = filter;
    this.render();
  }

  private getFilteredServices(): ServiceStatusResult[] {
    if (this.filter === 'all') return this.services;
    return this.services.filter(s => s.category === this.filter);
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'operational': return '●';
      case 'degraded': return '◐';
      case 'outage': return '○';
      default: return '?';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'operational': return 'text-emerald-400';
      case 'degraded': return 'text-orange-400';
      case 'outage': return 'text-error';
      default: return 'text-on-surface-variant';
    }
  }

  render(): void {
    if (this.loading) {
      this.container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Service Status</h3>
        </div>
        <div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
          <span class="material-symbols-outlined text-2xl mb-2 animate-spin">progress_activity</span>
          <span class="text-xs">Checking services...</span>
        </div>
      `;
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Service Status</h3>
        </div>
        <div class="flex flex-col items-center justify-center py-8 text-on-surface-variant/40">
          <span class="material-symbols-outlined text-2xl mb-2">error</span>
          <span class="text-xs">${this.error}</span>
        </div>
      `;
      return;
    }

    const filtered = this.getFilteredServices();
    const operational = filtered.filter(s => s.status === 'operational').length;
    const degraded = filtered.filter(s => s.status === 'degraded').length;
    const outage = filtered.filter(s => s.status === 'outage').length;

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Service Status</h3>
        <span class="text-xs text-on-surface-variant font-data-md">${this.services.length} services</span>
      </div>
      <div class="flex gap-2 mb-3">
        <div class="flex-1 p-2 bg-emerald-500/10 rounded-lg text-center">
          <div class="text-lg font-data-md text-emerald-400">${operational}</div>
          <div class="text-[9px] text-on-surface-variant">Operational</div>
        </div>
        <div class="flex-1 p-2 bg-orange-400/10 rounded-lg text-center">
          <div class="text-lg font-data-md text-orange-400">${degraded}</div>
          <div class="text-[9px] text-on-surface-variant">Degraded</div>
        </div>
        <div class="flex-1 p-2 bg-error/10 rounded-lg text-center">
          <div class="text-lg font-data-md text-error">${outage}</div>
          <div class="text-[9px] text-on-surface-variant">Outage</div>
        </div>
      </div>
      <div class="flex gap-1 mb-3 flex-wrap">
        ${(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(key => `
          <button data-filter="${key}" class="status-filter-btn px-2 py-1 rounded text-[10px] font-data-md transition-all ${this.filter === key ? 'bg-primary/20 text-primary' : 'bg-white/5 text-on-surface-variant hover:bg-white/10'}">${CATEGORY_LABELS[key]}</button>
        `).join('')}
      </div>
      <div class="flex flex-col gap-1 panel-list" style="max-height: calc(100% - 140px); overflow-y: auto;">
        ${filtered.map((s, i) => `
          <div class="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-all" style="animation: fadeInUp 0.3s ease-out ${0.03 * i}s both;">
            <span class="${this.getStatusColor(s.status)} text-sm">${this.getStatusIcon(s.status)}</span>
            <span class="text-xs text-on-surface font-body-sm flex-grow truncate panel-body">${s.name}</span>
            <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded ${s.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400' : s.status === 'degraded' ? 'bg-orange-400/10 text-orange-400' : 'bg-error/10 text-error'}">${s.status.toUpperCase()}</span>
          </div>
        `).join('')}
      </div>
    `;

    this.container.querySelectorAll('.status-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') as CategoryFilter;
        if (filter) this.setFilter(filter);
      });
    });
  }

  destroy(): void { this.container.innerHTML = ''; }
}
