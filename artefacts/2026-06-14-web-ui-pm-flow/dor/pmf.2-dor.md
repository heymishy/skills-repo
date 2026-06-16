# Definition of Ready: Ideas backlog — workspace/ideas.json and /api/ideas CRUD

**Story reference:** artefacts/2026-06-14-web-ui-pm-flow/stories/pmf.2.md
**Test plan reference:** artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.2-test-plan.md
**Review reference:** artefacts/2026-06-14-web-ui-pm-flow/review/pmf.2-review-1.md
**Assessed by:** Copilot (Claude Sonnet 4.6) (/definition-of-ready)
**Date:** 2026-06-15

> **Process exception:** pmf.2 was implemented in commit `7c42380` before artefacts existed.
> This DoR is created retroactively. All H1–H9 checks are evaluated against the artefacts
> and implementation as they exist now.

---

## Contract Proposal

**What was built:**
Three auth-gated API handlers in `src/web-ui/routes/features.js`: `handleGetIdeas`, `handlePostIdea`, `handleDeleteIdea`. Storage in `workspace/ideas.json` (JSON file, no DB). Ideas created with `idea-<timestamp>` id, title, optional notes, ISO createdAt. Empty title → HTTP 400. Ideas rendered in Kanban board Ideas lane as dashed cards. Quick-capture form in the Ideas lane triggers POST. All content XSS-escaped.

**What was NOT built:**
- Multi-line notes editing in the board UI
- Syncing to external tools
- Idea ordering or prioritisation
- Integration test suite hitting a live HTTP server (deferred to pmf.2b)

**How each AC is verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — POST creates idea, HTTP 201 | Handler exported (T10b) + manual verification of logic | Unit (export) + accepted gap |
| AC2 — GET returns list, HTTP 200 | Handler exported (T10a) | Unit (export) + accepted gap |
| AC3 — DELETE removes, HTTP 204 | Handler exported (T10c) | Unit (export) + accepted gap |
| AC4 — Ideas cards render correctly | T6a–T6d in check-kanban-view.js | Unit |
| AC5 — Quick-capture form triggers POST | T6b (form rendered) + manual smoke test | Unit + Manual |
| AC6 — XSS guard | T7a–T7b in check-kanban-view.js | Unit |
| AC7 — Empty title → 400 | No direct test — risk-accepted in test plan (Hamish King 2026-06-15) | Accepted gap |

**Assumptions:**
- `fs.readFileSync` / `fs.writeFileSync` on `workspace/ideas.json` is adequate for single-operator concurrency.
- Direct API tests for handler logic deferred to pmf.2b if CRUD defects observed in production.

**Estimated touch points:**
`src/web-ui/routes/features.js` (modified), `src/web-ui/server.js` (modified), `workspace/ideas.json` (new). No new files.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format | ✅ | "As a platform operator" |
| H2 | ≥3 ACs in Given / When / Then | ✅ | 7 ACs |
| H3 | Every AC has ≥1 test (or gap acknowledged) | ✅ | AC1–AC3, AC7 gaps risk-accepted — Hamish King 2026-06-15 |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage references named metric | ✅ | M2 — Idea capture rate |
| H6 | Complexity rated | ✅ | Rating: 2, Stable |
| H7 | No unresolved HIGH review findings | ✅ | 0 HIGH findings — review/pmf.2-review-1.md |
| H8 | No uncovered ACs (or gaps acknowledged) | ✅ | AC1–AC3, AC7, AC5 gaps documented and accepted |
| H9 | Architecture constraints populated | ✅ | ideas.json path, escHtml, no npm deps, auth-gated |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md |
| H-NFR3 | Data classification not blank | ✅ | Public |

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | R2.1 (direct API tests), R2.2 (JS-behaviour), R2.4 (concurrent write) | Hamish King — 2026-06-15 |
| W4 | Process exception: implementation before DoR | ⚠️ | Retroactive DoR | Hamish King — acknowledged in discovery.md approval — 2026-06-14 |

---

## Coding Agent Instructions

```
## pmf.2 — RETROACTIVE DoR

Proceed: Implementation already complete in commit 7c42380.

No further implementation required for pmf.2.

Next action: Update pipeline-state.json to move pmf.2 from 'review' to 'definition-of-done'
and set dorStatus: 'signed-off', reviewStatus: 'passed', testPlan.artefact pointing to
artefacts/2026-06-14-web-ui-pm-flow/test-plans/pmf.2-test-plan.md.
```

---

## Sign-off

**Oversight level:** Low (retroactive — implementation exists and exports verified)
**Signed off by:** Copilot (Claude Sonnet 4.6) — 2026-06-15
**Status:** SIGNED OFF
