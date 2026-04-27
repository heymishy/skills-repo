# Definition of Done: Score candidate items conversationally across WSJF, RICE, and MoSCoW with suggested values and rationale elicitation

**PR:** https://github.com/heymishy/skills-repo/pull/196 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.2.md
**Test plan:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.2-test-plan.md
**DoR artefact:** artefacts/2026-04-27-prioritise-skill/dor/pr.2-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Test suite verifies WSJF scoring presents each dimension individually (Cost of Delay components + Job Size) with suggested value and one-sentence reasoning, inviting confirm/override | Automated — tests/check-pr.2.js | None |
| AC2 | ✅ | Test suite verifies RICE scoring presents each dimension (Reach, Impact, Confidence, Effort) individually with suggested value and reasoning | Automated — tests/check-pr.2.js | None |
| AC3 | ✅ | Test suite verifies MoSCoW assigns items to buckets (Must-have, Should-have, Could-have, Won't-have) with rationale and confirms/overrides individually | Automated — tests/check-pr.2.js | None |
| AC4 | ✅ | Test suite verifies override acceptance without re-arguing, value used in subsequent calculations | Automated — tests/check-pr.2.js | None |
| AC5 | ✅ | Test suite verifies at least one rationale question per item before proceeding to output | Automated — tests/check-pr.2.js | None |
| AC6 | ✅ | Test suite verifies placeholder rationale marker ("[rationale not provided]") recorded when operator skips rationale; progress not blocked | Automated — tests/check-pr.2.js | None |
| AC7 | ✅ | Test suite verifies scored list displayed in descending score order with score, rationale (or placeholder), and proceed/second-pass offer | Automated — tests/check-pr.2.js | None |
| NFR | ✅ | T2.15 — `node .github/scripts/check-skill-contracts.js` exits 0; 39 skills, 165 contracts OK | Automated — tests/check-pr.2.js | None |

---

## Scope Deviations

None. Scoring, automated candidate ingestion, second-pass triggering, divergence explanation, artefact save, and workshopping prompts are all confirmed out of scope and not present in the pr.2 SKILL.md additions.

---

## Test Plan Coverage

**Tests from plan implemented:** 15 / 15
**Tests passing in CI:** 15 / 15

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T2.1 — WSJF scores each dimension individually | ✅ | ✅ | |
| T2.2 — WSJF suggests value + reasoning | ✅ | ✅ | |
| T2.3 — RICE scores each dimension individually | ✅ | ✅ | |
| T2.4 — RICE suggests value + reasoning | ✅ | ✅ | |
| T2.5 — MoSCoW assigns to buckets individually | ✅ | ✅ | |
| T2.6 — MoSCoW one-sentence rationale per item | ✅ | ✅ | |
| T2.7 — Override accepted without re-arguing | ✅ | ✅ | |
| T2.8 — Override value used in calculations | ✅ | ✅ | |
| T2.9 — Rationale question asked per item | ✅ | ✅ | |
| T2.10 — Rationale not skipped when operator moves quickly | ✅ | ✅ | |
| T2.11 — Placeholder recorded when rationale skipped | ✅ | ✅ | |
| T2.12 — Progress not blocked by missing rationale | ✅ | ✅ | |
| T2.13 — Sorted output in descending score order | ✅ | ✅ | |
| T2.14 — Proceed/second-pass offer at end | ✅ | ✅ | |
| T2.15 — NFR: check-skill-contracts.js exits 0 | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Skill contract: SKILL.md passes check-skill-contracts.js | ✅ | T2.15 — 39 skills, 165 contracts OK |
| No performance constraint (conversational skill) | ✅ | Not applicable — instruction text only |
| No credentials or external data access | ✅ | Instruction-text only SKILL.md |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Session completion rate | ❌ (0 sessions run) | After first 5 real sessions | pr.2's conversational scoring format is the primary mechanism for completing a session without abandonment. Signal requires real sessions. |
| M2 — Rationale completeness | ❌ (0 sessions run) | After first completed artefact | pr.2's rationale elicitation prompts (AC5) and placeholder mechanism (AC6) are implemented. M2 signal requires an operator to review a saved artefact. |
