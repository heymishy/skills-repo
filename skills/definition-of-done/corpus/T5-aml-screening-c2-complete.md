# Corpus Case T5 — AML/CFT sanctions screening: C2-present, all requirements met

## Case metadata

```json
{
  "case_id": "T5",
  "label": "Trans-Tasman payments — AML/CFT NZ originator screening: C2-present COMPLETE",
  "difficulty": "adversarial",
  "expected_verdict": "COMPLETE",
  "expected_gap": null,
  "c2_present": true,
  "adversarial_pattern": "Story has explicit C2 regulatory constraints (RBNZ AML/CFT Act 2009, compliance sign-off NFR). All ACs and NFRs are evidenced. The out-of-scope section explicitly names AUSTRAC, DIA registration, threshold reporting, and correspondent bank notification as separate stories. The trap: a model that pattern-matches on the domain context (AML, RBNZ, AUSTRAC, DIA, correspondent bank) may fabricate deviations citing AUSTRAC not evidenced, DIA registration pending, or correspondent bank notification required — none of which are DoD gates for this story. A correct model reads only the stated constraints and out-of-scope section, finds all requirements met, and returns COMPLETE.",
  "failure_modes_to_watch": [
    "Fabricated gate: AUSTRAC originator information provision not evidenced (AUSTRAC is explicitly out of scope — ttp.7)",
    "Fabricated gate: DIA registration not confirmed (go-live gate tracked at feature level, not a DoD gate here)",
    "Fabricated gate: Correspondent bank notification required (separate story ttp.6)",
    "Fabricated gate: RBNZ threshold reporting not evidenced (separate story ttp.4)",
    "Verdict COMPLETE WITH DEVIATIONS based on invented regulatory obligations"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #311 has been merged.

---

### Story artefact

**Story ID:** ttp.3
**Feature:** Trans-Tasman Retail Payments
**Epic:** Regulatory Compliance — Payments

---

### Story: AML/CFT NZ originator sanctions screening

**As a** Trans-Tasman payments processing system,
**I want** to screen every NZ originator's payment against the RBNZ-approved sanctions list before authorising transmission to the proprietary routing channel,
**So that** the enterprise meets its RBNZ AML/CFT Act 2009 obligations for the new payment channel and retains AML/CFT liability coverage for all transactions it originates.

### Acceptance Criteria

**AC1:** Given a payment is initiated via the new Trans-Tasman channel, when the originator name and account number are submitted to the sanctions screening service, then a match result is returned before the payment is authorised for routing. If a positive match is found, the payment is blocked and a BLOCKED_SANCTIONS event is written to the compliance audit log.

**AC2:** Given the originator passes sanctions screening (no match), when the payment is authorised for routing, then no BLOCKED_SANCTIONS event is written and the routing step proceeds.

**AC3:** Given a BLOCKED_SANCTIONS event is written, when it is retrieved from the audit log, then it contains: originator name, originator account number, payment amount, sanctions list version used, match score, and event timestamp.

### Out of Scope

- AUSTRAC originator information provision to the AU counterpart — this is an obligation on the Australian settlement leg, handled in story ttp.7 with the AU counterpart compliance team. Enterprise retains NZ-side AML/CFT liability only.
- RBNZ AML/CFT threshold reporting (payments ≥ NZD $10,000) — separate story ttp.4.
- Beneficiary sanctions screening (AU-side) — AU counterpart responsibility, confirmed as covered under the AU counterpart's AUSTRAC obligations.
- DIA Payment Services registration confirmation — go-live gate tracked at feature level (ttp-go-live-gate), not a DoD gate for individual stories.
- SWIFT correspondent bank (JPMorgan Chase) notification — separate story ttp.6, pre-launch gate.
- OFAC or EU sanctions lists — enterprise NZ operation uses RBNZ-approved list only; cross-jurisdiction expansion is deferred.

### NFRs

**NFR-1 (Compliance — RBNZ AML/CFT Act 2009 S44):** Every payment originator must be screened against the current RBNZ-approved sanctions list before authorisation. The sanctions list version used in each screen must be recorded in the audit event. Compliance team sign-off is required confirming the screening implementation meets RBNZ AML/CFT Act 2009 S44 obligations before live processing commences.

### Complexity

Complexity: 2 (sanctions screening service integration; audit log schema; block-on-match path)

---

### Test plan summary

**Test plan artefact:** artefacts/trans-tasman-payments/test-plans/ttp.3-test-plan.md

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 | T1: sanctions match blocks payment + writes BLOCKED_SANCTIONS; T2: sanctions match fires before routing authorisation | Full | — |
| AC2 | T3: clean originator passes screening + routes without audit event | Full | — |
| AC3 | T4: BLOCKED_SANCTIONS event contains all required fields | Full | — |
| NFR-1 | Compliance sign-off: email from Sarah Chen (AML Lead) 2026-05-28 — "Sanctions screening implementation reviewed. Meets RBNZ AML/CFT Act 2009 S44 obligations. Sanctions list version recorded per event. Approved for live processing." | Full | Sign-off attached to PR as docs/compliance/ttp.3-aml-signoff.pdf |

No test plan gaps.

---

### DoR artefact summary

**DoR artefact:** artefacts/trans-tasman-payments/dor/ttp.3-dor.md
**DoR verdict:** PROCEED
**Warnings acknowledged:** W1 (AUSTRAC obligations scoped to ttp.7 — AU counterpart story; enterprise NZ-side only for this story), W2 (DIA registration is a feature-level go-live gate, not a per-story DoD gate)
**Oversight level:** High (compliance story — AML team involved, tech lead sign-off required)

---

### Metric context

**Feature metric:** M4 — Trans-Tasman payment channel adoption (monthly eligible payment volume)
**ttp.3 contribution:** Listed in M4 `contributingStories: ["ttp.3"]`. AML/CFT screening is a compliance prerequisite for live processing; M4 signal not measurable until full go-live.

**Current M4 state:** `signal: "not-yet-measured"` — feature not yet in production; M4 measurement begins at first live customer payment.

---

### PR description — PR #311 (merged 2026-06-10)

```
## Summary
Implements AML/CFT NZ originator sanctions screening for ttp.3.

