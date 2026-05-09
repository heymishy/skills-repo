'use strict';
// check-wucp2-slash-command-router.js
// Tests for wucp.2 — Slash command router for freeform skill invocation
// All tests are written to FAIL until the implementation is complete (TDD).
// See test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.2-test-plan.md

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

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var tmpBase = path.join(os.tmpdir(), 'wucp2-test-' + Date.now());

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

function mockRes() {
  var res = { statusCode: 200, body: null, headers: {} };
  res.status = function(code) { res.statusCode = code; return res; };
  res.json = function(data) { res.body = data; return res; };
  res.send = function(data) { res.body = data; return res; };
  res.writeHead = function(code, hdrs) { res.statusCode = code; if (hdrs) Object.assign(res.headers, hdrs); return res; };
  res.end = function(data) { res.body = data; return res; };
  return res;
}

process.on('exit', function() {
  try { fs.rmSync(tmpBase, { recursive: true, force: true }); } catch (_) {}
});

var queue = [];

// ---------------------------------------------------------------------------
// T2.1 — SLASH_CAPABILITY_MAP exported from journey.js (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.1: SLASH_CAPABILITY_MAP exported from journey.js (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.ok(routes.SLASH_CAPABILITY_MAP !== undefined, 'SLASH_CAPABILITY_MAP must be exported');
    assert.strictEqual(typeof routes.SLASH_CAPABILITY_MAP, 'object', 'SLASH_CAPABILITY_MAP must be an object');
    assert.ok(routes.SLASH_CAPABILITY_MAP !== null, 'SLASH_CAPABILITY_MAP must not be null');
  });
});

// ---------------------------------------------------------------------------
// T2.2 — SLASH_CAPABILITY_MAP has expected surface-limited skills flagged (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.2: SLASH_CAPABILITY_MAP flags surface-limited skills (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var map = routes.SLASH_CAPABILITY_MAP;
    assert.ok(map !== undefined, 'SLASH_CAPABILITY_MAP must be exported');
    // branch-setup and branch-complete require git worktree — must be flagged
    if (map['branch-setup']) {
      assert.ok(map['branch-setup'].limitedOnWebUI === true || map['branch-setup'].capabilities !== undefined,
        'branch-setup must be marked as surface-limited on web UI');
    }
    if (map['branch-complete']) {
      assert.ok(map['branch-complete'].limitedOnWebUI === true || map['branch-complete'].capabilities !== undefined,
        'branch-complete must be marked as surface-limited on web UI');
    }
  });
});

// ---------------------------------------------------------------------------
// T2.3 — getAvailableSkills returns skills discovered from .github/skills/ (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.3: getAvailableSkills returns skills from .github/skills/ directory (AC2)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.getAvailableSkills, 'function', 'getAvailableSkills must be exported');
    var repoRoot = mkTmp('t2-3');
    writeFile(repoRoot, '.github/skills/alpha-skill/SKILL.md', '# Alpha skill content t23unique');
    writeFile(repoRoot, '.github/skills/beta-skill/SKILL.md', '# Beta skill content t23unique');
    routes.setRepoRoot(repoRoot);
    var skills = routes.getAvailableSkills(repoRoot);
    assert.ok(Array.isArray(skills), 'getAvailableSkills must return an array');
    assert.ok(skills.includes('alpha-skill'), 'alpha-skill must be in the list');
    assert.ok(skills.includes('beta-skill'), 'beta-skill must be in the list');
  });
});

// ---------------------------------------------------------------------------
// T2.4 — getAvailableSkills discovers new skill without server restart (AC2)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.4: getAvailableSkills discovers new skill added to .github/skills/ dynamically (AC2)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-4');
    writeFile(repoRoot, '.github/skills/existing-skill/SKILL.md', '# Existing');
    routes.setRepoRoot(repoRoot);
    var before = routes.getAvailableSkills(repoRoot);
    assert.ok(!before.includes('new-dynamic-skill'), 'new-dynamic-skill must not exist yet');
    // Add new skill (simulates operator adding it at runtime)
    writeFile(repoRoot, '.github/skills/new-dynamic-skill/SKILL.md', '# New dynamic skill');
    var after = routes.getAvailableSkills(repoRoot);
    assert.ok(after.includes('new-dynamic-skill'), 'new-dynamic-skill must appear in list after being added');
  });
});

