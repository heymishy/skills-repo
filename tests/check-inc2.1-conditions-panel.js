// check-inc2.1-conditions-panel.js — unit tests for inc2.1 conditions panel
// Tests: parseConditionMarker, conditionItem SSE emission, session storage,
//        marker stripping from draftChunk, panel section presence, card HTML.

'use strict';

const {
  parseConditionMarker,
  _setHtmlSession,
  setSkillTurnExecutorStreamAdapter,
  handlePostTurnStreamHtml
} = require('../src/web-ui/routes/skills');

const { renderChat } = require('../src/web-ui/views/chat-view');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[inc2.1] PASS: ' + label);
    passed++;
  } else {
    console.error('[inc2.1] FAIL: ' + label);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// T1 — parseConditionMarker: valid marker parsed correctly
// ---------------------------------------------------------------------------

var validMarker = '---CONDITION-JSON: {"id":"no-new-deps","text":"No new npm dependencies may be introduced.","type":"constraint","source":"model"}---';
var p1 = parseConditionMarker(validMarker);
assert('T1: parseConditionMarker returns non-null for valid marker', p1 !== null);
assert('T1: parseConditionMarker returns correct id', p1 && p1.id === 'no-new-deps');
assert('T1: parseConditionMarker returns correct text', p1 && p1.text === 'No new npm dependencies may be introduced.');
assert('T1: parseConditionMarker returns correct type', p1 && p1.type === 'constraint');
assert('T1: parseConditionMarker returns correct source', p1 && p1.source === 'model');

// ---------------------------------------------------------------------------
// T2 — parseConditionMarker: invalid JSON returns null
// ---------------------------------------------------------------------------

var badMarker = '---CONDITION-JSON: {bad json here}---';
assert('T2: parseConditionMarker returns null for invalid JSON', parseConditionMarker(badMarker) === null);

// ---------------------------------------------------------------------------
// T3 — parseConditionMarker: no marker returns null
// ---------------------------------------------------------------------------

assert('T3: parseConditionMarker returns null when no marker present', parseConditionMarker('No marker here') === null);

// ---------------------------------------------------------------------------
// T10 — type validation: invalid type is skipped
// ---------------------------------------------------------------------------

var invalidTypeMarker = '---CONDITION-JSON: {"id":"x","text":"some text","type":"unknown-type","source":"model"}---';
assert('T10: parseConditionMarker returns null for invalid type', parseConditionMarker(invalidTypeMarker) === null);

// valid types are accepted
var constraintMarker = '---CONDITION-JSON: {"id":"c1","text":"A constraint.","type":"constraint","source":"model"}---';
var dependencyMarker = '---CONDITION-JSON: {"id":"d1","text":"A dependency.","type":"dependency","source":"operator"}---';
var outcomeMarker    = '---CONDITION-JSON: {"id":"o1","text":"An outcome.","type":"outcome","source":"model"}---';
assert('T10: type=constraint is accepted', parseConditionMarker(constraintMarker) !== null);
assert('T10: type=dependency is accepted', parseConditionMarker(dependencyMarker) !== null);
assert('T10: type=outcome is accepted',    parseConditionMarker(outcomeMarker) !== null);

// ---------------------------------------------------------------------------
// T11 — source validation: invalid source defaults to "model"
// ---------------------------------------------------------------------------

var invalidSourceMarker = '---CONDITION-JSON: {"id":"s1","text":"Test.","type":"constraint","source":"agent"}---';
var ps = parseConditionMarker(invalidSourceMarker);
assert('T11: parseConditionMarker with invalid source returns non-null', ps !== null);
assert('T11: invalid source normalised to "model"', ps && ps.source === 'model');

// valid sources preserved
var operatorMarker = '---CONDITION-JSON: {"id":"s2","text":"Test.","type":"dependency","source":"operator"}---';
var po = parseConditionMarker(operatorMarker);
assert('T11: source=operator is preserved', po && po.source === 'operator');

// ---------------------------------------------------------------------------
// T4 — conditionItem SSE event emitted; session.conditionItems populated
// ---------------------------------------------------------------------------

(function() {
  var sessionId = 'test-cond-session-01';
  _setHtmlSession(sessionId, {
    skillName: 'ideate',
    systemPrompt: 'system',
    turns: [],
    assumptionCardsEnabled: true
  });

  var sseEvents = [];
  setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, userContent, token, onChunk) {
    onChunk('---CONDITION-JSON: {"id":"in-memory-only","text":"Session state must remain in-memory.","type":"constraint","source":"model"}---');
    return Promise.resolve('done');
  });

  var fakeRes = {
    writeHead: function() {},
    write: function(data) { sseEvents.push(data); },
    end: function() {}
  };
  var fakeReq = {
    params: { name: 'ideate', id: sessionId },
    body: { answer: 'hello', sessionId: sessionId },
    session: { accessToken: 'tok' }
  };

  handlePostTurnStreamHtml(fakeReq, fakeRes).then(function() {
    var condEvents = sseEvents.filter(function(e) {
      return e.indexOf('"conditionItem"') !== -1;
    });
    assert('T4: conditionItem SSE event emitted', condEvents.length === 1);

    var evt = null;
    try { evt = JSON.parse(condEvents[0].replace(/^data: /, '')); } catch(_) {}
    assert('T4: conditionItem SSE event has correct id', evt && evt.conditionItem && evt.conditionItem.id === 'in-memory-only');
    assert('T4: conditionItem SSE event has correct type', evt && evt.conditionItem && evt.conditionItem.type === 'constraint');
    assert('T4: conditionItem SSE event has correct source', evt && evt.conditionItem && evt.conditionItem.source === 'model');

    var session = require('../src/web-ui/routes/skills')._getHtmlSession(sessionId);
    assert('T4: session.conditionItems populated', session && session.conditionItems && session.conditionItems['in-memory-only']);
    assert('T4: session.conditionItems[id].type correct', session && session.conditionItems && session.conditionItems['in-memory-only'] && session.conditionItems['in-memory-only'].type === 'constraint');

    // T5 — marker stripped from draftChunk
    // The marker was not inside an ARTEFACT-START/END block so no draftChunk expected,
    // but confirm no draftChunk event contains the marker text
    var draftEvents = sseEvents.filter(function(e) {
      return e.indexOf('"draftChunk"') !== -1;
    });
    var markerInDraft = draftEvents.some(function(e) {
      return e.indexOf('CONDITION-JSON') !== -1;
    });
    assert('T5: CONDITION-JSON marker not present in any draftChunk event', !markerInDraft);

    report();
  }).catch(function(err) {
    console.error('[inc2.1] T4/T5 async error:', err.message);
    failed += 3;
    report();
  });
})();

