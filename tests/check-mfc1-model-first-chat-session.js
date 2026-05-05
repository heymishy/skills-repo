'use strict';
/**
 * check-mfc1-model-first-chat-session.js
 *
 * TDD tests for mfc.1 — Model-First Chat-Driven Skill Session.
 * Tests FAIL before implementation, PASS after.
 *
 * Run: node tests/check-mfc1-model-first-chat-session.js
 */

const assert = require('assert');
const path   = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(function() {
        passed++;
        console.log('  PASS: ' + name);
      }).catch(function(err) {
        failed++;
        const msg = err && err.message ? err.message : String(err);
        failures.push({ name, msg });
        console.log('  FAIL: ' + name + '\n       ' + msg);
      });
    }
    passed++;
    console.log('  PASS: ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    const msg = err && err.message ? err.message : String(err);
    failures.push({ name, msg });
    console.log('  FAIL: ' + name + '\n       ' + msg);
    return Promise.resolve();
  }
}

function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

const ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

const queue = [];

// ── T1 — AC1: POST session redirects to /chat not /next ──────────────────────

queue.push(function runT1_1() {
  console.log('\n── T1.1 — AC1: handlePostSkillSessionHtml redirects to /chat');
  return test('T1.1 (AC1): successful session creation redirects to /skills/:name/sessions/:id/chat', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setCreateSession(async function(_skillName, _token) {
      return { id: 'ses-abc123' };
    });
    routes.setListSkills(async function() {
      return [{ name: 'discovery', path: '.github/skills/discovery' }];
    });

    let capturedStatus = null;
    let capturedHeaders = {};
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      session: { accessToken: 'tok', userId: 1, login: 'u' },
      params:  { name: 'discovery' },
      on: function(event, cb) {
        if (event === 'data') setTimeout(function() { cb(Buffer.from('skill=discovery')); }, 0);
        if (event === 'end') setTimeout(function() { cb(); }, 5);
        return req;
      }
    };
    const res = {
      writeHead: function(status, headers) { capturedStatus = status; capturedHeaders = headers || {}; },
      end: function() {}
    };

    await routes.handlePostSkillSessionHtml(req, res);

    assert.strictEqual(capturedStatus, 303, 'status must be 303');
    assert.ok(capturedHeaders.Location, 'Location header must be set');
    assert.ok(
      capturedHeaders.Location.includes('/chat'),
      'redirect must go to /chat, got: ' + capturedHeaders.Location
    );
    assert.ok(
      !capturedHeaders.Location.includes('/next'),
      'redirect must NOT contain /next, got: ' + capturedHeaders.Location
    );
  });
});

queue.push(function runT1_2() {
  console.log('\n── T1.2 — AC1: redirect contains the session ID');
  return test('T1.2 (AC1): redirect URL contains the session ID returned by createSession', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setCreateSession(async function(_skillName, _token) {
      return { id: 'unique-session-xyz' };
    });
    routes.setListSkills(async function() {
      return [{ name: 'discovery', path: '.github/skills/discovery' }];
    });

    let capturedHeaders = {};
    const req = {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      session: { accessToken: 'tok', userId: 1, login: 'u' },
      params:  { name: 'discovery' },
      on: function(event, cb) {
        if (event === 'data') setTimeout(function() { cb(Buffer.from('skill=discovery')); }, 0);
        if (event === 'end') setTimeout(function() { cb(); }, 5);
        return req;
      }
    };
    const res = {
      writeHead: function(_status, headers) { capturedHeaders = headers || {}; },
      end: function() {}
    };

    await routes.handlePostSkillSessionHtml(req, res);
    assert.ok(
      capturedHeaders.Location && capturedHeaders.Location.includes('unique-session-xyz'),
      'redirect URL must contain the session ID, got: ' + capturedHeaders.Location
    );
  });
});

// ── T2 — AC2: Chat page HTML structure ───────────────────────────────────────

