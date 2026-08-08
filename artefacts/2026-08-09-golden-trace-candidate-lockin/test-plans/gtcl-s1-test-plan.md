## Test Plan: Lock the golden-trace demo to one candidate and delete the other

**Story reference:** artefacts/2026-08-09-golden-trace-candidate-lockin/stories/gtcl-s1-delete-losing-candidate.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Decision logged in decisions.md | — | — | — | 1 manual write | — | 🟢 |
| AC2 | Losing candidate's content fully deleted | 1 test | — | — | — | — | 🟢 |
| AC3 | ACTIVE_CANDIDATE/lookup mechanism removed | 1 test | — | — | — | — | 🟢 |
| AC4 | Existing lphf-s1 suite passes, updated for single-candidate structure | — | 1 full re-run | — | — | — | 🟢 |
| AC5 | Rendered output byte-identical to before | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC1 is inherently a manual/editorial step (a written decision), consistent with how `decisions.md` entries are always authored directly rather than test-asserted.

---

## Test Data Strategy

**Source:** The real `golden-trace-content.js` file and its own existing candidate content.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

---

## Unit Tests

### goldenTraceContent_losingCandidateContentFullyRemoved

- **Verifies:** AC2
- **Action:** Read `golden-trace-content.js`'s source; search for the losing candidate's distinguishing content strings (e.g. specific phrases from its `prompt`/`discovery`/`dor`/`shipped` fields)
- **Expected result:** None of the losing candidate's distinguishing strings are present anywhere in the file

### goldenTraceContent_noActiveCandidateSelectorRemains

- **Verifies:** AC3
- **Action:** Read `golden-trace-content.js`'s source
- **Expected result:** No `ACTIVE_CANDIDATE` variable, no `CANDIDATES` multi-key lookup object — the winning candidate's content is either the only export or referenced directly

### renderGoldenTraceHtml_outputByteIdenticalToPreChange

- **Verifies:** AC5
- **Precondition:** Golden-file capture of `renderGoldenTraceHtml()`'s output before this change (with the confirmed winning candidate already active, i.e. today's real rendered output)
- **Action:** Call `renderGoldenTraceHtml()` after the change
- **Expected result:** Byte-identical to the pre-change capture

## Regression

### existingLphfS1Suite_passesWithUpdatedAC2

- **Verifies:** AC4
- **Action:** Re-run `tests/check-lphf-s1-golden-trace-demo.js`, updated so its former AC2 assertion (flip between two candidates) is replaced with an equivalent single-candidate regression guard
- **Expected result:** All tests pass; no reference to the removed multi-candidate mechanism remains in the test file
