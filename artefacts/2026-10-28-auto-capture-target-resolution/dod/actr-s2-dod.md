# Definition of Done: Auto-resolve the single-AC capture target before falling back to manual entry

**PR:** [#1035](https://github.com/heymishy/skills-repo/pull/1035) | **Merged:** 2026-10-28
**Story:** `artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s2-auto-resolve-single-ac-capture-target.md`
**Test plan:** `artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s2-auto-resolve-single-ac-capture-target-test-plan.md`
**DoR artefact:** `artefacts/2026-10-28-auto-capture-target-resolution/dor/actr-s2-dor.md`
**Assessed by:** Copilot (operator-directed, 2026-10-29)
**Date:** 2026-10-29

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Real Chrome session against the merged master build (`http://localhost:4321/products/fake-product-1/playback-evidence/actr-s2-e2e-feature-1793216093918`): page shows "Auto-detected from `tests/e2e/actr-s2-capture-target-fixture.spec.js`: `/dashboard` / `body` — Override", no manual-entry form, "Capture evidence" button present | `live-verified` | None |
| AC2 | ✅ | `tests/check-actr-s2-auto-resolve-single-ac.js` T5: `handlePostCaptureTrigger` dispatches `dispatchCaptureWorkflow` with `{acId:'AC1', url:'/actr-s2-render-fixture', selector:'.actr-s2-render-target'}` — the real auto-resolved values, unchanged request/response shape otherwise | `integration-real-code` (claim is internal dispatch-argument correctness, not a browser-observable effect — see Verification strength note below) | None |
| AC3 | ✅ | Real Chrome session: submitted the manual form for real (`/manually-set-page` / `.manually-set-target`) through the real `handlePostCaptureTarget` endpoint, reloaded without `?override`, page showed "Target: `/manually-set-page` / `.manually-set-target`" — the "Auto-detected from..." block was completely gone | `live-verified` | None |
| AC4 | ✅ | `tests/e2e/actr-s2-auto-resolve-live.spec.js` (`noE2eSection: true` case): real Chromium run asserts `res.status()===200`, no "Auto-detected from" text, exactly one `form input[name="url"]` present | `Playwright evidence` | None |
| AC5 | ✅ | Playwright evidence above covers the representative browser-observable outcome (page renders, manual form shown, no error). The individual internal fall-through branches (missing storySlug, 404 test-plan, 404 spec file, path-traversal attempt, null/undefined AC row) are `integration-real-code`/`unit` (`tests/check-actr-s2-auto-resolve-single-ac.js` T3b–h) — appropriate, since the claim there ("never throws") is an internal-correctness claim, not itself a distinct browser-observable state beyond what the Playwright run already confirms | `Playwright evidence` + `unit` | None |
| AC6 | ✅ | Real Chrome session: clicked "Override", the manual form appeared with the auto-detected line still shown for context (both query-param-driven render, `?override=AC1`); submitted the form for real; on reload without `?override`, the submitted value was the active target, confirming override + priority round-trip | `live-verified` | None |

**Verification strength summary:** 3 `live-verified` (AC1, AC3, AC6), 2 `Playwright evidence` (AC4, AC5), 1 `integration-real-code` (AC2's internal dispatch-argument claim), plus unit coverage for AC5's internal failure-mode branches. All 6 ACs pass the UI-evidence gate — no AC is relying on `unit`/`integration-real-code` evidence alone for a browser-observable claim.

**Deviation note (recorded, not a failure):** the story's own Architecture Constraints specified reusing `_fetchArtefact`/`fetchArtefact` (the GitHub Contents API) for both the `test-plan.md` and spec-file reads. During delivery this was corrected to the local-clone pattern (`getRepoRoot` + `ensureRepoFresh` + `fs.readFileSync`, with the file's own pre-existing `_resolveSafeShotPath` traversal guard) already used elsewhere in `playback-evidence.js` for committed screenshots/videos. The GitHub-API approach made the happy path impossible to exercise in any automated test (it requires a real OAuth-authenticated token, and `fetchRepoPath` is explicitly never wired under `NODE_ENV=test`). This was an operator-directed correction, not a defect found post-merge — fully documented in `decisions.md`'s 2026-10-29 SUPERSEDED entry, which also supersedes a RISK-ACCEPT this story's own `/verify-completion` run had originally logged for the live-browser-render-check gate (now closed with the real evidence above instead).

---

## Scope Deviations

None. Verified against the story's own Out of Scope section: the "Capture all" bulk flow (`actr-s3`) was not touched; no change to how DoD/review artefacts are read (`_getDodAcList`'s own GitHub-API read is unchanged); the `test-plan.md` `**File:**` convention format is unchanged (still parsed identically by `_findE2eSpecFileForAc`) — only which adapter reads the *content* of `test-plan.md`/the spec file changed.

---

## Test Plan Coverage

