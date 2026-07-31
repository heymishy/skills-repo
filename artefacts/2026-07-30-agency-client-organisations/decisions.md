# Decision Log: agency-client-organisations

**Feature:** Agency and Client organisation subtypes
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Last updated:** 2026-07-31

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
**2026-07-30 | ARCH | discovery/clarify**
**Decision:** Agency↔Client is a many-to-many relationship — a Client organisation may belong to multiple Agency organisations simultaneously, via a distinct relationship entity rather than a single foreign key on the Client org.
**Alternatives considered:** One-to-one (a Client org belongs to exactly one Agency) — this was the original discovery draft's assumption.
**Rationale:** Real-world clients commonly engage multiple consultancies/agencies for different work at the same time. Forcing exclusivity would misrepresent how agencies actually operate and would block a legitimate, common client posture from day one.
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** No obvious trigger — if in practice no client ever needs more than one concurrent agency relationship, the relationship-table complexity could be simplified back to one-to-one, but there is no evidence for that today.
---

---
**2026-07-30 | ARCH | discovery/clarify**
**Decision:** Shared-access grants are scoped per Agency–Client relationship, not per Client organisation as a whole. A Client's access to what one Agency has shared is not automatically visible via a second, separate Agency relationship.
**Alternatives considered:** Org-wide sharing — anything any Agency shares with a Client becomes visible to that Client regardless of which Agency shared it.
**Rationale:** Direct consequence of allowing multiple Agency relationships per Client (see above). Without per-relationship scoping, one agency's shared work would leak to a competing agency serving the same client — an unacceptable data-isolation failure, and directly analogous to the cross-tenant isolation guarantee this codebase already treats as a hard security boundary (`bri-s3.4`).
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** If a client explicitly requests cross-agency visibility of shared work as an opt-in feature, a future story could add an explicit "share across all my agencies" toggle. Not built by default.
---

---
**2026-07-30 | ARCH | discovery/clarify**
**Decision:** A Client org's self-service conversion to an independent paying account is structural only — it retains the same `org_id` and all existing data (products, journeys, artefacts), and triggers the existing Stripe checkout mechanism rather than a new billing path. The client is never pushed through creating a second, brand-new org and migrating data across.
**Alternatives considered:** Treat conversion as a net-new sign-up requiring a data-migration step from the old org to a new one — explicitly rejected by the operator.
**Rationale:** Avoids data-migration risk entirely and avoids a duplicate-org support burden. Reuses the already-built, already-audited billing mechanism (every `standalone` tenant already has one) instead of building parallel billing logic for what is really just a new trigger path into an existing mechanism.
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** If the deferred billing-model-redesign discovery determines converted orgs need a materially different billing entity structure (e.g. for historical agency-relationship billing continuity), this decision may need revisiting.
---

---
**2026-07-31 | ARCH | review follow-up (Stories 3, 4)**
**Decision:** Client-org invitation delivery (Story 3 AC3) and Client-org magic-link login (Story 4 AC2) are built on Passport.js + the `passport-magic-login` strategy, sharing one token-issuance/verification mechanism rather than two separate ones — the invitation link and the ongoing magic-link login both resolve through the same `verify()` callback into the existing session shape (ADR-025-consistent). Transactional email delivery for both the invitation email and the magic-link email uses Resend.
**Alternatives considered:** (a) A bespoke signed one-time token for invitation delivery, separate from Story 4's magic-link mechanism — rejected as a duplicate token/security-review surface for functionally the same "click a link, resolve to a session" behaviour that Story 4 already needs to build. (b) Better Auth or Auth.js as a full auth-library replacement for the existing GitHub/Google OAuth and session management — rejected; both libraries want to own the full session lifecycle, which would require bridging two session systems against this codebase's already-hardened custom session/adapter model, for no clear security payoff over the current, already-reviewed session code. (c) Email providers Postmark, SendGrid, and AWS SES were compared against Resend — Resend chosen for developer experience and free-tier fit; no existing vendor relationship or infrastructure constraint pointed elsewhere.
**Rationale:** Passport.js does not own sessions — it only writes identity into whatever `req.session` the app's own middleware already provides, the same "verify then set session fields" convention this codebase's hand-rolled GitHub/Google OAuth already uses, so it slots in as a second entry point rather than a parallel identity system. This resolves Story 3's [1-H1] and Story 4's [1-H1] (undocumented email-infrastructure gap, review run 1) by naming the actual mechanism instead of leaving it an unstated assumption. Both `passport-magic-login` and Resend's SDK are MIT-licensed, with no restriction relevant to commercial SaaS use.
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** If a future story needs invitation and ongoing-login expiry/security rules to diverge materially (e.g. invitations need a much longer TTL than login links), the shared mechanism may need to branch into two distinct configurations of the same library rather than staying identical.
---

