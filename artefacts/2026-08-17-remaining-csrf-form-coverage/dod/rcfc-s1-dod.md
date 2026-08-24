# Definition of Done: Extend CSRF token protection to the remaining server-rendered POST forms

**PR:** https://github.com/heymishy/skills-repo/pull/760 | **Merged:** 2026-08-24
**Story:** artefacts/2026-08-17-remaining-csrf-form-coverage/stories/rcfc-s1-extend-csrf-to-remaining-forms.md
**Test plan:** artefacts/2026-08-17-remaining-csrf-form-coverage/test-plans/rcfc-s1-test-plan.md
**DoR:** artefacts/2026-08-17-remaining-csrf-form-coverage/dor/rcfc-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — 6 journey-flow routes (`/journey/wizard`, `/api/journey`, `gate-confirm`, `reference-modal/skip`, `reference`, `stories`) rejected 403 without token, succeed with valid token | ✅ | `check-rcfc-s1-journey-forms-csrf.js` (12/12), re-run fresh against merged master | Automated test, full router dispatch | None |
| AC2 — 2 skill-session-form routes (`/api/skills/:name/sessions`, `/api/skills/:name/sessions/:id/commit`, form path only) rejected 403 without token, succeed with valid token | ✅ | `check-rcfc-s1-skills-sessions-csrf.js` (4/4), re-run fresh against merged master | Automated test, full router dispatch | None — see Scope Deviations for the annotations route removed from this AC before implementation |
| AC3 — 2 products routes (`/products/confirm`, `/products/:id/features`) rejected 403 without token, succeed with valid token | ✅ | `check-rcfc-s1-products-csrf.js` (4/4), re-run fresh against merged master | Automated test, full router dispatch | None |
| AC4 — legacy `renderLoginPage()` fallback shell rejected the same way the primary landing page's forms already are | ✅ | `check-rcfc-s1-legacy-login-csrf.js` (3/3), re-run fresh against merged master. Also fixed a real pre-existing bug found during investigation: this shell's sign-in form previously 403'd unconditionally (missing token field), regardless of credentials — the round-trip test doubles as the regression guard for that fix | Automated test, full router dispatch via the real catch-all fallback path | None |
| AC5 — full round-trip (render → extract real token from HTML → submit → validate) for every route in AC1–AC4 | ✅ | Folded into each route's own `-full-round-trip` test above, per the test plan's own explicit design — no separate test file | Automated test | None |

**All 5 ACs satisfied.** 23/23 tests re-run fresh against merged master (commit `82119523`), 0 failures.

---

## Scope Deviations

**One in-flight scope correction, made before code was written, fully documented in `decisions.md`:** `POST /api/artefacts/:slug/:file/annotations` was originally included in AC2 by the `/test-plan` phase (2026-08-24, based on a form-rendering function found in `views/artefact-view.js`), then removed from AC2 the same day during pre-implementation-plan investigation, after confirming that function (`renderArtefact()`) is dead code — never called anywhere in the live `src/web-ui` tree. The route is genuinely JSON/fetch-only (`handlePostAnnotation` documents its own JSON body shape), matching the story's own Architecture Constraints exclusion for JSON/fetch-only endpoints. This correction happened entirely before implementation started (story, decisions.md, test plan, DoR contract, and DoR were all updated in the same pass) — no code was ever written against the incorrect scope.

Confirmed at DoD time, fresh against merged master: `git diff` from branch-setup baseline to the merge commit shows zero changes to `src/web-ui/routes/annotation.js` or `src/web-ui/views/artefact-view.js` — the scope correction held through implementation exactly as decided.

No other scope deviations. All items in the story's Out of Scope section (the CSRF mechanism itself, `/webhook/stripe`, `NODE_ENV==='test'`-gated endpoints, the double-submit-header convention, and the annotations route) are confirmed genuinely untouched in the merged diff.

---

## Test Plan Coverage

**Tests passing:** 23/23 across 4 test files, re-run fresh 2026-08-24 against merged master (commit `82119523`):
- `check-rcfc-s1-journey-forms-csrf.js`: 12/12
- `check-rcfc-s1-skills-sessions-csrf.js`: 4/4
- `check-rcfc-s1-products-csrf.js`: 4/4
- `check-rcfc-s1-legacy-login-csrf.js`: 3/3

**Gaps:** None in the delivered scope. This story fully closes the gap `sec-perf-s3` itself deferred ("Deferred to a follow-up story to keep this one bounded") — all 8 routes named in that story's own Out of Scope section (minus the annotations route, corrected out of scope for the reason above) are now protected.

