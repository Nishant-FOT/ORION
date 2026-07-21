const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY ?? '9bc1a3dd697254576e404709a6508dd6';
const EIA_API_KEY = import.meta.env.VITE_EIA_API_KEY ?? 'Lo8qbX5wTDsdNeFjoo32F7p7Kz7CDY7T47TUvOWM';
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY ?? 'd8v8ffhr01quam158hagd8v8ffhr01quam158hb0';

export function isDesktopRuntimeLocal(): boolean {
  if (typeof window === 'undefined') return false;
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window
    || window.navigator?.userAgent?.includes('Tauri')
    || window.location?.protocol === 'tauri:'
    || window.location?.protocol === 'asset:';
}

export function externalApiUrl(directUrl: string, proxyPrefix: string): string {
  if (isDesktopRuntimeLocal()) return directUrl;
  try {
    const u = new URL(directUrl);
    return `${proxyPrefix}${u.pathname}${u.search}`;
  } catch {
    return directUrl;
  }
}

const FRED_BASE = isDesktopRuntimeLocal()
  ? 'https://api.stlouisfed.org/fred/series/observations'
  : '/api/fred-proxy/fred/series/observations';
const EIA_BASE = isDesktopRuntimeLocal()
  ? 'https://api.eia.gov/v2'
  : '/api/eia-data';
const FINNHUB_BASE = isDesktopRuntimeLocal()
  ? 'https://finnhub.io/api/v1'
  : '/api/finnhub/api/v1';

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1_000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCacheKey(url: string): string {
  return url;
}

function getCached<T>(url: string): T | null {
  const entry = cache.get(getCacheKey(url));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(getCacheKey(url));
    return null;
  }
  return entry.data as T;
}

function setCache<T>(url: string, data: T): void {
  cache.set(getCacheKey(url), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export interface FredObservation {
  date: string;
  value: string;
  realtime_start: string;
  realtime_end: string;
}

export async function fetchFredSeries(seriesId: string, limit = 50): Promise<FredObservation[]> {
  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: FRED_API_KEY,
    file_type: 'json',
    limit: String(limit),
    sort_order: 'desc',
  });
  const url = `${FRED_BASE}?${params}`;

  const cached = getCached<FredObservation[]>(url);
  if (cached) return cached;

  const response = await fetchWithTimeout(url);
  const json = await response.json();
  const observations: FredObservation[] = json.observations ?? [];
  setCache(url, observations);
  return observations;
}

export interface EiaDataPoint {
  period: string;
  value: string | number;
  [key: string]: string | number;
}

export async function fetchEiaPetroleum(
  series: string,
  facets?: Record<string, string>,
  limit = 50
): Promise<EiaDataPoint[]> {
  const params = new URLSearchParams();
  params.set('api_key', EIA_API_KEY);
  params.set('frequency', 'weekly');
  params.append('data[]', 'value');
  params.append('facets[series][]', series);
  params.append('sort[0][column]', 'period');
  params.append('sort[0][direction]', 'desc');
  params.set('length', String(limit));

  if (facets) {
    for (const [key, value] of Object.entries(facets)) {
      params.append(`facets[${key}][]`, value);
    }
  }

  const url = `${EIA_BASE}/petroleum/pri/spt/data/?${params}`;
  const cached = getCached<EiaDataPoint[]>(url);
  if (cached) return cached;

  const response = await fetchWithTimeout(url);
  const json = await response.json();
  const data: EiaDataPoint[] = json?.response?.data ?? [];
  setCache(url, data);
  return data;
}

export async function fetchEiaElectricity(
  series: string,
  limit = 50
): Promise<EiaDataPoint[]> {
  const params = new URLSearchParams();
  params.set('api_key', EIA_API_KEY);
  params.set('frequency', 'monthly');
  params.append('data[]', 'value');
  params.append('facets[series][]', series);
  params.append('sort[0][column]', 'period');
  params.append('sort[0][direction]', 'desc');
  params.set('length', String(limit));

  const url = `${EIA_BASE}/electricity/rto/region-data/data/?${params}`;
  const cached = getCached<EiaDataPoint[]>(url);
  if (cached) return cached;

  const response = await fetchWithTimeout(url);
  const json = await response.json();
  const data: EiaDataPoint[] = json?.response?.data ?? [];
  setCache(url, data);
  return data;
}

export interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export async function fetchFinnhubQuote(symbol: string): Promise<FinnhubQuote> {
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`;
  const cached = getCached<FinnhubQuote>(url);
  if (cached) return cached;

  const response = await fetchWithTimeout(url);
  const json = await response.json();
  if (json.error) {
    throw new Error(`Finnhub error for ${symbol}: ${json.error}`);
  }
  setCache(url, json);
  return json as FinnhubQuote;
}

export interface FinnhubCandle {
  c: number[]; // close
  h: number[]; // high
  l: number[]; // low
  o: number[]; // open
  s: string;   // status
  t: number[]; // timestamp
  v: number[]; // volume
}

export async function fetchFinnhubCrypto(
  symbol: string,
  resolution = 'D'
): Promise<FinnhubCandle> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 30 * 24 * 60 * 60;
  const url = `${FINNHUB_BASE}/crypto/candle?symbol=${encodeURIComponent(
    symbol
  )}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;

  const cached = getCached<FinnhubCandle>(url);
  if (cached) return cached;

  const response = await fetchWithTimeout(url);
  const json = await response.json();
  if (json.s !== 'ok') {
    throw new Error(`Finnhub crypto error for ${symbol}: status=${json.s}`);
  }
  setCache(url, json);
  return json as FinnhubCandle;
}

