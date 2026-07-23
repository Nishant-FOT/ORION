/**
 * Railway deployment entry point.
 *
 * Runs the ORION API as a long-lived Node service. Set
 * ORION_SERVE_FRONTEND=true only for the legacy combined deployment.
 * Uses Node.js 18+ native fetch / Request / Response — no Express needed.
 *
 * Usage:
 *   npx tsx server/railway.ts
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFile, stat } from 'fs/promises';
import { resolve, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const DIST_DIR = resolve(__dirname, '..', 'dist');
const APP_ENTRY = 'dashboard.html';
const SERVE_FRONTEND = process.env.ORION_SERVE_FRONTEND === 'true';

// ---------------------------------------------------------------------------
// MIME types for static files
// ---------------------------------------------------------------------------

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

type GatewayCtx = { waitUntil: (p: Promise<unknown>) => void };
type GatewayFn = (req: Request, ctx: GatewayCtx) => Response | Promise<Response>;

interface ExactRoute {
  kind: 'exact';
  path: string;
  load: () => Promise<{ default?: GatewayFn }>;
}

interface PrefixRoute {
  kind: 'prefix';
  prefix: string;
  load: () => Promise<{ default?: GatewayFn }>;
}

type Route = ExactRoute | PrefixRoute;

// Legacy JavaScript handlers have no declaration files. Keeping their module
// specifiers dynamic confines that untyped boundary to the Railway adapter.
function loadJavaScriptRoute(path: string): Promise<{ default?: GatewayFn }> {
  return import(path) as Promise<{ default?: GatewayFn }>;
}

/**
 * Route map — order matters.  Longer prefixes come first so
 * /api/v2/shipping/webhooks is tried before /api/v2/shipping.
 */

