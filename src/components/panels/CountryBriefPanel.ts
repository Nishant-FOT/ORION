import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface CountryMetric { label: string; value: string; trend?: string; }
interface KeyEvent { date: string; event: string; severity: string; }

interface CountryBriefData {
  country: string;
  population: string;
  gdp: string;
  riskScore: number;
  metrics: CountryMetric[];
  events: KeyEvent[];
}

const COUNTRY_BRIEF_DATA: Record<string, CountryBriefData> = {
  US: {
    country: 'United States', population: '334.9M', gdp: '$28.78T', riskScore: 28,
    metrics: [
      { label: 'MILITARY SPEND', value: '$886B', trend: '↑' },
      { label: 'OIL PRODUCTION', value: '13.2M bpd', trend: '↑' },
      { label: 'INFLATION', value: '3.1%', trend: '↓' },
      { label: 'UNEMPLOYMENT', value: '3.9%', trend: '→' },
    ],
    events: [
      { date: '2026-07-18', event: 'Fed signals rate pause through Q3', severity: 'low' },
      { date: '2026-07-15', event: 'Pacific Deterrence Initiative funding approved', severity: 'medium' },
      { date: '2026-07-12', event: 'New semiconductor export controls announced', severity: 'medium' },
      { date: '2026-07-10', event: 'NATO summit defense commitments', severity: 'low' },
      { date: '2026-07-08', event: 'Border policy executive order signed', severity: 'high' },
    ],
  },
  CN: {
    country: 'China', population: '1.41B', gdp: '$18.53T', riskScore: 62,
    metrics: [
      { label: 'MILITARY SPEND', value: '$296B', trend: '↑' },
      { label: 'OIL IMPORTS', value: '11.3M bpd', trend: '↑' },
      { label: 'INFLATION', value: '0.3%', trend: '↓' },
      { label: 'UNEMPLOYMENT', value: '5.2%', trend: '↑' },
    ],
    events: [
      { date: '2026-07-18', event: 'New naval exercises in Taiwan Strait', severity: 'critical' },
      { date: '2026-07-15', event: 'EU tariff investigation on EV exports', severity: 'high' },
      { date: '2026-07-12', event: 'Belt & Road debt restructuring talks', severity: 'medium' },
      { date: '2026-07-10', event: 'Property sector support measures expanded', severity: 'medium' },
      { date: '2026-07-08', event: 'Semiconductor self-sufficiency targets updated', severity: 'low' },
    ],
  },
  RU: {
    country: 'Russia', population: '144.2M', gdp: '$2.02T', riskScore: 82,
    metrics: [
      { label: 'MILITARY SPEND', value: '$109B', trend: '↑' },
      { label: 'OIL EXPORTS', value: '7.2M bpd', trend: '↓' },
      { label: 'INFLATION', value: '8.6%', trend: '↑' },
      { label: 'UNEMPLOYMENT', value: '2.9%', trend: '→' },
    ],
    events: [
      { date: '2026-07-18', event: 'Shadow fleet expansion detected', severity: 'high' },
      { date: '2026-07-15', event: 'New sanctions evasion routes mapped', severity: 'high' },
      { date: '2026-07-12', event: 'Military recruitment targets exceeded', severity: 'medium' },
      { date: '2026-07-10', event: 'Diplomatic talks with DPRK on defense cooperation', severity: 'critical' },
      { date: '2026-07-08', event: 'Arctic military base construction accelerated', severity: 'medium' },
    ],
  },
  IR: {
    country: 'Iran', population: '87.9M', gdp: '$388B', riskScore: 72,
    metrics: [
      { label: 'MILITARY SPEND', value: '$10.4B', trend: '↑' },
      { label: 'OIL EXPORTS', value: '1.4M bpd', trend: '↓' },
      { label: 'INFLATION', value: '42.0%', trend: '↑' },
      { label: 'UNEMPLOYMENT', value: '9.6%', trend: '↓' },
    ],
    events: [
      { date: '2026-07-15', event: 'IRGC naval exercise in Persian Gulf', severity: 'high' },
      { date: '2026-07-12', event: 'New EU sanctions package announced', severity: 'medium' },
      { date: '2026-07-10', event: 'Diplomatic meeting with Russia in Tehran', severity: 'low' },
      { date: '2026-07-08', event: 'Enriched uranium stockpile update', severity: 'critical' },
      { date: '2026-07-05', event: 'Protests in Isfahan province', severity: 'medium' },
    ],
  },
  UA: {
    country: 'Ukraine', population: '37.0M', gdp: '$178B', riskScore: 88,
    metrics: [
      { label: 'MILITARY SPEND', value: '$43B', trend: '↑' },
      { label: 'GRAIN EXPORTS', value: '4.1M bpd', trend: '↑' },
      { label: 'INFLATION', value: '11.3%', trend: '↓' },
      { label: 'GDP GROWTH', value: '3.2%', trend: '↑' },
    ],
    events: [
      { date: '2026-07-18', event: 'F-16 squadron operational in western Ukraine', severity: 'critical' },
      { date: '2026-07-15', event: 'Drone manufacturing capacity doubled', severity: 'high' },
      { date: '2026-07-12', event: 'EU accession chapter negotiations opened', severity: 'medium' },
      { date: '2026-07-10', event: 'Fortification lines in Zaporizhzhia reinforced', severity: 'high' },
      { date: '2026-07-08', event: 'Reconstruction fund disbursal milestones met', severity: 'low' },
    ],
  },
  IL: {
    country: 'Israel', population: '9.8M', gdp: '$525B', riskScore: 70,
    metrics: [
      { label: 'MILITARY SPEND', value: '$27.6B', trend: '↑' },
      { label: 'TECH EXPORTS', value: '$18.4B', trend: '↑' },
      { label: 'INFLATION', value: '3.4%', trend: '↓' },
      { label: 'UNEMPLOYMENT', value: '3.6%', trend: '→' },
    ],
    events: [
      { date: '2026-07-18', event: 'Iron Dome intercepts from Lebanon border', severity: 'critical' },
      { date: '2026-07-15', event: 'Hostage negotiation updates', severity: 'high' },
      { date: '2026-07-12', event: 'Judicial reform legislation paused', severity: 'medium' },
      { date: '2026-07-10', event: 'Cyber defense partnership with US expanded', severity: 'low' },
      { date: '2026-07-08', event: 'Multi-front operational readiness review', severity: 'high' },
    ],
  },
  DE: {
    country: 'Germany', population: '84.5M', gdp: '$4.46T', riskScore: 32,
    metrics: [
      { label: 'MILITARY SPEND', value: '$73.4B', trend: '↑' },
      { label: 'INDUSTRIAL OUTPUT', value: '-2.1% YoY', trend: '↓' },
      { label: 'INFLATION', value: '2.4%', trend: '↓' },
      { label: 'UNEMPLOYMENT', value: '5.9%', trend: '↑' },
    ],
    events: [
      { date: '2026-07-18', event: 'Zeitenwende defense fund milestone', severity: 'low' },
      { date: '2026-07-15', event: 'AfD polls surge to 22%', severity: 'high' },
      { date: '2026-07-12', event: 'Chinese EV tariff vote in EU Parliament', severity: 'medium' },
      { date: '2026-07-10', event: 'F-35 delivery schedule confirmed', severity: 'low' },
      { date: '2026-07-08', event: 'Industrial energy costs report published', severity: 'medium' },
    ],
  },
  JP: {
    country: 'Japan', population: '124.5M', gdp: '$4.21T', riskScore: 25,
    metrics: [
      { label: 'MILITARY SPEND', value: '$53.6B', trend: '↑' },
      { label: 'EXPORT GROWTH', value: '+6.8% YoY', trend: '↑' },
      { label: 'INFLATION', value: '2.8%', trend: '↓' },
      { label: 'UNEMPLOYMENT', value: '2.5%', trend: '→' },
    ],
    events: [
      { date: '2026-07-18', event: 'Tomahawk cruise missile first deployment', severity: 'medium' },
      { date: '2026-07-15', event: 'BOJ rate decision amid yen weakness', severity: 'medium' },
      { date: '2026-07-12', event: 'US-Japan-South Korea trilateral drill', severity: 'low' },
      { date: '2026-07-10', event: 'Okinawa base relocation progress', severity: 'low' },
      { date: '2026-07-08', event: 'Population decline forecast updated', severity: 'medium' },
    ],
  },
  GB: {
    country: 'United Kingdom', population: '67.7M', gdp: '$3.34T', riskScore: 22,
    metrics: [
      { label: 'MILITARY SPEND', value: '$75.8B', trend: '→' },
      { label: 'GDP GROWTH', value: '+1.0%', trend: '↑' },
      { label: 'INFLATION', value: '2.0%', trend: '↓' },
      { label: 'UNEMPLOYMENT', value: '4.3%', trend: '↑' },
    ],
    events: [
      { date: '2026-07-18', event: 'Dreadnought submarine construction update', severity: 'low' },
      { date: '2026-07-15', event: 'EU reset trade negotiations begin', severity: 'medium' },
      { date: '2026-07-12', event: 'NHS waiting list reduction plan', severity: 'low' },
      { date: '2026-07-10', event: 'AUKUS Pillar II AI collaboration', severity: 'medium' },
      { date: '2026-07-08', event: 'Immigration policy white paper', severity: 'high' },
    ],
  },
  SA: {
    country: 'Saudi Arabia', population: '36.9M', gdp: '$1.11T', riskScore: 45,
    metrics: [
      { label: 'MILITARY SPEND', value: '$75.8B', trend: '↑' },
      { label: 'OIL PRODUCTION', value: '9.0M bpd', trend: '→' },
      { label: 'GDP GROWTH', value: '+1.5%', trend: '↑' },
      { label: 'RESERVES', value: '$444B', trend: '↓' },
    ],
    events: [
      { date: '2026-07-18', event: 'NEOM Phase 2 construction milestone', severity: 'low' },
      { date: '2026-07-15', event: 'OPEC+ production decision review', severity: 'medium' },
      { date: '2026-07-12', event: 'Iran diplomatic channel maintained', severity: 'medium' },
      { date: '2026-07-10', event: 'Houthi Red Sea shipping disruption', severity: 'high' },
      { date: '2026-07-08', event: 'Vision 2030 tourism target update', severity: 'low' },
    ],
  },
  IN: {
    country: 'India', population: '1.44B', gdp: '$3.94T', riskScore: 35,
    metrics: [
      { label: 'MILITARY SPEND', value: '$83.6B', trend: '↑' },
      { label: 'OIL IMPORTS', value: '4.7M bpd', trend: '↑' },
      { label: 'INFLATION', value: '4.8%', trend: '↓' },
      { label: 'GDP GROWTH', value: '+6.5%', trend: '↑' },
    ],
    events: [
      { date: '2026-07-18', event: 'Rafale-M naval fighter squadron formed', severity: 'low' },
      { date: '2026-07-15', event: 'PLI semiconductor fab groundbreaking', severity: 'medium' },
      { date: '2026-07-12', event: 'Quad maritime surveillance expansion', severity: 'medium' },
      { date: '2026-07-10', event: 'Border infrastructure upgrade in Ladakh', severity: 'high' },
      { date: '2026-07-08', event: 'Digital payments volume record', severity: 'low' },
    ],
  },
  KR: {
    country: 'South Korea', population: '51.7M', gdp: '$1.72T', riskScore: 40,
    metrics: [
      { label: 'MILITARY SPEND', value: '$47.9B', trend: '↑' },
      { label: 'SEMICONDUCTOR EXPORTS', value: '$124B', trend: '↑' },
      { label: 'INFLATION', value: '2.6%', trend: '↓' },
      { label: 'FERTILITY RATE', value: '0.72', trend: '↓' },
    ],
    events: [
      { date: '2026-07-18', event: 'KF-21 fighter jet mass production approved', severity: 'medium' },
      { date: '2026-07-15', event: 'US extended deterrence reaffirmed', severity: 'low' },
      { date: '2026-07-12', event: 'North Korean missile test detected', severity: 'critical' },
      { date: '2026-07-10', event: 'K2 tank export deal with Poland advanced', severity: 'medium' },
      { date: '2026-07-08', event: 'Fertility crisis emergency measures announced', severity: 'high' },
    ],
  },
};

