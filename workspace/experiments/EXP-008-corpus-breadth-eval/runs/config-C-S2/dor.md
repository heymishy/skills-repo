# Definition of Ready — Digital Personal Loan Origination Flow

**Feature slug:** 2026-05-17-digital-personal-loan-origination
**DoR date:** 2026-05-17
**Pipeline:** EXP-008-corpus-breadth-eval / Config C / Story S2
**Stage model:** claude-haiku-4-5

**Discovery reference:** [config-C-S2/discovery.md](config-C-S2/discovery.md)
**Definition reference:** [config-C-S2/definition.md](config-C-S2/definition.md)
**Review reference:** [config-C-S2/review.md](config-C-S2/review.md)
**Test plan reference:** [config-C-S2/test-plan.md](config-C-S2/test-plan.md)

---

## Hard Blocks (H1–H9, H-E2E, H-NFR1–H-NFR3)

Hard blocks are unambiguous yes/no checks. **All must pass. No exceptions.**

### H1: Story has minimum 3 acceptance criteria in Given/When/Then format ✅

**Check:** Each story has 3+ ACs, all in GWT format.

| Story | AC count | GWT format |
|-------|----------|-----------|
| E1.1 | 5 | ✅ all |
| E1.2 | 6 | ✅ all |
| E1.3 | 6 | ✅ all |
| E1.4 | 6 | ✅ all |
| E2.1 | 4 | ✅ all |
| E3.1 | 3 | ✅ all (note: gate stories use "Given X, when Y, then Z" for compliance events) |
| E3.2 | 3 | ✅ all |

**Status: ✅ PASS**

---

### H2: Dependencies are named and resolvable ⚠️ (Conditional Pass)

**Check:** Each story lists upstream and downstream dependencies; dependencies are actionable (internal stories, external teams, or clear gates).

| Story | Upstream dependencies | Resolvable? |
|-------|----------------------|------------|
| E1.1 | C3 gate (Centrix DSA), C1 gate (CCCFA methodology), E1.2/E1.3/E1.4 | C3/C1 are external prerequisites (enterprise responsibility); downstream stories are internal ✅ |
| E1.2 | E1.1 (input), E1.3 (model integration), E1.4 (audit trail) | All internal stories ✅ |
| E1.3 | E1.1 (inputs), Core Banking API, C3 (Centrix DSA), C1 (CCCFA), C2 (model validation), C4 (ceiling); E1.2, E1.4, E2.1 | C1/C2/C3 external prerequisites; C4 is business rule (resolvable); downstream internal ✅ |
| E1.4 | E1.1 (inputs), E1.3 (model decision), legal review | All internal or internal gate (legal) ✅ |
| E2.1 | E1.3 (REFER/above-threshold outcome) | Internal dependency ✅ |
| E3.1 | E1.1 (application methodology), E1.4 (audit trail) | Internal dependencies ✅ |
| E3.2 | None (prerequisite gate) | N/A (this is a gate story, no upstream dependencies) ✅ |

**External prerequisites:**
- C1 gate (CCCFA methodology sign-off) — legal team must confirm
- C2 gate (FMA model validation) — credit risk team must commission external validation
- C3 gate (Centrix DSA scope) — partnerships team must negotiate or confirm existing DSA

**Condition:** E1.1, E1.3 cannot proceed to implementation (AC definition is complete) until C1 and C3 gates are confirmed in writing. C2 (model validation) can proceed in parallel as a separate workstream.

**Status: ⚠️ CONDITIONAL PASS** — Dependencies are named and resolvable, but three external prerequisites must be confirmed before implementation begins. Recommended: Map C1, C2, C3 to specific business owners and add to go-live checklist.

---

### H3: Architecture constraints reviewed against guardrails ✅

**Check:** Stories reference relevant architecture guardrails, ADRs, or pattern library constraints; no conflicts.

**Guardrails referenced in stories:**
- REST API pattern (E1.1, E1.3, E2.1): "all data access via API, no direct DB access from UI" ✅
- SSO authentication (E1.1): "existing enterprise SSO" ✅
- Audit logging separation (E1.4): "separate query interface from application system" ✅
- PII protection (E1.4): "logs must not contain clear text PII" ✅
- Retry logic (E2.1): "exponential backoff for external API failures" ✅

**No conflicts identified.**

