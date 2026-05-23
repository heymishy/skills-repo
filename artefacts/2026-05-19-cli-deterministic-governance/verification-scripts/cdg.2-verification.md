# AC Verification Script: H1-H9 DoR deterministic checks — complete coverage and ≥33 test fixtures

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.2-test-plan.md
**Author:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-05-23

---

## Purpose and Audience

This script serves three moments without modification:

1. **Pre-code sign-off:** A domain expert or operator reads this script and confirms the described behaviour is correct before the coding agent implements anything.
2. **Post-merge smoke test:** After cdg.2 merges, run these steps to confirm the shipped implementation matches the specification.
3. **Delivery review:** Structured walkthrough for stakeholders.

---

## Setup

**Prerequisites:**
- Node.js installed (`node --version` should return v18 or later)
- You are in the repository root: `c:\Users\Hamis\code\skills repo`
- `npm test` was passing before cdg.2 work began (confirm with the prior cdg.1 DoD state)

**Test runner (confirmed from package.json):** Plain Node.js — `node tests/check-cli-outer-loop.js` and `node tests/check-cli-governance.js`. No Jest, no Mocha.

**Confirm test runner:**
```powershell
cd "c:\Users\Hamis\code\skills repo"
node -e "const pkg=require('./package.json'); console.log(pkg.scripts.test.split(' && ').slice(-3).join('\n'))"
```
Expected: last 3 entries include `node tests/check-cli-outer-loop.js` and `node tests/check-cli-governance.js`.

---

## Scenario 1 — AC4: CLI rejects a story with fewer than 3 ACs

**What to check:** When `skills validate` is given a DoR artefact that references a story with only 2 acceptance criteria, the command exits non-zero and explains the problem.

**Step 1:** Run `npm test` from the repository root.

**Step 2:** In the test output, find the section labelled `[cli-outer-loop] T8 — H2 FAIL: story with fewer than 3 ACs` (or similar).

**Expected output:**
```
✓ T8a: exitCode === 2 for story with < 3 ACs
✓ T8b: stderr contains "H2 FAIL"
✓ T8c: stderr contains "minimum 3 ACs required"
```

**What broken behaviour looks like:** If any of the three assertions show `✗` (a cross), the H2 AC-count check is not implemented or is returning the wrong exit code. If T8a shows exit code 0 instead of 2, the check is not running.

**Reset:** No state is shared between scenarios — each test block is self-contained.

---

## Scenario 2 — AC5: CLI identifies the specific AC that fails Given/When/Then format

**What to check:** When a story's AC2 is written as plain text (no "Given", "When", or "Then" words), the command exits non-zero, names "H2 FAIL" in the error output, and identifies which AC number is the problem.

**Step 1:** Run `npm test`.

**Step 2:** Find the section labelled `[cli-outer-loop] T9 — H2 FAIL: AC missing Given/When/Then`.

**Expected output:**
```
✓ T9a: exitCode === 2 for AC missing GWT
✓ T9b: stderr contains "H2 FAIL"
✓ T9c: stderr contains "AC2" and "Given/When/Then"
```

**What broken behaviour looks like:** If T9c fails, the implementation reports a generic H2 failure but does not identify which AC number is the culprit. This is a specification violation — the operator must be told exactly which AC to fix.

---

## Scenario 3 — AC6: CLI detects benefit linkage that describes a technical dependency

**What to check:** When a story's Benefit Linkage section says something like "needed for the next feature to proceed" — a phrase that describes a technical dependency rather than a genuine user or business benefit — the command exits with exit code 5 and explains the problem.

**Step 1:** Run `npm test`.

**Step 2:** Find the section labelled `[cli-outer-loop] T10 — H5 FAIL: benefit linkage disqualifying phrase`.

**Expected output:**
```
✓ T10a: exitCode === 5 for disqualifying benefit linkage phrase
✓ T10b: stderr contains "H5 FAIL"
✓ T10c: stderr contains "technical dependency"
```

