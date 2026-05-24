# Verification Script: SC-04 — Write test output format standards document

**Story:** `artefacts/2026-05-24-governance-platform-architecture/stories/gpa-sc-04-test-output-format.md`
**Test plan:** `artefacts/2026-05-24-governance-platform-architecture/test-plans/gpa-sc-04-test-output-format-test-plan.md`
**Test file:** `tests/check-gpa-sc04-test-output-format.js`

---

## AC1 — test-output-format.md exists and contains the four required elements

**Step 1:** Confirm the file exists.
```bash
test -f standards/governance/test-output-format.md && echo "EXISTS" || echo "MISSING"
```
Expected: `EXISTS`

**Step 2:** Verify the required output prefix format is stated.
```bash
grep -n "suite-name\|suite-prefix" standards/governance/test-output-format.md
```
Expected: at least one line documenting the `[suite-name] Results: N passed, N failed` format.

**Step 3:** Verify the regex is quoted verbatim (read the regex from assurance-gate.yml and confirm it appears in the document).
```bash
# Read the regex from source
grep -n "suiteResult\|Results:" .github/scripts/run-assurance-gate.js | head -10
# Compare against what appears in test-output-format.md
grep -n "\\\\[" standards/governance/test-output-format.md | head -5
```
Expected: the regex string in the document matches the source.

**Step 4:** Verify a conforming example is present and labelled.
```bash
grep -in "conforming\|example" standards/governance/test-output-format.md
```
Expected: at least two labelled examples (conforming + non-conforming).

**Step 5:** Verify the silent-skip consequence is documented.
```bash
grep -in "silent\|skip\|not match" standards/governance/test-output-format.md
```
Expected: at least one line explaining that a non-conforming result is silently skipped by the assurance gate.

**Step 6:** Run the automated check.
```bash
node tests/check-gpa-sc04-test-output-format.js
```
Expected output (prefix `[gpa-sc04]`):
```
[gpa-sc04] Results: 7 passed, 0 failed
```

---

## AC2 — npm test passes with no regression

**Step 7:** Run the full test suite.
```bash
npm test
```
Expected: all suites report `N passed, 0 failed`. Exit code 0.

---

## AC3 — trw.1 reference and explanation are present

**Step 8:** Confirm the trw.1 reference is present.
```bash
grep -n "trw" standards/governance/test-output-format.md
```
Expected: at least one line referencing trw.1 or the trw1 prefix fix.

**Step 9:** Read the relevant paragraph and confirm it explains: (a) what the incorrect prefix was, (b) that it caused silent skip, and (c) the fix that was applied.

---

## AC4 — at least one labelled conforming example showing bracket format, and one non-conforming example

**Step 10:** Confirm both example types are explicitly labelled in the document. Read the document and look for clear "Conforming" or "Example — correct" and "Non-conforming" or "Example — incorrect" section markers or labels. The conforming example must show the full `[suite-name] Results: N passed, M failed` bracket format.

---

## NFR — regex in document matches assurance-gate.yml verbatim

**Step 11:** Extract the regex from `assurance-gate.yml` and compare against the document.
```bash
node -e "
const fs = require('fs');
const yaml = fs.readFileSync('.github/scripts/run-assurance-gate.js', 'utf8');
const doc = fs.readFileSync('standards/governance/test-output-format.md', 'utf8');
// Find suiteResult regex line in assurance-gate source
const m = yaml.match(/suiteResult\s*=\s*output\.match\((.+)\)/);
if (m) {
  const regexStr = m[1].trim();
  const escaped = regexStr.replace(/[.*+?^\${}()|[\]\\\\]/g, '\\\\$&');
  const found = doc.includes(regexStr.replace(/\\//g,''));
  console.log(found ? 'Regex present in document' : 'MISMATCH — regex not found verbatim in document');
}
"
```
Expected: `Regex present in document` (or equivalent manual confirmation)

---

## Definition of done for this story

All steps above complete with no failures. PR merged to master.
