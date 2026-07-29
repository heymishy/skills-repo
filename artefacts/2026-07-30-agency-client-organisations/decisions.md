# Decision Log: agency-client-organisations

**Feature:** Agency and Client organisation subtypes
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Last updated:** 2026-07-30

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

## Architecture Decision Records

<!-- None recorded yet for this feature. The 3 log entries above are structurally significant but were deliberately kept as lightweight log entries rather than full ADRs, per the /decisions skill's own default ("not sure? default to log entry") — an ADR can be written retrospectively if this proves to matter more than expected once implementation begins. -->

---
