# Test Plan: Feature-creation via a product's "New feature" panel should build a human-readable featureSlug from the operator's given name (fsdn-s1)

**Story:** artefacts/2026-09-14-feature-slug-respects-display-name/stories/fsdn-s1-slugify-display-name-on-product-feature-create.md
**Track:** Short-track

---

## Test Cases

New test file `tests/check-fsdn-s1-feature-slug-display-name.js`, testing `handlePostProductFeature` (`products.js`) with the real `_slugify` export from `journey.js` (no mocking of the slugify logic itself — it must be the real, proven implementation).

| Test | AC | Type | Description |
|------|----|------|-------------|
| T1 | AC1 | Behavioural | A non-blank `displayName` ("Multi-User Role Sessions") produces `featureSlug` = `<today>-multi-user-role-sessions` |
| T2 | AC2 | Regression | An omitted `displayName` produces `featureSlug` = `'new-feature-' + journeyId.slice(0, 8)`, unchanged from today |
| T3 | AC2 | Regression | A blank/whitespace-only `displayName` (`"   "`) produces the same `new-feature-<hash>` fallback as omission |
| T4 | AC3 | Behavioural | A `displayName` of `"!!!"` (slugifies to empty string) falls back to `new-feature-<hash>`, not a malformed slug |
| T5 | AC4 | Regression | A `displayName` with mixed case, punctuation, and extra whitespace ("  Checkout Redesign!! v2  ") normalizes identically to how `handlePostJourney`'s existing `_slugify` usage would normalize the same input |
| T6 | AC5 | Source-inspection | `products.js` does not define its own `_slugify`/`slugify` function — it requires `journey.js`'s exported one |

## Regression coverage

- Existing product-feature-creation tests (any test asserting `handlePostProductFeature`'s current `new-feature-<hash>` behaviour for the no-name case) re-run unmodified — T2/T3 assert this explicitly stays true.
- `handlePostJourney`'s own existing slugify tests re-run unmodified — this story does not touch that function or its tests.

## Out of Scope (per story)

- `fdn-s1`'s no-name-given display-label fallback behaviour.
- Same-day slug collision handling (inherited characteristic, not fixed here).
- Backfilling/renaming already-created `new-feature-<hash>` slugs.
- Any change to the "New feature" panel's HTML/UI.

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
