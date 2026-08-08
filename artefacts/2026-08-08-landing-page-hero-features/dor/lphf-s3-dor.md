## Definition of Ready: Cryptographic instruction-set verification hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s3-cryptographic-verification-hero-card.md
**Test plan reference:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s3-test-plan.md
**Review artefact:** artefacts/2026-08-08-landing-page-hero-features/review/lphf-s3-review-1.md
**Contract Proposal:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s3-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-08

---

## Contract Review

✅ **Contract review passed** — implementation aligns with all 3 ACs (AC2 uses the post-review reworded assertion).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: tech lead with compliance/risk responsibility |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 2 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 1 MEDIUM (resolved), 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | Not required |
| H9 | Architecture Constraints populated | ✅ | References `MC-SEC-02` guardrail explicitly |
| H-E2E | Layout-dependent AC without E2E tooling | ✅ | AC3 covered by real E2E test |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval | ✅ | Same as lphf-s1/s2 |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not applicable |
| H-INF | Infra-plan gate | ✅ | Not applicable |
| H-MIG | Migration-review gate | ✅ | Not applicable |

**Verdict: READY — 18/18 hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | Finding 1-M1 resolved directly (AC2 reworded) | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not yet reviewed | Pending |
| W5 | No UNCERTAIN gap-table items | ✅ | No gaps | — |

---

## Standards Injection

Domain tags: `[ui]`
Matched standards files: `.github/standards/ui/ui-standards.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Cryptographic instruction-set verification hero card — artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s3-cryptographic-verification-hero-card.md
Test plan: artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond the ACs.

Constraints:
- CJS only
- Files in scope: src/web-ui/templates/landing.html only
- The illustrative hash value must be real (from this repo's trace history)
  or clearly marked illustrative — not a fabricated-looking placeholder
- Architecture standards: read .github/architecture-guardrails.md
- Applicable standards: .github/standards/ui/ui-standards.md (domain: ui)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity: add a PR comment, do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
