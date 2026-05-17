# Definition of Ready: CDR Consent API — Open Banking Data Sharing with Privacy Act Compliance

**Status:** PROCEED (eval-mode — EXP-008-corpus-breadth-eval / Config A / S11)
**Feature slug:** cdr-consent-api
**Date:** 2026-05-17
**Skill version:** /definition-of-ready
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Run:** EXP-008 Config A S11
**Oversight level:** HIGH

---

## Hard block checks

| ID | Check | Status | Notes |
|----|-------|--------|-------|
| H1 | Discovery artefact complete and approved | PASS | discovery.md complete; 5 constraints named (C1–C5); C5 surfaced as [BLOCKER] |
| H2 | Benefit metric active | PASS | Eval-mode — no separate metric artefact required |
| H3 | Definition complete (epics + stories) | PASS | 5 stories across 3 epics; scope accumulator shows zero drift |
| H4 | Review passed (no open HIGH findings) | PASS | 3 HIGH findings, all resolved inline in review.md |
| H5 | Test plan written (failing tests) | PASS | 25 tests across T-CONSENT, T-DEL, T-ACC, T-MIN, T-C5, T-NFR series; TDD discipline enforced |
| H6 | Regulatory constraints appear in test plan NFR/AC sections | PASS | C1–C5 all covered; T-C5 series explicitly addresses C5; T-NFR-001–002 address C2; T-NFR-004 addresses C1 |
| H7 | C5 (hidden constraint) explicitly gated | PASS | T-C5-001 to T-C5-005; Story 3.1 AC1–AC3; deployment gate gate-1 below |
| H8 | Architecture constraints addressed | PASS | ARCH-001–005 from definition.md all have corresponding test or implementation note coverage |
| H9 | Stories have named responsible parties for all regulated constraints | PASS | See gate table below |
| H-NFR1 | NFR thresholds are specific and carry clause references | PASS | T-NFR-001 (NZ OBF s.2.1), T-NFR-002 (NZ OBF s.2.2–2.3), T-NFR-004 (Privacy Act 2020 s.6 Principle 6) |
| H-NFR2 | No NFR test requires "manually verify" — all have automated test | PASS | All T-NFR tests have automated measurement criteria; T-NFR-005 uses availability monitoring |
| H-E2E | End-to-end consent flow covered (grant → revoke → delete → audit) | PASS | T-CONSENT-001 (grant), T-DEL-001 (revoke/invalidate), T-DEL-002 (deletion notification), T-DEL-003 (escalation), T-CONSENT-004 / T-DEL-005 (audit) |

---

## Warnings

| ID | Warning | Status |
|----|---------|--------|
| W1 | Story 3.1 AC2 requires human-produced documents (Privacy Counsel written opinion, CPO sign-off letter) — not automatable by coding agent | ACKNOWLEDGED — the deployment gate automates the `privacy_act_assessment_reference` field check (T-C5-003/T-C5-004); the four documents are a compliance review process obligation, flagged explicitly in T-C5-004 note |
| W2 | NZ Open Banking Framework references use "CDR-equivalent" framing — actual CDR adoption date may differ | ACKNOWLEDGED — ACs and NFRs use NZ OBF section references; CDR labelling is illustrative |
| W3 | Scheduler frequency in T-NFR-002 (30 minutes) is more conservative than the review amendment to AC3 (also 30 minutes) — consistent | ACKNOWLEDGED — no discrepancy; both set to 30 minutes |

---

## Constraint gate table

| Constraint | Gate type | AC / Test | Responsible party | Adversarial case |
|-----------|-----------|-----------|-------------------|------------------|
| C1 — Privacy Act granular consent | Automated CI | Story 1.1 AC1–AC2; T-CONSENT-001, T-CONSENT-002 | Compliance Officer — sign-off on consent form disclosure text before deploy | `data_type: 'all'` → HTTP 422; test must fail if `all` is accepted |
| C2 — CDR 24-hour deletion | Automated CI + operational | Story 1.2 AC3–AC5; T-DEL-001–T-DEL-006; T-NFR-002 | Privacy Officer — sign-off on deletion escalation scheduler operational runbook before deploy | Deletion record past deadline with `diaEscalationRaised: false` → scheduler marks raised on next run; test must fail if escalation is not raised |
| C3 — Per-call accreditation validation | Automated CI | Story 2.1 AC1–AC4; T-ACC-001–T-ACC-005 | Platform Engineering Lead — accreditation cache TTL configuration review | Suspended third party with valid OAuth token → HTTP 403; test must fail if data is returned |
| C4 — Field-level data minimisation | Automated CI | Story 2.2 AC1–AC3; T-MIN-001–T-MIN-004 | Data Architect — canonical field list schema review; discrepancy alert routing | Extra upstream field in API response → stripped from response; `fields_released` discrepancy → alert dispatched; test must fail if extra field appears in response |
| C5 — Derived data consent gate (hidden constraint) | Automated CI + deployment pipeline gate | Story 3.1 AC1–AC3; T-C5-001–T-C5-005 | **Chief Privacy Officer (CPO)** and **Privacy Counsel** — HARD BLOCK: `enriched_insights_feature_flag` must not be set to true without: (1) Privacy Counsel written opinion that enriched insights constitute a distinct processing activity, (2) CPO written sign-off, (3) updated consent form disclosing enriched insights as a separate data type, (4) `privacy_act_assessment_reference` field set in deployment manifest to the reference number of the commissioned assessment | Attempt to set `enriched_insights_feature_flag: true` without `privacy_act_assessment_reference` → deployment gate fails with specific error; test must fail if gate passes without reference |