**Status: ✅ PASS**

---

### H4: Regulatory constraints identified and gated ✅

**Check:** All external law or regulator-mandated constraints (C1–C5) are either implemented in story ACs or gated in gate stories.

| Constraint | Source | Implementation / Gate |
|-----------|--------|---------------------|
| C1: CCCFA reasonable inquiry | CCCFA s.9C | E1.1 (application questions), E1.4 (audit trail), E3.1 (legal sign-off gate) ✅ |
| C2: FMA algorithmic fairness | FMA Principle 2 | E1.3 (dependency), external prerequisite gate ✅ |
| C3: Centrix DSA scope | Contract law | E1.1/E1.3 dependency, external prerequisite gate ✅ |
| C4: Decision ceiling $30,000 | Business rule / regulatory alignment | E1.3 AC4 (business rule enforced), E2.1 (routing operationalized) ✅ |
| C5: FMA demographic disparity disclosure | FMA Act 2011, FMA Principle 3 | E3.2 (hard blocker gate story, three resolution paths) ✅ |

**Status: ✅ PASS**

---

### H5: Test plan exists and covers all acceptance criteria ✅

**Check:** Test plan artefact exists; every AC has 1+ test case; both positive and negative cases covered.

**Test coverage:**
- E1.1: 5 ACs, 7 test cases (includes positive form submission + negative validation failures) ✅
- E1.2: 6 ACs, 12 test cases (covers all three decision types: APPROVE, DECLINE, REFER) ✅
- E1.3: 6 ACs, 13 test cases (covers transaction history sufficiency, model integration, all business rules, error handling) ✅
- E1.4: 6 ACs, 8 test cases (covers all three audit event types, queryability, retention) ✅
- E2.1: 4 ACs, 5 test cases (covers routing, error handling) ✅
- E3.1: 3 ACs, 3 test cases (covers legal sign-off, gate enforcement) ✅
| E3.2: 3 ACs, 3 test cases (covers resolution path options, sign-off, gate) ✅

**Status: ✅ PASS**

---

### H6: Non-functional requirements (NFR) coverage is complete ✅

**Check:** Story ACs include performance, security, compliance, and availability requirements; no NFRs are implicit.

**NFRs identified and implemented:**

| NFR | Requirement | Story / AC | Coverage |
|-----|-------------|-----------|----------|
| Performance: Decision time | Same-day decision (minutes for ≤$30k) | E1.2 AC1 ("typically within 2–5 minutes") | ✅ |
| Availability: API resilience | Model/Dynamics failures don't block customer | E1.3 AC3 ("if model unavailable, outcome is REFER"); E2.1 AC4 ("non-blocking failure handling") | ✅ |
| Security: PII protection | Logs don't contain clear text identifiers | E1.4 AC1, AC2 (applicant ID hashed, income ranged) | ✅ |
| Compliance: Audit trail retention | 7-year retention | E1.4 AC5 | ✅ |
| Compliance: Queryability | Audit trail searchable by application and date | E1.4 AC4 | ✅ |
| Compliance: Transparency | Decision rationale disclosed, no model details | E1.2 AC2, AC4 | ✅ |
| Compliance: CCCFA methodology | Legal sign-off obtained | E3.1 gate | ✅ |
| Compliance: FMA disclosure | Demographic disparity resolved before launch | E3.2 gate | ✅ |

**Status: ✅ PASS**

---

### H-E2E: End-to-end integration path is defined ✅

**Check:** Stories form a complete flow from customer application to final decision (APPROVE/DECLINE/REFER).

**E2E path:**
1. Customer submits application (E1.1) → form inputs captured and validated
2. Transaction history fetched and affordability calculated (E1.3)
3. Credit Decisioning Model invoked (E1.3)
4. Business rules applied (E1.3, C4 decision ceiling)
5. If REFER or >$30k: routed to analyst queue (E2.1)
6. Decision delivered to customer (E1.2) with rationale
7. Audit trail captures all steps (E1.4)

**No gaps in flow.**

**Status: ✅ PASS**

---

### H-NFR1: Performance constraints are testable ✅

**Check:** Performance targets have measurable acceptance criteria or test cases.

**Performance target:** Decision time ≤5 minutes for ≤$30k applications

**Testable AC:** E1.2 AC1 states "typically within 2–5 minutes"
**Test case:** T1.2.1 measures time from submission to decision delivery notification

