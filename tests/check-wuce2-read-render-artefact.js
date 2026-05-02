#!/usr/bin/env node
// check-wuce2-read-render-artefact.js — AC verification tests for wuce.2
// Tests T1.1–T1.3, T2.1–T2.2, T3.1–T3.2, T4.1–T4.3, T5.1–T5.2, IT1–IT3, NFR1–NFR3
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const fs   = require('fs');

// ── Environment ───────────────────────────────────────────────────────────
process.env.GITHUB_API_BASE_URL = 'https://api.github.com';
process.env.GITHUB_REPO         = 'test-owner/test-repo';

// ── Fixtures ──────────────────────────────────────────────────────────────
const contentsFixture  = require('./fixtures/github/contents-api-discovery-md.json');
const notFoundFixture  = require('./fixtures/github/contents-api-not-found.json');
const rateLimitFixture = require('./fixtures/github/contents-api-rate-limit.json');
const discoveryMarkdown = fs.readFileSync(
  path.join(__dirname, 'fixtures/markdown/discovery-sample.md'),
  'utf8'
);

// ── Modules under test ────────────────────────────────────────────────────
const {
  fetchArtefact,
  ArtefactNotFoundError,
  ArtefactFetchError
} = require('../src/web-ui/adapters/artefact-fetcher');

const { renderArtefactToHTML, extractMetadata } = require('../src/web-ui/utils/markdown-renderer');

const {
  handleArtefactRoute,
  setLogger,
  setFetcher
} = require('../src/web-ui/routes/artefact');

// ── Test runner ───────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ── Mock helpers ──────────────────────────────────────────────────────────
function mockReq(overrides) {
  return Object.assign({ session: {}, sessionId: 'test-sid', query: {}, headers: {} }, overrides || {});
}

function mockRes() {
  return {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead(code, hdrs) {
      this.statusCode = code;
      if (hdrs) Object.assign(this.headers, hdrs);
    },
    end(body) { this.body = (body != null ? body : ''); this._ended = true; }
  };
}

// ════════════════════════════════════════════════════════════════════════════
// AC1 — Contents API fetch and HTML rendering
// ════════════════════════════════════════════════════════════════════════════

test('T1.1 fetchArtefact calls Contents API with correct path and Authorization header', async () => {
  let capturedUrl, capturedOptions;
  const origFetch = global.fetch;
  global.fetch = async (url, opts) => {
    capturedUrl     = url;
    capturedOptions = opts;
    return { ok: true, status: 200, json: async () => contentsFixture };
  };

  await fetchArtefact('2026-01-01-example-feature', 'discovery', 'gho_test_fixture_token_wuce1');
  global.fetch = origFetch;

  assert(
    capturedUrl && capturedUrl.includes('artefacts/2026-01-01-example-feature/discovery.md'),
    'T1.1: URL contains correct artefact path'
  );
  assert(
    capturedOptions &&
      capturedOptions.headers &&
      capturedOptions.headers['Authorization'] === 'Bearer gho_test_fixture_token_wuce1',
    'T1.1: Authorization header is Bearer token'
  );
});

test('T1.2 fetchArtefact decodes base64 content from GitHub Contents API response', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => contentsFixture });

  const content = await fetchArtefact('2026-01-01-example-feature', 'discovery', 'token');
  global.fetch = origFetch;

  assert(typeof content === 'string', 'T1.2: returns a string');
  assert(content.includes('## Discovery: Example Feature'), 'T1.2: decoded content contains heading');
});

test('T1.3 renderArtefactToHTML returns HTML string with heading, paragraph, and list elements', () => {
  const html = renderArtefactToHTML(discoveryMarkdown);
  assert(typeof html === 'string', 'T1.3: is a string');
  assert(html.includes('<h2>'), 'T1.3: contains <h2>');
  assert(html.includes('<p>'), 'T1.3: contains <p>');
  assert(html.includes('<ul>') || html.includes('<li>'), 'T1.3: contains <ul> or <li>');
});

