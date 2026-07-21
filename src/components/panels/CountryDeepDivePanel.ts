import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface AnalysisSection { id: string; title: string; icon: string; summary: string; keyPoints: string[]; trend: string; riskLevel: string; }

interface CountryDeepData { sections: AnalysisSection[]; }

const COUNTRY_DEEP_DATA: Record<string, CountryDeepData> = {
  US: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Divided government with narrow legislative margins. Midterm dynamics shaping policy priorities. Bipartisan consensus on strategic competition.', keyPoints: ['Congressional polarization sustained', 'Executive order volume elevated', 'Judicial appointments pace steady'], trend: 'stable', riskLevel: 'low' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Labor market tight, consumer spending resilient. Interest rate path dependent on inflation trajectory. Manufacturing reshoring accelerating.', keyPoints: ['GDP growth ~2.1% annualized', 'Unemployment near historical lows', 'Trade deficit narrowing gradually'], trend: 'rising', riskLevel: 'low' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Force readiness improved across domains. Indo-Pacific posture strengthened with new basing agreements. Nuclear modernization on track.', keyPoints: ['Pacific Deterrence Initiative funded', 'Submarine production ramp-up', 'Space Force capabilities expanding'], trend: 'rising', riskLevel: 'low' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Immigration policy remains contentious. Education and healthcare costs drive domestic debate. Public trust in institutions slowly recovering.', keyPoints: ['Border policy under active litigation', 'Tech sector layoffs stabilizing', 'Drug policy reform progressing'], trend: 'stable', riskLevel: 'low' },
    ],
  },
  CN: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Leadership consolidation continues. Policy focus on self-sufficiency and technological sovereignty. Diplomatic assertiveness increasing.', keyPoints: ['Central authority reinforced', 'Belt & Road recalibrated', 'Taiwan policy hardened'], trend: 'rising', riskLevel: 'high' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Property sector deleveraging ongoing. Consumer confidence recovering slowly. Export diversification reducing US dependency.', keyPoints: ['GDP growth ~4.8%', 'Youth unemployment elevated', 'EV exports surging globally'], trend: 'declining', riskLevel: 'medium' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Rapid modernization across all domains. Naval expansion continues at record pace. A2/AD capabilities strengthening in Western Pacific.', keyPoints: ['Third aircraft carrier operational', 'Hypersonic weapons deployed', 'Cyber and space capabilities growing'], trend: 'rising', riskLevel: 'high' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Demographic headwinds intensifying with population decline. Urban-rural divide persistent. Digital surveillance infrastructure mature.', keyPoints: ['Birth rate continues declining', 'Tech regulation evolving', 'Rural revitalization push'], trend: 'declining', riskLevel: 'medium' },
    ],
  },
  RU: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Consolidation of executive power continues with limited opposition. Election cycles managed through institutional control.', keyPoints: ['Parliamentary majority maintained', 'Opposition figures marginalized', 'Regional governor appointments centralized'], trend: 'stable', riskLevel: 'medium' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Sanctions pressure persists but economy adapted through trade pivot to Asia. Energy revenues remain primary income source.', keyPoints: ['GDP growth at 1.8% projected', 'Rublev volatility contained', 'Shadow fleet operations continue'], trend: 'declining', riskLevel: 'high' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Armed forces restructured for sustained operations. Force generation targets met through contract and mobilization mix.', keyPoints: ['Nuclear arsenal modernization ongoing', 'Black Sea Fleet repositioned', 'Arctic military buildup accelerated'], trend: 'rising', riskLevel: 'critical' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Civil society constraints tightened. Brain drain continues but managed through targeted incentives for skilled workers.', keyPoints: ['Internet restrictions expanded', 'Emigration controls tightened', 'Military family support expanded'], trend: 'declining', riskLevel: 'medium' },
    ],
  },
  IR: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Hardline governance consolidated. Reformist faction marginalized. Regional proxy strategy continues through allied militias.', keyPoints: ['Supreme authority unchallenged', 'Parliament compliant', 'Proxy network active'], trend: 'stable', riskLevel: 'high' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Sanctions regime severely constraining formal economy. Inflation persistent. Oil exports to China providing revenue floor.', keyPoints: ['Inflation at 42% annually', 'Rial under pressure', 'Oil exports ~1.4M bpd'], trend: 'declining', riskLevel: 'critical' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Ballistic missile and drone capabilities expanding. Nuclear program advancing. IRGC maintains asymmetric warfare focus.', keyPoints: ['Enrichment at 60%+ uranium', 'Drone exports to Russia', 'Naval harassment in Persian Gulf'], trend: 'rising', riskLevel: 'critical' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Periodic protests suppressed. Youth discontent significant. Internet restrictions maintained but circumvention widespread.', keyPoints: ['Protest movements repressed', 'Brain drain accelerating', 'Digital censorship persistent'], trend: 'declining', riskLevel: 'high' },
    ],
  },
  UA: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Wartime governance with martial law extended. International support maintained. Anti-corruption reforms progressing under EU accession pressure.', keyPoints: ['Martial law in effect', 'EU accession negotiations active', 'Western aid disbursement tied to reforms'], trend: 'stable', riskLevel: 'critical' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'War-damaged but resilient. Agricultural exports recovering through alternative corridors. Reconstruction planning advancing.', keyPoints: ['GDP contraction moderating', 'Grain corridor functioning', 'Reconstruction fund established'], trend: 'declining', riskLevel: 'critical' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Defensive lines holding with Western equipment. Counteroffensive operations selective. Long-range strike capability growing.', keyPoints: ['F-16 operations commenced', 'Drone warfare leadership', 'Fortification lines expanding'], trend: 'rising', riskLevel: 'critical' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Population displacement ongoing. National cohesion strong despite fatigue. Volunteer and diaspora support substantial.', keyPoints: ['Internal displacement managed', 'Diaspora remittances flowing', 'Cultural identity reinforced'], trend: 'stable', riskLevel: 'high' },
    ],
  },
  IL: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Coalition government under strain from multiple security fronts. Judicial reform controversy continues. Regional normalization stalled.', keyPoints: ['Coalition fractures visible', 'Judicial overhaul paused', 'Abraham Accords frozen'], trend: 'declining', riskLevel: 'high' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Tech sector resilient despite conflict. Military spending elevated. Tourism recovery interrupted by security situation.', keyPoints: ['Tech exports stable', 'Defense budget at 8.5% GDP', 'Startup ecosystem active'], trend: 'stable', riskLevel: 'medium' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Multi-front operational tempo elevated. Intelligence capabilities demonstrated. Iron Dome and Arrow systems under sustained use.', keyPoints: ['Gaza operations ongoing', 'Hezbollah deterrence managed', 'Air defense sustainability tested'], trend: 'rising', riskLevel: 'critical' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Society polarized on judicial and war policy. Hostage crisis dominating public discourse. Reserve duty burden heavy.', keyPoints: ['Judicial reform divide deepens', 'Hostage negotiations active', 'Reserve call-up fatigue'], trend: 'declining', riskLevel: 'high' },
    ],
  },
  DE: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Coalition government navigating economic headwinds. Rise of AfD reshaping political landscape. Defense spending commitments expanding.', keyPoints: ['AfD polling elevated', 'Traffic light coalition strained', 'Defense modernization funded'], trend: 'declining', riskLevel: 'medium' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Industrial core under pressure from energy costs and Chinese competition. Automotive transition underway. Recession risk elevated.', keyPoints: ['Manufacturing PMI contraction', 'Energy costs above peers', 'EV transition accelerating'], trend: 'declining', riskLevel: 'medium' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Bundeswehr revitalization underway with €100B fund. NATO eastern flank contributions increasing.', keyPoints: ['Zeitenwende implementation', 'F-35 procurement progressing', 'NATO readiness enhanced'], trend: 'rising', riskLevel: 'low' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Immigration debate intensifying. Integration challenges persistent. Green energy transition generating both support and backlash.', keyPoints: ['Asylum policy tightened', 'Farmer protests occurred', 'Digital infrastructure lagging'], trend: 'stable', riskLevel: 'medium' },
    ],
  },
  JP: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'LDP dominance stable post-election. Constitutional revision debate revived by security environment. Alliance with US deepening.', keyPoints: ['LDP coalition secure', 'Defense posture shifting', 'US alliance strengthened'], trend: 'stable', riskLevel: 'low' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Yen weakness benefiting exporters but straining imports. BOJ cautiously normalizing policy. Wage growth finally materializing.', keyPoints: ['BOJ rate normalization started', 'Yen at 155+ range', 'Wage hikes exceeding 3%'], trend: 'rising', riskLevel: 'medium' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Historic defense buildup with counterstrike capability. Record defense budgets. Alliance interoperability enhanced.', keyPoints: ['Defense budget doubled to 2% GDP', 'Tomahawk cruise missiles acquired', '西南諸島 defenses expanded'], trend: 'rising', riskLevel: 'low' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Demographic crisis deepening. Immigration policy slowly loosening. Tourism boom offsetting some population decline effects.', keyPoints: ['Population declining 800K/year', 'Foreign worker intake increased', 'Rural depopulation accelerating'], trend: 'declining', riskLevel: 'medium' },
    ],
  },
  GB: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'New government addressing inherited fiscal constraints. Policy reset on industrial strategy. Relations with EU improving.', keyPoints: ['New PM policy agenda', 'EU reset negotiations', 'Devolution pressures persistent'], trend: 'stable', riskLevel: 'low' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Growth sluggish but stable. Inflation controlled. Public investment constrained by fiscal rules. Financial services resilient.', keyPoints: ['GDP growth ~1.0%', 'Inflation at target', 'NHS funding pressure'], trend: 'stable', riskLevel: 'medium' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Nuclear deterrent renewal ongoing. Force size reduction concerns. Strong intelligence and cyber capabilities.', keyPoints: ['Dreadnought submarine program', 'AUKUS partnership active', 'Intelligence community strong'], trend: 'stable', riskLevel: 'low' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Cost-of-living pressures easing but public services strained. Immigration remains contentious topic. NHS backlogs significant.', keyPoints: ['Public sector pay disputes', 'NHS waiting lists persistent', 'Housing affordability crisis'], trend: 'stable', riskLevel: 'medium' },
    ],
  },
  SA: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'MBS consolidation complete. Vision 2030 transformation accelerating. Regional diplomatic positioning evolving.', keyPoints: ['Vision 2030 advancing', 'Iran diplomatic channel open', 'Regional leadership asserted'], trend: 'rising', riskLevel: 'medium' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Oil production strategic at ~9M bpd. PIF investments diversifying revenue. Mega-projects progressing on schedule.', keyPoints: ['Oil revenues stable', 'NEOM construction advancing', 'Tourism sector growing'], trend: 'rising', riskLevel: 'low' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Arms procurement program continues. Houthi conflict demonstrating drone and missile threats. Regional security partnerships active.', keyPoints: ['Arms deals with US active', 'Houthi defense challenging', 'Air defense enhanced'], trend: 'rising', riskLevel: 'medium' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Social liberalization continuing cautiously. Female workforce participation rising. Entertainment and cultural sector expanding.', keyPoints: ['Women in workforce growing', 'Entertainment sector booming', 'Social reforms incremental'], trend: 'rising', riskLevel: 'low' },
    ],
  },
  IN: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Coalition government post-election. BJP dominance tempered by coalition partners. Foreign policy assertive and multi-aligned.', keyPoints: ['Coalition dynamics new', 'Opposition strengthening', 'Multi-alignment strategy'], trend: 'stable', riskLevel: 'low' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'GDP growth leading major economies. Manufacturing push through PLI schemes. Digital infrastructure leapfrogging.', keyPoints: ['GDP growth ~6.5%', 'Manufacturing investment rising', 'Digital payments dominant'], trend: 'rising', riskLevel: 'low' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Force modernization accelerating. Domestic defense production expanding. Border infrastructure with China enhanced.', keyPoints: ['Rafale jets operational', 'Tejas Mk2 progressing', 'Border roads upgraded'], trend: 'rising', riskLevel: 'low' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Youth demographic dividend being captured. Digital adoption ubiquitous. Communal tensions managed but persistent.', keyPoints: ['Urbanization accelerating', 'Smart city projects advancing', 'Communal incidents managed'], trend: 'rising', riskLevel: 'medium' },
    ],
  },
  KR: {
    sections: [
      { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Political polarization high. Presidential powers checked by constitutional court. Alliance management with US prioritized.', keyPoints: ['Political divisions deep', 'US alliance managed', 'China relations recalibrated'], trend: 'stable', riskLevel: 'medium' },
      { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Technology exports driving growth. Shipbuilding and semiconductors strong. Demographic challenge intensifying.', keyPoints: ['Semiconductor exports booming', 'Shipbuilding market leader', 'Fertility rate at 0.7'], trend: 'rising', riskLevel: 'medium' },
      { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Modernization against North Korea continuing. Trilateral cooperation with US-Japan expanded. Indigenous capabilities growing.', keyPoints: ['K2 tank exports progressing', 'KF-21 fighter program', 'US extended deterrence'], trend: 'rising', riskLevel: 'medium' },
      { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Demographic crisis the defining challenge. Ultra-low fertility reshaping society. Aging population straining welfare systems.', keyPoints: ['Fertility rate world lowest', 'Immigration policy loosening', 'Elderly poverty rising'], trend: 'declining', riskLevel: 'medium' },
    ],
  },
};

const FALLBACK_SECTIONS: AnalysisSection[] = [
  { id: 'politics', title: 'POLITICAL LANDSCAPE', icon: '🏛', summary: 'Limited intelligence data available for this region. Analysis based on open-source reporting and regional patterns.', keyPoints: ['Political system under review', 'Regional dynamics evolving', 'International relations developing'], trend: 'stable', riskLevel: 'medium' },
  { id: 'economy', title: 'ECONOMIC OUTLOOK', icon: '📊', summary: 'Economic indicators limited. Macroeconomic environment under assessment based on available data.', keyPoints: ['Economic data being compiled', 'Trade patterns assessed', 'Investment climate under review'], trend: 'stable', riskLevel: 'medium' },
  { id: 'military', title: 'MILITARY POSTURE', icon: '⚔️', summary: 'Military capabilities under review. Regional security dynamics being assessed through open-source intelligence.', keyPoints: ['Force structure under analysis', 'Regional security context assessed', 'Defense relationships mapped'], trend: 'stable', riskLevel: 'medium' },
  { id: 'society', title: 'SOCIAL DYNAMICS', icon: '👥', summary: 'Social indicators being compiled. Demographic and cultural trends under assessment.', keyPoints: ['Demographic data gathered', 'Social trends assessed', 'Cultural dynamics mapped'], trend: 'stable', riskLevel: 'medium' },
];

export class CountryDeepDivePanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  countryCode = '';
  countryName = '';
  private sections: AnalysisSection[] = [];

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { await this.fetchData(); this.render(); }

  private async fetchData(): Promise<void> {
    const data = COUNTRY_DEEP_DATA[this.countryCode];
    this.sections = data ? data.sections : FALLBACK_SECTIONS;
  }

  private trendArrow(t: string): string { return t === 'rising' ? '↑' : t === 'declining' ? '↓' : '→'; }
  private trendColor(t: string): string { return t === 'rising' ? 'text-error' : t === 'declining' ? 'text-yellow-400' : 'text-on-surface-variant'; }
  private riskBadge(l: string): string {
    const m: Record<string, string> = { critical: 'bg-error/15 text-error border-error/20', high: 'bg-orange-400/15 text-orange-400 border-orange-400/20', medium: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20', low: 'bg-white/5 text-on-surface-variant border-white/10' };
    return m[l] || 'bg-white/5 text-on-surface-variant border-white/10';
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">Deep Dive</h3>
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">${this.countryName.toUpperCase()}</span>
          ${renderDataBadge(this.source)}
        </div>
      </div>
      <div class="flex flex-col gap-3 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${this.sections.map((s, i) => `
          <div class="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer" style="animation: fadeInUp 0.4s ease-out ${0.08 * i}s both;">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-base">${s.icon}</span>
                <span class="text-[10px] font-label-caps text-on-surface-variant">${s.title}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-label-caps px-2 py-0.5 rounded-md border ${this.riskBadge(s.riskLevel)}">${s.riskLevel.toUpperCase()}</span>
                <span class="text-xs font-data-md ${this.trendColor(s.trend)}">${this.trendArrow(s.trend)}</span>
              </div>
            </div>
            <p class="text-xs text-on-surface-variant mb-2 leading-relaxed">${s.summary}</p>
            <div class="flex flex-col gap-1">
              ${s.keyPoints.map(p => `
                <div class="flex items-start gap-1.5">
                  <span class="text-primary mt-0.5">•</span>
                  <span class="text-[10px] text-on-surface-variant">${p}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  destroy(): void { this.container.innerHTML = ''; }
}
