## Definition of Ready: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page

**Story reference:** artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md
**Test plan reference:** artefacts/2026-07-24-product-new-feature-idea-choice/test-plans/pnfc-s1-test-plan.md
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
| H9 | Architecture Constraints populated | ✅ | References the existing, proven `/journey` mechanism to reuse |
| H-E2E | CSS-layout-dependent gate | ✅ | AC1's E2E test is a simple presence check, not CSS-layout-dependent — Playwright tooling already configured (ADR-018), not applicable as a gap |
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
Story: Offer the formed-idea/rough-idea choice when creating a new feature from a product's page — artefacts/2026-07-24-product-new-feature-idea-choice/stories/pnfc-s1.md
Test plan: artefacts/2026-07-24-product-new-feature-idea-choice/test-plans/pnfc-s1-test-plan.md

Goal:
Make every test in the test plan pass.

Constraints:
- Reuse /journey's existing startSkill radio-choice UI and branching logic -- do not
  invent a new mechanism. Read journey.js's handlePostJourney and the surrounding
  form markup (around line 260-270) before implementing.
- Preserve handlePostProductFeature's existing productId-setting behaviour exactly --
  AC4 depends on this not regressing.
- Document your implementation choice (duplicate vs extend handlePostJourney) in
  decisions.md.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment
  describing the ambiguity and do not mark ready for review.

Oversight level: Low.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No formal sign-off required — proceed directly (UX-consistency fix reusing an already-proven mechanism, low blast radius).
**Signed off by:** N/A (Low oversight)