// ════════════════════════════════════════════════════════════════════════════
// AC2 — Markdown table renders as HTML table
// ════════════════════════════════════════════════════════════════════════════

test('T2.1 renderArtefactToHTML converts markdown table to <table> element with <th> headers', () => {
  const html = renderArtefactToHTML(discoveryMarkdown);
  assert(html.includes('<table>'), 'T2.1: contains <table>');
  assert(html.includes('<th>'), 'T2.1: contains <th>');
  assert(html.includes('<td>'), 'T2.1: contains <td>');
  const tdContent = html.match(/<td>[^<]*<\/td>/g) || [];
  const hasPipe   = tdContent.some(td => td.includes('|'));
  assert(!hasPipe, 'T2.1: no pipe characters in <td> content');
});

test('T2.2 renderArtefactToHTML table has correct number of header cells matching column count', () => {
  const html      = renderArtefactToHTML(discoveryMarkdown);
  const thMatches = html.match(/<th>[^<]*<\/th>/g) || [];
  assert(thMatches.length === 2, 'T2.2: exactly 2 <th> elements');
  assert(thMatches.some(th => th.includes('Constraint')), 'T2.2: Constraint header present');
  assert(thMatches.some(th => th.includes('Impact')), 'T2.2: Impact header present');
});

// ════════════════════════════════════════════════════════════════════════════
// AC3 — Artefact not found
// ════════════════════════════════════════════════════════════════════════════

test('T3.1 fetchArtefact throws ArtefactNotFoundError when Contents API returns 404', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 404, json: async () => notFoundFixture });

  let thrownErr = null;
  try {
    await fetchArtefact('unknown-feature', 'discovery', 'token');
  } catch (err) {
    thrownErr = err;
  }
  global.fetch = origFetch;

  assert(thrownErr !== null, 'T3.1: an error was thrown');
  assert(thrownErr && thrownErr.name === 'ArtefactNotFoundError', 'T3.1: throws ArtefactNotFoundError');
});

test('T3.2 artefact route handler returns 404 page with "artefact not found" message when ArtefactNotFoundError thrown', async () => {
  setFetcher(async () => { throw new ArtefactNotFoundError('unknown-feature', 'discovery'); });
  const req = mockReq({ session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001 } });
  const res = mockRes();

  await handleArtefactRoute(req, res, 'unknown-feature', 'discovery');
  setFetcher(fetchArtefact);

  assert(res.statusCode === 404, 'T3.2: status is 404');
  assert(res.body.toLowerCase().includes('artefact not found'), 'T3.2: body contains "artefact not found"');
  assert(!res.body.includes('"message"'), 'T3.2: no raw GitHub API JSON in body');
});

// ════════════════════════════════════════════════════════════════════════════
// AC4 — GitHub API error handling
// ════════════════════════════════════════════════════════════════════════════

test('T4.1 fetchArtefact throws ArtefactFetchError when Contents API returns 403', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 403, json: async () => rateLimitFixture });

  let thrownErr = null;
  try {
    await fetchArtefact('example-feature', 'discovery', 'token');
  } catch (err) {
    thrownErr = err;
  }
  global.fetch = origFetch;

  assert(thrownErr !== null, 'T4.1: an error was thrown');
  assert(thrownErr && thrownErr.name === 'ArtefactFetchError', 'T4.1: throws ArtefactFetchError');
  assert(
    thrownErr && thrownErr.cause && thrownErr.cause.toLowerCase().includes('rate limit'),
    'T4.1: cause contains GitHub rate-limit message'
  );
});

