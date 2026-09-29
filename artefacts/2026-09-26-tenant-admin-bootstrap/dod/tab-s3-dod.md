# Definition of Done: Retire the legacy admin-bootstrap path

**PR:** https://github.com/heymishy/skills-repo/pull/928 | **Merged:** 2026-09-29T18:32:03Z
**Story:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**Test plan:** artefacts/2026-09-26-tenant-admin-bootstrap/test-plans/tab-s3-test-plan.md
**DoR artefact:** artefacts/2026-09-26-tenant-admin-bootstrap/dor/tab-s3-dor.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification strength | Deviation |
|----|-----------|----------|------------------------|-----------|
| AC1 | ✅ | `server.js`'s legacy wiring/seeding removed; `getUserRole`/`setGetUserRole` removed entirely from `user-roles.js`. `check-tir-s1-person-team-schema.js` T2 (flipped, re-run fresh) confirms absence; `user_roles` table itself left in place, unread/unwritten. | integration-real-code | None |
| AC2 | ✅ | `_backfillOne` and both call sites removed. `check-tab-s3-legacy-removal.js`'s own regression test (re-run fresh): `resolveRoleForTenant` for an unmigrated tenant returns `'user'`, zero `user_roles` queries. | integration-real-code | None |
| AC3 | ✅ | **Live-verified**: `fly secrets list -a wuce-staging` confirmed the secret present pre-removal; `fly secrets unset ADMIN_GITHUB_LOGINS -a wuce-staging` run with explicit operator authorization; `fly secrets list -a wuce-staging` re-confirmed zero matches post-removal. Production (`skills-framework`) checked directly — the secret was never set there at all (confirmed via full `fly secrets list -a skills-framework`), so AC3 required action on one environment, not two. | live-verified (real Fly secret state, not a test) | None |
| AC4 | ✅ | `node scripts/run-all-tests.js` re-run fresh against merged master: 705 files, 2 pre-existing/environmental failures (`check-p3.5-validate-trace.js`, `check-pcr-s1-test-runner.js`) unchanged, 0 new. Every pre-existing test file referencing removed functionality was updated or removed during implementation, not left stale. | integration-real-code | None |
| AC5 | ✅ | `check-tab-s3-legacy-removal.js`'s own grep-for-absence test, re-run fresh against merged master: zero matches for `ADMIN_GITHUB_LOGINS`/`getUserRole`/`setGetUserRole`/`_backfillOne` across `src/web-ui/`. | integration-real-code | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found.

