'use strict';

const { Pool } = require('pg');

let _pool = null;

function _getPool() {
  if (!_pool && process.env.DATABASE_URL) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
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

async function migrateSchema() {
  const pool = _getPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS journeys (
      journey_id   VARCHAR      PRIMARY KEY,
      tenant_id    VARCHAR,
      owner_id     VARCHAR,
      feature_slug VARCHAR      NOT NULL,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      data         JSONB        NOT NULL DEFAULT '{}'
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS journeys_tenant_id_idx ON journeys (tenant_id)`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS artefacts (
      id            SERIAL       PRIMARY KEY,
      journey_id    VARCHAR      NOT NULL REFERENCES journeys(journey_id),
      skill_name    VARCHAR      NOT NULL,
      artefact_path VARCHAR,
      content       TEXT         NOT NULL DEFAULT '',
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      UNIQUE(journey_id, skill_name)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS artefacts_journey_id_idx ON artefacts (journey_id)`);
}

async function saveArtefact(journeyId, skillName, artefactPath, content) {
  const pool = _getPool();
  if (!pool) return;
  await pool.query(
    `INSERT INTO artefacts (journey_id, skill_name, artefact_path, content)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (journey_id, skill_name)
     DO UPDATE SET content = EXCLUDED.content, artefact_path = EXCLUDED.artefact_path, created_at = NOW()`,
    [journeyId, skillName, artefactPath, content || '']
  );
}

async function getArtefactsForJourney(journeyId) {
  const pool = _getPool();
  if (!pool) return [];
  const result = await pool.query(
    'SELECT skill_name, artefact_path, content FROM artefacts WHERE journey_id = $1 ORDER BY created_at ASC',
    [journeyId]
  );
  return result.rows;
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

module.exports = { saveJourney, listJourneys, migrateSchema, saveArtefact, getArtefactsForJourney };
