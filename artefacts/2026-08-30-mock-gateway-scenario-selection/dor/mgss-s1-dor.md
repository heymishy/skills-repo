# Definition of Ready Checklist

## Definition of Ready: Mock-gateway scenario selection and fixture gaps

**Story reference:** artefacts/2026-08-30-mock-gateway-scenario-selection/stories/mgss-s1-mock-gateway-scenario-selection-and-fixtures.md
**Test plan reference:** artefacts/2026-08-30-mock-gateway-scenario-selection/test-plans/mgss-s1-test-plan.md
**Assessed by:** Claude (agent, short-track)
**Date:** 2026-08-30

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: operator manually verifying ACs via Chrome |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 concrete exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Direct developer-tooling improvement, short-track (no formal benefit-metric artefact) |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review Run 1: PASS, 0 findings |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Reuses existing `e2eForceFailStage` pattern; explicitly respects prior `pnfc-s1` decision not to unify the two journey-creation paths |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No layout-dependent ACs; no visible UI change |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-08-30-mock-gateway-scenario-selection/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **See note** — same recurring short-track gap as `pcr-s1`/`p35tf-s1`/`cptr-s1`/`jgcc-s1` | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction to build this. 5th occurrence now — the standing revisit trigger from `jgcc-s1`'s own DoR note applies with increasing weight. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | No injectable adapters introduced — `e2eMockScenario` is a plain journey-record field, same class as the pre-existing `e2eForceFailStage` |
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
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual/verification-script scenarios — every AC is automated | — |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan's Coverage gaps section is "None" | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Mock-gateway scenario selection and fixture gaps — artefacts/2026-08-30-mock-gateway-scenario-selection/stories/mgss-s1-mock-gateway-scenario-selection-and-fixtures.md
Test plan: artefacts/2026-08-30-mock-gateway-scenario-selection/test-plans/mgss-s1-test-plan.md
DoR contract: artefacts/2026-08-30-mock-gateway-scenario-selection/dor/mgss-s1-dor-contract.md

Goal:
Generalize journey.js's _mockScenarioForStage to support a journey-wide
e2eMockScenario override (priority over the existing single-stage
e2eForceFailStage), thread it through handlePostJourney (POST body -> first
session + persisted journey record) and handleGetJourney (?mockScenario=
query param -> hidden form field), and add a `sequence` marker to the
design/definition diagram-showcase fixtures plus new clarify.success/failure
fixtures.

Constraints:
- Do not touch routes/products.js's handlePostProductFeature.
- Do not add a clarify.diagram-showcase fixture or a sequence marker to
  ideate.diagram-showcase.json.
- Preserve e2eForceFailStage's existing single-stage behavior exactly when
  e2eMockScenario is unset.
- No new silent fallback to 'success' for an unrecognized scenario name --
  the existing "No fixture found" throw must still fire.
- No visible UI control -- the query-param-to-hidden-field mechanism only.
- Run the full suite (node scripts/run-all-tests.js) and confirm no other
  regressions.
- Open a draft PR when tests pass -- do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low — internal test/dev-tooling change, no production-facing behavior change (gated entirely behind the mock gateway, which is itself hard-disabled in production).
**Sign-off required:** No (Low — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — requested this directly in-session (mid-turn instruction, 2026-08-30) after observing the diagram-showcase/clarify fixture gaps firsthand during s5's own live-verification attempt.
