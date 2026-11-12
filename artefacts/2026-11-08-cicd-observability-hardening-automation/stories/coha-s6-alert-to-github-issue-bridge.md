## Story: GitHub issue opened by PostHog for each new production error issue (native destination)

**Status:** DRAFT run 4, awaiting re-review. Rewritten 2026-11-13 after the operator chose the native route (decision entry "coha-s6 — use PostHog's native GitHub destination, not a custom bridge" in `decisions.md`). The run-3 version, a custom bridge route in the app with its own database table, shared secret and GitHub token (reviewed PASS), is in git at commit 6e16356c7 and is the fallback design. Second half of the split of the 2026-11-13 draft; the first half is coha-s5 (capture and scrub, merged). Replaces the notification half of coha-s4 (bounded production-log scan), which is superseded.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Spike evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md and production-error-source-working-notes.md
**Decision reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md (entries dated 2026-11-13)

## User Story

As a **delivery engineer**,
I want to **a GitHub issue opened automatically, once, the first time PostHog reports a new production error issue**,
So that **a captured error is queued for a fix without anyone having to notice the alert, and a staging or test error never reaches that queue**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency (Metric 4)
**How:** with coha-s5 recording the error, this story makes the second timestamp of the revised measurement ("time between a production defect occurring and a GitHub issue for it existing") real. Metric 4 only starts moving when this story ships.

## Architecture Constraints

