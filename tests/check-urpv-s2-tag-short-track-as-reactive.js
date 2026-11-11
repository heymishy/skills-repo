'use strict';
const assert = require('assert');
const path = require('path');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

const PRODUCT_ROLLUP_PATH = path.resolve(__dirname, '../src/web-ui/modules/product-rollup.js');
const PRODUCTS_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/products.js');
function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }

(function() {
  // AC1, test 1 -- computeTaxonomyRollup carries a feature's real track value through
  try {
    const { computeTaxonomyRollup } = freshRequire(PRODUCT_ROLLUP_PATH);
    const state = {
      features: [
        { slug: 'f-short', name: 'Short feature', track: 'short' },
        { slug: 'f-standard', name: 'Standard feature', track: 'standard' }
      ]
    };
    const result = computeTaxonomyRollup(state);
    const shortItem = result.ungrouped.find(i => i.slug === 'f-short');
    const standardItem = result.ungrouped.find(i => i.slug === 'f-standard');
    assert(shortItem, 'short-track item not found in ungrouped');
    assert(standardItem, 'standard-track item not found in ungrouped');
    assert.strictEqual(shortItem.track, 'short', `expected track "short", got ${shortItem.track}`);
    assert.strictEqual(standardItem.track, 'standard', `expected track "standard", got ${standardItem.track}`);
    pass('computeTaxonomyRollup carries a feature\'s real track value through to the emitted item (ungrouped)');
  } catch (e) { fail('computeTaxonomyRollup carries a feature\'s real track value through (ungrouped)', e); }

  // AC1, test 1b -- same, but for epic-nested stories
  try {
    const { computeTaxonomyRollup } = freshRequire(PRODUCT_ROLLUP_PATH);
    const state = {
      features: [
        { slug: 'f-epic-short', name: 'Epic feature', track: 'short', epics: [
          { slug: 'e1', name: 'Epic 1', stories: ['s1'] }
        ] }
      ]
    };
    const result = computeTaxonomyRollup(state);
    const item = result.groups[0].items[0];
    assert.strictEqual(item.track, 'short', `expected epic-nested item track "short", got ${item.track}`);
    pass('computeTaxonomyRollup carries track through for epic-nested story items too');
  } catch (e) { fail('computeTaxonomyRollup carries track through for epic-nested items', e); }

  // AC1, test 2 -- defaults to "standard" only when the field is genuinely absent
  try {
    const { computeTaxonomyRollup } = freshRequire(PRODUCT_ROLLUP_PATH);
    const stateAbsent = { features: [{ slug: 'f-absent', name: 'No track key' }] };
    const resultAbsent = computeTaxonomyRollup(stateAbsent);
    const absentItem = resultAbsent.ungrouped.find(i => i.slug === 'f-absent');
    assert.strictEqual(absentItem.track, 'standard', `expected default "standard" when key absent, got ${absentItem.track}`);

    const stateEmpty = { features: [{ slug: 'f-empty', name: 'Empty track', track: '' }] };
    const resultEmpty = computeTaxonomyRollup(stateEmpty);
    const emptyItem = resultEmpty.ungrouped.find(i => i.slug === 'f-empty');
    assert.strictEqual(emptyItem.track, '', `expected track to stay "" (present-but-empty), not defaulted, got ${JSON.stringify(emptyItem.track)}`);
    pass('computeTaxonomyRollup defaults track to "standard" only when the key is genuinely absent, not when present-but-falsy');
  } catch (e) { fail('computeTaxonomyRollup default-only-when-absent distinction', e); }

  // AC2 -- mergeFeatureSources resolves track from the taxonomy source on overlap
  try {
    const { mergeFeatureSources } = freshRequire(PRODUCT_ROLLUP_PATH);
    const taxonomy = { groups: [], ungrouped: [{ slug: 'x', name: 'X', track: 'short' }] };
    const journeyFeatures = [{ featureSlug: 'x', journey_id: 'j1', stage: 'definition', track: 'standard' }];
    const merged = mergeFeatureSources(taxonomy, journeyFeatures);
    const item = merged.find(i => i.slug === 'x');
    assert.strictEqual(item.track, 'short', `expected taxonomy source's track "short" to win on overlap, got ${item.track}`);
    pass('mergeFeatureSources resolves track from the taxonomy source on overlap, consistent with name/epicName');
  } catch (e) { fail('mergeFeatureSources track overlap resolution', e); }

  // AC4, test (unit level) -- zero short-track features never produces an incorrectly-tagged item
  try {
    const { computeTaxonomyRollup, mergeFeatureSources } = freshRequire(PRODUCT_ROLLUP_PATH);
    const state = { features: [
      { slug: 'f1', name: 'F1', track: 'standard' },
      { slug: 'f2', name: 'F2', track: 'standard' }
    ] };
    const taxonomy = computeTaxonomyRollup(state);
    const merged = mergeFeatureSources(taxonomy, []);
    const anyReactive = merged.some(i => i.track === 'short');
    assert.strictEqual(anyReactive, false, 'expected zero items with track "short" when no feature is short-track');
    pass('zero short-track features never produces an incorrectly-tagged "short" item');
  } catch (e) { fail('zero short-track features -> no incorrect "short" tagging', e); }

  // AC3 -- rendered item shows a "Reactive" text label in both By Module and By Phase tab views
  try {
    const { _renderPvcItemRow } = freshRequire(PRODUCTS_ROUTE_PATH);
    const shortItem = { slug: 'f-short', name: 'Short feature', track: 'short', health: 'green' };
    const byModuleHtml = _renderPvcItemRow(shortItem, false, false, {}, 'prod-1');
    const byPhaseHtml = _renderPvcItemRow(shortItem, false, true, {}, 'prod-1');
    assert(byModuleHtml.includes('Reactive'), 'By Module row does not contain "Reactive" text label');
    assert(byPhaseHtml.includes('Reactive'), 'By Phase row does not contain "Reactive" text label');
    pass('rendered item shows a "Reactive" text label in both By Module and By Phase tab views');
  } catch (e) { fail('rendered "Reactive" text label present in both tab views', e); }

  // AC4 -- standard-track item never shows "Reactive"; shows "Planned" instead
  try {
    const { _renderPvcItemRow } = freshRequire(PRODUCTS_ROUTE_PATH);
    const standardItem = { slug: 'f-standard', name: 'Standard feature', track: 'standard', health: 'green' };
    const html = _renderPvcItemRow(standardItem, false, false, {}, 'prod-1');
    assert(!html.includes('Reactive'), 'standard-track item incorrectly rendered a "Reactive" label');
    assert(html.includes('Planned'), 'standard-track item does not render a "Planned" label');
    pass('standard-track item never shows "Reactive"; shows "Planned" honestly');
  } catch (e) { fail('standard-track item renders "Planned", never "Reactive"', e); }

  // Out-of-scope confirmation -- an item with no track at all (pure journey-only item) remains untagged
  try {
    const { _renderPvcItemRow } = freshRequire(PRODUCTS_ROUTE_PATH);
    const untaggedItem = { slug: 'f-journey-only', name: 'Journey only', health: 'green' };
    const html = _renderPvcItemRow(untaggedItem, false, false, {}, 'prod-1');
    assert(!html.includes('Reactive'), 'journey-only item (no track) incorrectly rendered "Reactive"');
    assert(!html.includes('>Planned<'), 'journey-only item (no track) incorrectly rendered "Planned" -- should remain untagged per Out-of-Scope');
    pass('a journey-only item with no track data at all remains untagged, per the story\'s own Out-of-Scope');
  } catch (e) { fail('journey-only item with no track remains untagged', e); }

  // NFR -- text node present independent of CSS class; no inline hardcoded colour introduced
  try {
    const { _renderPvcItemRow } = freshRequire(PRODUCTS_ROUTE_PATH);
    const shortItem = { slug: 'f-short', name: 'Short feature', track: 'short', health: 'green' };
    const html = _renderPvcItemRow(shortItem, false, false, {}, 'prod-1');
    const match = html.match(/data-urpv-track="reactive"[^>]*>([^<]*)</);
    assert(match, 'no element with data-urpv-track="reactive" found');
    assert.strictEqual(match[1].trim(), 'Reactive', `expected text node "Reactive", got "${match[1]}"`);
    assert(!/data-urpv-track="reactive"[^>]*style="[^"]*color:\s*#[0-9a-fA-F]{3,6}/.test(html), 'track tag uses a hardcoded hex colour instead of a DESIGN.md token (var(--...))');
    assert(/data-urpv-track="reactive"[^>]*style="[^"]*color:\s*var\(--/.test(html), 'track tag does not use a var(--token) DESIGN.md reference');
    pass('Reactive tag has a non-empty text node and uses a DESIGN.md var(--token) colour, never a hardcoded hex value');
  } catch (e) { fail('Reactive tag text node + token-colour NFR', e); }

  console.log(`\n[urpv-s2] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
