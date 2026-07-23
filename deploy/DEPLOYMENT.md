# ORION Deployment Topology

ORION is deployed as four independent services. Do not deploy the repository
root as a Vercel API project: the root `api/` directory contains more functions
than the Vercel Hobby plan permits.

## 1. Frontend: Vercel

- Project root: repository root
- Framework: Vite
- Build command: `npm ci --include=dev && npm run build`
- Public domains: `orion.app`, `www.orion.app`, and variant subdomains
- API proxy: `/api/*` and `/mcp` proxy to `https://api.orion.app`

The root `.vercelignore` excludes `api/`, so Vercel only builds the frontend.
Set `VITE_WS_RELAY_URL`, `VITE_WS_API_URL`, `VITE_SENTRY_DSN`, and any other
`VITE_` values needed by the browser in the Vercel project environment.

## 2. API: Railway

- Project root: repository root
- Config: `railway.json` and `nixpacks.toml`
- Build command: `npm ci --include=dev && npm run typecheck:api`
- Start command: `npm run start:api`
- Public domain: `api.orion.app`

The Railway API process serves every API route from `server/railway.ts` and does
not require a Vite `dist/` build. Configure the server-side values from
`.env.example`, including `CONVEX_URL`, `ORION_SESSION_SECRET`,
`ORION_API_KEY`, provider credentials, and shared relay credentials.

## 3. Relay and scheduled workers: Railway

- Project root: `scripts`
- Config: `scripts/nixpacks.toml`
- Start command: `npm start`
- Public domain: assign a dedicated relay hostname only when browser access is
  needed; keep cron-only workers private.

Set `RELAY_SHARED_SECRET`, `AISSTREAM_API_KEY`, provider credentials, Redis or
Upstash settings, and notification credentials here. The relay secret must
match the API service value.

## 4. Edge CORS: Cloudflare Worker

- Project root: `workers/api-cors-preflight`
- Config: `workers/api-cors-preflight/wrangler.toml`
- Route: `api.orion.app/*`

Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` outside the repository,
then deploy with `npm run deploy` from this directory. The Worker sits in front
of the Railway API domain and owns CORS preflight behavior.

## Supporting services

- Deploy Convex separately from `convex/`, then set its production URL on the
  API service and frontend where required.
- Keep static large map assets in Cloudflare R2 as configured by the application.
- Add production monitoring for `https://api.orion.app/api/health` and the relay
  health endpoint before switching the public frontend domain.
