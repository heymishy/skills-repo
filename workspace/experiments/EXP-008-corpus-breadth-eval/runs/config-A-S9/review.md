# Review: KiwiSaver Online Fund Switching — Digital Self-Service with Regulatory Compliance

**Status:** Conditional pass — 3 HIGH findings; all must be resolved before test plan and DoR (see resolution notes below)
**Feature slug:** kiwisaver-online-fund-switching
**Date:** 2026-05-17
**Skill version:** /review
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S9
**Prior artefacts read from disk:** `runs/config-A-S9/discovery.md` ✅, `runs/config-A-S9/definition.md` ✅

---

## Step 0 — Entry condition check

- Discovery artefact: ✅ on disk — status: Approved
- Definition artefact: ✅ on disk — status: Complete (6 stories, 3 epics, Step 4a complete)
- Context injection files: ✅ active
- Scope drift from Step 4a: None detected

---

## Review Summary

| Category | Finding count | Severity |
|----------|--------------|---------|
| A — Regulatory compliance | 1 | HIGH |
| B — Acceptance criteria completeness | 1 | HIGH |
| C — Dependency and integration risk | 1 | HIGH |
| D — Scope discipline | 0 | — |
| E — Architecture and NFR | 2 | IMPORTANT |
| F — Assumptions and blockers | 1 | IMPORTANT |

**Overall verdict:** CONDITIONAL PASS — 3 HIGH findings must be resolved in the test plan and DoR contract. 3 IMPORTANT findings addressed in-line below.

---

## HIGH Findings (must be resolved before DoR sign-off)

---

### H1 — Story 1.2: Fee gate missing FMA SEN sequencing constraint

**Category:** A — Regulatory compliance

**Finding:** Story 1.2 defines the `SWITCH_FEE_ENABLED` gate independently of `FUND_SWITCH_LIVE_ENABLED` (Story 1.1). However, the FMA Code of Conduct Part 4.2 requires the PDS amendment to be filed and the 20-business-day notice period to complete before the fee takes effect. The PDS amendment must be filed *alongside or after* the SEN (not independently), because the SEN process establishes the go-live date, and the fee can only take effect at go-live or later. Story 1.2 AC1 does not require `FUND_SWITCH_LIVE_ENABLED: true` as a precondition for `SWITCH_FEE_ENABLED: true`. This creates a gap: the fee gate could be satisfied (20 business days from PDS filing) on a date before the SEN notification period completes, technically permitting the fee to be enabled before online switching is live — which is meaningless and potentially confusing in the compliance audit record.

**Required resolution:** Add a sequencing constraint to Story 1.2 AC1: `SWITCH_FEE_ENABLED` can only be set to `true` if `FUND_SWITCH_LIVE_ENABLED` is also `true` (i.e., the digital channel is live before the fee is charged). This ensures the fee is only ever charged in the context of the live digital switching channel, and the two compliance gates are sequenced correctly.

**Resolution (applied in test plan):** T-FEE-004 added — validates that `SWITCH_FEE_ENABLED=true` requires `FUND_SWITCH_LIVE_ENABLED=true` as a precondition. Story 1.2 AC1 updated in test plan to add sequencing constraint.

---

### H2 — Story 2.1: Hardship waiver AC3 missing Contributions Management API failure path

**Category:** B — Acceptance criteria completeness

**Finding:** Story 2.1 AC3 specifies that when `hardship_active: true` the switch is accepted with `fee_waiver_applied: true`, and when `hardship_active: false` the standard fee logic applies. However, AC3 does not specify the failure path: what happens when the Contributions Management API (MPSW-UP-002) is unavailable or returns an error when checking the `hardship_active` field specifically. AC6 covers general API unavailability (fail safe — reject instruction), but this is applied to the overall eligibility check, not specifically to the hardship flag lookup. Given that the hardship waiver is a statutory obligation, the failure mode for the hardship check must be explicit: does the system (a) fail safe and reject the switch, (b) fail open and apply the waiver by default, or (c) apply the waiver by default and charge $0 fee until the API recovers? Each option has different statutory implications.

**Required resolution:** Define an explicit failure path for ELIG-003 when Contributions Management returns an error for the `hardship_active` field. The recommended approach is: fail safe toward the member's benefit — apply `fee_waiver_applied: true` by default when `hardship_active` cannot be confirmed, and charge no fee until the system can confirm the member's hardship status. This is the conservative interpretation consistent with KiwiSaver Act s.58 intent (protecting hardship members from fee charges). An AC must specify this explicitly.

**Resolution (applied in test plan):** T-ELIG-005 added — validates that when Contributions Management returns an error on `hardship_active` field, `fee_waiver_applied` defaults to `true`. Story 2.1 AC3 updated in test plan to add failure path.

---

### H3 — Story 3.2: Audit log write failure handling creates orphaned instruction state

**Category:** C — Dependency and integration risk

**Finding:** Story 3.2 AC5 specifies that where `MPSW-AUD-001` write fails, switch instruction processing is halted. However, there is a sequencing ambiguity: Story 2.2 AC2 commits the instruction to the Unit Registry (MPSW-CORE-001) and receives a confirmation reference. If the audit log write then fails (after unit registry commitment), the instruction is in a committed state at the registry but halted at the application layer. The member has not received a confirmation, the instruction is marked as `PENDING` with no audit record, and there is no recovery path defined. This creates an orphaned instruction state that operations cannot resolve without manual intervention against the unit registry directly.