- **Configuration, not code.** PostHog's built-in `template-github` destination on an error-tracking alert opens the issue itself, through a GitHub App that the operator installs. No route, database table, shared secret or GitHub token is added to the app, and nothing under `src/` changes. If a gap in the native destination forces code, the story stops and the run-3 bridge design (commit 6e16356c7) is reinstated through `/definition` and `/review`, not improvised here.
- **Operator prerequisite, in the browser:** connect PostHog's GitHub integration on the project (PostHog project settings, integrations) and install the PostHog GitHub App on the single target repo only, with issue write access and nothing broader. PostHog's integrations list for project 10908 held 0 entries on 2026-11-13, so this is not yet done. The agent does not do this step.
- **Alert shape:** one error-tracking alert, trigger "issue created" only (not reopened, not spiking), a filter `environment = production`, destination `template-github` pointing at the configured repo. coha-s5 events carry `environment`, and staging and production share one PostHog key (operator statement, unverified), so the filter is what keeps staging out. Created through the PostHog tools (`error-tracking-alerts-create` and `cdp-functions-create`), and its configuration is recorded without secrets as `reference/coha-s6-alert-configuration.md` so it is reviewable outside PostHog.
- **Issue content is what the template produces, and it is not "fixed fields only".** Title defaults to the exception type and message (the message is a fixed code such as `tenant_admin_bootstrap_failed`, coha-s5 AC3), body holds the message in a code block, up to 5 in-app stack frames (file, line, function name) and a "View in PostHog" link. This is acceptable because coha-s5's allow-list scrub guarantees the message is a fixed code and keeps only `src/` or `node_modules/` frames with no source lines, and because the repo is public and its source is already public. The live checks (AC3, AC4) prove this on a real issue; if the template leaks anything else, the alert is disabled and the fallback applies.
- **No label from PostHog.** The template applies none. The label `production-error` that coha-s7 keys on moves into coha-s7: its workflow adds the label to a PostHog-created issue as its first step. This story's job is to capture a real created issue as a fixture so coha-s7 can state exactly how to recognise one (author login of the GitHub App, title shape, the PostHog link in the body).
- **Outward-facing steps need explicit approval each time.** Running the destination's test function opens a real issue in a public repo. Approval is asked for immediately before that run and covers one run; the resulting test issue is closed by the operator afterwards and is not counted as an incident.
- **Platform-agnostic guardrail (ADR-012):** this route is vendor-specific on purpose (PostHog is already the chosen capture vendor and GitHub is the repository platform), so it is the adapter-shaped edge, not core. Nothing in `src/` or `scripts/` depends on it; the run-3 bridge or any other alert destination can replace it without touching the pipeline.
- **Credentials (`product/constraints.md` #12):** the GitHub App installation is held by PostHog. No credential is created, printed, written or committed by this story.
- **Duplicate suppression is PostHog's:** a given error issue fires "issue created" once. There is no table of ours; the claim is checked at first real occurrence (AC6).

## Dependencies

- **Upstream:** coha-s5 (merged, PR #1087). Its operator follow-ups matter here: the Fly capture keys must exist and scenario 10 (a deliberate staging error) must be run, because the staging error is also this story's negative test (AC5).
- **Operator prerequisites:** the GitHub App installation above; approval for the single test-function run; one deliberate staging error (shared with coha-s5 scenario 10).
- **Downstream:** coha-s7 (label and incident record for each created issue; its trigger and the "carried in the issue body or a label" rule need revising to match the real issue, at its own `/review`), and the incident-triage feature's first real recorded incident.

## Acceptance Criteria

**AC1:** Given the operator has connected the PostHog GitHub integration, When the project's integrations are listed, Then one GitHub integration is present and the repos it can reach are exactly the single target repo, and the installation's permission for issues is write with no broader scope. Evidence: the integrations listing and the repo list from PostHog, plus the operator's statement of the permissions shown in GitHub's installation page.

**AC2:** Given the alert has been created, When its stored configuration is read back from PostHog, Then it has trigger "issue created" only, a filter of `environment = production`, destination `template-github` aimed at the target repo, and is enabled. The read-back is recorded in `reference/coha-s6-alert-configuration.md`.

**AC3:** Given the alert exists, When its destination test function is run once with operator approval, Then exactly one issue appears in the target repo with the template's title and body shape and a "View in PostHog" link, and the issue's author, title shape and link pattern are recorded as the fixture for coha-s7. This is `live-verified` evidence for delivery only.

**AC4:** Given the AC3 sample cannot show whether tenant text is excluded (the sample event is not a real scrubbed event), When a real scrubbed staging event is routed through a temporary copy of the alert that does not filter on environment, with separate operator approval for that one extra public issue, Then the resulting issue's title and body contain only the fixed code and at most 5 frames each under `src/` or `node_modules/` with no source lines, and the temporary alert is deleted and the issue closed afterwards. This AC applies only if AC3's sample is judged insufficient; the judgement and its reason are written in the DoD.

**AC5:** Given a staging error is raised (coha-s5 scenario 10) and PostHog shows the event in this same project, When the production-only alert has had time to fire, Then no issue is opened in the target repo for it. This proves the environment filter. If the staging event does not appear in this project, the AC is not satisfied and the shared-project assumption is re-opened.

**AC6:** Given a real production error issue is first seen, When PostHog raises "issue created", Then exactly one GitHub issue opens, and further occurrences of the same error do not open another. This is `production-observed` evidence and may legitimately be absent at merge. DoR classifies it explicitly: a RISK-ACCEPT entry in `decisions.md` and a post-merge action in `workspace/state.json` naming who confirms it at the first real production error; until then the DoD records COMPLETE WITH DEVIATIONS, not complete.

**AC7:** Given the story is finished, When the repository diff is examined, Then it contains only artefacts and bookkeeping (nothing under `src/`, `scripts/` or `.github/workflows/`), and no credential, installation id or token appears in any committed file.

## Out of Scope

- Capturing or scrubbing errors (coha-s5).
- Labelling the issue and creating incident records from it (coha-s7).
- Any remediation or auto-fix; issue creation only.
- Teams notification (on hold until Teams is in use).
- A custom webhook receiver, shared secret, database table or GitHub token (the run-3 design, kept only as the fallback).
- Alerts other than this one new-issue alert; spiking, reopened, comment and close behaviour.
- OpenTelemetry (OTel) logs, traces or metrics, and any second vendor.

## NFRs

- **Performance:** not applicable; PostHog delivers asynchronously and the app is not in the path.
- **Security:** least-privilege installation scoped to one repo with issue write only; issue content limited to what coha-s5's scrub leaves (a fixed code and `src/` frames) in a public repo; no credential handled by us; staging excluded by the environment filter.
- **Audit:** the alert configuration read-back, the integrations listing and the real created-issue fixture are recorded in artefacts; PostHog's own destination invocation logs are the delivery record.
- **Reliability:** duplicate suppression and retry behaviour are PostHog's and are treated as unproven until AC6; a failed delivery (for example the App uninstalled) is visible only in PostHog's destination logs, which the verification script names as the place to look.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 1
**Scope stability:** Unstable until the first real created issue is seen (AC3), because the issue body and author are template-defined and not yet observed (AC3).

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] GitHub integration connected and installation scope confirmed (operator, AC1)
- [ ] Approval for the single test-function run recorded (and, if AC4 applies, for the one extra issue)
- [ ] AC6 (production-observed) classified at DoR with a RISK-ACCEPT and a post-merge action
- [ ] coha-s7 revision for the label and trigger noted as a downstream action
