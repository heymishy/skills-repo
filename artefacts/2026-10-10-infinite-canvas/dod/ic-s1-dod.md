# Definition of Done: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**PR:** https://github.com/heymishy/skills-repo/pull/971 | **Merged:** 2026-10-10
**Story:** artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
**Test plan:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md
**DoR artefact:** artefacts/2026-10-10-infinite-canvas/dor/ic-s1-dor.md
**Assessed by:** Claude (session definition-of-done pass)
**Date:** 2026-10-11

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — 3 stages render as drawflow nodes in position order, connected in sequence | ✅ | Real Chrome tab: 3 nodes (Discover, Evaluate, Buy) rendered left-to-right in position order with a visible connecting line between each | `live-verified` | None at merge. Initially failed pre-fix: `addConnection` was called with each stage's own string id instead of the numeric id `addNode()` returns, throwing inside `drawflow.min.js` and leaving no connection lines drawn. Fixed and re-verified live before merge (commit `49b7a28e`). |
| AC2 — Edit-stage link, Map-feature button, health indicator present and working on each node | ✅ | Real `.click()` dispatch on a canvas node's "Edit stage" link opened the side panel with the correct stage's data (incl. the Moment-of-truth checkbox pre-checked); a real click on "Map feature" opened the feature picker modal | `live-verified` | None at merge. Initially failed pre-fix: the Edit-stage click handler was delegated on `#sw-journey-stages` only, which a canvas node's own link is a sibling of, not a descendant of — clicks silently did nothing. Fixed and re-verified live before merge (commit `538e1504`). |
| AC3 — Moment-of-truth badge appears only on the flagged node | ✅ | Real Chrome tab: "Discover" (flagged) shows the badge; "Evaluate" and "Buy" (unflagged) do not | `live-verified` | None |
| AC4 — 0-stage journey shows the unchanged empty-state message on the Canvas tab | ✅ | Real Chrome tab: "No stages yet. Add your first stage." visible on the Canvas tab for a 0-stage journey | `live-verified` | None at merge. Initially failed pre-fix: the message lives inside `#sw-journey-stages`, which this story's own CSS rule hides specifically on the canvas view — the Canvas tab rendered blank. Fixed and re-verified live before merge (commit `538e1504`). |
| AC5 — `/vendor/drawflow.min.js`/`.css` served via the zero-build vendor pattern (gzip-aware, in-memory cached) | ✅ | 4 tests asserting a real `Buffer.compare` against the actual file read from `node_modules`, for both raw and gzip (`Accept-Encoding`) branches, with gzip round-trip verification | `integration-real-code` | None |
| AC6 — `window.Drawflow` confirmed defined before node-rendering runs; fails loudly (not silently) if the asset didn't load | ✅ | Real Chrome tab, success path: zero console errors, nodes/connections render correctly when the asset loads normally. Real Chrome tab, failure path (this DoD pass): the vendor `<script src>` was deliberately pointed at a non-existent path and reloaded — console shows `drawflow failed to load -- canvas view unavailable`, and the canvas container visibly shows "Canvas failed to load. Please refresh the page." instead of a silent blank canvas | `live-verified` (both branches) | None. This is the one AC where the failure-path half was left as a known evidence gap at the time the PR merged — flagged in `ic-s1-verification.md` as "verified by code inspection, not a live block-and-reload test." Closed out during this DoD pass by performing the actual live block-and-reload check described above; no gap remains. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded against the merged code — the 4 defects found during `/verify-completion`'s own live browser check (addConnection id type, missing vendor `<script>`/`<link>` tags, Edit-stage click delegation scope, empty-state CSS visibility) were all found and fixed **before** merge, not shipped as deviations.

---

## Scope Deviations

