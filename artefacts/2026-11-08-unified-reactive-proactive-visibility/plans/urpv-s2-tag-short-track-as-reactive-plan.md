## Implementation Plan: Tag short-track features as reactive work in the consolidated features view

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s2-tag-short-track-as-reactive.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s2-tag-short-track-as-reactive-test-plan.md

---

## File map

| File | Change |
|------|--------|
| `src/web-ui/modules/product-rollup.js` | Add `_resolveTrack(feature)` helper; carry `track` through `computeTaxonomyRollup`'s epic-nested and ungrouped item construction; carry `track` through `mergeFeatureSources`'s taxonomy-source object literal |
| `src/web-ui/routes/products.js` | Add a `trackTagHtml` text label ("Reactive"/"Planned"/untagged) in `_renderPvcItemRow`, inserted into the row markup between the health span and the coverage span |
| `tests/check-urpv-s2-tag-short-track-as-reactive.js` (new) | Unit + integration tests for AC1-AC4 and the MC-A11Y-02 NFR |

---

## Task 1 (AC1) — `computeTaxonomyRollup` carries `track` through

- **Precondition:** no `track` field exists on any emitted item today.
- **Failing test first:** `check-urpv-s2-tag-short-track-as-reactive.js`'s first three test blocks (ungrouped carry-through, epic-nested carry-through, default-only-when-absent).
- **Implementation:** add `_resolveTrack(feature)` (returns `feature.track` via `hasOwnProperty` check, defaulting to `"standard"` only when the key is genuinely absent); call it once per feature in the `forEach`; add `track: track` to both the epic-nested story item object literal and the ungrouped item object literal.
- **Commit message:** `feat(urpv-s2): carry feature.track through computeTaxonomyRollup (AC1)`

## Task 2 (AC2) — `mergeFeatureSources` resolves `track` from the taxonomy source

- **Failing test first:** the overlap-resolution test block.
- **Implementation:** add `track: item.track` to the taxonomy-source object literal in `mergeFeatureSources`. The journey-only branch is left untouched (no `track` field added there), so a pure journey-only item stays untagged, per Out-of-Scope.
- **Commit message:** `feat(urpv-s2): resolve track from the taxonomy source on overlap (AC2)`

## Task 3 (AC3, AC4, MC-A11Y-02) — render the "Reactive"/"Planned" text label

- **Failing test first:** the four remaining test blocks (By Module/By Phase label presence, standard-track shows "Planned" never "Reactive", journey-only item stays untagged, text-node + token-colour NFR).
- **Implementation:** in `_renderPvcItemRow`, compute `trackTagHtml` from `item.track` (`"short"` → "Reactive" styled `var(--warn)`; any other truthy value → "Planned" styled `var(--muted)`; falsy/absent → empty string, untagged). Insert it into the row's flex container between the health span and the coverage span — this single function backs both the By Module and By Phase tab renderers, so no duplication is needed.
- **Commit message:** `feat(urpv-s2): render Reactive/Planned text label per MC-A11Y-02 (AC3, AC4)`

---

## Verification commands

```
node tests/check-urpv-s2-tag-short-track-as-reactive.js
```
Expected output: `[urpv-s2] Results: 9 passed, 0 failed`

```
node scripts/check-design-tokens.js src/web-ui/routes/products.js
```
Expected: 36 non-token colors found (the pre-existing, RISK-ACCEPTed count — confirms zero new ones introduced by this story).

```
node scripts/check-design-tokens.js src/web-ui/modules/product-rollup.js
```
Expected: `H-DESIGN PASS: no non-token colors found`
