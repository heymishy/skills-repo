#!/usr/bin/env node
// check-dic5-audit-trail.js — M1 CI gate: canvas-edit audit entry schema parity
// Asserts field-by-field structural identity with the conversational-turn reference schema.
// Failure blocks merge on any PR touching src/web-ui/routes/skills.js.
'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
process.env.WUCE_REPOSITORIES    = 'test-owner/test-repo';

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else       { console.log('  ✗ ' + label); failed++; }
}

const { buildCanvasAuditEntry } = require('../src/web-ui/routes/skills');

// ── Conversational-turn reference schema ──────────────────────────────────────
// This fixture defines the expected shape of a canvas-edit audit entry.
// It mirrors the conversational-turn audit entry schema with origin: 'canvas'.
// The ONLY permitted difference from a conversational-turn entry: origin value.
const convTurnReference = {
  type: 'canvas-edit',
  action: 'reorder',
  subject: { epicId: 'string-type', storyId: 'string-type' },
  value: { newIndex: 0 },
  origin: 'conversational-turn',
  sessionId: 'string-type',
  timestamp: '2026-01-01T00:00:00.000Z'
};

function assertSchemaParity(actual, reference, path) {
  path = path || '';
  for (var key of Object.keys(reference)) {
    var fullPath = path ? path + '.' + key : key;
    ok(key in actual, 'Schema parity: field "' + fullPath + '" present in canvas-edit entry');
    if (key in actual) {
      var refVal = reference[key];
      var actVal = actual[key];
      if (refVal !== null && typeof refVal === 'object' && !Array.isArray(refVal)) {
        assertSchemaParity(actVal, refVal, fullPath);
      } else {
        // Types must match (except origin value: 'canvas' vs 'conversational-turn')
        if (key === 'origin') {
          ok(actVal === 'canvas', 'Schema parity: origin must be "canvas" in canvas-edit entry (was: ' + actVal + ')');
        } else {
          ok(typeof actVal === typeof refVal, 'Schema parity: typeof "' + fullPath + '" matches (expected ' + typeof refVal + ', got ' + typeof actVal + ')');
        }
      }
    }
  }
}

// ── T1 — Reorder entry schema parity ─────────────────────────────────────────
console.log('\n  T1 — Reorder audit entry schema parity with reference');
{
  var reorderEntry = buildCanvasAuditEntry({
    action: 'reorder',
    epicId: 'epic-1',
    storyId: 's.1',
    newIndex: 2,
    sessionId: 'sess-test-001'
  });
  assertSchemaParity(reorderEntry, convTurnReference);
}

// ── T2 — Add entry schema parity ─────────────────────────────────────────────
console.log('\n  T2 — Add audit entry schema parity with reference');
{
  const addReference = Object.assign({}, convTurnReference, {
    action: 'add',
    value: { title: 'string-type' }
  });
  var addEntry = buildCanvasAuditEntry({
    action: 'add',
    epicId: 'epic-1',
    storyId: null,
    title: 'New operator story',
    sessionId: 'sess-test-001'
  });
  // For add entries, value has 'title' not 'newIndex' — check the add-specific schema
  ok(addEntry.type === 'canvas-edit', 'T2: type matches');
  ok(addEntry.action === 'add', 'T2: action matches');
  ok(addEntry.origin === 'canvas', 'T2: origin is canvas');
  ok(typeof addEntry.sessionId === 'string', 'T2: sessionId is string');
  ok(typeof addEntry.timestamp === 'string', 'T2: timestamp is string');
  ok(addEntry.subject && typeof addEntry.subject.epicId === 'string', 'T2: subject.epicId is string');
  ok(addEntry.value && typeof addEntry.value.title === 'string', 'T2: value.title is string');
}

// ── T3 — Timestamp is ISO 8601 ───────────────────────────────────────────────
console.log('\n  T3 — Timestamp is valid ISO 8601');
{
  var e = buildCanvasAuditEntry({ action: 'reorder', epicId: 'e1', storyId: 's1', newIndex: 0, sessionId: 'x' });
  var d = new Date(e.timestamp);
  ok(!isNaN(d.getTime()), 'T3: timestamp parses as valid date');
  ok(e.timestamp.includes('T') && e.timestamp.includes('Z'), 'T3: timestamp is ISO 8601 format');
}

// ── T4 — Origin value explicitly 'canvas' ────────────────────────────────────
console.log('\n  T4 — Origin is "canvas" (only permitted diff from conversational-turn)');
{
  var e2 = buildCanvasAuditEntry({ action: 'reorder', epicId: 'e1', storyId: 's1', newIndex: 0, sessionId: 'x' });
  ok(e2.origin === 'canvas', 'T4: canvas-edit entry origin is "canvas"');
  ok(convTurnReference.origin === 'conversational-turn', 'T4: reference has origin "conversational-turn"');
  ok(e2.origin !== convTurnReference.origin, 'T4: only permitted difference is origin value');
}

// ── T5 — No extra fields in entry ────────────────────────────────────────────
console.log('\n  T5 — No unexpected extra fields in canvas-edit entry');
{
  var e3 = buildCanvasAuditEntry({ action: 'reorder', epicId: 'e1', storyId: 's1', newIndex: 0, sessionId: 'sess1' });
  var expectedKeys = ['type', 'action', 'subject', 'value', 'origin', 'sessionId', 'timestamp'].sort();
  var actualKeys = Object.keys(e3).sort();
  ok(JSON.stringify(actualKeys) === JSON.stringify(expectedKeys),
    'T5: canvas-edit entry has exactly the expected fields (' + actualKeys.join(',') + ')');
}

console.log('\n[dic5-audit-trail] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) { process.exit(1); }
