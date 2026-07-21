# ORION Architecture

> Operational Risk Intelligence & Optimization Network — Energy Supply Chain Resilience Platform

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORION PLATFORM                                     │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐  │
│  │ Web Dashboard│  │ Desktop App │  │  PWA / Mobile│  │  MCP Server (AI/Tool) │  │
│  │ (Vercel SPA) │  │ (Tauri)     │  │  Installable │  │  Protocol Interface   │  │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └───────────┬───────────┘  │
│         │                 │                 │                     │              │
│         └─────────────────┼─────────────────┘                     │              │
│                           │                                       │              │
│              ┌────────────┴────────────┐                          │              │
│              │   Variant Router        │                          │              │
│              │   6 variants from one   │                          │              │
│              │   deployment            │                          │              │
│              └────────────┬────────────┘                          │              │
│                           │                                       │              │
│         ┌─────────────────┼─────────────────────────────────────┐ │              │
│         │                 │          Frontend (Vanilla TS)      │ │              │
│         │  ┌──────────┐ ┌┴──────────┐ ┌──────────┐ ┌──────────┐│ │              │
│         │  │ Panel    │ │ Map Engine │ │ ML       │ │ Real-time││ │              │
│         │  │ System   │ │ deck.gl /  │ │ ONNX     │ │ Streams  ││ │              │
│         │  │ 160+     │ │ globe.gl / │ │ WebGPU → │ │ AIS/WS   ││ │              │
│         │  │ panels   │ │ MapLibre   │ │ WASM     │ │ polling  ││ │              │
│         │  └──────────┘ └───────────┘ └──────────┘ └──────────┘│ │              │
│         └───────────────────────────────────────────────────────┘ │              │
│                           │                                       │              │
│         ┌─────────────────┼─────────────────────────────────────┐ │              │
│         │                 │        Edge Layer (Vercel)          │ │              │
│         │  ┌──────────┐ ┌┴──────────┐ ┌──────────┐ ┌──────────┐│ │              │
│         │  │ 34 Proto │ │ Data      │ │ AI       │ │ RSS      ││ │              │
│         │  │ domain   │ │ Adapters  │ │ Pipeline │ │ Proxy    ││ │              │
│         │  │ handlers │ │ 30+ APIs  │ │ Groq/    │ │ 500+     ││ │              │
│         │  │          │ │           │ │ OpenRouter│ │ feeds    ││ │              │
│         │  └──────────┘ └───────────┘ └──────────┘ └──────────┘│ │              │
│         │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐│ │              │
│         │  │ Bootstrap│ │ Circuit   │ │ Rate     │ │ Cache    ││ │              │
│         │  │ Hydration│ │ Breakers  │ │ Limiting │ │ Managers ││ │              │
│         │  └──────────┘ └───────────┘ └──────────┘ └──────────┘│ │              │
│         └───────────────────────────────────────────────────────┘ │              │
│                           │                                       │              │
│         ┌─────────────────┼─────────────────────────────────────┐ │              │
│         │                 │        Backend Services              │ │              │
│         │  ┌──────────┐ ┌┴──────────┐ ┌──────────┐ ┌──────────┐│ │              │
│         │  │ Convex   │ │ Railway   │ │ Upstash  │ │ Auth     ││ │              │
│         │  │ Realtime │ │ 21 Cron   │ │ Redis    │ │ (Clerk)  ││ │              │
│         │  │ Database │ │ Seed Jobs │ │ Cache    │ │          ││ │              │
│         │  └──────────┘ └───────────┘ └──────────┘ └──────────┘│ │              │
│         └───────────────────────────────────────────────────────┘ │              │
│                           │                                       │              │
│         ┌─────────────────┼─────────────────────────────────────┐ │              │
│         │                 │      External Data Sources           │ │              │
│         │  ┌──────────┐ ┌┴──────────┐ ┌──────────┐ ┌──────────┐│ │              │
│         │  │Intellig. │ │ Financial │ │ Natural  │ │ Geopolit.││ │              │
│         │  │GDELT     │ │ Yahoo Fin │ │ USGS     │ │ ACLED    ││ │              │
│         │  │ACLED RSS │ │ CoinGecko │ │ GDACS    │ │ UCDP     ││ │              │
│         │  │LiveUAMap │ │ BIS/WTO   │ │ NASA FIRMS│ │ GDELT   ││ │              │
│         │  └──────────┘ └───────────┘ └──────────┘ └──────────┘│ │              │
│         └───────────────────────────────────────────────────────┘ │              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                         DATA FLOW PIPELINE                          │
  │                                                                     │
  │  External APIs ──→ Railway Seed Jobs ──→ Upstash Redis Cache        │
  │       │                                    │                        │
  │       │                                    ├──→ Bootstrap Hydration  │
  │       │                                    │    (38 keys, 2 tiers)  │
  │       │                                    │                        │
  │       │                                    └──→ Edge Functions       │
  │       │                                         (on-demand RPC)     │
  │       │                                                            │
  │       └──→ Edge Functions ──→ Redis Cache ──→ Client Panels         │
  │            (real-time proxy)    │              (SmartPollLoop)      │
  │                                │                                    │
  │                                └──→ CDN (s-maxage, stale-while-reval)│
  │                                                                     │
  └──────────────────────────────────────────────────────────────────────┘