**Tests from plan implemented:** 21 / 21
**Tests passing in CI:** 21 / 21 (confirmed via `gh pr checks 1035` — all 8 checks pass, including "Lint, typecheck, test, build" and "Playwright E2E smoke tests") and locally on `master` post-merge (`node tests/check-actr-s2-auto-resolve-single-ac.js` → 21 passed, 0 failed)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1 (DoD AC-row storySlug tagging) | ✅ | ✅ | Unchanged by the redesign |
| T2a–e (E2E spec-file finder) | ✅ | ✅ | Unchanged by the redesign, pure logic |
| T3a–h (`_resolveAutoCaptureTarget` core resolution + failure modes) | ✅ | ✅ | Rewritten to use real temp-directory fixtures via `repo-root.js`'s `setRepoRoot` seam |
| T4a–c (render wiring) | ✅ | ✅ | Rewritten fixture helper, same assertions |
| T5 ×2 (dispatch wiring, incl. regression guard) | ✅ | ✅ | Rewritten fixture helper, same assertions |
| T6a–b (Override round-trip) | ✅ | ✅ | Rewritten fixture helper, same assertions |
| `tests/e2e/actr-s2-auto-resolve-live.spec.js` (2 specs) | ✅ | ✅ | New — added post-review to close the live-browser-render-check gate with real Playwright coverage instead of a RISK-ACCEPT |
| `tests/e2e/actr-s2-capture-target-fixture.spec.js` (1 spec) | ✅ | ✅ | New — real fixture spec `_resolveAutoCaptureTarget`'s production code parses |

**CSS-layout-dependent gap audit:** No ACs in this story depend on CSS layout/visual rendering (alignment, breakpoints, pixel-level layout) — this is a text/form-presence change only, per the story's own Architecture Constraint ("Rendering change only... no change to... dispatch call shape"). N/A, not applicable.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — spec-file content stays within the tenant's own scope; no new access-control surface | ✅ | `_resolveSafeShotPath` (the same path-traversal guard already protecting screenshot/video serving in this file) is applied to both the `test-plan.md` read and the spec-file read; `tests/check-actr-s2-auto-resolve-single-ac.js` T3f asserts a `../../../etc/passwd.spec.js` traversal attempt is rejected and never read. The redesign *removed* a network/token dependency rather than adding a new access surface. |
| Performance — bounded to one extra fetch pair per AC lacking a manual target | ✅ | The redesign replaced two network round-trips (GitHub Contents API) with two local `fs.readFileSync` calls — same fetch-count bound as specified, strictly faster in practice. `handleGetPlaybackEvidence`'s own skip-when-manual-target-exists logic (AC3/NFR-performance) is unchanged. |
| Accessibility — the Override control and auto-detected display remain keyboard-operable | ✅ | Confirmed by direct observation during the live Chrome check: "Override" renders as a real `<a>` link (not a non-focusable `<span>`/`<div>`), matching this page's existing keyboard-operable convention (`ppc-s6`'s own AC5). No dedicated automated a11y assertion exists for this specific control — consistent with this repo's known, pre-existing, platform-wide gap (no automated a11y tooling at all; tracked separately in `workspace/state.json`'s own pendingActions, not specific to this story). |
| Audit — none beyond existing logging | ✅ | No new audit surface introduced. |

---

## Metric Signal

No metric is linked to this feature in `.github/pipeline-state.json` (`metrics: []`) — this is a short-track feature (`/test-plan → /definition-of-ready → coding agent`), which per `CLAUDE.md`'s short-track definition skips `/benefit-metric` and therefore never registers a formal `metrics[]` entry, despite the story's own prose referencing "Metric moved: m1" informally. N/A — nothing to record in this section.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(One deviation recorded above — an Architecture Constraint correction, not a defect — plus a newly-discovered, pre-existing, unrelated bug noted below. All 6 ACs are satisfied with no gaps.)

**Follow-up actions:**
1. [Pre-existing bug, discovered during this DoD's live verification, NOT introduced by actr-s2] The manual capture-target form's `url` input (`handlePostCaptureTarget`'s own HTML, unchanged by this story) is `type="url"`, which enforces native browser validation requiring an absolute URL with a scheme — but every value this feature actually uses, including actr-s2's own auto-resolved targets, is a relative path (e.g. `/dashboard`). A human operator typing a relative path into the manual form in a real browser is blocked by "Please enter a URL." until they know to work around it. Owner: unassigned — recommend a short-track bug-fix story (change the input to `type="text"` with a pattern validator permitting a relative path, mirroring `_validateRelativeUrl`'s own same-origin-relative-path rule).
2. actr-s3 (the "Capture all" bulk flow, downstream of this story) is now unblocked and ready to start.

---

## DoD Observations

1. The live-browser-render-check gate for this story was originally closed with a RISK-ACCEPT during `/verify-completion`, based on an incorrect premise (that no qualifying live fixture existed anywhere in the environment). The actual, fixable root cause was a design choice (GitHub Contents API instead of the local-clone pattern already used elsewhere in the same file) that made the happy path untestable — not a genuine absence of fixture material. **`/improve` candidate:** when a RISK-ACCEPT is proposed specifically because "no live fixture exists," the skill (or the operator) should ask whether the untestability stems from the feature's own *design choice* (fixable) versus a genuine external dependency (not fixable) before accepting it — the former should be investigated as a design defect, not RISK-ACCEPTed.
2. This DoD run discovered a real, pre-existing, previously-unflagged bug (the `type="url"` / relative-path validation mismatch on the manual capture-target form) purely as a side effect of doing a live browser round-trip rather than relying on unit-level route tests. **`/improve` candidate:** this reinforces the UI-evidence gate's own existing rationale (unit/integration-real-code evidence proves the code runs, not that the real-world UI effect is correct) — worth citing as a second concrete example alongside the two already referenced in `definition-of-done/SKILL.md`'s Step 2 note.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Auto-resolve the single-AC capture target before falling back to manual entry" (actr-s2).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
