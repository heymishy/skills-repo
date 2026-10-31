# Extract a shared mockReq/mockRes fixture module for journeys.js tests — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tfhc-s7`
**Worktree:** `.worktrees/tfhc-s7`
**Test command:** `npm test` (full suite) / individual files as named per task

---

## File map

```
Create:
  tests/helpers/journeys-fixture.js                              — shared mockReq/mockRes factory, default session = { tenantId } only (AC1)
  tests/check-journeys-fixture-self-test.js                      — self-test: source-derived field coverage + overrides merge (AC2)
  scripts/check-journeys-fixture-usage.js                        — structural check, broadened regex for ad-hoc inline literals (AC4)
  tests/fixtures/tfhc-s7-hand-rolled-mockreq.js                  — AC4 non-compliant fixture (ad-hoc inline literal, no factory)
  tests/fixtures/tfhc-s7-shared-fixture-usage.js                 — AC4 compliant fixture (uses journeysFixture())

Modify:
  tests/check-ep3-s2-journey-health.js                           — migrate its one inline session literal to journeysFixture() (AC3)
  skills/review/SKILL.md                                         — add Category H section; bump category count at BOTH locations (AC5)
```

---

## Task 1: Write the shared fixture module (AC1)

**Files:**
- Create: `tests/helpers/journeys-fixture.js`

**Model routing:** fast/cheap (mechanical, single-field factory, no judgment call)

- [ ] **Step 1: Write the failing test**

Create `tests/check-journeys-fixture-self-test.js` with this first test only (more tests added in Task 2):

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

// AC1: default session fields independently re-derived from journeys.js source at test time,
// not hardcoded or copy-pasted from journey.js's or skills.js's own field list.
test('journeysFixture() default session includes every field journeys.js actually reads (independently re-derived via source scan)', () => {
  const journeysSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'web-ui', 'routes', 'journeys.js'), 'utf8');
  const fieldMatches = journeysSource.match(/req\.session\.([a-zA-Z]+)/g) || [];
  const realFields = Array.from(new Set(fieldMatches.map((m) => m.replace('req.session.', ''))));
  assert.ok(realFields.length > 0, 'expected to find at least one req.session.<field> read in journeys.js');
  const { journeysFixture } = require('./helpers/journeys-fixture');
  const req = journeysFixture();
  realFields.forEach((field) => {
    assert.ok(req.session[field] !== undefined && req.session[field] !== null, `session.${field} (read by journeys.js) must be defined`);
  });
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

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-journeys-fixture-self-test.js
```

Expected output: `Error: Cannot find module './helpers/journeys-fixture'` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// tfhc-s7: shared mockReq/mockRes fixture for journeys.js-touching tests.
// Default session shape matches journeys.js's real req.session reads --
// grounded in the route code itself (grep -n "req\.session\." src/web-ui/routes/journeys.js),
// which reads exactly one field: tenantId. Deliberately does NOT include
// csrfToken, accessToken, login, userId, or role -- journeys.js's own
// handlers never read those; csrfToken is read separately by the CSRF
// middleware wrapping CSRF-guarded routes, not by journeys.js itself,
// matching journey-fixture.js's own precedent of excluding it from the default.

function journeysFixture(overrides) {
  overrides = overrides || {};
  var defaultSession = {
    tenantId: 'org-1'
  };
  var merged = Object.assign(
    { params: {}, query: {}, body: {}, url: '/' },
    overrides
  );
  merged.session = Object.assign({}, defaultSession, overrides.session || {});
  return merged;
}

function journeysFixtureRes() {
  var _status = null;
  var _body = null;
  var _headers = null;
  return {
    writeHead: function(code, headers) { _status = code; _headers = headers; },
    end: function(body) { _body = body; },
    _get: function() { return { status: _status, body: _body, headers: _headers }; }
  };
}

module.exports = { journeysFixture: journeysFixture, journeysFixtureRes: journeysFixtureRes };
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-journeys-fixture-self-test.js
```

Expected output: `✓ journeysFixture() default session includes every field journeys.js actually reads (independently re-derived via source scan)` then `Passed: 1 / Failed: 0`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: 815 files run (814 + this new test file), same pre-existing `[C3]` flag only, no new failures.

- [ ] **Step 6: Commit**

