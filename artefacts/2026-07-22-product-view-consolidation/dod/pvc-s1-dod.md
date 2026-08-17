# Definition of Done: Consolidate the product view's two module-grouped sections into one, with By Module / By Phase / All tabs and health/search filtering

**PR:** #545 (`pvc-s1: consolidate product view into one tabbed/filtered features section`, commit `86b55049`) | **Merged:** 2026-07-22 (verified via `git show -s --format="%ci" 86b55049` — note: the task brief for this DoD pass cited PR #711, but git log confirms #711 belongs to a different story, `bmau-s1`; #545 is the correct PR for pvc-s1, confirmed directly from `git log --all --grep="pvc-s1"`)
**Story:** artefacts/2026-07-22-product-view-consolidation/stories/pvc-s1-consolidate-and-tab-features-view.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — single consolidated section, no duplication | Yes | `_renderProductView renders exactly one features section, not two, with each module name appearing once (AC1)` — asserts each module heading appears exactly once and the old `Features by module` heading is gone | Integration test | None |
| AC2 — merge by feature_slug, taxonomy precedence | Yes | `mergeFeatureSources: overlapping slug uses taxonomy metadata, keeps journey stage (AC2)` — asserts one merged item, taxonomy name/epicName win, journey stage/journeyId carried | Unit test | None |
| AC3 — journeys-only items surface | Yes | `mergeFeatureSources: a journeys-only slug still appears, tagged source journey (AC3)` (plus supplementary `...taxonomy-only slug appears tagged source taxonomy`) | Unit test | None |
| AC4 — By Module tab, default | Yes | `groupItemsByModule: every module gets a bucket (even empty), unassigned items land in Unclassified (AC4)` (unit) + `_renderProductView: By Module tab is active by default, includes an empty bucket for a module with zero items (AC4)` (integration) | Unit + integration | None |
| AC5 — By Phase tab | Yes | `groupItemsByPhase: groups by epicName, no-epic items land in Other (AC5)` (unit) + `_renderProductView: By Phase tab groups items by epicName (AC5)` (integration) | Unit + integration | None |
| AC6 — All tab, flat list, count parity | Yes | `count parity: merged list length equals byModule total equals byPhase total (AC6)` — run at 120-item scale | Unit test | None |
| AC7 — health filter | Yes | `_renderProductView: 5 health filter chips present, item rows carry data-health (AC7)` — asserts all/green/amber/red/unknown chips and `data-health` attribute | Integration test | None |
| AC8 — search filter | Yes | `_renderProductView: search input present, item rows carry data-search (AC8)` — asserts search input and lowercased `data-search` attribute | Integration test | None |
| AC9 — zero-module fallback preserved | Yes | `_renderProductView: zero modules renders the simple flat fallback, no tabs, no filter bar (AC9)` + `...zero modules and zero items renders "No features yet." without throwing` | Integration test | See Scope Deviations — the *content* of this fallback was intentionally changed from tmc-s1's own version (see below), not left untouched; the AC itself (no tabs/filter bar introduced) is fully satisfied |

All 9 ACs have direct, named test evidence. No untested ACs found.

---

## Scope Deviations

One intentional, documented deviation — not a defect:

- **tmc-s1 AC5 zero-modules fallback superseded.** tmc-s1 had established that a zero-modules product falls back to taxonomy Epics grouping. This story's decisions.md records a deliberate change: the zero-modules fallback now reverts to a4's original simple flat list instead. This is called out explicitly in the story's own Architecture Constraints, in `decisions.md` ("Rationale" bullet 3), and the corresponding tmc-s1 test assertion was updated to match (`tmc-s1: 29/29` re-verified passing post-change per decisions.md). Accepted as an intentional design decision, not an out-of-process regression.

No other deviations found. The story's own Out of Scope section (Test Coverage "Epics" heading, server-side filtering/pagination, nav/Settings changes, module CRUD UI) was respected — none of those areas were touched per `decisions.md`'s implementation summary.

---

## Test Plan Coverage

`check-pvc-s1-consolidate-and-tab-features-view.js`: **14 passed, 0 failed** (freshly re-run 2026-08-17), covering all 9 ACs (U1-U5 unit, IT1-IT5 integration per the test plan) plus one accessibility NFR test (`tab markup uses role=tablist/tab and aria-selected...`).

Per `decisions.md`, regression re-verification at merge time also covered: a1 (26/26), a2 (11/11), a4 (11/11 — one row-attribute fix applied to `_renderPvcItemRow` to preserve a4's own AC2 assertions), tmc-s1 (29/29, one assertion updated for the intentional AC5 supersession above), pr-s2 (37/37). Full 360-file suite: 37 failed, identical to the established pre-existing baseline — zero regressions attributable to this story.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance | Met | Client-side filtering only, no new server round-trips (per story NFR + decisions.md implementation summary); not independently re-verified this pass beyond code inspection cited in decisions.md |
| Accessibility | Met | `tab markup uses role=tablist/tab and aria-selected, matching the settings.js convention` test passes |
| Security | Met | No new mutating routes (render-layer only); `_escapeHtml` convention applied per decisions.md — not covered by a dedicated escaping test in this file, relies on existing repo-wide convention |
| Scale | Met | `count parity` test run at 120 items (exceeds the story's stated 100+ item bar) |

---

## Metric Signal

No benefit-metric artefact exists for this story — it is short-track (per CLAUDE.md's short-track path, discovery through benefit-metric are skipped) and the story's own "Benefit Linkage" section states the benefit directly rather than via a tracked metric: removing the duplicated module sections and adding tab/filter navigation to reduce operator confusion ("doesn't seem correct" — the operator's own observed reaction to the pre-fix state). No quantitative metric signal is available to report.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None. The one LOW finding noted at review (client-side-only filtering may not scale past low-thousands of items) is already tracked as an accepted, out-of-scope future consideration, not an open gap.

---

## DoD Observations

All 9 ACs map to named, currently-passing tests with no fabricated or inferred coverage. The PR number in the original task brief for this DoD pass (#711) was incorrect — verified against git log and corrected to #545 in this document; production longevity beyond the 2026-07-22 merge was not independently re-checked in the live app this pass.
