/**
 * CORS header generation -- TypeScript port of api/_cors.js.
 *
 * Identical ALLOWED_ORIGIN_PATTERNS and logic, with methods set
 * to 'GET, POST, OPTIONS' (sebuf routes support GET and POST).
 */

const PRODUCTION_PATTERNS: RegExp[] = [
  /^https:\/\/(.*\.)?orion\.app$/,
  // Vercel deployments under the production team scope, e.g.
  //   orion-git-<branch>-nishant-fots-projects.vercel.app
  //   orion-<hash>-nishant-fots-projects.vercel.app
  // Tight on purpose: never a bare *.vercel.app (this is a security allowlist).
  /^https:\/\/orion-[a-z0-9-]+-nishant-fots-projects\.vercel\.app$/,
  /^https:\/\/orion-eight-beta\.vercel\.app$/,
  // Railway deployments — *.railway.app
  /^https:\/\/[a-z0-9-]+\.railway\.app$/,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/,
  /^http:\/\/(?:app\.)?tauri\.localhost$/,
  /^https:\/\/tauri\.localhost:1420$/,
];

const DEV_PATTERNS: RegExp[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
];

const ALLOWED_ORIGIN_PATTERNS: RegExp[] =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_PATTERNS
    : [...PRODUCTION_PATTERNS, ...DEV_PATTERNS];

const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-ORION-Key',
  'X-Api-Key',
  'X-Widget-Key',
  'X-Pro-Key',
  'X-ORION-Desktop-Timestamp',
  'X-ORION-Desktop-Signature',
  'Mcp-Session-Id',
  'MCP-Protocol-Version',
  'Last-Event-ID',
].join(', ');

const EXPOSED_HEADERS = [
  'Mcp-Session-Id',
  'WWW-Authenticate',
  'Retry-After',
].join(', ');

export function isAllowedOrigin(origin: string): boolean {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = isAllowedOrigin(origin) ? origin : 'https://orion.app';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Expose-Headers': EXPOSED_HEADERS,
    'Access-Control-Max-Age': '3600',
    'Vary': 'Origin',
  };
}

export function isDisallowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
