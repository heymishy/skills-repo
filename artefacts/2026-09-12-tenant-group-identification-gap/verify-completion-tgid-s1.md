# Verify Completion: Wire identifyTenantGroup() into the real session-bootstrap path (tgid-s1)

**Story:** artefacts/2026-09-12-tenant-group-identification-gap/stories/tgid-s1-wire-identify-tenant-group-into-session-bootstrap.md

---

## AC verification

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | ✅ | U1/U5: `identifyTenantGroup` called exactly once with the exact `req.session.tenantId` on a fresh session |
| AC2 | ✅ | U2: a second `bootstrapFlags` call within the same session does not re-call `identifyTenantGroup` |
| AC3 | ✅ | U3: no `tenantId` on session means `identifyTenantGroup` is never called |
| AC4 | ✅ | U4/N1: a hanging `identifyTenantGroup` is bounded by the same timeout wrapper as flag resolution; flag resolution still completes correctly despite the stuck call |

**New test file:** `tests/check-tgid-s1-wire-identify-tenant-group.js` — 6/6 passing.

## Regression check

- `tests/check-bri-s1.3-server-side-bootstrap.js` (the sibling story whose function this modifies): 10/10 passing, unmodified.
- `tests/check-bri-s1.4-tenant-level-targeting.js` (identifyTenantGroup's own defining story): 11/11 passing, unmodified.
- No other test file references `flag-bootstrap.js` or `bootstrapFlags`.

## Full suite

`NODE_ENV=test npm test`: 643 files run, 4 failed. 3 match the established baseline (`check-bjs-s1-billing-journey-staging-safe.js`, `check-p3.5-validate-trace.js`, `check-s6.1-cache-scope-session-threading.js`). The 4th, `check-pcr-s1-test-runner.js`, is a pure test-runner-overhead timing budget check (N1-perf-per-file-average-within-110pct) — confirmed unrelated to this story's change (zero references to `flag-bootstrap`/`posthog-flags`/`identifyTenantGroup` anywhere in that test or the runner script it checks) and confirmed to fail identically on unmodified master (`904c3c6b`) at the time of this check, by a similarly small margin (~0.1-2.7% over budget across 3 separate runs) — this is machine-load-dependent flakiness from a long-running session, not a regression introduced by this story.

## Outcome

**COMPLETE.** All 4 ACs verified, zero regressions attributable to this change.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
