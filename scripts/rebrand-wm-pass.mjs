#!/usr/bin/env node
/** Second-pass: orion- → orion-, remaining orion → orion */
import { readFile, writeFile, readdir } from 'fs/promises';
import { join, extname } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIRS = ['src', 'api', 'server', 'tests', 'scripts', 'docs', 'e2e', 'convex', 'pro-test', 'blog-site', 'public', 'docker', 'workers', 'shared', 'deploy', 'consumer-prices-core', 'src-tauri'];
const ROOT_FILES = ['index.html', 'embed.html', 'settings.html', 'live-channels.html', 'mcp-grant.html', 'middleware.ts', 'vite.config.ts', 'vercel.json', 'package.json', 'README.md', 'AGENTS.md', 'ARCHITECTURE.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'SELF_HOSTING.md', 'CODE_OF_CONDUCT.md', 'Dockerfile', 'docker-compose.yml', '.env.example'];

const SKIP = ['/node_modules/', '/public/pro/assets/'];

function apply(content) {
  let c = content;
  const reps = [
    ['ORION Pro', 'ORION Pro'],
    ['ORION', 'ORION'],
    ['ORION', 'ORION'],
    ['orion.app', 'orion.app'],
    ['orion', 'orion'],
    ['ORION', 'ORION'],
    ['ORION Analyst', 'ORION Analyst'],
    ['data-orion-', 'data-orion-'],
    ['x-orion-', 'x-orion-'],
    ['X-ORION-', 'X-ORION-'],
    ['orion-coop-coep', 'orion-coop-coep'],
    ['orion-logo-core', 'orion-logo-core'],
    ['orion-share', 'orion-share'],
    ['orion-widget-ready', 'orion-widget-ready'],
    ['orion-widget-generated', 'orion-widget-generated'],
    ['orion-widget-pro', 'orion-widget-pro'],
    ['orion-widget-shell', 'orion-widget-shell'],
    ['orion-widget-body', 'orion-widget-body'],
    ['orion-custom-widgets', 'orion-custom-widgets'],
    ['orion-widget-key', 'orion-widget-key'],
    ['orion-pro-key', 'orion-pro-key'],
    ['orion-pro-html', 'orion-pro-html'],
    ['orion-html', 'orion-html'],
    ['orion-dashboard-html-output', 'orion-dashboard-html-output'],
    ['orion-emit-build-hash', 'orion-emit-build-hash'],
    ['orion-deferred-style', 'orion-deferred-style'],
    ['orion-sync-restore-toast', 'orion-sync-restore-toast'],
    ['orion-cloud-sync-version', 'orion-cloud-sync-version'],
    ['orion-last-sync-at', 'orion-last-sync-at'],
    ['orion-cloud-sync-state', 'orion-cloud-sync-state'],
    ['orion-last-signed-in-as', 'orion-last-signed-in-as'],
    ['orion-globe-render-scale', 'orion-globe-render-scale'],
    ['.orion-', '.orion-'],
    ['#orion-', '#orion-'],
    ["'orion-", "'orion-"],
    ['"orion-', '"orion-'],
    ['`orion-', '`orion-'],
    ['class="orion-', 'class="orion-'],
    ["class='orion-", "class='orion-"],
    [' orion-', ' orion-'],
    ['orion-test/', 'orion-test/'],
    ['orion-ts-module-', 'orion-ts-module-'],
    ['orion-country-deep-dive-', 'orion-country-deep-dive-'],
  ];
  for (const [a, b] of reps) c = c.split(a).join(b);
  // id="orion-..." patterns in HTML
  c = c.replace(/\bid="orion-/g, 'id="orion-');
  c = c.replace(/\bid='orion-/g, "id='orion-");
  // dynamic orion-${id} in template strings - only when it's a widget id prefix
  c = c.replace(/`orion-\$\{/g, '`orion-${');
  c = c.replace(/'orion-\$\{/g, "'orion-${");
  return c;
}

async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      await walk(p, out);
    } else {
      if (SKIP.some(s => p.includes(s))) continue;
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const files = [];
  for (const d of DIRS) {
    await walk(join(ROOT, d), files);
  }
  for (const f of ROOT_FILES) {
    files.push(join(ROOT, f));
  }
  let n = 0;
  for (const f of files) {
    let content;
    try { content = await readFile(f, 'utf8'); } catch { continue; }
    const next = apply(content);
    if (next !== content) {
      await writeFile(f, next, 'utf8');
      n++;
    }
  }
  console.log(`Updated ${n} files in second pass`);
}

main();
