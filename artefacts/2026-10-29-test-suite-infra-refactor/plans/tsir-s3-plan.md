# Add a structural /review check flagging hand-rolled mockReq on journey.js-touching test files — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/tsir-s3`
**Worktree:** `.worktrees/tsir-s3`
**Test command:** `npm test` (full suite) / `node tests/check-tsir-s3-journey-fixture-usage-check.js` (this story's own tests)

---

## File map

```
Create:
  scripts/check-journey-fixture-usage.js                  — detection script (same shape as scripts/check-design-tokens.js)
  tests/fixtures/tsir-s3-hand-rolled-mockreq.js            — non-compliant fixture (hand-rolled mockReq)
  tests/fixtures/tsir-s3-shared-fixture-usage.js           — compliant fixture (uses tests/helpers/journey-fixture.js)
  tests/check-tsir-s3-journey-fixture-usage-check.js       — unit + integration tests for the check script (AC1, AC2, AC3, AC4)

Modify:
  skills/review/SKILL.md                                  — add Category F: Journey.js fixture hygiene (AC3)
```

**Grounding (confirmed by reading the real precedent before writing this plan):** `scripts/check-design-tokens.js` exports its detection function(s) (`module.exports = {...}`) plus a `if (require.main === module) {...}` CLI wrapper that prints `PASS`/`FAIL` and exits 0/1. This story's script follows that exact shape — do not invent a different CLI convention.

---

## Task 1: Build the detection script, its fixtures, and its own tests (AC1, AC2, AC4)

**Files:**
- Create: `scripts/check-journey-fixture-usage.js`
- Create: `tests/fixtures/tsir-s3-hand-rolled-mockreq.js`
- Create: `tests/fixtures/tsir-s3-shared-fixture-usage.js`
- Create: `tests/check-tsir-s3-journey-fixture-usage-check.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/check-tsir-s3-journey-fixture-usage-check.js
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
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

const HAND_ROLLED_FIXTURE = path.join(__dirname, 'fixtures', 'tsir-s3-hand-rolled-mockreq.js');
const SHARED_FIXTURE_USAGE = path.join(__dirname, 'fixtures', 'tsir-s3-shared-fixture-usage.js');

// AC1: flags a hand-rolled mockReq
test('scanFileForHandRolledFixture flags a file that hand-rolls its own mockReq', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journey-fixture-usage');
  const findings = scanFileForHandRolledFixture(HAND_ROLLED_FIXTURE);
  assert.ok(findings.length > 0, 'expected at least one finding');
  assert.ok(findings[0].file === HAND_ROLLED_FIXTURE);
});

// AC2: passes a file using the shared fixture
test('scanFileForHandRolledFixture finds nothing in a file using the shared fixture', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journey-fixture-usage');
  const findings = scanFileForHandRolledFixture(SHARED_FIXTURE_USAGE);
  assert.strictEqual(findings.length, 0);
});

// AC4: mutation-test -- toggling a real fixture file's content flips the result
test('toggling a temp copy from hand-rolled to shared-fixture-usage flips the check result', () => {
  const { scanFileForHandRolledFixture } = require('../scripts/check-journey-fixture-usage');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tsir-s3-'));
  const tmpFile = path.join(tmpDir, 'scratch-mockreq.js');

  fs.copyFileSync(HAND_ROLLED_FIXTURE, tmpFile);
  const before = scanFileForHandRolledFixture(tmpFile);
  assert.ok(before.length > 0, 'before: expected a finding on the unmodified hand-rolled copy');

  fs.copyFileSync(SHARED_FIXTURE_USAGE, tmpFile);
  const after = scanFileForHandRolledFixture(tmpFile);
  assert.strictEqual(after.length, 0, 'after: expected no finding once the file is edited to use the shared fixture');
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
node tests/check-tsir-s3-journey-fixture-usage-check.js
```

Expected output: `Cannot find module '../scripts/check-journey-fixture-usage'` (script and fixtures don't exist yet)

- [ ] **Step 3: Write minimal implementation**

```javascript
// tests/fixtures/tsir-s3-hand-rolled-mockreq.js
// Non-compliant example fixture for tsir-s3's own tests: requires journey.js
// and defines its own local mockReq instead of using the shared fixture.
'use strict';
var journeyRoutes = require('../../src/web-ui/routes/journey');

function mockReq(overrides) {
  return Object.assign({ session: { tenantId: 't1' } }, overrides || {});
}

module.exports = { mockReq: mockReq };
```

```javascript
// tests/fixtures/tsir-s3-shared-fixture-usage.js
// Compliant example fixture for tsir-s3's own tests: requires journey.js and
// correctly uses the shared fixture module from tsir-s1 instead of hand-rolling.
'use strict';
var journeyRoutes = require('../../src/web-ui/routes/journey');
var journeyFixture = require('../helpers/journey-fixture').journeyFixture;

var req = journeyFixture();

module.exports = { req: req };
```

```javascript
// scripts/check-journey-fixture-usage.js
'use strict';

// tsir-s3: flags a test file that requires journey.js and defines its own
// local mockReq instead of importing the shared fixture module from tsir-s1
// (tests/helpers/journey-fixture.js). Same shape as scripts/check-design-tokens.js
// (export the detection function, plus a CLI wrapper) -- deliberately not a
// different convention.

const fs = require('fs');
const path = require('path');

const JOURNEY_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/journey['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/journey-fixture['"]\)/;
const HAND_ROLLED_MOCKREQ_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function))/;

// ── scanFileForHandRolledFixture ─────────────────────────────────────────────
// Reads the file at filePath. If it touches journey.js (requires the route
// module) AND defines its own local mockReq AND does not import the shared
// fixture module, returns a finding naming the file and the fix. Returns []
// if the file doesn't touch journey.js at all, or already uses the shared
// fixture, or has no hand-rolled mockReq pattern.
function scanFileForHandRolledFixture(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const touchesJourney = JOURNEY_ROUTE_REQUIRE_PATTERN.test(content);
  if (!touchesJourney) {
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
    message: 'Hand-rolled mockReq found in a journey.js-touching file. Use the shared fixture from tests/helpers/journey-fixture.js instead.'
  }];
}

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.error('Usage: node scripts/check-journey-fixture-usage.js <file>');
    process.exit(1);
  }

  try {
    const findings = scanFileForHandRolledFixture(path.resolve(targetFile));

    if (findings.length === 0) {
      console.log(`check-journey-fixture-usage PASS: no hand-rolled fixture found in ${targetFile}`);
      process.exit(0);
    }

    console.error(`check-journey-fixture-usage FAIL: hand-rolled fixture found in ${targetFile}`);
    findings.forEach((finding) => console.error(`  ${finding.file}: ${finding.message}`));
    process.exit(1);
  } catch (err) {
    console.error(`check-journey-fixture-usage.js error: ${err.message}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tsir-s3-journey-fixture-usage-check.js
```

Expected output: `Passed: 3`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, no new failures (pre-existing `tests/check-pcr-s1-test-runner.js` flake may or may not appear, already RISK-ACCEPTed).

- [ ] **Step 6: Commit**

```bash
git add scripts/check-journey-fixture-usage.js tests/fixtures/tsir-s3-hand-rolled-mockreq.js tests/fixtures/tsir-s3-shared-fixture-usage.js tests/check-tsir-s3-journey-fixture-usage-check.js
git commit -m "feat(tsir-s3): add structural check for hand-rolled journey.js mockReq fixtures"
```

---

## Task 2: Wire the check into /review as Category F (AC3)

**Files:**
- Modify: `skills/review/SKILL.md`

- [ ] **Step 1: Write the failing test**

```javascript
// Add to tests/check-tsir-s3-journey-fixture-usage-check.js, before the Summary block:

test('skills/review/SKILL.md references check-journey-fixture-usage.js as a distinct finding category', () => {
  const reviewSkillPath = path.join(__dirname, '..', 'skills', 'review', 'SKILL.md');
  const content = fs.readFileSync(reviewSkillPath, 'utf8');
  assert.ok(content.includes('check-journey-fixture-usage.js'), 'SKILL.md must reference the check script');
  assert.ok(/Category F/.test(content), 'must be surfaced as a distinct category, not folded into an existing one');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-tsir-s3-journey-fixture-usage-check.js
```

Expected output: the new test fails (`skills/review/SKILL.md` has no "Category F" yet)

- [ ] **Step 3: Write minimal implementation**

In `skills/review/SKILL.md`:

1. After the existing `### Category E: Architecture compliance` section (ends just before `## Full report output format`), insert:

```markdown
### Category F: Journey.js fixture hygiene

Applies only when a story's touched files include a test file that requires `src/web-ui/routes/journey` (directly or transitively via a fixture). If no touched file matches, state "Category F: N/A — no journey.js-touching file in scope" and skip.

For each journey.js-touching test file in the story's scope, run: `node scripts/check-journey-fixture-usage.js <file>`.

HIGH: none — this check never blocks /test-plan on its own
MEDIUM: the check reports a hand-rolled `mockReq` instead of the shared fixture (`tests/helpers/journey-fixture.js`) — name the file and recommend the fix
LOW: none

**Journey.js fixture hygiene score (1–5):** [score] — [one-line justification. 5 if no finding or N/A; 3 if a MEDIUM finding is present but acknowledged.]
```

2. Update the two `all 5 categories (A–E)` references at lines ~64 and ~66 to `all 6 categories (A–F)`.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-tsir-s3-journey-fixture-usage-check.js
```

Expected output: `Passed: 4`, `Failed: 0`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing, no new failures.

- [ ] **Step 6: Commit**

```bash
git add skills/review/SKILL.md tests/check-tsir-s3-journey-fixture-usage-check.js
git commit -m "feat(tsir-s3): wire check-journey-fixture-usage.js into /review as Category F"
```
