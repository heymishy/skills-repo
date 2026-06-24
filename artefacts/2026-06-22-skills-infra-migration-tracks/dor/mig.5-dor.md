# Definition of Ready: mig.5 — Write `staging-data-policy` template with three named options and declared-choice field

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.5.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.5-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
`.github/templates/staging-data-policy.md` — new template file with exactly three named options: (a) synthetic generated data, (b) anonymised snapshot via named tool/process, (c) non-PII production subset. A `Declared choice` field requiring non-blank selection of one of the three options (TBD explicitly prohibited). A free-form tool/process field for describing the specific implementation. An explicit credentials warning near the tool/process field. Language referencing the template from schema-migration-plan artefacts for the staging-snapshot-privacy field.

**What will NOT be built:**
Prescribing which option teams must choose. Data anonymisation tooling. Migration-review SKILL.md (mig.2).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — three named options present | Unit: assert all three option labels appear in template | Unit |
| AC2 — Declared choice field prohibits TBD/blank | Unit: assert "Declared choice" field + TBD/blank prohibition language | Unit |
| AC3 — completed template satisfies migration-review check | Unit: assert template references migration-review and satisfies mandatory field | Unit |
| AC4 — free-form tool/process field present | Unit: assert tool/process description field in template | Unit |

**Assumptions:**
All ACs are template content assertions. The template format is plain markdown following section heading conventions of existing templates (no embedded HTML beyond HTML comments for instructions).

**Estimated touch points:**
Files: `.github/templates/staging-data-policy.md` (new). Services: None. APIs: None.

**schemaDepends:** None — Dependencies: None.

---

## Contract Review

✅ **Contract review passed** — all 4 ACs addressed by single template file. Security NFR (credentials warning) addressed in constraint list.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Founder |
| H2 | ≥3 ACs in GWT format | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | 9 tests covering all 4 ACs |
| H4 | Out-of-scope populated | ✅ | Prescribing choice, anonymisation tooling excluded |
| H5 | Benefit linkage references named metric | ✅ | T3-M1 — Breaking migration rollback coverage |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-011, template format constraint — no HIGH findings |
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
| W1 | NFRs populated | ✅ | Security (credentials warning); Audit (referenced by artefact path) |
| W2 | Scope stability | ✅ | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder; acknowledged |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (per schema-migration-track.md — new template under .github/templates/ is a governed file, PR required)
**Action:** Solo-founder; Hamish King is operator and reviewer — awareness confirmed.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: mig.5 — Write staging-data-policy template with three named options and declared-choice field
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/mig.5.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/mig.5-test-plan.md
Test file: tests/check-mig5-staging-data-policy.js
Test runner: node tests/check-mig5-staging-data-policy.js

Goal:
Make every test in tests/check-mig5-staging-data-policy.js pass. Write .github/templates/staging-data-policy.md with exactly three named options (synthetic generated data, anonymised snapshot via named tool/process, non-PII production subset), Declared choice field with TBD/blank prohibition, free-form tool/process field, credentials warning, and migration-review integration note.

Constraints:
- Touch: .github/templates/staging-data-policy.md (new)
- Do NOT touch: src/, scripts/, bin/, .github/skills/, pipeline-state files
- Exactly three named options — no more, no fewer
- Declared choice field must explicitly prohibit "TBD" and blank entries
- Credentials warning must be explicit near the tool/process field
- Template format: markdown only; no embedded HTML except HTML comments for instructions
- Section heading conventions must follow existing .github/templates/ files
- ADR-011: Governed template file; PR required before merge
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
