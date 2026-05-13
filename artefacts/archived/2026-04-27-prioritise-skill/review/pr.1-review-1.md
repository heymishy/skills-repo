# Review Report — pr.1: Candidate intake and framework selection

**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.1.md
**Feature:** 2026-04-27-prioritise-skill
**Review run:** 1
**Date:** 2026-04-27
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6)

---

## FINDINGS

### 1-H1 — SCRIPT PATH WRONG IN AC6 AND NFR SECTION (HIGH) — FIXED IN RUN 1

**Finding:** AC6 and the NFR "Skill contract" note referenced `node scripts/check-skill-contracts.js`. The actual path is `node .github/scripts/check-skill-contracts.js` (confirmed in `package.json`). A test written against the original wording would fail with ENOENT.

**Line (before fix):**
> `when \`node scripts/check-skill-contracts.js\` is run`
> `The SKILL.md partial file must pass \`check-skill-contracts.js\``

**Fix applied in this run:** Both references updated to `.github/scripts/check-skill-contracts.js`.

**Status:** RESOLVED in Run 1.

---

### 1-M1 — AC1 "SUFFICIENT FOR A NON-ENGINEER" IS EVALUATIVE, NOT TESTABLE (MEDIUM) — OPEN

**Finding:** AC1 says "with a one-sentence plain-language description of each — sufficient for a non-engineer to understand the difference without external lookup." The word "sufficient" has no measurable definition. A /test-plan writer cannot write an automated check for explanatory sufficiency.

**Line:**
> "sufficient for a non-engineer to understand the difference without external lookup"

**Recommended fix:** Specify minimum content for the descriptions. Example addition: "...where the WSJF description names 'cost of delay' as its primary signal, the RICE description names all four factors (Reach, Impact, Confidence, Effort), and the MoSCoW description names all four buckets."

**Status:** OPEN — awaiting operator confirmation before applying.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 3 | PASS (post-fix) |
| D — Completeness | 5 | PASS |
| E — Architecture | 4 | PASS |

**Verdict:** PASS (post-fix) — 1-H1 resolved. 1-M1 open, does not block progression.

---

## RECOMMENDED ACTIONS

1. ~~Apply 1-H1 script path fix~~ — DONE
2. Confirm 1-M1 fix: add minimum content specification to AC1 to make it independently testable for /test-plan
