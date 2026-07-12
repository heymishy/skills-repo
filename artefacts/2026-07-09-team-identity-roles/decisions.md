# Decision Log: 2026-07-09-team-identity-roles

**Feature:** Unified Per-User Identity and Role-Based Access Model for Multi-Tenant Teams
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Last updated:** 2026-07-12

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
**2026-07-09 | SCOPE | discovery/clarify**
**Decision:** Team membership is a first-class concept, independent of auth provider — an admin adds people to a team by identity. GitHub org membership is retained only as a one-time bulk-add convenience at team setup, not the underlying team-membership model.
**Alternatives considered:** (A) GitHub org membership as the sole team-membership signal (team = GitHub org), reusing the existing `TENANT_ORG_ALLOWLIST` scaffolding as-is with no further work. (B) Full first-class team entity with no GitHub-org integration at all.
**Rationale:** Option A would exclude Product/BA team members who authenticate via Google or email with no GitHub org affiliation — a whole named persona in this feature's scope. The hybrid (chosen) keeps GitHub org as a convenience for bulk-adding engineers already in an org, without making it the underlying model.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-09
**Revisit trigger:** If GitHub-org live-sync automation becomes needed (currently deferred — see discovery.md Out of Scope), or if real team structures don't map cleanly to manual per-person add at ~100-user scale.
---
**2026-07-09 | SCOPE | discovery/clarify**
**Decision:** The v1 role list is closed at 4: admin, engineer, product, and viewer (read-only, no write access anywhere).
**Alternatives considered:** (A) 3 roles only — admin/engineer/product, no viewer. (B) Mirror the full persona set from `product/mission.md` (developer/engineer, tech lead/squad lead, platform maintainer, product/BA, UX designer, UX researcher, CoP leads — 7 roles).
**Rationale:** 4 roles covers the real team composition described (including a non-participating stakeholder need) without over-building the role taxonomy before real usage data exists. The full persona mirror (option B) is more complete but likely more granularity than MVP needs to prove the per-person-role mechanism.
**Made by:** Hamish King (Founder/Operator), via /clarify, 2026-07-09
**Revisit trigger:** If real usage shows a need for finer-grained roles (e.g. billing-only, per-CoP-discipline roles) beyond this initial set.
---
**2026-07-12 | SLICE | /definition**
**Decision:** tir-s1 (introducing the `people`/`team_memberships` schema and migrating the login role-lookup path off the legacy `user_roles` table) is written as a standard story, not `migration-story.md`.
**Alternatives considered:** Using `migration-story.md`, since the story does involve a schema change and a one-time backfill of existing rows.
**Rationale:** `migration-story.md` is for data migration, cutover, parallel-run, or consumer migration stories — driven by data rules or traffic switching, typically implying live production data that must be carried over without a service interruption. This feature is pre-launch with zero live customers (per discovery's Why Now), so there is no cutover, no parallel-run, and no traffic-switching concern — it's a same-deploy schema bootstrap plus a straightforward 1:1 backfill of today's single-tenant `user_roles` rows into the new schema, closer in shape to the existing `CREATE TABLE IF NOT EXISTS` startup-migration convention (`journey-store-pg.js`) than to a true migration story.
**Made by:** Claude (agent), /definition, 2026-07-12.
**Revisit trigger:** If real paying customers exist by the time tir-s1 is implemented, re-evaluate — a backfill against live production data would then warrant `migration-story.md`'s cutover/rollback discipline.
---
**2026-07-12 | SCOPE | /definition, Step 4a**
**Decision:** Step 4a (regulated constraint propagation check) was skipped for this feature's story set.
**Rationale:** Discovery's Constraints section states `context.yml` confirms `meta.regulated: false` and no compliance framework applies. Step 4a runs only when the discovery Constraints section contains at least one regulated constraint — none exists here, so the step is a no-op by its own entry condition, not an oversight.
**Made by:** Claude (agent), /definition, 2026-07-12.
**Revisit trigger:** None — re-evaluate only if `context.yml`'s regulated status changes for this feature.
---

---

## Architecture Decision Records

### ADR-001: Cross-provider identity collision — explicit manual linking, no auto-merge by email

**Status:** Accepted
**Date:** 2026-07-09
**Decided by:** Hamish King (Founder/Operator), via /clarify

#### Context

The web-ui app supports three auth providers (GitHub OAuth, Google OAuth, email/password) with no unified per-person identity. Building a per-person role model for team tenancy requires deciding how to handle the same human authenticating via multiple providers — one identity or several disconnected ones? Auto-merging by email is tempting but unsafe today: `auth-email.js` signup does not verify email ownership, so trusting an email match for auto-linking would let an attacker sign up with a victim's email and inherit their linked identity/access.

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| A. Auto-link by verified email | Zero extra UI, seamless UX | Unsafe today — email/password signup is unverified; an attacker could claim someone else's email and auto-link into their account |
| B. Never link — always separate identities per provider | Simplest, zero security risk | Same human ends up as 2+ disconnected identities/tenants across providers — a real support and product problem |
| **C. Explicit manual linking (chosen)** | No email-trust assumption; proves ownership by requiring an authenticated session in both providers at link time | Requires a settings-page UI surface; user must proactively link, adding friction until they do |

#### Decision

Explicit manual linking (Option C). Primary reason: security. It doesn't trust unverified email as proof of identity, unlike auto-merge (A), while still solving the "same person, multiple providers" problem better than doing nothing (B).

#### Consequences

- **Easier:** no risk of account-takeover via email spoofing at signup; identity linking has explicit user consent and proof.
- **Harder / more constrained:** requires a linking data model plus a functional (if minimal) UI control for MVP; users who don't proactively link remain fragmented across providers until they do.
- **Off the table:** fully automatic "it just works" cross-provider recognition — that would require adding email verification to email/password signup first, which is a separate, not-yet-scoped piece of work.

#### Revisit trigger

If email/password signup adds email verification (e.g. a confirmation link flow) as its own feature, safer auto-linking by verified email becomes viable and this decision should be revisited.

---

### ADR-002: Many-to-many person↔team schema, built now; single-active-team UI deferred

**Status:** Accepted
**Date:** 2026-07-09
**Decided by:** Hamish King (Founder/Operator), via /clarify

#### Context

This feature exists because a hard-to-reverse schema choice (`tenant_id` doubling as the role key) was made wrong the first time, discovered while patching a production bug (arl-s4, commit `f845caf7`). The platform is pre-launch — the last cheap moment to get the identity/role schema right before real teams share data. Question: should the schema support a person belonging to multiple teams (many-to-many), or just one (one-to-one)?

#### Options considered

| Option | Pros | Cons |
|--------|------|------|
| A. One-to-one (person → single tenant) | Simplest schema and queries | Fails the real-world case of a consultant/contractor working across multiple client teams — they'd need separate logins |
| B. Many-to-many schema + full multi-team switching UI now | Most complete, matches real usage patterns fully | Substantially more MVP work (active-team switching UI, more complex session/permission model) than needed to validate the core hypothesis |
| **C. Many-to-many schema now, single-active-team UI for v1 (chosen)** | Gets the expensive-to-retrofit part (schema) right immediately; defers the cheaper-to-iterate part (UI) until real multi-team usage exists to shape it | Schema is slightly more complex than A even though the UI doesn't exercise the full capability yet |

#### Decision

Option C. Primary reason: the schema is the hard-to-reverse part — this whole feature exists because a hard-to-reverse schema choice was made wrong once already. Building the correct many-to-many schema now avoids repeating that mistake, without over-investing in UI that has no real usage signal yet.

#### Consequences

- **Easier:** future multi-team support (e.g. consultants working across clients) needs no further schema migration, only a UI addition.
- **Harder / more constrained:** role/permission checks must resolve "which team is currently active" per session even though the schema allows more; slightly more complex queries (join through a membership table) than a flat `tenant_id` column.
- **Off the table:** nothing structurally — this choice is additive-safe, it doesn't foreclose any future direction.

#### Revisit trigger

If early usage shows the single-active-team constraint is actively painful (e.g. users need to see cross-team aggregated data), prioritize the multi-team switching UI sooner than currently planned.

---
<!-- Add further ADRs as ADR-003, ADR-004 etc. -->