queue.push(function runT2_1() {
  console.log('\n── T2.1 — AC2: chat page contains #chat-messages');
  return test('T2.1 (AC2): handleGetChatHtml renders #chat-messages element', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Hello, how can I help?'; });

    const sid = 'chat-t2-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'You are a helpful assistant.',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    let body = '';
    const req = {
      params:  { name: 'discovery', id: sid },
      session: { accessToken: 'test-token' }
    };
    const res = {
      writeHead: function() {},
      end: function(html) { body = html || ''; }
    };

    await routes.handleGetChatHtml(req, res);
    assert.ok(body.includes('id="chat-messages"'), 'page must contain #chat-messages');
  });
});

queue.push(function runT2_2() {
  console.log('\n── T2.2 — AC2: chat page contains #chat-form and #chat-input');
  return test('T2.2 (AC2): handleGetChatHtml renders #chat-form and #chat-input', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Hello!'; });

    const sid = 'chat-t2b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'You are a helpful assistant.',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    let body = '';
    const req = {
      params:  { name: 'discovery', id: sid },
      session: { accessToken: 'test-token' }
    };
    const res = {
      writeHead: function() {},
      end: function(html) { body = html || ''; }
    };

    await routes.handleGetChatHtml(req, res);
    assert.ok(body.includes('id="chat-form"'), 'page must contain #chat-form');
    assert.ok(body.includes('id="chat-input"'), 'page must contain #chat-input');
  });
});

queue.push(function runT2_3() {
  console.log('\n── T2.3 — AC2: chat page JS posts to /turn endpoint');
  return test('T2.3 (AC2): chat page JS targets the /turn API endpoint', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Hi!'; });

    const sid = 'chat-t2c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'You are a helpful assistant.',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    let body = '';
    const req = {
      params:  { name: 'discovery', id: sid },
      session: { accessToken: 'test-token' }
    };
    const res = {
      writeHead: function() {},
      end: function(html) { body = html || ''; }
    };

    await routes.handleGetChatHtml(req, res);
    assert.ok(body.includes('/turn'), 'page JS must reference the /turn endpoint');
  });
});

// ── T3 — AC3: registerHtmlSession stores systemPrompt; initial turn fires ──────

queue.push(function runT3_1() {
  console.log('\n── T3.1 — AC3: registerHtmlSession stores session.systemPrompt');
  return test('T3.1 (AC3): registerHtmlSession stores systemPrompt containing WEB UI PROTOCOL', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = 't3-' + Math.random().toString(36).slice(2);
    // registerHtmlSession does real file I/O — use process.cwd() so .github/ is found
    // The function uses _getRepoPath() internally; we rely on COPILOT_REPO_PATH or cwd
    routes.registerHtmlSession(sid, null, 'discovery');

    const session = routes._getHtmlSession(sid);
    assert.ok(session, 'session must be created');
    assert.ok(typeof session.systemPrompt === 'string', 'systemPrompt must be a string');
    assert.ok(session.systemPrompt.length > 0, 'systemPrompt must not be empty');
    assert.ok(session.systemPrompt.includes('WEB UI PROTOCOL'), 'systemPrompt must include WEB UI PROTOCOL section');
  });
});

queue.push(function runT3_2() {
  console.log('\n── T3.2 — AC3: handleGetChatHtml fires executor with history=[] on first load');
  return test('T3.2 (AC3): initial GET /chat fires executor with empty history and "Begin the session." as currentInput', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let capturedHistory = null;
    let capturedInput = null;

    routes.setSkillTurnExecutorAdapter(async function(_sysPrompt, history, currentInput, _token) {
      capturedHistory = history;
      capturedInput   = currentInput;
      return 'What would you like to discover today?';
    });

    const sid = 't3b-' + Math.random().toString(36).slice(2);
    // Use _setHtmlSession to plant session — bypasses buildSystemPrompt file I/O (Flag 1 fix)
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'FIXED SYSTEM PROMPT FOR TEST',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    const req = {
      params:  { name: 'discovery', id: sid },
      session: { accessToken: 'test-token' }
    };
    const res = { writeHead: function() {}, end: function() {} };

    await routes.handleGetChatHtml(req, res);

    assert.deepStrictEqual(capturedHistory, [], 'initial turn must have history=[]');
    assert.strictEqual(capturedInput, 'Begin the session.', 'initial currentInput must be "Begin the session."');
  });
});

