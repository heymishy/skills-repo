# /review Pipeline Output — Inbound RTP Payments NZ Scheme

## Executive Summary
**REVIEW STATUS: CONDITIONAL PASS WITH CRITICAL GAPS**

The definition artefact is well-structured and aligns with regulatory constraints and scheme deadlines. However, **three critical issues** must be resolved before progression to build planning.

---

## Detailed Review Findings

### ✅ **Strengths**

1. **Clear constraint hierarchy** — Blocker dependencies properly sequenced (BS11-001 must precede infrastructure commits)
2. **Quantified benefit metrics** — Concrete P99 latency targets and financial risk ($50k/day) create accountability
3. **Regulatory alignment** — AML/CFT Act 2009, RBNZ BS11, CPG 220 mapped to specific stories
4. **Latency buffer discipline** — 2-second margin reserved in 10-second ACK window (10s limit - 8s delivery target) is pragmatic
5. **Immutable audit trail** — Screening result logging (AML-001 AC3) supports regulatory defence

---

## 🔴 **Critical Issues**

### Issue 1: Unresolved Fraud Screening Paradox
**Severity: BLOCKER**

**Problem:**
- Discovery scope item #6: *"Fraud screening on all inbound payments (real-time API required)"*
- Constraint C9: *"Fraud system batch-only — real-time API or third-party integration required"*
- **No user story exists for fraud screening implementation**

**Impact:**
- Scope item #6 cannot be delivered without a story
- C9 constraint is not addressable in current story set
- Metric M1 (P99 ≤ 10s) cannot be validated if fraud latency is unknown
- Regulatory risk: If CRO sign-off required (C5) for new real-time model, approval timeline is not in plan

**Required Actions Before Approval:**
- [ ] Create story **FRAUD-001: Real-Time Fraud Screening Integration** with:
  - AC for third-party API selection or batch-mode deferral decision
  - Latency budget allocated from 10-second window (suggest ≤ 2s P99)
  - CRO sign-off gate if new model introduced (C5 dependency)
  - Fallback to accept/hold/reject outcomes within ACK window
- [ ] If batch-only path chosen: clarify whether fraud check occurs pre/post-posting and how ACK status reflects pending fraud review

---

### Issue 2: Latency Budget Over-Allocation
**Severity: HIGH**

**Problem:**
- AML-001 NFR: *"Latency contribution ≤ 3 seconds P99"*
- ACK-001 NFR: *"≤ 8 seconds P99 to leave 2-second buffer"*
- ISO-001 NFR: *"P99 parsing latency ≤ 100ms"*
- **Unbudgeted stages:** Fraud screening, account crediting, error path handling

**Latency breakdown as specified:**
```
Parsing:           100ms (ISO-001)
AML screening:     3s    (AML-001)
Fraud screening:   ???   (missing story)
Account credit:    ???   (no NFR specified)
ACK generation:    ???   (no NFR specified)
ACK transmission:  500ms (ACK-001 AC3)
─────────────────────────
Total P99 budget:  8,000ms (hard target)
Unaccounted for:   ~4.4s (54% of budget)
```

**Impact:**
- Fraud latency is unconstrained; could cause ACK-001 AC6 alert (P99 > 9.5s) immediately post-deploy
- Account crediting and ACK generation latencies unknown
- Load test results will likely violate P99 target at 40,000 tph without tuning

**Required Actions:**
- [ ] Break down ACK-001 into constituent NFRs:
  - Account crediting (thin processing layer): ≤ 2s P99 suggested
  - ACK generation/transmission: ≤ 1s P99 suggested
- [ ] Add explicit latency budget line to FRAUD-001
- [ ] Create load test specification (40,000 tph) as separate non-functional requirement story or acceptance test harness

---

### Issue 3: AML Fallback Undefined
**Severity: MEDIUM-HIGH**

**Problem:**
- AML-001 AC5: *"Fallback defined if AML API unavailable"*
- **Acceptance criterion is incomplete** — no definition of fallback behaviour
- Regulatory exposure: If AML API fails and system auto-accepts (C4 violation), SLA breach occurs; if auto-rejects, legitimate payments blocked

