# Definition of Ready: mig.2 — Write `schema-migration-review` SKILL.md with rollback evidence check and classification validation

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.2.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.2-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
`.github/skills/schema-migration-review/SKILL.md` — new skill file. Review checklist includes: CI-tier rollback execution evidence required for breaking migrations (log snippet / test result / operator attestation); declaration-only sufficient for additive-only; staging-snapshot-privacy block when staging tier is in scope and field is blank; classification coherence check (additive-only declaration + DROP COLUMN / ALTER COLUMN TYPE → finding); zero unacknowledged findings → PASS artefact at `artefacts/[feature]/migrations/[story-id]-migration-review.md`; mandatory credentials check in checklist; no hardcoded tool CLI commands in required steps.

**What will NOT be built:**
Executing the migration or rollback. Automated SQL parsing. H-MIG DoR gate (mig.3). Trace extension (mig.4).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — breaking needs CI rollback evidence | Unit: assert CI-tier rollback evidence requirement for breaking; acceptable formats described | Unit |
| AC2 — additive-only accepts declaration | Unit: assert declaration-sufficient language for additive-only; distinct from breaking requirement | Unit |
| AC3 — blank staging privacy blocks PASS | Unit: assert staging privacy block condition conditional on staging scope | Unit |
| AC4 — coherence check flags additive-only + DROP/ALTER | Unit: assert coherence check described; mismatch produces a finding | Unit |
| AC5 — zero findings → PASS at correct path | Unit: assert PASS condition + output path | Unit |

**Assumptions:**
All ACs are SKILL.md content assertions. "CI-tier rollback execution evidence" format is not prescribed (log snippet / test result / attestation acceptable). SQL parsing is operator-guided, not automated.

**Estimated touch points:**
Files: `.github/skills/schema-migration-review/SKILL.md` (new). Services: None. APIs: None.

**schemaDepends:** Dependencies lists "mig.1" (SKILL.md file dependency only). schemaDepends: [].

---

## Contract Review

✅ **Contract review passed** — all 5 ACs addressed. schemaDepends is empty (mig.1 is a SKILL.md file dependency, not a schema field dependency).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Auditor |
| H2 | ≥3 ACs in GWT format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 12 tests covering all 5 ACs |
| H4 | Out-of-scope populated | ✅ | Execution, automated SQL parsing, concurrency guidance excluded |
| H5 | Benefit linkage references named metric | ✅ | T3-M1 — Breaking migration rollback coverage |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends: [] — mig.1 is SKILL.md dependency only |
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
| W1 | NFRs populated | ✅ | Security (credentials check mandatory); Audit (path convention) |
| W2 | Scope stability | ✅ | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder; acknowledged |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (per schema-migration-track.md — new SKILL.md, PR required)
**Action:** Solo-founder; Hamish King is operator and reviewer — awareness confirmed.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: mig.2 — Write schema-migration-review SKILL.md with rollback evidence check and classification validation
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.2.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.2-test-plan.md
Test file: tests/check-mig2-migration-review-skill.js
Test runner: node tests/check-mig2-migration-review-skill.js

Goal:
Make every test in tests/check-mig2-migration-review-skill.js pass. Write .github/skills/schema-migration-review/SKILL.md with: CI-tier rollback evidence required for breaking (log/test result/attestation accepted); declaration sufficient for additive-only; staging-snapshot-privacy block when staging in scope + field blank; classification coherence check (additive-only + DROP/ALTER → finding); PASS condition on zero unacknowledged findings at output path artefacts/[feature]/migrations/[story-id]-migration-review.md; mandatory credentials check in checklist; no hardcoded tool CLI commands.

Constraints:
- Touch: .github/skills/schema-migration-review/SKILL.md (new)
- Do NOT touch: src/, scripts/, bin/, mig.1 or mig.5 SKILL.md/template, pipeline-state files
- ADR-004: No tool CLI commands (Alembic downgrade, Flyway repair, redis-cli, psql) in required steps
- ADR-011: Governed file; PR required before merge
- ADR-012: Tool-agnostic — evidence format is not prescribed; any CI-equivalent proof accepted
- Breaking vs additive-only distinction must be explicit and distinct
- Credentials check is MANDATORY in the checklist
- Staging-snapshot-privacy block is CONDITIONAL on staging tier being in scope
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
