'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  PASS: ${name}`); passed++; }
function fail(name, err) { console.error(`  FAIL: ${name}: ${err.message || err}`); failed++; }

const REPO_ROOT = path.join(__dirname, '..');
const REAL_SKILL_PATH = path.join(REPO_ROOT, 'skills', 'review', 'SKILL.md');
const BACKUP_PATH = path.join(os.tmpdir(), `skill-review-backup-${Date.now()}.md`);

(async function() {
  // AC1: real, live-computed hash of skills/review/SKILL.md
  try {
    delete require.cache[require.resolve('../src/web-ui/content/instruction-hash')];
    const { getInstructionHash } = require('../src/web-ui/content/instruction-hash');
    const raw = fs.readFileSync(REAL_SKILL_PATH);
    const expected = crypto.createHash('sha256').update(raw).digest('hex');
    const result = getInstructionHash();
    assert.strictEqual(result, expected, `expected the real hash (${expected}), got ${result}`);
    assert.notStrictEqual(result, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'must not be the SHA-256 of an empty string');
    pass('instructionHash_computesRealSha256_ofSkillsReviewSkillMd');
  } catch (e) { fail('instructionHash_computesRealSha256_ofSkillsReviewSkillMd', e); }

  // AC2: hero card doesn't claim "matches trace"; invites independent verification
  try {
    delete require.cache[require.resolve('../src/web-ui/routes/public')];
    const { handleRoot } = require('../src/web-ui/routes/public');
    const req = { session: {} };
    let body = null;
    const res = { setHeader: function() {}, writeHead: function() {}, end: function(data) { body = data; } };
    await handleRoot(req, res);
    assert(!body.includes('matches trace'), 'expected no "matches trace" claim in the rendered page');
    assert(body.includes('sha256sum skills/review/SKILL.md') || body.toLowerCase().includes('recompute'), 'expected the page to invite independent verification');
    assert(!body.includes('e3b0c4'), 'expected the old fabricated hash prefix to be gone entirely');
    pass('heroCard_doesNotClaimMatchesTrace_invitesIndependentVerification');
  } catch (e) { fail('heroCard_doesNotClaimMatchesTrace_invitesIndependentVerification', e); }

  // AC3: fails open to a safe fallback when the file is missing
  try {
    const hadFile = fs.existsSync(REAL_SKILL_PATH);
    if (hadFile) fs.renameSync(REAL_SKILL_PATH, BACKUP_PATH);
    try {
      delete require.cache[require.resolve('../src/web-ui/content/instruction-hash')];
      const { getInstructionHash } = require('../src/web-ui/content/instruction-hash');
      let result;
      let threw = false;
      try {
        result = getInstructionHash();
      } catch (e) {
        threw = true;
      }
      assert(!threw, 'expected getInstructionHash() not to throw when the file is missing');
      assert(result === null || typeof result === 'string', 'expected a safe fallback value, not a thrown error');
      pass('instructionHash_failsOpenToSafeFallback_whenFileMissing');
    } finally {
      if (hadFile) fs.renameSync(BACKUP_PATH, REAL_SKILL_PATH);
    }
  } catch (e) { fail('instructionHash_failsOpenToSafeFallback_whenFileMissing', e); }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
