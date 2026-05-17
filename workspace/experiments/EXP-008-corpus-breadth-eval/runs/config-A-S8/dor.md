# Definition of Ready: Automated Regulatory Reporting Pipeline — RBNZ and FMA Return Automation

**Feature:** regulatory-reporting-pipeline-automation
**Test plan status:** Complete (read from disk: `runs/config-A-S8/test-plan.md`)
**Review status:** Conditional pass — all HIGH findings resolved in test plan (read from disk: `runs/config-A-S8/review.md`)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S8

---

## Step 0 — Entry condition check (eval-mode)

All four prior artefacts confirmed on disk:
- ✅ `runs/config-A-S8/discovery.md` — approved (B2 surfaced as BLOCKER; C5 identified)
- ✅ `runs/config-A-S8/definition.md` — complete (8 stories; Step 4a regulated constraint audit; all 5 constraints propagated)
- ✅ `runs/config-A-S8/review.md` — conditional pass (H1/H2/H3 resolved inline in test plan; M1/M2/L1/L2 carried)
- ✅ `runs/config-A-S8/test-plan.md` — complete (6 test modules; 22+ named test IDs; NFR table with concrete thresholds; AC verification script; H1/H2/H3 resolutions operationalised)

Context injection files active: S8-ea-registry-regulatory-reporting-pipeline.md, S8-rbnz-fma-policy-doc.md

---

## Hard block checks

### H1 — All ACs are binary pass/fail testable ✅ PASS

All story ACs were reviewed for testability. Three HIGH findings (H1/H2/H3 in review.md) surfaced ACs that required refinement:
- Story 2.3 AC5 (H1 resolution): abort-pathway test coverage added — both the absence-of-file test and audit log status distinction are now in T-NORM-005
- Story 1.1 AC5 (H2 resolution): business-day calculation requirement specified; three test scenarios defined in T-REG-004
- Story 3.2 AC5 (H3 resolution): pre-launch producibility drill operational workflow defined; drill completion record format and human acceptance test added (T-AUDIT-007)

All ACs as augmented by test plan resolutions are binary testable.

### H2 — No undefined terms in ACs ✅ PASS

Undefined terms surfaced and resolved:
- "business days" → defined as Monday–Friday excluding NZ public holidays per Holidays Act 2003 Schedule 1 (H2 resolution)
- "confirmation artefact" (Story 2.2 AC2) → specified as Jira task in "Approved" status or SharePoint document; ambiguity noted in M2 finding
- "producible within 5 business days" (Story 3.2 AC5) → operationally defined in H3 resolution (complete operational workflow from written request to compliance officer confirmation)
- "independent reviewer" (Story 1.2 AC2) → defined as a person different from the specification author who authored the original Excel macro

### H3 — All stories have an unambiguous owner/team mapping ✅ PASS

Story ownership per delivery convention:
- Epic 1 (Stories 1.1 and 1.2): Finance compliance team (lead) + engineering team (CI/CD gate implementation)
- Epic 2 (Stories 2.1–2.4): Engineering team (lead) + finance operations team (acceptance)
- Epic 3 (Stories 3.1 and 3.2): Engineering team (lead) + compliance officer (pre-launch drill acceptance)

Note: Story 1.1 and Story 1.2 are legal/governance delivery items. They are correctly in scope because they have technical enforcement gate components (CI/CD gates, feature flag default) that the engineering team must implement. The legal documentary work is the responsibility of the Finance Compliance team and is a prerequisite — not a coding task — but the enforcement mechanisms are coding tasks.

### H4 — Dependency ordering is explicit and cycle-free ✅ PASS

Dependency chain:
```
Story 1.1 → [ Story 1.2 ] → Story 2.3 → Story 2.4
Story 2.1 → Story 2.3
Story 2.2 → Story 2.3
Story 3.2 (audit log infrastructure) → Story 2.1, 2.2, 2.3, 3.1 (all depend on audit log being available)
Story 3.1 → Story 2.4 (submission gateway uses staged return file)
```

No cycles detected. Story 3.2 (audit log) is the foundational infrastructure; it should be built first in the engineering sprint. Story 1.2 (normalisation governance) must be completed before Story 2.3 can be activated in production.

### H5 — All constraints from discovery are present in at least one story's ACs ✅ PASS

