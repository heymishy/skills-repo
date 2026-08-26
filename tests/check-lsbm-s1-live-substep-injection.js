'use strict';
var assert = require('assert');
var path = require('path');

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

var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

function makeSession(overrides) {
  return Object.assign({
    skillName: 'discovery',
    sessionPath: '/tmp/lsbm-s1-test.md',
    systemPrompt: 'test prompt',
    turns: [{ role: 'assistant', content: 'Hello' }],
    artefactContent: '# Discovery\n\nContent.',
    artefactPath: 'artefacts/test/discovery.md',
    done: false,
    journeyId: null
  }, overrides || {});
}

function renderChatHtml(routes, skillName, sessionOverrides) {
  var sid = 'lsbm-s1-' + skillName + '-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, makeSession(Object.assign({ skillName: skillName }, sessionOverrides)));
  var body = '';
  return routes.handleGetChatHtml(
    { params: { name: skillName, id: sid }, session: { accessToken: 'tok' } },
    { writeHead: function() {}, end: function(h) { body = h || ''; } }
  ).then(function() { return body; });
}

// Extracts the exact text between two anchors, exclusive of the end anchor,
// throwing loudly (assert failure with body length context) if either
// anchor is missing -- avoids a silent empty-string false pass.
function sliceBetween(body, startAnchor, endAnchor, fromIndex) {
  var start = body.indexOf(startAnchor, fromIndex || 0);
  assert.ok(start !== -1, 'start anchor not found: ' + startAnchor + ' (body length ' + body.length + ')');
  var end = body.indexOf(endAnchor, start);
  assert.ok(end !== -1, 'end anchor not found: ' + endAnchor + ' (body length ' + body.length + ')');
  return { text: body.slice(start, end), start: start, end: end };
}

// --- Golden fixtures -------------------------------------------------------
// Hardcoded, verbatim copies of the pre-fix inline subStepHtml/subStepJs
// arrays (routes/skills.js, ~line 4157-4252 before lsbm-s1), used as an
// independent regression anchor for AC5 -- independent in the sense that
// this is NOT derived by calling the post-fix buildJourneySubStepAffordance
// function again (which would be tautological and could not catch a
// regression introduced inside that function itself).

function goldenDiscoveryHtml() {
  return [
    '<div class="sw-gate-substeps">',
    '<span class="sw-gate-substep-lbl">Before proceeding:</span>',
    '<a href="#" class="sw-gate-substep-btn sw-gate-substep-btn--rec" id="sw-clarify-btn" onclick="swLaunchClarify(event)" title="Resolve open assumptions before benefit-metric">',
    '1a&#160; /clarify <span style="opacity:0.6;font-size:11px">(resolve assumptions)</span></a>',
    '<button type="button" class="sw-gate-substep-btn" onclick="swToggleEstimate()" id="sw-estimate-btn" title="Log a rough time forecast for calibration">',
    '1b&#160; /estimate <span style="opacity:0.6;font-size:11px">(time forecast)</span></button>',
    '</div>',
    '<div id="sw-estimate-panel" style="display:none">',
    '<form id="sw-estimate-form" class="sw-est-form">',
    '<div class="sw-est-field"><label>Focus hours</label><input name="focusHours" type="number" min="1" max="200" placeholder="4" required></div>',
    '<div class="sw-est-field"><label>Complexity 1–5</label><input name="complexity" type="number" min="1" max="5" placeholder="2" required></div>',
    '<div class="sw-est-field"><label>Scope stability</label><select name="scopeStability"><option>Stable</option><option>Likely stable</option><option>Uncertain</option><option>Volatile</option></select></div>',
    '<div class="sw-est-field"><label>Notes</label><input name="notes" type="text" style="width:180px" placeholder="Context or assumptions…"></div>',
    '<div class="sw-est-field"><label>&nbsp;</label><button type="submit" class="sw-gate-substep-btn sw-gate-substep-btn--rec">Log estimate</button></div>',
    '</form>',
    '</div>'
  ].join('');
}

