'use strict';
// person-locale.js -- fstf-s1: resolves an operator's own saved timezone
// (si-s2's people.timezone column) so a date computed on their behalf (e.g.
// a feature-slug date prefix) reflects their own calendar day, not raw UTC.
//
// Not a D37 injectable adapter: an operator with no saved timezone is the
// expected majority case, not a misconfiguration to alarm on -- every
// failure path (no pool, unresolved identity, unset timezone, a query
// error) silently falls back to today's existing UTC behaviour. See
// decisions.md and the story's own Architecture Constraints.

const { resolvePersonForIdentity } = require('./identity-links');

function _utcToday(date) {
  return (date || new Date()).toISOString().slice(0, 10);
}

function _formatInTimezone(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const map = {};
  parts.forEach(function(p) { map[p.type] = p.value; });
  return map.year + '-' + map.month + '-' + map.day;
}

/**
 * Resolves the YYYY-MM-DD date string for identityKey's own saved timezone,
 * falling back to UTC (today's existing behaviour) whenever the timezone
 * cannot be resolved for any reason.
 * @param {object} pool - pg-Pool-shaped object exposing query(sql, params); may be null/undefined
 * @param {string} identityKey - typically req.session.tenantId
 * @param {Date} [date] - defaults to now; injectable for testing
 * @returns {Promise<string>}
 */
async function getTenantLocalDateString(pool, identityKey, date) {
  const now = date || new Date();
  if (!pool || !identityKey) return _utcToday(now);
  try {
    const personId = await resolvePersonForIdentity(pool, identityKey);
    if (personId == null) return _utcToday(now);
    const result = await pool.query('SELECT timezone FROM people WHERE id = $1', [personId]);
    const timezone = result.rows[0] && result.rows[0].timezone;
    if (!timezone) return _utcToday(now);
    return _formatInTimezone(now, timezone);
  } catch (err) {
    return _utcToday(now);
  }
}

module.exports = { getTenantLocalDateString };
