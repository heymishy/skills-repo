# Definition of Done — `/definition-of-done`

**Story:** apk.2 — API key rotation endpoint
**PR:** #231 (merged 2026-05-15)
**Evaluated:** 2026-05-15
**Pipeline version:** DoD-1.0

---

## Preliminary check — PR merge status

> PR #231 has been merged per operator instruction.

⚠️ **Procedural flag:** PR #231 was merged prior to DoD evaluation completing. This is noted for audit purposes. The DoD verdict below reflects the state of the merged artefact.

---

## DoD Checklist Evaluation

### 1. Acceptance Criteria Coverage

| AC | Required | Evidence | Status |
|----|----------|----------|--------|
| AC1 | New key returned; old key invalidated within 5s; response shape correct | T1, T2 — 7/7 pass per PR | ✅ Pass |
| AC2 | HTTP 429 + correct body on 4th rotation in 60s; no rotation occurs | T3, T4 — 7/7 pass per PR | ✅ Pass |
| AC3 | Concurrent request with old key during grace period handled correctly; revoked key after grace period → 401 | T5, T6 — 7/7 pass per PR | ✅ Pass |

**AC verdict: PASS**

---

### 2. NFR Coverage

| NFR | Requirement | Evidence | Status |
|-----|-------------|----------|--------|
| NFR-1 | Rate limit: 3 req / 60s per consumer | T7 — verified in test suite | ✅ Pass |
| NFR-2 | Old key MUST NOT appear in logs at INFO+; new key MUST NOT appear at any level (PCI DSS 3.4) | **No automated test. No evidence of manual verification. GAP-1 unresolved.** | ❌ **FAIL** |

**NFR verdict: FAIL**

---

### 3. Test Plan Integrity

| Check | Finding | Status |
|-------|---------|--------|
| All planned tests executed | 7/7 tests pass | ✅ |
| Test plan gaps resolved before DoD | GAP-1 was flagged at DoR as requiring manual verification before DoD. No evidence of that verification appears in the PR description, PR comments, or any linked artefact. | ❌ **FAIL** |
| Gap was RISK-ACCEPTed | DoR notes explicitly state: *"noted at DoR but not RISK-ACCEPTed"* | ❌ **FAIL** |

**Test plan verdict: FAIL**

---

### 4. DoR Commitments Honoured

The DoR artefact recorded the following commitment against GAP-1:

> *"will verify logs manually before DoD"*

| Commitment | Evidence of fulfilment | Status |
|------------|----------------------|--------|
| Manual log verification of NFR-2 before DoD | No log inspection report, no PR comment, no linked artefact | ❌ **NOT FULFILLED** |

This is not a minor omission. The DoR explicitly deferred the gap to DoD-time with a named commitment. That commitment is unmet.

---

### 5. Security & Compliance Checks

| Check | Finding | Status |
|-------|---------|--------|
| Tech lead sign-off | @alex.chen signed off 2026-05-15 | ✅ |
| Cryptographic key generation | `crypto.randomBytes(32).toString('hex')` — appropriate | ✅ |
| Atomic key invalidation | Async lock on key index documented in PR | ✅ |
| PCI DSS 3.4 log compliance | **Unverified. No test, no manual evidence.** | ❌ **FAIL** |

---

### 6. Out-of-Scope Integrity

No evidence that any out-of-scope items (key expiry, multiple active keys, notifications, admin rotation) were introduced. ✅ Pass.

---

## Blocking Issues

The following issues **block a DoD PASS** verdict:

---

### 🔴 BLOCKER-1 — GAP-1 UNRESOLVED: NFR-2 / PCI DSS 3.4 log compliance not verified

**Risk level:** HIGH (Compliance)
**What is required:** Evidence that API key material (old key and new key) does not appear in server logs. This was the explicit DoR commitment for this story.
**What is missing:** No automated test, no manual log inspection report, no reviewer attestation in PR.
**Why this blocks DoD:**
- NFR-2 is a hard compliance requirement (PCI DSS 3.4), not a best-effort item.
- The DoR explicitly did not RISK-ACCEPT this gap — it deferred it to DoD with a named commitment.
- Tech lead sign-off (@alex.chen) does not constitute log compliance verification unless explicitly stated.
- The PR was merged without this evidence — the merge does not satisfy DoD.

**Resolution options (any one of the following):**

| Option | What is needed |
|--------|---------------|
| A — Automated test (preferred) | Add a test that captures log output during rotation and asserts no key material is present at any log level. Attach to test suite. |
| B — Manual verification report | A named engineer produces a dated log inspection report (captured log output + assertion) and it is attached to this story's artefact directory. Tech lead co-signs. |
| C — Formal RISK-ACCEPT | If neither A nor B is feasible before release, a named risk owner (tech lead or above) must formally RISK-ACCEPT GAP-1 with a dated remediation commitment. This must be recorded in the story artefact, not assumed from the DoR note. |

---

### 🟡 PROCEDURAL FLAG — PR merged before DoD complete

PR #231 was merged on 2026-05-15 prior to this DoD evaluation. This does not change the DoD verdict but is recorded for audit. If BLOCKER-1 is resolved via Option A, a follow-up PR will be required post-merge.

---

## DoD Verdict

```
╔══════════════════════════════════════════════╗
║   DEFINITION OF DONE — NOT MET               ║
║   Story: apk.2                               ║
║   Blocking issues: 1 (BLOCKER-1)             ║
║   PR #231: Merged — remediation PR required  ║
╚══════════════════════════════════════════════╝
```

---

## Required next actions

1. **Assign** BLOCKER-1 to a named engineer. Given the compliance classification, tech lead (@alex.chen) should confirm ownership.
2. **Resolve** via Option A, B, or C above.
3. **Re-run** `/definition-of-done` against apk.2 once resolution artefact is available.
4. **If Option A:** open a follow-up PR with the log-scrubbing test, link it to apk.2, and re-evaluate.
5. **If Option C (RISK-ACCEPT):** document this in the story artefact and notify the security/compliance owner for the Developer Platform epic. PCI DSS gaps on a security epic require explicit compliance team visibility.

---

*This evaluation is scoped to the artefacts provided. It does not constitute a security audit or compliance certification.*