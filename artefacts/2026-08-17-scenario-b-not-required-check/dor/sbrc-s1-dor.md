# Definition of Ready Checklist

## Definition of Ready: Add "Scenario B E2E (staging)" to master's required status checks

**Story reference:** artefacts/2026-08-17-scenario-b-not-required-check/stories/sbrc-s1-add-scenario-b-to-required-checks.md
**Test plan reference:** artefacts/2026-08-17-scenario-b-not-required-check/test-plans/sbrc-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "repo maintainer relying on CI gates to catch regressions" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 3/3, reusing existing test files exactly as the story specifies |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Restores `b2`'s own AC1 guarantee |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — exact `gh api` ruleset PATCH pattern specified, matching `a5`'s own precedent |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | GitHub configuration change, not application UI |
| H-NFR | NFR profile or explicit "None" field | ✅ | Story states "None identified" for Performance/Accessibility; Security/Audit explicitly addressed inline |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No code, no adapters |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ | This is a real production GitHub branch-protection ruleset change — the operator explicitly authorized it in-session before it was performed ("Continue all, including sbrc-s1", following an earlier explicit flag that this action needed separate go-ahead) | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[]` (none declared by the story)
**Matched standards files:** None

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add "Scenario B E2E (staging)" to master's required status checks — artefacts/2026-08-17-scenario-b-not-required-check/stories/sbrc-s1-add-scenario-b-to-required-checks.md
Test plan: artefacts/2026-08-17-scenario-b-not-required-check/test-plans/sbrc-s1-test-plan.md

Goal:
Add exactly one entry, {"context": "Scenario B E2E (staging)"}, to ruleset
14979696's required_status_checks array. Do not remove or modify any other
entry or rule in the ruleset.

Constraints:
- Fetch the current ruleset via gh api repos/heymishy/skills-repo/rulesets/14979696, build a PUT body preserving every existing field (name, target, enforcement, conditions, rules, bypass_actors) with only the new required_status_checks entry appended, and PUT it back via gh api --method PUT.
- Do NOT create a new ruleset. Do NOT touch any source file -- this is a config-only change.
- Re-run tests/check-b2-ci-gate-config.js and tests/check-a5-ci-gate-config.js (both existing files) to confirm T12 passes in both and no regression occurred.
- No PR needed -- this touches zero repo files besides artefacts/pipeline-state.json bookkeeping.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only) — but the underlying production infra action itself required, and received, explicit operator authorization in-session, separate from and in addition to this DoR sign-off
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-11

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
