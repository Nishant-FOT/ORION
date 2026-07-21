# ORION — Complete Project Documentation

> Operational Risk Intelligence & Optimization Network
> Energy Supply Chain Resilience & Geopolitical Intelligence Platform

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Directory Structure](#3-project-directory-structure)
4. [How Everything is Linked Together](#4-how-everything-is-linked-together)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Schema & Data Layer](#7-database-schema--data-layer)
8. [API Endpoints & Service Domains](#8-api-endpoints--service-domains)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Caching Strategy](#10-caching-strategy)
11. [Real-Time Systems](#11-real-time-systems)
12. [Map Rendering & Geospatial Stack](#12-map-rendering--geospatial-stack)
13. [Machine Learning Pipeline](#13-machine-learning-pipeline)
14. [Internationalization (i18n)](#14-internationalization-i18n)
15. [Dashboard Variants](#15-dashboard-variants)
16. [Panel System (160+ Panels)](#16-panel-system-160-panels)
17. [Data Pipeline & Seed Scripts](#17-data-pipeline--seed-scripts)
18. [External Data Sources (30+)](#18-external-data-sources-30)
19. [Payment & Subscription System](#19-payment--subscription-system)
20. [MCP Server (AI Tool Protocol)](#20-mcp-server-ai-tool-protocol)
21. [Notification System](#21-notification-system)
22. [Security Architecture](#22-security-architecture)
23. [Build & Deployment](#23-build--deployment)
24. [Testing Strategy](#24-testing-strategy)
25. [Development Setup](#25-development-setup)
26. [Environment Variables](#26-environment-variables)
27. [Configuration Files Reference](#27-configuration-files-reference)
28. [Key Design Patterns](#28-key-design-patterns)
29. [Feature Flags & Beta Features](#29-feature-flags--beta-features)
30. [Desktop Application (Tauri)](#30-desktop-application-tauri)
31. [Embed System](#31-embed-system)
32. [Notification Channels](#32-notification-channels)
33. [Broadcast System](#33-broadcast-system)
34. [Referral System](#34-referral-system)
35. [Circuit Breaker & Resilience](#35-circuit-breaker--resilience)
36. [Storage Architecture](#36-storage-architecture)
37. [Event System](#37-event-system)
38. [Web Workers](#38-web-workers)
39. [Progressive Web App (PWA)](#39-progressive-web-app-pwa)
40. [OAuth 2.0 System](#40-oauth-20-system)
41. [Data Freshness & Staleness](#41-data-freshness--staleness)
42. [Entitlement & Gating System](#42-entitlement--gating-system)
43. [Usage Telemetry](#43-usage-telemetry)
44. [Error Handling](#44-error-handling)
45. [Protocol Buffers & Code Generation](#45-protocol-buffers--code-generation)
46. [Scripts & Tooling](#46-scripts--tooling)
47. [Static Assets & Public Directory](#47-static-assets--public-directory)
48. [Consumer Prices Core Module](#48-consumer-prices-core-module)
49. [Railway Relay System](#49-railway-relay-system)
50. [Cloudflare Worker](#50-cloudflare-worker)
51. [Linting & Code Quality](#51-linting--code-quality)
52. [Version Management & Changelog](#52-version-management--changelog)
53. [Known Issues & Technical Debt](#53-known-issues--technical-debt)
54. [Glossary](#54-glossary)

---

## 1. Project Overview

**ORION** (Operational Risk Intelligence & Optimization Network) is a large-scale, real-time global intelligence dashboard platform focused on **energy supply chain resilience** and **geopolitical risk monitoring**. It aggregates data from 30+ external APIs, processes it through 34 service domains, and displays it across 160+ dashboard panels in 6 branded variants — all from a single codebase.

### What It Does
- **Real-time monitoring** of global events: conflicts, earthquakes, wildfires, disease outbreaks, cyber threats, supply chain disruptions
- **Energy supply chain resilience**: tracking oil inventories, pipeline status, fuel prices, chokepoint risks (Strait of Hormuz, Suez Canal, etc.)
- **Financial market intelligence**: stock quotes, commodities, crypto, yield curves, ETF flows, sentiment analysis
- **Geopolitical analysis**: country briefs, escalation correlation, sanctions tracking, military posture
- **AI-powered insights**: LLM summarization, scenario simulation, predictive modeling, anomaly detection
- **Multi-format delivery**: Web dashboard, desktop app (Tauri), PWA, embeddable widgets, MCP server for AI tools

### Key Numbers
- **160+ panels** across 8 categories (map, signals, markets, energy, defense, climate, analysis, reports)
- **34 service domains** with proto-first RPC contracts
- **6 dashboard variants**: Full, Tech, Finance, Commodity, Happy, Energy
- **30+ external data sources** (ACLED, USGS, Yahoo Finance, CoinGecko, NASA FIRMS, etc.)
- **24 supported languages** with RTL support
- **21 cron seed jobs** running on Railway
- **60+ Vercel Edge Functions**

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **TypeScript** (ES2020) | Primary language — vanilla TS, no framework |
| **Vite** (v6.0.7+) | Build tool, dev server, HMR |
| **Preact** (v10.25+) | Lightweight UI rendering (minimal use — most UI is imperative DOM) |
| **MapLibre GL** (v5.16+) | 2D map rendering with vector tiles |
| **deck.gl** (v9.2+) | 3D geospatial visualization (ScatterplotLayer, ArcLayer, HeatmapLayer) |
| **globe.gl** (v2.45+) | 3D globe visualization |
| **ONNX Runtime Web** (v1.26+) | Browser-side ML inference (WebGPU → WebGL → WASM cascade) |
| **i18next** (v25.8+) | Internationalization (24 languages) |
| **Tailwind CSS** (CDN) | Utility-first CSS framework |
| **DOMPurify** (v3.4+) | HTML sanitization |
| **marked** (v17+) | Markdown rendering |
| **d3** (v7.9+) | Data visualization |
| **papaparse** (v5.5+) | CSV parsing |
| **h3-js** (v4.4+) | H3 hexagonal grid system |
| **satellite.js** (v6.0+) | Satellite orbit calculations |
| **hls.js** (v1.6+) | HLS video streaming |
| **PMTiles** (v4.4+) | Cloud-optimized geospatial tiles |
| **Protomaps** (v5.7+) | Basemap tile source |
| **canvas-confetti** (v1.9+) | Celebration animations |
| **JMESPath** (v0.16+) | JSON query expressions |
| **Zod** (v4.3+) | Schema validation |

### Backend
| Technology | Purpose |
|---|---|
| **Vercel Edge Functions** | Serverless API endpoints (60+) |
| **Convex** (v1.32+) | Realtime database, serverless functions, cron jobs |
| **Upstash Redis** | Distributed caching, rate limiting |
| **Railway** | Cron seed jobs, AIS WebSocket relay, RSS relay |
| **Cloudflare Workers** | CORS preflight at `api.orion.app` |
| **Protocol Buffers** | API contract definitions (34 domains) |
| **sebuf** (v0.11+) | Proto → TypeScript code generator |

### Authentication & Payments
| Technology | Purpose |
|---|---|
| **Clerk** (v6.13+) | User authentication, JWT validation |
| **Dodo Payments** (v1.8+) | Subscription/payment processing |
| **HMAC-SHA256** | Internal service-to-service auth |
| **OAuth 2.0** | MCP server authorization (PKCE S256) |

### AI & ML
| Technology | Purpose |
|---|---|
| **Groq API** | Primary LLM provider (14,400 req/day free) |
| **OpenRouter** | Fallback LLM provider |
| **Ollama** | Self-hosted local LLM |
| **Anthropic SDK** (v0.91+) | Claude API integration |
| **Xenova Transformers** (v2.17+) | Browser-side NER, embeddings, sentiment |
| **ONNX Runtime Web** | ML model inference in browser |

### Monitoring & Analytics
| Technology | Purpose |
|---|---|
| **Sentry** (v10.39+) | Error tracking (edge + browser) |
| **Axiom** | Usage telemetry |
| **Vercel Analytics** | Page analytics |
| **Web Vitals** | Performance metrics |

---

## 3. Project Directory Structure

```
ORION/
├── api/                        # Vercel Edge Functions (60+ endpoints)
│   ├── _api-key.js             # API key validation
│   ├── _cors.js                # CORS headers
│   ├── _rate-limit.js          # Rate limiting
│   ├── _session.js             # Session token management
│   ├── _crypto.js              # Cryptographic utilities
│   ├── _sentry-edge.js         # Sentry error capture
│   ├── _upstash-json.js        # Redis pipeline helper
│   ├── _relay.js               # Railway relay client
│   ├── _oauth-token.js         # OAuth token resolution
│   ├── _mcp-grant-hmac.ts      # MCP HMAC signing
│   ├── _rss-allowed-domains.js # RSS domain allowlist
│   ├── bootstrap.js            # Bootstrap hydration endpoint (38 keys)
│   ├── health.js               # Health monitoring (100+ checks)
│   ├── rss-proxy.js            # Domain-allowlisted RSS proxy
│   ├── og-story.js             # Social card image generation
│   ├── story.js                # Story/OG endpoint
│   ├── version.js              # Version endpoint
│   ├── orion-session.js        # Anonymous session minting
│   ├── opensky.js              # OpenSky aircraft proxy
│   ├── gpsjam.js               # GPS interference data
│   ├── oref-alerts.js          # Israeli Home Front alerts
│   ├── polymarket.js           # Polymarket predictions
│   ├── telegram-feed.js        # Telegram feed proxy
│   ├── reverse-geocode.js      # Reverse geocoding
│   ├── geo.js                  # Geolocation
│   ├── seed-health.js          # Seed health probe
│   ├── seed-contract-probe.ts  # Contract verification
│   ├── product-catalog.js      # Product catalog
│   ├── user-prefs.ts           # User preferences CRUD
│   ├── notify.ts               # Notification dispatch
│   ├── notification-channels.ts # Channel management
│   ├── symbol-search.ts        # Financial symbol search
│   ├── cache-purge.js          # Cache purge
│   ├── download.js             # Data download
│   ├── latest-brief.ts         # Latest brief retrieval
│   ├── chat-analyst.ts         # AI chat analyst
│   ├── customer-portal.ts      # Customer portal
│   ├── create-checkout.ts      # Dodo Payments checkout
│   ├── [domain]/v1/[rpc].ts    # 34 proto-first RPC endpoints
│   │   ├── aviation/v1/
│   │   ├── climate/v1/
│   │   ├── conflict/v1/
│   │   ├── consumer-prices/v1/
│   │   ├── cyber/v1/
│   │   ├── displacement/v1/
│   │   ├── economic/v1/
│   │   ├── forecast/v1/
│   │   ├── giving/v1/
│   │   ├── health/v1/
│   │   ├── imagery/v1/
│   │   ├── infrastructure/v1/
│   │   ├── intelligence/v1/
│   │   ├── leads/v1/
│   │   ├── maritime/v1/
│   │   ├── market/v1/
│   │   ├── military/v1/
│   │   ├── natural/v1/
│   │   ├── news/v1/
│   │   ├── positive-events/v1/
│   │   ├── prediction/v1/
│   │   ├── radiation/v1/
│   │   ├── research/v1/
│   │   ├── resilience/v1/
│   │   ├── sanctions/v1/
│   │   ├── scenario/v1/
│   │   ├── seismology/v1/
│   │   ├── supply-chain/v1/
│   │   ├── thermal/v1/
│   │   ├── trade/v1/
│   │   ├── unrest/v1/
│   │   ├── webcam/v1/
│   │   └── wildfire/v1/
│   ├── mcp.ts                  # MCP server entry point
│   ├── mcp/                    # MCP protocol implementation
│   │   ├── handler.ts          # JSON-RPC over HTTP+SSE
│   │   ├── auth.ts             # MCP authentication
│   │   ├── dispatch.ts         # Tool dispatch
│   │   ├── registry/           # Tool registry
│   │   ├── resources/          # Resource definitions
│   │   ├── prompts/            # Prompt definitions
│   │   ├── quota.ts            # Daily quota enforcement
│   │   └── telemetry.ts        # MCP telemetry
│   ├── mcp-proxy.ts            # MCP proxy endpoint
│   ├── oauth/                  # OAuth 2.0 endpoints
│   │   ├── authorize.js        # Authorization endpoint
│   │   ├── authorize-pro.ts    # Pro-tier authorization
│   │   ├── register.js         # Client registration
│   │   └── token.ts            # Token endpoint
│   ├── oauth-protected-resource.ts # RFC 9728 metadata
│   ├── slack/oauth/            # Slack OAuth integration
│   ├── discord/oauth/          # Discord OAuth integration
│   ├── user/                   # User management endpoints
│   ├── me/                     # User entitlement check
│   ├── referral/               # Referral system
│   ├── brief/                  # Digest brief system
│   ├── internal/               # Internal-only endpoints
│   ├── skills/                 # Agent skills index
│   ├── data/                   # Static data endpoints
│   ├── security/               # Security report receiver
│   ├── youtube/                # YouTube integration
│   └── v2/shipping/            # Shipping API v2
│
├── server/                     # Shared server logic
│   ├── gateway.ts              # Central gateway (auth, rate limit, cache, telemetry)
│   ├── router.ts               # Map-based route matcher (O(1) static, linear dynamic)
│   ├── cors.ts                 # CORS origin allowlist
│   ├── auth-session.ts         # Clerk JWT validation with cached JWKS
│   ├── error-mapper.ts         # Error → HTTP response mapper
│   ├── alias-rewrite.ts        # URL rewrite helper for legacy v1 paths
│   ├── env.d.ts                # Environment type declarations
│   ├── _shared/                # Shared utilities (52 files)
│   │   ├── auth-session.ts     # Gateway-level Clerk JWT verification
│   │   ├── internal-auth.ts    # Timing-safe HMAC comparison
│   │   ├── mcp-internal-hmac.ts # Internal MCP HMAC service auth
│   │   ├── premium-check.ts    # Premium caller detection
│   │   ├── entitlement-check.ts # Tier enforcement
│   │   ├── user-api-key.ts     # User API key validation
│   │   ├── pro-mcp-token.ts    # Pro MCP token validation
│   │   ├── turnstile.ts        # Cloudflare Turnstile CAPTCHA
│   │   ├── rate-limit.ts       # Three-tier rate limiting (Upstash Redis)
│   │   ├── redis.ts            # Upstash Redis client (cache, pipeline, coalescing)
│   │   ├── cache-keys.ts       # Cache key patterns
│   │   ├── llm.ts              # Multi-provider LLM client (Ollama/Groq/OpenRouter)
│   │   ├── llm-health.ts       # LLM provider health gate
│   │   ├── acled.ts            # ACLED conflict data client
│   │   ├── airline-codes.ts    # IATA/ICAO airline codes
│   │   ├── chokepoint-registry.ts # Strategic chokepoint data
│   │   ├── country-normalize.ts # Country name normalization
│   │   ├── source-tiers.ts     # Source credibility tiers
│   │   ├── fetch-json.ts       # Upstream JSON fetch with timeout
│   │   ├── relay.ts            # Railway relay base URL + auth
│   │   ├── usage.ts            # Axiom-based API usage telemetry
│   │   ├── response-headers.ts # WeakMap-based response header attachment
│   │   ├── seed-envelope.ts    # Seed-envelope aware reading
│   │   ├── resilience-freshness.ts # Resilience data freshness
│   │   └── simulation-queue.ts # Simulation queue management
│   └── orion/                  # 34 domain handler modules
│       ├── aviation/v1/handler.ts
│       ├── climate/v1/handler.ts
│       ├── conflict/v1/handler.ts
│       ├── consumer-prices/v1/handler.ts
│       ├── cyber/v1/handler.ts
│       ├── displacement/v1/handler.ts
│       ├── economic/v1/handler.ts
│       ├── forecast/v1/handler.ts
│       ├── giving/v1/handler.ts
│       ├── health/v1/handler.ts
│       ├── imagery/v1/handler.ts
│       ├── infrastructure/v1/handler.ts
│       ├── intelligence/v1/handler.ts
│       ├── leads/v1/handler.ts
│       ├── maritime/v1/handler.ts
│       ├── market/v1/handler.ts
│       ├── military/v1/handler.ts
│       ├── natural/v1/handler.ts
│       ├── news/v1/handler.ts
│       ├── positive-events/v1/handler.ts
│       ├── prediction/v1/handler.ts
│       ├── radiation/v1/handler.ts
│       ├── research/v1/handler.ts
│       ├── resilience/v1/handler.ts
│       ├── sanctions/v1/handler.ts
│       ├── scenario/v1/handler.ts
│       ├── seismology/v1/handler.ts
│       ├── supply-chain/v1/handler.ts  # Largest: ~20 RPC methods
│       ├── thermal/v1/handler.ts
│       ├── trade/v1/handler.ts
│       ├── unrest/v1/handler.ts
│       ├── webcam/v1/handler.ts
│       └── wildfire/v1/handler.ts
│
├── convex/                     # Convex realtime database
│   ├── schema.ts               # Database schema (24 tables)
│   ├── users.ts                # User mutations/queries
│   ├── userPreferences.ts      # User settings CRUD
│   ├── entitlements.ts         # Feature gating
│   ├── subscriptions.ts        # Dodo Payments subscriptions
│   ├── customers.ts            # Paid customer records
│   ├── registrations.ts        # Waitlist registrations
│   ├── contactMessages.ts      # Contact form messages
│   ├── alertRules.ts           # Configurable alert triggers
│   ├── followedCountries.ts    # Country watchlist
│   ├── notificationChannels.ts # Telegram/Slack/Discord/Email/Webhook/Web Push
│   ├── userApiKeys.ts          # User-owned API keys (wm_ prefix)
│   ├── mcpProTokens.ts         # OAuth tokens for MCP
│   ├── broadcastRampConfig.ts  # Email broadcast ramp config
│   ├── broadcast/              # Broadcast pipeline
│   ├── payments/               # Dodo Payments integration
│   ├── http.ts                 # HTTP route handlers (18 routes)
│   ├── crons.ts                # Cron job definitions (7 jobs)
│   └── lib/                    # Shared utilities
│
├── src/                        # Frontend (Vanilla TypeScript)
│   ├── main.ts                 # Entry point → App.init()
│   ├── App.ts                  # Main application class
│   ├── settings-main.ts        # Settings window entry point
│   ├── vite-env.d.ts           # Vite client types
│   ├── pwa.d.ts                # PWA types
│   ├── app/                    # Application core (13 files)
│   │   ├── app-context.ts      # Central state container
│   │   ├── country-intel.ts    # Country intelligence briefing
│   │   ├── data-loader.ts      # Central data loading orchestration
│   │   ├── event-handlers.ts   # Global event handler setup
│   │   ├── panel-layout.ts     # Panel grid layout management
│   │   ├── refresh-scheduler.ts # Periodic data refresh
│   │   ├── search-manager.ts   # Global search
│   │   └── agent-bus-applier.ts # Agent bus event application
│   ├── bootstrap/              # Startup tasks (6 files)
│   │   ├── secondary-startup.ts # Deferred font loading, analytics
│   │   ├── sentry-init.ts      # Sentry initialization
│   │   ├── stale-bundle-check.ts # Stale bundle detection
│   │   └── sw-update.ts        # Service worker updates
│   ├── components/             # UI components
│   │   ├── PanelFactory.ts     # Central panel factory (maps IDs → classes)
│   │   ├── ResizablePanel.ts   # Drag-to-resize/reorder panels
│   │   ├── MapContainer.ts     # Geospatial map container
│   │   ├── IntelTicker.ts      # Scrolling intelligence ticker
│   │   ├── MarketsPanel.ts     # Markets overview
│   │   ├── ChokepointsPanel.ts # Chokepoints display
│   │   ├── EnergySupplyPanel.ts # Energy supply network
│   │   └── panels/             # 118+ panel component files
│   ├── config/                 # Configuration & data (36+ files)
│   │   ├── index.ts            # Barrel exports
│   │   ├── panel-registry.ts   # 161 panels in 8 categories
│   │   ├── panels.ts           # Panel default configs, entitlements
│   │   ├── variant.ts          # Variant selector (hardcoded 'full')
│   │   ├── variant-meta.ts     # Variant metadata
│   │   ├── variants/           # Per-variant configs
│   │   ├── feeds.ts            # RSS feed URLs, source tiers
│   │   ├── geo.ts              # Geopolitical hotspots
│   │   ├── markets.ts          # Stock sectors, commodities
│   │   ├── military.ts         # Military data
│   │   ├── ports.ts            # Global port database
│   │   ├── pipelines.ts        # Oil/gas pipelines
│   │   ├── entities.ts         # Entity registry
│   │   ├── countries.ts        # Country data
│   │   ├── tech-geo.ts         # Tech HQs, cloud regions
│   │   ├── ai-datacenters.ts   # AI data centers
│   │   ├── finance-geo.ts      # Stock exchanges, financial centers
│   │   ├── ml-config.ts        # ML configuration
│   │   └── push.ts             # Push notification config
│   ├── services/               # Business logic (130+ files, 18 domains)
│   │   ├── index.ts            # Barrel exports (~50 modules)
│   │   ├── i18n.ts             # Internationalization (i18next)
│   │   ├── rss.ts              # RSS feed fetching/parsing
│   │   ├── live-news.ts        # Real-time news aggregation
│   │   ├── live-data-service.ts # Unified live data streaming
│   │   ├── storage.ts          # LocalStorage abstraction
│   │   ├── settings-manager.ts # API key management
│   │   ├── runtime.ts          # Runtime detection (web/Tauri)
│   │   ├── clerk.ts            # Authentication (Clerk)
│   │   ├── auth-state.ts       # Auth state management
│   │   ├── billing.ts          # Payment/subscription
│   │   ├── checkout.ts         # Checkout flow
│   │   ├── entitlements.ts     # Feature gating
│   │   ├── alert-engine.ts     # Alert rule engine
│   │   ├── llm-service.ts      # LLM service integration
│   │   ├── summarization.ts    # Text summarization
│   │   ├── predictive-models.ts # ML predictions
│   │   ├── correlation.ts      # Cross-domain correlation
│   │   ├── clustering.ts       # News event clustering
│   │   ├── entity-extraction.ts # Named entity recognition
│   │   ├── threat-classifier.ts # Threat level classification
│   │   ├── geopolitical-risk-agent.ts # Risk scoring agent
│   │   ├── scenario-engine.ts  # What-if scenario modeling
│   │   ├── procurement-optimizer.ts # Procurement optimization
│   │   ├── signal-aggregator.ts # Multi-source signal aggregation
│   │   ├── convex-client.ts    # Convex database client
│   │   ├── rpc-client.ts       # RPC client for sidecar API
│   │   ├── mcp-clients.ts      # MCP client integration
│   │   ├── smart-poll-loop.ts  # Adaptive polling with backoff
│   │   ├── tab-store.ts        # Multi-tab state sync
│   │   ├── panel-data-loader.ts # Panel-specific data loading
│   │   ├── persistent-cache.ts # IndexedDB persistent cache
│   │   ├── aviation/           # Flight tracking, airline intel
│   │   ├── climate/            # Climate data, ocean monitoring
│   │   ├── conflict/           # Armed conflict data (ACLED, UCDP)
│   │   ├── consumer-prices/    # CPI and inflation data
│   │   ├── correlation-engine/ # Cross-domain correlation
│   │   ├── cyber/              # Cyber threat intelligence
│   │   ├── displacement/       # Population displacement tracking
│   │   ├── economic/           # Economic indicators (FRED, BLS)
│   │   ├── infrastructure/     # Infrastructure monitoring
│   │   ├── intelligence/       # Intelligence aggregation
│   │   ├── maritime/           # AIS shipping, vessel tracking
│   │   ├── market/             # Market data, crypto, stocks
│   │   ├── military/           # Military flights, vessels, bases
│   │   ├── news/               # News aggregation
│   │   ├── prediction/         # Prediction markets (Polymarket)
│   │   ├── research/           # Research data
│   │   ├── scenario/           # Scenario modeling
│   │   ├── supply-chain/       # Supply chain disruption monitoring
│   │   ├── trade/              # WTO trade data
│   │   ├── unrest/             # Social unrest monitoring
│   │   ├── webcams/            # Live webcam feeds
│   │   └── wildfires/          # Wildfire monitoring (NASA FIRMS)
│   ├── shared/                 # Cross-cutting data stores (9 files)
│   │   ├── pipeline-registry-store.ts
│   │   ├── pipeline-evidence.ts
│   │   ├── storage-facility-registry-store.ts
│   │   ├── fuel-shortage-registry-store.ts
│   │   └── disruption-timeline.ts
│   ├── types/                  # TypeScript types
│   │   ├── index.ts            # 1,230 lines of shared types
│   │   ├── globe-gl.d.ts
│   │   └── uqr.d.ts
│   ├── utils/                  # Utility functions (40+ files)
│   │   ├── index.ts            # Barrel exports
│   │   ├── theme-manager.ts    # Theme management (dark/light/auto)
│   │   ├── circuit-breaker.ts  # Circuit breaker pattern
│   │   ├── with-timeout.ts     # Fetch with timeout
│   │   ├── sanitize.ts         # HTML sanitization
│   │   ├── proxy.ts            # CORS proxy URL generation
│   │   ├── urlState.ts         # URL state serialization
│   │   ├── country-flag.ts     # Country code → flag emoji
│   │   ├── toast.ts            # Toast notifications
│   │   ├── sparkline.ts        # Sparkline charts
│   │   ├── export.ts           # Export to JSON/CSV
│   │   ├── reverse-geocode.ts  # Reverse geocoding
│   │   └── ... (30+ more)
│   ├── workers/                # Web Workers
│   │   ├── analysis.worker.ts  # Clustering, correlation (off main thread)
│   │   ├── ml.worker.ts        # ML inference (off main thread)
│   │   └── vector-db.ts        # Client-side vector database
│   ├── generated/              # Auto-generated API clients
│   │   ├── client/             # 33 domain client stubs
│   │   └── server/             # 33 domain server handlers
│   ├── locales/                # 24 language translation files
│   │   ├── en.json             # English (3,157 lines)
│   │   ├── ar.json             # Arabic
│   │   ├── zh.json             # Chinese
│   │   └── ... (21 more)
│   ├── embed/                  # Embeddable widget
│   │   ├── embed-url.ts
│   │   └── embed-data-loader.ts
│   ├── data/                   # Static JSON data
│   │   ├── world-happiness.json
│   │   ├── renewable-installations.json
│   │   └── conservation-wins.json
│   ├── styles/                 # CSS
│   │   └── base.css            # Base styles (glass-panel, glow, animations)
│   ├── shims/                  # Module shims
│   │   ├── child-process.ts
│   │   └── child-process-proxy.ts
│   └── e2e/                    # E2E test harnesses
│       ├── map-harness.ts
│       ├── mobile-map-harness.ts
│       └── mobile-map-integration-harness.ts
│
├── shared/                     # Isomorphic shared code (47 files)
│   ├── source-tiers.json       # Source credibility tiers
│   ├── country-bboxes.json     # Country bounding boxes
│   └── ... (45 more reference data files)
│
├── proto/                      # Protocol Buffer definitions (100+ .proto files)
│   ├── buf.gen.yaml            # Code generation config
│   └── orion/*/v1/*.proto      # Domain service definitions
│
├── scripts/                    # Build & seed scripts (100+ files)
│   ├── seed-*.mjs              # Railway seed scripts (21 cron jobs)
│   ├── ais-relay.cjs           # AIS vessel WebSocket relay
│   ├── validate-rss-feeds.mjs  # RSS feed validation
│   ├── lint-*.mjs              # Custom lint scripts
│   └── ... (90+ more)
│
├── workers/                    # Cloudflare Worker
│   └── api-cors-preflight/     # CORS preflight at api.orion.app
│       ├── src/index.js
│       └── wrangler.toml
│
├── consumer-prices-core/       # Standalone price scraping pipeline (90 files)
│
├── data/                       # Static reference data
│   ├── telegram-channels.json  # Telegram OSINT channels
│   ├── gamma-irradiators.json  # Gamma irradiator facilities
│   ├── israeli-localities.json # Israeli localities
│   └── oref-translations.json  # Oref alert translations
│
├── tests/                      # Unit/integration tests
├── e2e/                        # Playwright E2E tests
├── docs/                       # Documentation
├── claude/                     # AI assistant documentation
├── deploy/                     # Nginx deployment config
├── public/                     # Static assets (90+ files)
│
├── index.html                  # SPA entry HTML (landing page + dashboard shell)
├── middleware.ts                # Vercel Edge Middleware (bot filtering, variant routing)
├── vite.config.ts              # Vite configuration (2,118 lines)
├── tsconfig.json               # TypeScript config (frontend)
├── tsconfig.api.json           # TypeScript config (API/server)
├── vercel.json                 # Vercel deployment (500 lines)
├── biome.json                  # Biome linter config
├── playwright.config.ts        # Playwright E2E config
├── vitest.config.mts           # Vitest unit test config
├── Makefile                    # Proto code generation toolchain
├── nixpacks.toml               # Railway build config
├── package.json                # Dependencies & scripts
├── .env.example                # 150+ environment variables
├── .env.local                  # Local environment overrides
├── .nvmrc                      # Node.js 22
├── .npmrc                      # npm loglevel=error
├── .gitignore                  # node_modules, dist, .env
├── ARCHITECTURE.md             # System architecture documentation
├── PLAN.md                     # Implementation plan for panel updates
└── PROJECT_DOCUMENTATION.md    # This file
```

---

## 4. How Everything is Linked Together

### Data Flow Chain

```
External APIs (30+)
    ↓
Railway Seed Jobs (21 crons, every 5min-6hr)
    ↓
Upstash Redis Cache (38 bootstrap keys + per-domain RPC keys)
    ↓
┌─────────────────────────────────────────────────────────┐
│ Vercel Edge Functions (60+)                              │
│   ├── /api/bootstrap → Single pipeline call, 38 keys     │
│   ├── /api/{domain}/v1/{rpc} → Proto-first RPC handlers  │
│   ├── /api/rss-proxy → Domain-allowlisted RSS            │
│   └── /api/mcp → MCP protocol handler                    │
│                                                          │
│ Gateway Pipeline (per-request):                           │
│   1. Strip client headers                                │
│   2. Origin check                                        │
│   3. CORS headers                                        │
│   4. OPTIONS preflight                                   │
│   5. Internal-MCP HMAC verify                            │
│   6. Session resolution (Clerk JWT)                      │
│   7. API key validation                                  │
│   8. Entitlement check                                   │
│   9. Rate limiting                                       │
│  10. Route match (O(1) static Map)                       │
│  11. Handler execution                                   │
│  12. Cache tier headers                                  │
│  13. Usage telemetry                                     │
└─────────────────────────────────────────────────────────┘
    ↓
Frontend (Vanilla TypeScript SPA)
    ├── Bootstrap Hydration (38 keys in 1 HTTP round-trip)
    ├── SmartPollLoop (adaptive polling per data source)
    ├── PanelFactory → 160+ panels in 8 categories
    ├── MapContainer (MapLibre + deck.gl + globe.gl)
    ├── Web Workers (ML, clustering, RSS parsing)
    └── Event Bus (CustomEvent dispatch)
```

### Request Lifecycle (Frontend → Backend)

1. **Page Load**: `index.html` → `src/main.ts` → `App.init()`
2. **Bootstrap**: `GET /api/bootstrap?tier=fast` → 38 Redis keys in 1 pipeline call
3. **Category Navigation**: User clicks category → `App.showCategory()` destroys current panels → creates new panel grid
4. **Panel Initialization**: `PanelFactory` maps panel ID → class → creates DOM → calls `init()` in parallel batches (6 concurrent, 80ms stagger)
5. **Data Fetching**: Each panel calls its service function → `SmartPollLoop` or `fetch()` → Edge Function → Redis cache → Upstream API
6. **Real-time Updates**: WebSocket (AIS vessels) + SmartPollLoop (adaptive polling) + Event Bus (CustomEvent)
7. **State Persistence**: Panel positions/sizes → localStorage → restored on next visit

### Key Connections

| From | To | Mechanism |
|---|---|---|
| `index.html` | `src/main.ts` | `<script type="module">` |
| `src/main.ts` | `src/App.ts` | `new App().init()` |
| `src/App.ts` | `src/components/PanelFactory.ts` | Panel creation |
| `src/components/PanelFactory.ts` | `src/components/panels/*.ts` | ID → class mapping |
| `src/components/panels/*.ts` | `src/services/*.ts` | Data fetching |
| `src/services/*.ts` | `api/{domain}/v1/{rpc}` | HTTP POST to Edge Functions |
| `api/{domain}/v1/{rpc}` | `server/gateway.ts` | Gateway pipeline |
| `server/gateway.ts` | `server/orion/{domain}/v1/handler.ts` | Route matching |
| `server/orion/{domain}/v1/handler.ts` | `server/_shared/redis.ts` | Cache read/write |
| `server/_shared/redis.ts` | Upstash Redis | HTTP REST API |
| `server/orion/{domain}/v1/handler.ts` | External APIs | Upstream fetch |
| `scripts/seed-*.mjs` | Upstash Redis | Write cached data |
| `convex/schema.ts` | Convex Cloud | Realtime database |
| `src/services/convex-client.ts` | Convex | Client queries/mutations |
| `middleware.ts` | `vercel.json` rewrite rules | Request routing |
| `workers/api-cors-preflight/` | `api.orion.app/*` | CORS preflight at CF edge |

---

## 5. Frontend Architecture

### Entry Points
- **Main Dashboard**: `index.html` → `src/main.ts` → `src/App.ts`
- **Settings Window**: Separate HTML → `src/settings-main.ts`
- **Embed Widget**: `embed.html` → `src/embed/embed-url.ts`
- **Live Channels**: `live-channels.html`
- **MCP Grant**: `mcp-grant.html`

### Application Class (`src/App.ts`)
The `App` class is the central orchestrator:
- Creates `PanelFactory` for panel management
- Sets up category-based navigation (8 categories: map, signals, markets, energy, defense, climate, analysis, reports)
- Manages the intel ticker
- Opens country brief overlays
- **No traditional SPA router** — navigation is category-based, not URL-based

### Panel System

Every data view is a **panel** — a TypeScript class that:
1. Receives a container `HTMLElement` in the constructor
2. Calls `async init()` to fetch data and render
3. Implements `destroy()` for cleanup
4. Uses event delegation on stable containers (survives innerHTML replacement)

**Panel Factory** (`src/components/PanelFactory.ts`):
- Maps 161 panel IDs to component classes
- Creates panel DOM elements with drag-and-drop reordering
- Initializes panels in parallel batches (6 concurrent, 80ms stagger)
- Handles panel persistence (position, size in localStorage)

**Panel Categories** (8):
| Category | Panel Count | Example Panels |
|---|---|---|
| Map | 1 | MapContainer (DeckGL + MapLibre + globe.gl) |
| Signals | 10 | LiveNewsPanel, BreakingNewsPanel, AIS Shipping, Airline Intel |
| Markets | 22 | MarketOverview, FearGreed, YieldCurve, ETF Flows, WSB Tickers |
| Energy | 26+ | EnergyCrisis, OilInventories, HormuzTracker, PipelineStatus |
| Defense | 9 | StrategicPosture, CyberThreats, Sanctions, RadiationWatch |
| Climate | 7 | ClimateAnomaly, Earthquakes, WeatherAlerts, Displacement |
| Analysis | 22+ | CountryBrief, CorrelationPanel, ScenarioSimulator, ChatAnalyst |
| Reports | 5 | ExecutiveReports, OrionDecisionDesk, AlternativeRoutes |

### State Management
- **AppContext** (`src/app/app-context.ts`): Central state container holding map reference, news data, market data, panel settings, map layers, cyber threats cache
- **localStorage**: Panel positions, user preferences, theme, language
- **IndexedDB**: Persistent cache for large datasets
- **URL State**: Map state serialized in URL (lat, lon, zoom, layers)
- **Convex**: Server-side user preferences, entitlements, subscriptions
- **CustomEvent Bus**: Cross-component communication (wm:breaking-news, theme-changed, etc.)

### Component Pattern
```typescript
class MyPanel {
  private container: HTMLElement;
  private data: MyData[] = [];
  
  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  async init(): Promise<void> {
    this.container.innerHTML = '<div class="loading">...</div>';
    try {
      this.data = await fetchMyData();
      this.render();
    } catch (e) {
      this.container.innerHTML = '<div class="error">Failed to load</div>';
    }
  }
  
  private render(): void {
    this.container.innerHTML = `...`;
    // Event delegation on this.container
  }
  
  destroy(): void {
    this.container.innerHTML = '';
  }
}
```

---

## 6. Backend Architecture

### Deployment Topology

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Vercel      │    │   Railway    │    │   Convex     │
│              │    │              │    │              │
│ • SPA (CDN)  │    │ • 21 Cron    │    │ • Realtime   │
│ • Edge Funcs │    │   seed jobs  │    │   Database   │
│ • Edge MW    │    │ • AIS Relay  │    │ • Functions  │
│ • Analytics  │    │   (WebSocket)│    │ • Cron Jobs  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────┴────────┐
                   │   Upstash Redis  │
                   │   (Cache Layer)  │
                   └─────────────────┘
```

### Vercel Edge Functions

Each domain has its own edge function entry point (tree-shaken for cold-start optimization):

```typescript
// api/{domain}/v1/[rpc].ts
export const config = { runtime: 'edge' };
import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createXServiceRoutes } from '../../../src/generated/server/orion/x/v1/service_server';
import { xHandler } from '../../../server/orion/x/v1/handler';
export default createDomainGateway(createXServiceRoutes(xHandler, serverOptions));
```

### Gateway Pipeline (`server/gateway.ts`)

Every request passes through this pipeline:
1. **Header stripping**: Remove client-controlled `x-user-id`, `x-orion-mcp-internal-verified`
2. **Origin check**: Reject disallowed origins
3. **CORS headers**: Generate per-origin
4. **OPTIONS preflight**: Short-circuit
5. **Internal-MCP HMAC verify**: If `X-ORION-MCP-Internal` present
6. **Session resolution**: Clerk JWT for tier-gated endpoints
7. **API key validation**: Enterprise/user/session keys
8. **Entitlement check**: Tier enforcement
9. **Rate limiting**: Global + per-endpoint
10. **Route match**: O(1) static Map lookup, linear scan for dynamic routes
11. **Handler execution**: Domain-specific business logic
12. **Cache tier headers**: Applied from `RPC_CACHE_TIER` map
13. **Usage telemetry**: Axiom event emission (fire-and-forget)

### Cache Tier System

8 cache tiers with different TTL strategies:

| Tier | s-maxage | stale-while-revalidate | Use Case |
|---|---|---|---|
| `fast` | 60s | 300s | Breaking news, live events |
| `medium` | 120s | 600s | Market data, weather |
| `slow` | 300s | 1800s | Climate, conflict statistics |
| `slow-browser` | 300s | 1800s | Browser-cached slow data |
| `static` | 600s | 3600s | Port data, pipeline routes |
| `daily` | 3600s | 14400s | Daily aggregations |
| `no-store` | — | — | Auth-sensitive data |
| `live` | 30s | 60s | Real-time feeds |

### Domain Handlers (`server/orion/`)

34 domain handler modules, each containing:
- `v1/handler.ts` — RPC method implementations
- Individual method files for each RPC operation
- Reads from Redis cache (`getCachedJson` / `cachedFetchJson`)
- Falls back to upstream API on cache miss

---

## 7. Database Schema & Data Layer

### Convex Database Tables (24)

| Table | Purpose | Key Fields |
|---|---|---|
| `users` | All Clerk-authenticated users | `clerkUserId`, `email`, `createdAt` |
| `userPreferences` | Per-user settings | `userId`, `theme`, `language`, `mapLayers` |
| `entitlements` | Feature gating | `userId`, `tier` (0-3), `features[]` |
| `subscriptions` | Dodo Payments subscriptions | `userId`, `planId`, `status`, `expiresAt` |
| `customers` | Paid user records | `userId`, `dodoCustomerId`, `email` |
| `registrations` | Waitlist entries | `email`, `name`, `company`, `status` |
| `contactMessages` | Contact form submissions | `name`, `email`, `message`, `createdAt` |
| `alertRules` | Configurable alert triggers | `userId`, `condition`, `action`, `enabled` |
| `followedCountries` | Country watchlist | `userId`, `countryCode`, `addedAt` |
| `notificationChannels` | Notification targets | `userId`, `type` (telegram/slack/email/discord/webhook/webpush), `config` |
| `userApiKeys` | User-owned API keys | `userId`, `keyHash`, `prefix`, `createdAt` |
| `mcpProTokens` | OAuth tokens for MCP | `userId`, `tokenHash`, `scopes[]`, `expiresAt` |
| `broadcastRampConfig` | Email broadcast config | `rampPercentage`, `maxPerWave`, `intervalMs` |
| `broadcastCampaigns` | Broadcast campaign records | `name`, `templateId`, `status`, `stats` |
| `broadcastWaves` | Broadcast wave tracking | `campaignId`, `waveNumber`, `recipientCount` |
| `broadcastRecipients` | Per-recipient tracking | `campaignId`, `userId`, `status`, `sentAt` |
| `broadcastTemplates` | Email templates | `name`, `subject`, `htmlContent`, `variables` |
| `referralCodes` | Referral code registry | `userId`, `code`, `space`, `createdAt` |
| `referralAttributions` | Conversion tracking | `referrerId`, `referredId`, `convertedAt` |
| `usageEvents` | API usage tracking | `domain`, `route`, `status`, `duration`, `timestamp` |
| `webhookSubscriptions` | Shipping API webhooks | `subscriberId`, `url`, `events[]` |
| `productCatalog` | Product catalog | `id`, `name`, `price`, `features[]` |
| `featureFlags` | Runtime feature toggles | `flag`, `enabled`, `rolloutPercentage` |
| `auditLogs` | Security audit trail | `userId`, `action`, `resource`, `timestamp` |

### Convex Functions

- **Queries** (read-only): `users.ts`, `userPreferences.ts`, `entitlements.ts`, `subscriptions.ts`, `alertRules.ts`, `followedCountries.ts`, `notificationChannels.ts`
- **Mutations** (write, transactional): CRUD for all tables above
- **Actions** (side effects, external I/O): Payment webhooks, email dispatch, notification sending, broadcast campaign execution
- **HTTP Routes** (18): Webhook receivers for Dodo Payments, Stripe, Telegram bot
- **Cron Jobs** (7): Broadcast ramp runner, wave cleanup, shard seeding

### Convex Realtime Features
- User preferences sync across tabs
- Entitlement changes reflected instantly
- Subscription status updates in real-time
- Alert rule triggers fire immediately
- Broadcast campaign progress live updates

---

## 8. API Endpoints & Service Domains

### 34 Proto-First RPC Domains

Each domain has a `.proto` definition, generated TypeScript client/server, and edge function entry point:

| Domain | Description | Example RPCs |
|---|---|---|
| `aviation` | Flight tracking, airline intel | `listFlights`, `getAirlineIntel`, `getAirportDelays` |
| `climate` | Climate data, ocean monitoring | `listClimateAnomalies`, `getCo2Monitoring` |
| `conflict` | Armed conflict data | `listAcledEvents`, `listUcdpEvents` |
| `consumer-prices` | CPI and inflation | `listConsumerPrices`, `getInflationTrend` |
| `cyber` | Cyber threat intelligence | `listCyberThreats`, `getThreatActors` |
| `displacement` | Population displacement | `getUnhcrPopulation`, `listDisplacementFlows` |
| `economic` | Economic indicators | `getEconomicIndicators`, `listFredSeries` |
| `forecast` | Predictive modeling | `triggerSimulation`, `getForecast` |
| `giving` | Charitable giving data | `listGivingTrends` |
| `health` | Health data | `listDiseaseOutbreaks`, `getHealthAirQuality` |
| `imagery` | Satellite imagery | `getSatelliteImagery` |
| `infrastructure` | Infrastructure monitoring | `listInfrastructureEvents` |
| `intelligence` | Intelligence aggregation | `classifyEvent`, `getInsights` |
| `leads` | Lead capture | `submitContact`, `registerInterest` |
| `maritime` | AIS shipping, vessel tracking | `getVesselSnapshot`, `listShippingRoutes` |
| `market` | Market data, crypto, stocks | `getMarketQuotes`, `getCryptoPrices` |
| `military` | Military flights, vessels | `listMilitaryFlights`, `getMilitaryPosture` |
| `natural` | Natural disasters | `listNaturalEvents`, `listEarthquakes` |
| `news` | News aggregation | `summarizeArticleCache`, `listNewsFeeds` |
| `positive-events` | Good news tracking | `listPositiveEvents` |
| `prediction` | Prediction markets | `listPolymarketData` |
| `radiation` | Radiation monitoring | `listRadiationData` |
| `research` | Research papers | `listResearchPapers` |
| `resilience` | Energy resilience scoring | `getResilienceRanking`, `getRuntimeManifest` |
| `sanctions` | Sanctions tracking | `lookupSanctionEntity`, `listSanctions` |
| `scenario` | What-if scenario modeling | `runScenario`, `listTemplates` |
| `seismology` | Earthquake monitoring | `listEarthquakes` |
| `supply-chain` | Supply chain disruption | `getShippingRates`, `getChokepointStatus`, `getPipelineDetail` (~20 RPCs) |
| `thermal` | Thermal imaging | `listThermalData` |
| `trade` | WTO trade data | `listTradeData` |
| `unrest` | Social unrest monitoring | `listUnrestEvents` |
| `webcam` | Live webcam feeds | `listWebcams` |
| `wildfire` | Wildfire monitoring | `listWildfires` |

### Special Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/bootstrap` | GET | Bootstrap hydration (38 Redis keys in 1 pipeline call) |
| `/api/health` | GET | Health monitoring (100+ seed freshness checks) |
| `/api/rss-proxy` | GET | Domain-allowlisted RSS proxy with SSRF protection |
| `/api/mcp` | POST | MCP protocol handler (JSON-RPC over HTTP+SSE) |
| `/api/oauth/*` | Various | OAuth 2.0 authorization, token, registration |
| `/api/orion-session` | POST | Anonymous session token minting |
| `/api/og-story` | GET | Social card image generation (Vercel OG) |
| `/api/chat-analyst` | POST | AI chat analyst with SSE streaming |
| `/api/create-checkout` | POST | Dodo Payments checkout creation |
| `/api/user-prefs` | GET/PUT | User preferences CRUD |
| `/api/notify` | POST | Notification dispatch |
| `/api/version` | GET | Version endpoint (no auth required) |
| `/api/security/report` | POST | CSP/COOP/COEP violation reports |

### Public No-Auth RPC Paths

These endpoints bypass bot filtering and authentication:
- `/api/conflict/v1/list-acled-events`
- `/api/natural/v1/list-natural-events`
- `/api/resilience/v1/get-runtime-manifest`
- `/api/seismology/v1/list-earthquakes`
- `/api/unrest/v1/list-unrest-events`
- `/api/leads/v1/submit-contact`
- `/api/leads/v1/register-interest`

---

## 9. Authentication & Authorization

### 5-Layer Auth Stack

#### Layer 1: Anonymous Session Tokens
- **Prefix**: `ors_`
- **Mechanism**: HMAC-signed tokens, freely mintable by any browser
- **Purpose**: Satisfies basic API key gate; NOT proof of identity
- **Endpoint**: `POST /api/orion-session`
- **Rejected**: When `forceKey=true` (premium endpoints)

#### Layer 2: Enterprise API Keys
- **Source**: `ORION_VALID_KEYS` environment variable (comma-separated)
- **Mechanism**: Operator-issued keys
- **Purpose**: Bypasses entitlement checks; used by Tauri desktop
- **Auth kind**: `enterprise`

#### Layer 3: User-Owned API Keys
- **Prefix**: `wm_` + 40 hex chars
- **Mechanism**: SHA-256 hashed, validated against Convex `userApiKeys` table
- **Purpose**: API access without Clerk JWT
- **Auth kind**: `user`
- **Validation**: 60s Redis cache TTL

#### Layer 4: Clerk JWT Bearer Tokens
- **Mechanism**: RS256-verified via cached JWKS
- **Fields**: `userId` (sub), `role` (from `plan` claim or Clerk API lookup)
- **Cache**: 5-minute in-memory cache for plan lookups
- **Purpose**: User-specific features, tier-gated endpoints

#### Layer 5: Internal-MCP HMAC
- **Mechanism**: HMAC-SHA-256 signing of `{ts}:{method}:{pathname}:{queryHash}:{bodyHash}:{userId}`
- **Timestamp window**: 30 seconds (replay defense)
- **Nonce**: Per-process-startup random nonce for verified marker
- **Purpose**: MCP edge → backend service-to-service auth

### Entitlement System

| Tier | Level | Features |
|---|---|---|
| Free | 0 | Basic panels, limited data sources |
| Pro | 1 | All panels, MCP access, priority support |
| API | 2 | API access, custom integrations |
| Enterprise | 3 | Unlimited access, custom deployment |

- **Source**: Convex `entitlements` table (synced from Dodo Payments webhook)
- **Caching**: Redis with 15-minute TTL, Convex fallback on miss
- **Enforcement**: `server/_shared/entitlement-check.ts` with `ENDPOINT_ENTITLEMENTS` map
- **Fail-closed**: All error paths deny access

---

## 10. Caching Strategy

### Three-Tier Caching

```
Tier 1: In-Memory (hydrationCache Map)
├── One-time read, then evicted
├── Used for bootstrap hydration
└── Eliminates 38 independent API calls

Tier 2: Upstash Redis
├── 38 bootstrap keys (fast/slow tiers)
├── Per-domain RPC cache keys
├── Negative sentinels (__ORION_NEG__)
└── In-flight promise coalescing

Tier 3: CDN (Vercel)
├── s-maxage directives per tier (60s-3600s)
├── stale-while-revalidate
└── stale-if-error fallback

Client-Side Cache:
├── IndexedDB (persistent, large datasets)
└── localStorage (preferences, panel state)
```

### Cache Stampede Prevention

The `cachedFetchJson()` function in `server/_shared/redis.ts` implements:
1. **In-flight coalescing**: Concurrent cache misses for the same key are merged into a single upstream fetch
2. **Negative sentinels**: Cache `__ORION_NEG__` to prevent repeated upstream calls for missing data
3. **Local positive fallback**: If Redis is unavailable, serve from in-memory cache
4. **Timeout protection**: Upstream fetches have configurable timeouts

### Bootstrap Hydration

The most critical optimization:
```
GET /api/bootstrap?tier=fast
→ Single Redis pipeline call
→ Returns 38 keys in 1 HTTP round-trip
→ Eliminates 38 independent API calls
→ Saves 2-4 seconds first-meaningful-paint
```

Fast tier (s-maxage=1200s, 20 min): earthquakes, outages, macroSignals, chokepoints, marketQuotes, riskScores, predictions
Slow tier (s-maxage=7200s, 2 hours): bisPolicy, minerals, cyberThreats, climate, naturalEvents, unrest, ucdpEvents

---

## 11. Real-Time Systems

### AIS Vessel Tracking
- **Connection**: WebSocket to AISStream.io
- **Backpressure**: 3 watermarks (1K/4K/8K messages)
- **Capacity**: 20,000 vessels (most recent per MMSI)
- **Density**: 5,000 cells (2°x2° grid)
- **History**: 30-point trail per vessel
- **Auth**: HMAC authentication

### SmartPollLoop (Adaptive Polling)
- Exponential backoff on failures
- 5x throttle when tab hidden
- Manual trigger support
- Circuit breaker integration
- Reason tagging (interval/resume/manual/startup)

### Event Bus (CustomEvent)
- `wm:breaking-news` — New breaking news events
- `wm:deduct-context` — Context deduction events
- `theme-changed` — Theme toggle
- `ai-flow-changed` — AI analysis flow state change

### WebSocket Connections
- **AIS vessels**: AISStream.io persistent connection
- **Railway relay**: AIS + OpenSky + RSS proxy
- **Convex**: Realtime database subscriptions

---

## 12. Map Rendering & Geospatial Stack

### 2D View (MapLibre GL)
- **Basemap**: PMTiles with Protomaps vector tiles
- **Overlays**: GeoJSON layers, H3 hex grids
- **Interactions**: Click, hover, popup rendering
- **Performance**: Vector tiles, lazy-loaded styles

### 3D View (deck.gl)
- **ScatterplotLayer**: Point data (conflicts, events)
- **ArcLayer**: Routes and connections
- **PolygonLayer**: Region boundaries
- **HeatmapLayer**: Density visualization
- **BitmapLayer**: Satellite imagery overlays

### Globe View (globe.gl)
- **Point markers**: Global event visualization
- **Flight trails**: Aircraft paths
- **Vessel positions**: Ship tracking
- **Heatmap overlay**: Global density

### Marker System (Discriminated Unions)
```typescript
type MapMarker = 
  | { _kind: 'conflict'; lat: number; lon: number; severity: number; ... }
  | { _kind: 'flight'; lat: number; lon: number; callsign: string; ... }
  | { _kind: 'vessel'; lat: number; lon: number; mmsi: string; ... }
  | { _kind: 'earthquake'; lat: number; lon: number; magnitude: number; ... }
  | ... // 15+ marker types with exhaustive switch matching
```

### Map Layers
- Conflict zones (ACLED/UCDP data)
- Military bases and movements
- Energy infrastructure (pipelines, refineries, ports)
- Supply chain routes and chokepoints
- Weather patterns and climate anomalies
- Cyber threat distribution
- Economic indicators by region
- Population density and displacement flows

---

## 13. Machine Learning Pipeline

### Browser-Side ML (ONNX Runtime Web)

```
Capability Detection Cascade:
WebGPU (fastest) → WebGL (fast) → WASM+SIMD (fallback)

Models:
├── Embeddings (384-dim float32)
├── Named Entity Recognition (NER)
├── Sentiment Analysis
└── Summarization

Execution:
├── Runs in Web Workers (off main thread)
├── Excluded on devices with <4GB RAM
└── Graceful degradation to server-side LLM
```

### Server-Side LLM Integration

Multi-provider LLM client (`server/_shared/llm.ts`):
- **Groq** (primary, 14,400 req/day free)
- **OpenRouter** (fallback)
- **Ollama** (self-hosted, local)
- **Generic OpenAI-compat** (custom endpoints)

Use cases:
- Article summarization
- Event classification (threat level, sentiment)
- Geopolitical risk scoring
- Scenario simulation
- Chat analyst (AI Q&A with SSE streaming)
- Opinion vs fact classification
- Feel-good news classification

### Client-Side ML Features
- **Clustering**: Jaccard similarity for news event grouping
- **Correlation**: Cross-domain signal correlation
- **Entity Extraction**: Named entity recognition (countries, organizations, persons)
- **Vector Database**: Semantic search via client-side vector DB
- **Threat Classification**: Threat level scoring
- **Focal Point Detection**: Events of interest identification

---

## 14. Internationalization (i18n)

### Supported Languages (24)
Arabic (ar), Bulgarian (bg), Czech (cs), German (de), Greek (el), Spanish (es), French (fr), Hindi (hi), Croatian (hr), Hungarian (hu), Italian (it), Japanese (ja), Korean (ko), Dutch (nl), Polish (pl), Portuguese (pt), Romanian (ro), Russian (ru), Swedish (sv), Thai (th), Turkish (tr), Vietnamese (vi), Chinese (zh), English (en)

### Features
- **RTL Support**: Automatic direction detection for Arabic
- **Lazy Loading**: Locale files loaded on demand
- **Shell Subset**: `en.shell.json` (~3,157 lines) for first-paint English
- **Type-Safe**: Some locales have `.d.ts` type declarations
- **Key Healing**: `i18n-raw-key-healer.ts` heals untranslated raw keys that flash before locale loads

---

## 15. Dashboard Variants

### 6 Variants from One Deployment

| Variant | Domain | Theme Color | Focus |
|---|---|---|---|
| **Full** | `orion.app` | Green `#6bfb9a` | All 34 domains, complete dashboard |
| **Tech** | `tech.orion.app` | Blue `#4a9eff` | Technology, AI, cybersecurity |
| **Finance** | `finance.orion.app` | Gold `#ffd700` | Financial markets, economics |
| **Commodity** | `commodity.orion.app` | Orange `#ff8c00` | Energy, materials, commodities |
| **Happy** | `happy.orion.app` | Cream `#FAFAF5` | Positive news, feel-good stories |
| **Energy** | `energy.orion.app` | Teal `#00bfa5` | Energy supply chain focus |

### How Variants Work
1. **Build time**: `VITE_VARIANT` env var selects which panels/data to include
2. **Runtime**: `middleware.ts` maps subdomains to variants
3. **Tree-shaking**: Each variant only includes relevant panels and data tables
4. **Shared assets**: Identical SPA assets served from same CDN cache
5. **HTML customization**: `htmlVariantPlugin` in vite.config.ts replaces title, meta, theme-color, favicon per variant

---

## 16. Panel System (160+ Panels)

### Panel Categories & Complete List

#### Map (1 panel)
- `map-container` — Geospatial map with DeckGL/MapLibre/globe.gl

#### Signals (10 panels)
- `live-news` — Real-time news aggregation
- `breaking-news` — Breaking news banner
- `cross-source-signals` — Multi-source signal correlation
- `threat-timeline` — Threat event timeline
- `gdelt-intel` — GDELT intelligence feed
- `ais-shipping` — AIS vessel tracking
- `airline-intel` — Airline intelligence
- `service-status` — Service availability status
- `geopolitical-hubs` — Geopolitical hub visualization
- `live-intelligence` — Live intelligence feed

#### Markets (22 panels)
- `market-overview` — Market overview dashboard
- `market-implications` — Market impact analysis
- `market-breadth` — Market breadth indicators
- `economic-indicators` — Economic indicators
- `economic-calendar` — Economic event calendar
- `fear-greed` — Fear & Greed Index
- `aaii-sentiment` — AAII Sentiment Survey
- `macro-signals` — Macroeconomic signals
- `macro-tiles` — Macro data tiles
- `financial-stress` — Financial Stress Index
- `yield-curve` — Yield curve visualization
- `cot-positioning` — Commitment of Traders
- `liquidity-shifts` — Liquidity flow analysis
- `positioning` — Market positioning
- `gold-intelligence` — Gold market intelligence
- `etf-flows` — ETF flow analysis
- `wsb-tickers` — WallStreetBets ticker tracking
- `national-debt` — National debt visualization
- `gulf-economies` — Gulf state economics
- `consumer-prices` — Consumer price index
- `daily-market-brief` — Daily market summary
- `stablecoins` — Stablecoin market data

#### Energy (26+ panels)
- `energy-complex` — Energy complex overview
- `energy-crisis` — Energy crisis monitoring
- `energy-disruptions` — Energy disruption tracking
- `energy-risk` — Energy risk assessment
- `energy-supply` — Energy supply network
- `oil-inventories` — Oil inventory tracking
- `fuel-prices` — Fuel price monitoring
- `fuel-shortages` — Fuel shortage alerts
- `pipeline-status` — Pipeline status monitoring
- `storage-facilities` — Storage facility tracking
- `chokepoint-strip` — Chokepoint strip view
- `chokepoint-monitoring` — Chokepoint monitoring
- `chokepoints` — Strategic chokepoints
- `hormuz-tracker` — Strait of Hormuz tracker
- `supply-chain` — Supply chain disruption
- `trade-policy` — Trade policy tracking
- `renewable-energy` — Renewable energy data
- `investments` — Energy investment tracking
- `procurement-advisor` — Procurement optimization
- `reserve-optimization` — Reserve management
- `alert-center` — Energy alert center
- `india-energy-hub` — India energy focus
- `india-spr-timeline` — India SPR timeline
- `refinery-compatibility` — Refinery compatibility
- `corridor-risk-monitor` — Corridor risk monitoring
- `ai-scenario-simulator` — AI scenario simulation
- `procurement-action-center` — Procurement actions
- `live-disruption-probability` — Live disruption probability

#### Defense (9 panels)
- `strategic-posture` — Strategic military posture
- `strategic-risk` — Strategic risk assessment
- `defense-patents` — Defense patent tracking
- `ucdp-events` — UCDP conflict events
- `oref-sirens` — Israeli Home Front alerts
- `thermal-escalation` — Thermal escalation detection
- `security-advisories` — Security advisory feed
- `sanctions` — Sanctions tracking
- `radiation` — Radiation monitoring
- `cyber-threats` — Cyber threat intelligence

#### Climate (7 panels)
- `climate-anomaly` — Climate anomaly tracking
- `displacement` — Population displacement
- `disease-outbreaks` — Disease outbreak monitoring
- `population-exposure` — Population exposure analysis
- `social-velocity` — Social velocity tracking
- `earthquakes` — Earthquake monitoring
- `weather-alerts` — Weather alert feed

#### Analysis (22+ panels)
- `insights` — AI-generated insights
- `deduction` — Analytical deduction
- `country-brief` — Country intelligence brief
- `country-deep-dive` — In-depth country analysis
- `country-timeline` — Country event timeline
- `historical-intel` — Historical intelligence
- `regional-intel` — Regional intelligence
- `forecast` — Predictive forecasting
- `geopolitical-risk` — Geopolitical risk scoring
- `chat-analyst` — AI chat analyst
- `mcp-data` — MCP data integration
- `correlation` — Cross-domain correlation
- `military-correlation` — Military correlation
- `escalation-correlation` — Escalation correlation
- `economic-correlation` — Economic correlation
- `disaster-correlation` — Disaster correlation
- `country-instability-index` — Country instability index
- `cascade-analysis` — Cascade failure analysis
- `quantitative-risk` — Quantitative risk scoring
- `scenario-simulator` — Scenario simulation
- `hero-spotlight` — Hero spotlight
- `positive-news` — Positive news aggregation
- `good-things-digest` — Good things digest
- `breakthroughs` — Breakthroughs tracker
- `species` — Species conservation

#### Reports (5 panels)
- `executive-action` — Executive action items
- `executive-reports` — Executive report generation
- `orion-decision-desk` — Decision desk
- `alternative-routes` — Alternative shipping routes
- `mcp-data-report` — MCP data report

---

## 17. Data Pipeline & Seed Scripts

### Railway Seed Pipeline (21 Cron Jobs)

| Seed Script | Source | Frequency |
|---|---|---|
| `seed-earthquakes` | USGS M4.5+ | 5 min |
| `seed-market-quotes` | Yahoo Finance | 5 min |
| `seed-commodity-qt` | Yahoo Finance | 5 min |
| `seed-crypto-qt` | CoinGecko | 5 min |
| `seed-cyber-threats` | Feodo/URLhaus/OTX | 2 hours |
| `seed-outages` | Cloudflare Radar | 5 min |
| `seed-fire-detect` | NASA FIRMS VIIRS | 10 min |
| `seed-climate` | Open-Meteo ERA5 | 15 min |
| `seed-airport-delay` | FAA/AviationStack | 10 min |
| `seed-insights` | Groq LLM | 10 min |
| `seed-predictions` | Polymarket | 10 min |
| `seed-etf-flows` | Yahoo Finance | 15 min |
| `seed-unrest` | ACLED + GDELT | 45 min |
| `seed-ucdp` | UCDP GED API | 6 hours |
| `seed-conflict` | ACLED + HAPI | 15 min |
| `seed-economy` | EIA + FRED | 15 min |
| `seed-supply-chain` | FRED + WTO | 6 hours |
| `seed-advisories` | 24 RSS/Atom feeds | 1 hour |
| `seed-research` | arXiv + HN | 6 hours |
| `seed-correlation` | Cross-domain engine | 5 min |
| `seed-gpsjam` | GPSJam.org H3 | 6 hours |

### Seed Script Pattern
Each seed script:
1. Fetches data from external API
2. Normalizes/transforms data
3. Writes to Upstash Redis with appropriate TTL
4. Optionally triggers downstream processing

### Scripts Directory (100+ files)

| Category | Examples |
|---|---|
| **Seed scripts** | `seed-earthquakes.mjs`, `seed-market-quotes.mjs`, etc. |
| **Shared helpers** | `redis-helpers.mjs`, `fetch-with-timeout.mjs`, `normalize-country.mjs` |
| **Lint scripts** | `lint-boundaries.mjs`, `enforce-safe-html.mjs`, `enforce-api-contract.mjs` |
| **Build scripts** | `build-agent-skills-index.mjs`, `bootstrap-worktree.mjs` |
| **Validation** | `validate-rss-feeds.mjs`, `audit-convex-string-calls.cjs` |
| **Relay** | `ais-relay.cjs` (AIS vessel + OpenSky aircraft + RSS proxy) |

---

## 18. External Data Sources (30+)

### Conflict & Geopolitical
| Source | Data | Usage |
|---|---|---|
| **ACLED** | Armed conflict events | Conflict mapping, event analysis |
| **UCDP GED** | Conflict deaths | Fatality tracking, displacement proxy |
| **GDELT** | Global event database | Event monitoring, sentiment |
| **LiveUAMap** | Conflict visualization | Map overlays |
| **BIS** | Export controls | Sanctions tracking |
| **WTO** | Trade data | Trade flow analysis |

### Financial
| Source | Data | Usage |
|---|---|---|
| **Yahoo Finance** | Stock quotes, ETFs | Market overview, sector analysis |
| **CoinGecko** | Cryptocurrency prices | Crypto market tracking |
| **Polymarket** | Prediction markets | Probability forecasting |
| **FRED** | Economic indicators | Macro analysis |
| **Alpha Vantage** | Financial data | Technical analysis |

### Natural & Disaster
| Source | Data | Usage |
|---|---|---|
| **USGS** | Earthquakes M4.5+ | Seismic monitoring |
| **NASA FIRMS** | Active fire detection | Wildfire tracking |
| **GDACS** | Disaster alerts | Disaster response |
| **Open-Meteo** | Weather/climate data | Weather forecasting |
| **ECMWF** | Climate reanalysis | Climate anomaly detection |

### Infrastructure
| Source | Data | Usage |
|---|---|---|
| **Cloudflare Radar** | DDoS/traffic data | Internet health monitoring |
| **OpenSky** | Aircraft tracking | Aviation intelligence |
| **AISStream** | Vessel tracking | Maritime intelligence |
| **FAA** | Airport delays | Aviation disruption |
| **GPSJam** | GPS interference | Navigation risk |

### Intelligence
| Source | Data | Usage |
|---|---|---|
| **Feodo Tracker** | C&C server tracking | Cyber threat intel |
| **URLhaus** | Malware URLs | Cyber threat intel |
| **OTX** | Threat intelligence | Threat analysis |
| **arXiv** | Research papers | Research tracking |
| **Hacker News** | Tech news | Tech intelligence |

### Energy
| Source | Data | Usage |
|---|---|---|
| **EIA** | Petroleum/electricity | Energy supply monitoring |
| **IEA** | Oil stocks | Energy reserve tracking |
| **JODI** | Gas/oil data | Global energy data |
| **Ember** | Electricity data | Power grid monitoring |
| **GIE** | Gas storage | Gas inventory tracking |
| **ENTSO-E** | European grid | European energy data |

### News & RSS
- **24+ RSS/Atom feeds** (BBC, Guardian, NPR, CNN, Al Jazeera, Reuters, etc.)
- **Domain allowlist** (500+ domains) for SSRF protection
- **Fallback to Railway relay** for blocked domains

---

## 19. Payment & Subscription System

### Dodo Payments Integration

**Flow**:
1. User clicks "Upgrade" → `POST /api/create-checkout` → Dodo checkout session
2. User completes payment → Dodo webhook → Convex action
3. Convex updates `subscriptions`, `entitlements`, `customers` tables
4. Edge gateway reads entitlements from Redis (15-min TTL)
5. User gains access to premium features

**Subscription Lifecycle**:
- `active` → `past_due` → `canceled` → `expired`
- `trialing` → `active` → `canceled`
- Webhook events: `checkout.completed`, `subscription.activated`, `subscription.canceled`, `invoice.paid`, `invoice.payment_failed`

**Entitlement Enforcement**:
- `ENDPOINT_ENTITLEMENTS` map defines required tier per endpoint
- `getEntitlements()` reads from Redis, falls back to Convex
- `checkEntitlement()` verifies user tier against required tier
- Fail-closed: All error paths deny access

**Customer Portal**: `api/customer-portal.ts` → Dodo Payments portal for subscription management

---

## 20. MCP Server (AI Tool Protocol)

### Model Context Protocol (MCP)

ORION implements an MCP server for AI tool integration:

**Protocol**: JSON-RPC over HTTP + Server-Sent Events (SSE)

**Capabilities**:
- `tools/list` — List available tools
- `tools/call` — Execute a tool
- `prompts/list` — List available prompts
- `prompts/get` — Get a prompt
- `resources/list` — List available resources
- `resources/read` — Read a resource

**Authentication**:
- Legacy: Environment API key (60/min rate limit)
- Pro: Clerk grant path (60/min per-user)
- Internal: HMAC-signed tool fetches

**OAuth 2.0 Flow**:
1. Client registers at `/api/oauth/register`
2. User authorizes at `/api/oauth/authorize` (PKCE S256)
3. Client exchanges code at `/api/oauth/token`
4. Token stored in Redis with TTL
5. Token used for MCP API access

**Daily Quota**: Pro MCP users have daily usage quotas enforced via Redis INCR+EXPIRE

**Tool Registry**: 30+ tools for data access, analysis, and intelligence queries

---

## 21. Notification System

### 6 Notification Channel Types

| Channel | Configuration |
|---|---|
| **Telegram** | Bot token, chat ID, parse mode |
| **Slack** | Webhook URL, channel, username |
| **Discord** | Webhook URL, username, avatar |
| **Email** | Resend API, from address, to addresses |
| **Webhook** | URL, headers, method |
| **Web Push** | VAPID keys, subscription endpoint |

### Alert Engine (`src/services/alert-engine.ts`)

User-configurable alert rules:
- **Condition**: Threshold, pattern, or schedule
- **Action**: Send notification via configured channel
- **Cooldown**: Prevent alert fatigue
- **Persistence**: Rules stored in Convex `alertRules` table

---

## 22. Security Architecture

### Security Headers (vercel.json)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), bluetooth=()
Content-Security-Policy: [comprehensive policy with 25+ SHA256 hashes]
Cross-Origin-Opener-Policy-Report-Only: same-origin
Cross-Origin-Embedder-Policy-Report-Only: require-corp
```

### Bot Filtering (`middleware.ts`)

Three regex patterns:
1. **BOT_UA**: Blocks crawlers/bots from `/api/*` and `/favico/*` (returns 403 JSON)
2. **SOCIAL_PREVIEW_UA**: Permits social bots (Twitter, Facebook, LinkedIn) on OG routes
3. **AI_CRAWLER_UA**: Permits AI crawlers (GPTBot, ClaudeBot) for variant-aware static stubs

### Additional Security Measures

- **Header stripping**: Client-controlled `x-user-id` and `x-orion-mcp-internal-verified` stripped at gateway entry
- **Body size cap**: 256 KB max for internal-MCP requests
- **Timing-safe comparisons**: All HMAC and key comparisons use constant-time algorithms
- **Fail-closed design**: Missing configuration = deny (not allow)
- **SSRF protection**: RSS proxy uses domain allowlist, Google News feeds rejected
- **API key validation**: SHA-256 hashing with Convex lookup
- **Rate limiting**: Three-tier system (global, per-endpoint, scoped)
- **CSP violation reporting**: `/api/security/report` endpoint
- **Security report endpoint**: CSP/COOP/COEP violation reports

---

## 23. Build & Deployment

### Vercel Deployment

**Build Process**:
1. `npm run build:openapi` — Copy OpenAPI spec to public/
2. `npm run build:agent-skills` — Build agent skills index
3. `tsc` — TypeScript type checking
4. `vite build` — Vite production build
5. **Brotli precompression** — All JS/CSS/HTML/SVG/JSON/WASM files >1KB compressed
6. **HTML variant plugin** — Replace title, meta, theme-color per variant
7. **Dashboard HTML output** — Rename `index.html` to `dashboard.html`

**Build Outputs**:
- `dashboard.html` — Main SPA (renamed from index.html)
- `embed.html` — Embeddable widget
- `settings.html` — Settings window
- `live-channels.html` — Live channels view
- `mcp-grant.html` — MCP authorization
- `assets/` — JS/CSS chunks with content hashes
- `sw.js` — Service worker

**Chunk Splitting**:
- 7 domain-specific panel chunks: `panels-markets`, `panels-energy`, `panels-defense`, `panels-news`, `panels-economy`, `panels-intel`, `panels-risk`
- Manual chunks: maplibre, deck-stack, protomaps, d3, topojson, i18next, Sentry, Clerk, transformers, onnxruntime
- Lazy HTML preload filtering for heavy chunks

### Railway Deployment

**Build**: Nixpacks (nixpacks.toml)
- Installs curl via apt
- `npm ci` for clean install
- Installs scripts/ dependencies

**Start**: `node scripts/ais-relay.cjs` (AIS vessel tracking + OpenSky aircraft + RSS proxy relay)

**Environment**: `NODE_OPTIONS="--dns-result-order=ipv4first"`

### Convex Deployment

- Schema changes auto-migrate
- Functions deployed via `npx convex deploy`
- Cron jobs defined in `convex/crons.ts`
- HTTP routes defined in `convex/http.ts`

### Cloudflare Worker

- Route: `api.orion.app/*`
- Purpose: CORS preflight short-circuit at CF edge
- Excludes public-cors paths (MCP, OAuth, security report)

---

## 24. Testing Strategy

### Unit/Integration Tests

| Tool | Config | Scope |
|---|---|---|
| **tsx --test** | `package.json` scripts | `tests/*.test.mjs`, `tests/*.test.mts` |
| **Vitest** | `vitest.config.mts` | `convex/__tests__/`, `server/__tests__/` |

**Test Commands**:
- `npm run test:data` — Data validation tests (16 workers)
- `npm run test:convex` — Convex function tests
- `npm run test:resilience-validation-smoke` — Resilience validation tests

### E2E Tests (Playwright)

**Config**: `playwright.config.ts`
- **Browser**: Chromium with SwiftShader (software WebGL)
- **Viewport**: 1280x720
- **Timeout**: 90s per test
- **Base URL**: `http://127.0.0.1:4173`
- **Artifacts**: Trace, screenshot, video on failure only

**Test Commands**:
- `npm run test:e2e:full` — Full variant E2E
- `npm run test:e2e:tech` — Tech variant E2E
- `npm run test:e2e:finance` — Finance variant E2E
- `npm run test:e2e:commodity` — Commodity variant E2E
- `npm run test:e2e:energy` — Energy variant E2E
- `npm run test:e2e:visual` — Visual regression tests

### Custom Lint Scripts

| Script | Purpose |
|---|---|
| `lint:boundaries` | Module boundary enforcement |
| `lint:safe-html` | HTML sanitization verification |
| `lint:api-contract` | API contract enforcement |
| `lint:rate-limit-policies` | Rate limit policy validation |
| `lint:premium-fetch` | Premium fetch pattern validation |
| `lint:mintlify-slugs` | Documentation slug validation |
| `lint:unicode` | Unicode safety checks |
| `security:local-env-dumps` | Local secret dump detection |

---

## 25. Development Setup

### Prerequisites
- Node.js 22 (`.nvmrc`)
- npm (`.npmrc`: `loglevel=error`)

### Setup Steps
```bash
# 1. Clone the repository
git clone <repo-url>

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start dev server
npm run dev
# Runs at http://localhost:3000

# 5. Run tests
npm run test:data
npm run test:convex

# 6. Run linting
npm run lint
```

### Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (port 3000) |
| `npm run dev:tech` | Dev with tech variant |
| `npm run dev:finance` | Dev with finance variant |
| `npm run dev:commodity` | Dev with commodity variant |
| `npm run dev:happy` | Dev with happy variant |
| `npm run dev:energy` | Dev with energy variant |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Run Biome linter |
| `npm run lint:fix` | Auto-fix lint issues |

### Proto Code Generation
```bash
# Install tools
make install

# Generate code
make generate

# Check for breaking changes
make breaking

# Format proto files
make format
```

---

## 26. Environment Variables

### Variable Categories (150+)

| Category | Key Variables |
|---|---|
| **AI/LLM** | `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` |
| **Cache** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **Market Data** | `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `COINGECKO_API_KEY` |
| **Energy** | `EIA_API_KEY`, `GIE_API_KEY`, `ENTSO_E_TOKEN` |
| **Economic** | `FRED_API_KEY`, `IMF_API_KEY`, `COMTRADE_API_KEYS` |
| **Aviation** | `AVIATIONSTACK_API`, `ICAO_API_KEY`, `WINGBITS_API_KEY` |
| **Conflict** | `ACLED_EMAIL`, `ACLED_PASSWORD`, `UCDP_ACCESS_TOKEN` |
| **Infrastructure** | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_R2_*` (6 keys) |
| **Satellite** | `NASA_FIRMS_API_KEY`, `RELIEFWEB_APPNAME` |
| **Relay** | `AISSTREAM_API_KEY`, `OPENSKY_CLIENT_ID`, `RELAY_SHARED_SECRET` |
| **Telegram** | `TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, `TELEGRAM_BOT_TOKEN` |
| **Convex** | `CONVEX_URL`, `CONVEX_SERVER_SHARED_SECRET` |
| **Payments** | `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_BUSINESS_ID` |
| **Auth** | `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **MCP** | `MCP_PRO_GRANT_HMAC_SECRET`, `MCP_INTERNAL_HMAC_SECRET` |
| **Notifications** | `RESEND_API_KEY`, `VAPID_*` |
| **Site Config** | `VITE_VARIANT`, `VITE_WS_API_URL`, `VITE_SENTRY_DSN` |

See `.env.example` (1,024 lines) for complete documentation.

---

## 27. Configuration Files Reference

| File | Lines | Purpose |
|---|---|---|
| `vite.config.ts` | 2,118 | Vite build, dev server, plugins, chunk splitting |
| `vercel.json` | 500 | Deployment rules, security headers, caching |
| `tsconfig.json` | 28 | TypeScript frontend config |
| `tsconfig.api.json` | 8 | TypeScript API/server config |
| `biome.json` | 107 | Biome linter rules |
| `playwright.config.ts` | 40 | Playwright E2E config |
| `vitest.config.mts` | 9 | Vitest unit test config |
| `middleware.ts` | 299 | Vercel Edge Middleware |
| `index.html` | 562 | SPA entry HTML |
| `Makefile` | 129 | Proto code generation |
| `nixpacks.toml` | 26 | Railway build config |
| `.env.example` | 1,024 | Environment variable docs |
| `ARCHITECTURE.md` | 520 | System architecture |

---

## 28. Key Design Patterns

| Pattern | Implementation | Purpose |
|---|---|---|
| **No Framework** | Vanilla TypeScript, direct DOM, CustomEvent bus | Zero framework overhead, full control |
| **Panel Delegation** | Event delegation on stable container | Survives innerHTML replacement |
| **Discriminated Unions** | `_kind` field on map markers | Type-safe exhaustive switch matching |
| **Circuit Breakers** | Per-feed breakers, 5-min cooldown | Prevent cascading failures |
| **Cache-First** | In-memory → Redis → CDN → upstream | Minimize upstream calls |
| **Adaptive Polling** | SmartPollLoop with backoff | Reduce load on hidden tabs |
| **Contract-First** | .proto → generated client/server/OpenAPI | No schema drift |
| **Graceful Degradation** | Missing API keys skip sources, never crash | Resilient to config gaps |
| **Multi-Signal Corroboration** | Critical alerts require convergence | Reduce false positives |
| **Browser-First Compute** | ML, clustering, geolocation client-side | Reduce server load |
| **Parallel Initialization** | 6 concurrent panels, 80ms stagger | Fast page load |
| **Negative Sentinels** | Cache `__ORION_NEG__` for missing data | Prevent stampede on misses |
| **In-Flight Coalescing** | Concurrent misses merge into single fetch | Reduce duplicate requests |
| **Fail-Closed** | Missing config = deny (not allow) | Security by default |
| **Two-Stage PATH Resolution** | Proto plugin installation | Prevent stale plugin versions |

---

## 29. Feature Flags & Beta Features

### Feature Flag System

Runtime feature toggles via `VITE_*` environment variables and `featureFlags` Convex table:

- **Variant selection**: `VITE_VARIANT` (full/tech/finance/commodity/happy/energy)
- **Map interaction mode**: `VITE_MAP_INTERACTION_MODE`
- **PMTiles URL**: `VITE_PMTILES_URL`
- **WebSocket API**: `VITE_WS_API_URL`
- **Sentry DSN**: `VITE_SENTRY_DSN`
- **15+ resilience methodology gates**
- **Seed/forecast flags**

### Beta Features (`src/config/beta.ts`)

- Feature gating for experimental panels
- Rollout percentage control
- User-level feature flags via Convex

---

## 30. Desktop Application (Tauri)

### Tauri Integration

- **Runtime detection**: `src/services/runtime.ts` detects Tauri vs web
- **Sidecar API**: `src/services/tauri-bridge.ts` invokes Tauri commands
- **Authentication**: Enterprise API keys (bypass Clerk)
- **Platforms**: macOS, Linux, Windows
- **WebView**: WKWebView (macOS), WebView2 (Windows), WebKitGTK (Linux)

### Tauri-Specific Features
- Native file system access
- System tray integration
- Auto-updater
- Native notifications
- Offline mode with local cache

---

## 31. Embed System

### Embeddable Widget

**Entry**: `embed.html` → `src/embed/embed-url.ts`

**Features**:
- Configurable layers, theme, center, zoom
- External site embedding via iframe
- Responsive sizing
- Theme synchronization

**URL Builder**: `src/embed/embed-url.ts` generates embed URLs with query parameters for customization

---

## 32. Notification Channels

### Channel Configuration

| Channel | Config Fields |
|---|---|
| Telegram | `botToken`, `chatId`, `parseMode` |
| Slack | `webhookUrl`, `channel`, `username` |
| Discord | `webhookUrl`, `username`, `avatarUrl` |
| Email | `resendApiKey`, `fromEmail`, `toAddresses` |
| Webhook | `url`, `headers`, `method` |
| Web Push | `vapidPublicKey`, `vapidPrivateKey`, `subscription` |

### Channel Management
- CRUD operations via `api/notification-channels.ts`
- Stored in Convex `notificationChannels` table
- Per-user channel configuration
- Channel validation on creation

---

## 33. Broadcast System

### Multi-Step Campaign Pipeline

1. **Campaign Creation**: Define template, audience, schedule
2. **Wave Execution**: Process recipients in waves with ramp control
3. **Kill Gate**: Safety mechanism to halt campaigns
4. **Progress Tracking**: Per-recipient delivery status

### Broadcast Ramp Config

- **Ramp Percentage**: Start with N% of recipients
- **Max Per Wave**: Limit recipients per wave
- **Interval Ms**: Delay between waves
- **Purpose**: Prevent email delivery issues at scale

### Cron Jobs
- **Broadcast ramp runner**: Executes wave progression
- **Wave cleanup**: Removes stale wave data
- **Shard seeding**: Distributes recipients across shards

---

## 34. Referral System

### Dual Code Spaces

- **Primary**: Standard referral codes
- **Premium**: Premium-tier referral codes

### Attribution Tracking
- **Referrer**: User who shared the code
- **Referred**: User who signed up
- **Conversion**: When referred user becomes paid
- **Credit**: Attribution stored in Convex `referralAttributions`

### Endpoints
- `GET /api/referral/me` — Get user's referral code
- `POST /api/leads/v1/register-interest` — Register with referral code

---

## 35. Circuit Breaker & Resilience

### Circuit Breaker Pattern

- **Per-feed breakers**: Each data source has independent circuit breaker
- **Cooldown**: 5-minute cooldown after breaker trips
- **States**: Closed (normal) → Open (failing) → Half-Open (testing)
- **Fallback**: Stale data served when breaker is open

### Resilience Features

- **Graceful degradation**: Missing API keys skip sources, never crash
- **Multi-signal corroboration**: Critical alerts require convergence across independent streams
- **Negative sentinels**: Cache missing data to prevent stampede
- **In-flight coalescing**: Concurrent requests merged
- **Timeout protection**: All upstream fetches have configurable timeouts
- **Retry logic**: Exponential backoff with jitter

---

## 36. Storage Architecture

### Client-Side Storage

| Storage | Purpose | Size Limit |
|---|---|---|
| **localStorage** | Preferences, panel state, theme | 5-10 MB |
| **IndexedDB** | Persistent cache, large datasets | 50+ MB |
| **Cache API** | Service worker cache | Configurable |

### Server-Side Storage

| Storage | Purpose | TTL |
|---|---|---|
| **In-Memory Map** | Bootstrap hydration cache | One-time read |
| **Upstash Redis** | Distributed cache | 60s-14400s per tier |
| **Convex** | User data, entitlements, subscriptions | Persistent |
| **CDN (Vercel)** | Static assets | 3600s (immutable) |

### Cross-Tab Sync
- `tab-store.ts` synchronizes state across browser tabs
- `cross-domain-storage.ts` handles cross-domain storage
- `cloud-prefs-sync.ts` syncs preferences to cloud

---

## 37. Event System

### CustomEvent Bus

| Event | Payload | Purpose |
|---|---|---|
| `wm:breaking-news` | `NewsItem` | New breaking news |
| `wm:deduct-context` | `{ country, context }` | Context deduction |
| `theme-changed` | `{ theme }` | Theme toggle |
| `ai-flow-changed` | `{ flow, state }` | AI analysis state |

### Event Delegation Pattern
- Event listeners attached to stable parent containers
- Events bubble up from child elements
- Survives innerHTML replacement
- Reduces memory consumption

---

## 38. Web Workers

### Worker Types

| Worker | Purpose | Files |
|---|---|---|
| **Analysis Worker** | Jaccard clustering, correlation analysis | `analysis.worker.ts` |
| **ML Worker** | ONNX model inference | `ml.worker.ts` |
| **Vector DB** | Client-side vector database | `vector-db.ts` |

### Worker Communication
- `postMessage` / `onmessage` for data transfer
- `Transferable` objects for zero-copy transfer
- `SharedArrayBuffer` for shared memory (when available)

---

## 39. Progressive Web App (PWA)

### PWA Configuration (VitePWA)

- **Service Worker**: Workbox-based, auto-update
- **Max Cached File**: 4MB (for globe.gl/three.js)
- **Precache**: Excludes ML/WASM/locale/Clerk files
- **Runtime Caching**: Navigation, PMTiles, Google Fonts, locale files, images
- **Push Notifications**: `/push-handler.js` for web push

### PWA Features
- Offline mode with cached data
- Home screen installation
- Background sync
- Push notifications

---

## 40. OAuth 2.0 System

### OAuth Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/oauth/register` | POST | Client registration |
| `/api/oauth/authorize` | GET | Authorization (PKCE S256) |
| `/api/oauth/token` | POST | Token exchange |

### Grant Types
- `authorization_code` — User authorization
- `refresh_token` — Token refresh
- `client_credentials` — Service-to-service

### Token Storage
- Redis: `oauth:token:<uuid>`, `oauth:refresh:<uuid>`
- TTL: Configurable per grant type
- Revocation: `POST /api/user/mcp-revoke`

### Pro Flow
1. Clerk grant path stores `{kind:'pro', userId, mcpTokenId}`
2. Pro tokens have higher rate limits and daily quotas

---

## 41. Data Freshness & Staleness

### Freshness Tracking

- **Per-source staleness thresholds**: Different data sources have different acceptable ages
- **Health endpoint**: `GET /api/health` checks 100+ seed freshness checks
- **Status codes**: OK / WARN / CRIT
- **Staleness display**: Panels show data age via `panel-freshness-display.ts`

### Staleness Thresholds

| Data Type | Fresh | Stale | Critical |
|---|---|---|---|
| Breaking news | <5 min | 5-30 min | >30 min |
| Market quotes | <1 min | 1-5 min | >5 min |
| Earthquakes | <10 min | 10-60 min | >60 min |
| Conflict events | <1 hr | 1-6 hr | >6 hr |
| Climate data | <15 min | 15-60 min | >60 min |

---

## 42. Entitlement & Gating System

### Tier Hierarchy

| Tier | Level | Monthly Price | Features |
|---|---|---|---|
| Free | 0 | $0 | Basic panels, limited data |
| Pro | 1 | $19.99 | All panels, MCP access, priority |
| API | 2 | $49.99 | API access, custom integrations |
| Enterprise | 3 | Custom | Unlimited, custom deployment |

### Feature Flags Per Tier

| Feature | Free | Pro | API | Enterprise |
|---|---|---|---|---|
| Basic panels | ✅ | ✅ | ✅ | ✅ |
| All panels | ❌ | ✅ | ✅ | ✅ |
| MCP access | ❌ | ✅ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Custom deployment | ❌ | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ❌ | ✅ |
| Export formats | Limited | All | All | All |

### Gating Mechanism
- **Client-side**: `panel-gating.ts` checks entitlement before panel mount
- **Server-side**: `entitlement-check.ts` verifies tier at gateway level
- **Fail-closed**: Error paths deny access (never allow)

---

## 43. Usage Telemetry

### Axiom-Based Telemetry (`server/_shared/usage.ts`)

**Events emitted per request**:
- `domain` — Service domain
- `route` — RPC method
- `status` — HTTP status code
- `duration` — Request duration (ms)
- `auth_kind` — Authentication type
- `tier` — User tier
- `country` — User country
- `ip` — Client IP (anonymized)
- `user-agent` — Client user agent
- `cache_tier` — Cache tier used

**Circuit breaker**: 5% failure rate / 5-minute window → telemetry stops (never affects API availability)

---

## 44. Error Handling

### Error Mapper (`server/error-mapper.ts`)

| Error Type | HTTP Status | Client Message |
|---|---|---|
| ApiError | Custom statusCode | Error message |
| Network/Fetch | 502 | "Bad Gateway" |
| JSON Parse | 400 | "Bad Request" |
| Unknown | 500 | "Internal Server Error" |
| Rate Limit | 429 | "Too Many Requests" + `Retry-After` |

### Client-Side Error Handling
- **Panel errors**: Caught in `init()`, displayed as error state
- **Fetch errors**: Circuit breaker fallback to stale data
- **ML errors**: Graceful degradation to server-side LLM
- **WebSocket errors**: Auto-reconnect with exponential backoff

---

## 45. Protocol Buffers & Code Generation

### Proto Toolchain

- **buf** (v1.64.0): Protocol Buffer compiler
- **sebuf** (v0.11+): Custom protoc plugins
  - `protoc-gen-ts-client`: TypeScript client stubs
  - `protoc-gen-ts-server`: TypeScript server handlers
  - `protoc-gen-openapiv3`: OpenAPI 3.1.0 specs

### Code Generation Flow

```
.proto files (100+)
    ↓
buf generate (via Makefile)
    ↓
src/generated/client/  — 33 domain client stubs
src/generated/server/  — 33 domain server handlers
docs/api/              — OpenAPI specs
```

### Proto Service Structure

```protobuf
service AviationService {
  rpc ListFlights(ListFlightsRequest) returns (ListFlightsResponse);
  rpc GetAirlineIntel(GetAirlineIntelRequest) returns (GetAirlineIntelResponse);
  // ...
}
```

### Generated Output

**Client** (`src/generated/client/orion/{domain}/v1/service_client.ts`):
- Fetch-based RPC client
- Type-safe request/response
- Automatic URL construction

**Server** (`src/generated/server/orion/{domain}/v1/service_server.ts`):
- Server-side handler interface
- HTTP router generation
- Route descriptors for gateway

---

## 46. Scripts & Tooling

### Build Scripts

| Script | Purpose |
|---|---|
| `build-agent-skills-index.mjs` | Build agent skills index |
| `build-openapi.mjs` | Copy OpenAPI spec to public/ |
| `bootstrap-worktree.mjs` | Bootstrap new worktree |

### Seed Scripts (21)

| Script | Source | Frequency |
|---|---|---|
| `seed-earthquakes.mjs` | USGS M4.5+ | 5 min |
| `seed-market-quotes.mjs` | Yahoo Finance | 5 min |
| `seed-commodity-qt.mjs` | Yahoo Finance | 5 min |
| `seed-crypto-qt.mjs` | CoinGecko | 5 min |
| `seed-cyber-threats.mjs` | Feodo/URLhaus/OTX | 2 hr |
| `seed-outages.mjs` | Cloudflare Radar | 5 min |
| `seed-fire-detect.mjs` | NASA FIRMS VIIRS | 10 min |
| `seed-climate.mjs` | Open-Meteo ERA5 | 15 min |
| `seed-airport-delay.mjs` | FAA/AviationStack | 10 min |
| `seed-insights.mjs` | Groq LLM | 10 min |
| `seed-predictions.mjs` | Polymarket | 10 min |
| `seed-etf-flows.mjs` | Yahoo Finance | 15 min |
| `seed-unrest.mjs` | ACLED + GDELT | 45 min |
| `seed-ucdp.mjs` | UCDP GED API | 6 hr |
| `seed-conflict.mjs` | ACLED + HAPI | 15 min |
| `seed-economy.mjs` | EIA + FRED | 15 min |
| `seed-supply-chain.mjs` | FRED + WTO | 6 hr |
| `seed-advisories.mjs` | 24 RSS/Atom feeds | 1 hr |
| `seed-research.mjs` | arXiv + HN | 6 hr |
| `seed-correlation.mjs` | Cross-domain engine | 5 min |
| `seed-gpsjam.mjs` | GPSJam.org H3 | 6 hr |

### Lint Scripts

| Script | Purpose |
|---|---|
| `lint-boundaries.mjs` | Module boundary enforcement |
| `enforce-safe-html.mjs` | HTML sanitization verification |
| `enforce-sebuf-api-contract.mjs` | API contract enforcement |
| `enforce-rate-limit-policies.mjs` | Rate limit policy validation |
| `enforce-premium-fetch.mjs` | Premium fetch pattern validation |
| `enforce-mintlify-reserved-slugs.mjs` | Documentation slug validation |
| `check-unicode-safety.mjs` | Unicode safety checks |
| `check-local-secret-dumps.mjs` | Local secret dump detection |

### Validation Scripts

| Script | Purpose |
|---|---|
| `validate-rss-feeds.mjs` | RSS feed URL validation |
| `audit-convex-string-calls.cjs` | Convex string call audit |
| `audit-dodo-catalog.cjs` | Dodo product catalog audit |
| `docs-stats.mjs` | Documentation statistics |

---

## 47. Static Assets & Public Directory

### Public Assets (90+ files)

| Directory | Content |
|---|---|
| `favico/` | Favicons for all variants |
| `map-styles/` | MapLibre style definitions |
| `textures/` | 3D textures for globe.gl |
| `data/` | Static JSON data files |
| `pro/` | Pre-built pro variant |
| `icons/` | UI icons |
| `fonts/` | Custom fonts |

### Lazy-Loaded Assets
- Map styles loaded on demand
- Textures loaded when 3D view activated
- Large data tables loaded per-variant

---

## 48. Consumer Prices Core Module

### Standalone Price Scraping Pipeline

**Location**: `consumer-prices-core/` (90 files)

**Purpose**: Scrapes, normalizes, and serves consumer price data (CPI, inflation)

**Architecture**:
- Independent module with its own build process
- `DATABASE_URL` for PostgreSQL storage
- `CONSUMER_PRICES_CORE_API_KEY` / `CONSUMER_PRICES_CORE_BASE_URL` for API access

---

## 49. Railway Relay System

### AIS Relay (`scripts/ais-relay.cjs`)

**Purpose**: WebSocket relay for AIS vessel tracking + OpenSky aircraft + RSS proxy

**Features**:
- Persistent WebSocket connection to AISStream.io
- AIS vessel position processing
- OpenSky aircraft tracking
- RSS feed proxy for blocked domains
- Backpressure management (3 watermarks)
- HMAC authentication

**Environment Variables**:
- `AISSTREAM_API_KEY` — AISStream.io API key
- `OPENSKY_CLIENT_ID` / `OPENSKY_CLIENT_SECRET` — OpenSky credentials
- `RELAY_SHARED_SECRET` — Shared secret for relay auth
- `WS_RELAY_URL` — WebSocket relay URL

---

## 50. Cloudflare Worker

### CORS Preflight Worker

**Location**: `workers/api-cors-preflight/`

**Purpose**: Short-circuits OPTIONS preflight requests at Cloudflare edge (skips Vercel)

**Route**: `api.orion.app/*`

**Features**:
- Immediate CORS header stamping
- Excludes public-cors paths (MCP, OAuth, security report)
- Observability enabled

---

## 51. Linting & Code Quality

### Biome Linter (v2.4.7)

**Configuration**: `biome.json`

**Rules**:
- **Disabled**: `noUnusedVariables`, `noUnusedImports`, `noExplicitAny`, `noConsole`
- **Errors**: `noFallthroughSwitchClause`, `noGlobalAssign`, `noRedeclare`, `noVar`
- **Warnings**: `noDoubleEquals`, `useConst`, `useDefaultParameterLast`

**Overrides**:
- `src/generated/**`: Linter disabled (generated code)
- `public/**`: Linter disabled (static assets)
- `*.html`: a11y rules disabled

### Custom Lint Scripts (8+)

| Script | Purpose |
|---|---|
| `lint:boundaries` | Module boundary enforcement |
| `lint:safe-html` | HTML sanitization verification |
| `lint:api-contract` | API contract enforcement |
| `lint:rate-limit-policies` | Rate limit policy validation |
| `lint:premium-fetch` | Premium fetch pattern validation |
| `lint:mintlify-slugs` | Documentation slug validation |
| `lint:unicode` | Unicode safety checks |
| `security:local-env-dumps` | Local secret dump detection |

---

## 52. Version Management & Changelog

### Build Defines

```typescript
__APP_VERSION__   // package.json version (1.0.0)
__CLERK_JS_VERSION__ // @clerk/clerk-js version (6.x)
__BUILD_HASH__    // Vercel commit SHA or 'dev'
```

### Version Endpoint

`GET /api/version` — Returns current version (no auth required)

---

## 53. Known Issues & Technical Debt

### Documented Issues

1. **Nixpacks curl install**: Occasional Ubuntu mirror hash mismatches (2026-04-17 incident)
2. **Chunk size warning**: 1200 KB (raised from 500 KB due to large geospatial bundles)
3. **Non-critical warning**: Dependency re-optimization on fresh install

### Technical Debt

1. **No SPA router**: Category-based navigation limits deep linking
2. **Vanilla TypeScript**: No framework means more boilerplate
3. **Large data tables**: Some config files are 60+ KB (tech-geo.ts, ai-datacenters.ts)
4. **160+ panels**: High maintenance surface area
5. **150+ env vars**: Complex configuration surface

---

## 54. Glossary

| Term | Definition |
|---|---|
| **AIS** | Automatic Identification System — ship tracking |
| **ACLED** | Armed Conflict Location & Event Data |
| **Bootstrap Hydration** | Single Redis pipeline call returning 38 keys |
| **Circuit Breaker** | Pattern to prevent cascading failures |
| **Convex** | Realtime database platform |
| **deck.gl** | 3D geospatial visualization library |
| **Discriminated Union** | TypeScript pattern with `_kind` field |
| **Edge Function** | Serverless function running at CDN edge |
| **globe.gl** | 3D globe visualization library |
| **H3** | Hexagonal hierarchical spatial index |
| **MapLibre GL** | Open-source map rendering library |
| **MCP** | Model Context Protocol — AI tool integration |
| **Negative Sentinel** | Cache marker for missing data (`__ORION_NEG__`) |
| **PMTiles** | Cloud-optimized geospatial tile format |
| **Proto/Protobuf** | Protocol Buffers — API contract definitions |
| **sebuf** | Custom protoc plugins for TypeScript generation |
| **Seed Script** | Cron job that fetches and caches external data |
| **SmartPollLoop** | Adaptive polling with exponential backoff |
| **Variant** | Branded dashboard build (full/tech/finance/commodity/happy/energy) |

---

*This document covers every aspect of the ORION project as of the current codebase. It is intended to be a complete reference for developers, contributors, and stakeholders.*