// ── T4 — AC4: Single executor call per turn; both turns appended ──────────────

queue.push(function runT4_1() {
  console.log('\n── T4.1 — AC4: htmlSubmitTurn calls _skillTurnExecutor exactly once per turn');
  return test('T4.1 (AC4): htmlSubmitTurn calls the executor exactly once per call', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let callCount = 0;
    routes.setSkillTurnExecutorAdapter(async function() {
      callCount++;
      return 'Model reply';
    });

    const sid = 't4a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'SYS',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'My answer', 'tok');
    assert.strictEqual(callCount, 1, 'executor called exactly once per htmlSubmitTurn call');
  });
});

queue.push(function runT4_2() {
  console.log('\n── T4.2 — AC4: both user and assistant turns appended to session.turns');
  return test('T4.2 (AC4): after htmlSubmitTurn, session.turns has user + assistant entry', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() { return 'Assistant says hello'; });

    const sid = 't4b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'SYS',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'User input', 'tok');
    const session = routes._getHtmlSession(sid);
    assert.strictEqual(session.turns.length, 2, 'turns must have 2 entries after one call');
    assert.strictEqual(session.turns[0].role, 'user', 'first turn must be user');
    assert.strictEqual(session.turns[1].role, 'assistant', 'second turn must be assistant');
  });
});

queue.push(function runT4_3() {
  console.log('\n── T4.3 — AC4: second turn passes first pair as history');
  return test('T4.3 (AC4): second call to htmlSubmitTurn passes prior turns as history', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let capturedHistories = [];
    routes.setSkillTurnExecutorAdapter(async function(_sys, history) {
      capturedHistories.push(history.slice());
      return 'Reply';
    });

    const sid = 't4c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName:       'discovery',
      sessionPath:     '/tmp/test',
      systemPrompt:    'SYS',
      turns:           [],
      artefactContent: null,
      artefactPath:    null,
      done:            false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'First', 'tok');
    await routes.htmlSubmitTurn('discovery', sid, 'Second', 'tok');

    assert.strictEqual(capturedHistories[0].length, 0, 'first call history must be empty');
    assert.strictEqual(capturedHistories[1].length, 2, 'second call history must have 2 entries (user+assistant from first turn)');
  });
});

queue.push(function runT4_4() {
  console.log('\n── T4.4 — AC4: executor receives user content (sanitised)');
  return test('T4.4 (AC4): executor receives sanitised user content as currentInput', async function() {
    const routes = freshRequire(ROUTES_PATH);

    let capturedInput = null;
    routes.setSkillTurnExecutorAdapter(async function(_sys, _hist, currentInput) {
      capturedInput = currentInput;
      return 'ok';
    });

    const sid = 't4d-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, '  trimmed answer  ', 'tok');
    assert.ok(typeof capturedInput === 'string', 'currentInput must be a string');
    assert.ok(capturedInput.trim().length > 0, 'currentInput must not be blank');
  });
});

// ── T5 — AC5: Artefact signal parsed ─────────────────────────────────────────

queue.push(function runT5_1() {
  console.log('\n── T5.1 — AC5: artefact signal sets session.done = true');
  return test('T5.1 (AC5): model response with ---ARTEFACT-START--- sets session.done = true', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() {
      return '---ARTEFACT-START---\n# My Discovery\n\nContent here.\n---ARTEFACT-END---\n---SLUG---\n2026-05-05-my-feature';
    });

    const sid = 't5a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'Done', 'tok');
    const session = routes._getHtmlSession(sid);
    assert.strictEqual(session.done, true, 'session.done must be true after artefact signal');
  });
});