| Constraint | Story | AC | Test |
|-----------|-------|-----|------|
| C1 — RBNZ s.2.1 methodology notification | 1.1 | AC1/AC2/AC3/AC4/AC5 | T-REG-001/002/003/004 |
| C1 — RBNZ submission deadline (20th) | 3.1 | AC4 (dispatch cutoff) | T-AUDIT-006 |
| C2 — FMA audit trail completeness | 3.2 | AC2 (five components) | T-AUDIT-002 |
| C2 — FMA producibility (5 business days) | 3.2 | AC3/AC5 (drill) | T-AUDIT-007 |
| C2 — FMA 7-year retention | 3.2 | AC4 | T-AUDIT-004 |
| C3 — Human sign-off mandatory | 3.1 | AC2/AC3 | T-WF-001/002 |
| C4 — Normalisation = figure-derivation change | 1.1 | AC2 (historical disclosure) | T-REG-001 |
| C5 — Normalisation governance gap (hidden) | 1.2 | AC2–AC6 | T-REG-005/006/007 |
| C5 — Enforcement gate | 2.3 | AC2/AC5 | T-NORM-002/004/005 |

All 5 constraints have at least one named test. Regulated constraints (C1, C2) each have ≥4 named tests.

### H6 — No story depends on an external system that is not documented in scope ✅ PASS

External system dependencies:
- RRPL-UP-001 (CoreBanking-GL REST API): read-only, documented in EA registry
- RRPL-UP-003 (CardPlatform REST API): read-only, documented in EA registry
- Treasury RRPL-UP-002: manual CSV extract; no API dependency
- RRPL-DN-001 (RBNZ Reporting Portal): submission gateway; read/write in scope; documented in EA registry
- RRPL-DN-002 (FMA Submission Gateway): submission gateway; read/write in scope; documented in EA registry
- SharePoint Finance Compliance folder: document store for compliance evidence; in scope
- PostgreSQL (audit log): infrastructure to be provisioned by Story 3.2

All external systems are named in the EA registry injection file and scoped appropriately in the definition. No undocumented external systems.

### H7 — Failing tests exist before any implementation begins ✅ PASS (TDD declaration)

TDD discipline declared: All test files listed in Output 1 of the test plan must be created with failing assertions before any production code is written. Each test module specifies the test file path and fail condition. The fail condition for each test is concrete (specific field absent, specific operation not blocked, specific return value incorrect) — not a generic "test not yet written" placeholder.

### H8 — Review passed with no unresolved HIGH findings ✅ PASS

Review HIGH findings: H1 (Story 2.3 abort-pathway coverage), H2 (Story 1.1 BS11 business-day calculation), H3 (Story 3.2 producibility drill workflow).
All three: resolved inline in test plan. Resolution status table in review.md confirms: "Resolved inline in test plan" for all three.

No unresolved HIGH findings.

### H9 — Architecture constraint check: no Story introduces an unreviewed architecture change ✅ PASS

Architecture notes:
- Audit log is PostgreSQL INSERT-only (Story 3.2): explicit ADR decision; INSERT-only enforced at service account level (tested in T-AUDIT-001). No other architecture pattern introduces a significant deviation from the EA registry documentation.
- Feature flag pattern (Story 1.2/2.3): injectable adapter with default=false; wiring verified by T-REG-007 (production config check) and T-NORM-002 (abort behaviour).
- No event-driven messaging patterns are introduced that are not documented.

### H-E2E — At least one end-to-end test covers the full regulated path ✅ PASS

T-AUDIT-002 covers the complete end-to-end pipeline run: extraction → normalisation → return file → sign-off → submission. It verifies all five audit log component types are present after a complete run. This is the primary regulated E2E test.

T-AUDIT-007 (producibility drill) covers the human-in-the-loop E2E path from written FMA request to compliance officer confirmation — the FMA audit request response workflow.

### H-NFR1 — Performance NFRs are concrete thresholds ✅ PASS

| NFR | Threshold | Test |
|-----|-----------|------|
| Audit log export | ≤60 seconds at 7-year data volume | T-AUDIT-003 |
| FMA producibility | ≤5 business days (operational drill) | T-AUDIT-007 |
| Extraction retry | ≤3 retries; ≤60 seconds max delay | NFR-PERF-01 |

All NFRs are concrete thresholds. No generic "must be performant" language.

