## Test Plan: Product page row links use the resolved feature slug, not the raw (potentially colliding) story slug

**Story reference:** artefacts/2026-09-04-product-row-link-featureslug-fix/stories/prlf-s1-use-featureslug-in-row-links.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Epic-nested item with differing featureSlug: link uses featureSlug | 1 | — | — | — | — | 🟢 |
| AC2 (regression) | Top-level item, no featureSlug: link falls back to slug | 1 | — | — | — | — | 🟢 |
| AC3 | Real p3.3 collision scenario: link resolves unambiguously | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language — presence/shape assertions on a server-rendered HTML string, matching this repo's own established convention (`_renderPvcItemRow`'s own existing tests). N/A.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — direct function calls with in-test fixtures, no mocked network/DB calls needed (pure/synchronous function)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An item with `slug: 'p3.3'`, `featureSlug: '2026-04-14-skills-platform-phase3'` | Synthetic, in-test | None | |
| AC2 | An item with `slug: 'x'`, no `featureSlug` field | Synthetic, in-test | None | |
| AC3 | Same fixture as AC1, using the real, confirmed slugs from the actual collision | Synthetic, in-test, matching real repo data | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Epic-nested item: row link uses featureSlug, not slug
- **Verifies:** AC1
- **Precondition:** `item = { slug: 'x.1', featureSlug: 'y-feature', name: 'x.1', health: 'green' }` (a synthetic case where slug and featureSlug clearly differ).
- **Action:** Call `_renderPvcItemRow(item)`.
- **Expected result:** The rendered `href` is `/features/y-feature`, not `/features/x.1`.
- **Edge case:** No

### Top-level item: row link falls back to slug (regression guard)
- **Verifies:** AC2
- **Precondition:** `item = { slug: 'top-level-feature', name: 'Top Level Feature', health: 'green' }` — no `featureSlug` field at all, matching `computeTaxonomyRollup`'s own real output shape for `ungrouped[]` items.
- **Action:** Call `_renderPvcItemRow(item)`.
- **Expected result:** The rendered `href` is `/features/top-level-feature`, exactly as it is today.
- **Edge case:** No

### Real p3.3 collision: link resolves to the correct, unambiguous feature
- **Verifies:** AC3
- **Precondition:** `item = { slug: 'p3.3', featureSlug: '2026-04-14-skills-platform-phase3', name: 'p3.3', health: 'green' }` — the real slugs from the confirmed collision.
- **Action:** Call `_renderPvcItemRow(item)`.
- **Expected result:** The rendered `href` is `/features/2026-04-14-skills-platform-phase3` — not `/features/p3.3`, which could resolve to either colliding feature depending on scan order.
- **Edge case:** Yes — this is the real, confirmed collision this story fixes for the primary navigation path.

---

## Out of Scope for This Test Plan

- Any test of `handleGetFeatureArtefacts`'s own server-side resolver — unchanged, already covered by `fal-s1`'s own test file.
- Any test of `computeTaxonomyRollup`'s own `featureSlug` computation — unchanged, already covered by `fal-s1`'s and `pefl-s1`'s own test files.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
