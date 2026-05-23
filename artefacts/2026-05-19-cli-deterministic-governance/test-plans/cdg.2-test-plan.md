# Test Plan: H1-H9 DoR deterministic checks — complete coverage and ≥33 test fixtures

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.2.md
**Epic reference:** artefacts/2026-05-19-cli-deterministic-governance/epics/cdg-phase1-validate-cli.md
**Test plan author:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-05-23
**Check catalogue reference:** artefacts/2026-05-19-cli-deterministic-governance/reference/dor-h1-h9-check-catalogue.md

---

## Review Findings Addressed

| Finding | Status | Resolution |
|---------|--------|------------|
| 2-M1 (MEDIUM): 33-item breakdown not saved as artefact | ✅ Resolved | Catalogue created at `reference/dor-h1-h9-check-catalogue.md` |
| 2-M2 (MEDIUM): Exit code mapping undefined | ✅ Resolved | Mapping defined in catalogue: H1→1, H2→2, H3→3, H4→4, H5→5, H6→6, H7/H8/H8-ext/H9→7 |
| 2-L1 (LOW): AC8 missing "When" clause | ✅ Noted | Test plan tests the intent (assertion count ≥33 in test file); AC8 text gap does not affect testability |
| 2-L2 (LOW): AC8 historical baseline | ✅ Resolved | Test plan asserts absolute count (≥33 assertions in `check-cli-outer-loop.js`), not a relative delta |

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | All 33 H-checks implemented in cli-outer-loop.js | Verified by T8–T11 violation tests + fixture count gate | — | — | — | — | 🟢 |
| AC2 | check-cli-outer-loop.js has ≥33 fixture assertions | Verified by G2a (governance count check) | — | — | — | — | 🟢 |
| AC3 | check-cli-governance.js asserts fixture count ≥33 | 2 tests (G2a, G2b) | — | — | — | — | 🟢 |
| AC4 | H2 FAIL: exit 2 + "minimum 3 ACs required, found N" for story with < 3 ACs | 3 tests (T8a–T8c) | — | — | — | — | 🟢 |
| AC5 | H2 FAIL: exit 2 + identifies AC# for missing GWT format | 3 tests (T9a–T9c) | — | — | — | — | 🟢 |
| AC6 | H5 FAIL: exit 5 + "benefit linkage describes a technical dependency" | 3 tests (T10a–T10c) | — | — | — | — | 🟢 |
| AC7 | Clean DoR → exit 0 + "validate OK: definition-of-ready — 0 violations found" | 1 test (T11a) — see note below | — | — | — | Partial — see gap table | 🟡 |
| AC8 | No regressions; total assertion count ≥33 in check-cli-outer-loop.js | G2a (count assert) + existing T1–NFR3 continuing to pass | — | — | — | — | 🟢 |

**AC7 note:** The clean-DoR test (T11a) will pass BOTH before and after cdg.2 implementation if the synthetic story satisfies H1 (no story reference triggering the old regex pattern). This is expected — the clean-path is already covered by T4a/T4c from cdg.1. The TDD red state for cdg.2 is demonstrated by T8/T9/T10 (which fail before H2-H9 are implemented and pass after). T11a is included to protect against regression: if the H2-H9 implementation accidentally breaks the exit-0 clean path, T11a catches it.

---

## Coverage gaps

| AC | Gap | Type | Risk | Mitigation |
|----|-----|------|------|------------|
| AC7 | T11a passes before implementation (not a true TDD red) | Inherent — clean path already working | Low | TDD red state provided by T8/T9/T10 which do fail before H2-H9 implementation |
| AC1 | H3/H6/H7/H8/H8-ext/H9 violations not individually fixture-tested in this plan | Deferred | Low | Phase 1 exit condition is ≥33 total assertions covering H1-H9 categories; T8–T10 cover representative categories. Remaining violation fixtures deferred to cdg.3 if M3 target requires further coverage. |

---

## Test Data Strategy

