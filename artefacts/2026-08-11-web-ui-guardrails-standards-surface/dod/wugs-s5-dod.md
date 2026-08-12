# Definition of Done: Provide a create/edit form for a guardrail or standard

**PR:** https://github.com/heymishy/skills-repo/pull/725 | **Merged:** 2026-08-12
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s5-create-edit-form.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s5-create-edit-form-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s5-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: guardrailsView_rendersAddAndEditActions`, `AC1: guardrailsView_missingGuardrailsFile_showsAddNotEdit` pass | automated test (`tests/check-wugs-s5-create-edit-form.js`) | None |
| AC2 | ✅ | `AC2: editForm_prefillsWithRealCurrentContent`, `AC2: addForm_noPath_rendersBlank` pass | automated test | None |
| AC3 | ✅ | `AC3: submitForm_emptyContent_rejectedServerSide`, `AC3: submitForm_validContent_acceptedServerSide` pass | automated test | None |
| AC4 | ✅ | `AC4: submitForm_validContent_passesToWritePathWithCorrectTarget`, plus the `FIX:` tests covering the new-standard path-input case | automated test | See Deviation note below |

All 13 tests re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-12: `13 passed, 0 failed`. Sibling story `wugs-s2`'s own 11 tests re-confirmed unaffected (this story modified a function `wugs-s2` also depends on, `_renderGuardrailsSection`).

**Deviation on AC4:** the initial implementation (Tasks 1-5) satisfied AC4 for editing existing entries, but the "Add new standard" flow had no way to supply a target filename/path at all — a real gap found during this story's own final story-level review, not a downstream `wugs-s6` deferral. Fixed within this story (Task 6): added an editable path text input for the add-new case, plus server-side path validation. Re-verified PASSED on re-review. Recorded here per this repo's "record deviations even after they're fixed" convention — the deviation existed at one point in the delivery, even though it did not ship to production.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None shipped. Confirmed via diff review of the merged PR: no markdown/preview rendering added (Out of Scope item), no additional optimistic-locking/conflict-handling layer beyond GitHub's own SHA mechanism (Out of Scope item, note: SHA handling itself is `wugs-s6`'s scope, not built here).

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (plus 1 NFR test, plus 4 fix-task tests beyond the original test plan's minimum, plus 1 route-wiring test)
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: Add/Edit actions present | ✅ | ✅ | 2 tests (ok-state Edit + missing-file Add), avoiding a mutation-undetectable assertion flagged by code review |
| AC2: Edit form pre-filled with real content | ✅ | ✅ | 2 tests (pre-fill + blank-add-mode with a call-count spy proving no fetch happens) |
| AC3: empty submission rejected server-side | ✅ | ✅ | 2 tests (reject + accept paths, both required after code review flagged the reject-only test as non-discriminating alone) |
| AC4: valid submission passed to write path | ✅ | ✅ | 1 test plus 4 fix-task tests covering the new-standard path-input gap |
| NFR-SEC-01: pre-filled content escaped | ✅ | ✅ | Uses malicious `<script>` content, confirms escaping |
| Route wiring | ✅ | ✅ | GET route only — POST intentionally unwired (see NFR Status) |

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — form opens with pre-filled content within 2s | ✅ (as scoped) | Same live-fetch latency already accepted elsewhere in this feature (`nfr-profile.md`); no new performance target introduced |
| Security — server-side validation mandatory, not client-side-only | ✅ | `_validateGuardrailContent` and `_validateGuardrailPath` both run server-side in `handlePostGuardrailsForm`, independent of any client check |
| Security — no `MC-SEC-01` violation in pre-filled content rendering | ✅ | `_escapeHtml` wraps both `path` (hidden field) and `prefillContent` (textarea) before interpolation; `NFR-SEC-01` test confirms with malicious content |
| Accessibility — form fields have labels; Add/Edit are keyboard-accessible links/buttons | ✅ | `<label for="gv-form-content">`/`<label for="gv-form-path">` present; Add/Edit render as real `<a href>` elements (keyboard-navigable), not click-only divs; Save is a real `<button type="submit">` |
| Audit — none at this story's layer | ✅ (N/A) | Confirmed — the actual write (`wugs-s6`) is the audited action, per the story's own NFR row |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Not yet.**

`m1` ("Guardrail/standard visibility in the web UI") — this story is a UI/UX enabler for `wugs-s6`/`wugs-s7` (the actual write path), not a metric-mover on its own (per the story's own Benefit Linkage: "it does not move the metric alone, but without it there is no way to trigger the write path this epic exists to deliver").

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: wugs-s5 is a technical/UI enabler for the write path — the Add/Edit form is now live, but submitting it will 404 until wugs-s6 wires the real write adapter. No end-to-end write is possible yet, so no real usage signal exists.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After `wugs-s6`/`wugs-s7` ship and a real tenant successfully submits an edit | Not an independently-measurable contributing story |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. When `wugs-s6`'s implementation plan is written, explicitly add a task to wire `POST /products/:id/guardrails/form` in `server.js`, passing the real `guardrailPrAdapter` as `handlePostGuardrailsForm`'s `writeAdapter` parameter — `wugs-s6`'s own AC5/AC6 only cover wiring `setGuardrailPrAdapter` itself, not this connection. Already logged as a GAP-FLAG in `decisions.md` (2026-08-12).

---

## DoD Observations

1. This story had a Critical or Important code-quality finding on every one of its first 5 tasks — consistently the same defect class: a shipped conditional/code path whose test didn't actually discriminate it (a mock that swallowed the exact failure it was meant to catch, an assertion satisfiable regardless of which branch executed, or a boundary tested on only one side). Each was caught and fixed before task approval. Task 6 (the post-final-review fix) was the first task in this story to pass code-quality review clean on the first attempt — the reviewer explicitly confirmed the recurring pattern did not repeat. Tag as a `/improve` candidate: consider whether `/implementation-plan` should include an explicit "does this assertion discriminate the branch it's testing?" self-check prompt in its Step 4 checklist, since this exact question had to be manually re-asked of every implementer subagent across 6 consecutive tasks.
2. The final story-level review caught a genuine functional gap (no path input for new standards) that none of the 5 individual task-level spec-compliance or code-quality reviews caught, because each task reviewed its own diff in isolation and the gap only became visible when reasoning about the complete "Add new standard" user flow end-to-end. Confirms the value of the final synthesis review as a distinct step from per-task review, not a redundant formality.
3. The AC verification script (`verification-scripts/wugs-s5-verification.md`) was missing a scenario for AC4 at authoring time — the same class of gap already fixed on `wugs-s1` and `wugs-s2` earlier this session. Tag as a `/improve` candidate: `/test-plan` or `/definition-of-ready` could cross-check that every AC number appearing in the story has a corresponding "Covers: ACn" scenario in the verification script before DoR sign-off, rather than this being caught three times independently at `/verify-completion`.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Provide a create/edit form for a guardrail or standard.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