---
**2026-07-31 | ARCH | review follow-up (Stories 3, 6)**
**Decision:** The Client-org "privileged permissions" role Story 6's AC1 depends on is the *existing* `team_memberships.role` model (`src/web-ui/modules/user-roles.js` / `team-management.js`, built in the `team-identity-roles` epic), not a new Client-org-specific role field. Story 3's first invited Client-org user is given a `team_memberships` row with `role = 'admin'`, scoped to the new Client org's own `tenant_id`/`org_id` — the same `addOrUpdateTeammate`-style insert already used for team-role assignment elsewhere in this codebase. Story 6's AC1 "appropriate permissions" check reuses the existing `requireAdmin`-equivalent pattern (`role === 'admin'`, resolved per-tenant via `resolveRoleForPerson`), evaluated against the Client org's own tenant scope.
**Alternatives considered:** (a) A new, Client-org-specific role/permission field distinct from `team_memberships.role` — rejected under ADR-026 (reuse before introducing new entities): the existing per-(person, tenant) role model already supports exactly this "one privileged member, others not" shape (it was built for this in `team-identity-roles`), and a second, parallel role concept would fragment permission logic across two systems for no functional gain. (b) Treating every Client-org user as equally privileged (no distinction) — rejected; Story 6's own NFR explicitly requires distinguishing a privileged member from "any read-only viewer," and collapsing the distinction would remove a deliberate security boundary on a billing-affecting action.
**Rationale:** Story 3's AC3 previously said the invited user's account is created "with a read-only role" — this conflated two independent axes: (1) `team_memberships.role`, which governs a person's privilege *within their own org* (admin vs viewer), and (2) Story 2's shared-access grant model, which independently makes every Client-org user's view of *Agency-shared* resources read-only regardless of their `team_memberships.role`. The first invited user of a brand-new Client org is that org's de facto owner/admin (there is no one else yet), so `role = 'admin'` is the correct value — Story 2's separate, unconditional read-only enforcement on shared resources (AC3: "never write/edit access to the underlying shared resource") is unaffected and continues to apply to every Client-org user regardless of their own org's `team_memberships.role`.
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** If Story 3's scope is ever extended to invite a second or subsequent Client-org user (explicitly out of scope today), that user's default role (likely `viewer`) and the process for promoting a non-first user to `admin` will need an explicit story-level decision — not covered by this entry.
---

---
**2026-07-30 | SCOPE | benefit-metric**
**Decision:** MVP scope expanded to include comment-only collaboration for Client-org users — a Client-org (read-only) user can leave comments/feedback on an artefact or product/feature shared with them by an Agency, visible to the Agency. This does not grant edit access to the underlying shared content.
**Alternatives considered:** (a) View-only, no new capability — build an ongoing-usage benefit metric on the read-only access already scoped, with no MVP scope change. (b) Full real-time joint editing / suggestion mode — rejected as materially larger scope than warranted for MVP.
**Rationale:** The benefit-metric review surfaced that the original success indicator (agency provisions a client, client logs in once) only measured a one-time setup event, not the actual ongoing value of the Agency/Client relationship — genuine collaboration on shared work. Comment-only was chosen as the smallest capability that constitutes real two-way collaboration without opening up full collaborative editing.
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** If client feedback indicates comments alone don't meet real collaboration needs (e.g. requests for suggested edits or joint document editing), a follow-up story could extend this — not built by default now.
---

---
**2026-07-31 | RISK-ACCEPT | definition-of-ready (all 6 stories)**
**Decision:** Proceed past `/definition-of-ready` for all 6 stories (organisation-entity, relationship-grants-enforcement, self-service-provisioning, dual-path-authentication, client-agency-comments, conversion-to-independent) without a pre-code domain-expert walkthrough of the AC verification scripts (DoR warning W4). Each script gets its real first walkthrough as the post-merge smoke test rather than as a pre-code sign-off step.
**Alternatives considered:** Pause the pipeline at DoR sign-off until a human reviewer works through all 6 verification scripts before any story is assigned to a coding agent.
**Rationale:** The scripts were written this session directly from stories and test plans that have already been through full `/review` and `/test-plan` passes with active operator direction throughout (story edits, review findings, and test design were all confirmed or corrected in real time this session) — the operator has effectively already reviewed the underlying behaviour the scripts describe, even though the scripts themselves as separate documents haven't had a dedicated walkthrough pass. Risk is bounded: if a script's expected behaviour turns out wrong at post-merge smoke test, it surfaces then rather than now, at the cost of a possible one-story rework rather than a pipeline-wide defect.
**Made by:** Hamish King — Product/Platform Owner
**Revisit trigger:** If a post-merge smoke test for any of these 6 stories reveals the verification script described the wrong expected behaviour, treat that as a pattern signal — future features should not skip the pre-code walkthrough by default.
---

