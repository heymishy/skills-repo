# Decision Log: tenant-admin-bootstrap

**Feature:** Tenant Admin Bootstrap
**Discovery reference:** artefacts/2026-09-26-tenant-admin-bootstrap/discovery.md
**Last updated:** 2026-09-28

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-09-26 | ASSUMPTION | /clarify Q1 (discovery)**
**Decision:** The admin-bootstrap mechanism will extend the existing `tenant_plan`-shaped per-tenant-row pattern (`tenant_id PRIMARY KEY`) rather than introduce a new `tenants` entity or infer "first user" from `team_memberships` row ordering.
**Alternatives considered:** (a) a new first-class `tenants` table with `created_by`/owner fields; (b) no new table, infer "first" purely from the earliest `team_memberships` row for a `tenant_id`, with separate locking to handle races.
**Rationale:** `tenant_plan` already establishes exactly this per-tenant-row pattern in this codebase (a proven, working convention for plan/status state) — reusing it avoids inventing a new concept. An atomic `INSERT ... ON CONFLICT (tenant_id) DO NOTHING RETURNING *` against that table solves both "what does bootstrap attach to" and "race safety for simultaneous first logins" in one primitive, which the `team_memberships`-inference option could not do as cleanly.
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** if a genuine first-class `tenants` entity becomes necessary for unrelated reasons (e.g. billing/ownership features), this bootstrap mechanism should move onto that table instead of `tenant_plan`.
---
**2026-09-28 | ASSUMPTION | /clarify Q2 (discovery)**
**Decision:** For an existing real tenant with members but no admin, the backfill promotes the earliest-created `team_memberships` row for that tenant (by `created_at`) to admin, fully automatic, no operator step; all other existing members' roles are left untouched.
**Alternatives considered:** (a) promote all current members to admin; (b) no auto-promotion, flag for operator manual resolution per tenant.
**Rationale:** Automatic and unambiguous, avoids an operator-toil backlog of manual tenant-by-tenant decisions, and avoids unintentionally changing every existing member's access level (which promoting everyone would do).
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** if "earliest member" turns out not to correlate reliably with "who should actually be admin" once real backfill data is examined (e.g. the earliest member is a departed contractor, not the real owner).
---
**2026-09-28 | ASSUMPTION | /clarify Q3 (discovery)**
**Decision:** Production has been confirmed (not assumed) to share the identical admin-bootstrap gap as `wuce-staging` — `ADMIN_GITHUB_LOGINS` is unset on the real production Fly app (`skills-framework`) too.
**Alternatives considered:** proceed on the assumption that staging mirrors production without checking; treat this repo as having no separate production environment.
**Rationale:** `fly secrets list -a skills-framework` directly confirmed the same missing secret, removing the need to assume — this locks in the discovery artefact's urgency/blast-radius framing as confirmed rather than speculative.
**Made by:** Hamish King (Platform Owner)
**Revisit trigger:** none obvious — this is a factual confirmation, not a policy choice.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->
