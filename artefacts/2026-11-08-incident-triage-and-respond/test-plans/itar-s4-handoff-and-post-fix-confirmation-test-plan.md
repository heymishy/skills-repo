# Test Plan Template

## Test Plan: Handoff to short-track pipeline + post-fix confirmation

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s4-handoff-and-post-fix-confirmation.md
**Epic reference:** artefacts/2026-11-08-incident-triage-and-respond/epics/itar-e1-triage-and-respond.md
**Test plan author:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Short-track story created with triage context attached; incident record linked to story slug | 2 tests | — | — | — | — | 🟢 |
| AC2 | At `dodStatus: complete`, attempt automated re-check if it exists, else prompt manual confirm (explicit branch) | 2 tests | 1 test | — | — | — | 🟢 |
| AC3 | Confirmation result updates incident status to `confirmed`/`not-confirmed`, never left at pre-fix status | 2 tests | 1 test | — | — | — | 🟢 |
| AC4 | `not-confirmed` → record stays open/flagged, fix attempt logged tried-but-unsuccessful | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|---------------------------|----------|
| None | — | — | — | — |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An incident record with a triage summary; a mocked short-track story creation call | Synthetic | None | — |
| AC2 | A mocked `pipeline-state.json` story at `dodStatus: complete`, linked to an incident record; a mock automated-detection registry present/absent | Synthetic | None | Two fixture variants — detection present, detection absent |
| AC3 | Same as AC2, plus a confirmation result (pass/fail) from either path | Synthetic | None | — |
| AC4 | A `not-confirmed` result on a linked incident record | Synthetic | None | — |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### linkIncidentToStory_setsLinkedStorySlug_whenHandoffOccurs
- **Verifies:** AC1
- **Precondition:** An incident record with a populated triage summary
- **Action:** Call the handoff function with a target story slug
- **Expected result:** The incident record's linked-story field equals the given slug
- **Edge case:** No

### attachTriageContextToStoryHandoff_includesKnownAndNextStep
- **Verifies:** AC1
- **Precondition:** An incident record with a triage summary containing known-context and suggested-next-step text
- **Action:** Call the handoff function
- **Expected result:** The handoff payload passed to short-track story creation includes the triage summary's known-context and suggested-next-step content — not just a bare incident id reference
- **Edge case:** No

### postFixCheck_selectsAutomatedPath_whenDetectionExistsForTriggeringCheck
- **Verifies:** AC2
- **Precondition:** Mock detection registry returns a callable check function for this incident's original trigger
- **Action:** Run the post-fix check
- **Expected result:** The result records `confirmationMethod: 'automated'` and the automated check function was invoked
- **Edge case:** No

### postFixCheck_selectsManualPath_whenNoAutomatedDetectionExistsForTriggeringCheck
- **Verifies:** AC2
- **Precondition:** Mock detection registry returns nothing for this incident's trigger
- **Action:** Run the post-fix check
- **Expected result:** The result records `confirmationMethod: 'manual'` and a manual-confirm prompt is issued — this is asserted as an explicit, distinct, intentionally-selected branch (a named field value), not merely the absence of an automated-path error
- **Edge case:** Yes — this is the exact distinction the Architecture Constraints call out ("named, separate branches, not a single assumed-automated path")

### updateIncidentConfirmationStatus_setsConfirmed_whenCheckPasses
- **Verifies:** AC3
- **Precondition:** A confirmation result of "pass" from either path
- **Action:** Update the incident record's confirmation status
- **Expected result:** Record's `confirmationStatus` becomes `'confirmed'`
- **Edge case:** No

### updateIncidentConfirmationStatus_setsNotConfirmed_whenCheckFails
- **Verifies:** AC3
- **Precondition:** A confirmation result of "fail" from either path
- **Action:** Update the incident record's confirmation status
- **Expected result:** Record's `confirmationStatus` becomes `'not-confirmed'`
- **Edge case:** No

### updateIncidentConfirmationStatus_keepsRecordOpenAndLogsAttempt_whenNotConfirmed
- **Verifies:** AC4
- **Precondition:** A `not-confirmed` result
- **Action:** Update the incident record's confirmation status
- **Expected result:** Record's top-level `status` remains `'open'` (or an explicit `flagged` variant) — it is never set to `'closed'`; a fix-attempt entry describing the attempt as tried-but-unsuccessful is appended to the record
- **Edge case:** Yes — this is the exact "falsely-closed record" failure mode AC4 exists to prevent

---

## Integration Tests

### postFixConfirmation_triggersAndChangesIncidentStatus_whenLinkedStoryReachesDodComplete
- **Verifies:** AC2, AC3
- **Components involved:** mocked `pipeline-state.json` reader, post-fix check module, `scripts/lib/incident-store.js`
- **Precondition:** Fixture `pipeline-state.json` with a story at `dodStatus: complete`, linked to an incident record currently at its pre-fix status
- **Action:** Run the post-fix confirmation flow against this fixture state
- **Expected result:** The incident record's status (re-read from the fixture store) has changed away from its pre-fix value to either `confirmed` or `not-confirmed` — never still showing the pre-fix value once this flow has run, matching AC3's own "never left at its pre-fix status" wording
- **Edge case:** No

---

## NFR Tests

### NFR-AUDIT-1: confirmation status change persists a timestamp usable for the benefit metric's own measurement
- **NFR addressed:** Audit
- **Measurement method:** Assertion that updating `confirmationStatus` also sets/updates a timestamp field on the record
- **Pass threshold:** A timestamp field exists and is set at the moment `confirmationStatus` changes, so a later query can count "DoD-complete, incident-linked stories cross-checked against confirmation status" per this story's own Audit NFR wording
- **Tool:** `node scripts/run-all-tests.js`

**Performance — not applicable, confirmed with story owner.** The story's own NFR section states this explicitly ("a bounded, triggered check at DoD time, not a standing process"). No test written.

**Security — no NFR test written for the Teams-credential rule.** The story's own Architecture Constraints explicitly flag this as forward-looking and "not an open question for this story's own MVP scope (which doesn't yet post to Teams)" — no integration point exists yet to test against. Revisit only once a Teams-posting path is actually built for this flow.

**Accessibility — not applicable, confirmed with story owner.** No UI in this story.

---

## Out of Scope for This Test Plan

- Any new automated detection mechanism for the re-check itself — reuses whatever initiative 2 eventually ships; no test written for detection logic beyond the branch-selection behavior above.
- Posting confirmation results to Teams/chat — not yet wired; see NFR note above.
- Long-term/delayed re-measurement of whether a confirmed fix continues to hold — initiative 5's territory, not this story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
