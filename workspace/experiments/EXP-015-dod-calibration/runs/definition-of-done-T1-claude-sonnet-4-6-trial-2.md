# /definition-of-done — ham.9 Payment Status Webhook Delivery

**Evaluated against:** Story artefact · Test plan (ham.9-test-plan.md) · DoR artefact (ham.9-dor.md) · PR #214 (merged 2026-05-14)
**Pipeline run date:** 2026-05-14

---

## Preliminary check — GAP-1 carry-forward

Before scoring ACs, the pipeline notes the following live obligation from the DoR stage:

> **DoR W1 / GAP-1 (HIGH RISK):** No load test for AC4. The operator acknowledged this at DoR with the explicit stated intent to add the load test **before DoD**.

The test plan confirms GAP-1 remains **Open** and **not RISK-ACCEPTed** in /decisions. PR #214 makes no mention of a load test being added, run, or deferred with formal sign-off. This is a material input to the verdict below and is assessed in full under AC4.

---

## AC-by-AC assessment

### AC1 — HTTPS POST within 500ms, correct body and HMAC-SHA256 signature header

| Dimension | Finding |
|---|---|
| Tests mapped | T1 (settled transition triggers HTTPS POST), T2 (HMAC header present and valid) |
| Test plan coverage claim | Full |
| PR evidence | `webhook-dispatcher.js` implements outbound HTTPS POST with HMAC-SHA256; `tests/webhook-dispatcher.test.js` — 5/5 pass; T1 and T2 described as passing |
| Gap | **Latency sub-claim only**: T1/T2 verify delivery and signature correctness, but no test asserts the ≤ 500ms bound at unit/integration level for a single transition. The 500ms single-delivery bound is partially a design constraint and partially testable; it is not explicitly validated. This is a low-severity observation because AC4 was the designated vehicle for latency SLA testing, and AC1's 500ms bound under normal single-event conditions is plausibly covered by the integration test implicitly. |
| Verdict | **PASS** (with minor observation on single-event latency assertion) |

---

### AC2 — Retry up to 3× with exponential backoff (1s/2s/4s); dead-letter write on third failure

| Dimension | Finding |
|---|---|
| Tests mapped | T3 (dead-letter entry written after third failure), T4 (backoff spy confirms 1s/2s/4s delays) |
| Test plan coverage claim | Full |
| PR evidence | Retry logic present in `webhook-dispatcher.js`; T3 and T4 pass per PR. Dead-letter target `logs/webhook-dead-letter.jsonl` is specified in the story and covered by T3. |
| Gap | None identified from available artefacts. |
| Verdict | **PASS** |

---

### AC3 — Status-filtered subscriber does not receive non-matching transition

| Dimension | Finding |
|---|---|
| Tests mapped | T5 (filtered subscriber does not receive non-matching status) |
| Test plan coverage claim | Full |
| PR evidence | `subscriber-registry.js` holds in-memory Map; filtering logic in dispatcher; T5 passes. |
| Gap | None identified. |
| Verdict | **PASS** |

---

### AC4 — P99 delivery latency ≤ 500ms under 100 concurrent transitions in integration environment

| Dimension | Finding |
|---|---|
| Tests mapped | None |
| Test plan coverage claim | **None — GAP-1 (HIGH RISK), Open** |
| DoR carry-forward obligation | Operator committed at DoR to add load test before DoD |
| PR evidence | PR #214 contains no load test, no load test results, and no reference to AC4 being addressed or formally deferred |
| Risk-acceptance record | None in /decisions |
| Verdict | **FAIL** |

**Reasoning:** AC4 is a fully specified, unambiguous acceptance criterion: a measurable performance SLA (P99 ≤ 500ms) under a defined load (100 concurrent transitions) in a defined environment (integration). It is not an NFR catch-all — it is a signed-off AC on this story. The gap was known at DoR, the operator made a forward commitment to close it before DoD, and that commitment has not been met. There is no RISK-ACCEPT record that would allow the pipeline to treat this as a conscious and documented trade-off. The AC is untested and therefore cannot be confirmed as met or unmet. A performance regression or architecture flaw could exist invisibly.

---

## Supporting artefact checks

| Check | Status | Notes |
|---|---|---|
| All in-scope files present in PR | **PASS** | `webhook-dispatcher.js`, `subscriber-registry.js`, `tests/webhook-dispatcher.test.js` all present |
| Out-of-scope items not implemented | **PASS** | No persistent registry, no replay, no subscriber-side verification �� consistent with out-of-scope list |
| Test count matches test plan | **PASS** | 5 tests mapped, 5/5 pass reported |
| HMAC secret handling | **PASS** (observation) | `process.env.WEBHOOK_SECRET` read at dispatch time — rotation-safe approach noted positively; no hardcoded secret |
| NFRs | **PASS** | Reviewed and explicitly waived 2026-05-09 |
| Complexity declared | **PASS** | 2 — no pipeline action required |
| DoR verdict was PROCEED | **PASS** | Confirmed |

---

## Verdict

### ❌ NOT DONE

**Blocking issue — one:**

> **GAP-1 / AC4 unresolved:** The P99 ≤ 500ms latency SLA under 100 concurrent transitions has no test coverage, no load test results from the integration environment, and no RISK-ACCEPT entry in /decisions. The DoR carry-forward obligation (operator's stated intent to add the load test before DoD) has not been met. AC4 cannot be confirmed as satisfied.

---

## Required action to reach DONE

The following must be completed before this story can be marked Done. No other issues are blocking.

**Action 1 — Implement and run the load test (closes GAP-1, satisfies AC4)**

A load test must be authored and executed against the integration environment that:
- drives 100 concurrent payment status transitions
- measures end-to-end webhook delivery latency per subscriber
- asserts P99 ≤ 500ms
- produces a results artefact (log, report, or CI output) that is committed or linked from the story artefacts directory

The test must pass before the story is marked Done.

**Action 2 — If the load test cannot be run before the required merge window (optional risk-acceptance path)**

If the team has a documented, time-bound reason why the load test cannot be completed now (e.g. integration environment unavailable for a fixed short period), the team may elect to formally RISK-ACCEPT via a /decisions entry covering:
- the specific risk (AC4 SLA untested)
- the owner
- the resolution date
- the rollback or monitoring plan if the SLA is later found to be violated in production

This path keeps the story moveable but creates a tracked obligation. It should not be used to permanently shelve AC4.

---

## Summary table

| AC | Verdict |
|---|---|
| AC1 — HTTPS POST, body, HMAC signature | ✅ PASS |
| AC2 — Retry, backoff, dead-letter | ✅ PASS |
| AC3 — Status filter | ✅ PASS |
| AC4 — P99 latency SLA under load | ❌ FAIL — no test, no risk-accept |
| **Overall** | ❌ **NOT DONE** |