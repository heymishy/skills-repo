# EXP-004 Run: T4 (Payment audit trail) — Sonnet Trial 1

**Run metadata:**
- Experiment: EXP-004-dor-rubric
- Case: T4 (Payment audit trail — genuinely ready story)
- Model: claude-sonnet-4-6
- Trial: 1
- Date: 2026-05-14
- Layer: 1 (VS Code model selector, semi-manual)
- Mode: evaluation

---

## /definition-of-ready evaluation — ham.11

### Step 1 — Confirm the story

**Story loaded:** Payment status change audit trail (ham.11)
**Feature:** Hamilton Core Banking DR Failover
**Review:** PASS — 1 finding (R1 MEDIUM, acknowledged in /decisions); no HIGH findings
**Test plan:** 5 tests (T1–T5) covering all 4 ACs — no gaps
**Verification script:** artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.11-verification.md
**NFR profile:** artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md (feature-level; extract provided)

Running definition-of-ready check on this story.

---

### Step 2 — Contract Proposal

**Contract Proposal — Payment status change audit trail**

**What will be built:**
- Module `src/payments/audit-trail.js` that:
  - Subscribes to payment status change events from ham.7 state machine
  - Synchronously appends a JSONL record to `logs/payment-audit.jsonl` within 1 second of event receipt using `fs.appendFileSync` (append flag — no overwrite path)
  - Record schema: `{ timestamp: ISO8601, paymentRef: string, fromStatus: string, toStatus: string, operator: string, correlationId: string }`
  - Exports only `appendAuditRecord(event)` and `_getLogPath()` (test helper) — no truncate or overwrite functions on the API surface
  - Propagates write errors as-is to the caller — no swallowing

**What will NOT be built:**
- Log encryption at the application layer — infrastructure handles encryption at rest
- Audit record query or reporting UI — separate future story
- Log rotation and archival — infrastructure concern (log shipping to object storage)
- Tamper-evident record hashing — deferred; see /decisions entry 2026-05-10

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---|---|
| AC1 (status transition → JSONL appended within 1s, all fields correct) | Unit test: mock status change event, spy on fs.appendFileSync, assert record written within 1s with all 6 required fields | unit |
| AC2 (record passes schema, no extraneous fields) | Unit test: parse written record as JSON, run schema validation, assert no extra top-level fields | unit |
| AC3 (no truncate/overwrite on API surface) | Unit test: import module, inspect exported API surface, assert only appendAuditRecord and _getLogPath exported | unit |
| AC4 (write failure → error propagated to caller) | Unit test: mock fs.appendFileSync to throw, assert error propagated from appendAuditRecord to caller | unit |

**Assumptions:**
- ham.7 state machine events carry `operator` (session user) and `correlationId` fields or these are derivable at event time
- `logs/` directory exists and is writable at runtime
- No concurrent write collision scenario in MVP (single-process, sequential appends)

**Estimated touch points:**
Files: `src/payments/audit-trail.js` (new), `logs/payment-audit.jsonl` (created at runtime)
Services: Payment processing service, state machine (ham.7)
APIs: Node.js `fs.appendFileSync`, status change event subscription interface

---

### Step 3 — Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. Append-only constraint and API surface restriction accounted for explicitly. No mismatches.

---

## Hard blocks checklist

### H1 — As/Want/So format with named persona

✅ **PASS**
"As a **Hamilton compliance officer**, I want... So that..."

---

### H2 — At least 3 ACs in Given/When/Then format

✅ **PASS**
AC1, AC2, AC3, AC4 — all 4 in Given/When/Then format. Count: 4. Requirement: ≥ 3.

---

### H3 — Every AC has at least one test in the test plan

✅ **PASS**
- AC1 → T1 ✅
- AC2 → T2, T3 ✅
- AC3 → T4 ✅
- AC4 → T5 ✅

---

### H4 — Out-of-scope section populated

✅ **PASS**
4 explicit out-of-scope items: application-layer log encryption, query/reporting UI, log rotation and archival, tamper-evident record hashing.

---

### H5 — Benefit linkage references a named metric

✅ **PASS**
"Metric moved: M2 (AML/CFT audit trail completeness ≥ 99.9% of all payment status transitions captured within 1 second of transition)"

---

### H6 — Complexity is rated

✅ **PASS**
"Complexity: 1 (well understood; simple file append with clear schema)"

---

### H7 — No unresolved HIGH findings

✅ **PASS**
Review report: 1 finding, R1 MEDIUM, acknowledged in /decisions (DEC-2026-05-14-audit-error-handling). No HIGH findings.

---

### H8 — No uncovered ACs

✅ **PASS**
Test plan gap table: No gaps. All 4 ACs have full test coverage.

---

### H8-ext — Cross-story schema dependency check

✅ **PASS**
Dependencies: ham.7 (upstream). No `schemaDepends` declaration required — this story does not introduce pipeline-state schema fields. H8-ext not applicable.

---

### H9 — Architecture Constraints populated; no Category E HIGH findings

