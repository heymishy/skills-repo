'use strict';
// check-wucp1-context-autoloader.js
// Tests for wucp.1 — Pipeline context auto-loader at session start
// All tests are written to FAIL until the implementation is complete (TDD).
// See test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.1-test-plan.md

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

var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var tmpBase = path.join(os.tmpdir(), 'wucp1-test-' + Date.now());

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

// Clean up on process exit
process.on('exit', function() {
  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}
});

var queue = [];

// ---------------------------------------------------------------------------
// T1.1 — pipeline-state.json content appears in assembled prompt (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.1: pipeline-state.json content appears in prompt (AC1)', function() {
    var routes = freshRequire(SKILLS_PATH);
    assert.strictEqual(typeof routes.buildSystemPrompt, 'function', 'buildSystemPrompt must be exported');
    var repoRoot = mkTmp('t1-1');
    var pipelineState = { features: [{ slug: 'test-feature-t11', stage: 'definition' }] };
    writeFile(repoRoot, 'pipeline-state.json', JSON.stringify(pipelineState));
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(typeof result === 'string' && result.length > 0, 'buildSystemPrompt must return a non-empty string');
    assert.ok(result.includes('pipeline-state.json'), 'prompt must contain "pipeline-state.json" label');
    assert.ok(result.includes('test-feature-t11'), 'prompt must contain pipeline-state.json content');
  });
});

// ---------------------------------------------------------------------------
// T1.2 — workspace/state.json content appears in assembled prompt (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.2: workspace/state.json content appears in prompt (AC1)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-2');
    var stateContent = { currentPhase: 'test-plan-t12-unique' };
    writeFile(repoRoot, 'workspace/state.json', JSON.stringify(stateContent));
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(result.includes('workspace/state.json'), 'prompt must contain "workspace/state.json" label');
    assert.ok(result.includes('test-plan-t12-unique'), 'prompt must contain workspace/state.json content');
  });
});

// ---------------------------------------------------------------------------
// T1.3 — context.yml content appears in assembled prompt (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.3: context.yml content appears in prompt (AC1)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-3');
    var ctxContent = 'instrumentation:\n  enabled: false\n  label: t13-unique-label\n';
    writeFile(repoRoot, 'context.yml', ctxContent);
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(result.includes('context.yml'), 'prompt must contain "context.yml" label');
    assert.ok(result.includes('t13-unique-label'), 'prompt must contain context.yml content');
  });
});

// ---------------------------------------------------------------------------
// T1.4 — All three AC1 files labelled with their filenames (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.4: All three AC1 files labelled with filenames (AC1)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-4');
    writeFile(repoRoot, 'pipeline-state.json', '{"features":[]}');
    writeFile(repoRoot, 'workspace/state.json', '{"currentPhase":"definition"}');
    writeFile(repoRoot, 'context.yml', 'instrumentation:\n  enabled: false\n');
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    var pIdx = result.indexOf('pipeline-state.json');
    var wIdx = result.indexOf('workspace/state.json');
    var cIdx = result.indexOf('context.yml');
    assert.ok(pIdx >= 0, 'pipeline-state.json label must appear in prompt');
    assert.ok(wIdx >= 0, 'workspace/state.json label must appear in prompt');
    assert.ok(cIdx >= 0, 'context.yml label must appear in prompt');
    // Each label should precede its content
    var pContent = result.indexOf('"features"', pIdx);
    assert.ok(pContent > pIdx, 'pipeline-state.json content must follow label');
  });
});

// ---------------------------------------------------------------------------
// T1.5 — Missing pipeline-state.json skipped silently (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.5: Missing pipeline-state.json skipped silently (AC2)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-5');
    // Only write workspace/state.json and context.yml — no pipeline-state.json
    writeFile(repoRoot, 'workspace/state.json', '{"currentPhase":"definition"}');
    writeFile(repoRoot, 'context.yml', 'instrumentation:\n  enabled: false\n');
    var threw = false;
    var result;
    try {
      result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'buildSystemPrompt must not throw when pipeline-state.json is missing');
    assert.ok(typeof result === 'string', 'must return a string even with missing file');
    // pipeline-state.json label should NOT appear (file absent)
    assert.ok(!result.includes('"features"'), 'pipeline-state content must not appear when file absent');
  });
});

// ---------------------------------------------------------------------------
// T1.6 — Missing workspace/state.json skipped silently (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.6: Missing workspace/state.json skipped silently (AC2)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-6');
    writeFile(repoRoot, 'pipeline-state.json', '{"features":[]}');
    writeFile(repoRoot, 'context.yml', 'instrumentation:\n  enabled: false\n');
    var threw = false;
    try {
      routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'buildSystemPrompt must not throw when workspace/state.json is missing');
  });
});

