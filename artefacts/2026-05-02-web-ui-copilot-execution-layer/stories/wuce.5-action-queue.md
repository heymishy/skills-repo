## Story: Personalised action queue — pending sign-offs and annotation requests

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e2-phase1-full-surface.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **business lead or SME reviewer**,
I want to see a personalised list of artefacts awaiting my sign-off or review when I log in,
So that I never miss a pending governance action and I don't need an engineer to send me chase emails.

## Benefit Linkage

**Metric moved:** P5 — Sign-off wait time
**How:** The action queue makes pending sign-offs visible at login — stakeholders see what needs their attention without waiting to be chased, directly reducing the time between "artefact ready for sign-off" and "sign-off received".

## Architecture Constraints

- ADR-012: the query that resolves pending actions must use the SCM adapter pattern — `getPendingActions(userIdentity, token)` — not inline GitHub API calls
- Mandatory security constraint: the action queue must only show artefacts in repositories the authenticated user has read access to — the server must validate repository access via the GitHub API before including items in the queue; never trust client-supplied repo lists
- ADR-004: the list of repositories to surface in the action queue must be read from `context.yml` or a configurable env var — not hardcoded

## Dependencies

- **Upstream:** wuce.2 (action queue links to artefact views), wuce.3 (sign-off completion removes items from queue)
- **Downstream:** wuce.6 (multi-feature navigation builds on the same artefact browsing infrastructure)

## Acceptance Criteria

**AC1:** Given an authenticated user logs in, When the dashboard loads, Then they see an "Action required" section listing all pipeline artefacts (across configured repositories) that are in a state requiring their sign-off (e.g. `status: approved, sign-off: pending`) with the feature name, artefact type, and days-pending displayed for each item.

**AC2:** Given an authenticated user has no pending actions in any configured repository, When the dashboard loads, Then the "Action required" section displays "No actions pending — you're up to date" rather than an empty list with no context.

**AC3:** Given a user completes a sign-off (via wuce.3), When they return to the dashboard, Then the signed-off artefact is removed from the "Action required" section within one page reload.

**AC4:** Given the action queue contains an artefact the user has repository read access to, When the user clicks the artefact link, Then they are taken to the full artefact view (wuce.2) for that item.

**AC5:** Given the server queries a repository where the user's token has expired or lost access, When the action queue is built, Then items from that repository are silently omitted and a banner message informs the user "Some repositories could not be checked — re-authenticate if you believe items are missing."

## Out of Scope

- Push/email/Teams/Slack notification for new pending items — integration adapters are deferred (discovery out-of-scope item 2)
- Delegation of sign-off authority to another user — post-MVP
- Sorting or filtering the action queue by feature, date, or priority — progressive enhancement after launch
- Annotation-request items in the queue — annotation story is wuce.8; the queue infrastructure supports them but annotation items are not surfaced until wuce.8 is implemented

## NFRs

- **Security:** Server-side repository access validation before surfacing any item. No cross-user data leakage.
- **Performance:** Action queue loads in under 3 seconds for up to 50 pending items across 10 configured repositories.
- **Accessibility:** Action queue list meets WCAG 2.1 AA — list items are labelled, links are descriptive (not "click here"), keyboard-navigable.
- **Audit:** Action queue page load events are logged with user ID and count of items surfaced.

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