export interface EconomicIndicator {
  id: string;
  name: string;
  value: string;
  date: string;
  change: string;
}

export async function fetchLiveEconomicIndicators(): Promise<EconomicIndicator[]> {
  const seriesConfig = [
    { id: 'UNRATE', name: 'Unemployment Rate' },
    { id: 'CPIAUCSL', name: 'CPI (All Urban Consumers)' },
    { id: 'FEDFUNDS', name: 'Federal Funds Rate' },
    { id: 'DGS10', name: '10-Year Treasury Yield' },
    { id: 'DGS2', name: '2-Year Treasury Yield' },
    { id: 'GDP', name: 'Gross Domestic Product' },
    { id: 'INDPRO', name: 'Industrial Production Index' },
    { id: 'UMCSENT', name: 'U. of Michigan Consumer Sentiment' },
  ];

  const results = await Promise.allSettled(
    seriesConfig.map(async (s) => {
      const observations = await fetchFredSeries(s.id, 5);
      const latest = observations[0];
      const previous = observations[1];
      const change =
        latest && previous && latest.value !== '.' && previous.value !== '.'
          ? (parseFloat(latest.value) - parseFloat(previous.value)).toFixed(2)
          : 'N/A';
      return {
        id: s.id,
        name: s.name,
        value: latest?.value ?? 'N/A',
        date: latest?.date ?? 'N/A',
        change,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EconomicIndicator> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export async function fetchIndiaEconomicData(): Promise<EconomicIndicator[]> {
  const indicators = [
    { wbId: 'NY.GDP.MKTP.KD.ZG', name: 'India GDP Growth' },
    { wbId: 'FP.CPI.TOTL.ZG', name: 'India CPI Inflation' },
  ];

  const results = await Promise.allSettled(
    indicators.map(async (ind) => {
      const url = externalApiUrl(
        `https://api.worldbank.org/v2/country/IND/indicator/${ind.wbId}?format=json&per_page=1`,
        '/api/worldbank',
      );
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const json = await res.json();
      const latest = json[1]?.[0];
      return {
        id: ind.wbId,
        name: ind.name,
        value: latest?.value?.toFixed(1) ?? 'N/A',
        date: latest?.date ?? 'N/A',
        change: 'N/A',
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EconomicIndicator> => r.status === 'fulfilled')
    .map(r => r.value);
}

export interface EnergyPrice {
  series: string;
  period: string;
  value: string | number;
}

export async function fetchLiveEnergyPrices(): Promise<EnergyPrice[]> {
  const seriesList = [
    'RWTC',  // WTI Crude Oil Spot Price
    'RBRTE', // Brent Crude Oil Spot Price
    'EER_EPMRU_PF4_Y35NY_DPG', // Regular Gasoline
    'EER_EPD2F_PF4_Y35NY_DPG', // Diesel
  ];

  const results = await Promise.allSettled(
    seriesList.map(async (series) => {
      const data = await fetchEiaPetroleum(series, undefined, 1);
      const latest = data[0];
      return {
        series,
        period: latest?.period ?? 'N/A',
        value: latest?.value ?? 'N/A',
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EnergyPrice> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export interface MarketQuote {
  symbol: string;
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export async function fetchLiveMarketQuotes(
  symbols: string[]
): Promise<MarketQuote[]> {
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const quote = await fetchFinnhubQuote(symbol);
      return {
        symbol,
        current: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        previousClose: quote.pc,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export interface CrudeInventory {
  series: string;
  period: string;
  value: string | number;
}

export async function fetchLiveCrudeInventories(): Promise<CrudeInventory[]> {
  const seriesList = [
    'WCRSTUS1',   // U.S. Commercial Crude Oil Stocks
    'WCSSTUS1',   // U.S. Strategic Petroleum Reserve
    'WGTIMUS1',   // U.S. Total Crude Oil Imports
    'WKSTUUS1',   // U.S. Crude Oil Refinery Inputs
  ];

  const results = await Promise.allSettled(
    seriesList.map(async (series) => {
      const data = await fetchEiaPetroleum(series, undefined, 1);
      const latest = data[0];
      return {
        series,
        period: latest?.period ?? 'N/A',
        value: latest?.value ?? 'N/A',
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<CrudeInventory> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export function createAutoRefresh(
  callback: () => void,
  intervalMs: number
): () => void {
  const id = setInterval(callback, intervalMs);
  return () => clearInterval(id);
}
