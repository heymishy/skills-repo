# Corpus Case T6 — RBNZ FX transaction reporting: C2-present, compliance sign-off pending

## Case metadata

```json
{
  "case_id": "T6",
  "label": "Trans-Tasman payments — RBNZ FX transaction reporting: C2-present, NFR sign-off pending",
  "difficulty": "adversarial",
  "expected_verdict": "COMPLETE WITH DEVIATIONS",
  "expected_gap": "NFR-1 (RBNZ FX transaction reporting format — compliance team sign-off not completed at PR merge time)",
  "c2_present": true,
  "adversarial_pattern": "Story has explicit C2 regulatory constraints (RBNZ FX transaction reporting). All 3 ACs are satisfied with test evidence. One compliance NFR has a real gap: the compliance team's format review is scheduled for 2026-06-20 but was not completed before the PR merged on 2026-06-12. The trap has two layers: (1) Haiku might miss the real NFR gap and call this COMPLETE (false positive); (2) Haiku might correctly identify the real gap BUT ALSO add fabricated deviations citing AUSTRAC, DIA registration, or correspondent bank notification — none of which are DoD gates for this story. A correct model identifies only the real gap (NFR-1 sign-off pending) without inventing additional regulatory deviations.",
  "failure_modes_to_watch": [
    "False positive: all NFRs assumed covered because functional tests pass — verdict COMPLETE",
    "Fabricated gate: AUSTRAC reporting not evidenced (AUSTRAC is explicitly out of scope — ttp.7)",
    "Fabricated gate: DIA registration not confirmed (go-live gate, not a DoD gate for this story)",
    "Fabricated gate: Correspondent bank notification required (separate story ttp.6)",
    "Fabricated gate: AML/CFT sanctions screening not evidenced (separate story ttp.3 — already complete)",
    "Double deviation: correctly identifies NFR-1 gap but also adds one or more fabricated gates"
  ]
}
```

---

## Operator input

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #318 has been merged.

---

### Story artefact

**Story ID:** ttp.4
**Feature:** Trans-Tasman Retail Payments
**Epic:** Regulatory Compliance — Payments

---

### Story: RBNZ FX transaction reporting

**As a** Trans-Tasman payments processing system,
**I want** to generate an RBNZ FX transaction report for each day's settled trans-Tasman payment net position and queue it for submission to the RBNZ Statistics portal within 2 business days of settlement,
**So that** the enterprise meets its RBNZ FX transaction reporting obligations for intra-group net settlement, which constitutes a reportable FX transaction under RBNZ requirements.

### Acceptance Criteria

**AC1:** Given the daily net settlement position between the enterprise and the AU counterpart is finalised (settlement run complete), when the settlement report is generated, then an RBNZ FX transaction report is created containing: settlement date, net NZD amount, AUD equivalent, exchange rate used, settlement counterparty (enterprise AU counterpart entity name and LEI), and a unique report reference number.

**AC2:** Given an RBNZ FX transaction report is created, when it is validated, then it passes the RBNZ Statistics portal schema validation (no mandatory field missing, amounts within declared range, date format ISO 8601).

**AC3:** Given a validated FX report, when it is queued, then it appears in the FX report submission queue with status PENDING and the queue entry timestamp is within 2 business days of the settlement date.

### Out of Scope

- AML/CFT sanctions screening — complete in ttp.3.
- RBNZ AML/CFT threshold reporting (≥ $10,000 NZD) — complete in ttp.3 (threshold reporting is handled at the individual transaction level, not the net settlement level).
- AUSTRAC reporting obligations — AU counterpart responsibility, handled in ttp.7.
- DIA Payment Services registration — go-live gate tracked at feature level (ttp-go-live-gate), not a per-story DoD gate.
- SWIFT correspondent bank (JPMorgan Chase) notification — separate story ttp.6, pre-launch gate.
- Manual submission to RBNZ Statistics portal — submission step is a separate ops runbook task; this story delivers the report to the queue only.

### NFRs

**NFR-1 (Compliance — RBNZ FX transaction reporting):** FX transaction reports must conform to the RBNZ Statistics portal FX reporting format specification (version 2.3, published 2025-11). Compliance team review of the generated report format is required and sign-off must be documented before the first live submission is made.

### Complexity

Complexity: 2 (net settlement calculation; RBNZ schema validation; queue delivery within 2-business-day SLA)

---

### Test plan summary

**Test plan artefact:** artefacts/trans-tasman-payments/test-plans/ttp.4-test-plan.md

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 | T1: settlement run triggers FX report with all required fields; T2: FX report contains correct settlement date, net amount, exchange rate, counterparty LEI | Full | — |
| AC2 | T3: generated report passes RBNZ Statistics portal schema validator (test uses portal SDK schema v2.3) | Full | — |
| AC3 | T4: validated report queued with PENDING status within SLA; T5: queue entry timestamp within 2 business days of settlement date | Full | — |
| NFR-1 | _none completed_ | None | **GAP-1 (COMPLIANCE — HIGH):** Compliance team format review scheduled 2026-06-20 — not yet completed at story completion. Sign-off required before first live FX report submission. Cannot confirm NFR-1 compliance without this review. |

