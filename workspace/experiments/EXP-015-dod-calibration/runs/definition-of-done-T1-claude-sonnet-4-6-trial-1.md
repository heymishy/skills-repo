# /definition-of-done — ham.9 · Payment status webhook delivery

**DoD assessed:** 2026-05-14
**PR:** #214 (merged)
**Assessor:** Definition-of-Done pipeline skill
**Prior DoR verdict:** PROCEED (W1 acknowledged — load test to be added before DoD)

---

## Pre-flight: DoR commitment check

At DoR, the operator acknowledged **W1 (GAP-1)**: AC4 had no load test, and the explicit commitment was to add one before DoD. That commitment is now due for resolution. It is the primary issue in this assessment.

---

## AC-by-AC Verdict

### AC1 — Settled transition triggers HTTPS POST within 500ms, correct body and HMAC header

| Element | Status |
|---|---|
| T1: settled transition triggers HTTPS POST | ✅ Covered |
| T2: HMAC header present and valid | ✅ Covered |
| Test plan coverage declared | Full |
| PR implements HMAC-SHA256 signing | ✅ Confirmed in PR description |
| Tests pass | ✅ 5/5 |

**Verdict: ✅ PASS**

---

### AC2 — Retry up to 3× with exponential backoff; dead-letter on third failure

| Element | Status |
|---|---|
| T3: dead-letter entry written on third failure | ✅ Covered |
| T4: backoff spy confirms 1s/2s/4s delays | ✅ Covered |
| Test plan coverage declared | Full |
| Tests pass | ✅ 5/5 |

**Verdict: ✅ PASS**

---

### AC3 — Filtered subscriber does not receive non-matching status

| Element | Status |
|---|---|
| T5: filtered subscriber does not receive non-matching status | ✅ Covered |
| Test plan coverage declared | Full |
| Tests pass | ✅ 5/5 |

**Verdict: ✅ PASS**

---

### AC4 — P99 delivery latency ≤ 500ms under 100 concurrent transitions (integration environment)

| Element | Status |
|---|---|
| Load test implemented | ❌ None |
| P99 latency measured | ❌ None |
| Test plan coverage | **None — GAP-1 (HIGH RISK), Open** |
| DoR commitment to resolve before DoD | ❌ **Not fulfilled** |
| RISK-ACCEPT recorded in /decisions | ❌ Absent |

**Verdict: ❌ FAIL**

This is a blocking finding. AC4 is a measurable performance SLA — P99 ≤ 500ms under 100 concurrent transitions — not a qualitative statement. It cannot be satisfied by inference from unit tests. The DoR explicitly deferred this on the condition it would be resolved before DoD. It has not been resolved, and no RISK-ACCEPT decision record exists.

---

## Supporting artefact checks

| Check | Status | Notes |
|---|---|---|
| Test plan present and versioned | ✅ | ham.9-test-plan.md |
| All ACs mapped to tests | ⚠️ | AC4 explicitly unmapped — GAP-1 |
| GAP-1 status at DoD | ❌ Open | Was Open at DoR; remains Open; no closure action |
| PR description consistent with story scope | ✅ | Dispatcher, registry, and tests all per spec |
| Out-of-scope items not introduced | ✅ | In-memory Map used as specified; no DB-backed registry |
| WEBHOOK_SECRET injection noted | ✅ | Read at dispatch time — acceptable for MVP |
| /decisions RISK-ACCEPT for GAP-1 | ❌ Absent | Required if deferral is to be formalised |

---

## Overall Verdict

> **❌ NOT DONE**

AC1, AC2, and AC3 are satisfied. AC4 is not. The performance SLA is a first-class acceptance criterion, not an NFR footnote. The prior DoR warning (W1) was acknowledged with an explicit commitment to close GAP-1 before DoD; that commitment has not been honoured, and no RISK-ACCEPT decision record has been raised to formally defer it.

The PR was merged before DoD was assessed. That does not change the DoD verdict.

---

## Required actions to reach DONE

**RQ-1 (Blocking — AC4)**
Implement and execute a load test against the integration environment simulating 100 concurrent payment status transitions. Capture P99 delivery latency. The test must demonstrate P99 ≤ 500ms or surface a breach for triage.

**RQ-2 (Blocking — GAP-1 closure)**
Close GAP-1 in the test plan artefact (`ham.9-test-plan.md`) with one of:
- (a) Test results confirming P99 ≤ 500ms — GAP-1 marked CLOSED, and DoD re-run; or
- (b) A RISK-ACCEPT decision record in `/decisions` signed by an authorised owner, documenting the residual risk, rationale for deferral, and a concrete resolution date — GAP-1 marked RISK-ACCEPTED, DoD re-run proceeds against the remaining ACs.

> Note on RQ-2(b): RISK-ACCEPT is available but should be used deliberately. A 500ms P99 SLA under concurrency is an integration partner commitment, not an internal quality preference. The risk owner should be aware that partners may be relying on this behaviour.

---

## Recommended next steps

1. **Do not re-merge or re-release** under a DoD claim until RQ-1 or RQ-2(b) is satisfied.
2. Assign RQ-1 to the engineer who owns `webhook-dispatcher.js` — a k6 or Artillery load test script against the integration environment is the straightforward path.
3. If timeline pressure exists, escalate RQ-2(b) to the tech lead or product owner for a conscious RISK-ACCEPT decision — do not allow GAP-1 to age silently into the next sprint without a formal record.

---

*Pipeline: /definition-of-done · Story: ham.9 · Assessed against merged PR #214 · 2026-05-14*