```

### Bootstrap Hydration (Fast Page Load)

```
  Page Load
     │
     ├──→ /api/bootstrap?tier=fast  (s-maxage=1200, 20 min)
     │    earthquakes, outages, macroSignals, chokepoints,
     │    marketQuotes, riskScores, predictions...
     │
     └──→ /api/bootstrap?tier=slow  (s-maxage=7200, 2 hours)
          bisPolicy, minerals, cyberThreats, climate,
          naturalEvents, unrest, ucdpEvents...

  Single Redis pipeline call → 38 keys in one HTTP round-trip
  → Eliminates 38 independent API calls
  → Saves 2-4 seconds first-meaningful-paint
```

### Railway Seed Pipeline (21 Cron Jobs)

```
  ┌────────────────────┬─────────────────────┬───────────────┐
  │ Seed Script        │ Source              │ Frequency     │
  ├────────────────────┼─────────────────────┼───────────────┤
  │ seed-earthquakes   │ USGS M4.5+          │ 5 min         │
  │ seed-market-quotes │ Yahoo Finance       │ 5 min         │
  │ seed-commodity-qt  │ Yahoo Finance       │ 5 min         │
  │ seed-crypto-qt     │ CoinGecko           │ 5 min         │
  │ seed-cyber-threats │ Feodo/URLhaus/OTX   │ 2 hours       │
  │ seed-outages       │ Cloudflare Radar    │ 5 min         │
  │ seed-fire-detect   │ NASA FIRMS VIIRS    │ 10 min        │
  │ seed-climate       │ Open-Meteo ERA5     │ 15 min        │
  │ seed-airport-delay │ FAA/AviationStack   │ 10 min        │
  │ seed-insights      │ Groq LLM            │ 10 min        │
  │ seed-predictions   │ Polymarket          │ 10 min        │
  │ seed-etf-flows     │ Yahoo Finance       │ 15 min        │
  │ seed-unrest        │ ACLED + GDELT       │ 45 min        │
  │ seed-ucdp          │ UCDP GED API        │ 6 hours       │
  │ seed-conflict      │ ACLED + HAPI        │ 15 min        │
  │ seed-economy       │ EIA + FRED          │ 15 min        │
  │ seed-supply-chain  │ FRED + WTO          │ 6 hours       │
  │ seed-advisories    │ 24 RSS/Atom feeds   │ 1 hour        │
  │ seed-research      │ arXiv + HN          │ 6 hours       │
  │ seed-correlation   │ Cross-domain engine │ 5 min         │
  │ seed-gpsjam        │ GPSJam.org H3       │ 6 hours       │
  └────────────────────┴─────────────────────┴───────────────┘
```

---

## Frontend Architecture

### Panel System (160+ panels)

```
  ┌──────────────────────────────────────────────────────────┐
  │                    Panel Base Class                       │
  │  render() / destroy() / setContent() / Event Delegation  │
  ├──────────────────────────────────────────────────────────┤
  │                                                          │
  │  Intelligence Panels          Map Panels                 │
  │  ├── BreakingNewsBanner       ├── DeckGLMap             │
  │  ├── LiveNewsPanel            ├── GlobeMap              │
  │  ├── InsightsPanel            ├── MapContainer          │
  │  ├── UcdpEventsPanel          ├── MapPopup              │
  │  ├── CountryBriefPanel        └── ChokepointStrip       │
  │  └── StrategicRiskPanel                                  │
  │                                                          │
  │  Market Panels                Analytics Panels           │
  │  ├── MarketPanel              ├── CIIPanel              │
  │  ├── ETFFlowsPanel            ├── CorrelationPanel      │
  │  ├── StablecoinPanel          ├── ForecastPanel         │
  │  ├── FearGreedPanel           ├── ScenarioSimulator     │
  │  └── YieldCurvePanel          └── ResilienceWidget      │
  │                                                          │
  │  Map/Visualization Panels     Energy Panels              │
  │  ├── AISShippingPanel         ├── EnergyCrisisPanel     │
  │  ├── AirlineIntelPanel        ├── OilInventoriesPanel   │
  │  ├── RadiationWatchPanel      ├── FuelPricesPanel       │
  │  ├── DisplacementPanel        └── EnergyRiskOverview    │
  │  └── ClimateAnomalyPanel                                 │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
