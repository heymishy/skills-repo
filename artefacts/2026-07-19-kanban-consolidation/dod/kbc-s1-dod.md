# Definition of Done: Consolidate kanban rendering into one shared pattern; retire /features, /actions, /status in favour of product/org-scoped boards (kbc-s1)

**PR:** #506 (`kbc-s1: Consolidate kanban rendering into shared pattern`, merge commit `297df51e`) | **Merged:** 2026-07-20 (commit timestamp `2026-07-20 08:09:46 +1200`)
**Story:** `artefacts/2026-07-19-kanban-consolidation/stories/kbc-s1.md`
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — Exactly one shared rendering function for every board scope | Yes | U2/U3 ("renders ... via same renderer as U2"), U5 ("tenant aggregate renders via same renderer as U2/U3") all passing; `_renderKanbanColumns` in `kanban-view.js` is the single shared function used by product, org, and tenant callers per `products.js`/`dashboard.js` diff (kanban-view.js +91 lines, no duplicate rendering logic added elsewhere) | Automated (unit) | None |
| AC2 — Product kanban renders real HTML via shared renderer | Yes | IT1 (3 assertions): "product board renders real HTML markup", "includes the journey title", "response body is not raw JSON" — all passing | Automated (integration) | Commit message notes a genuine completeness gap found during verification (`_renderKanbanColumns` missing `data-stage` attribute needed by pre-existing spec `tests/e2e/psh-s6-product-kanban.spec.js`) — fixed within this same PR before merge, not left open |
| AC3 — Org kanban renders real HTML via shared renderer | Yes | IT2 (3 assertions): "org board renders real HTML markup", "includes product-attributed feature", "response body is not raw JSON" — all passing | Automated (integration) | None |
| AC4 — `/dashboard?view=board` renders tenant-wide aggregate board | Yes | U4 (4 assertions: aggregates journeys from both products, not scoped to only the first; correct column/attribution per product) + IT3 (4 assertions: 200 response, `text/html` content-type, both products' journeys present) — all passing | Automated (unit + integration) | None |
| AC5 — `/features`, `/actions`, `/status`, `/status/export` removed outright | Yes | U8 (8 assertions: no reference to `handleGetFeatures`/`handleGetStatus`/`handleGetStatusExport`/`handleGetActionsHtml`, no route registration for `/features`, `/actions`, bare `/status`, no `require` of `routes/status`) + U9 ("no test file requires routes/status or calls handleGetFeatures") — all passing. Corroborated by the merge diff: `status.js` deleted (-135 lines), `features.js` reduced to ideas-only handlers (-88 lines), `dashboard.js` -51 lines, three e2e specs deleted (`wuce19`/`wuce21`/`wuce22`, -338/-355/-323 lines), and `server.js` on current master retains no `/features`\|`/actions`\|`/status` route registrations (confirmed by direct grep) | Automated + direct code inspection | None |
| AC6 — `renderKanban`'s pre-existing rendering behaviour preserved under the generalised shape | Yes | U6 (2 assertions): "legacy {features, ideas} signature still renders correctly", "legacy lane-based structure preserved" — both passing | Automated (unit) | None |

---

## Scope Deviations

None within this story's own boundary. Two items are worth recording as accepted, pre-existing, and explicitly out of scope per the merge commit's own verification notes (not defects introduced by kbc-s1):

1. **`tests/e2e/psh-s6-product-kanban.spec.js` still cannot fully pass end-to-end.** After the `data-stage` fix above, the spec hits an unrelated, pre-existing 404 from `bri-s3.4`'s tenant-ownership check (added to `handleGetProductKanban` after the spec was originally written). The merge commit records this explicitly as "out of scope for kbc-s1, pre-existing test debt from bri-s3.4" — an accepted pre-existing gap, not one this story created.
2. **Two unrelated, pre-existing e2e assertion failures** (`feature-navigation.spec.js`, `wuce20-artefact-index-html.spec.js`) hard-code `localhost:3000` while `playwright.config.js` runs on port 3999 — systemic across the whole e2e suite, confirmed unrelated to this story's route removal, left alone per the merge commit.
3. A genuine but incidental fix landed in the same PR: `.github/workflows/e2e.yml` had a pre-existing invalid-YAML syntax bug (unquoted colon in a plain scalar) unrelated to kbc-s1's own branch history; fixed opportunistically during CI verification.
4. The "ideas" concept was kept optional in the generalised renderer rather than removed, per the story's own Out of Scope guidance — confirmed by U7 (3 passing assertions: no throw when `ideas` absent, renders correctly with none, no broken ideas markup leaks in).

---

## Test Plan Coverage

`tests/check-kanban-consolidation.js` — the count supplied ahead of this assessment ("null passed, null failed") did not reflect an actual execution and was discarded; freshly re-run 2026-08-17, live run: **51 passed, 0 failed.** Coverage spans U1–U9 (unit-level renderer/route-removal checks), IT1–IT3 (integration-level HTTP responses for product/org/tenant scopes), and 2 NFR checks (security escaping, tenant-aggregate performance). All 6 ACs have at least one passing assertion directly cited above.

---

## NFR Status

| NFR | Status | Evidence |
|-----|--------|----------|
| Performance (tenant aggregate stays bounded for a realistic product count) | Met | NFR Performance test: aggregation of 10 products / 50 journeys completes in 1ms — passing |
| Security (user/repo-supplied text escaped on every board) | Met | NFR Security tests (3 assertions): raw `<script>` not present, script tag HTML-escaped, ampersand escaped — all passing |
| Accessibility (non-colour-only health indicators, keyboard navigation preserved) | Not covered by a dedicated automated test | No accessibility-specific assertions exist in `check-kanban-consolidation.js`. Direct code inspection of `kanban-view.js` confirms the NFR is substantively addressed: `_cardHealthLabel` attaches a text label alongside every health colour (explicit inline comment "NFR-Accessibility: health is never colour-only"), cards render as native `<a>` elements and actions as native `<button>` elements (both natively keyboard-focusable), and the validation-failure icon carries `aria-hidden="true"` with an adjacent text label. This is code-inspection evidence, not automated test evidence |
| Audit | Not applicable | Story states no audit logging beyond each scope's existing handler; no change found |

---

## Metric Signal

The story's Benefit Linkage names maintainability of the kanban/board surface directly (collapsing two independently-drifting implementations into one shared renderer) rather than referencing a `/benefit-metric` artefact — consistent with this being a short-track story, which per `CLAUDE.md` skips the `/benefit-metric` step. No benefit-metric artefact exists for this feature folder, and none was expected. This DoD pass did not independently re-measure the "one fix touches every scope" claim beyond confirming AC1's shared-renderer structure holds today.

---

## Outcome

**COMPLETE**
**Follow-up actions:** None required by this story. Optionally: resolve the pre-existing `bri-s3.4` tenant-ownership gap blocking full `psh-s6-product-kanban.spec.js` e2e pass, and the `localhost:3000`-vs-3999 port mismatch in `feature-navigation.spec.js`/`wuce20-artefact-index-html.spec.js` — both belong to other stories' debt, not this one.

---

## DoD Observations

All 6 ACs have direct, currently-passing automated evidence (51/51 in `check-kanban-consolidation.js`, freshly re-run), and the route-removal claim (AC5) is independently corroborated by a direct grep of current `server.js`. The originally-supplied "null passed, null failed" test figure was not an actual run and has been discarded in favour of this live result.
