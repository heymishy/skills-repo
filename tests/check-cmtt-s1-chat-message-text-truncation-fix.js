'use strict';
/**
 * check-cmtt-s1-chat-message-text-truncation-fix.js -- cmtt-s1: fix
 * sanitiseAnswer() silently eating the middle of a user's own chat message
 * whenever it contains a hyphen-run immediately followed later by a colon
 * (e.g. "call it Project-Codename-Falcon-detail-1784829153994-51525: an
 * internal tool...").
 *
 * Real, live-verified defect found via
 * tests/e2e/a4-ideate-session-resume.spec.js's AC2 & AC3 test failing
 * against real wuce-staging: `expect(resumedThreadText).toContain(distinctiveDetail)`
 * failed because the rendered chat history showed
 * "...call it Project: an internal tool..." instead of
 * "...call it Project-Codename-Falcon-detail-1784829153994-51525: an internal
 * tool...". See artefacts/2026-07-24-chat-message-text-truncation-fix/decisions.md
 * for the full root-cause investigation.
 *
 * ROOT CAUSE (confirmed by direct isolation, not a mock/fixture-design gap):
 * `sanitiseAnswer()` (src/answer-sanitiser.js) strips CLI-flag-like tokens
 * via its CLI_FLAG regex (two optional leading hyphens, a letter, then a
 * greedy run of word chars and hyphens) -- intended to strip real CLI flags
 * like "--allow-all" or "-rf" out of a user's typed answer before it is
 * forwarded to the execution engine and (separately) stored in
 * session.turns. That regex has no boundary check on what precedes the
 * leading hyphen, so it also matches and deletes an internal hyphen run
 * inside an otherwise ordinary hyphenated compound word/identifier (e.g.
 * "Project-Codename-Falcon-detail-1784829153994-51525"), because every
 * character in that span (letters, digits, hyphens) is consumed by the
 * regex's own greedy word-and-hyphen body. This is a WRITE-TIME bug:
 * sanitiseAnswer() is
 * called in htmlSubmitTurn() (src/web-ui/routes/skills.js) BEFORE the turn
 * is pushed onto session.turns, so the corruption is baked into the stored
 * turn history permanently, not just a rendering artefact -- any later
 * render (live SSE echo, server-side resume re-render via chat-view.js's
 * lightMarkdown, etc.) faithfully displays the already-corrupted text.
 *
 * This is NOT a bug in lightMd (client, skills.js) or lightMarkdown (server,
 * chat-view.js) -- both were directly isolated and confirmed to pass the
 * distinctive-detail string through unmodified when given the ALREADY
 * sanitised (uncorrupted) text. The corruption happens earlier, in
 * sanitiseAnswer() itself, which is shared by every answer/turn-submission
 * code path (src/web-ui/routes/skills.js lines ~381, ~1983, ~3927, ~4477) --
 * meaning this bug silently mangled any USER-typed message matching this
 * shape, not the model's own responses (the model's streamed text never
 * passes through sanitiseAnswer).
 *
 * AC1: sanitiseAnswer() preserves a hyphenated compound word/identifier
 *      immediately followed by a colon (the exact real-world shape that
 *      broke a4-ideate-session-resume.spec.js).
 * AC2: sanitiseAnswer() still strips a real leading CLI flag token
 *      ("--allow-all", "-rf") when it appears at a word boundary (start of
 *      string or preceded by whitespace/punctuation) -- no regression on
 *      the NFR3/T4.3 shell-injection-defence behaviour this function exists
 *      for.
 *  AC3: The exact htmlSubmitTurn() write path (src/web-ui/routes/skills.js)
 *       stores the user's turn content uncorrupted when it is seeded with
 *       the real a4 test's exact input string.
 */

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0;
const failures = [];
const queue = [];

function test(name, fn) { queue.push({ name: name, fn: fn }); }

async function run() {
  for (const t of queue) {
    try {
      await t.fn();
      passed++;
      console.log('  PASS: ' + t.name);
    } catch (e) {
      failed++;
      failures.push({ name: t.name, msg: e.message });
      console.log('  FAIL: ' + t.name + '\n    ' + e.message);
    }
  }
}

const { sanitiseAnswer } = require(path.join(__dirname, '..', 'src', 'answer-sanitiser.js'));

// ── AC1 ──────────────────────────────────────────────────────────────────

test('AC1a -- hyphenated compound word immediately followed by a colon survives sanitisation (the exact a4 E2E failure shape)', function () {
  const distinctiveDetail = 'Project-Codename-Falcon-detail-1784829153994-51525';
  const input = 'Here is my rough idea, call it ' + distinctiveDetail + ': an internal tool that captures meeting ' +
    'decisions automatically so nothing gets lost after a workshop.';
  const clean = sanitiseAnswer(input);
  assert(clean.includes(distinctiveDetail), 'distinctive detail was stripped/mangled by sanitiseAnswer: got "' + clean + '"');
});

