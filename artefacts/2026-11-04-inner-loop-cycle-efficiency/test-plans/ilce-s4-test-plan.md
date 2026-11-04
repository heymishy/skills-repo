## Test Plan: /workflow reconciles merged-but-no-DoD stories against live GitHub, not just pipeline-state.json

**Story reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/stories/ilce-s4-dod-handoff-reconciliation.md
**Epic reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/epics/dod-handoff-reconciliation.md
**Test plan author:** Copilot
**Date:** 2026-11-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Cross-references `gh pr list` against recorded `prUrl` | 1 test | — | — | — | — | 🟢 |
| AC2 | Flags a reconciliation gap on field-vs-reality mismatch | 2 tests | — | — | — | — | 🟢 |
| AC3 | Finding surfaced prominently in session-start report | — | 1 test | — | — | — | 🟢 |
| AC4 | Degrades gracefully when `gh` is unavailable | 1 test | — | — | — | — | 🟢 |
| AC5 | Correctly identifies the 22 known pre-existing gaps | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed — synthetic for AC1/AC2/AC4 (constructed `gh pr list` output and `pipeline-state.json` fixtures); AC5 specifically uses a real, already-known data point (the 22 merged-but-no-DoD stories confirmed earlier this session) as a regression anchor, not a synthetic substitute.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained for AC1/2/4; AC5 reads the real repo's own `pipeline-state.json` as of this story's implementation — no external dependency beyond the repo itself.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `gh pr list --json number,mergedAt` output + a `pipeline-state.json` fixture with matching `prUrl` | Generated in test setup | None | |
| AC2 | Same, but with a deliberately mismatched `prStatus` field | Generated in test setup | None | |
| AC3 | A sample session-start report structure | Generated in test setup | None | |
| AC4 | A mocked `gh` call that throws/fails | Generated in test setup | None | |
| AC5 | The real `pipeline-state.json` as it exists at implementation time | Real repo data | None | This is intentionally NOT synthetic — see Test Data Strategy source note |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Cross-reference correctly matches a story's prUrl against gh pr list output

- **Verifies:** AC1
- **Precondition:** A mocked `gh pr list` response containing PR #999 merged at a given date; a `pipeline-state.json` fixture with one story whose `prUrl` points to PR #999.
- **Action:** Run the cross-reference function.
- **Expected result:** Returns a match for that story, with the merged date from the live data, not inferred from `pipeline-state.json` alone.
- **Edge case:** No.

### Flags a reconciliation gap when prUrl matches a merged PR but prStatus disagrees

- **Verifies:** AC2
- **Precondition:** Same mocked `gh pr list` response; the fixture story's `prUrl` matches PR #999, but its own `prStatus` field reads `"draft"`.
- **Action:** Run the full reconciliation check.
- **Expected result:** A finding is produced for this story, flagged with the same severity as "merged but DoD not complete" per ADR-030's decision that it is a superset condition.
- **Edge case:** Yes — this is exactly the ADR-030 corruption pattern.

### Produces no finding when prUrl and prStatus agree

- **Verifies:** AC2 (negative case)
- **Precondition:** Same as above, but `prStatus` correctly reads `"merged"`.
- **Action:** Run the reconciliation check.
- **Expected result:** No finding is produced for this story.
- **Edge case:** No — this is the control case confirming the check isn't over-triggering.

### Degrades gracefully and falls back when gh is unavailable

- **Verifies:** AC4
- **Precondition:** The `gh` CLI call is mocked to throw (simulating unavailability or missing auth).
- **Action:** Run the full reconciliation check.
- **Expected result:** A warning is produced stating live reconciliation could not run this session; the check falls back to `pipeline-state.json`-only checking; no exception propagates and `/workflow`'s other functions are unaffected.
- **Edge case:** Yes — the external-dependency failure path.

---

## Integration Tests

### The reconciliation finding appears near the top of /workflow's session-start report

- **Verifies:** AC3
- **Components involved:** The reconciliation check, `/workflow`'s report-assembly logic.
- **Precondition:** At least one reconciliation finding exists (from the AC2 fixture).
- **Action:** Generate a full session-start report.
- **Expected result:** The finding appears within the first section of the report output — not after other, lower-priority sections, confirmed by checking its position/line-index relative to the report's own section boundaries.

### The check correctly identifies all 22 real, already-known merged-but-no-DoD stories

- **Verifies:** AC5
- **Components involved:** The full reconciliation check, this repo's real `pipeline-state.json`.
- **Precondition:** The real `pipeline-state.json` as it exists at implementation time, containing the 22 stories already confirmed this session (via the comprehensive artefact audit) to be merged but not at `definition-of-done`.
- **Action:** Run the reconciliation check against the real file.
- **Expected result:** All 22 known stories appear in the check's output as flagged gaps — a concrete regression anchor, not a hypothetical example. (If the real count has changed since 2026-11-04 because some were resolved in the interim, the test should assert "no fewer than the stories still actually in that state," not a hardcoded 22, to avoid a brittle test that fails for the right reason.)

---

## NFR Tests

### gh pr list call does not meaningfully slow down /workflow's session-start report

- **NFR addressed:** Performance
- **Measurement method:** Time `/workflow`'s full session-start run with and without the reconciliation check enabled (using a mocked `gh` response to avoid real network variance in the test itself).
- **Pass threshold:** Adds no more than a few seconds versus the baseline without the check.
- **Tool:** `node scripts/run-all-tests.js`'s own timing helper; real-network latency is explicitly out of scope for this NFR test (mocked in test, acknowledged as a real-world variable at manual verification time).

---

## Out of Scope for This Test Plan

- Retroactively running `/definition-of-done` for the 22 existing stories — this test plan verifies the check correctly *finds* them, not that they get resolved.
- A new scheduled CI job — not part of this story's design.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-network `gh` CLI latency/pagination behavior against a large merged-PR list isn't exercised by a mocked unit test | Mocking is necessary for deterministic, fast CI tests | Acknowledged as a real-world variable; the AC5 integration test against real repo data provides partial real-world signal, though not specifically for pagination volume |
