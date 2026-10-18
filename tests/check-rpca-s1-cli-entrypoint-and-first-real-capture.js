'use strict';
// check-rpca-s1-cli-entrypoint-and-first-real-capture.js -- TDD tests for rpca-s1
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly
(function () {
  const { buildScreenshotPath } = require('../scripts/playback-capture');
  try {
    const result = buildScreenshotPath('f1', 's1', 'AC1');
    assert.strictEqual(result, 'artefacts/f1/playback/s1/screenshots/AC1.png', 'expected the exact existing path convention');
    pass('AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly');
  } catch (e) { fail('AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly', e); }
})();

// AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server
await (async function () {
  const http = require('http');
  const { authenticateStagingSession } = require('../scripts/playback-capture');
  const fixtureSecret = 'fixture-secret-value-not-real';
  let receivedHeader = null;
  const server = http.createServer((req, res) => {
    receivedHeader = req.headers['x-e2e-test-endpoint-bypass'];
    res.writeHead(200, { 'Set-Cookie': 'session_id=fixture-session-abc123; HttpOnly; SameSite=Lax; Path=/' });
    res.end(JSON.stringify({ sessionId: 'fixture-session-abc123' }));
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  try {
    const sessionId = await authenticateStagingSession(`http://localhost:${port}`, fixtureSecret);
    assert.strictEqual(receivedHeader, fixtureSecret, 'expected the secret to be sent in the x-e2e-test-endpoint-bypass header');
    assert.strictEqual(sessionId, 'fixture-session-abc123', 'expected the parsed session id from the Set-Cookie header');
    pass('AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server');
  } catch (e) { fail('AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server', e); }
  finally { server.close(); }
})();

console.log(`\n[rpca-s1-cli-entrypoint-and-first-real-capture] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
