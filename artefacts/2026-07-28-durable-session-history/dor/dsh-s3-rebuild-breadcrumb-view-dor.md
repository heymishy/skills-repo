# Definition of Ready: dsh-s3 — Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
**Test plan reference:** artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md
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
| H5 | Benefit linkage names a metric | ✅ | Direct fix, observable mechanism |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 2: 0 HIGH, 0 MEDIUM (1 LOW carried, non-blocking) |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ N/A | Same reasoning as dsh-s2 |
| H9 | Architecture Constraints, no Cat E HIGH | ✅ | ADR-025/027 cited |
| H-E2E | Layout-dependent gap check | ✅ | No AC classified CSS-layout-dependent; E2E tooling already configured regardless |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance sign-off | ✅ | No external regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-GOV | Discovery Approved By populated | ✅ | |
| H-ADAPTER | N/A | ✅ N/A | No new adapter |

---

## Warnings

All resolved (same basis as dsh-s1/s2).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: dsh-s3 — Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view — artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
Test plan: artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md

Goal:
Make every test in the test plan pass, including the new Playwright spec
(tests/e2e/dsh-s3-breadcrumb-split-view.spec.js).

Constraints:
- Rebuild handleGetJourneyStageView (routes/journey.js) — reuse _renderChatPage's
  (routes/skills.js) existing visual pattern for the chat-left/artefact-right
  split; do not invent a third layout.
- Do not modify handlePostJourneyStageArtefact (the existing edit flow) — it must
  continue to work unmodified (AC3).
- Do not regress the existing cross-tenant 404 guard — re-run
  check-p0.2-journey-guard-wiring.js as a regression check (AC4), do not
  re-implement its assertions.
- New test-only endpoint POST /test/seed-durable-stage, NODE_ENV=test gated
  (matching the existing /test/seed-board-journey convention exactly): seeds a
  journey + completed stage whose turns are served ONLY via dsh-s2's durable-read
  path, with NO corresponding in-memory session — simulating "server restarted,
  memory is gone" for the E2E spec, without an actual restart or a real database.
- The Playwright spec uses the withAuth fixture (tests/e2e/fixtures/auth.js),
  matching frsr-s1's exact pattern — runs against the local ephemeral webServer
  only, never real staging.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity: add a PR comment, do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — solo-operator posture.
**Signed off by:** Hamish King — Platform owner — 2026-07-28
