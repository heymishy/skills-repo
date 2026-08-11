## Test Plan: Surface pending/merged PR state in the guardrails/standards view

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s7-surface-pr-state-in-view.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-2-pr-gated-add-edit.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | pending PR shows indicator + link | 1 test | — | — | — | — | 🟢 |
| AC2 | merged PR clears indicator, shows new content | 1 test | — | — | — | — | 🟢 |
| AC3 | closed-without-merge reverts cleanly | 1 test | — | — | — | — | 🟢 |
| AC4 | multiple pending PRs, individually correct | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `guardrail_pending_prs` tracking table) + Mocked external services (GitHub PR-status API)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock tracking row with an open PR; mocked GitHub PR-status "open" | Mock pool + mocked fetch | None | |
| AC2 | Same, but mocked GitHub PR-status "merged" | Mock pool + mocked fetch | None | |
| AC3 | Same, but mocked GitHub PR-status "closed" (not merged) | Mock pool + mocked fetch | None | |
| AC4 | Two mock tracking rows for two different entries, two different mocked PR states | Mock pool + mocked fetch | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetGuardrailsView_pendingPr_showsIndicatorAndLink

- **Verifies:** AC1
- **Precondition:** Mock tracking row for an entry with an open PR
- **Action:** Call the view handler
- **Expected result:** That entry shows a "pending review" indicator linking to the real PR URL
- **Edge case:** No

### handleGetGuardrailsView_mergedPr_clearsIndicatorShowsNewContent

- **Verifies:** AC2
- **Precondition:** Mock tracking row, mocked live PR-status check returns "merged", mocked `wugs-s2` content fetch returns the new (merged) content
- **Action:** Call the view handler
- **Expected result:** No pending indicator; entry shows the new content directly (via the normal live-read path); tracking row is cleared
- **Edge case:** No

### handleGetGuardrailsView_closedPr_revertsCleanly

- **Verifies:** AC3
- **Precondition:** Mocked live PR-status check returns "closed" (not merged)
- **Action:** Call the view handler
- **Expected result:** No pending indicator; entry shows its original (pre-edit) content; tracking row is cleared — no orphaned "pending" state
- **Edge case:** Yes

---

## Integration Tests

### handleGetGuardrailsView_multiplePendingPrs_eachShowsOwnCorrectState

- **Verifies:** AC4
- **Components involved:** view handler, tracking table, live PR-status check (called once per pending PR)
- **Precondition:** Two mock tracking rows for two different entries, with two different mocked PR states (one open, one merged)
- **Action:** Call the view handler
- **Expected result:** Each entry shows its own correct, individually-linked state — not a shared or ambiguous indicator
- **Edge case:** No

---

## NFR Tests

### PR status indicator conveys state via text, not colour alone

- **NFR addressed:** Accessibility (`MC-A11Y-02`)
- **Measurement method:** Assert the pending/merged/closed states each include a distinct text label in the rendered HTML
- **Pass threshold:** Text label present for each state
- **Tool:** Node, string assertion

---

## Out of Scope for This Test Plan

- Real-time push updates when a PR merges — not built in this story.
- PR-merge notifications — out of scope per discovery.

---

## Test Gaps and Risks

None identified as blocking.