const FALLBACK_BRIEF: CountryBriefData = {
  country: 'Unknown', population: 'N/A', gdp: 'N/A', riskScore: 50,
  metrics: [
    { label: 'MILITARY SPEND', value: 'N/A' },
    { label: 'TRADE VOLUME', value: 'N/A' },
    { label: 'INFLATION', value: 'N/A' },
    { label: 'GDP GROWTH', value: 'N/A' },
  ],
  events: [
    { date: '2026-07-18', event: 'Limited intelligence data available', severity: 'low' },
  ],
};

export class CountryBriefPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  countryCode = '';
  countryName = '';
  private population = '';
  private gdp = '';
  private riskScore = 0;
  private metrics: CountryMetric[] = [];
  private events: KeyEvent[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const data = COUNTRY_BRIEF_DATA[this.countryCode.toUpperCase()] ?? FALLBACK_BRIEF;
    this.population = data.population;
    this.gdp = data.gdp;
    this.riskScore = data.riskScore;
    this.metrics = data.metrics;
    this.events = data.events;
  }

  private riskColor(s: number): string { return s >= 70 ? 'text-error' : s >= 50 ? 'text-orange-400' : s >= 30 ? 'text-yellow-400' : 'text-green-400'; }
  private riskBar(s: number): string { return s >= 70 ? 'bg-error' : s >= 50 ? 'bg-orange-400' : s >= 30 ? 'bg-yellow-400' : 'bg-green-400'; }
  private severityBadge(s: string): string {
    const m: Record<string, string> = { critical: 'bg-error/15 text-error border-error/20', high: 'bg-orange-400/15 text-orange-400 border-orange-400/20', medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', low: 'bg-white/5 text-on-surface-variant border-white/10' };
    return m[s] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Country Brief</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${this.countryName.toUpperCase() || this.countryCode.toUpperCase()}</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="panel-grid-inner mb-3">
        <div class="p-3 bg-white/5 rounded-xl text-center">
          <div class="text-[10px] font-label-caps text-on-surface-variant">POPULATION</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.population}</div>
        </div>
        <div class="p-3 bg-white/5 rounded-xl text-center">
          <div class="text-[10px] font-label-caps text-on-surface-variant">GDP</div>
          <div class="text-2xl font-data-lg text-on-surface panel-stat-lg">${this.gdp}</div>
        </div>
      </div>
      <div class="p-3 bg-white/5 rounded-xl mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-label-caps text-on-surface-variant">RISK SCORE</span>
          <span class="text-sm font-data-md ${this.riskColor(this.riskScore)}">${this.riskScore}/100</span>
        </div>
        <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div class="h-full ${this.riskBar(this.riskScore)} rounded-full transition-all duration-1000" style="width: ${this.riskScore}%"></div>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">KEY METRICS</div>
        <div class="grid grid-cols-2 gap-1">
          ${this.metrics.map(m => `
            <div class="p-2 bg-white/5 rounded-lg">
              <div class="text-[9px] font-label-caps text-on-surface-variant">${m.label}</div>
              <div class="flex items-center gap-1">
                <span class="text-sm font-data-md text-on-surface">${m.value}</span>
                ${m.trend ? `<span class="text-[10px] ${m.trend === '↑' ? 'text-error' : 'text-green-400'}">${m.trend}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>
        <div class="text-[10px] font-label-caps text-on-surface-variant mb-2">KEY EVENTS</div>
        <div class="flex flex-col gap-1">
          ${this.events.map((e, i) => `
            <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all" style="animation: fadeInUp 0.3s ease-out ${0.05 * i}s both;">
              <div class="flex-1 min-w-0">
                <div class="text-[10px] text-on-surface-variant">${e.date}</div>
                <div class="text-xs text-on-surface font-body-sm panel-body truncate">${e.event}</div>
              </div>
              <span class="text-[9px] font-label-caps px-1.5 py-0.5 rounded-md border ${this.severityBadge(e.severity)} whitespace-nowrap ml-2">${e.severity.toUpperCase()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
