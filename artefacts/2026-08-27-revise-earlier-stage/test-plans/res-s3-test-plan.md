## Test Plan: Suggest whether a stage revision is material to downstream stages

**Story reference:** artefacts/2026-08-27-revise-earlier-stage/stories/res-s3-suggest-revision-materiality.md
**Epic reference:** artefacts/2026-08-27-revise-earlier-stage/epics/materiality-aware-downstream-guidance.md
**Test plan author:** Copilot
**Date:** 2026-08-28

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Materiality judgment + rationale presented after res-s2's overwrite | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Problem Statement / MVP Scope / Constraint change → "material" | 2 tests | — | — | — | — | 🟡 |
| AC3 | Wording-only change → "minor" | 2 tests | — | — | — | — | 🟡 |
| AC4 | Suggested classification recorded, paired for later acceptance-rate computation | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None as hard gaps, but see the 🟡 risk note below for AC2/AC3.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own data in setup/teardown

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | The pre-revision content res-s2's AC5 hands forward, plus post-revision content | Synthetic, consumes res-s2's producer-side test fixture shape | None | |
| AC2 | Two markdown fixtures differing in a named field (Problem Statement changed) | Synthetic, hand-authored fixture pair | None | |
| AC3 | Two markdown fixtures differing only in wording (no scope/constraint change) | Synthetic, hand-authored fixture pair | None | |
| AC4 | A materiality result + a way to inspect the session log entry produced | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### materialityCheckReceivesBothPreAndPostRevisionContent

- **Verifies:** AC1
- **Precondition:** res-s2's handoff producer stub supplies pre-revision content A; post-revision content B is the overwritten disk content.
- **Action:** Invoke the materiality-check function with both inputs.
- **Expected result:** The function's input contract receives both A and B (not just B, and not attempting to re-derive A from disk) — this is the consumer-side assertion paired with res-s2's producer-side test of the same contract.
- **Edge case:** No.

### materialityClassifiesProblemStatementChangeAsMaterial

- **Verifies:** AC2
- **Precondition:** Fixture pair where the Problem Statement section text differs between pre- and post-revision content, all else identical.
- **Action:** Run the materiality check.
- **Expected result:** Classification is "material"; rationale text references the Problem Statement change.
- **Edge case:** No.
- **⚠️ Test design risk (🟡):** If the materiality judgment is implemented as an LLM call rather than a deterministic field-diff, this test's exact-match assertion may be non-deterministic. Flagged explicitly rather than silently assumed — see Test Gaps and Risks below.

### materialityClassifiesConstraintChangeAsMaterial

- **Verifies:** AC2
- **Precondition:** Fixture pair differing in a named Constraint, all else identical.
- **Action:** Run the materiality check.
- **Expected result:** Classification is "material".
- **Edge case:** No. Same 🟡 risk as above.

### materialityClassifiesWordingOnlyChangeAsMinor

- **Verifies:** AC3
- **Precondition:** Fixture pair differing only in phrasing/wording, no scope or constraint field changed.
- **Action:** Run the materiality check.
- **Expected result:** Classification is "minor".
- **Edge case:** No. Same 🟡 risk as above.

### materialityClassifiesTypoFixAsMinor

- **Verifies:** AC3
- **Precondition:** Fixture pair differing by a single-character typo correction only.
- **Action:** Run the materiality check.
- **Expected result:** Classification is "minor".
- **Edge case:** Yes — smallest-possible-diff boundary case.

### suggestedClassificationRecordedInSessionLog

- **Verifies:** AC4
- **Precondition:** A materiality check has just run and returned a classification.
- **Action:** Inspect the session's turn/event log immediately after.
- **Expected result:** The log contains the model's suggested classification, structured so it can later be paired with the operator's actual choice (res-s4) to compute a match/no-match acceptance signal.
- **Edge case:** No.

---

## Integration Tests

### materialityCheckFiresImmediatelyAfterOverwriteCompletes

- **Verifies:** AC1
- **Components involved:** res-s2's overwrite handler → res-s3's materiality check, within the same turn-handling flow
- **Precondition:** Full res-s2 fixture producing a real overwrite.
- **Action:** Run the complete revision-turn flow end to end.
- **Expected result:** The materiality suggestion appears in the same chat turn's response as the revision confirmation — not a separate, later round-trip.

### suggestionAndOperatorChoiceAreJoinableInTheLog

- **Verifies:** AC4
- **Components involved:** Session log → res-s4's action-recording step (see res-s4 test plan)
- **Precondition:** A materiality suggestion has been logged (per the unit test above).
- **Action:** Simulate res-s4 recording an operator choice against the same suggestion event.
- **Expected result:** Both records share a common key (e.g. a suggestion/revision ID) that a later acceptance-rate computation can join on — this is the producer-side half of the contract res-s4's own tests assert the consumer-side of.

---

## NFR Tests

### materialityJudgmentAddsAtMostOneTurnLatency

- **NFR addressed:** Performance
- **Measurement method:** Count model/API calls made during the full revision-turn flow, with and without the materiality-check step.
- **Pass threshold:** At most one additional call attributable to the materiality check — no separate blocking round-trip beyond the existing chat turn.
- **Tool:** Node test runner, call-count spy.

---

## Out of Scope for This Test Plan

- Acting on the suggestion (accept/override) — covered by res-s4's own test plan
- Any downstream artefact regeneration — never in scope for this feature

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2/AC3's exact-match classification assertions assume deterministic behaviour | If the materiality judgment is implemented via an LLM call rather than a deterministic rule (e.g. "did the Problem Statement/Scope/Constraint section text change"), the exact classification could vary run-to-run, making these unit tests flaky. The story doesn't specify which approach the implementation should take. | Recommend implementing materiality classification as a deterministic field-diff check (did specific named sections change) for the pass/fail signal, with any free-text rationale generated by a model call layered on top but not asserted for exact wording — only for containing the correct classification label. If a full LLM-judged classification is chosen instead, these tests should assert against a fixed, mocked model response rather than a real model call, and a separate manual/exploratory check should validate real-model behaviour outside the deterministic test suite. Flag this choice explicitly at DoR — if unresolved by then, log as RISK-ACCEPT via /decisions before /definition-of-ready. |
