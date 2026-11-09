## Definition of Ready: Bottom-up programme-candidate detection script (epic-count primary signal)

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
**Test plan reference:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s3-bottom-up-detection-script-test-plan.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Proposal

See `artefacts/2026-11-08-programme-entry-points/dor/pep-s3-bottom-up-detection-script-dor-contract.md` for the full proposal.

## Contract Review

✅ **Contract review passed** — the proposed implementation (a standalone read-only detection script) aligns with all 4 ACs. Traceability sanity check confirmed: the story's AC1 and its Architecture Constraints both already state the concrete **≥4 epics** threshold (with the `[CORRECTED 2026-11-09 at /review, see decisions.md]` annotation), and the test plan's unit tests assert the same literal value — no stale "a defined threshold" language survives in either artefact.

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: "platform maintainer validating skill readiness" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test in test plan | ✅ | AC1-AC4 each have unit + integration coverage |
| H4 | Out-of-scope populated | ✅ | 3 items listed |
| H5 | Benefit linkage references a named metric | ✅ | "Bottom-up detection heuristic validity (meta)" — confirmed matches `benefit-metric.md`'s "Meta Metric 2: Bottom-up detection heuristic validity" exactly |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings | ✅ | review/pep-s3-review-2.md — PASS, 0 HIGH (Run 1 HIGH finding on the unpinned threshold was resolved and re-reviewed) |
| H8 | Test plan has no uncovered ACs | ✅ | "Coverage gaps: None" |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" (Upstream) — no upstream dependency — schema check not required. (This story's own Downstream note, that pep-s2 reuses its threshold, is a value-level coordination in `decisions.md`, not a schema-field flowing *into* pep-s3 — H8-ext concerns this story's own upstream dependencies, which are none.) |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated (product/constraints.md #11, ADR-011/Artefact-first, CLAUDE.md Platform change policy, the corrected threshold rationale); no Category E findings in review |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent AC — CLI output only |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-programme-entry-points/nfr-profile.md` exists, Status: Active |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | NFR profile's Compliance table is empty; sign-off not required |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in NFR profile |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section populated; feature NFR profile exists |
| H-GOV | Governance approval | ✅ | Same discovery.md `## Approved By` as pep-s1/pep-s2 — "Hamish King — Platform Owner — 2026-11-08". M1 signal: positive |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | Story's own Architecture Constraints explicitly state: "No new injectable adapter — this is a standalone read-only script... no new D37 surface." Confirmed no `setX()` function is introduced. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks: 19/19 passed (15 applicable + 4 N/A by trigger condition).**

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Declared as **Stable** — this story's scope does not depend on pep-s1's findings (unlike pep-s2's AC6), so "Stable" is accurate, not just asserted. | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | — | No MEDIUM findings on pep-s3 |
| W4 | Verification script reviewed by domain expert | ⚠️ | Covered by the single shared RISK-ACCEPT entry in `decisions.md` (2026-11-09) covering all 3 of this feature's stories. | Hamish King (Platform Owner) |
| W5 | No UNCERTAIN gap-table items left unaddressed | ✅ | Test plan's "Test Gaps and Risks" table has 1 entry (only 2 real historical data points exist to validate against) with an explicit mitigation (logged as the trigger for a future `/decisions` revisit once real data exists, not a statistical validation claim) — not an unaddressed UNCERTAIN item | — |

**Outstanding decision logged:** Covered by the same shared W4 entry referenced in pep-s1's DoR artefact — not duplicated again here.

## Standards injection

Story has no `domain` field — skipped silently.

## READY / BLOCKED

✅ **Definition of ready: PROCEED — Bottom-up programme-candidate detection script (epic-count primary signal)**

Hard blocks: 19/19 passed
Warnings: 1 acknowledged (W4) / 0 resolved
Oversight: **Medium**

⚠️ **Medium oversight** — share this DoR artefact with the tech lead before assigning to the coding agent. Hamish King (Platform Owner) is the project's own tech-lead-equivalent awareness checkpoint; no formal sign-off required beyond this awareness step.

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Bottom-up programme-candidate detection script (epic-count primary signal) — artefacts/2026-11-08-programme-entry-points/stories/pep-s3-bottom-up-detection-script.md
Test plan: artefacts/2026-11-08-programme-entry-points/test-plans/pep-s3-bottom-up-detection-script-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's own test runner (node scripts/run-all-tests.js) — no new framework.
- CLAUDE.md Platform change policy: the new file under scripts/ is merged via branch + PR, not
  committed directly to master.
- The epic-count threshold is ≥4 (inclusive) — do not use >4 or re-derive a different number.
- Never compute or store a timeline/calendar-span signal anywhere in the script's output, even
  unused — a dedicated unit test exists specifically to catch this regression.
- Out of scope: no automated escalation into a programme.md artefact, no web-UI rendering, no
  claim of statistical validation beyond the 2 known historical cases.
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