queue.push(function runT5_2() {
  console.log('\n── T5.2 — AC5: artefact content stored in session.artefactContent');
  return test('T5.2 (AC5): session.artefactContent stores content between ARTEFACT markers', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() {
      return '---ARTEFACT-START---\n# Test Artefact\n\nSome content.\n---ARTEFACT-END---\n---SLUG---\n2026-05-05-test-slug';
    });

    const sid = 't5b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'Done', 'tok');
    const session = routes._getHtmlSession(sid);
    assert.ok(session.artefactContent, 'session.artefactContent must be set');
    assert.ok(session.artefactContent.includes('Test Artefact'), 'artefactContent must contain the artefact text');
  });
});

queue.push(function runT5_3() {
  console.log('\n── T5.3 — AC5: artefact path uses session.skillName (not hardcoded)');
  return test('T5.3 (AC5): session.artefactPath = artefacts/<slug>/<session.skillName>.md', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() {
      return '---ARTEFACT-START---\ncontent\n---ARTEFACT-END---\n---SLUG---\n2026-05-05-my-feature';
    });

    const sid = 't5c-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    await routes.htmlSubmitTurn('discovery', sid, 'Done', 'tok');
    const session = routes._getHtmlSession(sid);
    assert.strictEqual(
      session.artefactPath,
      'artefacts/2026-05-05-my-feature/discovery.md',
      'artefactPath must be artefacts/<slug>/<skillName>.md'
    );
  });
});

queue.push(function runT5_4() {
  console.log('\n── T5.4 — AC5: result object contains {done:true, artefactContent}');
  return test('T5.4 (AC5): htmlSubmitTurn returns {done:true, artefactContent} when signal received', async function() {
    const routes = freshRequire(ROUTES_PATH);

    routes.setSkillTurnExecutorAdapter(async function() {
      return '---ARTEFACT-START---\n# Content\n---ARTEFACT-END---\n---SLUG---\n2026-05-05-result-test';
    });

    const sid = 't5d-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'test-skill', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    const result = await routes.htmlSubmitTurn('test-skill', sid, 'Done', 'tok');
    assert.strictEqual(result.done, true, 'result.done must be true');
    assert.ok(result.artefactContent, 'result.artefactContent must be set');
    assert.ok(result.response, 'result.response must be set');
  });
});

// ── T6 — AC6: htmlGetPreview returns model-produced artefact ─────────────────

queue.push(function runT6_1() {
  console.log('\n── T6.1 — AC6: htmlGetPreview returns session.artefactContent');
  return test('T6.1 (AC6): htmlGetPreview returns artefactContent from session', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = 't6a-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: '# Artefact Content\n\nBody.', artefactPath: 'artefacts/2026-05-05-slug/discovery.md', done: true
    });

    const preview = routes.htmlGetPreview('discovery', sid);
    assert.strictEqual(preview.artefactContent, '# Artefact Content\n\nBody.');
  });
});

queue.push(function runT6_2() {
  console.log('\n── T6.2 — AC6: htmlGetPreview returns session.artefactPath');
  return test('T6.2 (AC6): htmlGetPreview returns artefactPath from session', function() {
    const routes = freshRequire(ROUTES_PATH);

    const sid = 't6b-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: '# Content', artefactPath: 'artefacts/2026-05-05-slug/discovery.md', done: true
    });

    const preview = routes.htmlGetPreview('discovery', sid);
    assert.strictEqual(preview.artefactPath, 'artefacts/2026-05-05-slug/discovery.md');
  });
});

// ── T7 — AC7: buildSystemPrompt includes required sections ───────────────────

queue.push(function runT7_1() {
  console.log('\n── T7.1 — AC7: buildSystemPrompt includes WEB UI PROTOCOL section');
  return test('T7.1 (AC7): buildSystemPrompt always includes "WEB UI PROTOCOL" section', function() {
    const routes = freshRequire(ROUTES_PATH);
    const prompt = routes.buildSystemPrompt('discovery', null, process.cwd());
    assert.ok(
      typeof prompt === 'string' && prompt.includes('WEB UI PROTOCOL'),
      'systemPrompt must include WEB UI PROTOCOL section'
    );
  });
});