// ---------------------------------------------------------------------------
// T6 — #condition-items panel section present in shell HTML
// ---------------------------------------------------------------------------

(function() {
  var html = renderChat({
    skillLabel: 'ideate',
    sessionId: 'test-render',
    featureSlug: '',
    turns: [],
    modelLabel: '',
    done: false,
    contextManifestHtml: null,
    draftSections: null
  });

  assert('T6: #condition-items element present in shell HTML', html.indexOf('id="condition-items"') !== -1);
  assert('T6: #condition-items has role="region"', html.indexOf('role="region"') !== -1 && html.indexOf('condition-items') !== -1);
  assert('T6: #condition-items has aria-label="Condition items"', html.indexOf('aria-label="Condition items"') !== -1);

  // T7 — condition card rendered from conditionItem: appendConditionItem is defined in inline script
  assert('T7: appendConditionItem function defined in inline script', html.indexOf('appendConditionItem') !== -1);

  // T8 — condition cards are read-only (appendConditionItem builds no buttons)
  // The appendConditionItem function in the script builds cards without btn-confirm or btn-flag
  assert('T8: condition card script does not include btn-confirm inside condition section', (function() {
    // Extract the appendConditionItem function text
    var fnStart = html.indexOf('function appendConditionItem');
    var fnEnd   = html.indexOf('function', fnStart + 1);
    if (fnStart === -1) return false;
    var fnText  = html.slice(fnStart, fnEnd === -1 ? fnStart + 2000 : fnEnd);
    return fnText.indexOf('btn-confirm') === -1 && fnText.indexOf('btn-flag') === -1;
  })());

  // T9 — three-section right panel layout order
  var condIdx  = html.indexOf('id="condition-items"');
  var assmpIdx = html.indexOf('id="assumption-cards"');
  var draftIdx = html.indexOf('id="draft-content"');
  assert('T9: #condition-items appears before #assumption-cards', condIdx < assmpIdx);
  assert('T9: #assumption-cards appears before #draft-content', assmpIdx < draftIdx);
  assert('T9: #condition-items style includes max-height', (function() {
    var sectionText = html.slice(condIdx - 200, condIdx + 100);
    return sectionText.indexOf('max-height') !== -1;
  })());
})();

// ---------------------------------------------------------------------------
// conditionItem event wired in SSE pump
// ---------------------------------------------------------------------------

(function() {
  var html = renderChat({
    skillLabel: 'ideate', sessionId: 'x', featureSlug: '', turns: [],
    modelLabel: '', done: false, contextManifestHtml: null, draftSections: null
  });
  assert('SSE pump: evt.conditionItem branch present in inline script', html.indexOf('evt.conditionItem') !== -1);
})();

function report() {
  if (passed + failed >= 30) { // approximate — async tests add late
    console.log('\n[inc2.1] Results: ' + passed + ' passed, ' + failed + ' failed');
    if (failed > 0) { process.exit(1); }
  }
}

// Synchronous tests complete
setTimeout(function() {
  console.log('\n[inc2.1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) { process.exit(1); }
}, 3000);
