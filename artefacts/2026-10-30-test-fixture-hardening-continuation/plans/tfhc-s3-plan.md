# Extract a shared mockReq/mockRes fixture module for skills.js tests — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Build a shared `skillsFixture`/`skillsFixtureRes` module for `skills.js`-touching tests, a dedicated self-test, a structural usage checker, one proof-of-pattern migration, and a new `/review` finding category — mirroring `tsir-s1`/`s2`/`s3`'s proven mechanism for `journey.js`.
**Branch:** `feature/tfhc-s3`
**Worktree:** `.worktrees/tfhc-s3`
**Test command:** `npm test` (full suite) / `node tests/check-<file>.js` (single file) / `node scripts/check-skills-fixture-usage.js <file>` (structural check)

---

## File map

```
Create:
  tests/helpers/skills-fixture.js                    — shared mockReq/mockRes factory for skills.js tests
  tests/check-skills-fixture-self-test.js            — self-test for the fixture module (AC1, AC2, NFR-perf)
  scripts/check-skills-fixture-usage.js               — structural checker (same shape as check-journey-fixture-usage.js)
  tests/fixtures/tfhc-s3-hand-rolled-mockreq.js       — non-compliant example fixture (AC4 test data)
  tests/fixtures/tfhc-s3-shared-fixture-usage.js      — compliant example fixture (AC4 test data)

Modify:
  tests/check-dic1-story-cards.js                     — migrate T13's hand-rolled mockReq/mockRes (lines 169-177) to the shared fixture
  skills/review/SKILL.md                               — add Category G: skills.js fixture hygiene, mirroring Category F
```