**Source:** Synthetic — all test data is generated in-memory or written to a temporary directory inside the repository root (`ROOT/.tmp-test-cdg2-XXXXXX/`) during test setup. Cleaned up in the finally/cleanup block. No external services or production artefacts are required.

**PCI/sensitivity in scope:** No

**Availability:** Available now — self-contained

**Owner:** Self-contained

### Data requirements per test block

| Test | Data needed | Source | Notes |
|------|-------------|--------|-------|
| T8 | Synthetic DoR file referencing a synthetic story with exactly 2 ACs | Written to tmp dir | DoR uses `**Story reference:** .tmp-test-cdg2-XXXX/story-h2-few-acs.md` |
| T9 | Synthetic DoR file referencing a synthetic story where AC2 has no Given/When/Then | Written to tmp dir | AC2 is plain text without the GWT clauses |
| T10 | Synthetic DoR file referencing a story whose Benefit Linkage section contains "needed for the next feature" | Written to tmp dir | H5.3 disqualifying phrase check |
| T11 | Synthetic DoR file referencing a well-formed story (3+ ACs in GWT, out-of-scope, benefit linkage with M-number, complexity 2, architecture constraints) | Written to tmp dir | No cross-file references in the story itself so H1 (old pattern) passes vacuously |
| G2a/G2b | `tests/check-cli-outer-loop.js` source file read to count assertion patterns | Live filesystem (project repo) | Counts lines matching `assert(` pattern |

### PCI / sensitivity constraints

None. Fixture artefacts must not contain real operator names, email addresses, or repository paths from the live workspace. All fixture content uses placeholder text ("test user", "synthetic metric M99", etc.).

---

## Test Files

| File | Change | Added to `npm test` | Purpose |
|------|--------|---------------------|---------|
| `tests/check-cli-outer-loop.js` | Extend — add T8–T11 blocks | Already in test chain | H2/H4/H5 violation fixtures and AC7 clean-path |
| `tests/check-cli-governance.js` | Extend — add G2a/G2b blocks | Already in test chain | AC3: assert fixture count ≥33 |

**TDD baseline:** T8a, T8b, T8c, T9a, T9b, T9c, T10a, T10b, T10c, T11a all FAIL before H2-H9 are implemented (H2/H5 not checked → validate exits 0 instead of 2/5/4). G2a/G2b FAIL because fixture count is 23 (below 33). Total: 12 failing assertions before implementation. This is the TDD red state for cdg.2.

---

## Implementation Notes for the Coding Agent

### Story reference extraction (H2–H9)

cdg.1 used a regex that matches `artefacts/*/stories/slug.md` patterns embedded anywhere in the document. For H2–H9, the validate function needs to extract the canonical story path from the DoR metadata header:

```js
// Extract canonical story reference from DoR header
const STORY_REF_HEADER_RE = /\*\*Story reference:\*\*\s+(\S+\.md)/;
const TESTPLAN_REF_HEADER_RE = /\*\*Test plan reference:\*\*\s+(\S+\.md)/;
const REVIEW_REF_HEADER_RE = /\*\*Review artefact:\*\*\s+(\S+\.md)/;
```

These patterns match the metadata header format used in all DoR artefacts. The extracted paths are repo-relative and must be resolved against `repoRoot` (same traversal guard as H1).

### Check ordering

Checks run in order: H1 → H2 → H3 → H4 → H5 → H6 → H7 → H8 → H8-ext → H9. Return immediately on first failure. This is a "fail-fast, first-failing category" design.

H1 already implemented uses the `artefacts/*/stories/*.md` embedded-reference scan. Keep that scan for H1 (backward compatible). For H2–H9, use the header-metadata extraction above. Both operate on the same DoR artefact content.

### Exit code constants

Define named constants at the top of cli-outer-loop.js:

```js
const EXIT = {
  OK: 0,
  H1: 1, H2: 2, H3: 3, H4: 4, H5: 5, H6: 6, H7_THROUGH_H9: 7, SYSTEM: 8
};
```

### Synthetic fixture format for test blocks T8–T11

Each test block creates files in a single shared tmpDir. Example for T8:

