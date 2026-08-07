# Definition of Ready: Render discovery scope and feature/epic taxonomy grouping (pr-s7)

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s7.md
**Test plan reference:** artefacts/2026-07-16-product-rollup/test-plans/pr-s7-test-plan.md
**Contract:** artefacts/2026-07-16-product-rollup/dor/pr-s7-dor-contract.md
**Assessed by:** Claude (agent)
**Date:** 2026-07-17

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs, including the corrected, self-contained AC4 (split from the original at review finding 7-M1).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As/Want/So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given/When/Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 8 tests across 4 ACs, no gaps |
| H4 | Out-of-scope section is populated | ✅ | Full artefact rendering, taxonomy editing both correctly deferred |
| H5 | Benefit linkage field references a named metric | ✅ | Metric 1 |
| H6 | Complexity is rated | ✅ | Rating 2 (explicitly justified — more edge-case surface than pr-s4/s5/s6), Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 2 MEDIUM (both fixed same-session: AC4 split, ADR-018 added) |
| H8 | Test plan has no uncovered ACs | ✅ | All 4 ACs covered, no gaps. The cross-story consistency check is correctly tracked at the epic level, not counted as a story-level gap. |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block lists upstream pr-s2. `schemaDepends: []` — reads pr-s2's cache table directly. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-018 cited; Category E score 3/5 in review, no HIGH |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs — N/A |
| H-NFR | NFR profile exists or story has `NFRs: None` | ✅ | `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has human sign-off | ✅ | No compliance NFRs apply |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | NFR profile presence check | ✅ | Story declares NFRs; profile exists |
| H-GOV | Governance approval check | ✅ | Discovery `## Approved By`: non-blank, not engineer-only |
| H-ADAPTER | Injectable adapter wiring check (D37) | N/A | No new injectable adapter introduced by this story |
| H-INF | Infra-plan gate check | N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | N/A — populated |
| W2 | Scope stability declared | ✅ | — | N/A — "Stable" |
| W3 | MEDIUM review findings acknowledged | ✅ | — | N/A — findings 7-M1, 7-M2 were fixed, not just acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Accepted — see `decisions.md`, RISK-ACCEPT entry covering all 7 stories, 2026-07-17 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | The one remaining gap (cross-story consistency check) has an explicit mitigation — tracked at the epic level, not left "unaddressed" |

---

## Oversight level

**High** (per `pr-e2-dimensions.md`) — solo-operator posture. Named sign-off required.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## READY / BLOCKED determination

## ✅ READY — all hard blocks pass, all warnings resolved or explicitly acknowledged.

Reminder: `pr-e2-dimensions.md`'s "Epic-level integration check" must be run once both pr-s4 and pr-s7 are implemented — this is not a blocker for either story's individual DoR sign-off, but should not be forgotten once both merge.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render discovery scope and feature/epic taxonomy grouping — artefacts/2026-07-16-product-rollup/stories/pr-s7.md
Test plan: artefacts/2026-07-16-product-rollup/test-plans/pr-s7-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Handle both epics[].stories[] (epic-nested) and flat feature.stories[]
  structures correctly. Watch specifically for features that have BOTH a
  non-empty epics[].stories[] AND a stale/empty top-level stories: [] field
  (this platform's own real pipeline-state.json has features shaped this
  way) — such a feature must be counted once, under its epic, never also
  listed as ungrouped.
- AC4 asserts THIS story's own total count against pr-s2's cache record
  total only — do not attempt to compare against pr-s4's rendered output;
  that cross-story check is tracked separately at the epic level
  (pr-e2-dimensions.md), not as part of this story.
- Full discovery-artefact content must not render inline — a one-line
  summary or link only.
- This view is read-only — no taxonomy editing/reorganising UI.
- Use proper heading hierarchy for epic groups vs. feature items
  (accessibility — screen reader navigation).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: High
```

---

## Sign-off

**Oversight level:** High
**Sign-off required:** Yes
**Signed off by:** Hamish King — Founder/Operator — 2026-07-17