---

### DoR artefact summary

**DoR artefact:** artefacts/trans-tasman-payments/dor/ttp.4-dor.md
**DoR verdict:** PROCEED WITH CONDITIONS
**Warnings acknowledged:** W1 (NFR-1 compliance sign-off is a prerequisite for live processing; must be obtained before the first FX report submission — story can be completed as INCOMPLETE until sign-off obtained, or COMPLETE WITH DEVIATIONS with a tracked follow-up), W2 (AUSTRAC and DIA obligations are scoped to separate stories)
**Oversight level:** High (regulatory reporting story — compliance team involved)

---

### Metric context

**Feature metric:** M4 — Trans-Tasman payment channel adoption (monthly eligible payment volume)
**ttp.4 contribution:** Listed in M4 `contributingStories: ["ttp.4"]`. FX reporting is a compliance prerequisite for live processing; M4 signal not measurable until full go-live.

**Current M4 state:** `signal: "not-yet-measured"` — feature not yet in production.

---

### PR description — PR #318 (merged 2026-06-12)

```
## Summary
Implements RBNZ FX transaction reporting for ttp.4. Settlement report generation,
schema validation, and queue delivery complete.

## Changes
- src/payments/fx-report-generator.js — net settlement FX report builder; RBNZ schema validation
- src/payments/fx-report-queue.js — submission queue with SLA tracking
- tests/fx-report.test.js — T1–T5 (5 tests)

## Test results
5/5 tests pass. All ACs verified. Schema validation uses RBNZ Statistics portal SDK v2.3.

## Notes
Compliance team format review (NFR-1) is scheduled for 2026-06-20. Review was not
completed before merge — PR merged to unblock ttp.5 dependency. Sign-off will be
obtained before the first live FX report submission. AUSTRAC reporting and DIA
registration are out of scope for this story.
```

---

## Expected verdict

**Verdict:** COMPLETE WITH DEVIATIONS

**Gap that fires:** NFR-1 — RBNZ FX transaction reporting format compliance: compliance team sign-off not completed at PR merge (2026-06-12). Review scheduled 2026-06-20. The PR explicitly states sign-off will be obtained before live submission, but it is not yet obtained. The DoD gate cannot mark NFR-1 as evidenced.

**Reason:** AC1–AC3 are verified (T1–T5 pass). NFR-1 compliance sign-off is explicitly open: the test plan flags GAP-1 as COMPLIANCE HIGH with no sign-off attached, and the PR description confirms the review is deferred to 2026-06-20. The DoR acknowledged this condition. No out-of-scope implementations — PR changes are limited to the FX report generator and queue. AUSTRAC, DIA registration, and correspondent bank notification are explicitly out of scope and must NOT be flagged as deviations.

**What a correct model output looks like:**
> ✅ AC1 — Net settlement FX report generated with all required fields: T1+T2 pass
> ✅ AC2 — Report passes RBNZ Statistics portal schema validation: T3 pass
> ✅ AC3 — Report queued with PENDING status within SLA: T4+T5 pass
>
> Scope check: No out-of-scope implementations. PR limited to FX report generator and queue.
>
> ⚠️ **NFR-1 not evidenced — RBNZ FX transaction reporting format compliance**
> NFR-1 requires compliance team sign-off before first live FX report submission. Test plan GAP-1 is open: compliance team review scheduled 2026-06-20, not yet completed at PR merge (2026-06-12). PR notes confirm deferral. Cannot mark NFR-1 as evidenced at this DoD gate.
>
> Metric M4: not-yet-measurable — feature not yet in production.
>
> **Verdict: COMPLETE WITH DEVIATIONS**
> Deviation: NFR-1 compliance sign-off pending. Options: (1) obtain compliance team sign-off and re-run DoD, (2) RISK-ACCEPT in /decisions with explicit acknowledgement that first live submission precedes sign-off.

**What a failing model output looks like (fabricated gates + missed real gap):**
> ✅ All 5 tests pass — ACs verified.
> ⚠️ AUSTRAC originator information provision not confirmed with AU counterpart compliance team.
> ⚠️ DIA Payment Services registration not confirmed before launch.
> ⚠️ Correspondent bank notification to JPMorgan Chase not evidenced.
> **Verdict: COMPLETE WITH DEVIATIONS** (for wrong reasons — real NFR-1 gap missed; phantom gates added)

## Adversarial signal

This case has two adversarial layers. First, the functional evidence is clean (5/5 tests pass) — a model that reads "tests pass" and stops will miss the compliance NFR gap. Second, the domain context mentions AUSTRAC, DIA, correspondent bank, and AML/CFT (all from the broader trans-Tasman payments feature) — a model that pattern-matches on these will invent deviations that are explicitly out of scope for this story. The correct model does both: finds the real NFR-1 gap AND stays within the stated story boundaries.
