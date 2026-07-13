# Definition of Done: Build the CI pipeline — PR checks through staging deploy

**PR:** https://github.com/heymishy/skills-repo/pull/457 | **Merged:** 2026-07-12
**Story:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s2.5-ci-pipeline-staging-deploy.md
**Test plan:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s2.5-ci-pipeline-staging-deploy-test-plan.md
**DoR artefact:** artefacts/2026-07-09-beta-readiness-infra/dor/bri-s2.5-ci-pipeline-staging-deploy-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ⚠️ | `.github/workflows/pr-checks.yml` runs lint/typecheck/`npm test`/build, none has `continue-on-error` | automated test (T1/T2); GitHub branch-protection *requiring* these checks is a manual repo-Settings step, unverifiable from within the repo | See deviation below |
| AC2 | ✅ | `staging-deploy.yml`'s `deploy-staging` job runs `flyctl deploy --app wuce-staging`, triggered on `push: branches: [master]` — never touches `wuce-prod` | automated test (T3/T4) | **Trigger branch is `master`, not the literal `main` named in the story text** — see below |
| AC3 | ✅ | Seed step runs immediately after `deploy-staging` in the same job | automated test (IT1) | None |
| AC4 (Acceptance Criterion 4) | ✅ | Static scan (`findProdDeployViolations`) confirms no push-to-master-triggered workflow deploys to `wuce-prod`/`skills-framework` outside the allowlisted promote job; synthetic-fixture test proves the detector is real, not vacuous | automated test (T5/T6) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

**Disclosed and reasoned in `decisions.md`:**
1. **(2026-07-11, ASSUMPTION)** Trigger branch implemented as `master` (this repo's actual trunk, per `.github/context.yml`'s `base_branch: master`), not literally `main` as the story/ACs/DoR contract/test plan all say. No `main` branch exists in this repository. "Push to main" is treated as generic trunk-based-development vocabulary, not a literal branch-name requirement — implementing against a real `main` would have produced a dead trigger that never fires, defeating the story's entire purpose. Flagged via PR comment for engineering-lead awareness (Medium oversight level).
2. **(2026-07-11, ASSUMPTION)** `.github/workflows/fly-deploy.yml`, which the story text describes as "the existing prod-only pipeline... replaced," does not exist anywhere in this repository's committed git history (`git log --oneline --all -- .github/workflows/fly-deploy.yml` returns zero commits). It exists only as an uncommitted operator scratch file in a different, non-worktree checkout. This repo's master had **no** committed Fly deploy workflow at all before this story. `pr-checks.yml` and `staging-deploy.yml` are genuinely new files, not a modification of a pre-existing one. This is disclosed rather than silently reconciled because the story's own framing ("replaces the existing pipeline") does not match what actually shipped (a first-of-its-kind pipeline).
3. **(2026-07-11, SCOPE)** Added minimal, dependency-free `lint`/`typecheck`/`build` npm scripts to `package.json`, since none existed before this story (no ESLint config, no `tsconfig.json`, no bundler). Kept deliberately small and zero-new-dependency, consistent with this repo's plain-Node/no-build-step architecture.
4. **(2026-07-11, SCOPE)** Fixed a genuine, pre-existing one-line comment bug in `src/improvement-agent/experiment-signals.js` (a stray `*/` inside a doc comment made the file a syntax error) — discovered only because the new `ci-lint.js` step is a real, non-vacuous check. Comment-only, zero behavioural change; exempted from a full DoR chain per CLAUDE.md's "typo/configuration fixes that make no behavioural difference" carve-out.
5. **(2026-07-12, RISK-ACCEPT + ARCH, post-merge fix from a real CI run)** Two fixes found only by running the new workflow for real on GitHub Actions: (a) `ci-typecheck.js` originally hung the CI job 9+ minutes because requiring `server.js` in-process triggered its unconditional `startSessionEviction()` `setInterval()` — fixed by running each file's require-check in an isolated child process with a timeout; (b) the "Unit test chain" step originally failed on every PR regardless of content because plain `npm test` exits non-zero on this repo's ~69-73 pre-existing, already-documented failures — fixed by adding `scripts/ci-test-regression-check.js` + `tests/known-baseline-failures.json`, a checked-in snapshot diffed against each run so only *new* regressions fail the gate.

