# Definition of Ready: mig.1 — Write `schema-migration-plan` SKILL.md

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.1.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.1-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25 (re-run after shr.1 merged — H8-ext block resolved)

---

## Contract Proposal

**What will be built:**
A new SKILL.md at `.github/skills/schema-migration-plan/SKILL.md`. The skill, when invoked, produces a migration plan artefact at `artefacts/[feature]/migrations/[story-id]-migration-plan.md` containing all five mandatory sections: classification (additive-only or breaking), forward migration, rollback migration (mandatory even for additive-only), tier applicability (four tiers: local, ci, staging, production with validation-status column), and staging snapshot privacy declaration referencing the completed `staging-data-policy.md`. The skill instruction text must not hardcode tool names (ADR-004). A breaking classification with a blank rollback field must prompt the operator to provide one before the plan is saved.

**What will NOT be built:**
Migration execution tooling. Automatic SQL diff detection. Concurrency/locking strategy guidance.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — 5 mandatory sections present | Unit: SKILL.md text contains all 5 section headers | Unit |
| AC2 — breaking requires rollback non-blank | Unit: instruction text specifies breaking+blank-rollback → prompt to provide | Unit |
| AC3 — additive-only also requires rollback | Unit: instruction text specifies rollback mandatory even for additive-only | Unit |
| AC4 — 4 tiers with validation-status column | Unit: instruction text specifies all 4 tiers and validation-status column | Unit |
| AC5 — staging privacy references staging-data-policy.md | Unit: instruction text requires non-blank staging-snapshot-privacy referencing the template | Unit |

**Assumptions:**
Tests check SKILL.md text content. The `staging-data-policy.md` template exists (mig.5, a dependency). ADR-012 (tool-agnostic) applies — migration command fields are described as text fields accepting any tool format.

**Estimated touch points:**
Files: `.github/skills/schema-migration-plan/SKILL.md` (NEW). Services: None. APIs: None.

**schemaDepends:** [hasMigrationTrack] — PRESENT in `pipeline-state.schema.json` (shr.1 merged ✅). Note: `hasMigrationTrack` is read by downstream stories (mig.3, mig.4) but mig.1 itself does not write or read it — schemaDepends is satisfied.

---

## Contract Review

✅ **Contract review passed** — ACs covered; ADR-004 and ADR-012 constraints acknowledged; mig.5 dependency (staging-data-policy template) is already signed off.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Founder |
| H2 | ≥3 ACs in GWT format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 13 tests covering all 5 ACs |
| H4 | Out-of-scope populated | ✅ | Executing migration, auto-detection, concurrency excluded |
| H5 | Benefit linkage references named metric | ✅ | T3-M1 (Tier 3, Meta-metric 1 — Breaking migration rollback coverage) |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends [hasMigrationTrack] — PRESENT in schema (shr.1 merged 2026-06-25) |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-004 (no hardcoded tool names in SKILL.md text), ADR-011 (PR required), ADR-012 (tool-agnostic) — no HIGH findings |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — new SKILL.md text only |
| H-NFR | NFR profile exists | ✅ | Security (no credentials in plan fields); Audit (artefact path convention) |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile present | ✅ | nfr-profile.md exists |
| H-GOV | Approved By section present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No injectable adapters introduced | ✅ | N/A — new SKILL.md only |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs populated | ✅ | Security + Audit present |
| W2 | Scope stability declared | ✅ | Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | None |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder context — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (mig.1 creates a new SKILL.md that governs migration planning for all future stories)
**Action:** Solo-founder context: Hamish King is operator and reviewer — awareness confirmed.

**Note on delivery dependency:** mig.1 should be implemented after mig.5 (staging-data-policy template) is merged, so the template referenced in AC5 exists.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: mig.1 — Write schema-migration-plan SKILL.md
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.1.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.1-test-plan.md
Test file: tests/check-mig1-migration-plan-skill.js
Test runner: node tests/check-mig1-migration-plan-skill.js

Goal:
Make every test in tests/check-mig1-migration-plan-skill.js pass. Create .github/skills/schema-migration-plan/SKILL.md with the 5 mandatory sections (classification, forward migration, rollback migration, tier applicability, staging snapshot privacy). Instruction text must: require rollback even for additive-only; prompt operator when breaking+blank-rollback; cover 4 tiers; reference staging-data-policy.md; use no hardcoded tool names.

Constraints:
- Touch: .github/skills/schema-migration-plan/SKILL.md (NEW file — create directory if needed)
- Do NOT touch: src/, other SKILL.md files, tests/ (other than the test file for this story)
- ADR-004: no hardcoded tool names (Flyway, Alembic, Liquibase, psql, redis-cli, etc.) in instruction text
- ADR-012: migration command fields are tool-agnostic text inputs ("forward migration command or SQL")
- Security NFR: instruction text must warn against pasting production credentials into migration command fields
- ADR-011: new SKILL.md requires PR
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
