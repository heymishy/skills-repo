# Definition of Done: cams-s1 — Stack the chat/artefact split-panel into a single column on mobile

**PR:** https://github.com/heymishy/skills-repo/pull/777 | **Merged:** 2026-08-27T08:06:18Z (commit `090563d5`)
**Story:** `artefacts/2026-08-27-chat-artefact-mobile-responsive/stories/cams-s1-stack-chat-artefact-panels-on-mobile.md`
**Test plan:** `artefacts/2026-08-27-chat-artefact-mobile-responsive/test-plans/cams-s1-test-plan.md`
**DoR:** `artefacts/2026-08-27-chat-artefact-mobile-responsive/dor/cams-s1-dor.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Live chat page at 375px: `document.body.scrollWidth <= 375`, confirmed via Playwright | Automated E2E test | None |
| AC2 | ✅ | Chat and artefact panes stack vertically (chat first), both visible with real bounding-box widths | Automated E2E test | None |
| AC3 | ✅ | Historical stage-view (same shared `renderChat` component) exhibits identical stacked, non-overflowing layout | Automated E2E test | None |
| AC4 | ✅ | Ideate's 3-panel variant (conditions/assumptions/canvas) all remain visible when stacked, no overflow | Automated E2E test | None |
| AC5 | ✅ | Desktop (1280px): side-by-side layout confirmed unchanged (pane bounding boxes non-overlapping on x-axis) | Automated E2E test | None |
| AC6 | ✅ | Existing chat-page test suite (`check-mfc1`, `check-csd-s1/s2`, `check-dsh-s3-render-chat-readonly.js`) all pass unchanged | Automated test re-run | None |

**Test file:** `tests/e2e/cams-s1-chat-artefact-responsive.spec.js` — 4/4 passing, re-confirmed on merged master.

---

## Scope Deviations

None. Diff confirmed to touch exactly `src/web-ui/views/chat-view.js` (one `@media` block addition) and one new Playwright spec file.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 AC groups, all covered (4 new E2E tests + 2 existing-suite re-run groups).
**Tests passing:** 4/4 in the new spec; full existing chat-page suite clean; full suite 561 files run, 0 real failures (1 known pre-existing flaky file, `check-p3.5-validate-trace.js`).
**Gaps:** None per the test plan's own "Coverage gaps" section — the CSS-layout-dependent ACs (B2 classification) were resolved as automated Playwright tests, matching this repo's own established `lphf-s2/s3/s4/s5` precedent, not a RISK-ACCEPT.

**Process note:** A transient regression (`check-dsh-s3-render-chat-readonly.js`, which diffs the *committed* HEAD version of `chat-view.js` against the *working-tree* version to guard that an unrelated change didn't alter default rendering) failed while the CSS change was still uncommitted mid-implementation — resolved itself once committed (the test compares HEAD-vs-disk, not HEAD-vs-a-frozen-baseline, so an uncommitted diff always trips it transiently). Confirmed passing post-commit before opening the PR.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance | ✅ N/A | Pure CSS media-query addition, no new assets or JS |
| Security | ✅ N/A | No new input path, no new rendering of user-controlled content |
| Accessibility | ✅ | Improves accessibility — replaces an unconditional 2-column grid that was unreadable at narrow widths with a legible, natural-reading-order single column |
| Audit | ✅ N/A | Not applicable |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| None declared | N/A | N/A | Short-track direct correctness fix, no formal benefit-metric artefact. This closes the last of the original 4 live-usage bug reports (2026-08-25). |

**Live validation (post-merge, 2026-08-27):** Deployed to `wuce-staging` (v810). Confirmed via `fly ssh console` that the `grid-template-columns: 1fr; height: auto` media-query fix is present in the running container. A genuine narrow-viewport visual screenshot could not be captured through the available Chrome automation tooling in this session (`resize_window` did not affect the actual page-rendering viewport in this sandboxed browser environment — confirmed via direct `window.innerWidth` checks after two separate resize attempts) — this is a tooling limitation of the live-check environment, not a gap in the shipped fix, which is separately and directly proven by the pre-merge Playwright suite (real browser contexts with genuine `setViewportSize` support).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None from this story directly. This story's own merge indirectly surfaced an unrelated regression in a separate, previously-merged story (`aslr-s1`) — see `adsr-s1`'s DoD for that follow-up, which is unrelated to this story's own change (a pure CSS fix with no session/routing logic involved).

---

## DoD Observations

1. **The B2 CSS-layout-AC classification worked as designed.** Rather than defaulting to a RISK-ACCEPT + manual smoke test (this repo's fallback option), the DoR correctly identified and reused an existing, proven automated-test pattern (`lphf-s2/s3/s4/s5-responsive.spec.js`) already established for exactly this problem class — avoiding both an under-tested manual gap and inventing a new test convention unnecessarily.
2. **Live visual verification tooling gap identified and reported honestly** rather than presenting a misleading screenshot: this session's Chrome automation environment's `resize_window` does not propagate to the actual page layout viewport, confirmed via direct JS inspection. Worth flagging for any future story needing live-viewport visual confirmation in this same tooling environment — the pre-merge Playwright suite remains the reliable verification path for responsive-layout ACs, not live manual browser resize.
