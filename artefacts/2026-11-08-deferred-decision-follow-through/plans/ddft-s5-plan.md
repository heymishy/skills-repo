## Implementation plan: ddft-s5 web UI rendering of deferred-item records

**Story:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
**Date:** 2026-11-12

### Tasks

1. RED: write tests/check-ddft-s5-web-ui-rendering.js (unit tests on render/parse functions, integration through the real handleGetProductView with the real realFetchRepoPath over a stubbed global.fetch, the real committed workspace/incidents.json hash-checked before/after, wiring grep). Confirm failures.
2. Single fetch: split the bounded (3s Promise.race) fetch in src/web-ui/routes/products.js into _fetchIncidentStoreRaw (raw text); _fetchIncidentRecords stays as a thin wrapper. The handler fetches once and derives both `incidents` and `deferredItems` from the same text.
3. Add _parseDeferredItemRecords (type === 'deferred-item' only; untyped counts as an incident, matching incident-store's withDefaultType, inlined because scripts/ is not in the production image), _recordTypeLabel, _renderDeferredItem (text label, inline revisitCondition, escaped, tokens only), _renderDeferredItemsSection.
4. Wire: new trailing `deferredItems` param on _renderProductView and _renderConsolidatedFeaturesSection; the section renders directly after the incidents section.
5. Loosen the trailing-args regex in tests/check-ep4-s2-nav-and-product-link.js (add deferredItems, {0,4}); adjust two tfhc-s1 absence assertions in the itar-s3 test that assumed deferred text appears nowhere on the page.
6. GREEN; run neighbour suites.

### Decisions
- Deferred items render as a sibling section (not literally the same list) because itar-s3's section must keep ignoring deferred-items.
- No file writes to workspace/incidents.json; read-only.
