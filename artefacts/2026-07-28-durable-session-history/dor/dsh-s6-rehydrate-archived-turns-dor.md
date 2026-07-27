# Definition of Ready: dsh-s6 — Transparently rehydrate an archived stage's turns on read

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md
**Test plan reference:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s6-rehydrate-archived-turns-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | |
| H2 | ≥3 ACs in G/W/T | ✅ | 5 |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | |
| H5 | Benefit linkage names a metric | ✅ | Closes the second half of the storage-bounding metric |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM (1 LOW carried) |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ N/A | Same reasoning as dsh-s2 |
| H9 | Architecture Constraints, no Cat E HIGH | ✅ | ADR-025/027 cited |
| H-E2E | Layout-dependent gap check | ✅ | Rendering-parity concern, not CSS layout/drag-drop |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | No external regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-GOV | Discovery Approved By populated | ✅ | |
| H-ADAPTER | N/A | ✅ N/A | Extends existing adapter, no new `setX()` |

---

## Warnings

All resolved (same basis as prior stories).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dsh-s6 — Transparently rehydrate an archived stage's turns on read — artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md
Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s6-rehydrate-archived-turns-test-plan.md

Goal:
Make every test in the test plan pass, including the new local Playwright spec
(tests/e2e/dsh-s6-archived-stage-transparent-render.spec.js).

Constraints:
- Extend dsh-s2's getTurnsForStage with a SECOND fallback tier (query
  session_turns_archive only when the hot table returns nothing) — do not
  introduce a parallel "archived stage" function or route. dsh-s3/dsh-s4
  require zero code changes to benefit from this story.
- Never re-promote an archived row back to the hot table — the whole point of
  dsh-s5's archive design is bounded hot-table growth; re-promoting on every
  view would defeat it.
- Extend the existing /test/seed-durable-stage endpoint (from dsh-s3) with an
  `archived: true` flag rather than creating a second seed endpoint.
- No UI indicator anywhere that a stage was archived — deliberately invisible
  (AC4). If your implementation adds any such indicator, remove it.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — solo-operator posture.
**Signed off by:** Hamish King — Platform owner — 2026-07-28
