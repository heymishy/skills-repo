# Definition of Ready: Bootstrap a newly created repo with the skills framework (prc-s2.2)

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.2.md
**Test plan reference:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.2-test-plan.md
**Contract:** artefacts/2026-07-14-product-repo-config/dor/prc-s2.2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## Contract review

✅ **Contract review passed** — AC2's wording (already corrected at `/test-plan` time per `/review` finding 1-M1) aligns with the contract's stated test approach.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So format, named persona | ✅ | |
| H2 | ≥3 ACs, Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has a test | ✅ | 4 integration tests |
| H4 | Out-of-scope populated | ✅ | Standards bootstrap, per-tenant customization |
| H5 | Benefit linkage names a metric | ✅ | Metric 1 |
| H6 | Complexity rated | ✅ | Rating 3, Unstable — correctly the highest-ambiguity story in the feature |
| H7 | No unresolved HIGH findings | ✅ | Review run 2 (post-AC2-fix): 0/0/0 |
| H8 | No uncovered ACs | ✅ | All 4 covered |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: ["dorStatus"]` — depends on prc-s2.1 |
| H9 | Architecture Constraints populated | ✅ | ADR-014, ADR-020 cited; Category E 5/5 |
| H-E2E | CSS-layout-dependent gap | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | N/A |
| H-NFR3 | Data classification populated | ✅ | Internal |
| H-NFR-profile | Profile presence | ✅ | |
| H-GOV | Governance approval | ✅ | |
| H-ADAPTER | D37 wiring check | N/A | No new injectable adapter — the bootstrap function itself isn't a settable dependency, it's the orchestration logic; the Git Data API calls it makes reuse the same mocking pattern already established, not a fresh D37 pair |
| H-INF | Infra-plan gate | N/A | |
| H-MIG | Migration-review gate | N/A | |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Acknowledged by |
|---|-------|--------|-----------------|
| W1 | NFRs identified | ✅ | N/A |
| W2 | Scope stability declared | ✅ | N/A |
| W3 | MEDIUM findings acknowledged | ✅ | N/A — resolved to 0 MEDIUM in review run 2 |
| W4 | Verification script reviewed | ⚠️→✅ | `decisions.md` W4 RISK-ACCEPT (all 14 stories) |
| W5 | No unaddressed UNCERTAIN gaps | ✅ | N/A |

---

## Oversight level

**Medium** (per `epic-2-full-config-and-bootstrap.md`) — this story specifically named as carrying the epic's highest implementation ambiguity.

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
Story: Bootstrap a newly created repo with the skills framework — artefacts/2026-07-14-product-repo-config/stories/prc-s2.2.md
Test plan: artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Attempt the Contents/Git Data API approach FIRST (tree/blob/commit
  endpoints, single commit, no local git clone). Only fall back to a local
  clone + push if the API-only approach genuinely proves too complex --
  if you do fall back, log a decisions.md entry explaining why, per the
  story's own AC4.
- Bootstrap content must structurally match scripts/platform-init.js's
  COPY_DIRS -- read that file directly, do not re-derive the file list from
  memory.
- Even the fallback path must use the operator's own OAuth token, never a
  service account.
- Depends on prc-s2.1 being signed-off/merged first (schemaDepends: dorStatus).
- Architecture standards: read .github/architecture-guardrails.md (ADR-014, ADR-020).
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