```

### Map Rendering Stack

```
  ┌──────────────────────────────────────────────────────┐
  │                 Map Rendering                        │
  │                                                     │
  │  2D View (MapLibre GL)    3D View (deck.gl)         │
  │  ├── PMTiles basemap      ├── ScatterplotLayer      │
  │  ├── GeoJSON overlays     ├── ArcLayer              │
  │  ├── H3 hex grids         ├── PolygonLayer          │
  │  └── Vector tiles         ├── HeatmapLayer          │
  │                           └── BitmapLayer           │
  │                                                     │
  │  Globe View (globe.gl)    Tooltips (deck.gl)        │
  │  ├── Point markers        ├── Custom renderers      │
  │  ├── Flight trails        ├── Source links          │
  │  ├── Vessel positions     └── Rich HTML content     │
  │  └── Heatmap overlay                                │
  │                                                     │
  │  Marker System: Discriminated Union (_kind field)    │
  │  { _kind: 'conflict', lat, lon, severity, ... }     │
  │  { _kind: 'flight', lat, lon, callsign, ... }       │
  │  { _kind: 'vessel', lat, lon, mmsi, ... }           │
  │  15+ marker types with exhaustive switch matching    │
  └──────────────────────────────────────────────────────┘
```

### ML Pipeline (Browser-Side)

```
  ┌──────────────────────────────────────────────────────┐
  │              ONNX Runtime Web Pipeline                │
  │                                                     │
  │  Capability Detection Cascade:                       │
  │  WebGPU (fastest) → WebGL (fast) → WASM+SIMD        │
  │                                                     │
  │  Models:                                             │
  │  ├── Embeddings (384-dim float32)                    │
  │  ├── Named Entity Recognition                        │
  │  ├── Sentiment Analysis                              │
  │  └── Summarization                                   │
  │                                                     │
  │  Runs in Web Workers (off main thread)               │
  │  Excluded on devices with <4GB RAM                   │
  └──────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Vercel Edge Functions (60+)

```
  ┌──────────────────────────────────────────────────────┐
  │            Edge Function Categories                   │
  │                                                     │
  │  Proto-First RPC (34 domains)                        │
  │  ├── POST /api/{domain}/v1/{rpc}                    │
  │  ├── Generated from .proto files via sebuf           │
  │  ├── Typed client + server handler stubs             │
  │  └── OpenAPI 3.1.0 auto-generated                   │
  │                                                     │
  │  Legacy Endpoints                                    │
  │  ├── api/rss-proxy.js (domain-allowlisted)          │
  │  ├── api/health.js                                  │
  │  ├── api/me.js                                      │
  │  └── api/og-story.js (social cards)                 │
  │                                                     │
  │  Shared Infrastructure                               │
  │  ├── server/gateway.ts (routing)                     │
  │  ├── server/cors.ts (origin allowlist)               │
  │  ├── server/auth-session.ts                         │
  │  └── server/error-mapper.ts                         │
  │                                                     │
  │  Per-Domain Split (85% cold-start reduction)         │
  │  ├── Each domain: own edge function                  │
  │  ├── Tree-shaken dependencies                        │
  │  └── Sub-100ms cold starts (was 500ms+)              │
  └──────────────────────────────────────────────────────┘
```

### Convex Backend

```
  ┌──────────────────────────────────────────────────────┐
  │                  Convex Database                      │
  │                                                     │
  │  Tables:                                             │
  │  ├── userPreferences (per-user settings)             │
  │  ├── notificationChannels (Telegram/Slack/etc)       │
  │  ├── alertRules (configurable triggers)              │
  │  ├── followedCountries (watchlist)                   │
  │  ├── subscriptions (Dodo Payments)                   │
  │  ├── entitlements (feature gating)                   │
  │  ├── customers (paid users)                          │
  │  ├── users (all Clerk-authenticated)                 │
  │  ├── registrations (waitlist)                        │
  │  ├── contactMessages                                 │
  │  ├── userApiKeys                                     │
  │  ├── mcpProTokens (OAuth for MCP)                   │
  │  └── broadcastRampConfig (email ramp)               │
  │                                                     │
  │  Functions:                                          │
  │  ├── queries (read-only)                             │
  │  ├── mutations (write, transactional)                │
  │  └── actions (side effects, external I/O)            │
  │                                                     │
  │  Cron Jobs:                                          │
  │  ├── Broadcast ramp runner                           │
  │  ├── Wave cleanup                                    │
  │  └── Shard seeding                                   │
  └──────────────────────────────────────────────────────┘
```

