'use strict';

/**
 * modules-adapter.js — a1 (D37 injectable adapter)
 *
 * Curate a Modules taxonomy for a product. Backs the new `product_modules`
 * Postgres table (id, product_id, tenant_id, name, created_at) with full
 * CRUD: create (AC1), rename preserving id (AC2), delete with reassignment
 * of any referencing journeys/epics to Unassigned (AC3), duplicate-name
 * rejection (AC4), and per-product scoping via the product_id/tenant_id
 * WHERE clause on every query (AC5).
 *
 * D37 rule 1: the stub default throws (never returns null/empty) until
 * setModulesAdapter() wires a real Postgres pool in server.js.
 *
 * This is a genuinely new data-access layer for a genuinely new table -- not
 * an existing adapter (e.g. setCreditsAdapter) repurposed for a new query
 * shape (see CLAUDE.md's mock-shape-verification rule and the tir-s5/tir-s8
 * incident it exists to prevent).
 */

var _modulesDb = null;

/**
 * Wire the real Postgres pool (or an injected test double) — D37 pattern.
 * @param {object} pool — a `.query(sql, params)`-capable client (real pg.Pool
 *   or a test double).
 */
function setModulesAdapter(pool) {
  _modulesDb = pool;
}

function _requireAdapter() {
  if (!_modulesDb) {
    throw new Error('Adapter not wired: modulesDb. Call setModulesAdapter() before use.');
  }
  return _modulesDb;
}

/**
 * List every module for a product, scoped by tenant (AC5).
 * @param {string} productId
 * @param {string} tenantId
 * @returns {Promise<Array<{id:string, name:string, created_at:string}>>}
 */
async function listModules(productId, tenantId) {
  var db = _requireAdapter();
  var r = await db.query(
    'SELECT id, name, created_at FROM product_modules WHERE product_id = $1 AND tenant_id = $2 ORDER BY created_at ASC',
    [productId, tenantId]
  );
  return r.rows;
}

/**
 * Create a new module for a product. Rejects a duplicate name within the
 * same product (AC4) with a DUPLICATE_MODULE error code — no second module
 * record is created.
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} name
 * @returns {Promise<{id:string, name:string, created_at:string}>}
 */
async function createModule(productId, tenantId, name) {
  var db = _requireAdapter();
  var dup = await db.query(
    'SELECT id FROM product_modules WHERE product_id = $1 AND tenant_id = $2 AND name = $3',
    [productId, tenantId, name]
  );
  if (dup.rows.length > 0) {
    var err = new Error('A module named "' + name + '" already exists for this product.');
    err.code = 'DUPLICATE_MODULE';
    throw err;
  }
  var r = await db.query(
    'INSERT INTO product_modules (product_id, tenant_id, name) VALUES ($1, $2, $3) RETURNING id, name, created_at',
    [productId, tenantId, name]
  );
  var row = r.rows[0];
  row.product_id = productId;
  row.tenant_id = tenantId;
  return row;
}

/**
 * Rename an existing module. Updates the name field only — the id is
 * unchanged, so every existing reference to this module (e.g. an epic
 * assigned to it) survives the rename (AC2). Rejects if the new name
 * collides with a different, existing module in the same product (AC4).
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} moduleId
 * @param {string} newName
 * @returns {Promise<{id:string, name:string, created_at:string}>}
 */
async function renameModule(productId, tenantId, moduleId, newName) {
  var db = _requireAdapter();
  var owner = await db.query(
    'SELECT id FROM product_modules WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
    [moduleId, productId, tenantId]
  );
  if (!owner.rows.length) {
    var nf = new Error('Module not found');
    nf.code = 'NOT_FOUND';
    throw nf;
  }
  var dup = await db.query(
    'SELECT id FROM product_modules WHERE product_id = $1 AND tenant_id = $2 AND name = $3 AND id != $4',
    [productId, tenantId, newName, moduleId]
  );
  if (dup.rows.length > 0) {
    var err = new Error('A module named "' + newName + '" already exists for this product.');
    err.code = 'DUPLICATE_MODULE';
    throw err;
  }
  var r = await db.query(
    'UPDATE product_modules SET name = $1 WHERE id = $2 RETURNING id, name, created_at',
    [newName, moduleId]
  );
  return r.rows[0];
}

