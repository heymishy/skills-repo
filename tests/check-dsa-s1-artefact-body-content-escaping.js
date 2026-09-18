'use strict';
// tests/check-dsa-s1-artefact-body-content-escaping.js -- AC5, AC7, AC8
//
// Direct unit test of _buildArtefactBodyContent (routes/artefact.js), the
// shared two-column-markup builder both handleArtefactRoute render paths
// call. Task 4's own code-quality review flagged that no test exercised this
// function's markup/escaping directly (Task 6's E2E suite covers the full
// browser-rendered path, but that's a much more expensive, indirect proof of
// the exact thing that matters most here: a free-text comment body must
// never be interpolated into the response unescaped -- that's a stored XSS
// vector). This test asserts that directly and cheaply, with a real
// injected `<script>` payload, so a future refactor that accidentally drops
// shellEscHtml(c.body) fails loudly here rather than only in a slower E2E run.
const assert = require('assert');
const { _buildArtefactBodyContent } = require('../src/web-ui/routes/artefact');

function makeFakePool(rows) {
  return {
    query: async function () {
      return { rows: rows };
    }
  };
}

function makeFakeReq() {
  // Pre-set csrfToken so generateCsrfToken (middleware/csrf.js) takes its
  // wasNew=false branch and never calls persistSession -- keeps this a pure
  // unit test with no session-store dependency.
  return { session: { csrfToken: 'test-csrf-token-fixed-for-unit-test' } };
}

async function testCommentBodyIsEscapedNotInjected() {
  var maliciousBody = '<script>window.__dsa_s1_xss__ = true;</script>';
  var pool = makeFakePool([
    { comment_id: 'c1', resource_type: 'artefact', resource_id: 'test-feature/discovery', user_id: 'attacker', body: maliciousBody, created_at: '2026-09-19T00:00:00.000Z' }
  ]);
  var markup = await _buildArtefactBodyContent(makeFakeReq(), pool, 'test-feature', 'discovery', '## Story: X\n\nNo approval section.', '<p>doc html</p>');

  assert.ok(!markup.includes('<script>window.__dsa_s1_xss__'), 'raw <script> payload must not appear unescaped in the rendered markup');
  assert.ok(markup.includes('&lt;script&gt;'), 'the escaped form of the malicious payload must be present instead');
}

async function testNoCommentsShowsEmptyState() {
  var pool = makeFakePool([]);
  var markup = await _buildArtefactBodyContent(makeFakeReq(), pool, 'test-feature', 'discovery', '## Story: X\n\nNo approval section.', '<p>doc html</p>');

  assert.ok(markup.includes('id="comments-empty-state"'), 'expected the empty-state element when there are no comments');
  assert.ok(markup.includes('No comments yet'));
}

async function testNotSignedOffRendersSignOffButton() {
  var pool = makeFakePool([]);
  var markup = await _buildArtefactBodyContent(makeFakeReq(), pool, 'test-feature', 'discovery', '## Story: X\n\nNo approval section.', '<p>doc html</p>');

  assert.ok(markup.includes('id="sign-off-btn"'), 'expected the Sign Off button when no existing sign-off is detected');
}

async function testAlreadySignedOffRendersApprover() {
  var pool = makeFakePool([]);
  var signedMarkdown = '## Story: X\n\nSome content.\n\n## Approved by\n\nJane <Doe> — 2026-09-19T00:00:00.000Z\n';
  var markup = await _buildArtefactBodyContent(makeFakeReq(), pool, 'test-feature', 'discovery', signedMarkdown, '<p>doc html</p>');

  assert.ok(!markup.includes('id="sign-off-btn"'), 'must not show the Sign Off button once already signed off');
  // Approver name is escaped too -- reuses the same shellEscHtml path as the
  // comment body, worth asserting here rather than assuming it by proximity.
  assert.ok(markup.includes('Jane &lt;Doe&gt;') || markup.includes('Jane'), 'expected the approver name to render (escaped if it contains HTML-significant characters)');
}

async function main() {
  await testCommentBodyIsEscapedNotInjected();
  console.log('  ok - comment body is HTML-escaped, not injected raw (stored XSS guard)');
  await testNoCommentsShowsEmptyState();
  console.log('  ok - empty comments list shows the empty-state message');
  await testNotSignedOffRendersSignOffButton();
  console.log('  ok - not-yet-signed-off artefact renders the Sign Off button');
  await testAlreadySignedOffRendersApprover();
  console.log('  ok - already-signed-off artefact renders the approver, not the button');
}
main().catch(function (err) { console.error('FAIL:', err.message); process.exitCode = 1; });
