# /review Pipeline Skill — Inbound RTP Payments NZ Definition Artefact

## Review Summary
**Status: CONDITIONAL APPROVAL WITH CRITICAL GAPS**

This is a well-structured discovery artefact with clear regulatory constraints and measurable benefit metrics. However, **three critical gaps must be resolved before story implementation begins**. The latency architecture is under-specified, and one story is missing entirely.

---

## ✅ Strengths

1. **Regulatory clarity**: C3 (BS11), C4 (AML/CFT Act), and C5 (CRO sign-off) are explicit and traceable.
2. **Hard constraint discipline**: Constraint C2 (10-second ACK as non-negotiable scheme rule, not SLO) is correctly framed.
3. **Benefit metrics are active and measurable**: P99 latency, penalty days, and AML coverage are quantified.
4. **Story acceptance criteria are granular**: AC1–AC6 in each story are testable.
5. **Non-functional requirements linked to constraints**: Each story's NFR ties back to C2 latency risk.
6. **Blocker prioritisation**: BS11-001 correctly marked as BLOCKER (30-day regulatory gate).

---

## 🚨 Critical Gaps — Must Resolve Before Sprint Planning

### Gap 1: **Fraud Screening Story Missing**
**Severity: BLOCKER**

**Evidence:**
- Discovery scope item 6: *"Fraud screening on all inbound payments (real-time API required)"*
- Constraint C9: *"Fraud system batch-only — real-time API or third-party integration required"*
- No user story defined (ISO-001, AML-001, ACK-001 exist; FRAUD-001 does not).

**Impact:**
- AML-001 and ACK-001 cannot be implemented without defining fraud screening's latency budget.
- ACK-001 AC5 specifies *"latency breakdown logged per stage (parsing, AML, **fraud**, credit, ACK)"* — but fraud latency acceptance criteria are undefined.
- Constraint C5 (CRO sign-off) may apply if a new model is introduced; no acceptance criteria capture this.

**Required Action:**
```
Create FRAUD-001: Real-Time Fraud Screening (All Inbound Payments)
Persona: P3 (Financial Crime) or P4 (Fraud Operations)
Constraints: C2, C5 (if new model), C9
AC1: Fraud API call triggered for 100% of inbound payments
AC2: Result (clear/alert/block) logged immutably
AC3: P99 latency contribution ≤ ? seconds (SPECIFY)
AC4: CRO sign-off process defined if model introduced
AC5: Fallback defined if fraud API unavailable
NFR: P99 latency at 40,000 tph measured; ≤ 2 seconds recommended
Points: TBD
```

---

### Gap 2: **Latency Budget Under-Allocated**
**Severity: HIGH**

**Evidence:**

| Stage | P99 Budget | ACK-001 Spec | Issue |
|-------|-----------|--------------|-------|
| Parsing | 100ms | ISO-001 NFR | ✅ Clear |
| AML | 3s | AML-001 NFR | ✅ Clear |
| **Fraud** | **?** | **Undefined** | 🚨 **Missing** |
| Credit | ? | **Undefined** | 🚨 **Missing** |
| ACK Gen/Send | 500ms | ACK-001 AC3 | ✅ Clear |
| **Total buffer** | **2s** | ACK-001 NFR | ✅ Clear |

**Math check:**
- 100ms + 3s + **[Fraud TBD]** + **[Credit TBD]** + 500ms = ≤ 10s P99
- Remaining: 10s − 3.6s = 6.4s for fraud + credit + margin.

**Risk:**
- If fraud screening takes >2s P99, the 10-second window is violated.
- "Real-time processing layer" (Discovery scope item 3) is vague — no SLA for account crediting latency.

**Required Action:**
```
Clarify latency allocation in architecture decision record (ADR):
1. Fraud screening P99 latency contribution (recommend ≤ 2s, max 3s)
2. Thin real-time processing layer credit posting (recommend ≤ 0.5s)
3. End-to-end buffer strategy if any stage degrades
4. Load test plan: confirm 40,000 tph achieves P99 targets *in combination*
5. Circuit breaker / fallback policy if AML or fraud API latency degrades
```

---

### Gap 3: **Real-Time Fraud API / Third-Party Dependency Not Scoped**
**Severity: HIGH**

**Evidence:**
- Constraint C9 explicitly states external dependency: *"real-time API or third-party integration required"*
- No story defines procurement, integration, testing, or SLA validation of external fraud provider.
- AML-001 AC5 and (missing) FRAUD-001 AC5 both require fallback definition, but no acceptance criteria specify fallback latency or behaviour.

