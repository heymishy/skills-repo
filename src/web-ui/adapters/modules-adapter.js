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
 * Delete a module. Every journey (feature/epic) previously assigned to it is
 * reassigned to the "Unassigned" bucket (module_id = NULL) via an explicit
 * UPDATE issued BEFORE the module record itself is deleted (AC3) — matching
 * this repo's own "explicit UPDATE/DELETE, not cascade-reliance-alone"
 * convention (see handleDeleteProduct in routes/products.js), so the
 * reassignment is directly assertable rather than solely dependent on the
 * journeys.module_id ON DELETE SET NULL foreign key.
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
  await db.query('UPDATE journeys SET module_id = NULL WHERE module_id = $1', [moduleId]);
  await db.query('DELETE FROM product_modules WHERE id = $1', [moduleId]);
  return { id: moduleId };
}

/**
 * a2 (AC1-AC4) -- Reassign an epic (a `journeys` row -- see decisions.md ARCH
 * entry, no persisted `epics` table exists in this codebase) from its current
 * module to a different module, within the same product. Rejects a target
 * module that belongs to a different product (AC4). Reassigning to the
 * epic's current module is a no-op (AC3) -- returns immediately with
 * changed:false, no UPDATE issued.
 * @param {string} productId
 * @param {string} tenantId
 * @param {string} journeyId -- the epic being reassigned
 * @param {string} moduleId -- the target module
 * @returns {Promise<{journey_id:string, module_id:string, changed:boolean}>}
 */
async function reassignEpic(productId, tenantId, journeyId, moduleId) {
  var db = _requireAdapter();

  var journeyRows = await db.query(
    'SELECT journey_id, module_id FROM journeys WHERE journey_id = $1 AND product_id = $2',
    [journeyId, productId]
  );
  if (!journeyRows.rows.length) {
    var nf = new Error('Epic not found for this product');
    nf.code = 'EPIC_NOT_FOUND';
    throw nf;
  }

  var moduleRows = await db.query(
    'SELECT id FROM product_modules WHERE id = $1 AND product_id = $2 AND tenant_id = $3',
    [moduleId, productId, tenantId]
  );
  if (!moduleRows.rows.length) {
    var badMod = new Error('Target module does not belong to this product');
    badMod.code = 'MODULE_NOT_FOUND';
    throw badMod;
  }

  if (journeyRows.rows[0].module_id === moduleId) {
    return { journey_id: journeyId, module_id: moduleId, changed: false };
  }

  var r = await db.query(
    'UPDATE journeys SET module_id = $1 WHERE journey_id = $2 RETURNING journey_id, module_id',
    [moduleId, journeyId]
  );
  return Object.assign({ changed: true }, r.rows[0]);
}

module.exports = {
  setModulesAdapter,
  listModules,
  createModule,
  renameModule,
  deleteModule,
  reassignEpic
};
