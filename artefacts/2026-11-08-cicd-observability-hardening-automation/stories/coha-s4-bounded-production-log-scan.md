## Story: Bounded production-log scan with pattern-match notification

**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md

## User Story

As a **delivery engineer**,
I want to **a scheduled check to scan recent production logs for known error patterns and notify me if it finds one**,
So that **a production defect like the still-unfixed `tenant_admin_bootstrap_failed` bug doesn't have to be found by accident**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency
**How:** This story is the only mechanism this metric can be measured against — today there is no systematic detection at all, so "time between a defect appearing and the scan surfacing it" is literally undefined until this story ships.

## Architecture Constraints

- **Mandatory: triggered and bounded, never a standing process** (`product/mission.md`, `product/constraints.md` #11) — implemented as a scheduled GitHub Actions workflow (`schedule:` cron trigger) that runs `flyctl logs --since <window>`, greps known error patterns, and exits. Never a long-running or persistent watcher process.
- `product/constraints.md` #12 (credentials are structural): the Fly.io API token this step needs must live in GitHub Actions secrets (e.g. `FLY_API_TOKEN`), never in the agent's own environment or any tracked file.
- 7-day log retention confirmed (via /clarify, against this app's real `personal`-org tier) — an hours-to-a-day lookback window is comfortably within that; do not design a lookback window approaching 7 days without re-confirming retention still covers it.
- `product/constraints.md` #13: the test plan must assert the scan actually ran and would notify on a known-bad log line (e.g. a fixture log containing `tenant_admin_bootstrap_failed`), not just that the script doesn't throw on empty input.
- No new injectable adapter for the notification send itself (reuses `coha-s1`) — but the `flyctl logs` invocation itself is a new external-command dependency; the implementation plan should name wiring/testing this invocation as its own task, distinct from the pattern-match logic, given it is the one part of this story not fully under this repo's own control (an external CLI).

## Dependencies

- **Upstream:** coha-s1 (the adapter this story calls).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the scheduled workflow fires, When it runs, Then it executes `flyctl logs --since <window>` (window bounded to hours-to-a-day, per the confirmed 7-day retention), scans the output for a defined list of known error patterns, and exits — the process does not remain running after the scan completes.

**AC2:** Given the log output contains a match for one of the known error patterns, When the scan completes, Then exactly one notification is sent via `coha-s1`'s adapter, including enough context (timestamp, matched pattern, log excerpt) for a human to investigate without re-running the scan manually.

**AC3:** Given the log output contains no matches, When the scan completes, Then no notification is sent and the run exits cleanly — a quiet period must never produce a false-positive notification.

**AC4:** Given this is the first month the scan has run, When a defect is confirmed (by any means) to have appeared in logs before the scan's next scheduled run surfaced it, Then the gap between the defect's log timestamp and the scan's detection timestamp is recorded as this metric's first real measurement — establishing the baseline the benefit-metric artefact explicitly defers rather than guesses at.

## Out of Scope

- Any remediation or auto-fix action — detection and notification only, consistent with this epic's overall scope boundary with incident-triage-and-respond.
- A configurable/extensible pattern-definition UI — the known-pattern list is a static, code-maintained list for this MVP, not a user-editable configuration surface.
- Any infrastructure/APM integration beyond `flyctl logs` — no new observability vendor.

## NFRs

- **Performance:** The scan must complete within the scheduled job's timeout — bounded log window keeps this tractable; no new performance target set beyond "finishes and exits."
- **Security:** Fly.io API token scoped to logs-read only if Fly.io's token model supports scoping; never logged, never included in the notification payload itself.
- **Accessibility:** Not applicable.
- **Audit:** Every scan run (match or no match) is logged, supporting the detection-latency measurement method.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
