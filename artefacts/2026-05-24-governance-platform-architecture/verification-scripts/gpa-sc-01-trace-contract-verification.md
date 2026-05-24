# Verification Script: SC-01 — Write trace contract standards document

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-01-trace-contract.md`
**Test plan:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-01-trace-contract-test-plan.md`
**Test file:** `tests/check-gpa-sc01-trace-contract.js`

---

## AC1 — trace-contract.md exists and contains all 15 principles with 4-field depth

**Step 1:** Confirm the file exists.
```bash
test -f standards/governance/trace-contract.md && echo "EXISTS" || echo "MISSING"
```
Expected: `EXISTS`

**Step 2:** Count principle headings P01 through P15.
```bash
grep -c "^### P" standards/governance/trace-contract.md
```
Expected: `15` (or verify P01–P15 each appear once)

**Step 3:** Check that at minimum P01, P02, and P08 each have all four required fields — principle statement, responsible module, field/behaviour governed, and canonical source cross-reference. Read the document and verify by eye:
- P01: enforcement path principle — references `cli-outer-loop.js` or `governance-package.js`; source cross-reference to ADR or copilot-instructions.md
- P02: path traversal guard — includes exact pattern `path.resolve(inputPath).startsWith(repoRoot + path.sep)` and source `copilot-instructions.md "Path traversal guard for disk writes (ougl)"`
- P08: chain-hash principle — references the field or behaviour it governs in the trace file; cross-reference to relevant ADR or module

**Step 4:** Run the automated check.
```bash
node tests/check-gpa-sc01-trace-contract.js
```
Expected output (prefix `[gpa-sc01]`):
```
[gpa-sc01] Results: 7 passed, 0 failed
```

---

## AC2 — CONTRIBUTING.md references trace-contract.md

**Step 5:** Confirm the reference is present.
```bash
grep -n "trace-contract" CONTRIBUTING.md
```
Expected: at least one line containing `standards/governance/trace-contract.md`

---

## AC3 — npm test passes with no regression

**Step 6:** Run the full test suite.
```bash
npm test
```
Expected: all suites report `N passed, 0 failed`. Exit code 0.

---

## AC4 — P02 contains the exact path traversal validation pattern and copilot-instructions.md source

**Step 7:** Verify exact pattern text.
```bash
grep -n "startsWith(repoRoot" standards/governance/trace-contract.md
```
Expected: at least one matching line containing the validation pattern.

**Step 8:** Verify the source obligation is cited.
```bash
grep -n "ougl\|Path traversal guard for disk writes" standards/governance/trace-contract.md
```
Expected: at least one matching line referencing the copilot-instructions.md rule.

---

## NFR — all module path cross-references resolve to real files

**Step 9:** For each module path referenced in trace-contract.md (e.g. `src/enforcement/cli-outer-loop.js`, `scripts/ci-audit-comment.js`), confirm the file exists.
```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('standards/governance/trace-contract.md', 'utf8');
const paths = [...content.matchAll(/\`(src\/[^\`]+\.js|scripts\/[^\`]+\.js|\.github\/[^\`]+\.js)\`/g)].map(m=>m[1]);
const missing = [...new Set(paths)].filter(p => !fs.existsSync(p));
if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
else console.log('All', [...new Set(paths)].length, 'module path(s) resolve OK');
"
```
Expected: `All N module path(s) resolve OK`

---

## Definition of done for this story

All steps above complete with no failures. PR merged to master.
