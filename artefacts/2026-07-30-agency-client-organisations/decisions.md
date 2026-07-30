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

## Architecture Decision Records

<!-- None recorded yet for this feature. The 3 log entries above are structurally significant but were deliberately kept as lightweight log entries rather than full ADRs, per the /decisions skill's own default ("not sure? default to log entry") — an ADR can be written retrospectively if this proves to matter more than expected once implementation begins. -->

---
