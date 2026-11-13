# Test Plan: GitHub issue opened by PostHog for each new production error issue (native destination)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Review reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s6-review-4.md (PASS, run 4)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-13
**Test runner (read from `package.json`):** `npm test` runs `node scripts/run-all-tests.js`, discovering `tests/check-*.js`. This story ships no code, so it adds no file to that suite and changes nothing the suite runs. Its checks are live reads and actions against PostHog and GitHub, plus one repository diff check, all written as the verification script. The only automated check is the existing `node scripts/check-pipeline-state-integrity.js`, which must keep its single known baseline failure (`tfhc-s1`) and gain none.

---

## Why there are no coded tests

Every behaviour this story delivers happens inside PostHog or GitHub: the alert's stored configuration, the issue PostHog opens, and PostHog's own duplicate handling. A coded test would only prove a mock of those services, which is the failure the mock-shape rule exists to prevent. The evidence is therefore live: each check below reads real PostHog or GitHub state and records what it saw. Strength tags follow the DoD scale (unit, integration-real-code, live-verified, production-observed).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual (live) | Gap type | Risk |
|----|-------------|------|-------------|-----|---------------|----------|------|
| AC1 | GitHub integration present, reaches only the single target repo, issue write only | — | — | — | 1 check (T1) | External-service state | 🟡 half is an operator statement |
| AC2 | Alert stored with trigger "issue created" only, filter `environment = production`, `template-github`, correct repo, enabled | — | — | — | 1 check (T2) | External-service state | 🟢 |
| AC3 | Test function run once opens exactly one issue; issue shape and author recorded as coha-s7 fixture | — | — | — | 1 check (T3) | External-service effect | 🟡 sample event is not a real scrubbed event |
| AC4 | Real scrubbed staging event through a temporary unfiltered alert yields only the fixed code and `src/` or `node_modules/` frames; alert deleted, issue closed (conditional) | — | — | — | 1 check (T4) | External-service effect | 🔴 outward-facing, needs its own approval |
| AC5 | Staging error opens no issue, and the event is visible in this project | — | — | — | 1 check (T5) | External-service negative | 🟡 depends on coha-s5 scenario 10 |
| AC6 | First real production error opens exactly one issue, repeats open none | — | — | — | 1 check (T6) | Production-observed, may not occur before merge | 🔴 cannot be run on demand |
| AC7 | Diff holds only artefacts and bookkeeping, and no credential, installation id or token | — | 1 check (T7, repository diff) | — | — | — | 🟢 |

Total checks: 7 (T1 to T7). T4 and T6 are conditional or deferred; the DoD records each as run, not needed, or deferred with a reason.

## Gap table

| Gap | AC | Gap type | Handling |
|-----|----|----------|----------|
| No code-level test exists for any AC but AC7 | AC1 to AC6 | External-service | Live verification script; strength recorded per AC in the DoD |
| AC6 cannot be produced on demand | AC6 | Production-observed | DoR classifies it with a RISK-ACCEPT in `decisions.md` and a `workspace/state.json` action; DoD outcome COMPLETE WITH DEVIATIONS until seen |
| AC4 opens an extra public issue | AC4 | Outward-facing | Separate operator approval immediately before; temporary alert deleted and issue closed straight after; judged needed only if T3's sample cannot show tenant-text exclusion |
| No CSS-layout-dependent ACs | — | — | None |

---

## Test Data Strategy

- **Source:** mixed. T3 uses PostHog's built-in sample event (synthetic, supplied by PostHog). T4 and T5 use a real event produced by coha-s5's capture on staging, which is already scrubbed by the allow-list (a fixed code and `src/` frames, no tenant text). T6 uses a real production error if one occurs.
- **Sensitivity:** no PCI data and no tenant data enter any check, because coha-s5 removes tenant text before anything leaves the app. The target repo is public, so every created issue is treated as public content and read before it is left open.
- **Credentials:** none created, printed or stored. The GitHub App installation is held by PostHog.
- **Gaps:** none in the data. The staging error needs the coha-s5 follow-ups (Fly capture keys set, scenario 10 run); T5 cannot run before they are done.

## Checks