### H-NFR2 — Security NFRs are named standards, not generic statements ✅ PASS

| NFR | Standard | Test |
|-----|---------|------|
| Source system read-only access | No write-scope token in extraction service account | T-EXTR-002 |
| Audit log immutability | INSERT-only for service account at DB permission level | T-AUDIT-001 |
| Path traversal guard | Per ougl coding standard — resolved paths validated before file writes | Not a story AC; enforced via coding standards and code review |

---

## Warnings (W1–W5)

### W1 — Oversight level: HIGH risk feature ⚠️ ACKNOWLEDGED

This feature delivers a regulated reporting pipeline subject to RBNZ Prudential Supervision and FMA Oversight. Regulatory breaches could result in supervisory action, public disclosure obligations, and financial penalties. Oversight level is HIGH. Every AC in this feature requires compliance officer sign-off before the relevant story is marked accepted.

### W2 — Story 1.2 is a legal/governance delivery item ⚠️ NOTED

Story 1.2 (Normalisation Logic Independent Review) is primarily a governance process delivery item, not a software engineering story. The engineering deliverables are the document-presence checks (T-REG-005/006/007) and the NORMALISATION_LAYER_APPROVED flag mechanism (T-NORM-002). The independent review itself and the governance sign-off are human actions that must be completed and evidenced before Story 2.3 can be activated in production. This dependency must be flagged explicitly in sprint planning — Story 1.2 cannot be "done" until all human governance actions are completed, not just the engineering gates.

### W3 — Pre-launch producibility drill (T-AUDIT-007) is human-in-the-loop ⚠️ NOTED

T-AUDIT-007 cannot be automated. It requires the compliance officer to act as the simulated FMA examiner, review the exported audit trail, and sign a drill completion record. This is a go-live gate item — the CI/CD pipeline must check for the presence of the "producibility-drill-signoff" document in the compliance document store before permitting go-live. The compliance officer sign-off record is the go-live gate evidence, not a CI/CD test pass.

### W4 — RBNZ response to methodology notification may delay go-live ⚠️ ACKNOWLEDGED

If RBNZ initiates a methodology review (rather than issuing an acknowledgement), the PIPELINE_GO_LIVE_APPROVED gate is set to false and go-live is blocked. This is the correct regulatory behaviour but introduces a schedule risk that cannot be mitigated by engineering effort. Finance Compliance team must engage RBNZ proactively to seek timely acknowledgement.

### W5 — Normalisation rules version 1.0.0 defines the initial approval scope ⚠️ NOTED

Any future update to the normalisation rules after go-live requires a new governance cycle: updated specification document, independent review, updated governance sign-off, and a corresponding version tag. The engineering team must document this re-approval workflow in the pipeline maintenance guide before go-live.

---

## Oversight level determination

**Oversight level: HIGH**

Rationale:
- Regulatory breach risk: RBNZ and FMA direct supervision exposure
- Human governance dependency: pre-launch items cannot be completed by engineering alone
- C5 hidden constraint present: the normalisation governance gap was not part of the original problem statement and represents a pre-existing compliance risk that this feature formalises — incorrect implementation would create a new disclosure obligation
- Pre-launch drill required: human acceptance test by compliance officer is a go-live gate

**Implications of HIGH oversight:**
- Every story requires compliance officer sign-off at acceptance, not just tech lead sign-off
- Stories 1.1 and 1.2 must be accepted by the Finance Compliance team lead before any Epic 2 stories proceed to production deployment
- The DoR must be re-signed if any regulated AC changes during implementation
- Sprint review must include a compliance officer attendance for Epic 1 story acceptance

---

## DoR contract — file touchpoints and out-of-scope constraints

### Files in scope

