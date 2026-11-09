## Definition of Ready: Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
**Test plan reference:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s2-patch-programme-and-workflow-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Proposal

See `artefacts/2026-11-08-programme-entry-points/dor/pep-s2-patch-programme-and-workflow-dor-contract.md` for the full proposal.

## Contract Review

✅ **Contract review passed** — the proposed implementation (3 governed-file patches, each traceable to a named AC) aligns with AC1-AC5. AC6 is conditional and correctly scoped in the contract as "cite or RISK-ACCEPT" rather than "freelance." Traceability sanity check confirmed: both the story's own AC1-AC3 text and this story's test plan already reflect the `/review` Run 2 fix pinning the threshold at **≥4 epics** — no stale "a defined threshold" language survives in either artefact.

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: "platform maintainer validating skill readiness" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1-AC5 have unit/integration coverage; AC6 has a manual scenario (Untestable-by-nature, explicitly acknowledged — not silently skipped) |
| H4 | Out-of-scope populated | ✅ | 2 items listed |
| H5 | Benefit linkage references a named metric | ✅ | "Qualification-gate fix validated against a real case; Routing visibility for a genuine big-bet candidate" — confirmed matches `benefit-metric.md`'s "Metric 1" and "Metric 2" titles exactly |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review/pep-s2-review-2.md — PASS, 0 HIGH (the Run 1 HIGH finding on the unpinned threshold was resolved and re-reviewed) |
| H8 | Test plan has no uncovered ACs | ✅ | AC6's gap is explicitly classified (Untestable-by-nature) with a manual-scenario handling, not silently uncovered |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block lists pep-s1 as upstream (not "None") — `schemaDepends: []` is declared in the DoR contract. The pep-s1→pep-s2 handoff is a markdown artefact (`reference/pep-s1-dry-run-findings.md`), not a `pipeline-state.json` field, so the empty array is the correct, honest declaration — there is no field to validate against `.github/pipeline-state.schema.json`. **Correction note:** verified directly that this artefact does not exist on disk yet (pep-s1 is unimplemented) — this is expected at DoR time and is called out as an explicit sequencing assumption in the contract, not a defect. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated (governed-file PR requirement, MC-CONSIST-02, the two known patches); no Category E findings in review |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent AC exists in the test plan |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-programme-entry-points/nfr-profile.md` exists, Status: Active |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | NFR profile's Compliance table is empty; sign-off not required |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in NFR profile |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section populated; feature NFR profile exists |
| H-GOV | Governance approval | ✅ | Same discovery.md `## Approved By` as pep-s1 — "Hamish King — Platform Owner — 2026-11-08". M1 signal: positive |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No `setX()` adapter introduced — this story patches skill-instruction text, not application code |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks: 19/19 passed (15 applicable + 4 N/A by trigger condition).**

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ⚠️ | Declared as **Unstable, by design** — "AC1-AC5 are fixed, AC6's scope depends on pep-s1." This is the epic's own stated design, not an undeclared gap. Acknowledged, proceeding. | Hamish King (Platform Owner), via epic-level design note |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | — | No MEDIUM findings on pep-s2 |
| W4 | Verification script reviewed by domain expert | ⚠️ | Covered by the single shared RISK-ACCEPT entry in `decisions.md` (2026-11-09) covering all 3 of this feature's stories. | Hamish King (Platform Owner) |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | Test plan's "Test Gaps and Risks" table has 1 entry (AC6's scope depends on pep-s1's unwritten findings) with an explicit mitigation (revisit test plan if pep-s1 surfaces additional named gaps) — not an unaddressed UNCERTAIN item | — |

**Outstanding decision logged:** Covered by the same shared W4 entry referenced in pep-s1's DoR artefact — not duplicated again here.

## Standards injection

Story has an explicit `Domain` field: `[none — skill-instruction files are not a listed .github/standards/index.yml domain]`. This is the author's own explicit annotation that no domain tag applies — distinct from the field being silently absent. No standards files are matched or injected; nothing further to surface.

## READY / BLOCKED

✅ **Definition of ready: PROCEED — Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found**

Hard blocks: 19/19 passed
Warnings: 2 acknowledged (W2, W4) / 0 resolved
Oversight: **Medium**

⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent. Hamish King (Platform Owner) is the project's own tech-lead-equivalent awareness checkpoint; no formal sign-off required beyond this awareness step.

**Sequencing note (not a hard block, but material to execution order):** This story's AC6 cannot actually be implemented or tested until pep-s1's PR has merged and its write-up artefact exists and is populated. AC1-AC5 have no such dependency and may proceed independently. The coding agent should sequence AC6 last, or confirm pep-s1's artefact is present before touching AC6 at all.

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Patch /programme and /workflow for the gaps story 1 found — artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
Test plan: artefacts/2026-11-08-programme-entry-points/test-plans/pep-s2-patch-programme-and-workflow-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's own test runner (node scripts/run-all-tests.js) — no new framework.
- Governed-file PR requirement: skills/programme/SKILL.md, skills/workflow/SKILL.md, and
  skills/orient/SKILL.md are patched via branch + PR, never direct push to master, per CLAUDE.md's
  Platform change policy.
- AC6 is sequenced last: before starting it, confirm pep-s1's PR has merged and
  artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md exists and is
  populated (not a stub). AC1-AC5 do not depend on this and may proceed first.
- Any additional patch beyond the two already-known ones (the ≥4-epic signal; the /workflow
  dedup + /orient cross-reference) must trace explicitly to a named finding in pep-s1's write-up
  artefact — do not freelance further "improvements."
- Out of scope: no redesign of either skill's broader structure, even if pep-s1 finds something
  significant — that becomes a new discovery, not an expanded version of this story.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not
  introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the
  ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only)
**Signed off by:** Hamish King (Platform Owner) — awareness confirmed, 2026-11-09
