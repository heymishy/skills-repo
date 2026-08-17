# Definition of Done: Persistent viewing-as banner, exit flow, and permission-scoped visibility

**PR:** https://github.com/heymishy/skills-repo/pull/538 | **Merged:** 2026-07-21
**Story:** artefacts/2026-07-21-web-ui-experience-redesign/stories/d2-banner-exit-and-permission-scoped-visibility.md
**Test plan:** artefacts/2026-07-21-web-ui-experience-redesign/test-plans/d2-test-plan.md
**DoR artefact:** artefacts/2026-07-21-web-ui-experience-redesign/dor/d2-dor.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1: persistent banner on "any page in the app" | ❌ | Live Chrome check, 2026-08-17: banner correctly renders on `/settings` (and other `dashboard.js`/`settings.js`-routed pages); **does not render on `/dashboard`**, the Products landing page and likely the most-visited page in the app | Manual, real impersonation session started and reproduced twice | **Real, confirmed gap — see below** |
| AC2: non-admin target hides admin-only items | ✅ | `check-d2-banner-exit-permission-visibility.js`, part of 24/24 | Automated test, re-run fresh 2026-08-17 | None |
| AC3: admin target shows admin-only items accurately | ✅ | Same file | Automated test, re-run fresh | None |
| AC4: "Exit impersonation" reverts identity, banner disappears, no leftover session state | ✅ | Live-verified 2026-08-17: clicked "Exit impersonation" from the `/settings` banner, redirected to `/dashboard`, confirmed real identity (`heymishy`) and full product list restored, no banner, no leftover impersonation UI anywhere | Manual, live Chrome check | None |
| AC5: impersonation state does not survive session expiry/restart independently | ✅ | `check-d2-banner-exit-permission-visibility.js`, part of 24/24 | Automated test, re-run fresh | None |

24/24 automated assertions pass fresh on current master. **AC1 fails on live verification** despite the automated suite passing — the test suite's coverage of "any page" does not include the actual `/dashboard` route's real handler.

---

## Root cause of the AC1 gap

`/dashboard` is served by `handleGetDashboard` in `src/web-ui/routes/products.js` whenever `_pshPool` is configured (i.e. always on staging/production — confirmed via `server.js`'s route wiring). This handler reads `req.session.tenantId`/`login` but never reads or threads `req.session.impersonation` into its `renderShell()` call — unlike the older, structurally similar `handleDashboard` in `dashboard.js` (used only as a no-pool fallback) and `settings.js`'s `handleGetSettings`, both of which correctly thread it. `renderShell()`'s own banner logic (`html-shell.js` line ~385) is opt-in per caller by design — a caller that doesn't pass `impersonation` simply renders no banner, silently. This specific call site was missed when the banner mechanism was built.

## Scope Deviations

**AC1 is not satisfied for the `/dashboard` route** — a genuine implementation gap, not a scope deviation in the "extra work done" sense. Per DoD Step 2 protocol, the operator chose: **create a follow-up story** rather than accept as RISK-ACCEPT or reopen this PR. Follow-up story written: `artefacts/2026-08-17-impersonation-banner-dashboard-gap/stories/ibg-s1-thread-impersonation-into-dashboard.md`, queued for `/test-plan` next. This DoD is not blocked on that fix landing — it records the gap as found, with a named remediation already in motion.

---

## Test Plan Coverage

**Tests passing in CI:** 24/24, re-run fresh 2026-08-17.
**Gaps:** The test suite does not cover `/dashboard`'s actual route handler (`handleGetDashboard` in `products.js`) — only `handleDashboard` (`dashboard.js`) and `settings.js` are exercised for impersonation-banner threading. This gap directly explains why AC1's live failure wasn't caught pre-merge or in any of the ~4 weeks since. **Recommend**: `ibg-s1`'s own test plan should add explicit coverage for `handleGetDashboard`'s route specifically, not just re-test the already-covered handlers, so this class of gap can't recur silently.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security/Audit: no target-user session state persists after exit | ✅ | Live-verified — full identity/data restoration confirmed, no partial state |
| Security: canonical `req.session.accessToken` field usage | ✅ | Automated test, re-run fresh, passing |

---

## Metric Signal

**Impersonation audit completeness (Metric 4)**
Signal: at-risk
Evidence: The banner mechanism itself works correctly where wired, but this live check found it's silently absent on the single most-trafficked page in the app — meaning the accountability guarantee this metric is meant to track ("an admin can always tell they're impersonating") has had a real, unaddressed hole in it since 2026-07-21, ~4 weeks, until caught by this retroactive DoD pass.
Date measured: 2026-08-17

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- [Owner: coding agent, via next `/test-plan` run] `ibg-s1` (2026-08-17-impersonation-banner-dashboard-gap): thread `req.session.impersonation` into `handleGetDashboard`'s `renderShell()` call in `products.js`, matching the existing pattern in `dashboard.js`/`settings.js`. Story already written; needs `/test-plan` → `/definition-of-ready` → dispatch.
- [Owner: Hamish King] Consider whether other `renderShell()` call sites across the 11 route files identified (only 5 of 11 currently reference `impersonation` at all) warrant a broader audit beyond this one confirmed instance — flagged, not scoped into `ibg-s1` itself to keep that fix small and bounded.

---

## DoD Observations

1. **A genuine, live-confirmed AC failure caught only because this backlog DoD pass used a real live check rather than trusting the passing automated suite.** This is exactly the scenario CLAUDE.md's own "verify independently, don't trust self-reports" discipline exists for — except here the "self-report" was a green CI run from 4 weeks ago, not an agent's narration. **`/improve` candidate**: this repo's own DoD Step 4 (test plan coverage check) could be strengthened with an explicit prompt — "for AC claims stated as 'any page' / 'every route' / similarly universal, has the test suite actually exercised more than one representative route, or just one?" — since a single-route test can silently pass while a universal AC claim is violated elsewhere.
2. This is the highest-value finding across the entire 14-story batch in this feature — a real, currently-shipped accountability gap on the most-trafficked page in the app, closed via a properly-scoped follow-up story rather than either ignored or fixed ad-hoc without its own artefact trail.
3. Batch-scope note: same 14-story pass as `a1`–`d4`; see `a1-dod.md` for the general batch-depth agreement with the operator.
