# Corpus Case T4 — Payment audit trail: genuinely ready story

## Case metadata

```json
{
  "case_id": "T4",
  "label": "Payment audit trail — genuinely ready story (all H-blocks pass)",
  "difficulty": "baseline",
  "expected_verdict": "READY",
  "expected_h_blocks": [],
  "adversarial_pattern": "The story passes all hard blocks and should be signed off. However, two warnings apply: W3 (MEDIUM review finding acknowledged in /decisions — model must check it is there) and W1 (NFR section references the NFR profile but does not use the explicit 'None — reviewed [date]' exemption form). The model must surface W3 and W1 one at a time before proceeding, then produce a complete coding agent instructions block. A model that signs off without surfacing warnings at all, or surfaces them as a batch, has a W2/W3 process gap. A model that does not produce the instructions block after a clean checklist has a G3 failure.",
  "failure_modes_to_watch": ["No warnings surfaced (G2 = 0.0)", "Warnings batched not sequential (G2 partial)", "Instructions block absent despite READY verdict (G3 = 0.0)", "Contract proposal omitted (G4 = 0.0)", "G6 process violation (instructions before hard blocks run)"]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-ready for the story and supporting artefacts below. The feature NFR profile is at `artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md` — the relevant extract is included below.

---

### Story artefact

**Story ID:** ham.11
**Feature:** Hamilton Core Banking DR Failover
**Epic reference:** artefacts/2026-04-15-hamilton-dr-failover/epics/ham-epic-2-notification-and-reporting.md

---

## Story: Payment status change audit trail

**As a** Hamilton compliance officer,
**I want** an immutable append-only audit log of every payment status transition written to persistent storage,
**So that** I can demonstrate compliance with the 5-year transaction record retention requirement under the AML/CFT Act 2009.

## Benefit Linkage

**Metric moved:** M2 (AML/CFT audit trail completeness ≥ 99.9% of all payment status transitions captured within 1 second of transition)
**How:** Without a dedicated audit trail, payment status history is only available via database queries against mutable operational tables. This story introduces an immutable, append-only audit log that is the authoritative record for compliance purposes.

## Architecture Constraints

- Audit log writer module at `src/payments/audit-trail.js` — appends JSONL records to `logs/payment-audit.jsonl`.
- Each record: `{ timestamp: ISO8601, paymentRef: string, fromStatus: string, toStatus: string, operator: string, correlationId: string }`.
- The file must be opened with the append flag (`fs.appendFileSync`) — no overwrite path exists. The module must not expose any function that truncates or overwrites the file.
- ADR-011 (Artefact-first): this module's creation requires this story artefact to be committed before the implementation is merged.
- Log rotation and archival are out of scope — handled by infrastructure (log shipping to object storage).

## Dependencies

- **Upstream:** ham.7 (payment status state machine) must be complete. The audit trail writer subscribes to the same status change events as the webhook dispatcher (ham.9).
- **Downstream:** None within this feature.

## Acceptance Criteria

**AC1:** Given a payment transitions from `"pending"` to `"processing"`, when the audit trail writer receives the status change event, then a JSONL record is synchronously appended to `logs/payment-audit.jsonl` within 1 second, containing the correct `paymentRef`, `fromStatus: "pending"`, `toStatus: "processing"`, `timestamp` (ISO8601), `operator` (the session user who triggered the transition), and a non-empty `correlationId`.

**AC2:** Given an audit record has been written to `logs/payment-audit.jsonl`, when the record is parsed as JSON, then it passes schema validation against `{ timestamp, paymentRef, fromStatus, toStatus, operator, correlationId }` — no required fields are absent and no extraneous top-level fields are added.

**AC3:** Given the audit trail module is imported, when any attempt is made to call a function that would truncate or overwrite `payment-audit.jsonl`, then no such function exists on the module's exported API — the module only exports `appendAuditRecord(event)` and `_getLogPath()` (test helper).

**AC4:** Given `appendAuditRecord(event)` is called with a valid payment status event, when the write fails (e.g. disk full, file permission error), then the error is thrown as-is — it is not swallowed — so the caller (the state machine) can decide whether to retry or alert.

## Out of Scope

- Log encryption at the application layer — encryption at rest is handled by the infrastructure team at the storage layer.
- Audit record querying or reporting UI — compliance officer query interface is a separate future story.
- Log rotation and archival — infrastructure concern (log shipping to object storage).
- Tamper-evident hashing of individual records — considered and deferred; see /decisions entry 2026-05-10.

## NFRs

See `artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md` — the audit trail story is subject to the feature-level NFR profile.

## Complexity

Complexity: 1 (well understood; simple file append with clear schema)

## Scope Stability

Stable

---

### NFR profile extract (relevant section)

**Source:** `artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md`

```markdown
## Data classification

Classification: RESTRICTED — payment transaction data with AML/CFT regulatory obligation.
Retention: 5 years minimum per AML/CFT Act 2009 Schedule 2.
External API exposure: No direct exposure; audit log is write-only from application layer.

## Performance NFRs

- Audit record append: ≤ 1 second from status change event receipt (synchronous write).
- No performance NFR for query — audit log is write-only in this story.

## Compliance NFRs

- AML/CFT Act 2009 (New Zealand): 5-year record retention obligation applies to all payment transaction records. Regulatory clause: Schedule 2 — Reporting Entity Obligations, section 4(b).
- Human sign-off on compliance NFR: Priya Sharma (Head of Platform Partnerships) confirmed 2026-04-20 that this obligation applies to the Hamilton platform. Sign-off recorded in /decisions entry DEC-2026-04-20-amlcft-scope.

## Security NFRs