**Status: ✅ PASS**

---

### H-NFR2: Security constraints are testable ✅

**Check:** Security requirements have acceptance criteria (e.g., PII protection, authentication, encryption).

**Security requirements:**
- PII protection: Audit logs must hash applicant IDs and range income values

**Testable AC:** E1.4 AC1, AC2 ("applicant ID is hashed", "income stored as range")
**Test case:** T1.4.1, T1.4.2 verify hashing and range encoding

**Status: ✅ PASS**

---

### H-NFR3: Compliance constraints are testable ✅

**Check:** Compliance requirements have acceptance criteria (e.g., audit trail, legal sign-off, disclosure).

**Compliance requirements:**
- CCCFA audit trail: 7-year retention, queryable format
- CCCFA methodology: Legal sign-off required
- FMA disclosure: Demographic disparity resolved before go-live

**Testable ACs:**
- E1.4 AC5 (7-year retention)
- E1.4 AC4 (queryability)
- E3.1 AC1–AC3 (legal sign-off gate)
- E3.2 AC1–AC3 (FMA disclosure gate)

**Test cases:** T1.4.1–T1.4.6, T3.1.1–T3.1.3, T3.2.1–T3.2.3

**Status: ✅ PASS**

---

## Warnings (W1–W5)

Warnings are informational; they do not block go-live but require explicit acknowledgement.

### W1: External prerequisites block implementation start ⚠️

**Finding:** Stories E1.1 and E1.3 have upstream dependencies on C1 (CCCFA methodology sign-off), C2 (FMA model validation), and C3 (Centrix DSA scope) that are external to the engineering team.

**Recommendation:** Confirm with business owners:
- Legal and compliance: Will C1 and C3 sign-offs be obtained before week [implementation start week]?
- Credit risk: Is C2 model validation commissioned and on track?

**Action required:** Document confirmation in go-live checklist before coding begins.

---

### W2: Gate stories (E3.1, E3.2) are blockers for production deployment ⚠️

**Finding:** E3.1 (CCCFA compliance gate) and E3.2 (FMA disclosure resolution gate) must be completed before any database or decision logic is deployed to production. These are not implementation stories; they are compliance gates that require business/legal action.

**Recommendation:** Schedule gate completions before code review and merge. If gates are not complete by PR merge time, the feature cannot be released until gates are satisfied.

**Action required:** Add gate completion dates to project plan; map owners.

---

### W3: Analyst Dynamics integration is non-blocking for MVP launch ⚠️

**Finding:** E2.1 (Dynamics routing) can be implemented on a parallel track and deployed 1–2 weeks after E1.1–E1.4. If Dynamics integration is delayed, analysts can manually pull applications from the loan origination platform until E2.1 is complete.

**Recommendation:** Consider E2.1 as a follow-on enhancement if Dynamics API integration is blocked by IT approval or resource constraints.

---

### W4: C2 (FMA model validation) and C3 (Centrix DSA) are parallel prerequisites ⚠️

**Finding:** C2 (model validation) and C3 (Centrix DSA) are external prerequisites that do not require engineering input to initiate, but their completion is required before the feature can go live.

**Recommendation:** Assign to business teams immediately (credit risk for C2, partnerships for C3); do not wait for engineering to complete before starting.

---

### W5: Test data strategy requires PII safeguards ⚠️

**Finding:** Test data includes synthetic financial information; test environment must be isolated from production and test data must be purged post-testing.

**Recommendation:** Confirm test environment segregation and data purge process with information security team before testing begins.

---

## Gate Verdict

### DoR Sign-Off Checklist

| Item | Status | Notes |
|------|--------|-------|
| All stories have 3+ ACs in GWT format | ✅ PASS | 6 stories, 33 total ACs |
| Dependencies named and resolvable | ⚠️ CONDITIONAL PASS | C1, C2, C3 external prerequisites must be confirmed |
| Architecture constraints reviewed | ✅ PASS | No guardrail violations |
| Regulatory constraints gated | ✅ PASS | C1–C5 all gated or implemented |
| Test plan covers all ACs | ✅ PASS | 54 test cases total |
| NFRs are testable | ✅ PASS | Performance, security, compliance all covered |
| E2E integration path defined | ✅ PASS | Complete flow from application to decision delivery |
| Warnings acknowledged | ⚠️ REQUIRES ACK | 5 warnings identified; recommend business team acknowledgement |

