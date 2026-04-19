# Test Plan: p4-nta-gate-translation — Non-technical approval channel routing

**Story reference:** artefacts/2026-04-19-skills-platform-phase4/stories/p4-nta-gate-translation.md
**Epic:** E4 — Non-technical access
**Dependency:** Spike D PROCEED verdict required; p4-nta-surface must be complete

## Scope

Tests verify that Teams bot approval actions are routed via the existing approval-channel adapter interface (ADR-006), produce identical downstream effects to a git-native approval, enforce C4 (explicit action required), and handle misconfiguration gracefully. No special approval pathway is introduced.

**Implementation module:** `src/teams-bot/bot-approval-router.js`

---

## Test Cases

### T1 — Module exists and exports routeApproval

**Type:** Unit
**Check:** `src/teams-bot/bot-approval-router.js` exists and exports `routeApproval` as a function.

### T2 — routeApproval calls processApproveCommentEvent with equivalent args

**Type:** Unit — ADR-006 adapter interface conformance
**Given:** A valid Teams approval payload `{ storySlug: 'test-story', approver: 'alice', config: { approval_channels: { teams: { approvers: ['alice'] } } } }`.
**When:** `routeApproval(payload, opts)` is called with a mock `processApproveCommentEvent` injected.
**Then:** The mock is called with arguments equivalent to a github-issue-channel approval — same `storySlug` and `dorStatus: "signed-off"` parameters.

### T3 — Approval event includes channel and timestamp

**Type:** Unit
**Given:** A valid Teams approval payload.
**When:** `routeApproval` executes successfully.
**Then:** The event written or passed downstream includes `channel: "teams"` and `approvedAt` (ISO timestamp string).

### T4 — Successful approval produces dorStatus: signed-off

**Type:** Unit
**Given:** Approver is on the authorised approvers list; mock `processApproveCommentEvent` simulates success.
**When:** `routeApproval` completes.
**Then:** Result includes `dorStatus: "signed-off"` or mock was called and result `success: true`.

### T5 — Missing Teams config → user-visible error message

**Type:** Unit — AC4
**Given:** `config.approval_channels.teams` is null or absent.
**When:** `routeApproval` is called.
**Then:** Returns or throws `{ error: "MISSING_CONFIG", message: /Approval routing configuration is missing/i }`.

### T6 — No auto-approval mechanism (C4 enforcement)

**Type:** Static / source scan
**Check:** Source does not contain `setTimeout`, `setInterval`, auto-approve patterns, or logic that approves without an explicit `approver` field present.
**Rationale:** C4 — approval only when approver takes an explicit action.

### T7 — Approver validated against config list

**Type:** Unit
**Given:** `approver: "unknown-user"` not in `approval_channels.teams.approvers`.
**When:** `routeApproval` is called.
**Then:** Returns or throws error indicating approver is not authorised — does not proceed to `processApproveCommentEvent`.

### T8 — No hardcoded tenant IDs or channel IDs (ADR-004)

**Type:** Static / source scan
**Check:** Source contains no hardcoded GUID-format tenant IDs, hardcoded Teams channel IDs, or hardcoded Microsoft Graph API endpoints.

### T-NFR1 — No credentials in approval event payload (MC-SEC-02)

**Type:** Unit
**Check:** The event object passed to `processApproveCommentEvent` does not contain `token`, `secret`, `password`, or `Bearer` fields.

### T-NFR2 — No bypass or force-approve path in source

**Type:** Static / source scan
**Check:** Source does not contain `force`, `skipApproval`, `autoApprove`, or `bypassC4`.

---

## Verification script

`artefacts/2026-04-19-skills-platform-phase4/verification-scripts/p4-nta-gate-translation-verification.md`

## Test file

`tests/check-p4-nta-gate-translation.js`

## Pass criteria

All 12 test assertions pass with 0 failures. TDD red baseline: all fail before `src/teams-bot/bot-approval-router.js` is implemented.