function goldenDiscoveryScript(journeyIdEscaped) {
  return [
    '<script>',
    '(function(){',
    '  function swLaunchClarify(e){',
    '    e.preventDefault();',
    '    var btn=document.getElementById("sw-clarify-btn");',
    '    if(btn){btn.innerHTML="Opening /clarify…";btn.style.opacity="0.7";}',
    '    fetch("/api/journey/' + journeyIdEscaped + '/side-trip/clarify",{method:"POST"})',
    '      .then(function(r){return r.json();})',
    '      .then(function(d){if(d.sideTripSessionId)window.location.href="/skills/clarify/sessions/"+d.sideTripSessionId+"/chat";})',
    '      .catch(function(){if(btn){btn.innerHTML="1a /clarify (error — retry)";btn.style.opacity="1";}});',
    '  }',
    '  window.swLaunchClarify=swLaunchClarify;',
    '  window.swToggleEstimate=function(){',
    '    var p=document.getElementById("sw-estimate-panel");',
    '    if(p)p.style.display=p.style.display==="none"?"block":"none";',
    '  };',
    '  var ef=document.getElementById("sw-estimate-form");',
    '  if(ef)ef.addEventListener("submit",function(evt){',
    '    evt.preventDefault();',
    '    var data={};new FormData(ef).forEach(function(v,k){data[k]=v;});',
    '    fetch("/api/journey/' + journeyIdEscaped + '/estimate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})',
    '      .then(function(r){',
    '        var btn=document.getElementById("sw-estimate-btn");',
    '        document.getElementById("sw-estimate-panel").style.display="none";',
    '        if(r.ok){if(btn)btn.innerHTML="1b&#160; /estimate <span style=\\"opacity:0.6;font-size:11px\\">(&#x2713; logged)</span>";}',
    '        else{if(btn)btn.innerHTML="1b&#160; /estimate <span style=\\"color:red;font-size:11px\\">(error)</span>";}',
    '      });',
    '  });',
    '})();',
    '</script>'
  ].join('');
}

function goldenDefinitionHtml() {
  return [
    '<div class="sw-gate-substeps">',
    '<span class="sw-gate-substep-lbl">Optional:</span>',
    '<button type="button" class="sw-gate-substep-btn" onclick="swToggleEstimate()" id="sw-estimate-btn" title="Refine your time estimate (E2)">',
    '4a&#160; /estimate <span style="opacity:0.6;font-size:11px">(E2 — refine forecast)</span></button>',
    '</div>',
    '<div id="sw-estimate-panel" style="display:none">',
    '<form id="sw-estimate-form" class="sw-est-form">',
    '<div class="sw-est-field"><label>Focus hours</label><input name="focusHours" type="number" min="1" max="200" placeholder="4" required></div>',
    '<div class="sw-est-field"><label>Complexity 1–5</label><input name="complexity" type="number" min="1" max="5" placeholder="2" required></div>',
    '<div class="sw-est-field"><label>Scope stability</label><select name="scopeStability"><option>Stable</option><option>Likely stable</option><option>Uncertain</option><option>Volatile</option></select></div>',
    '<div class="sw-est-field"><label>Notes</label><input name="notes" type="text" style="width:180px" placeholder="Context or assumptions…"></div>',
    '<div class="sw-est-field"><label>&nbsp;</label><button type="submit" class="sw-gate-substep-btn sw-gate-substep-btn--rec">Log estimate</button></div>',
    '</form>',
    '</div>'
  ].join('');
}

function goldenDefinitionScript(journeyIdEscaped) {
  return [
    '<script>',
    '(function(){',
    '  window.swToggleEstimate=function(){',
    '    var p=document.getElementById("sw-estimate-panel");',
    '    if(p)p.style.display=p.style.display==="none"?"block":"none";',
    '  };',
    '  var ef=document.getElementById("sw-estimate-form");',
    '  if(ef)ef.addEventListener("submit",function(evt){',
    '    evt.preventDefault();',
    '    var data={pass:"E2"};new FormData(ef).forEach(function(v,k){data[k]=v;});',
    '    fetch("/api/journey/' + journeyIdEscaped + '/estimate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})',
    '      .then(function(r){',
    '        var btn=document.getElementById("sw-estimate-btn");',
    '        document.getElementById("sw-estimate-panel").style.display="none";',
    '        if(r.ok){if(btn)btn.innerHTML="4a&#160; /estimate <span style=\\"opacity:0.6;font-size:11px\\">(&#x2713; logged)</span>";}',
    '        else{if(btn)btn.innerHTML="4a&#160; /estimate <span style=\\"color:red;font-size:11px\\">(error)</span>";}',
    '      });',
    '  });',
    '})();',
    '</script>'
  ].join('');
}

