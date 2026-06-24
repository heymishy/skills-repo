# Definition of Ready: mig.3 — Add H-MIG hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.3.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.3-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## ❌ BLOCKED — 1 hard block failed

### H8-ext FAIL: Schema fields declared in schemaDepends are not present in `pipeline-state.schema.json`

This story's Dependencies block lists upstream story shr.1 and names fields `hasMigrationTrack` and `migrationReviewPath`. The DoR contract declares:

**schemaDepends: [hasMigrationTrack, migrationReviewPath]**

Checking against `pipeline-state.schema.json`:
- `hasMigrationTrack` — **NOT PRESENT** in current schema
- `migrationReviewPath` — **NOT PRESENT** in current schema

**Fix:** Implement and merge shr.1 before re-running /definition-of-ready for mig.3. Also ensure inf.4 is merged (DoR SKILL.md must have H-INF before H-MIG is added, per mig.3 Dependencies).

---

## Checklist (run to point of failure)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Agent |
| H2 | ≥3 ACs in GWT format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 10 tests |
| H4 | Out-of-scope populated | ✅ | H-INF, auto-setting excluded |
| H5 | Benefit linkage references named metric | ✅ | M2 — DoR gate enforcement correctness |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| **H8-ext** | **Schema dependency check** | **❌ FAIL** | **hasMigrationTrack, migrationReviewPath not in schema — blocked pending shr.1** |
| H9 | Not evaluated — blocked at H8-ext | — | |

**BLOCKED at H8-ext. Re-run after shr.1 and inf.4 merge.**
