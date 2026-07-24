# Decisions: Make feature rows in a product's view clickable, linking through to persisted conversation/artefacts (frsr-s1)

## item.slug already matches the real artefacts/[slug]/ directory — no journeyId-based resolution needed

**Date:** 2026-07-24
**Context:** The story's Architecture Constraints instructed verifying whether `item.slug` (from `mergeFeatureSources`, `product-rollup.js`) actually matches the real `artefacts/[slug]/` directory name used by `_listArtefacts`, and to resolve via `item.journeyId` if they diverge.
**Decision:** Confirmed directly in `mergeFeatureSources` (`product-rollup.js:388`): `item.slug` is sourced from `f.featureSlug` (the journey's own `featureSlug` field) whenever a journey-sourced item exists, and from the taxonomy's own `slug` field otherwise — both are already the canonical `artefacts/[slug]/` directory name used throughout this codebase (the same convention the "slug must match artefacts/ dir name" pipeline-state rule enforces). No mismatch was found, so `_renderPvcItemRow`'s new `<a href="/features/:slug">` link uses `item.slug` directly, with no journeyId-based slug translation.
**Rationale:** Avoids inventing an unnecessary resolution step for a mapping that already holds; keeping the link simple (`item.slug` straight into the URL) reduces surface area for the fix.

## Artefact-to-session correlation via artefactPath, not skillName/type

**Date:** 2026-07-24
**Context:** `_listArtefacts`'s returned artefact objects carry a plain-language `type` label (e.g. "Ready Check", "Stories") for display, never an internal `skillName` — so matching an artefact row to its `completedStages` entry (which has `skillName`, not a plain-language label) couldn't use `type` directly.
**Decision:** `_resolveResumeLinksForFeature` (`features.js`) keys its lookup by `artefactPath` instead — the exact same repo-relative path both `_listArtefacts`'s `a.path` and `completedStages[].artefactPath` independently derive from the same real artefact file on disk (confirmed by reading both `handlePostGateConfirm`'s and `skills.js`'s own auto-save `completeStage()` call sites, which both pass a real `artefacts/[slug]/...` path).
**Rationale:** Path-based matching is exact and requires no fragile label/skillName inference; it directly reuses data both sides already produce, with zero new fields needed on either side.

## completeStage()'s sessionId parameter is optional, not required

**Date:** 2026-07-24
**Context:** `completeStage()` has two call sites — `journey.js`'s `handlePostGateConfirm` (has `activeSessionId` in scope) and `skills.js`'s auto-save path (has its own local `sessionId` in scope) — both were updated to pass it. Any future or third-party caller that doesn't have a sessionId in scope would otherwise need an unnecessary null placeholder.
**Decision:** `sessionId` is the 5th, optional parameter (after the existing `usageSummary`), defaulting to omitted (`entry.sessionId` is only set `if (sessionId)`). Both real call sites were updated to pass it.
**Rationale:** Keeps the change backward-compatible for any test or caller constructing a `completedStages` entry without a session context, per the same "optional, not breaking" pattern this codebase already uses for `usageSummary`.

## E2E test only exercises AC1 (row navigation); AC2-AC5 stay at the integration level

**Date:** 2026-07-24
**Context:** The DoR contract's test-plan tags AC1 as the only E2E-tagged AC; AC2-AC5 are integration/unit. Reaching a real completed stage with a resolvable session via the mocked-LLM Playwright harness would require driving a full journey through at least one real stage completion (as `bri-s3.2` does for its own, unrelated flow) just to click one artefact-index link — disproportionate for what integration tests covering `handleGetFeatureArtefacts`/`handleGetChatHtml` directly already prove with exact, real assertions (unique marker content, precise 404 messaging, exact call counts).
**Decision:** `tests/e2e/frsr-s1-feature-row-session-resume.spec.js` only drives product + feature creation (no full journey completion) and asserts the feature row's real, keyboard-activatable navigation to `/features/:slug` (AC1). AC2-AC5 are proven by `tests/check-frsr-s1-feature-row-session-resume.js`'s integration tests, which construct the `completedStages`/`sessionId` fixtures directly against the real `journeyStore`/`skills.js`/`features.js` modules.
**Rationale:** Matches the test plan's own AC-to-test-type mapping; avoids a slow, complex E2E build-out for assertions integration tests already prove more precisely and more cheaply.