var queue = [];

// AC1/AC4 -- SUBSTEP_HTML is computed unconditionally, present even when
// session.done is false (proving it is no longer gated behind the
// full-render `if (session.done && session.journeyId)` block).
queue.push(function() {
  return test('AC1: discovery, done:false -> SUBSTEP_HTML contains clarify+estimate markup', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'discovery', { done: false, journeyId: 'journey-live1' });
    var m = body.match(/var SUBSTEP_HTML = ("(?:[^"\\]|\\.)*");/);
    assert.ok(m, 'Expected a var SUBSTEP_HTML = "..."; assignment in the unconditional script, body length: ' + body.length);
    var substepHtml = JSON.parse(m[1]);
    assert.ok(substepHtml.includes('sw-clarify-btn'), 'Expected sw-clarify-btn in SUBSTEP_HTML for discovery');
    assert.ok(substepHtml.includes('sw-estimate-btn'), 'Expected sw-estimate-btn in SUBSTEP_HTML for discovery');
    assert.ok(substepHtml.includes('sw-estimate-form'), 'Expected sw-estimate-form in SUBSTEP_HTML for discovery');
  });
});

queue.push(function() {
  return test('AC4: definition, done:false -> SUBSTEP_HTML contains estimate-only markup (no clarify)', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'definition', { done: false, journeyId: 'journey-live2' });
    var m = body.match(/var SUBSTEP_HTML = ("(?:[^"\\]|\\.)*");/);
    assert.ok(m, 'Expected a var SUBSTEP_HTML = "..."; assignment in the unconditional script, body length: ' + body.length);
    var substepHtml = JSON.parse(m[1]);
    assert.ok(!substepHtml.includes('sw-clarify-btn'), 'Expected NO sw-clarify-btn in SUBSTEP_HTML for definition (narrower sub-step set)');
    assert.ok(substepHtml.includes('sw-estimate-btn'), 'Expected sw-estimate-btn in SUBSTEP_HTML for definition');
    assert.ok(substepHtml.includes('4a'), 'Expected the "4a" estimate label for definition');
  });
});

// AC2/AC3 -- click-handler functions are defined unconditionally, not
// nested inside the session.done-gated block.
queue.push(function() {
  return test('AC2/AC3: discovery, done:false -> swLaunchClarify/swToggleEstimate defined unconditionally', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'discovery', { done: false, journeyId: 'journey-live3' });
    assert.ok(/function swLaunchClarify\(e\)\{/.test(body), 'Expected swLaunchClarify function definition present in a done:false render');
    assert.ok(body.includes('window.swLaunchClarify=swLaunchClarify;'), 'Expected window.swLaunchClarify assignment present in a done:false render');
    assert.ok(body.includes('window.swToggleEstimate=function(){'), 'Expected window.swToggleEstimate assignment present in a done:false render');
    assert.ok(body.includes('document.getElementById("sw-estimate-form")'), 'Expected the estimate-form submit-listener wiring present in a done:false render');
    // Confirm this is NOT inside the (session.done-gated) full-render branch:
    // the marker text used by that branch's comment must not be the only
    // occurrence -- SESSION_DONE must literally be false in this render.
    assert.ok(body.includes('var SESSION_DONE   = false;'), 'Expected SESSION_DONE = false for a done:false session');
  });
});

queue.push(function() {
  return test('AC3: definition, done:false -> estimate-form submit wiring present unconditionally', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'definition', { done: false, journeyId: 'journey-live4' });
    assert.ok(body.includes('window.swToggleEstimate=function(){'), 'Expected window.swToggleEstimate assignment present in a done:false definition render');
    assert.ok(body.includes('data={pass:"E2"}'), 'Expected the E2-pass estimate payload wiring present in a done:false definition render');
  });
});

