#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_BASELINE = path.join(repoRoot, 'scripts', 'safe-html-baseline.json');
const TARGET_EXTENSIONS = new Set(['.js', '.mjs', '.ts', '.tsx']);
const TARGET_DIRS = ['src'];
const INTERNAL_ALLOWLIST = new Set(['src/utils/dom-utils.ts']);
const DIRECT_HTML_ASSIGNMENT_RE = /(?:\.(?:innerHTML|outerHTML)|\[\s*(['"])(?:innerHTML|outerHTML)\1\s*\])\s*(\+?=)(?!=)\s*(.*)$/;
const HTML_INSERTION_CALL_RE = /(?:\.\s*insertAdjacentHTML|\[\s*(['"])insertAdjacentHTML\1\s*\])\s*\(/;

function parseArgs(argv) {
  const args = {
    root: repoRoot,
    baseline: DEFAULT_BASELINE,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--update-baseline') {
      args.updateBaseline = true;
    } else if (arg === '--root') {
      args.root = path.resolve(argv[++i]);
    } else if (arg === '--baseline') {
      args.baseline = path.resolve(argv[++i]);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function walk(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === 'generated') continue;
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, files);
    } else if (TARGET_EXTENSIONS.has(path.extname(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

function assignmentRhs(line) {
  const match = line.match(DIRECT_HTML_ASSIGNMENT_RE);
  return match ? (match[3] ?? '').trim() : '';
}

function isClearOperation(line) {
  const match = line.match(DIRECT_HTML_ASSIGNMENT_RE);
  if (!match || match[2] !== '=') return false;
  const rhs = assignmentRhs(line).replace(/;$/, '').trim();
  return rhs === "''" || rhs === '""' || rhs === '``';
}

function fingerprint(file, line) {
  const normalized = line.replace(/\s+/g, ' ').trim();
  const hash = createHash('sha256').update(`${file}\0${normalized}`).digest('hex').slice(0, 16);
  return `${file}:${hash}`;
}

function setContentSnippet(lines, index) {
  const snippet = [];
  let depth = 0;
  let sawOpenParen = false;
  const maxLookahead = Math.min(lines.length, index + 80);

  for (let i = index; i < maxLookahead; i += 1) {
    const line = lines[i] ?? '';
    snippet.push(line.trim());
    for (const char of line) {
      if (char === '(') {
        depth += 1;
        sawOpenParen = true;
      } else if (char === ')') {
        depth -= 1;
      }
    }
    if (sawOpenParen && depth <= 0) break;
  }

  return snippet.join('\n');
}

function setContentFingerprint(file, snippet) {
  const normalized = snippet.replace(/\s+/g, ' ').trim();
  const hash = createHash('sha256').update(`setContent\0${file}\0${normalized}`).digest('hex').slice(0, 16);
  return `${file}:setContent:${hash}`;
}

function isSetContentCall(line) {
  const codeOnly = line.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '""');
  return /\.\s*setContent\s*\(/.test(codeOnly);
}

function isCommentOnlyLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
}

export function findUnsafeHtmlAssignments(root = repoRoot) {
  const findings = [];

  for (const targetDir of TARGET_DIRS) {
    for (const filePath of walk(path.join(root, targetDir))) {
      const rel = toPosix(path.relative(root, filePath));
      if (INTERNAL_ALLOWLIST.has(rel)) continue;

      const lines = readFileSync(filePath, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (DIRECT_HTML_ASSIGNMENT_RE.test(line)) {
          if (isClearOperation(line)) continue;

          findings.push({
            file: rel,
            line: i + 1,
            kind: 'direct-html-assignment',
            code: line.trim(),
            fingerprint: fingerprint(rel, line),
          });
          continue;
        }

        if (HTML_INSERTION_CALL_RE.test(line)) {
          findings.push({
            file: rel,
            line: i + 1,
            kind: 'html-insertion-call',
            code: line.trim(),
            fingerprint: fingerprint(rel, line),
          });
          continue;
        }

        if (isSetContentCall(line)) {
          if (isCommentOnlyLine(line)) continue;

          findings.push({
            file: rel,
            line: i + 1,
            kind: 'panel-set-content',
            code: line.trim(),
            fingerprint: setContentFingerprint(rel, setContentSnippet(lines, i)),
          });
        }
      }
    }
  }

  return findings;
}

function readBaseline(baselinePath) {
  if (!existsSync(baselinePath)) return [];
  const parsed = JSON.parse(readFileSync(baselinePath, 'utf8'));
  return parsed.entries ?? [];
}

function main() {
  const args = parseArgs(process.argv);
  const findings = findUnsafeHtmlAssignments(args.root);

  const baseline = readBaseline(args.baseline);
  if (args.updateBaseline) {
    const payload = {
      note: "Baseline of legacy direct innerHTML/outerHTML assignments for scripts/enforce-safe-html.mjs. Do not add entries for new code; route through src/utils/dom-utils.ts, Panel.setSafeContent(), or add a orion-safe-html audited comment for narrow exceptions.",
      entries: findings,
    };
    writeFileSync(args.baseline, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Updated safe HTML baseline with ${findings.length} entries.`);
    return;
  }

  const baselineFingerprints = new Set(baseline.map((entry) => entry.fingerprint));
  const newFindings = findings.filter((finding) => !baselineFingerprints.has(finding.fingerprint));
  if (newFindings.length === 0) {
    console.log(`Safe HTML guard passed (${findings.length} legacy HTML sinks tracked, ${baseline.length} baselined).`);
    return;
  }

  console.error('Direct innerHTML/outerHTML assignment is blocked.');
  console.error('Direct insertAdjacentHTML() calls are blocked.');
  console.error('Panel.setContent() calls are also blocked.');
  console.error('Use setTrustedHtml()/trustedHtml() from src/utils/dom-utils.ts, Panel.setSafeContent(), or clearChildren()/replaceChildren().');
  for (const finding of newFindings.slice(0, 25)) {
    console.error(`- ${finding.file}:${finding.line} [${finding.kind}]: ${finding.code}`);
  }
  if (newFindings.length > 25) {
    console.error(`...and ${newFindings.length - 25} more.`);
  }
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
