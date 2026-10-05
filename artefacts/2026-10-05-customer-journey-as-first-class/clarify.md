# Discovery: Customer Journey as First-Class Entity

**Status:** Clarified
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

The platform has reached a point where multiple features exist for the same product, and the absence of a journey layer is becoming a structural gap rather than a nice-to-have. Benefit tracking and product health panels exist but are feature-scoped. DoD-captured metrics are being collected and are ready to be aggregated at the journey level. The raw materials for journey-level measurement exist; what's missing is the organising entity that ties them together.

---

## MVP scope

A journey canvas where outer loop practitioners can:

1. **Create a customer journey** as a named, first-class entity — scoped to a product or spanning multiple products within an org
2. **Define journey stages** — a sequence of named steps that represent the customer's path through the product(s), with optional descriptive text
3. **Map existing and new features to journey stages** — a feature can be associated with one or more stages across one or more journeys; this association is visible in the feature's own pipeline context
4. **Attach DoD-captured metrics to journey stages via feature mappings** — when a feature is mapped to a stage, the practitioner selects which of that feature's DoD metrics are relevant to that stage's health; multiple features can contribute metrics to the same stage
5. **View journey health** — a summary view showing which stages have active features, which have metric coverage, and where gaps exist

A journey is its own entity — it is not a child of a feature or a product, though it can be scoped to one product or span multiple products within the same org.

---

## Out of scope

1. **Cross-org (multi-tenant) journey sharing** — journeys are org-scoped; sharing across tenant boundaries is not in this version
2. **Automated journey generation from existing feature artefacts** — journeys are created manually; importing from existing artefact content is deferred
3. **PostHog MCP integration for automated metric collection** — metrics in this version come from manual DoD captures and feature-to-stage mappings; automated PostHog extraction is a follow-up feature
4. **Journey versioning and change history** — journeys can be edited but version history is not tracked in the MVP
5. **Public / customer-facing journey views** — the journey canvas is an internal practitioner tool; no public sharing or embedding capability

---

## Clarifications (from /clarify session, 2026-10-05)

**Journey definition is abstract, metrics attach at feature mapping time:**
Practitioners create and edit journeys (naming stages, adding descriptive text) without metrics. Metrics are attached when a feature is mapped to a stage — the practitioner selects which of that feature's DoD metrics belong to that stage. This keeps journey definition lightweight and reusable.

**Features span multiple stages and journeys:**
A single feature can be associated with multiple stages across one or more journeys. A "checkout redesign" can touch both "browse" and "purchase" stages; a cross-product feature can map to stages in multiple journeys.

**Journey-feature mappings live in Postgres, not pipeline-state.json:**
The association between features and journey stages is stored as a join table (`feature_journey_stage_mappings`, scoped by `tenantId`). `pipeline-state.json` remains delivery-evidence-focused and does not track journey context. This separation keeps the delivery state independent from business-context associations.

---

## Constraints

- Multi-tenancy is enforced at the application layer per ADR-025 — journey data and all mappings are scoped by `tenantId` and must go through the same `requireJourneyAccess`/`isSameTenant` guard pattern
- No new npm runtime dependencies without a decision record (product/constraints.md #11 — no persistent runtime dependency)
- The journey canvas UI must be keyboard-accessible and meet WCAG 2.1 AA (product/constraints.md #9)
- Cross-org journey sharing is a hard out-of-scope boundary — do not design the data model in a way that makes this easy to accidentally enable later
- The design system reference (`artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md`) must be consulted before any new UI components are introduced

---

## Directional success indicators

**Journeys created per active product:**
Baseline: 0 (no journey entity exists today).
Target: ≥1 journey created per active product within 4 weeks of release.
Measured via: count of journey records in the `journeys` table per tenant.

**New features mapped to a journey stage before definition:**
Baseline: 0% (no mapping mechanism exists).
Target: ≥50% of new features have a journey-stage association at DoR sign-off within 8 weeks of release.
Measured via: presence of a `feature_journey_stage_mappings` record for each feature at `dorStatus: signed-off`.

**Metrics attached to journey stages:**
Baseline: 0 (metrics are currently stored at the feature level only).
Target: ≥3 journey stages per active journey have at least one metric attached via feature mappings within 8 weeks of release.
Measured via: count of DoD metrics visible at a journey stage, aggregated across all features mapped to that stage.

---

## Attribution

**Contributors:**
- Hamish King — Product Owner / Operator — 2026-10-05

**Clarification session:**
- 2026-10-05 — `/clarify` resolved 4 open assumptions; discovery promoted to Clarified status

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

<!-- eval-mode: false -->