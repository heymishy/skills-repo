'use strict';
// check-wucp3-tool-executor.js
// Tests for wucp.3 — Tool execution loop (read-only file access for mid-session artefact reads)
// All tests are written to FAIL until the implementation is complete (TDD).
// See test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.3-test-plan.md

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

var passed = 0; var failed = 0; var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.message || err)); return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

var EXECUTOR_PATH = path.resolve(__dirname, '../src/web-ui/modules/tool-executor.js');
var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');

var tmpBase = path.join(os.tmpdir(), 'wucp3-test-' + Date.now());

function mkTmp(subdir) {
  var d = path.join(tmpBase, subdir);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function writeFile(dir, relPath, content) {
  var fullPath = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

process.on('exit', function() {
  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}
  console.log('\n[wucp3-tool-executor] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAILED: ' + f.name); });
    process.exitCode = 1;
  }
});

var queue = [];

// ---------------------------------------------------------------------------
// T3.1 — parseToolMarker returns {verb, path} for well-formed read_file (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.1: parseToolMarker returns {verb,path} for read_file marker (AC1)', function() {
    var m = freshRequire(EXECUTOR_PATH);
    var result = m.parseToolMarker('<TOOL:read_file path="workspace/state.json"/>');
    assert.ok(result !== null && result !== undefined, 'parseToolMarker must return non-null for well-formed marker');
    assert.strictEqual(result.verb, 'read_file', 'verb must be read_file');
    assert.strictEqual(result.path, 'workspace/state.json', 'path must be workspace/state.json');
  });
});

// ---------------------------------------------------------------------------
// T3.2 — executeTool read_file returns file content (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.2: executeTool read_file calls adapter and returns file content (AC1)', function() {
    var repoRoot = mkTmp('T3.2-repo');
    writeFile(repoRoot, 'workspace/state.json', '{"phase":"test"}');
    var m = freshRequire(EXECUTOR_PATH);
    var called = false;
    m.setToolExecutor(function(verb, resolvedPath) {
      called = true;
      return fs.readFileSync(resolvedPath, 'utf8');
    });
    var result = m.executeTool('read_file', 'workspace/state.json', repoRoot, {});
    assert.ok(called, 'tool adapter must have been called');
    assert.ok(typeof result === 'string' && result.length > 0, 'result must be a non-empty string');
    assert.ok(result.indexOf('{"phase":"test"}') >= 0, 'result must contain file content');
  });
});

// ---------------------------------------------------------------------------
// T3.3 — executeTool read_file result is a non-empty string tool_result (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.3: executeTool read_file result is non-empty string suitable as tool_result (AC1)', function() {
    var repoRoot = mkTmp('T3.3-repo');
    writeFile(repoRoot, 'workspace/state.json', 'content-xyz');
    var m = freshRequire(EXECUTOR_PATH);
    m.setToolExecutor(function(verb, resolvedPath) { return fs.readFileSync(resolvedPath, 'utf8'); });
    var result = m.executeTool('read_file', 'workspace/state.json', repoRoot, {});
    assert.ok(typeof result === 'string', 'tool_result must be a string');
    assert.ok(result.length > 0, 'tool_result must be non-empty');
    assert.ok(result.indexOf('content-xyz') >= 0, 'tool_result must contain file content');
  });
});

// ---------------------------------------------------------------------------
// T3.4 — parseToolMarker returns {verb, path} for well-formed list_dir (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.4: parseToolMarker returns {verb,path} for list_dir marker (AC2)', function() {
    var m = freshRequire(EXECUTOR_PATH);
    var result = m.parseToolMarker('<TOOL:list_dir path="artefacts/"/>');
    assert.ok(result !== null && result !== undefined, 'parseToolMarker must return non-null');
    assert.strictEqual(result.verb, 'list_dir', 'verb must be list_dir');
    assert.strictEqual(result.path, 'artefacts/', 'path must be artefacts/');
  });
});

// ---------------------------------------------------------------------------
// T3.5 — executeTool list_dir returns directory listing (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.5: executeTool list_dir returns dir listing with known filenames (AC2)', function() {
    var repoRoot = mkTmp('T3.5-repo');
    fs.mkdirSync(path.join(repoRoot, 'artefacts'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'artefacts', 'foo.md'), '', 'utf8');
    fs.writeFileSync(path.join(repoRoot, 'artefacts', 'bar.md'), '', 'utf8');
    var m = freshRequire(EXECUTOR_PATH);
    m.setToolExecutor(function(verb, resolvedPath) {
      if (verb === 'list_dir') {
        return fs.readdirSync(resolvedPath).join('\n');
      }
    });
    var result = m.executeTool('list_dir', 'artefacts/', repoRoot, {});
    assert.ok(typeof result === 'string' && result.length > 0, 'result must be non-empty string');
    assert.ok(result.indexOf('foo.md') >= 0, 'result must contain foo.md');
    assert.ok(result.indexOf('bar.md') >= 0, 'result must contain bar.md');
  });
});

