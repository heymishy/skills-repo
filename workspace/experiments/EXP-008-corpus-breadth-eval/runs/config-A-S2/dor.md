# Definition of Ready: Digital Personal Loan Origination — Regulated Credit Advance Flow

**Feature:** lending-origination-digital-flow
**Story:** lending-origination-digital-flow (all 8 stories evaluated)
**Test plan status:** Complete (read from disk: `runs/config-A-S2/test-plan.md`)
**Review status:** Conditional pass — 3 HIGH findings resolved in test plan (read from disk: `runs/config-A-S2/review.md`)
**Model:** claude-sonnet-4-6 (Config A — uniform Sonnet)
**Date:** 2026-05-17
**Run:** EXP-008 Config A S2

---

## Step 0 — Entry condition check (eval-mode)

- Discovery artefact: ✅ on disk (`runs/config-A-S2/discovery.md`)
- Definition artefact: ✅ on disk (`runs/config-A-S2/definition.md`)
- Review artefact: ✅ on disk (`runs/config-A-S2/review.md`) — conditional pass
- Test plan artefact: ✅ on disk (`runs/config-A-S2/test-plan.md`)
- Review HIGH findings resolution: ✅ H1 resolved in T-REG-003/T-REG-004; H2 resolved in T-GATE-001/T-GATE-002/T-GATE-003; H3 resolved in T-AUDIT-001
- Context injection files: ✅ S2-ea-registry-lending-origination.md, S2-cccfa-fma-policy-excerpt.md — active

---

## Hard block checks (H1–H9, H-E2E, H-NFR)

All hard blocks must pass for DoR sign-off to be granted.

### H1 — Is the problem statement clear and bounded?

**Check:** Does the discovery artefact define the problem with sufficient specificity for the coding agent to understand the delivery context?

**Result: ✅ PASS**

Discovery artefact clearly defines: digital personal loan origination for FinTech Direct NZ, regulated domain (CCCFA/FMA), 4 personas, MVP scope (6 items + 3 compliance pre-conditions). The problem is bounded (not "all lending products" — personal loans only, ≤$30k automated). The B1 blocker (FMA enforcement risk from undisclosed demographic disparity) is explicitly named and carried forward through all stages.

---

### H2 — Do all stories have testable acceptance criteria?

**Check:** Are all ACs binary pass/fail? Can the coding agent verify them without human judgement?

**Result: ✅ PASS (conditional — with review H1 and H2 resolutions applied)**

- Stories 2.1–2.3 and 3.1–3.2: ACs are engineering-testable (API responses, feature flag states, database assertions, schema contract)
- Stories 1.1, 1.2, 1.3 (compliance gate stories): ACs are governance-testable (document existence, document fields, sign-off status). Not engineering-implemented but testable via compliance document store assertions (T-COMP-001 to T-COMP-003, T-REG-001 to T-REG-004). The coding agent implements the document store check infrastructure; governance teams produce the documents.
- Review H1 resolution (Story 1.2 AC4 — remediation threshold): operationalised in T-REG-004 (≤2% gap OR legal counsel opinion — both are binary testable)
- Review H2 resolution (Story 2.3 AC6 — enforcement mechanism): operationalised in T-GATE-001/T-GATE-002/T-GATE-003 (feature flag default=false; deployment validator checks document IDs; REFER fallback tested)

---

### H3 — Are dependencies explicit and ordered?

**Check:** Are story dependencies named? Is the delivery ordering safe for a coding agent that implements stories independently?

**Result: ✅ PASS (with one IMPORTANT ordering constraint — see below)**

Explicit dependencies:
- Epic 1 stories (1.1, 1.2, 1.3) are governance actions. They gate Epic 2 go-live but do not block Epic 2 engineering build. The coding agent can build Stories 2.1–2.3 with `CREDIT_MODEL_LIVE_ENABLED=false` and `CENTRIX_PERSONAL_LENDING_ENABLED=false` without waiting for Epic 1 completion.
- Story 3.2 (audit trail schema) must be agreed before Stories 2.2 and 2.3 proceed to integration testing (review H3 resolution). T-AUDIT-001 enforces the schema contract.
- Story 3.1 (analyst queue) is required before Story 2.3 can route REFER decisions correctly in integration tests.

