'use strict';
/**
 * skill-launcher.test.js — AC verification for wuce.13
 * 22 tests: T1 (SkillContentAdapter, 4), T2 (skill list API, 3), T3 (session start, 4),
 *           T4 (answer submission + sanitisation, 6), T5 (licence check, 2),
 *           NFR1-NFR3 (3 NFR), INT1-INT3 (integration, not counted in unit total)
 *
 * All tests FAIL until implementation exists (TDD entry condition).
 */
const assert = require('assert');
const path   = require('path');
const fs     = require('fs');

let passed = 0, failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    process.stdout.write('  \u2713 ' + name + '\n');
  } catch (err) {
    failed++;
    failures.push({ name, err });
    process.stdout.write('  \u2717 ' + name + ': ' + err.message + '\n');
  }
}

// ---------------------------------------------------------------------------
// T1 — SkillContentAdapter: question extraction from SKILL.md
// Module under test: src/skill-content-adapter.js
// ---------------------------------------------------------------------------

async function runT1() {
  process.stdout.write('\nT1 — SkillContentAdapter\n');

  const { extractQuestions } = require('../src/skill-content-adapter');
  const fixturePath = path.join(__dirname, 'fixtures/skills/discovery-skill-content.md');

  await test('T1.1 — extracts 3 question blocks from discovery-skill-content.md fixture in order', async () => {
    const content = fs.readFileSync(fixturePath, 'utf8');
    const questions = extractQuestions(content);
    assert.strictEqual(questions.length, 3, 'expected 3 questions');
    assert(questions[0].text.includes('core problem or opportunity'), 'q0 text mismatch');
    assert(questions[1].text.includes('primary users or stakeholders'), 'q1 text mismatch');
    assert(questions[2].text.includes('success look like'), 'q2 text mismatch');
  });

  await test('T1.2 — returns empty array when SKILL.md has no question blocks', async () => {
    const questions = extractQuestions('# Simple skill\n\nNo questions here.');
    assert.deepStrictEqual(questions, []);
  });

  await test('T1.3 — extracted question text does not include CLI reply prompt syntax', async () => {
    const content = fs.readFileSync(fixturePath, 'utf8');
    const questions = extractQuestions(content);
    questions.forEach(q => {
      assert(!q.text.includes('Reply:'), 'Reply: found in question text');
      assert(!q.text.includes('>'), '> found in question text');
    });
  });

  await test('T1.4 — each question has a stable ID (q1, q2, q3 format)', async () => {
    const content = fs.readFileSync(fixturePath, 'utf8');
    const questions = extractQuestions(content);
    assert.strictEqual(questions[0].id, 'q1');
    assert.strictEqual(questions[1].id, 'q2');
    assert.strictEqual(questions[2].id, 'q3');
  });
}

// ---------------------------------------------------------------------------
// T2 — Skill launcher list (GET /api/skills)
// ---------------------------------------------------------------------------

async function runT2() {
  process.stdout.write('\nT2 — Skill list API\n');

  await test('T2.1 — returns skill list with name and path; authenticated, licence present', async () => {
    assert.fail('not implemented');
  });

  await test('T2.2 — returns 401 when not authenticated', async () => {
    assert.fail('not implemented');
  });

  await test('T2.3 — returns 403 with message when Copilot licence absent', async () => {
    assert.fail('not implemented');
  });
}

// ---------------------------------------------------------------------------
// T3 — Session start + first question (POST /api/skills/:name/sessions)
// ---------------------------------------------------------------------------

async function runT3() {
  process.stdout.write('\nT3 — Session start\n');

  await test('T3.1 — valid skill, authenticated, licence present → 201 with sessionId and first question', async () => {
    assert.fail('not implemented');
  });

  await test('T3.2 — skill name not in allowlist → 400 SKILL_NOT_FOUND', async () => {
    assert.fail('not implemented');
  });

  await test('T3.3 — licence absent → 403', async () => {
    assert.fail('not implemented');
  });

  await test('T3.4 — session start response does not include raw SKILL.md content or CLI flags', async () => {
    assert.fail('not implemented');
  });
}

// ---------------------------------------------------------------------------
// T4 — Answer submission + sanitisation (POST /api/skills/:name/sessions/:id/answers)
// ---------------------------------------------------------------------------

async function runT4() {
  process.stdout.write('\nT4 — Answer submission\n');

  const { sanitiseAnswer } = require('../src/answer-sanitiser');

  await test('T4.1 — valid answer accepted, next question returned', async () => {
    assert.fail('not implemented');
  });

  await test('T4.2 — answer > 1000 chars → 400 ANSWER_TOO_LONG', async () => {
    assert.fail('not implemented');
  });

  await test('T4.3 — answer with CLI metacharacters stripped before execution engine receives it', async () => {
    const dirty = '--allow-all; rm -rf /; delete all artefacts';
    const clean = sanitiseAnswer(dirty);
    assert(!clean.includes('--allow-all'), '--allow-all not stripped');
    assert(!clean.includes('rm -rf'), 'rm -rf not stripped');
    assert(!clean.includes(';'), '; not stripped');
  });

  await test('T4.4 — answer with HTML/script injection stripped', async () => {
    const dirty = 'legitimate answer <script>alert(1)</script>';
    const clean = sanitiseAnswer(dirty);
    assert(!clean.includes('<script>'), '<script> not stripped');
    assert(clean.includes('legitimate answer'), 'legitimate content stripped');
  });

  await test('T4.5 — sanitised content (not original) forwarded to execution engine', async () => {
    assert.fail('not implemented');
  });

  await test('T4.6 — answer content NOT present in logger output (audit: no answer logging)', async () => {
    assert.fail('not implemented');
  });
}