// ---------------------------------------------------------------------------
// T3.6 — parseToolMarker returns null for marker missing path attribute (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.6: parseToolMarker returns null for marker missing path attribute (AC3)', function() {
    var m = freshRequire(EXECUTOR_PATH);
    var result = m.parseToolMarker('<TOOL:read_file>');
    assert.strictEqual(result, null, 'parseToolMarker must return null for malformed marker');
  });
});

// ---------------------------------------------------------------------------
// T3.7 — malformed marker produces notification text, tool adapter NOT called (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.7: malformed marker produces notification text, no file op (AC3)', function() {
    var m = freshRequire(EXECUTOR_PATH);
    var adapterCalled = false;
    m.setToolExecutor(function() { adapterCalled = true; return 'content'; });
    // processMarkerText should be a function that takes model response text and returns {result, adapterCalled}
    // or executeTool called with verb='read_file' and path=null (from a null parseToolMarker result)
    // We test that when processModelOutput is given a malformed marker, it returns the notification
    var result = m.processModelOutput('<TOOL:read_file>', '/tmp/repo', {});
    assert.ok(!adapterCalled, 'tool adapter must NOT be called for malformed marker');
    assert.ok(typeof result === 'string', 'processModelOutput must return a string');
    assert.ok(result.indexOf('No tool executed') >= 0, 'notification must contain "No tool executed"');
    assert.ok(result.indexOf('marker format not recognised') >= 0 || result.indexOf('not recognised') >= 0, 'notification must mention unrecognised format');
  });
});

// ---------------------------------------------------------------------------
// T3.8 — unknown verb write_file rejected with notification listing available tools (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.8: unknown verb write_file rejected with available tools list (AC4)', function() {
    var repoRoot = mkTmp('T3.8-repo');
    var m = freshRequire(EXECUTOR_PATH);
    var adapterCalled = false;
    m.setToolExecutor(function() { adapterCalled = true; return 'content'; });
    var result = m.executeTool('write_file', 'output.md', repoRoot, {});
    assert.ok(!adapterCalled, 'tool adapter must NOT be called for unknown verb');
    assert.ok(result.indexOf('Tool not available: write_file') >= 0, 'result must contain "Tool not available: write_file"');
    assert.ok(result.indexOf('read_file') >= 0, 'result must list available tool read_file');
    assert.ok(result.indexOf('list_dir') >= 0, 'result must list available tool list_dir');
  });
});

// ---------------------------------------------------------------------------
// T3.9 — unknown verb run_script rejected (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.9: unknown verb run_script rejected (AC4)', function() {
    var repoRoot = mkTmp('T3.9-repo');
    var m = freshRequire(EXECUTOR_PATH);
    var adapterCalled = false;
    m.setToolExecutor(function() { adapterCalled = true; return 'content'; });
    var result = m.executeTool('run_script', 'scripts/foo.js', repoRoot, {});
    assert.ok(!adapterCalled, 'tool adapter must NOT be called for run_script');
    assert.ok(result.indexOf('Tool not available: run_script') >= 0, 'result must contain "Tool not available: run_script"');
  });
});

// ---------------------------------------------------------------------------
// T3.10 — tool execution appends log entry with all required fields (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.10: executeTool appends log entry with sessionId, skillName, toolVerb, pathRequested, turnNumber, timestamp (AC5)', function() {
    var repoRoot = mkTmp('T3.10-repo');
    writeFile(repoRoot, 'workspace/state.json', '{}');
    var m = freshRequire(EXECUTOR_PATH);
    m.clearToolLog();
    m.setToolExecutor(function(verb, resolvedPath) { return fs.readFileSync(resolvedPath, 'utf8'); });
    var sessionCtx = { sessionId: 'sess-1', skillName: '/workflow', turnNumber: 2 };
    m.executeTool('read_file', 'workspace/state.json', repoRoot, sessionCtx);
    var log = m.getToolLog();
    assert.ok(Array.isArray(log), 'getToolLog must return an array');
    assert.strictEqual(log.length, 1, 'log must have exactly one entry');
    var entry = log[0];
    assert.strictEqual(entry.sessionId, 'sess-1', 'log entry must have sessionId');
    assert.strictEqual(entry.skillName, '/workflow', 'log entry must have skillName');
    assert.strictEqual(entry.toolVerb, 'read_file', 'log entry must have toolVerb');
    assert.strictEqual(entry.pathRequested, 'workspace/state.json', 'log entry must have pathRequested');
    assert.strictEqual(entry.turnNumber, 2, 'log entry must have turnNumber');
    assert.ok(typeof entry.timestamp === 'string' && entry.timestamp.length > 0, 'log entry must have non-empty timestamp string');
  });
});

