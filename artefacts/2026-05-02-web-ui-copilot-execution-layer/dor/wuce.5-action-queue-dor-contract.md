# Contract Proposal: Personalised action queue — pending sign-offs and annotation requests

**Story:** wuce.5
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- Express route handler: `GET /dashboard` (or `/actions`) — returns personalised action queue for authenticated user
- Action queue adapter: `src/adapters/action-queue.js` — `getPendingActions(userIdentity, token)` — detects pending sign-offs by absence of `## Approved by` section; validates repo access before including items
- Repository list loader: reads configured repositories from `WUCE_REPOSITORIES` env var or `context.yml` — no hardcoded values
- Per-repository access validation: calls GitHub API to confirm read access before surfacing items
- Empty state: "No actions pending — you're up to date" when queue is empty
- Expired/inaccessible token handling: items from inaccessible repos silently omitted; banner message surfaced
- Test fixtures: `tests/fixtures/markdown/artefact-pending-signoff.md`, `tests/fixtures/markdown/artefact-signed-off.md`, `tests/fixtures/github/pipeline-state-feature.json`

## Components NOT built by this story

- Push/email/Teams/Slack notifications — out of scope
- Delegation of sign-off authority — out of scope
- Sorting/filtering the action queue — out of scope
- Annotation-request items in queue (depends on wuce.8 being implemented) — out of scope

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | "Action required" list with feature/type/days-pending | `authenticated user sees pending items on dashboard load`, `each item shows feature name, artefact type, days-pending`, `items sourced from configured repositories only` |
| AC2 | Empty state message | `user with no pending actions sees "No actions pending" message`, `empty message shown not an empty list` |
| AC3 | Signed-off item removed on reload | `after sign-off, item absent from queue on next load`, `getPendingActions returns updated state` |
| AC4 | Click → artefact view | `item link navigates to wuce.2 artefact view for that item`, `link contains repo and path params` |
| AC5 | Expired token → omit + banner | `repo with expired token → items omitted from queue`, `banner message displayed for inaccessible repos` |

## Assumptions

- `context.yml` is available at a known server-side path; env var `WUCE_REPOSITORIES` overrides it
- Pending detection is stateless: the adapter scans artefact markdown files at request time — no caching in Phase 1
- "Days pending" is computed as the difference between the artefact's `Created` metadata date and today

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `src/routes/dashboard.js` | Create | Action queue route handler |
| `src/adapters/action-queue.js` | Create | `getPendingActions` adapter |
| `src/config/repo-list.js` | Create | Repository list loader from env/context.yml |
| `src/app.js` | Extend | Mount dashboard route |
| `tests/action-queue.test.js` | Create | 18 Jest tests for wuce.5 |
| `tests/fixtures/markdown/artefact-pending-signoff.md` | Create | Fixture: artefact without ## Approved by |
| `tests/fixtures/markdown/artefact-signed-off.md` | Create | Fixture: artefact with ## Approved by |
| `tests/fixtures/github/pipeline-state-feature.json` | Create | Fixture: pipeline-state.json feature object |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
