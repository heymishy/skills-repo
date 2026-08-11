## Story: Surface pending/merged PR state in the guardrails/standards view

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-2-pr-gated-add-edit.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **tech lead who just submitted an edit**,
I want **to see that my change is pending review (with a link to the real PR) or has merged, right in the guardrails/standards view**,
So that **I know the state of my change without leaving the platform to check GitHub directly**.

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI
**How:** Completes the round-trip the epic promises — a tech lead can add/edit AND see the outcome, not just fire-and-forget a PR they then have to track elsewhere.

## Architecture Constraints

- **Live PR-status check, not a webhook** — per `decisions.md`'s ARCH entry #4 (no caching/webhook layer for this feature), PR state is checked live via the GitHub API when the view is rendered, consistent with the rest of this feature's live-read architecture — not a stored/cached status that could drift.
- **Reuses `wugs-s6`'s returned PR number/URL** — this story does not re-derive which PRs are relevant; it tracks the PR references `wugs-s6` already returned (stored against the guardrail/standard entry, e.g. in a small `guardrail_pending_prs` tracking table keyed by tenant/product/path/PR number).

## Dependencies

- **Upstream:** `wugs-s6` (provides the PR number/URL this story displays and polls).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a guardrail/standard edit has an open PR (from `wugs-s6`), When the view is rendered, Then a "pending review" indicator is shown next to that entry, linking to the real PR URL.

**AC2:** Given that PR has since been merged (checked live via GitHub API), When the view is rendered, Then the "pending review" indicator is replaced with the merged content itself (the view naturally shows the new content once merged, since `wugs-s2`/`wugs-s3` always read live) and the tracking record is cleared.

**AC3:** Given that PR has been closed without merging, When the view is rendered, Then the pending indicator is removed and the entry reverts to showing its pre-edit content — no orphaned "pending" state left indefinitely.

**AC4:** Given a tenant has multiple pending PRs across different guardrail/standard entries, When the view is rendered, Then each entry shows its own correct, individually-linked PR state — not one shared/ambiguous indicator.

## Out of Scope

- **Real-time push updates (e.g. websocket) when a PR merges** — the view re-checks on each page load; no live-updating-without-refresh mechanism in this story.
- **Notification when a PR merges** — explicitly out of scope per discovery's Out of Scope ("Notifications on promotion approval" — same principle extends to edit PRs).

## NFRs

- **Performance:** PR-status check adds one additional GitHub API call per pending PR on each view load — acceptable given this feature's already-accepted live-read latency tradeoff; if a tenant accumulates many simultaneous pending PRs, this is a scaling consideration for a future story, not blocking MVP.
- **Security:** None new beyond `wugs-s6`'s existing token handling.
- **Accessibility:** PR status indicator conveys state via text/label, not colour alone (`MC-A11Y-02`).
- **Audit:** None new — read-only status check.

## Complexity Rating

**Rating:** 2 — new small tracking table plus live-status polling logic, but no new external-write surface.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (High)
