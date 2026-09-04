# DoR Contract: Staging deploy workflow skips bookkeeping-only pushes to master

**Story reference:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/stories/sdsb-s1-skip-staging-deploy-for-bookkeeping-only-pushes.md
**Test plan:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/test-plans/sdsb-s1-test-plan.md
**Date:** 2026-09-04

---

## Scope

**MUST touch:**
- `.github/workflows/staging-deploy.yml` (`on.push` block only -- add `paths-ignore`, leave `branches` and every job untouched)
- `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` (new)

**MUST NOT touch:**
- Any job body (`deploy-staging`, `smoke-test`, `post-deploy-e2e-confirm`, `promote-to-prod`) -- confirmed zero test assertions in this story's own new test file, and zero ACs reference job-body behaviour.
- `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`, `tests/check-bri-s2.6-smoke-test-promote-gate.js` -- these are regression guards (AC4/AC5), asserted to pass UNMODIFIED, not edited.
- `scripts/check-no-prod-deploy-on-push.js` -- statically verifies the `--app wuce-staging` string inside the `Deploy to wuce-staging` step; unrelated to the `on:` trigger block, confirmed by reading the script before finalizing this contract (it only greps job step content, not the `on:` block).
- `fly.toml`, `Dockerfile`, `.dockerignore`, `scripts/deploy-staging.js`, `scripts/seed-staging.js`.

## Assumptions verified before sign-off

1. **`paths-ignore` is the correct GitHub Actions mechanism, not a job-level `if:` path check.** Confirmed via GitHub Actions' own documented trigger-filtering behaviour: a `paths-ignore` list on `push` causes the ENTIRE workflow run to be skipped (not just individual jobs) when every changed file in the push matches the ignore list -- this is what AC2 needs (no run at all, not a run with all jobs skipped, which would still consume a run slot and could still surface in Actions history as noise). A job-level `if:` conditional approach was considered and rejected: it would still create a workflow run (visible, still consumes minutes for the trigger/checkout steps that ran before the `if:` check), which only partially addresses the problem.
2. **No existing governance test asserts the `on.push` block has no further keys beyond `branches`.** Confirmed by reading `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` T3 in full (lines ~135-145): its regex only checks that `push:` is immediately followed by `branches:` (with `master`), and separately that no `pull_request:` trigger exists. It does not anchor to end-of-block, so a `paths-ignore:` line added after the `branches:` list does not break this regex.
3. **`tests/check-bri-s2.6-smoke-test-promote-gate.js` asserts only job-body content** (the `smoke-test` job has no `continue-on-error`/error-tolerance flag) -- confirmed by reading the file; nothing in it inspects the `on:` block, so this story's change cannot affect it.
4. **The three ignored paths exactly match CLAUDE.md's own already-established bookkeeping-exemption list** (`workspace/**`, `artefacts/**`, `.github/pipeline-state.json`) -- no new path-scoping judgment call being made here, just applying an existing, already-agreed boundary to a second gate (CI trigger) that currently doesn't honor it.

## Risk

**Rating: 2** (some ambiguity: GitHub-native trigger-skip behaviour cannot be locally tested, only statically asserted + confirmed by real-world observation post-merge; the underlying mechanism itself is well-documented and low-risk).

**RISK-ACCEPT:** AC2/AC3 (the actual skip-vs-run behaviour) cannot be verified by an automated test in this environment -- accepted via the manual verification script (T5), consistent with CLAUDE.md's B2 precedent for CSS-layout-dependent ACs applied here to a GitHub-native-behaviour-dependent AC. Logged in this feature's own `decisions.md`.

## Coding Agent Instructions

1. Add a `paths-ignore` list to `staging-deploy.yml`'s `on.push` block, directly after the existing `branches:` list, containing exactly the three paths named in AC1.
2. Write `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` covering T1/T2.
3. Run `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` and `tests/check-bri-s2.6-smoke-test-promote-gate.js` directly to confirm they still pass unmodified (T3/T4).
4. Run the full suite (`npm test`) before considering the task complete -- this session's own established, now-standing practice (five prior occurrences of a full-suite run catching an unanticipated regression) applies here too, even though this change touches no application code.
5. TDD RED-state verification: stash the `staging-deploy.yml` change only, re-run the new test file, confirm T1 fails against the pre-fix (no `paths-ignore`) file, then restore.

## Proceed: Yes
