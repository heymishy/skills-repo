# Discovery: E2E Core Journey Coverage on Staging

**Status:** Approved
**Created:** 2026-07-23
**Approved by:** Hamish King — Founder/Operator — 2026-07-23
**Author:** Claude (agent), operator-directed

---

## Problem Statement

The platform has 29 Playwright E2E specs, but they provide effectively zero regression protection today, for two independent reasons confirmed by direct investigation:

1. **E2E never runs in CI.** `.github/workflows/e2e.yml` gates the entire suite behind an opt-in flag (`audit.e2e_tests: true` in `.github/context.yml`), and that flag is not set at all — it is absent from the file. Every PR merges with zero E2E signal, visible or otherwise.
2. **Even run manually, the suite doesn't test what matters most.** `playwright.config.js` always spins up a local `NODE_ENV=test` server with a mocked LLM gateway and stubbed OAuth credentials — it never runs against real deployed staging, real GitHub OAuth, or real Stripe. No existing spec drives GitHub OAuth signup specifically, real Stripe test-mode plan selection, the `/ideate` canvas visualization, the `/definition` story-map canvas, or session-resume-mid-SSE-stream (the exact behavior just hardened in `wusl-s1`/`wusl-s2` this session).

The cost of this gap is not hypothetical: three real, user-facing bugs shipped and were only caught by the operator's own live manual testing this session (an OAuth callback returning "Forbidden," a silently-broken journey-creation path, and session state being dropped on resume) — each of which a properly-scoped E2E journey covering these exact flows would have caught before merge.

## Who It Affects

**Primary: Hamish King (Founder/Operator)** — the sole developer shipping changes to this platform daily via the outer/inner loop. Currently has no automated signal that a change broke signup, billing, product/feature creation, or the core `/ideate`-or-`/discovery`-through-DoR journeys until manually clicking through staging himself — exactly what surfaced all three bugs this session, at a point in the workflow (post-merge, live testing) that is more expensive to fix from than a CI-blocked PR.

**Secondary: any future paying user or team** who would hit one of these same classes of bug in production if a regression ships untested.

## Why Now

This session itself is the trigger: three real regressions (OAuth callback, journey registration, SSE session-state restore) all reached the operator's own live testing rather than being caught by CI, directly because no E2E journey covers real signup, real billing, or session-resume behavior against real staging. Now that the underlying session-persistence work (`wusl-s1`/`wusl-s2`) is freshly fixed and well-understood, it is the natural moment to lock in E2E coverage before the next round of drift — rather than repeat the same expensive discovery-via-production-bug-report cycle.

## MVP Scope

Two Playwright scenarios, running against real deployed `wuce-staging` (not the local `NODE_ENV=test` harness the existing 29 specs use):

**Scenario A — New user, rough-idea/`/ideate` path:**
1. Sign up via GitHub OAuth (mocked or stubbed test identity) **or** email/password signup.
2. Select a plan using the real Stripe test-mode environment and a Stripe test card.
3. Create a new product, fill in product details.
4. Create the first feature, choosing the "rough idea" path into `/ideate`.
5. Verify the `/ideate` visual canvas renders and updates as the session progresses.
6. Verify artefacts are saved to disk/Postgres as expected.
7. Close the session and resume it mid-SSE-stream — verify the restored state (canvas markers, turns, etc.) matches what was there before closing, per `wusl-s1`/`wusl-s2`.

**Scenario B — Formed-idea path, full outer loop:**
1. Using a new (or the same) user, create a feature via the "formed idea" path.
2. Drive a single scenario through `/discovery` → `/benefit-metric` → … → `/definition-of-ready`.
3. Verify the `/definition` story-map canvas renders correctly.
4. Close the session mid-stream and resume it — verify restored state matches, per `wusl-s1`/`wusl-s2`.

Both scenarios run through the actual browser DOM (not the API-request-context shortcut some existing specs use), since the explicit goal is verifying real UI behavior (canvas rendering, session resume) that request-context specs cannot observe.

**Resolved via /clarify:** the new CI-blocking gate applies only to these 2 new staging journeys — the 29 existing local-mocked specs remain non-blocking exactly as today, so this initiative isn't destabilized by pre-existing flakiness it didn't introduce (e.g. `wusl1`'s already-documented baseline failure). GitHub OAuth signup is tested via a stubbed/mocked flow, matching this repo's existing E2E convention (test-only `GITHUB_CLIENT_ID`/`SECRET` already used in `playwright.config.js`) — no real GitHub test account required.

## Out of Scope

- **Running these against real production** (`skills-framework`, the live Fly app) — staging only. Production is out of reach for automated test traffic creating real accounts/charges.
- **Testing every OAuth provider** — GitHub and email/password only, matching the two providers already implemented; Google OAuth (also implemented) is not included in this MVP.
- **Load or concurrency testing** — these are functional correctness journeys, not performance/scale tests.
- **Pixel-perfect visual regression (screenshot diffing)** — functional checks (canvas contains expected elements/markers, story map reflects the right data) only, not pixel-level screenshot comparison.

## Assumptions and Risks

All 4 originally-flagged assumptions were resolved via /clarify (see Clarification log below). Remaining risk, not fully resolved:

**Risk:** running real signup/billing/product-creation flows against shared staging repeatedly (every CI run) will accumulate real test data (users, products, Stripe test customers) in the staging database over time — needs a cleanup/teardown strategy. Not yet designed; carried forward as an open item for /benefit-metric or /definition to scope explicitly (e.g. a nightly cleanup job, or a naming convention + manual periodic purge).

**Risk:** staging may not always reflect the very latest merged code, since CI auto-deploy is currently broken (operator confirmed proceeding anyway) — an E2E failure could reflect stale staging content rather than a genuine regression in the PR under test. Mitigated partially by the operator's own practice of manually deploying after merges this session, but not a structural guarantee.

## Directional Success Indicators

**E2E CI enforcement:** Baseline: 0 of these journeys are covered today; E2E is non-blocking even when manually run. Target: both Scenario A and Scenario B pass in CI on every PR, and a failure blocks merge (not merely visible). Measured via: CI run status on the E2E workflow, plus a documented spec → journey-step coverage mapping so it's auditable which real user-facing step each assertion actually proves.

## Constraints

None beyond what's already true of this platform: real Stripe test-mode keys and a real (or app-scoped) GitHub OAuth test identity must exist or be provisioned; the suite must reuse this repo's existing mock-LLM-gateway convention (never call real Anthropic APIs from E2E, matching every other spec's own NFR); solo-operator team capacity (no dedicated QA resourcing).

---

## Clarification log

[2026-07-23] Clarified via /clarify:
- Q: Should the new CI-blocking gate apply to only the 2 new staging journeys, or to all 31 specs?  A: New staging journeys only — the 29 existing local-mocked specs remain non-blocking.
- Q: Is a Stripe test-mode account with test API keys already set up, or does it need provisioning?  A: Already exists — operator will provide the test keys/card at implementation time.
- Q: For GitHub OAuth signup testing, real test account or stubbed/mocked flow?  A: Stubbed/mocked, matching this repo's existing E2E convention (test-only `GITHUB_CLIENT_ID`/`SECRET`) — no real GitHub account needed.
- Q: The CI auto-deploy-to-staging token has been broken all session — proceed anyway?  A: Yes — manual deploy is acceptable; E2E runs against whatever is currently on `wuce-staging`.

---

## Contributors

- Hamish King — Founder/Operator

## Reviewers

- Hamish King — Founder/Operator

## Approved By

Hamish King — Founder/Operator — 2026-07-23

---

**Next step:** Human review and approval → /benefit-metric