**IMPORTANT ordering constraint:** T-AUDIT-001 (audit record schema test) must be GREEN before Story 2.2 or Story 2.3 integration tests run. This is enforced by the test suite ordering: `tests/audit-trail/audit-schema.test.js` must be in the pre-integration test suite.

---

### H4 — Are regulated constraints explicitly named in the DoR contract?

**Check:** Does this DoR artefact name all regulated constraints and specify the enforcement mechanism for each?

**Result: ✅ PASS — see Contract section below**

All three regulated constraints (C1, C2, C5) are named in the contract with:
- The specific story/file where each is implemented
- The specific test(s) that verify the constraint
- The specific feature flag or document gate that enforces the constraint at runtime

---

### H5 — Does the test plan cover regulated NFRs?

**Check:** Does the test plan include at minimum one test case per regulated constraint?

**Result: ✅ PASS**

| Constraint | Test cases | Adversarial test case |
|-----------|-----------|----------------------|
| C1 — CCCFA s.9C | T-COMP-001, T-COMP-002, T-FLOW-001, T-FLOW-002, T-AUDIT-001, T-AUDIT-002, T-AUDIT-003 | T-FLOW-001 (submit without `declared_purpose`) |
| C2 — FMA model validation | T-REG-003, T-REG-004, T-GATE-001, T-GATE-002, T-GATE-003 | T-REG-003 (internal validator), T-GATE-002 (deploy without documents) |
| C3 — Centrix DSA | T-COMP-003, T-FLOW-004 | T-FLOW-004 (bureau query without DSA) |
| C4 — $30k threshold | T-FLOW-003, T-ANALYST-001 | T-FLOW-003 ($30,001 → must not auto-decide) |
| C5 — FMA enforcement risk | T-REG-001, T-REG-002, T-REG-004, T-GATE-002 | T-REG-004 (>2% gap without legal opinion), T-GATE-002 (deploy without C5 doc) |

---

### H6 — Is the scope bounded (no scope creep from discovery)?

**Check:** Does the definition stay within the discovery MVP scope?

**Result: ✅ PASS**

Discovery MVP scope: (1) digital application capture, (2) automated affordability assessment, (3) credit decision ≤$30k, (4) analyst queue >$30k, (5) decision audit trail, (6) compliance gate clearance. Definition stories map directly to these 6 items with no additional scope added. Mortgage products, >$30k automated decisions, and API partnerships are explicitly out of scope in all stories.

---

### H7 — Does the coding agent have sufficient context to begin implementation?

**Check:** Does the Coding Agent Instructions block (below) give the agent everything it needs to start without operator intervention?

**Result: ✅ PASS — Coding Agent Instructions block is complete**

---

### H8 — Are architecture constraints compatible with existing platform guardrails?

**Check:** Does anything in the definition conflict with `.github/architecture-guardrails.md` or the tech stack?

**Result: ✅ PASS (scoped)**

The `.github/architecture-guardrails.md` governs the skills platform, not the lending origination domain. No conflicts. The lending origination domain constraints (C1–C5) are domain-specific and are carried in the DoR contract. The compliance document store (required by T-COMP-001 to T-REG-004) is a new service — its design is not constrained by the platform guardrails.

---

### H9 — Review pass confirmed?

**Check:** Does the review artefact confirm a pass (or conditional pass with findings resolved)?

**Result: ✅ PASS**

Review result: conditional pass. Three HIGH findings (H1, H2, H3) are resolved in the test plan. No HIGH findings remain open. Four IMPORTANT findings (I1–I4) are noted and addressed:
- I1 — compliance gate stories marked as governance-delivered (addressed in Coding Agent Instructions below)
- I2 — WCAG 2.1 AA verified by T-NFR-002 (axe-core)
- I3 — tamper-evidence mechanism: database layer permission rejection (T-AUDIT-002)
- I4 — DSA amendment fallback noted in plain-language AC verification script (Step 4)

---

### H-E2E — Is there an end-to-end test covering the critical regulated path?

