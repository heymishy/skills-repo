## Test Plan: Act on a materiality suggestion without auto-triggering downstream changes

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s4-operator-acts-on-materiality-suggestion.md
**Epic reference:** artefacts/2026-08-27-revise-earlier-stage/epics/materiality-aware-downstream-guidance.md
**Test plan author:** Copilot
**Date:** 2026-08-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | "Flag downstream stages" shows a marker, no artefact regeneration | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | "Leave as-is" applies no flag, touches no artefact | 1 test | — | — | — | — | 🟢 |
| AC3 | Choice paired with res-s3's suggestion in the log, joinable for acceptance rate | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Flag clears/acknowledges once the flagged stage is reopened | 2 tests | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own data in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey fixture with ≥2 stages downstream of the revised stage; a materiality suggestion already logged (per res-s3) | Synthetic | None | "Downstream" computed from `journey-store.js`'s single `STAGE_SEQUENCE` — see this story's RISK-ACCEPT (decisions.md, res-s4-1-M1) |
| AC2 | Same fixture | Synthetic | None | |
| AC3 | A logged materiality suggestion (res-s3's output) plus a recorded operator choice | Synthetic | None | |
| AC4 | A journey with a flagged downstream stage, then a reopen of that stage per res-s1's flow | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### flaggingDownstreamStagesSetsVisibleMarkerNoArtefactChange

- **Verifies:** AC1
- **Precondition:** Journey fixture with a materiality suggestion pending on stage `discovery`; downstream stages `benefit-metric` and `definition` computed via `journey-store.js`'s `STAGE_SEQUENCE` (not a second local list — see RISK-ACCEPT res-s4-1-M1).
- **Action:** Operator selects "flag downstream stages."
- **Expected result:** `benefit-metric` and `definition`'s step-nav entries render a visible marker (e.g. text or icon, not colour alone per the story's own Accessibility NFR); their artefact files remain byte-identical to before.
- **Edge case:** No.

### flagMarkerUsesTextOrIconNotColourAlone

- **Verifies:** AC1 (Accessibility NFR)
- **Precondition:** Same as above.
- **Action:** Render the flagged step-nav entry.
- **Expected result:** The marker's DOM/markup includes a text label or icon glyph, not solely a CSS colour/class change — matches `architecture-guardrails.md`'s mandatory Accessibility constraint (MC-A11Y-02).
- **Edge case:** Yes — accessibility boundary case.

### leavingAsIsAppliesNoFlagTouchesNoArtefact

- **Verifies:** AC2
- **Precondition:** Same fixture as AC1.
- **Action:** Operator selects "leave as-is."
- **Expected result:** No downstream stage gets a flag marker; no downstream artefact file is touched; the choice is still recorded in the log (per AC3).
- **Edge case:** No.

### operatorChoicePairedWithOriginalSuggestionInLog

- **Verifies:** AC3
- **Precondition:** A materiality suggestion logged by res-s3 with a known suggestion ID.
- **Action:** Operator makes a choice (flag or leave-as-is).
- **Expected result:** The log entry for the operator's choice shares the suggestion ID (or equivalent joinable key) with res-s3's original suggestion entry — a query can compute "did operator choice match model suggestion" from these two records alone.
- **Edge case:** No.

### flagClearsWhenFlaggedStageIsReopened

- **Verifies:** AC4
- **Precondition:** A stage is flagged (per AC1).
- **Action:** Operator reopens that flagged stage via res-s1's flow.
- **Expected result:** After the reopen, the flag is cleared/acknowledged — the stage no longer shows the "may need review" marker on subsequent step-nav renders.
- **Edge case:** No.

### flagDoesNotClearOnUnrelatedStageReopen

- **Verifies:** AC4 (negative control)
- **Precondition:** Two stages are flagged; operator reopens only one of them.
- **Action:** Reopen one flagged stage.
- **Expected result:** Only the reopened stage's flag clears; the other flagged stage's marker remains.
- **Edge case:** Yes.

---

## Integration Tests

### flagStatePersistsAcrossServerRestart

- **Verifies:** AC1 (persistence, per RISK-ACCEPT res-s4-1-M1)
- **Components involved:** Flag-setting handler → `journey-store.js`'s persistence path (`_diskAdapter`/`_pgWrite`, matching `completedStages`' own persistence)
- **Precondition:** A stage is flagged.
- **Action:** Simulate a server restart (reload journey state from the persisted store, not from the in-memory object).
- **Expected result:** The flag is still present after reload — proves flag state isn't in-memory-only. If this test cannot pass because the implementation chose in-memory-only storage, that choice must be made explicit and re-confirmed against the RISK-ACCEPT rather than silently accepted.

### suggestionAndChoiceJoinYieldsCorrectAcceptanceSignal

- **Verifies:** AC3
- **Components involved:** res-s3's suggestion log → res-s4's choice log → an acceptance-rate computation
- **Precondition:** Multiple suggestion/choice pairs, some matching, some not.
- **Action:** Run the join/computation across the fixture set.
- **Expected result:** The computed acceptance rate matches the known ratio of matching pairs in the fixture (e.g. 3 matches out of 5 pairs → 60%).

### reopenClearFlagFlowEndToEnd

- **Verifies:** AC4
- **Components involved:** res-s1's reopen flow → flag-clear handler
- **Precondition:** A flagged stage, reachable via res-s1's reopen mechanism.
- **Action:** Perform a full reopen via the step-nav link.
- **Expected result:** The flag clears as part of the same reopen action — no separate manual "acknowledge" step required beyond viewing the stage.

---

## NFR Tests

### flagMarkerAccessibleWithoutColourAlone

- **NFR addressed:** Accessibility
- **Measurement method:** Same as the flagMarkerUsesTextOrIconNotColourAlone unit test — included here for NFR traceability.
- **Pass threshold:** Marker includes non-colour signal (text or icon).
- **Tool:** Node test runner, DOM/markup inspection.

### flagEventsLoggedWithFullContext

- **NFR addressed:** Audit
- **Measurement method:** Assert flag-set and flag-cleared events include `journeyId`, `stageName`, and `timestamp`.
- **Pass threshold:** All three fields present on every flag event.
- **Tool:** Node test runner, stubbed event sink.

---

## Out of Scope for This Test Plan

- Automatic regeneration of any downstream artefact — never in scope for this feature
- Any new "handling it differently" UI — the operator's free-text chat response covers that

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| "Downstream stage" ordering source and flag persistence mechanism were undefined at story-write time | Flagged as review finding 1-M1, MEDIUM severity — accepted via RISK-ACCEPT (decisions.md, res-s4-1-M1) rather than resolved by a further story-text revision | Test plan makes both choices explicit in test preconditions (STAGE_SEQUENCE reuse, disk-backed persistence) so the coding agent has a concrete target even though the story text itself leaves it open; the `flagStatePersistsAcrossServerRestart` integration test will fail loudly if an in-memory-only implementation is chosen, forcing an explicit decision at that point rather than a silent gap |
