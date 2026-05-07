'use strict';
// check-wsm1-session-persistence.js -- wsm.1: session persistence to disk
// TDD: all tests must FAIL before implementation, PASS after.

var assert = require('assert');
var crypto = require('crypto');
var path = require('path');
var os = require('os');
var fs = require('fs');

var SKILLS_PATH  = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/session-store.js');

function freshRequireSkills() {
  try { delete require.cache[require.resolve(SKILLS_PATH)]; } catch (_) {}
  return require(SKILLS_PATH);
}

function freshAdapter() {
  try { delete require.cache[require.resolve(ADAPTER_PATH)]; } catch (_) {}
  return require(ADAPTER_PATH);
}

function makeDaysAgoISO(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) {
          failed++;
          failures.push({ name: name, err: err });
          console.log('  [FAIL]', name, '--', err && err.message || err);
        }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name: name, err: err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {

  // -- T1: mutation hook writes session to disk after htmlSubmitTurn
  console.log('\n[wsm1] T1 -- mutation hook writes session to disk after turn');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t1-'));
    process.env.SESSION_STORE_PATH = tmpDir;
    var s = freshRequireSkills();
    var adapter = freshAdapter();
    s.setSessionStore(adapter);
    s.setSkillTurnExecutorAdapter(async function() { return 'Model response — no artefact'; });

    var sid = crypto.randomUUID();
    // Pre-populate with 2 existing turns
    s._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/fake.md',
      systemPrompt: 'SP', journeyId: null, done: false,
      artefactContent: null, artefactPath: null,
      turns: [
        { role: 'assistant', content: 'What is your goal?' },
        { role: 'user', content: 'To test persistence.' }
      ]
    });

    await s.htmlSubmitTurn('discovery', sid, 'New question answer', 'tok');

    await test('T1a: session file created on disk', function() {
      var filePath = path.join(tmpDir, sid + '.json');
      assert.ok(fs.existsSync(filePath), 'session file not created at ' + filePath);
    });

    await test('T1b: file contains all turns (prior + new)', function() {
      var filePath = path.join(tmpDir, sid + '.json');
      var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.ok(Array.isArray(data.turns), 'turns not an array');
      assert.ok(data.turns.length >= 3, 'Expected >= 3 turns, got ' + data.turns.length);
    });

    await test('T1c: file includes lastUpdated timestamp', function() {
      var filePath = path.join(tmpDir, sid + '.json');
      var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      assert.ok(data.lastUpdated, 'lastUpdated missing');
      assert.match(data.lastUpdated, /^\d{4}-\d{2}-\d{2}T/);
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T2: accessToken is NOT written to disk
  console.log('\n[wsm1] T2 -- accessToken excluded from disk write');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t2-'));
    process.env.SESSION_STORE_PATH = tmpDir;
    var s = freshRequireSkills();
    var adapter = freshAdapter();
    s.setSessionStore(adapter);
    s.setSkillTurnExecutorAdapter(async function() { return 'Response without artefact'; });

    var sid = crypto.randomUUID();
    s._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/fake.md', systemPrompt: 'SP',
      journeyId: null, done: false, artefactContent: null, artefactPath: null,
      accessToken: 'ghs_SECRET_THAT_MUST_NOT_BE_ON_DISK',
      turns: []
    });

    await s.htmlSubmitTurn('discovery', sid, 'Hello', 'ghs_SECRET_THAT_MUST_NOT_BE_ON_DISK');

    await test('T2a: session file created', function() {
      assert.ok(fs.existsSync(path.join(tmpDir, sid + '.json')), 'File not created');
    });

    await test('T2b: file content does not contain accessToken value', function() {
      var content = fs.readFileSync(path.join(tmpDir, sid + '.json'), 'utf8');
      assert.ok(!content.includes('ghs_SECRET_THAT_MUST_NOT_BE_ON_DISK'), 'accessToken value found in file');
    });

    await test('T2c: parsed JSON has no accessToken key', function() {
      var data = JSON.parse(fs.readFileSync(path.join(tmpDir, sid + '.json'), 'utf8'));
      assert.ok(!Object.prototype.hasOwnProperty.call(data, 'accessToken'), 'accessToken key present in JSON');
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T3: loadSessions restores all sessions from disk
  console.log('\n[wsm1] T3 -- loadSessions restores sessions to in-memory store');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t3-'));
    var session1 = { skillName: 'discovery', turns: [{ role: 'user', content: 'q1' }], lastUpdated: new Date().toISOString() };
    var session2 = { skillName: 'definition', turns: [{ role: 'assistant', content: 'a1' }, { role: 'user', content: 'q2' }], lastUpdated: new Date().toISOString() };
    var id1 = crypto.randomUUID();
    var id2 = crypto.randomUUID();
    fs.writeFileSync(path.join(tmpDir, id1 + '.json'), JSON.stringify(session1), 'utf8');
    fs.writeFileSync(path.join(tmpDir, id2 + '.json'), JSON.stringify(session2), 'utf8');

    process.env.SESSION_STORE_PATH = tmpDir;
    var adapter = freshAdapter();
    var loaded = new Map();
    adapter.loadSessions(function(id, data) { loaded.set(id, data); });

    await test('T3a: both sessions loaded', function() {
      assert.ok(loaded.has(id1), 'session1 not loaded');
      assert.ok(loaded.has(id2), 'session2 not loaded');
    });

    await test('T3b: session1 turns match', function() {
      assert.strictEqual(loaded.get(id1).turns.length, 1);
      assert.strictEqual(loaded.get(id1).turns[0].content, 'q1');
    });

    await test('T3c: session2 turns match', function() {
      assert.strictEqual(loaded.get(id2).turns.length, 2);
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T4: invalid JSON is skipped on startup (no crash), WARN logged
  console.log('\n[wsm1] T4 -- invalid JSON file is skipped, WARN logged');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t4-'));
    var validId = crypto.randomUUID();
    var invalidId = crypto.randomUUID();
    fs.writeFileSync(path.join(tmpDir, validId + '.json'),
      JSON.stringify({ skillName: 'review', turns: [], lastUpdated: new Date().toISOString() }), 'utf8');
    fs.writeFileSync(path.join(tmpDir, invalidId + '.json'), '{invalid json!!!', 'utf8');

    process.env.SESSION_STORE_PATH = tmpDir;
    var adapter = freshAdapter();
    var loaded = new Map();
    var warnLogs = [];
    var origWarn = console.warn;
    console.warn = function() { warnLogs.push(Array.prototype.join.call(arguments, ' ')); origWarn.apply(console, arguments); };
    var threw = false;
    try {
      adapter.loadSessions(function(id, data) { loaded.set(id, data); });
    } catch (_) { threw = true; }
    console.warn = origWarn;

    await test('T4a: no exception thrown', function() {
      assert.ok(!threw, 'loadSessions threw an exception');
    });

    await test('T4b: valid session loaded', function() {
      assert.ok(loaded.has(validId), 'valid session not loaded');
    });

    await test('T4c: invalid session not loaded', function() {
      assert.ok(!loaded.has(invalidId), 'invalid session was loaded (should be skipped)');
    });

    await test('T4d: WARN logged for invalid file', function() {
      var allWarns = warnLogs.join('\n');
      assert.ok(allWarns.includes('invalid') || allWarns.includes('json') || allWarns.includes(invalidId),
        'No WARN logged for invalid JSON. Logs: ' + allWarns.slice(0, 200));
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T5: stale sessions deleted on startup
  console.log('\n[wsm1] T5 -- stale sessions deleted, fresh sessions retained');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t5-'));
    var staleId = crypto.randomUUID();
    var freshId = crypto.randomUUID();
    // Stale: 8 days ago
    fs.writeFileSync(path.join(tmpDir, staleId + '.json'),
      JSON.stringify({ skillName: 'discovery', turns: [], lastUpdated: makeDaysAgoISO(8) }), 'utf8');
    // Fresh: today
    fs.writeFileSync(path.join(tmpDir, freshId + '.json'),
      JSON.stringify({ skillName: 'discovery', turns: [], lastUpdated: new Date().toISOString() }), 'utf8');

    process.env.SESSION_STORE_PATH = tmpDir;
    process.env.SESSION_MAX_AGE_DAYS = '7';
    var adapter = freshAdapter();
    var loaded = new Map();
    adapter.loadSessions(function(id, data) { loaded.set(id, data); });

    await test('T5a: stale session file deleted from disk', function() {
      assert.ok(!fs.existsSync(path.join(tmpDir, staleId + '.json')), 'Stale file still exists');
    });

    await test('T5b: fresh session loaded into memory', function() {
      assert.ok(loaded.has(freshId), 'Fresh session not loaded');
    });

    await test('T5c: stale session not in memory', function() {
      assert.ok(!loaded.has(staleId), 'Stale session was loaded into memory');
    });

    delete process.env.SESSION_STORE_PATH;
    delete process.env.SESSION_MAX_AGE_DAYS;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T6: SESSION_STORE_PATH created automatically on startup
  console.log('\n[wsm1] T6 -- non-existent SESSION_STORE_PATH is created on loadSessions');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t6-'));
    var nonExistentPath = path.join(tmpDir, 'sessions-store-new');
    assert.ok(!fs.existsSync(nonExistentPath), 'Path should not exist initially');

    process.env.SESSION_STORE_PATH = nonExistentPath;
    var adapter = freshAdapter();
    var threw = false;
    try {
      adapter.loadSessions(function() {});
    } catch (_) { threw = true; }

    await test('T6a: no exception thrown', function() {
      assert.ok(!threw, 'loadSessions threw when path did not exist');
    });

    await test('T6b: directory created', function() {
      assert.ok(fs.existsSync(nonExistentPath), 'SESSION_STORE_PATH not created');
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T7: write failure is non-fatal; ERROR logged; in-memory session intact
  console.log('\n[wsm1] T7 -- write failure non-fatal, ERROR logged, turn in memory');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t7-'));
    process.env.SESSION_STORE_PATH = tmpDir;
    var s = freshRequireSkills();
    var adapter = freshAdapter();
    s.setSessionStore(adapter);
    s.setSkillTurnExecutorAdapter(async function() { return 'Response without artefact'; });

    var sid = crypto.randomUUID();
    s._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/fake.md', systemPrompt: 'SP',
      journeyId: null, done: false, artefactContent: null, artefactPath: null, turns: []
    });

    // Stub fs.writeFileSync to throw only for .json files in SESSION_STORE_PATH
    var origWriteFileSync = fs.writeFileSync;
    var errorLogs = [];
    var origError = console.error;
    console.error = function() { errorLogs.push(Array.prototype.join.call(arguments, ' ')); origError.apply(console, arguments); };
    fs.writeFileSync = function(p, d, o) {
      if (typeof p === 'string' && p.includes(tmpDir) && p.endsWith('.json')) {
        throw new Error('EACCES: permission denied');
      }
      return origWriteFileSync.call(fs, p, d, o);
    };

    var result = null;
    try {
      result = await s.htmlSubmitTurn('discovery', sid, 'Hello world', 'tok');
    } finally {
      fs.writeFileSync = origWriteFileSync;
      console.error = origError;
    }

    await test('T7a: htmlSubmitTurn does not throw', function() {
      // result should be non-null (the turn succeeded in memory)
      assert.ok(result !== null, 'htmlSubmitTurn returned null (session not found?)');
    });

    await test('T7b: turn present in in-memory session', function() {
      var sess = s._getHtmlSession(sid);
      assert.ok(sess && sess.turns.length >= 1, 'turn not added to in-memory session');
    });

    await test('T7c: ERROR logged with failure message', function() {
      var allErrors = errorLogs.join('\n');
      assert.ok(allErrors.includes('session_write_error') || allErrors.includes('EACCES') || allErrors.includes('permission'),
        'No ERROR logged for write failure. Logs: ' + allErrors.slice(0, 300));
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // -- T8: restored session without accessToken leads to auth redirect on protected route
  console.log('\n[wsm1] T8 -- restored session (no accessToken) → auth redirect on protected route');
  {
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wsm1-t8-'));
    process.env.SESSION_STORE_PATH = tmpDir;
    var adapter = freshAdapter();

    // Write a session with accessToken (it should be stripped)
    var sid = crypto.randomUUID();
    adapter.write(sid, { skillName: 'discovery', turns: [], login: 'user', accessToken: 'ghs_REAL_TOKEN_123', lastUpdated: new Date().toISOString() });

    // Read it back — no accessToken
    var restored = adapter.read(sid);

    await test('T8a: restored data has no accessToken', function() {
      assert.ok(restored, 'restored data is null');
      assert.ok(!Object.prototype.hasOwnProperty.call(restored, 'accessToken'), 'accessToken present in restored data');
    });

    // Using restored session as req.session on an auth-protected route → should get 302 redirect
    var j = require(JOURNEY_PATH);
    var res = { _code: null, _body: '', _headers: {} };
    res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
    res.end = function(body) { res._body += (body || ''); };
    var req = { session: restored || {}, params: {}, body: {}, headers: {} };

    await test('T8b: auth-protected route returns redirect when no accessToken', function() {
      j.handleGetJourney(req, res);
      assert.ok(res._code === 302 || res._code === 401, 'Expected 302/401, got ' + res._code);
    });

    delete process.env.SESSION_STORE_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // Summary
  console.log('\n=== wsm1 results:', passed, 'passed,', failed, 'failed ===');
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAILED:', f.name, '--', f.err && f.err.message || f.err); });
    process.exit(1);
  }
}

main().catch(function(err) { console.error(err); process.exit(1); });