// ---------------------------------------------------------------------------
// T2.5 — validateSlashSkillName accepts a valid skill name (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.5: validateSlashSkillName accepts a valid skill name (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.validateSlashSkillName, 'function', 'validateSlashSkillName must be exported');
    var repoRoot = mkTmp('t2-5');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow');
    routes.setRepoRoot(repoRoot);
    var result = routes.validateSlashSkillName('workflow', repoRoot);
    assert.ok(result === true || result === 'workflow', 'validateSlashSkillName must accept valid skill name');
  });
});

// ---------------------------------------------------------------------------
// T2.6 — validateSlashSkillName rejects path injection (AC6)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.6: validateSlashSkillName rejects path traversal injection (AC6)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-6');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow');
    routes.setRepoRoot(repoRoot);
    var injections = ['../../../etc/passwd', '..\\..\\..\\windows\\system32', '/etc/passwd', 'workflow/../../sensitive'];
    injections.forEach(function(inj) {
      var result = routes.validateSlashSkillName(inj, repoRoot);
      assert.ok(result === false || result === null || (typeof result === 'string' && result.includes('invalid')),
        'validateSlashSkillName must reject injection "' + inj + '", got: ' + result);
    });
  });
});

// ---------------------------------------------------------------------------
// T2.7 — buildSlashCommandPrompt returns SKILL.md content (AC1)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.7: buildSlashCommandPrompt returns SKILL.md content for known skill (AC1)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.buildSlashCommandPrompt, 'function', 'buildSlashCommandPrompt must be exported');
    var repoRoot = mkTmp('t2-7');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow skill UNIQUE-T27\nInstructions here.');
    routes.setRepoRoot(repoRoot);
    var result = routes.buildSlashCommandPrompt('workflow', repoRoot);
    assert.ok(typeof result === 'string' && result.length > 0, 'buildSlashCommandPrompt must return a non-empty string');
    assert.ok(result.includes('UNIQUE-T27'), 'prompt must contain the SKILL.md content');
  });
});

// ---------------------------------------------------------------------------
// T2.8 — buildSlashCommandPrompt includes capability notice for surface-limited skills (AC3)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.8: buildSlashCommandPrompt includes capability notice for surface-limited skill (AC3)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-8');
    writeFile(repoRoot, '.github/skills/branch-setup/SKILL.md', '# Branch setup');
    routes.setRepoRoot(repoRoot);
    var result = routes.buildSlashCommandPrompt('branch-setup', repoRoot);
    // branch-setup requires git worktree — must include capability notice
    var hasNotice = result.toLowerCase().includes('note') ||
      result.toLowerCase().includes('limited') ||
      result.toLowerCase().includes('worktree') ||
      result.toLowerCase().includes('capability');
    assert.ok(hasNotice, 'buildSlashCommandPrompt must include capability notice for surface-limited skill branch-setup');
  });
});

// ---------------------------------------------------------------------------
// T2.9 — applySlashCommand sets slash command on session (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.9: applySlashCommand sets active slash command on session (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.applySlashCommand, 'function', 'applySlashCommand must be exported');
    var session = { accessToken: 'tok', stageIndex: 3 };
    routes.applySlashCommand(session, 'workflow');
    assert.strictEqual(session.activeSlashCommand, 'workflow', 'session.activeSlashCommand must be set to "workflow"');
  });
});

// ---------------------------------------------------------------------------
// T2.10 — applySlashCommand does NOT change stageIndex (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.10: applySlashCommand does NOT change session.stageIndex (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var session = { accessToken: 'tok', stageIndex: 3 };
    routes.applySlashCommand(session, 'workflow');
    assert.strictEqual(session.stageIndex, 3, 'stageIndex must remain 3 after applySlashCommand');
  });
});

// ---------------------------------------------------------------------------
// T2.11 — clearSlashCommand removes slash command from session (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.11: clearSlashCommand removes activeSlashCommand from session (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.clearSlashCommand, 'function', 'clearSlashCommand must be exported');
    var session = { accessToken: 'tok', stageIndex: 3, activeSlashCommand: 'workflow' };
    routes.clearSlashCommand(session);
    assert.ok(!session.activeSlashCommand, 'activeSlashCommand must be cleared');
  });
});

// ---------------------------------------------------------------------------
// T2.12 — clearSlashCommand does NOT change stageIndex (AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.12: clearSlashCommand does NOT change session.stageIndex (AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var session = { accessToken: 'tok', stageIndex: 3, activeSlashCommand: 'workflow' };
    routes.clearSlashCommand(session);
    assert.strictEqual(session.stageIndex, 3, 'stageIndex must remain 3 after clearSlashCommand');
  });
});

