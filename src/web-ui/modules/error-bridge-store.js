'use strict';
// coha-s6: duplicate state for the alert-to-GitHub-issue bridge.
// A row per PostHog issue id. status is 'pending' (claimed, issue not yet confirmed) or 'created'.
// The primary key on posthog_issue_id is what makes two simultaneous deliveries unable to both claim.

const CLAIM_WINDOW_SECONDS = 120;

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS production_error_issues (
  posthog_issue_id VARCHAR PRIMARY KEY,
  status           VARCHAR NOT NULL DEFAULT 'pending',
  issue_number     INTEGER,
  claimed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

async function ensureTable(pool) {
  await pool.query(TABLE_SQL);
}

// Returns 'claimed' (this call owns creation), 'takeover' (a stuck pending row older than the window was taken over by
// this call alone), 'created' (already done) or 'inflight' (another delivery holds a live claim).
async function claim(pool, id, windowSeconds) {
  const win = typeof windowSeconds === 'number' ? windowSeconds : CLAIM_WINDOW_SECONDS;
  const ins = await pool.query(
    `INSERT INTO production_error_issues (posthog_issue_id, status, claimed_at) VALUES ($1, 'pending', now())
     ON CONFLICT (posthog_issue_id) DO NOTHING RETURNING posthog_issue_id`, [id]);
  if (ins.rowCount === 1) return 'claimed';
  const take = await pool.query(
    `UPDATE production_error_issues SET claimed_at = now(), updated_at = now()
     WHERE posthog_issue_id = $1 AND status = 'pending' AND claimed_at < now() - make_interval(secs => $2)
     RETURNING posthog_issue_id`, [id, win]);
  if (take.rowCount === 1) return 'takeover';
  const cur = await pool.query('SELECT status FROM production_error_issues WHERE posthog_issue_id = $1', [id]);
  return cur.rows[0] && cur.rows[0].status === 'created' ? 'created' : 'inflight';
}

async function markCreated(pool, id, issueNumber) {
  await pool.query(
    `UPDATE production_error_issues SET status = 'created', issue_number = $2, updated_at = now() WHERE posthog_issue_id = $1`,
    [id, issueNumber]);
}

// After a definite GitHub failure: age the claim so the next delivery's takeover succeeds at once. Only ever touches a
// pending row, and is an UPDATE (never a DELETE) so the primary-key duplicate guard is kept.
async function release(pool, id) {
  await pool.query(
    `UPDATE production_error_issues SET updated_at = now(), claimed_at = now() - interval '1 day'
     WHERE posthog_issue_id = $1 AND status = 'pending'`, [id]);
}

module.exports = { CLAIM_WINDOW_SECONDS, TABLE_SQL, ensureTable, claim, markCreated, release };
