# Contract Proposal: Remove /review's story-selection and category-selection prompts

**Story reference:** artefacts/2026-08-31-review-skill-skip-selection-prompts/stories/rssp-s1-remove-review-selection-prompts.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-31

---

## What will be built

- `skills/review/SKILL.md` Step 1 (currently ending with the "Review all stories, or a specific one? Reply: all — or name the story" block): replace the question with a direct statement — "Reviewing all N stories, all 5 categories." — and remove the reply-and-wait framing entirely.
- `skills/review/SKILL.md` Step 2 ("## Step 2 — Confirm review categories", the full "Which review categories should I run?" numbered-menu block): remove entirely. The skill proceeds directly from Step 1 into Step 3 (Run the review), running all 5 categories unconditionally. Step numbering below adjusts accordingly (old Step 3 "Run the review" becomes the immediate next section after Step 1).
- Preserve, in Step 1, both: (a) the Session recovery check (exclude already-reviewed stories from default scope, unless explicit re-review is requested) and (b) an explicit carve-out sentence: if the operator has already named a specific story, honor that scope instead of defaulting to all stories.

## What will NOT be built

- No change to any other skill file.
- No change to the review categories (A–E), scoring rubric, or output/report format.
- No change to the "already reviewed" exclusion/re-run diff logic.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Assert the old prompt string is absent; assert a direct-statement pattern is present | Unit (content assertion) |
| AC2 | Assert the old category-menu block and its exact prompt string are absent | Unit (content assertion) |
| AC3 | Assert the explicit-instruction exception sentence is present | Unit (content assertion) |
| AC4 | Assert the Session recovery check's exclusion language is present, unmodified in substance | Unit (content assertion) |

## Assumptions

- Renumbering subsequent step headings (Step 3 → effectively becomes the section right after Step 1, may be renamed "Step 2 — Run the review" for continuity) is a cosmetic consequence of removing the old Step 2, not a scope expansion — the content of what is now the review-execution section is untouched.

## Estimated touch points

Files: `skills/review/SKILL.md` only. Services: none. APIs: none.
