# Definition of Ready: jsvr-s1 — Wire the completed-stage view route into server.js's router

**Story reference:** artefacts/2026-07-27-journey-stage-view-routing/stories/jsvr-s1-wire-stage-view-route.md
**Test plan reference:** artefacts/2026-07-27-journey-stage-view-routing/test-plans/jsvr-s1-wire-stage-view-route-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-07-27

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a pipeline operator..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | AC1–AC4 |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→2 tests, AC2→1 test, AC3→2 tests, AC4→the AC1/AC3 tests themselves (they dispatch through the real router) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | See story's Out of scope section |
| H5 | Benefit linkage field references a named metric | N/A | Short-track bug fix — CLAUDE.md short-track skips discovery/benefit-metric; this closes a confirmed defect, not a new benefit hypothesis |
| H6 | Complexity is rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | N/A | Short-track skips /review |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | Coverage gaps: None (see test plan) |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | See story's Architecture constraints section — no new pattern introduced |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ | No AC is CSS-layout-dependent; all are router-dispatch/unit testable |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | None — confirmed with story owner (pure route-registration fix, no new perf/security/accessibility surface) | Copilot |
| W2 | Scope stability is declared | ✅ | Stable | Copilot |
| W3 | MEDIUM review findings acknowledged in /decisions | N/A | Short-track skips /review | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Test plan/tests written and self-reviewed by Copilot only; operator has not reviewed | Pending — operator can review post-merge; low risk given complexity=1 and existing handler coverage |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Coverage gaps: None | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: jsvr-s1 — Wire the completed-stage view route into server.js's router — artefacts/2026-07-27-journey-stage-view-routing/stories/jsvr-s1-wire-stage-view-route.md
Test plan: artefacts/2026-07-27-journey-stage-view-routing/test-plans/jsvr-s1-wire-stage-view-route-test-plan.md

Goal:
Make tests/check-jsvr-s1-wire-stage-view-route.js pass. Add exactly two
`else if` branches to src/web-ui/server.js's router dispatch chain:
  - GET  /journey/:journeyId/stage/:stageName       -> handleGetJourneyStageView
  - POST /api/journey/:journeyId/stage/:stageName/artefact -> handlePostJourneyStageArtefact
Both handlers already exist and are already exported from
src/web-ui/routes/journey.js — do not modify their internals. Add both
function names to the existing destructured require('./routes/journey') at
the top of server.js. Follow the exact regex-match + req.params-assignment
pattern already used by every other /journey/:id/... route in that file
(e.g. the /journey/:id/stage-review branch immediately above where these
belong).

Constraints:
- Do not touch handleGetJourneyStage (JSON API variant) or
  handlePostJourneyRecommit — explicitly out of scope (see story).
- Do not modify handleGetJourneyStageView or handlePostJourneyStageArtefact
  themselves — they are already correct and already unit-tested by
  check-p0.2-journey-guard-wiring.js; this story is pure route registration.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. No new pattern is introduced by this fix.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — Low oversight, complexity 1, no HIGH/unresolved warnings; proceed directly per CLAUDE.md short-track convention.
**Signed off by:** Not required (Low oversight)
