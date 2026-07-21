<div align="center">

# ORION

### Operational Risk Intelligence & Optimization Network

**Energy Supply Chain Resilience Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22+-black.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.4-purple.svg)](https://vitejs.dev)

[Live Demo](https://orion.app) · [Architecture](ARCHITECTURE.md) · [API Docs](docs/api/) · [Contributing](CONTRIBUTING.md)

</div>

---

## Overview

ORION is a real-time geopolitical and energy supply chain intelligence platform. It aggregates data from 30+ external APIs, 500+ RSS feeds, and 21 background cron jobs to provide actionable insights through 160+ interactive dashboard panels.

The platform monitors global events — conflicts, natural disasters, market movements, energy disruptions, cyber threats, and infrastructure risks — and correlates them across domains to surface critical signals before they cascade into crises.

## Key Features

### Intelligence & Monitoring
- **Live News Feed** — Real-time RSS/Atom aggregation from 500+ global sources
- **Country Intelligence Briefs** — AI-generated strategic assessments for 195+ countries
- **Conflict Tracking** — UCDP, ACLED, and curated conflict zone monitoring
- **Threat Timeline** — Chronological escalation tracking with severity scoring
- **Cross-Source Signal Detection** — Correlates events across news, markets, and infrastructure

### Energy & Supply Chain
- **Strait of Hormuz Risk Monitor** — Real-time transit volume and disruption probability
- **Energy Crisis Tracker** — Global supply disruption mapping and price projection
- **Oil Inventories** — EIA weekly data with trend analysis
- **Pipeline Status** — Oil & gas infrastructure monitoring
- **Fuel Shortage Registry** — Global fuel shortage event tracking
- **Live Tanker Positions** — AIS vessel tracking with route analysis

### Markets & Economics
- **Market Dashboard** — Real-time quotes, ETF flows, crypto, and commodities
- **Fear & Greed Index** — Multi-factor sentiment analysis
- **Yield Curve Monitor** — Treasury yield tracking with inversion alerts
- **COT Positioning** — Commitment of Traders analysis
- **Consumer Prices** — Global inflation tracking
- **National Debt Clock** — Sovereign debt sustainability scoring

### Geospatial & Visualization
- **3D Globe** — Interactive globe with all data layers (MapLibre native projection)
- **2D Map** — Flat map with PMTiles/OpenFreeMap basemaps
- **3D Terrain** — deck.gl enhanced terrain view with WebGL layers
- **Chokepoint Strip** — Strategic waterway risk visualization
- **GPS Jamming Zones** — H3 hexagonal interference mapping

### AI & Analytics
- **AI Analyst Chat** — LLM-powered conversational intelligence (Groq/OpenRouter)
- **Forecast Engine** — Multi-model prediction with confidence intervals
- **Scenario Simulator** — What-if analysis for energy disruption scenarios
- **Correlation Engine** — Cross-domain event correlation (military, economic, disaster, escalation)
- **Resilience Scoring** — Country resilience ranking across 8 dimensions
- **Market Implications** — AI-generated market impact analysis

### Infrastructure
- **MCP Server** — Model Context Protocol interface for AI tool integration
- **Agent Skills** — RFC-compliant skill discovery for autonomous agents
- **PWA Support** — Installable web app with offline capabilities
- **Multi-Variant** — 6 themed variants (Full, Tech, Finance, Happy, Commodity, Energy)
- **Cloud Sync** — Settings and preferences synced across devices

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla TypeScript, Vite 6, Tailwind CSS |
| **Map Engine** | MapLibre GL 5, deck.gl 9, PMTiles |
| **3D Globe** | MapLibre native globe projection |
| **ML Runtime** | ONNX Runtime Web, Xenova Transformers |
| **Backend** | Vercel Serverless Functions, Convex Realtime DB |
| **Cache** | Upstash Redis (serverless, pay-per-request) |
| **Auth** | Clerk (OAuth, JWT, session management) |
| **Payments** | Dodo Payments (Pro tier) |
| **Error Tracking** | Sentry |
| **Analytics** | Vercel Analytics |
| **PWA** | vite-plugin-pwa, Workbox |
| **Testing** | Vitest, Playwright, custom test harness |
| **Linting** | Biome |
| **CI/CD** | GitHub Actions, Railway (cron jobs) |
| **Deployment** | Vercel (primary), Cloudflare Pages, Railway |

---

## Project Structure

```
orion/
├── src/                    # Frontend source code
│   ├── components/         # UI components (panels, map, widgets)
│   │   ├── MapContainer.ts # 2D/3D/Globe map engine
│   │   └── panels/         # 160+ dashboard panel components
│   ├── config/             # App configuration (variants, layers, basemaps)
│   ├── services/           # Business logic and API integrations
│   ├── utils/              # Shared utilities
│   ├── types/              # TypeScript type definitions
│   ├── embed/              # Embeddable widget system
│   └── main.ts             # App entry point
├── api/                    # Vercel serverless functions (80+ endpoints)
│   ├── [domain]/v1/        # Domain-scoped RPC handlers
│   ├── mcp/                # MCP server implementation
│   ├── oauth/              # OAuth flows
│   └── internal/           # Internal service endpoints
├── server/                 # Backend services
│   └── _shared/            # Shared server utilities (LLM, Redis, auth)
├── convex/                 # Convex realtime database schema
├── public/                 # Static assets
│   ├── textures/           # Globe textures (earth, night sky)
│   └── .well-known/        # Agent skill definitions
├── tests/                  # Test suite (400+ test files)
├── e2e/                    # End-to-end Playwright tests
├── scripts/                # Build, seed, and utility scripts
├── docs/                   # Documentation
├── proto/                  # Protobuf definitions
├── data/                   # Static data files
├── vite.config.ts          # Vite build configuration
├── vercel.json             # Vercel deployment config
├── wrangler.toml           # Cloudflare Pages config
├── middleware.ts           # Edge middleware (auth, routing)
└── package.json            # Dependencies and scripts
```

---

## Getting Started

### Prerequisites

- **Node.js** 22+ (see `.nvmrc`)
- **npm** 10+
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/Nishant-FOT/ORION.git
cd ORION

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` and add your API keys. All keys are optional — the dashboard works without them, but corresponding features will be disabled.

```env
# AI Summarization (required for AI features)
GROQ_API_KEY=your_groq_key
VITE_GROQ_API_KEY=your_groq_key

# Market Data
FINNHUB_API_KEY=your_finnhub_key
FRED_API_KEY=your_fred_key
EIA_API_KEY=your_eia_key

# Infrastructure Monitoring
NASA_FIRMS_API_KEY=your_nasa_key
AVIATIONSTACK_API_KEY=your_aviation_key

# Cache (Upstash Redis — free tier)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Auth (Clerk)
CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

See [`.env.example`](.env.example) for the full list of 50+ configurable variables.

### Development

```bash
# Start development server
npm run dev

# Start with specific variant
npm run dev:tech        # Technology-focused
npm run dev:finance     # Financial markets
npm run dev:energy      # Energy & commodities
npm run dev:commodity   # Commodity markets
npm run dev:happy       # Positive news
```

### Testing

```bash
# Run unit tests
npm run test:convex

# Run data validation tests
npm run test:data

# Run E2E tests
npm run test:e2e

# Run specific variant E2E
npm run test:e2e:full
npm run test:e2e:tech
```

### Linting

```bash
# Run linter
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Type check
npm run typecheck
```

---

## Building

```bash
# Build for production (default variant)
npm run build

# Build specific variants
npm run build:full
npm run build:tech
npm run build:finance
npm run build:energy
npm run build:commodity
npm run build:happy

# Preview production build
npm run preview
```

---

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set environment variables in the Vercel dashboard
3. Deploy — auto-triggers on push to `main`

```bash
# Or deploy via CLI
npx vercel --prod
```

### Cloudflare Pages

1. Login to Cloudflare: `npx wrangler login`
2. Build and deploy:

```bash
npm run build
npx wrangler pages deploy dist
```

3. Set environment variables in the Cloudflare dashboard

### Railway

The project includes `nixpacks.toml` for Railway deployment. Connect your repo and deploy.

---

## API Reference

ORION exposes 80+ serverless API endpoints organized by domain:

| Domain | Endpoint | Description |
|--------|----------|-------------|
| Intelligence | `/api/intelligence/v1/[rpc]` | Country intelligence queries |
| Resilience | `/api/resilience/v1/[rpc]` | Country resilience scores |
| Conflict | `/api/conflict/v1/[rpc]` | Conflict event data |
| Energy | `/api/supply-chain/v1/[rpc]` | Energy supply chain data |
| Market | `/api/market/v1/[rpc]` | Market data and analysis |
| Climate | `/api/climate/v1/[rpc]` | Climate and weather data |
| MCP | `/api/mcp` | Model Context Protocol server |
| Health | `/api/health/v1/[rpc]` | System health checks |

See [OpenAPI spec](public/openapi.yaml) for complete API documentation.

---

## MCP Server

ORION includes a Model Context Protocol server for AI tool integration:

```bash
# Connect via MCP client
{
  "mcpServers": {
    "orion": {
      "url": "https://orion.app/api/mcp"
    }
  }
}
```

Available tools include country briefs, resilience scores, market data, conflict intelligence, and more.

---

## Variants

ORION supports 6 themed variants from a single deployment:

| Variant | Description |
|---------|-------------|
| **Full** | All panels and features (default) |
| **Tech** | Technology and innovation focused |
| **Finance** | Financial markets and economics |
| **Energy** | Energy commodities and supply chain |
| **Commodity** | Commodity markets and resources |
| **Happy** | Positive news and global progress |

---

## Testing

The project includes 400+ tests across multiple categories:

- **Unit Tests** — Vitest for business logic and utilities
- **Integration Tests** — API endpoint validation
- **E2E Tests** — Playwright browser automation
- **Visual Regression** — Screenshot comparison tests
- **Data Validation** — Schema and freshness checks
- **Security Tests** — Secret detection, CORS, auth

```bash
# Run all tests
npm run test:convex
npm run test:data
npm run test:e2e
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm run test:convex && npm run lint`
5. Commit your changes
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [MapLibre GL JS](https://maplibre.org/) — Open-source map renderer
- [deck.gl](https://deck.gl/) — WebGL-powered data visualization
- [Groq](https://groq.com/) — Fast LLM inference
- [Upstash](https://upstash.com/) — Serverless Redis
- [Clerk](https://clerk.com/) — Authentication
- [Vercel](https://vercel.com/) — Deployment platform