const ROUTES: Route[] = [
  // ── v2 shipping (longest prefix first) ──────────────────────────────
  { kind: 'prefix', prefix: '/api/v2/shipping/webhooks', load: () => import('../api/v2/shipping/webhooks/[subscriberId]') },
  { kind: 'prefix', prefix: '/api/v2/shipping', load: () => import('../api/v2/shipping/[rpc]') },

  // ── domain gateways (/api/<domain>/v1) ─────────────────────────────
  { kind: 'prefix', prefix: '/api/health/v1', load: () => import('../api/health/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/market/v1', load: () => import('../api/market/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/aviation/v1', load: () => import('../api/aviation/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/natural/v1', load: () => import('../api/natural/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/displacement/v1', load: () => import('../api/displacement/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/infrastructure/v1', load: () => import('../api/infrastructure/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/seismology/v1', load: () => import('../api/seismology/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/wildfire/v1', load: () => import('../api/wildfire/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/cyber/v1', load: () => import('../api/cyber/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/conflict/v1', load: () => import('../api/conflict/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/military/v1', load: () => import('../api/military/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/supply-chain/v1', load: () => import('../api/supply-chain/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/economic/v1', load: () => import('../api/economic/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/climate/v1', load: () => import('../api/climate/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/sanctions/v1', load: () => import('../api/sanctions/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/radiation/v1', load: () => import('../api/radiation/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/thermal/v1', load: () => import('../api/thermal/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/trade/v1', load: () => import('../api/trade/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/research/v1', load: () => import('../api/research/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/giving/v1', load: () => import('../api/giving/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/news/v1', load: () => import('../api/news/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/prediction/v1', load: () => import('../api/prediction/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/forecast/v1', load: () => import('../api/forecast/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/resilience/v1', load: () => import('../api/resilience/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/imagery/v1', load: () => import('../api/imagery/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/intelligence/v1', load: () => import('../api/intelligence/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/webcam/v1', load: () => import('../api/webcam/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/unrest/v1', load: () => import('../api/unrest/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/consumer-prices/v1', load: () => import('../api/consumer-prices/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/positive-events/v1', load: () => import('../api/positive-events/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/maritime/v1', load: () => import('../api/maritime/v1/[rpc]') },
  { kind: 'prefix', prefix: '/api/leads/v1', load: () => import('../api/leads/v1/[rpc]') },

  // ── scenario (prefix before standalone aliases) ─────────────────────
  { kind: 'prefix', prefix: '/api/scenario/v1', load: () => import('../api/scenario/v1/[rpc]') },

  // ── brief sub-routes (longest first) ────────────────────────────────
  { kind: 'prefix', prefix: '/api/brief/carousel', load: () => import('../api/brief/carousel/[userId]/[issueDate]/[page]') },
  { kind: 'prefix', prefix: '/api/brief/public', load: () => import('../api/brief/public/[hash]') },
  { kind: 'exact', path: '/api/brief/share-url', load: () => import('../api/brief/share-url') },
  { kind: 'prefix', prefix: '/api/brief', load: () => import('../api/brief/[userId]/[issueDate]') },

  // ── user sub-routes ─────────────────────────────────────────────────
  { kind: 'exact', path: '/api/user/mcp-quota', load: () => import('../api/user/mcp-quota') },
  { kind: 'exact', path: '/api/user/mcp-revoke', load: () => import('../api/user/mcp-revoke') },

  // ── discord / slack oauth ───────────────────────────────────────────
  { kind: 'exact', path: '/api/discord/oauth/start', load: () => import('../api/discord/oauth/start') },
  { kind: 'exact', path: '/api/discord/oauth/callback', load: () => import('../api/discord/oauth/callback') },
  { kind: 'exact', path: '/api/slack/oauth/start', load: () => import('../api/slack/oauth/start') },
  { kind: 'exact', path: '/api/slack/oauth/callback', load: () => import('../api/slack/oauth/callback') },

  // ── internal ────────────────────────────────────────────────────────
  { kind: 'exact', path: '/api/internal/mcp-grant-mint', load: () => import('../api/internal/mcp-grant-mint') },
  { kind: 'exact', path: '/api/internal/mcp-grant-context', load: () => import('../api/internal/mcp-grant-context') },
  { kind: 'exact', path: '/api/internal/brief-why-matters', load: () => import('../api/internal/brief-why-matters') },

  // ── oauth ───────────────────────────────────────────────────────────
  { kind: 'exact', path: '/api/oauth/token', load: () => import('../api/oauth/token') },
  { kind: 'exact', path: '/api/oauth/authorize-pro', load: () => import('../api/oauth/authorize-pro') },
  { kind: 'exact', path: '/api/oauth/register', load: () => loadJavaScriptRoute('../api/oauth/register.js') },
  { kind: 'exact', path: '/api/oauth/authorize', load: () => loadJavaScriptRoute('../api/oauth/authorize.js') },

  // ── standalone endpoints ────────────────────────────────────────────
  { kind: 'exact', path: '/api/mcp', load: () => import('../api/mcp') },
  { kind: 'exact', path: '/api/mcp-proxy', load: () => import('../api/mcp-proxy') },
  { kind: 'exact', path: '/api/chat-analyst', load: () => import('../api/chat-analyst') },
  { kind: 'exact', path: '/api/latest-brief', load: () => import('../api/latest-brief') },
  { kind: 'exact', path: '/api/oauth-protected-resource', load: () => import('../api/oauth-protected-resource') },
  { kind: 'exact', path: '/api/user-prefs', load: () => import('../api/user-prefs') },
  { kind: 'exact', path: '/api/notify', load: () => import('../api/notify') },
  { kind: 'exact', path: '/api/notification-channels', load: () => import('../api/notification-channels') },
  { kind: 'exact', path: '/api/referral/me', load: () => import('../api/referral/me') },
  { kind: 'exact', path: '/api/symbol-search', load: () => import('../api/symbol-search') },
  { kind: 'exact', path: '/api/seed-contract-probe', load: () => import('../api/seed-contract-probe') },
  { kind: 'exact', path: '/api/widget-agent', load: () => import('../api/widget-agent') },
  { kind: 'exact', path: '/api/invalidate-user-api-key-cache', load: () => import('../api/invalidate-user-api-key-cache') },
  { kind: 'exact', path: '/api/skills/fetch-agentskills', load: () => import('../api/skills/fetch-agentskills') },
  { kind: 'exact', path: '/api/bootstrap', load: () => loadJavaScriptRoute('../api/bootstrap.js') },
  { kind: 'exact', path: '/api/cache-purge', load: () => loadJavaScriptRoute('../api/cache-purge.js') },
  { kind: 'exact', path: '/api/download', load: () => loadJavaScriptRoute('../api/download.js') },
  { kind: 'exact', path: '/api/fwdstart', load: () => loadJavaScriptRoute('../api/fwdstart.js') },
  { kind: 'exact', path: '/api/geo', load: () => loadJavaScriptRoute('../api/geo.js') },
  { kind: 'exact', path: '/api/gpsjam', load: () => loadJavaScriptRoute('../api/gpsjam.js') },
  { kind: 'exact', path: '/api/health', load: () => loadJavaScriptRoute('../api/health.js') },
  { kind: 'exact', path: '/api/og-story', load: () => loadJavaScriptRoute('../api/og-story.js') },
  { kind: 'exact', path: '/api/opensky', load: () => loadJavaScriptRoute('../api/opensky.js') },
  { kind: 'exact', path: '/api/oref-alerts', load: () => loadJavaScriptRoute('../api/oref-alerts.js') },
  { kind: 'exact', path: '/api/orion-session', load: () => loadJavaScriptRoute('../api/orion-session.js') },
  { kind: 'exact', path: '/api/polymarket', load: () => loadJavaScriptRoute('../api/polymarket.js') },
  { kind: 'exact', path: '/api/reverse-geocode', load: () => loadJavaScriptRoute('../api/reverse-geocode.js') },
  { kind: 'exact', path: '/api/rss-proxy', load: () => loadJavaScriptRoute('../api/rss-proxy.js') },
  { kind: 'exact', path: '/api/security/report', load: () => loadJavaScriptRoute('../api/security/report.js') },
  { kind: 'exact', path: '/api/seed-health', load: () => loadJavaScriptRoute('../api/seed-health.js') },
  { kind: 'exact', path: '/api/story', load: () => loadJavaScriptRoute('../api/story.js') },
  { kind: 'exact', path: '/api/telegram-feed', load: () => loadJavaScriptRoute('../api/telegram-feed.js') },
  { kind: 'exact', path: '/api/version', load: () => loadJavaScriptRoute('../api/version.js') },
  { kind: 'exact', path: '/api/youtube/embed', load: () => loadJavaScriptRoute('../api/youtube/embed.js') },
  { kind: 'exact', path: '/api/youtube/live', load: () => loadJavaScriptRoute('../api/youtube/live.js') },
];

// ---------------------------------------------------------------------------
// Handler cache — import once, reuse forever
// ---------------------------------------------------------------------------

const handlerCache = new Map<string, GatewayFn | null>();

async function resolveHandler(route: Route): Promise<GatewayFn | null> {
  const key = route.kind === 'exact' ? route.path : route.prefix;
  if (handlerCache.has(key)) return handlerCache.get(key) ?? null;

  try {
    const mod = await route.load();
    const handler = mod.default ?? null;
    handlerCache.set(key, handler);
    console.log(`[railway] loaded handler: ${key}`);
    return handler;
  } catch (err) {
    console.error(`[railway] FAILED to load handler: ${key}`, err);
    handlerCache.set(key, null);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Static-file server
// ---------------------------------------------------------------------------

async function serveStatic(pathname: string): Promise<Response | null> {
  if (!SERVE_FRONTEND) return null;
  let fp = join(DIST_DIR, pathname === '/' ? APP_ENTRY : pathname);

  try {
    let s = await stat(fp);
    if (s.isDirectory()) {
      fp = join(fp, 'index.html');
      s = await stat(fp);
    }
    if (!s.isFile()) return null;

    const ext = extname(fp).toLowerCase();
    const body = await readFile(fp);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// IncomingMessage → Web Request conversion
// ---------------------------------------------------------------------------

function toWebRequest(req: IncomingMessage, body?: ReadableStream<Uint8Array>): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined && value !== null) {
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
  }

  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method || 'GET',
    headers,
  };
  if (body) {
    init.body = body;
    // Node requires duplex for streaming request bodies.
    init.duplex = 'half';
  }
  return new Request(url.toString(), init);
}

// ---------------------------------------------------------------------------
// Web Response → ServerResponse
// ---------------------------------------------------------------------------

async function sendWebResponse(nodeRes: ServerResponse, webRes: Response): Promise<void> {
  const headers: Record<string, string> = {};
  webRes.headers.forEach((value, key) => {
    headers[key] = value;
  });

  nodeRes.writeHead(webRes.status, headers);

  if (webRes.body) {
    const reader = webRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        nodeRes.write(Buffer.from(value));
      }
    } catch {
      // Stream interrupted — client disconnected
    }
  }
  nodeRes.end();
}

// ---------------------------------------------------------------------------
// Node.js → ReadableStream adapter for request body
// ---------------------------------------------------------------------------

function readBody(req: IncomingMessage): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      req.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      req.on('end', () => controller.close());
      req.on('error', (err) => controller.error(err));
    },
  });
}

// ---------------------------------------------------------------------------
// Main request handler
// ---------------------------------------------------------------------------

const NOOP_CTX = { waitUntil: () => {} };

async function handleRequest(nodeReq: IncomingMessage, nodeRes: ServerResponse): Promise<void> {
  const url = new URL(nodeReq.url || '/', `http://${nodeReq.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    // 1. Try API routes (exact first, then prefix)
    const body = (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD' && nodeReq.method !== 'OPTIONS')
      ? readBody(nodeReq)
      : undefined;

    // Exact match
    for (const route of ROUTES) {
      if (route.kind === 'exact' && pathname === route.path) {
        const handler = await resolveHandler(route);
        if (handler) {
          const webReq = toWebRequest(nodeReq, body);
          const webRes = await handler(webReq, NOOP_CTX);
          return await sendWebResponse(nodeRes, webRes);
        }
      }
    }

    // Prefix match (longest-first already sorted)
    for (const route of ROUTES) {
      if (route.kind === 'prefix' && pathname.startsWith(route.prefix)) {
        const handler = await resolveHandler(route);
        if (handler) {
          const webReq = toWebRequest(nodeReq, body);
          const webRes = await handler(webReq, NOOP_CTX);
          return await sendWebResponse(nodeRes, webRes);
        }
      }
    }

    if (!SERVE_FRONTEND) {
      nodeRes.writeHead(404, { 'Content-Type': 'application/json' });
      nodeRes.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    // 2. Static files
    const staticRes = await serveStatic(pathname);
    if (staticRes) return await sendWebResponse(nodeRes, staticRes);

    // 3. SPA fallback
    const indexContent = await readFile(join(DIST_DIR, APP_ENTRY));
    nodeRes.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    nodeRes.end(indexContent);
  } catch (err) {
    console.error(`[railway] Error handling ${pathname}:`, err);
    if (!nodeRes.headersSent) {
      nodeRes.writeHead(500, { 'Content-Type': 'application/json' });
    }
    nodeRes.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`[railway] ORION server starting...`);
  console.log(`[railway] NODE_ENV=${process.env.NODE_ENV || 'unset'}`);
  console.log(`[railway] DIST_DIR=${DIST_DIR}`);

  if (SERVE_FRONTEND) {
    try {
      await stat(DIST_DIR);
      console.log(`[railway] dist/ found`);
    } catch {
      console.error(`[railway] ERROR: dist/ not found at ${DIST_DIR}. Run "npm run build" first.`);
      process.exit(1);
    }
  }

  // Pre-warm a few critical handlers in the background
  const criticalRoutes = ROUTES.filter(r =>
    r.kind === 'prefix' && (
      r.prefix.includes('/market') ||
      r.prefix.includes('/health') ||
      r.prefix.includes('/resilience') ||
      r.prefix.includes('/intelligence')
    )
  );
  Promise.all(criticalRoutes.map(r => resolveHandler(r))).catch(() => {});

  const server = createServer(handleRequest);
  server.listen(PORT, () => {
    console.log(`[railway] ✅ ORION running at http://localhost:${PORT}`);
    console.log(`[railway] ${ROUTES.length} API routes registered`);
  });
}

main().catch((err) => {
  console.error('[railway] Fatal startup error:', err);
  process.exit(1);
});