✅ **PASS**
Architecture Constraints section populated (module path, JSONL append-only constraint, record schema, ADR-011 artefact-first, log rotation out-of-scope). No Category E findings in review report.

---

### H-E2E — CSS-layout-dependent ACs

✅ **PASS**
Backend audit trail module. No CSS-layout-dependent ACs in the test plan.

---

### H-NFR — NFR profile or explicit "None — reviewed" field

⚠️ **NOTE — W1 warning applies (addressed below in warnings section)**

Story NFR section: `"See artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md — the audit trail story is subject to the feature-level NFR profile."`

This is a reference to the feature-level NFR profile, not the explicit `NFRs: None — reviewed [date]` exemption form. H-NFR is satisfied substantively — NFR profile exists and has been provided. Proceeding, but W1 will be surfaced.

✅ **PASS** (substantive — NFR profile exists and provided; W1 warning noted)

---

### H-NFR2 — Compliance NFR human sign-off

✅ **PASS**

From NFR profile extract:
> "AML/CFT Act 2009 (New Zealand): 5-year record retention obligation applies to all payment transaction records. Regulatory clause: Schedule 2 — Reporting Entity Obligations, section 4(b)."
> "Human sign-off on compliance NFR: Priya Sharma (Head of Platform Partnerships) confirmed 2026-04-20 that this obligation applies to the Hamilton platform. Sign-off recorded in /decisions entry DEC-2026-04-20-amlcft-scope."

Compliance NFR has a named regulatory clause (AML/CFT Act 2009 Schedule 2). Human sign-off is documented: Priya Sharma (Head of Platform Partnerships), 2026-04-20. H-NFR2 passes.

---

### H-NFR3 — Data classification field not blank

✅ **PASS**

From NFR profile extract:
> "Classification: RESTRICTED — payment transaction data with AML/CFT regulatory obligation."

Data classification field is populated.

---

### H-NFR-profile — NFR profile presence check

✅ **PASS**
Story NFR section references `artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md`. Profile is provided in the input bundle. Present.

---

### H-GOV — Governance approval check

Reading `## Approved By` section from the discovery artefact:

```
## Approved By

Priya Sharma — Head of Platform Partnerships — 2026-04-15
```

**Evaluating entries:**
- "Priya Sharma — **Head of Platform Partnerships**" → Non-engineering role (Platform Partnerships = business/product leadership) ✅

H-GOV AC1 applies: `## Approved By` section exists and has ≥1 non-blank named entry. H-GOV passes.

✅ **PASS** — Positive M1 signal: "Head of Platform Partnerships" clearly identifies a non-engineering approver.

---

### H-ADAPTER — Injectable adapter wiring check

✅ **PASS** (N/A)

The audit trail module (`appendAuditRecord`) is a simple file-write export. It does not introduce any injectable adapter (`setX()` function) in the D37 sense. D37 does not apply to this story.

---

## All hard blocks passed ✅

All 17 hard blocks pass. Proceeding to warnings.

---

## Warnings

### W1 — NFRs populated or explicitly "None — reviewed"

⚠️ **Warning W1 applies**

**Issue:** The story's NFR section reads `"See artefacts/2026-04-15-hamilton-dr-failover/nfr-profile.md..."` rather than the canonical `NFRs: None — reviewed [date]` exemption form. The NFRs are substantively handled via the feature-level profile (compliance sign-off documented), but the story-level field does not use the explicit form that prevents ambiguity for future readers.

**Risk if proceeding:** Future readers of the story artefact may not realise the NFR review was intentionally delegated to the feature profile and may flag the story as missing an NFR review.

How do you want to handle this?
1. Resolve it now — update the story NFR section to `NFRs: None — reviewed 2026-04-20` (or explicitly name the profile reference in canonical form)
2. Acknowledge the risk and proceed

**Assume: 2 — acknowledge and proceed**

---

### W2 — Scope stability declared

✅ **W2 passes** — Story has `Scope Stability: Stable`.

---

### W3 — MEDIUM review findings acknowledged in /decisions

⚠️ **Warning W3 applies**

**Review finding R1:** "AC4 says errors are 'thrown as-is' but does not specify whether the state machine's error handler must then raise an alert. Downstream error handling contract is under-specified." Severity: MEDIUM. Status: Acknowledged in /decisions (DEC-2026-05-14-audit-error-handling); deferred to ham.13 smoke test story; residual risk accepted.

**Verifying /decisions acknowledgement:** Entry `DEC-2026-05-14-audit-error-handling` is stated in the review report status field. ✅ Confirmed acknowledged.

**Risk if proceeding:** Downstream error handling contract remains under-specified. If the state machine swallows errors at a higher level, write failures could be silently lost. Risk is accepted and logged.

How do you want to handle this?
1. Resolve it now — add AC5 specifying the error handling contract with the state machine
2. Acknowledge the risk and proceed — already logged in /decisions

**Assume: 2 — acknowledge and proceed** (already logged in /decisions per review report status field)

