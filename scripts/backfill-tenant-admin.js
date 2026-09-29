'use strict';

var _defaultLog = { info: function() {}, warn: function() {}, error: function() {} };

async function runMigration(pool, log) {
  var _log = log || _defaultLog;

  var candidatesResult = await pool.query(
    "SELECT DISTINCT tenant_id FROM team_memberships t1 WHERE NOT EXISTS " +
    "(SELECT 1 FROM team_memberships t2 WHERE t2.tenant_id = t1.tenant_id AND t2.role = 'admin')"
  );
  var candidates = candidatesResult.rows.map(function(r) { return r.tenant_id; });

  if (candidates.length === 0) {
    _log.info('[tab-s2] no adminless tenants with members found -- nothing to backfill');
    return { processed: 0, promoted: 0, errors: 0, stopped: false };
  }

  var processed = 0, promoted = 0, errors = 0, stopped = false;

  for (var i = 0; i < candidates.length; i++) {
    var tenantId = candidates[i];
    processed++;
    try {
      var rowsResult = await pool.query(
        'SELECT person_id, tenant_id, role, created_at FROM team_memberships WHERE tenant_id = $1',
        [tenantId]
      );
      var rows = rowsResult.rows.slice().sort(function(a, b) {
        var ta = new Date(a.created_at).getTime();
        var tb = new Date(b.created_at).getTime();
        if (ta !== tb) return ta - tb;
        return a.person_id - b.person_id;
      });

      if (rows.length === 0) continue; // defensive -- should not happen given the candidate query

      var winner = rows[0];
      if (rows.length > 1 && new Date(rows[1].created_at).getTime() === new Date(winner.created_at).getTime()) {
        _log.warn('[tab-s2] tie on minimum created_at for tenant ' + tenantId + ' -- promoting lowest person_id (' + winner.person_id + ')');
      }

      _log.info('[tab-s2] backfilling admin: tenant=' + tenantId + ' person=' + winner.person_id + ' previousRole=' + winner.role + ' timestamp=' + new Date().toISOString());

      await pool.query('UPDATE team_memberships SET role = $3 WHERE person_id = $1 AND tenant_id = $2', [winner.person_id, tenantId, 'admin']);
      promoted++;
    } catch (e) {
      errors++;
      _log.error('[tab-s2] error backfilling tenant ' + tenantId + ': ' + (e.message || e));
    }

    var rate = errors / processed;
    if (rate > 0.10) {
      stopped = true;
      _log.error('[tab-s2] ALERT: error rate ' + (rate * 100).toFixed(1) + '% exceeds 10% threshold after ' + processed + '/' + candidates.length + ' tenants -- stopping migration automatically');
      break;
    }
  }

  _log.info('[tab-s2] migration ' + (stopped ? 'STOPPED' : 'complete') + ': ' + processed + ' processed, ' + promoted + ' promoted, ' + errors + ' errored');
  return { processed: processed, promoted: promoted, errors: errors, stopped: stopped };
}

module.exports = { runMigration: runMigration };

if (require.main === module) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  var Pool = require('pg').Pool;
  var pool = new Pool({ connectionString: process.env.DATABASE_URL });
  runMigration(pool, console)
    .then(function(result) {
      return pool.end().then(function() {
        console.log('[tab-s2] CLI run result: ' + JSON.stringify(result));
        process.exit(result.stopped ? 1 : 0);
      });
    })
    .catch(function(e) {
      console.error('[tab-s2] Migration failed:', e.message);
      pool.end().finally(function() { process.exit(1); });
    });
}
