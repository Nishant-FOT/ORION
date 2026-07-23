#!/usr/bin/env node
/**
 * One-shot rebrand: orion → ORION / orion
 * Run from repo root: node scripts/rebrand-to-orion.mjs
 */
import { readFile, writeFile, readdir, rename, stat } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.vite',
  'target',
  'blog-site/node_modules',
]);

const SKIP_PATH_FRAGMENTS = [
  '/node_modules/',
  '/.git/',
  '/public/pro/assets/',
  '/blog-site/node_modules/',
];

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.html', '.md', '.mdx',
  '.yaml', '.yml', '.proto', '.txt', '.xml', '.astro', '.css', '.scss',
  '.sh', '.conf', '.template', '.toml', '.rs', '.svg', '.env.example',
  '', // extensionless files like Dockerfile, Makefile entries handled below
]);

const EXTENSIONLESS_NAMES = new Set([
  'Dockerfile', 'Makefile', 'AGENTS.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md',
  'CHANGELOG.md', 'SELF_HOSTING.md', 'CODE_OF_CONDUCT.md', 'middleware.ts',
  'api-catalog', 'security.txt', 'oauth-authorization-server',
]);

function shouldProcessFile(filePath, name) {
  if (SKIP_PATH_FRAGMENTS.some((f) => filePath.includes(f))) return false;
  const ext = extname(name);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (EXTENSIONLESS_NAMES.has(name) || name.startsWith('Dockerfile')) return true;
  return false;
}

async function walk(dir, files = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, files);
    } else if (shouldProcessFile(full, entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/** Ordered replacements — longer / more specific patterns first */
const REPLACEMENTS = [
  // Display names
  ['ORION Pro', 'ORION Pro'],
  ['ORION Blog', 'ORION Blog'],
  ['ORION License Key', 'ORION License Key'],
  ['ORION Desktop', 'ORION Desktop'],
  ['ORION Settings', 'ORION Settings'],
  ['ORION API', 'ORION API'],
  ['ORION', 'ORION'],
  ['ORION', 'ORION'],
  ['ORION', 'ORION'],
  ['orion', 'orion'],
  // Domains & URLs (before bare orion)
  ['abacus.orion.app', 'abacus.orion.app'],
  ['clerk.orion.app', 'clerk.orion.app'],
  ['proxy.orion.app', 'proxy.orion.app'],
  ['maps.orion.app', 'maps.orion.app'],
  ['api.orion.app', 'api.orion.app'],
  ['energy.orion.app', 'energy.orion.app'],
  ['happy.orion.app', 'happy.orion.app'],
  ['commodity.orion.app', 'commodity.orion.app'],
  ['finance.orion.app', 'finance.orion.app'],
  ['tech.orion.app', 'tech.orion.app'],
  ['www.orion.app', 'www.orion.app'],
  ['orion.app', 'orion.app'],
  // Package / path identifiers
  ['orion-data', 'orion-data'],
  ['orion-npm-cache', 'orion-npm-cache'],
  ['orion.openapi', 'orion.openapi'],
  ['orion-energy-resilience/orion', 'orion-energy-resilience/orion'],
  // Headers & env
  ['X-ORION-Key', 'X-ORION-Key'],
  ['X-ORION-', 'X-ORION-'],
  ['ORION_', 'ORION_'],
  // Storage / session prefixes (after ORION_)
  ['__ORION_MASKED__', '__ORION_MASKED__'],
  ['orion-widget-sandbox', 'orion-widget-sandbox'],
  ['orion-session', 'orion-session'],
  ['orion-pro-banner', 'orion-pro-banner'],
  ['orion-breaking-alerts', 'orion-breaking-alerts'],
  ['orion-market-watchlist', 'orion-market-watchlist'],
  ['orion-pinned-webcams', 'orion-pinned-webcams'],
  ['orion-map-provider', 'orion-map-provider'],
  ['orion-font-family', 'orion-font-family'],
  ['orion-globe-visual-preset', 'orion-globe-visual-preset'],
  ['orion-stream-quality', 'orion-stream-quality'],
  ['orion-ai-flow', 'orion-ai-flow'],
  ['orion-headline-memory', 'orion-headline-memory'],
  ['orion-analysis-frameworks', 'orion-analysis-frameworks'],
  ['orion-panel-frameworks', 'orion-panel-frameworks'],
  ['orion-map-theme', 'orion-map-theme'],
  ['orion-live-streams', 'orion-live-streams'],
  ['orion-map-style', 'orion-map-style'],
  ['orion-embed', 'orion-embed'],
  ['orion-cloud-prefs', 'orion-cloud-prefs'],
  ['orion-circuit-breaker', 'orion-circuit-breaker'],
  ['orion-user-location', 'orion-user-location'],
  ['orion-followed-countries', 'orion-followed-countries'],
  ['orion-notify-country', 'orion-notify-country'],
  ['orion-variant-meta', 'orion-variant-meta'],
  ['orion-desktop', 'orion-desktop'],
  ['orion-runtime', 'orion-runtime'],
  ['orion-persistent-cache', 'orion-persistent-cache'],
  ['orion-vector-db', 'orion-vector-db'],
  ['orion-referral', 'orion-referral'],
  ['orion-checkout', 'orion-checkout'],
  ['orion-analytics', 'orion-analytics'],
  ['orion-sentry', 'orion-sentry'],
  ['orion-sw', 'orion-sw'],
  // orion-* localStorage keys
  ['orion-panels', 'orion-panels'],
  ['orion-monitors', 'orion-monitors'],
  ['orion-layers', 'orion-layers'],
  ['orion-disabled-feeds', 'orion-disabled-feeds'],
  ['orion-panel-spans', 'orion-panel-spans'],
  ['orion-panel-col-spans', 'orion-panel-col-spans'],
  ['orion-theme', 'orion-theme'],
  ['orion-variant', 'orion-variant'],
  ['orion-map-mode', 'orion-map-mode'],
  ['orion-api-key', 'orion-api-key'],
  ['orion-settings', 'orion-settings'],
  ['orion-', 'orion-'],
  // Bare identifier last
  ['orion', 'orion'],
  // Social
  ['@orionai', '@orionintel'],
  // Seed UA
  ['ORION-Seed/1.0', 'ORION-Seed/1.0'], // idempotent
  ['ORION-Seed', 'ORION-Seed'],
  // Version branding removal in UI strings
  ['', ''],
  ['', ''],
];

async function applyReplacements(filePath) {
  let content = await readFile(filePath, 'utf8');
  const original = content;
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
    }
  }
  if (content !== original) {
    await writeFile(filePath, content, 'utf8');
    return true;
  }
  return false;
}