test('T4.2 fetchArtefact throws ArtefactFetchError when fetch rejects (network error)', async () => {
  const origFetch = global.fetch;
  global.fetch = async () => { throw new Error('ECONNREFUSED'); };

  let thrownErr = null;
  try {
    await fetchArtefact('example-feature', 'discovery', 'token');
  } catch (err) {
    thrownErr = err;
  }
  global.fetch = origFetch;

  assert(thrownErr !== null, 'T4.2: an error was thrown');
  assert(thrownErr && thrownErr.name === 'ArtefactFetchError', 'T4.2: throws ArtefactFetchError');
});

test('T4.3 artefact route handler returns human-readable error and logs technical detail when ArtefactFetchError thrown', async () => {
  const logEvents = [];
  setLogger({
    info: (event, data) => logEvents.push({ event, ...(data || {}) }),
    warn: (event, data) => logEvents.push({ event, ...(data || {}) })
  });

  const technicalDetail = 'API rate limit exceeded for user ID 99001.';
  setFetcher(async () => { throw new ArtefactFetchError('GitHub API error: 403', technicalDetail); });

  const req = mockReq({ session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001 } });
  const res = mockRes();
  await handleArtefactRoute(req, res, 'example-feature', 'discovery');
  setFetcher(fetchArtefact);
  setLogger({ info: () => {}, warn: () => {} });

  assert(res.body.includes('Unable to load artefact'), 'T4.3: body contains "Unable to load artefact"');
  assert(!res.body.includes(technicalDetail), 'T4.3: body does not contain raw technical error string');
  const logStr = JSON.stringify(logEvents);
  assert(logStr.includes(technicalDetail), 'T4.3: logger called with technical error detail');
});

// ════════════════════════════════════════════════════════════════════════════
// AC5 — Metadata bar extraction
// ════════════════════════════════════════════════════════════════════════════

test('T5.1 extractMetadata returns Status, Approved by, and Created fields', () => {
  const meta = extractMetadata(discoveryMarkdown);
  assert(meta.status === 'Approved', 'T5.1: status is "Approved"');
  assert(meta.approvedBy === 'Test Stakeholder', 'T5.1: approvedBy is "Test Stakeholder"');
  assert(meta.created === '2026-01-15', 'T5.1: created is "2026-01-15"');
});

test('T5.2 renderArtefactToHTML places metadata section before prose content in DOM order', () => {
  const meta = extractMetadata(discoveryMarkdown);
  const html = renderArtefactToHTML(discoveryMarkdown, meta);

  const metaBarIdx = html.indexOf('class="metadata-bar"');
  const articleIdx = html.indexOf('<article>');

  assert(metaBarIdx !== -1, 'T5.2: metadata-bar element exists in output');
  assert(articleIdx !== -1, 'T5.2: article element exists in output');
  assert(metaBarIdx < articleIdx, 'T5.2: metadata-bar appears before <article> in DOM order');
});

// ════════════════════════════════════════════════════════════════════════════
// Integration tests
// ════════════════════════════════════════════════════════════════════════════

test('IT1 GET /artefact/:slug/discovery returns 200 with rendered HTML for valid slug', async () => {
  setFetcher(async () => discoveryMarkdown);
  const req = mockReq({ session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001 } });
  const res = mockRes();

  await handleArtefactRoute(req, res, '2026-01-01-example-feature', 'discovery');
  setFetcher(fetchArtefact);

  assert(res.statusCode === 200, 'IT1: status is 200');
  assert(res.headers['Content-Type'] === 'text/html', 'IT1: Content-Type is text/html');
  assert(res.body.includes('<h2>'), 'IT1: body contains <h2> elements');
  assert(!res.body.includes('## '), 'IT1: body does not contain raw markdown heading syntax');
  assert(!res.body.includes('**'), 'IT1: body does not contain raw markdown bold syntax');
});

