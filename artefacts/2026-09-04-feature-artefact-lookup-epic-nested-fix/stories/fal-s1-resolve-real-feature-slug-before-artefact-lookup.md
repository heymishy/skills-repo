# Story: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/live-verified bug below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer / product owner clicking into any story on a product page**,
I want **the artefact page to actually find the real, already-recorded artefacts for that story — whether it's a top-level feature or nested inside some other feature's epic, and regardless of how that epic's story list is shaped in `pipeline-state.json`**,
So that **"No artefacts found" only ever appears when artefacts genuinely don't exist, not because the lookup searched the wrong directory**.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric the `dashboard-triage` epic (`pdt-s1`–`pdt-s4`) and `ppg-s1` both targeted, now closing a gap in the artefact-detail page those stories exposed but did not fix.
**How:** Live-verified on `skills-framework.fly.dev` production (2026-09-03/04), immediately after `ppg-s1`'s fix made the product page's real 477-story data properly browsable for the first time. Clicking into `lphf-s2` and `rb-s4` (both real, `dodStatus: complete`, merged-PR stories with fully-recorded artefact paths in `pipeline-state.json`) showed "No artefacts found for this feature". Root cause, confirmed via direct code reading: `handleGetFeatureArtefacts` (`src/web-ui/routes/features.js`) passes the raw URL story slug straight into `_listArtefacts`/`_journeyStore.getJourneyByFeatureSlug`, which search for an `artefacts/{slug}/` directory matching that literal value — correct for a top-level feature (where the story slug IS the feature directory name), but wrong for any story nested inside another feature's `epics[].stories[]`, where the real artefact directory is the *parent feature's* slug (e.g. `2026-08-08-landing-page-hero-features`, not `lphf-s2`). `pdt-s4`'s own breadcrumb fix already resolves this exact "which feature does story ID X belong to" question for its own display purposes (`_resolveBreadcrumbContext`) but was explicitly scoped to navigation only, never wired into the artefact-content fetch. Separately, a repo-wide data check found a second, distinct cause of the same symptom: `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`, built by `shb-s1`) already carries the real parent `featureSlug` on each epic-nested story item — but only when that story is stored as an object; 35 real stories in this repo's own `pipeline-state.json` (e.g. `p3.1a`–`p3.1e` under `2026-04-14-skills-platform-phase3`) store epic-nested stories as bare strings, for which `story.slug || story.id` evaluates to `undefined`, silently breaking the resolution for those stories regardless of any routing fix.

## Architecture Constraints

- **Fix 1 — `computeTaxonomyRollup` (`src/web-ui/modules/product-rollup.js`):** the epic-nested story mapping (`(epic.stories || []).map(function(story) { return { slug: story.slug || story.id, featureSlug: feature.slug }; })`) is changed to `typeof story === 'string' ? story : (story.slug || story.id)` for the `slug` value, so a bare-string story reference (the "Format A"/Phase 1-2-style shape the schema itself documents as valid: `"Story items — may be full story objects... or string slug references"`) resolves correctly instead of producing `undefined`. No change to the object-shaped case, no change to `featureSlug`'s own assignment, no change to any other function in this file.
- **Fix 2 — `handleGetFeatureArtefacts` (`src/web-ui/routes/features.js`):** extracts `_resolveBreadcrumbContext`'s existing taxonomy-scan into a shared resolver that also returns the matched item's real `featureSlug` (falling back to the raw slug itself when the fast path — a direct `journeyForPage` hit, i.e. a genuine top-level feature — already succeeds, or when nothing resolves at all, preserving today's "No artefacts found" behaviour for the case where that's actually correct). Called once, before the artefact fetch. The resolved real feature slug then drives `_journeyStore.getJourneyByFeatureSlug` and `_listArtefacts` — both currently keyed by the raw (sometimes-wrong) URL slug. `_resolveResumeLinksForFeature` takes the `journeyForPage` object itself (not a slug), so it is corrected automatically once `getJourneyByFeatureSlug` receives the resolved slug — confirmed via direct code reading (`features.js` line 162), not a separate call site to thread through. The breadcrumb rendering reuses this same single resolution (no second, duplicate Postgres query).
- Confirmed via direct code reading: the breadcrumb's own display logic (`_renderStoryBreadcrumb`, its Product/Epic segments) and the artefact-page's own `displayTitle` fallback (story ID as the final breadcrumb segment) are unchanged by this story — `pdt-s4`'s own breadcrumb output was already correct; only the *data source feeding the artefact list* was wrong.
- **Known, named limitation — not fixed by this story:** if the same story slug happens to exist in more than one feature/epic across a tenant's products (a real possibility, not enforced unique anywhere in this schema), the resolver returns the first match found, identical to `pdt-s4`'s own pre-existing breadcrumb-resolution behaviour today. Not a regression this story introduces; a pre-existing ambiguity, out of scope to redesign here.
- No new npm dependencies. No database schema change — `product_rollups.taxonomy` already carries everything needed once Fix 1 lands; this is a read-path fix only.

