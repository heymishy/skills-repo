# wuce Beta Readiness Assessment

**Audit date:** 2026-06-29
**Type:** Read-only repo audit against three reference documents:
- `wucebetareadinessdiscoveryprompt.md` (discovery prompt)
- ~~`wucemultitenancybillingreference.md` (ADR-030 phase plan, billing/ledger model, dual-surface authority)~~ — **correction (2026-07-09):** this file was never committed to the repo; the citation was orphaned. The multi-tenancy phase plan it referenced is now formally documented as `.github/architecture-guardrails.md` ADR-025. The billing/ledger model and dual-surface authority content this doc was meant to cover remain genuinely undocumented — not superseded by ADR-025, which covers tenancy isolation only.
- `wucepairingjourney.md` (UI/UX implications of dual-surface pattern)

---

## Step 1 — Actual repo state at audit date

### 1.1 Multi-tenancy (ADR-025)

| Phase | Status | Evidence |
|---|---|---|
| 0 — authz guard fix | ✅ Implemented + merged | p0.1, p0.2 DoD-complete; 25/25 tests pass |
| 1 — tenant identity | ✅ Implemented + merged | p1.1, p1.2 merged; `resolveTenant()` + `TENANT_ORG_ALLOWLIST` live in `auth.js` |
| 2 — storage isolation (filesystem + session) | ✅ Implemented + merged | p2.1, p2.2 merged; 27/27 tests pass; two-tenant filesystem and session-store isolation confirmed |
| 3 — Postgres/Redis persistence | ✅ Code merged (PR #419) | p3.1, p3.2, p3.3 merged; injectable adapters wired; infrastructure provisioning pending (Sprints 3–5) |
| 4 — performance isolation (rate limiting) | ✅ Implemented + merged | p4.1 merged; per-tenant sliding window rate limiter live |
| 5 — security hardening | ✅ Implemented + merged | p5.1 merged; 14/14 adversarial path-traversal tests pass |

**Known accepted gap — journey list not tenant-filtered:** `handleGetJourney` returns all tenants' feature slugs in the list view. Deliberately accepted in p0.2 as "defence-in-depth" — individual journey access is blocked, the list is not filtered. Not a blocking beta item.

### 1.2 Postgres/Redis persistence

Phase 3 code is merged (p3.1/p3.2/p3.3). Injectable adapter interface complete. Not yet live in production — `DATABASE_URL` and `UPSTASH_REDIS_REST_URL/TOKEN` not set as Fly.io secrets. Until Sprint 3 provisions the infrastructure, process restart = all auth sessions lost (users must re-login). Journey metadata survives restarts via disk JSON; active stage chat sessions do not.

### 1.3 Billing/usage gate

**Implemented (s2.1 — complete).** Synchronous cap check via `MAX_JOURNEYS_PER_TENANT` before journey creation; returns HTTP 402 at limit; `tenant-caps.json` supports per-tenant override. This is the minimum viable gate required before beta. Full Stripe/Metronome billing ledger remains deferred.

### 1.4 Analytics (PostHog)

Not yet designed. Zero PostHog references in `src/`. Not blocking for beta — deferred to post-beta.

### 1.5 Dual-surface authority model

Designed, not started. Six open questions from reference doc Section 6 remain unresolved. Confirmed deferred — outer-loop-only for beta v1. No wuce→inner-loop live visibility needed while Hamish is the sole inner-loop executor.

### 1.6 Canvas integration

✅ Implemented + merged (dic.1–5; 16/16 E2E tests pass). Not blocking.

### 1.7 Infrastructure and database skills

✅ Skill files exist and are correct: `infra-definition`, `infra-review`, `infra-plan`, `schema-migration-plan`, `schema-migration-review`. General-purpose; wuce-specific deployment config (Fly.io) is created by Sprint 4.

### 1.8 Onboarding

GitHub OAuth complete. No self-serve — Hamish manually provisions access by setting `TENANT_ORG_ALLOWLIST`. Works for friends beta. Not self-serve for referrals without Hamish in the loop. Acceptable at this stage.

---

## Step 2 — Work sequence

### Sprint 0 — Tenant isolation fixes ✅ COMPLETE

1. s0.1 — `handleGetJourneyResume` access guard + ownerId/tenantId disk persistence (merged)
2. s0.2 — `tenantId = session.login` fallback for individual GitHub users / no-allowlist mode (merged)
3. s0.3 — Tenant-filtered journey list (merged)

### Sprint 1 — Phase 3 persistence code ✅ COMPLETE (code merged, infra pending)

- p3.1 — Postgres journey store adapter (merged, PR #419)
- p3.2 — Redis session store adapter (merged, PR #419)
- p3.3 — Concurrent isolation + restart-survival tests (merged, PR #419)
- Vendor: Neon free tier (Postgres) + Upstash Redis — per Decision 9

### Sprint 2 — Pre-flight usage gate ✅ COMPLETE

- s2.1 — Per-tenant journey creation cap (`MAX_JOURNEYS_PER_TENANT`, HTTP 402, `tenant-caps.json` override) (merged)

### Sprint 3 — Infrastructure provisioning 🔄 DoR SIGNED OFF — ready to execute

- s3.1 — Provision Neon free-tier Postgres; run schema migration; verify smoke test
- s3.2 — Provision Upstash Redis; verify round-trip smoke test with TTL and accessToken strip

### Sprint 4 — Beta deployment and tenant onboarding 🔄 DoR SIGNED OFF — ready to execute

- s4.1 — Set all 7 Fly.io secrets; `fly deploy`; post-deploy smoke test (Neon persist, Redis session survival, billing gate)
- s4.2 — Configure `TENANT_ORG_ALLOWLIST`; provision tenant directories; verify allowlisted and rejected login flows

### Sprint 5 — Beta monitoring 🔄 DoR SIGNED OFF — ready to execute

- s5.1 — Verify log pattern strings in src/; verify monitoring runbook; run `check-beta-health.sh` against live deployment

### Deferred post-beta

- PostHog instrumentation with `tenant_id` tagging
- Stripe/Metronome billing ledger
- Dual-surface authority / inner-loop visibility in wuce UI
- Self-serve onboarding (invite links, email confirmation)
- Journey list tenant filter (accepted gap, low risk at beta scale)
