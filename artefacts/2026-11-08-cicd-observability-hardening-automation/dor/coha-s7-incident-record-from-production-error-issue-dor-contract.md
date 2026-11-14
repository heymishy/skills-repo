# DoR Contract Proposal: Incident record pull request opened for each bridge-opened production error GitHub issue

**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Date:** 2026-11-14
**Status:** PROPOSED, awaiting sign-off by Hamish King, Platform Owner
**schemaDepends:** [prStatus, dodStatus] (both present in `.github/pipeline-state.schema.json`; the upstream story coha-s6 is `prStatus: merged`, pull request 1089, and its definition of done is not yet written)

**What will be built:**
- A pure logic module `scripts/lib/error-issue-incident.js`: `recogniseIssue(event, config)`, `branchNameFor(id)`, `planRecord(recognised)`, `buildPullRequest(recognised)` and `decideIdempotency(facts, options)` (with the rebuild option). No git, no network. It recognises an issue only when the label `production-error` is present, the author equals the configured bridge login exactly (an unset or empty value recognises nothing), and the body holds exactly one whole-line `PostHog issue id: <lowercase uuid>` marker; it declines items carrying a `pull_request` key; it builds the pull request title and body from the fixed code and the issue number only, with the code inside inline code formatting on one line.
- A command-line script `scripts/error-issue-incident.js`: reads the event or fetched issue from a JSON file path (never from an argument), takes the bridge author, a facts file (existing branches, open pull requests) and a required `--incidents <path>` to an incident file copy, and has `--dry-run` and `--rebuild`. It writes a plan JSON (`action` is `open`, `rebuild`, `skip`, `decline` or `dry-run`, with a fixed `reason`), appends the record to the copy through the real `recordIncident` when the action is `open` or `rebuild`, prints exactly one result line per run, and never defaults to `workspace/incidents.json`.
- A workflow `.github/workflows/error-issue-incident-record.yml`: trigger `issues` with `types: [opened]` and `workflow_dispatch` (inputs: issue number, dry-run, rebuild); a `recognise` job (contents read, issues read) that fetches the issue by number on a hand start and hands only the fixed fields to the next job; a `record` job (contents write, pull-requests write) that builds the branch fresh from `origin/master`, runs the script on a copy of the incident file, commits, pushes only its own `incident/posthog-<id>` branch (force-with-lease on a rebuild) and opens one pull request into `master`; a concurrency group per issue number with `cancel-in-progress: false`; time limits on both jobs; only `actions/checkout`; the bridge author from a workflow variable; no merge, approve or ready step.
- `tests/check-coha-s7-error-issue-incident.js` (U1 to U18 including U14b, I1 to I6, W1 to W12, N1, N2: 39 tests) and fixtures under `tests/fixtures/coha-s7-*.json` if needed. Issue bodies in tests are built with the real coha-s6 `buildBody` so a format drift fails a test. The implementation plan decides whether the file joins `SEQUENTIAL_EXCLUSIVE_LIST` in `scripts/run-all-tests.js` by measuring on 2 pinned cores with a two-slot pool.
- Operator-run, after merge: the workflow variable naming the bridge account (your exact login), the label already in place from coha-s6; the live dry run (AC8) and the live real run (AC9), each with the operator's approval immediately before.

**What will NOT be built:**
Any change to `workspace/incidents.json` by tests or the dry run; any push to or merge into `master`; making the required checks run on the record pull request; auto-closing a record when its issue closes; an occurrence count; recording issues from any other author; Teams notification; a second workflow file (the one-file deviation from ADR-009 is accepted); a personal or app token (only the workflow's own token).

**Existing files exercised or read by tests but NOT edited by this story:** `src/web-ui/routes/error-bridge.js` (its `_internals.buildBody` builds fixtures), `scripts/create-incident.js`, `src/modules/incident-recorder.js`, `scripts/lib/incident-store.js`, `src/modules/triage-drafter.js`, `src/web-ui/routes/products.js` and its test harness approach (`tests/check-itar-s3-web-ui-rendering.js`). A test may import or run them; none may be modified here.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 one pull request, one added record, right fields | U1 to U5 on the logic module; I1 and I6 run the real record creation against a temp copy and the script flow | unit, integration-real-code |
| AC2 no second branch or pull request | U14, U15, U14b (rebuild lifts only the branch and pull request skips) and I6 (second run skips) | unit, integration-real-code |
| AC3 other author declined; unset variable recognises nothing | U6 to U8; W10 (variable not hard-coded) | unit, wiring |
| AC4 missing label or marker declined | U9 to U11; W1 (opened only, explicit types) | unit, wiring |
| AC5 record accepted by validation and the product page | I1 (`validateRecord`), I2 (real product page handler), I3 (loader) | integration-real-code |
| AC6 hostile text inert; non-UUID id creates no branch; code in inline code | U12, U13, U18 (real child process, sentinel file); W4 (no untrusted expression in any `run:`) | unit, wiring |
| AC7 simultaneous issues independent; conflicted record rebuilt | I4 (real git: conflict then rebuild with `--force-with-lease`), I5 (hand start recognition), U14b; W3 (per-issue group), W9 (branch reset from `origin/master`) | integration-real-code, wiring |
| AC8 dry run prints and creates nothing | U16 (also with rebuild), U17; W6; verification scenario 8 after merge | unit, wiring, live-verified |
| AC9 live real run: one branch, one pull request, repeat creates nothing, cleaned up | W2, W5, W9 structurally; I6 for the repeat skip; verification scenario 9 after merge with approval immediately before | live-verified |

**Assumptions:**
1. The `issues` `opened` event and the REST issue object carry `issue.number`, `html_url`, `title`, `body`, `user.login` and `labels[].name` as GitHub documents; only the AC8 live run proves it with a real payload.
2. GitHub's `GITHUB_TOKEN` pull request will not have the three required checks run on it (or will hold them for approval); AC9 observes which and the result goes in `decisions.md`.
3. The bridge account's login, set as a workflow variable, matches GitHub's reported case exactly.
4. `git` is available in test runs (it is, with Git Bash first on PATH).
5. The workflow runs on the default branch, so a workflow file merged to `master` is the one that fires on `issues: opened`.

**Estimated touch points:**
Files: `.github/workflows/error-issue-incident-record.yml` (new), `scripts/lib/error-issue-incident.js` (new), `scripts/error-issue-incident.js` (new), `tests/check-coha-s7-error-issue-incident.js` (new), `tests/fixtures/coha-s7-*.json` (new, if needed), possibly `scripts/run-all-tests.js`; artefacts and bookkeeping. Services: GitHub Actions on `heymishy/skills-repo`, one workflow variable, the `production-error` label. APIs: GitHub REST issues (read one issue on a hand start), git push of one branch, pull request creation by `gh`.
