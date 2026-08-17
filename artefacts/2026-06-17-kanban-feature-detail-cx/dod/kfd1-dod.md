# Definition of Done: Truncated Kanban card titles, artefact-count indicator, and design-system-styled feature/artefact detail pages (kfd1)

**PR:** #388 (`feat(kfd1): Kanban card UX — title truncation, artefact-count badge, design-system detail pages`, commit `f9435a53`) | **Merged:** 2026-06-17 (merge commit `2e21c118`, "kfd1 PR #388 merged, advance to released")
**Story:** `artefacts/2026-06-17-kanban-feature-detail-cx/stories/kfd1-kanban-card-and-detail-page-cx.md`
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — Card title length and encoding | Yes | `check-kfd1-kanban-card-and-detail-page-cx.js` AC1a–AC1h (14 assertions incl. per-slug checks for `2026-04-19-skills-platform-phase4-opus`, `2026-04-14-skills-platform-phase3`, `2026-04-23-non-technical-channel`): truncation to ≤49 chars with ellipsis, `title=` attribute with full text, mojibake sequences replaced with real em dash — all passing | Automated (unit) | None |
| AC2 — Artefact-count indicator | Yes | AC2a–AC2c (3 assertions): `kb-artefact-badge` class rendered, "N artefacts" text, "no artefacts yet" for zero-count — all passing | Automated (unit) | See Scope Deviations — the original end-to-end wiring test (board route → real artefact counts) was later removed by kbc-s1 when that route was deleted; `renderKanban`'s badge rendering itself remains directly tested and passing |
| AC3 — Detail page follows design system | Partial | AC3a–AC3h (8 assertions): status 200, `.sw-card`/`.sw-section-title` classes actually applied (not just defined in CSS), group labels, escaping, hrefs, dates — all passing. This confirms markup structure only | Automated (integration) for markup; manual scenario 5 in the verification script exists for the qualitative "reads as one system" bar but was never executed/recorded | See Scope Deviations |
| AC4 — Single artefact page follows design system and renders markdown | Partial | AC4a–AC4h (8 assertions): `renderShell` wrapping, nav present, `.sw-doc` class applied, heading rendered, 404 path preserved and shell-wrapped — all passing. Confirms markup/wrapping only | Automated (integration) for markup; manual scenarios 6–7 exist for qualitative legibility (table rendering, code-block styling, line spacing) but were never executed/recorded | See Scope Deviations |
| AC5 — No silently dropped features | Yes | AC5a–AC5b (2 assertions): Discovery lane's `stages` includes `ideation`; ideation-stage card renders inside the Discovery lane slice — passing | Automated (unit) | None |
| AC6 — Recursive artefact listing correctness | Yes | AC6a–AC6g (7 assertions): `listLocalArtefacts` exported, returns array, root-level and nested (`dor/`, `stories/`) files included, `type: 'file'` on every item, missing directory returns null to trigger fallback — all passing | Automated (unit + fixture-based) | None |

---

## Scope Deviations

1. **CSS-layout-dependent qualitative verification never completed.** AC3 and AC4 include qualitative requirements (page "reads as" the rest of the platform, markdown is "legible," tables "not overlapping," comfortable spacing) that cannot be verified by markup-structure assertions alone. The DoR (H-E2E check) accepted "manual verification scenarios cover the visual gaps" as the mitigation, and `verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md` does contain Scenarios 5, 6, and 7 covering exactly this. However, every result checkbox in that file is still unchecked and every Notes field is blank — there is no record the manual pass was ever executed. No Playwright screenshot/visual-regression test exists for these classes either (`tests/e2e/wuce20-artefact-index-html.spec.js` and the other e2e specs in this repo do not reference `sw-card`, `sw-doc`, or `sw-section-title`). No `decisions.md` exists for this feature recording a RISK-ACCEPT, and no corresponding post-deployment smoke-test action item exists in `workspace/state.json`. This is a real, currently-open gap.
2. **AC2's original board-route integration test no longer exists**, not because of a defect but because a later story (kbc-s1) deleted the `/features?view=board` route (`handleGetFeatures`) it exercised, consolidating rendering elsewhere. The test file itself documents this (comment above the AC5 block). `renderKanban`'s badge-rendering behaviour remains directly and fully tested. Accepted as normal downstream evolution, not a kfd1 defect.
3. Out-of-scope items named in the story itself (next-best-action, skill-trigger from board/detail page, in-place editing, drag-and-drop, non-board list view) remain deferred exactly as the story specified — accepted, not a gap.

---

## Test Plan Coverage

`tests/check-kfd1-kanban-card-and-detail-page-cx.js` (freshly re-run 2026-08-17, live run — the previously supplied figure of "null passed, null failed" did not reflect an actual execution and was discarded): **42 passed, 0 failed.** All 6 ACs have passing automated coverage at the markup/behavioural level. Note the count differs from the 45/45 recorded at the original `verify-completion` checkpoint (commit `734f83f2`) because kbc-s1 subsequently removed 3 assertions tied to the now-deleted board-route integration test (see Scope Deviations #2) — not a regression in kfd1's own delivered behaviour.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance (local-first artefact listing, no added latency for ~25 features) | Not independently load-tested | No automated perf test exists; verification script has an unfilled manual "Board load time acceptable" edge case |
| Security (no auth-guard change; `escHtml` everywhere; `<script>`/`<iframe>` stripping unchanged) | Met | Confirmed by code reuse constraint (ADR-012 renderer reused as-is) and passing escaping assertions (AC3f) |
| Accessibility (truncated titles remain readable via native `title=` tooltip) | Met | AC1e passing — full title present in `title=` attribute |
| Audit (no change to existing audit log calls) | Met | Story constrains this; no route signature change found in the implementation task list that would touch `feature_artefacts_accessed`/`feature_list_accessed` |

---

## Metric Signal

The story links to M1 — WIP visibility (`artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md`), whose target is "all active features visible ... without scrolling" and legible at a glance. This DoD pass did not independently re-measure M1; no metric-review artefact for this specific story was found in the feature folder. The mechanism (title truncation, artefact-count badge, ideation-lane fix, design-system-consistent detail pages) plausibly supports M1 but the metric itself was not re-verified here.

---

## Outcome

**COMPLETE WITH DEVIATIONS**
**Follow-up actions:** Execute the unfilled manual verification scenarios (5, 6, 7) in `verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md` against the current production detail pages, or add a Playwright visual-regression spec covering `.sw-card`/`.sw-doc`/`.sw-section-title` rendering; record the outcome. If the qualitative bar is accepted as-is without that check, log an explicit RISK-ACCEPT in a `decisions.md` for this feature per the repo's CSS-layout-dependent-AC standard.

---

## DoD Observations

Production longevity not independently confirmed beyond the merge commit; the feature has since been built upon (kbc-s1 consolidated kanban rendering, removing the board-route integration test this story originally added, without touching the badge-rendering logic itself). The core functional/structural ACs (AC1, AC2, AC5, AC6, and the markup portions of AC3/AC4) have solid automated evidence; the qualitative visual-design bar for AC3/AC4 was accepted at DoR via a manual-verification plan that was never actually executed or recorded.
