# Discovery: Agency and Client organisation subtypes

**Status:** Clarified — awaiting approval
**Created:** 2026-07-30
**Approved by:** Pending
**Author:** Copilot

---

## Problem Statement

Today "organisation" has no existence in the data model at all. `tenant_id` is a plain string, assigned at GitHub OAuth login as either the authenticating user's own login (solo tenant) or a GitHub org login (when `TENANT_ORG_ALLOWLIST` is configured), and is scattered as a bare column across roughly ten tables (journeys, products, credit_audit_log, team_memberships, product_modules, session_turns_archive, impersonation_audit, and others) with no backing entity, no subtype, and no relationship model between two tenants. This blocks a real go-to-market motion: a consultancy (software, design, or management) that wants to use this platform on behalf of its own clients has no way to do that today. Every client would need its own fully separate, disconnected tenant, and the consultancy has no way to provision a client's account or view a client's read-only data from its own side. Confirmed by direct investigation of `routes/auth.js`'s tenant-resolution logic, and confirmed that the prior multi-tenancy epic (`2026-06-22-wuce-multi-tenancy`) never discussed or deferred this — it is genuinely new ground, not forgotten scope.

## Who It Affects

- **Agency admin** — a delivery lead at a software, design, or management consultancy. Signs up as an Agency-type organisation. Needs to provision Client organisations on behalf of enterprise customers, and needs visibility into the products/features they are delivering for those clients.
- **Client org member** — an employee of the enterprise customer being served by the agency. Has their own login/identity scoped to their own Client organisation. May be granted only read-only/view access, depending on what the agency provisions, rather than full edit rights.
- **Platform operator** — needs this to open a second B2B channel: agencies and consultancies as the primary paying customer, using and reselling the platform's use into their own enterprise clients, rather than every enterprise being a direct, standalone customer.

## Why Now

Deliberate new go-to-market wedge, named directly by the operator: agencies/consultancies as primary customers who deploy the platform for their own enterprise clients, opening a second B2B channel beyond direct enterprise sign-up.

## MVP Scope

- **Organisation as a first-class entity.** A real `organisations` table/row (not a bare string), with an `org_type` distinguishing at least `standalone` (today's existing behaviour, default for all current and newly-signing-up tenants that aren't agencies), `agency`, and `client`.
- **Agency ↔ Client relationship — many-to-many, scoped per relationship.** A Client organisation may be associated with multiple Agency organisations at once (e.g. a client using two different consultancies for different work). This is a distinct relationship entity (not a single FK on the client org), where each Agency–Client relationship carries its own shared-access grants: Agency A's shared products/features are visible to the Client only through the Agency A relationship, and are not automatically visible via a separate Agency B relationship with the same Client. (Corrected from the original one-to-one assumption during `/clarify` — see Clarification log.)
- **Client org self-service conversion to an independent paying account.** A Client organisation can convert itself into a full, independent `standalone` organisation with its own paying account, at the client's own initiative — it is not permanently locked into being dependent on an Agency relationship. Conversion is structural, not a new sign-up: the same organisation entity and all its existing data (products, journeys, artefacts) is retained under the same `org_id` — the client must never be pushed through creating a second, brand-new org and migrating data across. Conversion triggers the *existing* Stripe checkout mechanism (every `standalone` tenant already has one) for the now-independent org; no new billing mechanism is built — only a new trigger path (org conversion) into the mechanism that already exists. Existing Agency relationship(s) and previously-granted shared access persist unchanged through conversion (see Assumptions).
- **Self-service Agency→Client provisioning.** The Agency admin has an in-app flow to create a Client organisation and invite its first user directly — no platform-operator/admin involvement required for MVP. This is the largest single piece of new UI/flow work in the MVP (a full create-and-invite flow, not an admin-assisted backend step).
- **Client org user provisioning.** The Agency admin can provision at least one user account scoped to a Client org, with a read-only/view role distinct from a full member role.
- **Shared access grant model (not ownership transfer).** A product/feature keeps one owning organisation (the Agency, in the agency-serving-client case), and can be granted visibility to a second organisation (the Client) without changing who owns it. This is the chosen MVP model from the two options discussed — see Assumptions and Out of Scope for the deferred alternative (transferable ownership).
- **Access control extension.** A Client org's read-only user can view (not edit) whatever products/features have been explicitly granted to their org — built on top of, not replacing, the existing tenant-isolation boundary already enforced and tested (`bri-s3.4`).
- **Client-org authentication — dual path.** A Client-org user can sign in either via GitHub OAuth (same mechanism as today, scoped to their Client org) or via a new lightweight email + magic-link mechanism for users without a GitHub account. Agency and Standalone tenants continue to use GitHub OAuth exclusively (unchanged) — the magic-link path is scoped to Client-org accounts only for this MVP, not a general-purpose alternative login method for every tenant type.

