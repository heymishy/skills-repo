# Definition of Done: Lazily refresh a tenant's local repo checkout on active web UI access

**PR:** https://github.com/heymishy/skills-repo/pull/878 | **Merged:** 2026-09-13T08:48:54Z
**Merge commit:** 587cf183b0994b77f35f4cd77c84cc5f03cd0746
**Story:** artefacts/2026-09-13-repo-checkout-lazy-refresh/stories/rclr-s1-lazy-git-pull-on-active-session.md
**Test plan:** artefacts/2026-09-13-repo-checkout-lazy-refresh/test-plans/rclr-s1-test-plan.md
**DoR:** artefacts/2026-09-13-repo-checkout-lazy-refresh/dor/rclr-s1-dor.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `ensureRepoFresh(repoRoot)` with no prior recorded attempt runs `exec('git pull --ff-only', {cwd: repoRoot, ...})` — T1, re-run fresh against merged master | Automated behavioural test (`unit`) | None |
| AC2 | ✅ | A second call for the same `repoRoot` within `ttlMs` does not call `exec` again (T2); a call after `ttlMs` has elapsed does call `exec` again (T3) | Automated behavioural test (`unit`) | None |
| AC3 | ✅ | An `exec` that throws is caught and returned as `{pulled: false, reason: 'pull-failed', error: ...}`, never thrown to the caller — T4 | Automated behavioural test (`unit`) | None |
| AC4 | ✅ | The exact command executed is `git pull --ff-only` — never `rebase` or `reset` — T5 | Automated behavioural test (`unit`) | None |
| AC5 | ✅ | Refreshing `repoRoot` A does not affect the TTL state for a different `repoRoot` B — both trigger independently — T6 | Automated behavioural test (`unit`) | None |
| AC6 | ✅ | `_readPipelineFeatures(root)` calls `ensureRepoFresh` before reading `pipeline-state.json` from disk (T7); when `ensureRepoFresh` throws, the file read still proceeds and returns real contents (T8) | Automated integration test (require-cache monkey-patch of `repo-freshness.js`) | None |

**All 6 ACs satisfied.** 8/8 new tests (`tests/check-rclr-s1-repo-freshness.js`) re-run fresh against merged master (commit `587cf183`), 0 failures.

**Verification strength:** 6 unit/integration, 0 live-verified, 0 production-observed. This story's core claim — "a feature created via CLI/git becomes visible in the live web app within the TTL window, without a redeploy" — has NOT yet been live-verified against the real `skills-framework.fly.dev` production app, since production deploys still require the operator's own manual approval gate (`bri-s2.6`) and this fix has not yet been promoted there. Recorded as a Follow-up Action below rather than silently treated as fully proven end-to-end.

---

## Scope Deviations

None. The merged diff (`src/web-ui/adapters/repo-freshness.js` — new module, `src/web-ui/routes/journey.js` — a `require` line plus a wrapped call at the top of `_readPipelineFeatures`, `tests/check-rclr-s1-repo-freshness.js`, 3 new artefacts, `.github/pipeline-state.json`) maps directly to the story. `getRepoRoot`'s own resolution logic and `skills.js`'s existing git add/commit flow were left untouched exactly as scoped. No background poller, timer, or cron was introduced.

---

## Test Plan Coverage

**Tests passing:** 8/8 new, re-run fresh 2026-09-14 against merged master (commit `587cf183`) — `tests/check-rclr-s1-repo-freshness.js`.

**Regression coverage:** Six existing `journey.js`-touching test suites re-run directly and confirmed passing before merge (`check-ep1-s1-journey-feature-merge.js`, `check-ep1-s3-journey-backfill.js`, `check-sob-s2-journey-dashboard-integration.js`, `check-jcn-s1-journey-page-nav-products.js`, `check-p0.1-journey-access.js`, `check-p0.2-journey-guard-wiring.js`) — no existing test asserts on `_readPipelineFeatures`'s internals beyond its return value, confirmed empirically rather than just assumed per the test plan's own regression note.

**Gaps:** None against the story's own ACs.

**Full regression suite (post-merge, fresh on master):** 652 files run, 2 failed on first pass — `tests/check-p3.5-validate-trace.js` (pre-existing documented resource-contention flake) and `tests/check-cat-s1-core-trace-builder.js`. The second failure was re-run in isolation and passed 26/26 with zero changes, confirming it as a full-suite resource-contention flake rather than a regression introduced by this story — consistent with this session's established baseline pattern of intermittent single-file flakes under full-suite load. No new regressions.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | TTL check is a plain in-memory object lookup; only a stale `repoRoot` triggers an actual `git pull`, bounded by a 5-second process timeout (`exec(..., {timeout: 5000})`) and a 2-minute default TTL |
| Security | ✅ | No new external input surface — `repoRoot` is always server-resolved via `getRepoRoot`/`_repoRoot`, never taken directly from request data |
| Availability | ✅ | AC3 and AC6 together guarantee `/journey` and `/dashboard` still render from whatever is currently on disk even when the refresh fails or throws — verified by T4 and T8 |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track feature (per the story's own Benefit Linkage field). Directly closes a gap the operator found first-hand this session: a discovery artefact pushed to GitHub did not appear anywhere in the live web app, traced to the server's local checkout never being told to `git pull`.

---

## Outcome

**COMPLETE**

No deviations, no test gaps, no NFR gaps.

---

## DoD Observations

1. **Follow-up Action — not yet live-verified end-to-end against the real production app.** This fix is merged to master and will deploy automatically to `wuce-staging`, but `skills-framework.fly.dev` (production) still requires the operator's manual approval per `bri-s2.6`'s environment-protection gate. Once that approval happens, the next time the operator creates or advances a feature via CLI/git and then visits `/journey` or `/dashboard` in the live production app, confirm the feature appears within the 2-minute TTL window without needing a fresh deploy — closing the loop this story was written to fix.
2. **This story does not, by itself, make the `2026-09-13-analytics-observability-gaps` discovery feature visible in the live production app today** — that still additionally requires a production deploy to be approved (this fix ships in the same deploy). The underlying discovery artefact remains in "Draft — awaiting approval" status, unaffected by this story.
