## Story: PostHog instrumentation for both benefit metrics

**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Domain:** [auth]

## User Story

As a **platform owner**,
I want **real, observable events for invite creation and acceptance**,
So that **I can actually measure the two metrics this feature exists to move, instead of having a working feature with no way to tell if it's succeeding**.

## Benefit Linkage

**Metric moved:** Share of new teammates added via self-serve invite; Time from invite creation to invitee access
**How:** Neither metric is measurable without this story — `benefit-metric.md`'s own measurement method for both metrics is a PostHog event comparison/timestamp-diff that does not exist until this story ships.

## Architecture Constraints

- **Reuse the existing `_posthog.capture(distinctId, eventName, properties)` pattern** (`modules/posthog-server.js`, already used throughout `products.js`/`skills.js`/`journey.js`/`landing.js`) — no new analytics integration.
- Event capture happens inline in `wsi-s1`'s invite-creation code path and `wsi-s2`'s invite-acceptance code path — this story adds the capture calls to those existing code paths, it does not introduce a separate event-emission layer.

## Dependencies

- **Upstream:** `wsi-s1` (invite-creation event), `wsi-s2` (invite-acceptance event)
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given an admin successfully creates an invite (`wsi-s1`), When creation completes, Then a `team_invite_created` PostHog event is captured, including `tenant_id`, `role`, and the invite's own `team_invitation_id` in its properties.

**AC2:** Given an invitee successfully accepts an invite and joins (`wsi-s2`), When acceptance completes, Then a `team_invite_accepted` PostHog event is captured, including `tenant_id`, `role`, `team_invitation_id`, and the elapsed time since the matching `team_invite_created` event (the direct input to benefit-metric's "time from invite creation to invitee access" metric).

**AC3:** Given the existing admin-manual-add action (`team-management.js`'s `addOrUpdateTeammate`, already merged, unrelated to this feature), When a teammate is added that way, Then a `teammate_added_by_admin` PostHog event is captured there too — verified via direct inspection of `routes/team-management.js` and `modules/team-management.js` that no such event currently exists (only application-level `log.info` logging). Without this, benefit-metric's "share of self-serve vs admin-add" metric has only one side of the comparison and cannot actually be computed — this is real, required work in this story's own scope, touching a file outside the epic's other stories.

**AC4:** Given both events exist, When queried together, Then it is possible to compute both benefit-metric metrics from real PostHog data alone — no manual log-scraping or estimation required.

## Out of Scope

- **A dashboard or visualisation of these metrics** — this story produces the raw events; building a chart/dashboard to view them is a separate concern (or manual PostHog query, matching how other features in this codebase report metric signals at DoD time).
- **Historical backfill** — no events exist for admin-adds that happened before this story ships; the metric's own baseline (0%) already accounts for this.

## NFRs

- **Performance:** Event capture is fire-and-forget (matching the existing `_posthog.capture` usage elsewhere in this codebase) — never blocks the admin's or invitee's own request/response cycle.
- **Security:** Event properties never include the invitee's raw email address or the invite token — only IDs, role, and timestamps, matching this codebase's existing PostHog event convention of avoiding PII in event properties.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** These events ARE the audit/observability mechanism for this feature — no separate audit log needed beyond what `wsi-s1`/`wsi-s2`/`wsi-s4` already log to their own application logs.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
