import { renderDataBadge, type DataSource } from '@/services/panel-data-loader';

interface MarketCentre {
  city: string;
  timezone: string;
  exchange: string;
  openHour: number;
  closeHour: number;
}

const MARKET_CENTRES: MarketCentre[] = [
  { city: 'New York', timezone: 'America/New_York', exchange: 'NYSE', openHour: 9, closeHour: 16 },
  { city: 'Chicago', timezone: 'America/Chicago', exchange: 'CME', openHour: 8, closeHour: 15 },
  { city: 'Toronto', timezone: 'America/Toronto', exchange: 'TSX', openHour: 9, closeHour: 16 },
  { city: 'São Paulo', timezone: 'America/Sao_Paulo', exchange: 'B3', openHour: 10, closeHour: 17 },
  { city: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', exchange: 'BYMA', openHour: 11, closeHour: 17 },
  { city: 'London', timezone: 'Europe/London', exchange: 'LSE', openHour: 8, closeHour: 16 },
  { city: 'Paris', timezone: 'Europe/Paris', exchange: 'Euronext', openHour: 9, closeHour: 17 },
  { city: 'Frankfurt', timezone: 'Europe/Berlin', exchange: 'XETRA', openHour: 9, closeHour: 17 },
  { city: 'Amsterdam', timezone: 'Europe/Amsterdam', exchange: 'AEX', openHour: 9, closeHour: 17 },
  { city: 'Zurich', timezone: 'Europe/Zurich', exchange: 'SIX', openHour: 9, closeHour: 17 },
  { city: 'Milan', timezone: 'Europe/Rome', exchange: 'Euronext Milan', openHour: 9, closeHour: 17 },
  { city: 'Madrid', timezone: 'Europe/Madrid', exchange: 'BME', openHour: 9, closeHour: 17 },
  { city: 'Stockholm', timezone: 'Europe/Stockholm', exchange: 'OMX', openHour: 9, closeHour: 17 },
  { city: 'Copenhagen', timezone: 'Europe/Copenhagen', exchange: 'OMXC', openHour: 9, closeHour: 17 },
  { city: 'Helsinki', timezone: 'Europe/Helsinki', exchange: 'OMXH', openHour: 10, closeHour: 18 },
  { city: 'Moscow', timezone: 'Europe/Moscow', exchange: 'MOEX', openHour: 10, closeHour: 18 },
  { city: 'Istanbul', timezone: 'Europe/Istanbul', exchange: 'BIST', openHour: 10, closeHour: 18 },
  { city: 'Dubai', timezone: 'Asia/Dubai', exchange: 'DFM', openHour: 10, closeHour: 14 },
  { city: 'Riyadh', timezone: 'Asia/Riyadh', exchange: 'Tadawul', openHour: 10, closeHour: 15 },
  { city: 'Tel Aviv', timezone: 'Asia/Jerusalem', exchange: 'TASE', openHour: 9, closeHour: 17 },
  { city: 'Mumbai', timezone: 'Asia/Kolkata', exchange: 'NSE', openHour: 9, closeHour: 15 },
  { city: 'Shanghai', timezone: 'Asia/Shanghai', exchange: 'SSE', openHour: 9, closeHour: 15 },
  { city: 'Hong Kong', timezone: 'Asia/Hong_Kong', exchange: 'HKEX', openHour: 9, closeHour: 16 },
  { city: 'Tokyo', timezone: 'Asia/Tokyo', exchange: 'TSE', openHour: 9, closeHour: 15 },
  { city: 'Osaka', timezone: 'Asia/Tokyo', exchange: 'OSE', openHour: 9, closeHour: 15 },
  { city: 'Seoul', timezone: 'Asia/Seoul', exchange: 'KRX', openHour: 9, closeHour: 15 },
  { city: 'Singapore', timezone: 'Asia/Singapore', exchange: 'SGX', openHour: 9, closeHour: 17 },
  { city: 'Sydney', timezone: 'Australia/Sydney', exchange: 'ASX', openHour: 10, closeHour: 16 },
  { city: 'Auckland', timezone: 'Pacific/Auckland', exchange: 'NZX', openHour: 10, closeHour: 16 },
  { city: 'Johannesburg', timezone: 'Africa/Johannesburg', exchange: 'JSE', openHour: 9, closeHour: 17 },
];

function isMarketOpen(centre: MarketCentre, now: Date): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric', hour12: false, weekday: 'short', timeZone: centre.timezone,
    }).formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    const day = parts.find(p => p.type === 'weekday')?.value ?? '';
    if (day === 'Sat' || day === 'Sun') return false;
    return hour >= centre.openHour && hour < centre.closeHour;
  } catch {
    return false;
  }
}

function getLocalTime(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: timezone,
    }).format(new Date());
  } catch {
    return '--:--:--';
  }
}

export class WorldClockPanel {
  private container: HTMLElement;
  private source: DataSource = 'cached';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) { this.container = container; }

  async init(): Promise<void> { this.render(); this.startTicking(); }

  private startTicking(): void {
    this.intervalId = setInterval(() => this.render(), 1000);
  }

  private renderRow(centre: MarketCentre, idx: number): string {
    const now = new Date();
    const time = getLocalTime(centre.timezone);
    const open = isMarketOpen(centre, now);
    return `
      <div class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-all cursor-pointer" style="animation: fadeInUp 0.3s ease-out ${0.02 * idx}s both;">
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2 h-2 rounded-full flex-shrink-0 ${open ? 'bg-primary shadow-[0_0_6px_rgba(139,220,150,0.5)]' : 'bg-white/20'}"></span>
          <span class="text-xs text-on-surface font-body-sm truncate">${centre.city}</span>
          <span class="text-[9px] font-data-md text-on-surface-variant px-1.5 py-0.5 rounded bg-white/5">${centre.exchange}</span>
        </div>
        <div class="text-right flex-shrink-0">
          <div class="text-xs font-data-md text-on-surface">${time}</div>
          <div class="text-[9px] font-data-md ${open ? 'text-primary' : 'text-on-surface-variant'}">${open ? 'OPEN' : 'CLOSED'}</div>
        </div>
      </div>`;
  }

  render(): void {
    this.container.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest panel-header">World Clock</h3>
        ${renderDataBadge(this.source)}
      </div>
      <div class="flex flex-col gap-0.5 panel-list" style="max-height: calc(100% - 48px); overflow-y: auto;">
        ${MARKET_CENTRES.map((c, i) => this.renderRow(c, i)).join('')}
      </div>`;
  }

  destroy(): void {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    this.container.innerHTML = '';
  }
}