None. Confirmed via `git log master..HEAD` before merge (see `/verify-completion`'s Step 3): every commit on the branch mapped directly to this story's own ACs or to standard pipeline bookkeeping (branch-setup, implementation-plan). Nothing from the epic's or story's out-of-scope sections was touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 9 originally planned (grew during implementation: Task 1's own asset tests doubled from 2→4 during code-quality review; 4 further regression tests were added during `/verify-completion` for the defects it found)
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC5 — JS asset, non-gzip | ✅ | ✅ | |
| AC5 — CSS asset, non-gzip | ✅ | ✅ | |
| AC5 — JS asset, gzip | ✅ | ✅ | |
| AC5 — CSS asset, gzip | ✅ | ✅ | |
| AC1 — nodes in position order, auto-connected | ✅ | ✅ | |
| AC1 edge case — 1 stage, 0 connections | ✅ | ✅ | |
| AC2 — Edit-stage/Map-feature controls present | ✅ | ✅ | |
| AC3 — moment-of-truth badge on flagged node only | ✅ | ✅ | |
| AC4 — 0-stage empty state, no nodes | ✅ | ✅ | |
| AC6 — load-guard present in generated script | ✅ | ✅ | |
| AC5/AC6 regression — vendor tags present, correctly ordered | ✅ | ✅ | Added mid-session after the missing-script-tag defect was found live |
| AC4 regression — empty message actually visible on canvas view | ✅ | ✅ | Added mid-session after the CSS-visibility defect was found live |
| AC2 regression — Edit-stage delegated on `document` | ✅ | ✅ | Added mid-session after the click-delegation defect was found live |

Full suite at merge: 734/734. One pre-existing, unrelated flake (`tests/check-pcr-s1-test-runner.js`, a known full-suite-only side effect from another test's own git-commit behaviour) was observed once and confirmed to pass cleanly in isolation.

**Gaps (tests not implemented):** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Canvas render / interaction — no perceptible delay vs. the list view, up to 20 stages | ✅ | Manual observation during the live browser checks this session: a 3-stage render was instant, no perceptible lag. Not separately load-tested at the full 20-stage scale named in the NFR profile — the profile itself notes no formal load-test SLO is warranted at this codebase's current scale (no journey today has more than a handful of stages). |
| Static asset trust level — `/vendor/drawflow.min.js`/`.css` unauthenticated, session/tenant-data-free, same trust level as `/vendor/mermaid.min.js` | ✅ | Code review confirmation: both handlers mirror `handleMermaidAsset()`'s exact existing pattern (`src/web-ui/routes/public.js`), read a static file from `node_modules` and serve it with no session/tenant data in the response path, registered as unauthenticated routes in `server.js` identically to the existing mermaid route. |

The other NFRs in this feature's profile (position-save latency, authorisation/multi-tenancy, input validation) are explicitly scoped to `ic-s2`/`ic-s4`, not `ic-s1` — not applicable to this story's DoD.

---

## Metric Signal

Both feature-level metrics (`m1` — spatial layout actually used; `m2` — operator CX judgment vs. the list view) have an empty `contributingStories` list as of this DoD — real interactivity (position persistence, the behaviour either metric actually measures) ships in `ic-s2`, not `ic-s1`. `ic-s1` replaces the static rendering only; neither metric attributes to it. No signal recorded for this story — Step 6 is not applicable.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. All 4 defects found during this story's own verification passes were fixed and re-verified before merge — nothing deferred.

---

## DoD Observations

1. **All 4 real defects found this session were caught exclusively by live browser checks, not by any of the (eventually 13) passing jsdom tests.** Every jsdom test in `tests/check-ic-s1-canvas-render.js` asserts the generated HTML/script *text* — never whether a real browser actually executes it correctly. Two defects (missing vendor `<script>`/`<link>` tags; `addConnection` called with the wrong id type) would have shipped a completely non-functional Canvas tab. Two more (Edit-stage click delegation scope; empty-state CSS visibility) would have shipped a partially-broken one. This is the clearest evidence yet in this repo's own history for why `/verify-completion`'s live browser render check is mandatory, not optional, for any story that changes rendered UI output — candidate for a `/improve` signal if this pattern recurs on `ic-s2`/`ic-s3`/`ic-s4`.
2. **This DoD pass itself found and closed one further evidence gap**, not a code defect: AC6's "fails loudly if the asset didn't load" half had only code-inspection evidence at merge time (flagged explicitly in `ic-s1-verification.md` rather than silently marked ✅). Closed during this DoD run via a real deliberate-block-and-reload check in Chrome (console error + visible fallback text both confirmed). No code change was needed — the guard was already correct; only the evidence was missing.
3. **A pre-existing, unrelated infra gap was reconfirmed, not introduced:** `fake-test-db.js` has no `customer_journeys` backing in `NODE_ENV=test` with no `DATABASE_URL`, so the two E2E specs touching `/journeys/:id` (`ep1-s3-stage-panel-focus-management.spec.js`, `ep1-s4-stage-reorder.spec.js`) cannot run against the standard local/CI harness. Already logged in this feature's own `decisions.md` (D5); not a new finding from this story.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Render journey stages as connected nodes on a drawflow canvas, replacing the linear list" (ic-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