// ---------------------------------------------------------------------------
// T2.13 — Slash command handler returns 400 for unknown skill (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.13: handleSlashCommand returns 400 for unknown skill name (AC5)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    assert.strictEqual(typeof routes.handleSlashCommand, 'function', 'handleSlashCommand must be exported');
    var repoRoot = mkTmp('t2-13');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow');
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok', stageIndex: 2 }, body: { skillName: 'unknownskill999' } };
    var res = mockRes();
    routes.handleSlashCommand(req, res);
    assert.strictEqual(res.statusCode, 400, 'status must be 400 for unknown skill');
  });
});

// ---------------------------------------------------------------------------
// T2.14 — Slash command handler 400 response includes helpful available-skills list (AC5)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.14: handleSlashCommand 400 response includes list of available skills (AC5)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-14');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow');
    writeFile(repoRoot, '.github/skills/discovery/SKILL.md', '# Discovery');
    routes.setRepoRoot(repoRoot);
    var req = { session: { accessToken: 'tok', stageIndex: 2 }, body: { skillName: 'typo-skill' } };
    var res = mockRes();
    routes.handleSlashCommand(req, res);
    var bodyStr = JSON.stringify(res.body || '');
    var hasWorkflow = bodyStr.includes('workflow');
    var hasDiscovery = bodyStr.includes('discovery');
    assert.ok(hasWorkflow || hasDiscovery, '400 response body must list available skills: ' + bodyStr);
  });
});

// ---------------------------------------------------------------------------
// T2.15 — Slash command handler returns 400 for path injection (AC6 + NFR security)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.15: handleSlashCommand returns 400 for path injection in skillName (AC6 + NFR security)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-15');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow');
    routes.setRepoRoot(repoRoot);
    var injections = ['../../../etc/passwd', '../workflow', 'workflow/../../../sensitive'];
    injections.forEach(function(inj) {
      var req = { session: { accessToken: 'tok', stageIndex: 2 }, body: { skillName: inj } };
      var res = mockRes();
      routes.handleSlashCommand(req, res);
      assert.strictEqual(res.statusCode, 400, 'status must be 400 for injection "' + inj + '"');
    });
  });
});

// ---------------------------------------------------------------------------
// T2.16 — Integration: full slash command POST flow (AC1 + AC4)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.16: Integration — POST slash command loads skill and preserves stageIndex (AC1 + AC4)', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-16');
    writeFile(repoRoot, '.github/skills/workflow/SKILL.md', '# Workflow UNIQUE-T216\nFull instructions.');
    routes.setRepoRoot(repoRoot);
    var session = { accessToken: 'tok', stageIndex: 4 };
    var req = { session: session, body: { skillName: 'workflow' } };
    var res = mockRes();
    routes.handleSlashCommand(req, res);
    // Should succeed (2xx)
    assert.ok(res.statusCode < 400, 'handleSlashCommand must succeed for valid skill; got ' + res.statusCode);
    // Session stageIndex must be preserved
    assert.strictEqual(session.stageIndex, 4, 'stageIndex must remain 4 after slash command');
    // Response must include SKILL.md content or skill context
    var bodyStr = JSON.stringify(res.body || '');
    assert.ok(bodyStr.includes('UNIQUE-T216') || (session.activeSlashCommand === 'workflow'),
      'slash command must load skill content or set activeSlashCommand on session');
  });
});

// ---------------------------------------------------------------------------
// T2.17 — NFR performance: skill file read under 100ms (NFR)
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('T2.17: NFR performance — skill file read under 100ms', function() {
    var routes = freshRequire(JOURNEY_PATH);
    var repoRoot = mkTmp('t2-17');
    // 50 skills with SKILL.md files
    for (var i = 0; i < 50; i++) {
      writeFile(repoRoot, '.github/skills/skill-' + i + '/SKILL.md', '# Skill ' + i + '\nContent here.\n'.repeat(100));
    }
    routes.setRepoRoot(repoRoot);
    var start = Date.now();
    routes.getAvailableSkills(repoRoot);
    routes.buildSlashCommandPrompt('skill-0', repoRoot);
    var elapsed = Date.now() - start;
    assert.ok(elapsed < 100, 'skill list + skill file read must complete in < 100ms; took ' + elapsed + 'ms');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
console.log('\n--- wucp.2: Slash command router tests ---\n');
queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n=== wucp2 results: ' + passed + ' passed, ' + failed + ' failed ===');
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + '\n       ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
});