### Caching Layers

```
  ┌──────────────────────────────────────────────────────┐
  │              Three-Tier Caching                       │
  │                                                     │
  │  Tier 1: In-Memory (hydrationCache Map)              │
  │  ├── One-time read, then evicted                    │
  │  └── Used for bootstrap hydration                   │
  │                                                     │
  │  Tier 2: Upstash Redis                               │
  │  ├── 38 bootstrap keys                               │
  │  ├── Per-domain RPC cache keys                       │
  │  ├── Negative sentinels (__ORION_NEG__)              │
  │  └── In-flight promise coalescing                   │
  │                                                     │
  │  Tier 3: CDN (Vercel)                                │
  │  ├── s-maxage directives per tier                    │
  │  ├── stale-while-revalidate                          │
  │  └── stale-if-error fallback                        │
  │                                                     │
  │  Client-Side Cache:                                  │
  │  ├── IndexedDB (persistent)                          │
  │  └── localStorage (preferences)                      │
  │                                                     │
  │  Cache Stampede Prevention:                          │
  │  └── In-flight promise map coalesces concurrent      │
  │      misses into single upstream fetch               │
  └──────────────────────────────────────────────────────┘
```

---

## Real-Time Systems

```
  ┌──────────────────────────────────────────────────────┐
  │              Real-Time Data Flow                      │
  │                                                     │
  │  AIS Vessel Tracking (WebSocket)                     │
  │  ├── AISStream.io persistent connection              │
  │  ├── Backpressure: 3 watermarks (1K/4K/8K msgs)     │
  │  ├── 20,000 vessel cap (most recent per MMSI)        │
  │  ├── 5,000 density cells (2°x2° grid)               │
  │  ├── 30-point history trail per vessel               │
  │  └── HMAC authentication                             │
  │                                                     │
  │  SmartPollLoop (Adaptive Polling)                     │
  │  ├── Exponential backoff on failures                 │
  │  ├── 5x throttle when tab hidden                    │
  │  ├── Manual trigger support                          │
  │  ├── Circuit breaker integration                     │
  │  └── Reason tagging (interval/resume/manual/startup) │
  │                                                     │
  │  Event Bus (CustomEvent dispatch)                     │
  │  ├── wm:breaking-news                                │
  │  ├── wm:deduct-context                               │
  │  ├── theme-changed                                   │
  │  └── ai-flow-changed                                 │
  │                                                     │
  │  Web Workers                                         │
  │  ├── ONNX ML inference                               │
  │  ├── RSS feed fetching                               │
  │  ├── Data clustering (Supercluster)                  │
  │  └── CSV/JSON parsing                                │
  └──────────────────────────────────────────────────────┘
```

---

## 34 Service Domains

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    Proto Service Domains                       │
  │                                                              │
  │  Aviation          Climate          Conflict                  │
  │  Cyber             Displacement     Economic                  │
  │  Forecast          Giving           Health                    │
  │  Imagery           Infrastructure   Intelligence              │
  │  Leads             Maritime         Market                    │
  │  Military          Natural          News                      │
  │  Positive-Events   Prediction       Radiation                 │
  │  Research          Resilience       Sanctions                 │
  │  Scenario          Seismology       Shipping                  │
  │  Supply-Chain      Thermal          Trade                     │
  │  Unrest            Webcam           Wildfire                  │
  │  Consumer-Prices                                                   │
  │                                                              │
  │  Each domain:                                                 │
  │  ├── .proto definition with HTTP annotations                 │
  │  ├── Generated TypeScript client + server                    │
  │  ├── Generated OpenAPI 3.1.0 spec                            │
  │  ├── Edge function entry point                               │
  │  └── Handler module (server/orion/{domain}/)                 │
  └──────────────────────────────────────────────────────────────┘
