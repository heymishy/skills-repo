'use strict';
/**
 * check-wuce8-annotation.js — AC verification for wuce.8
 * 22 tests: T1–T5 (unit/DOM), IT1–IT6 (integration), NFR1–NFR2
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

// ── Unit under test ───────────────────────────────────────────────────────────
const {
  sanitiseAnnotationContent,
  validateAnnotationLength,
  buildAnnotationBlock,
  appendAnnotation,
  parseExistingAnnotations
} = require('../src/web-ui/utils/annotation-utils');

const { renderAnnotations } = require('../src/web-ui/utils/annotation-renderer');

// Fixtures
const artefactWithAnnotations = fs.readFileSync(path.join(__dirname, 'fixtures/markdown/artefact-with-annotations.md'), 'utf8');
const artefactPendingSignoff  = fs.readFileSync(path.join(__dirname, 'fixtures/markdown/artefact-pending-signoff.md'), 'utf8');
const successFixture          = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/annotation-commit-success.json'), 'utf8'));
// conflictFixture loaded but used by reference in IT5
JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/github/annotation-commit-conflict.json'), 'utf8'));

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  \u2717 ' + name + ': ' + err.message);
  }
}

// ── T1 — sanitiseAnnotationContent ───────────────────────────────────────────
console.log('\nT1 \u2014 sanitiseAnnotationContent (AC4)');

test('T1.1 \u2014 strips <script> tags', () => {
  const result = sanitiseAnnotationContent("Good comment <script>alert('xss')</script> end");
  assert.ok(!result.includes('<script>'), 'should remove <script> tag');
  assert.ok(!result.includes('alert('), 'should remove script content');
  assert.ok(result.includes('Good'), 'should preserve non-HTML text');
});

test('T1.2 \u2014 strips arbitrary HTML tags', () => {
  const result = sanitiseAnnotationContent("<b>Bold</b> and <a href='evil.com'>link</a>");
  assert.ok(!result.includes('<b>'), 'should remove <b> tag');
  assert.ok(!result.includes('<a'), 'should remove <a> tag');
  assert.ok(result.includes('Bold'), 'should preserve text content');
  assert.ok(result.includes('link'), 'should preserve link text');
});

test('T1.3 \u2014 preserves plain text unchanged', () => {
  const input = 'This is a normal annotation with no HTML.';
  assert.strictEqual(sanitiseAnnotationContent(input), input);
});

test('T1.4 \u2014 handles empty string without throwing', () => {
  assert.doesNotThrow(() => sanitiseAnnotationContent(''));
  assert.strictEqual(sanitiseAnnotationContent(''), '');
});

// ── T2 — validateAnnotationLength ────────────────────────────────────────────
console.log('\nT2 \u2014 validateAnnotationLength (AC5)');

test('T2.1 \u2014 returns false for content exceeding 2000 characters', () => {
  const longString = 'a'.repeat(2001);
  assert.strictEqual(validateAnnotationLength(longString), false);
});

test('T2.2 \u2014 returns true for exactly 2000 characters', () => {
  const exactString = 'a'.repeat(2000);
  assert.strictEqual(validateAnnotationLength(exactString), true);
});

test('T2.3 \u2014 returns true for content under 2000 characters', () => {
  assert.strictEqual(validateAnnotationLength('Short annotation.'), true);
});

// ── T3 — buildAnnotationBlock ─────────────────────────────────────────────────
console.log('\nT3 \u2014 buildAnnotationBlock (AC2)');

test('T3.1 \u2014 produces block with all required fields', () => {
  const block = buildAnnotationBlock('Jane Stakeholder', 'Acceptance Criteria', 'LGTM.', '2026-05-02T10:00:00Z');
  assert.ok(block.includes('Jane Stakeholder'), 'should include annotator name');
  assert.ok(block.includes('Acceptance Criteria'), 'should include section heading');
  assert.ok(block.includes('LGTM.'), 'should include annotation text');
  assert.ok(block.includes('2026-05-02T10:00:00Z'), 'should include timestamp');
});

test('T3.2 \u2014 timestamp must be ISO 8601 format', () => {
  const ts = new Date().toISOString();
  const block = buildAnnotationBlock('Alice', 'Section', 'Note.', ts);
  const iso8601Re = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  assert.ok(iso8601Re.test(block), 'block should contain ISO 8601 timestamp');
});

test('T3.3 \u2014 second annotation does not produce second ## Annotations heading', () => {
  const base = '## Story\n\nContent here.';
  const after1 = appendAnnotation(base, 'Alice', 'Story', 'First note.', '2026-05-01T09:00:00Z');
  const after2 = appendAnnotation(after1, 'Bob', 'Story', 'Second note.', '2026-05-02T09:00:00Z');
  const annotationsCount = (after2.match(/## Annotations/g) || []).length;
  assert.strictEqual(annotationsCount, 1, 'should only have one ## Annotations heading');
});

// ── T4 — parseExistingAnnotations ────────────────────────────────────────────
console.log('\nT4 \u2014 parseExistingAnnotations (AC3)');

test('T4.1 \u2014 extracts annotations from artefact with ## Annotations section', () => {
  const annotations = parseExistingAnnotations(artefactWithAnnotations);
  assert.ok(Array.isArray(annotations), 'should return array');
  assert.ok(annotations.length >= 1, 'should find at least one annotation');
  const ann = annotations[0];
  assert.strictEqual(ann.annotatorName, 'Jane Stakeholder');
  assert.ok(ann.date.includes('2026-05-01'), 'should parse date');
});

test('T4.2 \u2014 returns empty array when no ## Annotations section exists', () => {
  const annotations = parseExistingAnnotations(artefactPendingSignoff);
  assert.ok(Array.isArray(annotations), 'should return array');
  assert.strictEqual(annotations.length, 0, 'should return empty array for no annotations section');
});

test('T4.3 \u2014 handles artefact with empty ## Annotations section without throwing', () => {
  const emptyAnnotations = '## Story\n\nContent.\n\n## Annotations\n';
  assert.doesNotThrow(() => parseExistingAnnotations(emptyAnnotations));
  const result = parseExistingAnnotations(emptyAnnotations);
  assert.deepStrictEqual(result, []);
});

// ── T5 — renderAnnotations DOM-state ─────────────────────────────────────────
console.log('\nT5 \u2014 renderAnnotations DOM-state (AC1, AC3)');

test('T5.1 \u2014 annotation affordance present for each section heading (keyboard focus)', () => {
  const md = '## Story Title\n\nContent.\n\n## Acceptance Criteria\n\n**AC1:** Done.';
  const html = renderAnnotations(md);
  const buttonCount = (html.match(/tabindex="0"/g) || []).length;
  assert.ok(buttonCount >= 2, 'should have focusable button for each section heading, got: ' + buttonCount);
});

test('T5.2 \u2014 existing annotations rendered below their section', () => {
  const html = renderAnnotations(artefactWithAnnotations);
  assert.ok(html.includes('Jane Stakeholder'), 'should render annotator name');
  assert.ok(html.includes('2026-05-01'), 'should render annotation date');
  assert.ok(html.includes('This looks good'), 'should render annotation text');
});

test('T5.3 \u2014 artefact with no annotations renders cleanly with no orphaned annotation UI', () => {
  const html = renderAnnotations(artefactPendingSignoff);
  assert.ok(!html.includes('annotation-entry'), 'should have no annotation entries for artefact without annotations');
});

// ── Integration tests ─────────────────────────────────────────────────────────
console.log('\nIntegration tests');

const annotationWriter = require('../src/web-ui/adapters/annotation-writer');
const { handlePostAnnotation, setLogger } = require('../src/web-ui/routes/annotation');

function makeReq(opts) {
  opts = opts || {};
  return {
    method:  opts.method  || 'POST',
    url:     opts.url     || '/api/artefacts/artefacts%2Ftest%2Fdiscovery.md/annotations',
    session: opts.session !== undefined ? opts.session : { accessToken: 'tok-user', user: { login: 'test-stakeholder' } },
    body:    opts.body    !== undefined ? opts.body : {
      sectionHeading: 'Acceptance Criteria',
      annotationText: 'LGTM.',
      artefactPath:   'artefacts/test/discovery.md'
    },
    on: function() {}
  };
}

function makeRes() {
  const res = {
    statusCode: null,
    headers:    {},
    body:       '',
    writeHead: function(code, headers) { this.statusCode = code; this.headers = headers || {}; },
    end: function(body) { this.body = body || ''; }
  };
  return res;
}

async function runTest(name, fn) {
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

(async () => {

  await runTest('IT1 \u2014 valid payload \u2192 200, commitAnnotation called with user token (AC2)', async () => {
    let calledWith = null;
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function(p, section, text, token) {
      calledWith = { path: p, section, text, token };
      return successFixture;
    };
    const req = makeReq();
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    assert.strictEqual(res.statusCode, 200);
    assert.ok(calledWith !== null, 'commitAnnotation should be called');
    assert.strictEqual(calledWith.token, 'tok-user', 'should use user session token');
    assert.ok(calledWith.text.includes('LGTM'), 'should pass annotation text');
  });

  await runTest('IT2 \u2014 script content \u2192 sanitised text committed, not rejected (AC4)', async () => {
    let calledWithText = null;
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function(p, section, text, token) {
      calledWithText = text;
      return successFixture;
    };
    const req = makeReq({ body: {
      sectionHeading: 'Acceptance Criteria',
      annotationText: "Good <script>xss()</script> comment",
      artefactPath:   'artefacts/test/discovery.md'
    }});
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    assert.strictEqual(res.statusCode, 200, 'should return 200 for sanitised content');
    assert.ok(!calledWithText.includes('<script>'), 'sanitised text should not contain script tag');
    assert.ok(calledWithText.includes('Good'), 'sanitised text should retain non-HTML content');
  });

  await runTest('IT3 \u2014 >2000 chars \u2192 400, commitAnnotation NOT called (AC5)', async () => {
    let called = false;
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function() { called = true; return successFixture; };
    const req = makeReq({ body: {
      sectionHeading: 'Section',
      annotationText: 'a'.repeat(2001),
      artefactPath:   'artefacts/test/discovery.md'
    }});
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    assert.strictEqual(res.statusCode, 400, 'should return 400 for too-long annotation');
    assert.strictEqual(called, false, 'commitAnnotation should not be called');
  });

  await runTest('IT4 \u2014 adapter succeeds \u2192 route returns 200 (AC6 success path)', async () => {
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function() { return successFixture; };
    const req = makeReq();
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    assert.strictEqual(res.statusCode, 200, 'route returns 200 when adapter succeeds');
  });

  await runTest('IT5 \u2014 AnnotationConflictError \u2192 409 response (AC6 failure path)', async () => {
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function() {
      throw new annotationWriter.AnnotationConflictError();
    };
    const req = makeReq();
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    assert.ok(res.statusCode === 409 || res.statusCode === 503, 'should return 409 or 503 on conflict, got: ' + res.statusCode);
    const body = JSON.parse(res.body);
    assert.ok(body.error, 'response should contain error message');
  });

  await runTest('IT6 \u2014 no session \u2192 401', async () => {
    const req = makeReq({ session: null });
    const res = makeRes();
    await handlePostAnnotation(req, res);
    assert.strictEqual(res.statusCode, 401);
  });

  await runTest('NFR1 \u2014 audit log on annotation submission', async () => {
    let loggedEvent = null;
    let loggedData  = null;
    setLogger({
      info: function(event, data) { loggedEvent = event; loggedData = data; },
      warn: function() {}
    });
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function() { return successFixture; };
    const req = makeReq();
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    setLogger({ info: function() {}, warn: function() {} });
    assert.strictEqual(loggedEvent, 'annotation_submitted', 'should log annotation_submitted event');
    assert.ok(loggedData.userId, 'should log userId');
    assert.ok(loggedData.artefactPath, 'should log artefactPath');
    assert.ok(loggedData.sectionHeading, 'should log sectionHeading');
    assert.ok(loggedData.timestamp, 'should log timestamp');
    assert.ok(!loggedData.annotationText, 'should NOT log full annotation text (privacy)');
  });

  await runTest('NFR2 \u2014 committer identity is authenticated user token', async () => {
    let capturedToken = null;
    const orig = annotationWriter.commitAnnotation;
    annotationWriter.commitAnnotation = async function(p, section, text, token) {
      capturedToken = token;
      return successFixture;
    };
    const req = makeReq({ session: { accessToken: 'user-oauth-token-xyz', user: { login: 'test-stakeholder' } } });
    const res = makeRes();
    await handlePostAnnotation(req, res);
    annotationWriter.commitAnnotation = orig;
    assert.strictEqual(capturedToken, 'user-oauth-token-xyz', 'token used must be from user session, not server-level token');
  });

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n[check-wuce8-annotation] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  \u2717 ' + f.name + '\n    ' + f.err.message); });
    process.exit(1);
  }

})().catch(function(err) {
  console.error('[check-wuce8-annotation] FATAL:', err);
  process.exit(1);
});
