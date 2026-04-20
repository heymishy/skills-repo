# Definition of Done — p4-nta-gate-translation

**Story:** p4-nta-gate-translation — Teams channel approval routing
**Epic:** E4 — Non-Technical Access
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20

## AC coverage

| AC | Description | Status |
|----|-------------|--------|
| AC1 | `routeApproval` calls `processApproveCommentEvent` with storySlug | PASS |
| AC2 | Approval event includes `channel: 'teams'` and `approvedAt` timestamp | PASS |
| AC3 | Successful approval → result indicates `signed-off` or `success: true` | PASS |
| AC4 | Missing `approval_channels.teams` config → MISSING_CONFIG error with "missing" in message | PASS |
| AC5 | No auto-approval mechanisms: no `setTimeout`, `setInterval`, `autoApprove`, `auto_approve` (C4) | PASS |
| AC6 | Unknown approver rejected (not in authorised approvers list) | PASS |
| AC7 | No hardcoded GUID-format tenant/channel IDs (ADR-004) | PASS |
| AC8 | No credentials in approval event payload (MC-SEC-02) | PASS |
| AC9 | No `skipApproval`, `bypassC4`, `forceApprove` in source | PASS |

## Test results

- **Test file:** `tests/check-p4-nta-gate-translation.js`
- **Results:** 21/21 assertions passing
- **npm test:** exit 0, no regressions

## Implementation

**File:** `src/teams-bot/bot-approval-router.js`

`routeApproval({ storySlug, approver, config }, { processApproveCommentEvent })` validates that `config.approval_channels.teams` is present and that `approver` appears in the `approvers` array. Builds an approval event with `channel: 'teams'`, `approvedAt`, and `dorStatus: 'signed-off'` — no credentials. Delegates to the injected `processApproveCommentEvent` dependency; returns its result, or a success object if no handler is provided.

## Deviations

None.
