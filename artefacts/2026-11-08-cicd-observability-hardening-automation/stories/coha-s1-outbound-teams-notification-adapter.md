## Story: Outbound Teams chat-notification adapter

**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md

## User Story

As a **delivery engineer**,
I want to **have a single, reusable way to send a notification to the team's Teams channel from any CI job or scheduled check**,
So that **CI/CD events, vulnerability findings, and production-log matches all reach me the same way, instead of three separate ad-hoc notification mechanisms being built**.

## Benefit Linkage

**Metric moved:** CI/CD chain notification coverage (foundational — stories 2-4 cannot move this or any other metric without a working send path)
**How:** Every other story in this epic calls this adapter rather than building its own notification code; this story's correctness is the single point of failure (and single point of fix) for the whole epic's delivery.

## Architecture Constraints

- `src/approval-channel/adapters/teams-adapter.js` is confirmed, by reading the real code, to export only `handle`, `verifyHmac`, `extractStoryId` — inbound-only. This story adds a new, separate outbound send function; it does not extend `verifyHmac`/`handle`, and does not reuse HMAC verification (that's an inbound-signature concern, irrelevant to an outbound POST).
- `product/constraints.md` #12 (credentials are structural): the Teams Incoming Webhook URL is a new GitHub Actions secret (e.g. `TEAMS_WEBHOOK_URL`) — never committed to a tracked file, never read from the agent's own environment at authoring time, consistent with this repo's existing `secrets.X` convention already used across `.github/workflows/*.yml`.
- `product/constraints.md` #13 (structural governance preferred over instructional): this story's test plan must include a CI-gate-verifiable assertion that a dispatch call actually happened (e.g. a mock webhook endpoint recording the call), not only a unit test that the function doesn't throw.
- D37 injectable adapter rule applies: this introduces a genuinely new injectable adapter (`setTeamsNotifyAdapter`/default throwing stub). Per CLAUDE.md's D37 rule: (1) the stub default must throw, not silently no-op; (2) the DoR must include an explicit AC for production wiring (AC4 below); (3) the implementation plan must name wiring as a separate task from the handler task; (4) the wiring test must assert real behavioural correctness (a real webhook call reaches the real Teams channel with the real payload shape), not merely that a function reference was assigned.

## Dependencies

- **Upstream:** None
- **Downstream:** coha-s2, coha-s3, coha-s4 all call this adapter.

## Acceptance Criteria

**AC1:** Given a caller invokes the new outbound send function with a message payload, When the function executes, Then it POSTs to the Teams Incoming Webhook URL read from the `TEAMS_WEBHOOK_URL` secret (never hardcoded, never read from an untrusted source) and returns a success/failure result the caller can act on.

**AC2:** Given the webhook POST fails (network error, non-2xx response), When the send function returns, Then it reports the failure explicitly to the caller (never silently swallowed) so a calling workflow step can decide whether to fail the job or just log and continue.

**AC3:** Given the injectable adapter's stub default (before production wiring), When any code calls it without first calling the real setter, Then it throws `Error('Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use.')` — never returns a silent success.

**AC4:** Given the adapter is wired to its real implementation in the appropriate CI/workflow entry point, When a wiring test runs, Then it asserts an observable, differentiating outcome — e.g. two different message payloads produce two distinctly different webhook POST bodies — not merely that a function reference was assigned (per D37's own wiring-test correctness rule, citing the `team-identity-roles` tir-s1 precedent this repo's own CLAUDE.md documents).

## Out of Scope

- Slack or any other chat-platform target — Teams only, per discovery's Out of Scope.
- Message formatting/templating conventions for the other three stories' specific payloads — this story only provides the generic send mechanism; each calling story designs its own message content.

## NFRs

- **Performance:** The send call should complete or fail within a bounded timeout (e.g. 10s) so a calling CI job never hangs waiting on a webhook that's down.
- **Security:** Webhook URL never logged, never included in error messages surfaced to a PR comment or public CI log output.
- **Accessibility:** Not applicable — no UI.
- **Audit:** Every send attempt (success or failure) is logged server-side with a timestamp, consistent with this epic's own feedback-loop design for Metric 1.

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