test('IT2 GET /artefact/:slug/discovery returns 404 page for unknown slug', async () => {
  setFetcher(async () => { throw new ArtefactNotFoundError('nonexistent-feature', 'discovery'); });
  const req = mockReq({ session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001 } });
  const res = mockRes();

  await handleArtefactRoute(req, res, 'nonexistent-feature', 'discovery');
  setFetcher(fetchArtefact);

  assert(res.statusCode === 404, 'IT2: status is 404');
  assert(res.body.toLowerCase().includes('artefact not found'), 'IT2: body contains "artefact not found" message');
  assert(!res.body.includes('"message"'), 'IT2: no raw GitHub JSON in body');
});

test('IT3 GET /artefact/:slug/discovery returns error page when GitHub API returns rate-limit error', async () => {
  const rateLimitErr = new ArtefactFetchError('GitHub API error: 403', 'API rate limit exceeded for user ID 99001.');
  setFetcher(async () => { throw rateLimitErr; });
  const req = mockReq({ session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001 } });
  const res = mockRes();

  await handleArtefactRoute(req, res, 'example-feature', 'discovery');
  setFetcher(fetchArtefact);

  assert(res.statusCode === 503, 'IT3: status is 503');
  assert(res.body.includes('Unable to load artefact'), 'IT3: body contains "Unable to load artefact"');
  assert(!res.body.includes('API rate limit exceeded'), 'IT3: no raw GitHub API message in body');
});

// ════════════════════════════════════════════════════════════════════════════
// NFR tests
// ════════════════════════════════════════════════════════════════════════════

test('NFR1 renderArtefactToHTML strips <script> tags from rendered output', () => {
  const maliciousMarkdown = "# Title\n\n<script>alert('xss')</script>\n\nSome text.";
  const html = renderArtefactToHTML(maliciousMarkdown);
  assert(!html.includes('<script>'), 'NFR1: no <script> tag in output');
  assert(!html.includes('alert'), 'NFR1: alert string absent from output');
});

test('NFR2 renderArtefactToHTML strips <iframe> tags from rendered output', () => {
  const iframeMarkdown = '# Title\n\n<iframe src="https://attacker.example"></iframe>\n\nSome text.';
  const html = renderArtefactToHTML(iframeMarkdown);
  assert(!html.includes('<iframe>'), 'NFR2: no <iframe> tag in output');
  assert(!html.includes('iframe'), 'NFR2: iframe string absent from output');
});

test('NFR3 artefact read event is logged with user ID, feature slug, artefact type, and timestamp', async () => {
  const logEvents = [];
  setLogger({
    info: (event, data) => logEvents.push({ event, ...(data || {}) }),
    warn: (event, data) => logEvents.push({ event, ...(data || {}) })
  });
  setFetcher(async () => discoveryMarkdown);

  const req = mockReq({ session: { accessToken: 'gho_test_fixture_token_wuce1', userId: 99001 } });
  const res = mockRes();
  await handleArtefactRoute(req, res, 'example-feature', 'discovery');
  setFetcher(fetchArtefact);
  setLogger({ info: () => {}, warn: () => {} });

  const readEvent = logEvents.find(e => e.event === 'artefact_read');
  assert(readEvent !== undefined, 'NFR3: artefact_read event is logged');
  assert(readEvent && readEvent.userId === 99001, 'NFR3: log entry contains userId 99001');
  assert(readEvent && readEvent.featureSlug === 'example-feature', 'NFR3: log entry contains featureSlug');
  assert(readEvent && readEvent.artefactType === 'discovery', 'NFR3: log entry contains artefactType');
  assert(
    readEvent && readEvent.timestamp && /\d{4}-\d{2}-\d{2}T/.test(readEvent.timestamp),
    'NFR3: log entry contains ISO timestamp'
  );
});

// ════════════════════════════════════════════════════════════════════════════
// Runner
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n[wuce.2-read-render-artefact] Running 18 AC verification tests...\n');

  for (const t of tests) {
    try {
      const result = t.fn();
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (err) {
      console.log(`  \u2717 ${t.name} \u2014 threw: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[wuce.2-read-render-artefact] ${passed} passed, ${failed} failed`);

  if (failed > 0) process.exit(1);
}

main();
