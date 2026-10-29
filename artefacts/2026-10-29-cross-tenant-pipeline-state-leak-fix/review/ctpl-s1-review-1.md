# Review: ctpl-s1 — Tenant-match guard on pipeline-state-derived journey features

**Run:** 1
**Date:** 2026-10-29
**Scope:** Category C+D only (short-track exception)

## Findings

None — 0 HIGH, 0 MEDIUM. The story's first draft compared a *product's* `repo_owner`/`repo_name` against `GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` — caught during this review as not applying to the actual call site (`handleGetJourney`/`GET /journey` is explicitly the "no product" bucket, confirmed by reading `server.js`'s route dispatch and `journey.js`'s own `productId == null` filter), and corrected to the right comparison: `req.session.tenantId` against `process.env.PLATFORM_TENANT_ID`, reusing the exact identity check `registerSelfAsProduct` already uses for the same "is this the self-hosted tenant" question. ACs are now testable against real tenant-session fixtures: AC1 (tenantId mismatched), AC2 (tenantId matches — the one legitimate case, regression guard), AC3 (`PLATFORM_TENANT_ID` itself unset — fail-closed guard, unset env var must never wildcard-match). Each AC names a concrete, observable outcome (feature list empty vs populated) rather than a vague "isolation maintained" assertion. Out of Scope section correctly separates "stop the leak now" (this story) from "build real per-tenant cloning" (the actual feature-restoration fix, a separate initiative) and from "audit the other 9 `getRepoRoot()` call sites" (a named, not-silently-dropped follow-up). Architecture Constraints keep the fix to one call site, consistent with "small, bounded, well-understood" short-track scope.

## Verdict

**PASS** — 0 HIGH findings. Proceed to `/test-plan`.