**Evidence-strength note:** AC3 is the one AC in this story claiming a real-world effect (a live Fly secret's actual state) — matching this repo's own DoD evidence-strength rule, it required live verification rather than a test-plan proxy, and got it: real `fly secrets list` output before and after the real `fly secrets unset`, with explicit operator authorization for the action itself (a real, if now-inert, infrastructure change).

---

## Real touchpoints beyond the DoR's own file list

Confirmed and finalized during implementation (full rationale in `decisions.md`): `src/web-ui/config/validate-env.js`'s boot-time warning, `getRoleForTenant`'s own legacy-fallback branch, `migrateTeamSchema`'s legacy-backfill loop, and stale comments in `auth.js`/`require-admin.js`/`client-invitations.js` — all real, necessary consequences of AC1/AC2/AC5's own literal wording (a repo-wide grep is the AC's own spec), not scope creep. 3 additional tests in `check-tir-s1-person-team-schema.js` (beyond the 2 originally planned) were found during implementation to test the exact removed legacy-backfill behaviour and were removed, not just updated.

---

## Scope Deviations

None. PR #928's file list contains only `src/web-ui/` production files directly required by AC1/AC2/AC5, their corresponding test files, and artefact/state bookkeeping.

---

## Test Plan Coverage

**Tests from plan implemented:** 5/5 ACs covered (the plan's own 5-test count doesn't map 1:1 to exactly 5 new test functions — this is a removal story, so most of its "coverage" is pre-existing test files updated to no longer assert on deleted behaviour, plus 2 new tests in `check-tab-s3-legacy-removal.js` for AC5/AC2, matching the plan's own intent).
**Tests passing, re-run fresh against merged master:** `check-tab-s3-legacy-removal.js` 2/2; full suite 705 files, 2 pre-existing/environmental failures unchanged, 0 new.
**Mandatory route/handler E2E check** (`auth.js` touched, comment-only): 2 `@mocked` specs, re-verified at `/verify-completion` — `bri-s3.6-auth-journey.spec.js` 4/4, `bri-s3.3-multi-user-tenant-journey.spec.js` 5/5. Not re-run at DoD time (no code changed since merge; `/verify-completion`'s own fresh evidence stands).

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — N/A | ✅ N/A | Pure removal, no new query path |
| Security — closes a misleading, partially-broken privilege-grant surface | ✅ | `ADMIN_GITHUB_LOGINS` env var, its parsing, and its seeding logic are all removed from both code and live infrastructure (AC3); the `access_token` never appears in the removed code paths (unrelated finding, unaffected) |
| Accessibility — N/A | ✅ N/A | Backend-only |
| Audit — N/A | ✅ N/A | No new write path introduced (only removal) |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable |
|--------|--------------------|-----------------------|
| Manual admin-grant interventions needed (`benefit-metric.md`) | ✅ — "effectively required for every tenant today" (pre-`tab-s1`) | **on-track** — the only lever that ever required manual intervention (the `ADMIN_GITHUB_LOGINS` allowlist) is now fully retired from both code and live infrastructure; all real admin assignment flows through `tab-s1`'s automatic login-time grant or `tab-s2`'s backfill, neither of which requires manual intervention |

**Evidence note:** this metric closes the loop this whole feature (`tenant-admin-bootstrap`) exists to close — `tab-s1` (automatic grant), `tab-s2` (backfill for pre-existing tenants), `tab-s3` (retire the manual lever) are all now merged, DoD-complete, and live-verified.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Same open observation as `tab-s1`/`tab-s2`'s own DoDs: `m1`/`m2`/`m3`'s `contributingStories` arrays in `pipeline-state.json` still don't list any of this feature's 3 stories despite direct benefit-metric attribution — a feature-level bookkeeping gap, not fixed here (see `tab-s1-dod.md` DoD Observation 1).
2. `/improve` candidate (logged in `decisions.md`/`capture-log.md`): for any future story whose AC names a repo-wide grep as its own acceptance criterion, run that grep (or its logical equivalent) at implementation-plan time, not just at final verification — would have caught this story's full real touchpoint list up front rather than iteratively.
3. With all 3 stories in `real-admin-bootstrap` now DoD-complete, the epic itself is done — no further stories remain in this feature.

---

## DoD Observations

1. **This closes the `2026-09-26-tenant-admin-bootstrap` feature.** All 3 stories (`tab-s1`, `tab-s2`, `tab-s3`) are now merged, DoD-complete, and live-verified where the ACs required it (`tab-s1`'s Sonnet-routing-adjacent verification was separately confirmed in a related feature; `tab-s2`'s migration ran live on both real environments; `tab-s3`'s secret removal ran live on the one environment that actually had it set). The feature-level `pipeline-state.json` `status` should be reviewed for a final `stage`/`health` rollup now that all 3 stories are done.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for tab-s3 (legacy admin-bootstrap path retirement, closing the whole tenant-admin-bootstrap feature).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is AC3's live Fly-secret evidence directly traceable to real before/after `fly secrets list` output, not just a script's own self-report?
3. Are the real touchpoints found beyond the DoR's own file list (validate-env.js, require-admin.js, client-invitations.js, the 3 extra tir-s1 test removals) adequately explained as necessary consequences of AC1/AC2/AC5, not undisclosed scope creep?
4. Now that all 3 stories in this feature are DoD-complete, should pipeline-state.json's feature-level status/stage be updated to reflect the whole feature is done?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
