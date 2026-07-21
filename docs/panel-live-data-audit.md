# ORION Live-Data Panel Audit

Audit date: 2026-07-21. This report uses repository code plus the local, non-secret configuration-presence check. It cannot assert a `LIVE` or `STALE` runtime status until a deployed `/api/health` response and Railway relay health response are available; neither deployment URL nor deployment credentials are configured in this checkout.

## Summary (completed categories)

| Status | Count |
| --- | ---: |
| HARDCODED/MOCK | 5 |
| BROKEN | 2 |
| MISCONFIGURED (local development) | 1 |
| Runtime status unverified | 5 |

The counts cover the completed Map and Signals categories only. The remaining categories require the same static trace plus deployed health evidence before they can be classified truthfully as `LIVE` or `STALE`.

## Map

| Panel Name | Status | Root Cause | Files Involved | Fix Applied |
| --- | --- | --- | --- | --- |
| Interactive Map | HARDCODED/MOCK | The sole map renderer builds numerous realistic-looking simulated datasets (`aisDots`, military vessels, protests, weather, disasters, fires, cyber threats, data centres, power plants, UCDP events and sanctions) in the component. It does not consume the application’s live map service/RPC data path and only exposes a subset of declared layers. | `src/components/MapContainer.ts`, `src/config/map-layer-definitions.ts`, `src/config/panels.ts` | Requires developer action: restore the removed renderer/data pipeline (`DeckGLMap`/SVG fallback or an equivalent live service integration), pass bootstrap/RPC data into the renderer, and wire freshness via `panel-freshness-display.ts`. Do not treat the static overlays as live data. |

## Signals

