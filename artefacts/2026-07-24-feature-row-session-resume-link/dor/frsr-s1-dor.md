## Definition of Ready: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts

**Story reference:** artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
**Test plan reference:** artefacts/2026-07-24-feature-row-session-resume-link/test-plans/frsr-s1-test-plan.md
**Assessed by:** Claude (agent), operator-directed
**Date:** 2026-07-24

---

## Contract Review

Contract aligns with all 5 ACs — correctly scopes the MVP to extending the existing `/features/:slug` page rather than inventing a new one, and correctly identifies `completeStage()`'s schema-shape change as the necessary enabling sub-task. **Contract review passed.**

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So, named persona | ✅ | |
| H2 | ≥3 ACs | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 4 items |
| H5 | Benefit linkage named metric | ✅ | Short-track exemption |
| H6 | Complexity rated | ✅ | 3 |
| H7 | No unresolved HIGH | ✅ | Short-track — review skipped |
| H8 | No uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies is "None" — not applicable |
| H9 | Architecture Constraints populated | ✅ | Explicitly names every existing piece to reuse and the one real gap (sessionId recording) to close |
| H-E2E | CSS-layout-dependent gate | ✅ | AC1's E2E test is a simple link-presence/activation check, not CSS-layout-dependent — Playwright tooling already configured (ADR-018) |
| H-NFR | NFR profile exists | ✅ | Short-track exemption, story's own NFR section populated, explicitly reuses the existing NFR-Security guard |
| H-NFR2/H-NFR3 | Compliance/classification | ✅ | Not applicable / Internal |
| H-GOV | Discovery `Approved By` | ✅ | Short-track exemption |
| H-ADAPTER | Adapter wiring | ✅ | Not applicable — no new `setX()` adapter introduced |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1-W2 | NFRs / scope stability | ✅ | — | — |
| W3 | MEDIUM findings | ✅ | None (short-track, no review) | — |
| W4 | Verification script reviewed | ⚠️ | Not yet reviewed | Pending |
| W5 | No UNCERTAIN gaps | ✅ | Session-eviction timing gap explicitly handled via direct simulation, not left uncertain | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts — artefacts/2026-07-24-feature-row-session-resume-link/stories/frsr-s1.md
Test plan: artefacts/2026-07-24-feature-row-session-resume-link/test-plans/frsr-s1-test-plan.md

Goal:
Make every test in the test plan pass.

Constraints:
- Do NOT modify handleGetChatHtml's own rendering, restore, or eviction logic --
  reuse it entirely as-is for the "Resume conversation" link's destination.
- completeStage()'s new sessionId field must be sourced from journey.activeSessionId,
  already in scope at its real call site in handlePostGateConfirm -- do not invent a
  second way to determine which session was active.
- Before wiring the link, verify item.slug (from mergeFeatureSources) actually matches
  the real artefacts/[slug]/ directory name used by _listArtefacts -- if they diverge,
  document the finding in decisions.md and resolve using the correct identifier.
- The new featureSlug->journeyId->completedStages lookup must run once per /features/:slug
  render, not once per artefact row (NFR, explicitly tested).
- Reuse the exact same tenant/ownership security guard handleGetChatHtml already
  enforces -- do not weaken or duplicate it.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Medium -- share this DoR artefact with the operator before assigning
(touches a security-relevant access guard and a schema-shape change to completedStages).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Yes
**Signed off by:** [Pending — see closing summary]
