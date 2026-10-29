# Definition of Ready: ctpl-s1 — Tenant-match guard on pipeline-state-derived journey features

**Story:** artefacts/2026-10-29-cross-tenant-pipeline-state-leak-fix/stories/ctpl-s1-tenant-match-guard-on-merged-pipeline-features.md
**Test plan:** artefacts/2026-10-29-cross-tenant-pipeline-state-leak-fix/test-plans/ctpl-s1-tenant-match-guard-test-plan.md
**Review:** artefacts/2026-10-29-cross-tenant-pipeline-state-leak-fix/review/ctpl-s1-review-1.md
**Date:** 2026-10-29

## Hard Blocks

| # | Check | Status |
|---|-------|--------|
| H1 | As/Want/So with named persona | ✅ |
| H2 | 3+ ACs in Given/When/Then | ✅ 3 ACs |
| H3 | Every AC has a test | ✅ |
| H4 | Out-of-scope populated | ✅ (real tenant-clone fix, broader `getRepoRoot()` audit, both explicitly excluded with named follow-up) |
| H5 | Benefit linkage names a real metric | ⚠️ N/A — security bug fix, no benefit-metric linkage (consistent with short-track bug-fix precedent; this is not a feature advancing `m1` or any other tracked metric) |
| H6 | Complexity rated | ✅ Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ Review PASS, 0 HIGH (one real design correction made and re-reviewed during the same session — see review.md and the story's own "Correction made during review" note) |
| H8 | Test plan covers all ACs | ✅ |
| H9 | Architecture Constraints populated | ✅ |
| H-NFR | NFR profile exists | ⚠️ N/A — single-story bug fix, NFRs recorded directly in the story's own NFR section (Security/Performance), no dedicated feature-level `nfr-profile.md` needed at this scale (consistent with how other single-story short-track fixes in this repo's history are scoped) |
| H-GOV | Governance approval | ⚠️ No discovery artefact (short-track, security bug fix — skipped deliberately per operator instruction, same precedent as `actr-s1/s2/s3`) |
| H-ADAPTER | D37 check | ✅ N/A — no new injectable adapter; reuses the existing `process.env.PLATFORM_TENANT_ID` read already established by `registerSelfAsProduct` (`server.js`, pr-s1) |
| H-DESIGN | Design-token compliance | ✅ N/A — no UI/rendering change of any kind; pure server-side guard logic, `hasDesignSystemTrack: false` |
| H-E2E | E2E tooling gap | ✅ N/A — all 3 ACs are unit/integration tests against `_mergeStateFeaturesIntoJourneyList`'s guard and `handleGetJourney`'s real response body; no CSS-layout-dependent behaviour |

**All hard blocks pass** (H5/H-NFR/H-GOV carry known, accepted, explicitly-justified gaps for a single-story security bug fix at this scale — same class of exception already established for short-track work in this repo).

## READY / BLOCKED determination

## ✅ READY

## Coding Agent Instructions

```
Proceed: Yes
Story: Tenant-match guard on pipeline-state-derived journey features -- artefacts/2026-10-29-cross-tenant-pipeline-state-leak-fix/stories/ctpl-s1-tenant-match-guard-on-merged-pipeline-features.md
Test plan: artefacts/2026-10-29-cross-tenant-pipeline-state-leak-fix/test-plans/ctpl-s1-tenant-match-guard-test-plan.md

This is a security bug fix closing a live, confirmed cross-tenant data leak
(see story Background). Treat it as urgent but do not skip TDD discipline --
a careless fix here that still leaks under some edge case (e.g. empty-string
tenantId, see AC3) would be worse than the delay of doing it properly.

Goal:
1. In src/web-ui/routes/journey.js's handleGetJourney, before the existing
   call to _mergeStateFeaturesIntoJourneyListFn(journeys, repoRoot) (around
   line 450 today -- confirm the exact line before editing, this file has
   shifted before), add a guard: only call the merge function when
   req.session.tenantId is a non-empty string AND it exactly equals
   process.env.PLATFORM_TENANT_ID (also required non-empty). When the guard
   is false, skip the merge call entirely -- journeys stays as the
   already-filtered journey-store list, unmodified. Do NOT change
   _mergeStateFeaturesIntoJourneyList's own signature or its existing tests
   in tests/check-ep1-s1-journey-feature-merge.js -- this is a call-site
   guard, not a function-signature change.
2. Write the guard as a small named helper (e.g. _isPlatformSelfTenant(req))
   rather than an inline boolean expression duplicated at the call site --
   this repo's own convention elsewhere in this file favours small named
   predicates for exactly this kind of reusable condition.
3. Confirm the empty-string collision case explicitly (AC3's own named risk):
   two falsy-but-not-strictly-undefined values (tenantId: '' vs
   PLATFORM_TENANT_ID: '') must NOT be treated as a match by a naive
   leniency check -- write the test for this exact case, don't just trust
   === (=== on two empty strings IS technically true, so the guard's own
   non-empty check must come BEFORE or alongside the equality check, not be
   skipped).

Do not touch getRepoRoot() itself, _readPipelineFeatures() itself, or any of
the other 9 files calling getRepoRoot() (out of scope -- log each as a named
follow-up action in workspace/state.json's pendingActions at this story's
own DoD, do not silently investigate/fix them inline).

Update .github/pipeline-state.json via node bin/skills advance (never edit
directly, except this story's own initial creation which is already done).
Open a draft PR. Never merge/self-merge. Never push directly to
origin/master for CODE changes (bookkeeping-only commits to this story's own
artefacts/state are fine per CLAUDE.md's existing exception).

Oversight level: High -- this is a security fix with a live, confirmed
real-world impact (staging, likely production). Verify the fix against a
REAL multi-tenant scenario (not just mocks) before calling this done --
ideally a live Chrome check on staging mirroring the exact navigation this
session used to find the leak, confirming the leak is actually gone.
```

## Sign-off

**Signed off by:** Hamish King (Founder/Operator), direct in-session instruction, 2026-10-29.