## Out of Scope

- **Transferable ownership / re-parenting** a product or feature from the Agency org to the Client org — the operator's original framing raised this as a real option, but it is deferred: it needs its own migration/audit logic and a decision about in-flight journeys/artefacts during a transfer, which is a materially larger scope than the shared-access-grant model chosen for MVP.
- **Billing model redesign** — who pays (agency vs. client), and whether pricing is per-org or per-relationship, is a real open question this discovery does not resolve. MVP keeps today's existing 1-tenant-1-Stripe-customer model unchanged: the Agency's own tenant remains the paying entity. Flagged for a dedicated follow-up discovery before any billing changes are built.
- **Retroactive migration of existing tenants** into the new org-type model — existing solo and GitHub-org tenants default to the new `standalone` org type with no forced backfill or re-classification exercise. See Assumptions.
- **UI/visual design** of any agency/client-facing screens — a separate design pass, once the data and access model below is settled, per this repo's own pipeline convention.

## Assumptions and Risks

- [ASSUMPTION] Existing tenants do not need retroactive migration into Agency/Client/Standalone types for this MVP — they default to `standalone` with no forced backfill — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] A Client org's users are provisioned by the Agency (not a self-service sign-up path) — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] "Read-only / view" access means read-only across everything shared with the client org, not a granular per-resource permission model — unconfirmed, requires /clarify before scope is locked.
- [ASSUMPTION] When a Client org converts to an independent standalone paying account, its existing Agency relationship(s) and previously-granted shared access persist unchanged (conversion adds independent billing/ownership capability, it does not sever existing agency relationships) — unconfirmed, requires /clarify before scope is locked.

**Corrected during /clarify (was previously an open assumption, now confirmed):** A Client org may belong to multiple Agencies simultaneously, with shared-access grants scoped per Agency–Client relationship, not per Client org as a whole.

**Risk:** the real risk to "not worth building" is that agencies may not actually want to manage read-only client accounts inside this tool at all — they may prefer to just report results out through their own channels. The true validation signal is not the feature existing, but an agency actually signing up and successfully provisioning a working client account (see Success Indicator below).

## Directional Success Indicators

**Agency-led client provisioning:** Baseline: `[UNKNOWN BASELINE]` — pre-signal; informed by an anecdotal peer conversation about a similar B2B agency-reseller motion succeeding elsewhere, not a measured internal baseline. Target: at least 1 Agency organisation signs up and successfully provisions at least 1 Client organisation with a working read-only client-user login. Measured via: count of organisations with `org_type=agency` that have at least 1 linked Client org, plus at least 1 successful Client-org user login event — tracked via PostHog org-level events, matching the existing group-identify pattern already used elsewhere in this codebase.

## Constraints

None identified.

## Contributors

- Operator — Product/Platform Owner

## Reviewers

- None recorded

## Approved By

Pending

---

## Clarification log

[2026-07-30] Clarified via /clarify:
- Q: How does a Client-org user actually sign in?  A: Both — GitHub OAuth (same as today) and a new email + magic-link path for users without a GitHub account.
- Q: Should the magic-link path be restricted to Client orgs only, or available to any org type?  A: Client orgs only — Agency and Standalone tenants keep GitHub OAuth exclusively.
- Q: Is Agency→Client org provisioning self-service or assisted for MVP?  A: Self-service — the Agency admin gets a full in-app create-and-invite flow, no platform-operator involvement needed.
- Q: Do the 4 existing assumptions stand as written?  A: No — assumption 4 was wrong. A Client org may belong to multiple Agencies simultaneously (many-to-many), with shared-access grants scoped per Agency–Client relationship, not per Client org as a whole.
- Q: Does "convert to a full paying account" require a new billing/checkout mechanism, or is it structural only for MVP?  A: Structural only, using the existing Stripe checkout mechanism (every standalone tenant already has one), triggered by an org-conversion action rather than a net-new sign-up. The same org entity and its existing data must be retained under the same org_id — never a second, brand-new org requiring data migration.

---

**Next step:** Human review and approval → /benefit-metric
