## Definition of Ready: Self-registration at the moment of deferral

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s4-self-registration-at-deferral-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

**Review:** PASS — Run 2, 2026-11-09 (0 HIGH, 0 MEDIUM, 0 LOW; Run 1 had 1 HIGH — resolved, see Review Diff in `ddft-s4-review-2.md`)
**Test plan:** 5 tests covering 5 ACs (1 unit, 4 integration, 0 dedicated NFR tests)
**Verification script:** 5 scenarios (AC5 is a manual/process scenario, marked 🔴)

---

## Contract Review

✅ **Contract review passed** — proposed implementation (three independent SKILL.md patches, one per governed file) aligns with all 5 ACs, including the corrected AC3 hook point (`/definition-of-done` Step 6, not `/benefit-metric`). No mismatch found. **Confirmed directly:** AC3's test (`definitionOfDoneHookAutoRegistersRecordOnNotYetMeasuredSignal`, per the test plan) asserts the hook fires from `skills/definition-of-done/SKILL.md`'s Step 6 / State-update section and explicitly fails if wired to `/benefit-metric` instead — the Run 2 review correction is reflected all the way through to the test plan, not just the story text.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a delivery engineer / platform owner reviewing what's been deferred" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC5 all covered (AC5 via the manual/process scenario) |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | "Self-registration coverage" |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2 PASS, 0 HIGH (Run 1's 1 HIGH resolved and verified) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC5 explicitly gap-typed Untestable-by-nature with a manual scenario — not silently skipped |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names upstream `ddft-s1` (not "None"). `schemaDepends: ["dorStatus"]` declared, gating on `ddft-s1.dorStatus === "signed-off"`. Field present — PASS. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, including the explicit `[CORRECTED 2026-11-09 at /review]` note on the hook-count/hook-identity correction; Run 2 review found no Category E findings |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC typed `CSS-layout-dependent` |
| H-NFR | NFR profile exists | ✅ | Exists |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR with a named regulatory clause applies |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" checked |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section populated; feature profile exists |
| H-GOV | Governance approval check | ✅ | Same as ddft-s1 — PASS, M1 positive |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | This story patches three SKILL.md instruction files — it does not introduce a new runtime `setX()`-style injectable adapter. D37 does not apply. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent/false |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent/false |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent/false |

**All hard blocks: 18/18 passed (4 N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No MEDIUM findings (the Run 1 finding was HIGH, resolved in Run 2) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No independent reviewer exists in this project | Acknowledged — same RISK-ACCEPT in `decisions.md` covering all 5 of this feature's stories |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | — |

**1 warning acknowledged (W4), 4 passed cleanly.**

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Self-registration at the moment of deferral — artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
Test plan: artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s4-self-registration-at-deferral-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- This is THREE separate governed-file PRs (skills/discovery/SKILL.md, skills/decisions/SKILL.md, skills/definition-of-done/SKILL.md), not one combined PR — CLAUDE.md's Platform change policy requires each on its own branch, reviewed independently.
- AC3's hook is skills/definition-of-done/SKILL.md's Step 6 ("Metric signal") / State-update section — NOT skills/benefit-metric/SKILL.md. This was corrected at /review (2026-11-09) after a HIGH finding; do not revert to the original (incorrect) hook under any circumstance.
- Do not change the three skills' existing conversational flow, question ordering, or operator-facing prompts — additive within the existing final-step section only.
- Do not retroactively register any past deferral — new deferrals going forward only.
- Every hook must write via ddft-s1's single scripts/lib/incident-store.js mechanism — do not invent a separate storage path for any of the three.
- Each of the three hooks' test suite must be verified to pass independently — do not assume one passing test implies the other two work (AC5).
- This story requires ddft-s1 to have shipped first — do not begin until ddft-s1's PR has merged.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing.
- Open a draft PR for each of the three patches when its tests pass — do not mark any ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint; no second engineering role exists to separately notify). Given this story's wider blast radius (per the epic's own oversight rationale — three governed skill files shaping every future `/discovery`, `/decisions`, and `/definition-of-done` session), the operator should personally review each of the three PRs' diffs before merge, even though no formal named sign-off is required by the Medium tier.
**Signed off by:** Not required