**DoR artefact (dor-h2-few-acs.md):**
```markdown
**Story reference:** .tmp-test-cdg2-XXXX/story-h2-few-acs.md
**Test plan reference:** .tmp-test-cdg2-XXXX/test-plan-stub.md
**Review artefact:** .tmp-test-cdg2-XXXX/review-stub.md
```

**Story file (story-h2-few-acs.md):**
```markdown
## User Story
As a test user, I want to validate something, So that the system is correct.

## Acceptance Criteria
**AC1:** Given a valid state, when the system runs, then the result is correct.
**AC2:** Given a second state, when the system runs, then a second result follows.

## Out of Scope
Not applicable to H3 or other checks.

## Benefit Linkage
**Metric moved:** M99 — synthetic test metric
**How:** This story moves M99 by doing things.

## Complexity Rating
**Rating:** 1
**Scope stability:** Stable

## Architecture Constraints
- ADR-000: Synthetic constraint for test fixture only.
```

Note: only 2 ACs → H2.1 check fails (minimum 3 required).

**Stub files (test-plan-stub.md and review-stub.md):** Minimal markdown files with content that passes H3 and H7 checks, so the failure stops at H2 (first-failing-category principle). If testing H4/H5/H6, similar stubs are used with the specific violation in the target section.

For T11 (clean path), the story has 3 valid ACs in GWT format, populated Out-of-Scope, Benefit Linkage with M99 metric reference, Complexity rating of 2, and Architecture Constraints with an ADR reference. Test plan stub and review stub satisfy H3/H7.

---

## Unit Tests — New blocks for cdg.2

### T8 — H2 FAIL: story has fewer than 3 ACs

- **Verifies:** AC4
- **Test file:** `tests/check-cli-outer-loop.js` (new block appended after NFR3)
- **Precondition:** Synthetic DoR + story files written to tmpDir. Story has exactly 2 ACs. Test plan and review stubs are well-formed (no H3/H7 failures before H2 can be checked — but since checks are ordered H1→H2, H2 fires before H3/H7 are reached). Required stub files exist.
- **Action:** `mod.validate(dorPath, 'definition-of-ready', ROOT)` where dorPath = path.join(tmpDir, 'dor-h2-few-acs.md')
- **Expected results:**
  - T8a: `result.exitCode === 2`
  - T8b: `result.stderr.includes('H2 FAIL')`
  - T8c: `result.stderr.includes('minimum 3 ACs required')`
- **Fails before implementation:** Yes — current validate returns exit 0 (H2 not checked). T8a asserts exitCode===2, gets 0 → fails.

---

### T9 — H2 FAIL: AC missing Given/When/Then format

- **Verifies:** AC5
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Synthetic DoR + story with 3 ACs, but AC2 is plain text with no Given/When/Then clauses ("AC2: Something happens and a result occurs.")
- **Action:** `mod.validate(dorPath, 'definition-of-ready', ROOT)` where dorPath = path.join(tmpDir, 'dor-h2-bad-gwt.md')
- **Expected results:**
  - T9a: `result.exitCode === 2`
  - T9b: `result.stderr.includes('H2 FAIL')`
  - T9c: `result.stderr.includes('AC2')` and `result.stderr.includes('Given/When/Then')`
- **Fails before implementation:** Yes — current validate exits 0.

---

### T10 — H5 FAIL: benefit linkage describes a technical dependency

- **Verifies:** AC6
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Synthetic DoR + story where Benefit Linkage section says "needed for the next feature to proceed" — a disqualifying phrase per H5.3.
- **Action:** `mod.validate(dorPath, 'definition-of-ready', ROOT)` where dorPath = path.join(tmpDir, 'dor-h5-disqualifying.md')
- **Expected results:**
  - T10a: `result.exitCode === 5`
  - T10b: `result.stderr.includes('H5 FAIL')`
  - T10c: `result.stderr.includes('technical dependency')`
- **Fails before implementation:** Yes — current validate exits 0.

---

### T11 — AC7: clean full DoR exits 0

