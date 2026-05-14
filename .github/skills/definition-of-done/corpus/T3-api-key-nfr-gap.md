# Corpus Case T3 — API key rotation: compliance NFR not evidenced

## Case metadata

```json
{
  "case_id": "T3",
  "label": "API key rotation — PCI DSS log-scrubbing NFR unverified in PR",
  "difficulty": "adversarial",
  "expected_verdict": "COMPLETE WITH DEVIATIONS",
  "expected_gap": "NFR-2 (API keys must not appear in server access logs — PCI DSS 3.4) — no evidence of log scrubbing test or log inspection in PR",
  "adversarial_pattern": "All 3 ACs are satisfied and the PR is thorough. The story has two NFRs: NFR-1 (rate limiting) is evidenced by a named test. NFR-2 (PCI DSS 3.4 — no API keys in logs) has no evidence in the PR — no log scrubbing test, no log inspection mentioned, no CI scan result. A model that runs NFR-1 evidence check and then assumes NFR-2 is equally covered will produce a compliance false positive.",
  "failure_modes_to_watch": [
    "NFR batch pass: NFR-1 has evidence → assume NFR-2 also covered",
    "Compliance NFR treated as lower priority than functional NFR",
    "Verdict COMPLETE instead of COMPLETE WITH DEVIATIONS",
    "PCI DSS clause not named in the deviation record"
  ]
}
```

---

## Input bundle

> **Operator instruction:** Please run /definition-of-done for the story and supporting artefacts below. PR #231 has been merged.

---

### Story artefact

**Story ID:** apk.2
**Feature:** API Key Management
**Epic:** Developer Platform — Security

---

## Story: API key rotation endpoint

**As a** platform API consumer,
**I want** to rotate my API key via a POST to `/api/keys/rotate`,
**So that** I can invalidate a potentially compromised key without revoking API access entirely.

## Acceptance Criteria

**AC1:** Given I am authenticated and POST to `/api/keys/rotate`, when the request is valid, then a new API key is generated, the old key is invalidated, and the response body contains `{ newKey: string, rotatedAt: ISO8601 }`. The old key is rejected on any subsequent API call within 5 seconds of rotation.

**AC2:** Given I POST to `/api/keys/rotate` more than 3 times within 60 seconds, when the rate limit is reached, then the endpoint returns HTTP 429 with body `{ error: "rate_limit_exceeded", retryAfter: <seconds> }` and no key rotation occurs.

**AC3:** Given the key rotation is atomic, when a concurrent request uses the old key during the rotation window, then the request either succeeds (old key still valid) or fails with HTTP 401 (new key required) — no request succeeds with a revoked key that is past the 5-second grace period.

## Out of Scope

- Key expiry date configuration — all keys are non-expiring at MVP.
- Multiple active keys per consumer — single active key per consumer for MVP.
- Key rotation notifications (email/webhook) — deferred to apk.5.
- Admin-initiated forced rotation — deferred to apk.6.

## NFRs

**NFR-1:** Key rotation endpoint is rate-limited to 3 requests per 60 seconds per consumer to prevent key-cycling attacks. (Security — brute force protection)

**NFR-2:** After key rotation, the old key value MUST NOT appear in server access logs at INFO level or above. New key values MUST NOT be logged at any level. (Compliance — PCI DSS 3.4: Render PAN unreadable anywhere it is stored; interpreted here as: cryptographic material must not appear in logs)

## Complexity

Complexity: 2 (concurrency window and atomic invalidation require careful implementation)

---

### Test plan summary

**Test plan artefact:** artefacts/api-key-mgmt/test-plans/apk.2-test-plan.md

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 | T1: new key returned on rotation; T2: old key rejected within 5s | Full | — |
| AC2 | T3: fourth rotation in 60s returns 429; T4: rate limit resets after 60s window | Full | — |
| AC3 | T5: concurrent request with old key during grace period succeeds; T6: request with revoked key after grace period returns 401 | Full | — |
| NFR-1 | T7: rate limiter rejects request 4 when 3 rotations within 60s | Full | — |
| NFR-2 | _none_ | None | **GAP-1 (COMPLIANCE — HIGH RISK):** No log scrubbing test. NFR-2 (PCI DSS 3.4) requires API keys to not appear in server logs. No test verifies log output does not contain key material. Manual log inspection deferred — noted at DoR but not RISK-ACCEPTed. |

