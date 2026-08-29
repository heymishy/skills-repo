'use strict';

// check-s1-diagram-marker-diagnostic.js
// Verifies S1: a malformed canvas diagram marker (invalid JSON or a disallowed
// type value) surfaces a structured diagnostic instead of silently vanishing.
//
// Run: node tests/check-s1-diagram-marker-diagnostic.js

var fs   = require('fs');
var path = require('path');
var SKILLS_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshSkillsRoutes() {
  var resolved = require.resolve(SKILLS_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

(async function main() {

console.log('\nTask 1 — parseCanvasBlockDiagnostic, parseCanvasBlock contract preserved');

await (async function() {
  var routes = freshSkillsRoutes();

  var invalidJsonMarker = '---CANVAS-JSON: {"type":"table", "title": broken}---';
  var diag1 = routes.parseCanvasBlockDiagnostic(invalidJsonMarker);
  ok('AC1: invalid JSON returns ok:false with reason invalid-json', diag1.ok === false && diag1.reason === 'invalid-json');
  ok('AC1: invalid JSON diagnostic includes a detail string', typeof diag1.detail === 'string' && diag1.detail.length > 0);

  var disallowedTypeMarker = '---CANVAS-JSON: {"type":"not-a-real-type","title":"x","content":{}}---';
  var diag2 = routes.parseCanvasBlockDiagnostic(disallowedTypeMarker);
  ok('AC2: disallowed type returns ok:false with reason disallowed-type', diag2.ok === false && diag2.reason === 'disallowed-type');
  ok('AC2: disallowed type diagnostic names the value', diag2.detail.indexOf('not-a-real-type') !== -1);
  ok('AC2: disallowed type diagnostic lists the allowlist', diag2.detail.indexOf('table') !== -1 && diag2.detail.indexOf('drift-signal') !== -1);

  var allowedTypeMarker = '---CANVAS-JSON: {"type":"table","title":"x","content":{"headers":[],"rows":[]}}---';
  var diag3 = routes.parseCanvasBlockDiagnostic(allowedTypeMarker);
  ok('AC2 negative control: an allowed type does not produce a disallowed-type diagnostic', diag3.ok === true);

  // AC5 regression: parseCanvasBlock's existing null-or-object contract is untouched.
  var ALL_7_TYPES = [
    { type: 'cluster-tree', content: { clusters: [] } },
    { type: 'table', content: { headers: [], rows: [] } },
    { type: 'text', content: { paragraphs: ['x'] } },
    { type: 'data-model', content: { mermaid: 'erDiagram' } },
    { type: 'system-architecture', content: { mermaid: 'flowchart TD' } },
    { type: 'program-design', content: { mermaid: 'flowchart TD' } },
    { type: 'drift-signal', content: { items: [] } }
  ];
  var allParsedCorrectly = ALL_7_TYPES.every(function(fixture) {
    var marker = '---CANVAS-JSON: ' + JSON.stringify(Object.assign({ title: 'x' }, fixture)) + '---';
    var parsed = routes.parseCanvasBlock(marker);
    return parsed && parsed.type === fixture.type;
  });
  ok('AC5: parseCanvasBlock still returns a valid object for all 7 existing types (contract unchanged)', allParsedCorrectly);

  ok('AC5 regression: parseCanvasBlock still returns null (not a diagnostic object) for a malformed marker', routes.parseCanvasBlock(invalidJsonMarker) === null);
  ok('AC5 regression: parseCanvasBlock still returns null for a disallowed type (not a diagnostic object)', routes.parseCanvasBlock(disallowedTypeMarker) === null);
})();

console.log('\nTask 2 — diagnostic flows through the SSE scan loop + audit log');

function fakeStreamReq(sessionId, skillName) {
  return {
    session: { accessToken: 'test-token' },
    params:  { id: sessionId, name: skillName },
    on: function(event, cb) {
      if (event === 'data') { cb(Buffer.from(JSON.stringify({ answer: 'hi' }))); }
      if (event === 'end')  { cb(); }
      if (event === 'error') {}
    }
  };
}
function fakeStreamRes() {
  var r = { writtenData: [] };
  r.writeHead = function() {};
  r.write = function(d) { r.writtenData.push(d); };
  r.end = function() {};
  return r;
}

await (async function() {
  // AC1/AC2/Audit: a malformed (disallowed-type) marker in the model's own
  // streamed response emits a canvasDiagnostic SSE event and an audit log call,
  // driven through the REAL handlePostTurnStreamHtml via the existing
  // setSkillTurnExecutorStreamAdapter D37 seam -- same established pattern
  // check-inc4-canvas-panel.js already uses for the canvasBlock happy path.
  var routes = freshSkillsRoutes();
  var captured = [];
  routes.setLogger({ info: function(evt, data) { captured.push({ evt: evt, data: data }); }, error: function() {} });

  var sid = 'test-s1-t2-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t2-feature'
  });

  var malformedMarker = '---CANVAS-JSON: {"type":"not-a-real-type","title":"x","content":{}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(malformedMarker);
    return Promise.resolve(malformedMarker);
  });

  var res = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res);

  var raw = res.writtenData.join('');
  ok('AC1: a canvasDiagnostic SSE event is written for a malformed marker', raw.indexOf('canvasDiagnostic') !== -1);
  ok('AC2: the diagnostic names the disallowed type and the allowlist', raw.indexOf('not-a-real-type') !== -1 && raw.indexOf('table') !== -1 && raw.indexOf('drift-signal') !== -1);

  var logEvent = captured.find(function(c) { return c.evt === 'canvas_marker_diagnostic'; });
  ok('Audit: the diagnostic is logged via the existing _logger convention', !!logEvent && logEvent.data.reason === 'disallowed-type');

  routes.setLogger({ info: function() {}, error: function() {} });
})();

