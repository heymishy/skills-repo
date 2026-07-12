# Benefit Metric: Unified Per-User Identity and Role-Based Access Model for Multi-Tenant Teams

**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Date defined:** 2026-07-12
**Metric owner:** Hamish King — Founder / Operator
**Reviewers:** Hamish King — Founder / Operator (W4 solo-operator posture, per `.github/architecture-guardrails.md`)

---

## Tier Classification

**META-BENEFIT FLAG:** No — standard product feature fixing a real architectural gap (per-tenant role instead of per-person role) before the first real team signs up. No process or tooling hypothesis under test.

**Roadmap alignment:** Not a named Phase 1–6 platform-maturity workstream. This is a pre-launch architectural prerequisite for the commercialisation/wuce SaaS beta track (`product/roadmap.md` § Commercialisation) — teams cannot safely share a tenant until this ships, and retrofitting after real teams exist would be a harder migration than building it now (per discovery's Why Now).

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Per-person role assignment exists

| Field | Value |
|-------|-------|
| **What we measure** | Whether each team member in a shared tenant has an individually assigned role (admin/engineer/product/viewer), keyed by person, not by tenant |
| **Baseline** | 0% — today role is tenant-wide only (`user_roles` keyed by `tenant_id`); no per-person role key exists |
| **Target** | 100% of team members in a shared tenant have a distinct, independently assigned role |
| **Minimum validation signal** | One shared tenant with 2+ people, each holding a different role, proven via an automated test asserting distinct role rows per person (not per tenant) |
| **Measurement method** | Automated test suite asserting per-person role rows; Hamish reviews at each story completion, final count confirmed at DoD |
| **Feedback loop** | If role assignment can still only be expressed per-tenant once this ships, the schema is wrong — stop and re-derive the data model before adding more features on top of it |

### Metric 2: Cross-provider identity collision is resolved, not silently fragmented

| Field | Value |
|-------|-------|
| **What we measure** | Whether the same human logging in via GitHub, Google, or email/password can deliberately link those identities together, with no silent automatic merging |
| **Baseline** | Not yet established — no mechanism exists today to detect the same human across GitHub/Google/email, so current collision behaviour is undefined rather than measured |
| **Target** | An explicit, tested link action exists: a logged-in user can link another provider to their existing identity by authenticating into both, proven end-to-end for at least one provider pair |
| **Minimum validation signal** | The link action works end-to-end for one cross-provider pair (e.g. GitHub + Google), verified by an automated test, before all three pairwise combinations are covered |
| **Measurement method** | Automated multi-provider login + link test suite; Hamish reviews at each story completion |
| **Feedback loop** | If two separately-authenticated sessions can be silently merged without an explicit link action, treat as a P0 security defect (account takeover risk) — halt and fix before shipping further |

### Metric 3: At least one feature is gated by per-person role, not tenant membership

| Field | Value |
|-------|-------|
| **What we measure** | Whether the admin/credits panel denies access to a non-admin team member who shares the same tenant as an admin |
| **Baseline** | 0 — today's `requireAdmin` middleware only checks tenant-wide role, so any member of an admin's tenant would pass |
| **Target** | The admin/credits panel is denied to a non-admin team member sharing the admin's tenant, proven by an automated test |
| **Minimum validation signal** | Extension of the existing `check-arl-s2-admin-middleware.js` test pattern demonstrates denial for a non-admin, same-tenant user |
| **Measurement method** | Automated test extending `check-arl-s2-admin-middleware.js`; Hamish reviews at story completion |
| **Feedback loop** | If a non-admin team member can still reach an admin-gated feature, this is the core promise of the whole feature failing — treat as a P0 defect, not a follow-up |

### Metric 4: Schema holds up at ~100 members per tenant

| Field | Value |
|-------|-------|
| **What we measure** | Whether role/team-membership lookups stay indexed (not a full-table scan) as team size approaches the ~100-member soft ceiling |
| **Baseline** | Unverified beyond 1 member per tenant today — no team ever exceeds 1 person under the current model |
| **Target** | Role/team-membership lookup query time stays within an agreed threshold at 100 synthetic member rows, with no full-table scan |
| **Minimum validation signal** | A load test with 20 synthetic members confirms indexed lookup behaviour (query plan uses an index, not a scan), before scaling the assertion to 100 |
| **Measurement method** | Load test inserting synthetic team-member rows and asserting query time/query-plan; run once at implementation, re-run if the schema changes later |
| **Feedback loop** | If lookups degrade to a full-table scan at realistic team sizes, add the missing index before shipping — this is a correctness-adjacent NFR, not a nice-to-have |

### Metric 5: Zero regression for existing solo tenants

| Field | Value |
|-------|-------|
| **What we measure** | Whether every existing auth/billing/tenancy test continues to pass, unmodified, after the new per-person identity/role model ships |
| **Baseline** | 100% of current auth/billing/tenancy tests pass under today's tenant-wide model |
| **Target** | Same 100% pass rate, unchanged, after the new model ships — no manual migration required for solo (non-team) customers |
| **Minimum validation signal** | `check-arl-s1`, `check-arl-s4`, `check-lab-s2.3`, and equivalent existing suites continue to pass without modification to their assertions, at every story boundary, not just at the end |
| **Measurement method** | Existing test suite, run as part of the standard regression gate at every PR |
| **Feedback loop** | Any regression in an existing solo-tenant test halts the story in progress — fix before proceeding, since silent solo-tenant breakage is the one thing this feature explicitly must not cause |

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — no meta-benefit flag set for this feature.

---

## Tier 3: Compliance and Risk-Reduction Metrics

Not applicable — `context.yml` confirms `meta.regulated: false`, no named compliance framework applies. Metric 3 (per-person role gating) already captures the access-control risk-reduction goal as a Tier 1 product metric, not a distinct regulatory obligation.

---

## Metric Coverage Matrix

<!-- Populated by /definition after stories are created. -->

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Per-person role assignment exists | TBD at /definition | Pending |
| Metric 2 — Cross-provider identity collision resolved | TBD at /definition | Pending |
| Metric 3 — Feature gated by per-person role | TBD at /definition | Pending |
| Metric 4 — Schema holds up at ~100 members/tenant | TBD at /definition | Pending |
| Metric 5 — Zero regression for existing solo tenants | TBD at /definition | Pending |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and spec skills
- Sprint targets or velocity — these metrics are outcome-based, not output-based