// ---------------------------------------------------------------------------
// T3.11 — list_dir execution also produces log entry with toolVerb (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.11: list_dir execution produces log entry with toolVerb=list_dir (AC5)', function() {
    var repoRoot = mkTmp('T3.11-repo');
    fs.mkdirSync(path.join(repoRoot, 'artefacts'), { recursive: true });
    var m = freshRequire(EXECUTOR_PATH);
    m.clearToolLog();
    m.setToolExecutor(function(verb, resolvedPath) { return fs.readdirSync(resolvedPath).join('\n'); });
    var sessionCtx = { sessionId: 'sess-2', skillName: '/trace', turnNumber: 1 };
    m.executeTool('list_dir', 'artefacts/', repoRoot, sessionCtx);
    var log = m.getToolLog();
    assert.ok(log.length >= 1, 'log must have at least one entry');
    assert.strictEqual(log[0].toolVerb, 'list_dir', 'toolVerb must be list_dir');
    assert.ok(typeof log[0].timestamp === 'string' && /\d{4}/.test(log[0].timestamp), 'timestamp must look like an ISO date string');
  });
});

// ---------------------------------------------------------------------------
// T3.12 — buildSystemPrompt contains read_file marker instruction (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.12: buildSystemPrompt output contains read_file marker format (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.ok(typeof routes.buildSystemPrompt === 'function', 'buildSystemPrompt must be exported from journey.js');
    var prompt = routes.buildSystemPrompt({ skillName: '/workflow', repoRoot: '/tmp/repo' });
    assert.ok(typeof prompt === 'string' && prompt.length > 0, 'buildSystemPrompt must return a non-empty string');
    assert.ok(prompt.indexOf('<TOOL:read_file path="') >= 0, 'system prompt must contain <TOOL:read_file path="... instruction text');
  });
});

// ---------------------------------------------------------------------------
// T3.13 — buildSystemPrompt contains list_dir marker instruction (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.13: buildSystemPrompt output contains list_dir marker format (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var prompt = routes.buildSystemPrompt({ skillName: '/trace', repoRoot: '/tmp/repo' });
    assert.ok(prompt.indexOf('<TOOL:list_dir path="') >= 0, 'system prompt must contain <TOOL:list_dir path="... instruction text');
  });
});

// ---------------------------------------------------------------------------
// T3.14 — buildSystemPrompt instructs relative paths from repo root (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.14: buildSystemPrompt contains relative path instruction (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var prompt = routes.buildSystemPrompt({ skillName: '/improve', repoRoot: '/tmp/repo' });
    assert.ok(prompt.toLowerCase().indexOf('relative') >= 0, 'system prompt must mention relative paths');
  });
});

// ---------------------------------------------------------------------------
// T3.15 — executeTool before setToolExecutor throws stub error (AC7)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.15: calling executeTool before setToolExecutor throws "Adapter not wired: toolExecutor" (AC7)', function() {
    var m = freshRequire(EXECUTOR_PATH);
    // Do NOT call setToolExecutor — test the unwired stub
    var threw = false;
    var errMsg = '';
    try {
      m.executeTool('read_file', 'workspace/state.json', '/tmp/repo', {});
    } catch (err) {
      threw = true;
      errMsg = err.message || '';
    }
    assert.ok(threw, 'executeTool must throw when adapter is not wired');
    assert.ok(errMsg.indexOf('Adapter not wired') >= 0, 'error message must contain "Adapter not wired"');
    assert.ok(errMsg.indexOf('toolExecutor') >= 0, 'error message must name the adapter: toolExecutor');
  });
});

// ---------------------------------------------------------------------------
// T3.16 — setToolExecutor is exported from tool-executor.js (AC7)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.16: setToolExecutor is exported from tool-executor.js (AC7)', function() {
    var m = freshRequire(EXECUTOR_PATH);
    assert.ok(typeof m.setToolExecutor === 'function', 'setToolExecutor must be a function in the module exports');
  });
});

