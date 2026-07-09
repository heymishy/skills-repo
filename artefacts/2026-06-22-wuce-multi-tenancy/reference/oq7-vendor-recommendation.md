# OQ7 — Phase 3 Persistence Vendor Recommendation

**Feature:** wuce-multi-tenancy
**Open question ID:** OQ7
**Date:** 2026-06-29
**Status:** RESOLVED — see Decision 9 in decisions.md

## Resolved decision (2026-06-29)

**Postgres: Neon free tier** (revised from Fly Postgres after operator independent research)
**Redis: Upstash Redis** (unchanged)

The initial recommendation below (Fly Postgres) was revised because it compared only Fly's own offering and missed providers with better fit for a small-friends beta: specifically Neon's genuinely-free tier (no pause, no expiry, no monthly cost) versus Fly Managed Postgres at $38+/month. See Decision 9 in `decisions.md` for full rationale and upgrade triggers.

---

## Original recommendation (superseded)

## Decision required

Sprint 1 (Phase 3 of ADR-025) needs a managed Postgres instance for journey persistence and a managed Redis instance for session storage. No vendor has been selected yet. This recommendation is the input to that decision.

## Recommended stack

**Postgres: Fly.io managed Postgres**
**Redis (sessions): Upstash Redis**

## Rationale

### Fly.io managed Postgres

Fly Postgres is the natural fit for a skills-pipeline deployment that already runs (or will run) on Fly.io infra. Key factors:

- **Co-location:** Fly runs Postgres in the same region as the app, giving sub-millisecond round-trips — critical for journey-store reads on every page load.
- **Operator simplicity:** `fly postgres create` + `fly postgres attach` is a one-command setup with automatic `DATABASE_URL` injection. No separate cloud account, no VPC peering, no IAM role configuration.
- **Cost at current scale:** A single shared-CPU Fly Postgres machine (1 GB RAM) costs ~$7/month. Adequate for hundreds of concurrent beta users; vertical scale-up is a single config change.
- **Backup + HA path:** Fly supports daily snapshots out of the box. HA with a standby replica is a one-line addition when needed (`--initial-cluster-size 2`).
- **Migration path to Stage 2:** If the product outgrows Fly Postgres, migrating to Neon or Supabase (both Postgres-compatible) is a `pg_dump` + connection-string swap — no schema changes, no ORM refactor.

### Upstash Redis (sessions)

Session storage requires a low-latency key-value store with TTL support. Upstash is preferred over a Fly-hosted Redis container for these reasons:

- **Serverless pricing:** Upstash charges per request (first 10k/day free, then ~$0.20/100k). At beta scale (< 1k sessions/day) this is effectively free. A Fly Redis machine costs a flat ~$5/month even when idle.
- **Global edge replication:** Upstash supports multi-region read replicas with one config toggle — useful if the app is later deployed across regions.
- **`connect-redis` compatibility:** Upstash's `@upstash/redis` adapter works with `connect-redis` v4+ via a one-line shim. No custom session adapter needed.
- **TLS by default:** All Upstash connections are TLS-encrypted; no extra config.

## Alternatives considered

| Option | Rejected because |
|--------|-----------------|
| Neon (serverless Postgres) | Cold-start latency on the free tier (200–800ms) is unacceptable for journey-store reads. Acceptable on paid tier but adds $19/month overhead vs Fly's $7. |
| PlanetScale (MySQL) | MySQL is not Postgres; would require schema translation and lose `jsonb` column type used for stages. |
| Railway (Postgres) | Good DX but Railway's free tier was discontinued. Paid tier (~$5/month) is competitive but adds a third cloud provider without additional capability. |
| Fly-hosted Redis container | Flat cost even when idle; no automatic persistence (AOF must be manually enabled). Upstash is superior at beta scale. |
| Vercel KV (Upstash-backed) | Only accessible from Vercel-hosted apps. Not applicable here. |

## Cost estimate (beta scale)

| Service | Monthly cost |
|---------|-------------|
| Fly Postgres (1 GB shared) | ~$7 |
| Upstash Redis (< 10k req/day) | $0 (free tier) |
| **Total** | **~$7/month** |

At 100 active beta users generating ~50 session reads/day each: 5k Redis requests/day → free tier. Journey reads hit Postgres: ~500 queries/day — well within a shared Postgres machine's capacity.

## Migration path from current disk-based store

1. Add `pg` (node-postgres) and `@upstash/redis` + `connect-redis` dependencies.
2. Implement `journey-store-pg.js` satisfying the existing `setDiskAdapter` interface — minimal touchpoints outside the adapter.
3. Write a one-off migration script: `scripts/migrate-disk-journeys-to-pg.js` — reads all `workspace/journeys/*/journey.json` files and inserts into Postgres.
4. Deploy with `DATABASE_URL` and `UPSTASH_REDIS_REST_URL` env vars set; flip `server.js` to use the new adapter.
5. Run migration script post-deploy; verify via `/journey` list.
6. Keep disk files for 30 days as fallback, then archive.

## Prerequisite for Sprint 1 sign-off

Before Sprint 1 (Phase 3 stories) can be specced, the operator must confirm or redirect this recommendation. The schema for `tenant_plan_cap` (Sprint 2 billing gate) will be designed against the Postgres model, not the disk model — so this decision must land before Sprint 2 planning.

## Action items

- [ ] Operator: confirm Fly Postgres + Upstash Redis (or redirect to alternative)
- [ ] If confirmed: create Fly Postgres instance and Upstash account before Sprint 1 coding begins
- [ ] Update `product/tech-stack.md` with confirmed persistence layer
- [ ] Record final decision in `artefacts/2026-06-22-wuce-multi-tenancy/decisions.md` as an architectural entry
