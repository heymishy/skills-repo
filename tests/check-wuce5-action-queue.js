#!/usr/bin/env node
// check-wuce5-action-queue.js — AC verification tests for wuce.5
// Tests T1.1–T1.4, T2.1–T2.4, T3.1–T3.4, IT1–IT4, NFR1–NFR2
// Tests FAIL until src/web-ui/adapters/action-queue.js, routes/dashboard.js,
// config/repo-list.js exist and pass all assertions.
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const fs   = require('fs');

const ROOT = path.join(__dirname, '..');

const pendingFixture  = fs.readFileSync(
  path.join(ROOT, 'tests/fixtures/markdown/artefact-pending-signoff.md'), 'utf8'
);
const signedFixture   = fs.readFileSync(
  path.join(ROOT, 'tests/fixtures/markdown/artefact-signed-off.md'), 'utf8'
);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── Env setup ────────────────────────────────────────────────────────────────
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.WUCE_REPOSITORIES    = 'testorg/repo-a,testorg/repo-b';

// ── Load modules ─────────────────────────────────────────────────────────────
const {
  hasPendingSignOff,
  getPendingActions,
  renderActionQueue,
  setValidateRepositoryAccess,
  setGetArtefactDescriptors,
  setFetchArtefact
} = require('../src/web-ui/adapters/action-queue');

const {
  handleGetActions,
  setLogger,
  setGetPendingActions
} = require('../src/web-ui/routes/dashboard');

// ── Test helpers ─────────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign(
    { session: {}, sessionId: 'test-sid', query: {}, headers: {}, method: 'GET' },
    overrides || {}
  );
}

function mockRes() {
  const res = {
    statusCode: null,
    headers: {},
    body: '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) {
      this.body = (body != null ? String(body) : '');
      this._ended = true;
    }
  };
  return res;
}

function makeArtefactDescriptor(overrides) {
  return Object.assign({
    path:         'artefacts/2026-05-01-test-feature/dor/tf.1-dor.md',
    featureName:  'Test Feature',
    artefactType: 'Discovery',
    featureSlug:  '2026-05-01-test-feature',
    createdAt:    '2026-05-01T00:00:00Z',
    artefactUrl:  '/features/2026-05-01-test-feature/discovery'
  }, overrides || {});
}

// ── Test registry ─────────────────────────────────────────────────────────────
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ═══════════════════════════════════════════════════════════════════════════════
// T1 — hasPendingSignOff
// ═══════════════════════════════════════════════════════════════════════════════

test('T1.1 returns true when ## Approved by is absent (pending fixture)', () => {
  assert(hasPendingSignOff(pendingFixture) === true,
    'T1.1: hasPendingSignOff returns true for artefact-pending-signoff.md');
});

test('T1.2 returns false when ## Approved by is present (signed fixture)', () => {
  assert(hasPendingSignOff(signedFixture) === false,
    'T1.2: hasPendingSignOff returns false for artefact-signed-off.md');
});

test('T1.3 returns false for empty string', () => {
  assert(hasPendingSignOff('') === false,
    'T1.3: hasPendingSignOff returns false for empty string');
});

test('T1.4 returns true when only lowercase variant "## approved by" is present', () => {
  const lowercaseVariant = pendingFixture + '\n## approved by\n\nSomeone\n';
  assert(hasPendingSignOff(lowercaseVariant) === true,
    'T1.4: lowercase "## approved by" is not a valid sign-off; returns true (pending)');
});

// ═══════════════════════════════════════════════════════════════════════════════
// T2 — getPendingActions adapter
// ═══════════════════════════════════════════════════════════════════════════════

test('T2.1 returns pending items with required fields (featureName, artefactType, daysPending)', async () => {
  setValidateRepositoryAccess(async () => true);
  setGetArtefactDescriptors(async () => [makeArtefactDescriptor()]);
  setFetchArtefact(async () => pendingFixture);

  process.env.WUCE_REPOSITORIES = 'testorg/repo-a';
  const result = await getPendingActions({ id: 1, login: 'user1' }, 'tok');

  assert(Array.isArray(result.items), 'T2.1: items is an array');
  assert(result.items.length >= 1, 'T2.1: at least one pending item returned');
  const item = result.items[0];
  assert(typeof item.featureName === 'string' && item.featureName.length > 0,
    'T2.1: item has featureName string');
  assert(typeof item.artefactType === 'string' && item.artefactType.length > 0,
    'T2.1: item has artefactType string');
  assert(typeof item.daysPending === 'number',
    'T2.1: item has daysPending number');
});

test('T2.2 returns empty array when all artefacts are signed off', async () => {
  setValidateRepositoryAccess(async () => true);
  setGetArtefactDescriptors(async () => [makeArtefactDescriptor()]);
  setFetchArtefact(async () => signedFixture);

  process.env.WUCE_REPOSITORIES = 'testorg/repo-a';
  const result = await getPendingActions({ id: 1, login: 'user1' }, 'tok');

  assert(Array.isArray(result.items) && result.items.length === 0,
    'T2.2: empty items array when all artefacts signed off');
  assert(result.bannerMessage === null, 'T2.2: no banner when no access failures');
});