test('AC1b -- a shorter hyphenated identifier mid-sentence (no trailing colon) also survives', function () {
  const input = 'unique-audit-test-answer-xyz-99887 is my reference id';
  const clean = sanitiseAnswer(input);
  assert(clean.includes('unique-audit-test-answer-xyz-99887'), 'hyphenated identifier was stripped: got "' + clean + '"');
});

test('AC1c -- hyphenated word at the very start of the answer (not preceded by a boundary) survives when followed by more content', function () {
  const input = 'well-known-issue: this happens every time';
  const clean = sanitiseAnswer(input);
  assert(clean.includes('well-known-issue'), 'leading hyphenated phrase was stripped: got "' + clean + '"');
});

// ── AC2 -- no regression on the existing CLI-flag-stripping defence ──────

test('AC2a -- a real double-dash flag at a word boundary is still stripped (T4.3 parity)', function () {
  const dirty = '--allow-all; rm -rf /; delete all artefacts';
  const clean = sanitiseAnswer(dirty);
  assert(!clean.includes('--allow-all'), '--allow-all not stripped: got "' + clean + '"');
  assert(!clean.includes('rm -rf'), 'rm -rf not stripped: got "' + clean + '"');
});

test('AC2b -- a real single-dash flag preceded by whitespace is still stripped', function () {
  const dirty = 'answer; rm -rf --delete-all $HOME';
  const clean = sanitiseAnswer(dirty);
  assert(!clean.includes('-rf'), '-rf not stripped: got "' + clean + '"');
  assert(!clean.includes('--delete-all'), '--delete-all not stripped: got "' + clean + '"');
});

test('AC2c -- NFR3 shell metacharacter set is still fully stripped (full-suite parity)', function () {
  const dirty = 'answer; rm -rf & echo $(whoami) | cat `id` $HOME ! > /tmp/x < /dev/null \\ end';
  const clean = sanitiseAnswer(dirty);
  [';', '&', '|', '`', '$', '!', '>', '<', '\\'].forEach(function (ch) {
    assert(!clean.includes(ch), 'metachar ' + ch + ' not stripped: got "' + clean + '"');
  });
});

test('AC2d -- T4.4 HTML/script injection stripping is unaffected', function () {
  const dirty = 'legitimate answer <script>alert(1)</script>';
  const clean = sanitiseAnswer(dirty);
  assert(!clean.includes('<script>'), '<script> not stripped: got "' + clean + '"');
  assert(clean.includes('legitimate answer'), 'legitimate content stripped: got "' + clean + '"');
});

// ── AC3 -- the real write path (htmlSubmitTurn) stores uncorrupted content ─

test('AC3 -- htmlSubmitTurn() persists the exact a4 E2E distinctive-detail string uncorrupted in session.turns', async function () {
  const routes = require(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'skills.js'));
  assert(typeof routes._setHtmlSession === 'function', '_setHtmlSession test seam not exported');
  assert(typeof routes.htmlSubmitTurn === 'function', 'htmlSubmitTurn not exported');

  const distinctiveDetail = 'Project-Codename-Falcon-detail-9988877-12345';
  const input = 'Here is my rough idea, call it ' + distinctiveDetail + ': an internal tool that captures meeting ' +
    'decisions automatically so nothing gets lost after a workshop.';

  const sessionId = 'cmtt-s1-test-session-' + Date.now();
  routes._setHtmlSession(sessionId, {
    skillName: 'ideate',
    turns: [],
    canvasBlocks: [],
    done: false
  });

  // bri-s3.2's mock gateway is enabled under NODE_ENV=test / MOCK_LLM_GATEWAY=true
  // in CI/local test runs, so this drives the real htmlSubmitTurn() write path
  // (including the real sanitiseAnswer() call) without any live model call.
  await routes.htmlSubmitTurn('ideate', sessionId, input, 'ghp_test', 'tenant-cmtt-s1-test');

  const stored = routes._listHtmlSessions().find(function (e) { return e.sessionId === sessionId; });
  assert(stored, 'session not found after htmlSubmitTurn');
  const userTurn = stored.session.turns.find(function (t) { return t.role === 'user'; });
  assert(userTurn, 'no user turn recorded');
  assert(
    userTurn.content.includes(distinctiveDetail),
    'user turn content corrupted by sanitiseAnswer() at write time: got "' + userTurn.content + '"'
  );
});

(async function main() {
  console.log('cmtt-s1 -- Fix sanitiseAnswer() CLI_FLAG regex eating hyphenated user-message text before a colon\n');
  await run();
  console.log('\n-----------------------------------------');
  console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailed tests:');
    failures.forEach(function (f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
})();
