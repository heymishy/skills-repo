# Decisions: delete a product with its journeys' artefacts (vdp-s1)

**2026-11-18 | DECISION | Delete artefacts explicitly, in the handler, before journeys**
**Context:** `artefacts.journey_id` references `journeys(journey_id)` with no cascade, and `handleDeleteProduct` deleted journeys directly, so any product whose journey had an artefact failed with a foreign key error (incident `cb7c5cc2-b6c8-4cd2-bedf-476173621b64`).
**Decision:** add one statement to the handler that deletes the artefacts of the product's journeys before the existing journeys delete. No schema change.
**Rationale:** the handler already deletes explicitly rather than relying on cascades, and `scripts/cleanup-e2e-staging-data.js` uses the same order. A schema change would need a migration on three environments.

**2026-11-18 | DECISION | No transaction, and errors still go to authGuard**
**Context:** the handler runs on the shared pool, and `authGuard` already reports any thrown error to the error chain (ecg-s1) and answers 500.
**Decision:** keep sequential statements and let errors propagate.
**Rationale:** a failed delete leaves the product in place and can be run again; catching the error in the handler would hide it from the error chain.

**2026-11-18 | DECISION | Capture the pattern in the review checklist, not in new infrastructure**
**Context:** the operator asked that similar patterns be captured. The pattern is a hard delete of a parent row that skips a dependent table.
**Decision:** add a `REVIEW.md` item that is listed when a route adds a `DELETE FROM journeys` or `DELETE FROM products` line.
**Rationale:** the checklist (rvc-s1) exists to prompt this check on the change that introduces it; a general detector for foreign-key gaps is a larger story.

**2026-11-18 | OPEN | Staging errors never become issues or incidents**
**Context:** `src/web-ui/routes/error-bridge.js` answers `ignored: staging` for any error whose environment is staging. This error reached the error chain from staging and stopped there.
**Decision:** none in this story. The bug is recorded here, not in `workspace/incidents.json` (see the next entry).
**Rationale:** ignoring staging is a deliberate rule, probably to keep E2E noise out of the issue tracker; reversing it is the operator's decision.

**2026-11-19 | DECISION | Incident record removed from workspace/incidents.json**
**Context:** the incident was first recorded there as `cb7c5cc2-b6c8-4cd2-bedf-476173621b64` (type incident). That broke three tests that read the real file and pin it to the two seeded deferred-item records: `check-dsrf-s1-seeded-records.js` (no type:incident record may exist), `check-ddft-s5-web-ui-rendering.js` and `check-itar-s3-web-ui-rendering.js` (both assume zero incidents). CI on PR 1157 failed with those three as new regressions, and master carried the same failure from the first commit.
**Decision:** take the record out of the file and keep the incident description in this file and the story.
**Rationale:** the tests encode a deliberate rule, so loosening them is a separate decision. Recording real incidents in that file needs those tests changed to a fixture, which is the operator's call.
