import { CircuitBreaker, type CircuitBreakerOptions } from '@/utils/circuit-breaker';

export type DataSource = 'live' | 'cached';

export interface PanelDataResult<T> {
  data: T;
  isLive: boolean;
  source: DataSource;
}

export interface PanelDataLoaderOptions<T> {
  name: string;
  fallback: T;
  cacheTtlMs?: number;
  persistCache?: boolean;
  maxFailures?: number;
  cooldownMs?: number;
  revivePersistedData?: (data: T) => T;
  persistentStaleCeilingMs?: number;
}

const breakers = new Map<string, CircuitBreaker<unknown>>();

function getBreaker<T>(opts: PanelDataLoaderOptions<T>): CircuitBreaker<T> {
  let existing = breakers.get(opts.name) as CircuitBreaker<T> | undefined;
  if (existing) return existing;

  const breakerOpts: CircuitBreakerOptions<T> = {
    name: opts.name,
    maxFailures: opts.maxFailures ?? 3,
    cooldownMs: opts.cooldownMs ?? 0,
    cacheTtlMs: opts.cacheTtlMs ?? 0,
    persistCache: opts.persistCache ?? false,
    revivePersistedData: opts.revivePersistedData,
    persistentStaleCeilingMs: opts.persistentStaleCeilingMs,
  };
  existing = new CircuitBreaker<T>(breakerOpts);
  breakers.set(opts.name, existing as CircuitBreaker<unknown>);
  return existing;
}

/**
 * Fetch panel data with a live → cached cascade.
 * Never returns null or empty data — always returns a valid T.
 *
 * 1. Attempts live fetch via `fn()`
 * 2. On failure, returns cached data if available
 * 3. As last resort, returns the fallback constant
 */
export async function fetchPanelData<T>(
  opts: PanelDataLoaderOptions<T>,
  fn: () => Promise<T>,
  validate?: (data: T) => boolean,
): Promise<PanelDataResult<T>> {
  const breaker = getBreaker(opts);

  const result = await breaker.execute<T>(
    async () => {
      const data = await fn();
      if (validate && !validate(data)) {
        throw new Error('Validation failed');
      }
      return data;
    },
    opts.fallback,
    {
      shouldCache: (data: T) => {
        if (data === opts.fallback) return false;
        return validate ? validate(data) : true;
      },
    },
  );

  const dataState = breaker.getDataState();
  const isLive = dataState.mode === 'live';
  const source: DataSource = dataState.mode === 'live'
    ? 'live'
    : 'cached';

  return {
    data: result ?? opts.fallback,
    isLive,
    source,
  };
}

/**
 * Render the standard LIVE / CACHED badge used across all panels.
 */
export function renderDataBadge(source: DataSource): string {
  const colors: Record<DataSource, { dot: string; text: string; label: string }> = {
    live:   { dot: 'bg-primary animate-pulse',  text: 'text-primary',            label: 'LIVE' },
    cached: { dot: 'bg-yellow-400 animate-pulse', text: 'text-yellow-400',       label: 'CACHED' },
  };
  const c = colors[source] ?? colors.live;
  return `<div class="flex items-center gap-2">
    <span class="w-2 h-2 rounded-full ${c.dot}"></span>
    <span class="text-[10px] font-data-md ${c.text}">${c.label}</span>
  </div>`;
}
