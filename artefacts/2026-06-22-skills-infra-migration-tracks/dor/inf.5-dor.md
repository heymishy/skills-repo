# Definition of Ready: inf.5 — Extend chain-hash trace to emit on infra-plan sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.5.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.5-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## ❌ BLOCKED — 1 hard block failed

### H8-ext FAIL: Schema field declared in schemaDepends is not present in `pipeline-state.schema.json`

This story's Dependencies block lists upstream story shr.1 and names the field `hasInfraTrack` that it reads. The DoR contract declares:

**schemaDepends: [hasInfraTrack]**

Checking against `pipeline-state.schema.json`:
- `hasInfraTrack` — **NOT PRESENT** in current schema

**Fix:** Implement and merge shr.1 before re-running /definition-of-ready for inf.5.

---

## Checklist (run to point of failure)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Auditor |
| H2 | ≥3 ACs in GWT format | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests |
| H4 | Out-of-scope populated | ✅ | mig.4 trace, retroactive backfill excluded |
| H5 | Benefit linkage references named metric | ✅ | MM1 — Trace completeness |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| **H8-ext** | **Schema dependency check** | **❌ FAIL** | **hasInfraTrack not in pipeline-state.schema.json — blocked pending shr.1** |
| H9 | Not evaluated — blocked at H8-ext | — | |

**BLOCKED at H8-ext. Re-run after shr.1 merges.**