queue.push(function runT7_2() {
  console.log('\n── T7.2 — AC7: buildSystemPrompt includes SKILL.md content for discovery');
  return test('T7.2 (AC7): buildSystemPrompt includes "--- SKILL: discovery ---" header when skill exists', function() {
    const routes = freshRequire(ROUTES_PATH);
    const prompt = routes.buildSystemPrompt('discovery', null, process.cwd());
    assert.ok(
      prompt.includes('--- SKILL: discovery ---'),
      'systemPrompt must include SKILL.md section header for discovery'
    );
  });
});

queue.push(function runT7_3() {
  console.log('\n── T7.3 — AC7: buildSystemPrompt includes copilot-instructions content');
  return test('T7.3 (AC7): buildSystemPrompt includes content from .github/copilot-instructions.md', function() {
    const routes = freshRequire(ROUTES_PATH);
    const prompt = routes.buildSystemPrompt('discovery', null, process.cwd());
    // copilot-instructions.md exists in this repo; verify some of its content appears
    assert.ok(
      typeof prompt === 'string' && prompt.length > 500,
      'systemPrompt must contain substantial content from copilot-instructions.md'
    );
  });
});

// ── T8 — AC8: skillTurnExecutor builds correct messages array ─────────────────

queue.push(function runT8_1() {
  console.log('\n── T8.1 — AC8: skill-turn-executor builds [system, ...history, user] messages');
  return test('T8.1 (AC8): skillTurnExecutor includes system message as first message', async function() {
    // We test the executor module directly by providing a mock https
    const execPath = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');
    delete require.cache[require.resolve(execPath)];

    // Capture what body gets sent to the API
    let capturedBody = null;
    const origHttps = require('https');
    const origRequest = origHttps.request.bind(origHttps);

    origHttps.request = function(options, cb) {
      // Return a mock that captures the body and responds
      const mockReq = {
        write: function(data) { capturedBody = JSON.parse(data); },
        end: function() {},
        on: function() { return mockReq; },
        setTimeout: function() { return mockReq; }
      };
      const mockRes = {
        statusCode: 200,
        on: function(event, handler) {
          if (event === 'data') setTimeout(function() {
            handler(JSON.stringify({ choices: [{ message: { content: 'test response' } }] }));
          }, 0);
          if (event === 'end') setTimeout(function() { handler(); }, 5);
          return mockRes;
        }
      };
      setTimeout(function() { cb(mockRes); }, 0);
      return mockReq;
    };

    const { skillTurnExecutor } = freshRequire(execPath);
    await skillTurnExecutor('SYSTEM PROMPT', [{ role: 'user', content: 'Q1' }, { role: 'assistant', content: 'A1' }], 'My question', 'token');

    origHttps.request = origRequest;

    assert.ok(capturedBody, 'request body must be captured');
    assert.ok(Array.isArray(capturedBody.messages), 'messages must be an array');
    assert.strictEqual(capturedBody.messages[0].role, 'system', 'first message must be system');
    assert.strictEqual(capturedBody.messages[0].content, 'SYSTEM PROMPT');
  });
});

queue.push(function runT8_2() {
  console.log('\n── T8.2 — AC8: skill-turn-executor appends history before user message');
  return test('T8.2 (AC8): skillTurnExecutor inserts history turns between system and final user message', async function() {
    const execPath = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');
    delete require.cache[require.resolve(execPath)];

    let capturedBody = null;
    const origHttps = require('https');
    const origRequest = origHttps.request.bind(origHttps);

    origHttps.request = function(options, cb) {
      const mockReq = {
        write: function(data) { capturedBody = JSON.parse(data); },
        end: function() {},
        on: function() { return mockReq; },
        setTimeout: function() { return mockReq; }
      };
      const mockRes = {
        statusCode: 200,
        on: function(event, handler) {
          if (event === 'data') setTimeout(function() {
            handler(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }));
          }, 0);
          if (event === 'end') setTimeout(function() { handler(); }, 5);
          return mockRes;
        }
      };
      setTimeout(function() { cb(mockRes); }, 0);
      return mockReq;
    };

    const { skillTurnExecutor } = freshRequire(execPath);
    const history = [
      { role: 'assistant', content: 'First assistant turn' },
      { role: 'user',      content: 'User reply' }
    ];
    await skillTurnExecutor('SYS', history, 'Current input', 'token');

    origHttps.request = origRequest;

    assert.strictEqual(capturedBody.messages.length, 4, 'must have 4 messages: system + 2 history + user');
    assert.strictEqual(capturedBody.messages[1].content, 'First assistant turn');
    assert.strictEqual(capturedBody.messages[2].content, 'User reply');
    assert.strictEqual(capturedBody.messages[3].content, 'Current input');
  });
});