**Required resolution:** Define the ordering explicitly: audit record must be written BEFORE the unit registry submission is marked `CONFIRMED` in the application. If the audit log write fails before the unit registry submission, reject the instruction (fail safe). If the audit log write fails after the unit registry returns confirmation (race condition), log the failure to an operational alert queue and initiate a reconciliation job that retries the audit record write using the unit registry confirmation reference. An AC in Story 3.2 must specify the reconciliation pathway.

**Resolution (applied in test plan):** T-AUDIT-003 added — validates audit record is created before unit registry confirmation status is updated; T-AUDIT-004 added — validates reconciliation retry for post-registry audit write failures.

---

## IMPORTANT Findings (should be addressed; not blocking if documented)

---

### I1 — Story 2.2: No API contract with Unit Registry for same-day instruction commitment

**Category:** E — Architecture and NFR

**Finding:** Story 2.2 AC2 assumes the Unit Registry API (MPSW-CORE-001) accepts switch instructions and returns a confirmation reference. However, no API contract exists in the artefacts for MPSW-CORE-001 (interface map entry confirms this is a "new integration"). The AC makes implementation assumptions (non-200 = not committed, retry queue) without confirming whether the Unit Registry API supports idempotent resubmission, or what the API's own cut-off and same-day processing guarantees are.

**Recommendation:** Add an assumption to the discovery/definition that the Unit Registry API contract will be confirmed during the discovery sprint, and that Story 2.2 is implementation-blocked until the API specification is obtained. A spike may be required.

**Status:** IMPORTANT — not blocking if logged as an assumption in the DoR contract. Logged in DoR as A1.

---

### I2 — Story 1.1: SEN notification dispatch to 52,000 members has no volume/latency NFR

**Category:** E — Architecture and NFR

**Finding:** Story 1.1 AC4 requires the Member Notification Service to dispatch SEN pre-change notifications to all 52,000 members. No latency or throughput NFR is specified. A bulk dispatch of 52,000 emails/SMS within "24 hours" is technically achievable but should be confirmed against the Member Notification Service's rate limits and any member communication preferences (email vs. SMS vs. postal) that may affect delivery times.

**Recommendation:** Add an NFR to Story 1.1: bulk SEN notification dispatch must complete for ≥ 95% of member records within 4 hours of trigger, and 100% within 24 hours. Failed deliveries must be logged and retried within 6 hours.

**Status:** IMPORTANT — add to test plan as T-SEN-002.

---

### I3 — Discovery: March 31 board communication is an open action with no owner

**Category:** F — Assumptions and blockers

**Finding:** The discovery correctly identifies that the March 31 target is incompatible with C2 and requires board communication. However, no owner is named for the board communication action. If this action is not taken before the engineering build starts, there is a risk that engineering delivery is targeted against an impossible date, creating pressure to bypass the SEN gate.

**Recommendation:** Assign the board communication action to a named role (Product Lead + Compliance Officer) in the DoR blockers section. Mark this as a go/no-go pre-condition for starting the engineering build.

**Status:** IMPORTANT — recorded in DoR as explicit no-go condition.

---

## Constraint propagation check

| Constraint | In discovery | In definition stories | In review findings | Status |
|------------|-------------|----------------------|-------------------|--------|
| C1 — KiwiSaver Act s.45 switch processing | ✅ | ✅ Story 2.2 AC3 | No findings against C1 | PROPAGATED |
| C2 — FMA SEN 30-day notification | ✅ (B2 blocker) | ✅ Story 1.1 AC3 gate | No findings against C2; H1 strengthens sequencing | PROPAGATED |
| C3 — March 31 false urgency | ✅ (T5 pass) | ✅ scope accumulator | I3 (board communication owner) | PROPAGATED |
| C4 — KiwiSaver Act s.51A eligibility | ✅ | ✅ Story 2.1 AC1/AC2 | H2 adds failure path for ELIG-003 | PROPAGATED |
| C5 — KiwiSaver Act s.58 hardship waiver | ✅ (B1 blocker) | ✅ Story 1.2 AC3, Story 2.1 AC3 | H2 strengthens ELIG-003 failure path | PROPAGATED |

---

<!-- CPF-TRACE
stage: /review
model: claude-sonnet-4-6
config: A

constraints_reviewed:
  - C1: "PROPAGATED — Story 2.2 AC3 correctly implements same-day pricing date commitment; KiwiSaver Act s.45 obligation satisfied by same-day registry commitment for pre-cutoff submissions"
  - C2: "PROPAGATED — Story 1.1 AC3 gates FUND_SWITCH_LIVE_ENABLED on NOTIFICATION_PERIOD_COMPLETE; H1 resolution adds sequencing to SWITCH_FEE_ENABLED gate; T5 false urgency analysis maintained"
  - C3: "PROPAGATED — false urgency distinction maintained; I3 recommendation adds named owner for board communication"
  - C4: "PROPAGATED — Story 2.1 ELIG-001 and ELIG-002 checks correctly represent KiwiSaver Act s.51A restrictions"
  - C5: "PROPAGATED — Story 1.2 AC3 and Story 2.1 AC3 implement mandatory hardship fee waiver; H2 adds failure-safe default (waiver applied when API unavailable)"

high_findings: ["H1 — fee gate missing SEN sequencing constraint", "H2 — hardship waiver missing API failure path", "H3 — audit log write failure creates orphaned instruction state"]
important_findings: ["I1 — Unit Registry API contract not confirmed", "I2 — SEN bulk notification NFR missing", "I3 — board communication action has no named owner"]
findings_blocking: 3
findings_resolved_in_test_plan: true

review_verdict: CONDITIONAL_PASS
-->
