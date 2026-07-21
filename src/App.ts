import { PanelFactory } from '@/components/PanelFactory';
import { IntelTicker } from '@/components/IntelTicker';
import { PANEL_CATEGORIES, type PanelCategory } from '@/config/panel-registry';
import { CountryBriefPanel } from '@/components/panels/CountryBriefPanel';
import { CountryDeepDivePanel } from '@/components/panels/CountryDeepDivePanel';

export class App {
  private panelFactory: PanelFactory;
  private intelTicker: IntelTicker | null = null;
  private contentContainer: HTMLElement | null = null;
  private countryBriefOverlay: HTMLElement | null = null;
  private activeBriefPanels: { destroy(): void }[] = [];

  constructor(_containerId: string) {
    this.panelFactory = new PanelFactory();
  }

  async init(): Promise<void> {
    console.log('[ORION] Initializing new UI...');

    this.contentContainer = document.getElementById('main-content');

    const tickerContainer = document.getElementById('intel-ticker');
    if (tickerContainer) {
      this.intelTicker = new IntelTicker(tickerContainer);
      await this.intelTicker.init();
    }

    this.setupNavigation();
    this.setupCountryBriefListener();
    await this.showCategory('map');
  }

  private setupCountryBriefListener(): void {
    window.addEventListener('orion:open-country-brief', ((e: CustomEvent) => {
      const { code, name } = e.detail || {};
      if (code) this.openCountryBrief(code, name);
    }) as EventListener);
  }

  async openCountryBrief(code: string, name?: string): Promise<void> {
    this.closeCountryBrief();

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm';
    overlay.style.animation = 'fadeIn 0.2s ease-out';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeCountryBrief(); });

    const panel = document.createElement('div');
    panel.className = 'relative w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden rounded-3xl bg-[#0a1a2e] border border-white/10 shadow-2xl flex flex-col';
    panel.style.animation = 'slideUp 0.3s ease-out';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-6 py-4 border-b border-white/10';
    const countryCode = code.toUpperCase();
    const flag = String.fromCodePoint(...[...countryCode].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    header.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${flag}</span>
        <div>
          <h2 class="text-lg font-semibold text-on-surface">${name || countryCode}</h2>
          <span class="text-[10px] font-data-md text-on-surface-variant">${countryCode}</span>
        </div>
      </div>
      <button id="country-brief-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    `;
    panel.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4';

    const briefContainer = document.createElement('div');
    briefContainer.className = 'col-span-1';
    const briefPanel = new CountryBriefPanel(briefContainer);
    (briefPanel as any).countryCode = code;
    (briefPanel as any).countryName = name || countryCode;

    const deepDiveContainer = document.createElement('div');
    deepDiveContainer.className = 'col-span-1';
    const deepDivePanel = new CountryDeepDivePanel(deepDiveContainer);
    (deepDivePanel as any).countryCode = code;
    (deepDivePanel as any).countryName = name || countryCode;

    grid.appendChild(briefContainer);
    grid.appendChild(deepDiveContainer);
    panel.appendChild(grid);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    this.countryBriefOverlay = overlay;
    this.activeBriefPanels = [briefPanel, deepDivePanel];

    header.querySelector('#country-brief-close')?.addEventListener('click', () => this.closeCountryBrief());

    await Promise.all([briefPanel.init(), deepDivePanel.init()]);
  }

  closeCountryBrief(): void {
    this.activeBriefPanels.forEach(p => p.destroy());
    this.activeBriefPanels = [];
    this.countryBriefOverlay?.remove();
    this.countryBriefOverlay = null;
  }

  private setupNavigation(): void {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const category = item.getAttribute('data-category') as PanelCategory;
        if (category) {
          await this.showCategory(category);
        }
      });
    });
  }

  private async showCategory(category: PanelCategory): Promise<void> {
    if (!this.contentContainer) return;

    document.querySelectorAll('.nav-item').forEach(item => {
      const cat = item.getAttribute('data-category');
      if (cat === category) {
        item.classList.add('text-primary', 'bg-primary/10');
        item.classList.remove('text-on-surface-variant');
      } else {
        item.classList.remove('text-primary', 'bg-primary/10');
        item.classList.add('text-on-surface-variant');
      }
    });

    this.panelFactory.destroyAll();
    this.contentContainer.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-4 mb-6 pt-2';
    header.innerHTML = `
      <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary text-2xl">${PANEL_CATEGORIES[category].icon}</span>
      </div>
      <div>
        <h1 class="text-headline-md font-headline-md font-semibold text-on-surface">${PANEL_CATEGORIES[category].name}</h1>
        <p class="text-sm text-on-surface-variant font-body-sm">${PANEL_CATEGORIES[category].description}</p>
      </div>
    `;
    this.contentContainer.appendChild(header);

    await this.panelFactory.createCategoryView(category, this.contentContainer);
  }

  destroy(): void {
    this.panelFactory.destroyAll();
    this.intelTicker?.destroy();
  }
}
