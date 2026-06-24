# Definition of Ready: mig.4 — Extend chain-hash trace to emit on migration-review sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.4.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.4-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## ❌ BLOCKED — 1 hard block failed

### H8-ext FAIL: Schema field declared in schemaDepends is not present in `pipeline-state.schema.json`

This story's Dependencies block lists upstream story shr.1 and names the field `hasMigrationTrack`. The DoR contract declares:

**schemaDepends: [hasMigrationTrack]**

Checking against `pipeline-state.schema.json`:
- `hasMigrationTrack` — **NOT PRESENT** in current schema

**Fix:** Implement and merge shr.1 before re-running /definition-of-ready for mig.4.

---

## Checklist (run to point of failure)

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Auditor |
| H2 | ≥3 ACs in GWT format | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests |
| H4 | Out-of-scope populated | ✅ | inf.5 trace, retroactive backfill excluded |
| H5 | Benefit linkage references named metric | ✅ | MM1 — Trace completeness |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| **H8-ext** | **Schema dependency check** | **❌ FAIL** | **hasMigrationTrack not in pipeline-state.schema.json — blocked pending shr.1** |
| H9 | Not evaluated — blocked at H8-ext | — | |

**BLOCKED at H8-ext. Re-run after shr.1 merges.**
