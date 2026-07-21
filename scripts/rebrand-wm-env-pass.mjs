#!/usr/bin/env node
/** Third pass: WM_ env vars, ors_ tokens, Wm function names */
import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const DIRS = ['src', 'api', 'server', 'tests', 'scripts', 'docs', 'e2e', 'convex', 'pro-test', 'blog-site', 'public', 'docker', 'workers', 'shared', 'middleware.ts', 'src-tauri', 'consumer-prices-core'];
const SKIP = ['/node_modules/', '/public/pro/assets/'];

const REPS = [
  ['establishOrionKeySession', 'establishOrionKeySession'],
  ['ensureOrionSession', 'ensureOrionSession'],
  ['installOrionSessionFetchInterceptor', 'installOrionSessionFetchInterceptor'],
  ['ORION_DESKTOP_SHARED_SECRET', 'ORION_DESKTOP_SHARED_SECRET'],
  ['ORION_TEST_UPSTREAM', 'ORION_TEST_UPSTREAM'],
  ['ORION_SESSION_SECRET', 'ORION_SESSION_SECRET'],
  ['ORION_API_BASE_URL', 'ORION_API_BASE_URL'],
  ['ORION_MCP_BEARER', 'ORION_MCP_BEARER'],
  ['ORION_MCP_ENDPOINT', 'ORION_MCP_ENDPOINT'],
  ['ORION_ENV_SOURCE', 'ORION_ENV_SOURCE'],
  ['__ORION_NEG__', '__ORION_NEG__'],
  ['__ORION_MASKED__', '__ORION_MASKED__'],
  ['ors_', 'ors_'],
  ['ORION Pro', 'ORION Pro'],
  ['ORION', 'ORION'],
  ['ORION', 'ORION'],
  ['orion.app', 'orion.app'],
  ['orion', 'orion'],
];

async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      await walk(p, out);
    } else if (!SKIP.some(s => p.includes(s))) {
      out.push(p);
    }
  }
  return out;
}

async function main() {
  const files = [];
  for (const d of DIRS) {
    const p = join(ROOT, d);
    try {
      const st = await import('fs/promises').then(m => m.stat(p));
      if (st.isFile()) files.push(p);
      else await walk(p, files);
    } catch { /* skip */ }
  }
  for (const f of ['package.json', '.env.example', 'docker-compose.yml', 'AGENTS.md']) {
    files.push(join(ROOT, f));
  }
  let n = 0;
  for (const f of files) {
    let c;
    try { c = await readFile(f, 'utf8'); } catch { continue; }
    const orig = c;
    for (const [a, b] of REPS) c = c.split(a).join(b);
    if (c !== orig) { await writeFile(f, c, 'utf8'); n++; }
  }
  console.log(`Third pass updated ${n} files`);
}

main();
