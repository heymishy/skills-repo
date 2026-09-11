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
| AC3 — Detail page follows design system | Yes | AC3a–AC3h (8 assertions, markup) + **live Chrome verification 2026-09-11** (see DoD Observation #2): `getComputedStyle`-confirmed real sidebar (`rgb(17, 17, 16)` background), real topbar, `.sw-card` resolving to a real applied background (`rgb(28, 28, 26)`), 2 real `.sw-section-title` elements, against `https://wuce-staging.fly.dev/features/2026-06-17-kanban-feature-detail-cx` | Automated (integration) for markup + live browser verification for the qualitative bar | None remaining |
| AC4 — Single artefact page follows design system and renders markdown | Yes | AC4a–AC4h (8 assertions, markup) + **live Chrome verification 2026-09-11** (see DoD Observation #2): `getComputedStyle`-confirmed `.sw-doc` real serif body font (`"Source Serif 4", Charter, Georgia, serif`), a real rendered heading (32px/600), a real 6-row table, and monospace `pre`/`code` styling (`"JetBrains Mono", ui-monospace, monospace`) with a real resolved background — plus the 404 path (`/artefact/does-not-exist/discovery`) confirmed shell-wrapped, sidebar present, real 404 status | Automated (integration) for markup + live browser verification for the qualitative bar | The verification script's literal expected text ("code block... on a light background") predates this app's dark theme — the monospace font and a real resolved background colour are both confirmed, just dark rather than light; this is a stale wording mismatch in the verification script, not a rendering defect |
| AC5 — No silently dropped features | Yes | AC5a–AC5b (2 assertions): Discovery lane's `stages` includes `ideation`; ideation-stage card renders inside the Discovery lane slice — passing | Automated (unit) | None |
| AC6 — Recursive artefact listing correctness | Yes | AC6a–AC6g (7 assertions): `listLocalArtefacts` exported, returns array, root-level and nested (`dor/`, `stories/`) files included, `type: 'file'` on every item, missing directory returns null to trigger fallback — all passing | Automated (unit + fixture-based) | None |

---

## Scope Deviations

1. **CSS-layout-dependent qualitative verification — closed 2026-09-11, see DoD Observation #2.** AC3 and AC4 include qualitative requirements (page "reads as" the rest of the platform, markdown is "legible," tables "not overlapping," comfortable spacing) that cannot be verified by markup-structure assertions alone. The DoR (H-E2E check) accepted "manual verification scenarios cover the visual gaps" as the mitigation, and `verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md` contains Scenarios 5, 6, and 7 covering exactly this — every result checkbox in that file remained unchecked for nearly 3 months after merge, with no record the manual pass had ever been executed, no Playwright visual-regression coverage, and no `decisions.md` RISK-ACCEPT for this feature. Closed via live `getComputedStyle`-rigor Chrome verification against `wuce-staging.fly.dev` on 2026-09-11 — see DoD Observation #2 for full evidence. Scenarios 1–4 and both edge cases in that same verification script (all targeting `/features?view=board`) are moot, not closed: `kbc-s1` (a later story) removed the `/features?view=board` route entirely, consolidating kanban rendering into the product-scoped board (`/products/:id/kanban`) — an intentional downstream architectural change, not a kfd1 regression. AC1/AC2/AC5, which those scenarios covered, already had solid automated coverage independent of the now-removed route.
2. **AC2's original board-route integration test no longer exists**, not because of a defect but because a later story (kbc-s1) deleted the `/features?view=board` route (`handleGetFeatures`) it exercised, consolidating rendering elsewhere. The test file itself documents this (comment above the AC5 block). `renderKanban`'s badge-rendering behaviour remains directly and fully tested. Accepted as normal downstream evolution, not a kfd1 defect.
3. Out-of-scope items named in the story itself (next-best-action, skill-trigger from board/detail page, in-place editing, drag-and-drop, non-board list view) remain deferred exactly as the story specified — accepted, not a gap.

---

## Test Plan Coverage

`tests/check-kfd1-kanban-card-and-detail-page-cx.js` (freshly re-run 2026-08-17, live run — the previously supplied figure of "null passed, null failed" did not reflect an actual execution and was discarded): **42 passed, 0 failed.** All 6 ACs have passing automated coverage at the markup/behavioural level. Note the count differs from the 45/45 recorded at the original `verify-completion` checkpoint (commit `734f83f2`) because kbc-s1 subsequently removed 3 assertions tied to the now-deleted board-route integration test (see Scope Deviations #2) — not a regression in kfd1's own delivered behaviour.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance (local-first artefact listing, no added latency for ~25 features) | N/A — route removed | The verification script's "Board load time acceptable" edge case targeted `/features?view=board`, which `kbc-s1` later removed entirely; the NFR no longer applies to a route that no longer exists. Not re-tested against the current product-scoped kanban board, which is out of this story's own scope. |
| Security (no auth-guard change; `escHtml` everywhere; `<script>`/`<iframe>` stripping unchanged) | Met | Confirmed by code reuse constraint (ADR-012 renderer reused as-is) and passing escaping assertions (AC3f) |
| Accessibility (truncated titles remain readable via native `title=` tooltip) | Met | AC1e passing — full title present in `title=` attribute |
| Audit (no change to existing audit log calls) | Met | Story constrains this; no route signature change found in the implementation task list that would touch `feature_artefacts_accessed`/`feature_list_accessed` |

---

## Metric Signal

The story links to M1 — WIP visibility (`artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md`), whose target is "all active features visible ... without scrolling" and legible at a glance. This DoD pass did not independently re-measure M1; no metric-review artefact for this specific story was found in the feature folder. The mechanism (title truncation, artefact-count badge, ideation-lane fix, design-system-consistent detail pages) plausibly supports M1 but the metric itself was not re-verified here.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. ~~Execute the unfilled manual verification scenarios (5, 6, 7)~~ — done, 2026-09-11 (see DoD Observation #2). All three passed live against `wuce-staging.fly.dev`, `getComputedStyle`-verified. No Playwright visual-regression spec was added — the live verification closed the gap directly, and adding a permanent automated spec was judged out of scope for a DoD backfill pass; may still be worth doing separately if this design system sees frequent change.
2. Consider adding a `decisions.md` for this feature recording this closure, per the repo's CSS-layout-dependent-AC standard — not done as part of this pass since the finding and its resolution are both already fully recorded in this DoD.

---

## DoD Observations

1. Production longevity not independently confirmed beyond the merge commit; the feature has since been built upon (kbc-s1 consolidated kanban rendering, removing the board-route integration test this story originally added, without touching the badge-rendering logic itself). The core functional/structural ACs (AC1, AC2, AC5, AC6, and the markup portions of AC3/AC4) have solid automated evidence; the qualitative visual-design bar for AC3/AC4 was accepted at DoR via a manual-verification plan that was never actually executed or recorded until this DoD's own 2026-09-11 backfill (see Observation #2).
2. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake.** This was the single most silently-skipped item found in that stocktake: every result checkbox in `verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md` was still blank, no `decisions.md` existed for this feature, and no RISK-ACCEPT had ever been filed for the CSS-layout-dependent gap CLAUDE.md's own B2 rule requires one for — unlike `sob-*`/`wugs-s6`, where the underlying work had actually happened and only the DoD text was stale, here the work itself had never been done. Closed via live Chrome verification against `wuce-staging.fly.dev`:
   - **Scenario 5 (AC3, feature detail page):** navigated to `/features/2026-06-17-kanban-feature-detail-cx`. `getComputedStyle`-confirmed a real sidebar (`background-color: rgb(17, 17, 16)`), a real topbar, one `.sw-card` resolving to a real applied background (`rgb(28, 28, 26)`), and 2 real `.sw-section-title` elements (not just class strings present in markup).
   - **Scenario 6 (AC4, artefact page + markdown rendering):** navigated to `/artefact/2026-06-17-kanban-feature-detail-cx/nfr-profile`. `getComputedStyle`-confirmed `.sw-doc` resolves to a real serif body font (`"Source Serif 4", Charter, Georgia, serif`), a real 32px/600-weight heading, a real paragraph with 26.4px line-height, and a real 6-row table. That artefact had no code block, so monospace/code-block styling was confirmed separately by injecting a `<pre><code>` element into the same live `.sw-doc` container and reading its resolved style: `font-family: "JetBrains Mono", ui-monospace, monospace`, with a real resolved background colour (`rgb(26, 26, 24)` — dark, not light; the verification script's original wording predates this app's dark theme, a stale-script-wording mismatch, not a rendering defect).
   - **Scenario 7 (AC4, 404 path):** navigated to `/artefact/does-not-exist/discovery`. Confirmed sidebar present, "not found" text in the body, and a real `404` status code via a same-page `fetch` — the shell-wrapped 404, not a blank browser-error page.
   - Scenarios 1–4 and both edge cases in the same verification script were not re-run: they target `/features?view=board`, a route `kbc-s1` removed entirely after this story merged (superseded by the product-scoped kanban board). AC1/AC2/AC5, which those scenarios covered, already had solid automated coverage independent of that route, so this is a moot/superseded gap, not an open one.
   - Per this session's own "check `decisions.md`/`pipeline-state.json` first" lesson, `decisions.md` was checked before starting and confirmed absent — correctly signalling this was a genuinely open item, unlike `sob-*`/`wugs-s6` in the same triage wave.
