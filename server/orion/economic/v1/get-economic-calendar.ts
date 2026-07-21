import type {
  ServerContext,
  GetEconomicCalendarRequest,
  GetEconomicCalendarResponse,
  EconomicEvent,
} from '../../../../src/generated/server/orion/economic/v1/service_server';
import { getCachedJson } from '../../../_shared/redis';

const SEED_CACHE_KEY = 'economic:econ-calendar:v1';

function buildFallbackResult(): GetEconomicCalendarResponse {
  return {
    events: [],
    fromDate: '',
    toDate: '',
    total: 0,
    unavailable: true,
  };
}

export async function getEconomicCalendar(
  _ctx: ServerContext,
  _req: GetEconomicCalendarRequest,
): Promise<GetEconomicCalendarResponse> {
  try {
    const raw = await getCachedJson(SEED_CACHE_KEY, true) as Record<string, unknown> | null;
    if (!raw) return buildFallbackResult();
    const payload = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as GetEconomicCalendarResponse;
    if (Array.isArray(payload.events) && payload.events.length > 0) {
      return {
        events: payload.events as EconomicEvent[],
        fromDate: payload.fromDate ?? _req.fromDate ?? '',
        toDate: payload.toDate ?? _req.toDate ?? '',
        total: payload.total ?? payload.events.length,
        unavailable: false,
      };
    }
    return buildFallbackResult();
  } catch {
    return buildFallbackResult();
  }
}