**Check:** Is there a test that covers the complete regulated journey (application → affordability → decision → audit) under the go-live constraint scenario?

**Result: ✅ PASS (composite)**

The following test sequence covers the critical regulated E2E path:
1. T-GATE-001 (model gate defaults to false)
2. T-COMP-001/T-REG-003/T-REG-004 (compliance documents present and valid)
3. T-GATE-002 (deployment gate enforced with document IDs)
4. T-GATE-003 (REFER fallback when flag false)
5. T-FLOW-001 + T-FLOW-002 (application and affordability)
6. T-FLOW-003 ($30k boundary)
7. T-AUDIT-001 + T-AUDIT-002 (audit trail schema and tamper evidence)

No single test file covers all steps, but the test modules in sequence cover the complete regulated path. The adversarial scenario (T-GATE-002 with no compliance documents) is the most critical E2E path and is explicitly tested.

---

### H-NFR — Are NFRs specific and testable?

**Result: ✅ PASS**

- CCCFA 7-year retention: T-AUDIT-003 (configuration assertion — ≥2555 days)
- FMA demographic disparity threshold: T-REG-004 (≤2% or legal opinion — binary)
- $30k threshold: T-FLOW-003 (boundary value analysis — binary)
- API performance: T-NFR-001 (p95 ≤2000ms — measurable)
- WCAG 2.1 AA: T-NFR-002 (axe-core — zero violations)
- Tamper evidence: T-AUDIT-002 (DB layer rejection — binary)

---

### H-NFR2 — Are regulated NFRs in both the test plan AND the DoR contract?

**Result: ✅ PASS — see contract section below**

C1, C2, C5 regulated NFRs are named in the contract with specific test file references.

---

### H-NFR3 — Is there a test data strategy covering regulated scenarios?

**Result: ✅ PASS**

Test plan section "Test data strategy" covers:
- Synthetic data requirement (no real customer data)
- 5 fixture types for C1–C5 scenarios
- Compliance document store fixture with reset capability
- 5 adversarial test cases explicitly named

---

## Warning checks (W1–W5)

### W1 — Stories delivered by governance (not coding agent): acknowledged?

**Acknowledgement required:** Stories 1.1, 1.2, 1.3 are compliance gate stories delivered by Legal and Compliance teams. The coding agent implements the infrastructure to check for compliance documents (T-COMP-001 to T-REG-004). The coding agent does NOT produce the legal opinion, sign-off document, or validation report.

**Operator acknowledgement: ✅ ACKNOWLEDGED** (eval-mode: EXP-008 auto-acknowledge)

### W2 — Independent validator not yet engaged (Story 1.2 critical path risk)?

**Warning:** Independent model validation (C2, Story 1.2) requires an independent third-party validator. The validator has not been engaged per the discovery artefact. Validator engagement must begin before the credit decisioning model is built to final spec — validation takes time. If validator engagement begins after Epic 2 engineering is complete, Q3 go-live may be at risk.

**Operator acknowledgement: ✅ ACKNOWLEDGED** (eval-mode)

### W3 — FMA relationship management not a story deliverable?

**Warning:** The FMA disclosure decision (Story 1.2, C5) requires a decision on how to engage with the FMA. This is a board/exec decision, not a product delivery item. The DoR cannot enforce the quality of the FMA engagement decision — it can only enforce that a decision document exists and is correctly formed. The risk of a poor FMA engagement decision (e.g., a risk accept with weak rationale that exposes the firm to enforcement action) is not mitigated by the DoR gate.

**Operator acknowledgement: ✅ ACKNOWLEDGED** (eval-mode)

### W4 — Compliance document store is a new service: design not yet specified?

**Warning:** Tests T-COMP-001 to T-REG-004 assume the existence of a compliance document store with a specific API (type, fields, status, sign_off_status). The design of this service is not in the definition artefact. The implementation plan must specify the compliance document store interface before the coding agent begins building the gate check tests.

**Operator acknowledgement: ✅ ACKNOWLEDGED** (eval-mode)

### W5 — Centrix bureau API integration credentials not named?

