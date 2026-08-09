# Definition of Ready: Wire the agent-driven mode into CI against real staging

**Story reference:** artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s4-agent-driven-ci-wiring.md
**Test plan reference:** artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s4-test-plan.md
**Contract proposal:** artefacts/2026-08-09-rubber-duck-review-capture/dor/rdrc-s4-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "developer/operator running the outer loop" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | All 5 ACs covered |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 named exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Tier 1 Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1's real-CI-run gap explicitly acknowledged in test plan |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: Upstream `rdrc-s3`. `schemaDepends: ["acVerified", "dodStatus"]` declared below — both fields confirmed present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018, real-staging constraint, curated-scope constraint all cited and independently verified real; review Category E: 0 findings |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent ACs; this is itself an E2E-infrastructure story, tooling already configured |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-09-rubber-duck-review-capture/nfr-profile.md |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance NFRs |
| H-NFR3 | Data classification field not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence (story declares real NFRs) | ✅ | Profile exists at the path above |
| H-GOV | Discovery `## Approved By` has ≥1 non-blank named entry | ✅ | Same as rdrc-s1 — M1 signal already recorded for this feature |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No `setX()` adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**Dependency declaration (H8-ext):** `schemaDepends: ["acVerified", "dodStatus"]` — this story does not begin implementation until `rdrc-s3`'s `acVerified`/`dodStatus` fields confirm its AC3 minimum detection rate was met.

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | Stable, conditional on Story 3's signal | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review had 0 MEDIUM findings | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged — RISK-ACCEPT-1 in decisions.md (covers all 5 rdrc stories) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Gap has an explicit handling decision | — |

---

## Standards injection

Domain tags: `[web-ui]` — matched against `.github/standards/index.yml`.
Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`

These are appended to the coding agent instructions block below under a `## Applicable standards` reference (the coding agent must read this file before implementing, per this repo's standard practice — full text not duplicated here to keep this artefact concise).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Wire the agent-driven mode into CI against real staging — artefacts/2026-08-09-rubber-duck-review-capture/stories/rdrc-s4-agent-driven-ci-wiring.md
Test plan: artefacts/2026-08-09-rubber-duck-review-capture/test-plans/rdrc-s4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Do NOT begin this story until rdrc-s3's AC3 minimum detection rate is
  confirmed met (check pipeline-state.json's rdrc-s3 acVerified/dodStatus
  fields).
- New job in .github/workflows/e2e.yml must match scenario-a-staging-e2e's
  exact shape: timeout-minutes: 10, concurrency: deploy-group, the same
  E2E_STAGING_* secret names, the same opt-in flag pattern in context.yml
  (audit.staging_e2e_scenario_a-style), and the mgar-s1 force-on step
  invoked before any step that makes a real LLM call.
- Findings output must go somewhere an operator actually reviews (job
  summary, artifact, or an explicit manual capture-log.md step) — never
  auto-create a story, issue, or PR from findings (AC4, discovery's
  explicit Out of Scope).
- Curated scope only for this version — do not attempt blanket coverage of
  every shipped feature.
- Architecture standards: read `.github/architecture-guardrails.md` before
  implementing.
- Open a draft PR when automated tests pass — do not mark ready for review.
  AC1's real-CI-run confirmation happens post-merge, following the exact
  precedent already used to verify mgar-s1's AC5 (a real PR's CI run,
  inspected via `gh run view`).
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (domain: web-ui) — read before implementing
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — tech lead (operator) awareness required.
**Signed off by:** N/A — proceed directly per Medium oversight rules.

**PROCEED: Yes**
