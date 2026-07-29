'use strict';

// src/web-ui/adapters/ideas-store-pg.js — idp-s1
//
// Postgres-backed storage for the kanban board's Ideas backlog
// (src/web-ui/routes/features.js's handleGetIdeas/handlePostIdea/
// handleDeleteIdea), replacing the previous workspace/ideas.json file for
// any environment with DATABASE_URL set. Mirrors src/web-ui/modules/
// product-repo.js's style exactly: plain async functions taking `pool` as
// the first argument, not a class or singleton, so this module is trivially
// testable with a fake pool double.
//
// Root cause this fixes: workspace/ideas.json lives on the running
// container's own filesystem (no Fly volume mounted), so every idea was
// silently wiped on the next redeploy -- which happens on every push to
// master. See artefacts/2026-07-29-ideas-postgres-persistence/stories/
// idp-s1-persist-ideas-in-postgres.md.
//
// No tenant scoping -- preserves the existing single-global-list behaviour
// exactly (see the story's Out of Scope section).

/**
 * Idempotently creates the ideas table. Safe to call on every server
 * startup (CREATE TABLE IF NOT EXISTS is a no-op on repeated calls),
 * matching the existing products/credits/user_roles convention in server.js.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params)
 * @param {{info: Function}} [logger] - injectable logger (defaults to console.log)
 */
async function migrateIdeasSchema(pool, logger) {
  const log = logger || { info: console.log };

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ideas (
      id         VARCHAR      PRIMARY KEY,
      title      VARCHAR(120) NOT NULL,
      notes      VARCHAR(500) NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  log.info('[idp-s1] ideas table ready');
}

/**
 * Returns every idea, newest first is NOT assumed -- matches the existing
 * file-based store's insertion-order behaviour (oldest first, since new
 * ideas were simply pushed onto an array).
 * @param {object} pool
 * @returns {Promise<{ideas: Array<{id: string, title: string, notes: string, createdAt: string}>}>}
 */
async function listIdeas(pool) {
  const result = await pool.query(
    'SELECT id, title, notes, created_at FROM ideas ORDER BY created_at ASC'
  );
  return {
    ideas: result.rows.map(function (row) {
      return {
        id:        row.id,
        title:     row.title,
        notes:     row.notes,
        createdAt: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at,
      };
    }),
  };
}

/**
 * Creates a new idea row.
 * @param {object} pool
 * @param {{title: string, notes?: string}} fields
 * @returns {Promise<{id: string, title: string, notes: string, createdAt: string}>}
 */
async function createIdea(pool, fields) {
  const id        = 'idea-' + Date.now();
  const title     = fields.title;
  const notes     = fields.notes || '';
  const createdAt = new Date();

  await pool.query(
    'INSERT INTO ideas (id, title, notes, created_at) VALUES ($1, $2, $3, $4)',
    [id, title, notes, createdAt]
  );

  return { id, title, notes, createdAt: createdAt.toISOString() };
}

/**
 * Deletes an idea by id.
 * @param {object} pool
 * @param {string} id
 * @returns {Promise<{deleted: boolean}>}
 */
async function deleteIdea(pool, id) {
  const result = await pool.query('DELETE FROM ideas WHERE id = $1', [id]);
  return { deleted: result.rowCount > 0 };
}

module.exports = { migrateIdeasSchema, listIdeas, createIdea, deleteIdea };