```bash
git add tests/helpers/journeys-fixture.js tests/check-journeys-fixture-self-test.js
git commit -m "feat(tfhc-s7): add shared journeys-fixture module, default session = tenantId only"
```

---

## Task 2: Extend the self-test — overrides and fresh-object robustness (AC2)

**Files:**
- Modify: `tests/check-journeys-fixture-self-test.js`

**Model routing:** fast/cheap

- [ ] **Step 1: Write the failing test**

Add these two tests to `tests/check-journeys-fixture-self-test.js`, after the existing test and before the `console.log('\n── Summary ──')` block:

```javascript
// AC1 (robustness): fresh object per call, no shared reference leaking mutations across tests.
test('journeysFixture() returns a fresh object on every call, not a shared reference', () => {
  const { journeysFixture } = require('./helpers/journeys-fixture');
  const first = journeysFixture();
  first.session.tenantId = 'mutated-by-first-call';
  const second = journeysFixture();
  assert.notStrictEqual(second.session.tenantId, 'mutated-by-first-call');
});

// AC2: overrides merge correctly without discarding other defaults.
test('journeysFixture(overrides) merges a params override without discarding the default session', () => {
  const { journeysFixture } = require('./helpers/journeys-fixture');
  const req = journeysFixture({ params: { id: 'j1' } });
  assert.strictEqual(req.params.id, 'j1');
  assert.ok(req.session.tenantId, 'tenantId must still be present after a params-only override');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-journeys-fixture-self-test.js
```

Expected output: both new tests `FAIL` only if the implementation is wrong — since Task 1's implementation already handles this correctly (it was written knowing these tests would follow), run this before Task 1's Step 6 commit if executing strictly red-green; if Task 1 is already committed, this step instead serves as a non-regression confirmation. Either way, confirm here it prints `✓` for all 3 tests, not `✗`.

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: same as Task 1 Step 5.

- [ ] **Step 4: Commit**

```bash
git add tests/check-journeys-fixture-self-test.js
git commit -m "test(tfhc-s7): add overrides-merge and fresh-object self-test cases"
```

---

## Task 3: Migrate the proof-of-pattern file (AC3)

**Files:**
- Modify: `tests/check-ep3-s2-journey-health.js`

**Model routing:** fast/cheap (single-line literal replacement)

- [ ] **Step 1: Capture the baseline**

```bash
node tests/check-ep3-s2-journey-health.js
```

Expected output: `[ep3-s2-journey-health] Results: 6 passed, 0 failed`. Record this as the baseline.

- [ ] **Step 2: Replace the inline literal**

In `tests/check-ep3-s2-journey-health.js`, find:

```javascript
var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };
```

Replace with:

```javascript
var journeysFixture = require('./helpers/journeys-fixture').journeysFixture;
var req = journeysFixture({ params: { id: 'j1' } });
```

