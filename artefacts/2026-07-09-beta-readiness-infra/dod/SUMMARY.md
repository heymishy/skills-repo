# Definition of Done Summary: beta-readiness-infra

**Date:** 2026-07-14
**Assessed by:** Claude (agent)
**Feature status:** 16 of 17 stories DoD-complete. `bri-s3.3` (multi-user within one tenant journey spec) remains `dorStatus: blocked`, pending the separate `2026-07-09-team-identity-roles` feature — not part of this DoD sweep, and the feature as a whole is NOT fully DoD-complete.

---

## Story outcomes

| Story | Epic | PR | Outcome | releaseReady | health |
|-------|------|----|---------| ------------- |--------|
| bri-s1.1 | 1 (feature flags) | #444 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s1.2 | 1 | #446 | COMPLETE WITH DEVIATIONS | false | amber |
| bri-s1.3 | 1 | #452 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s1.4 | 1 | #454 | COMPLETE WITH DEVIATIONS | false | amber |
| bri-s1.5 | 1 | #458 | COMPLETE WITH DEVIATIONS | false | amber |
| bri-s2.1 | 2 (staging environment) | #442 | COMPLETE WITH DEVIATIONS | false | amber |
| bri-s2.2 | 2 | #447 | COMPLETE WITH DEVIATIONS | false | amber |
| bri-s2.3 | 2 | #448 | COMPLETE WITH DEVIATIONS | false | amber |
| bri-s2.4 | 2 | #453 | COMPLETE | true | green |
| bri-s2.5 | 2 | #457 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s2.6 | 2 | #462 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s3.1 | 3 (E2E test suite) | #445 | COMPLETE | true | green |
| bri-s3.2 | 3 | #451 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s3.4 | 3 | #459 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s3.5 | 3 | #449 | COMPLETE WITH DEVIATIONS | true | green |
| bri-s3.6 | 3 | #450 | COMPLETE | true | green |

Deviations for bri-s1.1, bri-s1.3, bri-s2.5, bri-s3.2, bri-s3.4, bri-s3.5 are disclosed, reasoned, already-closed scope growth or bookkeeping corrections, not open items. Six stories carry a genuinely open item each: bri-s1.2, bri-s1.4, bri-s1.5, bri-s2.1, bri-s2.2, bri-s2.3, detailed below.

---

## Real gaps found, not papered over

### 1. External-dependency gaps: DoR-acknowledged, never actually executed against live infrastructure (5 stories)

Every one of these was explicitly scoped at DoR (Definition of Ready) time as manual verification, an External-dependency gap, acknowledged. This is expected and correctly documented, but no evidence anywhere in this repo (decisions.md, workspace/state.json pendingActions, or any log file) shows any of them has ever actually been run against real infrastructure.

- bri-s2.1: real `fly deploy` plus Fly dashboard build confirmation; real Fly billing review after roughly one week.
- bri-s2.2: real Neon schema-identity comparison; real write-isolation check; real cold-start timing.
- bri-s2.3: real Upstash write-isolation check; real monthly-usage-ceiling dashboard review. This is the highest risk item in this whole sweep since no automatable substitute exists at all.
- bri-s1.2: real staging-vs-prod PostHog cross-contamination check, driven by real Playwright traffic against both live projects. This is now structurally unblocked by this same DoD sweep, since its PAT-06 gate required Epic 2 and bri-s3.4 both DoD-complete, which is now true, but it is still not executed.
- bri-s1.5: real comparison of the staging and prod PostHog projects' flag lists, confirming all 3 flags are mirrored by name. This is the highest risk item specific to this story.

Recommended operator action: batch all 5 into a single infrastructure-verification pass once real Fly, Neon, Upstash, and PostHog access is available, since most can be checked in one sitting.

### 2. A real wiring gap found by this DoD sweep, not previously caught (bri-s1.4)

`identifyTenantGroup()`, the function that registers a tenant as a PostHog Group Analytics group, is fully built, correctly unit-tested, and correctly wired at the adapter level, but is never called from any live request path anywhere in `src/`. `decisions.md` itself named an explicit revisit trigger for this exact check ("confirm bri-s1.3's bootstrap flow calls `identifyTenantGroup(...)`"), but nothing in this pipeline, including bri-s1.5 which depends on S1.1 through S1.4 all being complete, ever actually executed that check before this DoD sweep re-read the merged code directly.

Practical impact is partial: `isEnabled()`'s own logic already auto-derives a `groups.tenant` context on every flag-evaluation call independent of `identifyTenantGroup()`, so tenant-level flag targeting itself (AC1/AC2/AC4 of bri-s1.4, and AC3 of bri-s1.5's `org-kanban-view`) is genuinely proven correct and unaffected. What's missing is the explicit PostHog group-identify event that would populate a group record in PostHog's dashboard for each tenant, meaningful for analytics and reporting, not for flag-evaluation correctness.

Recommended fix: wire `identifyTenantGroup(resolveTenantIdFromRequest(req))` into `flag-bootstrap.js`'s `bootstrapFlags()`, ahead of its `isEnabled()` calls, exactly as originally planned. See bri-s1.4-dod.md and bri-s1.5-dod.md for full detail.

### 3. Pipeline-state.json bookkeeping drift, corrected by this sweep (3 stories)