**Impact:**
- Constraint C4 (100% AML screening coverage) cannot be validated
- Story is not acceptance-testable as written
- 24/7/365 availability (scope item #8) is at risk without defined fallback

**Required Actions:**
- [ ] Expand AML-001 AC5 with specific options:
  - **Option A:** Hold payment in pending state, alert Financial Crime team, retry within X minutes (recommend <5min), then manual review gate
  - **Option B:** Accept payment, flag for post-hoc screening, reversible hold if alert generated
  - **Option C:** Reject with specific error code, notify debtor
- [ ] Add acceptance test: *"AML API timeout after 3 seconds → fallback activated, latency impact measured (should be <1s)"*
- [ ] Define recovery procedures (API circuit breaker, cache policy, escalation)

---

## ⚠️ **Medium-Priority Gaps**

### Gap 1: End-of-Day Reconciliation (Scope Item #7)
- **Story missing:** No story exists for EoD reconciliation to batch core banking
- **Risk:** Floating entries, batch-real-time mismatch, audit trail breaks
- **Recommendation:** Create story **RECON-001** with AC for:
  - Transaction count/amount match real-time ledger ↔ core banking batch
  - Timing (when does EoD run? before/after core banking close?)
  - Variance handling (who investigates discrepancies?)

### Gap 2: BS11-001 Dependency Chain
- **Observation:** BS11-001 is marked BLOCKER with 8 points, but downstream stories (ISO-001, AML-001, etc.) don't explicitly carry `depends_on: BS11-001`
- **Recommendation:** Enforce dependency constraint in sprint planning tool:
  ```
  BS11-001 → [infrastructure, scheme connectivity, deployment]
  Cannot commit code before AC3 satisfied
  ```

### Gap 3: Message Schema Variant Specification
- **ISO-001 AC2:** *"Schema validation against Payments NZ variant passes"*
- **Question:** Which specific Payments NZ ISO 20022 variant? (e.g., pain.001.003.08, camt.053.002.05?)
- **Recommendation:** Link to external Payments NZ technical specification document or embed XSD in repo

### Gap 4: Load Test Harness
- **Multiple NFRs cite 40,000 tph load test** (ISO-001, AML-001, ACK-001)
- **Story missing:** No dedicated story for load test environment, data generation, instrumentation
- **Recommendation:** Create **LOAD-001: Load Test Infrastructure Setup** to avoid surprise in iteration

---

## 📋 **Compliance & Audit Checklist**

| Constraint | Mapped To | Status | Gap? |
|-----------|-----------|--------|------|
| C1 (2026-09-01 deadline, $50k penalty) | ISO-001, AML-001, ACK-001 | Visible in priority | ⚠️ No schedule provided |
| C2 (10-sec hard rule) | ACK-001, AML-001 | Clear NFR | ✅ |
| C3 (RBNZ BS11 30-day notice) | BS11-001 | Story exists, blocker | ✅ |
| C4 (AML/CFT 100% coverage ≥$1,000) | AML-001 | AC1-2 defined | ⚠️ Fallback undefined |
| C5 (CRO sign-off for new model) | AML-001, FRAUD-001? | Mentioned, not gated | ⚠️ No pre-deploy gate |
| C9 (Fraud real-time/3P required) | FRAUD-001 | **Missing story** | 🔴 |

---

## 📝 **Recommended Actions (Priority Order)**

### **Must Fix (Before Approval)**
1. **Create FRAUD-001 story** — Real-time fraud screening with latency budget allocation and CRO sign-off gate
2. **Expand AML-001 AC5** — Define fallback behaviour for API unavailability with test scenario
3. **Create latency sub-budgets** — Break ACK-001 into account crediting + ACK generation with explicit NFRs
4. **Add dependency constraint** — Mark BS11-001 as blocking all infrastructure stories in backlog

### **Should Fix (Before Build Sprint 1)**
5. Create **RECON-001** — End-of-day reconciliation story with variance handling
6. Create **LOAD-001** — Load test harness (40,000 tph environment setup)
7. Add external reference link — Payments NZ ISO 20022 schema specification to ISO-001
8. Define CRO sign-off gate — As pre-deployment quality gate, not just mentioned in constraint

### **Nice to Have (Can Defer)**
9. Create story for monitoring/alerting (ACK-001 AC6 alert triggering implies observability infrastructure)
10. Document operational runbooks for AML fallback, fraud escalation, latency incident response

---

## **Conditional Approval Statement**

**APPROVED FOR PROGRESSION TO BUILD PLANNING** pending resolution of:
- ✋ **FRAUD-001 story creation** (Issue 1 — blocker)
- ✋ **AML-001 AC5 completion** (Issue 3 — blocker)
- ✋ **Latency budget reconciliation** (Issue 2 — blocker for load testing)

**Estimated rework effort:** 2–3 story refinement sessions (4–6 hours)

**Recommend:** Schedule refinement workshop with Payments Ops (P2), Financial Crime (P3), and RBNZ Regulatory Affairs (P5) to close Gaps 1–3 before sprint commitment.

---

**Review completed:** 2026-06-14 | **Reviewer role:** /review pipeline | **Next gate:** Build Planning Intake