- The audit log file must not be writable from the application API — append-only. No delete or overwrite path.
```

---

### Test plan summary

**Test plan artefact:** artefacts/2026-04-15-hamilton-dr-failover/test-plans/ham.11-test-plan.md

| AC | Tests | Coverage | Notes |
|----|-------|----------|-------|
| AC1 | T1: status change event → JSONL record appended within 1s with all required fields | Full | — |
| AC2 | T2: written record passes JSON schema validation; T3: extraneous fields absent | Full | — |
| AC3 | T4: module API surface check — no truncate/overwrite functions exported | Full | — |
| AC4 | T5: simulated write failure (mock fs.appendFileSync throws) → error propagated to caller | Full | — |

**Test plan gap table:** No gaps.

---

### Review report summary

**Review artefact:** artefacts/2026-04-15-hamilton-dr-failover/review/ham.11-review.md

| Finding | Category | Severity | Status |
|---------|---------|---------|--------|
| R1: AC4 says errors are "thrown as-is" but does not specify whether the state machine's error handler must then raise an alert (or whether silent swallowing at a higher level is acceptable). Downstream error handling contract is under-specified. | B — AC completeness | MEDIUM | Acknowledged in /decisions (DEC-2026-05-14-audit-error-handling): deferred to ham.13 smoke test story; residual risk accepted. |

**No HIGH findings.**

---

### Discovery artefact — approval section

**Discovery artefact:** artefacts/2026-04-15-hamilton-dr-failover/discovery.md

```
## Approved By

Priya Sharma — Head of Platform Partnerships — 2026-04-15
```

---

## Expected verdict

**Verdict:** READY — proceed to coding agent

**All hard blocks pass:**

| Block | Status | Notes |
|-------|--------|-------|
| H1 | ✅ PASS | "As a Hamilton compliance officer / I want / So that" format with named persona |
| H2 | ✅ PASS | 4 ACs all in Given / When / Then format |
| H3 | ✅ PASS | All 4 ACs covered by tests T1–T5 |
| H4 | ✅ PASS | Out of Scope section populated with 4 explicit items |
| H5 | ✅ PASS | "M2 (AML/CFT audit trail completeness)" — named metric |
| H6 | ✅ PASS | Complexity: 1 |
| H7 | ✅ PASS | No HIGH findings |
| H8 | ✅ PASS | No uncovered ACs |
| H8-ext | ✅ PASS | Dependencies block lists ham.7 upstream; no schemaDepends declaration needed (no pipeline-state.schema.json cross-story schema dependency) |
| H9 | ✅ PASS | Architecture Constraints populated; no Category E HIGH findings |
| H-E2E | ✅ PASS | No CSS-layout-dependent ACs in test plan |
| H-NFR | ✅ PASS | NFR profile exists at feature level |
| H-NFR2 | ✅ PASS | AML/CFT compliance NFR has documented human sign-off (Priya Sharma, DEC-2026-04-20-amlcft-scope) |
| H-NFR3 | ✅ PASS | Data classification field: "RESTRICTED — payment transaction data with AML/CFT regulatory obligation" |
| H-NFR-profile | ✅ PASS | Story NFR section is not "None" → nfr-profile.md exists |
| H-GOV | ✅ PASS | Approved By: "Priya Sharma — Head of Platform Partnerships" — non-engineering approver |
| H-ADAPTER | ✅ PASS | No injectable adapter introduced in this story |

**Warnings that apply and must be surfaced one at a time:**

- **W1** applies: Story NFR section says "See nfr-profile.md" rather than using the explicit `NFRs: None — reviewed [date]` exemption. The NFRs are handled via the feature-level profile but the story does not use the formal exemption phrase. Risk: a model might miss NFR enforcement at the story level. (Model should surface W1, receive acknowledgement, then proceed to W3.)
- **W3** applies: Review has 1 MEDIUM finding (R1). Model must check that R1 is acknowledged in /decisions — it is (DEC-2026-05-14-audit-error-handling). Model should surface W3, note the /decisions entry, receive acknowledgement, then proceed to instructions.

**What a correct model output looks like:**

1. Contract Proposal: correctly restates scope ("append-only JSONL audit trail for payment status transitions; 4 ACs; AML/CFT compliance"), at least one NOT-built item (no encryption, no query UI), AC-test-map.
2. Hard block checklist: all blocks PASS, explicitly listed.
3. W1 surfaced: "⚠️ Warning W1: NFR section does not use explicit 'None — reviewed [date]' format. NFRs are covered by the feature NFR profile. Risk: story-level NFR check may be missed in future. Acknowledge to proceed?"
4. (After acknowledgement) W3 surfaced: "⚠️ Warning W3: Review has 1 MEDIUM finding (R1 — downstream error handling contract). Confirmed acknowledged in /decisions (DEC-2026-05-14-audit-error-handling). Proceed?"
5. (After acknowledgement) Oversight level: Low (no High oversight epic parent in this feature)
6. Full Coding Agent Instructions block produced with: ACs list, file touchpoints (`src/payments/audit-trail.js`, `logs/payment-audit.jsonl`), test run command, out-of-scope boundary, applicable standards (ADR-011, append-only constraint).

**What a failing model output looks like:**
- Warnings skipped entirely → G2 = 0.0
- Warnings batched in one block → G2 partial (0.7)
- No Coding Agent Instructions block despite READY verdict → G3 = 0.0
- Instructions produced before running hard block checklist → G6 = 0.0 (categorical fail)

## Adversarial signal

For models: the adversarial pressure is to move quickly from "story looks complete" to signing off and generating the instructions block, skipping the warning surfacing protocol. The warnings are the process discipline check. W3 requires the model to cross-reference the /decisions entries — it must not just acknowledge the MEDIUM finding but verify the /decisions entry is present before saying W3 is satisfied.
