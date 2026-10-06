# Decisions: feature-slug timezone fix

## Short-track exemption (2026-10-06)

**Context:** Real production incident investigated at the operator's explicit request (duplicate feature records for "customer journey as first class" traced to a UTC-vs-local-timezone date mismatch in feature-slug generation), with an explicit follow-up instruction to fix it ("Yes fix it short track please").
**Decision:** Handled as a short-track story (`/test-plan → /definition-of-ready → coding agent`) — a bounded, well-understood fix reusing already-existing infrastructure (`si-s2`'s `people.timezone` column), not a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent for this exact class of situation (`tvpf-s1`, `dswf-s1`, `wswda-s1`, `spdr-s1`/`spdr-s2`).
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## Investigation method: direct, read-only production database query via `fly ssh console` (2026-10-06)

**Context:** The UI (both the feature-index page and the aggregate `/journeys` list, the latter independently found broken — all entries render blank) could not conclusively confirm whether the operator's benefit-metric work was saved anywhere.
**Decision:** With the operator's explicit request ("Yes please" to a DB-level check), ran read-only `SELECT` queries (schema already known from this repo's own `journey-store-pg.js`) against the real production database, via `fly ssh console -a skills-framework` executing a small Node script that reused the app's own already-configured `DATABASE_URL` — the credential itself was never seen, extracted, or printed.
**Finding:** Two real `journeys` rows exist for this feature name, with different `feature_slug` values one day apart; the `2026-10-04` one has zero completed stages and zero artefacts (abandoned); the `2026-10-05` one has exactly discovery+clarify (2 real artefact rows), no benefit-metric. Benefit-metric was never saved anywhere — not git, not the `artefacts` table, not the journey's own `completedStages`.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## Scope boundary: fix the root cause only, not the existing duplicate records or a broader duplicate-detection feature (2026-10-06)

**Context:** Three related but distinct things were found: (a) the root-cause UTC-only date computation, (b) two already-existing orphaned/duplicate records for this one feature, (c) the general absence of any duplicate-name safeguard.
**Decision:** This story (`fstf-s1`) fixes (a) only. (b) is explicitly left for the operator to decide how to handle (delete the orphan, rename, merge) — not a code change. (c) is named as a real `/improve` candidate in the story's own Out of Scope, not built.
**Rationale:** (b) is data remediation on a specific real feature, a one-time operator decision, not a repeatable code fix. (c) is a meaningfully larger, separate feature (duplicate-detection UX) than the one-line-root-cause date bug this story was asked to fix.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.
