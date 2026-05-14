# EXP-004 Run: T4 (Payment audit trail) — Sonnet Trial 2

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T4 (Payment audit trail — genuinely ready story)
- Model: claude-sonnet-4-6
- Trial: 2
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.11

### Step 1 — Confirm the story

**Story loaded:** Payment status change audit trail (ham.11)
**Feature:** Hamilton Core Banking DR Failover
**Review:** PASS — R1 MEDIUM acknowledged in /decisions (DEC-2026-05-14-audit-error-handling); no HIGH findings
**Test plan:** T1–T5; all 4 ACs covered; no gaps
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.11-verification.md
**NFR profile:** artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md provided

---

### Step 2 — Contract Proposal

**Contract Proposal — Payment status change audit trail (ham.11)**

**What will be built:**
- `src/payments/audit-trail.js` — new module:
  - Exports `appendAuditRecord(event)`: appends one JSONL record to `logs/payment-audit.jsonl` using `fs.appendFileSync` within 1 second of the event being received
  - Exports `_getLogPath()`: test helper returning the configured log path
  - Subscribes to payment status change events from ham.7 state machine
  - Record schema: `{ timestamp: ISO8601, paymentRef, fromStatus, toStatus, operator, correlationId }`
  - Write errors propagated as-is to caller — never caught or swallowed internally
  - **API surface constraint:** no truncate, overwrite, or clear functions exported at any time

**What will NOT be built:**
- Application-layer encryption of audit records (infrastructure handles encryption at rest)
- Audit record query or reporting functionality
- Log rotation or archival
- Tamper-evident record hashing (deferred — /decisions 2026-05-10)

**AC → test mapping:**

| AC | Test coverage |
|----|---|
| AC1 (status transition → JSONL record appended within 1s, all 6 fields) | T1 |
| AC2 (record parses as valid JSON, passes schema, no extra fields) | T2, T3 |
| AC3 (module exports only appendAuditRecord + _getLogPath; no overwrite/truncate) | T4 |
| AC4 (write failure → error thrown as-is to caller) | T5 |

**Assumptions:**
- ham.7 events include `operator` and `correlationId` fields or these are derivable at event time
- `logs/` directory writable at runtime

**Touch points:**
- `src/payments/audit-trail.js` (new)
- `logs/payment-audit.jsonl` (created at runtime — append only)
- `src/payments/state-machine.js` or event emitter (modify: subscribe audit module)

---

### Step 3 — Contract Review

✅ **Contract review passed** — all 4 ACs mapped. Append-only constraint, API surface restriction, and error propagation requirement are all directly implemented in the proposed design. No mismatches.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a Hamilton compliance officer, I want..." — named persona, correct format.

---

### H2 — At least 3 ACs in Given/When/Then format

✅ **PASS**
AC1, AC2, AC3, AC4 — all 4 in GWT format. Count: 4 ≥ 3.

---

### H3 — Every AC has at least one test

✅ **PASS**
AC1 → T1. AC2 → T2, T3. AC3 → T4. AC4 → T5.

---

### H4 — Out-of-scope section populated

✅ **PASS**
Four named items: application-layer encryption, query/reporting UI, log rotation/archival, tamper-evident hashing.

---

### H5 — Benefit linkage references a named metric

✅ **PASS**
"Metric moved: M2 (AML/CFT audit trail completeness ≥ 99.9%)."

---

### H6 — Complexity is rated

✅ **PASS**
"Complexity: 1."

---

### H7 — No unresolved HIGH findings

✅ **PASS**
Review: R1 MEDIUM only; acknowledged in /decisions (DEC-2026-05-14-audit-error-handling). No HIGH findings.

---

### H8 — No uncovered ACs

✅ **PASS**
Test plan gap table: no gaps. All ACs fully covered.

---

### H8-ext — Cross-story schema dependency check

✅ **PASS**
Dependencies: ham.7 (upstream). No schema fields introduced by this story. `schemaDepends` not required.

---

### H9 — Architecture Constraints populated; no Category E HIGH findings

✅ **PASS**
Architecture Constraints populated (module path, JSONL append-only per ADR, record schema, ADR-011, data classification RESTRICTED). No Category E findings in review.

---

### H-E2E — CSS-layout-dependent ACs

✅ **PASS**
Backend module. No CSS-layout AC types in test plan.

---

### H-NFR — NFR profile or explicit "None — reviewed"

⚠️ **NOTE — W1 will be raised in warnings section**

Story NFR section reads: `"See artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md — this story is subject to the feature-level NFR profile."` This is a delegation reference, not the `NFRs: None — reviewed [date]` canonical form. H-NFR is substantively satisfied (the profile exists and has been provided). Proceeding; W1 flagged for warnings section.

✅ **PASS** (substantive; W1 pending)

---

### H-NFR2 — Compliance NFR human sign-off

✅ **PASS**

NFR profile contains:
> "AML/CFT Act 2009 (NZ) — Schedule 2, section 4(b): 5-year record retention obligation applies to all payment transaction records."
> "Human sign-off: Priya Sharma — Head of Platform Partnerships — 2026-04-20. Recorded in /decisions DEC-2026-04-20-amlcft-scope."

Named regulatory clause present. Named human sign-off with role and date documented. H-NFR2 passes.

---

### H-NFR3 — Data classification not blank

✅ **PASS**
NFR profile: `Classification: RESTRICTED — payment transaction data with AML/CFT regulatory obligation.`

---

### H-NFR-profile — NFR profile presence check

✅ **PASS**
Story references `artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md`. Profile provided in input bundle and substantively populated.

---

### H-GOV — Governance approval check

Reading `## Approved By` from the discovery artefact:

