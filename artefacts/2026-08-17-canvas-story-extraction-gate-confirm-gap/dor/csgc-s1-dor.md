# Definition of Ready Checklist

## Definition of Ready: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400

**Story reference:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md
**Test plan reference:** artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/test-plans/csgc-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-09-11

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 (AC3 has 2 sub-tests, T3a/T3b) |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ N/A | Short-track — closes a self-documented gap, no new metric |
| H6 | Complexity is rated | ✅ | Rating: 2 (investigation has a genuine unknown outcome) |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No `pipeline-state.schema.json` field dependency |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated — AC3 explicitly requires reproducing via the real streaming path, not a JSON-API shortcut; test plan follows this exactly |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | Backend logic/HTTP-status assertions, not CSS-layout-dependent |
| H-NFR | NFR profile or explicit "None" field | ✅ | Story states "None identified" across all 4 categories |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — no NFRs beyond "None" |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters — reuses existing D37 adapters (`setSkillTurnExecutorStreamAdapter`) already present in production code |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Unstable (AC3's investigation could reveal more scope needed) — investigation completed within original bounds, no re-scope needed | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | No manual verification script required — AC3's investigation is itself closed via a new automated regression test (T3a/T3b), not a manual walkthrough | — |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | No gaps | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400 — artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/stories/csgc-s1-story-extraction-regression-test-and-gate-confirm-investigation.md
Test plan: artefacts/2026-08-17-canvas-story-extraction-gate-confirm-gap/test-plans/csgc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- New test file only: tests/check-csgc-s1-story-extraction-and-gate-confirm.js. Do NOT touch any production code under src/web-ui/ -- both underlying behaviours (extraction function, gate-confirm handler) are already confirmed correct; this story is verification-only.
- AC1/AC2: reuse tests/e2e/fixtures/llm-gateway/definition.success.json's real artefact content directly (parse out the ---ARTEFACT-START---/---ARTEFACT-END--- block) -- do not hand-craft a stand-in fixture.
- AC3: drive handlePostTurnStreamHtml (skills.js) for real, fully awaited, before calling handlePostGateConfirm (journey.js) -- this is the real streaming path the story's Architecture Constraints require, not a JSON-API shortcut. Use the shared, real journey-store.js singleton (plain require, not a fresh module instance) so skills.js and journey.js's default (unstubbed) wiring actually shares state correctly.
- If AC3's investigation concludes the 400 IS a real bug: fix it as part of this story (per AC3's own "both outcomes acceptable" wording) -- but only after confirming with real evidence, not by assumption.
- Open a draft PR when tests pass -- do not mark ready for review.
```

Oversight level: Medium

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — verification-only short-track story; operator has authorized "further waves" of this DoD-triage sweep, including this candidate, generally)
**Signed off by:** Claude Sonnet 5 (orchestrating agent), 2026-09-11 — proceeding under the operator's standing authorization to continue triage waves autonomously

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
