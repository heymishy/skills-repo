# Definition of Done: Wire real client-side PostHog identity tracking into the routes actually served in production

**PR:** https://github.com/heymishy/skills-repo/pull/876 | **Merged:** 2026-09-13T04:46:30Z
**Merge commit:** 2103d1451aa49943b9912eb1f035eff30acf2d76
**Story:** artefacts/2026-09-13-real-route-posthog-identity-wiring/stories/rpiw-s1-wire-client-posthog-into-real-routes.md
**Test plan:** artefacts/2026-09-13-real-route-posthog-identity-wiring/test-plans/rpiw-s1-test-plan.md
**DoR:** artefacts/2026-09-13-real-route-posthog-identity-wiring/dor/rpiw-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-13

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `handleRoot` with `POSTHOG_KEY` set renders the PostHog CDN init snippet in addition to the existing server-side `landing_page_viewed` capture (which still fires) — `T1`/`T2` tests, re-run fresh against merged master | Automated behavioural test (`unit`) | None |
| AC2 | ✅ | `handleRoot` renders a `cta_clicked` click-tracking script with the `typeof posthog !== 'undefined'` guard — `T3`/`T4` tests | Automated behavioural test (`unit`) | None |
| AC3 | ✅ | `handleGetDashboard` (non-board, non-json branch) renders `posthog.identify(login,{tenant_id:tenantId})` and `posthog.capture('login_completed')` — `T5`/`T6` tests | Automated behavioural test (`unit`) | None |
| AC4 | ✅ | `accessToken` never appears in rendered HTML from either route, even when set on the session or accidentally passed into `identify` — `T7`/`T8` security tests | Automated security test (`unit`) | None |
| AC5 | ✅ | Both routes render byte-identical output (no new script) when `POSTHOG_KEY` is unset — `T9`/`T10` tests | Automated behavioural test (`unit`) | None |
| AC6 | ✅ | `check-lab-s1.2-landing-page.js` (10/10) and `check-wnl-s3-dashboard-no-product-entry.js` (6/6) re-run unmodified against merged master, all pre-existing assertions still pass | Automated regression test (`unit`) | None |

**All 6 ACs satisfied.** 11/11 new tests + 16/16 regression tests re-run fresh against merged master (commit `2103d145`), 0 failures.

**Verification strength:** 6 unit, 0 integration-real-code, 0 live-verified, 0 production-observed. This story's core claim — "PostHog's `$pageview` autocapture will fire with a real, alias-able per-visitor ID once this snippet loads in a real browser" — is an external-effect claim in the sense of `dvlg-s1`'s verification-strength rule. It was NOT live-verified against the real PostHog project in a real browser before merge (unlike `paes-s1`, which got a same-day live check). Recorded as a Follow-up Action below rather than silently treated as fully proven.

---

## Scope Deviations

None. The merged diff (`src/web-ui/modules/posthog-client-snippet.js`, `src/web-ui/routes/public.js`, `src/web-ui/routes/products.js`, the new test file, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `journey.js`, `landing.js`, the `?view=board`/`res.json` branches, and `dashboard.js`'s fallback were all left untouched exactly as scoped.

---

## Test Plan Coverage

**Tests passing:** 11/11, re-run fresh 2026-09-13 against merged master (commit `2103d145`) — `tests/check-rpiw-s1-real-route-posthog-wiring.js`.

**Gaps:** None against the story's own ACs.

**Full regression suite:** 651 files run, 1 failure — `tests/check-p3.5-validate-trace.js` (`ps1-exits-0-on-valid-repo-with-ci-flag`), the pre-existing documented resource-contention flake. No new regressions — notably, `tests/check-pcr-s1-test-runner.js`'s timing-threshold flake (which appeared once during this story's own PR CI run) did NOT recur in this fresh post-merge run, and was independently confirmed to fail identically on unmodified master during PR review, ruling it out as caused by this change.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new server-side computation | ✅ | Both new call sites are a single conditional string `.replace()` on already-rendered HTML |
| Security — accessToken never rendered client-side | ✅ | `T7`/`T8` dedicated tests; `buildPostHogScript` only reads `opts.identify.login`/`opts.identify.tenantId`, ignoring any other field |
| Audit | ✅ N/A | No new audit surface — PostHog's own anonymous `$pageview` capture and the existing `identify`/`login_completed` pattern, both already-established mechanisms |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly closes a real instrumentation gap discovered while building the operator's PostHog "Production Overview" dashboard (2026-09-13) — the activation funnel (`landing view → journey created`) could not link identities because no page real users visit ever loaded the PostHog browser SDK.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified in a real browser.** Unlike `paes-s1` (which got a same-day real E2E + PostHog Activity-view check), this story's fix has not yet been confirmed against the real PostHog project with an actual browser visit. The next time the operator (or a real visitor) loads the production landing page and/or dashboard, check PostHog's Activity view for: (a) a `$pageview` event on `/` from a real, non-`e2e-test-`, per-visitor cookie ID (not `'anonymous'`), and (b) a `login_completed` event correctly identified to that same person after logging in. This closes the loop the same way `paes-s1`'s live check did.
2. **CI timing flake observed once, ruled out as caused by this change.** During this PR's own local pre-push full-suite run, `tests/check-pcr-s1-test-runner.js` (a test-runner throughput timing test, unrelated in subject matter to this story's diff) failed by a small margin (~1-2% over its 749.8ms/file budget). Re-run on unmodified master reproduced the identical failure, confirming it as pre-existing machine-load-sensitive flake, not a regression from this change. It did not recur in the post-merge full-suite run reported above. Not proposing a fix — a second, independently-observed timing flake alongside the already-documented `check-p3.5-validate-trace.js` one is worth someone eventually tightening that budget's tolerance, but that's a separate story if the pattern recurs.
