# Review Report: jcx-s7 — Fix the misleading save-error color, the view-reset-on-save standards violation, and empty-state/entry-point/spacing polish

**Story:** artefacts/2026-10-11-journey-cx-redesign/stories/jcx-s7.md
**Run:** 1
**Date:** 2026-10-14
**Reviewer:** Claude Sonnet 5 (session continuation)

Reviewing 1 story, all 5 categories (A–E).

---

## FINDINGS

**1-M1 (MEDIUM, Category C):** AC1 requires the error state to be "persistent" and "not disappear on a timeout," but the existing save handler's per-field `save()` closures each schedule their own independent `setTimeout(...1500)` against the SAME shared `panelSaved` element, with no tracking of which timeout is "current." Concretely: if field A saves successfully (schedules a clear at T+1500ms) and field B then fails 200ms later (sets the error text, expects it to persist), field A's stale timeout will still fire at its own T+1500ms and hide field B's error message early — a genuine race condition the current code has no guard against. This must be addressed at implementation time (e.g., a single "latest save token" the timeout checks before clearing, or cancelling any pending timeout before scheduling a new one) — not an AC defect, but a concrete implementation risk worth naming now so it's designed for, not discovered as a bug later. Recommend: add this as an explicit implementation-plan task note and a test-plan scenario (two fields' saves racing, confirm the second's state is not clobbered by the first's stale timer).

**1-M2 (MEDIUM, Category C):** AC3's single-click target (the grid header cell) will sit as an ancestor of the existing `.sw-stage-edit` link, which already has its own document-delegated click listener (`ev.target.closest(".sw-stage-edit")`) that calls `openPanel`. Clicking the link itself will therefore fire BOTH the new cell-level listener and the existing link-level listener for the same click (event bubbling), both calling `openPanel` with the same `stageId`. `openPanel` itself is idempotent (just re-populates and re-opens), so this is not expected to cause a visible bug, but it is worth an explicit implementation note and a test asserting a single click on the link still produces exactly one correctly-populated open — not because it's expected to fail, but because "it's idempotent so it's probably fine" is exactly the kind of untested assumption that should be verified once, not left implicit.

**1-L1 (LOW, Category A):** `benefit-metric.md`'s own Metric Coverage Matrix (M1 row) lists `jcx-s3`, `jcx-s4`, `jcx-s6` but not yet `jcx-hotfix4` or this story (`jcx-s7`) — confirmed directly by reading the matrix. Same staleness pattern flagged in `jcx-s6-review-1.md`'s own 1-L1 finding, recurring because the matrix update isn't yet a mandatory step anywhere in the pipeline. Update at `/definition-of-ready` or alongside this review; consider a `/improve` candidate to make this update part of DoD rather than relying on review to catch it each time.

No HIGH findings.

---

## SCORE

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS — epic/discovery/benefit-metric/spike all referenced correctly; one LOW (coverage matrix staleness, recurring pattern) |
| Scope integrity | 5 | PASS — 4 explicit out-of-scope items, each with a stated reason (deferred-not-dropped, logged for `decisions.md`) |
| AC quality | 4 | PASS — 5 ACs, all Given/When/Then, all describe concretely testable behaviour (no soft "at a glance"-style qualifiers this time); two MEDIUM implementation-risk notes (1-M1, 1-M2) to carry into test-plan/implementation-plan |
| Completeness | 5 | PASS — named persona (consistent with the epic), benefit linkage populated with a real mechanism sentence, out-of-scope populated with reasons, NFRs populated (including an explicit B2 CSS-layout-AC call-out for AC3), complexity + scope stability both rated |

**Verdict:** PASS — all criteria scored 3 or above.

### Category E: Architecture compliance

- Architecture Constraints field populated (4 bullets: no data-model change, no new route, reuse of the page's own existing danger-color convention, `jcx-s6`'s own grid structure unchanged) ✓
- No violation of a named guardrail — AC2 specifically CLOSES an existing violation of `.github/standards/web-ui/web-ui-patterns.md`'s own documented reload-vs-DOM-patch rule, rather than introducing a new one ✓
- All applicable Active ADRs respected: ADR-025 (multi-tenancy — AC2's DOM patch uses only the already-tenant-scoped POST response, no new query), ADR-026 (reuse — AC1/AC3 both explicitly reuse this page's own existing danger-color and click-delegation conventions rather than inventing new ones) ✓
- Story NFRs correctly flag AC3 as a B2 CSS-layout-dependent AC requiring explicit DoR classification ✓

No Category E HIGH findings.

---

**Review PASSED ✅ — Run 1**

0 HIGH, 2 MEDIUM (1-M1, 1-M2 — both implementation-risk notes to carry forward, not AC defects), 1 LOW (1-L1)

Ready to run `/test-plan` for jcx-s7.
