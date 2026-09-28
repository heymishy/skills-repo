## Benefit Metric: Tenant Admin Bootstrap

**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Date defined:** 2026-09-28
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No

Standard product metrics only — this is a real functional gap closing (nobody can reach admin on their own tenant), not a tooling/process learning exercise. It also directly resolves a named item already flagged on `product/roadmap.md`'s Commercialisation track ("GitHub OAuth users can't get admin, only email-auth users can").

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Time-to-admin for a brand-new solo signup

| Field | Value |
|-------|-------|
| **What we measure** | Wall-clock time between a brand-new person's very first login (creating a never-before-seen tenant) and that person having `role === 'admin'` resolved in their own session — with zero manual/operator steps in between. |
| **Baseline** | Infinite / never — confirmed live this session: no automatic path exists at all. |
| **Target** | 0 seconds — admin resolved immediately, in the same request as first login. |
| **Minimum validation signal** | Must work reliably across all 3 auth providers (GitHub, Google, email/password) — coverage for only one provider does not meet this signal, since that would repeat the exact GitHub-vs-email inconsistency already flagged on the roadmap. |
| **Measurement method** | Automated integration test asserting `role === 'admin'` immediately post-first-login for a never-before-seen tenant, run for all 3 providers. Confirmed again with a live-Chrome smoke check at DoD (real fresh signup on staging, confirm admin immediately) — matching this feature's own established live-verification discipline. |
| **Feedback loop** | If any provider fails the minimum signal at DoD, the story does not ship for that provider — fix forward before merge, not a deferred follow-up. Owner: Hamish King. |

### Metric 2: % of real tenants with at least one working admin

| Field | Value |
|-------|-------|
| **What we measure** | Distinct real `tenant_id`s (across `team_memberships`) with at least one person resolving `role='admin'`, divided by all distinct real `tenant_id`s. |
| **Baseline** | `[UNKNOWN BASELINE]` — needs a real query before/after; qualitatively, at least one real tenant (the platform owner's own) is confirmed at 0% today. |
| **Target** | 100%. |
| **Minimum validation signal** | 100% for all tenants created *after* ship date is the true floor — pre-existing-tenant backfill coverage may trail briefly if it needs its own migration run, but must reach 100% within the same release window. |
| **Measurement method** | A direct SQL query against real Postgres (`team_memberships` grouped by `tenant_id`, filtered `role='admin'`, cross-referenced against all distinct tenant_ids) — run against both `wuce-staging` and production (`skills-framework`) at DoD, and periodically after. |
| **Feedback loop** | If backfill coverage hasn't reached 100% within the release window, escalate as a blocking gap, not a "known limitation" note — this is the story's own core purpose. Owner: Hamish King. |

### Metric 3: Manual admin-grant interventions needed (support-burden proxy)

| Field | Value |
|-------|-------|
| **What we measure** | Count of times an operator has to manually edit `ADMIN_GITHUB_LOGINS` (or hand-grant admin any other way) after this ships. |
| **Baseline** | Effectively required for every tenant today — the only current route to admin. |
| **Target** | 0. |
| **Minimum validation signal** | 0 in the 30 days following release. |
| **Measurement method** | Absence of any `ADMIN_GITHUB_LOGINS`-related Fly secret edit or support-ticket-driven manual DB grant. The legacy secret itself is slated for removal as part of this feature's own MVP scope (discovery.md), so its continued absence is a natural tripwire — if it needs to be re-set even once, that's a direct signal the fix didn't hold. |
| **Feedback loop** | Any post-release manual intervention triggers a root-cause investigation, not a one-off workaround — the whole point of this feature is that this lever should no longer exist. Owner: Hamish King. |

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Time-to-admin for a brand-new solo signup | TBD at /definition | Gap — no stories yet |
| % of real tenants with at least one working admin | TBD at /definition | Gap — no stories yet |
| Manual admin-grant interventions needed | TBD at /definition | Gap — no stories yet |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
