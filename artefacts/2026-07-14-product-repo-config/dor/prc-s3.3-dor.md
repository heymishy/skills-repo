# Definition of Ready: Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected (prc-s3.3)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s3.3.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.3-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s3.3-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed** — the contract's scope boundary (read-side only, write-through explicitly excluded) matches the story's post-`/review` corrected version, not the original overlapping one.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has a test | ✅ | 3 integration tests |
| H4 | Out-of-scope populated | ✅ | Write-through behaviour, new routes |
| H5 | Benefit linkage names a metric | ✅ | Metric 1 — corrected wording (was a HIGH finding, resolved run 2) |
| H6 | Complexity rated | ✅ | Rating 1 (dropped from 2 post-correction), Stable |
| H7 | No unresolved HIGH findings | ✅ | Review run 2 (post-scope-correction): 0/0/0 |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s3.1, prc-s3.2 |
| H9 | Architecture Constraints populated | ✅ | Correctly notes what's NOT this story's scope; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | No new adapter — reads from `prc-s3.2`'s cache |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1, W2, W3, W5 | Pass cleanly | ✅ | N/A — 0 MEDIUM findings in run 2 |
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
Story: Wire standardsList to read from the git-backed cache, with promote/opt-out proven unaffected — artefacts/2026-07-14-product-repo-config/stories/prc-s3.3.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s3.3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- This story's scope is READ-SIDE ONLY (standardsList) plus regression
  proof for standardsPromote/optoutPost/optoutDelete. Do NOT touch
  standardsPost/standardsPut's write-through logic -- that belongs to
  prc-s3.1 and was already built there. This boundary was tightened after
  /review flagged scope overlap in the original version of this story --
  do not reintroduce it.
- Existing standardsPromote/optoutPost/optoutDelete test suites must pass
  UNMODIFIED -- if you find yourself needing to change their fixtures or
  assertions, stop and flag it, that's a sign this story's boundary has
  been crossed.
- Depends on prc-s3.1 and prc-s3.2 being signed-off/merged first
  (schemaDepends: dorStatus).
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