### T1 (AC1): the GitHub integration reaches only the target repo
- **Precondition:** the operator has connected PostHog's GitHub integration on project 10908 and installed the App on the single target repo.
- **Action:** list the project's integrations through the PostHog tools, then list the repos the GitHub integration can reach.
- **Expected:** exactly one GitHub integration; the repo list is exactly `heymishy/skills-repo` (the configured target). The installation's permissions are read from GitHub's installation page by the operator and stated in writing; the DoD marks that half as stated, not observed. Amended 2026-11-13: the installed PostHog App holds read and write on code, workflows, actions, pull requests, hooks and checks as well as issues, which cannot be narrowed; the operator accepted this as a RISK-ACCEPT in `decisions.md`, so T1 passes on the repo scope and the DoD records the permissions as accepted, not satisfied.
- **Fails now:** the integrations list is empty (count 0 on 2026-11-13).

### T2 (AC2): the stored alert has the right shape
- **Precondition:** T1 passed. The agent has created one error-tracking alert through the PostHog tools.
- **Action:** read the alert back from PostHog (not the creation response).
- **Expected:** the stored function is of type `internal_destination` with `template_id` `template-github`, enabled; the trigger is "issue created" and no other trigger; filters hold `environment = production`; the repository input is the configured target repo. The read-back is written to `reference/coha-s6-alert-configuration.md` with no secrets and no installation id.
- **Fails now:** no error-tracking alert exists.

### T3 (AC3): the test function opens exactly one issue with the expected shape
- **Precondition:** T2 passed; the operator has approved one test-function run, immediately beforehand.
- **Action:** run the destination's test function once. Then list issues in the target repo.
- **Expected:** exactly one new issue; title of the form `<type>: <code>`; body is a code block holding the message, at most 5 frames, and a "View in PostHog" link. The issue's author login, title shape and link pattern are written into the coha-s7 fixture note. No second issue appears after a few minutes. The test issue is closed by the operator afterwards.
- **Fails now:** the destination does not exist.

### T4 (AC4, conditional): a real scrubbed event shows no tenant text
- **Precondition:** T3's sample is judged insufficient, with the reason written down; a real staging event exists in PostHog; the operator approves one extra public issue.
- **Action:** create a temporary copy of the alert with no environment filter, let the staging event fire it, read the issue, then delete the temporary alert and close the issue.
- **Expected:** the issue holds only the fixed code and at most 5 frames each under `src/` or `node_modules/`, with no source lines; the temporary alert no longer exists when listed afterwards.
- **Not run when:** T3's sample is judged enough; the DoD says so and why.

### T5 (AC5): a staging error opens no issue
- **Precondition:** coha-s5 follow-ups done (capture keys set; scenario 10 can run).
- **Action:** raise the deliberate staging error from coha-s5 scenario 10; confirm the event appears in PostHog Error Tracking in this project with `environment` staging; wait the alert's firing window; list issues in the target repo.
- **Expected:** the event is visible in this project; no issue exists for it. If the event is not visible in this project, T5 fails and the shared-project assumption is re-opened.

### T6 (AC6, deferred): the first real production error opens one issue
- **Precondition:** a real production error is first seen.
- **Action:** after PostHog shows the new error issue, list issues in the target repo; after further occurrences of the same error, list again.
- **Expected:** exactly one issue for that error issue id, still one after repeats.
- **Deferred when:** no production error has occurred by merge. Recorded as `production-observed` pending, not as passed.

### T7 (AC7): the diff contains no code and no credential
- **Action:** `git diff --name-only` between the story's branch point and its final commit, then scan the changed files for token, key, installation-id and secret-shaped strings (names only, never values).
- **Expected:** every changed path is under `artefacts/`, `workspace/` or `.github/pipeline-state.json` and `.github/pipeline-timings.jsonl`; nothing under `src/`, `scripts/` or `.github/workflows/`; the scan finds nothing credential-shaped.

---

## NFR checks

| NFR | Check |
|-----|-------|
| Security (one-repo, issue-write-only installation; public-repo content; staging excluded) | Covered by T1, T3/T4 and T5; no separate test. |
| Audit (read-back, integrations list, real fixture recorded in artefacts) | Covered by T1, T2, T3 outputs being committed. |
| Reliability (duplicate suppression unproven until AC6; failed delivery visible in PostHog destination logs) | Covered by T6; the verification script names PostHog's destination logs as the place to look for a failed delivery. |
| Performance, Accessibility | Not applicable (stated in the story). |
