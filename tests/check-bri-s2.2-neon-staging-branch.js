'use strict';

/**
 * bri-s2.2 -- Provision a Neon staging branch for Postgres
 *
 * Static-analysis regression guards (T1, T2, NFR2) plus mocked-timing
 * integration tests (IT1, IT2) for the connection-readiness helper.
 * No real Neon/Postgres connections are made anywhere in this file --
 * see the story's test plan Coverage gaps table for the three
 * External-dependency gaps (live schema identity, live write isolation,
 * real-world cold-start timing) that remain manual verification steps.
 *
 * Reference: artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.2-neon-staging-branch-test-plan.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const SERVER_JS_PATH = path.join(ROOT, 'src', 'web-ui', 'server.js');
const SRC_DIR = path.join(ROOT, 'src');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

function walkJsFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// T1 -- no environment-conditional schema-forking branch in server.js
// ---------------------------------------------------------------------------
test('T1: server.js has no environment-conditional schema-forking branch', () => {
  const content = fs.readFileSync(SERVER_JS_PATH, 'utf8');

  // Looks for a conditional keyed on a "staging"-flavoured env check that
  // wraps a CREATE TABLE / require of a staging-only schema file -- i.e.
  // the anti-pattern this guard protects against, not the ordinary
  // `if (process.env.DATABASE_URL)` presence check that already exists
  // unconditionally for both staging and prod.
  const stagingForkPattern = /NODE_ENV\s*===?\s*['"]staging['"]|STAGING_SCHEMA|staging-schema|schema[-_]staging/i;
  const match = content.match(stagingForkPattern);

  assert.strictEqual(
    match,
    null,
    `server.js appears to contain an environment-conditional schema fork: "${match && match[0]}"`
  );
});

// ---------------------------------------------------------------------------
// T2 -- no hardcoded Postgres connection string in tracked source
// ---------------------------------------------------------------------------
test('T2: no hardcoded Postgres connection string in tracked src/', () => {
  const jsFiles = walkJsFiles(SRC_DIR);
  // Matches postgres:// or postgresql:// followed by a credentials-shaped
  // literal (user:pass@host) -- not a bare scheme mentioned in a comment
  // or a placeholder like postgres://user:pass@localhost/db.
  const credPattern = /postgres(?:ql)?:\/\/[a-zA-Z0-9_.-]+:[^@\s'"`]+@(?!localhost)[a-zA-Z0-9_.-]+/;
  const offenders = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (credPattern.test(line)) {
        offenders.push(`${path.relative(ROOT, file)}:${idx + 1}`);
      }
    });
  }

  assert.deepStrictEqual(
    offenders,
    [],
    `hardcoded Postgres connection string(s) found: ${offenders.join(', ')}`
  );
});

// ---------------------------------------------------------------------------
// NFR2 -- no literal Neon connection string committed to tracked source
// ---------------------------------------------------------------------------
test('NFR2: no literal Neon connection string in tracked src/', () => {
  const jsFiles = walkJsFiles(SRC_DIR);
  const neonPattern = /neon\.tech/i;
  const offenders = [];

  for (const file of jsFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (neonPattern.test(content)) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepStrictEqual(
    offenders,
    [],
    `literal Neon hostname reference found in tracked source (expected only in Fly secrets, never in code): ${offenders.join(', ')}`
  );
});

// ---------------------------------------------------------------------------
// IT1 / IT2 -- connection-readiness helper bounds Neon's autosuspend
// cold-start behind the 10-second budget (AC3 / NFR-Performance)
// ---------------------------------------------------------------------------
const { waitForDbReady, DbConnectTimeoutError } = require('../src/web-ui/adapters/db-ready');

async function runAsyncTests() {
  await testAsync('IT1: a delayed connection within the 10s budget succeeds', async () => {
    const start = Date.now();
    const stubConnect = () => new Promise((resolve) => setTimeout(() => resolve('connected'), 200));
    const result = await waitForDbReady(stubConnect, 1000);
    const elapsed = Date.now() - start;
    assert.strictEqual(result, 'connected');
    assert.ok(elapsed < 1000, `expected elapsed (${elapsed}ms) to be well under the 1000ms budget`);
  });

  await testAsync('IT2: a delayed connection exceeding the budget surfaces DbConnectTimeoutError', async () => {
    const start = Date.now();
    const stubConnect = () => new Promise(() => {}); // never resolves
    let caught = null;
    try {
      await waitForDbReady(stubConnect, 300);
    } catch (err) {
      caught = err;
    }
    const elapsed = Date.now() - start;
    assert.ok(caught instanceof DbConnectTimeoutError, `expected a DbConnectTimeoutError, got ${caught && caught.constructor.name}`);
    assert.strictEqual(caught.code, 'DB_CONNECT_TIMEOUT');
    assert.ok(elapsed >= 300 && elapsed < 1000, `expected rejection at ~300ms, got ${elapsed}ms`);
  });
}

runAsyncTests().then(() => {
  console.log(`\n[bri-s2.2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
});
