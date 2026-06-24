# Definition of Ready: inf.1 — Write `infra-definition` SKILL.md with blast-radius, rollback, and tier-applicability artefact template

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.1.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.1-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
A new SKILL.md file at `.github/skills/infra-definition/SKILL.md`. The file contains five mandatory artefact sections (change description, blast-radius statement, rollback plan, tier applicability table, plan/preview attachment), a tier table with four tiers (local, ci, staging, production) each with a validation-status column, discrete rollback steps (not a single sentence), a plan/preview attachment section, and tool-agnostic instruction text throughout. No tool names (Terraform, Pulumi, CDK, Ansible, CloudFormation) may appear in required-step contexts. An explicit credentials warning is included in the plan/preview attachment section. The artefact output path `artefacts/[feature]/infra/[story-id]-infra-def.md` is documented. The `ops/` prefix is accepted as a valid feature slug.

**What will NOT be built:**
The infra-review checklist (inf.2). Execution or application of the infra change. Automatic detection of what infrastructure a story changes.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — artefact at correct path with 5 sections | Unit: read SKILL.md; assert all 5 section headings present; assert output path documented | Unit |
| AC2 — tier table has 4 tiers with validation-status column | Unit: assert SKILL.md contains all four tier names and validation-status column | Unit |
| AC3 — rollback plan has discrete steps and time estimate | Unit: assert "discrete" or "steps" + "estimated time" in rollback section | Unit |
| AC4 — ops/ prefix accepted | Unit: assert SKILL.md documents ops/ as valid feature slug | Unit |
| AC5 — no hardcoded tool names in required steps | Unit: grep SKILL.md for Terraform, Pulumi, CDK, Ansible, CloudFormation in non-example contexts | Unit |

**Assumptions:**
The `.github/skills/infra-definition/` directory will be created by the implementation. The SKILL.md is a plain markdown instruction file with no programmatic execution — all ACs are content assertions.

**Estimated touch points:**
Files: `.github/skills/infra-definition/SKILL.md` (new file). Services: None. APIs: None.

**schemaDepends:** None — Dependencies: None.

---

## Contract Review

✅ **Contract review passed** — all 5 ACs are addressed by the single SKILL.md file. AC5 (no hardcoded tool names) is addressed in the constraint list.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Founder |
| H2 | ≥3 ACs in GWT format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 15 tests covering all 5 ACs |
| H4 | Out-of-scope populated | ✅ | infra-review, execution, auto-detection excluded |
| H5 | Benefit linkage references named metric | ✅ | T3-M2 — Blast-radius declaration coverage |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-004, ADR-011, ADR-012 — no HIGH findings |
| H-E2E | No CSS-layout ACs | ✅ | N/A |
| H-NFR | NFR profile exists | ✅ | nfr-profile.md exists |
| H-NFR2 | No compliance NFRs with regulatory clauses | ✅ | None |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR section present → nfr-profile exists | ✅ | nfr-profile.md exists |
| H-GOV | Approved By present | ✅ | Hamish King — Operator / Platform Maintainer — 2026-06-22 |
| H-ADAPTER | No injectable adapters | ✅ | N/A |

**All hard blocks: PASS**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-----------------------|
| W1 | NFRs populated | ✅ | Security (no-credentials warning in skill text); Audit (path convention) |
| W2 | Scope stability | ✅ | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder; operator self-reviews — acknowledged |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (per infra-track.md — new SKILL.md under .github/skills/ requires PR review per ADR-011)
**Action:** Solo-founder context; Hamish King is operator and reviewer — awareness confirmed.

---

## Standards Injection

Domain tags: None declared — no standards injected.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: inf.1 — Write infra-definition SKILL.md with blast-radius, rollback, and tier-applicability artefact template
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.1.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.1-test-plan.md
Test file: tests/check-inf1-infra-definition-skill.js
Test runner: node tests/check-inf1-infra-definition-skill.js

Goal:
Make every test in tests/check-inf1-infra-definition-skill.js pass. Write .github/skills/infra-definition/SKILL.md with all five mandatory artefact sections, four-tier table with validation-status column, discrete rollback steps, plan/preview attachment section with credentials warning, ops/ prefix acceptance, and zero hardcoded tool names in required steps.

Constraints:
- Touch: .github/skills/infra-definition/SKILL.md (create new directory and file)
- Do NOT touch: src/, scripts/, bin/, any existing SKILL.md file, pipeline-state.json or schema
- ADR-004: No tool names (Terraform, Pulumi, CDK, Ansible, CloudFormation) in required-step instruction text; tool references only in examples with "e.g." or "your plan output"
- ADR-011: This is a governed file; PR required before merge
- ADR-012: Tool-agnostic; plan output is attached as text, not structured tool data
- Credentials warning must be explicit in the plan/preview attachment section
- Artefact output path must be documented as artefacts/[feature]/infra/[story-id]-infra-def.md
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass — do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
