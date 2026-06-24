# Definition of Ready: mig.3 — Add H-MIG hard block to `/definition-of-ready` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.3.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.3-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25 (re-run after shr.1 merged — H8-ext block resolved)

---

## Contract Proposal

**What will be built:**
The `/definition-of-ready` SKILL.md is extended with a new hard block **H-MIG** that fires when a story entry carries `hasMigrationTrack: true`. H-MIG checks that `migrationReviewPath` is set, that the artefact at that path contains status PASS, that classification is declared, and that both forward migration and rollback migration fields are non-blank. For a breaking-classified migration, it additionally checks that CI-tier rollback execution evidence is present. When `hasMigrationTrack` is absent or false, H-MIG does not appear — existing H1-H9, H-E2E, H-NFR, H-GOV, H-INF blocks are completely unaffected.

**What will NOT be built:**
H-INF (inf.4). Automatic `hasMigrationTrack` detection. Any UI, src/, or schema changes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — H-MIG appears when hasMigrationTrack true | Unit: SKILL.md contains H-MIG block with hasMigrationTrack trigger | Unit |
| AC2 — FAIL when migrationReviewPath absent or no PASS | Unit: instruction text specifies FAIL for absent/no-PASS path | Unit |
| AC3 — PASS when migrationReviewPath has PASS + classification + rollback | Unit: instruction specifies PASS condition | Unit |
| AC4 — H-MIG absent when hasMigrationTrack false/absent | Unit: conditional trigger documented | Unit |
| AC5 — FAIL for breaking without CI rollback evidence | Unit: instruction specifies CI rollback evidence requirement for breaking | Unit |

**Assumptions:**
Tests check SKILL.md text content. H-MIG follows the H-INF format already established by inf.4. Delivery note: per story dependencies, inf.4 (H-INF) should be merged before mig.3 is implemented — this is a scheduling concern, not a DoR blocker.

**Estimated touch points:**
Files: `.github/skills/definition-of-ready/SKILL.md`. Services: None. APIs: None.

**schemaDepends:** [hasMigrationTrack, migrationReviewPath] — BOTH PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅)

---

## Contract Review

✅ **Contract review passed** — ACs covered; additive-only constraint confirmed; delivery dependency on inf.4 noted.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Agent |
| H2 | ≥3 ACs in GWT format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 10 tests covering all 5 ACs |
| H4 | Out-of-scope populated | ✅ | H-INF, auto-setting excluded |
| H5 | Benefit linkage references named metric | ✅ | M2 — DoR gate enforcement correctness |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends [hasMigrationTrack, migrationReviewPath] — BOTH present in schema (shr.1 merged 2026-06-25) |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-003 met (shr.1 merged), ADR-011 (PR required), additive-only constraint documented — no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — SKILL.md text change only |
| H-NFR | NFR profile exists | ✅ | Audit NFR: finding text must name expected path and missing fields |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile present | ✅ | nfr-profile.md exists |
| H-GOV | Approved By section present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No injectable adapters introduced | ✅ | N/A — instruction text only |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs populated | ✅ | Audit NFR present |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | None |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (mig.3 modifies the DoR SKILL.md — a governing artefact)
**Action:** Solo-founder context: Hamish King is operator and reviewer — awareness confirmed.

**Note on delivery dependency:** mig.3 should be implemented after inf.4 (H-INF) is merged, per story dependencies, to avoid DoR SKILL.md merge conflicts. This is a scheduling concern only.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: mig.3 — Add H-MIG hard block to /definition-of-ready SKILL.md
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.3.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.3-test-plan.md
Test file: tests/check-mig3-h-mig-gate.js
Test runner: node tests/check-mig3-h-mig-gate.js

Goal:
Make every test in tests/check-mig3-h-mig-gate.js pass. Add H-MIG hard block instruction text to .github/skills/definition-of-ready/SKILL.md. The block must: (1) trigger when hasMigrationTrack: true; (2) FAIL when migrationReviewPath absent or artefact has no PASS; (3) FAIL when classification or rollback fields are blank; (4) FAIL for breaking without CI rollback execution evidence; (5) PASS when all fields present with PASS status; (6) not appear when hasMigrationTrack absent or false.

Constraints:
- Touch: .github/skills/definition-of-ready/SKILL.md ONLY
- Do NOT touch: src/, other SKILL.md files, tests/ (other than the test file for this story)
- H-MIG is purely additive — H1-H9, H-E2E, H-NFR, H-GOV, H-INF are unchanged
- Finding text must name migrationReviewPath and list which fields are missing
- ADR-004: no hardcoded tool names in instruction text
- Implement after inf.4 branch is merged (reduces DoR SKILL.md merge conflicts)
- ADR-011: PR required
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
