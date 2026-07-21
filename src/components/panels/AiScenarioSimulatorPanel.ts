import { getHydratedData } from '@/services/bootstrap';
import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';
import { externalApiUrl } from '@/services/live-data-service';

export class AiScenarioSimulatorPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private scenarios = [
    { id: 'hormuz', name: 'Hormuz Full Closure', probability: 85, bblRisk: '4.5M bbl/day', severity: 'critical', brentImpact: '+65%', dailyCostImpact: '+$292M', supplyGap: '1.8M bbl/day', daysToStabilize: 45 },
    { id: 'redsea', name: 'Red Sea Shipping Suspension', probability: 68, bblRisk: '1.2M bbl/day rerouted via Cape', severity: 'high', brentImpact: '+18%', dailyCostImpact: '+$89M', supplyGap: '0.3M bbl/day', daysToStabilize: 20 },
    { id: 'opec', name: 'OPEC+ Emergency Cut', probability: 42, bblRisk: '-2M bbl/day', severity: 'high', brentImpact: '+32%', dailyCostImpact: '+$145M', supplyGap: '0.8M bbl/day', daysToStabilize: 60 },
    { id: 'iranus', name: 'Iran-US Military Escalation', probability: 75, bblRisk: 'Brent +35%', severity: 'critical', brentImpact: '+35%', dailyCostImpact: '+$176M', supplyGap: '1.0M bbl/day', daysToStabilize: 30 },
    { id: 'russia', name: 'Russian Oil Sanctions Tightening', probability: 55, bblRisk: 'ESPO supply at risk', severity: 'medium', brentImpact: '+22%', dailyCostImpact: '+$98M', supplyGap: '0.5M bbl/day', daysToStabilize: 40 },
  ];

  private selectedScenario = this.scenarios[0]!;
  private aiResponse = '';
  private isLoading = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    this.render();
  }

  private async analyzeWithAI(): Promise<void> {
    this.isLoading = true;
    this.render();

    let currentBrent = 82;
    try {
      const raw = getHydratedData('energyPrices') as { prices?: Array<{ commodity: string; price: number | string }> } | undefined;
      const brentPrice = raw?.prices?.find(p => p.commodity === 'RBRTE' || p.commodity.includes('Brent'));
      currentBrent = brentPrice ? Number(brentPrice.price) : 82;
    } catch { /* use default */ }

    try {
      const response = await fetch(externalApiUrl('https://api.groq.com/openai/v1/chat/completions', '/api/groq-api'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an energy supply chain analyst for India. Analyze the scenario and provide: 1) Impact assessment, 2) Price projection, 3) Recommended actions, 4) Risk mitigation steps. Be concise and data-driven.' },
            { role: 'user', content: `Analyze this energy disruption scenario: ${this.selectedScenario.name}. Probability: ${this.selectedScenario.probability}%. Volume at risk: ${this.selectedScenario.bblRisk}. India imports 4.5M bbl/day, 88% from imports, 40-45% via Hormuz. SPR has 9.5 days cover. Brent currently at $${currentBrent}/bbl.` }
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      this.aiResponse = data.choices?.[0]?.message?.content || '';
      if (!this.aiResponse) {
        throw new Error('empty response');
      }
    } catch (err) {
      this.aiResponse = `**Offline Analysis — ${this.selectedScenario.name}**\n\n**1) Impact Assessment:** Severe disruption to Indian crude supply. ${this.selectedScenario.bblRisk} at risk with Brent projected to ${this.selectedScenario.brentImpact}. Daily cost increase estimated at ${this.selectedScenario.dailyCostImpact}.\n\n**2) Price Projection:** Brent likely to spike from $${currentBrent}/bbl to approximately $${Math.round(currentBrent * (1 + parseFloat(this.selectedScenario.brentImpact.replace('%', '')) / 100))}/bbl within 72 hours of event.\n\n**3) Recommended Actions:**\n• Activate SPR drawdown (9.5 days cover available)\n• Engage emergency bilateral agreements with UAE, Saudi Arabia\n• Reroute existing cargoes via Cape of Good Hope\n• Coordinate with refinery output reduction\n\n**4) Risk Mitigation:** Diversify import corridors, increase SPR capacity to 30 days, fast-track Indian Strategic Pipeline.`;
    } finally {
      this.isLoading = false;
      this.render();
    }
  }

  private getSeverityColor(severity: string): string {
    const map: Record<string, string> = { critical: 'bg-red-500/20 text-red-400 border-red-500/30', high: 'bg-orange-500/20 text-orange-400 border-orange-500/30', medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', low: 'bg-green-500/20 text-green-400 border-green-500/30' };
    return map[severity] || map.low || '';
  }

  private formatAIResponse(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n•/g, '<br>•')
      .replace(/\n\d\)/g, (m) => `<br>${m.trim()}`);
  }

  render(): void {
    const s = this.selectedScenario;
    this.container.innerHTML = `
      <div class="bg-white/5 rounded-xl p-5 mb-4 fadeInUp">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
          <h3 class="text-xs font-label-caps text-white/60 tracking-wider">AI SCENARIO SIMULATOR</h3>
          ${renderDataBadge(this.source)}
        </div>

        <div class="flex gap-2 mb-4">
          <select id="scenarioSelect" class="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors">
            ${this.scenarios.map(sc => `<option value="${sc.id}" ${sc.id === s.id ? 'selected' : ''}>${sc.name} (${sc.probability}%)</option>`).join('')}
          </select>
          <button id="analyzeBtn" class="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${this.isLoading ? 'opacity-50 cursor-wait' : ''}">
            ${this.isLoading ? '<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>' : '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'}
            ${this.isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">BRENT IMPACT</div>
            <div class="text-2xl font-data-lg text-white">${s.brentImpact}</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">DAILY COST</div>
            <div class="text-2xl font-data-lg text-orange-400">${s.dailyCostImpact}</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">SUPPLY GAP</div>
            <div class="text-2xl font-data-lg text-red-400">${s.supplyGap}</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="text-[10px] font-label-caps text-white/40 mb-1">STABILIZE</div>
            <div class="text-2xl font-data-lg text-yellow-400">${s.daysToStabilize}d</div>
          </div>
        </div>

        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-label-caps text-white/40">SEVERITY:</span>
          <span class="px-2 py-0.5 text-[10px] font-label-caps rounded-full border ${this.getSeverityColor(s.severity)}">${s.severity.toUpperCase()}</span>
          <span class="text-[10px] font-label-caps text-white/40 ml-2">PROBABILITY:</span>
          <span class="text-sm font-data-lg text-white">${s.probability}%</span>
        </div>
        <div class="w-full bg-white/10 rounded-full h-1.5 mb-4">
          <div class="h-1.5 rounded-full ${s.severity === 'critical' ? 'bg-red-500' : s.severity === 'high' ? 'bg-orange-500' : s.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}" style="width: ${s.probability}%"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.1s">
          <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">IMPACT ASSESSMENT</h4>
          <div class="space-y-3">
            <div class="bg-white/5 rounded-lg p-3 border border-white/5">
              <div class="text-[10px] font-label-caps text-white/40 mb-1">AT-RISK VOLUME</div>
              <div class="text-lg font-data-lg text-white">${s.bblRisk}</div>
            </div>
            <div class="bg-white/5 rounded-lg p-3 border border-white/5">
              <div class="text-[10px] font-label-caps text-white/40 mb-1">SPR COVER</div>
              <div class="flex items-center gap-2">
                <div class="text-lg font-data-lg text-yellow-400">9.5 days</div>
                <span class="text-[10px] font-label-caps text-white/30">vs 30-day target</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-1 mt-2">
                <div class="h-1 rounded-full bg-yellow-500" style="width: 31.7%"></div>
              </div>
            </div>
            <div class="bg-white/5 rounded-lg p-3 border border-white/5">
              <div class="text-[10px] font-label-caps text-white/40 mb-1">IMPORT DEPENDENCY</div>
              <div class="flex items-center gap-2">
                <div class="text-lg font-data-lg text-orange-400">88%</div>
                <span class="text-[10px] font-label-caps text-white/30">via Hormuz: 40-45%</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-1 mt-2">
                <div class="h-1 rounded-full bg-orange-500" style="width: 88%"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white/5 rounded-xl p-5 fadeInUp" style="animation-delay: 0.2s">
          <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">AI ANALYSIS</h4>
          <div class="min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar">
            ${this.isLoading ? `
              <div class="flex flex-col items-center justify-center h-[300px]">
                <svg class="animate-spin w-8 h-8 text-purple-400 mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <div class="text-xs text-white/40 font-label-caps">ANALYZING SCENARIO...</div>
              </div>
            ` : this.aiResponse ? `
              <div class="text-sm text-white/70 leading-relaxed">
                <p class="mb-2">${this.formatAIResponse(this.aiResponse)}</p>
              </div>
            ` : `
              <div class="flex flex-col items-center justify-center h-[300px]">
                <svg class="w-12 h-12 text-white/10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                <div class="text-xs text-white/40 font-label-caps">SELECT A SCENARIO AND CLICK ANALYZE</div>
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="bg-white/5 rounded-xl p-5 mt-4 fadeInUp" style="animation-delay: 0.3s">
        <h4 class="text-[10px] font-label-caps text-white/40 mb-3 tracking-wider">RECOMMENDED ACTIONS</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"><span class="text-xs text-red-400 font-bold">1</span></div>
              <span class="text-xs text-white/60 font-label-caps">IMMEDIATE</span>
            </div>
            <div class="text-sm text-white mb-1">SPR Drawdown</div>
            <div class="text-[10px] text-white/40">Release 200K bbl/day from strategic reserves. 9.5 days cover available.</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center"><span class="text-xs text-orange-400 font-bold">2</span></div>
              <span class="text-xs text-white/60 font-label-caps">SHORT-TERM</span>
            </div>
            <div class="text-sm text-white mb-1">Cape Rerouting</div>
            <div class="text-[10px] text-white/40">Reroute existing cargoes via Cape of Good Hope. +12 days transit, +$3.50/bbl freight.</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><span class="text-xs text-yellow-400 font-bold">3</span></div>
              <span class="text-xs text-white/60 font-label-caps">BILATERAL</span>
            </div>
            <div class="text-sm text-white mb-1">Emergency Procurement</div>
            <div class="text-[10px] text-white/40">Activate bilateral supply agreements with UAE, Saudi Arabia, Kuwait for emergency volumes.</div>
          </div>
          <div class="bg-white/5 rounded-lg p-3 border border-white/5">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center"><span class="text-xs text-purple-400 font-bold">4</span></div>
              <span class="text-xs text-white/60 font-label-caps">STRUCTURAL</span>
            </div>
            <div class="text-sm text-white mb-1">SPR Expansion</div>
            <div class="text-[10px] text-white/40">Accelerate strategic storage expansion to 30-day cover. Fast-track Visakhapatnam facility.</div>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#scenarioSelect')?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.selectedScenario = this.scenarios.find(s => s.id === target.value)! || this.scenarios[0];
      this.aiResponse = '';
      this.render();
    });

    this.container.querySelector('#analyzeBtn')?.addEventListener('click', () => {
      if (!this.isLoading) this.analyzeWithAI();
    });
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