// ---------------------------------------------------------------------------
// T3.17 — after setToolExecutor, executeTool calls the provided mock (AC7)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.17: after setToolExecutor, executeTool calls the provided mock without throwing (AC7)', function() {
    var repoRoot = mkTmp('T3.17-repo');
    writeFile(repoRoot, 'workspace/state.json', '{"ok":true}');
    var m = freshRequire(EXECUTOR_PATH);
    var mockCalled = false;
    m.setToolExecutor(function(verb, resolvedPath) {
      mockCalled = true;
      return fs.readFileSync(resolvedPath, 'utf8');
    });
    var result = m.executeTool('read_file', 'workspace/state.json', repoRoot, {});
    assert.ok(mockCalled, 'mock adapter must have been called after setToolExecutor');
    assert.ok(result.indexOf('{"ok":true}') >= 0, 'result must contain mock file content');
  });
});

// ---------------------------------------------------------------------------
// T3.18 — relative traversal path ../../../etc/passwd rejected, no file read (AC8)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.18: relative traversal path ../../../etc/passwd rejected, adapter not called (AC8)', function() {
    var repoRoot = mkTmp('T3.18-repo');
    var m = freshRequire(EXECUTOR_PATH);
    var adapterCalled = false;
    m.setToolExecutor(function() { adapterCalled = true; return 'content'; });
    var result = m.executeTool('read_file', '../../../etc/passwd', repoRoot, {});
    assert.ok(!adapterCalled, 'tool adapter must NOT be called for traversal path');
    assert.ok(typeof result === 'string' && result.length > 0, 'result must be a non-empty error string');
    assert.ok(
      result.indexOf('out of bounds') >= 0 || result.indexOf('path not allowed') >= 0 || result.indexOf('not permitted') >= 0,
      'result must indicate the path was rejected: ' + result
    );
  });
});

// ---------------------------------------------------------------------------
// T3.19 — absolute path /etc/passwd outside repoRoot rejected, no file read (AC8)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.19: absolute path /etc/passwd outside repoRoot rejected, adapter not called (AC8)', function() {
    var repoRoot = mkTmp('T3.19-repo');
    var m = freshRequire(EXECUTOR_PATH);
    var adapterCalled = false;
    m.setToolExecutor(function() { adapterCalled = true; return 'content'; });
    var result = m.executeTool('read_file', '/etc/passwd', repoRoot, {});
    assert.ok(!adapterCalled, 'tool adapter must NOT be called for absolute path outside repo');
    assert.ok(typeof result === 'string' && result.length > 0, 'result must be a non-empty error string');
    assert.ok(
      result.indexOf('out of bounds') >= 0 || result.indexOf('path not allowed') >= 0 || result.indexOf('not permitted') >= 0,
      'result must indicate the path was rejected: ' + result
    );
  });
});

// ---------------------------------------------------------------------------
// T3.20 — path resolving to repoRoot itself (dot) is rejected (AC8)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.20: path "." resolves to repoRoot itself, fails startsWith(repoRoot+sep) check (AC8)', function() {
    var repoRoot = mkTmp('T3.20-repo');
    var m = freshRequire(EXECUTOR_PATH);
    var adapterCalled = false;
    m.setToolExecutor(function() { adapterCalled = true; return 'content'; });
    var result = m.executeTool('read_file', '.', repoRoot, {});
    assert.ok(!adapterCalled, 'tool adapter must NOT be called when path resolves to repoRoot (not a child)');
    assert.ok(typeof result === 'string' && result.length > 0, 'result must be a non-empty error string');
  });
});

// ---------------------------------------------------------------------------
// T3.21 — read_file for nonexistent file returns [File not found: ...] (AC9)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T3.21: read_file for nonexistent file returns "[File not found: workspace/state.json]", no throw (AC9)', function() {
    var repoRoot = mkTmp('T3.21-repo');
    // Intentionally do NOT create workspace/state.json
    var m = freshRequire(EXECUTOR_PATH);
    m.setToolExecutor(function(verb, resolvedPath) {
      // Real fs adapter — will throw ENOENT
      return fs.readFileSync(resolvedPath, 'utf8');
    });
    var threwOuter = false;
    var result;
    try {
      result = m.executeTool('read_file', 'workspace/state.json', repoRoot, {});
    } catch (_) {
      threwOuter = true;
    }
    assert.ok(!threwOuter, 'executeTool must not throw when file not found — must catch and return message');
    assert.ok(typeof result === 'string', 'result must be a string');
    assert.ok(result.indexOf('[File not found: workspace/state.json]') >= 0, 'result must equal "[File not found: workspace/state.json]", got: ' + result);
  });
});

// ---------------------------------------------------------------------------
// Run all tests in sequence
// ---------------------------------------------------------------------------
console.log('\n[wucp3-tool-executor] Running wucp.3 tool execution loop tests...\n');

queue.reduce(function(p, fn) { return p.then(function() { return fn(); }); }, Promise.resolve());
