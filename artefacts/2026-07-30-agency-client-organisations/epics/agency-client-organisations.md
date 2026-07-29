## Epic: Agencies can sign up, manage, and collaborate with their own client organisations

**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

An organisation exists as a first-class entity in the data model, with a subtype distinguishing standalone tenants (today's existing behaviour) from Agencies and Clients. A consultancy can sign up as an Agency, self-service create and provision a Client organisation with its own users, grant that Client read-only visibility into specific shared products/features, collaborate with the Client via comments on that shared work, and — at the Client's own initiative — convert the Client organisation into a fully independent, standalone paying account without any data migration or loss.

---CANVAS-JSON: {"type":"program-design","title":"Program Design","content":{"mermaid":"flowchart LR\n    subgraph Story1[Story 1: Organisation entity]\n        ORGADAPTER[adapters/organisation-store.js]\n        AUTH1[routes/auth.js]\n    end\n    subgraph Story2[Story 2: Relationship + grants + enforcement]\n        RELADAPTER[adapters/agency-client-relationships.js]\n        GRANTGUARD[middleware/shared-access-guard.js]\n    end\n    subgraph Story3[Story 3: Self-service provisioning]\n        ORGROUTE[routes/organisations.js]\n    end\n    subgraph Story4[Story 4: Dual-path auth]\n        MAGICLINK[routes/auth-magic-link.js]\n    end\n    subgraph Story5[Story 5: Comments]\n        COMMENTROUTE[routes/comments.js]\n    end\n    subgraph Story6[Story 6: Conversion]\n        CONVERTROUTE[routes/organisation-conversion.js]\n        BILLING[routes/billing.js]\n    end\n    AUTH1 --> ORGADAPTER\n    ORGROUTE --> ORGADAPTER\n    ORGROUTE --> RELADAPTER\n    GRANTGUARD --> RELADAPTER\n    MAGICLINK --> ORGADAPTER\n    COMMENTROUTE --> GRANTGUARD\n    CONVERTROUTE --> ORGADAPTER\n    CONVERTROUTE --> BILLING"}}---

## Out of Scope

- Transferable ownership / re-parenting a product or feature from the Agency org to the Client org — deferred to a future epic; MVP is shared-access-grant only, not ownership transfer.
- Billing model redesign — who pays (agency vs. client), per-org vs. per-relationship pricing — deferred to a dedicated follow-up discovery. This epic reuses today's existing 1-tenant-1-Stripe-customer model unchanged.
- Retroactive migration of existing tenants into the new org-type model — existing tenants default to `standalone` with no forced backfill.
- Real-time joint editing, suggestion/track-changes mode, or any mutation of underlying shared content by a Client-org user — comments are the only Client-org write capability.
- UI/visual design of any agency/client-facing screens — a separate design pass once this epic's data and access model ships.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Agency-led client provisioning | Not yet established (pre-signal) | ≥1 Agency org signs up, provisions ≥1 Client org, client user logs in and views ≥1 shared product/feature | Stories 1 (org entity), 2 (relationship + grants + enforcement), 3 (self-service provisioning), 4 (dual-path auth) together deliver the full flow this metric measures |
| Ongoing client-agency artefact collaboration | Not yet established (new capability) | ≥1 comment thread with both an Agency-org and a Client-org participant | Story 5 (comments) delivers the mechanism this metric measures |

## Stories in This Epic

- [ ] Organisation as a first-class entity with org_type — stories/story-1-organisation-entity.md
- [ ] Agency-Client relationship, shared-access grants, and read-only enforcement — stories/story-2-relationship-grants-enforcement.md
- [ ] Self-service Agency-to-Client provisioning — stories/story-3-self-service-provisioning.md
- [ ] Client-org dual-path authentication — stories/story-4-dual-path-authentication.md
- [ ] Client-org lightweight collaboration — comments only — stories/story-5-client-agency-comments.md
- [ ] Client org self-service conversion to an independent paying account — stories/story-6-conversion-to-independent.md

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches the existing tenant-isolation security boundary (ADR-025) with a genuinely novel relationship shape (many-to-many, per-relationship access scoping) that has no precedent in this codebase, and triggers real billing (Stripe checkout) for a converting org. Story 2 (relationship/grants/enforcement) specifically warrants closer review given this codebase's own prior history of a real cross-tenant access bug (`bri-s3.4`) — see that story's own oversight note.

## Complexity Rating

**Rating:** 3

<!-- High ambiguity, unknown unknowns — this introduces a genuinely new entity and relationship model with no existing precedent in this codebase (confirmed via discovery investigation), extends a security-critical guard into new territory, and adds a new authentication mechanism. -->

## Scope Stability

**Stability:** Unstable

<!-- Scope already grew once during benefit-metric (comments added). New ground for this codebase (no prior Organisation/Agency/Client concept) means requirements may shift further as stories are written — flag for more frequent check-ins. -->