// AC2/AC3 continued -- showCommitLink()'s source injects SUBSTEP_HTML before
// the plain gate-confirm form, and (re-)wires the estimate form's submit
// listener against the freshly-inserted element.
queue.push(function() {
  return test('AC2/AC3: showCommitLink() source injects SUBSTEP_HTML and re-wires the estimate form', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'discovery', { done: false, journeyId: 'journey-live5' });
    var fnStart = body.indexOf('function showCommitLink()');
    assert.ok(fnStart !== -1, 'Expected showCommitLink() function definition in body');
    var fnEnd = body.indexOf("'    foot.appendChild(wrap);", fnStart);
    // The rendered body is already-joined JS, not the raw source array, so
    // search for the actual appendChild(wrap) call instead of the raw
    // source-array line above.
    var closeIdx = body.indexOf('foot.appendChild(wrap);', fnStart);
    assert.ok(closeIdx !== -1, 'Expected foot.appendChild(wrap) inside showCommitLink()');
    var src = body.slice(fnStart, closeIdx + 'foot.appendChild(wrap);'.length);

    assert.ok(src.includes('if (SUBSTEP_HTML)'), 'Expected showCommitLink() to branch on SUBSTEP_HTML');
    assert.ok(
      src.includes('foot.insertAdjacentHTML("beforeend", SUBSTEP_HTML)'),
      'Expected showCommitLink() to insert SUBSTEP_HTML into the DOM via insertAdjacentHTML'
    );
    // Visual order: the SUBSTEP_HTML injection must appear BEFORE wrap is
    // appended (the plain "Continue" form), matching the full-render path.
    var injectIdx = src.indexOf('foot.insertAdjacentHTML("beforeend", SUBSTEP_HTML)');
    var wrapAppendIdx = src.indexOf('foot.appendChild(wrap);');
    assert.ok(injectIdx < wrapAppendIdx, 'Expected SUBSTEP_HTML injection to happen before the plain Continue form is appended');
    // Explicit (re-)attachment of the estimate form's submit listener against
    // the freshly-inserted element: showCommitLink() re-executes SUBSTEP_JS
    // (which contains the sw-estimate-form addEventListener wiring) via a
    // dynamically created <script> element appended to the document --
    // the standard technique for executing script content inserted after
    // initial page load (as opposed to via innerHTML, which does not
    // execute embedded <script> tags).
    assert.ok(src.includes('SUBSTEP_JS'), 'Expected showCommitLink() to reference SUBSTEP_JS');
    assert.ok(
      src.includes('createElement("script")') && src.includes('.textContent = SUBSTEP_JS'),
      'Expected showCommitLink() to explicitly re-execute SUBSTEP_JS (which wires the estimate form submit listener) via a dynamically created + appended <script> element'
    );
  });
});

// AC5 (regression guard) -- full-render (resume) output for an already-done
// session is byte-identical to the pre-fix inline markup/script, for both
// discovery and definition.
queue.push(function() {
  return test('AC5: discovery, done:true -> sub-step html+script byte-identical to pre-fix golden fixture', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'discovery', { done: true, journeyId: 'journey-abc' });

    var htmlSlice = sliceBetween(body, '<div class="sw-gate-substeps">', '<div class="sw-journey-gate"');
    assert.strictEqual(htmlSlice.text, goldenDiscoveryHtml(), 'discovery subStepHtml must be byte-identical to the pre-fix inline markup');

    var scriptSlice = sliceBetween(body, '<script>(function(){  function swLaunchClarify', '</script>', htmlSlice.end);
    var actualScript = scriptSlice.text + '</script>';
    assert.strictEqual(actualScript, goldenDiscoveryScript('journey-abc'), 'discovery subStepJs must be byte-identical to the pre-fix inline script');
  });
});

queue.push(function() {
  return test('AC5: definition, done:true -> sub-step html+script byte-identical to pre-fix golden fixture', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'definition', { done: true, journeyId: 'journey-def' });

    var htmlSlice = sliceBetween(body, '<div class="sw-gate-substeps">', '<div class="sw-journey-gate"');
    assert.strictEqual(htmlSlice.text, goldenDefinitionHtml(), 'definition subStepHtml must be byte-identical to the pre-fix inline markup');

    var scriptSlice = sliceBetween(body, '<script>(function(){  window.swToggleEstimate', '</script>', htmlSlice.end);
    var actualScript = scriptSlice.text + '</script>';
    assert.strictEqual(actualScript, goldenDefinitionScript('journey-def'), 'definition subStepJs must be byte-identical to the pre-fix inline script');
  });
});

