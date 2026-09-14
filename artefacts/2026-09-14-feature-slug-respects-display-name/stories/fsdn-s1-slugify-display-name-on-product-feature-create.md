## Story: Feature-creation via a product's "New feature" panel should build a human-readable featureSlug from the operator's given name

**Epic reference:** None — short-track (bounded backend fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery; scope stated directly below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **the operator creating a new feature via a product's "New feature" panel and typing a name into its optional Name field**,
I want **the resulting `featureSlug` (the identifier used for the artefacts folder, git history, and every trace/attribution tool that keys off it) to be built from the name I typed, the same way the standalone `/journey` "New" form already does**,
So that **my artefacts land in a readable folder like `artefacts/2026-09-14-multi-user-role-sessions/` instead of `artefacts/new-feature-2b74a292/`, which is opaque in git history and in every tool that attributes work by slug**.

## Benefit Linkage

**Metric moved:** None formal — bug fix/consistency gap, per this story's own short-track Benefit Linkage convention.
**How:** Directly closes a gap the operator found first-hand (2026-09-14) while working through a real "Multi-User Role Sessions" discovery session in the live web app: the feature was labelled `new-feature-2b74a292` in production logs and artefact paths. Root-caused to `handlePostProductFeature` (`src/web-ui/routes/products.js`, line ~3363) always building `featureSlug = 'new-feature-' + journeyId.slice(0, 8)`, regardless of the `displayName` the operator can type into the panel's Name field — unlike the standalone `/journey` form's `handlePostJourney` (`src/web-ui/routes/journey.js`, line ~513), which correctly builds `featureSlug = today + '-' + _slugify(featureName)`. The two feature-creation entry points diverge in behaviour with no documented reason for the difference.

## Architecture Constraints

- **Reuse, don't duplicate, the existing `_slugify` helper.** `journey.js` already defines `_slugify(str)` (line 173) and uses it correctly in `handlePostJourney`. Export it from `journey.js`'s `module.exports` (mirroring the `_readPipelineFeatures` export precedent from `rclr-s1`, same day) and `require('./journey')._slugify` from `products.js` — `products.js` already requires `./journey` elsewhere in the same file (lines 2387, 3210), so this is a consistent, low-risk addition.
- **Preserve the existing no-name fallback exactly as `fdn-s1` designed it.** `fdn-s1`'s own comment (`products.js` line 3268) states: "omission (or a blank/whitespace-only value) leaves displayName null, matching today's behaviour (raw slug shown)." This story does NOT change that decision — when `displayName` is null (omitted or blank after trim), `featureSlug` must remain exactly `'new-feature-' + journeyId.slice(0, 8)`, unchanged. Only the case where a real, non-blank `displayName` was actually given changes.
- **Handle the degenerate slugify case.** If `_slugify(displayName)` produces an empty string (e.g. the name is all symbols/emoji with nothing `[a-z0-9]` surviving), fall back to the existing `new-feature-<hash>` scheme rather than emitting a malformed slug like `2026-09-14-` with a trailing dash and nothing else.
- **Inherited, not introduced, characteristic:** same-day slug collisions between two features with identical/near-identical display names are already possible in the standalone `/journey` path today (`today + '-' + _slugify(featureName)` has no per-journey uniqueifier) — this story inherits that exact same characteristic by design (consistency is the goal), it is not a new regression this story is responsible for closing.

## Dependencies

- **Upstream:** None — `_slugify`, `handlePostProductFeature`, and `displayName` parsing (`fdn-s1`) all already exist.
- **Downstream:** None known. Every consumer of `featureSlug` (artefact folder path, `pipeline-state.json` lookups, `cat-s1`'s trace-attribution walker, `_mergeStateFeaturesIntoJourneyList`) already treats it as an opaque string key — none assume the `new-feature-<hash>` shape specifically.

## Acceptance Criteria

**AC1:** Given `handlePostProductFeature` receives a non-blank `displayName` (e.g. "Multi-User Role Sessions"), When the journey is created, Then `featureSlug` is `<today's-date>-<slugified displayName>` (e.g. `2026-09-14-multi-user-role-sessions`) — not `new-feature-<hash>`.

**AC2:** Given `handlePostProductFeature` receives no `displayName` (omitted, or blank/whitespace-only), When the journey is created, Then `featureSlug` remains exactly `'new-feature-' + journeyId.slice(0, 8)`, unchanged from today's behaviour.

**AC3:** Given a `displayName` that slugifies to an empty string (e.g. `"!!!"` or an emoji-only string), When the journey is created, Then `featureSlug` falls back to `'new-feature-' + journeyId.slice(0, 8)` rather than producing a malformed slug.

**AC4:** Given a `displayName` containing mixed case, punctuation, and extra whitespace (e.g. "  Checkout Redesign!! v2  "), When the journey is created, Then `featureSlug` uses the exact same `_slugify` normalization already proven correct by `handlePostJourney`'s existing tests — no new/different normalization logic is introduced.

**AC5:** Given `journey.js`'s `_slugify` is now exported, When `products.js` requires it, Then there is exactly one `_slugify` implementation in the codebase — `products.js` does not define its own copy.

## Out of Scope

- Changing `fdn-s1`'s no-name-given fallback behaviour (raw slug shown as the display label) — that is a separate, already-deliberate decision, not part of this fix.
- De-duplicating same-day slug collisions — an existing, inherited characteristic of the `_slugify`-based scheme shared with the standalone `/journey` path, not introduced or fixed by this story.
- Renaming or backfilling any already-created `new-feature-<hash>`-slugged features (including the `2b74a292` one from this session) — no migration is in scope.
- Any change to the "New feature" panel's own UI/HTML (`products.js` lines ~1069-1128) — the Name field, its placeholder, and its optionality are unchanged; only the server-side slug construction changes.

## NFRs

- **Performance:** negligible — `_slugify` is a synchronous string transform already proven cheap in the existing `/journey` path.
- **Security:** no new external input surface — `displayName` is already read, trimmed, and passed through today (`fdn-s1`); this story only changes what it's used to build, not how it's parsed or validated.
- **Availability:** no change — this is a pure string-construction change with a safe, spec'd fallback (AC3) for the degenerate case.

## Complexity Rating

**Rating:** 1 — small, well-understood, mirrors an already-proven pattern in the same file family.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic — N/A, short-track, no parent epic