| File | Story | Reason |
|------|-------|--------|
| `src/compliance-gates/rbnz-methodology-notification.js` | 1.1 | RBNZ notification document check and BS11 gate |
| `src/compliance-gates/bs11-gate.js` | 1.1 | Business-day calculation gate (H2 resolution) |
| `src/compliance-gates/normalisation-governance-gate.js` | 1.2 | Normalisation specification, review, and sign-off document checks |
| `src/extraction/corebanking-gl-extractor.js` | 2.1 | CoreBanking-GL read-only REST API extraction |
| `src/extraction/cardplatform-extractor.js` | 2.1 | CardPlatform read-only REST API extraction |
| `src/extraction/treasury-csv-ingester.js` | 2.2 | Treasury manual CSV ingestion with confirmation artefact gate |
| `src/transformation/normalisation-engine.js` | 2.3 | Normalisation transformation with feature flag enforcement |
| `src/transformation/normalisation-rules-loader.js` | 2.3 | Version-tagged rule set loader |
| `src/return-file/return-file-generator.js` | 2.4 | Pre-populated return file generation with RBNZ format validation |
| `src/workflow/submission-gateway.js` | 3.1 | Analyst review, sign-off gate, and submission integration |
| `src/workflow/deadline-monitor.js` | 3.1 | T minus N business day deadline alert |
| `src/audit-log/audit-log-writer.js` | 3.2 | INSERT-only audit log write module |
| `src/audit-log/audit-log-exporter.js` | 3.2 | Audit log export function (CSV/JSON, ≤60s) |
| `src/audit-log/retention-monitor.js` | 3.2 | 7-year retention flagging |
| `tests/compliance-gates/rbnz-methodology-notification.test.js` | 1.1 | T-REG-001/002 |
| `tests/compliance-gates/bs11-notification-gate.test.js` | 1.1 | T-REG-003/004 |
| `tests/compliance-gates/normalisation-governance-gate.test.js` | 1.2 | T-REG-005/006/007 |
| `tests/extraction/source-data-log.test.js` | 2.1 | T-EXTR-001 |
| `tests/extraction/read-only-enforcement.test.js` | 2.1 | T-EXTR-002 |
| `tests/extraction/field-completeness-validation.test.js` | 2.1 | T-EXTR-003 |
| `tests/extraction/treasury-csv-ingestion.test.js` | 2.2 | T-EXTR-004/005 |
| `tests/transformation/normalisation-engine.test.js` | 2.3 | T-NORM-001 to T-NORM-006 |
| `tests/return-file/format-validation.test.js` | 2.4 | T-RETFILE-001 |
| `tests/return-file/audit-trail-linkage.test.js` | 2.4 | T-RETFILE-002 |
| `tests/return-file/upstream-failure-gate.test.js` | 2.4 | T-RETFILE-003 |
| `tests/workflow/submission-gate.test.js` | 3.1 | T-WF-001/002 |
| `tests/workflow/analyst-amendment-log.test.js` | 3.1 | T-WF-003 |
| `tests/workflow/deadline-alert.test.js` | 3.1 | T-AUDIT-006 |
| `tests/audit-log/immutability.test.js` | 3.2 | T-AUDIT-001 |
| `tests/audit-log/completeness.test.js` | 3.2 | T-AUDIT-002 |
| `tests/audit-log/export-performance.test.js` | 3.2 | T-AUDIT-003 |
| `tests/audit-log/retention-policy.test.js` | 3.2 | T-AUDIT-004 |
| `tests/audit-log/export-formats.test.js` | 3.2 | T-AUDIT-005 |
| `tests/audit-log/producibility-drill.test.js` | 3.2 | T-AUDIT-007 |

### Files out of scope

- Any file under `src/legacy-excel-macro/` — the Excel macro is being retired; no modification to it is permitted (any modification would itself constitute a new normalisation methodology change requiring a new RBNZ notification)
- Any file under `src/existing-rbnz-manual-submission-workflow/` — manual process is out of scope per discovery MVP boundary
- Any changes to RBNZ or FMA portal authentication configuration — credential management is owned by the Finance Compliance team, not the engineering team delivering this feature

---

## Coding Agent Instructions

**You are implementing the Automated Regulatory Reporting Pipeline for RBNZ and FMA return automation.**

**STOP before writing any production code. Read these instructions completely first.**

### Regulatory context (mandatory — do not skip)
This feature automates the production of regulatory returns submitted to the RBNZ and FMA. Incorrect implementation could constitute a regulatory breach. You are not implementing a standard data pipeline — every story in this feature has a regulated constraint that must be enforced with the same rigour as a production financial control.

The three regulated gate conditions that must be correctly implemented before go-live:

