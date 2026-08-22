# Review Report: Wire the viewer-write-block gate to Skill session routes — Run 1

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s2-skill-sessions.md`
**Date:** 2026-08-22
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category B — This story's Out of Scope section explicitly excludes canvas-edit and assumption-confirm routes ("lower-value, non-cost-incurring write actions ... not included in this story's AC set"). But the parent epic's Goal states "every real write action across Products, Features/journeys, Skill sessions, Credits/billing, and the identified edge-case routes returns a real, tested denial" — an unqualified "every." Excluding 2 real write routes within the Skill sessions group creates a gap between what the epic promises and what this story (the only one covering Skill sessions) actually delivers. This also means the benefit-metric's own Tier 3 target ("0 remaining unenforced routes in the enumerated set") cannot literally reach 0 for the Skill sessions group unless canvas-edit/assumption-confirm are excluded from "the enumerated set" by an explicit decision — which hasn't been recorded anywhere.
  Risk if proceeding: The epic and benefit-metric will read as fully satisfied once all 4 stories reach DoD, while 2 real write routes remain silently unenforced — the exact "false sense of completeness" pattern this session has repeatedly found and fixed elsewhere in this repo (e.g. `bri-s3.3`/`rbg-s1`).
  To acknowledge: run /decisions, category SCOPE — either add canvas-edit/assumption-confirm as ACs to this story, or explicitly record the carve-out as a deliberate MVP exclusion (and update the epic's Goal wording to match, since "every real write action" currently overclaims).

- **[1-M2]** Category E — Same as `vrne-s1`'s [1-M1]: this story's gate depends on reusing `vrne-s1`'s shared gate function, which itself has an unresolved question about whether `requireAdmin`'s live-role-resolution logic can actually be reused without a refactor (see `vrne-s1-review-1.md`). Not a new issue introduced by this story, but this story inherits the same open question and should reference the same decision once made.
  Risk if proceeding: None additional beyond what's already tracked against `vrne-s1`.
  To acknowledge: covered by the same /decisions entry recommended for `vrne-s1`'s [1-M1] — no separate entry needed.

- **[1-M3]** Category C — Same AC-bundling pattern as `vrne-s1`'s [1-M2]: AC2 bundles 4 routes (`turn`, `turn-stream`, `answers`, `answer`) and AC3 bundles 3 routes (`commit` form/JSON paths, `execute`) under single assertions. Route lists are enumerated inline, so `/test-plan` has enough information, but the same "one test could satisfy the AC" risk applies.
  Risk if proceeding: Same as `vrne-s1`'s [1-M2] — partial route coverage could pass as AC-complete.
  To acknowledge: same fix as `vrne-s1`'s [1-M2] — have `/test-plan` enumerate one test per listed route.

---

## LOW findings — note for retrospective

None beyond what's already noted against `vrne-s1`.

---

## Summary

0 HIGH, 3 MEDIUM, 0 LOW across 1 story.
**Outcome:** PASS
