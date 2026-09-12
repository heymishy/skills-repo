# Definition of Done: Wire identifyTenantGroup() into the real session-bootstrap path (tgid-s1)

**PR:** https://github.com/heymishy/skills-repo/pull/866 | **Merged:** 2026-09-12 (merge commit `17eaa03a652ca85a0789099bd0d2aca9a4c4a850`)
**Story:** artefacts/2026-09-12-tenant-group-identification-gap/stories/tgid-s1-wire-identify-tenant-group-into-session-bootstrap.md
**Test plan:** artefacts/2026-09-12-tenant-group-identification-gap/test-plans/tgid-s1-test-plan.md
**DoR:** artefacts/2026-09-12-tenant-group-identification-gap/dor/tgid-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-tgid-s1-wire-identify-tenant-group.js` U1/U5: `identifyTenantGroup` called exactly once with the exact `req.session.tenantId`, no transformation. Re-run fresh on merged master: 6/6 passing. | Unit test, re-run post-merge | None |
| AC2 | ✅ | U2: a second `bootstrapFlags` call within the same session does not re-call `identifyTenantGroup` — matches the existing flag-cache's own once-per-session contract exactly. | Unit test, re-run post-merge | None |
| AC3 | ✅ | U3: no `req.session.tenantId` means `identifyTenantGroup` is never called — no wasted call, no error. | Unit test, re-run post-merge | None |
| AC4 | ✅ | U4/N1: a hanging `identifyTenantGroup` is bounded by the same `_withTimeout` wrapper already used for flag resolution; flag resolution still completes correctly and the overall call stays within budget even with both calls slow simultaneously. | Unit test, re-run post-merge | None |

**Full re-run on merged master:** `tests/check-tgid-s1-wire-identify-tenant-group.js` — 6/6 passing.

---

## Scope Deviations

None. Confirmed via `gh pr view 866 --json files`: the merged diff touches exactly `src/web-ui/modules/flag-bootstrap.js` (the `bootstrapFlags` completion block named in the story), the new test file, and artefacts/pipeline-state.json bookkeeping. `posthog-flags.js` (where `identifyTenantGroup` and `isEnabled` themselves live) is untouched, matching the story's own Out of Scope declaration.

---

## Test Plan Coverage

**Tests from plan implemented:** 6/6
**Tests passing on merged master:** 6/6 (own suite)

**Regression suites re-run fresh on merged master:**
- `tests/check-bri-s1.3-server-side-bootstrap.js` (the sibling story whose own function this modifies): 10/10 passing, unmodified.
- `tests/check-bri-s1.4-tenant-level-targeting.js` (`identifyTenantGroup`'s own defining story): 11/11 passing, unmodified.

**Gaps:** None against the story's own scope.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | Bounded by the exact same `_withTimeout` wrapper (default 200ms) already used for flag resolution — confirmed via N1: total bootstrap time stays within budget even when both `isEnabled` and `identifyTenantGroup` are simultaneously slow |
| Security | ✅ | `tenantId` sourced exclusively from `req.session.tenantId` — no new client-supplied input path introduced; unchanged from `bri-s1.4`'s own guarantee (this story adds a call site, not a new data path) |
| Accessibility | ✅ N/A | Backend-only session-bootstrap logic |
| Audit | ✅ N/A | No new audit surface — `identifyTenantGroup` already had its own non-throwing failure handling from `bri-s1.4` |

---

## Metric Signal

No formal benefit-metric artefact exists for this story — short-track gap-closure fix, per the story's own Benefit Linkage section. The stated benefit (PostHog's dashboard can now show tenants as real Groups, not just correctly-targeted-but-invisible) is a direct, mechanical consequence of the call now firing on every real session bootstrap with a tenant present — no separate measurement needed beyond confirming the call happens, which AC1's test directly proves.

---

## Outcome

**COMPLETE**

No deviations, no test gaps. Closes a real, honestly self-disclosed gap from `bri-s1.4`'s own DoD (2026-07-09) — `identifyTenantGroup()` was fully built and unit-tested but never actually called from any live request path. Found via a full pipeline-state audit on 2026-09-12, not a new investigation from scratch.

**Live-verified against real `wuce-staging` AND real PostHog, 2026-09-13 (full, operator-requested):** authenticated via real GitHub OAuth and requested `GET /journey/wizard` — the real route that calls `bootstrapFlags()` → `identifyTenantGroup(tenantId)`. Returned a clean 200 with real rendered content, confirming the code path executes in production without crashing.

`identifyTenantGroup()` is deliberately silent on both success and failure (bri-s1.4 AC3: never crash the caller), so confirming PostHog's actual receipt required checking PostHog directly rather than server logs. The operator checked PostHog's own dashboard (**Activity → Events**, filtered to the `$groupidentify` event, "Filter out internal and test users" left on): a real `Group identify` event exists for person `$tenant_heymishy` — the exact shape `adapter.groupIdentify('tenant', 'heymishy')` produces, where `heymishy` is this session's real `tenantId` (`req.session.tenantId = user.login` — `auth.js:330`, since `TENANT_ORG_ALLOWLIST` is unconfigured on this repo, so each GitHub user is their own tenant). **This is definitive, real-world confirmation that the analytics side-effect genuinely happened**, not just that the code path executed without error.

**Separate, real finding, not a code defect — a subscription/plan limitation:** PostHog's **Groups** dashboard view (`/groups`) is gated behind a paid "Group Analytics" addon this project is not subscribed to ("Subscribe to the Group analytics addon to use this feature"). This does not block data capture — `$groupidentify` events are ingested as ordinary events regardless of the addon, confirmed by finding it in the plain Events view — but it does mean nobody can currently see a populated Groups dashboard, browse tenants as groups, or build group-scoped insights, which was part of the original motivation `bri-s1.4`'s `decisions.md` gave for adopting Group Analytics in the first place. The mechanism works; the intended consumption surface is currently unavailable without a plan upgrade. Recorded here for the operator's own awareness/budget decision, not something to fix in code.

**Follow-up actions:** None required for this story's own scope — fully verified end-to-end. Operator awareness item: decide whether to subscribe to PostHog's Group Analytics addon to actually use the now-confirmed-working tenant group data (dashboards, group-scoped insights) — otherwise the data is captured but has no first-party UI to view it in.

---

## DoD Observations

1. **This is the smallest, most mechanical item in a 12-item backlog of real scope gaps surfaced by a 2026-09-12 pipeline-state audit** (`workspace/state.json` pendingActions, "DECISION NEEDED -- 12 DoD gaps that are real, still-open code/scope gaps"). Unlike most items in that audit, this one required zero new architecture or design decision — the function to call, its exact contract, and the one real call site to wire it into were all already fully specified and tested by `bri-s1.4`/`bri-s1.3` respectively. The entire fix was 4 lines of logic plus a require.
2. Full suite re-run on this story's own branch surfaced one unrelated, pre-existing timing-budget flake (`check-pcr-s1-test-runner.js`, N1-perf-per-file-average-within-110pct) — confirmed via a direct side-by-side run on unmodified master that it fails identically there too (machine-load-dependent, not a regression from this change). Not re-tracked in `known-baseline-failures.json` as part of this story, since doing so is out of this story's own scope — flagged here for visibility only.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Wire identifyTenantGroup() into the real session-bootstrap path" (tgid-s1).
Check:
1. Is the AC coverage evidence concrete (test names, not just "should work")?
2. Is the scope deviation check (git diff file list) actually verified, not assumed?
3. Is the outcome verdict (COMPLETE) consistent with the AC and deviation rows?
```
