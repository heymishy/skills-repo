# Definition of Done: Register `/modernisation-decompose` in `check-skill-contracts.js`

**PR:** https://github.com/heymishy/skills-repo/pull/180 | **Merged:** 2026-04-22
**Story:** artefacts/2026-04-22-modernisation-decompose/stories/md-2-skill-contracts.md
**Test plan:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-2-test-plan.md
**DoR artefact:** artefacts/2026-04-22-modernisation-decompose/dor/md-2-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-22

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1.1–T1.2 confirm `modernisation-decompose` entry present in `check-skill-contracts.js`; entry includes required marker keywords | automated — `check-md-2-skill-contracts.js` T1.1–T1.2 | None |
| AC2 | ✅ | T2.1–T2.2 confirm checker exits 0 with modernisation-decompose in scope; contracts count increased by the new entry | automated — `check-md-2-skill-contracts.js` T2.1–T2.2 | None |
| AC3 | ✅ | T3.1–T3.2 confirm `npm test` exits 0 (no regressions); ≥160 contracts line present | automated — `check-md-2-skill-contracts.js` T3.1–T3.2 | None |

**Overall: 3/3 ACs satisfied. 8/8 automated tests pass.**

---

## Scope Deviations

None.

---

## Test Plan Coverage

**Tests from plan implemented:** 8 / 8 total
**Tests passing in CI:** 8 / 8

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.1 — entry present in checker | ✅ | ✅ | |
| T1.2 — required marker keywords included | ✅ | ✅ | |
| T2.1 — checker exits 0 with new skill in scope | ✅ | ✅ | |
| T2.2 — contracts count increased | ✅ | ✅ | |
| T3.1 — npm test exits 0 (no regressions) | ✅ | ✅ | |
| T3.2 — ≥160 contracts line present in output | ✅ | ✅ | |
| T-NFR1 — no external dependency introduced | ✅ | ✅ | |
| T-NFR2 — contract assertions cover required SKILL.md sections | ✅ | ✅ | |

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| No external npm dependencies added to `check-skill-contracts.js` | ✅ | T-NFR1 passes; implementation uses `fs` and child_process only — no new `require` calls outside stdlib |
| Contract assertions align with actual SKILL.md sections | ✅ | T-NFR2 passes; markers verified against merged SKILL.md content |

---

## Review Finding Status

Review `md-2-review-1.md` had 0 HIGH and 0 MEDIUM findings. Clean pass.

One LOW finding noted:
- **1-L1** (ADR citations absent from Architecture Constraints): constraints text is correct and consistent with ADR-011 and ADR-005; ADR numbering is informational only. No action required.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M2 — Modernisation outer-loop entry rate (100% of projects) | ✅ Baseline 0% | Not yet — requires real programme adoption | `check-skill-contracts.js` now covers the skill; first real-world use needed before signal |

---

## Outcome

**Definition of done: COMPLETE ✅**

ACs satisfied: 3/3
Deviations: None
Test gaps: None