- bri-s1.1: before this sweep, `totalTests: 8, passing: 7`. After this sweep, `totalTests: 7, passing: 7`. Root cause: a stale count; the test file has always had 7 tests, all passing.
- bri-s2.2: before this sweep, `totalTests: 6, passing: 5`. After this sweep, `totalTests: 5, passing: 4`. Root cause: a real, already-diagnosed test regression (T1) caused by an unrelated later story (bri-s1.2) reusing a similar string pattern for a different purpose, root-caused and RISK-ACCEPTed in `decisions.md` on 2026-07-11 at the time, but the pipeline-state.json entry for bri-s2.2 was never updated to reflect the known 4/5 result.
- bri-s2.5: before this sweep, `totalTests: 11, passing: 11`. After this sweep, `totalTests: 7, passing: 7`. Root cause: a benign side effect of a later, disclosed cross-story fix, where bri-s2.6 narrowed bri-s2.5's T4 from a whole-file regex to a job-scoped one.

This confirms `scripts/check-pipeline-state-integrity.js`'s pre-existing C3 (Check 3) findings for bri-s1.1 and bri-s2.2, run before this sweep began.

### 4. Untracked-file mysteries resolved, no gap

`.github/workflows/fly-deploy.yml` and `src/modules/mock-api-client.js` both appeared as untracked files in the outer session's `git status` at the start of this sweep. Both were confirmed via `git log --all` (zero commits, any branch) to have never existed in this repository's committed history — they are stray, uncommitted scratch files from a different, non-worktree checkout, unrelated to what actually shipped. The real, tested equivalents are `.github/workflows/staging-deploy.yml` and `pr-checks.yml` (bri-s2.5) and `src/web-ui/modules/mock-llm-gateway.js` (bri-s3.1).

---

## Metric signals

- Metric 1, a broken build cannot reach prod: not-yet-measured. Contributing stories bri-s2.1 through bri-s2.6. The gate mechanism is real and fully tested at the code level (bri-s2.6); no real PR has yet flowed through the whole staging, smoke test, manual promote pipeline against live infrastructure.
- Metric 2, feature flags toggle without a redeploy: not-yet-measured. Contributing stories bri-s1.1 through bri-s1.5. All 3 named flags are wired to real, already-shipped behaviour and pass automated tests; never confirmed against live, real PostHog projects.
- Metric 3, zero staging/prod PostHog cross-contamination: not-yet-measured. Contributing story bri-s1.2. The unit-level mechanism is sound; the live cross-contamination check is now structurally unblocked (Epic 2 and bri-s3.4 both DoD-complete) but not yet executed.
- Metric 4, risk-critical journeys have deterministic E2E coverage: not-yet-measured. Contributing stories bri-s3.1, bri-s3.2, bri-s3.4, bri-s3.5, bri-s3.6. 4 of 5 named journeys are covered (signup/onboarding, cross-tenant isolation, billing, auth), plus the mock-gateway foundation. The 5th (multi-user within one tenant, bri-s3.3) remains blocked on team-identity-roles and is explicitly out of this sweep's scope — the epic's own "5 of 5" target is genuinely not yet met.
- Metric 5, cross-tenant isolation suite has zero tolerance for flake or skip: on-track. Contributing story bri-s3.4. Directly and fully evidenced: 0% skip, 0% flake confirmed across a 20x repeat run, post rate-limit-bypass fix.
- Metric 6, @mocked suite runtime under 10 minutes: not-yet-measured. Contributing stories bri-s3.1 through bri-s3.6. Each story's own test file was verified individually in this sweep; a timed run of the full aggregate @mocked suite has never been performed.

---

## Consolidated follow-up actions across all 16 stories

1. Highest priority, real infrastructure verification, no owner assigned: bri-s2.3's Upstash usage-ceiling review and bri-s1.5's PostHog flag-list mirroring check are the two items with zero possible automated coverage. Both should be scheduled promptly.
2. Wiring fix, real but lower-severity gap: wire `identifyTenantGroup()` into `flag-bootstrap.js` (bri-s1.4 / bri-s1.5).
3. Batch infrastructure verification: bri-s2.1 (Fly), bri-s2.2 (Neon), bri-s1.2 (PostHog cross-contamination, now unblocked) — run together once real staging access is available.
4. Test-hygiene, low risk: tighten bri-s2.2's T1 regex to avoid future false-positive collisions with unrelated `NODE_ENV === 'staging'` conditionals elsewhere in `server.js`.
5. Recommended, not blocking: live-rehearse bri-s2.6's documented rollback runbook at least once.
6. Recommended, not blocking: run a timed full `@mocked` suite to produce a real Metric 6 signal.

---

## Full regression evidence

Each story's own test file was re-run directly against current master during this sweep (2026-07-14), independent of the story's own historical claims. Totals: 8+12+10+11+8 (Epic 1) + 8+4+5+9+7+10 (Epic 2) + 20+17+14+25+18 (Epic 3) = 166 individual test assertions verified in this session, with exactly one real, pre-existing failure found (bri-s2.2's T1, already root-caused and RISK-ACCEPTed in `decisions.md` prior to this sweep) and zero new regressions introduced by this DoD sweep itself, which is an artefact-only and pipeline-state-only change.

---

Next step: address the two highest-risk External-dependency gaps (bri-s2.3, bri-s1.5) and the bri-s1.4 wiring gap, then resolve bri-s3.3 (blocked on team-identity-roles) before this feature as a whole is ready for `/release`.
