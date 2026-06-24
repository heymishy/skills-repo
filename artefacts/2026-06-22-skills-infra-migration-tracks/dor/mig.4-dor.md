# Definition of Ready: mig.4 — Extend chain-hash trace to emit on migration-review sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.4.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.4-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25 (re-run after shr.1 merged — H8-ext block resolved)

---

## Contract Proposal

**What will be built:**
The `_writeTrace` adapter in the trace module is extended (not replaced) to fire a trace record when a migration-review sign-off event occurs. The record contains the migration-review artefact path and a SHA-256 hash computed from the artefact file content on disk (not in-memory). No migration SQL content or commands appear in the trace record — path and hash only. When `hasMigrationTrack` is absent or false, no migration trace entry is emitted and existing events are unchanged. The `/trace` SKILL.md is updated to reference the new migration-review trace entry.

**What will NOT be built:**
Infra-plan trace extension (inf.5). Retroactive trace emission for historical artefacts. Schema or pipeline-state.json changes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — sign-off emits trace with path + hash | Unit: mock sign-off; assert trace record has migrationReviewPath + SHA-256 | Unit |
| AC2 — both DoR and migration trace entries appear | Integration: feature with code + migration sign-off; assert both present | Integration |
| AC3 — no migration entries when hasMigrationTrack absent/false | Unit: no flag; assert zero migration trace records; existing events unchanged | Unit |

**Assumptions:**
SHA-256 computed via `crypto` + `fs.readFileSync`. Extends same `_writeTrace` pattern as inf.5 (once inf.5 is merged, the pattern is established). No SQL content in the trace record — this is a hard security constraint.

**Estimated touch points:**
Files: trace module in `src/` (same file as inf.5), `.github/skills/trace/SKILL.md`. Services: None. APIs: None.

**schemaDepends:** [hasMigrationTrack] — PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅)

---

## Contract Review

✅ **Contract review passed** — ACs covered; no-SQL-content security constraint acknowledged; extend-not-replace honoured.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Auditor |
| H2 | ≥3 ACs in GWT format | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests covering all 3 ACs |
| H4 | Out-of-scope populated | ✅ | inf.5 trace, retroactive backfill excluded |
| H5 | Benefit linkage references named metric | ✅ | MM1 — Trace completeness for new artefact types |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends [hasMigrationTrack] — PRESENT in schema (shr.1 merged 2026-06-25) |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | extend-not-replace documented; ADR-011 (PR required); ougl disk-canonicity (hash from readFileSync); no SQL content in record — no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — trace module + SKILL.md |
| H-NFR | NFR profile exists | ✅ | Security (path+hash only, no SQL); Audit (hash from disk per ougl) |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile present | ✅ | nfr-profile.md exists |
| H-GOV | Approved By section present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No new injectable adapters | ✅ | Extends existing _writeTrace — no new adapter pattern |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs populated | ✅ | Security + Audit NFRs present |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | None |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (mig.4 touches core trace audit infrastructure)
**Action:** Solo-founder context: Hamish King is operator and reviewer — awareness confirmed.

**Note on delivery dependency:** mig.4 depends on mig.2 (migration-review SKILL.md) being merged so the sign-off event exists. Implement after mig.2.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: mig.4 — Extend chain-hash trace to emit on migration-review sign-off
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.4.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.4-test-plan.md
Test file: tests/check-mig4-trace-extension.js
Test runner: node tests/check-mig4-trace-extension.js

Goal:
Make every test in tests/check-mig4-trace-extension.js pass. Extend _writeTrace to emit a trace record on migration-review sign-off containing: artefact path and SHA-256 hash from fs.readFileSync (disk content). No SQL content in record. Zero migration entries when hasMigrationTrack absent or false.

Constraints:
- Touch: trace module in src/ (same file as inf.5 — identify from codebase), .github/skills/trace/SKILL.md
- Do NOT touch: other src/ modules, pipeline-state.schema.json, pipeline-state.json
- extend _writeTrace — do NOT replace existing trace logic
- SHA-256 must use crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')
- CRITICAL: No migration SQL content, forward/rollback commands, or connection strings in trace record — path and hash ONLY (security NFR)
- ADR-011: PR required
- Implement after mig.2 is merged (sign-off event must exist)
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
