const DB_NAME = 'orion-time-series';
const DB_VERSION = 1;
const STORE_NAME = 'metrics';
const MAX_AGE_DAYS = 90;

export interface TimeSeriesEntry {
  id?: number;
  metric: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('metric', 'metric', { unique: false });
        store.createIndex('metric_timestamp', ['metric', 'timestamp'], { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export async function recordMetric(
  metric: string,
  value: number,
  tags?: Record<string, string>,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add({ metric, value, timestamp: Date.now(), tags });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function recordMetricsBatch(entries: Array<Omit<TimeSeriesEntry, 'id'>>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      store.add({ ...entry, timestamp: entry.timestamp || Date.now() });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMetricRange(
  metric: string,
  startMs: number,
  endMs: number,
): Promise<TimeSeriesEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('metric_timestamp');
    const range = IDBKeyRange.bound([metric, startMs], [metric, endMs]);
    const request = index.getAll(range);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLatestMetric(metric: string): Promise<TimeSeriesEntry | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('metric');
    const range = IDBKeyRange.bound(metric, metric + '\uffff');
    const request = index.openCursor(range, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      resolve(cursor ? cursor.value : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getMetricTrend(
  metric: string,
  windowMs: number = 7 * 24 * 60 * 60 * 1000,
): Promise<{ current: number; previous: number; change: number; trend: 'rising' | 'falling' | 'stable' }> {
  const now = Date.now();
  const currentWindow = await getMetricRange(metric, now - windowMs / 2, now);
  const previousWindow = await getMetricRange(metric, now - windowMs, now - windowMs / 2);

  const currentAvg = currentWindow.length > 0
    ? currentWindow.reduce((sum, e) => sum + e.value, 0) / currentWindow.length
    : 0;
  const previousAvg = previousWindow.length > 0
    ? previousWindow.reduce((sum, e) => sum + e.value, 0) / previousWindow.length
    : 0;

  const change = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;
  const trend = Math.abs(change) < 5 ? 'stable' : change > 0 ? 'rising' : 'falling';

  return { current: currentAvg, previous: previousAvg, change, trend };
}

export async function getMetricSparkline(
  metric: string,
  points: number = 24,
  windowMs: number = 24 * 60 * 60 * 1000,
): Promise<number[]> {
  const now = Date.now();
  const interval = windowMs / points;
  const values: number[] = [];

  for (let i = 0; i < points; i++) {
    const start = now - windowMs + i * interval;
    const end = start + interval;
    const entries = await getMetricRange(metric, start, end);
    const avg = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.value, 0) / entries.length
      : 0;
    values.push(avg);
  }

  return values;
}

export async function pruneOldMetrics(): Promise<number> {
  const db = await openDB();
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);
    let count = 0;
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        count++;
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve(count);
    tx.onerror = () => reject(tx.error);
  });
}

export const ORION_METRICS = {
  CHOKEPOINT_RISK: 'orion.chokepoint.risk',
  CHOKEPOINT_DISRUPTION_PROB: 'orion.chokepoint.disruption_prob',
  ENERGY_SUPPLY_EXPOSURE: 'orion.energy.supply_exposure',
  ENERGY_SHOCK_SCORE: 'orion.energy.shock_score',
  MARKET_BRENT: 'orion.market.brent',
  MARKET_WTI: 'orion.market.wti',
  MARKET_NATGAS: 'orion.market.natgas',
  SHIPPING_STRESS: 'orion.shipping.stress',
  STRATEGIC_RISK: 'orion.strategic.risk',
  COUNTRY_INSTABILITY: 'orion.country.instability',
  PROCUREMENT_COST: 'orion.procurement.cost',
  ALERT_TRIGGERED: 'orion.alert.triggered',
} as const;