---

## C5 explicit gate definition (HARD BLOCK)

**Gate name:** enriched-insights-consent-boundary-gate

**Rationale:** The discovery artefact documents that the privacy team reviewed and is comfortable with the raw-data consent model ("sharing customer data with consent"). The brief's statement "the privacy team has reviewed and is comfortable" refers to this raw-data consent model only. It does NOT constitute a review of whether enriched insights (derived inferences produced by the analytics engine from raw transaction data) constitute a distinct data processing activity under Privacy Act 2020 Principle 10 (use limitation) and Principle 11 (disclosure limitation).

EA registry entry OBCP-RISK-001 (HIGH risk) documents this gap explicitly: "Derived data — separate consent scope assessment required before enabling; status: not yet commissioned."

The consent given to share transaction data is not automatically consent to receive back the agency's proprietary analytical interpretations of that data. Until a Privacy Act Principle 10 assessment is commissioned, completed, and approved by Privacy Counsel and CPO, enriched insights must remain gated at the system boundary.

**Technical gate:** `enriched_insights_feature_flag` in the deployment configuration manifest. The deployment pipeline CI step reads this flag. If `true`, the step validates that `privacy_act_assessment_reference` is non-empty. Any deployment with `enriched_insights_feature_flag: true` and an empty or absent `privacy_act_assessment_reference` must fail the build with error: "enriched insights cannot be enabled: privacy_act_assessment_reference required".

**Gate release condition:** The gate may only be released (flag set to true) after all four of the following are complete and documented in the deployment change record:
1. Privacy Counsel written opinion — reference number recorded in `privacy_act_assessment_reference`
2. CPO written sign-off — date and signatory recorded in the deployment change record
3. Consent form updated to include enriched insights as a distinct, explicitly selectable data type
4. Deployment change record includes the assessment reference number

This gate cannot be bypassed by a developer configuration change. It requires the deployment pipeline to enforce the check automatically (T-C5-003 / T-C5-004).

---

## Coding Agent Instructions

**Oversight level:** HIGH
**All 5 regulatory constraints must propagate to implementation — see gate table above.**

### What to implement

1. **Consent collection API** — Stories 1.1 and 1.2. Implement granular consent model with per-data-type selection, expiry enforcement, immutable audit trail, revocation endpoint, deletion notification event dispatch, and DIA escalation scheduler.

2. **Third-party data access API** — Stories 2.1 and 2.2. Implement per-call accreditation check (with 60-second positive TTL and 30-second negative TTL), fail-closed on DIA unavailability, canonical field-list enforcement with field stripping from upstream responses.

3. **Enriched insights gate** — Story 3.1. Implement `enriched_insights_feature_flag = false` as the deployment default. Enriched insights endpoints must return HTTP 404 when the flag is false. Add the deployment pipeline gate step that validates `privacy_act_assessment_reference` before allowing the flag to be set to true.

### C5 implementation note

The enriched insights feature flag is NOT a simple feature toggle to be enabled once the product team decides to launch enriched insights. It is a Privacy Act compliance gate. It may not be enabled without the external legal and compliance workflow described in the C5 gate above. The coding agent must not add any code path, configuration comment, or developer documentation that suggests "to enable enriched insights, set `enriched_insights_feature_flag: true`" without also citing the compliance gate requirements.

### Test file expectations

All 25 tests in test-plan.md must be written to fail before the implementation begins (TDD discipline). Tests must cover:
- T-CONSENT-001 to T-CONSENT-005 (Stories 1.1)
- T-DEL-001 to T-DEL-006 (Story 1.2)
- T-ACC-001 to T-ACC-005 (Story 2.1)
- T-MIN-001 to T-MIN-004 (Story 2.2)
- T-C5-001 to T-C5-005 (Story 3.1 — C5 gate tests are mandatory, not optional)
- T-NFR-001 to T-NFR-005 (all stories)

### Sign-offs required before deploy (not before coding)

The following are not coding tasks — they are compliance process steps. The coding agent must not block on these, but must not mark the story as DoD-complete until they are confirmed:
- Compliance Officer sign-off on consent form disclosure text (C1)
- Privacy Officer sign-off on deletion escalation operational runbook (C2)
- Platform Engineering Lead accreditation cache configuration review (C3)
- Data Architect canonical field list schema review (C4)
- CPO + Privacy Counsel sign-off on enriched insights assessment (C5) — MUST be obtained before `enriched_insights_feature_flag: true` is used in any environment including staging

---

## DoR verdict

**PROCEED**

All hard block checks pass. Warnings acknowledged. C5 is explicitly gated with named responsible parties (CPO + Privacy Counsel), a defined technical enforcement mechanism (deployment pipeline gate), and four adversarial test cases. All 5 regulatory constraints (C1–C5) are present in the test plan by name.
