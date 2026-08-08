## Definition of Ready: Golden trace demo — a real idea-to-shipped-code chain, walked in four frames

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s1-golden-trace-demo.md
**Test plan reference:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s1-test-plan.md
**Review artefact:** artefacts/2026-08-08-landing-page-hero-features/review/lphf-s1-review-1.md
**Contract Proposal:** artefacts/2026-08-08-landing-page-hero-features/dor/lphf-s1-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-08

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs; each AC's verification approach matches the corresponding test plan entry exactly (AC1→unit, AC2→2 unit tests, AC3→manual pre-merge check, AC4→unit).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: engineering/tech lead evaluating adoption |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC3 covered by manual scenario (Untestable-by-nature gap type, correctly classified) |
| H4 | Out-of-scope section is populated | ✅ | 4 items |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — signup conversion rate |
| H6 | Complexity is rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 1 LOW (non-blocking) |
| H8 | Test plan has no uncovered ACs | ✅ | AC3's gap is explicitly acknowledged with a manual scenario, not silently skipped |
| H8-ext | Cross-story schema dependency check | ✅ | No Dependencies block declared (implicitly None) — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 3 constraints; review Category E found no violations |
| H-E2E | CSS-layout-dependent AC without E2E tooling | ✅ | Not applicable — this story has no CSS-layout-dependent AC |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-08-landing-page-hero-features/nfr-profile.md |
| H-NFR2 | Compliance NFR with named regulatory clause has sign-off | ✅ | Not applicable — no compliance NFRs |
| H-NFR3 | Data classification field not blank | ✅ | Public |
| H-NFR-profile | NFR profile presence check | ✅ | Present |
| H-GOV | Governance approval check | ✅ | Approved By: Hamish King — Founder/Operator — 2026-08-08 (M1 signal: role unverified for non-engineering sign-off) |
| H-ADAPTER | Injectable adapter wiring check | ✅ | Not applicable — no injectable adapters introduced |
| H-INF | Infra-plan gate | ✅ | Not applicable — hasInfraTrack not set |
| H-MIG | Migration-review gate | ✅ | Not applicable — hasMigrationTrack not set |

**Verdict: READY — 18/18 hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | No MEDIUM findings on this story | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script not yet reviewed by a human before coding begins | Pending — recommend review before assigning |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | AC3's gap is explicitly classified and handled | — |

---

## Standards Injection

Domain tags: `[ui]`
Matched standards files: `.github/standards/ui/ui-standards.md`
These are appended to the Coding Agent Instructions block below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Golden trace demo — artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s1-golden-trace-demo.md
Test plan: artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- CJS only (require/module.exports), matching this repo's convention
- Files in scope: src/web-ui/templates/landing.html, and optionally a new
  sibling content file for the two candidates' data (coding agent's choice
  of exact mechanism — see Contract Proposal Assumptions)
- Do NOT touch src/web-ui/utils/html-shell.js or src/web-ui/views/kanban-view.js
- Do NOT implement a live query against pipeline-state.json or GitHub
- Do NOT build a runtime env-var toggle or CMS-like mechanism — the
  candidate selector must be a simple build-time constant
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce anti-patterns or violate mandatory
  constraints or Active ADRs.
- Applicable standards: .github/standards/ui/ui-standards.md (domain: ui)
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required