async function renamePath(oldPath, newPath) {
  try {
    await stat(oldPath);
    await rename(oldPath, newPath);
    return true;
  } catch {
    return false;
  }
}

async function renameDirs() {
  const dirRenames = [
    ['proto/orion', 'proto/orion'],
    ['server/orion', 'server/orion'],
    ['src/generated/client/orion', 'src/generated/client/orion'],
    ['src/generated/server/orion', 'src/generated/server/orion'],
  ];
  for (const [from, to] of dirRenames) {
    const ok = await renamePath(join(ROOT, from), join(ROOT, to));
    if (ok) console.log(`Renamed dir: ${from} → ${to}`);
  }
}

async function renameFiles() {
  const fileRenames = [
    ['src/services/orion-session.ts', 'src/services/orion-session.ts'],
    ['tests/api/orion-session.test.mjs', 'tests/api/orion-session.test.mjs'],
    ['public/orion-widget-sandbox.html', 'public/orion-widget-sandbox.html'],
    ['docs/api/orion.openapi.yaml', 'docs/api/orion.openapi.yaml'],
    ['docs/api/orion.openapi.json', 'docs/api/orion.openapi.json'],
  ];
  for (const [from, to] of fileRenames) {
    const ok = await renamePath(join(ROOT, from), join(ROOT, to));
    if (ok) console.log(`Renamed file: ${from} → ${to}`);
  }
}

async function main() {
  console.log('Scanning files...');
  const files = await walk(ROOT);
  let changed = 0;
  for (const file of files) {
    if (await applyReplacements(file)) {
      changed++;
    }
  }
  console.log(`Updated ${changed} files`);

  await renameDirs();
  await renameFiles();

  console.log('Rebrand script complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
