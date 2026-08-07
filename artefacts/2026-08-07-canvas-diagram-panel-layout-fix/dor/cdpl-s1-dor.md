# Definition of Ready: Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button

**Review artefact:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/review/cdpl-s1-review-2.md
**Story reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
**Test plan reference:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/test-plans/cdpl-s1-test-plan.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Contract Proposal

See `artefacts/2026-08-07-canvas-diagram-panel-layout-fix/dor/cdpl-s1-dor-contract.md`.

**Contract Review outcome:** No mismatches found — the proposed max-height/min-height styling and shared toggle-mechanism reuse align with all 5 ACs. ✅ **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator running `/design` or `/definition` |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC5 all covered |
| H4 | Out-of-scope section is populated | ✅ | 3 items named |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track) | Direct usability defect fix with a real mechanism sentence, per short-track convention |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies: None |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Shared-surface-module constraint, reuse-pattern constraint named; Run 2 review: 0 HIGH |
| H-E2E | CSS-layout-dependent AC check | ✅ | AC5 is CSS-layout-dependent; E2E tooling (Playwright, ADR-018) is configured and a real E2E test covers it — not deferred to manual, no RISK-ACCEPT needed |
| H-NFR | NFR profile exists or story has explicit "NFRs: None" | ✅ | Story's own NFR section states "No new"/"Not applicable" across all 4 categories for this pure layout fix — no feature-level NFR profile required for a single-story short-track fix with no NFRs |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification not blank | ✅ N/A | No data-layer change |
| H-NFR-profile | NFR profile presence (only if story declares real NFRs) | ✅ N/A | Story's NFR section is effectively "None — confirmed" for all 4 categories |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact exists for this story, per CLAUDE.md's short-track path |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | Story explicitly states "No D37/adapter concern" — a client-side-only change |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM findings ever | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — solo-maintainer RISK-ACCEPT, consistent with this session's established pattern (see `2026-08-07-cross-surface-state-sync/decisions.md`'s shared W4 entry) |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table names the one real gap (synthetic long-content injection) with explicit justification, not "UNCERTAIN" | — |

---

## Standards injection

Domain tags: `[web-ui]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md` (confirmed present on disk).

---

## Oversight level

**Low** — no parent epic (short-track, single story), Complexity 1, isolated client-side fix reusing an existing working pattern, no server/data/security surface. Proceed directly to coding agent assignment.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button — artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
Test plan: artefacts/2026-08-07-canvas-diagram-panel-layout-fix/test-plans/cdpl-s1-test-plan.md
Contract: artefacts/2026-08-07-canvas-diagram-panel-layout-fix/dor/cdpl-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Scope is entirely src/web-ui/views/chat-view.js (plus new/extended test
  files) -- no other file should need to change.
- Reuse swToggleArtefactFs()/.ad-fs's exact toggle pattern for the new
  canvas-maximise mechanism -- do not invent a second fullscreen approach.
  swExpandCanvas() must use this SAME shared mechanism, not a separate
  implementation, per the story's own Architecture Constraint.
- Do not touch the ideate 3-panel layout's own base flex proportions --
  only add the working maximise button there (AC4).
- Extend tests/e2e/design-definition-canvas-render.spec.js for the 3 new
  E2E tests, reusing its existing driveJourneyToStage/useIsolatedTenant/
  submitTurnViaRealChatUiAndWaitForStreamToFinish helpers rather than
  duplicating them.
- Write the 5 unit tests as a new tests/check-cdpl-s1-canvas-panel-layout-fix.js,
  following this repo's existing plain-Node test convention (see
  tests/check-inc4-canvas-panel.js for the pattern: call renderChat()
  directly, assert on the returned HTML string).
- Out of scope: a drag-to-resize splitter; any diagram content/rendering
  change.
- Architecture standards: read .github/architecture-guardrails.md and
  .github/standards/web-ui/web-ui-patterns.md in full before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)
