# Test Plan: wsm.3 — Non-happy-path branching/looping

**Story:** artefacts/2026-05-07-web-ui-session-management/stories/wsm.3-non-happy-path.md
**Test file:** tests/check-wsm3-non-happy-path.js

---

## Technical Test Plan

### T1 — Breadcrumb shows completed stages as clickable, future as non-interactive

**Type:** Unit / route handler
**Setup:** Journey with `completedStages: ["discovery", "benefit-metric"]`, `currentStage: "definition"`.
**Action:** GET `/api/journey/:id`
**Assert:** Response contains `stages` array where `discovery` and `benefit-metric` have `navigable: true` and `definition` has `navigable: false` (or `current: true`).

---

### T2 — Navigating to a prior stage returns that stage's turns

**Type:** Unit
**Setup:** Journey with discovery stage having 2 turns and benefit-metric having 1 turn. Current stage: definition.
**Action:** GET `/api/journey/:id/stage/discovery`
**Assert:** Response includes the 2 discovery turns and the `reCommitAvailable: true` flag. The current stage context is not mutated.

---

### T3 — Re-commit with confirmation sets needs-review on downstream stages

**Type:** Integration
**Setup:** Journey with stages discovery (committed), benefit-metric (committed), definition (committed), test-plan (committed). Operator navigates back to benefit-metric.
**Action:** POST `/api/journey/:id/stage/benefit-metric/recommit` with `{ confirmed: true }`.
**Assert:** (a) HTTP 200. (b) Journey stages `definition` and `test-plan` have `status: "needs-review"` in the response. (c) `discovery` and `benefit-metric` are unchanged.

---

### T4 — Re-commit without confirmation (confirmed: false) makes no changes

**Type:** Unit
**Setup:** Same journey as T3.
**Action:** POST recommit with `{ confirmed: false }`.
**Assert:** (a) HTTP 200 with `cancelled: true`. (b) No stage statuses changed. (c) Journey state identical to before the request.

---

### T5 — Stages flagged needs-review show warning flag in stage controls

**Type:** Unit
**Setup:** Journey with `definition` having `status: "needs-review"`.
**Action:** GET `/api/journey/:id/stage-controls` for the definition stage.
**Assert:** Response includes `needsReview: true` and `needsReviewMessage: "A prior stage was updated — review this stage before proceeding"`.

---

### T6 — "Previous session" separator injected when persisted turns are present

**Type:** Unit
**Setup:** Journey loaded from disk (wsm.1) — `turns` array has a `sessionBoundary` marker at index 3. New turn added (index 4).
**Action:** GET `/api/journey/:id`
**Assert:** The `turns` array in the response has `{ type: "session-boundary", label: "Previous session" }` as an entry before the new turn — the separator is present exactly once at the correct position.

---

### T7 — needs-review flags persisted to disk and restored after restart

**Type:** Integration (uses wsm.1 disk layer)
**Setup:** Journey with `definition` flagged `needs-review`. Session written to disk.
**Action:** Simulate server restart; load sessions from disk.
**Assert:** After load, `definition` stage still has `status: "needs-review"`. Breadcrumb reflects the flag.

---

### T8 — needs-review cleared when flagged stage is re-committed

**Type:** Unit
**Setup:** Journey with `definition` flagged `needs-review`.
**Action:** Operator commits a new artefact for the definition stage (POST to stage commit endpoint).
**Assert:** `definition` stage `status` changes from `"needs-review"` to `"committed"` (or equivalent clean status). `test-plan` (downstream of definition) is NOT automatically un-flagged — only the re-committed stage itself is cleared.

---

## Plain-language AC Verification Script

**Before coding agent runs:** T1–T8 must all fail.

**After implementation — human smoke test steps:**

1. Complete three journey stages (discovery, benefit-metric, definition). Confirm the breadcrumb shows all three as clickable links.
2. Click "discovery" in the breadcrumb. Confirm the discovery stage turns are shown with a "Re-commit artefact" button.
3. Click "Re-commit artefact". Confirm the confirmation prompt: "You are updating a prior stage. Stages after this point will be flagged for review. Continue?"
4. Click Cancel. Confirm nothing changed.
5. Click Re-commit and then Continue. Confirm benefit-metric and definition show "⚠ Needs review" badge.
6. Navigate to the definition stage. Confirm the "A prior stage was updated — review this stage before proceeding" note is visible.
7. Restart the server. Confirm the needs-review flags survive the restart.
8. Re-commit an artefact for benefit-metric. Confirm benefit-metric clears its needs-review flag; definition remains flagged.
9. Resume a previously saved session. Confirm "— Previous session —" separator appears before new turns.
