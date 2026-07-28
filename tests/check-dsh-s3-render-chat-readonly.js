'use strict';
// check-dsh-s3-render-chat-readonly.js -- dsh-s3 Task 1: readOnly mode for
// renderChat(data) (src/web-ui/views/chat-view.js).
// artefacts/2026-07-28-durable-session-history/plans/dsh-s3-rebuild-breadcrumb-view-plan.md (Task 1)
// artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md (AC5)

var assert = require('assert');
var path   = require('path');
var fs     = require('fs');
var execSync = require('child_process').execSync;

var CHAT_VIEW_PATH = path.resolve(__dirname, '../src/web-ui/views/chat-view.js');
var REPO_ROOT       = path.resolve(__dirname, '..');

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    fn();
    passed++; console.log('  [PASS]', name);
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
  }
}

// A realistic, representative fixture covering every field renderChat reads:
// skillName/skillLabel/sessionId (form action + header), priorQA (thread
// messages incl. a model insight), draftSections (right-pane artefact
// content), pendingConfirmation (confirm banner), userInitial, modelLabel,
// and contextManifestHtml left at its default (undefined) so the built-in
// "no context loaded" manifest markup is exercised too.
function buildFixture() {
  return {
    skillName: 'discovery',
    skillLabel: 'Discovery',
    featureSlug: 'dsh-s3-rebuild-breadcrumb-view',
    sessionId: 'sess-fixture-123',
    questionIndex: 2,
    totalQuestions: 4,
    currentQuestion: 'What problem are we solving?',
    priorQA: [
      { question: 'What is the trigger?', answer: 'Users lose chat history on restart.', modelResponse: 'Noted -- durability gap.' },
      { question: 'Who is affected?', answer: 'Any operator revisiting a completed stage.' }
    ],
    draftSections: [
      { title: 'Problem statement', body: 'Session turns vanish once memory is gone.', state: 'drafted' },
      { title: 'Scope', body: '', state: 'pending' }
    ],
    pendingConfirmation: true,
    userInitial: 'H',
    modelLabel: 'claude-sonnet-5'
  };
}

// -- Load the pre-Task-1 version of chat-view.js from git HEAD (before this
// session's edit) into a scratch file, so the "no readOnly flag" assertion
// is a real diff against what renderChat produced before this change --
// not a smoke check or a hand-reasoned claim.
// The scratch file must live alongside the real chat-view.js (not os.tmpdir())
// so its relative requires ('../utils/html-shell', './components') still
// resolve; it is deleted again immediately after use.
function loadBaselineRenderChat() {
  var originalSource = execSync('git show HEAD:src/web-ui/views/chat-view.js', {
    cwd: REPO_ROOT, encoding: 'utf8'
  });
  var scratchPath = path.join(path.dirname(CHAT_VIEW_PATH), '.dsh-s3-baseline-chat-view.tmp.js');
  fs.writeFileSync(scratchPath, originalSource);
  try {
    try {
      delete require.cache[require.resolve(scratchPath)];
    } catch (_) {}
    var baseline = require(scratchPath);
    return baseline.renderChat;
  } finally {
    fs.unlinkSync(scratchPath);
  }
}

function loadCurrentRenderChat() {
  try { delete require.cache[require.resolve(CHAT_VIEW_PATH)]; } catch (_) {}
  return require(CHAT_VIEW_PATH).renderChat;
}

function main() {
  console.log('\n[dsh-s3] Task 1 -- renderChat readOnly mode');

  var fixture = buildFixture();
  var renderChat = loadCurrentRenderChat();

  // -- AC5: readOnly:true suppresses the input-form footer and client <script>
  console.log('\n[dsh-s3] AC5 -- readOnly:true output has no input control and no client script');
  {
    var readOnlyHtml = renderChat(Object.assign({}, fixture, { readOnly: true }));

    test('AC5: no <input tag present', function() {
      assert.strictEqual(/<input/i.test(readOnlyHtml), false, 'expected no <input> element in read-only output');
    });
    test('AC5: no <textarea tag present', function() {
      assert.strictEqual(/<textarea/i.test(readOnlyHtml), false, 'expected no <textarea> element in read-only output');
    });
    test('AC5: no <button type="submit" present', function() {
      assert.strictEqual(/<button[^>]*type=["']submit["']/i.test(readOnlyHtml), false, 'expected no submit button in read-only output');
    });
    test('AC5: no <script> tag present', function() {
      assert.strictEqual(/<script/i.test(readOnlyHtml), false, 'expected no <script> tag in read-only output');
    });
    // Sanity: readOnly output still carries the actual chat content -- proves
    // this isn't an empty-string / early-return shortcut masking the checks above.
    test('AC5 sanity: chat content is still present in read-only output', function() {
      assert.ok(readOnlyHtml.indexOf('What is the trigger?') !== -1, 'expected prior question text to still render');
      assert.ok(readOnlyHtml.indexOf('Users lose chat history on restart.') !== -1, 'expected prior answer text to still render');
    });
  }

  // -- Default (readOnly falsy/absent): byte-identical to pre-change behaviour
  console.log('\n[dsh-s3] Default -- no readOnly flag renders byte-identical to before this change');
  {
    var renderChatBaseline = loadBaselineRenderChat();
    var baselineHtml = renderChatBaseline(fixture);
    var currentDefaultHtml = renderChat(fixture);
    var currentExplicitFalseHtml = renderChat(Object.assign({}, fixture, { readOnly: false }));

    test('default (no readOnly key): output is byte-identical to the pre-change renderChat', function() {
      assert.strictEqual(currentDefaultHtml, baselineHtml);
    });
    test('explicit readOnly:false: output is byte-identical to the pre-change renderChat', function() {
      assert.strictEqual(currentExplicitFalseHtml, baselineHtml);
    });
    // The default path must still carry the live-chat input surface --
    // confirms the diff above isn't trivially true because both sides are empty.
    test('default output still contains the input form (regression guard on the guard itself)', function() {
      assert.ok(/<textarea/i.test(baselineHtml), 'expected baseline fixture to actually exercise the input form');
      assert.ok(/<textarea/i.test(currentDefaultHtml), 'expected default (non-read-only) output to keep the input form');
      assert.ok(/<script/i.test(currentDefaultHtml), 'expected default (non-read-only) output to keep the client script');
    });
  }

  console.log('\n--- dsh-s3 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
