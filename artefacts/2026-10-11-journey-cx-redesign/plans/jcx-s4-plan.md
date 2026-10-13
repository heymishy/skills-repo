# Persona card, pre-populated from discovery artefacts — Implementation Plan

**Goal:** Make every test in the test plan pass (7 tests: 3 unit, 3 integration, 1 NFR). Add persona columns to `customer_journeys`, a product-scoped discovery-artefact scan, a save handler, and persona card/editor UI on the Customer experience tab.
**Branch:** `feature/jcx-s4`
**Worktree:** `.worktrees/jcx-s4`

---

## Architecture note (confirmed by direct source inspection)

`getProductsNavSummary` (`products.js` line 2658) already queries the legacy `journeys` table directly via SQL (`SELECT journey_id, created_at AS updated_at FROM journeys WHERE product_id = $1`), not through `journey-store-pg.js`'s own JS functions — confirming the real, established pattern for product-scoped queries against this table. `listJourneys()` (`journey-store-pg.js`) confirms the table's own columns: `journey_id, tenant_id, owner_id, feature_slug, product_id, created_at, data`.

**Splitting DB query from file scan (NFR requirement):** the test plan's own NFR requires "the scan function's own implementation contains no `pool.query` call." This means the DB query (resolve `product_id` → `feature_slug`s) must live in `journeys.js`'s own handler code (which already does `pool.query` elsewhere — not restricted), and the NEW `persona-scanner.js` module must be a PURE file-reading function taking an already-resolved array of `feature_slug`s, never touching the DB itself.

