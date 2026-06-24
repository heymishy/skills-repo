# Definition of Ready: inf.5 — Extend chain-hash trace to emit on infra-plan sign-off

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.5.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.5-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25 (re-run after shr.1 merged — H8-ext block resolved)

---

## Contract Proposal

**What will be built:**
The `_writeTrace` adapter in the trace module (likely `src/modules/journey.js` or equivalent) is extended to fire a trace record when an infra-plan sign-off event occurs. The record contains the infra-plan artefact path and a SHA-256 hash computed from the artefact file on disk (not in-memory content). When `hasInfraTrack` is absent or false, no infra trace entry is emitted and existing code story trace events are unchanged. The `/trace` SKILL.md is updated to reference the new infra-plan trace entry.

**What will NOT be built:**
Migration-review trace extension (mig.4). Retroactive trace emission for historical infra-plan artefacts. Any schema or pipeline-state.json changes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — sign-off emits trace with path + hash | Unit: mock sign-off event; assert trace record has infraPlanPath + SHA-256 hash field | Unit |
| AC2 — both DoR and infra trace entries appear | Integration: feature with code story + infra-plan sign-off; assert both appear in trace output | Integration |
| AC3 — no infra entries when hasInfraTrack absent/false | Unit: feature without flag; assert zero infra trace records; existing code events unchanged | Unit |

**Assumptions:**
SHA-256 is computed via Node.js `crypto` module from `fs.readFileSync` (disk content). `_writeTrace` can accept a new event type parameter without breaking existing callers.

**Estimated touch points:**
Files: trace module (`src/` — specific file TBD by coding agent from architecture context), `.github/skills/trace/SKILL.md`. Services: None. APIs: None.

**schemaDepends:** [hasInfraTrack] — PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅)

---

## Contract Review

✅ **Contract review passed** — ACs covered; disk-hash security NFR acknowledged; extend-not-replace constraint from story respected.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Auditor |
| H2 | ≥3 ACs in GWT format | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | 8 tests covering all 3 ACs |
| H4 | Out-of-scope populated | ✅ | mig.4 trace, retroactive backfill excluded |
| H5 | Benefit linkage references named metric | ✅ | MM1 — Trace completeness for new artefact types |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends [hasInfraTrack] — PRESENT in schema (shr.1 merged 2026-06-25) |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | extend-not-replace constraint documented; ADR-011 (PR required); ADR-004 on SKILL.md text; ougl disk-canonicity satisfied (hash from readFileSync); no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — trace module + SKILL.md text |
| H-NFR | NFR profile exists | ✅ | Security (path+hash only, no content); Audit (hash from disk) |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile present | ✅ | nfr-profile.md exists |
| H-GOV | Approved By section present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No new injectable adapters | ✅ | Extends existing _writeTrace — no new adapter pattern introduced |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs populated | ✅ | Security + Audit NFRs present |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | None |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder context — operator self-reviews; acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (inf.5 touches the trace module — core audit infrastructure)
**Action:** Solo-founder context: Hamish King is operator and reviewer — awareness confirmed.

**Note on delivery dependency:** inf.5 depends on inf.3 (infra-plan SKILL.md) being merged so the sign-off event exists. This DoR signs off artefact readiness — implementation timing is a scheduling concern.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: inf.5 — Extend chain-hash trace to emit on infra-plan sign-off
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.5.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.5-test-plan.md
Test file: tests/check-inf5-trace-extension.js
Test runner: node tests/check-inf5-trace-extension.js

Goal:
Make every test in tests/check-inf5-trace-extension.js pass. Extend _writeTrace to emit a trace record on infra-plan sign-off containing: artefact path and SHA-256 hash computed from fs.readFileSync (disk content). Zero infra entries when hasInfraTrack is absent or false. Existing code story trace events unchanged.

Constraints:
- Touch: trace module in src/ (identify the correct file from architecture context and existing code), .github/skills/trace/SKILL.md
- Do NOT touch: pipeline-state.schema.json, pipeline-state.json, other src/ modules not related to trace
- extend _writeTrace — do NOT replace or refactor existing trace logic
- SHA-256 must use crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex') — disk content only (ougl disk-canonicity rule)
- No artefact SQL content or migration commands in the trace record — path and hash only
- ADR-011: SKILL.md change requires PR
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