---

### W4 — Verification script reviewed by domain expert

✅ **W4 passes** — Verification script referenced; no indication of unreviewed status.

---

### W5 — No UNCERTAIN items in test plan gap table

✅ **W5 passes** — Test plan gap table: No gaps.

---

## Oversight level

Epic: `artefacts/2026-04-15-hamilton-dr-failover/epics/ham-epic-2-notification-and-reporting.md`

**Oversight level: Low** — no formal sign-off required. Proceed directly to coding agent assignment.

---

## Standards injection

Story domain field not explicitly set. No domain tags to match against `.github/standards/index.yml`. Standards injection skipped.

---

## ✅ READY — Definition of ready: PROCEED

**Hard blocks:** 17/17 passed
**Warnings:** 2 acknowledged (W1 — NFR delegation form; W3 — MEDIUM finding already in /decisions)
**Oversight:** Low

---

## Coding Agent Instructions

**Story:** ham.11 — Payment status change audit trail
**Feature slug:** 2026-04-15-hamilton-dr-failover
**Assigned:** 2026-05-14
**Oversight level:** Low — proceed directly to implementation

---

### Scope

**You will build:**
1. `src/payments/audit-trail.js` — new module
   - Function `appendAuditRecord(event)`: synchronously appends JSONL record to `logs/payment-audit.jsonl` using `fs.appendFileSync`
   - Function `_getLogPath()`: test helper returning the log path (for spying in tests)
   - No truncate, overwrite, delete, or clear functions on the exported API
   - Write errors propagated as-is to caller — not swallowed
2. JSONL record schema per each write: `{ timestamp: ISO8601, paymentRef: string, fromStatus: string, toStatus: string, operator: string, correlationId: string }`
3. Event subscription hook into ham.7 state machine status change events

**You will NOT build:**
- Application-layer log encryption (infrastructure)
- Audit record query or reporting UI (future story)
- Log rotation or archival (infrastructure)
- Tamper-evident record hashing (deferred — see /decisions 2026-05-10)

---

### Acceptance Criteria

| AC | Requirement | Test |
|----|-------------|------|
| AC1 | Given pending→processing transition, when audit trail receives event, then JSONL record appended to `logs/payment-audit.jsonl` within 1s containing all 6 required fields | T1 |
| AC2 | Given a written record, when parsed as JSON, then passes schema validation; no extraneous top-level fields | T2, T3 |
| AC3 | Given module is imported, when API surface is inspected, then only `appendAuditRecord` and `_getLogPath` are exported — no truncate/overwrite functions | T4 |
| AC4 | Given write fails (disk full / permission error), when appendAuditRecord is called, then error is thrown as-is to caller — not swallowed | T5 |

---

### File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/payments/audit-trail.js` | **Create** | New module |
| `logs/payment-audit.jsonl` | **Created at runtime** | Append-only; do not create in tests |
| `src/payments/state-machine.js` (or event emitter) | **Modify** | Subscribe audit-trail writer to status change events |

---

### Test execution

```bash
npm test
```

Expected: T1–T5 all pass. AC1–AC4 all verified.

---

### Out-of-scope boundary

- Do **not** add any log encryption, compression, or transformation logic
- Do **not** add any query, read, or reporting functions to the module
- Do **not** add log rotation — `logs/` management is out of scope
- Do **not** add tamper-evident hashing to records

---

### Applicable constraints and standards

- **Append-only constraint (ADR):** `fs.appendFileSync` is the only write path. Never use `fs.writeFileSync` or `fs.truncateSync` or any equivalent. The module must not expose a function that can overwrite or truncate the file.
- **ADR-011 (Artefact-first):** This story artefact must be committed to `artefacts/` before the implementation PR is merged.
- **AML/CFT Act 2009 compliance:** Audit records are subject to 5-year retention per Schedule 2 section 4(b). Do not add any deletion logic. Human sign-off: Priya Sharma (Head of Platform Partnerships), 2026-04-20. Logged in /decisions DEC-2026-04-20-amlcft-scope.
- **Error propagation:** Write errors must not be caught or swallowed within `appendAuditRecord`. Let them propagate. The caller (state machine) is responsible for error handling decisions.
- **Data classification:** RESTRICTED — payment transaction data with AML/CFT regulatory obligation.

---

### Dependencies

- **Upstream (must be merged first):** ham.7 — payment status state machine. The status change events this module subscribes to are defined and emitted by ham.7.
- **Downstream (depends on this story):** None within this feature. ham.13 (post-activation smoke test) references audit log existence as a post-condition but does not import this module directly.

---

### Verification script

`artefacts/2026-04-15-hamilton-dr-failover/verification-scripts/ham.11-verification.md`

Run through all scenarios in the verification script before marking the story complete.

---

**Definition of Ready signed off:** 2026-05-14
**Proceed to:** /branch-setup → /implementation-plan → /subagent-execution or /tdd → /verify-completion → /branch-complete