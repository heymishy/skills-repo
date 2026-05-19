## Story: Non-happy-path — back-navigation, stage flagging, and session history separator

**Epic reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md
**Discovery reference:** artefacts/2026-05-07-web-ui-session-management/discovery.md

## User Story

As an **operator who realises a prior stage needs rework mid-journey**,
I want to navigate back to that stage, re-run it, and continue forward — with visual flags showing which downstream stages need review,
So that I can handle the natural loop-backs of real delivery without losing my work or being blocked by the tool.

## Benefit Linkage

**Metric moved:** Journey completion rate — proportion of started journeys that reach DoR sign-off.
**How:** Currently, if an operator discovers at the test-plan stage that the story ACs are wrong, they have no way to go back and fix the story stage in the web UI — they must abandon the journey and start over (or switch to VS Code). This story turns a journey abandonment into a normal back-navigation event.

## Architecture Constraints

- **Breadcrumb navigation:** The stage list is rendered as a breadcrumb component in the journey header. Completed stages are clickable links; future stages are non-interactive labels.
- **"Needs review" flag:** When a prior stage is re-committed (a new artefact is written for a stage that already has a committed artefact), all subsequent stages in the journey have their status set to `"needs-review"` in the journey state. This is a local in-memory (and disk-persisted via wsm.1) status change only — no AI re-runs are triggered.
- **Confirmation prompt:** The re-commit action must show a confirmation prompt before overwriting. Prompt text: "You are updating a prior stage. Stages after this point will be flagged for review. Continue?" — Cancel aborts; Continue proceeds with the write and sets downstream flags.
- **"Previous session" separator:** When a session is restored from disk (wsm.1) and the operator adds new turns, the chat history shows a visual separator "`— Previous session —`" between the persisted turns and the new turns. This separator is injected client-side at page load when persisted turns are present.
- **Branching state serialised to disk:** The `needs-review` flags and breadcrumb state are part of the journey object persisted by wsm.1. No separate store.
- No new npm dependencies.

## Dependencies

- **Upstream:** ougl.1–ougl.7 (DoD-complete) — stage navigation infrastructure required.
- **Upstream:** wsm.1 (session persistence) — back-navigation state must survive server restart.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a journey has completed three stages (discovery, benefit-metric, definition), when the operator views the journey, then a breadcrumb shows all three completed stages as clickable links plus the current stage as non-clickable — the operator can click "discovery" to navigate to that stage view.

**AC2:** Given the operator navigates back to a completed stage (e.g. discovery) and views it, when they view the stage panel, then they see the prior turns for that stage (read-only) and a "Re-commit artefact" button — they can read history but cannot send new turns until they confirm the re-commit intent.

**AC3:** Given the operator clicks "Re-commit artefact" on a prior stage, when the confirmation prompt appears and they click Continue, then all subsequent stages in the journey have their status changed to `"needs-review"` and show a "⚠ Needs review" badge in the breadcrumb.

**AC4:** Given the operator cancels the confirmation prompt (clicks Cancel), when the prompt is dismissed, then no stage flags are changed and the operator is returned to the prior stage view — nothing is modified.

**AC5:** Given downstream stages are flagged "needs review" and the operator navigates to one of those stages, when they view the stage panel, then the "⚠ Needs review" badge is visible and a note explains "A prior stage was updated — review this stage before proceeding" — the stage is otherwise functional (they can send turns and commit as normal).

**AC6:** Given a journey has persisted turns from a prior server session (restored from disk via wsm.1) and the operator sends a new turn, when the chat panel renders, then the prior session's turns are shown with a `— Previous session —` separator above the new turn — the two groups are visually distinct.

**AC7:** Given an operator back-navigates, re-commits a stage, and sets downstream `needs-review` flags, when the server is restarted and the journey is restored, then the `needs-review` flags are preserved (persisted via wsm.1) and the breadcrumb shows them correctly.

## Out of Scope

- Automatically re-running downstream AI turns when a prior stage is updated — flagging only (AC3/AC5).
- Branching to create a parallel version of the journey (git-style branch) — sequential back-navigation only.
- Merging two journey branches — not applicable given single-branch model.

## NFRs

- **Consistency:** The `needs-review` flag update (AC3) is applied to the in-memory state and the disk store in the same synchronous operation — a crash after memory update but before disk write must not leave the journey in an inconsistent state.
- **UX clarity:** The "Previous session" separator (AC6) must be injected at the exact boundary between persisted turns and new turns — not at every page reload.

## Complexity Rating

**Rating:** 2 — breadcrumb navigation + flag propagation + separator injection. Integrates tightly with wsm.1.
**Scope stability:** Stable.