(Add the `require` line once, near the file's other top-level requires — not inline at the point of use.)

- [ ] **Step 3: Run test — must still pass, same count**

```bash
node tests/check-ep3-s2-journey-health.js
```

Expected output: `[ep3-s2-journey-health] Results: 6 passed, 0 failed` — identical to Step 1's baseline.

- [ ] **Step 4: Run full suite — no regressions**

```bash
npm test
```

Expected output: same as Task 1 Step 5.

- [ ] **Step 5: Commit**

```bash
git add tests/check-ep3-s2-journey-health.js
git commit -m "refactor(tfhc-s7): migrate check-ep3-s2-journey-health.js to shared journeys-fixture"
```

---

## Task 4: Write the structural check and its AC4 fixtures (AC4)

**Files:**
- Create: `scripts/check-journeys-fixture-usage.js`
- Create: `tests/fixtures/tfhc-s7-hand-rolled-mockreq.js`
- Create: `tests/fixtures/tfhc-s7-shared-fixture-usage.js`

**Model routing:** fast/cheap (grep-based pattern match, mirrors existing precedent exactly)

- [ ] **Step 1: Write the failing test fixtures first**

Create `tests/fixtures/tfhc-s7-hand-rolled-mockreq.js`:

```javascript
// Non-compliant example fixture for tfhc-s7's own tests: requires journeys.js
// and uses an ad-hoc inline session literal instead of the shared fixture --
// this is the real pattern tfhc-s5's spike found (0 of 30 consumers use even
// a local factory function, unlike journey.js's/skills.js's own hand-rolled
// mockReq precedent), so this fixture must NOT use a mockReq() function.
'use strict';
var journeysRoutes = require('../../src/web-ui/routes/journeys');

var req = { session: { tenantId: 't1' }, params: { id: 'j1' } };

module.exports = { req: req };
```

Create `tests/fixtures/tfhc-s7-shared-fixture-usage.js`:

```javascript
// Compliant example fixture for tfhc-s7's own tests: requires journeys.js
// and correctly uses the shared fixture module instead of hand-rolling.
'use strict';
var journeysRoutes = require('../../src/web-ui/routes/journeys');
var journeysFixture = require('../helpers/journeys-fixture').journeysFixture;

var req = journeysFixture();

module.exports = { req: req };
```

- [ ] **Step 2: Run the check against both fixtures — must fail for the check script not existing yet**

```bash
node scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-hand-rolled-mockreq.js
```

Expected output: `Error: Cannot find module` (script does not exist yet).

- [ ] **Step 3: Write minimal implementation**

```javascript
'use strict';

// tfhc-s7: flags a test file that requires journeys.js and either defines
// its own local mockReq, OR (the real pattern found by tfhc-s5's spike --
// 0 of 30 real consumers use even a local factory) hand-rolls an ad-hoc
// inline `const req = { session: {...} }` literal, instead of importing the
// shared fixture module from tests/helpers/journeys-fixture.js. Same shape
// as scripts/check-journey-fixture-usage.js / check-skills-fixture-usage.js
// -- deliberately not a different convention -- with the detection regex
// broadened per tfhc-s5's own finding.

const fs = require('fs');
const path = require('path');

const JOURNEYS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/journeys['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/journeys-fixture['"]\)/;
const HAND_ROLLED_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function)|(?:const|var|let)\s+req\s*=\s*\{[^}]*session\s*:)/;

// ── scanFileForHandRolledFixture ─────────────────────────────────────────────
// Reads the file at filePath. If it touches journeys.js (requires the route
// module) AND has a hand-rolled mockReq function OR an ad-hoc inline session
// literal AND does not import the shared fixture module, returns a finding
// naming the file and the fix. Returns [] if the file doesn't touch
// journeys.js at all, or already uses the shared fixture, or has no
// hand-rolled pattern.
function scanFileForHandRolledFixture(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const touchesJourneys = JOURNEYS_ROUTE_REQUIRE_PATTERN.test(content);
  if (!touchesJourneys) {
    return [];
  }

  const usesSharedFixture = SHARED_FIXTURE_REQUIRE_PATTERN.test(content);
  if (usesSharedFixture) {
    return [];
  }

  const handRolled = HAND_ROLLED_PATTERN.test(content);
  if (!handRolled) {
    return [];
  }

  return [{
    file: filePath,
    message: 'Hand-rolled mockReq or ad-hoc inline session literal found in a journeys.js-touching file. Use the shared fixture from tests/helpers/journeys-fixture.js instead.'
  }];
}

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.error('Usage: node scripts/check-journeys-fixture-usage.js <file>');
    process.exit(1);
  }

  try {
    const findings = scanFileForHandRolledFixture(path.resolve(targetFile));

    if (findings.length === 0) {
      console.log(`check-journeys-fixture-usage PASS: no hand-rolled fixture found in ${targetFile}`);
      process.exit(0);
    }

    console.error(`check-journeys-fixture-usage FAIL: hand-rolled fixture found in ${targetFile}`);
    findings.forEach((finding) => console.error(`  ${finding.file}: ${finding.message}`));
    process.exit(1);
  } catch (err) {
    console.error(`check-journeys-fixture-usage.js error: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-hand-rolled-mockreq.js
node scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-shared-fixture-usage.js
```

Expected output: first command exits 1, prints `check-journeys-fixture-usage FAIL: hand-rolled fixture found in tests/fixtures/tfhc-s7-hand-rolled-mockreq.js` naming the shared fixture as the fix. Second command exits 0, prints `check-journeys-fixture-usage PASS: no hand-rolled fixture found in tests/fixtures/tfhc-s7-shared-fixture-usage.js`.

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same as Task 1 Step 5 (the two new fixture files are not auto-run by `run-all-tests.js` since they export data, not a `check-*.js` test entry point — confirm this is the case by checking the runner only picks up `tests/check-*.js` files, which these two deliberately are not named as).

- [ ] **Step 6: Commit**

```bash
git add scripts/check-journeys-fixture-usage.js tests/fixtures/tfhc-s7-hand-rolled-mockreq.js tests/fixtures/tfhc-s7-shared-fixture-usage.js
git commit -m "feat(tfhc-s7): add check-journeys-fixture-usage.js structural check with broadened inline-literal detection"
```

---

## Task 5: Wire Category H into /review (AC5)

**Files:**
- Modify: `skills/review/SKILL.md`

**Model routing:** balanced (requires correctly updating 2 separate locations — the exact two-location requirement that tripped up `tfhc-s3`'s own implementer)

- [ ] **Step 1: Update the Step 1 announcement line**

Find (near the top of the file, in Step 1's "Session recovery check" area):

```
> Reviewing all [n] stories, all 7 categories (A–G).
```

Replace with:

```
> Reviewing all [n] stories, all 8 categories (A–H).
```

- [ ] **Step 2: Update the rssp-s1 operational instruction**

Find:

```
**rssp-s1 (2026-08-31):** Never ask "review all stories, or a specific one?" and never ask "which review categories should I run?" — both were confirmed, twice over (2026-08-06, 2026-08-07), as unwanted friction: always run all 7 categories (A–G) against every story in scope, state it as a fact, and proceed directly into Step 2.
```

Replace `all 7 categories (A–G)` with `all 8 categories (A–H)` (keep the rest of the sentence unchanged).

- [ ] **Step 3: Add the Category H section**

Immediately after Category G's own section (after its score line, before the `---` that follows it), insert:

```markdown
### Category H: journeys.js fixture hygiene

Applies only when a story's touched files include a test file that requires `src/web-ui/routes/journeys` (directly or transitively via a fixture). If no touched file matches, state "Category H: N/A — no journeys.js-touching file in scope" and skip.

For each journeys.js-touching test file in the story's scope, run: `node scripts/check-journeys-fixture-usage.js <file>`.

HIGH: none — this check never blocks /test-plan on its own
MEDIUM: the check reports a hand-rolled `mockReq` or ad-hoc inline session literal instead of the shared fixture (`tests/helpers/journeys-fixture.js`) — name the file and recommend the fix
LOW: none

**journeys.js fixture hygiene score (1–5):** [score] — [one-line justification. 5 if no finding or N/A; 3 if a MEDIUM finding is present but acknowledged.]
```

- [ ] **Step 4: Run the verification test**

```bash
node -e "const fs=require('fs'); const t=fs.readFileSync('skills/review/SKILL.md','utf8'); console.log(/8 categories \(A–H\)/.test(t) ? 'BOTH_OK' : 'MISSING'); console.log((t.match(/8 categories \(A–H\)/g)||[]).length);"
```

Expected output: `BOTH_OK` then `2` (confirming both locations were updated, not just one — this is the exact check that would have caught `tfhc-s3`'s own missed-location defect before it reached code-quality review).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: same as Task 1 Step 5 (this is a documentation-only change to a `.md` file, not picked up by the test runner at all).

- [ ] **Step 6: Commit**

```bash
git add skills/review/SKILL.md
git commit -m "docs(tfhc-s7): wire journeys.js fixture hygiene as Category H in /review, update category count at both locations"
```

---

## Notes for the executing agent

- `journeys.js`'s real session shape is exactly `{ tenantId }` — do not add `accessToken`/`login`/`userId`/`role`/`csrfToken` to the fixture's default, even though `journey.js`'s and `skills.js`'s own fixtures have those fields. This is a different, simpler shape by design, confirmed via direct grep of `src/web-ui/routes/journeys.js`.
- This is a Platform change policy (CLAUDE.md) item for Task 5's `skills/review/SKILL.md` edit — it is already correctly scoped to a feature-branch PR (this branch, `feature/tfhc-s7`), not a direct master commit.
- Open a draft PR when all tasks are done and `npm test` shows no new failures — do not mark ready for review.
- If an ambiguity arises that isn't covered by the ACs or tests, add a PR comment describing it and do not mark ready for review.
