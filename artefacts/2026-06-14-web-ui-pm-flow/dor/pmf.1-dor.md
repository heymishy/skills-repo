# Definition of Ready: Kanban board view at /features?view=board

**Story reference:** artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.1.md
**Test plan reference:** artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.1-test-plan.md
**Review reference:** artefacts/2026-06-14-web-ui-pm-flow/review/pmf.1-review-1.md
**Assessed by:** Copilot (Claude Sonnet 4.6) (/definition-of-ready)
**Date:** 2026-06-15

> **Process exception:** pmf.1 was implemented in commit `7c42380` before artefacts existed.
> This DoR is created retroactively. All H1–H9 checks are evaluated against the artefacts
> and implementation as they exist now. Retroactive DoR sign-off is permitted under the
> process exception documented in discovery.md.

---

## Contract Proposal

**What was built:**
`src/web-ui/views/kanban-view.js` — pure server-side HTML renderer for a six-lane Kanban board.
`renderKanban({features, ideas, wipLimits})` returns a full HTML fragment. The board view is
served at `GET /features?view=board`. Feature cards show health-dot, title, slug, and age.
Ideas lane shows quick-capture form and idea cards with delete and "Start Discovery →" links.
View toggle (List / Board) rendered in the features page header. All content XSS-escaped via `escHtml`.

**What was NOT built:**
- Drag-and-drop between lanes
- WIP limit enforcement that blocks new work
- E2E browser tests for CSS colour rendering of WIP badges
- Any server-side session or database storage

**How each AC is verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — six lanes rendered with correct ids | T4a–T4f in check-kanban-view.js | Unit |
| AC2 — feature cards in correct lane, health + title + slug + age | T5a–T5c in check-kanban-view.js | Unit |
| AC3 — WIP badge present when over limit | Structural check (badge element present) + manual CSS colour inspection | Unit + Manual |
| AC4 — list/board toggle with active class | T8a–T8c in check-kanban-view.js | Unit |
| AC5 — XSS guard | T7a–T7b in check-kanban-view.js | Unit |

**Assumptions:**
- `escHtml` from `src/web-ui/utils/html-shell.js` is the canonical XSS escape function for this codebase.
- WIP badge CSS colour (red when over limit) is a manual-only verification step; automated colour tests require a browser runtime not available in Node.js unit tests.

**Estimated touch points:**
`src/web-ui/views/kanban-view.js` (new), `src/web-ui/routes/features.js` (modified), `src/web-ui/server.js` (modified), `workspace/ideas.json` (new), `tests/check-kanban-view.js` (new), `package.json` (modified).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ | "As a platform operator" — named persona present |
| H2 | ≥3 ACs in Given / When / Then format | ✅ | 5 ACs, all Given/When/Then |
| H3 | Every AC has ≥1 test in the test plan | ✅ | AC3 gap acknowledged (manual-only for CSS colour) |
| H4 | Out-of-scope section populated | ✅ | 4 items listed |
| H5 | Benefit linkage references a named metric | ✅ | M1 — WIP visibility |
| H6 | Complexity rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH review findings | ✅ | 0 HIGH findings — review/pmf.1-review-1.md |
| H8 | Test plan has no uncovered ACs (or gaps acknowledged) | ✅ | AC3 CSS gap documented in test plan; MEDIUM risk-accepted |
| H9 | Architecture constraints populated | ✅ | escHtml requirement, no npm deps, pure server-side renderer |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-06-14-web-ui-pm-flow/nfr-profile.md |
| H-NFR3 | Data classification not blank | ✅ | Public |

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | R1.1 (WIP badge CSS) + R1.2 (process exception) noted | Copilot — 2026-06-15 |
| W4 | Process exception: implementation before DoR | ⚠️ | Retroactive DoR — implementation already exists | Hamish King — acknowledged in discovery.md approval — 2026-06-14 |

---

## Coding Agent Instructions

```
## pmf.1 — RETROACTIVE DoR

Proceed: Implementation already complete in commit 7c42380.

No further implementation required for pmf.1.

Next action: Update pipeline-state.json to move pmf.1 from 'review' to 'definition-of-done'
and set dorStatus: 'signed-off', reviewStatus: 'passed', testPlan.artefact pointing to
artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.1-test-plan.md.
```

---

## Sign-off

**Oversight level:** Low (retroactive — implementation already exists and tests pass)
**Signed off by:** Copilot (Claude Sonnet 4.6) — 2026-06-15
**Status:** SIGNED OFF