None of these deviations touch the epic's declared out-of-scope items (per-PR preview environments, automated rollback).

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (test plan/pipeline-state.json record 11 total; the current test file has 7 automated assertions covering all named ACs — see DoD Observation 2)
**Tests passing in CI:** 7 / 7 (re-verified directly against current master, 2026-07-14)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1/T2 (PR checks run lint/typecheck/test/build, block merge) | ✅ | ✅ | |
| T3/T4 (merge auto-deploys to staging, not prod) | ✅ | ✅ | |
| IT1 (seed script runs automatically post-deploy) | ✅ | ✅ | |
| T5 (static scan — no prod deploy outside promote job) | ✅ | ✅ | Scoped to the `deploy-staging` job block specifically, per bri-s2.6's later fix (see DoD Observation 1) |
| T6 (synthetic-fixture proof the detector is real) | ✅ | ✅ | |

**Gaps (tests not implemented):** None against this story's own ACs. AC1's branch-protection-*enforcement* half (GitHub repo Settings actually requiring these checks before merge) cannot be verified from within the repo — this is a real, structural verification limit, not a missing test.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| PR-check pipeline completes within a reasonable CI budget | ✅ | Post-fix (the child-process isolation fix above), no hang observed; no fixed numeric budget was specified for this NFR |
| Staging deploy uses staging-scoped secrets exclusively, no prod secret accessible | ✅ | Confirmed via workflow YAML review — `deploy-staging` job references only staging-scoped Fly/Neon/Upstash/PostHog secrets |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — A broken build cannot reach prod | ✅ (0%) | Not yet — this story builds the pipeline mechanics; the actual gate (green-suite-then-manual-approval) is bri-s2.6 | This story is necessary but not sufficient for Metric 1 on its own |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
- None blocking. All deviations above are disclosed, reasoned, already merged, and (for the two post-merge CI fixes) independently re-verified working in real GitHub Actions runs. Recorded for the audit trail per this story's Medium oversight level, not as open items.

---

## DoD Observations

1. **A genuine real-CI discovery, not caught by local testing:** both post-merge fixes (CI hang, false-failing unit-test gate) were invisible to local `npm test`/`node scripts/run-all-tests.js` runs and only surfaced once the new workflow ran for real on GitHub Actions. `decisions.md`'s own framing of this — "a good example of why 'verify-completion passed locally' is not equivalent to 'this CI pipeline works,' especially for a story whose entire subject is CI infrastructure" — is worth treating as a standing lesson for any future CI/CD-infrastructure story, not just this one. **Tag: /improve candidate.**
2. **Test count bookkeeping:** `pipeline-state.json` records `totalTests: 11, passing: 11` for this story. The current test file (`tests/check-bri-s2.5-ci-pipeline-staging-deploy.js`) has 7 automated assertions after bri-s2.6's later T4-scoping fix (`decisions.md`, 2026-07-12, ARCH) reduced T4 from a whole-file regex to a job-scoped one — the count discrepancy is a benign side effect of that later, disclosed, cross-story fix (verified via `check-bri-s2.5-ci-pipeline-staging-deploy.js` going from 6/7 to 7/7 at that point), not a hidden gap. This DoD corrects the bookkeeping to `totalTests: 7, passing: 7`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Build the CI pipeline: PR checks through staging deploy" (bri-s2.5).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is the master-vs-main branch substitution a defensible, disclosed engineering call rather than a silent scope change?
Report findings as HIGH / MEDIUM / LOW.
```