**What broken behaviour looks like:** If T10a shows exit code 0, the H5 check is not running. If T10b passes but T10c fails, the error message is present but does not use the expected wording — the DoD contract requires the exact string "technical dependency" in the output.

---

## Scenario 4 — AC7: Well-formed DoR passes all checks and exits cleanly

**What to check:** When the input is a DoR artefact that satisfies all H1-H9 checks (story exists, 3+ ACs in GWT format, out-of-scope populated, benefit linkage with a named metric, complexity rated, architecture constraints present), the command exits 0 and reports "validate OK".

**Step 1:** Run `npm test`.

**Step 2:** Find the section labelled `[cli-outer-loop] T11 — AC7: clean full DoR exits 0`.

**Expected output:**
```
✓ T11a: exitCode === 0 for well-formed DoR with all H-checks passing
```

**What broken behaviour looks like:** If T11a shows a non-zero exit code, the H2-H9 implementation is triggering a false positive against a well-formed story. Check which H-category is failing by reading `result.stderr` in the test output.

---

## Scenario 5 — AC2 + AC3: fixture count ≥33 enforced by governance check

**What to check:** The governance check in `check-cli-governance.js` counts the assertion calls in `check-cli-outer-loop.js` and confirms there are at least 33. This is the automated guard that prevents future contributors from removing test fixtures below the Phase 1 target.

**Step 1:** Run `npm test`.

**Step 2:** Find the section labelled `[cli-governance]` (scroll to the end of the `npm test` output).

**Expected output:**
```
✓ G2a: cli-outer-loop fixture count N meets minimum 33 (found: N)
✓ G2b: error message format verified in governance source
```

Where N is the actual count (≥33).

**What broken behaviour looks like:** If G2a fails with "found: 23", the new T8–T11 test blocks were not added to `check-cli-outer-loop.js`. If G2a shows a count ≥33 but G2b fails, the governance check source is missing the error message string.

---

## Scenario 6 — AC8: no regressions — all pre-existing tests still pass

**What to check:** After cdg.2 is merged, all tests from cdg.1 and earlier stories must still pass. The total passing count must be higher than before cdg.2 (more tests added, none removed).

**Step 1:** Run `npm test` and check the summary lines for each test file.

**Expected output (excerpts):**
```
=== check-cli-outer-loop results: N passed, 0 failed ===
=== check-cli-governance results: M passed, 0 failed ===
```

Where N ≥ 33 and M ≥ 5 (3 original G1 assertions + 2 new G2 assertions), and `0 failed` for both.

**What broken behaviour looks like:** Any non-zero `failed` count. If `check-cli-outer-loop` shows failed > 0, a regression was introduced. If the test count is lower than expected, test blocks may have been accidentally removed or the fixture cleanup is failing.

---

## Post-merge CLI smoke test

After cdg.2 is merged, you can also manually test the CLI with a real DoR artefact:

**Test H2 violation manually:**
```powershell
cd "c:\Users\Hamis\code\skills repo"
# Create a quick test file with only 1 AC
$content = "**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md`n`n## Acceptance Criteria`n**AC1:** Given something, when this, then that."
$content | Out-File -Encoding utf8 test-h2-minimal.md
node bin/skills validate test-h2-minimal.md definition-of-ready
# Expected: exit code 2, stderr says "H2 FAIL: minimum 3 ACs required"
Remove-Item test-h2-minimal.md
```

**Test H5 violation manually:**
```powershell
# Test with disqualifying benefit linkage phrase
$content = "**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md`n`n## Benefit Linkage`nThis story is needed for the next feature to proceed."
$content | Out-File -Encoding utf8 test-h5-minimal.md
node bin/skills validate test-h5-minimal.md definition-of-ready
# Expected: exit code 5, stderr says "H5 FAIL: benefit linkage describes a technical dependency"
Remove-Item test-h5-minimal.md
```

**Test clean DoR manually:**
```powershell
node bin/skills validate artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.2-dor.md definition-of-ready
# Expected: exit code 0, stdout says "validate OK: definition-of-ready — 0 violations found"
# (Assumes cdg.2 DoR artefact is complete and satisfies all H1-H9 checks)
```