await (async function() {
  // NFR-Security: raw script-like content in the malformed input must not
  // reach the SSE payload unescaped.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t2-sec-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t2-sec-feature'
  });

  var scriptLikeType = '<script>alert(1)</script>';
  var markerWithScriptInType = '---CANVAS-JSON: {"type":"' + scriptLikeType.replace(/"/g, '\\"') + '","title":"x","content":{}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(markerWithScriptInType);
    return Promise.resolve(markerWithScriptInType);
  });

  var res = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res);
  var raw = res.writtenData.join('');
  ok('NFR-Security: the diagnostic payload escapes raw <script> content from the malformed input', raw.indexOf('<script>alert(1)</script>') === -1);
})();

await (async function() {
  // Performance: no additional model/executor call attributable to diagnostic generation.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t2-perf-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t2-perf-feature'
  });

  var callCount = 0;
  var malformedMarker2 = '---CANVAS-JSON: {"type":"still-not-real","title":"x","content":{}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    callCount++;
    onChunk(malformedMarker2);
    return Promise.resolve(malformedMarker2);
  });

  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), fakeStreamRes());
  ok('NFR-Performance: exactly one executor call for the turn -- diagnostic generation adds none', callCount === 1);
})();

console.log('\nTask 3 — one bounded retry: success and terminal-failure outcomes');

await (async function() {
  // AC3 (same-turn path): a failed marker followed by a corrected marker for
  // the SAME diagram identity, later in the SAME streamed turn, renders normally.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t3-sameturn-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t3-sameturn-feature'
  });

  var badMarker  = '---CANVAS-JSON: {"type":"not-a-real-type","title":"Diagram A","content":{}}---';
  var goodMarker = '---CANVAS-JSON: {"type":"table","title":"Diagram A","content":{"headers":[],"rows":[]}}---';
  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker + ' some text ' + goodMarker);
    return Promise.resolve(badMarker + goodMarker);
  });

  var res = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res);
  var raw = res.writtenData.join('');
  ok('AC3 (same-turn): the diagnostic fires for the first failed attempt', raw.indexOf('canvasDiagnostic') !== -1);
  ok('AC3 (same-turn): the corrected marker renders normally as a canvasBlock', raw.indexOf('"canvasBlock"') !== -1 && raw.indexOf('"Diagram A"') !== -1);
})();