**Grounding performed before writing this plan:**
- Independently re-derived `skills.js`'s real `req.session` field reads via `grep -n "req\.session\." src/web-ui/routes/skills.js`: `tenantId` (line 112), `accessToken` (line 343), `userId` (line 420), `login` (line 1177), `role` (line 4948) — confirmed identical field set to `journey.js`'s own fixture, matching the story's own claim.
- Read `tests/check-dic1-story-cards.js` in full. T13 (lines 159-203) is the only block using a hand-rolled `mockReq`/`mockRes`: `const mockReq = { session: {...}, params: {...} }` (object literal, not a function) and `const mockRes = { _html: null, writeHead: function() {}, end: function(h) { this._html = h; } }` (direct `_html` property access, not a `_get()` accessor).
- Read `handleGetChatHtml` (skills.js:4780-4859) in full. It reads `req.session.accessToken` (redirect guard), `req.session.login` (only inside an `if (session.journeyId)` branch — the test's `_setHtmlSession` call sets `journeyId: null`, so this branch never executes), and `req.session.tenantId`/`req.session.login` again inside a PostHog snippet block gated by `if (_phKey)` (never true in this test — `POSTHOG_KEY` is never set). None of T13-T15's assertions check session-derived HTML content — only structural markup (`initCanvasInteractivity`, `card--inherited`, `draggable`, tooltip text, `ArrowUp`/`ArrowDown`, `pendingReorder`). The shared fixture's non-default `tenantId`/`login` values are therefore safe — no assertion depends on their specific values.
- Read `scripts/check-journey-fixture-usage.js` and `tests/helpers/journey-fixture.js` in full (this epic's own `tsir-s1`/`s3` precedent) — mirrored exactly for the new files below, swapping `journey` for `skills` throughout.
- Read `tests/fixtures/tsir-s3-hand-rolled-mockreq.js` and `tests/fixtures/tsir-s3-shared-fixture-usage.js` (the exact two-fixture AC4 test-data shape) — mirrored exactly.
- Read `tests/check-journey-fixture-self-test.js` (the self-test precedent) — this story's own test plan asks for one additional thing beyond that precedent: the self-test must *independently re-derive* the field list via its own `grep`-equivalent regex scan of `skills.js`'s source at test time, not hardcode a copied list. Designed accordingly below.
- Read `skills/review/SKILL.md` lines 190-200 (Category F, the exact section to mirror) and confirmed no other file (the review-report template is placeholder-based) needs updating for a new category.
- Confirmed the `check-journey-fixture-usage.js` hand-rolled-pattern regex (`(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function))`) already matches `check-dic1-story-cards.js`'s object-literal style (`const mockReq = {`) without modification — no regex change needed for the `skills` variant beyond swapping the route-require path.

---

## Task 1: Create the shared fixture module (AC1)

**Files:**
- Create: `tests/helpers/skills-fixture.js`

- [ ] **Step 1: Confirm the file does not exist yet**

```bash
test -f tests/helpers/skills-fixture.js && echo "EXISTS" || echo "does not exist (expected)"
```

**Expected output:** `does not exist (expected)`

- [ ] **Step 2: Write the fixture module**

```javascript
'use strict';

// tfhc-s3: shared mockReq/mockRes fixture for skills.js-touching tests.
// Default session shape matches skills.js's real req.session reads
// (login, tenantId, accessToken, userId, role) -- grounded in the route
// code itself (grep -n "req\.session\." src/web-ui/routes/skills.js),
// independently re-confirmed rather than copied from journey.js's own
// fixture, even though the field set happens to be identical.

function skillsFixture(overrides) {
  overrides = overrides || {};
  var defaultSession = {
    login: 'alice',
    tenantId: 't1',
    accessToken: 'tok-alice',
    userId: '1',
    role: 'user'
  };
  var merged = Object.assign(
    { params: {}, query: {}, body: {}, url: '/' },
    overrides
  );
  merged.session = Object.assign({}, defaultSession, overrides.session || {});
  return merged;
}

function skillsFixtureRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

module.exports = { skillsFixture: skillsFixture, skillsFixtureRes: skillsFixtureRes };
```

- [ ] **Step 3: Smoke-check it loads and returns the right shape**

```bash
node -e "const {skillsFixture}=require('./tests/helpers/skills-fixture'); console.log(JSON.stringify(skillsFixture().session))"
```

**Expected output:** `{"login":"alice","tenantId":"t1","accessToken":"tok-alice","userId":"1","role":"user"}`

- [ ] **Step 4: Commit**

```bash
git add tests/helpers/skills-fixture.js
git commit -m "feat(test): add shared skills-fixture module for skills.js tests"
```

---

## Task 2: Create the fixture self-test (AC1, AC2, NFR-perf, NFR-security)

**Files:**
- Create: `tests/check-skills-fixture-self-test.js`

- [ ] **Step 1: Write the self-test**

```javascript
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

// AC1: default session fields independently re-derived from skills.js source at test time,
// not hardcoded or copy-pasted from journey.js's own field list.
test('skillsFixture() default session includes every field skills.js actually reads (independently re-derived via source scan)', () => {
  const skillsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'skills.js'), 'utf8');
  const fieldMatches = skillsSource.match(/req\.session\.([a-zA-Z]+)/g) || [];
  const realFields = Array.from(new Set(fieldMatches.map((m) => m.replace('req.session.', ''))));
  assert.ok(realFields.length > 0, 'expected to find at least one req.session.<field> read in skills.js');
  const { skillsFixture } = require('./helpers/skills-fixture');
  const req = skillsFixture();
  realFields.forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} (read by skills.js) must be defined`);
  });
});

// AC1 (robustness): fresh object per call, no shared reference leaking mutations across tests.
test('skillsFixture() returns a fresh object on every call, not a shared reference', () => {
  const { skillsFixture } = require('./helpers/skills-fixture');
  const first = skillsFixture();
  first.session.tenantId = 'mutated-by-first-call';
  const second = skillsFixture();
  assert.notStrictEqual(second.session.tenantId, 'mutated-by-first-call');
});

// AC2: overrides merge correctly without discarding other defaults.
test('skillsFixture(overrides) merges an override without discarding other defaults', () => {
  const { skillsFixture } = require('./helpers/skills-fixture');
  const req = skillsFixture({ session: { tenantId: 'override-value' } });
  assert.strictEqual(req.session.tenantId, 'override-value');
  assert.ok(req.session.login, 'login must still be present after a partial override');
  assert.ok(req.session.accessToken, 'accessToken must still be present after a partial override');
  assert.ok(req.session.role, 'role must still be present after a partial override');
});