| Panel Name | Status | Root Cause | Files Involved | Fix Applied |
| --- | --- | --- | --- | --- |
| Live News Feed | BROKEN | This is a curated YouTube embed picker, not a live news-data panel. Channel metadata is a static array and live-video lookup depends on an unverified proxy configuration. | `src/components/panels/LiveNewsPanel.ts`, `src/services/live-news.ts`, `scripts/ais-relay.cjs` | Requires developer action: configure `YOUTUBE_PROXY_URL` on Railway if proxy lookup is intended, or rename/reclassify the panel as a video-stream viewer and add a clear unavailable state. |
| Breaking News | BROKEN (fixed) | Both conflict and RSS failures were silently replaced by fabricated breaking-news cards. | `src/components/panels/BreakingNewsPanel.ts`, `src/services/conflict.ts`, `src/services/rss.ts`, `scripts/seed-conflict-intel.mjs` | Removed fabricated fallback cards. The panel now reports an honest no-live-data state. |
| Cross-Source Signals | BROKEN (fixed) | Failed/empty CII, conflict, and RSS responses were replaced by four fabricated convergence signals. | `src/components/panels/CrossSourceSignalsPanel.ts`, `src/services/cii-data-loader.ts`, `src/services/conflict.ts`, `src/services/rss.ts` | Removed fabricated fallback signals. The panel now reports no converged live signals when inputs are unavailable. |
| Threat Timeline | HARDCODED/MOCK | The `fetchPanelData` fallback is a realistic `DEMO_EVENTS` conflict timeline, so an outage renders invented events as cached data. | `src/components/panels/ThreatTimelinePanel.ts`, `src/services/panel-data-loader.ts`, `src/services/conflict.ts` | Requires developer action: replace `DEMO_EVENTS` with an empty typed fallback and display the existing freshness/error state. |
| Climate News | BROKEN | The registry’s `climate-news` ID is intentionally mapped to `ClimateAnomalyPanel`; the factory explicitly states that `ClimateNewsPanel` does not exist. | `src/config/panel-registry.ts`, `src/components/PanelFactory.ts`, `src/components/panels/ClimateAnomalyPanel.ts` | Requires developer action: add and map a real climate-news panel backed by the climate-news pipeline, or remove/rename this registry entry. |
| GDELT Intelligence | Runtime status unverified | Fetches `gdelt-intel` service but silently ignores live-fetch failures. Deployed seed health is unavailable to this audit. | `src/components/panels/GdeltIntelPanel.ts`, `src/services/gdelt-intel.ts`, `scripts/seed-gdelt-intel.mjs` | Requires developer action: expose the failed state/freshness timestamp and provide `/api/health?compact=1` output to classify LIVE vs STALE. |
| AIS Shipping | MISCONFIGURED (local development) | `scripts/ais-relay.cjs` exits at startup when `AISSTREAM_API_KEY` is absent; it is absent from `.env.local`. The client also has no configured relay URL locally. | `src/components/panels/AisShippingPanel.ts`, `src/services/maritime.ts`, `scripts/ais-relay.cjs` | Requires developer action: set `AISSTREAM_API_KEY`, `RELAY_SHARED_SECRET`, and the client relay URL (`VITE_WS_RELAY_URL` or the application’s configured relay variable) in Railway/Vercel as appropriate; verify Railway `/health` reports `connected: true`. |
| Airline Intelligence | Runtime status unverified | Uses aviation and military-flight services; local AviationStack is configured, but OpenSky credentials and relay URL are absent, so the full real-time path cannot operate locally. | `src/components/panels/AirlineIntelPanel.ts`, `src/services/aviation/index.ts`, `src/services/military-flights.ts`, `scripts/seed-aviation.mjs`, `scripts/ais-relay.cjs` | Requires developer action: configure `OPENSKY_CLIENT_ID`, `OPENSKY_CLIENT_SECRET`, and relay URL where live position tracking is deployed; provide health checks to classify current freshness. |
| Service Status | Runtime status unverified | Uses infrastructure service but the audit has no deployed health endpoint response to validate the status it renders. | `src/components/panels/ServiceStatusPanel.ts`, `src/services/infrastructure.ts`, `api/health.js` | Requires developer action: expose the production `/api/health?compact=1` endpoint to the audit or supply its current JSON response. |
| Geopolitical Hubs | HARDCODED/MOCK | Uses `GLOBAL_HUBS` as the fallback whenever chokepoint data is unavailable, presenting static risk values as cached data. | `src/components/panels/GeopoliticalHubsPanel.ts`, `src/services/supply-chain.ts`, `scripts/seed-chokepoints-standalone.mjs` | Requires developer action: replace `GLOBAL_HUBS` with an empty/error state and show source freshness. |
| Live Intelligence | BROKEN (fixed) | Empty or failing GDELT requests were replaced with fabricated intelligence headlines. | `src/components/panels/LiveIntelligencePanel.ts`, `src/services/gdelt-intel.ts` | Removed fabricated fallback headlines. The panel now reports an honest no-live-data state. |
| World Clock | HARDCODED/MOCK | Static market-centre and exchange-hours arrays are rendered from device time; no market calendar or exchange-status source is queried. | `src/components/panels/WorldClockPanel.ts` | Requires developer action: either label it as a local clock utility (not live market data) or integrate an exchange-calendar source. |

## Required runtime evidence before continuing classification

1. Production `GET /api/health?compact=1` JSON, or an authenticated equivalent. The handler exists at `api/health.js` and contains the source freshness classifier.
2. Railway relay `GET /health` JSON, specifically the AIS `connected`, vessel, and message fields.
3. The Railway/Vercel environment-variable presence status for each upstream; this checkout can only verify `.env.local`, not deployment environments.

## Direct changes made during this audit

- `src/components/panels/BreakingNewsPanel.ts`: removed fabricated conflict/RSS fallback cards.
- `src/components/panels/CrossSourceSignalsPanel.ts`: removed fabricated convergence-signal fallback cards.
- `src/components/panels/LiveIntelligencePanel.ts`: removed fabricated GDELT fallback headlines.

All three changes type-check successfully with `npm run typecheck`.
