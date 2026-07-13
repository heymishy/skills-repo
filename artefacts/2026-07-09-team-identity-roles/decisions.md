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
**2026-07-13 | ARCH | /definition-of-ready, H-ADAPTER**
**Decision:** Added AC6 to tir-s1 during DoR, requiring `server.js`'s existing `setGetUserRole` wiring (arl-s1, currently a real tenant-wide `user_roles` query at line ~185) to be rewired to the new person/team-scoped lookup as part of this story, verified by a test.
**Rationale:** tir-s1 replaces the data model `setGetUserRole` reads from, but the original story draft had no explicit AC scoping this production rewiring — a genuine D37/H-ADAPTER gap caught during the DoR hard-block check, not present in the original /definition pass. Per CLAUDE.md's Injectable Adapter Rule, the DoR must include an explicit AC for production wiring before a story can be signed off.
**Made by:** Claude (agent), /definition-of-ready, 2026-07-13.
**Revisit trigger:** None — resolved before DoR sign-off, not deferred.
---
**2026-07-13 | RISK-ACCEPT | /test-plan, /definition-of-ready**
**Decision:** tir-s6's AC1, AC2, and AC4 (query-plan and timing evidence at 100 synthetic `team_memberships` rows) run for real only when `DATABASE_URL` is set in the test environment (matching bri-s2.2's Neon staging branch convention). When absent, these three tests skip with an explicit, visible skip message — never silently marked passing.
**Alternatives considered:** Mocking a canned "used index" result in `fake-test-db.js` so the tests always pass in CI with no real DB — rejected as providing false confidence (the test would assert nothing real about indexing behaviour).
**Rationale:** This repo's existing unit/integration test convention always mocks `pool.query` and never hits a real Postgres instance; a real `EXPLAIN` query plan cannot be produced by an in-memory mock. Confirmed directly with the operator during /test-plan (2026-07-13).
**Made by:** Hamish King (Founder/Operator), via /test-plan, 2026-07-13.
**Revisit trigger:** If this repo's CI environment gains a standing `DATABASE_URL`-backed test database (beyond ad hoc staging branches), revisit whether these three tests should run unconditionally in CI rather than being environment-gated.
---
**2026-07-13 | ARCH | tir-s4 implementation, fix-forward story filed**
**Decision:** Filed tir-s7 ("Login role resolution is scoped by person, not just tenant") as a new story in this epic, after tir-s4's coding agent discovered that tir-s1's shipped `resolveRoleForTenant(pool, tenantId)` queries `team_memberships WHERE tenant_id = $1 LIMIT 1` with no `person_id` filter anywhere in the call chain (confirmed by reading the merged code directly: `auth.js`/`auth-email.js` call `getRoleForTenant(tenantId)` with no person context at all). This means once a tenant has 2+ people with different roles — the entire premise of this epic — login resolves an arbitrary row's role for whoever logs in, not their own.
**Alternatives considered:** (1) Let tir-s3 finish first and see whether its own AC2 test exposes the bug with a real failing test before deciding — rejected by the operator in favour of fixing immediately, since tir-s3's test seeds one membership row per test and would not have caught this either way. (2) Note it and defer to /definition-of-done reconciliation — rejected as too risky to leave unresolved while tir-s5/tir-s6 build further on the same foundation.
**Rationale:** This is a correctness/security-relevant gap in already-merged code (PR #463) that directly undermines Metric 1 (per-person role assignment exists) — the schema and write paths (tir-s1, tir-s3) are correct, only the login-time read path is wrong. tir-s2's `resolvePersonForIdentity` (`identity-links.js`) already provides almost the exact missing piece, making this a well-scoped, bounded fix rather than a redesign.
**Made by:** Hamish King (Founder/Operator) + Claude (agent), 2026-07-13.
**Revisit trigger:** None — being fixed immediately as tir-s7, not deferred.
---
**2026-07-13 | ARCH | tir-s5 implementation, fix-forward story filed**
**Decision:** Filed tir-s8 ("Bulk-add fetches real GitHub org members, not the admin's own org memberships") after tir-s5's own coding agent flagged, and direct code inspection confirmed, that `bulkAddFromGithubOrg` reuses `routes/auth.js`'s `setFetchOrgs` adapter — which calls GitHub's `GET /user/orgs` (lists organizations a token belongs to) — and treats each returned `.login` (an org's name) as if it were a person's GitHub username. `resolvePersonForIdentity` never resolves an org name to a real person, so every "member" is skipped as `UnknownIdentityError` and `addedCount` is always 0. Bulk-add is a complete functional no-op in production as shipped in PR #469 (draft, not merged) — this is not an edge-case risk, it fails every single time.
**Alternatives considered:** (1) Merge PR #469 as scaffolding with a documented RISK-ACCEPT that the fetch needs a follow-up — rejected because the feature does literally nothing in production until fixed, making a RISK-ACCEPT for "known non-functional" a poor substitute for actually fixing it, especially since a real GitHub org member list is a straightforward, well-scoped fix. (2) Fix directly inside PR #469 before considering tir-s5 done — rejected in favour of the established fix-forward pattern (same as tir-s7), since tir-s5's own scaffolding (route, gating, skip-existing logic, audit logging) is correct and independently valuable to keep separate from this fetch-mechanism fix.
**Rationale:** tir-s5's own agent flagged this exact risk in its PR description before being asked ("worth a second look before real-world GitHub org scale") — direct code inspection confirmed it's not just a scale concern but a complete correctness break at any scale, since `GET /user/orgs` and `GET /orgs/{org}/members` are structurally different GitHub endpoints (the former takes no org parameter and returns organizations; the latter is org-parameterized and returns member users).
**Made by:** Hamish King (Founder/Operator) + Claude (agent), 2026-07-13.
**Revisit trigger:** None — being fixed immediately as tir-s8, not deferred.
---
**2026-07-13 | RISK-ACCEPT | /definition-of-done**
**Decision:** tir-s6's `dodStatus` is recorded as `complete` (all artefact-level checks pass) but `releaseReady: false` and `health: amber` — its AC1/AC2/AC4 real-Postgres query-plan/timing tests remain unexecuted in any environment this session had access to. The pre-existing RISK-ACCEPT (2026-07-13, /test-plan) covers *why* these tests are environment-gated; this entry records that the gap is still open at DoD time, not resolved by the gating mechanism itself.
**Alternatives considered:** Marking tir-s6 fully `releaseReady: true` on the strength of the RISK-ACCEPT alone — rejected, since a RISK-ACCEPT explains why a test can't run here, it doesn't substitute for the test actually running somewhere. Conflating "correctly gated" with "actually verified" would let Metric 4 report false confidence.
**Rationale:** Honesty in the DoD record matters more than a clean-looking epic-complete status — the schema/index work itself (no code change needed, tir-s1's existing composite primary key already suffices) is very likely correct, but "very likely correct" is not the same as "confirmed under real load," and this epic's own Metric 4 explicitly requires the latter.
**Made by:** Claude (agent), /definition-of-done, 2026-07-13.
**Revisit trigger:** Resolved once tir-s6's tests are run against a real `DATABASE_URL`-backed Postgres instance (e.g. a Neon staging branch) and AC1/AC2/AC4 produce real pass/fail evidence. At that point, update `releaseReady`/`health` and Metric 4's signal accordingly.
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
