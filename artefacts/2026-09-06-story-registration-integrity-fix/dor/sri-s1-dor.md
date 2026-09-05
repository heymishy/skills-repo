# Definition of Ready: Fix epic/flat story render duplication and missing story registration

**Story reference:** artefacts/2026-09-06-story-registration-integrity-fix/stories/sri-s1-fix-story-render-duplication-and-missing-registration.md
**Test plan reference:** artefacts/2026-09-06-story-registration-integrity-fix/test-plans/sri-s1-test-plan.md
**Review artefact:** artefacts/2026-09-06-story-registration-integrity-fix/review/sri-s1-review-1.md
**Contract:** artefacts/2026-09-06-story-registration-integrity-fix/dor/sri-s1-dor-contract.md
**Track:** Short-track (test-plan → DoR → coding agent; discovery through review skipped per `CLAUDE.md`)
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

**Contract review:** ✅ Passed — proposed implementation aligns with all 4 ACs and the test plan; the code fix is a bounded dedupe filter, the data fix is a per-feature-verified set of registration additions (each cross-referenced against the affected story file's own `Epic reference` header, not guessed).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Operator (persona from `product/mission.md`), named |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 2, AC2: 1, AC3: 1 data-integrity, AC4: 1 manual scenario |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | References the confirmed duplication + misplacement defect and this session's own benefit-metric convention |
| H6 | Complexity is rated | ✅ | 2 (moderate — required per-file forensic cross-referencing), Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | `/review` intentionally skipped (short-track) — 0 HIGH, honestly documented, not fabricated |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | AC1–AC3 fully covered; AC4 explicitly gap-typed as `Untestable-by-nature` with a manual verification scenario |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No "Dependencies" section in story — no upstream dependencies |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, states the new invariant this fix adds to the existing pure-function constraint |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ N/A | No AC is CSS-layout-dependent — data-classification and data-integrity logic |
| H-NFR | NFR profile exists | ✅ N/A | No NFRs — explicitly stated "None" in the test plan |
| H-NFR2 | Compliance NFR sign-off documented | ✅ N/A | No compliance NFR applies |
| H-NFR3 | Data classification field not blank | ✅ N/A | No NFR profile required |
| H-GOV | `## Approved By` in discovery has ≥1 non-blank, non-engineer-only entry | ✅ N/A | Short-track — no discovery artefact exists |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | 0 MEDIUM (review skipped) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | The data-correction values (which epic each orphaned story belongs to) were derived from each file's own header, not independently domain-reviewed | Hamish King (Platform Owner) — same solo-operator rationale as this session's other RISK-ACCEPTs; logged in `decisions.md` |
| W5 | No UNCERTAIN items left unaddressed in gap table | ✅ | Two genuinely uncertain cases (`ougl`, `wuce`) were explicitly carved out of scope rather than guessed at | — |

---

## Standards Injection

No `domain` field set on this story — pure adapter/data-layer function plus data corrections, no route/handler, UI, security, or auth surface. Skipped silently per the DoR skill's own instruction.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix epic/flat story render duplication and missing story registration — artefacts/2026-09-06-story-registration-integrity-fix/stories/sri-s1-fix-story-render-duplication-and-missing-registration.md
Test plan: artefacts/2026-09-06-story-registration-integrity-fix/test-plans/sri-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- In src/web-ui/adapters/feature-story-structure.js's getFeatureStoryStructure,
  exclude from the returned flatStorySlugs any slug already present in any
  epic's storySlugs. Do not change groupArtefactsByStory itself.
- Do NOT remove or alter any existing flat story object in
  .github/pipeline-state.json for phase3 or wucp -- those objects carry
  real DoR/PR/dodDate tracking data and must be preserved exactly. The fix
  for duplication is render-time dedupe only.
- Data corrections to .github/pipeline-state.json, exactly as specified in
  the DoR contract:
  - phase3: add p3.18-p3.22 (bare strings) to e1-governance-chain-integrity.
  - phase4-opus: add a stories[] array to each of its 4 epics (23 slugs
    total, exact list in the DoR contract).
  - mfc: add one flat story object with id 'mfc.2' (best-effort stage/health
    per the DoR contract's own stated assumption).
  - wfp: add wfp.11 (bare string) to wfp-planning-dashboard.
- Do NOT touch ougl or wuce's pipeline-state.json entries -- both are
  explicitly out of scope, logged as follow-ups.
- After any pipeline-state.json edit, run
  node scripts/check-pipeline-state-integrity.js and confirm 0 fail before
  committing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low (no security/auth/data-model surface; both the code fix and the data corrections are individually well-understood and were verified per-file against each story's own stated epic reference before this DoR was written — no further human checkpoint required before coding agent proceeds)
**Sign-off required:** No
**Signed off by:** Not required