test('T2.3 includes items from accessible repos only, sets bannerMessage for inaccessible repo', async () => {
  setValidateRepositoryAccess(async (owner, repo) => repo === 'repo-a');
  setGetArtefactDescriptors(async () => [makeArtefactDescriptor()]);
  setFetchArtefact(async () => pendingFixture);

  process.env.WUCE_REPOSITORIES = 'testorg/repo-a,testorg/repo-b';
  const result = await getPendingActions({ id: 1, login: 'user1' }, 'tok');

  assert(Array.isArray(result.items) && result.items.length >= 1,
    'T2.3: items from accessible repo included');
  assert(typeof result.bannerMessage === 'string' && result.bannerMessage.length > 0,
    'T2.3: bannerMessage set when one repo inaccessible');
});

test('T2.4 repo access throws (network error) → no exception propagated, items omitted, banner set', async () => {
  setValidateRepositoryAccess(async (owner, repo) => {
    if (repo === 'repo-b') throw new Error('network error');
    return true;
  });
  setGetArtefactDescriptors(async () => [makeArtefactDescriptor()]);
  setFetchArtefact(async () => pendingFixture);

  process.env.WUCE_REPOSITORIES = 'testorg/repo-a,testorg/repo-b';
  let threw = false;
  let result;
  try {
    result = await getPendingActions({ id: 1, login: 'user1' }, 'tok');
  } catch (_) {
    threw = true;
  }
  assert(!threw, 'T2.4: no exception propagated when validateRepositoryAccess throws');
  assert(typeof result.bannerMessage === 'string',
    'T2.4: bannerMessage set when repo access throws');
  assert(result.items.length >= 1, 'T2.4: items from accessible repo still returned');
});

// ═══════════════════════════════════════════════════════════════════════════════
// T3 — renderActionQueue DOM-state (HTML string assertions)
// ═══════════════════════════════════════════════════════════════════════════════

test('T3.1 renders pending items with AC1 fields (featureName, artefactType, daysPending, artefactUrl link)', () => {
  const items = [{
    featureName:  'Test Feature',
    artefactType: 'Discovery',
    daysPending:  3,
    artefactUrl:  '/features/test/discovery'
  }];
  const html = renderActionQueue(items, null);

  assert(html.includes('Test Feature'),   'T3.1: html contains featureName');
  assert(html.includes('Discovery'),      'T3.1: html contains artefactType');
  assert(html.includes('3'),              'T3.1: html contains daysPending value');
  assert(html.includes('/features/test/discovery'), 'T3.1: html contains artefactUrl in link href');
  assert(/<a\s[^>]*href=["'][^"']*\/features\/test\/discovery["'][^>]*>/.test(html),
    'T3.1: artefactUrl appears inside an <a> href attribute (AC4)');
});

test('T3.2 renders empty state with exact AC2 message when no items', () => {
  const html = renderActionQueue([], null);

  assert(html.includes("No actions pending — you're up to date"),
    'T3.2: exact empty-state message present');
  assert(!html.includes('<li'), 'T3.2: no list items in empty state');
});

test('T3.3 renders banner when bannerMessage is set (AC5)', () => {
  const banner = 'Some repositories could not be checked — re-authenticate if you believe items are missing.';
  const html = renderActionQueue([], banner);

  assert(html.includes(banner), 'T3.3: banner message present in html');
});

