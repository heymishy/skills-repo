# Remove /review's story-selection and category-selection prompts — Implementation Plan

> **For agent execution:** Single session — /tdd, one task.

**Goal:** Remove Step 1's "review all or specific" question and Step 2's "which categories" menu from `skills/review/SKILL.md`, replacing Step 1's question with a direct statement.
**Branch:** `feature/rssp-s1`
**Worktree:** `.worktrees/rssp-s1`
**Test command:** `node tests/check-rssp-s1-review-skill-no-selection-prompts.js`

---

## File map

```
Create:
  tests/check-rssp-s1-review-skill-no-selection-prompts.js — content-assertion test suite (AC1-AC4)

Modify:
  skills/review/SKILL.md — Step 1 statement, Step 2 removed
```

---

## Task 1: Write the failing test, then fix the skill file

- [ ] Write `tests/check-rssp-s1-review-skill-no-selection-prompts.js` with all 4 tests from the test plan.
- [ ] Run — confirm it fails (both old prompt strings are currently present).
- [ ] Edit `skills/review/SKILL.md`:
  - Step 1: replace the "Review all stories, or a specific one? Reply: all — or name the story" block with a direct statement: "Reviewing all N stories, all 5 categories." (keep the "Stories found for review" listing and the re-run diff note above it; keep the explicit-instruction exception language).
  - Remove "## Step 2 — Confirm review categories" entirely (the whole numbered-menu block).
  - Renumber "## Step 3 — Run the review" to "## Step 2 — Run the review" for continuity (cosmetic).
- [ ] Run — confirm all 4 tests pass.
- [ ] Run full suite — 0 regressions.
- [ ] Commit: `fix(rssp-s1): remove /review's story/category selection prompts (AC1-AC4)`
- [ ] Open draft PR.