**Warning:** T-FLOW-004 tests the fallback when `CENTRIX_PERSONAL_LENDING_ENABLED=false`. Testing the positive case (bureau queries enabled) requires a Centrix test API credential or a stub/mock. The test plan does not specify which approach is used. The implementation plan must clarify: mock/stub the Centrix API for tests, or use a Centrix test sandbox with real credentials.

**Operator acknowledgement: ✅ ACKNOWLEDGED** (eval-mode)

---

## DoR verdict: PROCEED

All hard blocks pass. All warnings acknowledged. The feature is ready for the coding agent.

**Oversight level:** HIGH — regulated domain (CCCFA + FMA), compliance gate stories with governance delivery, adversarial test cases required.

---

## DoR Contract — Scope and regulated constraint gates

### In-scope file touchpoints for coding agent

| File / module | Story | Purpose |
|--------------|-------|---------|
| `tests/compliance-gates/cccfa-methodology-signoff.test.js` | 1.1 | T-COMP-001, T-COMP-002 — CCCFA document gate |
| `tests/compliance-gates/fma-disclosure-gate.test.js` | 1.2 | T-REG-001, T-REG-002 — FMA disclosure document gate |
| `tests/compliance-gates/fma-model-validation-gate.test.js` | 1.2 | T-REG-003, T-REG-004 — FMA validation report gate and demographic disparity threshold |
| `tests/compliance-gates/centrix-dsa-amendment.test.js` | 1.3 | T-COMP-003 — Centrix DSA document gate |
| `tests/feature-flags/credit-model-live-flag.test.js` | 2.3 | T-GATE-001, T-GATE-002, T-GATE-003 — CREDIT_MODEL_LIVE_ENABLED flag enforcement |
| `tests/origination-flow/application-submission.test.js` | 2.1 | T-FLOW-001 — application submission E2E |
| `tests/origination-flow/affordability-assessment.test.js` | 2.2 | T-FLOW-002 — affordability calculation |
| `tests/origination-flow/credit-decision-threshold.test.js` | 2.3 | T-FLOW-003 — $30k boundary |
| `tests/origination-flow/bureau-query-flag.test.js` | 2.2 | T-FLOW-004 — Centrix DSA fallback |
| `tests/analyst-queue/threshold-routing.test.js` | 3.1 | T-ANALYST-001 — analyst queue routing |
| `tests/analyst-queue/manual-decision.test.js` | 3.1 | T-ANALYST-002 — analyst decision with rationale |
| `tests/audit-trail/audit-schema.test.js` | 3.2 | T-AUDIT-001 — audit schema contract |
| `tests/audit-trail/tamper-evidence.test.js` | 3.2 | T-AUDIT-002 — tamper evidence |
| `tests/audit-trail/retention-policy.test.js` | 3.2 | T-AUDIT-003 — 7-year retention |
| `tests/performance/api-latency.test.js` | 2.1, 2.2 | T-NFR-001 — API latency p95 |
| `tests/accessibility/wcag-aa.test.js` | 2.1 | T-NFR-002 — WCAG 2.1 AA |
| `src/compliance-document-store/` | 1.1, 1.2, 1.3 | Compliance document store interface (new service) |
| `src/feature-flags/` | 2.3 | Feature flag service — CREDIT_MODEL_LIVE_ENABLED, CENTRIX_PERSONAL_LENDING_ENABLED |
| `src/origination/application.js` | 2.1 | Application submission handler |
| `src/origination/affordability.js` | 2.2 | Affordability assessment engine |
| `src/origination/credit-decision.js` | 2.3 | Credit decision integration |
| `src/analyst-queue/` | 3.1 | Analyst queue service |
| `src/audit-trail/` | 3.2 | Audit record service |

### Out of scope — DO NOT TOUCH

- Mortgage origination flow (`src/mortgage/` if it exists)
- Any application with loan_amount > $30,000 receiving an automated decision (automated decisions are capped at $30,000 — C4)
- Direct FMA API integration (FMA engagement is a governance action, not an engineering task)
- Any code that directly reads or writes to the demographic disparity analysis results from the credit model (the model itself is out of scope — the coding agent implements the gate checks and feature flags around it)

### Regulated constraint gates — mandatory for go-live

