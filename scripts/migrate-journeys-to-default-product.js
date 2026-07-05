'use strict';

async function runMigration(pool, log) {
  var _log = log || { info: function() {}, warn: function() {}, error: function() {} };

  // Find all tenants that have journeys with no product_id
  var tenantsResult = await pool.query('SELECT DISTINCT tenant_id FROM journeys WHERE product_id IS NULL');
  var tenants = tenantsResult.rows.map(function(r) { return r.tenant_id; });

  if (tenants.length === 0) {
    _log.info('[psh-s2] no tenants with NULL product_id journeys — nothing to migrate');
    return;
  }

  _log.info('[psh-s2] migrating ' + tenants.length + ' tenant(s) to Default product');

  for (var i = 0; i < tenants.length; i++) {
    var tenantId = tenants[i];

    // Check if Default product already exists for this tenant (idempotency)
    var existingResult = await pool.query(
      'SELECT product_id FROM products WHERE tenant_id = $1 AND name = $2',
      [tenantId, 'Default']
    );

    var productId;
    if (existingResult.rows.length > 0) {
      productId = existingResult.rows[0].product_id;
      _log.info('[psh-s2] tenant ' + tenantId + ' already has Default product ' + productId + ' — skipping INSERT');
    } else {
      var insertResult = await pool.query(
        `INSERT INTO products (tenant_id, name, description, created_by) VALUES ($1, $2, $3, $4) RETURNING product_id`,
        [tenantId, 'Default', 'Auto-created default product for existing journeys', 'migration']
      );
      productId = insertResult.rows[0].product_id;
      _log.info('[psh-s2] created Default product ' + productId + ' for tenant ' + tenantId);
    }

    // Update all NULL journeys for this tenant to point to the Default product
    var updateResult = await pool.query(
      'UPDATE journeys SET product_id = $1 WHERE tenant_id = $2 AND product_id IS NULL',
      [productId, tenantId]
    );
    _log.info('[psh-s2] updated ' + (updateResult.rowCount || 0) + ' journeys for tenant ' + tenantId);
  }

  _log.info('[psh-s2] migration complete');
}

module.exports = { runMigration };
