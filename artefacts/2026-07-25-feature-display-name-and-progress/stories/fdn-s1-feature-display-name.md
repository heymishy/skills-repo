## Story: Give a feature a real name at creation, and let it be renamed afterward

**Short-track:** UX gap — a real live-usage finding, not a bug in delivered behaviour. Reported alongside two related findings (see `../decisions.md`); this story covers the naming/rename part only.

## User Story

As **Hamish King (Founder/Operator)**,
I want **to optionally give a feature a real name when I create it, and rename it at any point afterward**,
So that **my products and kanban boards aren't cluttered with `new-feature-0d55705d`-style slugs that all look identical and tell me nothing about what the feature actually is**.

## Background / Investigation

Every feature's identifier (`featureSlug`) is auto-generated at creation (`src/web-ui/routes/products.js:1611`, `'new-feature-' + journeyId.slice(0, 8)`) — there is no name-input field anywhere in the "New feature" modal (`psh-new-feature-panel`), which today posts only a `startSkill` radio button. There is no rename capability anywhere afterward either (confirmed via a full grep of `src/web-ui/routes/*.js` and `server.js` for any delete/rename/PUT route touching a feature — zero matches).

`featureSlug` is the real identifier used throughout the pipeline — disk artefact paths (`artefacts/<slug>/...`), `pipeline-state.json` keys, journey-store lookups. Renaming *that* after creation would mean migrating folders and rewriting keys across the whole chain — a much larger and riskier change than what's actually being asked for (operator confirmed: "don't want to break a key").

The fix is additive, not a rename of the identifier: `journey-store.js`'s `createJourney`/`setJourneyFields` already accept arbitrary fields via `Object.assign` (`journey-store.js:302`), so a new `displayName` field can be set at creation and updated later without touching `featureSlug` at all. One real persistence gap exists though: `journey-store-pg.js`'s `_sanitise()` (line 18) is an explicit field allowlist for what gets written into the `data` JSONB column — `displayName` must be added there explicitly, or it round-trips correctly in-memory and to local disk (`journey-disk.js` dumps the whole object, no allowlist) but silently disappears after any Postgres-backed server restart (i.e. on staging).

There is also a partial, pre-existing `name` concept for *taxonomy-sourced* features (features already synced from a GitHub repo/discovery artefact — `product-rollup.js`'s `mergeFeatureSources`, line 388, sets `name: item.name` from taxonomy data). Journey-sourced items (anything not yet taxonomy-synced — i.e. every brand-new feature) get no `name` at all today (`mergeFeatureSources` line 411-417), which is why `_renderPvcItemRow`'s `item.name || item.slug` (`products.js:290`) always falls back to the raw slug for new features. `displayName` should feed into that same merge point.

## Architecture Constraints

- **`featureSlug` is never mutated by this story.** It stays the durable, auto-generated identifier behind every disk path, `pipeline-state.json` key, and journey-store lookup, exactly as today.
- **`displayName` is optional at creation.** Do not require it — the "Rough idea" entry path is explicitly for exploring before anything is named; forcing a name too early adds friction that contradicts that path's own purpose. Leaving it blank keeps today's behaviour (slug shown, renameable later).
- **Fix the PG persistence gap as part of this story, not as a follow-up.** Adding `displayName` to `journey-store.js` without also adding it to `journey-store-pg.js`'s `_sanitise()` allowlist would ship a field that silently doesn't survive a staging restart — an easy, low-visibility regression to introduce and not notice locally (local dev typically runs on the disk adapter, not Postgres).
- **Render `displayName` everywhere a feature identity is shown**, falling back to `featureSlug` when absent: the product detail page's feature rows (`_renderPvcItemRow`, `_renderEpicRow`), kanban cards, and the feature artefact-index page title. Do not introduce a second, differently-named "title" concept in any of these surfaces.
- **Rename is a small, explicit action** (e.g. an inline edit affordance next to the displayed name), not a full settings page — this story is scoped to the naming gap only, not a broader feature-settings surface.

## Dependencies

- **Upstream:** None.
- **Downstream:** fps-s1 (progress-proxy badge) renders the same feature rows this story touches; sequence fdn-s1 first to avoid re-touching the same markup twice, though the two stories are otherwise independent.

## Acceptance Criteria

**AC1:** Given the "New feature" modal (either "Rough idea" or "Formed idea" path), When the operator submits it, Then an optional name field is available and, if filled in, is stored as the feature's `displayName` (`POST /products/:productId/features` accepts and persists a `displayName` field via `_journeyStore.setJourneyFields`).

**AC2:** Given a feature with no `displayName` set, When it is rendered anywhere (product detail rows, kanban cards, feature artefact-index page), Then the raw `featureSlug` is shown, unchanged from today's behaviour.

**AC3:** Given a feature with a `displayName` set, When it is rendered in any of those same surfaces, Then the `displayName` is shown instead of the raw slug, and the raw slug remains visible only in the URL/internal references (not duplicated as a second visible label).

**AC4:** Given an existing feature (with or without a `displayName`), When the operator uses the rename affordance, Then a new route updates `displayName` via `_journeyStore.setJourneyFields`, and the change is immediately reflected on next render — without altering `featureSlug`, its disk artefact path, or its `pipeline-state.json` key.

**AC5:** Given `DATABASE_URL` is configured (Postgres-backed persistence, matching staging), When a feature's `displayName` is set or renamed and the server subsequently reloads journeys from Postgres (`loadAllFromPg`), Then the `displayName` value survives the round trip — i.e. `journey-store-pg.js`'s `_sanitise()` includes `displayName` in the persisted `data` blob.

**AC6:** Given a journey-sourced feature (not yet taxonomy-synced) with a `displayName` set, When `product-rollup.js`'s `mergeFeatureSources` builds the merged item list, Then the item's `name` reflects the `displayName` (not left `undefined`, forcing `_renderPvcItemRow`'s slug fallback unnecessarily).

## Out of Scope

- Mutating or migrating `featureSlug` itself.
- A full feature-settings page (delete, module reassignment, etc.) — rename only.
- Product-level rename (separate, not investigated by this story).
- Any change to taxonomy-sourced features' existing `name` resolution — this story only fills the gap for journey-sourced (not-yet-synced) items.

## NFRs

- **Performance:** No new cost — `setJourneyFields` is the existing merge-field mechanism, already called on every journey mutation.
- **Security:** The rename route must enforce the same tenant-ownership check every other journey-scoped route uses (no cross-tenant rename via a guessed `journeyId`).
- **Data integrity:** `displayName`, when present, must be HTML-escaped everywhere it's rendered (matching every other user-supplied string already escaped via `_escapeHtml` in `products.js`).
- **Audit:** Not required — a cosmetic field, no compliance-relevant state.

## Complexity Rating

**Rating:** 2 — mechanically simple (an existing generic field-merge mechanism, no schema migration), but touches four render sites plus a genuine, easy-to-miss persistence gap (PG `_sanitise` allowlist) that has no local-dev signal if skipped.
**Scope stability:** Stable.