```

---

## 6 Dashboard Variants

```
  ┌──────────────────────────────────────────────────────────────┐
  │                   Single Deployment, 6 Variants              │
  │                                                              │
  │  orion.app          → full (all 34 domains)                  │
  │  tech.orion.app     → tech (technology-focused)              │
  │  finance.orion.app  → finance (financial markets)            │
  │  commodity.orion.app→ commodity (energy/materials)           │
  │  happy.orion.app    → happy (positive news)                  │
  │  energy.orion.app   → energy (energy supply chain)           │
  │                                                              │
  │  Runtime selection via hostname or localStorage              │
  │  Shared CDN cache (identical SPA assets)                     │
  │  Single CI/CD pipeline                                       │
  └──────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    Deployment Topology                        │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
  │  │   Vercel      │    │   Railway    │    │   Convex     │   │
  │  │              │    │              │    │              │   │
  │  │ • SPA (CDN)  │    │ • 21 Cron    │    │ • Realtime   │   │
  │  │ • Edge Funcs │    │   seed jobs  │    │   Database   │   │
  │  │ • Edge Config│    │ • AIS Relay  │    │ • Functions  │   │
  │  │ • Analytics  │    │   (WebSocket)│    │ • Cron Jobs  │   │
  │  └──────────────┘    └──────────────┘    └──────────────┘   │
  │         │                   │                   │            │
  │         └───────────────────┼───────────────────┘            │
  │                             │                                │
  │                    ┌────────┴────────┐                       │
  │                    │   Upstash Redis  │                       │
  │                    │   (Cache Layer)  │                       │
  │                    └─────────────────┘                       │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐                       │
  │  │   Tauri       │    │   External   │                       │
  │  │   Desktop     │    │   APIs       │                       │
  │  │              │    │              │                       │
  │  │ • macOS/     │    │ • 30+ data   │                       │
  │  │   Linux      │    │   providers  │                       │
  │  │ • WKWebView  │    │ • REST/WS    │                       │
  │  │ • Local side │    │ • RSS feeds  │                       │
  │  │   car        │    │              │                       │
  │  └──────────────┘    └──────────────┘                       │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
ORION/
├── api/                    # Vercel Edge Functions (60+)
│   ├── [domain]/v1/        # Proto-first RPC endpoints
│   ├── rss-proxy.js        # Domain-allowlisted RSS proxy
│   ├── bootstrap.js        # Hydration endpoint
│   ├── mcp.ts              # MCP server protocol
│   └── ...
├── server/                 # Shared server logic
│   ├── gateway.ts          # Proto RPC routing
│   ├── cors.ts             # Origin allowlist
│   ├── auth-session.ts     # Clerk session
│   ├── error-mapper.ts     # Error normalization
│   └── orion/              # Domain handler modules (34)
│       ├── aviation/
│       ├── conflict/
│       ├── market/
│       └── ...
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── users.ts            # User mutations/queries
│   ├── alertRules.ts       # Alert configuration
│   ├── payments/           # Dodo Payments integration
│   ├── broadcast/          # Email broadcast system
│   └── lib/                # Shared utilities
├── src/                    # Frontend (Vanilla TypeScript)
│   ├── app/                # Application shell
│   ├── components/         # 160+ panel components
│   ├── services/           # Data fetching services
│   ├── workers/            # Web Workers
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── styles/             # CSS styles
├── shared/                 # Isomorphic code
│   ├── source-tiers.json   # Source credibility tiers
│   ├── country-bboxes.json # Country bounding boxes
│   └── ...
├── proto/                  # Protocol Buffer definitions
│   ├── buf.gen.yaml        # Code generation config
│   └── */                  # Domain .proto files
├── scripts/                # Build & lint scripts
├── tests/                  # Unit tests
├── e2e/                    # Playwright E2E tests
├── docs/                   # Documentation
├── Makefile                # Proto code generation
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies & scripts
```

---

## Key Design Patterns

| Pattern | Implementation |
|---|---|
| **No Framework** | Vanilla TypeScript, direct DOM, CustomEvent bus |
| **Panel Delegation** | Event delegation on stable container, survives innerHTML replacement |
| **Discriminated Unions** | `_kind` field on map markers, exhaustive switch matching |
| **Circuit Breakers** | Per-feed breakers with 5-min cooldown, stale-on-error fallback |
| **Cache-First** | In-memory → Redis → CDN → upstream, negative sentinels |
| **Adaptive Polling** | SmartPollLoop with backoff, visibility-aware, dedup in-flight |
| **Contract-First** | .proto → generated client/server/OpenAPI, no schema drift |
| **Graceful Degradation** | Missing API keys skip sources, never crash the app |
| **Multi-Signal Corroboration** | Critical alerts require convergence across independent streams |
| **Browser-First Compute** | ML, clustering, geolocation, surge detection run client-side |