test('T3.4 list item link text is descriptive (not generic "click here") — accessibility NFR', () => {
  const items = [{
    featureName:  'My Feature',
    artefactType: 'Review',
    daysPending:  2,
    artefactUrl:  '/features/my-feature/review'
  }];
  const html = renderActionQueue(items, null);

  // Link text must contain artefact type or feature name — not just "click here"
  assert(!html.match(/<a[^>]*>click here<\/a>/i),
    'T3.4: link text is not "click here"');
  assert(html.includes('Review') && html.includes('My Feature'),
    'T3.4: link text contains artefact type and feature name');
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT1 — GET /api/actions returns pending items for authenticated user (AC1)
// ═══════════════════════════════════════════════════════════════════════════════

test('IT1 GET /api/actions returns 200 with items and bannerMessage:null for authenticated user', async () => {
  const mockItems = [{
    featureName: 'Test Feature', artefactType: 'Discovery',
    daysPending: 1, artefactUrl: '/features/test/discovery'
  }];
  setGetPendingActions(async () => ({ items: mockItems, bannerMessage: null }));

  const req = mockReq({
    session: { userId: 42, login: 'alice', accessToken: 'token123' }
  });
  const res = mockRes();

  await handleGetActions(req, res);

  assert(res.statusCode === 200, 'IT1: status 200 for authenticated user');
  const body = JSON.parse(res.body);
  assert(Array.isArray(body.items) && body.items.length === 1,
    'IT1: body.items contains one item');
  assert(body.bannerMessage === null, 'IT1: bannerMessage is null');
  assert(typeof body.items[0].featureName === 'string',
    'IT1: item has featureName');
  assert(typeof body.items[0].artefactType === 'string',
    'IT1: item has artefactType');
  assert(typeof body.items[0].daysPending === 'number',
    'IT1: item has daysPending');
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT2 — GET /api/actions returns empty state (AC2)
// ═══════════════════════════════════════════════════════════════════════════════

test('IT2 GET /api/actions returns 200 with empty items array when no pending actions', async () => {
  setGetPendingActions(async () => ({ items: [], bannerMessage: null }));

  const req = mockReq({
    session: { userId: 42, login: 'alice', accessToken: 'token123' }
  });
  const res = mockRes();

  await handleGetActions(req, res);

  assert(res.statusCode === 200, 'IT2: status 200');
  const body = JSON.parse(res.body);
  assert(Array.isArray(body.items) && body.items.length === 0,
    'IT2: body.items is empty array');
  assert(body.bannerMessage === null, 'IT2: bannerMessage is null');
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT3 — GET /api/actions with repo access failure → banner set (AC5)
// ═══════════════════════════════════════════════════════════════════════════════

test('IT3 GET /api/actions with one inaccessible repo → items omitted, bannerMessage set', async () => {
  const banner = 'Some repositories could not be checked — re-authenticate if you believe items are missing.';
  setGetPendingActions(async () => ({
    items: [{ featureName: 'Repo A Feature', artefactType: 'Discovery', daysPending: 0, artefactUrl: '/x' }],
    bannerMessage: banner
  }));

  const req = mockReq({
    session: { userId: 42, login: 'alice', accessToken: 'token123' }
  });
  const res = mockRes();

  await handleGetActions(req, res);

  assert(res.statusCode === 200, 'IT3: status 200');
  const body = JSON.parse(res.body);
  assert(body.bannerMessage === banner, 'IT3: bannerMessage equals expected string');
  assert(Array.isArray(body.items) && body.items.length === 1,
    'IT3: accessible repo items still returned');
});

// ═══════════════════════════════════════════════════════════════════════════════
// IT4 — GET /api/actions requires authentication
// ═══════════════════════════════════════════════════════════════════════════════

test('IT4 GET /api/actions returns 401 when no session', async () => {
  const req = mockReq({ session: {} }); // no userId → not authenticated
  const res = mockRes();

  await handleGetActions(req, res);

  assert(res.statusCode === 401, 'IT4: 401 when not authenticated');
});

// ═══════════════════════════════════════════════════════════════════════════════
// NFR1 — Audit log entry on action queue load
// ═══════════════════════════════════════════════════════════════════════════════

test('NFR1 audit log called with userId and itemCount (no token value) on GET /api/actions', async () => {
  setGetPendingActions(async () => ({ items: [], bannerMessage: null }));

  const logCalls = [];
  setLogger({
    info: (event, data) => logCalls.push({ event, data }),
    warn: (/* event, data */) => {}
  });

  const req = mockReq({
    session: { userId: 99, login: 'bob', accessToken: 'secret-token' }
  });
  const res = mockRes();

  await handleGetActions(req, res);

  const logEntry = logCalls.find(c => c.event === 'action_queue_load');
  assert(logEntry !== undefined, 'NFR1: action_queue_load log event emitted');
  assert(logEntry.data.userId !== undefined, 'NFR1: userId present in log entry');
  assert(logEntry.data.itemCount !== undefined, 'NFR1: itemCount present in log entry');
  assert(!JSON.stringify(logEntry.data).includes('secret-token'),
    'NFR1: token value not present in log entry');

  // Reset logger
  setLogger({ info: () => {}, warn: () => {} });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NFR2 — Repository access validated server-side for every configured repo
// ═══════════════════════════════════════════════════════════════════════════════

test('NFR2 validateRepositoryAccess called once per configured repository', async () => {
  const accessCalls = [];
  setValidateRepositoryAccess(async (owner, repo) => {
    accessCalls.push(`${owner}/${repo}`);
    return true;
  });
  setGetArtefactDescriptors(async () => []);
  setFetchArtefact(async () => '');

  process.env.WUCE_REPOSITORIES = 'orgA/repo-x,orgA/repo-y';
  await getPendingActions({ id: 1, login: 'user1' }, 'tok');

  assert(accessCalls.includes('orgA/repo-x'), 'NFR2: validateRepositoryAccess called for repo-x');
  assert(accessCalls.includes('orgA/repo-y'), 'NFR2: validateRepositoryAccess called for repo-y');
  assert(accessCalls.length === 2, 'NFR2: called exactly once per configured repo');
});

// ═══════════════════════════════════════════════════════════════════════════════
// Run all tests
// ═══════════════════════════════════════════════════════════════════════════════

async function run() {
  console.log('\nwuce.5 — Action queue and pipeline state mutation\n');
  for (const { name, fn } of tests) {
    console.log(`\n${name}`);
    try {
      await fn();
    } catch (err) {
      console.log(`  \u2717 THREW: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.error(`\n[check-wuce5] FAIL — ${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log(`\n[check-wuce5] PASS — all ${passed} tests passing ✓`);
  }
}

run();
