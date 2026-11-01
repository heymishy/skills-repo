# Definition of Ready Checklist: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s2-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-11-01

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona matches discovery's "Who It Affects" item 3 (platform maintainer) |
| H2 | ≥3 ACs in G/W/T | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in the test plan | ✅ | AC2 unit-tested; AC1/AC3/AC4 have explicit manual/decision-logic coverage, not silently uncovered |
| H4 | Out-of-scope populated | ✅ | 3 exclusions |
| H5 | Benefit linkage references a named metric | ✅ | m6 |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from review | ✅ | Run 1: 0 HIGH, 1 LOW |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 explicitly handled |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Dependencies block is "None" |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | "None identified — checked"; Category E scored 5/5 at `/review` |
| H-E2E | CSS-layout-dependent AC + no tooling + no RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent AC |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-01-fixture-hardening-fast-follows/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFR with a regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | `[x] Public` |
| H-NFR-profile | NFR profile presence | ✅ | Story NFRs populated (including the new least-privilege-permissions security NFR); profile exists |
| H-GOV | `## Approved By` has ≥1 named entry | ✅ | "Hamish King — Platform Owner — 2026-11-01" |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks: 15/15 passed (10 substantive + 5 N/A by trigger condition).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ | — | None to acknowledge (0 MEDIUM at `/review`) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Hamish King (solo-operator capacity) — RISK-ACCEPTed below, same precedent as every story in the parent epic |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | — | All Coverage gaps entries have a named handling mechanism |

---

## Standards injection

Story has no `domain` field — skipped silently (no clear match in `.github/standards/index.yml` for CI-workflow/GitHub-Actions work; this is never mandatory).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Stop the deploy-group concurrency lock from silently cancelling E2E coverage — artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
Test plan: artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s2-test-plan.md

Goal:
Make every test in the test plan pass. AC1 and AC3's real-trigger
half, and AC4, are explicit real-environment manual verifications
(see the test plan's Coverage gaps table) -- do not try to force
these into something testable pre-merge that they structurally
cannot be.

Constraints:
- Do not narrow the concurrency key to a per-ref scope -- this was
  already explicitly rejected as a regression (it would let two
  different PRs deploy/E2E-test against the same real wuce-staging
  app concurrently). The key must stay exactly `deploy-group` or an
  equivalent that resolves identically for every PR/ref.
- Do not make any Fly.io infrastructure or configuration change --
  confirmed unnecessary via /clarify; this is a pure GitHub Actions
  workflow-level fix.
- Do not build per-PR ephemeral environments -- explicitly out of
  scope, a bigger structural alternative.
- Any new workflow or script calling the GitHub Actions rerun
  mechanism must use the minimum permission scope needed -- review
  the `permissions:` block before finishing; do not use `write-all`
  or broaden existing workflow permissions carelessly (Security NFR).
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing it and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead awareness required (epic's own Rationale)
**Signed off by:** Hamish King, Platform Owner (solo-operator)