**"Who It Affects" section format** (confirmed against a real discovery.md, `2026-10-10-infinite-canvas/discovery.md`): `## Who It Affects` heading, prose until the next `## ` heading. Extracted as raw text, unmodified — no structured name/role/goal parsing (per `/review` finding 1-M1, AC1's own revised wording).

---

## File map

```
Modify:
  src/web-ui/server.js            — add persona_name/persona_role/persona_goal columns
  scripts/migrate-schema-journeys.js — mirror the same columns
  src/web-ui/routes/journeys.js   — getPersonaSuggestions, handlePatchJourneyPersona,
                                     persona card/editor rendering, wire new route

Create:
  src/web-ui/adapters/persona-scanner.js
  tests/check-jcx-s4-persona-card.js
```

---

## Task 1: Migration

In `src/web-ui/server.js`, extend `customer_journeys`'s own inline migration chain (find the block adding `product_id`, add after it):

```javascript
      // jcx-s4 -- new end-customer persona concept (distinct from this
      // platform's own pipeline-discovery personas), confirmed via an
      // ADR-026 reuse-check. Nullable -- a journey with no persona set yet
      // falls through to the suggestion-editor UI, not an error.
      return _creditsPool.query(`ALTER TABLE customer_journeys ADD COLUMN IF NOT EXISTS persona_name TEXT`);
    }).then(function() {
      return _creditsPool.query(`ALTER TABLE customer_journeys ADD COLUMN IF NOT EXISTS persona_role TEXT`);
    }).then(function() {
      return _creditsPool.query(`ALTER TABLE customer_journeys ADD COLUMN IF NOT EXISTS persona_goal TEXT`);
```

Mirror in `scripts/migrate-schema-journeys.js` (same mirroring rule as `jcx-s1`/`jcx-s2`).

---

## Task 2: `persona-scanner.js` (pure file reads, no DB)

```javascript
'use strict';
const fs = require('fs');
const path = require('path');

// jcx-s4 -- extracts the raw text of discovery.md's own "## Who It Affects"
// section (prose until the next "## " heading, or end of file). Returns
// null if absent/empty -- no structured name/role/goal parsing (per
// /review finding 1-M1, AC1's own revised wording: the operator splits
// this raw text into the 3 fields manually).
function extractWhoItAffects(discoveryMdContent) {
  var match = discoveryMdContent.match(/^## Who It Affects\s*\n([\s\S]*?)(?=\n## |\s*$)/m);
  if (!match) return null;
  var text = match[1].trim();
  return text || null;
}

// jcx-s4 -- PURE file reads, zero pool.query calls (NFR: Security). Takes
// an already product-scoped list of feature slugs (resolved by the
// CALLER via SQL) -- this function itself never queries the DB.
function scanForPersonas(featureSlugs, repoRoot) {
  var results = [];
  var resolvedRoot = path.resolve(repoRoot);
  featureSlugs.forEach(function(slug) {
    try {
      var discoveryPath = path.join(resolvedRoot, 'artefacts', slug, 'discovery.md');
      var content = fs.readFileSync(discoveryPath, 'utf8');
      var whoItAffects = extractWhoItAffects(content);
      if (whoItAffects) {
        results.push({ featureSlug: slug, personaText: whoItAffects });
      }
    } catch (_) { /* no discovery.md for this slug (or unreadable) -- skip, not an error */ }
  });
  return results;
}

module.exports = { extractWhoItAffects, scanForPersonas };
```

---

## Task 3: Handler additions in `journeys.js`

```javascript
var _personaScanner = require('../adapters/persona-scanner');

// jcx-s4 -- resolves product_id -> feature_slugs via the SAME query
// pattern already established in products.js's own getProductsNavSummary
// (confirmed by reading that function directly), then delegates to the
// pure-file-read scanner. AC2: a product with zero associated feature_slugs
// (or none with a readable "Who It Affects") returns an empty array, not
// an error.
async function getPersonaSuggestions(pool, productId, repoRoot) {
  if (!productId) return [];
  var fr = await pool.query(
    `SELECT DISTINCT feature_slug FROM journeys WHERE product_id = $1 AND feature_slug IS NOT NULL`,
    [productId]
  );
  var featureSlugs = fr.rows.map(function(r) { return r.feature_slug; });
  return _personaScanner.scanForPersonas(featureSlugs, repoRoot);
}

/**
 * PATCH /journeys/:id/persona -- save the journey's own persona fields.
 * Dual response mode.
 */
async function handlePatchJourneyPersona(req, res, _next, pool) {
  var csrfOk = await _csrf.csrfGuard(req, res);
  if (!csrfOk) return;

  var tenantId = req.session && req.session.tenantId;
  var journeyId = req.params && req.params.id;
  var personaName = req.body && req.body.persona_name;
  var personaRole = req.body && req.body.persona_role;
  var personaGoal = req.body && req.body.persona_goal;

  function notFound(msg) {
    if (res.status) { res.status(404).json({ error: msg }); }
    else { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end(msg); }
  }

  var jr = await pool.query(`SELECT id FROM customer_journeys WHERE id = $1 AND tenant_id = $2`, [journeyId, tenantId]);
  if (!jr.rows[0]) { notFound('journey not found'); return; }

  await pool.query(
    `UPDATE customer_journeys SET persona_name = $1, persona_role = $2, persona_goal = $3 WHERE id = $4`,
    [personaName || null, personaRole || null, personaGoal || null, journeyId]
  );

  if (res.status) { res.status(200).json({ persona_name: personaName, persona_role: personaRole, persona_goal: personaGoal }); }
  else { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ persona_name: personaName, persona_role: personaRole, persona_goal: personaGoal })); }
}
```

In `handleGetJourneyCanvas`:
- Update the journey SELECT: `SELECT id, name, description, product_id, persona_name, persona_role, persona_goal FROM customer_journeys WHERE id = $1 AND tenant_id = $2`.
- AC4: if `journey.persona_name` is set, skip the suggestion scan entirely (don't re-offer stale suggestions) and render the persona CARD (read-only display + "Edit persona" affordance, reusing saved values in the editor form when opened).
- AC1/AC2: if NOT set, call `getPersonaSuggestions(pool, journey.product_id, repoRoot)` and render the editor with those suggestions (or the plain blank form if the array is empty).

Render in the Customer experience view, alongside the emotion curve container (same `sw-stage-annotations--customer-experience` toggle class).

Wire the new route in `server.js`, matching the established `requireNonViewer` pattern.

---

## Task 4: Tests

`tests/check-jcx-s4-persona-card.js` — 7 tests matching the test plan: AC1 (unit: extractWhoItAffects; integration: product-scoped suggestions), AC2 (empty fallback), AC3 (save writes 3 columns), AC4 (re-open shows saved persona, not suggestions), AC5 (2 distinct personas, not merged), NFR (scanner has zero `pool.query` calls — a source-text assertion against `persona-scanner.js`).

---

## Final check

- [ ] All 7 tests pass
- [ ] Full suite green
- [ ] Linux/Node 24 Docker container check before pushing (established lesson from `jcx-s1`'s CI failure)
- [ ] No scope beyond the 5 ACs — no multi-persona, no NLP extraction, no re-sync