The following gates MUST be enforced in production before the credit decisioning model is live. The coding agent must implement the enforcement mechanism for each:

**Gate 1 — C1 CCCFA methodology gate:**
- Enforcement mechanism: compliance document store check (`type: "cccfa-methodology-sign-off"`, `status: "signed"`)
- Test: T-COMP-001, T-COMP-002
- Feature flag dependency: None (this gate is a pre-condition for Story 2.2 build start)

**Gate 2 — C2/C5 FMA model validation and demographic disparity gate:**
- Enforcement mechanism: `CREDIT_MODEL_LIVE_ENABLED` feature flag defaults to `false`; deployment validator checks `fma_disclosure_document_id` and `fma_validation_report_id` are present and reference signed documents
- Demographic disparity enforcement: T-REG-004 verifies that the validation report shows ≤2% Māori/Pākehā approval gap OR includes a legal counsel opinion on residual disparity — deployment gate must not pass without this
- Tests: T-REG-001, T-REG-002, T-REG-003, T-REG-004, T-GATE-001, T-GATE-002, T-GATE-003
- **CRITICAL:** This is the C5 enforcement gate. The demographic disparity finding (12% Māori/Pākehā approval rate gap) is not yet disclosed to the FMA. A model with an unaddressed disparity must not go live. T-GATE-002 adversarial test is the key enforcement test.

**Gate 3 — C3 Centrix DSA gate:**
- Enforcement mechanism: `CENTRIX_PERSONAL_LENDING_ENABLED` feature flag; defaults to `false` if DSA not amended
- When false: all applications route to analyst queue (bureau queries disabled)
- Test: T-COMP-003, T-FLOW-004

**Gate 4 — C4 $30k automated decision threshold:**
- Enforcement mechanism: credit decision service rejects requests for loan_amount > $30,000 for automated decisions; routes to analyst queue
- Test: T-FLOW-003 (boundary value analysis at $30,000/$30,001)

---

## Coding Agent Instructions

**You are implementing the Digital Personal Loan Origination — Regulated Credit Advance Flow (lending-origination-digital-flow).**

**Oversight level: HIGH — regulated domain.**

### What you are building

A regulated digital loan origination system for FinTech Direct NZ, covering:
1. A compliance document store service that tracks governance gate clearances (CCCFA, FMA, Centrix DSA)
2. A feature flag service controlling when the credit decisioning model is live (`CREDIT_MODEL_LIVE_ENABLED`) and when bureau queries are enabled (`CENTRIX_PERSONAL_LENDING_ENABLED`)
3. A digital loan application interface (mobile + web) that collects CCCFA s.9C required fields
4. An affordability assessment engine that calculates surplus income and writes an audit record
5. A credit decision integration service capped at $30,000 automated decisions; above routes to analyst queue
6. An analyst queue service for manual review and decision recording
7. An audit trail service with tamper-evident, 7-year-retained records

### What you are NOT building

- The FMA disclosure decision (governance action — not engineering)
- The CCCFA legal opinion (governance action — not engineering)
- The credit decisioning model itself (already exists — you implement the gate checks around it)
- Any mortgage origination flow

### Mandatory implementation constraints

1. `CREDIT_MODEL_LIVE_ENABLED` MUST default to `false` in all environments. Never set to `true` in production without the compliance document IDs set in deployment config.
2. The audit_records table MUST be append-only. No UPDATE or DELETE permissions on any service account.
3. All affordability assessment records MUST include all 4 CCCFA input fields: income, expenses, existing_debt_obligations, declared_purpose.
4. The automated credit decision threshold MUST be enforced at exactly $30,000 (inclusive). $30,001 routes to analyst queue.
5. T-AUDIT-001 (audit schema contract) MUST be GREEN before Story 2.2 or Story 2.3 integration tests run.

### TDD sequence