---
**2026-07-31 | ARCH | story-1-organisation-entity implementation**
**Decision:** (1) The one-time backfill's source of "known pre-existing tenant_id values" reuses `credits.js`'s existing `getValidTenantIds()` (the union of `users.email` / `team_memberships.tenant_id` / `credits.tenant_id`) rather than a new query against those same tables. (2) The OAuth-callback resolution step (`_resolveOrganisation`) is wired into both GitHub (`handleAuthCallback`) and Google (`handleAuthGoogleCallback`) callback handlers in `routes/auth.js` — the two handlers literally named "callback" — but NOT into `routes/auth-email.js`'s email/password signup/login, since AC3's wording ("resolved at OAuth callback") and the DoR contract's touch-point list name only the OAuth callback / `server.js` wiring, not `auth-email.js`.
**Alternatives considered:** (a) A new dedicated "list all known tenants" query for the backfill — rejected under ADR-026 (reuse before introducing a new entity/query) since `getValidTenantIds()` already returns exactly this set for the exact same purpose credits' own free-tier grant reconciliation would need. (b) Wiring `_resolveOrganisation` into `auth-email.js` as well, matching `ftcg-s1`'s precedent of wiring `_grantFreeTierCredits` into all three login paths (GitHub, Google, email/password) — deferred rather than rejected outright; flagged as an open ambiguity in the PR rather than silently either including or excluding it.
**Rationale:** Reusing `getValidTenantIds()` avoids a second, potentially-diverging definition of "every tenant this codebase knows about." The OAuth-only wiring follows the story's and DoR's literal text precisely; extending to email/password would be scope not explicitly asked for, and this codebase's Out-of-Scope convention treats un-asked-for scope as a defect, not a bonus. If email/password tenants also need an `organisations` row (so that Story 3's agency/client provisioning eventually covers them too), that should be confirmed and added as an explicit follow-up AC rather than assumed here.
**Made by:** Claude (coding agent) — flagged for operator confirmation via PR comment.
**Revisit trigger:** If Story 3 (self-service provisioning) or any later story in this epic needs email/password-authenticated tenants to already have an `organisations` row, this gap must be closed explicitly — either by extending this story's wiring or by an explicit new AC in a later story.
---