// NFR-perf / NFR-security: structural source checks, no timing-based assertions (pcr-s1 flakiness precedent).
test('skills-fixture.js source contains no network calls, filesystem writes, or shared mutable module state', () => {
  const source = fs.readFileSync(path.join(__dirname, 'helpers', 'skills-fixture.js'), 'utf8');
  assert.ok(!/require\(['"]https?['"]\)/.test(source), 'must not require http/https');
  assert.ok(!/fs\.writeFile/.test(source), 'must not write to the filesystem');
  const topLevelAssignment = /^(var|let)\s+\w+\s*=\s*(?!function)/m;
  assert.ok(!topLevelAssignment.test(source), 'must not declare shared mutable state at module level');
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
```

- [ ] **Step 2: Run it**

```bash
node tests/check-skills-fixture-self-test.js
```

**Expected output:** 4 lines of `✓`, then `Passed: 4` / `Failed: 0`, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add tests/check-skills-fixture-self-test.js
git commit -m "test: add self-test for skills-fixture module"
```

---

## Task 3: Migrate `tests/check-dic1-story-cards.js`'s T13 block (AC3)

**Files:**
- Modify: `tests/check-dic1-story-cards.js`

- [ ] **Step 1: Confirm current baseline**

```bash
node tests/check-dic1-story-cards.js
```

**Expected output (last line):** `[dic1-story-cards] Results: 36 passed, 0 failed` (run it once and record the actual number — the exact count does not matter, only that Step 3's re-run matches it exactly).

- [ ] **Step 2: Add the shared-fixture import**

Add directly below the existing `const { _renderDefinitionMapHtml } = require('../src/web-ui/routes/skills');` line (line 27):

```javascript
const { skillsFixture, skillsFixtureRes } = require('./helpers/skills-fixture');
```

- [ ] **Step 3: Replace the T13 hand-rolled mockReq/mockRes**

Replace:

```javascript
  let capturedHtml = null;
  const mockReq = {
    session: { accessToken: 'tok', userId: 1, login: 'user' },
    params:  { name: 'definition', id: SESSION_D1 }
  };
  const mockRes = {
    _html: null,
    writeHead: function() {},
    end: function(h) { this._html = h; }
  };
```

with:

```javascript
  let capturedHtml = null;
  const mockReq = skillsFixture({ params: { name: 'definition', id: SESSION_D1 } });
  const mockRes = skillsFixtureRes();
```

Then replace:

```javascript
  handleGetChatHtml(mockReq, mockRes).then(function() {
    const html = mockRes._html || '';
```

with:

```javascript
  handleGetChatHtml(mockReq, mockRes).then(function() {
    const html = mockRes._get().body || '';
```

- [ ] **Step 4: Re-run — must still pass with the same count**

```bash
node tests/check-dic1-story-cards.js
```

**Expected output (last line):** identical to Step 1's recorded count, 0 failed.

- [ ] **Step 5: Structural check — AC4 preview (checker doesn't exist yet until Task 4, so this step is deferred)**

Skip for now — `scripts/check-skills-fixture-usage.js` is built in Task 4. Re-run this file's own structural check as part of Task 4's verification instead.

- [ ] **Step 6: Commit**

```bash
git add tests/check-dic1-story-cards.js
git commit -m "refactor(test): migrate check-dic1-story-cards.js T13 to shared skills-fixture"
```

---

## Task 4: Create the structural checker and its AC4 test fixtures (AC4)

**Files:**
- Create: `scripts/check-skills-fixture-usage.js`
- Create: `tests/fixtures/tfhc-s3-hand-rolled-mockreq.js`
- Create: `tests/fixtures/tfhc-s3-shared-fixture-usage.js`

- [ ] **Step 1: Write the checker**

```javascript
'use strict';

// tfhc-s3: flags a test file that requires skills.js and defines its own
// local mockReq instead of importing the shared fixture module (tfhc-s3)
// from tests/helpers/skills-fixture.js. Same shape as
// scripts/check-journey-fixture-usage.js (export the detection function,
// plus a CLI wrapper) -- deliberately not a different convention.

const fs = require('fs');
const path = require('path');

const SKILLS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/skills['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/skills-fixture['"]\)/;
const HAND_ROLLED_MOCKREQ_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function))/;

// ── scanFileForHandRolledFixture ─────────────────────────────────────────────
// Reads the file at filePath. If it touches skills.js (requires the route
// module) AND defines its own local mockReq AND does not import the shared
// fixture module, returns a finding naming the file and the fix. Returns []
// if the file doesn't touch skills.js at all, or already uses the shared
// fixture, or has no hand-rolled mockReq pattern.
function scanFileForHandRolledFixture(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const touchesSkills = SKILLS_ROUTE_REQUIRE_PATTERN.test(content);
  if (!touchesSkills) {
    return [];
  }

  const usesSharedFixture = SHARED_FIXTURE_REQUIRE_PATTERN.test(content);
  if (usesSharedFixture) {
    return [];
  }

  const handRolled = HAND_ROLLED_MOCKREQ_PATTERN.test(content);
  if (!handRolled) {
    return [];
  }

  return [{
    file: filePath,
    message: 'Hand-rolled mockReq found in a skills.js-touching file. Use the shared fixture from tests/helpers/skills-fixture.js instead.'
  }];
}

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.error('Usage: node scripts/check-skills-fixture-usage.js <file>');
    process.exit(1);
  }

  try {
    const findings = scanFileForHandRolledFixture(path.resolve(targetFile));

    if (findings.length === 0) {
      console.log(`check-skills-fixture-usage PASS: no hand-rolled fixture found in ${targetFile}`);
      process.exit(0);
    }

    console.error(`check-skills-fixture-usage FAIL: hand-rolled fixture found in ${targetFile}`);
    findings.forEach((finding) => console.error(`  ${finding.file}: ${finding.message}`));
    process.exit(1);
  } catch (err) {
    console.error(`check-skills-fixture-usage.js error: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Write the non-compliant test fixture**

```javascript
// Non-compliant example fixture for tfhc-s3's own tests: requires skills.js
// and defines its own local mockReq instead of using the shared fixture.
'use strict';
var skillsRoutes = require('../../src/web-ui/routes/skills');

function mockReq(overrides) {
  return Object.assign({ session: { tenantId: 't1' } }, overrides || {});
}

module.exports = { mockReq: mockReq };
```

Save as `tests/fixtures/tfhc-s3-hand-rolled-mockreq.js`.

- [ ] **Step 3: Write the compliant test fixture**

```javascript
// Compliant example fixture for tfhc-s3's own tests: requires skills.js and
// correctly uses the shared fixture module instead of hand-rolling.
'use strict';
var skillsRoutes = require('../../src/web-ui/routes/skills');
var skillsFixture = require('../helpers/skills-fixture').skillsFixture;

var req = skillsFixture();

module.exports = { req: req };
```

Save as `tests/fixtures/tfhc-s3-shared-fixture-usage.js`.

- [ ] **Step 4: Run the checker against both fixtures**

```bash
node scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-hand-rolled-mockreq.js
```

**Expected output:** exit code 1, stderr prints `check-skills-fixture-usage FAIL: hand-rolled fixture found in tests/fixtures/tfhc-s3-hand-rolled-mockreq.js` and names `tests/helpers/skills-fixture.js` as the fix.

```bash
node scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-shared-fixture-usage.js
```

**Expected output:** exit code 0, `check-skills-fixture-usage PASS: no hand-rolled fixture found in tests/fixtures/tfhc-s3-shared-fixture-usage.js`

- [ ] **Step 5: Confirm the checker also now passes Task 3's migrated file**

```bash
node scripts/check-skills-fixture-usage.js tests/check-dic1-story-cards.js
```

**Expected output:** exit code 0, PASS message.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-skills-fixture-usage.js tests/fixtures/tfhc-s3-hand-rolled-mockreq.js tests/fixtures/tfhc-s3-shared-fixture-usage.js
git commit -m "feat(test): add check-skills-fixture-usage.js structural checker with AC4 fixtures"
```

---

## Task 5: Wire the checker into `/review` as Category G (AC5)

**Files:**
- Modify: `skills/review/SKILL.md`

- [ ] **Step 1: Confirm Category F's exact wording (precedent to mirror)**

```bash
grep -n "Category F" -A 10 skills/review/SKILL.md
```

**Expected output:** the existing 9-line Category F block (journey.js fixture hygiene), ending just before `## Full report output format`.

- [ ] **Step 2: Insert Category G immediately after Category F**

Insert this new section directly after Category F's closing line (`**Journey.js fixture hygiene score (1–5):** ...`) and before the `---` that precedes `## Full report output format`:

```markdown
### Category G: skills.js fixture hygiene

Applies only when a story's touched files include a test file that requires `src/web-ui/routes/skills` (directly or transitively via a fixture). If no touched file matches, state "Category G: N/A — no skills.js-touching file in scope" and skip.

For each skills.js-touching test file in the story's scope, run: `node scripts/check-skills-fixture-usage.js <file>`.

HIGH: none — this check never blocks /test-plan on its own
MEDIUM: the check reports a hand-rolled `mockReq` instead of the shared fixture (`tests/helpers/skills-fixture.js`) — name the file and recommend the fix
LOW: none

**skills.js fixture hygiene score (1–5):** [score] — [one-line justification. 5 if no finding or N/A; 3 if a MEDIUM finding is present but acknowledged.]
```

- [ ] **Step 3: Confirm the insertion**

```bash
grep -n "Category G" skills/review/SKILL.md
```

**Expected output:** a match on the new `### Category G: skills.js fixture hygiene` heading line, positioned after Category F and before `## Full report output format`.

- [ ] **Step 4: Commit**

```bash
git add skills/review/SKILL.md
git commit -m "docs(review): add Category G skills.js fixture hygiene check"
```

**Note:** per the DoR's explicit instruction, this file's edit goes through this story's own feature-branch PR with the same review bar as any other `SKILL.md` change — this is the standard inner-loop path already in use (no direct-to-master bookkeeping shortcut applies to this specific file).

---

## Task 6: Final verification — full regression + NFR-security scope check (AC3 confirm, NFR-security)

**Files:** None (verification only).

- [ ] **Step 1: Full regression suite — no new failures**

```bash
npm test 2>&1 | tail -6
```

**Expected output:** `812 file(s) run` (plus the 5 new files just added, so the real count will be 817 or 818 depending on whether `tests/fixtures/*.js` are picked up by the runner's own file discovery — note this and compare against whatever Task 1's `/branch-setup` baseline recorded as the pre-existing-failure set, not the raw file count). Only the already-documented pre-existing failure(s) (`scripts/check-pipeline-state-integrity.js`'s C3 flag, and/or `tests/check-pcr-s1-test-runner.js`'s perf flake) should appear — no new failures.

If the numbers differ from the `/branch-setup` baseline in any way other than these known files: stop, do not commit, investigate before proceeding.

- [ ] **Step 2: NFR-security — confirm no production code references the new test-only files**

```bash
grep -rl "skills-fixture\|check-skills-fixture-usage" src/ 2>&1 || echo "no matches (expected)"
```

**Expected output:** `no matches (expected)` — zero `require` references to either new file from any file under `src/`.

- [ ] **Step 3: No commit for this task — verification only**

Carry the confirmed numbers into `/verify-completion`'s AC table.

---

## AC coverage summary

| AC | Covered by |
|----|------------|
| AC1 | Task 1 (fixture module), Task 2 Step 2 (default-shape + fresh-object tests) |
| AC2 | Task 2 Step 2 (overrides-merge test, independently re-derived field list) |
| AC3 | Task 3 (migration), Task 6 Step 1 (regression confirm) |
| AC4 | Task 4 (checker + both fixtures) |
| AC5 | Task 5 (Category G wiring) |
