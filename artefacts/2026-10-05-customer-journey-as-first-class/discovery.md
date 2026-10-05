# Discovery: Customer Journey as First-Class Entity

**Status:** Draft
**Date:** 2026-10-05
**Feature slug:** 2026-10-05-customer-journey-as-first-class

---

## Problem statement

The skills platform currently treats the customer journey as optional reference context — a journey map can be uploaded as a reference artefact at definition time, but it has no structured existence of its own. There is no way to create, own, evolve, or measure a customer journey independently of a specific feature delivery cycle. This means:

- Features are defined without a shared view of the journey they sit within, making it harder to frame scope, sequence work, or identify gaps
- Benefit tracking and product health are feature-scoped, not journey-scoped — there is no way to see how a product performs end-to-end for a customer across multiple features
- Analytics signals (PostHog) and DoD-captured metrics are collected per feature but never aggregated against journey stages, so the cumulative picture of a product's customer experience is invisible
- Journey context, when it exists at all, is buried inside a feature's reference folder rather than being a reusable, shareable entity that multiple features can reference simultaneously

---

## Who it affects

**Primary persona: Outer loop practitioner (PO / SME / discovery lead)**
This is the person running discovery through definition-of-ready for a squad or pod. They are the one who currently must either hold the journey model in their head, maintain it separately in a design tool, or re-embed it as a reference artefact every time a new feature touches it. They bear the full cost of the current fragmentation.

**Secondary persona: Tech lead / squad lead**
Signs off on DoR and is accountable for benefit metric targets. A journey-scoped health view makes it possible to assess whether delivered features are producing the intended customer outcomes across a flow, not just individually.

---

## Why now

The platform has reached a point where multiple features exist for the same product, and the absence of a journey layer is becoming a structural gap rather than a nice-to-have. Benefit tracking and product health panels exist but are feature-scoped. PostHog MCP integration is available. DoD-captured metrics are being collected. The raw materials for journey-level measurement exist; what's missing is the organising entity that ties them together.

---

## MVP scope

A journey canvas where outer loop practitioners can:

1. **Create a customer journey** as a named, first-class entity — scoped to a product or spanning multiple products within an org
2. **Define journey stages** — a sequence of named steps that represent the customer's path through the product(s)
3. **Map existing and new features to journey stages** — a feature can be associated with one or more stages; this association is visible in the feature's own pipeline context
4. **Attach metrics to journey stages** — metrics captured at DoD time (and eventually pulled from PostHog via MCP) are surfaced at the relevant stage, giving a journey-level health view
5. **View journey health** — a summary view showing which stages have active features, which have metric coverage, and where gaps exist

A journey is its own entity — it is not a child of a feature or a product, though it can be scoped to one product or span multiple products within the same org.

---

## Out of scope

1. **Cross-org (multi-tenant) journey sharing** — journeys are org-scoped; sharing across tenant boundaries is not in this version
2. **Automated journey generation from existing feature artefacts** — journeys are created manually; importing from existing artefact content is deferred
3. **Automated journey stage discovery via analytics** — PostHog MCP integration in this version is for reading and displaying metrics at journey stages, not for inferring journey structure from usage patterns
4. **Journey versioning and change history** — journeys can be edited but version history is not tracked in the MVP
5. **Public / customer-facing journey views** — the journey canvas is an internal practitioner tool; no public sharing or embedding capability

---

## Assumptions and risks

[ASSUMPTION] The journey entity can be stored using the same Postgres + tenant-scoped data model established in ADR-025 (wuce-multi-tenancy) — unconfirmed, requires /clarify before schema design is locked.

[ASSUMPTION] PostHog MCP integration is available and can surface stage-level event counts without requiring a dedicated backend aggregation layer — unconfirmed, requires spike before metric-display ACs are written.

[ASSUMPTION] Feature-to-journey-stage mapping can be done as a lightweight association (a join table or a field on the feature record) without requiring changes to the existing pipeline-state.json schema for non-journey features — unconfirmed, requires /clarify before definition.

[ASSUMPTION] A journey can span multiple products within an org using the existing product entity (ADR-026) without requiring a new cross-product aggregation primitive — unconfirmed.

**Risk:** The visual journey canvas (drag-and-drop stage editing, feature mapping UI) is the highest-complexity UI component this platform has attempted. Underestimating the implementation cost here is the most likely cause of scope creep into the inner loop.

**Risk:** "Journey health" as a concept is intuitive to describe but hard to define precisely enough to implement. Without a clear definition (what makes a stage healthy? what threshold triggers a warning?), this becomes an open-ended design problem that expands the outer loop cycle significantly.

---

## Directional success indicators

**Journeys created per active product:**
Baseline: 0 (no journey entity exists today).
Target: ≥1 journey created per active product within 4 weeks of release.
Measured via: count of journey records in the `journeys` table per tenant.

**New features mapped to a journey stage before definition:**
Baseline: 0% (no mapping mechanism exists).
Target: ≥50% of new features have a journey-stage association at DoR sign-off within 8 weeks of release.
Measured via: presence of `journeyStageId` (or equivalent) on feature records at `dorStatus: signed-off`.

**Metrics stored against journey stages:**
Baseline: 0 (metrics are currently stored at the feature level only).
Target: ≥3 journey stages per active journey have at least one metric attached within 8 weeks of release.
Measured via: count of metric records with a `journeyStageId` foreign key.

---

## Constraints

- Multi-tenancy is enforced at the application layer per ADR-025 — journey data is scoped by `tenantId` and must go through the same `requireJourneyAccess`/`isSameTenant` guard pattern
- No new npm runtime dependencies without a decision record (product/constraints.md #11 — no persistent runtime dependency)
- The journey canvas UI must be keyboard-accessible and meet WCAG 2.1 AA (product/constraints.md #9)
- Cross-org journey sharing is a hard out-of-scope boundary — do not design the data model in a way that makes this easy to accidentally enable later
- The design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before any new UI components are introduced

---

## /clarify recommendation

This discovery contains 4 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] The journey entity can be stored using the same Postgres + tenant-scoped data model established in ADR-025 — unconfirmed, requires /clarify before schema design is locked.
- [ASSUMPTION] PostHog MCP integration is available and can surface stage-level event counts without requiring a dedicated backend aggregation layer — unconfirmed, requires spike before metric-display ACs are written.
- [ASSUMPTION] Feature-to-journey-stage mapping can be done as a lightweight association without requiring changes to the existing pipeline-state.json schema for non-journey features — unconfirmed, requires /clarify before definition.
- [ASSUMPTION] A journey can span multiple products within an org using the existing product entity (ADR-026) without requiring a new cross-product aggregation primitive — unconfirmed.

---

## Attribution

**Contributors:**
- Hamish King — Product Owner / Operator — 2026-10-05

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

<!-- eval-mode: false -->