Implement in this order:
1. Compliance document store interface + T-COMP-001 (fail → pass) and T-REG-001, T-REG-003 (fail → pass)
2. Feature flag service + T-GATE-001 (fail → pass)
3. T-REG-004 (adversarial — must fail RED before implementing remediation threshold check)
4. T-GATE-002 (adversarial — must fail RED before implementing deployment validator)
5. T-AUDIT-001 (schema contract — must pass before Stories 2.2/2.3 integration tests)
6. Stories 2.1, 2.2, 2.3 in sequence (T-FLOW-001 → T-FLOW-004)
7. Story 3.1 analyst queue (T-ANALYST-001, T-ANALYST-002)
8. Story 3.2 audit trail (T-AUDIT-002, T-AUDIT-003)
9. NFR tests (T-NFR-001, T-NFR-002)

### Definition of done for each story

A story is complete when:
- All named test cases pass (GREEN)
- No test cases that were GREEN before your changes are now RED
- The adversarial test cases for regulated constraints are GREEN (adversarial means: the test verifies the system REJECTS the unsafe condition)
- `CREDIT_MODEL_LIVE_ENABLED` is confirmed to default to `false` in all test environment configurations

---

<!-- CPF-TRACE
stage: /definition-of-ready
model: claude-sonnet-4-6
config: A

hard_blocks_status:
  H1_problem_clear: PASS
  H2_acs_testable: PASS (conditional resolutions applied from review)
  H3_dependencies_explicit: PASS (ordering constraint noted for T-AUDIT-001)
  H4_regulated_constraints_in_contract: PASS
  H5_test_plan_covers_regulated_nfrs: PASS
  H6_scope_bounded: PASS
  H7_coding_agent_context_sufficient: PASS
  H8_architecture_guardrails_compatible: PASS
  H9_review_pass_confirmed: PASS
  H_E2E_critical_path_tested: PASS
  H_NFR_specific_and_testable: PASS
  H_NFR2_regulated_nfrs_in_contract: PASS
  H_NFR3_test_data_strategy: PASS

dor_verdict: PROCEED

regulated_constraints_in_contract:
- C1 (CCCFA s.9C): Gate 1 named in contract; T-COMP-001/T-COMP-002/T-AUDIT-001/T-AUDIT-002/T-AUDIT-003 referenced
- C2 (FMA model validation): Gate 2 named in contract; T-REG-003/T-REG-004/T-GATE-002 referenced
- C5 (FMA enforcement risk): Gate 2 named in contract with CRITICAL annotation; T-REG-001/T-REG-002/T-REG-004/T-GATE-002 adversarial referenced; demographic disparity enforcement (≤2% or legal opinion) explicitly stated

constraints_in_dor_contract:
- C1: ✅ present in Gates, Contract, Coding Agent Instructions
- C2: ✅ present in Gates, Contract, Coding Agent Instructions
- C3: ✅ present in Gate 3, Contract
- C4: ✅ present in Gate 4, Contract, Coding Agent Instructions
- C5: ✅ present in Gate 2 (CRITICAL annotation), Contract, Coding Agent Instructions

constraints_not_in_contract: none

c5_surfaced: true (C5 present in DoR contract as CRITICAL; deployment gate enforcement for C5 explicitly named; adversarial test case for undisclosed demographic disparity deployment explicitly referenced in Coding Agent Instructions)

cpf_regulated_assessment:
  C1_propagated: true — referenced in discovery, definition, review, test plan (T-COMP-001/T-AUDIT-001/T-AUDIT-003), and DoR contract Gate 1
  C2_propagated: true — referenced in discovery, definition, review, test plan (T-REG-003/T-REG-004/T-GATE-002), and DoR contract Gate 2
  C5_propagated: true — referenced in discovery (B1 blocker), definition (Architecture Constraints S1.2/S2.3), review (H1/H2 findings specifically address C5 gate quality), test plan (T-REG-001/T-REG-002/T-REG-004/T-GATE-002 adversarial), and DoR contract Gate 2 CRITICAL annotation
  cpf_regulated_score: 3/3 regulated constraints propagated = 1.00 (above 0.80 threshold)

cpf_general_assessment:
  C3_propagated: true — test plan T-COMP-003/T-FLOW-004; DoR contract Gate 3
  C4_propagated: true — test plan T-FLOW-003; DoR contract Gate 4
  cpf_general_score: 5/5 total constraints propagated = 1.00 (above 0.60 threshold)
-->