**Gate 1 (C1 — RBNZ): `BS11_NOTIFICATION_DATE` CI/CD gate**
- Must count business days (not calendar days) using NZ public holidays per Holidays Act 2003 Schedule 1
- Must block deployment when elapsed business days < 30
- Must check `RBNZ_S21_ACKNOWLEDGEMENT_DOC_ID` is populated in deployment config before go-live
- Tests: T-REG-003, T-REG-004

**Gate 2 (C2 — FMA): Audit log immutability and producibility drill go-live gate**
- PostgreSQL service account must have INSERT permission only — no UPDATE, no DELETE
- A "producibility-drill-signoff" compliance document must exist before go-live CI/CD gate passes
- The audit log export must complete in ≤60 seconds at 7-year data volume (tested with simulated dataset)
- Tests: T-AUDIT-001, T-AUDIT-003, T-AUDIT-007

**Gate 3 (C5 — Normalisation governance): `NORMALISATION_LAYER_APPROVED` flag**
- Default value in all environments: `false`
- May only be set to `true` when `independent_review_doc_id` AND `governance_signoff_doc_id` are both populated in the production deployment configuration (not environment variables alone — deployment config)
- When flag is `false`: pipeline MUST abort before the return file generation step; MUST NOT stage any file to SharePoint; MUST write a `normalisation_skipped_abort` audit log entry
- After a flag=false abort: verify no file with the aborted run ID exists in SharePoint; verify audit log has only the abort entry for that run ID (not a run_complete entry)
- Tests: T-NORM-002, T-NORM-005

### TDD sequence (mandatory — one story at a time)
1. Create the failing test file for the story before writing any production code
2. Confirm the test runs and fails for the correct reason (not a syntax error)
3. Implement the minimal production code to make the test pass
4. Confirm all tests for the story pass
5. Commit with message: `feat(story-X.X): [story title] — tests green`
6. Do not move to the next story until the current story's tests all pass

### Dependency order for implementation
Implement stories in this order to respect dependencies:
1. Story 3.2 (audit log infrastructure — all other stories write to this)
2. Stories 1.1 and 1.2 in parallel with Stories 2.1 and 2.2 (no interdependency)
3. Story 2.3 (depends on: audit log from 3.2; extraction from 2.1/2.2; governance from 1.2)
4. Story 2.4 (depends on: transformation from 2.3)
5. Story 3.1 (depends on: return file from 2.4; audit log from 3.2)

### Critical implementation rules
- **`NORMALISATION_LAYER_APPROVED` default is `false`** — this is not a missing field; it is a deliberate safety default. Never initialise it to `true`.
- **Business day calculation** — use a maintained NZ public holiday dataset or a business-day calculation library that supports New Zealand public holidays per the Holidays Act 2003. Document which library or dataset is used in the code comments.
- **Audit log writes are INSERT-only** — the audit log writer module must never execute UPDATE or DELETE SQL. If you need to mark a record (e.g., retention-review-required), INSERT a new status record — do not update the original.
- **Abort-before-file** — whenever an abort occurs (flag=false, log write failure, rule version mismatch), verify in the test that no file exists in the SharePoint staging area with the aborted run's ID. This is not optional validation — it is a security and compliance control.
- **Transformation log per step** — every call to a normalisation rule must produce an audit log entry before the next step executes. If the log write fails, the pipeline run must abort immediately. Do not batch transformation log writes.

### What to do if a compliance gate document is absent in the test environment
If a compliance gate test (T-REG-001 through T-REG-007) fails because the compliance document store does not contain the expected document, do NOT mock the document into existence to make the test pass. Instead: confirm the test is correctly failing for the right reason; leave the test failing; and open a comment in the PR body identifying the missing document and the compliance team action required. The compliance team must produce the document — not the engineering team.

---

## DoR sign-off

| Check | Status |
|-------|--------|
| H1 — ACs are binary testable | ✅ PASS |
| H2 — No undefined terms | ✅ PASS |
| H3 — Story owner mapping | ✅ PASS |
| H4 — Dependency ordering cycle-free | ✅ PASS |
| H5 — All constraints in story ACs | ✅ PASS |
| H6 — No undocumented external systems | ✅ PASS |
| H7 — Failing tests exist (TDD declaration) | ✅ PASS |
| H8 — Review passed, no unresolved HIGH | ✅ PASS |
| H9 — No unreviewed architecture changes | ✅ PASS |
| H-E2E — End-to-end regulated path test exists | ✅ PASS |
| H-NFR1 — NFR thresholds concrete | ✅ PASS |
| H-NFR2 — Security NFRs named standards | ✅ PASS |

