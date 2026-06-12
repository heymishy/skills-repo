# Definition of Done — Pipeline Run

**Story ID:** apk.2
**Feature:** API Key Management — Key Rotation Endpoint
**PR:** #231 (merged 2026-05-15)
**DoD Run Date:** 2026-05-15
**Operator:** /definition-of-done pipeline skill

---

## Executive Summary

> ⛔ **DoD verdict: FAIL — BLOCKED**

PR #231 has been merged, but **apk.2 cannot be marked Done**. One compliance-critical gap (GAP-1 / NFR-2) remains unresolved at the point of DoD evaluation. The gap was acknowledged at DoR with a commitment to manual verification before DoD; no evidence of that verification has been provided. The story must not be promoted to Done until the conditions set out in the Remediation section below are satisfied.

---

## Checklist Evaluation

### 1. Acceptance Criteria Coverage

| AC | Requirement | Tests | Status |
|----|-------------|-------|--------|
| AC1 | New key generated, old key invalidated, response shape correct, old key rejected within 5s | T1, T2 | ✅ Pass |
| AC2 | 4th rotation in 60s returns HTTP 429 with correct body; no rotation occurs | T3, T4 | ✅ Pass |
| AC3 | Concurrency window: old key valid during grace period; revoked key rejected after grace period | T5, T6 | ✅ Pass |

**AC verdict: ✅ All three ACs have full test coverage. 7/7 tests pass per PR report.**

---

### 2. NFR Coverage

| NFR | Requirement | Tests | Status |
|-----|-------------|-------|--------|
| NFR-1 | Rate limit: ≤3 rotations per 60s per consumer; reject with 429 | T7 (also T3) | ✅ Pass |
| NFR-2 | Old key MUST NOT appear in logs at INFO+; new key MUST NOT appear at any level (PCI DSS 3.4) | _None_ | ⛔ **FAIL — GAP-1** |

**NFR verdict: ⛔ NFR-2 is unverified.**

---

### 3. GAP-1 Assessment — NFR-2 (PCI DSS 3.4 Log Compliance)

This gap requires detailed treatment because it is the sole blocker.

**Nature of the gap:**
NFR-2 requires that key material (old and new key values) does not appear in server logs. This is a compliance control mapped explicitly to PCI DSS 3.4. No automated test exists to verify this, and the test plan formally records the coverage as **None**.

**DoR handling:**
The gap was visible at DoR. The operator's acknowledgement was: *"will verify logs manually before DoD."* That commitment created an explicit condition precedent for DoD sign-off. No evidence of that manual verification appears in:
- The PR description
- The PR reviewer sign-off comment
- Any artefact provided to this pipeline run

**Why this cannot be waived silently:**
The DoR warning (W2) did not constitute a risk acceptance of shipping without any verification — it accepted *manual* verification as a substitute for automated testing, with the verification gated to DoD. The condition has not been discharged. Treating the merged PR as sufficient would retroactively convert a time-bound commitment into an indefinite deferral, which would misrepresent the story's compliance posture.

**Risk if closed as-is:**
If key material is present in logs and this is not caught, the system is in breach of the PCI DSS 3.4 control as interpreted in the NFR. The risk is not theoretical — log sinks, monitoring pipelines, and SIEM systems routinely index and persist log content. The 5-second grace-period window and the atomic swap implementation described in the PR do not address log hygiene; those are orthogonal concerns.

**GAP-1 status: OPEN — blocks DoD.**

---

### 4. Implementation Quality Observations

The following are observations, not blockers. They are flagged for the team's awareness.

**4a. Key generation**
`crypto.randomBytes(32).toString('hex')` produces 256 bits of entropy encoded as a 64-character hex string. This is cryptographically adequate for MVP. No concern.

**4b. Atomic lock mechanism**
The PR notes "async lock on the key index." The implementation is not reviewed at source here, but the approach is consistent with AC3's atomicity requirement. Tech lead sign-off (@alex.chen) is recorded.

**4c. Rate limiter**
The PR introduces a sliding window implementation (rate-limiter.js) separate from the handler. This is architecturally sound and testable in isolation (T7 confirms this). No concern.

**4d. Out-of-scope boundary**
None of the out-of-scope items (key expiry, multiple active keys, notifications, admin rotation) appear to have been introduced in the PR description. No scope creep observed.

---

### 5. Process Compliance

| Check | Status | Notes |
|-------|--------|-------|
| Tech lead review recorded | ✅ | @alex.chen, 2026-05-15 |
| DoR artefact present | ✅ | apk.2-dor.md, verdict PROCEED |
| Test plan artefact present | ✅ | apk.2-test-plan.md |
| DoR warnings carried forward | ⚠️ | W2 / GAP-1 carried to DoD as open — not resolved |
| Manual verification commitment discharged | ⛔ | No evidence provided |

---

## Remediation — Required to Unblock DoD

The following action is required before apk.2 may be marked Done. It is singular and specific.

---

### REM-1 — Verify and evidence NFR-2 log compliance *(Blocks DoD)*

**Owner:** Engineer who implemented rotate.js / tech lead @alex.chen
**Priority:** HIGH — compliance blocker

**What is required:**

Either **(a)** an automated regression test, or **(b)** documented manual verification with a durable evidence record.

**Option A — Automated test (strongly preferred):**

Add a test (e.g., `T8`) to `tests/keys/rotate.test.js` (or a dedicated log-hygiene test file) that:

1. Spies on or captures log output during a key rotation call.
2. Asserts the old key value does not appear in any log entry at INFO level or above.
3. Asserts the new key value does not appear in any log entry at any level.
4. Covers at least one rotation success path and, optionally, a 429 path (to confirm the attempted key value is not logged on rejection either).

This should be a low-effort addition given the implementation is already tested at the handler level. The logging framework in use (not specified in the PR) will determine the spy/capture mechanism, but this is a standard pattern in Node.js test suites (e.g., intercepting a winston or pino logger instance).

**Option B — Manual verification (acceptable at MVP if Option A is genuinely not feasible, but must be documented):**

If automated testing of log output is not feasible in the current test harness, the following evidence must be produced and committed to the artefacts directory:

- A record of the test environment and log sink used.
- The exact rotation request(s) issued (redacted key values in the record itself).
- The captured log output demonstrating absence of key material.
- Sign-off by tech lead (@alex.chen) and, given PCI DSS scope, a second sign-off from a security or compliance owner.
- The record must be committed as a durable artefact (e.g., `artefacts/api-key-mgmt/compliance/apk.2-nfr2-log-verification.md`) — a Slack message or verbal confirmation does not constitute evidence.

**Note:** If Option B is chosen, a follow-up ticket to add the automated regression test (Option A) should be created before the next sprint ends to prevent this coverage gap from persisting across future changes to the logging layer.

---

## DoD Verdict

```
┌─────────────────────────────────────────────────────────┐
│  Story:   apk.2 — API Key Rotation Endpoint             │
│  PR:      #231 (merged)                                 │
│  Verdict: ⛔  FAIL — BLOCKED                            │
│                                                         │
│  Blocker: GAP-1 / NFR-2 unverified (PCI DSS 3.4)       │
│           Log compliance evidence not provided.         │
│           DoR commitment (W2) not discharged.           │
│                                                         │
│  Action:  Complete REM-1, then re-run DoD pipeline.     │
│  Owner:   Implementing engineer + @alex.chen            │
└─────────────────────────────────────────────────────────┘
```

---

*The story card for apk.2 should remain In Review / Not Done until REM-1 is closed and a DoD re-run returns a passing verdict. If the PR merge has already advanced the card on the board, it should be moved back pending resolution.*