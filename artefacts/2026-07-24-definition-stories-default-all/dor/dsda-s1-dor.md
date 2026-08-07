## Definition of Ready: Default to all stories from /definition when starting the per-story review sequence

**Story reference:** artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
**Test plan reference:** artefacts/2026-07-24-definition-stories-default-all/test-plans/dsda-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## Contract Review

Contract aligns with all 5 ACs. **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | ≥3 ACs | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage named metric | ✅ | Short-track exemption |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH | ✅ | Short-track — review skipped |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies is "None" — not applicable |
| H9 | Architecture Constraints populated | ✅ | Explicitly requires mirroring, not diverging from, the existing client-side parser |
| H-E2E | CSS-layout-dependent gate | ✅ | AC3's E2E test is a simple form-interaction check, not CSS-layout-dependent — Playwright tooling already configured (ADR-018) |
| H-NFR | NFR profile exists | ✅ | Short-track exemption, story's own NFR section populated |
| H-NFR2/H-NFR3 | Compliance/classification | ✅ | Not applicable / Internal |
| H-GOV | Discovery `Approved By` | ✅ | Short-track exemption |
| H-ADAPTER | Adapter wiring | ✅ | Not applicable |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1-W2 | NFRs / scope stability | ✅ | — | — |
| W3 | MEDIUM findings | ✅ | None (short-track, no review) | — |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Pending |
| W5 | No UNCERTAIN gaps | ✅ | — | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Default to all stories from /definition when starting the per-story review sequence — artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
Test plan: artefacts/2026-07-24-definition-stories-default-all/test-plans/dsda-s1-test-plan.md

Goal:
Make every test in the test plan pass.

Constraints:
- Read journey.js's embedded parseDefinitionArtefact (client-side <script> string,
  around line 847) in full before writing the new server-side extractor -- your
  extractor's story-ID regex logic must match its H1-format and flat-story-fallback
  branches exactly (AC5's binding requirement), not a reinvented pattern.
- Do not refactor parseDefinitionArtefact itself or attempt to share code between
  client and server in this story -- write a new, separate, narrower server-side
  function, cross-referenced via comments.
- The manual-entry fallback (AC4) and edit affordance (AC3) must both remain --
  auto-populating is a default, not a removal of operator control.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Low.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No formal sign-off required — proceed directly (defaults an existing manual step, reversible via the retained edit affordance).
**Signed off by:** N/A (Low oversight)
