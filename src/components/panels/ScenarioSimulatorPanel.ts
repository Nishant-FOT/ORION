import { getHydratedData } from '@/services/bootstrap';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface ScenarioInput {
  name: string;
  description: string;
  inputs: Array<{ label: string; value: string; type: 'slider' | 'dropdown' | 'toggle' }>;
  outcomes: Array<{ label: string; value: string; direction: 'up' | 'down' | 'neutral' }>;
}

const DEMO_SCENARIO: ScenarioInput = {
  name: 'Strait of Hormuz Blockade',
  description: 'Complete closure of the Strait of Hormuz for 30 days',
  inputs: [
    { label: 'Disruption Duration', value: '30 days', type: 'dropdown' },
    { label: 'Oil Flow Reduction', value: '80%', type: 'slider' },
    { label: 'SPR Release', value: 'Off', type: 'toggle' },
    { label: 'Diplomatic Resolution', value: 'None', type: 'dropdown' },
  ],
  outcomes: [
    { label: 'Oil Price Change', value: '+45%', direction: 'up' },
    { label: 'GDP Impact', value: '-0.3%', direction: 'down' },
    { label: 'CPI Increase', value: '+2.1%', direction: 'up' },
    { label: 'Shipping Cost', value: '+120%', direction: 'up' },
    { label: 'Supply Cover', value: '18 days', direction: 'down' },
  ],
};

export class ScenarioSimulatorPanel {
  private container: HTMLElement;
  private scenario: ScenarioInput = DEMO_SCENARIO;
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const { data, source } = await fetchPanelData(
      { name: 'scenario-simulator', fallback: DEMO_SCENARIO},
      async () => {
        const energyData = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; value: number }> } | undefined;
        const brentPrice = energyData?.prices?.find(p => p.commodity === 'RBRTE');
        if (!brentPrice) {
          return DEMO_SCENARIO;
        }
        const price = Number(brentPrice.value);
        return {
          ...DEMO_SCENARIO,
          name: `Strait of Hormuz Blockade (Brent: $${price.toFixed(2)})`,
          outcomes: DEMO_SCENARIO.outcomes.map(o => {
            if (o.label === 'Oil Price Change') {
              return { ...o, value: `+$${Math.round(price * 0.45)}/bbl` };
            }
            return o;
          }),
        } as ScenarioInput;
      },
      (d) => d !== DEMO_SCENARIO,
    );
    this.scenario = data;
    this.source = source;
  }

  private directionColor(d: string): string {
    if (d === 'up') return 'text-error';
    if (d === 'down') return 'text-primary';
    return 'text-on-surface';
  }

  private directionIcon(d: string): string {
    if (d === 'up') return 'trending_up';
    if (d === 'down') return 'trending_down';
    return 'trending_flat';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Scenario Simulator</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        <div class="bg-white/5 hover:bg-white/10 transition-all p-3 rounded-xl border border-white/5" style="animation: fadeInUp 0.3s ease-out 0s both;">
          <div class="text-sm font-data-md text-on-surface panel-body mb-1">${this.scenario.name}</div>
          <p class="text-[11px] text-on-surface-variant font-body-sm mb-3">${this.scenario.description}</p>
          <div class="flex flex-wrap gap-1.5 mb-3">
            ${this.scenario.inputs.map(inp => `
              <div class="px-2 py-1 bg-white/5 rounded-lg flex items-center gap-1.5">
                <span class="text-[9px] font-label-caps text-on-surface-variant">${inp.label}</span>
                <span class="text-[10px] font-data-md text-on-surface">${inp.value}</span>
              </div>
            `).join('')}
          </div>
          <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">PROJECTED OUTCOMES</div>
          <div class="grid grid-cols-2 gap-2">
            ${this.scenario.outcomes.map((o, i) => `
              <div class="bg-white/5 rounded-lg p-2 text-center" style="animation: fadeInUp 0.3s ease-out ${0.15 + 0.05 * i}s both;">
                <div class="text-[9px] font-label-caps text-on-surface-variant mb-1">${o.label.toUpperCase()}</div>
                <div class="flex items-center justify-center gap-1">
                  <span class="material-symbols-outlined text-sm ${this.directionColor(o.direction)}">${this.directionIcon(o.direction)}</span>
                  <span class="text-lg font-data-lg ${this.directionColor(o.direction)}">${o.value}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