// ---------------------------------------------------------------------------
// T1.7 — Missing context.yml skipped silently (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.7: Missing context.yml skipped silently (AC2)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-7');
    writeFile(repoRoot, 'pipeline-state.json', '{"features":[]}');
    writeFile(repoRoot, 'workspace/state.json', '{"currentPhase":"definition"}');
    var threw = false;
    try {
      routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'buildSystemPrompt must not throw when context.yml is missing');
  });
});

// ---------------------------------------------------------------------------
// T1.8 — Artefact listing scoped to activeFeatureSlug (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.8: Artefact listing scoped to activeFeatureSlug (AC3)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-8');
    writeFile(repoRoot, 'pipeline-state.json', '{"features":[{"slug":"my-feature-t18","stage":"definition"}]}');
    writeFile(repoRoot, 'artefacts/my-feature-t18/discovery.md', '# discovery');
    writeFile(repoRoot, 'artefacts/my-feature-t18/stories/story1.md', '# story');
    writeFile(repoRoot, 'artefacts/other-feature-t18/discovery.md', '# other discovery');
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], { activeFeatureSlug: 'my-feature-t18' });
    assert.ok(result.includes('discovery.md') || result.includes('my-feature-t18'), 'prompt must include artefact listing for active feature');
    assert.ok(!result.includes('other-feature-t18'), 'prompt must NOT include artefacts from other features');
  });
});

// ---------------------------------------------------------------------------
// T1.9 — No artefact listing when activeFeatureSlug is absent (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.9: No artefact listing when activeFeatureSlug is absent (AC3)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-9');
    writeFile(repoRoot, 'pipeline-state.json', '{"features":[]}');
    writeFile(repoRoot, 'artefacts/some-feature/discovery.md', '# discovery');
    var threw = false;
    var result;
    try {
      result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'must not throw without activeFeatureSlug');
    // No specific feature's artefact listing should appear
    assert.ok(!result.includes('some-feature') || !result.includes('Artefact listing'), 'artefact listing block must not appear when no activeFeatureSlug');
  });
});

// ---------------------------------------------------------------------------
// T1.10 — First 50 lines of workspace/learnings.md included (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.10: First 50 lines of learnings.md included; lines 51+ excluded (AC4)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-10');
    var lines = [];
    for (var i = 1; i <= 60; i++) { lines.push('Learning line ' + i + ' unique-t110'); }
    writeFile(repoRoot, 'workspace/learnings.md', lines.join('\n'));
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(result.includes('Learning line 50 unique-t110'), 'line 50 must appear in prompt');
    assert.ok(!result.includes('Learning line 51 unique-t110'), 'line 51 must NOT appear in prompt (truncated at 50)');
  });
});

// ---------------------------------------------------------------------------
// T1.11 — Full file when shorter than 50 lines (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.11: Full learnings.md included when shorter than 50 lines (AC4)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-11');
    var lines = [];
    for (var i = 1; i <= 10; i++) { lines.push('Short learning ' + i + ' unique-t111'); }
    writeFile(repoRoot, 'workspace/learnings.md', lines.join('\n'));
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(result.includes('Short learning 10 unique-t111'), 'all 10 lines must appear in prompt');
  });
});

// ---------------------------------------------------------------------------
// T1.12 — Missing workspace/learnings.md skipped silently (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.12: Missing workspace/learnings.md skipped silently (AC4)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-12');
    // No learnings.md written
    var threw = false;
    try {
      routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'must not throw when workspace/learnings.md is missing');
  });
});

// ---------------------------------------------------------------------------
// T1.13 — fleet-state.json included when present (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.13: fleet-state.json included when present (AC6)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-13');
    var fleetContent = { squads: [{ name: 'squad-alpha-t113' }] };
    writeFile(repoRoot, 'fleet-state.json', JSON.stringify(fleetContent));
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(result.includes('fleet-state.json'), 'prompt must contain fleet-state.json label');
    assert.ok(result.includes('squad-alpha-t113'), 'prompt must contain fleet-state.json content');
  });
});

// ---------------------------------------------------------------------------
// T1.14 — artefact-coverage-exemptions.json included when present (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.14: artefact-coverage-exemptions.json included when present (AC6)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-14');
    var exemptContent = { exemptions: [{ slug: 'exempt-t114', reason: 'spike' }] };
    writeFile(repoRoot, 'artefact-coverage-exemptions.json', JSON.stringify(exemptContent));
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    assert.ok(result.includes('artefact-coverage-exemptions.json'), 'prompt must contain artefact-coverage-exemptions.json label');
    assert.ok(result.includes('exempt-t114'), 'prompt must contain exemptions content');
  });
});

// ---------------------------------------------------------------------------
// T1.15 — fleet-state.json and artefact-coverage-exemptions.json absent → silently skipped (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.15: fleet-state.json and artefact-coverage-exemptions.json absent silently skipped (AC6)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-15');
    // Neither file written
    var threw = false;
    try {
      routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    } catch (e) {
      threw = true;
    }
    assert.ok(!threw, 'must not throw when fleet-state.json and artefact-coverage-exemptions.json are absent');
  });
});

