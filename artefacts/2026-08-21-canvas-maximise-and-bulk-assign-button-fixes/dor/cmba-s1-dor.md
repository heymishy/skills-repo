# Definition of Ready Checklist

## Definition of Ready: Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label

**Story reference:** artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/stories/cmba-s1-fix-readonly-maximise-and-stuck-button-label.md
**Test plan reference:** artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/test-plans/cmba-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-21

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "operator resuming a past /design or /definition conversation, or bulk-assigning stories to modules" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 |
| H4 | Out-of-scope section is populated | ✅ | 2 items |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track UI bug fix — no formal metric; real explanation given (standard short-track pattern) |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no `/review` run |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` — upstream (`cdpl-s1`, `bmau-s1`) are already-merged code, not schema fields |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | Populated |
| H-E2E | CSS-layout-dependent AC without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — this is function-presence/string-content testing, not rendered-position behaviour. (bmau-s1's own precedent explicitly routed its one genuinely visual AC to a dedicated Playwright spec; this story's AC4 is a plain success-handler-body check, not that kind of AC.) |
| H-NFR | NFR profile or explicit "None" field | ✅ | Story's own NFR section states "None identified" for all 4 categories |
| H-NFR2 | Compliance NFR with regulatory clause has sign-off | ✅ N/A | No compliance/regulatory NFR named |
| H-NFR3 | Data classification field not blank | ✅ N/A | No feature-level NFR profile — short-track |
| H-NFR-profile | Feature NFR profile exists if story NFRs are non-blank | ✅ N/A | Short-track — consistent with every other short-track story in this repo's history |
| H-GOV | Discovery `Approved By` ≥1 non-blank entry | ✅ N/A | Short-track — no discovery artefact by design |
| H-ADAPTER | New injectable adapter wiring (D37) | ✅ N/A | No new adapters introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|---------------------|------------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Short-track, no review | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ **Acknowledged** | Not reviewed pre-implementation — RISK-ACCEPT logged in `decisions.md` | Hamish King |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Gap table states "None" | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix the read-only-view maximise-button ReferenceError and the stuck "Assigning…" button label — artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/stories/cmba-s1-fix-readonly-maximise-and-stuck-button-label.md
Test plan: artefacts/2026-08-21-canvas-maximise-and-bulk-assign-button-fixes/test-plans/cmba-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Scope is 2 files: src/web-ui/views/chat-view.js, src/web-ui/routes/products.js. Do not touch any other file.
- chat-view.js: split swToggleCanvasFs, swExpandCanvas, and swToggleArtefactFs out of the readOnly-gated scriptHtml block into a new, always-emitted <script> block. Do NOT simply flip the `data.readOnly ? '' : (...)` conditional off entirely for the whole block -- that would re-introduce the live-session-only SSE pump wiring and Cmd/Ctrl+Enter submit handler on a read-only page with no live session and no chat-form to submit. Only the three named toggle functions move; everything else in scriptHtml stays exactly as gated as it is today.
- products.js: bmauAssignToModule()'s success .then() handler gains `btn.disabled=false;btn.textContent=origText;` at the end, after bmauUpdateSelection(); and before the .catch(). Do not change the .catch() handler itself (it already has the correct reset).
- New test file: tests/check-cmba-s1-readonly-maximise-and-stuck-label.js, following the plain-Node renderChat()-direct-call pattern established by tests/check-cdpl-s1-canvas-panel-layout-fix.js (copy its extractFnBody helper into the new file rather than importing it -- this repo's convention is small per-file test helpers, not a shared test-utils module).
- Architecture standards: read .github/standards/web-ui/web-ui-patterns.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only)
**Signed off by:** Hamish King (2026-08-21) — acknowledged W4 risk, logged RISK-ACCEPT
