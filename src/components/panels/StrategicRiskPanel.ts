import { loadAllCIIData } from '@/services/cii-data-loader';
import { fetchCachedRiskScores } from '@/services/cached-risk-scores';
import { fetchPanelData, renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CountryRisk {
  code: string;
  name: string;
  score: number;
  level: string;
  trend: string;
  ciiScore: number;
}

const LEVEL_COLORS: Record<string, string> = {
  critical: 'bg-error text-white',
  high: 'bg-error/10 text-error border border-error/20',
  elevated: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
  normal: 'bg-primary/10 text-primary border border-primary/20',
  low: 'bg-white/5 text-on-surface-variant border border-white/10',
};

const LEVEL_ICONS: Record<string, string> = {
  critical: 'error',
  high: 'warning',
  elevated: 'info',
  normal: 'check_circle',
  low: 'verified',
};

const TREND_ARROWS: Record<string, string> = {
  rising: '<span class="text-error">&#9650;</span>',
  stable: '<span class="text-on-surface-variant">&#9679;</span>',
  falling: '<span class="text-primary">&#9660;</span>',
};

function getGlobalLevel(score: number): string {
  if (score >= 81) return 'critical';
  if (score >= 66) return 'high';
  if (score >= 51) return 'elevated';
  if (score >= 31) return 'normal';
  return 'low';
}

function getTrendDirection(countries: CountryRisk[]): string {
  const rising = countries.filter(c => c.trend === 'rising').length;
  const falling = countries.filter(c => c.trend === 'falling').length;
  if (rising > falling) return 'rising';
  if (falling > rising) return 'falling';
  return 'stable';
}

const DEMO_RISKS: CountryRisk[] = [
  { code: 'IRQ', name: 'Iraq', score: 92, level: 'critical', trend: 'rising', ciiScore: 92 },
  { code: 'UKR', name: 'Ukraine', score: 85, level: 'critical', trend: 'rising', ciiScore: 85 },
  { code: 'SYR', name: 'Syria', score: 78, level: 'high', trend: 'stable', ciiScore: 78 },
  { code: 'YEM', name: 'Yemen', score: 73, level: 'high', trend: 'rising', ciiScore: 73 },
  { code: 'SOM', name: 'Somalia', score: 64, level: 'elevated', trend: 'rising', ciiScore: 64 },
  { code: 'LBY', name: 'Libya', score: 58, level: 'elevated', trend: 'falling', ciiScore: 58 },
];

export class StrategicRiskPanel {
  private container: HTMLElement;
  private countries: CountryRisk[] = [];
  private globalScore = 0;
  private globalLevel = 'normal';
  private globalTrend = 'stable';
  private source: DataSource = 'cached';

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const fallbackData = {
      countries: DEMO_RISKS,
      globalScore: 75,
      globalLevel: 'elevated' as string,
      globalTrend: 'rising' as string,
    };
    const { data, source } = await fetchPanelData<typeof fallbackData>(
      { name: 'strategic-risk', fallback: fallbackData},
      async () => {
        const localScores = await loadAllCIIData();
        if (localScores.length > 0) {
          const top5 = localScores.sort((a, b) => b.score - a.score).slice(0, 5);
          const countries = top5.map(c => ({
            code: c.code,
            name: c.name,
            score: c.score,
            level: c.level,
            trend: c.trend,
            ciiScore: c.score,
          }));
          const avgScore = top5.reduce((sum, c) => sum + c.score, 0) / top5.length;
          return {
            countries,
            globalScore: Math.round(avgScore),
            globalLevel: getGlobalLevel(Math.round(avgScore)),
            globalTrend: getTrendDirection(countries),
          };
        }

        const riskData = await fetchCachedRiskScores();
        if (riskData && riskData.cii.length > 0) {
          const countries = riskData.cii
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(c => ({
              code: c.code,
              name: c.name,
              score: c.score,
              level: c.level,
              trend: c.trend,
              ciiScore: c.score,
            }));
          return {
            countries,
            globalScore: riskData.strategicRisk.score,
            globalLevel: riskData.strategicRisk.level,
            globalTrend: riskData.strategicRisk.trend,
          };
        }
        return fallbackData;
      },
    );
    this.countries = data.countries;
    this.globalScore = data.globalScore;
    this.globalLevel = data.globalLevel;
    this.globalTrend = data.globalTrend;
    this.source = source;
  }

  render(): void {
    const levelCls = LEVEL_COLORS[this.globalLevel] || LEVEL_COLORS.normal;
    const levelIcon = LEVEL_ICONS[this.globalLevel] || 'help';

    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Strategic Risk</h3>
        <div class="flex items-center gap-2">
          ${renderDataBadge(this.source)}
          <span class="material-symbols-outlined text-on-surface-variant text-sm">shield</span>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl text-center mb-4 hover:bg-white/10 transition-all cursor-pointer">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-1">GLOBAL RISK LEVEL</div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${levelCls}">
          <span class="material-symbols-outlined text-sm">${levelIcon}</span>
          <span class="font-data-md text-xs uppercase">${this.globalLevel}</span>
        </div>
        <div class="text-2xl font-data-lg text-on-surface panel-stat-lg mt-2">${this.globalScore}</div>
        <div class="text-[10px] text-on-surface-variant font-data-md mt-1">${TREND_ARROWS[this.globalTrend]} ${this.globalTrend}</div>
      </div>
      <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">TOP RISK COUNTRIES</div>
      <div class="panel-grid-inner">
        ${this.countries.map((c, i) => {
          const cls = (LEVEL_COLORS[c.level] ?? LEVEL_COLORS.normal) as string;
          return `
            <div class="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.08 * i}s both;">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm font-body-sm text-on-surface panel-body">${c.name}</span>
                </div>
                <span class="text-[9px] font-data-md ${cls} px-1.5 py-0.5 rounded">${c.level.toUpperCase()}</span>
              </div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-lg font-data-lg text-on-surface panel-stat">${c.score}</span>
                <span class="text-[10px] text-on-surface-variant font-data-md">${TREND_ARROWS[c.trend]} ${c.trend}</span>
              </div>
              <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full ${cls.split(' ')[0] ?? 'bg-error'} rounded-full transition-all duration-1000" style="width: ${c.score}%"></div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