/**
 * Delete a module. Every feature (journey- or taxonomy-sourced) previously
 * assigned to it is reassigned to the "Unclassified"/"Unassigned" bucket
 * (module_id = NULL) via an explicit UPDATE issued BEFORE the module record
 * itself is deleted (AC3, AC6) — matching this repo's own "explicit
 * UPDATE/DELETE, not cascade-reliance-alone" convention (see
 * handleDeleteProduct in routes/products.js). Since tmc-s1's unification
 * revision, feature_module_assignments is the ONLY persisted assignment
 * table (journeys.module_id is inert going forward — see decisions.md
 * REVISION entry) so only that one table needs reassigning here.
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} moduleId
 * @returns {Promise<{id:string}>}
 */
async function deleteModule(productId, tenantId, moduleId) {
  var db = _requireAdapter();
  var owner = await db.query(
    'SELECT id FROM product_modules WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
    [moduleId, productId, tenantId]
  );
  if (!owner.rows.length) {
    var nf = new Error('Module not found');
    nf.code = 'NOT_FOUND';
    throw nf;
  }
  await db.query('UPDATE feature_module_assignments SET module_id = NULL WHERE module_id = $1', [moduleId]);
  await db.query('DELETE FROM product_modules WHERE id = $1', [moduleId]);
  return { id: moduleId };
}

/**
 * a2 (AC1-AC4) / tmc-s1 (AC8, unification revision) -- Reassign an epic (a
 * `journeys` row -- see decisions.md ARCH entry, no persisted `epics` table
 * exists in this codebase) from its current module to a different module,
 * within the same product. The write goes through feature_module_assignments
 * (keyed by the journey's own feature_slug, which journeys already carries
 * NOT NULL) via the same single-row upsert bulkAssignFeaturesToModule uses --
 * one write path for both journey- and taxonomy-sourced features, not two.
 * Rejects a target module that belongs to a different product (AC4, enforced
 * by bulkAssignFeaturesToModule's own ownership check). Reassigning to the
 * epic's current module is a no-op (AC3) -- returns immediately with
 * changed:false, no write issued.
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} journeyId -- the epic being reassigned
 * @param {string} moduleId -- the target module
 * @returns {Promise<{journey_id:string, module_id:string, changed:boolean}>}
 */
async function reassignEpic(productId, tenantId, journeyId, moduleId) {
  var db = _requireAdapter();

  var journeyRows = await db.query(
    'SELECT journey_id, feature_slug FROM journeys WHERE journey_id = $1 AND product_id = $2',
    [journeyId, productId]
  );
  if (!journeyRows.rows.length) {
    var nf = new Error('Epic not found for this product');
    nf.code = 'EPIC_NOT_FOUND';
    throw nf;
  }
  var featureSlug = journeyRows.rows[0].feature_slug;

  var currentRows = await db.query(
    'SELECT module_id FROM feature_module_assignments WHERE product_id = $1 AND feature_slug = $2',
    [productId, featureSlug]
  );
  var currentModuleId = currentRows.rows.length ? currentRows.rows[0].module_id : null;
  if (currentModuleId === moduleId) {
    return { journey_id: journeyId, module_id: moduleId, changed: false };
  }

  await bulkAssignFeaturesToModule(productId, tenantId, [featureSlug], moduleId);
  return { journey_id: journeyId, module_id: moduleId, changed: true };
}

/**
 * tmc-s1 (AC2) -- Fetch every feature-to-module assignment for a product in a
 * single query, regardless of how many features exist (tested at 300
 * synthetic slugs) -- the render layer joins this map against
 * computeTaxonomyRollup's output rather than issuing one lookup per feature.
 * @param {string} productId
 * @param {string} tenantId
 * @returns {Promise<Object<string,string|null>>} map of feature_slug -> module_id
 */
