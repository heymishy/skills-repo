## Test Plan: Self-registration at the moment of deferral

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Test plan author:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `/discovery` State-update hook auto-registers a record on an Out-of-Scope deferral | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | `/decisions` State-update hook auto-registers a record on a RISK-ACCEPT entry | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | `/definition-of-done` Step 6 hook auto-registers a record on a `not-yet-measured` signal | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | All three hooks write via `ddft-s1`'s single `workspace/incidents.json` mechanism | — | 1 test | — | — | — | 🟢 |
| AC5 | Each hook's test is independently runnable; one passing never implies the others do | — | — | — | — | Untestable-by-nature (process guarantee) | 🟡 |

**Correction confirmed:** AC3 is tested against `skills/definition-of-done/SKILL.md`'s Step 6 ("Metric signal", ~lines 184–225) and its State-update section (~line 274) — NOT `skills/benefit-metric/SKILL.md`. This matches the Run 2 `/review` correction already reflected in the story text and `decisions.md` (2026-11-09, "ddft-s4 hook-point correction").

---

## Coverage gaps

AC5 describes test-suite *organization* (independence between three hook test files), not a single runtime behaviour — see Coverage gaps / gap table below.

---

## Test Data Strategy

**Source:** Synthetic — each hook's trigger condition is simulated directly (a discovery session's Out-of-Scope write, a decisions-log RISK-ACCEPT entry, a DoD Step 6 not-yet-measured signal); real skill conversational flow is not re-run end-to-end for this test plan
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A discovery artefact fixture with a populated Out of Scope section | Synthetic | None | |
| AC2 | A decisions.md fixture with a RISK-ACCEPT entry | Synthetic | None | |
| AC3 | A DoD Step 6 fixture recording `signal: "not-yet-measured"` with an evidence note | Synthetic | None | Evidence note text must be a real-shaped sentence, not a placeholder, to prove it carries through to `revisitCondition` |
| AC4 | Outputs of AC1–AC3 | Produced by those tests | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond AC5 (see gap table).

---

## Unit Tests

### mapsEachHookContextToCorrectSourceValue

- **Verifies:** AC1, AC2, AC3
- **Precondition:** Three context objects — one shaped like a discovery Out-of-Scope completion, one like a decisions RISK-ACCEPT completion, one like a DoD Step 6 not-yet-measured completion
- **Action:** Run the shared hook-mapping function against each
- **Expected result:** Returns `source: "discovery-out-of-scope"`, `source: "risk-accept"`, and `source: "unmeasured-benefit-metric"` respectively — exact string match per context, no cross-contamination between the three
- **Edge case:** Yes — the DoD case must map correctly despite the AC3 hook having been relocated from `/benefit-metric` during the Run 2 fix; assert the mapping function is wired to whatever module implements `/definition-of-done`'s Step 6, not `/benefit-metric`'s State-update module

---

## Integration Tests

### discoveryHookAutoRegistersRecordOnOutOfScopeCompletion

- **Verifies:** AC1
- **Components involved:** `/discovery`'s State-update step (`skills/discovery/SKILL.md:519`), hook function, `workspace/incidents.json`
- **Precondition:** A discovery session fixture completing with a populated Out of Scope section, no manual follow-up step taken by the operator
- **Action:** Trigger the State-update step
- **Expected result:** A new record exists in `workspace/incidents.json` with `type: "deferred-item"`, `source: "discovery-out-of-scope"` — created with zero manual intervention

### decisionsHookAutoRegistersRecordOnRiskAcceptCompletion

- **Verifies:** AC2
- **Components involved:** `/decisions`' State-update step (`skills/decisions/SKILL.md:264`), hook function, `workspace/incidents.json`
- **Precondition:** A decisions-log fixture with a newly-logged RISK-ACCEPT entry
- **Action:** Trigger the State-update step
- **Expected result:** A new record exists with `type: "deferred-item"`, `source: "risk-accept"`, linking to that specific decision entry (by id or equivalent reference)

### definitionOfDoneHookAutoRegistersRecordOnNotYetMeasuredSignal

- **Verifies:** AC3
- **Components involved:** `/definition-of-done`'s Step 6 ("Metric signal", `skills/definition-of-done/SKILL.md:184-225`) and its State-update section (`:274`), hook function, `workspace/incidents.json`
- **Precondition:** A DoD session fixture where Step 6 records a metric's signal as `not-yet-measured` with an operator-supplied evidence note (e.g. "Telemetry too sparse to compute this metric as of 2026-11-09")
- **Action:** Trigger the State-update write
- **Expected result:** A new record exists with `type: "deferred-item"`, `source: "unmeasured-benefit-metric"`, and `revisitCondition` containing the metric name and the exact evidence note text — this test explicitly asserts the hook fires from the `/definition-of-done` module's Step 6, and fails if the implementation instead wires this to `/benefit-metric`'s State-update section (which has no access to a DoD-time fact)

### allThreeHooksWriteThroughSingleSharedMechanism

- **Verifies:** AC4
- **Components involved:** All three hooks, `workspace/incidents.json`
- **Precondition:** Outputs of the three integration tests above, run against the same temp `incidents.json`
- **Action:** Inspect the file
- **Expected result:** All three records exist in the single file via `ddft-s1`'s shared registration function — no hook has written to a second, separate file or storage path

---

## NFR Tests

Performance, Security, and Accessibility: not applicable or none beyond `ddft-s1`'s existing coverage, per the story's own NFR section — no dedicated NFR test written. Audit: satisfied by each hook test's own `source`-field assertion (the field itself is the audit trail per the story's own NFR); no separate NFR test required.

---

## Out of Scope for This Test Plan

- Any change to the three skills' existing conversational flow, question ordering, or operator-facing prompts — purely additive, per the story's own Out of Scope
- Retroactively registering any past deferral from before this story ships
- `ddft-s1`'s schema/registration internals — covered by that story's own test plan; this plan only tests that each hook correctly *calls* it

---

## Test Gaps and Risks

| Gap | AC | Gap type | Reason untestable in Jest/node runner | Handling |
|-----|----|----------|---------------------------------------|---------|
| "A passing test for one hook must never be assumed to imply the other two also work" is a test-suite independence guarantee, not a single runtime assertion | AC5 | Untestable-by-nature | There is no single behavioural output to assert; it's a property of how the three hook test files are structured and whether they share mutable fixtures | Manual/process check: each of the three integration tests above must live in its own file with no shared `beforeAll`/module-level mutable state, and must be independently runnable via `node scripts/run-all-tests.js` filtered to that one file. Verified by code review at implementation time, not an automated assertion. 🔴 |
