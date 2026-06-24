# Definition of Ready: inf.2 — Write `infra-review` SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.2.md
**Test plan reference:** artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.2-test-plan.md
**Assessed by:** Claude Sonnet 4.6
**Date:** 2026-06-25

---

## Contract Proposal

**What will be built:**
`.github/skills/infra-review/SKILL.md` — new file with three-level severity scale (DESTRUCTIVE, REVERSIBLE-HIGH, ADVISORY); explicit acknowledgement requirement for DESTRUCTIVE findings; tier-coherence check that flags production-before-CI ordering as ADVISORY; secret pattern check (password=, token=, secret=) raising REVERSIBLE-HIGH; zero-unacknowledged-findings condition producing PASS artefact at `artefacts/[feature]/infra/[story-id]-infra-review.md`; no hardcoded tool CLI commands in required steps.

**What will NOT be built:**
infra-plan sign-off skill (inf.3). Automated blast-radius severity calculation. Code review checklist items.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — DESTRUCTIVE hard-blocks with explicit ack | Unit: assert SKILL.md contains DESTRUCTIVE severity, explicit acknowledgement requirement, and block on unacknowledged finding | Unit |
| AC2 — tier-coherence check ADVISORY | Unit: assert SKILL.md contains tier-coherence check and ADVISORY severity for out-of-order validation | Unit |
| AC3 — secret pattern → REVERSIBLE-HIGH | Unit: assert secret pattern check and REVERSIBLE-HIGH severity present | Unit |
| AC4 — zero findings → PASS at correct path | Unit: assert PASS condition documented with output path | Unit |
| AC5 — unacknowledged DESTRUCTIVE blocks sign-off | Unit: assert blocking condition on unacknowledged DESTRUCTIVE finding | Unit |

**Assumptions:**
All ACs are SKILL.md content assertions. The severity scale is specific to infra-review and does not conflict with /review's HIGH/MEDIUM/LOW scale.

**Estimated touch points:**
Files: `.github/skills/infra-review/SKILL.md` (new). Services: None. APIs: None.

**schemaDepends:** The story lists Dependencies: "inf.1". inf.1 is a SKILL.md file dependency, not a schema field dependency. schemaDepends: [].

---

## Contract Review

✅ **Contract review passed** — all 5 ACs addressed by SKILL.md content. schemaDepends is empty (no pipeline-state.json field dependencies from inf.1).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As/Want/So with named persona | ✅ | P-Founder |
| H2 | ≥3 ACs in GWT format | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 12 tests covering all 5 ACs |
| H4 | Out-of-scope populated | ✅ | infra-plan, automated blast-radius, code review excluded |
| H5 | Benefit linkage references named metric | ✅ | T3-M2 — Blast-radius declaration coverage |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | Review PASS, 0 findings |
| H8 | Test plan covers all ACs | ✅ | 0 uncovered ACs |
| H8-ext | Schema dependency check | ✅ | schemaDepends: [] — no schema field dependencies from inf.1 |
| H9 | Architecture Constraints populated; no Cat E HIGH | ✅ | ADR-004, ADR-011 — no HIGH findings |
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
| W1 | NFRs populated | ✅ | Security (secrets check mandatory); Audit (path convention) |
| W2 | Scope stability | ✅ | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Solo-founder; operator self-reviews — acknowledged |
| W5 | No UNCERTAIN items in gap table | ✅ | No gaps |

---

## Oversight

**Level:** Medium (per infra-track.md — new SKILL.md, PR required)
**Action:** Solo-founder; Hamish King is operator and reviewer — awareness confirmed.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: inf.2 — Write infra-review SKILL.md with DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY severity scale
Story artefact: artefacts/2026-06-22-skills-infra-migration-tracks/stories/inf.2.md
Test plan: artefacts/2026-06-22-skills-infra-migration-tracks/test-plans/inf.2-test-plan.md
Test file: tests/check-inf2-infra-review-skill.js
Test runner: node tests/check-inf2-infra-review-skill.js

Goal:
Make every test in tests/check-inf2-infra-review-skill.js pass. Write .github/skills/infra-review/SKILL.md with: three-severity scale (DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY), explicit acknowledgement for DESTRUCTIVE, tier-coherence check (prod-before-CI → ADVISORY), secret pattern check (password=, token=, secret= → REVERSIBLE-HIGH), PASS condition on zero unacknowledged findings at documented output path, zero hardcoded tool CLI commands in required steps.

Constraints:
- Touch: .github/skills/infra-review/SKILL.md (new)
- Do NOT touch: src/, scripts/, bin/, inf.1 SKILL.md, pipeline-state files
- ADR-004: No tool CLI commands (terraform, pulumi, kubectl, etc.) in required steps
- ADR-011: Governed file; PR required before merge
- Severity scale is infra-specific (DESTRUCTIVE/REVERSIBLE-HIGH/ADVISORY) — distinct from /review's HIGH/MEDIUM/LOW; no conflict
- DESTRUCTIVE must require explicit operator acknowledgement (not just surfacing)
- Secrets check is MANDATORY in the checklist, not optional
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when tests pass

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness
**Signed off by:** Hamish King — Operator / Platform Maintainer — 2026-06-25