---

### DoR artefact summary

**DoR artefact:** artefacts/api-key-mgmt/dor/apk.2-dor.md
**DoR verdict:** PROCEED
**Warnings acknowledged:** W2 (GAP-1 in test plan for NFR-2 — operator noted "will verify logs manually before DoD")
**Oversight level:** Medium (security story, tech lead notified)

---

### PR description — PR #231 (merged 2026-05-15)

```
## Summary
Implements API key rotation endpoint per apk.2.

## Changes
- src/api/keys/rotate.js — POST /api/keys/rotate handler with atomic key swap + grace period
- src/api/keys/rate-limiter.js — sliding window rate limiter (3 req / 60s per consumer)
- tests/keys/rotate.test.js — 7 tests covering AC1–AC3 and NFR-1

## Test results
7/7 tests pass. All ACs and NFR-1 rate limiting verified.

## Security notes
Key values are generated using crypto.randomBytes(32).toString('hex'). Old keys are invalidated by removing them from the active-key index. Concurrency handled via async lock on the key index.

## Reviewer
Tech lead sign-off: @alex.chen — 2026-05-15
```

---

## Expected verdict

**Verdict:** COMPLETE WITH DEVIATIONS

**Gap that fires:** NFR-2 — API keys must not appear in server logs (PCI DSS 3.4) — no evidence of log scrubbing test or manual log inspection. DoR warning W2 noted intent to verify manually before DoD; that verification is not evidenced in the PR.

**Reason:** AC1–AC3 are verified (T1–T7 pass). NFR-1 is verified (T7 pass). NFR-2 has no corresponding test (GAP-1 in test plan is open and not RISK-ACCEPTed). The PR description says "7/7 tests pass" — but there are only 7 tests covering ACs and NFR-1; NFR-2 has no test. The PR does not mention log scrubbing, log inspection, or any PCI DSS compliance verification. The tech lead sign-off covers functionality, not PCI compliance. This is COMPLETE WITH DEVIATIONS, not COMPLETE.

**What a correct model output looks like:**
> ✅ AC1 — Key rotation + old key invalidation: T1+T2 pass
> ✅ AC2 — Rate limiting 429: T3+T4 pass
> ✅ AC3 — Concurrency grace period: T5+T6 pass
> ✅ NFR-1 — Rate limiter: T7 pass
>
> ⚠️ **NFR-2 not evidenced — PCI DSS 3.4**
> NFR-2 requires that API key values do not appear in server access logs at INFO or above (PCI DSS 3.4). The PR description does not include any log scrubbing test, log inspection result, or CI scan output. DoR warning W2 noted intent to verify manually — no evidence of this verification in the PR. This compliance NFR cannot be called verified.
>
> **Verdict: COMPLETE WITH DEVIATIONS**
> Deviation: NFR-2 (PCI DSS 3.4 — key material log scrubbing) not evidenced. Options: (1) add a log-scrubbing test, (2) provide manual log inspection evidence, (3) RISK-ACCEPT in /decisions with explicit PCI DSS clause acknowledgement.

**What a failing model output looks like (false positive):**
> AC1 ✅ — T1+T2
> AC2 ✅ — T3+T4
> AC3 ✅ — T5+T6
> NFR-1 ✅ — T7
> NFR-2 ✅ — Security notes confirm crypto.randomBytes for key generation; tech lead reviewed
> 7/7 tests pass.
> **Verdict: COMPLETE**

## Adversarial signal

The trap is that NFR-1 is thoroughly covered (T7 exists) and NFR-2 looks like a companion security requirement. A model that sees "security notes confirm crypto.randomBytes" and a "tech lead sign-off" may infer that the security NFR is covered by proxy. But crypto.randomBytes covers key *generation* security — not log scrubbing. NFR-2 is about *logging behaviour*, which requires a completely different verification method (log inspection or a test that captures log output). The test plan gap table (GAP-1) makes this clear, but only if the model reads it carefully. The PR's "7/7 tests pass" statement is technically accurate — it's just that NFR-2 has no test.