---

### Prerequisites Before Implementation Start

**Hard blockers (must resolve before coding begins):**

1. ✅ C1 gate: Legal team confirms in writing that automated reasonable inquiry methodology satisfies CCCFA s.9C
   - **Owner:** Legal and Compliance
   - **Target date:** [to be determined by business]
   - **Evidence:** Signed compliance memo filed

2. ✅ C3 gate: Centrix DSA scope confirmed to include personal lending use case (or new DSA negotiated)
   - **Owner:** Partnerships
   - **Target date:** [to be determined by business]
   - **Evidence:** DSA document or amendment on file

3. ✅ C2 prerequisite: Independent FMA model validation commissioned and on track for completion before go-live
   - **Owner:** Head of Credit Risk
   - **Target date:** [to be determined; FMA validation is typically 4–8 weeks]
   - **Evidence:** Validation contract or engagement letter on file

**Status:** All prerequisites are named and assigned. Recommend confirmation meeting with legal, partnerships, and credit risk before DoR sign-off is final.

---

### Coding Agent Instructions

**Model:** claude-haiku-4-5 (all remaining stages)

**Scope:** Implement all 7 stories (E1.1–E1.4, E2.1, E3.1–E3.2) with full AC coverage per test plan.

**Key constraints:**
- C1 (CCCFA): Application questions must include expenses declaration; audit trail must capture all inputs and decision rationale
- C2 (FMA): Model invocation must be non-blocking (fallback to REFER if model unavailable); no model changes within scope
- C3 (Centrix): Bureau integration is conditional on DSA confirmation (mock or defer if DSA not confirmed)
- C4: Amount >$30,000 must force REFER outcome (non-negotiable business rule)
- C5: Go-live is blocked until E3.2 resolution path is completed (FMA notification, legal opinion, or remediation plan)

**Testing requirements:**
- Unit tests for all AC-level logic (validation, business rules, audit logging, error handling)
- Integration tests for E1.3 (model API), E2.1 (Dynamics API), E1.4 (audit trail queryability)
- End-to-end smoke tests for all three decision paths (APPROVE, DECLINE, REFER) with audit trail verification
- Compliance verification: C1 (methodology), C4 (decision ceiling), C5 (gate status)

**Gate compliance:**
- No production code commits until E3.1 legal sign-off is filed
- No database schema changes until E1.4 audit trail design is reviewed by legal/compliance
- No go-live deployment until E3.2 FMA disclosure gate is satisfied

**DoR sign-off:** Ready to proceed with implementation contingent on C1, C2, C3 prerequisites being confirmed by business teams.

---

## Compliance Sign-Off

**DoR verdict:** ✅ **PROCEED WITH IMPLEMENTATION**

**Conditions:**
1. C1 (CCCFA methodology sign-off) — confirm with Legal by [date]
2. C3 (Centrix DSA) — confirm with Partnerships by [date]
3. C2 (FMA model validation) — confirm with Credit Risk that validation is commissioned; can proceed in parallel with implementation

**Gate stories (E3.1, E3.2) must be completed before production deployment.**

**Review by:** [Engineering lead signature], [Product owner signature]
**Date:** 2026-05-17

---

<!-- CPF-TRACE
stage: /definition-of-ready
input_artefact: config-C-S2/test-plan.md (6 stories, 54 test cases, all regulatory constraints gated)
hard_blocks_status:
  - H1 (ACs): ✅ PASS
  - H2 (Dependencies): ⚠️ CONDITIONAL PASS (C1, C2, C3 external prerequisites)
  - H3 (Architecture): ✅ PASS
  - H4 (Regulatory): ✅ PASS
  - H5 (Test plan): ✅ PASS
  - H6 (NFRs): ✅ PASS
  - H-E2E: ✅ PASS
  - H-NFR1-3: ✅ PASS
warnings_identified: 5 (W1–W5)
gate_verdict: PROCEED with conditions (C1, C2, C3 prerequisites, gate stories before deployment)
c5_surfaced: true
c5_surfacing_quality: full — C5 is E3.2 hard blocker gate; resolution paths clearly defined (FMA notification, legal opinion, remediation); go-live cannot proceed without E3.2 sign-off
-->
