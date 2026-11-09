# Definition of Ready: Triage drafting via structured-field Jaccard matching

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
**Test plan reference:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s2-triage-drafting-test-plan.md
**Assessed by:** AI (Claude Sonnet 5)
**Date:** 2026-11-09

---

## Contract Review

✅ Contract review passed — the proposed implementation (see `itar-s2-triage-drafting-dor-contract.md`) aligns with all 4 ACs. The export of `_jaccard` and the unpinned-but-named threshold constant match the story's own Architecture Constraints exactly. No mismatch found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "delivery engineer responding to an alert" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 5 unit + 1 integration; AC2: 1 unit + 1 integration; AC3: 1 unit; AC4: 2 unit. The `jaccardSimilarity_isExportedAndCallable` test exists but currently fails (red) — this is expected pre-implementation TDD state, not an H3 violation. H3 checks test *existence/coverage*, not test *passing*. |
| H4 | Out-of-scope populated | ✅ | 2 items named |
| H5 | Benefit linkage references a named metric | ✅ | "Triage drafting" |
| H6 | Complexity rated | ✅ | 2 |
| H7 | No unresolved HIGH findings | ✅ | review-1.md: PASS, 0 HIGH (1 MEDIUM, acknowledged — see W3 below) |
| H8 | No uncovered ACs | ✅ | Coverage gaps table: "None" |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: Upstream "itar-s1" — `schemaDepends: [id, tags, status, priorIncidentLinks]` declared in the DoR contract against itar-s1's own `INCIDENT` data-model definition (not `pipeline-state.schema.json` — this dependency flows through the new `workspace/incidents.json` schema, a separate file from pipeline-state.json). All 4 fields confirmed present in itar-s1's data-model canvas marker. See contract's "Cross-story schema dependency" section for the full reasoning on why the literal `pipeline-state.schema.json` check does not apply to this dependency shape. |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 4 bullets incl. the newly-found `_jaccard` export gap; review found no Category E HIGH |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | No CSS-layout-dependent AC in this story (no UI) |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-11-08-incident-triage-and-respond/nfr-profile.md` |
| H-NFR2 | Compliance NFR w/ clause has sign-off | ✅ N/A | No compliance NFR with a named regulatory clause in this story |
| H-NFR3 | Data classification not blank | ✅ | "Internal" checked in nfr-profile.md |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section is populated (not None); profile exists |
| H-GOV | Approved By ≥1 non-blank named entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" (M1: positive signal) |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | This story introduces no injectable adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set for itar-s2 |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | Stable |
| W3 | MEDIUM findings acknowledged | ✅ | Unpinned Jaccard threshold could stall /test-plan for lack of a concrete value | Already acknowledged — see `decisions.md` 2026-11-09 ASSUMPTION entry ("itar-s2 Jaccard threshold acknowledgement"). Not a fresh gap; cited, not re-logged. |
| W4 | Verification script reviewed by domain expert | ⚠️ | Unreviewed script may miss edge cases | Acknowledged via RISK-ACCEPT, see `decisions.md` 2026-11-09 entry (covers all 4 stories in this feature) |
| W5 | No UNCERTAIN gap-table items left | ✅ | — | Gap table: "None"; the one genuinely open item (threshold value) is in Test Gaps and Risks, explicitly acknowledged above, not an UNCERTAIN gap-table item |

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Triage drafting via structured-field Jaccard matching — artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s2-triage-drafting.md
Test plan: artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s2-triage-drafting-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Export _jaccard from src/modules/drift-comparator.js (preferred: as jaccardSimilarity) with NO change to its internal behaviour — it stays case-sensitive, no normalization; normalization already happens at itar-s1's capture time
- Define the domain threshold as a named, exported constant (e.g. INCIDENT_JACCARD_THRESHOLD) — do not hardcode a literal anywhere, including in tests. Tune it empirically against real/fixture incident tag sets per the logged /decisions revisit trigger (2026-11-09 ASSUMPTION entry)
- AC3 ("no match") and AC4 ("cannot score") must produce distinct, explicitly different result states — never collapse them into one generic shape
- product/constraints.md #13: assert the triageSummary field was actually persisted on the record in the store, not just returned in-memory by the function
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint)
**Signed off by:** Not required
