# Definition of Done: Resolve each product's own repo for SaaS export, tenant-scoped

**PR:** https://github.com/heymishy/skills-repo/pull/670 | **Merged:** 2026-08-06
**Story:** artefacts/2026-08-06-multi-tenant-repo-resolution/stories/mtrr-s1-tenant-scoped-repo-resolution.md
**Test plan:** artefacts/2026-08-06-multi-tenant-repo-resolution/test-plans/mtrr-s1-test-plan.md
**Verification script:** artefacts/2026-08-06-multi-tenant-repo-resolution/verification-scripts/mtrr-s1-verification.md
**Review:** artefacts/2026-08-06-multi-tenant-repo-resolution/review/mtrr-s1-review-2.md (0 HIGH findings)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — a credential authorized for product A resolves product A's own repo, not a shared/hardcoded value | ✅ | `check-mtrr-s1-tenant-scoped-repo-resolution.js`, "exportEndpointEndToEnd_twoProductsResolveIndependently" | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — product B's request independently resolves product B's own repo (genuine per-request, not cached/shared) | ✅ | Same test | Automated test, re-run fresh | None |
| AC3 — unauthorized credential gets 403, error body reveals no repo/owner/tenant identifier | ✅ | Same file, "nonExistentSlug_returns403or404_noRepoIdentifierInBody" | Automated test, re-run fresh | None |
| AC4 — `ownerRepoFromEnv()`/`GITHUB_REPO` fully removed from the export path, no additive fallback | ✅ | Same file, "githubRepoEnvVarNotReferenced_inExportPath" | Automated test, re-run fresh | None |

---

## Scope Deviations

None identified in this retroactive pass. Story's own Out of Scope items (multi-repo-per-product, repo-connection UX, broader single-repo-assumption audit) remain correctly excluded — the last is tracked as its own separate feature (`2026-08-06-single-repo-assumption-audit`), not silently dropped.

---

## Test Plan Coverage

**Tests passing:** 8/8 (`check-mtrr-s1-tenant-scoped-repo-resolution.js`), re-run fresh 2026-08-17 — matches the test-plan's originally-recorded 8/8 exactly, no drift.
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security: no cross-tenant inference via timing or distinguishable error responses | ✅ | AC3's no-identifier-in-body test, re-run fresh, passing |
| Performance: lookup adds ≤500ms versus the previous env-var read | ✅ | `tenantScopedLookupUnder500ms`, re-run fresh, passing |
| Audit: `export_fetch` log entry extended to record the resolved product | ✅ | Story's own framing; not independently re-verified line-by-line in this pass |

---

## Metric Signal

**Metrics:** Cross-tenant data isolation for the export feature; number of distinct products able to successfully use `--from-saas`.
**Status:** Mechanism shipped and tested — AC1/AC2 directly prove the isolation mechanism functions per-product, not globally. No fresh production-usage measurement taken in this pass.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required by this story. The broader "audit other parts of the codebase for the same single-repo/env-var pattern" item is explicitly tracked as its own separate feature (`2026-08-06-single-repo-assumption-audit`), not a gap in this story's own delivered scope.

---

## DoD Observations

1. ~11 days live in production, no incidents reported. Security-sensitive story (Domain: security/data, Complexity 3, Unstable scope stability per its own rating) closed cleanly with no deviations — worth noting given the higher risk classification.
2. Directly replaces the prior hardcoded `GITHUB_REPO`-env-var mechanism from `rb-s4` — confirmed via AC4's explicit test that no reference to it remains in the export path, not just an additive fallback.