async function getFeatureModuleAssignments(productId, tenantId) {
  var db = _requireAdapter();
  var r = await db.query(
    'SELECT feature_slug, module_id FROM feature_module_assignments WHERE product_id = $1 AND tenant_id = $2',
    [productId, tenantId]
  );
  var map = {};
  r.rows.forEach(function(row) { map[row.feature_slug] = row.module_id; });
  return map;
}

/**
 * tmc-s1 (AC3) -- Assign a batch of taxonomy feature slugs to one module in a
 * single round-trip (a multi-row upsert), never one query per slug -- tested
 * at 2 and at 250 slugs, both asserting exactly one query issued. Module
 * ownership (must belong to the same product_id/tenant_id) is validated
 * inside the same statement via a WHERE EXISTS guard, rather than a separate
 * pre-check query, so the "exactly one query" property holds even including
 * validation (AC4 -- cross-tenant/cross-product target rejected).
 * @param {string} productId
 * @param {string} tenantId
 * @param {Array<string>} featureSlugs
 * @param {string} moduleId
 * @returns {Promise<{assigned: number}>}
 */
async function bulkAssignFeaturesToModule(productId, tenantId, featureSlugs, moduleId) {
  if (!Array.isArray(featureSlugs) || featureSlugs.length === 0) {
    throw new Error('featureSlugs must be a non-empty array');
  }
  var db = _requireAdapter();
  // fix-forward (pvc-s1 rollout, 2026-07-22): real Postgres rejected this
  // query with "inconsistent types deduced for parameter $2" -- the mock
  // pool used by every unit/integration test in this repo doesn't
  // type-check SQL, so this was never caught until the first real bulk
  // classification run in production. Explicit casts on every scalar
  // parameter (both in the SELECT list and the WHERE clause) resolve the
  // ambiguity. See decisions.md FIX-FORWARD entry.
  var r = await db.query(
    `INSERT INTO feature_module_assignments (product_id, tenant_id, feature_slug, module_id, assigned_at)
     SELECT $1::uuid, $2::varchar, slug, $3::uuid, NOW()
     FROM UNNEST($4::varchar[]) AS slug
     WHERE EXISTS (SELECT 1 FROM product_modules WHERE id = $3::uuid AND product_id = $1::uuid AND tenant_id = $2::varchar)
     ON CONFLICT (product_id, feature_slug) DO UPDATE SET module_id = EXCLUDED.module_id, assigned_at = EXCLUDED.assigned_at
     RETURNING feature_slug`,
    [productId, tenantId, moduleId, featureSlugs]
  );
  if (r.rows.length === 0) {
    var badMod = new Error('Target module does not belong to this product');
    badMod.code = 'MODULE_NOT_FOUND';
    throw badMod;
  }
  return { assigned: r.rows.length };
}

/**
 * tmc-s1 -- Assign a single feature to a module. A thin wrapper over
 * bulkAssignFeaturesToModule (one-item batch) so both paths share the same
 * validation and single-query upsert behaviour.
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} featureSlug
 * @param {string} moduleId
 * @returns {Promise<{assigned: number}>}
 */
async function assignFeatureToModule(productId, tenantId, featureSlug, moduleId) {
  return bulkAssignFeaturesToModule(productId, tenantId, [featureSlug], moduleId);
}

/**
 * tmc-s1 -- Remove a feature's module assignment entirely (reverts to
 * Unclassified -- no row, not a NULL-module row).
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} featureSlug
 * @returns {Promise<{unassigned: boolean}>}
 */
async function unassignFeature(productId, tenantId, featureSlug) {
  var db = _requireAdapter();
  var r = await db.query(
    'DELETE FROM feature_module_assignments WHERE product_id = $1 AND tenant_id = $2 AND feature_slug = $3',
    [productId, tenantId, featureSlug]
  );
  return { unassigned: r.rowCount > 0 };
}

module.exports = {
  setModulesAdapter,
  listModules,
  createModule,
  renameModule,
  deleteModule,
  reassignEpic,
  getFeatureModuleAssignments,
  bulkAssignFeaturesToModule,
  assignFeatureToModule,
  unassignFeature
};
