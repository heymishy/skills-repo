# Review Report: Extend journeys.js/products.js fixture adoption and DRY-extract the fixture-usage-check scripts — Run 1

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s3-mechanical-fixture-dry-batch.md
**Date:** 2026-11-01
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance / F — Journey.js fixture hygiene / G — skills.js fixture hygiene / H — journeys.js fixture hygiene (all 8, A–H)
**Outcome:** PASS (after 1 fix applied during this review)

---

## HIGH findings — must resolve before /test-plan

None remaining — see Fixed During Review below.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Fixed during review

- **[1-H1 → fixed]** AC quality / factual accuracy — AC5, as originally drafted, claimed the shared factory must retain "the comment-blindness fix from the skill-turn-git-commit-stubbing lineage's own precedent" as one of two fixes present in "the individual scripts" being DRY-extracted. This is factually wrong: directly grepped all 3 scripts (`check-journey-fixture-usage.js`, `check-skills-fixture-usage.js`, `check-journeys-fixture-usage.js`) for any comment-stripping logic — none exists in any of them. The comment-blindness bug and fix belongs to a different, unrelated script (`scripts/check-skill-turn-git-commit-stubbing.js`, from `tfhc-s8`), never one of these 3. Only the second claimed fix (the nested-brace windowed-match fix from `tfhc-s7`) is real — confirmed present via `AD_HOC_SESSION_WINDOW` in `check-journeys-fixture-usage.js`. **Fixed:** rewrote AC5 to cite only the real, verified fix, naming the exact constant and the exact regression fixture that originally caught it. This would have misled whoever implements this story into looking for a nonexistent bug-fix in the wrong scripts — exactly the kind of fabricated-precedent error this review process exists to catch before `/test-plan` builds a test around a false premise.

---

## Scores

**Traceability score (1–5):** 5 — References epic, discovery, benefit-metric correctly; Benefit Linkage names m3, m4, and m5 with a real mechanism sentence for each; all three appear in the benefit coverage matrix.

**Scope integrity score (1–5):** 5 — Doesn't implement anything in epic/discovery Out of Scope; its own Out of Scope section names 4 explicit exclusions (full retrofit completion, full `products.js` retrofit, promoting checks to a DoR hard block, any behaviour change beyond the DRY extraction itself).

**AC quality score (1–5):** 4 — AC1–AC4 are sound (Given/When/Then, independently testable, grounded in real proven patterns). AC5 had a genuine factual error (see Fixed During Review) — caught and corrected within this same review pass, not left for a later round. Scoring 4 rather than 5 to record that the first draft needed a real correction, not a cosmetic one.

**Completeness score (1–5):** 5 — User story with a named, discovery-matched persona; benefit linkage real; out of scope populated; NFRs populated (performance target matches the proven <1s precedent from every prior walking-skeleton story in this lineage); complexity rated (1, correctly reflecting this is the epic's lowest-risk, most-proven-pattern story); scope stability declared (Stable).

---

## Overall score summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above (AC5's factual error was corrected within this review, not carried forward as an open finding).

### Category E: Architecture compliance

Architecture Constraints field populated ("None identified — checked"); same finding as the parent epic's own `journey.js`/`skills.js`/`journeys.js` walking-skeleton stories — no applicable guardrail. **Score: 5.**

### Category F: Journey.js fixture hygiene

N/A — this story doesn't touch `journey.js` at all (only `journeys.js`, `products.js`, and the 3 fixture-usage-check scripts). **Score: 5.**

### Category G: skills.js fixture hygiene

N/A — `check-skills-fixture-usage.js` is touched as part of the DRY refactor, but it is a structural-check script, not a test file that itself requires `skills.js` — Category G's trigger condition isn't met. **Score: 5.**

### Category H: journeys.js fixture hygiene

Applicable — AC1 explicitly migrates 3-5 real `journeys.js`-touching test files to the shared fixture. The structural check itself (`node scripts/check-journeys-fixture-usage.js <file>`) can't meaningfully run yet since the target files aren't chosen or migrated at story-artefact stage — this will be checked for real once the migration happens, same precedent as `tfhc-s7`'s own `/review`. The story's own design (migrate to the shared fixture) is already the compliant outcome Category H checks for. **Score: 5.**

---

## Summary

0 HIGH, 0 MEDIUM, 0 LOW across 1 story (1 HIGH found and fixed within this review — not carried forward).
**Outcome:** PASS