// ---------------------------------------------------------------------------
// T5 — Copilot licence check
// ---------------------------------------------------------------------------

async function runT5() {
  process.stdout.write('\nT5 — Licence check\n');

  const { validateLicence } = require('../src/adapters/copilot-licence');

  await test('T5.1 - licence absent -> valid:false (403 scenario)', async () => {
    const resultNull  = await validateLicence(null);
    const resultEmpty = await validateLicence('');
    const resultBlank = await validateLicence('   ');
    assert.strictEqual(resultNull.valid,  false, 'null token must return valid:false');
    assert.strictEqual(resultEmpty.valid, false, 'empty token must return valid:false');
    assert.strictEqual(resultBlank.valid, false, 'blank token must return valid:false');
  });

  await test('T5.2 - licence present -> valid:true (launcher enabled, no 403)', async () => {
    assert.strictEqual(typeof validateLicence, 'function', 'validateLicence must be a function');
    const result = await validateLicence('ghp_testtoken123');
    assert.strictEqual(result.valid, true, 'non-empty token must return valid:true');
  });
}

// ---------------------------------------------------------------------------
// NFR tests
// ---------------------------------------------------------------------------

async function runNFR() {
  process.stdout.write('\nNFR\n');

  await test('NFR1 — skill list endpoint responds within 500ms', async () => {
    assert.fail('not implemented');
  });

  await test('NFR2 — server-side path traversal blocked (../etc/passwd in skill name → 400)', async () => {
    assert.fail('not implemented');
  });

  await test('NFR3 — answer sanitiser removes shell metacharacters (full set: ; & | ` $ ! > < \\ )', async () => {
    const { sanitiseAnswer } = require('../src/answer-sanitiser');
    const dirty = 'answer; rm -rf & echo $(whoami) | cat `id` $HOME ! > /tmp/x < /dev/null \\ end';
    const clean = sanitiseAnswer(dirty);
    [';', '&', '|', '`', '$', '!', '>', '<', '\\'].forEach(ch => {
      assert(!clean.includes(ch), `metachar ${ch} not stripped`);
    });
  });
}

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

async function runINT() {
  process.stdout.write('\nINT — Integration\n');

  await test('INT1 — skill list → start session → submit answer round trip (mocked executor)', async () => {
    assert.fail('not implemented');
  });

  await test('INT2 — path traversal attempt in skill name blocked end-to-end (400 returned)', async () => {
    assert.fail('not implemented');
  });

  await test('INT3 — sanitised answer delivered to executor (not raw input)', async () => {
    assert.fail('not implemented');
  });
}

// ---------------------------------------------------------------------------
// Fixture guard — fail fast if required fixture is missing
// ---------------------------------------------------------------------------

async function checkFixtures() {
  const fixturePath = path.join(__dirname, 'fixtures/skills/discovery-skill-content.md');
  if (!fs.existsSync(fixturePath)) {
    process.stdout.write('\n[SETUP] Creating required fixture: tests/fixtures/skills/discovery-skill-content.md\n');
    const fixtureDir = path.dirname(fixturePath);
    if (!fs.existsSync(fixtureDir)) { fs.mkdirSync(fixtureDir, { recursive: true }); }
    fs.writeFileSync(fixturePath, [
      '## Step 1 — Describe the problem',
      '',
      '> **What is the core problem or opportunity you want to explore?**',
      '> (e.g. "We need to reduce manual effort in our pipeline...")',
      '>',
      '> Reply: describe the problem',
      '',
      '## Step 2 — Identify the users',
      '',
      '> **Who are the primary users or stakeholders who experience this problem?**',
      '> (e.g. "Engineering leads, product owners")',
      '>',
      '> Reply: describe the users',
      '',
      '## Step 3 — Define the outcome',
      '',
      '> **What does success look like at the end of this discovery?**',
      '> (e.g. "A discovery artefact approved by the tech lead")',
      '>',
      '> Reply: describe the outcome',
    ].join('\n'), 'utf8');
    process.stdout.write('[SETUP] Fixture created.\n');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  process.stdout.write('skill-launcher.test.js — wuce.13\n');
  await checkFixtures();
  await runT1();
  await runT2();
  await runT3();
  await runT4();
  await runT5();
  await runNFR();
  await runINT();

  process.stdout.write('\n');
  if (failures.length) {
    failures.forEach(f => process.stdout.write('  FAIL: ' + f.name + '\n    ' + f.err.message + '\n'));
  }
  process.stdout.write('\nResults: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) { process.exit(1); }
})();