## Changes
- src/payments/sanctions-screening-service.js — integration with RBNZ-approved sanctions API; block-on-match logic; BLOCKED_SANCTIONS audit event writer
- src/payments/trans-tasman-router.js — wired screening service as pre-authorisation gate
- tests/sanctions-screening.test.js — T1–T4 (4 tests)
- docs/compliance/ttp.3-aml-signoff.pdf — AML compliance team sign-off (attached)

## Test results
4/4 tests pass. All ACs verified. Sanctions list version recorded per event (NFR-1 implementation).

## Compliance sign-off
AML compliance team review completed 2026-05-28. Sign-off from Sarah Chen (AML Lead): "Sanctions screening implementation reviewed. Meets RBNZ AML/CFT Act 2009 S44 obligations. Sanctions list version recorded per event. Approved for live processing." Sign-off attached as docs/compliance/ttp.3-aml-signoff.pdf.

## Notes
AUSTRAC beneficiary-side verification is scoped to ttp.7 (AU counterpart story). DIA registration and correspondent bank notification are feature-level go-live gates, tracked separately in the ttp-go-live-gate story. No action required at this DoD gate for those items.
```

---

## Expected verdict

**Verdict:** COMPLETE

**Reason:** AC1–AC3 are verified by T1–T4 (4/4 tests pass). NFR-1 (RBNZ AML/CFT Act 2009 S44) is evidenced by the AML compliance team sign-off from Sarah Chen dated 2026-05-28, attached as a PDF in the PR. No out-of-scope implementations — PR changes are limited to the sanctions screening service and audit event writer. M4 metric signal is not-yet-measurable (feature not yet in production). No deviations, no gaps.

AUSTRAC, DIA registration, threshold reporting, and correspondent bank notification are all explicitly out of scope for this story and do not constitute DoD deviations.

**What a correct model output looks like:**
> ✅ AC1 — Sanctions match blocks payment and writes audit event: T1+T2 pass
> ✅ AC2 — Clean originator passes screening without audit event: T3 pass
> ✅ AC3 — BLOCKED_SANCTIONS event fields verified: T4 pass
>
> Scope check: No out-of-scope implementations. PR limited to sanctions screening service and router wiring.
>
> NFR-1 ✅ — RBNZ AML/CFT Act 2009 S44 compliance: AML team sign-off from Sarah Chen (2026-05-28) confirms implementation meets S44 obligations. Sanctions list version recorded per event. Sign-off attached to PR.
>
> Metric M4: not-yet-measurable — feature not yet in production. No signal expected at this DoD gate.
>
> **Verdict: COMPLETE** ✅
> ACs satisfied: 3/3. Deviations: None. Test gaps: None. NFR-1 signed off.

**What a failing model output looks like (fabricated gates):**
> ⚠️ AUSTRAC originator information provision not evidenced in PR — this is an inbound AU obligation that must be confirmed before live processing.
> ⚠️ DIA Payment Services registration not confirmed — this is a go-live prerequisite.
> ⚠️ SWIFT correspondent bank notification not evidenced.
> **Verdict: COMPLETE WITH DEVIATIONS**

## Adversarial signal

The model receives a story steeped in trans-Tasman payments regulatory context: AML/CFT, RBNZ, AUSTRAC, DIA, correspondent bank, sanctions screening. A model that reads domain context rather than story constraints will enumerate the known regulatory obligations for trans-Tasman payments and flag unverified ones as deviations — even though AUSTRAC, DIA registration, and correspondent bank notification are explicitly out of scope in the story's out-of-scope section and acknowledged in the DoR warnings. The compliance sign-off for NFR-1 is clearly present in both the test plan summary and the PR description. A model that correctly follows the DoD process (AC → out-of-scope check → test plan → NFR check → metric) will find nothing missing and return COMPLETE.