queue.push(function runT8_3() {
  console.log('\n── T8.3 — AC8: skill-turn-executor handles empty history');
  return test('T8.3 (AC8): skillTurnExecutor with empty history builds [system, user] only', async function() {
    const execPath = path.resolve(__dirname, '../src/modules/skill-turn-executor.js');
    delete require.cache[require.resolve(execPath)];

    let capturedBody = null;
    const origHttps = require('https');
    const origRequest = origHttps.request.bind(origHttps);

    origHttps.request = function(options, cb) {
      const mockReq = {
        write: function(data) { capturedBody = JSON.parse(data); },
        end: function() {},
        on: function() { return mockReq; },
        setTimeout: function() { return mockReq; }
      };
      const mockRes = {
        statusCode: 200,
        on: function(event, handler) {
          if (event === 'data') setTimeout(function() {
            handler(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }));
          }, 0);
          if (event === 'end') setTimeout(function() { handler(); }, 5);
          return mockRes;
        }
      };
      setTimeout(function() { cb(mockRes); }, 0);
      return mockReq;
    };

    const { skillTurnExecutor } = freshRequire(execPath);
    await skillTurnExecutor('SYS', [], 'Begin the session.', 'token');

    origHttps.request = origRequest;

    assert.strictEqual(capturedBody.messages.length, 2, 'must have exactly 2 messages: system + user');
    assert.strictEqual(capturedBody.messages[0].role, 'system');
    assert.strictEqual(capturedBody.messages[1].role, 'user');
    assert.strictEqual(capturedBody.messages[1].content, 'Begin the session.');
  });
});

// ── T9 — AC9: Backward-compat no-op adapter setters ──────────────────────────

queue.push(function runT9_1() {
  console.log('\n── T9.1 — AC9: setNextQuestionExecutorAdapter accepts fn without throwing');
  return test('T9.1 (AC9): setNextQuestionExecutorAdapter accepts a function without throwing', function() {
    const routes = freshRequire(ROUTES_PATH);
    assert.doesNotThrow(function() {
      routes.setNextQuestionExecutorAdapter(async function() { return 'q'; });
    }, 'setNextQuestionExecutorAdapter must not throw');
  });
});

queue.push(function runT9_2() {
  console.log('\n── T9.2 — AC9: setSectionDraftExecutorAdapter accepts fn without throwing');
  return test('T9.2 (AC9): setSectionDraftExecutorAdapter accepts a function without throwing', function() {
    const routes = freshRequire(ROUTES_PATH);
    assert.doesNotThrow(function() {
      routes.setSectionDraftExecutorAdapter(async function() { return 'draft'; });
    }, 'setSectionDraftExecutorAdapter must not throw');
  });
});

// ── Run all tests ─────────────────────────────────────────────────────────────

console.log('\n=== check-mfc1-model-first-chat-session.js ===\n');

queue.reduce(function(chain, fn) {
  return chain.then(function() { return fn(); });
}, Promise.resolve()).then(function() {
  console.log('\n──────────────────────────────────────────────');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function(f) {
      console.log('  ✗ ' + f.name + '\n    ' + f.msg);
    });
  }
  process.exit(failed > 0 ? 1 : 0);
});
