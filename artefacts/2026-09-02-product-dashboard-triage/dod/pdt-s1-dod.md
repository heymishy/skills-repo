# Definition of Done: Consolidate the Epic/Phase List — Remove the Duplicate Static Dump, Default Groups to Collapsed

**PR:** https://github.com/heymishy/skills-repo/pull/815 | **Merged:** 2026-09-02
**Story:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s1.md
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-pdt-s1-consolidate-epic-list.js` — "AC1: static Epics/Other-features breakdown is removed" | Automated unit test against `_renderProductView`'s returned HTML | None |
| AC2 | ✅ | Same file — "AC2: groups render collapsed by default" + "AC2: group header shows a rolled-up status reflecting mixed health" | Automated unit test | None |
| AC3 | ✅ | Same file — "AC3: group markup supports native expand-on-click" | Automated unit test (structural markup check — the existing `a4ToggleModule` handler was reused, not re-verified live in a browser) | None |
| AC4 | ✅ | Same file — "AC4: zero-groups product shows a clear empty state" | Automated unit test, confirmed as a pre-existing behaviour preserved (regression guard, no code change needed) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None found — all four ACs match their story text exactly.

---

## Scope Deviations

None. Commit history on the branch (`46974cc2`, `051bd647`, `b5ce2c91`) maps directly to AC1–AC3 implementation, the verify-completion checkpoint, and the branch-complete checkpoint. No functionality outside the story's Out of Scope section (grouping-assignment logic, collapse-state persistence) was touched.

One in-scope-but-not-originally-named correction, disclosed at implementation time and carried through to this DoD: the DoR's Architecture Constraints named `_renderConsolidatedFeaturesSection` as the function producing the static duplicate list. Code investigation at `/implementation-plan` found the actual static "Epics"/"Other features" text dump lived in a separate, smaller function, `_renderGroupedCoverageBreakdown` (called from `_renderProductView`, not from `_renderConsolidatedFeaturesSection`, which was always the interactive-only renderer). This is a naming correction, not a scope change — AC1's own intent ("the static, non-interactive text rendering is removed") is fully satisfied either way. See the implementation plan's "Investigation note" for the full reasoning.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7 (confirmed via the merged PR's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: static Epics/Other-features breakdown is removed | ✅ | ✅ | |
| AC2: groups render collapsed by default | ✅ | ✅ | |
| AC2: group header shows a rolled-up status reflecting mixed health | ✅ | ✅ | |
| AC3: group markup supports native expand-on-click | ✅ | ✅ | |
| AC4: zero-groups product shows a clear empty state | ✅ | ✅ | |
| NFR-Performance: response size does not regress | ✅ | ✅ | |
| NFR-Accessibility: collapse toggle is a real, keyboard-focusable control | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Additional evidence beyond the test plan itself:** two pre-existing test files (`check-a4-module-grouped-rendering.js`, `check-pr-s2-products-route.js`) had assertions that encoded the exact static/default-expanded behaviour this story deliberately removes — both updated in the same PR to match the new, intentional behaviour, with inline comments explaining the supersession. Full local suite: 595 file suites, 0 new failures (1 pre-existing, unrelated Windows `pwsh`-invocation failure in `check-p3.5-validate-trace.js`, confirmed identical on master before this branch started, unrelated to this story).

**E2E:** One locally-relevant Playwright spec (`tests/e2e/a4-module-expand-collapse.spec.js`) exists for the collapse/expand transition itself; it self-skipped locally (no seeded product/module data in the local dev environment) — a pre-existing fixture gap, not caused by this change. On the merged PR, both real-staging E2E jobs (`Scenario A E2E (staging)`, `Scenario B E2E (staging)`) passed on the second run — the first run's failure was a 60s timeout in an unrelated spec (`a3-product-feature-ideate-canvas.spec.js`'s rough-idea → ideate-chat-session flow, nothing to do with the product dashboard), confirmed as transient staging flakiness: the identical code content had already passed the same job in an earlier CI run on this same PR, and the only diff between the passing and failing runs was a pure pipeline-state.json bookkeeping commit with zero source changes.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Page load / render time — no regression | ✅ | `NFR-Performance` unit test asserts the removed static breakdown's distinctive text format does not reappear (a direct proxy for "no re-introduced duplicate output"); removing a whole rendering pass can only reduce or hold response size steady, never increase it. |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time to First Actionable Content | ✅ (~40 screens of static text before any interactive content) | Not yet — full target requires pdt-s2 (triage strip) and pdt-s4 (breadcrumb) to also ship; `contributingStories` for this metric lists all three | pdt-s1 alone already removes the entire static-dump obstruction named in the baseline — a real, structural, directly-observable contribution toward the target, but the metric owner should wait for pdt-s2/pdt-s4 to merge before taking a full before/after measurement on `skills-framework` in staging. |

Metric 2 (Health-Signal Trustworthiness) does not list `pdt-s1` in its `contributingStories` — no signal action for this story.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None. Metric 1's full measurement is deferred to whichever of pdt-s2/pdt-s4's own DoD run lands last (per this feature's `metrics[].contributingStories`), not a gap in this story.

---

## DoD Observations

1. The DoR's Architecture Constraints named the wrong specific function for the static duplicate list (`_renderConsolidatedFeaturesSection` instead of the actual `_renderGroupedCoverageBreakdown`) — a minor code-investigation-vs-DoR-authoring mismatch, same general class as `acdg-s1`'s own (much larger) architecture-constraint mismatch earlier in this feature set. Worth a light /improve note: DoR authoring for rendering-layer stories in `src/web-ui/routes/products.js` could benefit from a one-line "confirmed via direct code read" annotation next to any named function, the same discipline already applied inconsistently across recent stories.
2. Two pre-existing test files needed updates because their assertions encoded behaviour this story deliberately removes — a normal, expected consequence of a UX-simplification story, not a defect. Flagging only because it is the kind of cross-story test coupling `/trace` and future `/improve` runs may want visibility into: any future story touching `_renderProductView`'s shared rendering helpers should expect to touch tests from multiple prior stories, not just its own.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Consolidate the Epic/Phase List (pdt-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
