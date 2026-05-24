# Verification Script: SC-05 — Add `skills init` command for atomic feature initialisation

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-05-skills-init.md`
**Test plan:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-05-skills-init-test-plan.md`
**Test file:** `tests/check-gpa-sc05-skills-init.js`

---

## AC1 — Valid slug creates a schema-correct stub atomically

**Step 1:** Run the command with a test slug (use a slug unlikely to collide with real features).
```bash
node bin/skills init gpa-sc05-verification-test --description "SC-05 verification test feature"
```
Expected: exits 0, prints a success message containing the slug.

**Step 2:** Confirm the new feature stub is in pipeline-state.json.
```bash
node -e "
const s = require('./.github/pipeline-state.json');
const f = s.features.find(f => f.slug === 'gpa-sc05-verification-test');
if (!f) { console.error('NOT FOUND'); process.exit(1); }
console.log('slug:', f.slug);
console.log('stage:', f.stage);
console.log('health:', f.health);
console.log('name:', f.name);
console.log('stories:', JSON.stringify(f.stories));
console.log('metrics:', JSON.stringify(f.metrics));
console.log('updatedAt:', f.updatedAt);
"
```
Expected output:
```
slug: gpa-sc05-verification-test
stage: discovery
health: green
name: SC-05 verification test feature
stories: []
metrics: []
updatedAt: <today ISO date>
```

**Step 3:** Confirm no `.tmp` file was left on disk.
```bash
test -f .github/pipeline-state.json.tmp && echo "TMP EXISTS — FAIL" || echo "no .tmp — OK"
```
Expected: `no .tmp — OK`

**Step 4:** Clean up the test stub (restore pipeline-state.json to its pre-verification state).
```bash
node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('.github/pipeline-state.json', 'utf8'));
s.features = s.features.filter(f => f.slug !== 'gpa-sc05-verification-test');
fs.writeFileSync('.github/pipeline-state.json', JSON.stringify(s, null, 2) + '\n', 'utf8');
console.log('Cleaned up test stub');
"
```

---

## AC2 — Duplicate slug exits non-zero with error message; state unchanged

**Step 5:** Attempt to init a slug that already exists (use `2026-05-24-governance-platform-architecture` which is in the state file).
```bash
node bin/skills init 2026-05-24-governance-platform-architecture
```
Expected: exits with non-zero exit code and prints an error containing the slug.
```bash
echo "Exit code: $?"
```
Expected: non-zero (1 or 2).

**Step 6:** Confirm pipeline-state.json was not modified (feature count unchanged, no new feature added).
```bash
node -e "
const s = require('./.github/pipeline-state.json');
const count = s.features.filter(f => f.slug === '2026-05-24-governance-platform-architecture').length;
console.log(count === 1 ? 'State unchanged — OK' : 'FAIL: unexpected change');
"
```
Expected: `State unchanged — OK`

---

## AC3 — Invalid slugs exit non-zero

**Step 7:** Test six invalid slug patterns. Each must exit non-zero.
```bash
# Space in slug
node bin/skills init "invalid slug"; echo "exit: $?"
# Slash in slug
node bin/skills init "invalid/slug"; echo "exit: $?"
# Path traversal attempt
node bin/skills init "../../etc/passwd"; echo "exit: $?"
# Underscore (not allowed)
node bin/skills init "invalid_slug"; echo "exit: $?"
# Leading hyphen
node bin/skills init "-leading-hyphen"; echo "exit: $?"
# Trailing hyphen
node bin/skills init "trailing-hyphen-"; echo "exit: $?"
```
Expected: all six exit with non-zero exit code and print a validation error.

**Step 8:** Confirm pipeline-state.json was not modified by any of the above invalid attempts (feature count and content unchanged).

---

## AC4 — check-pipeline-state-integrity reports 0 failures after init

**Step 9:** Re-run init with a clean test slug, then immediately run integrity check.
```bash
node bin/skills init gpa-sc05-integrity-test
node scripts/check-pipeline-state-integrity.js
echo "Exit: $?"
```
Expected: integrity script exits 0 and reports 0 failures.

**Step 10:** Clean up.
```bash
node -e "
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('.github/pipeline-state.json', 'utf8'));
s.features = s.features.filter(f => f.slug !== 'gpa-sc05-integrity-test');
fs.writeFileSync('.github/pipeline-state.json', JSON.stringify(s, null, 2) + '\n', 'utf8');
console.log('Cleaned up');
"
```

---

## AC5 — `node bin/skills` without arguments lists `init <slug>`

**Step 11:** Run the command without arguments.
```bash
node bin/skills
```
Expected: output includes `init <slug>` (or `init <slug> [--description "..."]`) with a one-line description. Exit code may be non-zero (expected for usage output).

---

## NFR — path traversal guard: slug-derived path cannot escape repoRoot

**Step 12 (automated by test plan NFR-T3):** Confirm the path traversal test is covered by the automated test file. Run:
```bash
node -e "
const test = require('fs').readFileSync('tests/check-gpa-sc05-skills-init.js', 'utf8');
const hasTraversal = test.includes('../') || test.includes('traversal');
console.log(hasTraversal ? 'Traversal test present — OK' : 'WARNING: traversal test not found');
"
```

---

## NFR — no .tmp left after any path (success or failure)

**Step 13:** After all steps above, confirm no `.tmp` file remains.
```bash
test -f .github/pipeline-state.json.tmp && echo "TMP EXISTS — FAIL" || echo "no .tmp — OK"
```
Expected: `no .tmp — OK`

---

## Run automated tests

**Step 14:** Run the full automated test suite for this story.
```bash
node tests/check-gpa-sc05-skills-init.js
```
Expected output (prefix `[gpa-sc05]`):
```
[gpa-sc05] Results: 14+ passed, 0 failed
```

**Step 15:** Run the full npm test suite.
```bash
npm test
```
Expected: exit 0, all suites `N passed, 0 failed`.

---

## Definition of done for this story

All steps above complete with no failures. PR merged to master.