**Impact:**
- Discovery does not validate that a suitable real-time fraud provider exists within the latency budget.
- Fallback strategy undefined: Does payment block, defer, or proceed without fraud check?
- SLA mismatch risk: If provider's P99 > 3s, ACK window is violated.

**Required Action:**
```
Create INFRA-001 or FRAUD-VENDOR-001: Third-Party Fraud Provider Integration
Persona: P1 (Technology Lead) or P4 (Fraud Operations)
Constraints: C9, C2
AC1: Fraud provider RFQ issued and evaluated against latency/coverage requirements
AC2: Provider SLA validated: P99 response ≤ 2.5s for 40,000 tph throughput
AC3: Fallback strategy documented (block, defer, proceed without check) with business approval
AC4: Integration test plan: confirm end-to-end latency with provider in test environment
AC5: Provider contract signed before ACK-001 implementation
NFR: Provider P99 latency ≤ 2.5s at peak load
Points: TBD
```

---

## ⚠️ Secondary Issues — Resolve Before Sprint 1

### Issue A: Constraint C3 (BS11) Timing vs. C1 Deadline
**Severity: MEDIUM**

- BS11-001 is a BLOCKER with 30-day gate.
- Scheme deadline C1 is 2026-09-01.
- If BS11 notification filed on 2026-06-14 (discovery approval date), 30-day window expires ~2026-07-14, leaving **7 weeks** to implement 4 stories (ISO, AML, Fraud, ACK, reconciliation, ops).
- **Acceptable, but tight.** Recommend front-loading BS11-001 completion.

**Action:** Confirm BS11-001 story executes in **Sprint 1, Week 1** with RBNZ notification filed by end of Week 1.

---

### Issue B: Constraint C5 (CRO Sign-Off) Not Captured in User Stories
**Severity: MEDIUM**

- C5 states: *"CRO sign-off required if new real-time fraud/AML model introduced."*
- No story AC specifies:
  - Who is CRO persona?
  - What triggers sign-off (new model vs. third-party integration)?
  - Timeline for sign-off relative to implementation?

**Action:** Add to FRAUD-001 (or AML-001 if applicable):
```
AC: If new fraud or AML model developed internally, CRO sign-off obtained 
    before deployment to production. If third-party provider used, CRO review 
    of provider methodology required.
```

---

### Issue C: Reconciliation & Ops Availability in Scope but Not Storied
**Severity: MEDIUM**

Discovery scope items 7 & 8:
- *"End-of-day reconciliation to batch core banking"*
- *"24/7/365 operational availability"*

**Not represented in story list.** Recommend creating:
- **RECON-001**: EOD Reconciliation Story
- **OPS-001**: Operational Runbook & Incident Response Story

These will be lower priority but must be defined before go-live.

---

## ✅ Conditional Approval Decision

**APPROVE artefact for discovery, with mandatory resolution of 3 critical gaps before sprint planning.**

**Gate criteria for Sprint 0:**

| Gate | Owner | Target Date | Status |
|------|-------|-------------|--------|
| **Gap 1**: FRAUD-001 story created | P3 / Tech Lead | 2026-06-21 | 🚨 Open |
| **Gap 2**: Latency budget ADR approved | Tech Lead / P1 | 2026-06-21 | 🚨 Open |
| **Gap 3**: Fraud vendor RFQ & INFRA-001 story | P4 / Procurement | 2026-06-21 | 🚨 Open |
| **Issue A**: BS11-001 scheduled Sprint 1, Week 1 | Programme Lead | 2026-06-21 | ⏳ Pending |
| **Issue B**: CRO sign-off criteria in FRAUD-001 AC | P3 / Legal | 2026-06-21 | 🚨 Open |
| **Issue C**: RECON-001 & OPS-001 drafted | Tech Lead | 2026-06-28 | 🚨 Open |

---

## Recommendations

1. **Escalate latency architecture** to payments platform team — the 10-second end-to-end P99 is aggressive with 4+ sequential stages.
2. **Validate fraud provider availability NOW** — if no provider meets ≤2.5s P99 SLA, consider building in-house (risk to timeline) or revising fraud scope.
3. **Schedule CRO intake session** before FRAUD-001 is written — clarify whether internal model development or third-party integration is preferred path.
4. **Add constraint to stories:** All latency-sensitive stories (ISO-001, AML-001, FRAUD-001, ACK-001) must include load test at 40,000 tph in acceptance testing, with P99 latency logged per stage.

---

**Reviewer:** /review pipeline  
**Date:** [Current date]  
**Next Step:** Approval contingent on Gap 1, 2, 3 resolution by 2026-06-21.