---
**2026-07-31 | ARCH | story-1-organisation-entity implementation (follow-up, resolves gap above)**
**Decision:** Operator confirmed via PR review: wire `_resolveOrganisation` into `routes/auth-email.js`'s email/password signup AND login handlers too, matching `ftcg-s1`'s precedent of covering all three login paths (GitHub, Google, email/password). Added the same fire-and-forget, try/catch-wrapped `_resolveOrganisation`/`setOrganisationsPool` pair to `auth-email.js` (mirroring `auth.js`'s implementation exactly), wired both in `server.js` alongside the existing OAuth wiring, and added 2 new tests (`emailSignupResolvesOrganisationForNewTenant`, `emailLoginResolvesOrganisationForExistingTenant`) to `tests/check-story1-organisation-entity.js` (10 tests total, up from 8). Full suite re-run: 450 files, 38 failures — identical to the pre-existing baseline, zero new regressions.
**Alternatives considered:** None re-litigated — this directly resolves alternative (b) from the entry above, which was deliberately left open rather than decided either way at implementation time.
**Rationale:** Resolution wired into OAuth callbacks only would leave brand-new email/password signups without an `organisations` row until the next server-restart backfill sweep — a real gap for Story 3, which needs every org (regardless of how its first user signed in) to be provisionable as an Agency or Client. Symmetry with the existing `ftcg-s1` all-three-paths precedent was the deciding factor once flagged.
**Made by:** Hamish King — Product/Platform Owner (confirmed the fix direction); implemented by Claude (coding agent) in the same PR, pre-merge.
**Revisit trigger:** None — this closes the gap; no further action needed unless a future story finds another auth path this resolution step should also cover.
---

---
**2026-07-31 | ARCH | story-2-relationship-grants-enforcement implementation**
**Decision:** (1) The new data-model/adapter module lives at `src/web-ui/modules/agency-client-grants.js` (mirroring Story 1's actual `modules/organisations.js` placement), not `adapters/agency-client-grants-pg.js` as the DoR contract's own "Estimated touch points" section had guessed before implementation began — Story 1's real file ended up in `modules/`, not `adapters/`, and that is this story's direct upstream precedent for the exact same "pool-as-explicit-argument, no D37" shape. (2) `pool.query()` calls against the two new tables (`agency_client_relationships`, `shared_access_grants`) exist ONLY inside `modules/agency-client-grants.js` — every route handler in `products.js` (`handleCreateGrant`, `handleListSharedProducts`, `handleGetSharedProduct`, `handleMutateSharedProduct`, `handleRevokeGrant`) calls exclusively through this module's exported functions (`checkGrantAccess`, `listGrantedResourcesForClient`, `createGrant`, `getRelationshipById`, `revokeGrant`), including the relationship-ownership check inside `handleCreateGrant`, which reads via `getRelationshipById` rather than an inline `SELECT`. (3) `middleware/journey-access.js` gained one new export, `requireGrantAccess(grant)`, reusing the existing `asHttpResponse`/`POLICY` FORBIDDEN-vs-NOT_FOUND convention rather than inventing a parallel error-shape convention for the new grant-check guard.
**Alternatives considered:** (a) Placing the new module under `adapters/` per the DoR contract's literal estimate — rejected in favour of following Story 1's actual precedent, the closer and more authoritative signal once real code existed to look at. (b) Allowing `handleCreateGrant` a direct `SELECT ... FROM agency_client_relationships` inline query for the relationship-ownership check, on the reasoning that a read-only ownership check is "lower risk" than the grant-check itself — rejected because the story's own Guardrail text draws no such distinction ("all grant/relationship reads go through a dedicated adapter function"), and this story's own NFR test (`everyNewReadPathGoesThroughGrantCheckGuard`) explicitly source-scans for any direct query against either new table in `products.js`.
**Rationale:** A single audit point for every grant/relationship read is the entire point of this story's Guardrail, given the epic's own framing of this as its highest-risk story (directly analogous in kind to the real `bri-s3.4` cross-tenant bug). Splitting "the grant check" from "the relationship-ownership check" into two different code paths (one guarded, one not) would reintroduce exactly the "ad hoc queries scattered across route handlers" pattern the Guardrail exists to prevent, even though this specific ownership check is not itself a cross-tenant leak vector today.
**Made by:** Claude (coding agent)
**Revisit trigger:** If a future story needs a third read pattern against these two tables (e.g. an Agency-side dashboard listing all its relationships), route it through a new function added to `modules/agency-client-grants.js`, not a new inline query anywhere else.
---

---
**2026-07-31 | ARCH | story-2-relationship-grants-enforcement implementation (scope ambiguity — flagged, not guessed)**
**Decision:** The five new route handlers (`handleCreateGrant`, `handleListSharedProducts`, `handleGetSharedProduct`, `handleMutateSharedProduct`, `handleRevokeGrant`) are implemented and fully tested by calling them directly with mock `req`/`res` + a fake pool (mirroring `tests/check-bri-s3.4-cross-tenant-isolation.js`'s established pattern of testing route handlers without a live HTTP server), but are **not** registered in `server.js`'s live URL dispatch table. Only the schema migration (`migrateAgencyClientGrantsSchema`) is wired into `server.js` startup, mirroring Story 1's `migrateOrganisationsSchema` wiring.
**Alternatives considered:** (a) Also wire real URLs (e.g. `POST /agency/relationships/:id/grants`, `GET /client/shared-products`, etc.) into `server.js`'s router now. (b) Leave the handlers unwired, as done.
**Rationale (why this was flagged rather than guessed):** The DoR contract's own "What will NOT be built" section states plainly: "The Agency-side UI/flow for actually creating a relationship and granting access (Story 3's job) — this story is the data model and enforcement guard only." Story 3 (self-service provisioning) is the story that will define the real Agency-side creation flow's URLs, and Story 4 (dual-path authentication) is what determines the Client-org session/identity shape these handlers will actually be reached through (this story's handlers currently read `req.session.tenantId` directly as the org_id, following Story 1's convention, but Story 4 may introduce a distinct Client-org session shape). Guessing at production URL paths and a session contract two not-yet-implemented downstream stories are explicitly responsible for defining risked producing routes that would need to be reworked or discarded once Story 3/4 land, and risked silently expanding this story's scope beyond "data model and enforcement guard only." This is flagged here and in the PR description per the coding-agent dispatch instructions ("if you encounter an ambiguity not covered by the ACs or tests, add a PR comment ... and do not mark ready for review") rather than resolved by assumption.
**Made by:** Claude (coding agent) — flagged for operator confirmation via PR comment.
**Revisit trigger:** When Story 3 (self-service provisioning) or Story 4 (dual-path authentication) lands, confirm whether these five handlers should be wired into `server.js`'s router as-is, or whether their signatures/session-field reads need to change first to match whatever session/URL contract those stories establish.
---

---
**2026-07-31 | ARCH | story-5-client-agency-comments implementation**
**Decision:** (1) The new `comments` table has no `org_type` column, matching the story's own Mermaid ERD exactly — `thread_has_both_org_types` (AC4, Acceptance Criterion 4) is computed via a live JOIN from `comments.org_id` to `organisations.org_type` (`getThreadOrgTypes`/`threadHasBothOrgTypes` in `src/web-ui/modules/agency-client-comments.js`), never by denormalizing org_type onto each comment row. (2) The Client-org routes (`handleCreateSharedComment`, `handleListSharedComments`) call Story 2's `_agencyClientGrants.checkGrantAccess` + `_journeyAccess.requireGrantAccess`/`asHttpResponse` directly — the identical function references Story 2's own `handleGetSharedProduct` uses, not a copy (NFR-security, `commentEndpointsGoThroughSameGrantCheckGuardAsStory2`). (3) The Agency-org routes (`handleCreateAgencyComment`, `handleListAgencyComments`) do NOT call the grant-check guard at all — an Agency org reading/replying on its own resource is not the access pattern that guard exists to gate (it gates a Client org's access to something else's shared resource), consistent with how every other existing route in `products.js` treats an Agency's access to its own products.
**Alternatives considered:** (a) Denormalizing `org_type` onto each comment row at write time — rejected: contradicts the story's own Data Model section, which was reviewed and approved with no `org_type` column; a JOIN is one query, not N, so there is no NFR-performance cost. (b) Also gating the Agency-side routes through `checkGrantAccess` — rejected: `checkGrantAccess`'s signature and semantics (`clientOrgId`, was this resource shared TO this client) do not describe "does this Agency own this resource," and Story 2's own handlers never gate Agency-side access to Agency-owned resources either.
**Rationale:** ADR-025 (Multi-tenancy enforced at the application layer) requires this new object to be scoped to the same grant that governs viewing — reusing Story 2's exact checkGrantAccess/requireGrantAccess call sequence (rather than re-implementing equivalent logic) is what makes that a structural guarantee instead of a convention two separate code paths could drift apart on.
**Made by:** Claude (coding agent)
**Revisit trigger:** If a future story needs Agency-side write access to also be restricted (e.g. a suspended Agency should not be able to comment even on its own resource), that would need a new, explicit guard — not an extension of `checkGrantAccess`, which is Client-side-only by construction.
---

---
**2026-07-31 | ARCH | story-5-client-agency-comments implementation (scope note, mirrors Story 2's own)**
**Decision:** The four new route handlers (`handleCreateSharedComment`, `handleListSharedComments`, `handleCreateAgencyComment`, `handleListAgencyComments`) are implemented and fully tested (mock `req`/`res` + fake pool, mirroring `tests/check-story2-relationship-grants-enforcement.js`'s established pattern) but are **not** registered in `server.js`'s live URL dispatch table, for the same reason Story 2's own handlers aren't.
**Alternatives considered:** (a) Wire real URLs (e.g. `POST /shared/comments`, `GET /shared/products/:id/comments`) into `server.js`'s router now. (b) Leave unwired, as done.
**Rationale (why this was flagged rather than guessed):** Story 2's own decision log (see the "scope ambiguity — flagged, not guessed" entry above) already identified that Story 3 (self-service provisioning) and Story 4 (dual-path authentication) own the real user-facing URL and Client-org session/identity shape these handlers will be reached through — this story's routes read `req.session.tenantId`/`req.session.login` following the same convention Story 2's handlers use, which may need to change once Story 3/4's actual session contract lands. Wiring ahead of those stories risks guessing at a contract only they can define, exactly as Story 2 already flagged for its own five handlers.
**Made by:** Claude (coding agent) — flagged for operator confirmation via PR comment.
**Revisit trigger:** When Story 3/Story 4 land, confirm whether these four handlers (plus Story 2's five) should be wired into `server.js`'s router as-is, or whether their session-field reads need to change first.
---

## Architecture Decision Records

<!-- None recorded yet for this feature. The 3 log entries above are structurally significant but were deliberately kept as lightweight log entries rather than full ADRs, per the /decisions skill's own default ("not sure? default to log entry") — an ADR can be written retrospectively if this proves to matter more than expected once implementation begins. -->

---
