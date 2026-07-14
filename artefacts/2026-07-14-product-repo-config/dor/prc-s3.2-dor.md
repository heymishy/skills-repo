# Definition of Ready: Rebuild the standards DB cache from git content (prc-s3.2)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.2.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.2-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s3.2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | 3 integration tests |
| H4 | Out-of-scope populated | ✅ | Route wiring, real-time push sync |
| H5 | Benefit linkage names a metric | ✅ | Metric 1 — see W3 below, linkage wording itself is the acknowledged MEDIUM finding |
| H6 | Complexity rated | ✅ | Rating 2, Unstable |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (1-M1, benefit linkage reads as performance-indirect) |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s3.1 |
| H9 | Architecture Constraints populated | ✅ | ADR-012; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | ADR-012 "adapter-shaped" here means testable/injectable structure, not a settable external-dependency pair in the strict D37 sense — no `setX`/`getX` throwing-stub pattern is called for by this story |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1, W2, W5 | Pass cleanly | ✅ | N/A |
| W3 | MEDIUM findings acknowledged | ⚠️→✅ | `decisions.md`, W3 RISK-ACCEPT (3 stories, includes this one), 2026-07-14 |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |

---

## Oversight level

**Medium** (per `epic-3-standards-git-tracked.md`).

---

## Standards injection

No `domain` field — skipped.

---

## READY / BLOCKED determination

## ✅ READY

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Rebuild the standards DB cache from git content — artefacts/2026-07-14-product-repo-config/stories/prc-s3.2.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Cache updates happen in the SAME request as the git write -- not a
  deferred/background job.
- The standards table must be fully reconstructable from git content alone
  (prove this explicitly, not just "it seems to work").
- Read-time reconciliation for out-of-band git edits should be lightweight
  (a hash/ETag check, not a full content re-fetch on every read) -- do not
  regress standardsList's read latency.
- No webhook or push-based sync -- explicitly out of scope.
- Depends on prc-s3.1 being signed-off/merged first (schemaDepends: dorStatus).
- Architecture standards: read .github/architecture-guardrails.md (ADR-012).
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off required for Medium
**Signed off by:** Hamish King (Founder/Operator), 2026-07-14
