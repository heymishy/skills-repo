## Definition of Ready: Scope-contract enforcement hero card

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s2-scope-contract-enforcement-hero-card.md
**Test plan reference:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s2-test-plan.md
**Review artefact:** artefacts/2026-08-08-landing-page-hero-features/review/lphf-s2-review-1.md
**Contract Proposal:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s2-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-08

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 3 ACs; each verification approach matches the test plan exactly.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: individual developer with agentic-coding scars |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ | M1 — signup conversion rate |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | Review run 1: 0 HIGH, 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency | ✅ | No Dependencies block — not required |
| H9 | Architecture Constraints populated, no Category E HIGH | ✅ | References `MC-SEC-02` guardrail explicitly |
| H-E2E | Layout-dependent AC without E2E tooling | ✅ | AC3 is layout-dependent but E2E tooling (Playwright) is configured — covered by a real E2E test, not blocked |
| H-NFR | NFR profile exists | ✅ | |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not applicable |
| H-NFR3 | Data classification not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval | ✅ | Same discovery artefact as lphf-s1 — Approved By populated |
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
| W3 | MEDIUM findings acknowledged | ✅ | None on this story | — |
| W4 | Verification script reviewed by domain expert | ⚠️ | Not yet reviewed | Pending — recommend before assigning |
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
Story: Scope-contract enforcement hero card — artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s2-scope-contract-enforcement-hero-card.md
Test plan: artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CJS only, matching this repo's convention
- Files in scope: src/web-ui/templates/landing.html only
- Do NOT touch html-shell.js or kanban-view.js
- Do NOT build an interactive demo — this is a static content card
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
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