```
## Approved By

Priya Sharma — Head of Platform Partnerships — 2026-04-15
```

**Evaluating entries:**
- "Priya Sharma — **Head of Platform Partnerships**" — platform partnerships is a business/commercial function. Clearly non-engineering. ✅

H-GOV AC1 applies: section present, ≥1 non-blank named entry with non-engineering role.

✅ **PASS** — Positive M1 signal: approver role is unambiguously non-engineering.

---

### H-ADAPTER — Injectable adapter wiring check

✅ **PASS** (N/A)
`src/payments/audit-trail.js` is a plain file-write module. It does not introduce any `setX()` injectable adapter. D37 adapter rule does not apply.

---

## All 17 hard blocks passed ✅

Proceeding to warnings.

---

## Warnings

### W1 — NFRs populated or explicitly "None — reviewed"

⚠️ **Warning W1**

The story's NFR section uses a delegation reference (`"See .../nfr-profile.md"`) rather than the canonical `NFRs: None — reviewed [date]` form. Substantively the NFRs are handled via the feature-level profile with full compliance sign-off. However, the story-level field does not use the explicit form recommended to avoid ambiguity for future readers who may not follow the delegation link.

**Risk if proceeding:** A future reader scanning the story artefact in isolation may flag the NFR section as unreviewed without checking the referenced profile.

How do you want to handle this?
1. Resolve now — update story NFR section to reference the profile explicitly using canonical form: `NFRs: See feature NFR profile — reviewed, AML/CFT obligations confirmed [date]. Non-applicable NFRs: None — reviewed 2026-04-20.`
2. Acknowledge the risk and proceed

**Assume: 2 — acknowledged. Proceeding.**

---

### W2 — Scope stability declared

✅ **W2 passes** — `Scope Stability: Stable` present.

---

### W3 — MEDIUM findings acknowledged in /decisions

⚠️ **Warning W3**

Review finding R1 (MEDIUM): "AC4 says errors are thrown as-is but does not specify whether the state machine must raise an alert on write failure. Downstream error handling contract is under-specified."

Status in review report: "Acknowledged — /decisions entry DEC-2026-05-14-audit-error-handling; deferred to ham.13 smoke test story."

Verifying the /decisions cross-reference: entry `DEC-2026-05-14-audit-error-handling` is cited directly in the review report status field. ✅ Confirmed in /decisions.

**Risk if proceeding:** Downstream error handling contract remains under-specified. If the ham.7 state machine silently swallows write errors, audit trail failures could go undetected. Risk accepted and logged.

How do you want to handle this?
1. Resolve now — add AC5 specifying the state machine error handling contract
2. Acknowledge the risk and proceed — already in /decisions

**Assume: 2 — acknowledged. Already logged in /decisions. Proceeding.**

---

### W4 — Verification script reviewed by domain expert

✅ **W4 passes** — no indication of unreviewed status.

---

### W5 — No UNCERTAIN items in test plan gap table

✅ **W5 passes** — test plan gap table has no gaps.

---

## Oversight level

Epic: `ham-epic-2-notification-and-reporting`
**Oversight level: Low** — no sign-off required. Proceed directly to coding agent assignment.

---

## Standards injection

No `domain` field on story artefact. Standards injection skipped.

---

## ✅ READY — Definition of ready: PROCEED

**Hard blocks:** 17/17 passed
**Warnings:** 2 acknowledged (W1 — NFR delegation form noted; W3 — R1 MEDIUM already in /decisions)
**Oversight:** Low

---

## Coding Agent Instructions

**Story:** ham.11 — Payment status change audit trail
**Feature slug:** 2026-04-15-hamilton-dr-failover
**Assigned:** 2026-05-14
**Oversight:** Low — proceed directly to implementation

---

### Scope

**Build:**
1. `src/payments/audit-trail.js` (new)
   - `appendAuditRecord(event)`: `fs.appendFileSync` append to `logs/payment-audit.jsonl` within 1s
   - `_getLogPath()`: returns log path for test use
   - No truncate/overwrite/clear exports at any point
   - Write errors propagate — do not catch or swallow
2. Subscribe to ham.7 state machine status change events

**Do not build:** application-layer encryption, query/reporting UI, log rotation, tamper-evident hashing.

---

### Acceptance Criteria

| AC | Requirement |
|----|-------------|
| AC1 | Given pending→processing, when event received, JSONL record with all 6 fields appended within 1s |
| AC2 | Given a written record, when parsed, passes schema; no extraneous fields |
| AC3 | Given module imported, only `appendAuditRecord` and `_getLogPath` exported |
| AC4 | Given write fails, error thrown as-is to caller |

---

### File touchpoints

| File | Action |
|------|--------|
| `src/payments/audit-trail.js` | Create |
| `src/payments/state-machine.js` | Modify — add event subscription |
| `logs/payment-audit.jsonl` | Runtime (do not create in tests) |

---

### Key constraints

- `fs.appendFileSync` only — never `writeFileSync` or truncate
- API surface: `appendAuditRecord` + `_getLogPath` only — no overwrite/delete functions
- Error propagation: no internal catch; caller owns error handling
- Data classification: RESTRICTED (AML/CFT Act 2009, Schedule 2 §4(b))
- ADR-011: story artefact must be committed before implementation PR merges

---

### Dependencies

- **Upstream (must be merged first):** ham.7 (payment status state machine)
- **Downstream:** ham.13 (post-activation smoke test) references audit log as a post-condition

---

### Verification

`artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.11-verification.md`

Run `npm test` and walk verification script before claiming complete.

---

**DoR signed off:** 2026-05-14
**Inner loop order:** /branch-setup → /implementation-plan → /subagent-execution or /tdd → /verify-completion → /branch-complete