## Dependencies

- **Upstream:** `pdt-s4` (breadcrumb resolution, merged, DoD-complete) and `shb-s1` (taxonomy `featureSlug` field, merged, DoD-complete) — both already built half of what this story needs; `ppg-s1` (merged, DoD-complete) is what made this gap visible in the first place by making the product page's real data properly browsable.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a story nested inside another feature's `epics[].stories[]` as a full object (e.g. `lphf-s2`), When the operator clicks into its artefact page, Then the page resolves the real parent feature slug and finds its actual, already-recorded artefacts — no longer "No artefacts found" for a story that genuinely has artefacts.

**AC2:** Given a story nested as a bare string reference (e.g. `p3.1a`, the Phase 1/2-style shape), When the operator clicks into its artefact page, Then `computeTaxonomyRollup` resolves its `slug` correctly (not `undefined`), and the same real-feature-slug resolution from AC1 applies, finding its actual artefacts.

**AC3 (regression guard):** Given a genuine top-level feature (the story slug IS the real feature directory name, the common/majority case), When the operator clicks into its artefact page, Then behaviour is unchanged from today — the existing fast path (`journeyForPage` resolves directly from the raw slug) is used, no taxonomy scan is triggered, and artefacts are found exactly as they are now.

**AC4 (regression guard):** Given a story slug that genuinely has no resolvable feature (not found via the fast path, not found in any taxonomy scan), When the operator clicks into its artefact page, Then "No artefacts found for this feature" still renders — this story does not change when that message is correct, only when it was previously wrong.

**AC5:** Given the breadcrumb rendered on the artefact page for an epic-nested story, When it renders, Then it shows exactly the same Product/Epic/Story content it does today (`pdt-s4`'s own output, unchanged) — this story only changes the artefact-list data source, not the breadcrumb's own display logic or its resolved product/epic values.

## Out of Scope

- Redesigning the artefact-content display itself, or the artefact viewer route (`/artefact/:featureSlug/:fileSlug`) — only the artefact *index/list* page's own lookup is in scope.
- Handling duplicate story-slug collisions across different features/products — a pre-existing, named limitation shared with `pdt-s4`'s own breadcrumb resolution, not introduced or worsened here.
- Showing the story's own real name/title as the breadcrumb's final segment (currently shows the raw story ID, e.g. "lphf-s2") — would require an additional pipeline-state.json lookup beyond what `product_rollups.taxonomy` currently carries for epic-nested items; a real, separate enhancement, not required to fix "No artefacts found".
- Any change to how `pipeline-state.json` itself stores stories (object vs bare-string) — this story only fixes how the web UI *reads* both existing, schema-valid shapes correctly.

## NFRs

- **Performance:** No new query added — the breadcrumb's own taxonomy-scan query already runs today; this story reuses it once instead of not using its result for the artefact fetch, and removes a redundant second call to the same resolver (currently called once for nothing, effectively, then again for the breadcrumb).
- **Security:** None identified — the taxonomy scan is already tenant-scoped (`WHERE p.tenant_id = $1`), unchanged; no new external input.
- **Accessibility:** None identified — no new interactive element, pure data-resolution fix.
- **Audit:** The existing `feature_artefacts_accessed` audit log entry now logs the resolved real feature slug where it differs from the raw URL slug, so the audit trail reflects which artefacts were actually looked up, not just the URL parameter.

## Complexity Rating

**Rating:** 2 — both root causes are precisely diagnosed via direct code reading (not guessed), and the fix reuses existing, already-tested/shipped logic (`_resolveBreadcrumbContext`'s taxonomy scan, `computeTaxonomyRollup`'s `featureSlug` field) rather than inventing a new resolution mechanism — but touches a data-shape edge case (bare-string story references) that has no existing test coverage today, and threading the resolved slug through three different downstream calls (`journeyStore`, `_listArtefacts`, `_resolveResumeLinksForFeature`) needs care to avoid missing one.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