**DoR verdict: ✅ PROCEED — with HIGH oversight**

All hard blocks pass. Warnings W1–W5 acknowledged. Oversight level HIGH — compliance officer acceptance required at Epic 1 story acceptance before any Epic 2 story proceeds to production deployment.

---

<!-- CPF-TRACE
stage: /definition-of-ready
model: claude-sonnet-4-6
config: A

dor_constraint_verification:
- C1 (RBNZ — regulated):
    discovery: ✅ (problem statement, B2 regulatory disclosure gap)
    definition: ✅ (Story 1.1 — RBNZ s.2.1 notification, BS11 30-day gate, historical self-disclosure)
    review: ✅ (H2 surfaced BS11 business-day calculation gap — resolved)
    test_plan: ✅ (T-REG-001/002/003/004; NFR-C1-01/02/03; AC verification script Step 1)
    dor: ✅ (Gate 1 coding instructions; H2 resolution confirmed in contract)
    enforcement_mechanism: CI/CD gate checks BS11_NOTIFICATION_DATE (business-day calculation) + RBNZ_S21_ACKNOWLEDGEMENT_DOC_ID in deployment config

- C2 (FMA audit trail — regulated):
    discovery: ✅ (regulatory compliance risk section; FMA audit trail requirement called out)
    definition: ✅ (Story 3.2 — INSERT-only PostgreSQL, 7-year retention, 5-business-day producibility; Story 2.1/2.2/2.3 — audit log entries at every step)
    review: ✅ (H3 surfaced producibility drill operational workflow gap — resolved; M1 surfaced format spec maintenance)
    test_plan: ✅ (T-AUDIT-001 through T-AUDIT-007; NFR-C2-01 through NFR-C2-06; AC verification script Steps 3)
    dor: ✅ (Gate 2 coding instructions; H3 resolution operationalised as compliance document gate)
    enforcement_mechanism: CI/CD go-live gate checks for producibility-drill-signoff document; PostgreSQL service account INSERT-only at DB permission level

- C3 (human sign-off mandatory):
    discovery: ✅
    definition: ✅ (Story 3.1 AC2/AC3 — submission blocked without sign-off record)
    review: ✅
    test_plan: ✅ (T-WF-001/002; NFR-C3-01; AC verification script Step 4)
    dor: ✅ (H5 table confirms C3 present in Story 3.1)

- C4 (normalisation = figure-derivation change):
    discovery: ✅
    definition: ✅ (Story 1.1 AC2 — historical disclosure for unapproved normalisation)
    review: ✅
    test_plan: ✅ (T-REG-001 covers disclosure of normalisation as methodology adjustment)
    dor: ✅ (H5 table confirms C4 present in Story 1.1 historical disclosure)

- C5 (normalisation governance gap — hidden constraint):
    c5_surfaced_at: /discovery (B2 — BLOCKER)
    discovery: ✅ (B2 surfaced from EA registry RRPL-RISK-002 + FMA policy doc s.4.2 + follow-up context)
    definition: ✅ (Story 1.2 — full governance cycle; NORMALISATION_LAYER_APPROVED flag default=false; Story 2.3 — flag enforcement gate)
    review: ✅ (H1 strengthened C5 gate enforcement; T-NORM-005 added for post-abort verification)
    test_plan: ✅ (T-REG-005/006/007 — governance documents; T-NORM-002/004/005 — flag enforcement)
    dor: ✅ (Gate 3 coding instructions — NORMALISATION_LAYER_APPROVED default=false, enforcement rules, document ID requirements)
    enforcement_mechanism: Feature flag default=false; production config requires both governance document IDs; CI/CD gate checks document presence

cpf_general: 1.00 (5/5 constraints propagated through all 5 stages)
cpf_regulated: 1.00 (2/2 regulated constraints C1 and C2 propagated with named tests)
c5_surfaced: true
c5_surface_stage: /discovery
c5_enforcement_stage: /definition (Story 1.2 + Story 2.3)
c5_test_coverage: T-REG-005, T-REG-006, T-REG-007, T-NORM-002, T-NORM-005

all_hard_blocks_pass: true
oversight_level: HIGH
dor_verdict: PROCEED
-->
