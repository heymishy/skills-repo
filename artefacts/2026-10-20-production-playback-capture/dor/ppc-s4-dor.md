# Definition of Ready: Recognise pipeline-state.json DoD-complete features in self-service playback capture

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s4-pipeline-state-dod-fallback.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s4-test-plan.md
**Track:** Short-track (bug/gap fix) — discovery/benefit-metric/definition/review skipped per CLAUDE.md's short-track process; `/definition-of-done` still applies after merge.
**Assessed by:** Claude (session)
**Date:** 2026-10-25

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Tenant Product Owner |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC6 all covered |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | |
| H5 | Benefit linkage field references a named metric | ✅ | m1, m3 |
| H6 | Complexity is rated | ✅ | 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ (N/A) | Short-track — no `/review` run; no out-of-process scope expansion identified |
| H8 | Test plan has no uncovered ACs | ✅ | No gaps table entries |
| H9 | Architecture Constraints field populated | ✅ | ADR-025, ADR-020, D37, fdn-s1 |
| H-E2E | CSS-layout-dependent AC without E2E tooling/RISK-ACCEPT | ✅ (N/A) | No layout-dependent ACs — backend route logic only |
| H-CONTRACT | DoR contract's touch-point list does not exclude a file the test plan asserts against (CLAUDE.md B1/D1) | ✅ | Touch-points below include every file the test plan's integration tests assert against |

---

## DoR Contract — Touch-points

**In scope (required touchpoints, matching the test plan's own assertions):**
- `src/web-ui/routes/playback-evidence.js` — `_resolveJourney`, new `_resolveViaPipelineState`, new `_featureDodStatus`, `_getDodAcList`, `_resolveOwnerRepo` (signature change: takes `productId`/`tenantId` directly instead of a `journey` object, so it can be called before a journey exists)
- `src/web-ui/modules/product-rollup.js` — extract `fetchPipelineState` (the existing fetch+truncation-fallback+parse logic currently inlined in `syncProductRollup`) into its own exported function, reused by both `syncProductRollup` (unchanged behaviour) and this story's new fallback
- `src/web-ui/adapters/journey-store-pg.js` — add `pipelineStateStorySlugs` to `_sanitise()`'s field allowlist (fdn-s1 rule) so it survives a Postgres-backed restart
- New test file: `tests/check-ppc-s4-pipeline-state-dod-fallback.js`

**Out of scope (must have zero test assertions against them, confirmed):**
- `src/web-ui/modules/journey-store.js` — no changes; `createJourney`/`setJourneyFields`/`getJourneyByTenantProductSlug`/`isDodComplete` are reused exactly as-is
- `skills/feature-playback/*` — a different skill's own gate, unaffected
- `.github/pipeline-state.json` schema — no new fields added to the schema itself; this story only reads existing `dodStatus`/`stories`/`epics` fields

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | |
| W2 | Scope stability is declared | ✅ | Stable | |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A) | Short-track, no `/review` run | |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate verification-script artefact written for this short-track story; verified instead via the integration test suite plus a manual operator check at DoD time | RISK-ACCEPT — same standing acceptance as `ppc-s1`/`ppc-s2`/`ppc-s3` (decisions.md, 2026-10-21/22): no named second reviewer exists in this solo-operator repo |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Recognise pipeline-state.json DoD-complete features in self-service playback capture — artefacts/2026-10-20-production-playback-capture/stories/ppc-s4-pipeline-state-dod-fallback.md
Test plan: artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s4-test-plan.md

Touch-points: src/web-ui/routes/playback-evidence.js, src/web-ui/modules/product-rollup.js, src/web-ui/adapters/journey-store-pg.js, tests/check-ppc-s4-pipeline-state-dod-fallback.js
Do not modify: src/web-ui/modules/journey-store.js, skills/feature-playback/*, .github/pipeline-state.schema.json

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Operator awareness stands in for tech-lead sign-off (no named tech lead configured, solo-operator repo — same standing convention as ppc-s1/s2/s3).
**Signed off by:** Hamish King (Platform Owner), via explicit chat instruction to fix the parity gap, 2026-10-25

**Definition of ready: PROCEED**
