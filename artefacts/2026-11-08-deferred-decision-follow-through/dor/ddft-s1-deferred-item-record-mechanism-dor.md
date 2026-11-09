## Definition of Ready: Deferred-item record mechanism (generalized schema)

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s1-deferred-item-record-mechanism.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s1-deferred-item-record-mechanism-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

**Review:** PASS — Run 1, 2026-11-09 (0 HIGH, 0 MEDIUM, 0 LOW)
**Test plan:** 7 tests covering 4 ACs (2 unit, 4 integration, 1 NFR)
**Verification script:** 5 scenarios

---

## Contract Review

✅ **Contract review passed** — proposed implementation (extending `scripts/lib/incident-store.js` and `workspace/incidents.json` in place, two real seeded records) aligns with all 4 ACs. No mismatch found between the Contract Proposal and the story's own ACs/test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a delivery engineer / platform owner reviewing what's been deferred" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 all covered (unit + integration) |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | "Deferred-item record mechanism existence" |
| H6 | Complexity is rated | ✅ | Rating: 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1 PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | No gaps — "No gaps" stated in test plan |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names upstream `itar-s1` (not "None"). `schemaDepends: ["dorStatus"]` declared — this story's implementation start gates on `itar-s1.dorStatus === "signed-off"`, which is a real field on `pipeline-state.schema.json`'s story definition (`properties.features.items.properties.stories.items.properties`: id, epic, testPlan, dorStatus, dorArtefact, dorContractArtefact, dorSignedOffAt, hasInfraTrack, hasMigrationTrack, infraPlanPath, migrationReviewPath). Field present — PASS. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (reuse check / ADR-026, file location, dependency note); no Category E findings in Run 1 review |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story's test plan is typed `CSS-layout-dependent` |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-deferred-decision-follow-through/nfr-profile.md` exists |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR with a named regulatory clause applies to this story |
| H-NFR3 | Data classification field not blank | ✅ | "Internal — non-public but low sensitivity" checked in nfr-profile.md |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section is populated (not "None"); feature NFR profile exists |
| H-GOV | Governance approval check | ✅ | `discovery.md`'s `## Approved By`: "Hamish King — Platform Owner — 2026-11-08" — named, non-blank, non-engineering role. **M1 signal: positive** (clearly non-engineering: Platform Owner) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | This story introduces no new injectable adapter (`setX()` function) |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent/false on this story |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent/false on this story |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent/false on this story |

**All hard blocks: 18/18 passed (4 N/A, correctly skipped per their own trigger conditions).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No MEDIUM findings exist for this story | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No independent reviewer exists in this solo-operator project | Acknowledged — RISK-ACCEPT logged in `decisions.md` (2026-11-09, covers all 5 of this feature's stories at once) |
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
Story: Deferred-item record mechanism (generalized schema) — artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s1-deferred-item-record-mechanism.md
Test plan: artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s1-deferred-item-record-mechanism-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Extend scripts/lib/incident-store.js in place — do not create a parallel storage mechanism or rename workspace/incidents.json.
- Add exactly the 5 new fields the story specifies (type, source, revisitCondition, linkedFeature, linkedStory) — do not generalize the schema beyond incident | deferred-item typing (explicitly out of scope per the parent epic).
- Do not fix tfhc-s1 or resolve the C1-vs-Option-C contradiction — register them as records only.
- Architecture standards: read `.github/architecture-guardrails.md` before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs (ADR-026 reuse-over-new-entity applies directly here).
- This story must land before ddft-s2, ddft-s3, ddft-s4, and ddft-s5 can start (all four depend on this schema).
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint; no second engineering role exists to separately notify)
**Signed off by:** Not required
