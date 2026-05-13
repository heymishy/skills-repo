# Verification Script: p4-nta-gate-translation

**Story:** p4-nta-gate-translation — Non-technical approval channel routing
**Test file:** `tests/check-p4-nta-gate-translation.js`

## Pre-conditions

- Node.js ≥ 18 available
- `src/teams-bot/bot-approval-router.js` implemented
- Run from repository root

## Commands

```bash
node tests/check-p4-nta-gate-translation.js
```

## Expected output

```
[p4-nta-gate-translation] T1 — module exists and exports routeApproval
  ✓ T1a: src/teams-bot/bot-approval-router.js exists
  ✓ T1b: module loads without error
  ✓ T1c: exports routeApproval as function

[p4-nta-gate-translation] T2 — routeApproval calls processApproveCommentEvent with equivalent args
  ✓ T2: mock processApproveCommentEvent called with storySlug

[p4-nta-gate-translation] T3 — approval event includes channel and timestamp
  ✓ T3a: channel: "teams" in event
  ✓ T3b: approvedAt timestamp present

[p4-nta-gate-translation] T4 — successful approval produces dorStatus: signed-off
  ✓ T4: dorStatus signed-off or mock called with success

[p4-nta-gate-translation] T5 — missing config → MISSING_CONFIG error
  ✓ T5: error message matches "Approval routing configuration is missing"

[p4-nta-gate-translation] T6 — no auto-approval mechanism (C4)
  ✓ T6a: no setTimeout in source
  ✓ T6b: no setInterval in source

[p4-nta-gate-translation] T7 — approver validated against config list
  ✓ T7: unknown approver rejected

[p4-nta-gate-translation] T8 — no hardcoded tenant/channel IDs (ADR-004)
  ✓ T8: no GUID-format tenant IDs in source

[p4-nta-gate-translation] T-NFR1 — no credentials in approval event (MC-SEC-02)
  ✓ T-NFR1: no token/secret/password in event payload

[p4-nta-gate-translation] T-NFR2 — no bypass path in source
  ✓ T-NFR2: no force/skipApproval/autoApprove

[p4-nta-gate-translation] Results: N passed, 0 failed
```

## AC coverage

| AC | Tests |
|----|-------|
| AC1 | T2 |
| AC2 | T4 |
| AC3 | T5, T6 (no auto-approve) |
| AC4 | T5 (error message) |
| NFR | T-NFR1, T-NFR2, T8 |
