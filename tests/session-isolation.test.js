'use strict';
/**
 * session-isolation.test.js — AC verification for wuce.10
 * 17 tests: T1-T5 (unit/real-fs), IT1-IT2 (integration), NFR1-NFR2
 */
const assert = require('assert');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');
const { createSession, cleanupSession, cleanupOrphanedSessions, setLogger } = require('../src/modules/session-manager');

let passed = 0;
let failed = 0;
const failures = [];

// Configure a controlled test base dir (avoids polluting real /tmp/copilot-sessions)
const TEST_BASE = path.join(os.tmpdir(), 'wuce10-test-' + Date.now());

function beforeAll() {
  process.env.WUCE_SESSION_BASE_DIR = TEST_BASE;
  fs.mkdirSync(TEST_BASE, { recursive: true });
}
function afterAll() {
  delete process.env.WUCE_SESSION_BASE_DIR;
  try { fs.rmSync(TEST_BASE, { recursive: true, force: true }); } catch (e) {}
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  \u2717 ' + name + ': ' + err.message);
  }
}

(async function runTests() {
  beforeAll();

  // T1 — createSession path structure (AC1)
  console.log('\nT1 — createSession path structure (AC1)');

  await test('T1.1 — returned path starts with temp base directory', async () => {
    const p = createSession('user-alice');
    try {
      assert.ok(p.startsWith(TEST_BASE), 'path should start with test base');
    } finally { try { cleanupSession(p); } catch (e) {} }
  });

  await test('T1.2 — returned directory exists on filesystem', async () => {
    const p = createSession('user-alice');
    try {
      assert.ok(fs.existsSync(p), 'session directory should exist');
      assert.ok(fs.statSync(p).isDirectory(), 'session path should be a directory');
    } finally { try { cleanupSession(p); } catch (e) {} }
  });

  await test('T1.3 — two calls for same user produce different session dirs', async () => {
    const p1 = createSession('user-alice');
    const p2 = createSession('user-alice');
    try {
      assert.notStrictEqual(p1, p2, 'same user two sessions should produce different paths');
    } finally {
      try { cleanupSession(p1); } catch (e) {}
      try { cleanupSession(p2); } catch (e) {}
    }
  });

  // T2 — Concurrent isolation (AC2)
  console.log('\nT2 — Concurrent isolation (AC2)');

  await test('T2.1 — two different users produce paths with different hash segments', async () => {
    const p1 = createSession('user-alice');
    const p2 = createSession('user-bob');
    try {
      const hash1 = path.basename(path.dirname(p1));
      const hash2 = path.basename(path.dirname(p2));
      assert.notStrictEqual(hash1, hash2, 'different users should have different hash segments');
    } finally {
      try { cleanupSession(p1); } catch (e) {}
      try { cleanupSession(p2); } catch (e) {}
    }
  });

  await test('T2.2 — session dirs for different users share no files', async () => {
    const p1 = createSession('user-alice');
    const p2 = createSession('user-bob');
    try {
      fs.writeFileSync(path.join(p1, 'alice-file.txt'), 'alice data', 'utf8');
      assert.ok(!fs.existsSync(path.join(p2, 'alice-file.txt')), 'alice file should not appear in bob session');
    } finally {
      try { cleanupSession(p1); } catch (e) {}
      try { cleanupSession(p2); } catch (e) {}
    }
  });

  // T3 — cleanupSession (AC3)
  console.log('\nT3 — cleanupSession (AC3)');

  await test('T3.1 — directory and all contents deleted', async () => {
    const p = createSession('user-cleanup');
    const nested = path.join(p, 'subdir', 'file.txt');
    fs.mkdirSync(path.dirname(nested), { recursive: true });
    fs.writeFileSync(nested, 'data', 'utf8');
    cleanupSession(p);
    assert.ok(!fs.existsSync(p), 'session dir should not exist after cleanup');
  });

  await test('T3.2 — cleanup resolves within 5 seconds', async () => {
    const p = createSession('user-timing');
    for (var i = 0; i < 10; i++) {
      fs.writeFileSync(path.join(p, 'file-' + i + '.txt'), 'data', 'utf8');
    }
    const start = Date.now();
    cleanupSession(p);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 5000, 'cleanup should complete within 5s, took: ' + elapsed + 'ms');
    assert.ok(!fs.existsSync(p), 'session dir should be deleted');
  });

  // T4 — Path traversal protection (AC4)
  console.log('\nT4 — Path traversal protection on cleanup (AC4)');

  await test('T4.1 — path outside temp base is rejected', async () => {
    assert.throws(
      () => cleanupSession('/etc/passwd'),
      /invalid session path/i,
      'should reject path outside temp base'
    );
  });

  await test('T4.2 — path traversal via ../ is rejected', async () => {
    const traversal = path.join(TEST_BASE, 'abc', '..', '..', '..', 'etc');
    assert.throws(
      () => cleanupSession(traversal),
      /invalid session path/i,
      'should reject traversal path'
    );
  });

  await test('T4.3 — path within temp base is accepted', async () => {
    const p = createSession('user-accept');
    assert.doesNotThrow(() => cleanupSession(p), 'valid path should not throw');
    assert.ok(!fs.existsSync(p), 'session should be cleaned up');
  });

  // T5 — Startup cleanup of orphaned sessions (AC5)
  console.log('\nT5 — Startup cleanup of orphaned sessions (AC5)');

  await test('T5.1 — directory older than 24h deleted on startup cleanup', async () => {
    const orphanBase = path.join(os.tmpdir(), 'wuce10-orphan-' + Date.now());
    try {
      const oldDir = path.join(orphanBase, 'abc123', 'old-session');
      fs.mkdirSync(oldDir, { recursive: true });
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
      fs.utimesSync(oldDir, oldTime, oldTime);
      cleanupOrphanedSessions(orphanBase);
      assert.ok(!fs.existsSync(oldDir), 'old session dir should be deleted');
    } finally { try { fs.rmSync(orphanBase, { recursive: true, force: true }); } catch (e) {} }
  });

  await test('T5.2 — directory younger than 24h is retained', async () => {
    const orphanBase = path.join(os.tmpdir(), 'wuce10-retain-' + Date.now());
    try {
      const youngDir = path.join(orphanBase, 'abc456', 'young-session');
      fs.mkdirSync(youngDir, { recursive: true });
      const youngTime = new Date(Date.now() - 1 * 60 * 60 * 1000);
      fs.utimesSync(youngDir, youngTime, youngTime);
      cleanupOrphanedSessions(orphanBase);
      assert.ok(fs.existsSync(youngDir), 'young session dir should be retained');
    } finally { try { fs.rmSync(orphanBase, { recursive: true, force: true }); } catch (e) {} }
  });

  await test('T5.3 — startup cleanup logs session path (not raw user ID)', async () => {
    const orphanBase = path.join(os.tmpdir(), 'wuce10-log-' + Date.now());
    try {
      const oldDir = path.join(orphanBase, 'abc789', 'log-session');
      fs.mkdirSync(oldDir, { recursive: true });
      const oldTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
      fs.utimesSync(oldDir, oldTime, oldTime);
      let logCalled = false;
      setLogger({
        info: function(evt, data) {
          if (evt === 'orphan_session_cleaned') {
            logCalled = true;
            assert.ok(!data.path.includes('@'), 'log path should not contain raw email');
          }
        },
        warn: function() {}, error: function() {}
      });
      cleanupOrphanedSessions(orphanBase);
      setLogger({ info: function() {}, warn: function() {}, error: function() {} });
      assert.ok(logCalled, 'cleanup should log the deleted session');
    } finally { try { fs.rmSync(orphanBase, { recursive: true, force: true }); } catch (e) {} }
  });

  // Integration tests
  console.log('\nIntegration tests');

  await test('IT1 — full session lifecycle: create -> use -> cleanup (AC1, AC2, AC3)', async () => {
    const p = createSession('it1-user');
    assert.ok(fs.existsSync(p), 'session dir should exist after create');
    assert.ok(fs.statSync(p).isDirectory(), 'should be a directory');
    cleanupSession(p);
    assert.ok(!fs.existsSync(p), 'session dir should be gone after cleanup');
  });

  await test('IT2 — startup cleanup integration with real dirs (AC5)', async () => {
    const base = path.join(os.tmpdir(), 'wuce10-it2-' + Date.now());
    try {
      const d1 = path.join(base, 'u1', 's1'); // > 24h old — should be cleaned
      const d2 = path.join(base, 'u2', 's2'); // < 24h old — should be retained
      const d3 = path.join(base, 'u3', 's3'); // = 24h boundary — should be cleaned
      [d1, d2, d3].forEach(d => fs.mkdirSync(d, { recursive: true }));
      fs.utimesSync(d1, new Date(Date.now() - 25 * 60 * 60 * 1000), new Date(Date.now() - 25 * 60 * 60 * 1000));
      fs.utimesSync(d2, new Date(Date.now() - 1  * 60 * 60 * 1000), new Date(Date.now() - 1  * 60 * 60 * 1000));
      fs.utimesSync(d3, new Date(Date.now() - 24 * 60 * 60 * 1000), new Date(Date.now() - 24 * 60 * 60 * 1000));
      cleanupOrphanedSessions(base);
      assert.ok(!fs.existsSync(d1), 'd1 (>24h) should be removed');
      assert.ok(fs.existsSync(d2),  'd2 (<24h) should be retained');
      assert.ok(!fs.existsSync(d3), 'd3 (=24h boundary) should be removed');
    } finally { try { fs.rmSync(base, { recursive: true, force: true }); } catch (e) {} }
  });

  // NFR tests
  console.log('\nNFR tests');

  await test('NFR1 — audit log contains hash not raw user ID', async () => {
    let loggedHash = '';
    let loggedRaw  = false;
    setLogger({
      info: function(evt, data) {
        if (evt === 'session_created' && data) {
          loggedHash = data.userHash || '';
          if (JSON.stringify(data).includes('user-alice@example.com')) { loggedRaw = true; }
        }
      },
      warn: function() {}, error: function() {}
    });
    const p = createSession('user-alice@example.com');
    setLogger({ info: function() {}, warn: function() {}, error: function() {} });
    try { cleanupSession(p); } catch (e) {}
    assert.ok(!loggedRaw, 'raw user ID should not appear in log');
    const expectedHash = crypto.createHash('sha256').update('user-alice@example.com').digest('hex');
    assert.strictEqual(loggedHash, expectedHash, 'log should contain sha256 hash');
  });

  await test('NFR2 — session creation and deletion each complete under 100ms', async () => {
    const s1 = Date.now(); const p = createSession('nfr2-user'); const e1 = Date.now() - s1;
    const s2 = Date.now(); cleanupSession(p); const e2 = Date.now() - s2;
    assert.ok(e1 < 100, 'createSession should complete under 100ms, took: ' + e1 + 'ms');
    assert.ok(e2 < 100, 'cleanupSession should complete under 100ms, took: ' + e2 + 'ms');
  });

  afterAll();

  // Summary
  console.log('\n[wuce10-session-isolation] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(f => console.log('  FAIL: ' + f.name + ': ' + f.err.message));
    process.exit(1);
  }
})();
