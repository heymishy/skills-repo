# Epic: Sprint 3 — Infrastructure Provisioning (Neon + Upstash)

**Feature:** wuce-multi-tenancy
**Epic slug:** sprint-3-infrastructure-provisioning
**Status:** in-progress

## Rationale

Phase 3 code (p3.1–p3.3) is merged and live. The injectable adapters are wired in server.js but no real Postgres or Redis instances are configured in production — `DATABASE_URL` and `UPSTASH_REDIS_REST_URL` are not set as Fly.io secrets. This epic provisions both managed services (Neon free-tier Postgres, Upstash free-tier Redis), runs the schema migration and smoke tests, and sets the Fly.io secrets required for persistence to activate on the next deploy.

## Stories

| Story | Title | Complexity | Scope stability |
|-------|-------|------------|----------------|
| s3.1 | Neon Postgres provisioning and schema activation | 1 | Stable |
| s3.2 | Upstash Redis provisioning and session persistence activation | 1 | Stable |

## Metric linkage

- **M2** (Cross-tenant journey data leakage prevention): persistence infrastructure is a prerequisite for full M2 measurement in production — without it, data exists in-memory only and is lost on restart.
