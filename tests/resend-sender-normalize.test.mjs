import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeResendSender } = require('../scripts/lib/resend-from.cjs');

const silent = () => {};

test('returns null for empty, null, undefined, or whitespace-only input', () => {
  assert.equal(normalizeResendSender(null, 'ORION', silent), null);
  assert.equal(normalizeResendSender(undefined, 'ORION', silent), null);
  assert.equal(normalizeResendSender('', 'ORION', silent), null);
  assert.equal(normalizeResendSender('   ', 'ORION', silent), null);
});

test('passes a properly wrapped sender through unchanged', () => {
  assert.equal(
    normalizeResendSender('ORION <alerts@orion.app>', 'Default', silent),
    'ORION <alerts@orion.app>',
  );
  assert.equal(
    normalizeResendSender('ORION Brief <brief@orion.app>', 'Default', silent),
    'ORION Brief <brief@orion.app>',
  );
});

test('trims surrounding whitespace before returning a wrapped sender', () => {
  assert.equal(
    normalizeResendSender('  ORION Brief <brief@orion.app>  ', 'Default', silent),
    'ORION Brief <brief@orion.app>',
  );
});

test('wraps a bare email address with the supplied default display name', () => {
  assert.equal(
    normalizeResendSender('brief@orion.app', 'ORION Brief', silent),
    'ORION Brief <brief@orion.app>',
  );
  assert.equal(
    normalizeResendSender('alerts@orion.app', 'ORION Alerts', silent),
    'ORION Alerts <alerts@orion.app>',
  );
});

test('emits exactly one warning when coercing a bare address', () => {
  const warnings = [];
  normalizeResendSender('brief@orion.app', 'ORION Brief', (m) => warnings.push(m));
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /lacks display name/);
  assert.match(warnings[0], /ORION Brief <brief@orion\.app>/);
});

test('does not warn when the value already has a display-name wrapper', () => {
  const warnings = [];
  normalizeResendSender(
    'ORION Brief <brief@orion.app>',
    'Default',
    (m) => warnings.push(m),
  );
  assert.equal(warnings.length, 0);
});

test('defaults to console.warn when no warning sink is supplied', () => {
  const original = console.warn;
  const captured = [];
  console.warn = (m) => captured.push(m);
  try {
    normalizeResendSender('bare@example.com', 'Name');
    assert.equal(captured.length, 1);
    assert.match(captured[0], /lacks display name/);
  } finally {
    console.warn = original;
  }
});