queue.push(function() {
  return test('AC5: definition-of-ready, done:true -> unaffected (no sub-step affordance existed pre-fix either)', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'definition-of-ready', { done: true, journeyId: 'journey-dor' });
    assert.ok(body.includes('/journey/journey-dor/complete'), 'Expected the existing journey-complete link, unaffected by this story');
    // Note: the bare class name "sw-gate-substeps" also appears in the
    // page's static <style> block (a CSS rule present on every page
    // regardless of skill), so assert on the actual markup usage
    // (opening the div with that class), not the bare class-name string.
    assert.ok(!body.includes('<div class="sw-gate-substeps">'), 'Expected no sub-step markup for definition-of-ready (matches pre-fix behaviour)');
  });
});

// AC6 (regression guard) -- no spurious/broken injection for a skill or
// session with no sub-step affordance.
queue.push(function() {
  return test('AC6: benefit-metric, done:false -> SUBSTEP_HTML empty, no spurious markup', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'benefit-metric', { done: false, journeyId: 'journey-bm' });
    var m = body.match(/var SUBSTEP_HTML = ("(?:[^"\\]|\\.)*");/);
    assert.ok(m, 'Expected SUBSTEP_HTML to still be declared (as an empty string) for benefit-metric');
    assert.strictEqual(JSON.parse(m[1]), '', 'Expected SUBSTEP_HTML to be empty for a skill with no sub-step affordance');
    // See note above: assert on markup usage, not the bare CSS class name
    // (which is always present in the page's static stylesheet).
    assert.ok(!body.includes('<div class="sw-gate-substeps">'), 'Expected no sw-gate-substeps markup anywhere in the page for benefit-metric');
  });
});

queue.push(function() {
  return test('AC6: benefit-metric, done:true -> SUBSTEP_HTML empty, showCommitLink degrades to plain button only', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'benefit-metric', { done: true, journeyId: 'journey-bm2' });
    var m = body.match(/var SUBSTEP_HTML = ("(?:[^"\\]|\\.)*");/);
    assert.ok(m, 'Expected SUBSTEP_HTML to still be declared for benefit-metric');
    assert.strictEqual(JSON.parse(m[1]), '', 'Expected SUBSTEP_HTML to be empty for benefit-metric');
    assert.ok(body.includes('GATE_CONFIRM_URL = "/api/journey/journey-bm2/gate-confirm"'), 'Expected the plain gate-confirm URL to still be computed');
    assert.ok(!body.includes('<div class="sw-gate-substeps">'), 'Expected no sw-gate-substeps markup anywhere for benefit-metric');
  });
});

queue.push(function() {
  return test('AC6: discovery with no journeyId (standalone), done:false -> SUBSTEP_HTML empty', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var body = await renderChatHtml(routes, 'discovery', { done: false, journeyId: null });
    var m = body.match(/var SUBSTEP_HTML = ("(?:[^"\\]|\\.)*");/);
    assert.ok(m, 'Expected SUBSTEP_HTML to still be declared for a standalone (no journeyId) session');
    assert.strictEqual(JSON.parse(m[1]), '', 'Expected SUBSTEP_HTML to be empty when there is no linked journey, even for discovery');
  });
});

// Syntax sanity -- every <script> block emitted across the matrix of
// relevant cases must be valid, executable JS (guards against a malformed
// splice of the raw SUBSTEP_JS content into the unconditional script).
queue.push(function() {
  return test('Syntax: every <script> block parses cleanly across done x journeyId x skillName combinations', async function() {
    var routes = freshRequire(ROUTES_PATH);
    routes.setSkillTurnExecutorAdapter(async function() { return 'Opening question?'; });
    var cases = [
      ['discovery', true, 'j1'], ['discovery', false, 'j1'],
      ['definition', true, 'j2'], ['definition', false, 'j2'],
      ['benefit-metric', false, 'j3'], ['benefit-metric', true, 'j3'],
      ['discovery', false, null]
    ];
    for (var i = 0; i < cases.length; i++) {
      var c = cases[i];
      var body = await renderChatHtml(routes, c[0], { done: c[1], journeyId: c[2] });
      var re = /<script>([\s\S]*?)<\/script>/g;
      var m;
      while ((m = re.exec(body))) {
        if (!m[1].trim()) continue;
        assert.doesNotThrow(function() { Function(m[1]); }, 'Syntax error in a <script> block for ' + JSON.stringify(c));
      }
    }
  });
});

var chain = Promise.resolve();
queue.forEach(function(fn) { chain = chain.then(fn); });
chain.then(function() {
  console.log('\n--- Results ---');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
  }
  process.exit(failed > 0 ? 1 : 0);
});
