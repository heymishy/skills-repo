# Review Report — pr.5: Output format, rationale enforcement, extension point, and artefact save

**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.5.md
**Feature:** 2026-04-27-prioritise-skill
**Review run:** 1
**Date:** 2026-04-27
**Reviewer:** GitHub Copilot (Claude Sonnet 4.6)

---

## FINDINGS

### 1-H1 — SCRIPT PATH WRONG IN ARCHITECTURE CONSTRAINTS AND NFR SECTION (HIGH) — FIXED IN RUN 1

**Finding:** Architecture Constraints referenced `scripts/check-skill-contracts.js` (missing `.github/`). NFR "Skill contract" note also used the wrong path.

**Fix applied in this run:** Both references updated to `node .github/scripts/check-skill-contracts.js`.

**Status:** RESOLVED in Run 1.

---

### 1-H2 — AC6 IS VACUOUSLY PASSABLE WITHOUT A CONTRACTS ENTRY (HIGH) — FIXED IN RUN 1

**Finding:** `.github/scripts/check-skill-contracts.js` has 38 entries in `CONTRACTS[]`. There is no entry for `prioritise`. The script only fails for registered skills — for an unregistered skill it trivially reports 0 violations regardless of the SKILL.md's content. AC6 as originally written provided no quality signal.

**Fix applied in this run:** AC6 extended to require: "this requires that a `prioritise` entry has been added to `CONTRACTS[]` in `.github/scripts/check-skill-contracts.js` naming at least the required structural section markers." The NFR section now also explicitly scopes this as implementation work.

**Architecture-guardrails alignment:** Reference implementations table states: "Skill structural contracts | `check-skill-contracts.js` | Defines required markers per skill; **extend when adding structural invariants**." This obligation is now captured in AC6.

**Status:** RESOLVED in Run 1.

---

### 1-L2 — DEFAULT SAVE PATH SAVES TO ARTEFACTS ROOT, NOT FEATURE SUB-DIRECTORY (LOW)

**Finding:** AC4 default path `artefacts/prioritise-[YYYY-MM-DD]-[topic-slug].md` saves to the `artefacts/` root. Established convention is `artefacts/[feature-slug]/[type]/[file].md`.

**Recommended fix:** Change default path to `artefacts/[feature-slug]/prioritisation/[YYYY-MM-DD]-[topic-slug].md` to match repo conventions.

**Status:** OPEN — LOW severity; does not block /test-plan but worth fixing before implementation.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| A — Traceability | 5 | PASS |
| B — Scope integrity | 5 | PASS |
| C — AC quality | 5 | PASS (post-fix; 8 ACs, all G/W/T, all independently verifiable) |
| D — Completeness | 5 | PASS |
| E — Architecture | 5 | PASS (post-fix; contract extension obligation now captured) |

**Verdict:** PASS (post-fix) — both HIGH findings resolved in Run 1. 1-L2 open; does not block progression.
