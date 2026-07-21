# ORION Frontend Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Entry Points](#entry-points)
5. [Component Architecture](#component-architecture)
6. [Navigation & Routing](#navigation--routing)
7. [Panel System](#panel-system)
8. [State Management](#state-management)
9. [API Layer](#api-layer)
10. [Styling & Theming](#styling--theming)
11. [Variant System](#variant-system)
12. [Internationalization (i18n)](#internationalization-i18n)
13. [Build & Configuration](#build--configuration)
14. [PWA Support](#pwa-support)
15. [Key Dependencies](#key-dependencies)

---

## Overview

ORION (Operational Risk Intelligence & Optimization Network) is a **vanilla TypeScript** single-page application (SPA) for energy supply chain resilience and geopolitical intelligence. It is **not** built with React, Vue, or Angular — all components are plain TypeScript classes that directly manipulate the DOM.

The application features:
- 161 registered panel components across 9 navigation categories
- Multi-variant deployment system (full, tech, finance, energy, commodity, happy)
- Real-time data via Convex WebSocket subscriptions
- Geospatial visualization with MapLibre GL, deck.gl, and globe.gl
- Full internationalization with 24 languages
- PWA support with offline capabilities

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.7+ (strict mode) |
| Build Tool | Vite 6.0.7 |
| UI Framework | **None** (vanilla TS classes + DOM manipulation) |
| Styling | Tailwind CSS (CDN) + custom CSS |
| Icons | Google Material Symbols |
| Maps | MapLibre GL + deck.gl + globe.gl |
| Charts | D3.js v7 |
| Auth | Clerk (loaded as UMD from CDN) |
| Backend | Convex (real-time database + functions) |
| API | Vercel Edge Functions + gRPC-generated clients |
| State | Module-level singletons + localStorage + IndexedDB |
| i18n | i18next v25 + browser language detector |
| Linting | Biome v2.4.7 |
| Testing | Playwright (E2E) + Vitest (unit) |
| PWA | vite-plugin-pwa + Workbox |

---

## Project Structure

```
Archive/
├── index.html                    # App shell (nav, header, Tailwind config)
├── vite.config.ts                # Build config (~2000 lines, 13 plugins)
├── tsconfig.json                 # TypeScript config (strict, @/ alias)
├── middleware.ts                 # Vercel Edge Middleware (bot filtering, variant routing)
├── package.json                  # Dependencies and scripts
│
├── src/
│   ├── main.ts                   # Entry point — creates App instance
│   ├── App.ts                    # Root orchestrator (nav, panel factory, ticker)
│   ├── settings-main.ts          # Settings page entry point
│   │
│   ├── app/                      # Core application modules
│   │   ├── app-context.ts        # App-wide context/state
│   │   ├── data-loader.ts        # Data loading orchestration
│   │   ├── event-handlers.ts     # Global event handlers
│   │   ├── panel-layout.ts       # Panel grid layout logic
│   │   ├── search-manager.ts     # Search functionality
│   │   └── refresh-scheduler.ts  # Data refresh scheduling
│   │
│   ├── bootstrap/                # Startup helpers
│   │   ├── chunk-reload.ts       # Chunk reload on stale bundle
│   │   ├── sentry-init.ts        # Sentry error tracking init
│   │   ├── stale-bundle-check.ts # Detects outdated deployments
│   │   └── sw-update.ts          # Service worker update handler
│   │
│   ├── components/               # UI components (51 files)
│   │   ├── PanelFactory.ts       # Central panel orchestrator
│   │   ├── ResizablePanel.ts     # Drag-to-resize wrapper
│   │   ├── MapContainer.ts       # Multi-mode map (flat/3D/globe)
│   │   ├── IntelTicker.ts        # Scrolling ticker bar
│   │   ├── EnergySupplyPanel.ts  # Global flow visualization
│   │   ├── MarketsPanel.ts       # Market quotes display
│   │   ├── ChokepointsPanel.ts   # Chokepoint risk cards
│   │   └── panels/               # 44 domain-specific panels
│   │       ├── LiveNewsPanel.ts
│   │       ├── BreakingNewsPanel.ts
│   │       ├── MarketOverviewPanel.ts
│   │       ├── FearGreedPanel.ts
│   │       ├── SupplyChainPanel.ts
│   │       ├── StrategicPosturePanel.ts
│   │       ├── ClimateAnomalyPanel.ts
│   │       ├── ... (44 total)
│   │       └── WorldClockPanel.ts
│   │
│   ├── config/                   # 50 configuration files
│   │   ├── panel-registry.ts     # 161 panels, 9 categories
│   │   ├── panels.ts             # Panel definitions & map layers
│   │   ├── variant.ts            # Runtime variant singleton
│   │   ├── variant-meta.ts       # Variant metadata (titles, OG tags)
│   │   ├── variants/             # Variant-specific panel configs
│   │   │   ├── full.ts
│   │   │   └── base.ts
│   │   ├── feeds.ts              # RSS feed definitions
│   │   ├── geo.ts                # Geographic data config
│   │   └── markets.ts            # Market data config
│   │
│   ├── services/                 # 198 service files
│   │   ├── convex-client.ts      # Convex WebSocket client singleton
│   │   ├── rpc-client.ts         # Proto-first RPC fetch wrapper
│   │   ├── premium-fetch.ts      # Auth-injecting fetch (4-tier)
│   │   ├── auth-state.ts         # Clerk auth state management
│   │   ├── entitlements.ts       # Feature gating (Convex reactive)
│   │   ├── i18n.ts               # i18next setup
│   │   ├── storage.ts            # IndexedDB baseline storage
│   │   ├── tab-store.ts          # Panel tab layouts (localStorage)
│   │   ├── widget-store.ts       # Custom widgets (localStorage)
│   │   └── followed-countries.ts # Country watchlist (Convex + localStorage)
│   │
│   ├── generated/                # Auto-generated code
│   │   ├── client/               # gRPC client stubs
│   │   └── server/               # gRPC server stubs
│   │
│   ├── locales/                  # 24 i18n locale JSON files
│   │   ├── en.json               # Full English dictionary (~3157 lines)
│   │   ├── en.shell.json         # Shell-only English (first-paint)
│   │   ├── fr.json, de.json, ar.json, zh.json, ja.json, ...
│   │   └── (24 languages total)
│   │
│   ├── styles/
│   │   └── base.css              # Custom CSS (glass panels, glow, animations)
│   │
│   ├── utils/                    # 48 utility files
│   ├── types/                    # TypeScript type definitions
│   ├── workers/                  # Web Workers (analysis, ML, vector-db)
│   ├── embed/                    # Embeddable widget code
│   ├── data/                     # Static JSON data files
│   └── shims/                    # Node.js polyfills
│
├── api/                          # 60+ Vercel Edge Functions
├── convex/                       # Convex schema, functions, crons
├── server/                       # Server-side code
├── shared/                       # Shared (client+server) code
├── workers/                      # Cloudflare Workers
├── e2e/                          # End-to-end tests
├── tests/                        # Unit tests
├── scripts/                      # Build/dev utility scripts
├── public/                       # Static assets
├── proto/                        # Protocol Buffer definitions
└── deploy/                       # Deployment configuration
```

---

## Entry Points

### Main Entry (`src/main.ts`)
```typescript
import { App } from './App';
const app = new App('app');
app.init().catch(console.error);
```

### Settings Entry (`src/settings-main.ts`)
Separate entry point for the settings page, loaded via `settings.html`.

### Embed Entry
Embeddable widget loaded via `embed.html`.

---

## Component Architecture

### Pattern: Vanilla TypeScript Classes

Every component follows this exact lifecycle:

```typescript
export class SomePanel {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    await this.fetchData();
    this.render();
  }

  private async fetchData(): Promise<void> {
    // Delegates to services/ or generated/client/
    // Always has hardcoded fallback data in catch blocks
  }

  render(): void {
    // Sets innerHTML with template literals + Tailwind classes
    this.container.innerHTML = `...`;
  }

  destroy(): void {
    // Cleanup: remove event listeners, clear DOM
    this.container.innerHTML = '';
  }
}
```

### Key Characteristics
- **No JSX/TSX** — all HTML is generated via template literals
- **No virtual DOM** — direct `innerHTML` and `addEventListener` calls
- **No hooks** — imperative lifecycle methods (`init`/`render`/`destroy`)
- **Constructor injection** — receives a DOM `HTMLElement` to mount into
- **Fallback data** — every panel has hardcoded fallbacks for offline/error states
- **Manual event binding** — uses `container.addEventListener` with delegation

### Component Inventory

**Infrastructure Components (7 files in `src/components/`):**

| Component | Purpose |
|---|---|
| `PanelFactory.ts` | Maps panel IDs to classes, creates/destroys instances, manages `PANEL_MAP` |
| `ResizablePanel.ts` | Drag-to-resize with localStorage persistence |
| `MapContainer.ts` | Multi-mode map (MapLibre flat, deck.gl 3D, globe.gl globe) |
| `IntelTicker.ts` | Scrolling ticker bar (conflict count, alerts, Brent crude, transit volume) |
| `EnergySupplyPanel.ts` | Bar charts of Suez, Malacca, Hormuz, Panama transit |
| `MarketsPanel.ts` | Commodity and energy market quotes |
| `ChokepointsPanel.ts` | Chokepoint risk status cards |

**Domain Panels (44 files in `src/components/panels/`):**

| Category | Panels |
|---|---|
| **Signals/Intelligence** | `LiveNewsPanel`, `BreakingNewsPanel`, `CrossSourceSignalsPanel`, `ThreatTimelinePanel`, `GdeltIntelPanel`, `AirlineIntelPanel`, `WorldClockPanel`, `WebcamsPanel` |
| **Markets/Economic** | `MarketOverviewPanel`, `MarketImplicationsPanel`, `EconomicIndicatorsPanel`, `FearGreedPanel`, `MarketBreadthPanel`, `EconomicCalendarPanel`, `MacroSignalsPanel`, `CotPositioningPanel`, `FinancialStressPanel`, `NationalDebtPanel`, `GulfEconomiesPanel`, `ConsumerPricesPanel`, `DailyMarketBriefPanel` |
| **Defense/Geopolitical** | `StrategicPosturePanel`, `UcdpEventsPanel`, `SanctionsPanel`, `RadiationPanel`, `GeopoliticalRiskPanel`, `CyberThreatsPanel`, `StrategicRiskPanel`, `HormuzTrackerPanel`, `OrefSirensPanel` |
| **Climate/Environment** | `ClimateAnomalyPanel`, `DiseaseOutbreaksPanel`, `DisplacementPanel`, `SocialVelocityPanel`, `EarthquakesPanel`, `WeatherAlertsPanel` |
| **Supply Chain/Maritime** | `SupplyChainPanel`, `AisShippingPanel`, `InternetOutagesPanel` |
| **Reports/Analysis** | `ExecutiveActionPanel`, `ExecutiveReportsPanel`, `ForecastPanel`, `InsightsPanel` |

---

## Navigation & Routing

### No URL-Based Router

The app does **not** use React Router, Vue Router, or any URL-based routing. Navigation is purely in-memory via category switching.

### How Navigation Works

1. `App.ts` queries the DOM for `.nav-item` elements
2. Each nav item has a `data-category` attribute (e.g., `data-category="map"`)
3. Clicking a nav item calls `showCategory(category)`
4. `showCategory` destroys all current panels and creates new ones for the selected category
5. Default category on load: `'map'`

### Navigation Categories (9)

| Category | Name | Icon | Panel Count |
|---|---|---|---|
| `map` | Map | `map` | 1 |
| `signals` | Signals | `sensors` | 13 |
| `markets` | Markets | `candlestick_chart` | 22 |
| `energy` | Energy | `local_gas_station` | 19 |
| `defense` | Defense | `shield` | 9 |
| `climate` | Climate | `earthquake` | 6 |
| `analysis` | Analysis | `analytics` | 25 |
| `reports` | Reports | `description` | 5 |
| `settings` | Settings | `settings` | 21 |
| **Total** | | | **161** |

### Panel Registry

Defined in `src/config/panel-registry.ts`. The `PanelFactory` iterates over this registry to create panels for each category. Of 161 registered panels, 44 have full component implementations; the remaining ~117 use stub/placeholder rendering via `PanelFactory.renderStub()`.

---

## Panel System

### PanelFactory (`src/components/PanelFactory.ts`)

The central orchestrator that:

1. Maintains a `PANEL_MAP` mapping string IDs to panel classes
2. `createPanel(id, container)` — instantiates, calls `init()`, wraps in `ResizablePanel`
3. `createCategoryView(category, container)` — batch-creates all panels for a category
4. `destroyAllPanels()` — cleans up all active panel instances

### Panel Lifecycle

```
User clicks nav item
  → App.showCategory(category)
    → PanelFactory.destroyAllPanels()
    → PanelFactory.createCategoryView(category, container)
      → For each panel in PANEL_REGISTRY[category]:
        → PanelFactory.createPanel(panelId, container)
          → new PanelClass(container)
          → panel.init()  // fetch data + render
          → new ResizablePanel(container)  // add resize handle
```

### ResizablePanel (`src/components/ResizablePanel.ts`)

Wraps each panel with:
- Drag-to-resize handle
- Persistent sizing via `localStorage` (keyed by panel ID)
- Minimum/maximum size constraints
- Responsive breakpoints (`panel-sm`, `panel-lg`, `panel-xl`)

---

## State Management

### Architecture: Module-Level Singletons

There is no Redux, Zustand, or Context API. State is managed through:

#### 1. Module-Level Variables with Getter/Setter/Subscribe

```typescript
// Pattern used across all services
let state: SomeState = defaultState;
const listeners: Set<Function> = new Set();

export function getState(): SomeState { return state; }
export function subscribeState(fn: Function): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setState(next: SomeState) {
  state = next;
  listeners.forEach(fn => fn(state));
}
```

**Key state modules:**
| Module | File | Purpose |
|---|---|---|
| Auth State | `services/auth-state.ts` | Clerk authentication session |
| Entitlements | `services/entitlements.ts` | Feature gating (PRO/free) |
| Followed Countries | `services/followed-countries.ts` | Country watchlist |
| Tab Store | `services/tab-store.ts` | Panel tab layouts |
| Widget Store | `services/widget-store.ts` | Custom widgets |
| Analysis Framework | `services/analysis-framework-store.ts` | Analysis presets |

#### 2. localStorage Persistence

```typescript
// Generic helpers in src/utils/index.ts
loadFromStorage<T>(key: string, fallback: T): T
saveToStorage<T>(key: string, value: T): void
```

Used for: tab layouts, widget definitions, panel sizes, user preferences, locale selection.

#### 3. IndexedDB Persistence

- `services/storage.ts` — Baseline time-series data and dashboard snapshots (`orion_db`)
- `services/time-series-store.ts` — Metric recording and retrieval (`orion-time-series`)

#### 4. Convex Reactive Subscriptions

Real-time state via Convex WebSocket:
```typescript
client.onUpdate(api.entitlements.getEntitlementsForUser, {}, (entitlements) => {
  // Reactively update entitlement state
});
```

#### 5. CustomEvent Bus

Inter-component communication via `window.dispatchEvent`:
- `wm:breaking-news` — Breaking news alert
- `wm:deduct-context` — Context deduction
- `theme-changed` — Theme/variant change
- `ai-flow-changed` — AI flow update
- `orion-followed-countries-changed` — Watchlist change
- `orion-framework-changed` — Analysis framework change
- `wm:i18n:resources-loaded` — i18n dictionary loaded

---

## API Layer

### Three Communication Paths

#### Path 1: Convex Real-time (Auth/User Data)

- **File:** `src/services/convex-client.ts`
- Lazy-loaded `ConvexClient` singleton
- Clerk JWT authentication via `setAuth()`
- Used for: entitlements, followed countries, user preferences, user records

#### Path 2: Proto-First RPC (34 Service Domains)

- **File:** `src/services/rpc-client.ts` — `rpcFetch` wrapper
- **File:** `src/services/premium-fetch.ts` — Auth-injecting fetch with 4-tier resolution:
  1. `ORION_API_KEY` from runtime config (desktop/test)
  2. Tester/widget keys (legacy)
  3. Clerk Bearer JWT (premium paths only)
  4. Unauthenticated (non-premium paths)
- Calls `globalThis.fetch` with configurable base URL
- Backend: 60+ Vercel Edge Functions in `api/` directory, generated from `.proto` files

#### Path 3: Convex HTTP Actions (Service-to-Service)

- **File:** `convex/http.ts` — HTTP router with ~15 relay endpoints
- Authenticated via `RELAY_SHARED_SECRET`
- Endpoints: notification channels, digest rules, user preferences, followed countries, checkout, API key validation, MCP token issuance, webhooks

### Data Flow

```
Panel.init()
  → fetchData()  // calls service module
    → premiumFetch('/api/domain/v1/endpoint')
      → Vercel Edge Function
        → External API / Database
    → OR
    → convexClient.query(api.table.get)
      → Convex Cloud
```

---

## Styling & Theming

### Tailwind CSS (CDN)

Loaded directly in `index.html` via CDN:
```
https://cdn.tailwindcss.com?plugins=forms,container-queries
```

No `tailwind.config.js` — configuration is **inline** in `index.html`:
- `darkMode: "class"` — toggled via CSS class on `<html>`
- Material Design 3 color tokens (`--color-primary: #6bfb9a`, `--color-surface: #051424`, etc.)
- Custom fonts: `Hanken Grotesk` (display/body), `JetBrains Mono` (data/code)
- Custom animations: `fadeInUp`, `slideInRight`, `pulse-slow`, `shimmer`
- Custom shadows: `card`, `glow`, `glow-hover`

### Custom CSS (`src/styles/base.css`)

Hand-written CSS for:
- Glass panel effects (`backdrop-blur`, semi-transparent backgrounds)
- Glow effects on hover
- Card hover animations
- Flow-line shimmer animations
- Panel grid layout
- Scrollbar customization

### Icons

Google Material Symbols icon font:
```html
<span class="material-symbols-outlined">icon_name</span>
```

### Map Styling

- **MapLibre GL** — Flat 2D map with Protomaps basemaps
- **deck.gl** — 3D terrain visualization with Mapbox integration
- **globe.gl** — 3D globe view with Three.js rendering

---

## Variant System

### Environment Variable

`VITE_VARIANT` — set via `cross-env` in npm scripts.

### Available Variants (6)

| Variant | Domain | Script | Description |
|---|---|---|---|
| `full` | orion.app | `dev` (default) | Full geopolitical intelligence dashboard |
| `tech` | tech.orion.app | `dev:tech` | AI & tech industry tracking |
| `finance` | finance.orion.app | `dev:finance` | Markets, trading, financial data |
| `commodity` | commodity.orion.app | `dev:commodity` | Mining, commodity ports, supply chains |
| `happy` | happy.orion.app | `dev:happly` | Positive news & global progress |
| `energy` | energy.orion.app | `dev:energy` | Energy infrastructure & disruption tracking |

### How It Works

1. **Build time:** `vite.config.ts` loads `VARIANT_META` from `src/config/variant-meta.ts`
2. **HTML transformation:** `htmlVariantPlugin` replaces `<title>`, meta tags, OG tags, JSON-LD, canonical URLs, and favicon paths
3. **Runtime:** `document.documentElement.dataset.variant` is set before CSS loads
4. **Panel config:** `src/config/variants/full.ts` and `base.ts` define enabled panels per variant
5. **Domain routing:** `middleware.ts` maps subdomains to variants and serves bot-aware stubs

### Variant Metadata

Defined in `src/config/variant-meta.ts` — title, description, keywords, URL, site name, categories, and features for each variant.

---

## Internationalization (i18n)

### Setup

- **Library:** i18next v25.8.10 + i18next-browser-languagedetector v8.2.1
- **File:** `src/services/i18n.ts`

### Supported Languages (24)

en, bg, cs, fr, de, el, es, hr, hu, it, pl, pt, nl, sv, ru, ar, zh, ja, ko, ro, tr, th, vi, hi

### Architecture

1. **First-paint strings:** `en.shell.json` is statically imported (~827 lines of header/nav/shell UI)
2. **Full dictionary:** `en.json` (~3157 lines) and all other locales are **lazy-loaded** via `import.meta.glob('../locales/*.json')`
3. **Detection:** Custom `wmExplicit` detector reads `localStorage['orion-locale-explicit']`, falls back to `navigator` detection
4. **RTL support:** Arabic (`ar`) sets `dir="rtl"` on `<html>`
5. **Language change:** `changeLanguage()` persists to localStorage and triggers full page reload
6. **Healing:** `wm:i18n:resources-loaded` CustomEvent triggers re-render of raw-key placeholders from first-paint window

### Locale Files

Located in `src/locales/` — 24 JSON files + type definitions.

---

## Build & Configuration

### Vite Config (`vite.config.ts`, ~2000 lines)

**Plugins (13):**

| Plugin | Purpose |
|---|---|
| `orion-emit-build-hash` | Emits `dist/build-hash.txt` for stale-bundle detection |
| `htmlVariantPlugin` | Transforms `index.html` with variant-specific meta tags |
| `dashboardHtmlOutputPlugin` | Renames output to `dashboard.html`, defers large CSS |
| `polymarketPlugin` | Dev proxy to Polymarket Gamma API |
| `bootstrapDevPlugin` | Dev middleware serving bootstrap data from Upstash Redis |
| `rssProxyPlugin` | Dev proxy for RSS feeds (large domain allowlist) |
| `youtubeLivePlugin` | Dev middleware for YouTube live status |
| `gpsjamDevPlugin` | Dev middleware for GPS jamming data |
| `hormuzTrackerDevPlugin` | Dev middleware for Hormuz chokepoint data |
| `chatAnalystDevPlugin` | Dev SSE streaming for AI analyst |
| `sebufApiPlugin` | Dev middleware importing full server router (25 domains) |
| `brotliPrecompressPlugin` | Post-build Brotli compression for assets ≥1KB |
| `VitePWA` | PWA manifest, service worker, runtime caching |

**Resolve Aliases:**

| Alias | Target |
|---|---|
| `@` | `src/` |
| `child_process` | `src/shims/child-process.ts` |
| `node:child_process` | `src/shims/child-process.ts` |

**Code Splitting:**

- Manual chunks: `maplibre`, `deck-stack`, `protomaps`, `h3-js`, `d3`, `topojson`, `i18n`, `sentry`, `clerk`, `transformers`, `onnxruntime`
- Panel domain chunks: `markets`, `energy`, `defense`, `news`, `economy`, `intel`, `risk`
- Large data tables: `tech-geo-data`, `airports-data`, `ai-datacenters-data`, `geo-map-data`

**Dev Server:**

- Port: 3000
- Extensive proxy rules: Yahoo Finance, USGS, FRED, Cloudflare Radar, FAA, OpenSky, ADS-B Exchange, AISStream (WebSocket), GDELT, NGA MSI, + 30 RSS feed proxies

### TypeScript Config (`tsconfig.json`)

- Target: ES2020
- Module: ESNext
- Module Resolution: bundler
- Strict mode enabled
- Path alias: `@/*` → `src/*`
- Excludes: `src/workers/ml.worker.ts`

### Biome Linter (`biome.json`)

- Linter only (formatter disabled)
- Key rules: `noFallthroughSwitchClause: error`, `noVar: error`, `noExplicitAny: off`

---

## PWA Support

### Configuration

- **Plugin:** vite-plugin-pwa v1.2.0
- **Register type:** `autoUpdate`
- **Service worker:** Manual registration via `src/bootstrap/sw-update.ts`

### Manifest

Variant-aware (name, description from `VARIANT_META`):
- `display: 'standalone'`
- `start_url: '/dashboard'`
- Theme color: `#0a0f0a`

### Workbox Runtime Caching

| Strategy | Resource |
|---|---|
| NetworkFirst | Navigation requests |
| NetworkOnly | `/api/*` (no SW caching) |
| CacheFirst | PMTiles/Protomaps (30-day TTL) |
| StaleWhileRevalidate | Google Fonts CSS |
| CacheFirst | Google Fonts WOFF (1-year TTL) |
| CacheFirst | Locale files (30-day TTL) |
| StaleWhileRevalidate | Images (7-day TTL) |

### Excluded from Precache

- `ml*.js`, `onnx*.wasm` (ML inference files)
- `locale-*.js` (lazy-loaded locale chunks)
- `clerk-*.js` (auth library)

---

## Key Dependencies

### Geospatial
| Package | Purpose |
|---|---|
| `maplibre-gl` v5 | 2D vector tile map |
| `deck.gl` v9 | WebGL2 data visualization layers |
| `@protomaps/basemaps` | Open-source map tiles |
| `globe.gl` | 3D globe visualization |
| `h3-js` | Uber H3 hexagonal grid system |
| `pmtiles` | Cloud-native vector tiles |
| `topojson-client` | TopoJSON to GeoJSON conversion |
| `satellite.js` | TLE satellite orbit propagation |

### Data & Visualization
| Package | Purpose |
|---|---|
| `d3` v7 | Data visualization primitives |
| `papaparse` | CSV parsing |
| `fast-xml-parser` | XML/RSS parsing |
| `marked` | Markdown rendering |
| `uqr` | QR code generation |
| `canvas-confetti` | Celebration animations |

### AI/ML
| Package | Purpose |
|---|---|
| `@xenova/transformers` | Hugging Face browser inference |
| `onnxruntime-web` | ONNX model execution in browser |
| `@anthropic-ai/sdk` | Anthropic Claude API client |

### Auth & Payments
| Package | Purpose |
|---|---|
| `@clerk/clerk-js` | Authentication (loaded from CDN) |
| `convex` | Real-time backend-as-a-service |
| `dodopayments-checkout` | Payment processing |
| `jose` | JWT handling |

### Infrastructure
| Package | Purpose |
|---|---|
| `@sentry/browser` | Error tracking |
| `dompurify` | HTML sanitization |
| `i18next` | Internationalization |
| `zod` v4 | Schema validation |
| `ws` | WebSocket client |
| `hls.js` | HLS video streaming |
| `telegram` | Telegram Bot API |
| `youtubei.js` | YouTube data extraction |

### Dev Dependencies
| Package | Purpose |
|---|---|
| `vite` v6 | Build tool |
| `typescript` v5.7 | Type checking |
| `@biomejs/biome` | Linting |
| `@playwright/test` | E2E testing |
| `vitest` | Unit testing |
| `cross-env` | Cross-platform env vars |
| `tsx` | TypeScript execution |
| `exceljs` | Excel file generation |

---

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (full variant, port 3000) |
| `npm run dev:tech` | Dev server (tech variant) |
| `npm run dev:finance` | Dev server (finance variant) |
| `npm run dev:energy` | Dev server (energy variant) |
| `npm run dev:commodity` | Dev server (commodity variant) |
| `npm run dev:happly` | Dev server (happy variant) |
| `npm run build` | Typecheck + production build |
| `npm run build:{variant}` | Build with specific variant |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Biome linting |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:convex` | Run Convex unit tests |
| `npm run test:data` | Run data validation tests |
| `npm run preview` | Preview production build locally |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  (App Shell: Nav, Header, Tailwind Config, Inline CSS) │
└──────────────────────┬──────────────────────────────────┘
                       │
                ┌──────▼──────┐
                │   main.ts   │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │    App.ts   │
                │  (84 lines) │
                └──────┬──────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
  ┌──────▼──────┐ ┌────▼────┐ ┌─────▼──────┐
  │PanelFactory │ │IntelTicker│ │ MapContainer│
  └──────┬──────┘ └─────────┘ └────────────┘
         │
  ┌──────▼──────────────────────────────┐
  │         PANEL REGISTRY              │
  │  (161 panels, 9 categories)         │
  └──────┬──────────────────────────────┘
         │
  ┌──────▼──────────────────────────────┐
  │     44 Panel Components             │
  │  (Vanilla TS classes)               │
  │  init() → fetchData() → render()    │
  └──────┬──────────────────────────────┘
         │
  ┌──────▼──────────────────────────────┐
  │         SERVICES LAYER              │
  │  (198 service files)                │
  │  • premiumFetch (HTTP RPC)          │
  │  • ConvexClient (WebSocket)         │
  │  • State singletons                 │
  │  • localStorage/IndexedDB stores    │
  └──────┬──────────────────────────────┘
         │
  ┌──────▼──────────────────────────────┐
  │         API LAYER                   │
  │  • Vercel Edge Functions (60+)      │
  │  • Convex Cloud Functions           │
  │  • External APIs (proxied)          │
  └─────────────────────────────────────┘
```

---

*Generated for the ORION Energy Resilience Platform frontend codebase.*
