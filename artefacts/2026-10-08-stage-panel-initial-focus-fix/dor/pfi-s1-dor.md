# Definition of Ready Checklist

## Definition of Ready: Fix stage side panel's initial focus target and correct the E2E spec's wrap-test labels

**Story reference:** artefacts/2026-10-08-stage-panel-initial-focus-fix/stories/pfi-s1-fix-stage-panel-initial-focus-and-e2e-labels.md
**Test plan reference:** artefacts/2026-10-08-stage-panel-initial-focus-fix/test-plans/pfi-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "outer loop practitioner opening a stage's side panel to edit it" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1/AC3 unit-tested; AC2 already live-verified this session plus covered by the (now-corrected) existing E2E spec |
| H4 | Out-of-scope section populated | ✅ | 1 item |
| H5 | Benefit linkage references a named metric | ✅ N/A | Short-track correctness fix — direct benefit stated, matching `jcg-s1`/`csb-s1`'s own precedent |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No schema dependency — pure client-script + test-file fix |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ N/A | Short-track skips `/review`; Architecture Constraints populated directly in the story |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Not CSS-layout-dependent; AC2 already live-verified this session against real staging data |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ N/A | Short-track skips discovery |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter or table — client-script focus-target fix only |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | No visual/token change — focus-target logic only |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Short-track skips `/review` | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table entries | — |

---

## Standards injection

**Domain tags:** `[web-ui]`, `[accessibility]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- No new pattern introduced — this corrects an existing implementation's own stated intent (focus the first editable field) to match what the code should have done from `ep1-s3`'s own implementation.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix stage side panel's initial focus target and correct the E2E spec's wrap-test labels -- artefacts/2026-10-08-stage-panel-initial-focus-fix/stories/pfi-s1-fix-stage-panel-initial-focus-and-e2e-labels.md
Test plan: artefacts/2026-10-08-stage-panel-initial-focus-fix/test-plans/pfi-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (in openPanel()'s own
  function body, change the initial-focus call from
  `var focusables=getFocusable();if(focusables.length)focusables[0].focus();`
  to explicitly focus the description field:
  `var firstEl=document.getElementById("sw-stage-field-description");
  if(firstEl)firstEl.focus();` -- do NOT change getFocusable() itself or
  the Tab/Shift+Tab trap logic, which is correct as-is and already
  live-verified working) and
  tests/e2e/ep1-s3-stage-panel-focus-management.spec.js (swap the
  firstField/lastField locator assignments to match the true DOM order:
  firstField = #sw-stage-panel-close, lastField =
  #sw-stage-field-moment_of_truth -- and correspondingly, the test's own
  opening assertion that focus lands on firstField after click must
  change, since AC1 now means focus lands on the DESCRIPTION field, not
  the close button, when the panel first opens; the Tab/Shift+Tab wrap
  assertions should use the close-button/moment_of_truth locators as the
  true first/last).
- Add a NEW test file tests/check-pfi-s1-panel-focus-fix.js with the 2
  source-text assertions from the test plan (AC1, AC3).
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** Yes (short-track story, UX/accessibility correctness fix found via live Chrome verification)
**Signed off by:** Hamish King — Platform Owner — 2026-10-08 (per operator's own "Check all this features stories ac in chrome please" instruction, which surfaced this real defect directly)
