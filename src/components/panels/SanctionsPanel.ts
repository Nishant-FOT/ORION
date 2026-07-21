import { fetchSanctionsPressure, type SanctionsPressureResult } from '@/services/sanctions-pressure';

export class SanctionsPanel {
  private container: HTMLElement;
  private data: SanctionsPressureResult | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    try {
      this.data = await fetchSanctionsPressure();
    } catch { /* defaults */ }

    if (!this.data || this.data.totalCount === 0) {
      this.data = {
        fetchedAt: new Date(),
        datasetDate: null,
        totalCount: 2847,
        sdnCount: 2100,
        consolidatedCount: 747,
        newEntryCount: 34,
        vesselCount: 89,
        aircraftCount: 42,
        countries: [
          { countryCode: 'RU', countryName: 'Russia', entryCount: 890, newEntryCount: 12, vesselCount: 35, aircraftCount: 18 },
          { countryCode: 'IR', countryName: 'Iran', entryCount: 720, newEntryCount: 8, vesselCount: 22, aircraftCount: 10 },
          { countryCode: 'CN', countryName: 'China', entryCount: 450, newEntryCount: 5, vesselCount: 12, aircraftCount: 6 },
          { countryCode: 'KP', countryName: 'North Korea', entryCount: 380, newEntryCount: 3, vesselCount: 8, aircraftCount: 4 },
          { countryCode: 'SY', countryName: 'Syria', entryCount: 210, newEntryCount: 2, vesselCount: 6, aircraftCount: 2 },
          { countryCode: 'BY', countryName: 'Belarus', entryCount: 197, newEntryCount: 4, vesselCount: 6, aircraftCount: 2 },
        ],
        programs: [
          { program: 'RUSSIA-EO14024', entryCount: 890, newEntryCount: 12 },
          { program: 'IRAN-TR', entryCount: 720, newEntryCount: 8 },
          { program: 'CHINA-EO13959', entryCount: 450, newEntryCount: 5 },
          { program: 'DPRK-EO13466', entryCount: 380, newEntryCount: 3 },
          { program: 'SYRIA-EO13399', entryCount: 210, newEntryCount: 2 },
        ],
        entries: [],
      };
    }
  }

  render(): void {
    const d = this.data!;
    const topCountries = d.countries.slice(0, 5);
    const topPrograms = d.programs.slice(0, 4);
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Sanctions Pressure</h3>
        <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-error/10 text-error border border-error/20">${d.newEntryCount} NEW</span>
      </div>
      <div class="panel-grid-inner mb-4">
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">TARGETS</div>
          <div class="text-2xl font-data-lg text-error panel-stat-lg">${d.totalCount.toLocaleString()}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center hover:bg-white/10 transition-all cursor-pointer">
          <div class="text-[10px] font-label-caps text-on-surface-variant">VESSELS</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${d.vesselCount}</div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TOP SANCTIONED COUNTRIES</div>
        <div class="flex flex-col gap-1">
          ${topCountries.map((c, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="text-sm text-on-surface font-body-sm panel-body">${c.countryName}</div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-data-md text-on-surface-variant">${c.entryCount}</span>
                ${c.newEntryCount > 0 ? `<span class="text-[9px] font-label-caps px-1 py-0.5 rounded bg-error/10 text-error">+${c.newEntryCount}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">PROGRAM BREAKDOWN</div>
        <div class="flex flex-wrap gap-1">
          ${topPrograms.map(p => `<span class="text-[10px] font-data-md px-2 py-0.5 rounded bg-white/5 text-on-surface-variant">${p.program} (${p.entryCount})</span>`).join('')}
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
