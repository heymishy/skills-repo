# Definition of Done: Make the landing page's learnings counter fail open instead of crashing the server

**PR:** https://github.com/heymishy/skills-repo/pull/688 | **Merged:** 2026-08-08
**Story:** artefacts/2026-08-08-learnings-count-crash-fix/stories/lccf-s1-fail-open-learnings-count.md
**Test plan:** artefacts/2026-08-08-learnings-count-crash-fix/test-plans/lccf-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-08-learnings-count-crash-fix/dor/lccf-s1-dor.md
**Assessed by:** Copilot
**Date:** 2026-08-09

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (fallback instead of throw when file missing) | ✅ | `getLearningsCount_returnsFallback_whenFileMissing` | automated test — `tests/check-lccf-s1-fail-open-learnings-count.js` | None |
| AC2 (require succeeds, placeholder replaced) | ✅ | `publicRoutes_requireSucceeds_whenLearningsFileMissing` | automated test | None |
| AC3 (real count returned when file exists) | ✅ | `getLearningsCount_returnsRealCount_whenFileExists` | automated test | None |
| AC4 (existing lphf-s4 suite unaffected) | ✅ | `tests/check-lphf-s4-self-improving-card.js` — 2/2 passing | automated test re-run | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

---

## Scope Deviations

None. The Dockerfile deploy-artifact question and the long-term data-sourcing redesign were both explicitly out of scope and neither was touched.

One bundled, DoR-addendum-documented addition beyond the story's own file list: `tests/check-p4-enf-second-line.js`'s `T6` timeout was bumped from 15s to 60s in the same commit, since it was directly blocking this active-outage hotfix's own CI. Logged as an addendum in the story file at the time, not a silent scope creep — flagged here for /trace visibility.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4 (confirmed on PR #688 pre-merge and via the merge itself)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| getLearningsCount_returnsFallback_whenFileMissing | ✅ | ✅ | Reproduces the exact production crash locally (confirmed RED before the fix) |
| publicRoutes_requireSucceeds_whenLearningsFileMissing | ✅ | ✅ | |
| getLearningsCount_returnsRealCount_whenFileExists | ✅ | ✅ | Happy-path regression guard |
| lphf-s4 existing suite regression check | ✅ | ✅ | 2/2, unchanged |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Availability (this story's own stated NFR — "this IS the availability fix") | ✅ | wuce-staging confirmed healthy post-merge and post-deploy: `curl /health` → `200 (0.33s)`; `flyctl status` showed the machine `started` on the new deployment. The crash-loop that had been active since PR #686 merged is confirmed resolved. |
| Performance | ✅ (negligible, as stated) | Try/catch adds no measurable overhead; not separately benchmarked, consistent with the story's own NFR statement. |
| Security | N/A (none identified) | No new input handling introduced. |

---

## Metric Signal

No metrics array — short-track story, benefit-metric skipped per this repo's pipeline convention. Not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None outstanding for this story specifically. (The broader script-inefficiency audit this incident triggered produced 3 further short-track stories — `vtp-s1`, `cas-s1`, `mar-s1` — each DoD'd separately below.)

---

## DoD Observations

1. **Real production incident, root-caused and fixed same-day.** `learnings-count.js` (shipped in `lphf-s4`, PR #686) did a synchronous, unguarded `fs.readFileSync` on `workspace/learnings.md` at module-load time. `workspace/` is never copied into the Docker image (confirmed by reading the Dockerfile directly), so this crashed the server on every startup in every deployed environment — a deterministic, 100%-reproducible defect, not a flake. wuce-staging was down for approximately 70 minutes between `lphf-s4`'s merge and this fix's merge. `/improve` candidate: consider whether a pre-deploy smoke check (e.g. a container-boot health check in CI before promoting a staging deploy) would have caught this before it reached the running environment, rather than being discovered by an operator noticing the service was down.
2. **Bundled a pre-existing, unrelated CI flake fix into an urgent hotfix's own commit** (the `check-p4-enf-second-line.js` timeout bump) because it was blocking this PR's merge. Correctly documented as an addendum rather than silently expanding scope, and the root cause was investigated properly (not just timeout-bumped blindly) rather than assumed fixed — later confirmed genuinely root-caused and properly fixed in `vtp-s1`.
3. **GitHub's `refs/pull/N/merge` cached ref does not auto-refresh on a direct push to master** — this caused two consecutive false "still failing" traceability-check results on this same PR before the actual mechanism was understood and worked around (merging master into the PR branch to force a fresh computation). `/improve` candidate: document this as a known gotcha in this repo's own CI-troubleshooting notes, since it will recur for any future PR that depends on a same-day master bookkeeping fix.
