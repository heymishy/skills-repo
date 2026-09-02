# Definition of Done: Fix the Story-Detail Dead End With a Breadcrumb and Back Link

**PR:** https://github.com/heymishy/skills-repo/pull/818 | **Merged:** 2026-09-02
**Story:** artefacts/2026-09-02-product-dashboard-triage/stories/pdt-s4.md
**Test plan:** artefacts/2026-09-02-product-dashboard-triage/test-plans/pdt-s4-test-plan.md
**DoR artefact:** artefacts/2026-09-02-product-dashboard-triage/dor/pdt-s4-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-02

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-pdt-s4-story-breadcrumb.js` — "AC1: Product breadcrumb segment renders using journeyForPage.productId..." | Automated unit test against `handleGetFeatureArtefacts`'s rendered HTML | One minimal query added to resolve productId→name — see Scope Deviations |
| AC1a | ✅ | Same file — two tests: reverse lookup resolves Phase/Epic when found; gracefully omits when not resolvable | Automated unit tests covering both the confirmed live nested-story case and the fully-unresolvable worst case | None |
| AC2 | ✅ | Same file — "AC2 (integration): the breadcrumb product link resolves to that product page via handleGetProductView" | Automated integration test that follows the breadcrumb's own link through the real product route, not just a string check | None |
| AC3 | ✅ | Same file — "AC3: no-artefacts case still shows the breadcrumb and the honest empty message together" | Automated unit test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

One deviation, disclosed at implementation time: the DoR's "no new query" NFR target was read as "no new *lookup mechanism*" rather than literally zero queries — resolving `journeyForPage.productId` to a display name needs one minimal query (`SELECT name FROM products WHERE product_id = $1 AND tenant_id = $2`), the same pattern `handleGetProductView` already uses. An `NFR-Performance` test explicitly confirms the *heavier* reverse-lookup query is skipped entirely when this direct path already resolved — the real performance-sensitive part of the NFR (don't do the expensive scan in the common case) is honored.

A second, disclosed correction: the story's own NFR-Security field understated the AC1a reverse-lookup's real requirement ("no new data exposed... beyond what's already shown"). The reverse-lookup query scans *other products'* cached taxonomy, so it is explicitly tenant-scoped (`WHERE p.tenant_id = $1`) — a genuine security requirement, not scope creep, avoiding the exact class of cross-tenant leak `bri-s3.4` already fixed once in `products.js`.

No other scope deviations. `Redesigning the artefact-content display itself` (the story's Out of Scope item) was not touched.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7
**Tests passing in CI:** 7 / 7 (confirmed via the merged PR's "Lint, typecheck, test, build" check — pass)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: Product breadcrumb segment renders (unit) | ✅ | ✅ | |
| AC1a: Phase/Epic segment resolves via reverse lookup (unit) | ✅ | ✅ | |
| AC1a: Phase/Epic segment gracefully omits when not resolvable (unit) | ✅ | ✅ | |
| AC2: breadcrumb product link resolves through the real product route (integration) | ✅ | ✅ | |
| AC3: no-artefacts case shows breadcrumb + honest message together (integration) | ✅ | ✅ | |
| NFR-Performance: reverse lookup skipped when direct path resolves | ✅ | ✅ | |
| NFR-Accessibility: breadcrumb segments are real, keyboard-navigable `<a>` elements | ✅ | ✅ | |

**Gaps (tests not implemented):** None.

**Additional evidence:** full local suite: 598 file suites, 0 new failures (1 pre-existing, unrelated Windows `pwsh`-invocation failure). Three pre-existing tests that call `handleGetFeatureArtefacts` directly with mock pools (`check-dfr-s1-fix-delete-feature-redirect.js`, `check-alrf-s4-postgres-artefact-fallback.js`, `check-alrf-s10-delete-journey.js`) were checked and confirmed unaffected — verified individually, all still green.

**E2E:** `features.js` is a route file — 3 local Playwright specs reference `/features/:slug`. Found and fixed one genuine regression: a pre-existing test's bare `page.locator('nav')` broke Playwright's strict mode once the new breadcrumb added a legitimate 4th `<nav>` landmark to the page — fixed by scoping to `.first()`. Four other failures across these same specs (a stale hardcoded port expectation, and non-deterministic feature-creation flakiness whose error code even changed between consecutive runs) were investigated and confirmed pre-existing/environmental via `git diff master..HEAD --stat` — this story's diff touches only `features.js` and new test files, nothing related to auth redirects or feature creation. On the merged PR, CI's own `Scenario A E2E (staging)` job initially showed `fail` — investigated via the job log and found `"Canceling since a higher priority waiting request for deploy-group exists"`, the same concurrency-group preemption pattern confirmed on `acdg-s1` earlier in this feature's delivery; a rerun went green cleanly (`gh run rerun ... --failed`).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query for the common case | ✅ | `NFR-Performance` unit test confirms the heavier reverse-lookup query is never attempted when the direct path already resolved a `productId`. |
| Accessibility — breadcrumb links are keyboard-navigable | ✅ | `NFR-Accessibility` unit test confirms real `<a href>` elements inside a semantic `<nav aria-label="Breadcrumb">` landmark. |
| Security — tenant-scoped reverse lookup (correction to the story's own field) | ✅ | The reverse-lookup query's `WHERE p.tenant_id = $1` clause, confirmed present in the merged code and exercised by the AC1a reverse-lookup test's own tenant-scoped fixture (`params[0] === 't1'` gate). |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Metric 1 — Time to First Actionable Content | ✅ (a dead-end detail page costs real re-navigation time, the same "time to reach actionable content" the metric already tracks, measured after a click) | Yes — this is the last of the three contributing stories (`pdt-s1`, `pdt-s2`, `pdt-s4`) | All three contributing stories are now merged: the static duplicate list is gone (`pdt-s1`), the triage strip gives immediate clickable attention-direction (`pdt-s2`), and the story-detail dead end now always has a way back (`pdt-s4`). A live before/after measurement on `skills-framework` staging is the natural closing step for this metric — not performed as part of this DoD run (no active browser session), recorded as `not-yet-measured` pending that check. |

Metric 2 (Health-Signal Trustworthiness) does not list `pdt-s4` in its `contributingStories` — already fully addressed by `pdt-s3`, no signal action for this story.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None blocking. A live staging re-check of Metric 1 (confirming the reduced time-to-actionable-content across all three contributing stories together) would close out its own measurement — worth doing opportunistically. This is the last story in the `product-dashboard-triage` feature; the epic's own `status` should now compute to `complete` once this story's `dodStatus` is set.

---

## DoD Observations

1. This is the third story in this feature where a story-level NFR field (Performance or Security, this time both) needed a small, disclosed correction once real code was investigated — consistent with the `/improve` note already flagged across `pdt-s1`/`pdt-s2`/`pdt-s3`'s own DoDs. The security correction here is the most material of the three: an unscoped reverse lookup would have been a genuine, shippable cross-tenant data leak, not just a UX nit. Worth escalating this specific pattern (NFR-Security fields in DoR/story artefacts systematically under-stating multi-tenant scoping requirements for any new query that scans beyond the requesting user's own already-established context) as a standing DoR-authoring checklist item, not just a one-off note.
2. The `computeOverallHealthSignal` always-green-on-zero-signal gap flagged in `pdt-s3-dod.md` (still latent in `pdt-s1`'s own per-group rolled-up status indicator) remains open — not touched by this story, still a candidate follow-up if full cross-page consistency is wanted.
3. The CI concurrency-preemption false-fail pattern (`"Canceling since a higher priority waiting request for deploy-group exists"`) has now recurred on two separate PRs in this feature (`acdg-s1`'s PR #813 earlier, and this story's PR #818) — both resolved cleanly by `gh run rerun ... --failed`. Worth a light `/improve` note: this repo's own `Scenario A/B E2E (staging)` CI jobs appear to share a single `deploy-group` concurrency lock that preempts an in-flight run whenever a newer one queues, which reads as a real test failure until the job log is checked. A minor CI-workflow tweak (e.g., `cancel-in-progress: false` for this specific group, or a retry step) could remove this recurring, harmless-but-confusing false signal.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Fix the Story-Detail Dead End With a Breadcrumb and Back Link (pdt-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
