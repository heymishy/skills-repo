# Definition of Done: Fix missing CSRF token on dashboard "Run a skill" start forms

**PR:** https://github.com/heymishy/skills-repo/pull/1017 | **Merged:** 2026-10-24
**Story:** artefacts/2026-10-24-dashboard-skill-start-csrf/stories/dssc-s1-fix-missing-csrf-on-dashboard-skill-start-forms.md
**Test plan:** artefacts/2026-10-24-dashboard-skill-start-csrf/test-plans/dssc-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-24-dashboard-skill-start-csrf/dor/dssc-s1-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-24

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `renderDashboard_embedsCsrfField_inEachSkillStartForm`, `handleDashboard_rendersRealCsrfToken_matchingSession` — both passing in PR #1017 CI | `unit` | None |
| AC2 | ✅ | `handleGetDashboard_rendersRealCsrfToken_matchingSession`, `handleGetDashboard_rendersRealCsrfToken_onZeroProductsOnboardingBranch` passing in CI; additionally `live-verified` — real GitHub-authenticated click-through on `wuce-staging.fly.dev/dashboard` (this is the actual `DATABASE_URL`-set / `handleGetDashboard` path) landed on a real skill session (`/skills/discovery/sessions/<id>/chat`), no 403 | `live-verified` | None |
| AC3 | ✅ | `gateAdvance_skillStartForm_withCorrectCsrfToken_passesGuardAndReachesHandler` (real, unmocked `csrf.generateCsrfToken`/`csrfGuard`), 2026-10-24; corroborated by the same live staging click-through above (form submission reached the real handler, no 403) | `live-verified` | None |
| AC4 | ✅ | PR #1017 CI check "Lint, typecheck, test, build" — SUCCESS; all 7 pre-existing dashboard test files (`check-dsa-s2-dashboard-wiring.js`, `check-dsa-s2-product-dashboard-wiring.js`, `check-dsa-s2-pending-actions-mapping.js`, `check-npwe-s1-skills-nav-wiring.js`, `check-wuce18-html-shell.js`, `check-wuce23-skill-launcher-landing.js`, `check-d2-banner-exit-permission-visibility.js`) unchanged in substance | `integration-real-code` | None |
| AC5 | ✅ | PR #1017 CI full suite SUCCESS pre-merge. Post-merge staging deploy's `Staging smoke test (@mocked)` job initially failed on an unrelated route (`/admin/credits`, 502 — pre-existing `bri-s3.3` flake, confirmed untouched by this diff via `gh pr view 1017 --json files`); re-run (`gh run rerun 40063540546 --job 120782142364`) passed clean (job 120783583033, SUCCESS) | `live-verified` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

---

## Scope Deviations

None. Confirmed via `gh pr view 1017 --json files`: the 4 code/test files touched were exactly `src/web-ui/routes/dashboard.js`, `src/web-ui/routes/products.js`, `src/web-ui/views/dashboard-view.js`, and `tests/check-dssc-s1-dashboard-csrf-fix.js` — matching the DoR contract exactly. `src/web-ui/middleware/csrf.js` was not touched (confirmed out-of-scope item respected). No other form in the codebase was touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| `renderDashboard_embedsCsrfField_inEachSkillStartForm` | ✅ | ✅ | |
| `handleDashboard_rendersRealCsrfToken_matchingSession` | ✅ | ✅ | |
| `handleGetDashboard_rendersRealCsrfToken_matchingSession` | ✅ | ✅ | |
| `handleGetDashboard_rendersRealCsrfToken_onZeroProductsOnboardingBranch` | ✅ | ✅ | |
| `gateAdvance_skillStartForm_withCorrectCsrfToken_passesGuardAndReachesHandler` | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (negligible — one additional idempotent `generateCsrfToken` call per render) | ✅ | Code review; matches an existing, already-used call pattern on the same request path (impersonation banner) |
| Security (this is itself a security-relevant fix — CSRF protection was inert, not weakened) | ✅ | Real, unmocked `csrfGuard` integration test + live staging verification confirms the guard now both rejects forged/missing tokens (unchanged) and accepts correctly-rendered ones (newly fixed) |
| Accessibility (not applicable — hidden input only) | ✅ N/A | No visible/interactive change |
| Audit (not applicable — no new audit requirement) | ✅ N/A | `csdl-s1`'s existing diagnostic logging will show `match: true` for this form going forward; confirmed indirectly by the absence of any `csrf_guard_check` mismatch during live verification |

---

## Metric Signal

No formal metric artefact — short-track story, benefit linkage recorded as "Direct bug-fix enabler" per the story's own Benefit Linkage section. No `metrics[]` entries in `pipeline-state.json` reference `dssc-s1` as a `contributingStories` member.

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| N/A | N/A | N/A | Short-track bug fix — no formal benefit-metric artefact, consistent with `csdl-s1`/`jgcc-s1` precedent |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None required by this story. (Pre-existing, separately tracked: `csdl-s1`'s own required follow-up to remove/reduce its temporary diagnostic logging once a mismatch mechanism was confirmed — out of scope for this story, unaffected by this DoD.)

---

## DoD Observations

1. This story's own live verification (AC2/AC3) also closes out the original discovery that motivated `css-s1`: the dashboard's "Start →" button was the actual blocker preventing any web-UI journey from reaching the gate-advance-sync precondition `css-s1` built. Both the sync mechanism (`css-s1`, PR #1016) and this access-blocking bug (`dssc-s1`, PR #1017) are now confirmed working together live on staging — a user can now click "Start →" from the dashboard, and any resulting CLI-side gate advance will reflect back onto the correct web-UI journey.
2. The post-merge `Staging smoke test (@mocked)` failure on `/admin/credits` (`bri-s3.3`'s own recurring flake) is now reconfirmed a second time in this session as flaky, not a real regression — consistent with the prior occurrence noted earlier in this session's `workspace/state.json` pendingActions. Candidate `/improve` signal: this flake has now recurred across multiple unrelated PRs; worth a dedicated investigation/fix rather than continuing to re-run around it.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Fix missing CSRF token on dashboard "Run a skill" start forms (dssc-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
