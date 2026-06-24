# Review Report: shr.1 — Extend pipeline-state schema and harness for infra and migration track flags — Run 1

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.1.md
**Date:** 2026-06-25
**Categories run:** A — Traceability, B — Scope, C — AC quality, D — Completeness, E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E — ADR-017 violation: this feature was seeded in pipeline-state.json with `epics[].stories[]` nesting (3 epics, 12 nested stories). ADR-017 (Active ADR, 2026-05-02) mandates "All new features use the flat `features[].stories[]` structure — no new epic nesting is introduced." No story in this feature references ADR-017 in its Architecture Constraints field. The epic-nested structure triggers the B2 rule (CLAUDE.md): state advances for epic-nested stories must be applied on master post-merge, never on feature branches. This creates ongoing implementation overhead across all 12 stories.
  Risk if proceeding: Every story's state advance (stage, reviewStatus, health, etc.) must be manually re-applied on master after each PR merges — the CLAUDE.md B2 rule is mandatory, not optional. If any state advance is applied on a feature branch, it will be silently reverted when master advances between the branch's last rebase and the PR merge. Risk is operational overhead and potential missed state updates, not a correctness blocker.
  To acknowledge: run /decisions, category RISK-ACCEPT. Recommended action before implementation: restructure pipeline-state.json to move stories from `feature.epics[].stories[]` to `feature.stories[]` (flat), retaining the epic artefact files in `artefacts/.../epics/` for documentation. This is a one-time pipeline-state.json edit.

---

## LOW findings — note for retrospective

None.

---

## Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance (Cat E) | 3 | PASS (MEDIUM open) |

**Verdict:** PASS — 0 HIGH, 1 MEDIUM (1-M1 ADR-017 nesting; acknowledge in /decisions before DoR). All 5 ACs are in Given/When/Then format, testable, and describe observable behaviour. Traceability to M2 is clear. Scope boundaries are explicit. NFR coverage (performance ≤5s, security paths-only) is appropriate.