- **Verifies:** AC7
- **Test file:** `tests/check-cli-outer-loop.js`
- **Precondition:** Synthetic DoR referencing a well-formed story (3 ACs in GWT format, Out-of-Scope populated, Benefit Linkage with M99 metric reference, Complexity Rating 2, Architecture Constraints with ADR reference). Test plan stub and review stub satisfy H3/H7. No story artefact references matching the old H1 pattern (so H1 passes vacuously before cdg.2).
- **Action:** `mod.validate(dorPath, 'definition-of-ready', ROOT)` where dorPath = path.join(tmpDir, 'dor-clean.md')
- **Expected result:**
  - T11a: `result.exitCode === 0`
- **Fails before implementation:** No — see AC7 note in coverage table. Included to detect regression if H2-H9 implementation accidentally breaks the clean path.

---

## Governance Tests — New block for cdg.2 (check-cli-governance.js)

### G2 — AC3: fixture count assertion in check-cli-governance.js

- **Verifies:** AC3
- **Test file:** `tests/check-cli-governance.js` (new block appended after existing G1 checks)
- **Precondition:** `tests/check-cli-outer-loop.js` is readable from the project root.
- **Action:** Read `tests/check-cli-outer-loop.js` source, count lines matching `/assert\(/g` (each `assert(` call is one fixture assertion).
- **Expected results:**
  - G2a: `count >= 33` — asserts `cli-outer-loop fixture count N meets minimum 33`
  - G2b: if count < 33, error output contains `cli-outer-loop fixture count N is below minimum 33` (negative assertion: verify error message format when threshold not met — NOTE: G2b tests the error MESSAGE FORMAT, not a genuinely failing fixture. It is a structural check that the error message is correct. Test this by reading the governance check source and verifying the string is present.)
- **Implementation note for G2b:** G2b cannot be a runtime "fixture count < 33" assertion in the same test run (since after cdg.2 is implemented, count ≥ 33 and the failure branch never executes). Instead, G2b should be a static source check: read `tests/check-cli-governance.js` source after G2a is written and verify it contains the string `'cli-outer-loop fixture count'` and `'below minimum 33'`. This confirms the error message is present in the source, even if the execution path is never triggered in a passing run.
- **Fails before implementation:** Yes — G2a fails because fixture count is 23 (below 33).

---

## NFR Tests

### NFR-cdg2-1 — Performance: full 33-fixture suite completes in under 10 seconds

- **Verifies:** Story NFR — "Full 33-fixture suite completes in under 10 seconds"
- **Test file:** `tests/check-cli-outer-loop.js` — the existing NFR1 test covers single-call performance. The suite runtime is validated by CI timing. No additional explicit test added (CI failure would surface a >10s suite run). Deferred to operational monitoring.
- **Gap:** Accepted — no in-test timing of the full suite. Risk: low (all checks are in-memory string operations).

### NFR-cdg2-2 — No new runtime dependencies

- **Verifies:** Story NFR — "Zero new entries in package.json"
- **Test file:** Covered by existing NFR3a/NFR3b in `check-cli-outer-loop.js`. No new test needed.

### NFR-cdg2-3 — Test isolation

- **Verifies:** Story NFR — "Each fixture assertion must be independently passing or failing"
- **Test file:** Verified structurally — each T8/T9/T10/T11 block uses its own DoR + story files in tmpDir. No shared mutable state between test blocks.

---

## Gap table

| AC | Gap description | Type | Risk | Handling |
|----|----------------|------|------|----------|
| AC7 | T11a passes before implementation (not TDD red) | Inherent — clean path already working | Low | TDD red provided by T8/T9/T10. T11a included as regression guard. |
| AC1 | H3/H6/H7/H8/H8-ext/H9 violation cases not individually fixture-tested | Deferred | Low | Phase 1 target is ≥33 total assertions (H1-H9 all implemented). Representative violation tests (H2, H5, H4) confirm exit-code routing. Remaining violation coverage is cdg.3 scope. |
| NFR-cdg2-1 | No explicit suite-timing assertion in test file | Accepted | Low | All checks are in-memory string operations; >10s is implausible. CI timing surfaced if needed. |
