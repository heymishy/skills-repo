# Definition of Ready: inf.4 — Add H-INF hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.4.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.4-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## ❌ BLOCKED — 1 hard block failed

### H8-ext FAIL: Schema fields declared in schemaDepends are not present in `pipeline-state.schema.json`

This story's Dependencies block lists upstream story shr.1 and explicitly names schema fields `hasInfraTrack` and `infraPlanPath` that it reads. The DoR contract declares:

**schemaDepends: [hasInfraTrack, infraPlanPath]**

Checking these against `pipeline-state.schema.json`:
- `hasInfraTrack` — **NOT PRESENT** in current schema
- `infraPlanPath` — **NOT PRESENT** in current schema

**Fix:** Implement and merge shr.1 (which adds `hasInfraTrack` and `infraPlanPath` to `pipeline-state.schema.json`) before re-running /definition-of-ready for inf.4.

Resolve and re-run /definition-of-ready when shr.1 is merged.

---

## Checklist (run to point of failure)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Agent |
| H2 | ≥3 ACs in GWT format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 9 tests |
| H4 | Out-of-scope populated | ✅ | auto-setting hasInfraTrack, H-MIG excluded |
| H5 | Benefit linkage references named metric | ✅ | M2 — DoR gate enforcement correctness |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| **H8-ext** | **Schema dependency check** | **❌ FAIL** | **hasInfraTrack, infraPlanPath not in pipeline-state.schema.json — blocked pending shr.1** |
| H9 | Not evaluated — blocked at H8-ext | — | |

**BLOCKED at H8-ext. Do not assign to coding agent until shr.1 is merged and schema fields are present.**
