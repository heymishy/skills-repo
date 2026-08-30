# Definition of Ready Checklist

## Definition of Ready: Fall back to 'success' per-stage when a journey-wide mock scenario has no fixture for that stage

**Story reference:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/stories/msps-s1-per-stage-fixture-existence-fallback.md
**Test plan reference:** artefacts/2026-08-30-mock-scenario-per-stage-fallback/test-plans/msps-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Same persona as mgss-s1 |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 2 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct correctness fix against mgss-s1, short-track |
| H6 | Complexity is rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependency: mgss-s1 (merged) — no schema field dependency |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Adds a pure existence check rather than weakening the existing throw contract |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-mock-scenario-per-stage-fallback/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap as prior stories this session | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction, confirmed live during Chrome verification of s5. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | `hasFixture` is a pure read-only check, not an injectable adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 18/18 (16 direct passes + 1 explicit N/A + 1 transparent GAP note).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 1 found 0 MEDIUM | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Every AC is automated | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's Coverage gaps section is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Per-stage fixture-existence fallback — artefacts/2026-08-30-mock-scenario-per-stage-fallback/stories/msps-s1-per-stage-fixture-existence-fallback.md
Test plan: artefacts/2026-08-30-mock-scenario-per-stage-fallback/test-plans/msps-s1-test-plan.md
DoR contract: artefacts/2026-08-30-mock-scenario-per-stage-fallback/dor/msps-s1-dor-contract.md

Goal:
Add hasFixture(stage, scenarioName) to mock-llm-gateway.js and use it in
journey.js's _mockScenarioForStage to fall back to undefined (-> 'success')
when journey.e2eMockScenario has no fixture for the current stage, instead
of applying it unconditionally.

Constraints:
- Do not change getMockResponse's own throw-on-unrecognized-scenario behavior.
- Do not add pass-through discovery/benefit-metric diagram-showcase fixtures.
- Do not touch routes/products.js.
- Run the full suite (node scripts/run-all-tests.js) and confirm no other
  regressions.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — internal test/dev-tooling correction, gated entirely behind the mock gateway.
**Sign-off required:** No (Low — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — requested this fix directly in-session, 2026-08-30, immediately after the live Chrome reproduction of the underlying defect.
