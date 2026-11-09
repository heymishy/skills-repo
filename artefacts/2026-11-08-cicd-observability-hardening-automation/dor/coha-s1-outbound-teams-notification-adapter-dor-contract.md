# DoR Contract Proposal: Outbound Teams chat-notification adapter

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s1-outbound-teams-notification-adapter.md
**Date:** 2026-11-09

---

**What will be built:**
A new outbound send function and injectable adapter pair in a new module `src/approval-channel/adapters/teams-outbound-adapter.js` (kept separate from the existing, inbound-only `teams-adapter.js`, per the story's own Architecture Constraints finding that the existing file exports only `handle`/`verifyHmac`/`extractStoryId`): `sendTeamsNotification(payload)` plus `setTeamsNotifyAdapter(fn)` / a default stub that throws `Error('Adapter not wired: teamsNotifyAdapter. Call setTeamsNotifyAdapter() with a real implementation before use.')`. The real implementation reads `TEAMS_WEBHOOK_URL` from `process.env`, POSTs the payload, and returns an explicit `{ ok: boolean, error?: string }` result. Wired in the appropriate CI/workflow entry point (e.g. a small bootstrap step shared across `.github/workflows/*.yml` callers, or `server.js` if the send is also needed from a long-lived process — exact wiring location is an implementation-plan decision, not fixed here).

**What will NOT be built:**
Any Slack, email, or other chat-platform adapter — Teams only. Message formatting/templating for coha-s2/s3/s4's own payload content — this story provides only the generic send mechanism; each calling story designs its own message text.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit tests on `sendTeamsNotification` against a mock HTTP listener; integration test confirming the real wired path reaches the mock listener | unit / integration |
| AC2 | Unit tests simulating network error and non-2xx response, asserting explicit failure result; integration test confirming failure propagates to caller | unit / integration |
| AC3 | Unit test calling the unwired stub directly, asserting it throws the exact specified error | unit |
| AC4 | Integration test asserting two distinct payloads produce two distinct, individually-correct POST bodies via the real wired path (not a "setter was called" check) | integration |

**Assumptions:**
The exact wiring entry point (which script/workflow bootstraps `setTeamsNotifyAdapter` with the real implementation) is left to the implementation plan — the story's own AC4 requires it to exist and be behaviourally correct, but doesn't pin an exact file. Assumed: `TEAMS_WEBHOOK_URL` is added to GitHub Actions repo secrets by the operator before this story's PR merges (an operator action, not something this story's code can do itself).

**Estimated touch points:**
Files: `src/approval-channel/adapters/teams-outbound-adapter.js` (new), one CI/workflow wiring entry point (new or existing, TBD at implementation-plan time), `.github/workflows/*.yml` (secret reference only, no logic change in this story). Services: none. APIs: Microsoft Teams Incoming Webhook (outbound POST only).
