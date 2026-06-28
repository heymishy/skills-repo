'use strict';

const { Pool } = require('pg');

let _pool = null;

function _getPool() {
  if (!_pool && process.env.DATABASE_URL) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return _pool;
}

function _sanitise(journey) {
  const data = {
    completedStages:   journey.completedStages   || [],
    sessions:          journey.sessions           || {},
    activeSkill:       journey.activeSkill        || null,
    activeSessionId:   journey.activeSessionId    || null,
    mode:              journey.mode               || 'feature',
    complete:          journey.complete           || false,
    completedAt:       journey.completedAt        || null,
    stories:           journey.stories            || [],
    storyList:         journey.storyList          || null,
    currentStoryIndex: journey.currentStoryIndex  || 0,
    productProfile:    journey.productProfile     || 'default'
  };
  // Defensive: strip accessToken from any nested value (should never be there, but guard anyway)
  delete data.accessToken;
  return data;
}

async function saveJourney(journey) {
  const pool = _getPool();
  if (!pool) return;
  const data = _sanitise(journey);
  await pool.query(
    `INSERT INTO journeys (journey_id, tenant_id, owner_id, feature_slug, data)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (journey_id)
     DO UPDATE SET data = EXCLUDED.data, tenant_id = EXCLUDED.tenant_id,
                   owner_id = EXCLUDED.owner_id, feature_slug = EXCLUDED.feature_slug`,
    [journey.journeyId, journey.tenantId || null, journey.ownerId || null, journey.featureSlug, JSON.stringify(data)]
  );
}

async function listJourneys() {
  const pool = _getPool();
  if (!pool) return [];
  const result = await pool.query(
    'SELECT journey_id, tenant_id, owner_id, feature_slug, created_at, data FROM journeys ORDER BY created_at ASC'
  );
  return result.rows.map(function(row) {
    const d = row.data || {};
    return Object.assign({}, d, {
      journeyId:  row.journey_id,
      tenantId:   row.tenant_id,
      ownerId:    row.owner_id,
      featureSlug: row.feature_slug,
      createdAt:  row.created_at
    });
  });
}

module.exports = { saveJourney, listJourneys };
