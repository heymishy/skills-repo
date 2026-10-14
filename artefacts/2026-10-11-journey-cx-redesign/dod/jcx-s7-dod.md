# Definition of Done: Fix the misleading save-error color, the view-reset-on-save standards violation, and empty-state/entry-point/spacing polish

**PR:** https://github.com/heymishy/skills-repo/pull/987 | **Merged:** 2026-10-14
**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
**Test plan:** artefacts/2026-10-11-journey-cx-redesign/test-plans/jcx-s7-test-plan.md
**DoR artefact:** artefacts/2026-10-11-journey-cx-redesign/dor/jcx-s7-dor.md
**Assessed by:** Claude Sonnet 5 (session continuation)
**Date:** 2026-10-14

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Save-error state no longer reuses the success-colored class; persistent `Saving…`/`Saved`/`Failed to save — Retry` states; auto-hide timer removed entirely, resolving review finding 1-M1's timer-race concern by eliminating the root cause. `check-jcx-s7-panel-feedback-and-polish.js` AC1a/b/c: confirmed RED (7/8 originally failed against pre-change code, including AC1a/b/c) and GREEN after the fix | `unit` (real jsdom + controllable mocked `fetch`) | None |
| AC2 | ✅ | `window.location.reload()` removed from the stage-add success path; new stage patched into the DOM from the POST response's own `{id, name, position}`; active view confirmed unchanged after save | `unit` | None |
| AC3 | ✅ (functional + visual both covered) | Header cell is now a single-click/keyboard target (functional: `check-jcx-s7-panel-feedback-and-polish.js` AC3a/AC3b, resolving review finding 1-M2's double-fire concern); visual/size portion (real click-target area, keyboard focus-visible outline) covered by `tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js`, written per the DoR's own B2 classification | `unit` + E2E (written, not live-run this session — see RISK-ACCEPT below) | RISK-ACCEPT (E2E written, not executed against a live/local server this session) |
| AC4 | ✅ | Empty field values and empty/default stage names render with the muted `sw-cx-grid-cell--empty`/`sw-stage-name--empty` treatment; `check-ep3-s1-customer-experience-view.js`'s own AC2 re-pointed from the literal `"Not set"` string to this new marker, confirmed passing | `unit` + `integration-real-code` (re-pointed regression test) | None |
| AC5 | ✅ | Grid row padding (`8px 0`) and column-gap (`8px`) confirmed via jsdom `getComputedStyle` against the real rendered `<style>` block | `unit` | None |

### Verification strength summary
- `unit`: 8 (new `check-jcx-s7-panel-feedback-and-polish.js`, all RED/GREEN confirmed)
- `integration-real-code`: 1 (re-pointed `check-ep3-s1-customer-experience-view.js` AC2)
- `E2E` (written, not executed live this session): 1 (`jcx-s7-panel-entry-and-save-feedback.spec.js`)
- `live-verified`: 0 — see RISK-ACCEPT below

---

## Scope Deviations

None in functional scope. All 5 ACs implemented exactly as scoped; the Out of Scope section's 4 deferred items (field-chunking, row-label font-size, curve height, mid-sequence stage insertion) were correctly not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 9/9
**Tests passing in CI:** confirmed via PR #987 — all 8 checks green (the E2E spec is not wired into the `npm test` CI chain, per ADR-018/`jcx-s3`/`jcx-s6`'s own established precedent — it runs via a separate `npx playwright test` invocation)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1a (unit) | ✅ | ✅ | |
| AC1b (unit) | ✅ | ✅ | |
| AC1c (unit) | ✅ | ✅ | Resolves review finding 1-M1 |
| AC2 (unit) | ✅ | ✅ | |
| AC3a (unit) | ✅ | ✅ | |
| AC3b (unit) | ✅ | ✅ | Resolves review finding 1-M2 |
| AC4 (unit + re-pointed integration) | ✅ | ✅ | |
| AC5 (unit) | ✅ | ✅ | |
| AC3 (E2E, visual/size portion) | ✅ | ⚠️ written, not live-run | See RISK-ACCEPT below |

**Gaps (tests not implemented):** None — every test from the plan was written; one (the E2E spec) was not executed against a live/local server this session.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ | AC2's DOM patch is strictly cheaper than the full page reload it replaces; no new queries |
| Security | ✅ N/A | No new input surface, no auth/CSRF change; AC2's DOM patch uses only the already-tenant-scoped POST response |
| Accessibility | ✅ | AC1's error state carries its meaning in text (`"Failed to save — Retry"`), not color alone; AC3's larger click target is keyboard-reachable/operable (Tab + Enter/Space), confirmed functionally via AC3a/AC3b; the visual focus-visible portion is covered by the written (not live-run) E2E spec |
| Audit | ✅ N/A | No new mutating action |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Operator CX judgment vs. the reference bar | ✅ (baseline: "Not matching") | Not yet | This story closes a real correctness bug (AC1) and a confirmed internal standards violation (AC2) found via the `cx-interaction-design-polish` spike, continuing the same mechanism `jcx-s6`/`jcx-hotfix4` already moved. |

**Measurement-ready gate:** Not yet.
**Evidence note:** All 5 ACs are confirmed via real jsdom DOM-interaction tests (RED/GREEN) and one re-pointed regression test; the E2E spec for AC3's visual portion is written but not yet executed live — see RISK-ACCEPT.
**Signal:** `not-yet-measured`
**Date measured:** null

---

## Outcome

**COMPLETE WITH DEVIATIONS**

(Deviation class: one RISK-ACCEPT — AC3's E2E spec written but not executed live this session; no functional/scope deviation in the implementation itself.)

**Follow-up actions:**
1. **Owner: future session.** Run `tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js` for real against a live/local server and update this DoD's own outcome.
2. **Owner: future session, product.** The spike's remaining findings (Part 1's row-label font-size and curve-height items, Part 3's field-chunking, Part 4's mid-sequence stage insertion) are still logged in `spikes/cx-interaction-design-polish-outcome.md` as P2/P3, not yet scoped into a story.
3. **Owner: future session.** Once this story and the rest of the epic have had real usage time, solicit the operator's own direct M1 judgment against the 3 reference examples (carried forward from `jcx-s6`'s own DoD, still not yet done).

---

## DoD Observations

1. This story is a strong example of a spike surfacing a defect worse than what it set out to find: Part 1 (visual polish) led to Part 2 (authoring-flow research) led to a confirmed functional bug (`jcx-hotfix4`), which led to Part 3 (deeper save-feedback research) uncovering a MORE SEVERE defect than expected — not a missing error state, but a misleading one (error text rendered in the success color). Each research pass was triggered by the operator asking to keep going, and each pass found something the previous one could not have — worth remembering that "go deeper" requests in this kind of spike are not diminishing returns by default.
2. The double-click recommendation self-correction (Part 4) is a good example of catching a research-to-recommendation error within the SAME spike, before it reached a story or any code — a targeted follow-up search (web convention + WCAG) reversed an earlier, less-grounded conclusion (copying Smaply's own double-click pattern) before it could ship as a real accessibility regression.
3. The internal-consistency check (Part 5) — grepping this codebase for an existing save-indicator pattern and reading `web-ui-patterns.md` directly before finalizing any new convention — found no competing convention, but DID find that one already-logged finding (view-reset-on-save) was actually a confirmed violation of this repo's own documented standard, not merely an external best-practice suggestion. Worth making this check a standing step for any future spike proposing a new UI/interaction pattern in this codebase, not just this one.
