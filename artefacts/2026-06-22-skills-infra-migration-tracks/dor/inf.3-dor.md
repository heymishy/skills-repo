# Definition of Ready: inf.3 — Write `infra-plan` SKILL.md as the infra track sign-off skill

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.3.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.3-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
`.github/skills/infra-plan/SKILL.md` — new sign-off skill file. Entry condition: passing infra-review artefact (status PASS) must exist; unacknowledged DESTRUCTIVE findings block sign-off. Artefact template includes: tier execution sequence (ordered list of tiers to deploy), per-tier validation checkpoints, operator execution checklist (discrete numbered steps). Output path: `artefacts/[feature]/infra/[story-id]-infra-plan.md`. The produced sign-off artefact contains a "status: PASS" or equivalent field readable by H-INF. Unacknowledged DESTRUCTIVE findings from infra-review are surfaced and block sign-off.

**What will NOT be built:**
Execution or application of the infrastructure change. Rollback plan derivation (infra-plan references rollback from infra-definition). H-INF gate logic (that is inf.4).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — entry condition requires passing infra-review | Unit: assert SKILL.md states a PASS infra-review artefact is required; assert output path documented | Unit |
| AC2 — artefact has tier sequence, checkpoints, checklist | Unit: assert tier execution sequence section, per-tier checkpoint section, operator checklist section present | Unit |
| AC3 — unacknowledged DESTRUCTIVE blocks sign-off | Unit: assert SKILL.md explicitly states unacknowledged DESTRUCTIVE finding blocks infra-plan + finding re-surfaced | Unit |
| AC4 — sign-off artefact has status PASS readable by H-INF | Unit: assert SKILL.md documents that produced artefact contains status PASS field | Unit |

**Assumptions:**
All ACs are SKILL.md content assertions. The "status PASS" field in the produced infra-plan artefact is a simple text marker readable by H-INF via string search (consistent with test plan approach).

**Estimated touch points:**
Files: `.github/skills/infra-plan/SKILL.md` (new). Services: None. APIs: None.

**schemaDepends:** Dependencies lists "inf.2" (SKILL.md file dependency, not schema fields). schemaDepends: [].

---

## Contract Review

✅ **Contract review passed** — all 4 ACs addressed by SKILL.md content assertions. Entry condition and block condition are both content checks.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Auditor |
| H2 | ≥3 ACs in GWT format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 10 tests covering all 4 ACs |
| H4 | Out-of-scope populated | ✅ | Executing change, rollback derivation, H-INF excluded |
| H5 | Benefit linkage references named metric | ✅ | M1 — Infra track completion time |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings (1-L1 LOW noted — not blocking) |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends: [] — inf.2 is a SKILL.md dependency only |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-011 — no HIGH findings |
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
| W1 | NFRs populated | ✅ | No-credentials warning; Audit (path convention) |
| W2 | Scope stability | ✅ | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM findings; 1 LOW (AC4 scope overlap with inf.4 — noted, not blocking) |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder; acknowledged |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (per infra-track.md — new SKILL.md, PR required)
**Action:** Solo-founder; Hamish King is operator and reviewer — awareness confirmed.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: inf.3 — Write infra-plan SKILL.md as the infra track sign-off skill
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.3.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.3-test-plan.md
Test file: tests/check-inf3-infra-plan-skill.js
Test runner: node tests/check-inf3-infra-plan-skill.js

Goal:
Make every test in tests/check-inf3-infra-plan-skill.js pass. Write .github/skills/infra-plan/SKILL.md with: entry condition requiring a PASS infra-review artefact, block on unacknowledged DESTRUCTIVE findings with finding re-surfaced, artefact template with tier execution sequence, per-tier validation checkpoints, operator execution checklist, output path artefacts/[feature]/infra/[story-id]-infra-plan.md, and status PASS in produced artefact readable by H-INF.

Constraints:
- Touch: .github/skills/infra-plan/SKILL.md (new)
- Do NOT touch: src/, scripts/, bin/, inf.1 or inf.2 SKILL.md files, pipeline-state files
- Entry condition must be explicit: skill refuses to proceed without PASS infra-review artefact
- Unacknowledged DESTRUCTIVE findings must be re-surfaced (not silently blocked)
- Status PASS field must be a plain text marker (e.g. "status: PASS" line in artefact)
- ADR-011: Governed file; PR required before merge
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