// ---------------------------------------------------------------------------
// T1.16 — AC5 merge gate: context-yml-schema-inspection.md must exist
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.16: AC5 merge gate — context-yml-schema-inspection.md exists', function() {
    var inspectionPath = path.resolve(__dirname, '../artefacts/archived/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md');
    assert.ok(
      fs.existsSync(inspectionPath),
      'AC5 merge gate FAILED: context-yml-schema-inspection.md does not exist at ' + inspectionPath + '. ' +
      'This story must not be merged until the schema inspection is complete and this file is present.'
    );
  });
});

// ---------------------------------------------------------------------------
// T1.17 — Integration: all AC1–AC6 files produce a non-empty prompt with correct labels
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.17: Integration — all context files produce labelled prompt (AC1–AC6)', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-17');
    writeFile(repoRoot, 'pipeline-state.json', '{"features":[{"slug":"int-feature-t117","stage":"definition"}]}');
    writeFile(repoRoot, 'workspace/state.json', '{"currentPhase":"definition"}');
    writeFile(repoRoot, 'context.yml', 'instrumentation:\n  enabled: false\n');
    var learningsLines = [];
    for (var i = 1; i <= 60; i++) { learningsLines.push('Line ' + i); }
    writeFile(repoRoot, 'workspace/learnings.md', learningsLines.join('\n'));
    writeFile(repoRoot, 'fleet-state.json', '{"squads":[]}');
    writeFile(repoRoot, 'artefact-coverage-exemptions.json', '{"exemptions":[]}');
    writeFile(repoRoot, 'artefacts/int-feature-t117/discovery.md', '# disc');
    var result = routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], { activeFeatureSlug: 'int-feature-t117' });
    assert.ok(result && result.length > 0, 'must return non-empty string');
    assert.ok(result.includes('pipeline-state.json'), 'must include pipeline-state.json label');
    assert.ok(result.includes('workspace/state.json'), 'must include workspace/state.json label');
    assert.ok(result.includes('context.yml'), 'must include context.yml label');
    assert.ok(result.includes('fleet-state.json'), 'must include fleet-state.json label');
    assert.ok(result.includes('artefact-coverage-exemptions.json'), 'must include exemptions label');
    // learnings capped at 50 lines
    assert.ok(result.includes('Line 50'), 'line 50 must be included');
    assert.ok(!result.includes('Line 51'), 'line 51 must be excluded (truncation at 50)');
  });
});

// ---------------------------------------------------------------------------
// T1.18 — NFR security: no credential values in prompt
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.18: NFR security — no credential values in assembled prompt', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = path.resolve(__dirname, '..');
    if (!fs.existsSync(path.join(repoRoot, 'context.yml'))) {
      console.log('  SKIP: T1.18 skipped — context.yml not found at repo root (pre-implementation)');
      passed++;
      return;
    }
    var result = routes.buildSystemPrompt('discovery', path.join(os.tmpdir(), 'sec-sess'), repoRoot, [], {});
    // Look for patterns that suggest a raw credential value (not a reference name like "secretRef: my-token-name")
    var credentialValuePattern = /(?:token|password|api_key|secret)\s*:\s*["']?[A-Za-z0-9+\/]{20,}/i;
    var match = result.match(credentialValuePattern);
    assert.ok(!match, 'Prompt must not contain raw credential values. Found: ' + (match && match[0]));
  });
});

// ---------------------------------------------------------------------------
// T1.19 — NFR performance: assembly under 500ms for 30-feature repo
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T1.19: NFR performance — prompt assembly < 500ms for 30-feature repo', function() {
    var routes = freshRequire(SKILLS_PATH);
    var repoRoot = mkTmp('t1-19');
    // 30-feature pipeline-state.json
    var features = [];
    for (var i = 0; i < 30; i++) { features.push({ slug: 'feature-' + i, stage: 'definition', health: 'green' }); }
    writeFile(repoRoot, 'pipeline-state.json', JSON.stringify({ features: features }));
    writeFile(repoRoot, 'workspace/state.json', '{"currentPhase":"definition"}');
    writeFile(repoRoot, 'context.yml', 'instrumentation:\n  enabled: false\n');
    // 500-line learnings.md
    var learnings = [];
    for (var j = 1; j <= 500; j++) { learnings.push('Learning entry ' + j); }
    writeFile(repoRoot, 'workspace/learnings.md', learnings.join('\n'));
    var start = Date.now();
    routes.buildSystemPrompt('discovery', path.join(repoRoot, 'sess'), repoRoot, [], {});
    var elapsed = Date.now() - start;
    assert.ok(elapsed < 500, 'buildSystemPrompt must complete in < 500ms for 30 features; took ' + elapsed + 'ms');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
console.log('\n--- wucp.1: Pipeline context auto-loader tests ---\n');
queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n=== wucp1 results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + '\n       ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
});
