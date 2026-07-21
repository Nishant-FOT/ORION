export class PopulationExposurePanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {}


  render(): void {
    const categories = [
      { label: 'Conflict-Affected', value: '185M', raw: 185, color: 'text-red-400', bg: 'bg-red-500/10', barColor: 'bg-red-500', icon: '⚔', description: 'Living in active conflict zones' },
      { label: 'Climate-Vulnerable', value: '3.3B', raw: 3300, color: 'text-amber-400', bg: 'bg-amber-500/10', barColor: 'bg-amber-500', icon: '🌡', description: 'Exposed to climate hazards' },
      { label: 'Displaced', value: '117M', raw: 117, color: 'text-blue-400', bg: 'bg-blue-500/10', barColor: 'bg-blue-500', icon: '🏠', description: 'Forcibly displaced worldwide' },
      { label: 'Food Insecure', value: '735M', raw: 735, color: 'text-orange-400', bg: 'bg-orange-500/10', barColor: 'bg-orange-500', icon: '🍽', description: 'Facing acute hunger' }
    ];

    const maxRaw = Math.max(...categories.map(c => c.raw));

    const regions = [
      { name: 'Sub-Saharan Africa', conflict: '48M', climate: '1.2B', displaced: '36M', food: '282M' },
      { name: 'South Asia', conflict: '22M', climate: '920M', displaced: '21M', food: '193M' },
      { name: 'Middle East & N. Africa', conflict: '41M', climate: '250M', displaced: '18M', food: '52M' },
      { name: 'East & SE Asia', conflict: '11M', climate: '680M', displaced: '12M', food: '68M' }
    ];

    this.container.innerHTML = `
      <style>
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .panel-fade-in { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes barGrow { from { width: 0; } }
        .bar-grow { animation: barGrow 0.8s ease-out forwards; }
      </style>
      <div class="bg-white/5 rounded-xl p-4 panel-fade-in">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase mb-1">Population Exposure</p>
            <p class="text-2xl font-data-lg text-white">4.3B Total at Risk</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
        </div>

        <div class="space-y-3 mb-4">
          ${categories.map((c, i) => `
            <div class="panel-fade-in" style="animation-delay:${i * 70}ms">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs">${c.icon}</span>
                  <span class="text-[10px] font-label-caps text-slate-300 uppercase">${c.label}</span>
                </div>
                <span class="text-sm font-data-lg ${c.color}">${c.value}</span>
              </div>
              <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full ${c.barColor} rounded-full bar-grow" style="width:${(c.raw / maxRaw) * 100}%; animation-delay:${i * 100 + 200}ms"></div>
              </div>
              <p class="text-[10px] text-slate-500 mt-0.5">${c.description}</p>
            </div>
          `).join('')}
        </div>

        <div class="border-t border-white/10 pt-3 mb-3">
          <p class="text-[10px] font-label-caps tracking-widest text-slate-400 uppercase mb-2">By Region</p>
          <div class="space-y-2">
            ${regions.map((r, i) => `
              <div class="bg-white/5 rounded-lg p-2.5 panel-fade-in" style="animation-delay:${i * 60 + 400}ms">
                <p class="text-[10px] text-white font-medium mb-1.5">${r.name}</p>
                <div class="grid grid-cols-4 gap-1.5 text-center">
                  <div>
                    <p class="text-[10px] font-data-lg text-red-400">${r.conflict}</p>
                    <p class="text-[8px] text-slate-500">Conflict</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-data-lg text-amber-400">${r.climate}</p>
                    <p class="text-[8px] text-slate-500">Climate</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-data-lg text-blue-400">${r.displaced}</p>
                    <p class="text-[8px] text-slate-500">Displaced</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-data-lg text-orange-400">${r.food}</p>
                    <p class="text-[8px] text-slate-500">Food</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <p class="text-[10px] text-slate-600 text-center">Demo data &middot; Sources: IDMC, IPC, UNHCR</p>
      </div>
    `;
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