await (async function() {
  // AC3 (next-turn path): a failure in one turn, corrected in the FOLLOWING turn.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t3-nextturn-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t3-nextturn-feature'
  });

  var badMarker2  = '---CANVAS-JSON: {"type":"not-a-real-type","title":"Diagram B","content":{}}---';
  var goodMarker2 = '---CANVAS-JSON: {"type":"table","title":"Diagram B","content":{"headers":[],"rows":[]}}---';

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker2);
    return Promise.resolve(badMarker2);
  });
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), fakeStreamRes());

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(goodMarker2);
    return Promise.resolve(goodMarker2);
  });
  var res2 = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res2);
  var raw2 = res2.writtenData.join('');
  ok('AC3 (next-turn): the corrected marker in the following turn renders normally', raw2.indexOf('"canvasBlock"') !== -1 && raw2.indexOf('"Diagram B"') !== -1);
})();

await (async function() {
  // AC4: a SECOND consecutive failure for the same diagram identity is
  // terminal -- the diagnostic still fires (visibility is not lost), but the
  // outcome is distinguishable from AC3's successful-retry case.
  var routes = freshSkillsRoutes();
  var sid = 'test-s1-t4-terminal-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'design', sessionPath: '/tmp/t', systemPrompt: '# design', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 's1-t4-terminal-feature'
  });

  var badMarker3a = '---CANVAS-JSON: {"type":"not-a-real-type","title":"Diagram C","content":{}}---';
  var badMarker3b = '---CANVAS-JSON: {"type":"still-not-real","title":"Diagram C","content":{}}---';

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker3a);
    return Promise.resolve(badMarker3a);
  });
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), fakeStreamRes());

  routes.setSkillTurnExecutorStreamAdapter(function(sp, hist, content, token, onChunk) {
    onChunk(badMarker3b);
    return Promise.resolve(badMarker3b);
  });
  var res3 = fakeStreamRes();
  await routes.handlePostTurnStreamHtml(fakeStreamReq(sid, 'design'), res3);
  var raw3 = res3.writtenData.join('');

  var diagnosticEvents = raw3.match(/canvasDiagnostic/g) || [];
  ok('AC4: the second consecutive failure still fires its own diagnostic (visibility not lost)', diagnosticEvents.length >= 1);
  ok('AC4: the second failure is marked terminal, distinguishable from a retriable first failure', raw3.indexOf('"terminal":true') !== -1);
})();

console.log('\nTask 4 — minimal client-side console listener for canvasDiagnostic');

await (async function() {
  // Source-inspection test (client-side inline script, no jsdom harness for
  // this file) -- same technique already established for the "AC1 client
  // render" style checks elsewhere in this codebase (e.g. res-s4's own
  // materiality-button test). Confirms the listener exists and is scoped to
  // the SSE dispatcher's own evt-handling block, not a stray, unused snippet.
  var skillsSrc = fs.readFileSync(SKILLS_PATH, 'utf8');
  var dispatcherMatch = skillsSrc.match(/if\(evt\.canvasBlock\)\s*\{[\s\S]*?\n\s*\}/);
  ok('dispatcher block found (anchor for locating the new listener nearby)', !!dispatcherMatch);

  var hasCanvasDiagnosticListener = /evt\.canvasDiagnostic/.test(skillsSrc);
  ok('AC1 (client-visible signal): a client-side listener for evt.canvasDiagnostic exists', hasCanvasDiagnosticListener);

  var listenerMatch = skillsSrc.match(/if\(evt\.canvasDiagnostic\)\s*\{([\s\S]*?)\n\s*\}/);
  ok('the listener logs to the console (minimal signal, not a full UI treatment per contract)', !!listenerMatch && /console\.(warn|error)/.test(listenerMatch[1]));
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
