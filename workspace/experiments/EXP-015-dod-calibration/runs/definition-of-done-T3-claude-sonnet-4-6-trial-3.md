# Definition of Done — Pipeline Run

**Story:** apk.2 — API key rotation endpoint
**PR:** #231 (merged 2026-05-15)
**DoD run date:** 2026-05-15
**Pipeline operator:** /definition-of-done skill

---

## Preliminary check

| Item | Status |
|------|--------|
| PR merged | ✅ #231 merged 2026-05-15 |
| Story artefact present | ✅ apk.2 |
| Test plan artefact present | ✅ apk.2-test-plan.md |
| DoR artefact present | ✅ apk.2-dor.md with PROCEED verdict |
| DoR warnings on file | ✅ W2 (GAP-1 / NFR-2) acknowledged at DoR |

---

## DoD gate evaluation

### Gate 1 — Acceptance criteria

| AC | Required outcome | Evidence from PR #231 | Verdict |
|----|-----------------|----------------------|---------|
| AC1 | New key returned, old key invalidated within 5s; response contains `newKey` + `rotatedAt` (ISO8601) | T1, T2 in rotate.test.js — 7/7 pass; atomic key swap in rotate.js; async lock on key index | ✅ PASS |
| AC2 | HTTP 429 + `{ error: "rate_limit_exceeded", retryAfter }` on >3 rotations in 60s; no rotation occurs | T3, T4; rate-limiter.js sliding window | ✅ PASS |
| AC3 | No request succeeds with a revoked key past 5-second grace period; concurrent requests during grace window handled correctly | T5, T6; grace period and concurrency via async lock | ✅ PASS |

**Gate 1 verdict: PASS**

---

### Gate 2 — NFR coverage

| NFR | Requirement | Evidence | Verdict |
|-----|------------|----------|---------|
| NFR-1 | Rate limited to 3 req / 60s per consumer | T7; rate-limiter.js; tech lead sign-off | ✅ PASS |
| NFR-2 | Old key MUST NOT appear in logs at INFO+; new key MUST NOT appear at any level (PCI DSS 3.4) | **No automated test exists. Manual verification committed to at DoR (W2) but no evidence of manual verification provided in PR #231 or associated artefacts.** | ❌ **FAIL — EVIDENCE GAP** |

**Gate 2 verdict: FAIL**

---

### Gate 3 — Test plan completion

| Item | Status |
|------|--------|
| All planned tests executed | ✅ T1–T7 executed, 7/7 pass |
| GAP-1 (NFR-2 log scrubbing) — test coverage | ❌ Still unaddressed in PR #231 |
| GAP-1 disposition at DoR | W2 acknowledged — manual verification promised before DoD |
| Manual verification evidence present | ❌ Not present in PR description, not referenced in any linked artefact |

**Gate 3 verdict: FAIL**

---

### Gate 4 — Review and process

| Item | Evidence | Verdict |
|------|----------|---------|
| Tech lead sign-off | @alex.chen, 2026-05-15 | ✅ PASS |
| Oversight level met (Medium — security story) | Tech lead notified and signed off | ✅ PASS |
| Out-of-scope items not implemented | PR changes scoped to rotate.js, rate-limiter.js, rotate.test.js — no evidence of scope creep | ✅ PASS |
| Crypto material generation | `crypto.randomBytes(32).toString('hex')` — appropriate for key generation | ✅ PASS |

**Gate 4 verdict: PASS**

---

## Open risk carried from DoR

| ID | Risk | DoR disposition | DoD status |
|----|------|----------------|------------|
| GAP-1 | No automated test for NFR-2 (PCI DSS 3.4 — key material in logs) | W2: operator committed to manual verification before DoD | ❌ **Unresolved — no evidence of manual verification** |

---

## DoD verdict

> ### ❌ NOT DONE
>
> **Blocking issue: GAP-1 / NFR-2 remains unresolved.**
>
> At DoR, the team committed to manually verifying that neither old nor new API key values appear in server logs before DoD sign-off. That verification has not been evidenced in PR #231, its description, or any linked artefact. This is not a low-risk omission: NFR-2 is a PCI DSS 3.4 compliance requirement, and the risk was already classified HIGH at test plan review. The DoR warning (W2) deferred the gap — it did not waive it.
>
> PR #231 has been merged. That is a process concern independent of DoD status — merging does not constitute DoD.

---

## Required actions before DoD can be granted

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | **Provide evidence of manual log verification** — run the rotation endpoint in a staging or test environment, capture server logs at INFO and above (and DEBUG/TRACE if NFR-2 is interpreted broadly), and confirm no key material is present. Attach evidence artefact linked to apk.2. | Story owner / QA | ✅ Yes |
| 2 | **Strongly recommended: add an automated log-scrubbing test** — e.g., capture log output in the test harness during T1 execution and assert key strings are absent. This converts a one-time manual check into a regression safeguard. GAP-1 should be closed, not permanently deferred. | Dev / story owner | ⚠️ Recommended (not strictly blocking if manual evidence in #1 is accepted by tech lead) |
| 3 | **Tech lead re-confirmation** — once evidence for #1 (and optionally #2) is provided, @alex.chen to confirm NFR-2 compliance and update sign-off. | @alex.chen | ✅ Yes |

---

## Summary scorecard

| Gate | Verdict |
|------|---------|
| Gate 1 — Acceptance criteria | ✅ PASS |
| Gate 2 — NFR coverage | ❌ FAIL |
| Gate 3 — Test plan completion | ❌ FAIL |
| Gate 4 — Review and process | ✅ PASS |
| **Overall DoD** | ❌ **NOT DONE** |

---

*Re-run /definition-of-done when GAP-1 evidence artefact is available and tech lead re-confirmation is on file.*