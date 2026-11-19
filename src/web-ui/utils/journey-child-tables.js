'use strict';

// vdp-s2: every table whose journey_id REFERENCES journeys(journey_id) with no ON DELETE clause, in the order they must be
// cleared before a journey row can be deleted. session_turns (scripts/migrate-schema-pg.js) and artefacts
// (adapters/journey-store-pg.js) are the two today. Used by deleteJourney and handleDeleteProduct so the two delete paths
// cannot drift apart; tests/check-vdp-s2-delete-product-session-turns.js fails if a new table references journeys and is
// not added here. Table names are interpolated into SQL, so this list is a frozen constant, never built from request data.
const JOURNEY_CHILD_TABLES = Object.freeze(['session_turns', 'artefacts']);

module.exports = { JOURNEY_CHILD_TABLES };