**CSS-layout-dependent gap audit:** Not applicable — every AC in this story is a backend HTTP-response-code assertion (403/302/303), no CSS-layout-dependent AC exists.

**Additional verification found during this story's own delivery (beyond the story's own test plan):** wiring CSRF onto 8 previously-unprotected handlers had a wide collateral blast radius — 20+ pre-existing unit/integration test files across other stories called the newly-guarded handlers directly with hand-built fixtures lacking a token, and 20+ Playwright E2E spec files across other stories made raw POST requests to the same routes bypassing the real rendered form. All were found via direct investigation (not assumed), repaired with the minimal fixture addition needed (`session.csrfToken`/`body._csrf` for unit tests; a shared `getCsrfToken`/`getCsrfTokenOptional` fixture for E2E specs), and independently re-verified passing. Two of these were confirmed to be *pre-existing, unrelated* failures unmasked (not caused) by this story's fix, and logged separately rather than folded into this story's own scope: F20 (`dsda-s1`'s fixture staleness against `dtra-s1`'s auto-extraction) and a `das-s2` "product needs a connected repo" 409 affecting `frsr-s1`/`pnfc-s1` — both confirmed present on a from-scratch clean master checkout with zero CSRF changes.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Authorisation — every server-rendered POST form target must reject a request with a missing or mismatched CSRF token | ✅ | All 15 `-rejected-without-csrf` tests across the 4 test files assert `403`/`"Forbidden"`, re-run fresh against merged master |
| No weakening of independently-existing access checks | ✅ | Verified directly against merged code: `handlePostJourney`'s existing `req.session.accessToken` check fires before `csrfGuard`, independently, unchanged (`src/web-ui/routes/journey.js:379-385`); `handlePostProductConfirm` is wrapped by router-level `authGuard`/`requireNonViewer` in `server.js:3319-3325`, both firing before the handler's own `csrfGuard` call — deny-by-default checks remain fully independent of the new CSRF gate |
| Audit — no CSRF token value logged | ✅ | `git diff` from branch-setup baseline to the merge commit across all of `src/web-ui/`, grepped for `console.log`/`_logger.*` calls referencing csrf: zero matches |
| Performance — token generation is a single cached call per session | ✅ | By construction — reuses `sec-perf-s3`'s existing `generateCsrfToken(req)`, unmodified, no new performance surface introduced |
| Accessibility — not applicable | ✅ | Hidden input fields only, no new visible UI |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field: "None formally tracked (short-track gap-closure, no benefit-metric artefact)"). This story is itself the fulfillment of the deferred item named in `sec-perf-s3`'s own DoD (F4 in `workspace/dod-backlog-findings.md`), not a new discretionary addition — its completion closes that finding rather than moving a tracked metric.

---

## Outcome

**COMPLETE**

No deviations from the delivered scope, no test gaps, no NFR gaps. The one scope correction (annotations route) happened entirely pre-implementation and is fully documented in `decisions.md` — not a post-hoc discovery.

---

## DoD Observations

1. **This closes F4 in `workspace/dod-backlog-findings.md`** — `sec-perf-s3`'s own self-documented, deferred CSRF gap, open since 2026-07-01. Moving F4 to the Resolved table is the next step after this DoD write.
2. **CI blast-radius pattern worth naming for `/improve`:** wiring a new guard (CSRF, or any additive request-shape check) onto an already-live, previously-unprotected handler has a collateral-repair cost that scales with how many other stories' tests call that handler directly or POST to it raw in E2E specs — not just the story's own new test count. This story's own 23 tests were the easy part; ~40 pre-existing files across ~15 unrelated stories needed fixture repairs before the full suite and CI were green. A pre-implementation grep across `tests/*.js` AND `tests/e2e/*.spec.js` for every call site of a target handler (not just the routes named in the story's own ACs) would have caught this scope up front rather than across 5+ follow-up commits during `/subagent-execution` and post-push CI.
3. **A distinct CI-specific failure mode surfaced only after push:** the E2E fix's first pass made a shared `getCsrfToken` helper throw when no token was found in a GET-rendered page — correct for `@mocked` specs (always run against a fresh local server built from this branch), but wrong for `@real-staging` specs (Scenario A/B's CI-blocking gates), which run against whatever is *currently deployed* to real `wuce-staging` — a target that lags this branch until merge and redeploy. A second, tolerant `getCsrfTokenOptional()` variant was needed specifically for those specs. Worth flagging as a durable pattern: any fixture helper shared between `@mocked` and `@real-staging` specs needs to tolerate the "not yet deployed" state on the staging side, even when the local/mocked side requires strictness.
